import './Icon.css'

/**
 * Icon - icono Material Symbols Outlined compartido.
 *
 * Uso basico:  <Icon name="pets" />
 * Con relleno: <Icon name="favorite" filled />
 * Tamano:      <Icon name="pets" size={24} />
 * Color:       <Icon name="pets" color="var(--color-primary)" />
 *
 * Renderiza: <span class="material-symbols-outlined icon">pets</span>
 * con font-variation-settings para soportar FILL (patron de los wireframes).
 */
export function Icon({
  name,
  size,
  filled = false,
  weight = 400,
  color,
  className = '',
  style,
  ...rest
}) {
  const fill = filled ? 1 : 0
  return (
    <span
      className={`material-symbols-outlined icon ${className}`.trim()}
      aria-hidden="true"
      style={{
        fontSize: size,
        color,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
      {...rest}
    >
      {name}
    </span>
  )
}