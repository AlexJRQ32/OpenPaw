import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Button } from '../../../shared/components/Button/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Icon } from '../../../shared/components/Icon/Icon'
import { authFetch } from '../../../shared/utils/api'
import { API_BASE_URL } from '../../../constants'
import { useToast } from '../../../shared/context/ToastContext'
import { useApprovals } from '../hooks/useApprovals'
import './ApprovalsPanel.css'

/* ---------------------------------------------------------------------------
   Rediseño Sprint 2 — T33 (wireframe aprobaciones_openpaw).
   Feed de cards + urgencia derivada + animación de entrada/salida.
   Urgencia NO es un campo del backend: se deriva de la antigüedad de la
   solicitud pendiente (FechaRegistro) — sin endpoints nuevos.
   --------------------------------------------------------------------------- */

const LEAVE_MS = 400 // duración de la animación de salida (CSS .4s)

const URGENCIA_CONFIG = {
  alta: { label: 'Urgente', variant: 'danger', icon: 'warning', filled: true },
  media: { label: 'Media', variant: 'warning', icon: 'schedule', filled: false },
  baja: { label: 'Baja', variant: 'neutral', icon: 'check_circle', filled: false },
}

const URGENCIA_ORDER = { alta: 0, media: 1, baja: 2 }

function fechaDe(item) {
  return item?.fechaRegistro || item?.fechaCreacion || item?.fecha || null
}

/* Re-QA H1 (zona horaria): el backend devuelve ISO sin sufijo de zona
   ("2026-08-22T23:44:10.1661162"). new Date(iso) la interpretaría como hora
   LOCAL y sesgaría las comparaciones contra Date.now() (UTC real). Forzamos
   UTC añadiendo 'Z' solo si la cadena no trae zona. */
function parsearFecha(iso) {
  if (!iso) return null
  const str = String(iso).trim()
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(str)) return new Date(str)
  return new Date(`${str}Z`)
}

function getEstado(s) {
  if (s.aprobada) return 'aprobado'
  if (s.rechazada) return 'rechazado'
  return 'pendiente'
}

/* Urgencia derivada: > 7 días = alta, 2-7 días = media, < 2 días = baja */
function urgenciaDe(item) {
  const fecha = parsearFecha(fechaDe(item))
  if (!fecha || Number.isNaN(fecha.getTime())) return 'media'
  const dias = (Date.now() - fecha.getTime()) / 86400000
  if (dias >= 7) return 'alta'
  if (dias >= 2) return 'media'
  return 'baja'
}

function timeAgo(iso) {
  const fecha = parsearFecha(iso)
  if (!fecha || Number.isNaN(fecha.getTime())) return '—'
  const mins = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const horas = Math.floor(mins / 60)
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  const semanas = Math.floor(dias / 7)
  return `Hace ${semanas} sem`
}

function formatDateFull(dateStr) {
  const fecha = parsearFecha(dateStr)
  if (!fecha || Number.isNaN(fecha.getTime())) return '-'
  return fecha.toLocaleString('es-CR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function statusBadge(estado) {
  if (estado === 'aprobado') return { variant: 'success', label: 'Aprobado' }
  if (estado === 'rechazado') return { variant: 'error', label: 'Rechazado' }
  return { variant: 'info', label: 'Pendiente' }
}

function tipoLabel(item) {
  return item?.tipo === 'almacen' ? 'Solicitud de Almacen' : 'Nuevo Registro Veterinaria'
}

/* Key compuesta tipo-id: una veterinaria y un almacén pueden compartir id
   numérico (p.ej. ambos id=1); el estado de salida y los refs no deben
   colisionar entre tipos. */
function itemKey(item) {
  return `${item?.tipo}-${item?.id}`
}

function inicialDe(item) {
  return (item?.nombre || '?').trim().charAt(0).toUpperCase()
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/* ===========================================================================
   Card del feed (wireframe): borde urgente izquierdo, avatar con inicial,
   badge de urgencia, tipo + tiempo relativo, título, descripción, chips de
   datos y columna de acciones Aprobar/Rechazar.
   =========================================================================== */
function ApprovalCard({ item, index, leaving, loadingId, onVerDetalles, onAprobar, onRechazar }) {
  const urg = urgenciaDe(item)
  const cfg = URGENCIA_CONFIG[urg]
  const esAlmacen = item.tipo === 'almacen'
  const keyId = itemKey(item)
  const saliendo = leaving?.keyId === keyId
  const colapsando = saliendo && leaving?.phase === 'collapse'

  const chips = []
  if (item.cedulaJuridica) chips.push({ icon: 'badge', text: item.cedulaJuridica })
  if (item.email) chips.push({ icon: 'mail', text: item.email })
  if (esAlmacen && item.tipoAlmacen) chips.push({ icon: 'warehouse', text: item.tipoAlmacen })
  if (!esAlmacen && item.telefono) chips.push({ icon: 'call', text: item.telefono })

  const descripcion =
    item.descripcion ||
    (esAlmacen
      ? `Solicitud de registro del almacén veterinario "${item.nombre}".`
      : `Solicitud de registro de la veterinaria "${item.nombre}".`)

  return (
    <div
      className={`approval-feed-item ${colapsando ? `approval-feed-item--leaving approval-feed-item--leaving-${leaving.action}` : ''}`.trim()}
      style={saliendo ? { maxHeight: leaving.height } : undefined}
    >
      <article
        className={`approval-card ${urg === 'alta' ? 'approval-card--urgente' : ''} ${colapsando ? 'approval-card--leaving' : ''}`.trim()}
        style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
        aria-label={`${tipoLabel(item)}: ${item.nombre}`}
      >
        {urg === 'alta' && <div className="approval-card__edge" aria-hidden="true" />}

        <div className="approval-card__profile">
          <span className="approval-card__avatar" aria-hidden="true">{inicialDe(item)}</span>
          <Badge variant={cfg.variant} icon={cfg.icon} filled={cfg.filled} className="approval-card__urgencia">
            {cfg.label}
          </Badge>
        </div>

        <div className="approval-card__body">
          <div className="approval-card__top">
            <span className="approval-card__tipo">{tipoLabel(item)}</span>
            <span className="approval-card__time">
              <Icon name="schedule" size={14} aria-hidden="true" />
              {timeAgo(fechaDe(item))}
            </span>
          </div>
          <h3 className="approval-card__titulo">{item.nombre}</h3>
          <p className="approval-card__descripcion">{descripcion}</p>
          {chips.length > 0 && (
            <div className="approval-card__chips">
              {chips.map((chip) => (
                <span key={chip.icon + chip.text} className="approval-chip">
                  <Icon name={chip.icon} size={15} aria-hidden="true" />
                  {chip.text}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="approval-card__actions">
          <Button
            variant="primary"
            size="md"
            icon="check_circle"
            className="approval-card__approve"
            onClick={() => onAprobar(item)}
            disabled={loadingId === item.id || saliendo}
          >
            Aprobar
          </Button>
          <Button
            variant="outline"
            size="md"
            icon="close"
            className="approval-card__reject"
            onClick={() => onRechazar(item)}
            disabled={loadingId === item.id || saliendo}
          >
            Rechazar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="visibility"
            className="approval-card__ver"
            onClick={() => onVerDetalles(item)}
          >
            Ver detalle
          </Button>
        </div>
      </article>
    </div>
  )
}

/* ===========================================================================
   Panel principal: header + stats, columna lateral (filtros + actividad
   reciente) y feed de cards. Conserva el modal de detalle/confirmación.
   =========================================================================== */
export function ApprovalsPanel() {
  const {
    solicitudes, listStatus, listError,
    loadingId, rechazar, fetchSolicitudes,
  } = useApprovals()
  const toast = useToast()

  const [almacenes, setAlmacenes] = useState([])
  const [almacenesStatus, setAlmacenesStatus] = useState('loading')

  /* Carga inicial inline en el efecto (patrón original, lint-clean:
     el setState ocurre en el callback async, no en el cuerpo del efecto). */
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await authFetch(`${API_BASE_URL}/almacenes`)
        if (!r.ok) throw new Error()
        const d = await r.json()
        if (!cancelled) { setAlmacenes(Array.isArray(d) ? d : []); setAlmacenesStatus('loaded') }
      } catch { if (!cancelled) setAlmacenesStatus('error') }
    }
    load()
    return () => { cancelled = true }
  }, [])

  /* Refetch para retry / tras aprobar o rechazar un almacén */
  const loadAlmacenes = useCallback(async () => {
    try {
      const r = await authFetch(`${API_BASE_URL}/almacenes`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setAlmacenes(Array.isArray(d) ? d : [])
      setAlmacenesStatus('loaded')
    } catch {
      setAlmacenesStatus('error')
    }
  }, [])

  const [detailSolicitud, setDetailSolicitud] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [rechazarOpen, setRechazarOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [leaving, setLeaving] = useState(null)

  const [tipos, setTipos] = useState({ veterinaria: true, almacen: true })
  const [urgencias, setUrgencias] = useState([])

  /* Acciones locales de la sesión (QA MEDIO): el backend no expone timestamp
     de decisión, así que anteponemos a "Actividad Reciente" las aprobaciones/
     rechazos hechos en esta sesión. [ { keyId, item, accion, ts } ] */
  const [accionesRecientes, setAccionesRecientes] = useState([])

  const registrarAccion = useCallback((item, accion) => {
    setAccionesRecientes((prev) => [
      { keyId: itemKey(item), item: { ...item, tipo: item.tipo }, accion, ts: Date.now() },
      ...prev.filter((a) => a.keyId !== itemKey(item)),
    ].slice(0, 6))
  }, [])

  const itemRefs = useRef(new Map())
  const setItemRef = useCallback((id) => (el) => {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }, [])

  /* -------------------------------------------------------------------------
     Salida animada de una card (QA opcional): fase 'anchor' fija la altura
     real inline; un frame después la fase 'collapse' añade la clase
     max-height:0 !important para que la transición parta de la altura real
     (no del max-height base 600px). Con reduced-motion va directo.
     ------------------------------------------------------------------------- */
  const iniciarSalida = (item, action) => {
    const keyId = itemKey(item)
    const el = itemRefs.current.get(keyId)
    if (!el) return
    const height = el.offsetHeight || 420
    if (!prefersReducedMotion() && typeof window.requestAnimationFrame === 'function') {
      setLeaving({ keyId, action, height, phase: 'anchor' })
      window.requestAnimationFrame(() => {
        setLeaving((prev) => (prev?.keyId === keyId ? { ...prev, phase: 'collapse' } : prev))
      })
    } else {
      setLeaving({ keyId, action, height, phase: 'collapse' })
    }
  }

  /* -------------------------------------------------------------------------
     Items normalizados: veterinarias + almacenes con marcador `tipo`.
     ------------------------------------------------------------------------- */
  const allItems = useMemo(() => {
    const vets = solicitudes.map((s) => ({ ...s, tipo: 'veterinaria' }))
    const alms = almacenesStatus === 'loaded'
      ? almacenes.map((a) => ({ ...a, tipo: 'almacen' }))
      : []
    return [...vets, ...alms]
  }, [solicitudes, almacenes, almacenesStatus])

  const pendientes = useMemo(() => {
    return allItems
      .filter((s) => getEstado(s) === 'pendiente')
      .filter((s) => tipos[s.tipo] === true)
      .filter((s) => urgencias.length === 0 || urgencias.includes(urgenciaDe(s)))
      .sort((a, b) => {
        const porUrgencia = URGENCIA_ORDER[urgenciaDe(a)] - URGENCIA_ORDER[urgenciaDe(b)]
        if (porUrgencia !== 0) return porUrgencia
        return (parsearFecha(fechaDe(a))?.getTime() || 0) - (parsearFecha(fechaDe(b))?.getTime() || 0)
      })
  }, [allItems, tipos, urgencias])

  /* Actividad reciente: acciones locales de la sesión antepuestas + items
     aprobados/rechazados del backend (que no exponen timestamp de decisión).
     Unión por key (la acción local gana), orden por momento de la acción. */
  const actividad = useMemo(() => {
    const locales = accionesRecientes.map((a) => ({
      ...a.item,
      _accion: a.accion,
      _ts: a.ts,
    }))
    const delBackend = allItems
      .filter((s) => getEstado(s) !== 'pendiente')
      .map((s) => ({ ...s, _ts: parsearFecha(fechaDe(s))?.getTime() || 0 }))
    const mapa = new Map()
    for (const item of delBackend) mapa.set(itemKey(item), item)
    for (const item of locales) mapa.set(itemKey(item), item) // la acción local prevalece
    return [...mapa.values()]
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 4)
  }, [allItems, accionesRecientes])

  const pendingCount = allItems.filter((s) => getEstado(s) === 'pendiente').length
  const approvedCount = allItems.filter((s) => s.aprobada).length

  /* -------------------------------------------------------------------------
     Acciones: aprobar (desde card, con animación de salida) y rechazar
     (modal con motivo — requisito funcional conservado).
     ------------------------------------------------------------------------- */
  const approveSolicitud = useCallback(async (item) => {
    const esAlmacen = item.tipo === 'almacen'
    const url = esAlmacen
      ? `${API_BASE_URL}/almacenes/${item.id}/aprobar`
      : `${API_BASE_URL}/veterinarias/${item.id}/aprobar`
    setSubmitting(true)
    try {
      const response = await authFetch(url, { method: 'PUT' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.mensaje ?? 'No se pudo aprobar la solicitud.')
      }
      window.dispatchEvent(new CustomEvent('pending-changed'))
      toast.success('Solicitud aprobada.')
      registrarAccion(item, 'aprobar')
      if (esAlmacen) await loadAlmacenes()
      else await fetchSolicitudes()
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [toast, fetchSolicitudes, loadAlmacenes, registrarAccion])

  const handleCardAprobar = (item) => {
    iniciarSalida(item, 'approve')
    const delay = prefersReducedMotion() ? 0 : LEAVE_MS
    window.setTimeout(async () => {
      const ok = await approveSolicitud(item)
      if (!ok) setLeaving(null) // restaurar la card si falló
    }, delay)
  }

  const handleCardRechazar = (item) => {
    setDetailSolicitud(item)
    setRechazarOpen(true)
  }

  /* Rechazo (M2): primero la animación de salida de la card (mismo patrón que
     aprobar) y tras su duración se ejecuta el PUT/refresh; así la transición
     es visible y el modal cierra de inmediato. */
  const handleConfirmRechazar = (item) => {
    if (!motivo.trim()) return
    const motivoFinal = motivo.trim()
    const keyId = itemKey(item)
    iniciarSalida(item, 'reject')
    setRechazarOpen(false)
    setMotivo('')
    setDetailSolicitud(null)
    setSubmitting(true)
    const delay = prefersReducedMotion() ? 0 : LEAVE_MS
    window.setTimeout(async () => {
      try {
        const esAlmacen = item?.tipo === 'almacen'
        if (esAlmacen) {
          const response = await authFetch(`${API_BASE_URL}/almacenes/${item.id}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivoRechazo: motivoFinal }),
          })
          if (!response.ok) throw new Error('No se pudo rechazar la solicitud.')
          await loadAlmacenes()
        } else {
          await rechazar(item.id, motivoFinal)
        }
        window.dispatchEvent(new CustomEvent('pending-changed'))
        // M1: snapshot local con el motivo para el meta de Actividad Reciente
        registrarAccion({ ...item, motivoRechazo: motivoFinal }, 'rechazar')
        toast.warning('Solicitud rechazada.')
      } catch (e) {
        setLeaving((prev) => (prev?.keyId === keyId ? null : prev)) // restaurar la card si falló
        toast.error(e.message)
      } finally {
        setSubmitting(false)
      }
    }, delay)
  }

  const cerrarModal = () => {
    setDetailSolicitud(null)
    setConfirmAction(null)
    setRechazarOpen(false)
    setMotivo('')
  }

  const retry = () => {
    fetchSolicitudes()
    loadAlmacenes()
  }

  const hayPendientesSinFiltro = allItems.some((s) => getEstado(s) === 'pendiente')
  const mostrarVacio = listStatus === 'loaded' && almacenesStatus !== 'loading' && pendientes.length === 0

  const toggleTipo = (t) => setTipos((prev) => ({ ...prev, [t]: !prev[t] }))
  const toggleUrgencia = (u) => setUrgencias((prev) =>
    prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]
  )

  return (
    <div className="approvals-panel">
      <div className="approvals-ambient" aria-hidden="true">
        <div className="approvals-ambient__blob approvals-ambient__blob--primary" />
        <div className="approvals-ambient__blob approvals-ambient__blob--secondary" />
      </div>

      {/* ------------------------------------------------------------ header */}
      <header className="approvals-header">
        <div className="approvals-header__text">
          <h1 className="approvals-title">Aprobaciones Pendientes</h1>
          <p className="approvals-subtitle">
            Revisa y gestiona las solicitudes de registro de veterinarias y almacenes
            que requieren tu validación.
          </p>
        </div>
        <div className="approvals-stats">
          <div className="approvals-stat">
            <span className="approvals-stat__number approvals-stat__number--primary">{pendingCount}</span>
            <span className="approvals-stat__label">Pendientes</span>
          </div>
          <div className="approvals-stat">
            <span className="approvals-stat__number approvals-stat__number--secondary">{approvedCount}</span>
            <span className="approvals-stat__label">Aprobadas</span>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------- grid principal */}
      <div className="approvals-grid">
        {/* Columna lateral: filtros + actividad */}
        <aside className="approvals-side">
          <section className="approvals-filters" aria-label="Filtros">
            <h2 className="approvals-filters__title">
              <Icon name="filter_list" size={20} aria-hidden="true" />
              Filtros
            </h2>

            <div className="approvals-filters__group" role="group" aria-label="Tipo de solicitud">
              <label className="approvals-check">
                <input
                  type="checkbox"
                  checked={tipos.veterinaria}
                  onChange={() => toggleTipo('veterinaria')}
                />
                <span>Veterinarias</span>
              </label>
              <label className="approvals-check">
                <input
                  type="checkbox"
                  checked={tipos.almacen}
                  onChange={() => toggleTipo('almacen')}
                />
                <span>Almacenes</span>
              </label>
            </div>

            <div className="approvals-filters__divider" aria-hidden="true" />

            <span className="approvals-filters__label">Urgencia</span>
            <div className="approvals-filters__chips" role="group" aria-label="Filtrar por urgencia">
              {Object.entries(URGENCIA_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  className={`approvals-chip ${urgencias.includes(key) ? 'approvals-chip--active' : ''}`.trim()}
                  aria-pressed={urgencias.includes(key)}
                  onClick={() => toggleUrgencia(key)}
                >
                  <Icon name={cfg.icon} size={14} filled={cfg.filled} aria-hidden="true" />
                  {cfg.label}
                </button>
              ))}
            </div>
          </section>

          <section className="approvals-activity" aria-label="Actividad reciente">
            <h3 className="approvals-activity__title">Actividad Reciente</h3>
            {actividad.length === 0 ? (
              <p className="approvals-activity__empty">Aún no hay actividad.</p>
            ) : (
              <ul className="approvals-activity__list">
                {actividad.map((a) => {
                  const esAprobada = a._accion ? a._accion === 'aprobar' : getEstado(a) === 'aprobado'
                  const momento = a._ts ? new Date(a._ts).toISOString() : fechaDe(a)
                  return (
                    <li key={`${a.tipo}-${a.id}`} className="approvals-activity__item">
                      <span
                        className={`approvals-activity__icon ${esAprobada ? 'approvals-activity__icon--ok' : 'approvals-activity__icon--no'}`.trim()}
                        aria-hidden="true"
                      >
                        <Icon name={esAprobada ? 'check' : 'close'} size={16} />
                      </span>
                      <span className="approvals-activity__text">
                        <span className="approvals-activity__title-line">
                          {tipoLabel(a)} de &quot;{a.nombre}&quot; {esAprobada ? 'aprobado' : 'rechazado'}
                        </span>
                        <span className="approvals-activity__meta">
                          {esAprobada ? timeAgo(momento) : (a.motivoRechazo || 'Sin motivo registrado')}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </aside>

        {/* Feed de aprobaciones */}
        <section className="approvals-feed" id="approvals-feed" aria-label="Solicitudes pendientes">
          {listStatus === 'loading' && (
            <div className="approvals-loading" role="status" aria-label="Cargando solicitudes">
              <span className="spinner" />
            </div>
          )}

          {listStatus === 'error' && (
            <div className="approvals-error" role="alert">
              <Icon name="error" size={22} aria-hidden="true" />
              <p>{listError}</p>
              <Button variant="outline" size="sm" icon="refresh" onClick={retry}>
                Reintentar
              </Button>
            </div>
          )}

          {listStatus === 'loaded' && almacenesStatus === 'error' && (
            <div className="approvals-error" role="alert">
              <Icon name="error" size={22} aria-hidden="true" />
              <p>No se pudieron cargar las solicitudes de almacén.</p>
              <Button variant="outline" size="sm" icon="refresh" onClick={retry}>
                Reintentar
              </Button>
            </div>
          )}

          {listStatus === 'loaded' && mostrarVacio && (
            <EmptyState
              variant="dashed"
              icon="task_alt"
              title={hayPendientesSinFiltro ? 'Sin solicitudes con estos filtros' : '¡Todo al día!'}
              description={
                hayPendientesSinFiltro
                  ? 'Ajusta los filtros para ver más solicitudes pendientes.'
                  : 'No hay solicitudes pendientes por revisar.'
              }
            />
          )}

          {pendientes.map((item, index) => (
            <div
              key={`${item.tipo}-${item.id}`}
              ref={setItemRef(itemKey(item))}
            >
              <ApprovalCard
                item={item}
                index={index}
                leaving={leaving}
                loadingId={loadingId}
                onVerDetalles={(s) => { setDetailSolicitud(s); setConfirmAction(null) }}
                onAprobar={handleCardAprobar}
                onRechazar={handleCardRechazar}
              />
            </div>
          ))}
        </section>
      </div>

      {/* ============================================================ modal */}
      <Modal open={!!detailSolicitud} onClose={cerrarModal} className="approvals-modal">
        {detailSolicitud && (
          <div role="dialog" aria-modal="true" aria-label="Detalle de la solicitud">
            <div className="approval-modal-hero">
              <button
                type="button"
                className="approval-modal-close"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                <Icon name="close" size={18} />
              </button>
              <div>
                <h2 className="approval-modal-title">{detailSolicitud.nombre}</h2>
                <p className="approval-modal-sub">
                  Solicitado {formatDateFull(fechaDe(detailSolicitud))}
                </p>
              </div>
              <Badge variant={statusBadge(getEstado(detailSolicitud)).variant} className="approval-modal-badge">
                {statusBadge(getEstado(detailSolicitud)).label}
              </Badge>
            </div>

            <div className="approval-modal-body">
              {detailSolicitud.tipo === 'almacen' ? (
                <Section
                  title="Informacion del almacen"
                  fields={[
                    { label: 'Nombre', value: detailSolicitud.nombre },
                    { label: 'Cedula juridica', value: detailSolicitud.cedulaJuridica },
                    { label: 'Telefono', value: detailSolicitud.telefono },
                    { label: 'Email', value: detailSolicitud.email },
                    { label: 'Tipo de almacen', value: detailSolicitud.tipoAlmacen },
                    { label: 'Responsable', value: detailSolicitud.nombreResponsable },
                    { label: 'Capacidad', value: detailSolicitud.capacidadAlmacenamiento },
                    { label: 'Control de temperatura', value: detailSolicitud.controlTemperatura },
                    { label: 'Direccion', value: detailSolicitud.direccion, full: true },
                    { label: 'Descripcion', value: detailSolicitud.descripcion, full: true },
                  ]}
                />
              ) : (
                <Section
                  title="Informacion del comercio"
                  fields={[
                    { label: 'Nombre', value: detailSolicitud.nombre },
                    { label: 'Cedula juridica', value: detailSolicitud.cedulaJuridica },
                    { label: 'Telefono', value: detailSolicitud.telefono },
                    { label: 'Email', value: detailSolicitud.email },
                    { label: 'Horario', value: detailSolicitud.horario },
                    { label: 'Direccion', value: detailSolicitud.direccion, full: true },
                    { label: 'Descripcion', value: detailSolicitud.descripcion, full: true },
                  ]}
                />
              )}

              <div className="approval-modal-section">
                <span className="approval-info-label">Documentacion</span>
                <p className="approval-modal-docs">
                  {detailSolicitud.documentoPersoneriaJuridica
                    ? 'Documento de personeria juridica adjunto'
                    : 'Sin documentacion adjunta'}
                </p>
              </div>

              {getEstado(detailSolicitud) === 'pendiente' && !confirmAction && !rechazarOpen && (
                <div className="approval-modal-actions">
                  <Button variant="danger" onClick={() => setRechazarOpen(true)}>Rechazar</Button>
                  <Button variant="primary" onClick={() => setConfirmAction('aprobar')}>Aprobar</Button>
                </div>
              )}

              {confirmAction === 'aprobar' && (
                <div className="approval-confirm-panel approval-confirm-panel--approve">
                  <p className="approval-confirm-text">
                    ¿Está seguro de aprobar esta solicitud?
                  </p>
                  <div className="approval-confirm-actions">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)} disabled={submitting}>
                      Cancelar
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => approveSolicitud(detailSolicitud).then((ok) => { if (ok) cerrarModal() })} disabled={submitting}>
                      {submitting ? 'Aprobando...' : 'Confirmar aprobación'}
                    </Button>
                  </div>
                </div>
              )}

              {rechazarOpen && (
                <div className="approval-confirm-panel approval-confirm-panel--reject">
                  <label className="approval-reject-label" htmlFor="motivo-rechazo">
                    Motivo de rechazo
                  </label>
                  <textarea
                    id="motivo-rechazo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Indique el motivo del rechazo..."
                    rows={3}
                    className="approval-reject-input"
                  />
                  <div className="approval-confirm-actions">
                    <Button variant="ghost" size="sm" onClick={() => { setRechazarOpen(false); setMotivo('') }} disabled={submitting}>
                      Cancelar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleConfirmRechazar(detailSolicitud)}
                      disabled={submitting || !motivo.trim()}
                    >
                      {submitting ? 'Rechazando...' : 'Confirmar rechazo'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Section({ title, fields }) {
  return (
    <div className="approval-modal-section">
      <span className="approval-info-label">{title}</span>
      <div className="approval-info-grid">
        {fields.map((f, i) => (
          <div key={i} style={f.full ? { gridColumn: '1 / -1' } : {}}>
            <span className="approval-info-label">{f.label}</span>
            <p className="approval-info-value">{f.value || '---'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}