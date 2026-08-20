import { Modal } from '../Modal/Modal'
import { Button } from '../Button/Button'
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
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
