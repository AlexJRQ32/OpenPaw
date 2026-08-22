import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

const emptyForm = {
  veterinariaId: '',
  nombre: '',
  descripcion: '',
  categoria: 'Consulta',
  precio: '',
  duracionMinutos: '30',
  activo: true,
}

export const CATEGORIAS = ['Consulta', 'Grooming', 'Procedimiento']

const CATEGORIA_ICON = {
  Consulta: 'fas fa-stethoscope',
  Grooming: 'fas fa-scissors',
  Procedimiento: 'fas fa-syringe',
}

function validar(form) {
  const errors = {}
  if (!form.veterinariaId) errors.veterinariaId = 'Selecciona la veterinaria'
  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
  const precio = Number(form.precio)
  if (form.precio === '' || Number.isNaN(precio) || precio < 0) {
    errors.precio = 'El precio debe ser un numero mayor o igual a 0'
  }
  const duracion = Number(form.duracionMinutos)
  if (form.duracionMinutos === '' || Number.isNaN(duracion) || duracion < 1 || duracion > 1440) {
    errors.duracionMinutos = 'La duracion debe estar entre 1 y 1440 minutos'
  }
  return errors
}

export function useServiciosVeterinaria() {
  const { user } = useAuth()
  const toast = useToast()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esAdmin = userRol === ROLE_IDS.ADMINISTRADOR
  const esVeterinaria = userRol === ROLE_IDS.VETERINARIA

  const [servicios, setServicios] = useState([])
  const [veterinarias, setVeterinarias] = useState([])
  const [miVeterinariaId, setMiVeterinariaId] = useState(null)
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('Todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const cargarServicios = useCallback(async () => {
    const url = esAdmin
      ? `${API_BASE_URL}/serviciosveterinarios`
      : `${API_BASE_URL}/serviciosveterinarios/mios`
    const response = await authFetch(url)
    if (!response.ok) throw new Error('No se pudieron cargar los servicios.')
    const data = await response.json()
    setServicios(Array.isArray(data) ? data : [])
  }, [esAdmin])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const infoRes = await authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`)
        const info = infoRes.ok ? await infoRes.json() : null
        const miId = info?.veterinariaId ?? null
        setMiVeterinariaId(miId)
        const url = esAdmin
          ? `${API_BASE_URL}/serviciosveterinarios`
          : `${API_BASE_URL}/serviciosveterinarios/mios`
        const [servRes, vetsRes] = await Promise.all([
          authFetch(url),
          authFetch(`${API_BASE_URL}/veterinarias/aprobadas`),
        ])
        if (!cancelled) {
          setServicios(servRes.ok ? await servRes.json() : [])
          const vets = vetsRes.ok ? await vetsRes.json() : []
          const todas = Array.isArray(vets) ? vets.filter((v) => v.aprobada !== false) : []
          if (esAdmin) {
            setVeterinarias(todas)
          } else {
            // No-admin solo puede gestionar su propia veterinaria
            const propias = miId
              ? todas.filter((v) => Number(v.id) === Number(miId))
              : []
            setVeterinarias(propias)
          }
          setListStatus('loaded')
        }
      } catch (error) {
        if (!cancelled) { setListError(error.message); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const abrirNuevo = () => {
    if (!esAdmin && !miVeterinariaId) {
      toast.error('Tu cuenta no tiene una veterinaria vinculada. Pide al administrador que la vincule.')
      return
    }
    if (!esAdmin && veterinarias.length === 0) {
      toast.error('No tienes veterinarias disponibles para crear servicios.')
      return
    }
    setEditando(null)
    setForm({
      ...emptyForm,
      veterinariaId: esVeterinaria && miVeterinariaId ? String(miVeterinariaId) : String(veterinarias[0]?.id ?? ''),
    })
    setErrors({})
    setSubmitError('')
    setModalOpen(true)
  }

  const abrirEditar = (servicio) => {
    setEditando(servicio)
    setForm({
      veterinariaId: String(servicio.veterinariaId ?? ''),
      nombre: servicio.nombre ?? '',
      descripcion: servicio.descripcion ?? '',
      categoria: servicio.categoria ?? 'Consulta',
      precio: String(servicio.precio ?? ''),
      duracionMinutos: String(servicio.duracionMinutos ?? '30'),
      activo: servicio.activo ?? true,
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
    const { name, value, type, checked } = event.target
    const val = type === 'checkbox' ? checked : value
    setForm((prev) => ({ ...prev, [name]: val }))
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
    const payload = editando
      ? {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion,
          categoria: form.categoria,
          precio: Number(form.precio),
          duracionMinutos: Number(form.duracionMinutos),
          activo: form.activo,
        }
      : {
          veterinariaId: Number(form.veterinariaId),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion,
          categoria: form.categoria,
          precio: Number(form.precio),
          duracionMinutos: Number(form.duracionMinutos),
        }
    try {
      const url = editando
        ? `${API_BASE_URL}/serviciosveterinarios/${editando.id}`
        : `${API_BASE_URL}/serviciosveterinarios`
      const response = await authFetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (!response.ok) throw new Error('No se pudo guardar el servicio.')
      setSubmitStatus('sent')
      if (editando) {
        toast.warning('Servicio actualizado.')
      } else {
        toast.success('Servicio creado.')
      }
      cerrar()
      await cargarServicios()
    } catch (error) {
      toast.error(error.message)
      setSubmitError(error.message)
      setSubmitStatus('idle')
    }
  }

  const confirmarEliminar = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      const response = await authFetch(`${API_BASE_URL}/serviciosveterinarios/${confirmTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('No se pudo eliminar el servicio.')
      toast.error('Servicio eliminado.')
      setConfirmTarget(null)
      await cargarServicios()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeleting(false)
    }
  }

  /**
   * Toggle inline de estado (wireframe servicios_openpaw): alterna activo/inactivo
   * con actualizacion optimista. Reutiliza el PUT existente (payload completo,
   * contrato ActualizarServicioVeterinarioDto). Sin endpoints nuevos.
   */
  const toggleActivo = async (servicio) => {
    if (!servicio || togglingId === servicio.id) return
    const nuevoEstado = !servicio.activo
    setTogglingId(servicio.id)
    // Optimistic: refleja el cambio al instante en la grilla
    setServicios((prev) => prev.map((s) => (s.id === servicio.id ? { ...s, activo: nuevoEstado } : s)))
    try {
      const response = await authFetch(`${API_BASE_URL}/serviciosveterinarios/${servicio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          categoria: servicio.categoria,
          precio: servicio.precio,
          duracionMinutos: servicio.duracionMinutos,
          activo: nuevoEstado,
        }),
      })
      if (!response.ok) throw new Error('No se pudo actualizar el estado del servicio.')
      toast[nuevoEstado ? 'success' : 'warning'](`Servicio ${nuevoEstado ? 'activado' : 'desactivado'}.`)
    } catch (error) {
      // Revertir el cambio optimista
      setServicios((prev) => prev.map((s) => (s.id === servicio.id ? { ...s, activo: !nuevoEstado } : s)))
      toast.error(error.message)
    } finally {
      setTogglingId(null)
    }
  }

  const filtrados = servicios.filter((s) => {
    const porCategoria = filterCategoria === 'Todas' ? true : s.categoria === filterCategoria
    const texto = searchTerm.trim().toLowerCase()
    const porTexto = texto === ''
      ? true
      : [s.nombre, s.descripcion, s.categoria].filter(Boolean).some((v) => String(v).toLowerCase().includes(texto))
    return porCategoria && porTexto
  })

  const activos = servicios.filter((s) => s.activo).length
  const inactivos = servicios.length - activos

  return {
    servicios,
    filtrados,
    veterinarias,
    esAdmin,
    esVeterinaria,
    listStatus,
    listError,
    modalOpen,
    editando,
    form,
    errors,
    submitStatus,
    submitError,
    filterCategoria,
    setFilterCategoria,
    searchTerm,
    setSearchTerm,
    togglingId,
    toggleActivo,
    activos,
    inactivos,
    abrirNuevo,
    abrirEditar,
    cerrar,
    handleChange,
    guardar,
    confirmTarget,
    setConfirmTarget,
    confirmarEliminar,
    deleting,
    CATEGORIAS,
    CATEGORIA_ICON,
  }
}
