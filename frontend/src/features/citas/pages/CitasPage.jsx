import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { useCitas } from '../hooks/useCitas'
import './CitasPage.css'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const ESTADOS_FILTRO = ['todas', 'Pendiente', 'Confirmada', 'EnProgreso', 'Completada', 'Cancelada']
const CATEGORIAS_SERVICIO = ['Consulta', 'Grooming', 'Procedimiento']

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
}

export function CitasPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    esCliente, citas, citasDelDia, filtradasPorEstado, mascotas, veterinarias, servicios, categoriasFiltro,
    listStatus, listError, modalOpen, editando, form, errors, submitStatus, submitError,
    monthDate, setMonthDate, activeState, setActiveState, activeCategoria, setActiveCategoria,
    abrirNueva, abrirEditar, cerrar, handleChange, guardar,
    confirmState, confirmLoading, nuevaFecha, setNuevaFecha,
    solicitarAceptar, solicitarRechazar, solicitarCancelar, solicitarReprogramar,
    cancelarConfirmacion, ejecutarConfirmacion,
    ESTADO_VARIANT, ESTADO_LABEL,
  } = useCitas()

  const pendientes = citas.filter((c) => c.estado === 'Pendiente')

  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cambiarMes = (delta) => {
    setMonthDate(new Date(year, month + delta, 1))
  }

  const irHoy = () => setMonthDate(new Date())

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

  const celdas = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= daysInMonth; d++) celdas.push(d)

  return (
    <AppShell>
      <div className="citas-page">
        <div className="citas-header">
          <div>
            <h1 className="citas-title">Agenda de citas</h1>
            <p className="citas-subtitle">
              {esCliente ? 'Elige una veterinaria y agenda tu cita.' : 'Programa y gestiona las citas veterinarias.'}
            </p>
          </div>
          {!esCliente && (
            <Button variant="primary" size="md" onClick={() => abrirNueva()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva cita
            </Button>
          )}
        </div>

        {/* Veterinaria/Admin: solicitudes de citas por aceptar */}
        {!esCliente && (
          <section className="citas-requests" aria-label="Solicitudes de citas">
            <div className="citas-requests-head">
              <h2>Solicitudes de citas</h2>
              <span className={`citas-requests-count ${pendientes.length > 0 ? 'has-pending' : ''}`}>
                {pendientes.length} {pendientes.length === 1 ? 'pendiente' : 'pendientes'}
              </span>
            </div>
            {listStatus === 'loaded' && pendientes.length === 0 ? (
              <div className="citas-requests-empty">
                <i className="fas fa-inbox" /> No hay solicitudes pendientes.
              </div>
            ) : (
              <div className="citas-requests-list">
                {pendientes.map((cita) => (
                  <div key={cita.id} className="citas-request-item">
                    <div className="citas-request-info">
                      <p className="citas-request-servicio">{cita.servicio || 'Cita veterinaria'}</p>
                      <p className="citas-request-meta">
                        <i className="fas fa-paw" /> {cita.mascota?.nombre || `Mascota #${cita.mascotaId}`}
                      </p>
                      <p className="citas-request-meta">
                        <i className="fas fa-user" /> {cita.usuario?.nombre || `Usuario #${cita.usuarioId}`}
                      </p>
                      <p className="citas-request-meta">
                        <i className="fas fa-clock" /> {new Date(cita.fechaHora).toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })} · {formatHora(cita.fechaHora)}
                      </p>
                      {cita.notas && <p className="citas-request-notes"><i className="fas fa-comment" /> {cita.notas}</p>}
                    </div>
                    <div className="citas-request-actions">
                      <button type="button" className="citas-request-btn citas-request-btn--ok" onClick={() => solicitarAceptar(cita)}>
                        <i className="fas fa-check" /> Aceptar
                      </button>
                      <button type="button" className="citas-request-btn citas-request-btn--no" onClick={() => solicitarRechazar(cita)}>
                        <i className="fas fa-times" /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Cliente: catalogo de veterinarias para sacar cita */}
        {esCliente && (
          <section className="citas-vets" aria-label="Veterinarias disponibles">
            <div className="citas-vets-head">
              <h2>Veterinarias aliadas</h2>
              <span>{veterinarias.length} disponibles</span>
            </div>
            {listStatus === 'loaded' && veterinarias.length === 0 ? (
              <EmptyState title="Sin veterinarias" description="No hay veterinarias disponibles por ahora." />
            ) : (
              <div className="citas-vets-grid">
                {veterinarias.map((v) => (
                  <article key={v.id} className="citas-vet-card">
                    <div className="citas-vet-card-top">
                      <span className="citas-vet-avatar"><i className="fas fa-hospital" /></span>
                      <div>
                        <h3>{v.nombre}</h3>
                        {v.direccion && <p className="citas-vet-dir"><i className="fas fa-location-dot" /> {v.direccion}</p>}
                      </div>
                    </div>
                    {v.descripcion && <p className="citas-vet-desc">{v.descripcion}</p>}
                    <div className="citas-vet-card-foot">
                      <span className="citas-vet-horario"><i className="fas fa-clock" /> {v.horario || 'Horario flexible'}</span>
                      <Button variant="primary" size="sm" onClick={() => abrirNueva(v.id)}>
                        <i className="fas fa-calendar-plus" /> Pedir cita
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="citas-layout">
          <div className="citas-calendar-card">
            <div className="citas-calendar-head">
              <button type="button" className="citas-month-btn" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
                <i className="fas fa-chevron-left" />
              </button>
              <div className="citas-month-label">
                <h2>{MESES[month]} {year}</h2>
                <button type="button" onClick={irHoy}>Hoy</button>
              </div>
              <button type="button" className="citas-month-btn" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
                <i className="fas fa-chevron-right" />
              </button>
            </div>

            {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}
            {listStatus === 'error' && <p className="submit-error">{listError}</p>}

            {listStatus === 'loaded' && (
              <>
                <div className="citas-grid-head">
                  {DIAS_SEMANA.map((d) => <span key={d}>{d}</span>)}
                </div>
                <div className="citas-grid">
                  {celdas.map((dia, idx) => {
                    if (dia === null) return <div key={`empty-${idx}`} className="citas-day citas-day--empty" />
                    const citasDia = citasDelDia(dia)
                    const esHoy = dia === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                    return (
                      <div key={dia} className={`citas-day ${esHoy ? 'citas-day--today' : ''}`}>
                        <span className="citas-day-number">{dia}</span>
                        <div className="citas-day-items">
                          {citasDia.slice(0, 3).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={`citas-chip citas-chip--${(ESTADO_VARIANT[c.estado] || 'pending')}`}
                              title={`${formatHora(c.fechaHora)} - ${c.servicio || 'Cita'} (${ESTADO_LABEL[c.estado] || c.estado})`}
                              onClick={() => abrirEditar(c)}
                            >
                              {formatHora(c.fechaHora)} {c.servicio}
                            </button>
                          ))}
                          {citasDia.length > 3 && <span className="citas-more">+{citasDia.length - 3} mas</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="citas-side">
            <div className="citas-side-card">
              <div className="citas-side-head">
                <h3>Mis citas</h3>
                <span className="citas-count">{filtradasPorEstado.filter((c) => c.estado !== 'Cancelada').length}</span>
              </div>
              <div className="citas-filtros">
                {ESTADOS_FILTRO.map((estado) => (
                  <button
                    key={estado}
                    className={`citas-filtro ${activeState === estado ? 'active' : ''}`}
                    onClick={() => setActiveState(estado)}
                  >
                    {estado === 'todas' ? 'Todas' : ESTADO_LABEL[estado] || estado}
                  </button>
                ))}
              </div>
              {categoriasFiltro.length > 0 && (
                <label className="field citas-filtro-servicio">
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
                    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
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
                          {cita.categoria != null && (
                            <span className="citas-item-categoria"> · {cita.categoria}</span>
                          )}
                        </p>
                        <p className="citas-item-meta">
                          <i className="fas fa-paw" /> {cita.mascota?.nombre || `Mascota #${cita.mascotaId}`}
                        </p>
                        <p className="citas-item-meta">
                          <i className="fas fa-hospital" /> {cita.veterinaria?.nombre || `Veterinaria #${cita.veterinariaId}`}
                        </p>
                        {cita.estado !== 'Cancelada' && (
                          <div className="citas-item-actions">
                            <button type="button" onClick={() => solicitarReprogramar(cita)}>
                              <i className="fas fa-calendar-alt" /> Reprogramar
                            </button>
                            <button type="button" className="danger" onClick={() => solicitarCancelar(cita)}>
                              <i className="fas fa-times" /> Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>

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
