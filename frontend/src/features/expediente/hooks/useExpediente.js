import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { API_BASE_URL, ROLE_IDS, getUserRoleId } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/context/ToastContext'

/* ==========================================================================
   useExpediente — Página Expediente Médico (Sprint 2, tarea #29).

   Fuentes de datos REALES del backend:
     - /usuarios/me/veterinaria-info  → qué mascotas ve el rol (driver)
     - /mascotas                      → MascotaDto completo (merge por id)
     - /expedientes/mascota/{id}      → registros clínicos (Entidad cruda:
                                        claves PascalCase en el JSON)
     - /expediente-aportes?mascotaId  → aportes de veterinarias externas
                                        (Entidad cruda: PascalCase)
     - /emergencias?mascotaId         → emergencias (DTO camelCase)
     - /citas/mascota/{id}            → citas (DTO camelCase)

   Lo que NO existe en backend y se maqueta (marcado en la UI):
     - Historial de peso por fecha (solo hay Peso actual en Mascota) →
       serie estimada determinística anclada al peso actual + Badge "Datos
       estimados".
     - Desparasitación (sin campo) → se deriva de texto en el historial o
       "Sin registro".
     - Alergias (sin campo) → tarjeta de precaución en estado neutral
       ("Sin alergias documentadas") cuando no hay datos.
   ========================================================================== */

export const FILTROS = ['todos', 'Vacunas', 'Cirugías', 'Consultas', 'Exámenes']

const MES_CORTO = new Intl.DateTimeFormat('es', { month: 'short' })

const FECHA_CORTA = new Intl.DateTimeFormat('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })

/* Fecha legible estilo wireframe ("15 Oct, 2023") para mostrar en el Timeline */
function formatFechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const label = FECHA_CORTA.format(d)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/* Acceso defensivo: los endpoints de expediente-aportes y expedientes
   devuelven la ENTIDAD cruda (claves PascalCase). Este helper normaliza. */
function pick(obj, keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] != null) return obj[k]
  }
  return undefined
}

function textoContiene(texto, terminos) {
  if (!texto) return false
  const t = String(texto).toLowerCase()
  return terminos.some((termino) => t.includes(termino))
}

/* Badge / icono / tipo por tipo de atención de los aportes */
const TIPO_ATENCION_META = {
  Consulta: { tipo: 'primary', icono: 'stethoscope', label: 'Consulta' },
  Tratamiento: { tipo: 'secondary', icono: 'healing', label: 'Tratamiento' },
  Vacuna: { tipo: 'tertiary', icono: 'vaccines', label: 'Vacunación' },
  Emergencia: { tipo: 'error', icono: 'emergency', label: 'Emergencia' },
}

const TIPO_ATENCION_DEFAULT = { tipo: 'primary', icono: 'stethoscope', label: 'Aporte' }

function tipoAtencionMeta(tipo) {
  if (!tipo) return TIPO_ATENCION_DEFAULT
  const t = String(tipo).trim()
  const capitalizada = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  return TIPO_ATENCION_META[capitalizada] ?? TIPO_ATENCION_DEFAULT
}

/* Categoría para los filtros del wireframe: Vacunas / Cirugías / Consultas /
   Exámenes. Se deriva del tipo de atención y de los textos clínicos.
   QA M2: una vacuna real se registró como consulta ("Vacuna Rabia aplicada")
   → keywords ['vacun', 'refuerzo', 'aplicada'] la clasifican como Vacunas.
   Tratamientos farmacológicos sin evidencia quirúrgica → Consultas (nunca
   se mapea tratamiento→Cirugías; "Cirugías" requiere keyword quirúrgica). */
function categoriaDe(item) {
  const tipo = String(item.tipoAtencion || '').toLowerCase()
  const texto = [item.titulo, item.descripcion, item.diagnostico, item.tratamiento]
    .filter(Boolean)
    .join(' ')
  if (tipo === 'vacuna' || textoContiene(texto, ['vacun', 'refuerzo', 'aplicada'])) return 'Vacunas'
  if (textoContiene(texto, ['cirug', 'quirofano', 'quirúrgic', 'intervencion'])) return 'Cirugías'
  if (textoContiene(texto, ['radiograf', 'imagen', 'examen', 'analisis', 'análisis', 'laboratorio', 'ecograf', 'endoscop', 'biopsia'])) return 'Exámenes'
  return 'Consultas'
}

function adjunto(nombre, icono, url) {
  return { nombre, icono, url }
}

/* ------------------------- Normalización por fuente ---------------------- */

function expedienteAItem(e) {
  const diagnostico = pick(e, ['Diagnostico', 'diagnostico'])
  const tratamiento = pick(e, ['Tratamiento', 'tratamiento'])
  const observaciones = pick(e, ['Observaciones', 'observaciones'])
  const recetaUrl = pick(e, ['RecetaUrl', 'recetaUrl'])
  const archivoUrl = pick(e, ['ArchivoUrl', 'archivoUrl'])
  const descripcion = [
    observaciones,
    tratamiento ? `Tratamiento: ${tratamiento}` : '',
  ].filter(Boolean).join(' ')

  const adjuntos = []
  if (recetaUrl) adjuntos.push(adjunto('Receta', 'description', recetaUrl))
  if (archivoUrl) adjuntos.push(adjunto('Archivo', 'attachment', archivoUrl))

  return {
    key: `exp-${pick(e, ['Id', 'id'])}`,
    origen: 'expediente',
    fecha: pick(e, ['FechaConsulta', 'fechaConsulta']),
    tipo: 'primary',
    icono: 'stethoscope',
    tipoLabel: 'Consulta',
    titulo: diagnostico || 'Registro de consulta',
    descripcion,
    diagnostico,
    tratamiento,
    categoria: 'Consultas',
    detalles: tratamiento ? [{ label: 'Tratamiento', valor: tratamiento }] : [],
    adjuntos,
  }
}

function aporteAItem(a) {
  const tipo = pick(a, ['TipoAtencion', 'tipoAtencion'])
  const meta = tipoAtencionMeta(tipo)
  const diagnostico = pick(a, ['Diagnostico', 'diagnostico'])
  const medicamentos = pick(a, ['Medicamentos', 'medicamentos'])
  const descripcion = pick(a, ['Descripcion', 'descripcion'])
  const archivoAdjuntoUrl = pick(a, ['ArchivoAdjuntoUrl', 'archivoAdjuntoUrl'])

  const detalles = []
  if (diagnostico) detalles.push({ label: 'Diagnóstico', valor: diagnostico })
  if (medicamentos) detalles.push({ label: 'Medicamentos', valor: medicamentos })

  const adjuntos = []
  if (archivoAdjuntoUrl) adjuntos.push(adjunto('Archivo', 'attachment', archivoAdjuntoUrl))

  return {
    key: `aporte-${pick(a, ['Id', 'id'])}`,
    origen: 'aporte',
    tipoAtencion: tipo,
    fecha: pick(a, ['FechaAtencion', 'fechaAtencion']),
    tipo: meta.tipo,
    icono: meta.icono,
    tipoLabel: meta.label,
    titulo: descripcion || meta.label,
    descripcion: '',
    diagnostico,
    ubicacion: pick(a, ['VeterinariaNombre', 'veterinariaNombre']) || null,
    detalles,
    adjuntos,
  }
}

function emergenciaAItem(em) {
  const detalles = []
  if (em.temperatura != null) detalles.push({ label: 'Temp.', valor: `${em.temperatura}°C` })
  if (em.frecuenciaCardiaca != null) detalles.push({ label: 'FC', valor: `${em.frecuenciaCardiaca} lpm` })
  if (em.saturacionO2 != null) detalles.push({ label: 'SpO2', valor: `${em.saturacionO2}%` })

  const adjuntos = []
  if (em.archivoAdjuntoUrl) adjuntos.push(adjunto('Archivo', 'attachment', em.archivoAdjuntoUrl))

  return {
    key: `emergencia-${em.id}`,
    origen: 'emergencia',
    fecha: em.fechaAtencion || em.fechaRegistro,
    tipo: 'error',
    icono: 'emergency',
    tipoLabel: 'Emergencia',
    titulo: em.motivo || 'Atención de emergencia',
    descripcion: [
      em.sintomas,
      em.diagnostico ? `Diagnóstico: ${em.diagnostico}` : '',
      em.tratamientoAplicado ? `Tratamiento: ${em.tratamientoAplicado}` : '',
    ].filter(Boolean).join(' '),
    diagnostico: em.diagnostico,
    ubicacion: em.veterinariaNombreExterna || (em.esEnPlataforma ? 'Clínica en plataforma' : null),
    detalles,
    adjuntos,
  }
}

function citaAItem(c) {
  return {
    key: `cita-${c.id}`,
    origen: 'cita',
    fecha: c.fechaHora,
    tipo: 'secondary',
    icono: 'event_available',
    tipoLabel: 'Cita',
    titulo: c.servicio || 'Cita veterinaria',
    descripcion: c.notas || '',
    ubicacion: c.veterinariaNombre || null,
    detalles: [],
    adjuntos: [],
  }
}

/* Fecha inválida al final; resto descendente (más reciente primero) */
function byFechaDesc(a, b) {
  const fa = a.fecha ? new Date(a.fecha).getTime() : NaN
  const fb = b.fecha ? new Date(b.fecha).getTime() : NaN
  const va = Number.isNaN(fa) ? -Infinity : fa
  const vb = Number.isNaN(fb) ? -Infinity : fb
  return vb - va
}

function buildEntries(expedientes, aportes, emergencias, citas) {
  const lista = []
  for (const e of Array.isArray(expedientes) ? expedientes : []) lista.push(expedienteAItem(e))
  for (const a of Array.isArray(aportes) ? aportes : []) lista.push(aporteAItem(a))
  for (const em of Array.isArray(emergencias) ? emergencias : []) lista.push(emergenciaAItem(em))
  for (const c of Array.isArray(citas) ? citas : []) {
    if (c.estado === 'Completada') lista.push(citaAItem(c))
  }
  for (const item of lista) item.categoria = categoriaDe(item)
  /* Se ordena por fecha ISO y se expone la fecha ya formateada para el Timeline */
  return lista
    .sort(byFechaDesc)
    .map((item) => ({ ...item, fecha: formatFechaCorta(item.fecha) }))
}

/* --------------------------- Índice de salud ----------------------------- */

function fechaVencida(fecha) {
  if (!fecha) return false
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() <= Date.now()
}

export function computeHealthScore(mascota, entries) {
  let score = 100
  if (mascota?.estadoSalud === 'Tratamiento') score -= 20
  if (fechaVencida(mascota?.proximaVacunaFecha)) score -= 15
  if (fechaVencida(mascota?.proximaMedicacionFecha)) score -= 15
  const hayVacunas = entries.some((e) => e.categoria === 'Vacunas') || Boolean(mascota?.proximaVacuna)
  if (!hayVacunas) score -= 5
  if (entries.some((e) => e.origen === 'emergencia')) score -= 5
  return Math.max(0, Math.min(100, score))
}

export function healthLabel(score) {
  if (score >= 85) return 'Excelente'
  if (score >= 70) return 'Bueno'
  if (score >= 50) return 'Regular'
  return 'Requiere atención'
}

/* Historial de peso: el backend solo guarda el peso ACTUAL de la mascota.
   Se genera una serie estimada determinística (sin random → estable en
   tests) anclada al peso actual y se marca "Datos estimados" en la UI. */
export function buildPesoDemo(peso) {
  if (peso == null || Number.isNaN(Number(peso))) return []
  const base = Number(peso)
  const factores = [0.9, 0.93, 0.95, 0.97, 0.99, 1.0]
  const ahora = new Date()
  return factores.map((factor, i) => {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - (factores.length - 1 - i), 1)
    return {
      label: MES_CORTO.format(d),
      value: Number((base * factor).toFixed(1)),
    }
  })
}

/* ------------------------------ Formularios ------------------------------ */

const emptyAporteForm = {
  veterinariaNombre: '',
  fechaAtencion: '',
  tipoAtencion: '',
  descripcion: '',
  diagnostico: '',
  medicamentos: '',
  archivoAdjuntoUrl: '',
}

const emptyExpedienteForm = {
  diagnostico: '',
  tratamiento: '',
  observaciones: '',
  recetaUrl: '',
  archivoUrl: '',
}

function validarAporte(form) {
  const errors = {}
  if (!form.veterinariaNombre.trim()) errors.veterinariaNombre = 'Indica el nombre de la veterinaria'
  if (!form.fechaAtencion) errors.fechaAtencion = 'Indica la fecha de atención'
  else if (new Date(form.fechaAtencion) > new Date()) errors.fechaAtencion = 'La fecha no puede ser futura'
  if (!form.tipoAtencion) errors.tipoAtencion = 'Selecciona el tipo de atención'
  if (!form.descripcion.trim()) errors.descripcion = 'La descripción es obligatoria'
  return errors
}

function validarExpediente(form) {
  const errors = {}
  if (!form.diagnostico.trim()) errors.diagnostico = 'El diagnóstico es obligatorio'
  return errors
}

export function useExpediente() {
  const { user } = useAuth()
  const userRol = getUserRoleId(user)
  const esCliente = userRol === ROLE_IDS.CLIENTE
  const esFuncionario = [ROLE_IDS.ADMINISTRADOR, ROLE_IDS.VETERINARIA, ROLE_IDS.ALMACEN].includes(userRol)
  const toast = useToast()

  const [mascotas, setMascotas] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [veterinariaId, setVeterinariaId] = useState(null)

  const [entries, setEntries] = useState([])
  const [citas, setCitas] = useState([])
  const [timelineStatus, setTimelineStatus] = useState('loading')
  const [timelineError, setTimelineError] = useState('')
  const [activeFilter, setActiveFilter] = useState('todos')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(esCliente ? { ...emptyAporteForm } : { ...emptyExpedienteForm })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')

  /* Carga de mascotas: merge veterinaria-info (driver por rol) + /mascotas
     (MascotaDto completo: fotoUrl, peso, estadoSalud, próximas vacunas...).
     Mismo patrón QA-fixed que useMascotas de la página Mascotas. */
  useEffect(() => {
    let cancelled = false
    async function load() {
      setListStatus('loading')
      setListError('')
      try {
        const [infoRes, fullRes] = await Promise.allSettled([
          authFetch(`${API_BASE_URL}/usuarios/me/veterinaria-info`),
          authFetch(`${API_BASE_URL}/mascotas`),
        ])
        const infoOk = infoRes.status === 'fulfilled' && infoRes.value?.ok
        const fullOk = fullRes.status === 'fulfilled' && fullRes.value?.ok
        const info = infoOk ? await infoRes.value.json() : null
        const full = fullOk ? await fullRes.value.json() : null

        if (!infoOk && !fullOk) {
          if (!cancelled) { setListError('No se pudieron cargar tus mascotas.'); setListStatus('error') }
          return
        }

        const completas = Array.isArray(full) ? full : []
        const porId = new Map(completas.map((m) => [m.id, m]))
        let lista

        if (infoOk) {
          const infoMascotas = info?.mascotas ?? []
          if (infoMascotas.length > 0) {
            // Caso normal: info define el filtrado por rol (cliente → propias,
            // veterinaria → las de su clínica); el full enriquece los campos.
            lista = infoMascotas.map((m) => ({ ...porId.get(m.id), ...m }))
          } else if (esCliente || esFuncionario) {
            // QA B1: para ADMIN /usuarios/me/veterinaria-info devuelve
            // mascotas: [] (el admin no es dueño) aunque /mascotas devuelve
            // todas las activas → se usa la lista completa como driver.
            // Cliente: fallback seguro (MascotasController ya filtra por dueño).
            // Veterinaria con clínica sin mascotas: mismo patrón de fallback.
            lista = completas
          } else {
            if (!cancelled) { setListError('No se pudieron cargar las mascotas de tu clínica.'); setListStatus('error') }
            return
          }
        } else if (esCliente) {
          // Fallo de veterinaria-info y usuario CLIENTE: /mascotas ya filtra
          // por dueño → seguro usarlas como driver.
          lista = completas
        } else {
          // Fallo de veterinaria-info y rol funcionario: /mascotas devuelve
          // TODAS las mascotas del sistema (no filtra por clínica) → NO usar
          // fallback (expondría mascotas ajenas): error visible.
          if (!cancelled) { setListError('No se pudieron cargar las mascotas de tu clínica.'); setListStatus('error') }
          return
        }

        if (!cancelled) {
          if (info?.veterinariaId != null) setVeterinariaId(info.veterinariaId)
          setMascotas(lista)
          if (lista.length > 0) setSelectedId((prev) => (prev != null ? prev : String(lista[0].id)))
          setListStatus('loaded')
        }
      } catch {
        if (!cancelled) { setListError('No se pudieron cargar tus mascotas.'); setListStatus('error') }
      }
    }
    load()
    return () => { cancelled = true }
  }, [esCliente, esFuncionario])

  /* Historial de la mascota seleccionada: expedientes + aportes + emergencias
     + citas (Completadas → historial; resto → próxima cita).
     QA opcional: guard anti-race — cada carga incrementa un contador de
     secuencia; si una respuesta tardía llega después de otra carga más
     reciente (cambio rápido de mascota / reload post-submit), se descarta. */
  const historialSeq = useRef(0)
  const cargarHistorial = useCallback(async () => {
    if (!selectedId) { setEntries([]); setCitas([]); setTimelineStatus('loaded'); return }
    const seq = ++historialSeq.current
    setTimelineStatus('loading')
    setTimelineError('')
    const resultados = await Promise.allSettled([
      authFetch(`${API_BASE_URL}/expedientes/mascota/${selectedId}`),
      authFetch(`${API_BASE_URL}/expediente-aportes?mascotaId=${selectedId}`),
      authFetch(`${API_BASE_URL}/emergencias?mascotaId=${selectedId}`),
      authFetch(`${API_BASE_URL}/citas/mascota/${selectedId}`),
    ])
    const datos = await Promise.all(
      resultados.map(async (r) => {
        if (r.status === 'fulfilled' && r.value.ok) return r.value.json().catch(() => null)
        return null
      })
    )
    if (seq !== historialSeq.current) return // respuesta obsoleta → descartar
    const todoFallido = resultados.every((r) => r.status === 'rejected' || !r.value?.ok)
    if (todoFallido) {
      setEntries([])
      setCitas([])
      setTimelineStatus('error')
      setTimelineError('No se pudo cargar el historial de esta mascota.')
      return
    }
    const [expedientes, aportes, emergencias, citasData] = datos
    setEntries(buildEntries(expedientes, aportes, emergencias, citasData))
    setCitas(Array.isArray(citasData) ? citasData : [])
    setTimelineStatus('loaded')
  }, [selectedId])

  useEffect(() => {
    async function load() {
      await cargarHistorial()
    }
    load()
  }, [cargarHistorial])

  const mascotaSeleccionada = mascotas.find((m) => String(m.id) === String(selectedId)) || null

  const filtradas = useMemo(() => {
    if (activeFilter === 'todos') return entries
    return entries.filter((e) => e.categoria === activeFilter)
  }, [entries, activeFilter])

  const totalRegistros = entries.length

  const score = useMemo(() => computeHealthScore(mascotaSeleccionada, entries), [mascotaSeleccionada, entries])
  const scoreLabel = healthLabel(score)

  const vacunasAlDia = useMemo(() => {
    if (entries.some((e) => e.categoria === 'Vacunas')) return true
    if (mascotaSeleccionada?.proximaVacuna && !fechaVencida(mascotaSeleccionada.proximaVacunaFecha)) return true
    return false
  }, [entries, mascotaSeleccionada])

  const desparasitado = useMemo(() => {
    const texto = entries
      .map((e) => [e.titulo, e.descripcion].filter(Boolean).join(' '))
      .join(' ')
    return textoContiene(texto, ['desparasit', 'parasito', 'antiparasit'])
  }, [entries])

  /* Próxima cita futura más cercana (texto "En X días/semanas/meses"). */
  const proximaCitaTexto = useMemo(() => {
    const ahora = new Date()
    const futuras = citas
      .filter((c) => c.estado !== 'Cancelada' && c.estado !== 'Completada')
      .map((c) => new Date(c.fechaHora))
      .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() > ahora.getTime())
      .sort((a, b) => a.getTime() - b.getTime())
    if (futuras.length === 0) return 'Sin citas próximas'
    const proxima = futuras[0]
    const dias = Math.max(1, Math.round((proxima.getTime() - ahora.getTime()) / (24 * 3600 * 1000)))
    if (dias >= 365) return `En ${Math.round(dias / 30.44 / 12)} año${Math.round(dias / 30.44 / 12) === 1 ? '' : 's'}`
    if (dias >= 60) return `En ${Math.round(dias / 30.44)} meses`
    if (dias >= 14) return `En ${Math.round(dias / 7)} semanas`
    return `En ${dias} día${dias === 1 ? '' : 's'}`
  }, [citas])

  const pesoData = useMemo(() => buildPesoDemo(mascotaSeleccionada?.peso), [mascotaSeleccionada?.peso])

  /* ------------------------------- FAB / modal --------------------------- */

  const abrirNueva = () => {
    setForm(esCliente ? { ...emptyAporteForm, tipoAtencion: 'Consulta' } : { ...emptyExpedienteForm })
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
    const validation = esCliente ? validarAporte(form) : validarExpediente(form)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setSubmitStatus('submitting')
    setSubmitError('')
    try {
      const base = { mascotaId: Number(selectedId) }
      const payload = esCliente
        ? {
            ...base,
            veterinariaNombre: form.veterinariaNombre.trim(),
            fechaAtencion: new Date(form.fechaAtencion).toISOString(),
            tipoAtencion: form.tipoAtencion,
            descripcion: form.descripcion.trim(),
            diagnostico: form.diagnostico.trim() || undefined,
            medicamentos: form.medicamentos.trim() || undefined,
            archivoAdjuntoUrl: form.archivoAdjuntoUrl.trim() || undefined,
          }
        : {
            ...base,
            veterinariaId: Number(veterinariaId) || 0,
            diagnostico: form.diagnostico.trim(),
            tratamiento: form.tratamiento.trim() || undefined,
            observaciones: form.observaciones.trim() || undefined,
            recetaUrl: form.recetaUrl.trim() || undefined,
            archivoUrl: form.archivoUrl.trim() || undefined,
          }
      const response = await authFetch(
        esCliente ? `${API_BASE_URL}/expediente-aportes` : `${API_BASE_URL}/expedientes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (response.status === 400) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.mensaje ?? 'Revise los datos.')
      }
      if (!response.ok) throw new Error(esCliente ? 'No se pudo registrar el aporte.' : 'No se pudo registrar la consulta.')
      toast.success(esCliente ? 'Aporte registrado correctamente.' : 'Consulta registrada correctamente.')
      setSubmitStatus('sent')
      cerrar()
      await cargarHistorial()
    } catch (error) {
      setSubmitError(error.message)
      setSubmitStatus('idle')
    }
  }

  return {
    esCliente,
    esFuncionario,
    mascotas,
    listStatus,
    listError,
    selectedId,
    setSelectedId,
    mascotaSeleccionada,
    entries,
    timelineStatus,
    timelineError,
    activeFilter,
    setActiveFilter,
    filtradas,
    totalRegistros,
    score,
    scoreLabel,
    vacunasAlDia,
    desparasitado,
    proximaCitaTexto,
    pesoData,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrirNueva,
    cerrar,
    handleChange,
    guardar,
    FILTROS,
  }
}