import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

/* Sprint 1 (T3): severidad + signos vitales + medico + diagnostico.
   El backend ya los expone en CrearEmergenciaDto / EmergenciaDto / PUT. */
const emptyForm = {
  mascotaId: '',
  esEnPlataforma: false,
  veterinariaNombreExterna: '',
  fechaAtencion: '',
  motivo: '',
  sintomas: '',
  tratamientoAplicado: '',
  archivoAdjuntoUrl: '',
  nivelSeveridad: 'Nivel2_Urgente',
  frecuenciaCardiaca: '',
  saturacionO2: '',
  temperatura: '',
  estadoPaciente: '',
  medicoACargo: '',
  diagnostico: '',
}

function aNumero(valor) {
  if (valor === '' || valor === null || valor === undefined) return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
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
  const fc = aNumero(form.frecuenciaCardiaca)
  if (fc !== null && (fc < 1 || fc > 300)) errors.frecuenciaCardiaca = 'Valor entre 1 y 300 bpm'
  const o2 = aNumero(form.saturacionO2)
  if (o2 !== null && (o2 < 1 || o2 > 100)) errors.saturacionO2 = 'Valor entre 1 y 100 %'
  const temp = aNumero(form.temperatura)
  if (temp !== null && (temp < 30 || temp > 46)) errors.temperatura = 'Valor entre 30 y 46 °C'
  return errors
}

export function useEmergencias() {
  const { user } = useAuth()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esCliente = userRol === ROLE_IDS.CLIENTE
  const [emergencias, setEmergencias] = useState([])
  const [mascotas, setMascotas] = useState([])
  /* Filtro por mascota; 'all' = todos los pacientes (wireframe emergencias) */
  const [mascotaFiltro, setMascotaFiltro] = useState('all')
  const [listStatus, setListStatus] = useState('idle')
  const [listError, setListError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [updateStatus, setUpdateStatus] = useState('idle')
  const [updateError, setUpdateError] = useState('')
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

  /* Modo 'all': consulta el endpoint existente por cada mascota y fusiona.
     allSettled: una mascota con error no tumba el listado completo. */
  const cargarTodas = useCallback(async () => {
    if (mascotas.length === 0) return []
    const resultados = await Promise.allSettled(mascotas.map((m) => cargarEmergencias(m.id)))
    return resultados
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion))
  }, [mascotas, cargarEmergencias])

  const cargarPorFiltro = useCallback(async (filtro) => {
    if (filtro === 'all') return cargarTodas()
    return cargarEmergencias(filtro)
  }, [cargarTodas, cargarEmergencias])

  useEffect(() => {
    if (!mascotaFiltro) return
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const data = await cargarPorFiltro(mascotaFiltro)
        if (!cancelled) { setEmergencias(data); setListStatus('loaded') }
      } catch (error) {
        if (!cancelled) { setListError(error.message); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [mascotaFiltro, cargarPorFiltro])

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
      nivelSeveridad: form.nivelSeveridad,
      frecuenciaCardiaca: aNumero(form.frecuenciaCardiaca),
      saturacionO2: aNumero(form.saturacionO2),
      temperatura: aNumero(form.temperatura),
      estadoPaciente: form.estadoPaciente.trim() || null,
      medicoACargo: form.medicoACargo.trim() || null,
      diagnostico: form.diagnostico.trim() || null,
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
          const data = await cargarPorFiltro(mascotaFiltro)
          setEmergencias(data)
        } catch { /* se mantiene la lista previa */ }
      }
    } catch (error) {
      setSubmitError(error.message)
      setSubmitStatus('idle')
    }
  }

  /* Actualiza severidad/estado reutilizando el PUT existente
     (ActualizarEmergenciaDto: null preserva el valor previo). */
  const actualizarEstado = async (id, nivel) => {
    setUpdateStatus('submitting')
    setUpdateError('')
    try {
      const response = await authFetch(`${API_BASE_URL}/emergencias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NivelSeveridad: nivel }),
      })
      if (response.status === 400 || response.status === 403) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos y permisos.')
      }
      if (!response.ok) throw new Error('No se pudo actualizar el estado.')
      toast.success('Estado de emergencia actualizado.')
      if (mascotaFiltro) {
        try {
          const data = await cargarPorFiltro(mascotaFiltro)
          setEmergencias(data)
        } catch { /* se mantiene la lista previa */ }
      }
      setUpdateStatus('sent')
      return true
    } catch (error) {
      setUpdateError(error.message)
      setUpdateStatus('idle')
      return false
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
    updateStatus,
    updateError,
    abrirNueva,
    cerrar,
    handleChange,
    guardar,
    actualizarEstado,
  }
}