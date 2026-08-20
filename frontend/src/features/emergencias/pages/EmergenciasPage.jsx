import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useEmergencias } from '../hooks/useEmergencias'
import './EmergenciasPage.css'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EmergenciasPage() {
  const {
    esCliente,
    emergencias,
    mascotas,
    mascotaFiltro,
    setMascotaFiltro,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrirNueva,
    cerrar,
    handleChange,
    guardar,
  } = useEmergencias()

  return (
    <AppShell>
      <div className="emergencias-page">
        <div className="emergencias-header">
          <div>
            <h1 className="emergencias-title">Atencion de emergencias</h1>
            <p className="emergencias-subtitle">
              {esCliente
                ? 'Registra y consulta las emergencias medicas de tus mascotas, dentro o fuera de la plataforma.'
                : 'Registra y consulta las emergencias atendidas dentro o fuera de tu veterinaria.'}
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => abrirNueva(mascotaFiltro || undefined)}>
            <i className="fas fa-plus" /> Registrar emergencia
          </Button>
        </div>

        <div className="emergencias-filtro">
          <label className="field">
            <span>Mascota</span>
            <select value={mascotaFiltro} onChange={(e) => setMascotaFiltro(e.target.value)}>
              <option value="">Selecciona una mascota...</option>
              {mascotas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </label>
        </div>

        {!mascotaFiltro && (
          <EmptyState
            title="Selecciona una mascota"
            description="Elige una de tus mascotas para ver y registrar sus emergencias."
          />
        )}

        {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}
        {listStatus === 'error' && <p className="submit-error">{listError}</p>}

        {listStatus === 'loaded' && mascotaFiltro && emergencias.length === 0 && (
          <EmptyState title="Sin emergencias" description="Esta mascota no tiene emergencias registradas." />
        )}

        {listStatus === 'loaded' && emergencias.length > 0 && (
          <div className="emergencias-list">
            {emergencias
              .slice()
              .sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion))
              .map((em) => (
                <div key={em.id} className="emergencias-card">
                  <div className="emergencias-card-top">
                    <Badge variant={em.esEnPlataforma ? 'info' : 'pending'}>
                      {em.esEnPlataforma ? 'En plataforma' : 'Fuera plataforma'}
                    </Badge>
                    <span className="emergencias-card-date">
                      <i className="fas fa-clock" /> {formatDate(em.fechaAtencion)}
                    </span>
                  </div>
                  <p className="emergencias-card-motivo">{em.motivo}</p>
                  <div className="emergencias-card-grid">
                    <div className="emergencias-detail">
                      <p className="emergencias-detail-label">
                        <i className="fas fa-paw" /> Mascota
                      </p>
                      <p className="emergencias-detail-value">{em.mascota?.nombre || `#${em.mascotaId}`}</p>
                    </div>
                    <div className="emergencias-detail">
                      <p className="emergencias-detail-label">
                        <i className="fas fa-user" /> Propietario
                      </p>
                      <p className="emergencias-detail-value">{em.propietario?.nombre || `#${em.propietarioId}`}</p>
                    </div>
                    <div className="emergencias-detail">
                      <p className="emergencias-detail-label">
                        <i className="fas fa-hospital" /> Veterinaria
                      </p>
                      <p className="emergencias-detail-value">
                        {em.esEnPlataforma
                          ? (em.veterinaria?.nombre || `#${em.veterinariaId}` || '—')
                          : (em.veterinariaNombreExterna || '—')}
                      </p>
                    </div>
                    {em.sintomas && (
                      <div className="emergencias-detail">
                        <p className="emergencias-detail-label">
                          <i className="fas fa-virus-covid" /> Sintomas
                        </p>
                        <p className="emergencias-detail-value">{em.sintomas}</p>
                      </div>
                    )}
                    {em.tratamientoAplicado && (
                      <div className="emergencias-detail">
                        <p className="emergencias-detail-label">
                          <i className="fas fa-syringe" /> Tratamiento
                        </p>
                        <p className="emergencias-detail-value">{em.tratamientoAplicado}</p>
                      </div>
                    )}
                  </div>
                  {em.archivoAdjuntoUrl && (
                    <a className="emergencias-adjunto" href={em.archivoAdjuntoUrl} target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-paperclip" /> Ver archivo adjunto
                    </a>
                  )}
                </div>
              ))}
          </div>
        )}

        <Modal open={modalOpen} onClose={cerrar} className="emergencias-modal">
          <div>
            <h2>Registrar emergencia</h2>
            <form onSubmit={guardar} noValidate>
              <div className="field-grid">
                <label className="field">
                  <span>Mascota</span>
                  <select name="mascotaId" value={form.mascotaId} onChange={handleChange} required>
                    <option value="">Seleccionar mascota...</option>
                    {mascotas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  {errors.mascotaId && <small>{errors.mascotaId}</small>}
                </label>

                <label className="field">
                  <span>Fecha y hora de atencion</span>
                  <input type="datetime-local" name="fechaAtencion" value={form.fechaAtencion} onChange={handleChange} required />
                  {errors.fechaAtencion && <small>{errors.fechaAtencion}</small>}
                </label>

                {!esCliente && (
                  <label className="field field-full">
                    <span>¿Atendida en plataforma?</span>
                    <select
                      name="esEnPlataforma"
                      value={String(form.esEnPlataforma)}
                      onChange={(e) => handleChange({ target: { name: 'esEnPlataforma', value: e.target.value === 'true', type: 'select' } })}
                    >
                      <option value="false">No — veterinaria externa</option>
                      <option value="true">Si — con veterinaria de OpenPaw</option>
                    </select>
                  </label>
                )}

                {!form.esEnPlataforma && (
                  <label className="field field-full">
                    <span>Nombre de la veterinaria externa</span>
                    <input
                      type="text"
                      name="veterinariaNombreExterna"
                      value={form.veterinariaNombreExterna}
                      onChange={handleChange}
                      placeholder="Nombre del lugar donde se atendio la emergencia"
                    />
                    {errors.veterinariaNombreExterna && <small>{errors.veterinariaNombreExterna}</small>}
                  </label>
                )}

                <label className="field field-full">
                  <span>Motivo</span>
                  <input type="text" name="motivo" value={form.motivo} onChange={handleChange} required placeholder="Motivo de la emergencia" />
                  {errors.motivo && <small>{errors.motivo}</small>}
                </label>

                <label className="field field-full">
                  <span>Sintomas (opcional)</span>
                  <textarea name="sintomas" value={form.sintomas} onChange={handleChange} rows="2" placeholder="Describe los sintomas observados" />
                </label>

                <label className="field field-full">
                  <span>Tratamiento aplicado (opcional)</span>
                  <textarea name="tratamientoAplicado" value={form.tratamientoAplicado} onChange={handleChange} rows="2" placeholder="Tratamiento o medicamentos administrados" />
                </label>

                <label className="field field-full">
                  <span>URL de archivo adjunto (opcional)</span>
                  <input type="url" name="archivoAdjuntoUrl" value={form.archivoAdjuntoUrl} onChange={handleChange} placeholder="https://..." />
                </label>
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="emergencias-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Guardando...' : 'Registrar emergencia'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </AppShell>
  )
}

export default EmergenciasPage