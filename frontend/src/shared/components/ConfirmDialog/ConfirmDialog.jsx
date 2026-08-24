import { Modal } from '../Modal/Modal'
import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import './confirm-dialog.css'

export function ConfirmDialog({
  open,
  title = '¿Esta seguro?',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  children,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel} className="confirm-dialog">
      <div className={`confirm-dialog-body confirm-dialog-body--${variant}`}>
        <span className="confirm-dialog-icon">
          {variant === 'success' ? (
            <Icon name="check_circle" size={28} />
          ) : (
            <Icon name="warning" size={28} />
          )}
        </span>
        <h2 className="confirm-dialog-title">{title}</h2>
        {message && <p className="confirm-dialog-message">{message}</p>}
        {children}
        <div className="confirm-dialog-actions">
          <Button variant="secondary" size="sm" type="button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="sm" type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
