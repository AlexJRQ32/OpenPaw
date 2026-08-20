import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog/ConfirmDialog'
import { useInventario } from '../hooks/useInventario'
import './InventarioPage.css'

function estadoStock(item) {
  if (item.cantidad === 0) return { label: 'Agotado', variant: 'error' }
  if (item.cantidad <= item.stockMinimo) return { label: 'Stock bajo', variant: 'warning' }
  return { label: 'Disponible', variant: 'active' }
}

function formatearMoneda(value) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(value ?? 0)
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

  const filtros = [
    { id: 'todos', label: 'Todos', count: totalRegistros },
    { id: 'con-stock', label: 'Con stock', count: conStock },
    { id: 'stock-bajo', label: 'Stock bajo', count: stockBajo },
    { id: 'agotado', label: 'Agotados', count: agotados },
  ]

  return (
    <AppShell>
      <div className="inv-page">
        <div className="inv-header">
          <div>
            <h1 className="inv-title">Control de inventario</h1>
            <p className="inv-subtitle">Gestiona el stock de productos por almacen.</p>
          </div>
          <Button variant="primary" size="md" onClick={abrirCrear}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo registro
          </Button>
        </div>

        <div className="inv-stats">
          <div className="inv-stat inv-stat--total">
            <span className="inv-stat-number">{totalRegistros}</span>
            <span className="inv-stat-label">Registros</span>
          </div>
          <div className="inv-stat inv-stat--ok">
            <span className="inv-stat-number">{conStock}</span>
            <span className="inv-stat-label">Con stock</span>
          </div>
          <div className="inv-stat inv-stat--warn">
            <span className="inv-stat-number">{stockBajo}</span>
            <span className="inv-stat-label">Stock bajo</span>
          </div>
          <div className="inv-stat inv-stat--bad">
            <span className="inv-stat-number">{agotados}</span>
            <span className="inv-stat-label">Agotados</span>
          </div>
        </div>

        <div className="inv-tabs">
          {filtros.map((f) => (
            <button
              key={f.id}
              className={`inv-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span className="inv-tab-count">{f.count}</span>
            </button>
          ))}
        </div>

        {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}
        {listStatus === 'error' && <p className="submit-error">{listError}</p>}

        {listStatus === 'loaded' && (
          <div className="inv-card">
            {filtrados.length === 0 ? (
              <EmptyState
                title="Sin registros de inventario"
                description="No hay movimientos de inventario para este filtro. Agrega un nuevo registro para comenzar."
                action={<Button variant="primary" size="md" onClick={abrirCrear}>Agregar producto</Button>}
              />
            ) : (
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Almacen</th>
                      <th>Cantidad</th>
                      <th>Stock min</th>
                      <th>Stock max</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item) => {
                      const estado = estadoStock(item)
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="inv-product">
                              <span className="inv-product-badge">{item.producto?.nombre?.[0]?.toUpperCase() || '?'}</span>
                              <div>
                                <span className="inv-product-name">{item.producto?.nombre || `Producto #${item.productoId}`}</span>
                                {item.producto?.precio != null && (
                                  <span className="inv-product-price">{formatearMoneda(item.producto.precio)}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{item.almacen?.nombre || `Almacen #${item.almacenId}`}</td>
                          <td><span className="inv-cantidad">{item.cantidad}</span></td>
                          <td>{item.stockMinimo}</td>
                          <td>{item.stockMaximo ?? '—'}</td>
                          <td><Badge variant={estado.variant}>{estado.label}</Badge></td>
                          <td>
                            <div className="inv-actions">
                              <button type="button" className="inv-action" title="Editar" onClick={() => abrirEditar(item)}>
                                <i className="fas fa-pen"></i>
                              </button>
                              <button type="button" className="inv-action inv-action--danger" title="Eliminar" onClick={() => setConfirmTarget(item)}>
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
