import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

const emptyForm = {
  mascotaId: '',
  veterinariaId: '',
  usuarioId: '',
  fechaHora: '',
  servicio: '',
  categoria: '',
  notas: '',
  costo: '',
}

function validar(form) {
  const errors = {}
  if (!form.mascotaId) errors.mascotaId = 'Selecciona una mascota'
  if (!form.veterinariaId) errors.veterinariaId = 'Selecciona una veterinaria'
  if (!form.fechaHora) errors.fechaHora = 'Indica la fecha y hora'
  else if (new Date(form.fechaHora) <= new Date()) errors.fechaHora = 'La cita debe estar en el futuro'
  if (!form.servicio.trim()) errors.servicio = 'Indica el servicio'
  if (form.costo !== '' && (Number.isNaN(Number(form.costo)) || Number(form.costo) < 0)) {
    errors.costo = 'El costo debe ser un numero mayor o igual a 0'
  }
  return errors
}

const ESTADO_VARIANT = {
  Pendiente: 'pending',
  Confirmada: 'active',
  EnProgreso: 'info',
  Completada: 'success',
  Cancelada: 'error',
}

const ESTADO_LABEL = {
  Pendiente: 'Pendiente',
  Confirmada: 'Confirmada',
  EnProgreso: 'En progreso',
  Completada: 'Completada',
  Cancelada: 'Cancelada',
}

/* Tipo de cita (backend TipoCitaEnum, tarea #5): Rutina | Especialista | Urgencia.
   El CitaDto ya lo expone como string (c.tipoCita); aquí se normaliza y se mapea
   a un "tono" del design system (dot / barra de color del wireframe de citas). */
const TIPO_CITA_TONE = {
  Rutina: 'primary',
  Especialista: 'secondary',
  Urgencia: 'error',
}

const TIPO_CITA_LABEL = {
  Rutina: 'Rutina',
  Especialista: 'Especialista',
  Urgencia: 'Urgencia',
}

function normalizarTipoCita(tipo) {
  if (!tipo) return 'Rutina'
  const t = String(tipo).trim()
  const capitalizada = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  return TIPO_CITA_LABEL[capitalizada] ?? t
}

function tipoCitaDe(cita) {
  return normalizarTipoCita(cita?.tipoCita ?? cita?.TipoCita)
}

function toneTipoCita(tipo) {
  return TIPO_CITA_TONE[normalizarTipoCita(tipo)] ?? 'primary'
}

export function useCitas() {
  const { user } = useAuth()
  const userId = Number(user?.sub ?? user?.id)
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esCliente = userRol === ROLE_IDS.CLIENTE
  const [citas, setCitas] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [veterinarias, setVeterinarias] = useState([])
  const [servicios, setServicios] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [activeState, setActiveState] = useState('todas')
  const [activeCategoria, setActiveCategoria] = useState('todas')

  const cargarCitas = useCallback(async () => {
    const url = await (async () => {
      if (esCliente && userId) return `${API_BASE_URL}/citas/usuario/${userId}`
      const infoRes = await authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
      const info = infoRes.ok ? await infoRes.json() : null
      return info?.veterinariaId
        ? `${API_BASE_URL}/citas/veterinaria/${info.veterinariaId}`
        : `${API_BASE_URL}/citas`
    })()
    const response = await authFetch(url)
    if (!response.ok) throw new Error('No se pudieron cargar las citas.')
    const data = await response.json()
    setCitas(Array.isArray(data) ? data : [])
  }, [esCliente, userId])

  // Cargar servicios de la veterinaria seleccionada (para cualquier rol que agenda la cita)
  useEffect(() => {
    if (!form.veterinariaId) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/serviciosveterinarios/veterinaria/${form.veterinariaId}`)
        const data = res.ok ? await res.json() : []
        if (!cancelled) setServicios(Array.isArray(data) ? data.filter(s => s.activo !== false) : [])
      } catch {
        // sin servicios si falla
      }
    }
    load()
    return () => { cancelled = true }
  }, [form.veterinariaId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const infoRes = await authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
        // Todos los roles ven el catalogo de veterinarias aprobadas para agendar citas
        const vetsRes = await authFetch(`${API_BASE_URL}/veterinarias/aprobadas`)
        const info = infoRes.ok ? await infoRes.json() : null
        if (!cancelled) {
          setMascotas(info?.mascotas ?? [])
          setVeterinarias(vetsRes.ok ? await vetsRes.json() : [])
        }
        await cargarCitas()
        if (!cancelled) setListStatus('loaded')
      } catch (error) {
        if (!cancelled) { setListError(error.message); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [cargarCitas, esCliente])

  const abrirNueva = (veterinariaId, servicioInfo) => {
    setEditando(null)
    setForm({
      ...emptyForm,
      veterinariaId: veterinariaId ?? '',
      usuarioId: userId || '',
      servicio: servicioInfo?.nombre ?? '',
      costo: servicioInfo?.precio != null ? String(servicioInfo.precio) : '',
    })
    setErrors({})
    setSubmitError('')
    setModalOpen(true)
  }

  const abrirEditar = (cita) => {
    setEditando(cita)
    const fecha = new Date(cita.fechaHora)
    const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setForm({
      mascotaId: String(cita.mascotaId ?? ''),
      veterinariaId: String(cita.veterinariaId ?? ''),
      usuarioId: String(cita.usuarioId ?? userId ?? ''),
      fechaHora: local,
      servicio: cita.servicio ?? '',
      categoria: cita.categoria != null ? String(cita.categoria) : '',
      notas: cita.notas ?? '',
      costo: cita.costo == null ? '' : String(cita.costo),
    })
    setErrors({})
    setSubmitError('')
    setModalOpen(true)
  }

  const cerrar = () => {
    setModalOpen(false)
    setEditando(null)
    setSubmitError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'veterinariaId') {
      setServicios([])
      setForm((prev) => ({ ...prev, servicio: '', categoria: '', costo: '' }))
    }
    if (name === 'servicio') {
      const srv = servicios.find((s) => s.nombre === value)
      setForm((prev) => ({
        ...prev,
        [name]: value,
        categoria: srv?.categoria != null ? String(srv.categoria) : prev.categoria,
        costo: srv?.precio != null ? String(srv.precio) : prev.costo,
      }))
    }
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
      veterinariaId: Number(form.veterinariaId),
      usuarioId: Number(form.usuarioId || userId),
      fechaHora: new Date(form.fechaHora).toISOString(),
      servicio: form.servicio.trim(),
      categoria: form.categoria === '' ? null : form.categoria,
      notas: form.notas,
      costo: form.costo === '' ? null : Number(form.costo),
    }
    try {
      let response
      if (editando) {
        response = await authFetch(`${API_BASE_URL}/citas/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fechaHora: payload.fechaHora,
            servicio: payload.servicio,
            categoria: payload.categoria,
            notas: payload.notas,
            costo: payload.costo,
          }),
        })
      } else {
        response = await authFetch(`${API_BASE_URL}/citas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (!response.ok) throw new Error('No se pudo guardar la cita.')
      setSubmitStatus('sent')
      cerrar()
      await cargarCitas()
    } catch (error) {
      setSubmitError(error.message)
      setSubmitStatus('idle')
    }
  }

  const [confirmState, setConfirmState] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const toast = useToast()

  // Confirmaciones que se resuelven en la pagina con <ConfirmDialog>
  const solicitarCancelar = (cita) => setConfirmState({ tipo: 'cancelar', cita })
  const solicitarAceptar = (cita) => setConfirmState({ tipo: 'aceptar', cita })
  const solicitarRechazar = (cita) => setConfirmState({ tipo: 'rechazar', cita })
  const solicitarReprogramar = (cita) => {
    const actual = new Date(cita.fechaHora)
    const local = new Date(actual.getTime() - actual.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setNuevaFecha(local)
    setConfirmState({ tipo: 'reprogramar', cita })
  }
  const cancelarConfirmacion = () => { setConfirmState(null); setNuevaFecha('') }

  const ejecutarConfirmacion = async () => {
    if (!confirmState) return
    const { tipo, cita } = confirmState
    setConfirmLoading(true)
    try {
      let response
      if (tipo === 'aceptar') {
        response = await authFetch(`${API_BASE_URL}/citas/${cita.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'Confirmada' }),
        })
        if (response.status === 400) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.mensaje ?? 'No se pudo aceptar la cita.')
        }
        if (!response.ok) throw new Error('No se pudo aceptar la cita.')
        toast.success('Cita aceptada.')
      } else if (tipo === 'rechazar' || tipo === 'cancelar') {
        response = await authFetch(`${API_BASE_URL}/citas/${cita.id}/cancelar`, { method: 'PATCH' })
        if (!response.ok) throw new Error(tipo === 'rechazar' ? 'No se pudo rechazar la cita.' : 'No se pudo cancelar la cita.')
        toast.error(tipo === 'rechazar' ? 'Cita rechazada.' : 'Cita cancelada.')
      } else if (tipo === 'reprogramar') {
        if (!nuevaFecha) {
          toast.error('Indica la nueva fecha y hora.')
          return
        }
        response = await authFetch(`${API_BASE_URL}/citas/${cita.id}/reprogramar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fechaHora: new Date(nuevaFecha).toISOString() }),
        })
        if (response.status === 400) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.mensaje ?? 'No se pudo reprogramar.')
        }
        if (!response.ok) throw new Error('No se pudo reprogramar la cita.')
        toast.warning('Cita reprogramada.')
      }
      cancelarConfirmacion()
      await cargarCitas()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setConfirmLoading(false)
    }
  }

  const mesFiltradas = citas.filter((cita) => {
    if (cita.estado === 'Cancelada') return false
    const fecha = new Date(cita.fechaHora)
    return fecha.getMonth() === monthDate.getMonth() && fecha.getFullYear() === monthDate.getFullYear()
  })

  const citasDelDia = (dia) => {
    const inicio = new Date(monthDate.getFullYear(), monthDate.getMonth(), dia)
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 1)
    return citas
      .filter((c) => c.estado !== 'Cancelada')
      .filter((c) => {
        const fecha = new Date(c.fechaHora)
        return fecha >= inicio && fecha < fin
      })
  }

  /* Citas de una fecha concreta (para el panel "Citas para hoy" / día seleccionado).
     Ignora Canceladas y fechas inválidas; se ordena por hora en la página. */
  const citasEnFecha = (fecha) => {
    if (!fecha) return []
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 1)
    return citas
      .filter((c) => c.estado !== 'Cancelada')
      .filter((c) => {
        const f = new Date(c.fechaHora)
        return !Number.isNaN(f.getTime()) && f >= inicio && f < fin
      })
  }

  const categoriasFiltro = Array.from(
    new Set(citas.map((c) => c.categoria).filter((c) => c != null))
  ).sort((a, b) => a.localeCompare(b, 'es'))

  const filtradasPorEstado = citas.filter((cita) =>
    (activeState === 'todas' ? true : cita.estado === activeState)
    && (activeCategoria === 'todas' ? true : cita.categoria === activeCategoria)
  )

  return {
    esCliente,
    citas,
    mesFiltradas,
    citasDelDia,
    citasEnFecha,
    filtradasPorEstado,
    mascotas,
    veterinarias,
    servicios,
    categoriasFiltro,
    listStatus,
    listError,
    modalOpen,
    editando,
    form,
    errors,
    submitStatus,
    submitError,
    monthDate,
    setMonthDate,
    activeState,
    setActiveState,
    activeCategoria,
    setActiveCategoria,
    abrirNueva,
    abrirEditar,
    cerrar,
    handleChange,
    guardar,
    confirmState,
    confirmLoading,
    nuevaFecha,
    setNuevaFecha,
    solicitarCancelar,
    solicitarAceptar,
    solicitarRechazar,
    solicitarReprogramar,
    cancelarConfirmacion,
    ejecutarConfirmacion,
    ESTADO_VARIANT,
    ESTADO_LABEL,
    TIPO_CITA_TONE,
    TIPO_CITA_LABEL,
    tipoCitaDe,
    toneTipoCita,
  }
}
