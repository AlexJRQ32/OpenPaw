import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  getCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} from '../../../shared/utils/cart'
import './CartDrawer.css'

function formatPrice(value) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function itemKey(item) {
  return item.inventarioId != null ? String(item.inventarioId) : String(item.productoId)
}

function CartItemImage({ item }) {
  const [failed, setFailed] = useState(false)
  if (!item.imagenUrl || failed) {
    return (
      <div className="cd-item-img cd-item-img--placeholder" aria-hidden="true">
        <i className="fas fa-paw" />
      </div>
    )
  }
  return (
    <img
      className="cd-item-img"
      src={item.imagenUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export function CartDrawer({ open, onClose, onCheckout, onChange }) {
  const { user } = useAuth()
  const userId = user?.sub
  const [, setTick] = useState(0)

  // Cambios en localStorage desde otras pestanas o acciones internas
  const refresh = useCallback(() => {
    setTick((t) => t + 1)
    onChange?.()
  }, [onChange])

  useEffect(() => {
    if (!open) return
    const onStorage = () => refresh()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [open, userId, refresh])

  // Lee el carrito fresco en cada render cuando esta abierto (siempre sincronizado)
  const items = open ? getCart(userId) : []
  const subtotal = items.reduce((acc, i) => acc + (Number(i.precio) || 0) * i.cantidad, 0)
  const count = items.reduce((acc, i) => acc + i.cantidad, 0)

  if (!open) return null

  return (
    <>
      <div className="cd-overlay" onClick={onClose} />
      <aside className="cd-drawer" role="dialog" aria-label="Carrito de compras" aria-modal="true">
        <header className="cd-header">
          <div className="cd-header-title">
            <i className="fas fa-shopping-cart" aria-hidden="true" />
            <h2>Tu carrito</h2>
            {count > 0 && <span className="cd-badge">{count}</span>}
          </div>
          <button type="button" className="cd-close" onClick={onClose} aria-label="Cerrar carrito">
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </header>
        {items.length === 0 ? (
          <div className="cd-empty">
            <div className="cd-empty-icon"><i className="fas fa-shopping-basket" aria-hidden="true" /></div>
            <h3>Tu carrito esta vacio</h3>
            <p>Explora el marketplace y agrega productos para tu mascota.</p>
            <button type="button" className="cd-empty-btn" onClick={onClose}>Explorar productos</button>
          </div>
        ) : (
          <>
            <div className="cd-items">
              {items.map((item, idx) => (
                <article
                  key={itemKey(item)}
                  className="cd-item"
                  style={{ animationDelay: `${Math.min(idx * 0.06, 0.5)}s` }}
                >
                  <CartItemImage item={item} />
                  <div className="cd-item-body">
                    <div className="cd-item-top">
                      <h3>{item.nombre}</h3>
                      <button
                        type="button"
                        className="cd-item-remove"
                        onClick={() => { removeFromCart(userId, itemKey(item)); refresh() }}
                        aria-label={`Eliminar ${item.nombre}`}
                      >
                        <i className="fas fa-trash-alt" aria-hidden="true" />
                      </button>
                    </div>
                    {item.veterinariaNombre && (
                      <p className="cd-item-vet"><i className="fas fa-hospital" aria-hidden="true" /> {item.veterinariaNombre}</p>
                    )}
                    {item.almacenNombre && item.almacenNombre !== item.veterinariaNombre && (
                      <p className="cd-item-alm"><i className="fas fa-warehouse" aria-hidden="true" /> {item.almacenNombre}</p>
                    )}
                    <div className="cd-item-foot">
                      <div className="cd-stepper">
                        <button
                          type="button"
                          onClick={() => { updateQuantity(userId, itemKey(item), item.cantidad - 1); refresh() }}
                          disabled={item.cantidad <= 1}
                          aria-label="Disminuir cantidad"
                        >
                          <i className="fas fa-minus" aria-hidden="true" />
                        </button>
                        <span>{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => { updateQuantity(userId, itemKey(item), item.cantidad + 1); refresh() }}
                          disabled={Number(item.stock) > 0 && item.cantidad >= Number(item.stock)}
                          aria-label="Aumentar cantidad"
                        >
                          <i className="fas fa-plus" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="cd-item-price">{formatPrice(item.precio * item.cantidad)}</span>
                    </div>
                    {Number(item.stock) > 0 && item.cantidad >= Number(item.stock) && (
                      <p className="cd-stock-max">Maximo disponible: {item.stock}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <footer className="cd-footer">
              <div className="cd-summary">
                <div className="cd-summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="cd-summary-row">
                  <span>Envio</span>
                  <span className="cd-free">Gratis</span>
                </div>
                <div className="cd-summary-row cd-summary-total">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
              <button type="button" className="cd-checkout-btn" onClick={onCheckout}>
                <span>Finalizar compra</span>
                <i className="fas fa-arrow-right" aria-hidden="true" />
              </button>
              <button type="button" className="cd-clear" onClick={() => { clearCart(userId); refresh() }}>
                Vaciar carrito
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
