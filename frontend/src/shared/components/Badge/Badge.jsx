import './badge.css'
import { Icon } from '../Icon/Icon'

/**
 * Badge - chip pill de estado (Material 3).
 *
 * Variantes M3:
 *   success/active   -> secondary-container / on-secondary-container
 *   error/danger     -> error-container      / on-error-container
 *   warning/info/pending -> tertiary-container / on-tertiary-container
 *   neutral/inactive -> surface-container-high / on-surface-variant
 *   primary          -> primary-container    / on-primary-container
 *
 * Props nuevas:
 *   icon  Nombre de Material Symbols; renderiza <Icon name size="14px" /> a la izquierda.
 *         Ej: <Badge icon="check_circle" variant="success">Confirmada</Badge>
 *   dot   Punto circular (6px) antes del texto.
 *         - true            -> color segun la variante (verde para success/active, gris neutral, etc.)
 *         - nombre semantico -> 'success' | 'error' | 'warning' | 'info' | 'pending' | 'neutral'
 *                              | 'inactive' | 'active' | 'primary' | 'danger' (mapeado a tokens M3)
 *         - color CSS directo -> '#22c55e' o 'var(--md-secondary)'
 *         Ej: <Badge dot>Activo</Badge> / <Badge dot="#f59e0b">En ruta</Badge>
 */
const DOT_TOKENS = {
  success: 'var(--md-secondary)',
  active: 'var(--md-secondary)',
  error: 'var(--md-error)',
  danger: 'var(--md-error)',
  warning: 'var(--md-tertiary)',
  info: 'var(--md-tertiary)',
  pending: 'var(--md-tertiary)',
  neutral: 'var(--md-outline)',
  inactive: 'var(--md-outline)',
  primary: 'var(--md-primary)',
}

function resolveDotColor(dot, variant) {
  if (dot === true) return DOT_TOKENS[variant] || 'var(--md-outline)'
  if (typeof dot === 'string') return DOT_TOKENS[dot] || dot
  return undefined
}

export function Badge({ variant = 'pending', icon, dot = false, filled = false, className = '', children, ...props }) {
  const dotColor = resolveDotColor(dot, variant)
  const classes = ['badge', `badge--${variant}`, className].filter(Boolean).join(' ')

  return (
    <span className={classes} {...props}>
      {dotColor && <span className="badge__dot" aria-hidden="true" style={{ backgroundColor: dotColor }} />}
      {icon && <Icon name={icon} size="14px" filled={filled} className="badge__icon" />}
      {children}
    </span>
  )
}
