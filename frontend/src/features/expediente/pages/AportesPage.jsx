import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { useAportes, TIPO_ATENCION_LABEL, TIPO_ATENCION_VARIANT } from '../hooks/useAportes'
import './AportesPage.css'

const TIPO_OPCIONES = [
  { value: 'Consulta', label: 'Consulta' },
  { value: 'Tratamiento', label: 'Tratamiento' },
  { value: 'Vacuna', label: 'Vacuna' },
  { value: 'Emergencia', label: 'Emergencia' },
]

function formatFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AportesPage() {
  const {
    mascotas,
    aportes,
    mascotaSeleccionada,
    setMascotaSeleccionada,
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
    confirmState,
    confirmLoading,
    solicitarEliminar,
    cancelarConfirmacion,
    ejecutarEliminacion,
  } = useAportes()

  const maxDatetime = new Date().toISOString().slice(0, 16)

  return (
    <AppShell>
      <div className="aportes-page">
        <div className="aportes-header">
          <div>
            <h1 className="aportes-title">Expediente de mascotas</h1>
            <p className="aportes-subtitle">Registra y consulta aportes de veterinarias externas.</p>
          </div>
          <Button variant="primary" size="md" onClick={abrirNuevo} disabled={mascotas.length === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Registrar aporte
          </Button>
        </div>

        {mascotas.length === 0 && listStatus === 'loaded' ? (
          <EmptyState title="Sin mascotas" description="No tienes mascotas registradas para gestionar su expediente." />
        ) : (
          <>
            <div className="aportes-selector">
              <label className="aportes-selector-field">
                <span>Mascota</span>
                <select value={mascotaSeleccionada} onChange={(e) => setMascotaSeleccionada(e.target.value)}>
                  <option value="">Seleccionar mascota...</option>
                  {mascotas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </label>
            </div>

            <div className="aportes-list">
              {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}
              {listStatus === 'error' && <p className="submit-error">{listError}</p>}
              {listStatus === 'loaded' && !mascotaSeleccionada && (
                <EmptyState title="Selecciona una mascota" description="Elige una mascota para ver su expediente." />
              )}
              {listStatus === 'loaded' && mascotaSeleccionada && aportes.length === 0 && (
                <EmptyState title="Sin aportes" description="Esta mascota no tiene aportes registrados." />
              )}
              {listStatus === 'loaded' && aportes.map((aporte) => {
                const tipo = aporte.tipoAtencion
                return (
                  <article key={aporte.id} className="aportes-item">
                    <div className="aportes-item-top">
                      <Badge variant={TIPO_ATENCION_VARIANT[tipo] || 'pending'}>
                        {TIPO_ATENCION_LABEL[tipo] || 'Otro'}
                      </Badge>
                      <span className="aportes-item-fecha">{formatFecha(aporte.fechaAtencion)}</span>
                    </div>
                    <p className="aportes-item-vet">
                      <i className="fas fa-hospital" /> {aporte.veterinariaNombre}
                    </p>
                    <p className="aportes-item-desc">{aporte.descripcion}</p>
                    {aporte.diagnostico && (
                      <p className="aportes-item-meta"><i className="fas fa-stethoscope" /> <strong>Diagnostico:</strong> {aporte.diagnostico}</p>
                    )}
                    {aporte.medicamentos && (
                      <p className="aportes-item-meta"><i className="fas fa-prescription-bottle-medical" /> <strong>Medicamentos:</strong> {aporte.medicamentos}</p>
                    )}
                    {aporte.archivoAdjuntoUrl && (
                      <p className="aportes-item-meta"><i className="fas fa-link" /> <a href={aporte.archivoAdjuntoUrl} target="_blank" rel="noreferrer">Archivo adjunto</a></p>
                    )}
                    <p className="aportes-item-registro">Registrado el {formatFecha(aporte.fechaRegistro)}</p>
                    <div className="aportes-item-actions">
                      <button type="button" className="danger" onClick={() => solicitarEliminar(aporte)}>
                        <i className="fas fa-trash" /> Eliminar
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}

        <Modal open={modalOpen} onClose={cerrar} className="aportes-modal">
          <div>
            <h2>Registrar aporte de expediente</h2>
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
                  <input type="text" name="veterinariaNombre" value={form.veterinariaNombre} onChange={handleChange} placeholder="Nombre de la veterinaria externa" />
                  {errors.veterinariaNombre && <small>{errors.veterinariaNombre}</small>}
                </label>
                <label className="field">
                  <span>Fecha de atencion</span>
                  <input type="datetime-local" name="fechaAtencion" value={form.fechaAtencion} onChange={handleChange} max={maxDatetime} />
                  {errors.fechaAtencion && <small>{errors.fechaAtencion}</small>}
                </label>
                <label className="field">
                  <span>Tipo de atencion</span>
                  <select name="tipoAtencion" value={form.tipoAtencion} onChange={handleChange}>
                    <option value="">Seleccionar tipo...</option>
                    {TIPO_OPCIONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {errors.tipoAtencion && <small>{errors.tipoAtencion}</small>}
                </label>
                <label className="field field--full">
                  <span>Descripcion</span>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows="3" placeholder="Describe la atencion recibida" />
                  {errors.descripcion && <small>{errors.descripcion}</small>}
                </label>
                <label className="field field--full">
                  <span>Diagnostico (opcional)</span>
                  <textarea name="diagnostico" value={form.diagnostico} onChange={handleChange} rows="2" placeholder="Diagnostico de la atencion" />
                </label>
                <label className="field field--full">
                  <span>Medicamentos (opcional)</span>
                  <input type="text" name="medicamentos" value={form.medicamentos} onChange={handleChange} placeholder="Medicamentos indicados" />
                </label>
                <label className="field field--full">
                  <span>URL de archivo adjunto (opcional)</span>
                  <input type="url" name="archivoAdjuntoUrl" value={form.archivoAdjuntoUrl} onChange={handleChange} placeholder="https://..." />
                </label>
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="aportes-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Guardando...' : 'Registrar aporte'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        <ConfirmDialog
          open={!!confirmState}
          title="¿Eliminar aporte?"
          message={confirmState?.aporte ? `Se eliminara el aporte de "${confirmState.aporte.veterinariaNombre}" del ${formatFecha(confirmState.aporte.fechaAtencion)}.` : ''}
          confirmLabel="Eliminar"
          variant="danger"
          loading={confirmLoading}
          onConfirm={ejecutarEliminacion}
          onCancel={cancelarConfirmacion}
        />
      </div>
    </AppShell>
  )
}

export default AportesPage