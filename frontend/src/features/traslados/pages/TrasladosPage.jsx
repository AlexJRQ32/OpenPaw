import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { useTraslados } from '../hooks/useTraslados'
import './TrasladosPage.css'

const ESTADOS_FILTRO = ['todos', 'Solicitado', 'Aceptado', 'Rechazado']

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function nombreMascota(traslado) {
  return traslado.mascota?.nombre || `Mascota #${traslado.mascotaId}`
}

function nombreVetOrigen(traslado) {
  return traslado.veterinariaOrigen?.nombre || `Veterinaria #${traslado.veterinariaOrigenId ?? '?'}`
}

function nombreVetDestino(traslado) {
  return traslado.veterinariaDestino?.nombre || `Veterinaria #${traslado.veterinariaDestinoId ?? '?'}`
}

export function TrasladosPage() {
  const {
    esCliente, esVeterinaria,
    pendientesPropios, filtradasPorEstado, mascotas, veterinarias,
    listStatus, listError, modalOpen, form, errors, submitStatus, submitError,
    activeState, setActiveState,
    abrirNueva, cerrar, handleChange, guardar,
    confirmState, confirmLoading, motivoRechazo, setMotivoRechazo,
    solicitarAceptar, solicitarRechazar, cancelarConfirmacion, ejecutarConfirmacion,
    ESTADO_VARIANT, ESTADO_LABEL,
  } = useTraslados()

  const tituloPagina = esCliente
    ? 'Traslado de expediente'
    : esVeterinaria
      ? 'Traslados de expedientes'
      : 'Traslados de expedientes'

  const subtituloPagina = esCliente
    ? 'Solicita el traslado del expediente de tu mascota a otra veterinaria.'
    : esVeterinaria
      ? 'Gestiona las solicitudes de traslado recibidas por tu veterinaria.'
      : 'Listado de todos los traslados de expedientes.'

  return (
    <AppShell>
      <div className="traslados-page">
        <div className="traslados-header">
          <div>
            <h1 className="traslados-title">{tituloPagina}</h1>
            <p className="traslados-subtitle">{subtituloPagina}</p>
          </div>
          {esCliente && (
            <Button variant="primary" size="md" onClick={abrirNueva}>
              <i className="fas fa-arrows-left-right" />
              Solicitar traslado
            </Button>
          )}
        </div>

        {/* Veterinaria: solicitudes pendientes recibidas */}
        {esVeterinaria && (
          <section className="traslados-requests" aria-label="Solicitudes de traslado pendientes">
            <div className="traslados-requests-head">
              <h2>Solicitudes pendientes</h2>
              <span className={`traslados-requests-count ${pendientesPropios.length > 0 ? 'has-pending' : ''}`}>
                {pendientesPropios.length} {pendientesPropios.length === 1 ? 'pendiente' : 'pendientes'}
              </span>
            </div>
            {listStatus === 'loaded' && pendientesPropios.length === 0 ? (
              <div className="traslados-requests-empty">
                <i className="fas fa-inbox" /> No hay solicitudes pendientes.
              </div>
            ) : (
              <div className="traslados-requests-list">
                {pendientesPropios.map((traslado) => (
                  <div key={traslado.id} className="traslados-request-item">
                    <div className="traslados-request-info">
                      <p className="traslados-request-mascota">
                        <i className="fas fa-paw" /> {nombreMascota(traslado)}
                      </p>
                      <p className="traslados-request-meta">
                        <i className="fas fa-hospital" /> De: {nombreVetOrigen(traslado)}
                      </p>
                      <p className="traslados-request-meta">
                        <i className="fas fa-user" /> Solicitado por: {traslado.solicitadoPor?.nombre || `Usuario #${traslado.solicitadoPorId ?? '?'}`}
                      </p>
                      <p className="traslados-request-meta">
                        <i className="fas fa-clock" /> {formatFecha(traslado.fechaSolicitud)}
                      </p>
                      {traslado.comentario && (
                        <p className="traslados-request-notes">
                          <i className="fas fa-comment" /> {traslado.comentario}
                        </p>
                      )}
                    </div>
                    <div className="traslados-request-actions">
                      <button type="button" className="traslados-request-btn traslados-request-btn--ok" onClick={() => solicitarAceptar(traslado)}>
                        <i className="fas fa-check" /> Aceptar
                      </button>
                      <button type="button" className="traslados-request-btn traslados-request-btn--no" onClick={() => solicitarRechazar(traslado)}>
                        <i className="fas fa-times" /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Listado de traslados */}
        <section className="traslados-listado" aria-label="Listado de traslados">
          <div className="traslados-listado-head">
            <div className="traslados-filtros">
              {ESTADOS_FILTRO.map((estado) => (
                <button
                  key={estado}
                  type="button"
                  className={`traslados-filtro ${activeState === estado ? 'active' : ''}`}
                  onClick={() => setActiveState(estado)}
                >
                  {estado === 'todos' ? 'Todos' : ESTADO_LABEL[estado] || estado}
                </button>
              ))}
            </div>
          </div>

          {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}
          {listStatus === 'error' && <p className="traslados-list-error">{listError}</p>}

          {listStatus === 'loaded' && filtradasPorEstado.length === 0 && (
            <EmptyState title="Sin traslados" description="No hay traslados para este filtro." />
          )}

          {listStatus === 'loaded' && filtradasPorEstado.length > 0 && (
            <div className="traslados-grid">
              {filtradasPorEstado
                .slice()
                .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud))
                .map((traslado) => (
                  <article key={traslado.id} className="traslados-card">
                    <div className="traslados-card-top">
                      <Badge variant={ESTADO_VARIANT[traslado.estado] || 'pending'}>
                        {ESTADO_LABEL[traslado.estado] || traslado.estado}
                      </Badge>
                      <span className="traslados-card-fecha">
                        <i className="fas fa-clock" /> {formatFecha(traslado.fechaSolicitud)}
                      </span>
                    </div>
                    <p className="traslados-card-mascota">
                      <i className="fas fa-paw" /> {nombreMascota(traslado)}
                    </p>
                    <div className="traslados-card-ruta">
                      <span className="traslados-card-vet">
                        <span className="traslados-card-vet-label">Origen</span>
                        <span className="traslados-card-vet-name">{nombreVetOrigen(traslado)}</span>
                      </span>
                      <i className="fas fa-arrow-right traslados-card-arrow" />
                      <span className="traslados-card-vet">
                        <span className="traslados-card-vet-label">Destino</span>
                        <span className="traslados-card-vet-name">{nombreVetDestino(traslado)}</span>
                      </span>
                    </div>
                    {traslado.comentario && (
                      <p className="traslados-card-comentario">
                        <i className="fas fa-comment" /> {traslado.comentario}
                      </p>
                    )}
                    {traslado.estado === 'Rechazado' && traslado.motivoRechazo && (
                      <p className="traslados-card-rechazo">
                        <i className="fas fa-circle-exclamation" /> Motivo de rechazo: {traslado.motivoRechazo}
                      </p>
                    )}
                    {traslado.estado === 'Aceptado' && traslado.fechaRespuesta && (
                      <p className="traslados-card-respuesta">
                        <i className="fas fa-check-circle" /> Aceptado el {formatFecha(traslado.fechaRespuesta)}
                      </p>
                    )}
                    </article>
                ))}
            </div>
          )}
        </section>

        {/* Modal: solicitar traslado (cliente) */}
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
                <label className="field traslados-modal-comentario">
                  <span>Comentario (opcional)</span>
                  <textarea name="comentario" value={form.comentario} onChange={handleChange} rows="3" placeholder="Mensaje para la veterinaria destino" />
                </label>
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="traslados-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Enviando...' : 'Solicitar traslado'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        <ConfirmDialog
          open={!!confirmState}
          title={
            confirmState?.tipo === 'aceptar' ? '¿Aceptar traslado?' :
            confirmState?.tipo === 'rechazar' ? '¿Rechazar traslado?' : ''
          }
          message={
            confirmState?.traslado
              ? confirmState.tipo === 'aceptar'
                ? `Al aceptar, la veterinaria de cabecera de "${nombreMascota(confirmState.traslado)}" pasara a ser ${nombreVetDestino(confirmState.traslado)}.`
                : `Indica el motivo por el que se rechaza el traslado de "${nombreMascota(confirmState.traslado)}".`
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
            <label className="field traslados-rechazo-field">
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