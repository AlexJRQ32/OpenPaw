import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { useServiciosVeterinaria } from '../hooks/useServiciosVeterinaria'
import './ServiciosVeterinariaPage.css'

function formatPrecio(value) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function formatDuracion(min) {
  if (min == null) return '—'
  if (min < 60) return `${min} min`
  const horas = Math.floor(min / 60)
  const rest = min % 60
  return rest ? `${horas}h ${rest}m` : `${horas}h`
}

export function ServiciosVeterinariaPage() {
  const {
    servicios, filtrados, veterinarias, esAdmin, listStatus, listError,
    modalOpen, editando, form, errors, submitStatus, submitError,
    filterCategoria, setFilterCategoria, activos, inactivos,
    abrirNuevo, abrirEditar, cerrar, handleChange, guardar,
    confirmTarget, setConfirmTarget, confirmarEliminar, deleting,
    CATEGORIAS, CATEGORIA_ICON,
  } = useServiciosVeterinaria()

  return (
    <AppShell>
      <div className="serv-page">
        <div className="serv-header">
          <div>
            <h1 className="serv-title">Servicios veterinarios</h1>
            <p className="serv-subtitle">Administra el catalogo de servicios de tu veterinaria.</p>
          </div>
          <Button variant="primary" size="md" onClick={abrirNuevo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo servicio
          </Button>
        </div>

        <div className="serv-stats">
          <div className="serv-stat">
            <span className="serv-stat-number">{servicios.length}</span>
            <span className="serv-stat-label">Total de servicios</span>
          </div>
          <div className="serv-stat serv-stat--active">
            <span className="serv-stat-number">{activos}</span>
            <span className="serv-stat-label">Activos</span>
          </div>
          <div className="serv-stat serv-stat--inactive">
            <span className="serv-stat-number">{inactivos}</span>
            <span className="serv-stat-label">Inactivos</span>
          </div>
        </div>

        <div className="serv-categorias">
          {['Todas', ...CATEGORIAS].map((categoria) => (
            <button
              key={categoria}
              className={`serv-categoria ${filterCategoria === categoria ? 'active' : ''}`}
              onClick={() => setFilterCategoria(categoria)}
            >
              {categoria !== 'Todas' && <i className={CATEGORIA_ICON[categoria]} />}
              {categoria}
            </button>
          ))}
        </div>

        {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}
        {listStatus === 'error' && <p className="submit-error">{listError}</p>}

        {listStatus === 'loaded' && (
          <div className="serv-card">
            {filtrados.length === 0 ? (
              <EmptyState
                title="Sin servicios"
                description="No hay servicios para esta categoria. Agrega el primero."
                action={<Button variant="primary" size="md" onClick={abrirNuevo}>Agregar servicio</Button>}
              />
            ) : (
              <div className="serv-list">
                {filtrados.map((servicio) => (
                  <article key={servicio.id} className={`serv-item ${servicio.activo ? '' : 'serv-item--inactive'}`}>
                    <div className={`serv-icon serv-icon--${(servicio.categoria || 'Consulta').toLowerCase()}`}>
                      <i className={CATEGORIA_ICON[servicio.categoria] || CATEGORIA_ICON.Consulta} />
                    </div>
                    <div className="serv-body">
                      <div className="serv-body-top">
                        <h3>{servicio.nombre}</h3>
                        <Badge variant={servicio.activo ? 'active' : 'inactive'}>
                          {servicio.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      {servicio.descripcion && <p className="serv-desc">{servicio.descripcion}</p>}
                      <div className="serv-meta">
                        <span className="serv-cat"><i className={CATEGORIA_ICON[servicio.categoria] || CATEGORIA_ICON.Consulta} /> {servicio.categoria}</span>
                        <span className="serv-dup"><i className="fas fa-clock" /> {formatDuracion(servicio.duracionMinutos)}</span>
                        {servicio.veterinariaNombre && (
                          <span className="serv-vet"><i className="fas fa-hospital" /> {servicio.veterinariaNombre}</span>
                        )}
                      </div>
                    </div>
                    <div className="serv-price">{formatPrecio(servicio.precio)}</div>
                    <div className="serv-actions">
                      <button type="button" className="serv-action" title="Editar" onClick={() => abrirEditar(servicio)}>
                        <i className="fas fa-pen" />
                      </button>
                      <button type="button" className="serv-action serv-action--danger" title="Eliminar" onClick={() => setConfirmTarget(servicio)}>
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <Modal open={modalOpen} onClose={cerrar} className="servicios-modal">
          <div>
            <h2>{editando ? 'Editar servicio' : 'Nuevo servicio'}</h2>
            <form onSubmit={guardar} noValidate>
              <div className="field-grid">
                {!editando && (
                  <label className="field field--wide">
                    <span>Veterinaria {!esAdmin && <small style={{ display: 'inline', fontWeight: 'normal' }}>(tu veterinaria)</small>}</span>
                    <select name="veterinariaId" value={form.veterinariaId} onChange={handleChange} disabled={!esAdmin}>
                      <option value="">{veterinarias.length > 0 ? 'Seleccionar veterinaria...' : 'No hay veterinarias disponibles'}</option>
                      {veterinarias.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                    </select>
                    {errors.veterinariaId && <small>{errors.veterinariaId}</small>}
                  </label>
                )}
                <Field
                  className="field--wide"
                  label="Nombre del servicio"
                  name="nombre"
                  value={form.nombre}
                  error={errors.nombre}
                  onChange={handleChange}
                  placeholder="Consulta general, Grooming basico..."
                />
                <label className="field field--wide">
                  <span>Descripcion (opcional)</span>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows="3" placeholder="Detalle del servicio" />
                </label>
                <label className="field">
                  <span>Categoria</span>
                  <select name="categoria" value={form.categoria} onChange={handleChange}>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.categoria && <small>{errors.categoria}</small>}
                </label>
                <label className="field">
                  <span>Duracion (minutos)</span>
                  <input type="number" min="1" max="1440" name="duracionMinutos" value={form.duracionMinutos} onChange={handleChange} />
                  {errors.duracionMinutos && <small>{errors.duracionMinutos}</small>}
                </label>
                <Field
                  className="field--wide"
                  label="Precio (CRC)"
                  name="precio"
                  type="number"
                  min="0"
                  value={form.precio}
                  error={errors.precio}
                  onChange={handleChange}
                  placeholder="0"
                />
                {editando && (
                  <label className="field serv-check">
                    <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                    <span>Servicio activo</span>
                  </label>
                )}
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="servicios-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear servicio'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        <ConfirmDialog
          open={!!confirmTarget}
          title="¿Eliminar servicio?"
          message={confirmTarget
            ? `Se eliminara el servicio "${confirmTarget.nombre}". Esta accion no se puede deshacer.`
            : ''}
          confirmLabel="Eliminar"
          loading={deleting}
          onConfirm={confirmarEliminar}
          onCancel={() => setConfirmTarget(null)}
        />
      </div>
    </AppShell>
  )
}

export default ServiciosVeterinariaPage
