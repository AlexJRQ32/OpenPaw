import { useCallback, useEffect, useState } from 'react'
import { API_BASE_URL, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

const emptyForm = {
  mascotaId: '',
  veterinariaDestinoId: '',
  comentario: '',
}

const ESTADO_VARIANT = {
  Solicitado: 'pending',
  Aceptado: 'success',
  Rechazado: 'error',
}

const ESTADO_LABEL = {
  Solicitado: 'Solicitado',
  Aceptado: 'Aceptado',
  Rechazado: 'Rechazado',
}

function veterinariaIdDeMascota(mascota) {
  if (!mascota?.veterinaria) return null
  return typeof mascota.veterinaria === 'object'
    ? Number(mascota.veterinaria.id)
    : Number(mascota.veterinaria)
}

export function useTraslados() {
  const { user } = useAuth()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esCliente = userRol === ROLE_IDS.CLIENTE
  const esVeterinaria = userRol === ROLE_IDS.VETERINARIA
  const esAdmin = userRol === ROLE_IDS.ADMINISTRADOR

  const [traslados, setTraslados] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [veterinarias, setVeterinarias] = useState([])
  const [veterinariaPropiaId, setVeterinariaPropiaId] = useState(null)
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [activeState, setActiveState] = useState('todos')

  const toast = useToast()

  const cargarTraslados = useCallback(async () => {
    const response = await authFetch(`${API_BASE_URL}/traslados-expediente`)
    if (!response.ok) throw new Error('No se pudieron cargar los traslados.')
    const data = await response.json()
    setTraslados(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const [infoRes, vetsRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`),
          authFetch(`${API_BASE_URL}/veterinarias/aprobadas`),
        ])
        const info = infoRes.ok ? await infoRes.json() : null
        if (!cancelled) {
          setMascotas(Array.isArray(info?.mascotas) ? info.mascotas : [])
          setVeterinariaPropiaId(info?.veterinariaId ? Number(info.veterinariaId) : null)
          setVeterinarias(vetsRes.ok ? await vetsRes.json() : [])
        }
        await cargarTraslados()
        if (!cancelled) setListStatus('loaded')
      } catch (error) {
        if (!cancelled) { setListError(error.message); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [cargarTraslados])

  const abrirNueva = () => {
    setForm({ ...emptyForm })
    setErrors({})
    setSubmitError('')
    setModalOpen(true)
  }

  const cerrar = () => {
    setModalOpen(false)
    setSubmitError('')
  }

  const validar = (values) => {
    const next = {}
    if (!values.mascotaId) next.mascotaId = 'Selecciona una mascota'
    if (!values.veterinariaDestinoId) next.veterinariaDestinoId = 'Selecciona una veterinaria destino'
    if (values.mascotaId && values.veterinariaDestinoId) {
      const mascota = mascotas.find((m) => Number(m.id) === Number(values.mascotaId))
      const vetActual = veterinariaIdDeMascota(mascota)
      if (vetActual && Number(values.veterinariaDestinoId) === vetActual) {
        next.veterinariaDestinoId = 'La veterinaria destino debe ser distinta a la actual'
      }
    }
    return next
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
      veterinariaDestinoId: Number(form.veterinariaDestinoId),
      comentario: form.comentario.trim() || undefined,
    }
    try {
      const response = await authFetch(`${API_BASE_URL}/traslados-expediente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (!response.ok) throw new Error('No se pudo solicitar el traslado.')
      toast.success('Traslado solicitado.')
      setSubmitStatus('sent')
      cerrar()
      await cargarTraslados()
    } catch (error) {
      setSubmitError(error.message)
      setSubmitStatus('idle')
    }
  }

  const [confirmState, setConfirmState] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const solicitarAceptar = (traslado) => setConfirmState({ tipo: 'aceptar', traslado })
  const solicitarRechazar = (traslado) => {
    setMotivoRechazo('')
    setConfirmState({ tipo: 'rechazar', traslado })
  }
  const cancelarConfirmacion = () => { setConfirmState(null); setMotivoRechazo('') }

  const ejecutarConfirmacion = async () => {
    if (!confirmState) return
    const { tipo, traslado } = confirmState
    setConfirmLoading(true)
    try {
      let response
      if (tipo === 'aceptar') {
        response = await authFetch(`${API_BASE_URL}/traslados-expediente/${traslado.id}/aceptar`, {
          method: 'PUT',
        })
        if (response.status === 400) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.mensaje ?? 'No se pudo aceptar el traslado.')
        }
        if (!response.ok && response.status !== 204) throw new Error('No se pudo aceptar el traslado.')
        toast.success('Traslado aceptado.')
      } else if (tipo === 'rechazar') {
        if (!motivoRechazo.trim()) {
          toast.error('Indica el motivo de rechazo.')
          setConfirmLoading(false)
          return
        }
        response = await authFetch(`${API_BASE_URL}/traslados-expediente/${traslado.id}/rechazar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivoRechazo: motivoRechazo.trim() }),
        })
        if (response.status === 400) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.mensaje ?? 'No se pudo rechazar el traslado.')
        }
        if (!response.ok && response.status !== 204) throw new Error('No se pudo rechazar el traslado.')
        toast.warning('Traslado rechazado.')
      }
      cancelarConfirmacion()
      await cargarTraslados()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setConfirmLoading(false)
    }
  }

  const pendientesPropios = traslados.filter(
    (t) => t.estado === 'Solicitado' && veterinariaPropiaId && Number(t.veterinariaDestinoId) === veterinariaPropiaId
  )

  const filtradasPorEstado = traslados.filter((t) =>
    activeState === 'todos' ? true : t.estado === activeState
  )

  return {
    esCliente,
    esVeterinaria,
    esAdmin,
    veterinariaPropiaId,
    traslados,
    pendientesPropios,
    filtradasPorEstado,
    mascotas,
    veterinarias,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    activeState,
    setActiveState,
    abrirNueva,
    cerrar,
    handleChange,
    guardar,
    confirmState,
    confirmLoading,
    motivoRechazo,
    setMotivoRechazo,
    solicitarAceptar,
    solicitarRechazar,
    cancelarConfirmacion,
    ejecutarConfirmacion,
    ESTADO_VARIANT,
    ESTADO_LABEL,
  }
}