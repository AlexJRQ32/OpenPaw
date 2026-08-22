import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { Icon } from '../../../shared/components/Icon/Icon'
import { useCitas } from '../hooks/useCitas'
import './CitasPage.css'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const ESTADOS_FILTRO = ['todas', 'Pendiente', 'Confirmada', 'EnProgreso', 'Completada', 'Cancelada']
const CATEGORIAS_SERVICIO = ['Consulta', 'Grooming', 'Procedimiento']

/* Iconos Material Symbols por estado (wireframe: check_circle/schedule/done_all) */
const ESTADO_ICON = {
  Pendiente: 'schedule',
  Confirmada: 'check_circle',
  EnProgreso: 'autorenew',
  Completada: 'done_all',
  Cancelada: 'cancel',
}

const fechaLarga = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })

function formatHora(iso) {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
}

function fechaLegible(iso) {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/* Comparador de fecha seguro para sort: fechas inválidas van al final (no NaN) */
function porFecha(a, b) {
  const fa = new Date(a.fechaHora).getTime()
  const fb = new Date(b.fechaHora).getTime()
  return (Number.isNaN(fa) ? Number.MAX_SAFE_INTEGER : fa) - (Number.isNaN(fb) ? Number.MAX_SAFE_INTEGER : fb)
}

function esMismoDia(a, b = new Date()) {
  if (!a) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function tituloFecha(fecha) {
  if (!fecha) return ''
  const label = fechaLarga.format(fecha)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/* Avatar de mascota: usa la foto real cuando existe; si no, fallback pets (M3). */
function MascotaAvatar({ mascota, nombre, size = 48 }) {
  if (mascota?.fotoUrl) {
    return (
      <img
        className="cita-card__avatar"
        src={mascota.fotoUrl}
        alt={`Foto de ${mascota.nombre || nombre}`}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <span className="cita-card__avatar cita-card__avatar--fallback" aria-hidden="true">
      <Icon name="pets" size={size - 18} filled />
    </span>
  )
}

export function CitasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    esCliente, citas, citasEnFecha, filtradasPorEstado, mascotas, veterinarias, servicios, categoriasFiltro,
    listStatus, listError, modalOpen, editando, form, errors, submitStatus, submitError,
    monthDate, setMonthDate, activeState, setActiveState, activeCategoria, setActiveCategoria,
    abrirNueva, abrirEditar, cerrar, handleChange, guardar,
    confirmState, confirmLoading, nuevaFecha, setNuevaFecha,
    solicitarAceptar, solicitarRechazar, solicitarCancelar, solicitarReprogramar,
    cancelarConfirmacion, ejecutarConfirmacion,
    ESTADO_VARIANT, ESTADO_LABEL, tipoCitaDe, toneTipoCita,
  } = useCitas()

  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const pendientes = citas.filter((c) => c.estado === 'Pendiente')

  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const today = new Date()

  const cambiarMes = (delta) => {
    const nueva = new Date(year, month + delta, 1)
    setMonthDate(nueva)
    // Mantener la selección dentro del mes visible: hoy si está en él, si no el día 1
    if (today.getFullYear() === nueva.getFullYear() && today.getMonth() === nueva.getMonth()) {
      setSelectedDate(new Date())
    } else {
      setSelectedDate(nueva)
    }
  }

  const irHoy = () => {
    const hoy = new Date()
    setMonthDate(hoy)
    setSelectedDate(hoy)
  }

  /* Al cambiar de mes la selección se re-ancla en cambiarMes/irHoy, así que
     el día seleccionado siempre pertenece al mes visible (sin efectos). */

  // Si llegamos desde el marketplace con ?servicio=...&veterinariaId=..., abrir el modal
  // con ese servicio precargado para que el usuario solo elija mascota y fecha/hora.
  useEffect(() => {
    const servicio = searchParams.get('servicio')
    const veterinariaId = searchParams.get('veterinariaId')
    if (!servicio || !veterinariaId) return
    const precio = searchParams.get('precio')
    abrirNueva(veterinariaId, {
      nombre: servicio,
      precio: precio != null && !Number.isNaN(Number(precio)) ? Number(precio) : null,
    })
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Citas del mes visible agrupadas por día (evita filtrar 42 celdas). */
  const citasPorDia = useMemo(() => {
    const mapa = {}
    for (const c of citas) {
      if (c.estado === 'Cancelada') continue
      const f = new Date(c.fechaHora)
      if (Number.isNaN(f.getTime())) continue
      if (f.getFullYear() === year && f.getMonth() === month) {
        const d = f.getDate()
        ;(mapa[d] ??= []).push(c)
      }
    }
    return mapa
  }, [citas, year, month])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7 // semana empieza en lunes (wireframe)
  const totalCeldas = Math.ceil((offset + daysInMonth) / 7) * 7
  const daysPrevMonth = new Date(year, month, 0).getDate()

  const prevCeldas = []
  for (let i = offset - 1; i >= 0; i--) prevCeldas.push(daysPrevMonth - i)
  const trailing = totalCeldas - offset - daysInMonth
  const nextCeldas = []
  for (let i = 1; i <= trailing; i++) nextCeldas.push(i)

  /* Día seleccionado: citas ordenadas por hora + desglose mañana/tarde. */
  const citasSeleccionadas = citasEnFecha(selectedDate)
    .slice()
    .sort(porFecha)
  const esHoySeleccionado = esMismoDia(selectedDate)
  const citasTarde = citasSeleccionadas.filter((c) => new Date(c.fechaHora).getHours() >= 12).length
  const citasManana = citasSeleccionadas.length - citasTarde

  const mascotaDe = (id) => mascotas.find((m) => m.id === id)

  return (
    <AppShell>
      <div className="citas-page">
        <header className="citas-hero">
          <div>
            <span className="citas-eyebrow">Calendario</span>
            <h1 className="citas-title">Gestión de Citas</h1>
            <p className="citas-subtitle">
              {esCliente ? 'Elige una veterinaria y agenda tu cita.' : 'Programa y gestiona las citas veterinarias.'}
            </p>
          </div>
          {!esCliente && (
            <Button variant="primary" size="md" icon="add" onClick={() => abrirNueva()}>
              Nueva cita
            </Button>
          )}
        </header>

        {/* Veterinaria/Admin: solicitudes de citas por aceptar (funcionalidad conservada) */}
        {!esCliente && (
          <section className="citas-requests" aria-label="Solicitudes de citas">
            <div className="citas-requests-head">
              <h2 className="citas-requests-title">Solicitudes de citas</h2>
              <Badge variant={pendientes.length > 0 ? 'warning' : 'neutral'}>
                {pendientes.length} {pendientes.length === 1 ? 'pendiente' : 'pendientes'}
              </Badge>
            </div>
            {listStatus === 'loaded' && pendientes.length === 0 ? (
              <div className="citas-requests-empty">
                <Icon name="inbox" size={20} />
                No hay solicitudes pendientes.
              </div>
            ) : (
              <div className="citas-requests-list">
                {pendientes.map((cita) => (
                  <article key={cita.id} className="citas-request-item">
                    <div className="citas-request-info">
                      <p className="citas-request-servicio">{cita.servicio || 'Cita veterinaria'}</p>
                      <p className="citas-request-meta">
                        <Icon name="pets" size={14} />
                        {cita.mascotaNombre || `Mascota #${cita.mascotaId}`}
                      </p>
                      <p className="citas-request-meta">
                        <Icon name="person" size={14} />
                        {cita.usuarioNombre || `Usuario #${cita.usuarioId}`}
                      </p>
                      <p className="citas-request-meta">
                        <Icon name="schedule" size={14} />
                        {fechaLegible(cita.fechaHora)} · {formatHora(cita.fechaHora)}
                      </p>
                      {cita.notas && (
                        <p className="citas-request-notes">
                          <Icon name="comment" size={14} />
                          {cita.notas}
                        </p>
                      )}
                    </div>
                    <div className="citas-request-actions">
                      <Button variant="success" size="sm" icon="check" onClick={() => solicitarAceptar(cita)}>
                        Aceptar
                      </Button>
                      <Button variant="danger" size="sm" icon="close" onClick={() => solicitarRechazar(cita)}>
                        Rechazar
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Cliente: catálogo de veterinarias para sacar cita (funcionalidad conservada) */}
        {esCliente && (
          <section className="citas-vets" aria-label="Veterinarias disponibles">
            <div className="citas-vets-head">
              <h2 className="citas-vets-title">Veterinarias aliadas</h2>
              <Badge variant="primary">{veterinarias.length} disponibles</Badge>
            </div>
            {listStatus === 'loaded' && veterinarias.length === 0 ? (
              <EmptyState icon="local_hospital" title="Sin veterinarias" description="No hay veterinarias disponibles por ahora." />
            ) : (
              <div className="citas-vets-grid">
                {veterinarias.map((v) => (
                  <article key={v.id} className="citas-vet-card">
                    <div className="citas-vet-card__top">
                      <span className="citas-vet-card__avatar"><Icon name="local_hospital" size={22} /></span>
                      <div>
                        <h3>{v.nombre}</h3>
                        {v.direccion && (
                          <p className="citas-vet-card__dir">
                            <Icon name="location_on" size={14} />
                            {v.direccion}
                          </p>
                        )}
                      </div>
                    </div>
                    {v.descripcion && <p className="citas-vet-card__desc">{v.descripcion}</p>}
                    <div className="citas-vet-card__foot">
                      <span className="citas-vet-card__horario">
                        <Icon name="schedule" size={14} />
                        {v.horario || 'Horario flexible'}
                      </span>
                      <Button variant="primary" size="sm" icon="event" onClick={() => abrirNueva(v.id)}>
                        Pedir cita
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Layout principal del wireframe: calendario (8) + citas del día (4) */}
        <div className="citas-layout">
          {/* ------------------------------ CALENDARIO MENSUAL ------------------------------ */}
          <section className="citas-calendar" aria-label="Calendario mensual de citas">
            <div className="citas-calendar-head">
              <h2 className="citas-calendar-month">
                {MESES[month]} {year}
                <Icon name="keyboard_arrow_down" size={20} className="citas-calendar-drop" />
              </h2>
              <div className="citas-calendar-nav">
                <button type="button" className="citas-month-btn" onClick={irHoy} aria-label="Ir al mes actual">
                  Hoy
                </button>
                <button type="button" className="citas-month-btn" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
                  <Icon name="chevron_left" size={20} />
                </button>
                <button type="button" className="citas-month-btn" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
                  <Icon name="chevron_right" size={20} />
                </button>
              </div>
            </div>

            {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}
            {listStatus === 'error' && <p className="submit-error">{listError}</p>}

            {listStatus === 'loaded' && (
              <>
                <div className="citas-grid-head">
                  {DIAS_SEMANA.map((d) => <span key={d}>{d}</span>)}
                </div>
                <div className="citas-grid">
                  {prevCeldas.map((dia, idx) => (
                    <div key={`prev-${idx}`} className="citas-day citas-day--outside" aria-hidden="true">
                      <span className="citas-day__num">{dia}</span>
                    </div>
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dia) => {
                    const citasDia = citasPorDia[dia] ?? []
                    const tipos = Array.from(new Set(citasDia.map(tipoCitaDe)))
                    const esHoy = esMismoDia(new Date(year, month, dia), today)
                    const seleccionado = esMismoDia(new Date(year, month, dia), selectedDate)
                    const clase = [
                      'citas-day',
                      citasDia.length > 0 ? 'citas-day--has' : '',
                      esHoy ? 'citas-day--today' : '',
                      seleccionado ? 'citas-day--selected' : '',
                    ].filter(Boolean).join(' ')
                    return (
                      <button
                        key={dia}
                        type="button"
                        className={clase}
                        onClick={() => setSelectedDate(new Date(year, month, dia))}
                        aria-pressed={seleccionado}
                        aria-label={
                          `Día ${dia} de ${MESES[month]} de ${year}` +
                          (citasDia.length > 0 ? `, ${citasDia.length} ${citasDia.length === 1 ? 'cita' : 'citas'}` : '')
                        }
                      >
                        <span className="citas-day__num">{dia}</span>
                        {citasDia.length > 0 && (
                          <span className="citas-day__dots" aria-hidden="true">
                            {tipos.slice(0, 3).map((t) => (
                              <span key={t} className={`citas-dot citas-dot--${toneTipoCita(t)}`} />
                            ))}
                            {/* +N cuenta CITAS sin dot (los dots van por tipo): 4 citas de un
                                mismo tipo = 1 dot + "+3" (consistente con tipos.slice(0,3)) */}
                            {citasDia.length > tipos.length && (
                              <span className="citas-day__more">+{citasDia.length - tipos.length}</span>
                            )}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  {nextCeldas.map((dia, idx) => (
                    <div key={`next-${idx}`} className="citas-day citas-day--outside" aria-hidden="true">
                      <span className="citas-day__num">{dia}</span>
                    </div>
                  ))}
                </div>
                <ul className="citas-legend" aria-label="Leyenda de tipos de cita">
                  {Object.entries({
                    Rutina: 'primary',
                    Especialista: 'secondary',
                    Urgencia: 'error',
                  }).map(([tipo, tone]) => (
                    <li key={tipo} className="citas-legend-item">
                      <span className={`citas-dot citas-dot--${tone}`} aria-hidden="true" />
                      {tipo}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* ------------------------------ CITAS DEL DÍA ------------------------------ */}
          <aside className="citas-today" aria-label="Citas del día seleccionado">
            <div className="citas-today-head">
              <div>
                <h3 className="citas-today-title">
                  {esHoySeleccionado ? 'Citas para hoy' : 'Citas del día'}
                </h3>
                <p className="citas-today-date">{tituloFecha(selectedDate)}</p>
              </div>
              <Badge variant="primary">{citasSeleccionadas.length}</Badge>
            </div>

            {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}

            {listStatus === 'loaded' && citasSeleccionadas.length === 0 && (
              <EmptyState
                icon="event_busy"
                variant="dashed"
                title="Sin citas este día"
                description="Selecciona otro día del calendario para ver sus citas."
              />
            )}

            {listStatus === 'loaded' && citasSeleccionadas.length > 0 && (
              <div className="citas-today-list">
                {citasSeleccionadas.map((cita) => {
                  const tone = toneTipoCita(cita.tipoCita)
                  const esFinal = cita.estado === 'Completada' || cita.estado === 'Cancelada'
                  const mascota = mascotaDe(cita.mascotaId)
                  return (
                    <article key={cita.id} className={`cita-card cita-card--${tone}${esFinal ? ' cita-card--muted' : ''}`}>
                      <span className="cita-card__bar" aria-hidden="true" />
                      <div className="cita-card__top">
                        <span className="cita-card__time">{formatHora(cita.fechaHora)}</span>
                        <Badge variant={ESTADO_VARIANT[cita.estado] || 'pending'} icon={ESTADO_ICON[cita.estado]}>
                          {ESTADO_LABEL[cita.estado] || cita.estado}
                        </Badge>
                      </div>
                      <div className="cita-card__pet">
                        <MascotaAvatar mascota={mascota} nombre={cita.mascotaNombre} />
                        <div className="cita-card__identity">
                          <h4 className="cita-card__name">{cita.mascotaNombre || `Mascota #${cita.mascotaId}`}</h4>
                          <p className="cita-card__meta">
                            {cita.servicio || 'Cita veterinaria'}
                            {cita.veterinariaNombre && <span> · {cita.veterinariaNombre}</span>}
                          </p>
                        </div>
                      </div>
                      {!esFinal && (
                        <div className="cita-card__actions">
                          <Button variant="secondary" size="sm" onClick={() => solicitarReprogramar(cita)}>
                            Reprogramar
                          </Button>
                          <button
                            type="button"
                            className="cita-card__iconbtn"
                            onClick={() => abrirEditar(cita)}
                            aria-label={`Editar cita de ${cita.mascotaNombre || 'mascota'}`}
                            title="Editar cita"
                          >
                            <Icon name="edit" size={18} />
                          </button>
                          {cita.estado === 'Pendiente' && (
                            <button
                              type="button"
                              className="cita-card__iconbtn cita-card__cancel"
                              onClick={() => solicitarCancelar(cita)}
                              aria-label={`Cancelar cita de ${cita.mascotaNombre || 'mascota'}`}
                              title="Cancelar cita"
                            >
                              <Icon name="close" size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}

            {/* Card de disponibilidad (wireframe: event_available + resumen del día) */}
            <div className="citas-availability">
              <span className="citas-availability__icon" aria-hidden="true">
                <Icon name="event_available" size={40} />
              </span>
              <p className="citas-availability__text">
                {citasSeleccionadas.length === 0 ? (
                  'No hay citas agendadas para este día.'
                ) : (
                  <>
                    Tienes <strong>{citasSeleccionadas.length}</strong>{' '}
                    {citasSeleccionadas.length === 1 ? 'cita' : 'citas'} agendadas{' '}
                    {esHoySeleccionado ? 'para hoy' : 'este día'}.
                    <span className="citas-availability__break">
                      {citasManana} en la mañana · {citasTarde} en la tarde.
                    </span>
                  </>
                )}
              </p>
            </div>
          </aside>
        </div>

        {/* Mis citas: filtros + listado (funcionalidad conservada, rediseñada) */}
        <section className="citas-mis" aria-label="Mis citas">
          <div className="citas-mis-head">
            <h2 className="citas-mis-title">Mis citas</h2>
            <Badge variant="primary">{filtradasPorEstado.filter((c) => c.estado !== 'Cancelada').length}</Badge>
          </div>
          <div className="citas-filtros">
            {ESTADOS_FILTRO.map((estado) => (
              <button
                key={estado}
                className={`citas-filtro ${activeState === estado ? 'active' : ''}`}
                onClick={() => setActiveState(estado)}
                aria-pressed={activeState === estado}
              >
                {estado === 'todas' ? 'Todas' : ESTADO_LABEL[estado] || estado}
              </button>
            ))}
          </div>
          {categoriasFiltro.length > 0 && (
            <label className="citas-filtro-servicio">
              <span>Tipo de servicio</span>
              <select value={activeCategoria} onChange={(e) => setActiveCategoria(e.target.value)}>
                <option value="todas">Todos los tipos</option>
                {categoriasFiltro.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          <div className="citas-list">
            {filtradasPorEstado.length === 0 ? (
              <EmptyState title="Sin citas" description="No hay citas para este filtro." />
            ) : (
              filtradasPorEstado
                .slice()
                .sort(porFecha)
                .map((cita) => (
                  <div key={cita.id} className="citas-item">
                    <div className="citas-item-top">
                      <Badge variant={ESTADO_VARIANT[cita.estado] || 'pending'}>
                        {ESTADO_LABEL[cita.estado] || cita.estado}
                      </Badge>
                      <span className="citas-item-hora">{formatHora(cita.fechaHora)}</span>
                    </div>
                    <p className="citas-item-servicio">
                      {cita.servicio || 'Cita veterinaria'}
                      {cita.categoria != null && <span className="citas-item-categoria"> · {cita.categoria}</span>}
                    </p>
                    <p className="citas-item-meta">
                      <Icon name="pets" size={14} />
                      {cita.mascotaNombre || `Mascota #${cita.mascotaId}`}
                    </p>
                    <p className="citas-item-meta">
                      <Icon name="local_hospital" size={14} />
                      {cita.veterinariaNombre || `Veterinaria #${cita.veterinariaId}`}
                    </p>
                    {cita.estado !== 'Cancelada' && (
                      <div className="citas-item-actions">
                        <button type="button" onClick={() => solicitarReprogramar(cita)}>
                          <Icon name="update" size={14} />
                          Reprogramar
                        </button>
                        <button type="button" className="danger" onClick={() => solicitarCancelar(cita)}>
                          <Icon name="close" size={14} />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>

        <Modal open={modalOpen} onClose={cerrar} className="citas-modal">
          <div>
            <h2>{editando ? 'Editar cita' : 'Pedir cita'}</h2>
            <form onSubmit={guardar} noValidate>
              <div className="field-grid">
                <label className="field">
                  <span>Mascota</span>
                  <select name="mascotaId" value={form.mascotaId} onChange={handleChange}>
                    <option value="">Seleccionar mascota...</option>
                    {mascotas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  {errors.mascotaId && <small>{errors.mascotaId}</small>}
                </label>
                <label className="field">
                  <span>Veterinaria</span>
                  <select name="veterinariaId" value={form.veterinariaId} onChange={handleChange}>
                    <option value="">Seleccionar veterinaria...</option>
                    {veterinarias.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                  </select>
                  {errors.veterinariaId && <small>{errors.veterinariaId}</small>}
                </label>
                <label className="field">
                  <span>Fecha y hora</span>
                  <input type="datetime-local" name="fechaHora" value={form.fechaHora} onChange={handleChange} />
                  {errors.fechaHora && <small>{errors.fechaHora}</small>}
                </label>
                <label className="field">
                  <span>Servicio</span>
                  {servicios.length > 0 ? (
                    <select name="servicio" value={form.servicio} onChange={handleChange}>
                      <option value="">Seleccionar servicio...</option>
                      {servicios.map((s) => (
                        <option key={s.id} value={s.nombre}>{s.nombre} ({s.duracionMinutos} min)</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" name="servicio" value={form.servicio} onChange={handleChange} placeholder="Consulta general, grooming..." />
                  )}
                  {errors.servicio && <small>{errors.servicio}</small>}
                </label>
                {servicios.length === 0 && (
                  <label className="field">
                    <span>Tipo de servicio (opcional)</span>
                    <select name="categoria" value={form.categoria} onChange={handleChange}>
                      <option value="">Sin clasificar</option>
                      {CATEGORIAS_SERVICIO.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                )}
                <Field label="Costo (opcional)" name="costo" type="number" min="0" value={form.costo} error={errors.costo} onChange={handleChange} placeholder="0" />
                <label className="field">
                  <span>Notas (opcional)</span>
                  <textarea name="notas" value={form.notas} onChange={handleChange} rows="3" placeholder="Observaciones para la cita" />
                </label>
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="citas-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Guardando...' : editando ? 'Guardar cambios' : 'Solicitar cita'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        <ConfirmDialog
          open={!!confirmState}
          title={
            confirmState?.tipo === 'aceptar' ? '¿Aceptar cita?' :
            confirmState?.tipo === 'rechazar' ? '¿Rechazar cita?' :
            confirmState?.tipo === 'reprogramar' ? 'Reprogramar cita' :
            '¿Cancelar cita?'
          }
          message={
            confirmState?.tipo === 'reprogramar'
              ? 'Indica la nueva fecha y hora de la cita.'
              : confirmState?.cita
                ? `Se ${confirmState.tipo === 'aceptar' ? 'confirmara' : confirmState.tipo === 'rechazar' ? 'rechazara' : 'cancelara'} la cita "${confirmState.cita.servicio || 'servicio'}" del ${new Date(confirmState.cita.fechaHora).toLocaleDateString('es-CR')}.`
                : ''
          }
          confirmLabel={
            confirmState?.tipo === 'aceptar' ? 'Aceptar' :
            confirmState?.tipo === 'rechazar' ? 'Rechazar' :
            confirmState?.tipo === 'reprogramar' ? 'Guardar cambios' :
            'Cancelar cita'
          }
          variant={confirmState?.tipo === 'aceptar' ? 'success' : confirmState?.tipo === 'reprogramar' ? 'info' : 'danger'}
          loading={confirmLoading}
          onConfirm={ejecutarConfirmacion}
          onCancel={cancelarConfirmacion}
        >
          {confirmState?.tipo === 'reprogramar' && (
            <label className="field citas-reprogramar-field">
              <span>Nueva fecha y hora</span>
              <input
                type="datetime-local"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </label>
          )}
        </ConfirmDialog>
      </div>
    </AppShell>
  )
}

export default CitasPage