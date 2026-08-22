import './toggle-switch.css'

/**
 * ToggleSwitch - switch Material 3 accesible (Design System OpenPaw).
 *
 * Implementacion: <button role="switch" aria-checked> (mas limpio que checkbox:
 * control total del estilo del track/thumb y semantica ARIA nativa).
 *
 * Props:
 *   checked   Estado on/off (controlado).                    default false
 *   onChange  (checked: boolean) => void — se invoca con el nuevo estado.
 *   label     Texto visible junto al switch y accessible name
 *             (patron wireframe "Activo"/"Inactivo" inline en la tarjeta).
 *             Sin label el switch sigue siendo accesible via aria-label.
 *   disabled  Deshabilita la interaccion.                    default false
 *   size      'sm' | 'md'                                    default 'md'
 *
 * Uso:
 *   <ToggleSwitch checked={activo} onChange={setActivo} label={activo ? 'Activo' : 'Inactivo'} />
 */
export function ToggleSwitch({
  checked = false,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
  ...props
}) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`tswitch tswitch--${size} ${checked ? 'is-on' : ''} ${
        disabled ? 'is-disabled' : ''
      }`.trim()}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      {...props}
    >
      <span className="tswitch__thumb" aria-hidden="true" />
    </button>
  )

  if (!label) return <span className={`tswitch__field ${className}`.trim()}>{control}</span>

  return (
    <span className={`tswitch__field ${className}`.trim()}>
      {control}
      <span className="tswitch__label">{label}</span>
    </span>
  )
}
