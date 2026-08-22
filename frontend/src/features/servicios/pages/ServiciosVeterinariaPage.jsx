import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { Icon } from '../../../shared/components/Icon/Icon'
import { ToggleSwitch } from '../../../shared/components/ToggleSwitch/ToggleSwitch'
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

/* Iconos Material Symbols por categoria (wireframe: stethoscope / content_cut / vaccines) */
const CATEGORIA_ICON_M3 = {
  Consulta: 'stethoscope',
  Grooming: 'content_cut',
  Procedimiento: 'vaccines',
}
const CATEGORIA_ICON_DEFAULT = 'medical_services'

const iconoDe = (categoria) => CATEGORIA_ICON_M3[categoria] || CATEGORIA_ICON_DEFAULT

/* ---------------------------------------------------------------------------
   Tarjeta de servicio (wireframe servicios_openpaw):
   icono en caja tintada + badge estado + ToggleSwitch inline + titulo/desc +
   meta (duracion/veterinaria) + footer Precio Base + acciones editar/eliminar.
   --------------------------------------------------------------------------- */
function ServicioCard({ servicio, toggling, onToggle, onEditar, onEliminar }) {
  const inactivo = !servicio.activo
  const categoria = servicio.categoria || 'Consulta'
  return (
    <article
      className={`serv-card ${inactivo ? 'serv-card--inactive' : ''}`.trim()}
      aria-label={`Servicio ${servicio.nombre}`}
    >
      <div className="serv-card__top">
        <span
          className={`serv-card__icon serv-card__icon--${categoria.toLowerCase()}`}
          aria-hidden="true"
        >
          <Icon name={iconoDe(categoria)} size={28} filled />
        </span>
        <div className="serv-card__top-actions">
          <Badge variant={inactivo ? 'inactive' : 'active'} dot>
            {inactivo ? 'Inactivo' : 'Activo'}
          </Badge>
          <ToggleSwitch
            checked={servicio.activo}
            onChange={() => onToggle(servicio)}
            disabled={toggling}
            size="sm"
            aria-label={`${inactivo ? 'Activar' : 'Desactivar'} ${servicio.nombre}`}
          />
        </div>
      </div>

      <div className="serv-card__body">
        <h3 className="serv-card__title">{servicio.nombre}</h3>
        {servicio.descripcion && <p className="serv-card__desc">{servicio.descripcion}</p>}
        <div className="serv-card__meta">
          <span className="serv-card__meta-item">
            <Icon name="schedule" size={14} aria-hidden="true" />
            {formatDuracion(servicio.duracionMinutos)}
          </span>
          {servicio.veterinariaNombre && (
            <span className="serv-card__meta-item">
              <Icon name="location_on" size={14} aria-hidden="true" />
              {servicio.veterinariaNombre}
            </span>
          )}
        </div>
      </div>

      <div className="serv-card__footer">
        <div className="serv-card__precio">
          <span className="serv-card__precio-label">Precio Base</span>
          <span className="serv-card__precio-valor">{formatPrecio(servicio.precio)}</span>
        </div>
        <div className="serv-card__acciones">
          <button
            type="button"
            className="serv-card__icon-btn"
            title="Editar servicio"
            aria-label={`Editar ${servicio.nombre}`}
            onClick={() => onEditar(servicio)}
          >
            <Icon name="edit" size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="serv-card__icon-btn serv-card__icon-btn--danger"
            title="Eliminar servicio"
            aria-label={`Eliminar ${servicio.nombre}`}
            onClick={() => onEliminar(servicio)}
          >
            <Icon name="delete" size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}

/* ---------------------------------------------------------------------------
   Stats bento (wireframe): Total / Activos / Inactivos con icono en circulo.
   --------------------------------------------------------------------------- */
function StatCard({ label, value, icon, tone }) {
  return (
    <div className={`serv-stat serv-stat--${tone}`}>
      <div>
        <p className="serv-stat__label">{label}</p>
        <p className="serv-stat__value">{value}</p>
      </div>
      <span className="serv-stat__icon" aria-hidden="true">
        <Icon name={icon} size={24} filled />
      </span>
    </div>
  )
}

export function ServiciosVeterinariaPage() {
  const {
    servicios, filtrados, veterinarias, esAdmin, listStatus, listError,
    modalOpen, editando, form, errors, submitStatus, submitError,
    filterCategoria, setFilterCategoria, searchTerm, setSearchTerm,
    togglingId, toggleActivo, activos, inactivos,
    abrirNuevo, abrirEditar, cerrar, handleChange, guardar,
    confirmTarget, setConfirmTarget, confirmarEliminar, deleting,
    CATEGORIAS,
  } = useServiciosVeterinaria()

  const buscando = searchTerm.trim() !== ''
  const sinResultados = listStatus === 'loaded' && filtrados.length === 0

  return (
    <AppShell>
      <div className="serv-page">
        {/* ------------------------------------------------------------ header */}
        <header className="serv-header">
          <div>
            <h1 className="serv-title">Catálogo de Servicios</h1>
            <p className="serv-subtitle">
              Gestión y configuración de los servicios veterinarios ofrecidos en la clínica.
              Actualiza precios, descripciones y disponibilidad.
            </p>
          </div>
          <Button variant="primary" size="md" icon="add" onClick={abrirNuevo}>
            Nuevo Servicio
          </Button>
        </header>

        {/* ---------------------------------------------------------- stats */}
        <div className="serv-stats" role="group" aria-label="Resumen de servicios">
          <StatCard label="Total Servicios" value={servicios.length} icon="medical_services" tone="total" />
          <StatCard label="Activos" value={activos} icon="check_circle" tone="activos" />
          <StatCard label="Inactivos" value={inactivos} icon="cancel" tone="inactivos" />
        </div>

        {/* ------------------------------------------- barra filtros + buscar */}
        <div className="serv-filters">
          <div className="serv-chips" role="group" aria-label="Filtrar por categoria">
            {['Todas', ...CATEGORIAS].map((categoria) => (
              <button
                key={categoria}
                type="button"
                className={`serv-chip ${filterCategoria === categoria ? 'is-active' : ''}`.trim()}
                aria-pressed={filterCategoria === categoria}
                onClick={() => setFilterCategoria(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>
          <div className="serv-search" role="search">
            <Icon name="search" size={20} className="serv-search__icon" aria-hidden="true" />
            <input
              type="search"
              className="serv-search__input"
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar servicio"
            />
            {buscando && (
              <button
                type="button"
                className="serv-search__clear"
                title="Limpiar busqueda"
                aria-label="Limpiar busqueda"
                onClick={() => setSearchTerm('')}
              >
                <Icon name="close" size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------- estados */}
        {listStatus === 'loading' && (
          <div className="serv-loading" role="status" aria-label="Cargando servicios">
            <span className="spinner" />
          </div>
        )}
        {listStatus === 'error' && <p className="submit-error">{listError}</p>}

        {sinResultados && (
          <EmptyState
            icon="medical_services"
            title={buscando ? 'Sin resultados' : 'Sin servicios'}
            description={
              buscando
                ? `No hay servicios que coincidan con "${searchTerm.trim()}". Prueba con otro termino.`
                : 'No hay servicios para esta categoria. Agrega el primero.'
            }
            action={
              <Button variant="primary" icon="add" onClick={abrirNuevo}>
                Agregar servicio
              </Button>
            }
          />
        )}

        {/* -------------------------------------------------------------- grid */}
        {listStatus === 'loaded' && filtrados.length > 0 && (
          <div className="serv-grid">
            {filtrados.map((servicio) => (
              <ServicioCard
                key={servicio.id}
                servicio={servicio}
                toggling={togglingId === servicio.id}
                onToggle={toggleActivo}
                onEditar={abrirEditar}
                onEliminar={setConfirmTarget}
              />
            ))}
          </div>
        )}

        {/* --------------------------------------------------- modal crear/editar */}
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