import { useMemo, useState } from 'react'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { Timeline } from '../../../shared/components/Timeline/Timeline'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { useTraslados } from '../hooks/useTraslados'
import { TrasladoMap } from '../components/TrasladoMap'
import {
  construirEventosTimeline,
  formatFecha,
  puntoDestino,
  puntoOrigen,
} from '../utils/coordsTraslado'
import './TrasladosPage.css'

/* Filtros de estado (mismos valores que el hook: 'todos' | estado exacto). */
const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'Solicitado', label: 'Pendientes' },
  { id: 'Aceptado', label: 'Aceptados' },
  { id: 'Rechazado', label: 'Rechazados' },
]

const STATS_MAP = { todos: 'total', Solicitado: 'pendientes', Aceptado: 'aceptados', Rechazado: 'rechazados' }

/* Nombres resueltos con los listados ya cargados por el hook (mascotas de
   /usuarios/me/veterinaria-info y veterinarias de /veterinarias/aprobadas).
   El GET de traslados no incluye las navegaciones, así que el fallback
   muestra el id (mismo criterio que la página anterior). */
function mascotaNombre(traslado, mascotas) {
  return mascotas.find((m) => Number(m.id) === Number(traslado.mascotaId))?.nombre || `Mascota #${traslado.mascotaId}`
}

function vetOrigenNombre(traslado, veterinarias) {
  return veterinarias.find((v) => Number(v.id) === Number(traslado.veterinariaOrigenId))?.nombre || `Veterinaria #${traslado.veterinariaOrigenId}`
}

function vetDestinoNombre(traslado, veterinarias) {
  return veterinarias.find((v) => Number(v.id) === Number(traslado.veterinariaDestinoId))?.nombre || `Veterinaria #${traslado.veterinariaDestinoId}`
}

function solicitanteNombre(traslado) {
  return traslado.solicitadoPor?.nombre || `Usuario #${traslado.solicitadoPorId ?? '?'}`
}

/* Etiqueta del ciclo logístico (wireframe: En Tránsito / Programado /
   Completado). Es un campo REAL del backend (EstadoLogistica). */
const LOGISTICA_LABEL = {
  Programado: 'Programado',
  EnTransito: 'En tránsito',
  Completado: 'Completado',
}

/* ---------------------------------------------------------------------------
   Stat bento (patrón wireframe traslados_openpaw): 4 tarjetas con icono en
   círculo tintado + glow decorativo por esquina (misma base que inventario).
   --------------------------------------------------------------------------- */
function StatCard({ label, value, icon, tone }) {
  return (
    <div className={`trl-stat trl-stat--${tone}`}>
      <span className="trl-stat__glow" aria-hidden="true" />
      <div className="trl-stat__row">
        <span className="trl-stat__icon" aria-hidden="true">
          <Icon name={icon} size={24} filled />
        </span>
      </div>
      <div className="trl-stat__text">
        <p className="trl-stat__label">{label}</p>
        <p className="trl-stat__value">{value.toLocaleString('es-CR')}</p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Card de traslado (wireframe: avatar + nombre + ID, Badge de estado, ruta
   origen→destino con conector punteado, pie con comentario/estado).
   --------------------------------------------------------------------------- */
function TrasladoCard({
  traslado,
  mascota,
  origen,
  destino,
  puedeResponder,
  seleccionado,
  onSeleccionar,
  onAceptar,
  onRechazar,
  estadoVariant,
  estadoLabel,
}) {
  const idLabel = `#TR-${String(traslado.id).padStart(4, '0')}`
  const badgeIcon = traslado.estado === 'Aceptado' ? 'check_circle'
    : traslado.estado === 'Rechazado' ? 'cancel' : 'schedule'

  return (
    <article
      className={`trl-card ${seleccionado ? 'is-selected' : ''}`}
      aria-label={`Traslado de ${mascota}`}
    >
      <header className="trl-card__top">
        <div className="trl-card__id">
          <span className="trl-card__avatar" aria-hidden="true">
            {mascota.charAt(0).toUpperCase()}
          </span>
          <div>
            <h3 className="trl-card__mascota">{mascota}</h3>
            <span className="trl-card__meta">{idLabel} · {formatFecha(traslado.fechaSolicitud)}</span>
          </div>
        </div>
        <div className="trl-card__top-actions">
          <button
            type="button"
            className={`trl-card__route-btn ${seleccionado ? 'is-active' : ''}`.trim()}
            aria-label={`Ver ruta de ${mascota}`}
            aria-pressed={seleccionado}
            title="Ver ruta en el mapa"
            onClick={() => onSeleccionar(traslado.id)}
          >
            <Icon name="route" size={18} />
          </button>
          <Badge variant={estadoVariant} icon={badgeIcon}>{estadoLabel}</Badge>
        </div>
      </header>

      {/* Ruta origen → destino (patrón wireframe: dos paradas + conector) */}
      <div className="trl-card__route">
        <div className="trl-card__stop">
          <span className="trl-card__stop-dot trl-card__stop-dot--origen" aria-hidden="true" />
          <div className="trl-card__stop-info">
            <span className="trl-card__stop-label">Origen</span>
            <span className="trl-card__stop-name">{origen}</span>
            {traslado.salida && <span className="trl-card__stop-time">Salida: {formatFecha(traslado.salida)}</span>}
          </div>
        </div>
        <div className="trl-card__stop">
          <span className="trl-card__stop-dot trl-card__stop-dot--destino" aria-hidden="true">
            <Icon name="location_on" size={12} />
          </span>
          <div className="trl-card__stop-info">
            <span className="trl-card__stop-label">Destino</span>
            <span className="trl-card__stop-name">{destino}</span>
            {traslado.etaLlegada && <span className="trl-card__stop-time">Llegada est.: {formatFecha(traslado.etaLlegada)}</span>}
          </div>
        </div>
      </div>

      {traslado.comentario && (
        <p className="trl-card__note">
          <Icon name="chat" size={16} aria-hidden="true" />
          {traslado.comentario}
        </p>
      )}
      {traslado.estado === 'Rechazado' && traslado.motivoRechazo && (
        <p className="trl-card__note trl-card__note--error">
          <Icon name="error" size={16} aria-hidden="true" />
          Motivo de rechazo: {traslado.motivoRechazo}
        </p>
      )}
      {traslado.estado === 'Aceptado' && (
        <p className="trl-card__note trl-card__note--ok">
          <Icon name="check_circle" size={16} aria-hidden="true" />
          Aceptado el {formatFecha(traslado.fechaRespuesta)}
        </p>
      )}

      {puedeResponder && (
        <footer className="trl-card__actions">
          <Button variant="success" size="sm" icon="check" onClick={() => onAceptar(traslado)}>
            Aceptar
          </Button>
          <Button variant="outline" size="sm" icon="close" onClick={() => onRechazar(traslado)}>
            Rechazar
          </Button>
        </footer>
      )}
    </article>
  )
}

export function TrasladosPage() {
  const {
    esCliente, esVeterinaria, veterinariaPropiaId,
    traslados, pendientesPropios, filtradasPorEstado, mascotas, veterinarias,
    listStatus, listError, modalOpen, form, errors, submitStatus, submitError,
    activeState, setActiveState,
    abrirNueva, cerrar, handleChange, guardar,
    confirmState, confirmLoading, motivoRechazo, setMotivoRechazo,
    solicitarAceptar, solicitarRechazar, cancelarConfirmacion, ejecutarConfirmacion,
    ESTADO_VARIANT, ESTADO_LABEL,
  } = useTraslados()

  /* Traslado seleccionado para el mapa punto a punto y el timeline. Si el id
     ya no está en el filtro activo, cae al primero del filtro (sin effects). */
  const [seleccionadoId, setSeleccionadoId] = useState(null)
  const seleccionado = filtradasPorEstado.find((t) => Number(t.id) === Number(seleccionadoId)) ?? filtradasPorEstado[0] ?? null

  const cambiarFiltro = (estado) => {
    setActiveState(estado)
    setSeleccionadoId(null)
  }

  const stats = useMemo(() => ({
    total: traslados.length,
    pendientes: traslados.filter((t) => t.estado === 'Solicitado').length,
    aceptados: traslados.filter((t) => t.estado === 'Aceptado').length,
    rechazados: traslados.filter((t) => t.estado === 'Rechazado').length,
  }), [traslados])

  const filtrosConConteo = useMemo(
    () => FILTROS.map((f) => ({ ...f, count: stats[STATS_MAP[f.id]] })),
    [stats]
  )

  /* Puntos del mapa: coordenadas reales del backend o aproximación posicional
     documentada (utils/coordsTraslado). */
  const puntoOrigenSel = seleccionado ? puntoOrigen(seleccionado, veterinarias) : null
  const puntoDestinoSel = seleccionado ? puntoDestino(seleccionado, veterinarias) : null
  const coordsAproximadas = Boolean(
    puntoOrigenSel && puntoDestinoSel && (!puntoOrigenSel.esReal || !puntoDestinoSel.esReal)
  )

  const eventosTimeline = seleccionado
    ? construirEventosTimeline(seleccionado, {
        mascota: mascotaNombre(seleccionado, mascotas),
        origen: vetOrigenNombre(seleccionado, veterinarias),
        destino: vetDestinoNombre(seleccionado, veterinarias),
      })
    : []

  const tituloPagina = 'Traslados'
  const subtituloPagina = esCliente
    ? 'Solicita el traslado del expediente de tu mascota a otra veterinaria y sigue la ruta y el estado de cada solicitud.'
    : esVeterinaria
      ? 'Gestiona las solicitudes de traslado recibidas y consulta la ruta de cada expediente entre veterinarias.'
      : 'Listado de traslados de expedientes entre veterinarias con su ruta y estado.'

  const ordenados = [...filtradasPorEstado]
    .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud))

  return (
    <AppShell>
      <div className="trl-page">
        {/* ---------------------------------------------------------- header */}
        <header className="trl-header">
          <div>
            <span className="trl-eyebrow">Logística de Pacientes</span>
            <h1 className="trl-title">{tituloPagina}</h1>
            <p className="trl-subtitle">{subtituloPagina}</p>
          </div>
          {esCliente && (
            <Button variant="primary" size="md" icon="add_location_alt" onClick={abrirNueva}>
              Solicitar traslado
            </Button>
          )}
        </header>

        {/* ---------------------------------------------------------- stats */}
        <div className="trl-stats" role="group" aria-label="Resumen de traslados">
          <StatCard label="Total traslados" value={stats.total} icon="moving" tone="total" />
          <StatCard label="Pendientes" value={stats.pendientes} icon="schedule" tone="pendiente" />
          <StatCard label="Aceptados" value={stats.aceptados} icon="check_circle" tone="ok" />
          <StatCard label="Rechazados" value={stats.rechazados} icon="cancel" tone="rechazado" />
        </div>

        {/* -------------------------------------------- main: split layout */}
        <div className="trl-main">
          {/* Columna izquierda: mapa punto a punto + timeline */}
          <aside className="trl-side" aria-label="Mapa y historial del traslado seleccionado">
            <section className="trl-panel" aria-label="Mapa de ruta del traslado">
              <div className="trl-panel__head">
                <h3 className="trl-panel__title">Ruta de traslado</h3>
                {seleccionado && (
                  <span className="trl-panel__sub">{mascotaNombre(seleccionado, mascotas)}</span>
                )}
              </div>

              {listStatus === 'loaded' && seleccionado ? (
                <div className="trl-map">
                  <TrasladoMap
                    origen={{ ...puntoOrigenSel, nombre: vetOrigenNombre(seleccionado, veterinarias) }}
                    destino={{ ...puntoDestinoSel, nombre: vetDestinoNombre(seleccionado, veterinarias) }}
                    estadoLogistica={seleccionado.estadoLogistica}
                    ariaLabel={`Mapa de la ruta de ${mascotaNombre(seleccionado, mascotas)} desde ${vetOrigenNombre(seleccionado, veterinarias)} hasta ${vetDestinoNombre(seleccionado, veterinarias)}`}
                  />
                  <div className="trl-map__overlay" aria-hidden="true" />
                  <div className="trl-map__caption">
                    <div className="trl-map__route">
                      <span className={`trl-map__pulse ${seleccionado.estadoLogistica === 'EnTransito' ? 'is-live' : ''}`} aria-hidden="true" />
                      <div>
                        <p className="trl-map__caption-label">
                          {LOGISTICA_LABEL[seleccionado.estadoLogistica] || 'Programado'}
                        </p>
                        <p className="trl-map__caption-route">
                          {vetOrigenNombre(seleccionado, veterinarias)} → {vetDestinoNombre(seleccionado, veterinarias)}
                        </p>
                      </div>
                    </div>
                    {coordsAproximadas && (
                      <span className="trl-map__approx" title="El backend no expone coordenadas de estas veterinarias; se muestra una posición aproximada en Costa Rica (ver utils/coordsTraslado).">
                        <Icon name="info" size={14} aria-hidden="true" />
                        Coordenadas aproximadas
                      </span>
                    )}
                  </div>
                </div>
              ) : listStatus === 'loaded' ? (
                <div className="trl-panel__empty" role="status">
                  <Icon name="map" size={32} aria-hidden="true" />
                  <p>Selecciona un traslado para ver su ruta.</p>
                </div>
              ) : (
                <div className="trl-panel__loading" role="status" aria-label="Cargando mapa">
                  <span className="spinner" />
                </div>
              )}
            </section>

            {/* Timeline: historial del traslado (datos reales del backend:
                solicitud, logística y aprobación). */}
            <section className="trl-panel" aria-label="Historial del traslado">
              <div className="trl-panel__head">
                <h3 className="trl-panel__title">Historial del traslado</h3>
              </div>
              {listStatus === 'loaded' && seleccionado ? (
                <Timeline
                  items={eventosTimeline}
                  ariaLabel={`Historial del traslado de ${mascotaNombre(seleccionado, mascotas)}`}
                />
              ) : listStatus === 'loaded' ? (
                <div className="trl-panel__empty" role="status">
                  <Icon name="history" size={32} aria-hidden="true" />
                  <p>Selecciona un traslado para ver su historial.</p>
                </div>
              ) : (
                <div className="trl-panel__loading" role="status" aria-label="Cargando historial">
                  <span className="spinner" />
                </div>
              )}
            </section>
          </aside>

          {/* Columna principal: solicitudes pendientes + listado */}
          <section className="trl-content" aria-label="Solicitudes de traslado">
            {esVeterinaria && (
              <section className="trl-pending" aria-label="Solicitudes de traslado pendientes recibidas">
                <div className="trl-pending__head">
                  <h2>Solicitudes pendientes</h2>
                  <span className={`trl-pending__count ${pendientesPropios.length > 0 ? 'has-pending' : ''}`}>
                    {pendientesPropios.length} {pendientesPropios.length === 1 ? 'pendiente' : 'pendientes'}
                  </span>
                </div>
                {listStatus === 'loaded' && pendientesPropios.length === 0 ? (
                  <p className="trl-pending__empty">
                    <Icon name="inbox" size={16} aria-hidden="true" />
                    No hay solicitudes pendientes.
                  </p>
                ) : (
                  <ul className="trl-pending__list">
                    {pendientesPropios.map((traslado) => (
                      <li key={traslado.id} className="trl-pending__item">
                        <div className="trl-pending__info">
                          <p className="trl-pending__mascota">
                            <Icon name="pets" size={16} aria-hidden="true" />
                            {mascotaNombre(traslado, mascotas)}
                          </p>
                          <p className="trl-pending__meta">
                            <Icon name="local_hospital" size={14} aria-hidden="true" />
                            De: {vetOrigenNombre(traslado, veterinarias)}
                          </p>
                          <p className="trl-pending__meta">
                            <Icon name="person" size={14} aria-hidden="true" />
                            Solicitado por: {solicitanteNombre(traslado)}
                          </p>
                          <p className="trl-pending__meta">
                            <Icon name="schedule" size={14} aria-hidden="true" />
                            {formatFecha(traslado.fechaSolicitud)}
                          </p>
                          {traslado.comentario && (
                            <p className="trl-pending__notes">
                              <Icon name="chat" size={14} aria-hidden="true" />
                              {traslado.comentario}
                            </p>
                          )}
                        </div>
                        <div className="trl-pending__actions">
                          <Button variant="success" size="sm" icon="check" onClick={() => solicitarAceptar(traslado)}>
                            Aceptar
                          </Button>
                          <Button variant="outline" size="sm" icon="close" onClick={() => solicitarRechazar(traslado)}>
                            Rechazar
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <div className="trl-card-list" aria-label="Listado de traslados">
              <div className="trl-toolbar">
                <div className="trl-chips" role="group" aria-label="Filtrar por estado de traslado">
                  {filtrosConConteo.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`trl-chip ${activeState === f.id ? 'is-active' : ''}`.trim()}
                      aria-pressed={activeState === f.id}
                      onClick={() => cambiarFiltro(f.id)}
                    >
                      {f.label} <span className="trl-chip__count">{f.count}</span>
                    </button>
                  ))}
                </div>
                <span className="trl-toolbar__hint" aria-hidden="true">
                  <Icon name="filter_list" size={20} />
                  Filtros
                </span>
              </div>

              {listStatus === 'loading' && (
                <div className="trl-loading" role="status" aria-label="Cargando traslados">
                  <span className="spinner" />
                </div>
              )}
              {listStatus === 'error' && <p className="submit-error">{listError}</p>}

              {listStatus === 'loaded' && filtradasPorEstado.length === 0 && (
                <EmptyState
                  icon="swap_horiz"
                  title="Sin traslados"
                  description="No hay traslados para este filtro."
                  action={esCliente
                    ? <Button variant="primary" size="md" icon="add_location_alt" onClick={abrirNueva}>Solicitar traslado</Button>
                    : undefined}
                />
              )}

              {listStatus === 'loaded' && filtradasPorEstado.length > 0 && (
                <div className="trl-grid">
                  {ordenados.map((traslado) => (
                    <TrasladoCard
                      key={traslado.id}
                      traslado={traslado}
                      mascota={mascotaNombre(traslado, mascotas)}
                      origen={vetOrigenNombre(traslado, veterinarias)}
                      destino={vetDestinoNombre(traslado, veterinarias)}
                      puedeResponder={esVeterinaria && traslado.estado === 'Solicitado' && veterinariaPropiaId && Number(traslado.veterinariaDestinoId) === veterinariaPropiaId}
                      seleccionado={Number(seleccionado?.id) === Number(traslado.id)}
                      onSeleccionar={setSeleccionadoId}
                      onAceptar={solicitarAceptar}
                      onRechazar={solicitarRechazar}
                      estadoVariant={ESTADO_VARIANT[traslado.estado] || 'pending'}
                      estadoLabel={ESTADO_LABEL[traslado.estado] || traslado.estado}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ---------------------------------------------- modal solicitar */}
        <Modal open={modalOpen} onClose={cerrar} className="traslados-modal">
          <div>
            <h2>Solicitar traslado de expediente</h2>
            <form onSubmit={guardar} noValidate>
              <div className="field-grid">
                <label className="field">
                  <span>Mascota</span>
                  <select name="mascotaId" value={form.mascotaId} onChange={handleChange}>
                    <option value="">Seleccionar mascota...</option>
                    {mascotas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  {errors.mascotaId && <small>{errors.mascotaId}</small>}
                </label>
                <label className="field">
                  <span>Veterinaria destino</span>
                  <select name="veterinariaDestinoId" value={form.veterinariaDestinoId} onChange={handleChange}>
                    <option value="">Seleccionar veterinaria...</option>
                    {veterinarias.map((v) => (
                      <option key={v.id} value={v.id}>{v.nombre}</option>
                    ))}
                  </select>
                  {errors.veterinariaDestinoId && <small>{errors.veterinariaDestinoId}</small>}
                </label>
                <label className="field traslados-modal__comentario">
                  <span>Comentario (opcional)</span>
                  <textarea name="comentario" value={form.comentario} onChange={handleChange} rows="3" placeholder="Mensaje para la veterinaria destino" />
                </label>
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="traslados-modal__actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Enviando...' : 'Solicitar traslado'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* ------------------------------------- ConfirmDialog aceptar/rechazar */}
        <ConfirmDialog
          open={!!confirmState}
          title={
            confirmState?.tipo === 'aceptar' ? '¿Aceptar traslado?' :
            confirmState?.tipo === 'rechazar' ? '¿Rechazar traslado?' : ''
          }
          message={
            confirmState?.traslado
              ? confirmState.tipo === 'aceptar'
                ? `Al aceptar, la veterinaria de cabecera de "${mascotaNombre(confirmState.traslado, mascotas)}" pasara a ser ${vetDestinoNombre(confirmState.traslado, veterinarias)}.`
                : `Indica el motivo por el que se rechaza el traslado de "${mascotaNombre(confirmState.traslado, mascotas)}".`
              : ''
          }
          confirmLabel={
            confirmState?.tipo === 'aceptar' ? 'Aceptar' :
            confirmState?.tipo === 'rechazar' ? 'Rechazar' : 'Confirmar'
          }
          variant={confirmState?.tipo === 'aceptar' ? 'success' : 'danger'}
          loading={confirmLoading}
          onConfirm={ejecutarConfirmacion}
          onCancel={cancelarConfirmacion}
        >
          {confirmState?.tipo === 'rechazar' && (
            <label className="field traslados-rechazo">
              <span>Motivo de rechazo</span>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows="3"
                placeholder="Motivo obligatorio"
              />
            </label>
          )}
        </ConfirmDialog>
      </div>
    </AppShell>
  )
}

export default TrasladosPage