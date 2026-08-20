import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS, getUserRoleId } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

const emptyForm = {
  nombre: '',
  especie: '',
  raza: '',
  sexo: '',
  fechaNacimiento: '',
  peso: '',
  color: '',
  identificacion: '',
  fotoUrl: '',
}

function validar(form) {
  const errors = {}
  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
  if (!form.especie) errors.especie = 'Selecciona la especie'
  if (!form.sexo) errors.sexo = 'Selecciona el sexo'
  if (form.peso !== '' && (Number.isNaN(Number(form.peso)) || Number(form.peso) < 0)) {
    errors.peso = 'El peso debe ser un numero mayor o igual a 0'
  }
  return errors
}

export function useMascotas() {
  const { user } = useAuth()
  const esCliente = getUserRoleId(user) === ROLE_IDS.CLIENTE
  const toast = useToast()

  const [mascotas, setMascotas] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')

  const cargarMascotas = useCallback(async () => {
    setListStatus('loading')
    setListError('')
    try {
      const res = await authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
      const data = res.ok ? await res.json() : null
      setMascotas(data?.mascotas ?? [])
      setListStatus('loaded')
    } catch {
      setListError('No se pudieron cargar tus mascotas.')
      setListStatus('error')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (cancelled) return
      await cargarMascotas()
    }
    load()
    return () => { cancelled = true }
  }, [cargarMascotas])

  const abrir = () => {
    setForm({ ...emptyForm })
    setErrors({})
    setSubmitError('')
    setModalOpen(true)
  }

  const cerrar = () => {
    setModalOpen(false)
    setSubmitError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const guardar = async (event) => {
    event.preventDefault()
    const validation = validar(form)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setSubmitStatus('submitting')
    setSubmitError('')
    const payload = {
      nombre: form.nombre.trim(),
      especie: form.especie,
      raza: form.raza.trim() || undefined,
      sexo: Number(form.sexo),
      fechaNacimiento: form.fechaNacimiento
        ? new Date(form.fechaNacimiento).toISOString()
        : undefined,
      peso: form.peso !== '' ? Number(form.peso) : undefined,
      color: form.color.trim() || undefined,
      identificacion: form.identificacion.trim() || undefined,
      fotoUrl: form.fotoUrl.trim() || undefined,
    }
    try {
      const response = await authFetch(`${API_BASE_URL}/mascotas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (!response.ok) throw new Error('No se pudo guardar la mascota.')
      setSubmitStatus('sent')
      cerrar()
      toast.success('Mascota agregada correctamente.')
      await cargarMascotas()
    } catch (error) {
      setSubmitError(error.message)
      setSubmitStatus('idle')
      toast.error(error.message)
    }
  }

  return {
    esCliente,
    mascotas,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrir,
    cerrar,
    handleChange,
    guardar,
  }
}