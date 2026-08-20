import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

const emptyForm = { productoId: '', almacenId: '', cantidad: '', stockMinimo: '', stockMaximo: '' }

function validar(form) {
  const errors = {}
  if (!form.productoId) errors.productoId = 'Selecciona un producto'
  if (!form.almacenId) errors.almacenId = 'Selecciona un almacen'
  const cantidad = Number(form.cantidad)
  const minimo = Number(form.stockMinimo)
  const maximo = form.stockMaximo === '' || form.stockMaximo === null ? null : Number(form.stockMaximo)
  if (form.cantidad === '' || Number.isNaN(cantidad) || cantidad < 0) {
    errors.cantidad = 'La cantidad debe ser un numero mayor o igual a 0'
  }
  if (form.stockMinimo === '' || Number.isNaN(minimo) || minimo < 0) {
    errors.stockMinimo = 'El stock minimo debe ser un numero mayor o igual a 0'
  }
  if (maximo !== null && (Number.isNaN(maximo) || maximo < 0)) {
    errors.stockMaximo = 'El stock maximo debe ser un numero mayor o igual a 0'
  } else if (maximo !== null && maximo < minimo) {
    errors.stockMaximo = 'El stock maximo no puede ser menor que el minimo'
  } else if (maximo !== null && cantidad > maximo) {
    errors.stockMaximo = 'La cantidad no puede superar el stock maximo'
  }
  return errors
}

export function useInventario() {
  const { user } = useAuth()
  const toast = useToast()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esAdmin = userRol === ROLE_IDS.ADMINISTRADOR

  const [inventario, setInventario] = useState([])
  const [productos, setProductos] = useState([])
  const [almacenes, setAlmacenes] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [filter, setFilter] = useState('todos')
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const cargar = useCallback(async () => {
    setListStatus('loading')
    setListError('')
    try {
      const url = esAdmin
        ? `${API_BASE_URL}/inventario`
        : `${API_BASE_URL}/inventario/mios`
      const response = await authFetch(url)
      if (!response.ok) throw new Error('No se pudo cargar el inventario.')
      const data = await response.json()
      setInventario(Array.isArray(data) ? data : [])
      setListStatus('loaded')
    } catch (error) {
      setListError(error.message)
      setListStatus('error')
    }
  }, [esAdmin])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // No-admin solo ve sus almacenes (endpoint /almacenes/mios)
        const almUrl = esAdmin
          ? `${API_BASE_URL}/almacenes`
          : `${API_BASE_URL}/almacenes/mios`
        const invUrl = esAdmin
          ? `${API_BASE_URL}/inventario`
          : `${API_BASE_URL}/inventario/mios`
        const [invRes, prodRes, almRes] = await Promise.all([
          authFetch(invUrl),
          authFetch(`${API_BASE_URL}/productos`),
          authFetch(almUrl),
        ])
        if (!cancelled) {
          setInventario(invRes.ok ? await invRes.json() : [])
          setProductos(prodRes.ok ? await prodRes.json() : [])
          const alms = almRes.ok ? await almRes.json() : []
          setAlmacenes(Array.isArray(alms) ? alms.filter((a) => a.aprobada !== false) : [])
          setListStatus('loaded')
        }
      } catch {
        if (!cancelled) { setListError('No se pudo cargar el inventario.'); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [esAdmin])

  const abrirCrear = () => {
    if (!esAdmin && almacenes.length === 0) {
      toast.error('Tu cuenta no tiene almacenes disponibles. Pide al administrador que los vincule.')
      return
    }
    setEditando(null)
    setForm({ ...emptyForm, almacenId: !esAdmin ? String(almacenes[0]?.id ?? '') : '' })
    setErrors({})
    setSubmitError('')
    setModalOpen(true)
  }

  const abrirEditar = (item) => {
    setEditando(item)
    setForm({
      productoId: String(item.productoId ?? ''),
      almacenId: String(item.almacenId ?? ''),
      cantidad: String(item.cantidad ?? ''),
      stockMinimo: String(item.stockMinimo ?? ''),
      stockMaximo: item.stockMaximo == null ? '' : String(item.stockMaximo),
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
      productoId: Number(form.productoId),
      almacenId: Number(form.almacenId),
      cantidad: Number(form.cantidad),
      stockMinimo: Number(form.stockMinimo),
      stockMaximo: form.stockMaximo === '' ? null : Number(form.stockMaximo),
    }
    try {
      const url = editando
        ? `${API_BASE_URL}/inventario/${editando.id}`
        : `${API_BASE_URL}/inventario`
      const response = await authFetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando ? { cantidad: payload.cantidad, stockMinimo: payload.stockMinimo, stockMaximo: payload.stockMaximo } : payload),
      })
      if (response.status === 400 || response.status === 409) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (!response.ok) throw new Error('No se pudo guardar el registro de inventario.')
      setSubmitStatus('sent')
      if (editando) {
        toast.warning('Registro de inventario actualizado.')
      } else {
        toast.success('Producto registrado en el inventario.')
      }
      cerrar()
      await cargar()
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
      const response = await authFetch(`${API_BASE_URL}/inventario/${confirmTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('No se pudo eliminar el registro.')
      toast.error('Registro de inventario eliminado.')
      setConfirmTarget(null)
      await cargar()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeleting(false)
    }
  }

  const filtrados = inventario.filter((item) => {
    if (filter === 'agotado') return item.cantidad === 0
    if (filter === 'stock-bajo') return item.cantidad > 0 && item.cantidad <= item.stockMinimo
    if (filter === 'con-stock') return item.cantidad > item.stockMinimo
    return true
  })

  return {
    inventario,
    filtrados,
    productos,
    almacenes,
    esAdmin,
    listStatus,
    listError,
    modalOpen,
    editando,
    form,
    errors,
    submitStatus,
    submitError,
    filter,
    setFilter,
    abrirCrear,
    abrirEditar,
    cerrar,
    handleChange,
    guardar,
    confirmTarget,
    setConfirmTarget,
    confirmarEliminar,
    deleting,
  }
}
