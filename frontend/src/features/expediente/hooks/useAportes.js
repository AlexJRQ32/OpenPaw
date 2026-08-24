import { useEffect, useState, useCallback } from 'react'
import { API_BASE_URL, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

/* ==========================================================================
   useAportes — página Aportes médicos (Sprint 2, tarea #36).

   Fuentes de datos REALES del backend (no se inventan endpoints):
     - /usuarios/me/veterinaria-info  → mascotas que ve el rol (driver)
     - /mascotas                      → MascotaDto completo (próxima vacuna
                                        para la card "Resumen"; mismo merge
                                        que useExpediente T29). Opcional: si
                                        falla, la fila muestra "Sin registro".
     - /expediente-aportes?mascotaId  → aportes de veterinarias externas.
       "Ver Todos" resuelve N GET paralelos con este mismo endpoint.

   El endpoint devuelve la ENTIDAD cruda; según serialización las claves
   llegan en PascalCase o camelCase → normalización defensiva (patrón T29).
   ========================================================================== */

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

/* Acceso defensivo a claves en ambos casings. */
function pick(obj, keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] != null) return obj[k]
  }
  return undefined
}

export function normalizarAporte(raw) {
  return {
    id: pick(raw, ['Id', 'id']),
    mascotaId: pick(raw, ['MascotaId', 'mascotaId']),
    propietarioId: pick(raw, ['PropietarioId', 'propietarioId']),
    veterinariaNombre: String(pick(raw, ['VeterinariaNombre', 'veterinariaNombre']) ?? ''),
    fechaAtencion: pick(raw, ['FechaAtencion', 'fechaAtencion']),
    tipoAtencion: pick(raw, ['TipoAtencion', 'tipoAtencion']) ?? '',
    descripcion: String(pick(raw, ['Descripcion', 'descripcion']) ?? ''),
    diagnostico: pick(raw, ['Diagnostico', 'diagnostico']),
    medicamentos: pick(raw, ['Medicamentos', 'medicamentos']),
    /* Adjunto principal del aporte + fallbacks por si el DTO expone otras URLs. */
    archivoAdjuntoUrl: pick(raw, [
      'ArchivoAdjuntoUrl', 'archivoAdjuntoUrl',
      'RecetaUrl', 'recetaUrl',
      'ArchivoUrl', 'archivoUrl',
    ]),
    fechaRegistro: pick(raw, ['FechaRegistro', 'fechaRegistro']),
  }
}

const POR_FECHA_DESC = (a, b) => new Date(b.fechaAtencion || 0) - new Date(a.fechaAtencion || 0)

async function obtenerAportesPorSeleccion(seleccion, listaMascotas) {
  if (!seleccion) return []
  if (seleccion === 'all') {
    /* "Ver Todos": N GET paralelos al único endpoint disponible; un fallo
       individual degrada a lista vacía de esa mascota en vez de tumbar todo. */
    const lotes = await Promise.all(
      listaMascotas.map(async (mascota) => {
        try {
          const res = await authFetch(`${API_BASE_URL}/expediente-aportes?mascotaId=${encodeURIComponent(mascota.id)}`)
          if (!res.ok) return []
          const data = await res.json()
          return Array.isArray(data) ? data : []
        } catch {
          return []
        }
      })
    )
    return lotes.flat()
  }
  const res = await authFetch(`${API_BASE_URL}/expediente-aportes?mascotaId=${encodeURIComponent(seleccion)}`)
  if (!res.ok) throw new Error('No se pudieron cargar los aportes.')
  return res.json()
}

function ordenarYNormalizar(data) {
  return (Array.isArray(data) ? data : [])
    .map(normalizarAporte)
    .filter((a) => a.id != null)
    .sort(POR_FECHA_DESC)
}

/* Meta visual por tipo de atención (badge, borde de card, icono). */
export const TIPO_META = {
  Consulta: { label: 'Consulta', variant: 'primary', icono: 'stethoscope', tono: 'consulta' },
  Tratamiento: { label: 'Tratamiento', variant: 'warning', icono: 'healing', tono: 'tratamiento' },
  Vacuna: { label: 'Vacuna', variant: 'success', icono: 'vaccines', tono: 'vacuna' },
  Emergencia: { label: 'Emergencia', variant: 'danger', icono: 'emergency', tono: 'emergencia' },
}

export const TIPO_META_DEFAULT = { label: 'Aporte', variant: 'neutral', icono: 'medical_services', tono: 'otro' }

export function tipoMeta(tipo) {
  if (!tipo) return TIPO_META_DEFAULT
  const t = String(tipo).trim()
  const clave = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  return TIPO_META[clave] || TIPO_META_DEFAULT
}

/* Compatibilidad con importaciones previas del hook. */
export const TIPO_ATENCION_LABEL = Object.fromEntries(Object.entries(TIPO_META).map(([k, v]) => [k, v.label]))
export const TIPO_ATENCION_VARIANT = Object.fromEntries(Object.entries(TIPO_META).map(([k, v]) => [k, v.variant]))

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

/* Validación del formulario de edición (sin mascotaId: la pertenencia del
   aporte es inmutable y no se envía). Mismas reglas que crear. */
function validarEdicion(form) {
  const errors = {}
  if (!form.veterinariaNombre.trim()) errors.veterinariaNombre = 'Indica el nombre de la veterinaria'
  if (!form.fechaAtencion) errors.fechaAtencion = 'Indica la fecha de atencion'
  else if (new Date(form.fechaAtencion) > new Date()) errors.fechaAtencion = 'La fecha no puede ser futura'
  if (!form.tipoAtencion) errors.tipoAtencion = 'Seleccionar el tipo de atencion'
  if (!form.descripcion.trim()) errors.descripcion = 'La descripcion es obligatoria'
  return errors
}

/* ISO → valor para <input type="datetime-local"> en hora local. */
export function isoToLocalInput(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyEditForm = {
  veterinariaNombre: '',
  fechaAtencion: '',
  tipoAtencion: '',
  descripcion: '',
  diagnostico: '',
  medicamentos: '',
  archivoAdjuntoUrl: '',
}

/* Normaliza un valor opcional para compararlo con el original:
   null/undefined/whitespace → '' */
function textoOpcional(valor) {
  return String(valor ?? '').trim()
}

/* Diff parcial contra el aporte actual. Devuelve SOLO los campos cambiados
   (el backend preserva lo omitido/null — contrato PUT T36).
   Limitación documentada del contrato: vaciar ArchivoAdjuntoUrl no es
   expresible ('' falla validación http/https y null preserva), por lo que
   si el usuario vacía ese campo se omite (se conserva el valor anterior). */
export function construirCambios(original, form) {
  const cambios = {}

  if (form.veterinariaNombre.trim() !== textoOpcional(original.veterinariaNombre)) {
    cambios.veterinariaNombre = form.veterinariaNombre.trim()
  }

  /* datetime-local → ISO; se compara instante contra instante. */
  if (form.fechaAtencion) {
    const iso = new Date(form.fechaAtencion).toISOString()
    const isoOriginal = original.fechaAtencion ? new Date(original.fechaAtencion).toISOString() : ''
    if (iso !== isoOriginal) cambios.fechaAtencion = iso
  }

  if ((form.tipoAtencion || '') !== (original.tipoAtencion || '')) {
    cambios.tipoAtencion = form.tipoAtencion
  }

  if (form.descripcion.trim() !== textoOpcional(original.descripcion)) {
    cambios.descripcion = form.descripcion.trim()
  }

  /* Opcionales: '' limpia el campo (backend acepta '' y lo asigna). */
  for (const campo of ['diagnostico', 'medicamentos']) {
    if (textoOpcional(form[campo]) !== textoOpcional(original[campo])) {
      cambios[campo] = form[campo].trim()
    }
  }

  const urlForm = form.archivoAdjuntoUrl.trim()
  const urlOriginal = textoOpcional(original.archivoAdjuntoUrl)
  if (urlForm !== urlOriginal && urlForm !== '') {
    cambios.archivoAdjuntoUrl = urlForm
  }

  return cambios
}

export function useAportes() {
  const { user } = useAuth()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esCliente = userRol === ROLE_IDS.CLIENTE

  const [mascotas, setMascotas] = useState([])
  const [infoMascotas, setInfoMascotas] = useState({})
  /* Píldora activa: '' (cargando) | String(id) | 'all' (Ver Todos). */
  const [seleccion, setSeleccion] = useState('')
  const [aportes, setAportes] = useState([])
  /* infoStatus: fase mascotas (/veterinaria-info); listStatus: fase aportes
     ('idle' hasta que hay selección). Se separan para nunca mostrar el vacío
     "Sin aportes" mientras la lista todavía está cargando. */
  const [infoStatus, setInfoStatus] = useState('loading')
  const [listStatus, setListStatus] = useState('idle')
  const [listError, setListError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [confirmState, setConfirmState] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  /* Edición (PUT parcial T36): aporte en edición, form precargado, errores
     locales y mensaje del servidor (400 se muestra dentro del modal). */
  const [edicion, setEdicion] = useState(null)
  const [editForm, setEditForm] = useState({ ...emptyEditForm })
  const [editErrors, setEditErrors] = useState({})
  const [editStatus, setEditStatus] = useState('idle')
  const [editError, setEditError] = useState('')
  const toast = useToast()

  /* Gating de edición: propietario del aporte o administrador (mismo
     criterio de acceso del PUT en backend; patrón Number(user?.sub ?? id)). */
  const userId = Number(user?.sub ?? user?.id)
  const esAdmin = userRol === ROLE_IDS.ADMINISTRADOR
  const puedeEditarAporte = useCallback(
    (aporte) => Boolean(aporte && (esAdmin || Number(aporte.propietarioId) === userId)),
    [esAdmin, userId]
  )

  /* Mascotas visibles + ficha completa (/mascotas) para el resumen. */
  useEffect(() => {
    let cancelled = false
    async function load() {
      setInfoStatus('loading')
      try {
        const [infoRes, fullRes] = await Promise.allSettled([
          authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`),
          authFetch(`${API_BASE_URL}/mascotas`),
        ])
        if (cancelled) return

        const infoValue = infoRes.status === 'fulfilled' ? infoRes.value : null
        const info = infoValue && infoValue.ok ? await infoValue.json().catch(() => null) : null
        const crudas = Array.isArray(info?.mascotas) ? info.mascotas : []
        const normalizadas = crudas.map((m) => ({ ...m, id: String(m.id ?? m.Id) }))

        const mapa = {}
        const fullValue = fullRes.status === 'fulfilled' ? fullRes.value : null
        if (fullValue && fullValue.ok) {
          const completas = await fullValue.json().catch(() => [])
          if (Array.isArray(completas)) {
            for (const m of completas) mapa[String(m.id ?? m.Id)] = m
          }
        }

        setMascotas(normalizadas)
        setInfoMascotas(mapa)
        if (normalizadas.length > 0) {
          /* Primera mascota seleccionada por defecto (patrón wireframe). */
          setSeleccion((prev) => (prev === '' ? normalizadas[0].id : prev))
        }
        if (!cancelled) setInfoStatus('loaded')
      } catch (error) {
        if (!cancelled) {
          setListError(error.message)
          setInfoStatus('error')
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  /* Aportes según la píldora activa (una mascota o todas). */
  useEffect(() => {
    if (!seleccion) return undefined
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const data = await obtenerAportesPorSeleccion(seleccion, mascotas)
        if (!cancelled) {
          setAportes(ordenarYNormalizar(data))
          setListStatus('loaded')
        }
      } catch (error) {
        if (!cancelled) {
          setListError(error.message)
          setListStatus('error')
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [seleccion, mascotas])

  /* Recarga explícita tras crear/eliminar dentro de la misma vista. */
  const refrescar = useCallback(async () => {
    if (!seleccion) return
    setListError('')
    try {
      const data = await obtenerAportesPorSeleccion(seleccion, mascotas)
      setAportes(ordenarYNormalizar(data))
      setListStatus('loaded')
    } catch (error) {
      setListError(error.message)
      setListStatus('error')
    }
  }, [seleccion, mascotas])

  const abrirNuevo = () => {
    setForm({ ...emptyForm, mascotaId: seleccion !== 'all' ? seleccion : '' })
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
      /* Si se registró para otra mascota, salta a esa vista (el efecto
         recarga); si es la misma o "Ver Todos", refresca en sitio. */
      if (String(form.mascotaId) !== String(seleccion)) {
        setSeleccion(String(form.mascotaId))
      } else {
        await refrescar()
      }
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
      await refrescar()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setConfirmLoading(false)
    }
  }

  /* ------------------------------- edición (PUT parcial, T36) ------------ */

  const abrirEdicion = (aporte) => {
    setEdicion(aporte)
    setEditForm({
      veterinariaNombre: aporte.veterinariaNombre || '',
      fechaAtencion: isoToLocalInput(aporte.fechaAtencion),
      tipoAtencion: aporte.tipoAtencion || '',
      descripcion: aporte.descripcion || '',
      diagnostico: aporte.diagnostico || '',
      medicamentos: aporte.medicamentos || '',
      archivoAdjuntoUrl: aporte.archivoAdjuntoUrl || '',
    })
    setEditErrors({})
    setEditError('')
  }

  const cerrarEdicion = () => {
    setEdicion(null)
    setEditError('')
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
    if (editErrors[name]) setEditErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  /* PUT con SOLO los campos modificados; 400 muestra el mensaje del servidor
     dentro del modal sin cerrarlo (patrón M1 de T32). Éxito: cerrar + toast
     + refresh. 403/404 también se muestran en el modal. */
  const editarAporte = async (event) => {
    event.preventDefault()
    if (!edicion) return
    const validation = validarEdicion(editForm)
    if (Object.keys(validation).length > 0) {
      setEditErrors(validation)
      return
    }
    setEditStatus('submitting')
    setEditError('')
    const cambios = construirCambios(edicion, editForm)
    try {
      const res = await authFetch(`${API_BASE_URL}/expediente-aportes/${encodeURIComponent(edicion.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      })
      if (res.status === 400) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (res.status === 403) throw new Error('No tienes permiso para editar este aporte.')
      if (res.status === 404) throw new Error('Este aporte ya no existe.')
      if (!res.ok) throw new Error('No se pudieron guardar los cambios.')
      toast.success('Aporte actualizado correctamente.')
      setEditStatus('idle')
      cerrarEdicion()
      await refrescar()
    } catch (error) {
      setEditError(error.message)
      setEditStatus('idle')
    }
  }

  return {
    esCliente,
    mascotas,
    infoMascotas,
    aportes,
    seleccion,
    setSeleccion,
    infoStatus,
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
    refrescar,
    confirmState,
    confirmLoading,
    solicitarEliminar,
    cancelarConfirmacion,
    ejecutarEliminacion,
    puedeEditarAporte,
    edicion,
    editForm,
    editErrors,
    editStatus,
    editError,
    abrirEdicion,
    cerrarEdicion,
    handleEditChange,
    editarAporte,
  }
}
