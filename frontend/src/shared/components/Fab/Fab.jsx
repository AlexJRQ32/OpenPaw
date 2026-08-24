import './fab.css'
import { Icon } from '../Icon/Icon'

/**
 * Fab - boton de accion flotante Material 3 (Design System OpenPaw).
 *
 * 56px circular, fondo --md-primary con color on-primary, sombra
 * --shadow-level-2 y glow al hover (wireframe expediente: FAB "+" abajo derecha).
 *
 * Props:
 *   icon      Nombre de Material Symbols.                     default 'add'
 *   onClick   Handler del clic.
 *   label     Texto para aria-label (obligatorio en uso real: el FAB no
 *             tiene texto visible).
 *   position  'bottom-right' | 'bottom-left' | 'static'       default 'bottom-right'
 *             static = flujo normal (para contenedores propios).
 *   color     'primary' | 'secondary' | 'error'               default 'primary'
 *
 * Uso:
 *   <Fab label="Nueva mascota" onClick={openModal} />
 */
export function Fab({
  icon = 'add',
  onClick,
  label,
  position = 'bottom-right',
  color = 'primary',
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`fab fab--${position} fab--${color} ${className}`.trim()}
      aria-label={label}
      title={label}
      onClick={onClick}
      {...props}
    >
      <Icon name={icon} size={24} className="fab__icon" />
    </button>
  )
}
