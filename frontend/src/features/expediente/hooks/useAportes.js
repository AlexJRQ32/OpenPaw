import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

const emptyForm = {
  mascotaId: '',
  veterinariaNombre: '',
  fechaAtencion: '',
  tipoAtencion: '',
  descripcion: '',
  diagnostico: '',
  medicamentos: '',
  archivoAdjuntoUrl: '',
}

export const TIPO_ATENCION_LABEL = { Consulta: 'Consulta', Tratamiento: 'Tratamiento', Vacuna: 'Vacuna', Emergencia: 'Emergencia' }
export const TIPO_ATENCION_VARIANT = { Consulta: 'info', Tratamiento: 'active', Vacuna: 'success', Emergencia: 'danger' }

function validar(form) {
  const errors = {}
  if (!form.mascotaId) errors.mascotaId = 'Selecciona una mascota'
  if (!form.veterinariaNombre.trim()) errors.veterinariaNombre = 'Indica el nombre de la veterinaria'
  if (!form.fechaAtencion) errors.fechaAtencion = 'Indica la fecha de atencion'
  else if (new Date(form.fechaAtencion) > new Date()) errors.fechaAtencion = 'La fecha no puede ser futura'
  if (!form.tipoAtencion) errors.tipoAtencion = 'Selecciona el tipo de atencion'
  if (!form.descripcion.trim()) errors.descripcion = 'La descripcion es obligatoria'
  return errors
}

export function useAportes() {
  const { user } = useAuth()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esCliente = userRol === ROLE_IDS.CLIENTE
  const [mascotas, setMascotas] = useState([])
  const [aportes, setAportes] = useState([])
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState('')
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [confirmState, setConfirmState] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const infoRes = await authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
        const info = infoRes.ok ? await infoRes.json() : null
        if (!cancelled) {
          const listaMascotas = Array.isArray(info?.mascotas) ? info.mascotas : []
          setMascotas(listaMascotas)
          if (listaMascotas.length > 0 && !mascotaSeleccionada) {
            setMascotaSeleccionada(String(listaMascotas[0].id))
          }
        }
        if (!cancelled) setListStatus('loaded')
      } catch (error) {
        if (!cancelled) { setListError(error.message); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esCliente])

  const cargarAportes = useCallback(async (mascotaId) => {
    if (!mascotaId) { setAportes([]); return }
    setListError('')
    try {
      const res = await authFetch(`${API_BASE_URL}/expediente-aportes?mascotaId=${mascotaId}`)
      if (!res.ok) throw new Error('No se pudieron cargar los aportes.')
      const data = await res.json()
      setAportes(Array.isArray(data) ? data : [])
      setListStatus('loaded')
    } catch (error) {
      setListError(error.message)
      setListStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!mascotaSeleccionada) return
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const res = await authFetch(`${API_BASE_URL}/expediente-aportes?mascotaId=${mascotaSeleccionada}`)
        if (!res.ok) throw new Error('No se pudieron cargar los aportes.')
        const data = await res.json()
        if (!cancelled) { setAportes(Array.isArray(data) ? data : []); setListStatus('loaded') }
      } catch (error) {
        if (!cancelled) { setListError(error.message); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [mascotaSeleccionada])

  const abrirNuevo = () => {
    setForm({ ...emptyForm, mascotaId: mascotaSeleccionada || '' })
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
      mascotaId: Number(form.mascotaId),
      veterinariaNombre: form.veterinariaNombre.trim(),
      fechaAtencion: new Date(form.fechaAtencion).toISOString(),
      tipoAtencion: form.tipoAtencion,
      descripcion: form.descripcion.trim(),
      diagnostico: form.diagnostico.trim() || undefined,
      medicamentos: form.medicamentos.trim() || undefined,
      archivoAdjuntoUrl: form.archivoAdjuntoUrl.trim() || undefined,
    }
    try {
      const response = await authFetch(`${API_BASE_URL}/expediente-aportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (!response.ok) throw new Error('No se pudo registrar el aporte.')
      toast.success('Aporte registrado correctamente.')
      setSubmitStatus('sent')
      cerrar()
      await cargarAportes(form.mascotaId)
    } catch (error) {
      setSubmitError(error.message)
      setSubmitStatus('idle')
    }
  }

  const solicitarEliminar = (aporte) => setConfirmState({ aporte })

  const cancelarConfirmacion = () => setConfirmState(null)

  const ejecutarEliminacion = async () => {
    if (!confirmState) return
    const { aporte } = confirmState
    setConfirmLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/expediente-aportes/${aporte.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar el aporte.')
      toast.success('Aporte eliminado correctamente.')
      cancelarConfirmacion()
      await cargarAportes(mascotaSeleccionada)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setConfirmLoading(false)
    }
  }

  return {
    esCliente,
    mascotas,
    aportes,
    mascotaSeleccionada,
    setMascotaSeleccionada,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrirNuevo,
    cerrar,
    handleChange,
    guardar,
    confirmState,
    confirmLoading,
    solicitarEliminar,
    cancelarConfirmacion,
    ejecutarEliminacion,
    TIPO_ATENCION_LABEL,
    TIPO_ATENCION_VARIANT,
  }
}