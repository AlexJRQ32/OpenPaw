import './EmptyState.css'
import { Icon } from './Icon/Icon'
import { Button } from './Button/Button'

/**
 * EmptyState — estado vacío compartido (M3, Design System OpenPaw).
 *
 * Estructura: icono grande en círculo tintado + título + descripción + acción opcional.
 *
 * Variantes:
 *   default (por defecto) — fondo suave --md-surface-container-low, sin borde visible.
 *   dashed                — borde punteado outline-variant/50 y fondo surface
 *                           (réplica del wireframe de aprobaciones).
 *
 * Acción (tres formas, por prioridad):
 *   1. action={<Button .../>}            → nodo React (compatibilidad con usos previos).
 *   2. children                          → nodo React como acción personalizada.
 *   3. actionLabel + onAction            → botón pill primario interno.
 *
 * Compatibilidad: title / description / action siguen funcionando igual que antes.
 */
export function EmptyState({
  title,
  description,
  action,
  children,
  icon = 'pets',
  variant = 'default',
  actionLabel,
  onAction,
  className = '',
}) {
  const resolvedAction = action ?? children ?? null
  if (import.meta.env.DEV && Boolean(actionLabel) !== Boolean(onAction)) {
    console.warn('EmptyState: actionLabel y onAction deben pasarse juntos; uno de los dos falta.')
  }
  const showAction = Boolean(resolvedAction || (actionLabel && onAction))

  return (
    <section className={`empty-state empty-state--${variant} ${className}`.trim()} role="status">
      {icon && (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon name={icon} size={32} />
        </span>
      )}
      {title ? <h3 className="empty-state__title">{title}</h3> : null}
      {description ? <p className="empty-state__description">{description}</p> : null}
      {showAction && (
        <div className="empty-state__action">
          {resolvedAction ?? (
            <Button variant="primary" size="md" type="button" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
