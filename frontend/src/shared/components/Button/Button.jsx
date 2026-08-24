import './button.css'
import { Icon } from '../Icon/Icon'

/**
 * Button — botón compartido del Design System OpenPaw (M3, pill).
 *
 * Variantes: primary (default) | secondary | outline | danger | ghost | accent | success
 * Tamaños:  sm | md (default) | lg
 *
 * Icono Material Symbols (opcional):
 *   <Button icon="add">Nueva consulta</Button>            → icono a la izquierda
 *   <Button icon="arrow_forward" iconPosition="right">Ingresar</Button>
 * El icono se desplaza en hover (efecto wireframe).
 *
 * Loading (opcional): muestra spinner + disabled + aria-busy.
 * Compatibilidad: children arbitrarios (texto, <i> de FontAwesome, <svg>) siguen
 * funcionando; el gap flex alinea iconos heredados.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {icon && iconPosition === 'left' && (
        <Icon name={icon} size={20} className="btn__icon" aria-hidden="true" />
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <Icon name={icon} size={20} className="btn__icon btn__icon--right" aria-hidden="true" />
      )}
    </button>
  )
}