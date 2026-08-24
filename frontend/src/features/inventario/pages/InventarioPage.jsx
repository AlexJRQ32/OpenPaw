import { useMemo, useState } from 'react'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { Pagination } from '../../../shared/components/Pagination/Pagination'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { useInventario } from '../hooks/useInventario'
import { DonutDistribucion } from '../components/DonutDistribucion'
import { InventarioMap } from '../components/InventarioMap'
import { descargarInventarioCSV } from '../utils/exportarCSV'
import './InventarioPage.css'

const PAGE_SIZE = 8

function estadoStock(item) {
  if (item.cantidad === 0) return { label: 'Agotado', variant: 'error' }
  if (item.cantidad <= item.stockMinimo) return { label: 'Stock bajo', variant: 'warning' }
  return { label: 'En stock', variant: 'active' }
}

function formatearMoneda(value) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value ?? 0)
}

/* ---------------------------------------------------------------------------
   Stat bento (wireframe inventario_openpaw): 4 tarjetas con icono en círculo
   tintado + glow decorativo por esquina.
   --------------------------------------------------------------------------- */
function StatCard({ label, value, icon, tone }) {
  return (
    <div className={`inv-stat inv-stat--${tone}`}>
      <span className="inv-stat__glow" aria-hidden="true" />
      <div className="inv-stat__row">
        <span className="inv-stat__icon" aria-hidden="true">
          <Icon name={icon} size={24} filled />
        </span>
      </div>
      <div className="inv-stat__text">
        <p className="inv-stat__label">{label}</p>
        <p className="inv-stat__value">{value.toLocaleString('es-CR')}</p>
      </div>
    </div>
  )
}

/* Icono Material Symbols por ubicación (wireframe: shelves / kitchen /
   inventory_2 según el tipo de almacén). Fallback por nombre. */
function ubicacionIcon(almacen) {
  const nombre = (almacen?.nombre || '').toLowerCase()
  if (nombre.includes('refri') || nombre.includes('frio') || nombre.includes('crio')) return 'kitchen'
  if (nombre.includes('gabinete') || nombre.includes('estante') || nombre.includes('shelf')) return 'shelves'
  if (nombre.includes('caja')) return 'inventory_2'
  return 'warehouse'
}

export function InventarioPage() {
  const {
    inventario, filtrados, productos, almacenes, esAdmin, listStatus, listError,
    modalOpen, editando, form, errors, submitStatus, submitError,
    filter, setFilter, abrirCrear, abrirEditar, cerrar, handleChange, guardar,
    confirmTarget, setConfirmTarget, confirmarEliminar, deleting,
  } = useInventario()

  const totalRegistros = inventario.length
  const conStock = inventario.filter((i) => i.cantidad > i.stockMinimo).length
  const stockBajo = inventario.filter((i) => i.cantidad > 0 && i.cantidad <= i.stockMinimo).length
  const agotados = inventario.filter((i) => i.cantidad === 0).length

  /* Paginación client-side (Pagination del DS). La página se deriva del total
     de páginas para no requerir effects (patrón Funcionarios T32). */
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pageItems = useMemo(
    () => filtrados.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtrados, safePage]
  )

  const cambiarFiltro = (id) => {
    setFilter(id)
    setPage(1)
  }

  const filtros = [
    { id: 'todos', label: 'Todos', count: totalRegistros },
    { id: 'con-stock', label: 'En Stock', count: conStock },
    { id: 'stock-bajo', label: 'Stock Bajo', count: stockBajo },
    { id: 'agotado', label: 'Agotados', count: agotados },
  ]

  /* Donut: distribución por estado de stock (porcentaje sobre el total). */
  const donutData = [
    { label: 'En stock', value: conStock, color: 'var(--md-secondary)' },
    { label: 'Stock bajo', value: stockBajo, color: 'var(--md-tertiary)' },
    { label: 'Agotado', value: agotados, color: 'var(--md-error)' },
  ]
  const pctSaludable = totalRegistros > 0 ? Math.round((conStock / totalRegistros) * 100) : 0

  const exportar = () => {
    descargarInventarioCSV(inventario, estadoStock)
  }

  return (
    <AppShell>
      <div className="inv-page">
        {/* ------------------------------------------------------------ header */}
        <header className="inv-header">
          <div>
            <h1 className="inv-title">Inventario</h1>
            <p className="inv-subtitle">
              Gestiona el inventario de la clínica, niveles de stock y ubicaciones de almacenamiento.
              Mantén el control de los suministros vitales.
            </p>
          </div>
          <div className="inv-header-actions">
            <Button variant="secondary" size="md" icon="file_download" onClick={exportar}>
              Exportar
            </Button>
            <Button variant="primary" size="md" icon="add" onClick={abrirCrear}>
              Nuevo Producto
            </Button>
          </div>
        </header>

        {/* ---------------------------------------------------------- stats */}
        <div className="inv-stats" role="group" aria-label="Resumen de inventario">
          <StatCard label="Total Productos" value={totalRegistros} icon="inventory" tone="total" />
          <StatCard label="Stock Crítico" value={agotados} icon="warning" tone="critico" />
          <StatCard label="Stock Bajo" value={stockBajo} icon="pending_actions" tone="pendiente" />
          <StatCard label="En Stock" value={conStock} icon="check_circle" tone="ok" />
        </div>

        {/* -------------------------------------------- main: split layout */}
        <div className="inv-main">
          {/* Columna izquierda: donut + mapa */}
          <div className="inv-side">
            <section className="inv-card inv-card--panel" aria-label="Distribución de stock">
              <h3 className="inv-panel-title">Distribución</h3>
              <DonutDistribucion
                data={donutData}
                center={totalRegistros > 0 ? `${pctSaludable}%` : '0%'}
                centerSub={totalRegistros > 0 ? 'Saludable' : 'Sin datos'}
                ariaLabel={`Distribución de stock: ${conStock} en stock, ${stockBajo} bajo, ${agotados} agotados`}
              />
            </section>

            <section className="inv-card inv-card--panel" aria-label="Mapa de almacenes">
              <h3 className="inv-panel-title">Almacenes</h3>
              <div className="inv-map">
                <InventarioMap almacenes={almacenes} ariaLabel="Mapa de ubicaciones de almacenamiento del inventario" />
                <div className="inv-map-overlay" aria-hidden="true" />
                <div className="inv-map-caption">
                  <div>
                    <p className="inv-map-caption__label">Ubicación Principal</p>
                    <p className="inv-map-caption__name">
                      {almacenes[0]?.nombre || 'Almacén Central'}
                    </p>
                  </div>
                  <span className="inv-map-caption__pin" aria-hidden="true">
                    <Icon name="location_on" size={16} />
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Columna principal: tabla + filtros + paginación */}
          <section className="inv-card inv-card--table" aria-label="Registros de inventario">
            <div className="inv-toolbar">
              <div className="inv-chips" role="group" aria-label="Filtrar por estado de stock">
                {filtros.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`inv-chip ${filter === f.id ? 'is-active' : ''}`.trim()}
                    aria-pressed={filter === f.id}
                    onClick={() => cambiarFiltro(f.id)}
                  >
                    {f.label} <span className="inv-chip__count">{f.count}</span>
                  </button>
                ))}
              </div>
              <span className="inv-toolbar-filter" aria-hidden="true">
                <Icon name="filter_list" size={20} />
                Filtros
              </span>
            </div>

            {listStatus === 'loading' && (
              <div className="inv-loading" role="status" aria-label="Cargando inventario">
                <span className="spinner" />
              </div>
            )}
            {listStatus === 'error' && <p className="submit-error">{listError}</p>}

            {listStatus === 'loaded' && filtrados.length === 0 && (
              <EmptyState
                icon="inventory_2"
                title="Sin registros de inventario"
                description="No hay registros de inventario para este filtro. Agrega un nuevo registro para comenzar."
                action={<Button variant="primary" size="md" icon="add" onClick={abrirCrear}>Agregar producto</Button>}
              />
            )}

            {listStatus === 'loaded' && filtrados.length > 0 && (
              <>
                <div className="inv-table-wrap">
                  <table className="inv-table" aria-label="Lista de inventario">
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col">Categoría</th>
                        <th scope="col">Ubicación</th>
                        <th scope="col" className="inv-table__num">Cantidad</th>
                        <th scope="col" className="inv-table__center">Estado</th>
                        <th scope="col" className="inv-table__right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item) => {
                        const estado = estadoStock(item)
                        return (
                          <tr key={item.id} className="inv-row">
                            <td>
                              <div className="inv-product">
                                <span className="inv-product-badge" aria-hidden="true">
                                  {item.producto?.nombre?.[0]?.toUpperCase() || '?'}
                                </span>
                                <div>
                                  <span className="inv-product-name">{item.producto?.nombre || `Producto #${item.productoId}`}</span>
                                  {item.producto?.precio != null && (
                                    <span className="inv-product-sub">{formatearMoneda(item.producto.precio)}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="inv-cell">{item.producto?.categoria || '—'}</span>
                            </td>
                            <td>
                              <span className="inv-location">
                                <Icon name={ubicacionIcon(item.almacen)} size={16} className="inv-location__icon" />
                                {item.almacen?.nombre || `Almacén #${item.almacenId}`}
                              </span>
                            </td>
                            <td className="inv-table__num">
                              <span className="inv-cantidad">{item.cantidad}</span>
                              <span className="inv-stock-range">min {item.stockMinimo}{item.stockMaximo != null ? ` · máx ${item.stockMaximo}` : ''}</span>
                            </td>
                            <td className="inv-table__center">
                              <Badge variant={estado.variant} dot>{estado.label}</Badge>
                            </td>
                            <td className="inv-table__right">
                              <div className="inv-actions">
                                <button type="button" className="inv-action" title="Editar" aria-label={`Editar ${item.producto?.nombre || 'registro'}`} onClick={() => abrirEditar(item)}>
                                  <Icon name="edit" size={18} />
                                </button>
                                <button type="button" className="inv-action inv-action--danger" title="Eliminar" aria-label={`Eliminar ${item.producto?.nombre || 'registro'}`} onClick={() => setConfirmTarget(item)}>
                                  <Icon name="delete" size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="inv-pagination">
                  <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtrados.length} onChange={setPage} />
                </div>
              </>
            )}
          </section>
        </div>

        {/* ---------------------------------------------- modal crear/editar */}
        <Modal open={modalOpen} onClose={cerrar} className="inventario-modal">
          <div>
            <h2>{editando ? 'Editar registro de inventario' : 'Nuevo registro de inventario'}</h2>
            <form onSubmit={guardar} noValidate>
              <div className="field-grid">
                <label className="field field--wide">
                  <span>Producto</span>
                  <select name="productoId" value={form.productoId} onChange={handleChange} disabled={!!editando}>
                    <option value="">Seleccionar producto...</option>
                    {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  {errors.productoId && <small>{errors.productoId}</small>}
                </label>
                <label className="field field--wide">
                  <span>Almacen {!esAdmin && <small style={{ display: 'inline', fontWeight: 'normal' }}>(vinculado a tu comercio)</small>}</span>
                  <select name="almacenId" value={form.almacenId} onChange={handleChange} disabled={!!editando || !esAdmin}>
                    <option value="">{almacenes.length > 0 ? 'Seleccionar almacen...' : 'No hay almacenes disponibles'}</option>
                    {almacenes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  {errors.almacenId && <small>{errors.almacenId}</small>}
                </label>
                <Field label="Cantidad" name="cantidad" type="number" min="0" value={form.cantidad} error={errors.cantidad} onChange={handleChange} />
                <Field label="Stock minimo" name="stockMinimo" type="number" min="0" value={form.stockMinimo} error={errors.stockMinimo} onChange={handleChange} />
                <Field label="Stock maximo (opcional)" name="stockMaximo" type="number" min="0" value={form.stockMaximo} error={errors.stockMaximo} onChange={handleChange} />
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="inventario-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        <ConfirmDialog
          open={!!confirmTarget}
          title="¿Eliminar registro de inventario?"
          message={confirmTarget
            ? `Se eliminara el registro de "${confirmTarget.producto?.nombre || 'producto'}" en "${confirmTarget.almacen?.nombre || 'almacen'}". Esta accion no se puede deshacer.`
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

export default InventarioPage