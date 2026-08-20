import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import { authFetch } from '../shared/utils/api'
import { validateProfileForm } from '../validation'
import { useForm } from '../shared/hooks/useForm'

export const REDES_PREDETERMINADAS = [
  { plataforma: 'facebook', label: 'Facebook', icon: 'fab fa-facebook', color: '#1877F2', link: 'https://facebook.com/', placeholder: 'usuario' },
  { plataforma: 'instagram', label: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F', link: 'https://instagram.com/', placeholder: 'usuario' },
  { plataforma: 'twitter', label: 'X (Twitter)', icon: 'fab fa-x-twitter', color: '#000', link: 'https://x.com/', placeholder: 'usuario' },
  { plataforma: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0A66C2', link: 'https://linkedin.com/in/', placeholder: 'usuario' },
  { plataforma: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok', color: '#000', link: 'https://tiktok.com/@', placeholder: 'usuario' },
  { plataforma: 'youtube', label: 'YouTube', icon: 'fab fa-youtube', color: '#FF0000', link: 'https://youtube.com/@', placeholder: 'canal' },
  { plataforma: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp', color: '#25D366', link: 'https://wa.me/', placeholder: 'numero' },
  { plataforma: 'telegram', label: 'Telegram', icon: 'fab fa-telegram', color: '#0088CC', link: 'https://t.me/', placeholder: 'usuario' },
]

function toForm(data) {
  return {
    nombre: data?.nombre ?? '',
    telefono: data?.telefono ?? '',
    direccion: data?.direccion ?? '',
    fotoUrl: data?.fotoUrl ?? '',
  }
}

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [socialLinks, setSocialLinks] = useState({})
  const [editingSocial, setEditingSocial] = useState(null)
  const [socialInput, setSocialInput] = useState('')
  const [status, setStatus] = useState('loading')
  const [confirmation, setConfirmation] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const {
    values: form, errors, updateField, reset, handleSubmit,
  } = useForm(toForm(null), validateProfileForm)

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      try {
        const [profileRes, socialRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/usuarios/me`),
          authFetch(`${API_BASE_URL}/usuarios/me/redes-sociales`),
        ])

        if (cancelled) return
        const data = profileRes.ok ? await profileRes.json() : null
        if (data) {
          setProfile(data)
          reset(toForm(data))
        }

        const links = socialRes.ok ? await socialRes.json() : []
        const map = {}
        if (Array.isArray(links)) links.forEach((l) => { map[l.plataforma] = l.url })
        setSocialLinks(map)
        setStatus('viewing')
      } catch (error) {
        if (!cancelled) {
          setSubmitError(error.message)
          setStatus('error')
        }
      }
    }
    loadProfile()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startEditing = () => {
    setConfirmation(null)
    setStatus('editing')
  }

  const cancelEditing = () => {
    reset(toForm(profile))
    setSubmitError('')
    setStatus('viewing')
  }

  const submitUpdate = handleSubmit(async (data) => {
    setStatus('submitting')
    try {
      const response = await authFetch(`${API_BASE_URL}/usuarios/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          telefono: data.telefono || null,
          direccion: data.direccion ?? null,
          fotoUrl: data.fotoUrl || null,
        }),
      })
      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos ingresados.')
      }
      if (!response.ok) throw new Error('No se pudo actualizar el perfil.')
      const updated = await response.json()
      setProfile(updated)
      reset(toForm(updated))
      setConfirmation('Los cambios se guardaron correctamente.')
      setStatus('viewing')
    } catch (error) {
      setStatus('editing')
      setSubmitError(error.message)
    }
  })

  const startEditingSocial = (plataforma) => {
    setEditingSocial(plataforma)
    setSocialInput(socialLinks[plataforma] || '')
  }

  const cancelEditingSocial = () => {
    setEditingSocial(null)
    setSocialInput('')
  }

  const saveSocialLink = async () => {
    if (!editingSocial) return
    const red = REDES_PREDETERMINADAS.find((r) => r.plataforma === editingSocial)
    const username = socialInput.trim()
    const url = username && red ? red.link + username : null
    await authFetch(`${API_BASE_URL}/usuarios/me/redes-sociales/${editingSocial}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(url),
    })
    setSocialLinks((prev) => ({ ...prev, [editingSocial]: url }))
    setEditingSocial(null)
    setSocialInput('')
  }

  const allErrors = submitError ? { ...errors, submit: submitError } : errors

  return {
    profile, form, errors: allErrors, status, confirmation,
    socialLinks, editingSocial, socialInput,
    startEditing, cancelEditing, updateField, submitUpdate,
    startEditingSocial, setSocialInput, saveSocialLink, cancelEditingSocial,
  }
}
