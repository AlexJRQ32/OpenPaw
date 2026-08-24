import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '../../../shared/utils/api'
import { API_BASE_URL, initialForm } from '../../../constants'
import { rememberSubmittedBusiness } from '../../../utils'
import { validateForm } from '../../../validation'
import { useForm } from '../../../shared/hooks/useForm'
import { useAuth } from '../../auth/context/AuthContext'


const FORM_DRAFT_KEY = 'openpaw_vet_form_draft'

/* Tope defensivo por campo: un borrador manipulado/corrupto con strings
   gigantes no debe colgar el formulario ni inflar localStorage. */
const DRAFT_MAX_FIELD_LENGTH = 2000

function loadDraft(defaults) {
  try {
    const raw = localStorage.getItem(FORM_DRAFT_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw)
    if (!parsed || parsed._v !== 1) return defaults

    /* QA #2: solo se restauran claves conocidas del formulario y SOLO como
       string. Antes se hacía spread directo y un draft corrupto (número, null,
       objeto…) en un campo obligatorio hacía que validateForm →
       form[field].trim() lanzara TypeError en el primer keystroke. */
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
function saveDraft(form) {
  try {
    const sanitized = {}
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v !== "object" || v === null || !("size" in v)) sanitized[k] = v
    })
    localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify({ ...sanitized, _v: 1 }))
  } catch {
    /* sin almacenamiento disponible: el flujo funciona sin borrador */
  }
}

export function useVeterinaryRegistration() {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle')
  const [sent, setSent] = useState(false)
  /* Estable (useCallback) para poder depender de él en efectos del formulario
     sin resetear timers en cada render. */
  const clearSent = useCallback(() => setSent(false), [])
  const [submitError, setSubmitError] = useState('')
  const {
    values: form, errors, updateField, setValue,
    reset, setTouched, setErrors,
  } = useForm(loadDraft(initialForm), validateForm)

  useEffect(() => { saveDraft(form) }, [form])

  useEffect(() => {
    if (!user?.email) return
    if (!form.email) setValue('email', user.email)
  }, [user?.email, form.email, setValue])

  const submitRequest = async (team = []) => {
    setSubmitError('')

    /* QA #2 (cinturón y tirantes): loadDraft ya sanea tipos, pero un crash
       de validación nunca debe escapar como unhandled rejection — se aborta
       el envío igual que cuando hay errores de campo visibles. */
    let allErrors
    try {
      allErrors = validateForm(form)
    } catch {
      return
    }
    if (Object.keys(allErrors).length > 0) return

    setStatus('submitting')

    try {
      const response = await authFetch(`${API_BASE_URL}/veterinarias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombreComercio,
          cedulaJuridica: form.cedulaJuridica,
          direccion: form.direccion,
          telefono: form.telefono,
          email: form.email,
          descripcion: form.descripcion,
        }),
      })

      if (response.status === 409) {
        throw new Error('El comercio ya se encuentra registrado o tiene una solicitud pendiente.')
      }

      if (!response.ok) {
        throw new Error('No se pudo enviar la solicitud. Revise los datos e intente nuevamente.')
      }

      await response.json().catch(() => ({}))
      window.dispatchEvent(new CustomEvent('pending-changed'))
      rememberSubmittedBusiness(form)

      if (user?.sub || user?.id) {
        await authFetch(`${API_BASE_URL}/usuarios/${user.sub || user.id}/rol`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rolId: 2 }),
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
      reset(initialForm)
      setStatus('sent')
    } catch (error) {
      setStatus('idle')
      setSubmitError(error.message)
    }
  }

  const allErrors = submitError ? { ...errors, submit: submitError } : errors

  return {
    form, errors: allErrors, status, sent, clearSent,
    updateField, submitRequest,
    /* T37 QA: setters del useForm expuestos para que la página única pueda
       mostrar todos los errores de campo en el envío (errores visibles a11y). */
    setErrors, setTouched,
  }
}

