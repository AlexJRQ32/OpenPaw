import './toast.css'
import { Icon } from '../Icon/Icon'

const ICONS = {
  success: <Icon name="check_circle" size={20} />,
  error: <Icon name="cancel" size={20} />,
  info: <Icon name="info" size={20} />,
  warning: <Icon name="warning" size={20} />,
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast-icon">{ICONS[toast.type]}</span>
          <span className="toast-message">{toast.message}</span>
          <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Cerrar notificacion">
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
