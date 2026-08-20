import { Modal } from '../../../shared/components/Modal/Modal'
import './CheckoutSuccessModal.css'

function formatPrice(value) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function CheckoutSuccessModal({ open, onClose, subtotal, count }) {
  return (
    <Modal open={open} onClose={onClose} className="csm-modal">
      <div className="csm">
        <div className="csm-check">
          <svg viewBox="0 0 52 52" className="csm-check-svg" aria-hidden="true">
            <circle className="csm-check-circle" cx="26" cy="26" r="24" fill="none" />
            <path className="csm-check-mark" fill="none" d="M14 27l8 8 16-16" />
          </svg>
        </div>
        <h2>¡Compra realizada!</h2>
        <p className="csm-sub">
          Tu pedido de <strong>{count} {count === 1 ? 'producto' : 'productos'}</strong> se registro con exito.
        </p>

        <div className="csm-resumen">
          <div className="csm-resumen-row">
            <span>Total pagado</span>
            <span className="csm-total">{formatPrice(subtotal)}</span>
          </div>
          <div className="csm-resumen-row csm-muted">
            <span>Estado</span>
            <span className="csm-estado"><i className="fas fa-circle" aria-hidden="true" /> Procesando</span>
          </div>
        </div>

        <p className="csm-note">
          <i className="fas fa-truck" aria-hidden="true" />
          El comercio preparara tu envio. Te notificaremos cuando este en camino.
        </p>

        <button type="button" className="csm-btn" onClick={onClose} autoFocus>
          Seguir comprando
        </button>
      </div>
    </Modal>
  )
}
