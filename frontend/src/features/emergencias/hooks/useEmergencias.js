import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

const emptyForm = {
  mascotaId: '',
  esEnPlataforma: false,
  veterinariaNombreExterna: '',
  fechaAtencion: '',
  motivo: '',
  sintomas: '',
  tratamientoAplicado: '',
  archivoAdjuntoUrl: '',
}

function validar(form, esCliente) {
  const errors = {}
  if (!form.mascotaId) errors.mascotaId = 'Selecciona una mascota'
  if (!form.fechaAtencion) errors.fechaAtencion = 'Indica la fecha y hora de atencion'
  if (!form.motivo.trim()) errors.motivo = 'Indica el motivo de la emergencia'
  const requiereVetExterna = (esCliente ? !form.esEnPlataforma : !form.esEnPlataforma)
  if (requiereVetExterna && !form.veterinariaNombreExterna.trim()) {
    errors.veterinariaNombreExterna = 'Indica el nombre de la veterinaria externa'
  }
  return errors
}

export function useEmergencias() {
  const { user } = useAuth()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esCliente = userRol === ROLE_IDS.CLIENTE
  const [emergencias, setEmergencias] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [mascotaFiltro, setMascotaFiltro] = useState('')
  const [listStatus, setListStatus] = useState('idle')
  const [listError, setListError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    async function loadMascotas() {
      try {
        const infoRes = await authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
        const info = infoRes.ok ? await infoRes.json() : null
        if (!cancelled) setMascotas(info?.mascotas ?? [])
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar tus mascotas.')
      }
    }
    loadMascotas()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarEmergencias = useCallback(async (mascotaId) => {
    const response = await authFetch(`${API_BASE_URL}/emergencias?mascotaId=${mascotaId}`)
    if (!response.ok) throw new Error('No se pudieron cargar las emergencias.')
    const data = await response.json()
    return Array.isArray(data) ? data : []
  }, [])

  useEffect(() => {
    if (!mascotaFiltro) return
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const data = await cargarEmergencias(mascotaFiltro)
        if (!cancelled) { setEmergencias(data); setListStatus('loaded') }
      } catch (error) {
        if (!cancelled) { setListError(error.message); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [mascotaFiltro, cargarEmergencias])

  const abrirNueva = (mascotaIdPreseleccionada) => {
    setForm({
      ...emptyForm,
      esEnPlataforma: !esCliente,
      mascotaId: mascotaIdPreseleccionada ?? (mascotas.length === 1 ? String(mascotas[0].id) : ''),
    })
    setErrors({})
    setSubmitError('')
    setModalOpen(true)
  }

  const cerrar = () => {
    setModalOpen(false)
    setSubmitError('')
    setSubmitStatus('idle')
  }

  const handleChange = (event) => {
    const target = event.target
    const name = target.name
    const parsed = target.type === 'checkbox' ? target.checked : target.value
    setForm((prev) => ({ ...prev, [name]: parsed }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const guardar = async (event) => {
    event.preventDefault()
    const validation = validar(form, esCliente)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setSubmitStatus('submitting')
    setSubmitError('')
    const payload = {
      mascotaId: Number(form.mascotaId),
      esEnPlataforma: form.esEnPlataforma,
      veterinariaNombreExterna: form.esEnPlataforma ? null : form.veterinariaNombreExterna.trim(),
      fechaAtencion: new Date(form.fechaAtencion).toISOString(),
      motivo: form.motivo.trim(),
      sintomas: form.sintomas.trim() || null,
      tratamientoAplicado: form.tratamientoAplicado.trim() || null,
      archivoAdjuntoUrl: form.archivoAdjuntoUrl.trim() || null,
    }
    try {
      const response = await authFetch(`${API_BASE_URL}/emergencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 400 || response.status === 403) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos y permisos.')
      }
      if (!response.ok) throw new Error('No se pudo registrar la emergencia.')
      setSubmitStatus('sent')
      toast.success('Emergencia registrada.')
      cerrar()
      if (mascotaFiltro) {
        try {
          const data = await cargarEmergencias(mascotaFiltro)
          setEmergencias(data)
        } catch { /* se mantiene la lista previa */ }
      }
    } catch (error) {
      setSubmitError(error.message)
      setSubmitStatus('idle')
    }
  }

  return {
    esCliente,
    userRol,
    emergencias,
    mascotas,
    mascotaFiltro,
    setMascotaFiltro,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrirNueva,
    cerrar,
    handleChange,
    guardar,
  }
}