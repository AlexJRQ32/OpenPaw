import { useEffect, useMemo, useState } from 'react'
import { authFetch } from '../../../shared/utils/api'
import { API_BASE_URL, initialForm } from '../../../constants'
import { rememberSubmittedBusiness } from '../../../utils'
import { validateForm } from '../../../validation'
import { useForm } from '../../../shared/hooks/useForm'
import { useAuth } from '../../auth/context/AuthContext'


const FORM_DRAFT_KEY = 'openpaw_vet_form_draft'
function loadDraft(defaults) {
  try {
    const raw = localStorage.getItem(FORM_DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed._v === 1) {
        delete parsed._v
        return { ...defaults, ...parsed }
      }
    }
  } catch {}
  return defaults
}
function saveDraft(form) {
  try {
    const sanitized = {}
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v !== "object" || v === null || !("size" in v)) sanitized[k] = v
    })
    localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify({ ...sanitized, _v: 1 }))
  } catch {}
}

export function useVeterinaryRegistration() {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle')
  const [sent, setSent] = useState(false)
  const clearSent = () => setSent(false)
  const [formVersion, setFormVersion] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const {
    values: form, errors, updateField, setValue,
    handleSubmit, reset, setTouched,
  } = useForm(loadDraft(initialForm), validateForm)

  useEffect(() => { saveDraft(form) }, [form])

  useEffect(() => {
    if (!user?.email) return
    if (!form.email) setValue('email', user.email)

  }, [user?.email, user?.nombre])

  const fileSummary = useMemo(() => {
    try {
      if (!form.documentoPersoneriaJuridica) return 'Opcional'
      const f = form.documentoPersoneriaJuridica
      if (f && f.size) {
        const s = f.size / 1024 / 1024
        return `${f.name} - ${s.toFixed(2)}MB`
      }
      return 'Opcional'
    } catch { return 'Opcional' }
  }, [form.documentoPersoneriaJuridica])

  const submitRequest = async (team = []) => {
    const allErrors = validateForm(form)
    setSubmitError('')
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
      setFormVersion((current) => current + 1)
      setStatus('sent')
    } catch (error) {
      setStatus('idle')
      setSubmitError(error.message)
    }
  }

  const allErrors = submitError ? { ...errors, submit: submitError } : errors

  const validateStep = (fields) => {
    const stepErrors = {}
    fields.forEach((f) => {
      const err = validateForm(form)[f]
      if (err) stepErrors[f] = err
    })
    setTouched((prev) => ({ ...prev, ...fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}) }))
    return Object.keys(stepErrors).length === 0
  }

  return {
    form, errors: allErrors, status, sent, clearSent, formVersion,
    fileSummary, updateField, submitRequest,
    validateStep,
  }
}

