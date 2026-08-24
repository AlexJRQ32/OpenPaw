import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '../../../shared/utils/api'
import { API_BASE_URL, initialStoreRegistrationForm } from '../../../constants'
import { rememberSubmittedStore } from '../../../utils'
import { validateStoreRegistrationForm } from '../../../validation'
import { useForm } from '../../../shared/hooks/useForm'
import { useAuth } from '../../auth/context/AuthContext'

const FORM_DRAFT_KEY = 'openpaw_store_form_draft'

/* Tope defensivo por campo (mismo criterio que useVeterinaryRegistration T37):
   un borrador manipulado/corrupto con strings gigantes no debe colgar el
   formulario ni inflar localStorage. */
const DRAFT_MAX_FIELD_LENGTH = 2000

function loadDraft(defaults) {
  try {
    const raw = localStorage.getItem(FORM_DRAFT_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw)
    if (!parsed || parsed._v !== 1) return defaults

    /* Fix QA T37 replicado (T38): solo se restauran claves conocidas del
       formulario y SOLO como string. Antes el spread directo
       `{ ...defaults, ...parsed }` podía restaurar números/null/objetos en
       campos obligatorios y validateStoreRegistrationForm → form[field].trim()
       lanzaba TypeError en el primer keystroke. */
    const restored = { ...defaults }
    Object.keys(defaults).forEach((key) => {
      const value = parsed[key]
      restored[key] =
        typeof value === 'string' ? value.slice(0, DRAFT_MAX_FIELD_LENGTH) : defaults[key]
    })
    return restored
  } catch {
    /* borrador corrupto o storage bloqueado: se ignora y parte en blanco */
  }
  return defaults
}

function persistDraft(form) {
  try {
    const sanitized = {}
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v !== 'object' || v === null || !('size' in v)) sanitized[k] = v
    })
    localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify({ ...sanitized, _v: 1 }))
    return true
  } catch {
    /* sin almacenamiento disponible: el flujo funciona sin borrador */
    return false
  }
}

export function useStoreRegistration() {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle')
  const [sent, setSent] = useState(false)
  /* Estable (useCallback) para poder depender de él en efectos sin resetear
     timers en cada render (patrón T37). */
  const clearSent = useCallback(() => setSent(false), [])
  const [submitError, setSubmitError] = useState('')
  const {
    values: form, errors, updateField, setValue,
    reset, setTouched, setErrors,
  } = useForm(loadDraft(initialStoreRegistrationForm), validateStoreRegistrationForm)

  /* Autosave conservado del wizard original: cada cambio persiste el borrador. */
  useEffect(() => { persistDraft(form) }, [form])

  useEffect(() => {
    if (!user?.email) return
    if (!form.email) setValue('email', user.email)
  }, [user?.email, form.email, setValue])

  /* T38 — Guardar borrador explícito (botón del wireframe): persiste el estado
     actual del formulario y reporta el resultado para feedback accesible. */
  const saveDraftNow = useCallback(() => persistDraft(form), [form])

  const submitRequest = async (team = []) => {
    setSubmitError('')

    /* Cinturón y tirantes (patrón T37): loadDraft ya sanea tipos, pero un
       crash de validación nunca debe escapar como unhandled rejection. */
    let allErrors
    try {
      allErrors = validateStoreRegistrationForm(form)
    } catch {
      return
    }
    if (Object.keys(allErrors).length > 0) return

    setStatus('submitting')

    try {
      /* Campos base conservados del wizard original (POST /almacenes real). */
      const payload = {
        nombre: form.nombreAlmacen,
        cedulaJuridica: form.cedulaJuridica,
        direccion: form.direccion,
        telefono: form.telefono,
        email: form.email,
        descripcion: form.descripcion,
      }

      /* T38 — campos de capacidad/ubicación del wireframe que CrearAlmacenDto
         acepta (Sprint 1-T7): TipoAlmacen/CapacidadAlmacenamiento/
         ControlTemperatura (strings enum validados por el controller) y
         NombreResponsable (StringLength min 2). Opcionales: solo se envían si
         traen valor — una cadena vacía fallaría Enum.TryParse (400) y un
         responsable de 1 carácter fallaría MinLength(2).
         Latitud/Longitud existen en el DTO pero NO se envían: el mapa es
         posicional (sin geocodificación) y enviar las coords fijas del pin
         contaminaría la BD (decisión PO #28/#34/#35/#37). */
      const tipoAlmacen = String(form.tipoAlmacen || '').trim()
      if (tipoAlmacen) payload.tipoAlmacen = tipoAlmacen
      const capacidad = String(form.capacidadAlmacenamiento || '').trim()
      if (capacidad) payload.capacidadAlmacenamiento = capacidad
      const temperatura = String(form.controlTemperatura || '').trim()
      if (temperatura) payload.controlTemperatura = temperatura
      const responsable = String(form.nombreResponsable || '').trim()
      if (responsable) payload.nombreResponsable = responsable

      const response = await authFetch(`${API_BASE_URL}/almacenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.status === 409) {
        throw new Error('El almacen ya se encuentra registrado o tiene una solicitud pendiente.')
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje || 'No se pudo enviar la solicitud.')
      }

      await response.json().catch(() => ({}))
      window.dispatchEvent(new CustomEvent('pending-changed'))
      rememberSubmittedStore(form)

      if (user?.sub || user?.id) {
        await authFetch(`${API_BASE_URL}/usuarios/${user.sub || user.id}/rol`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rolId: 3 }),
        }).catch(() => {})
      }

      for (const member of team) {
        if (member.nombre && member.email) {
          await authFetch(`${API_BASE_URL}/usuarios/funcionarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(member),
          }).catch(() => {})
        }
      }

      setSent(true)
      localStorage.removeItem(FORM_DRAFT_KEY)
      reset(initialStoreRegistrationForm)
      setStatus('sent')
    } catch (error) {
      setStatus('idle')
      setSubmitError(error.message)
    }
  }

  const allErrors = submitError ? { ...errors, submit: submitError } : errors

  return {
    form, errors: allErrors, status, sent, clearSent,
    updateField, submitRequest, saveDraftNow,
    /* Setters del useForm expuestos para que la página única pueda mostrar
       todos los errores de campo en el envío (patrón a11y T37). */
    setErrors, setTouched,
  }
}
