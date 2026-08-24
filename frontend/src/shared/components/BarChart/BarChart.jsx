import './BarChart.css'

/**
 * BarChart — gráfico de barras simple sin librerías (divs + CSS, Task #16).
 *
 *   <BarChart data={[{ label: 'May', value: 27 }, { label: 'Jun', value: 27.5 }]} />
 *
 * Props:
 *   data           Array de { label, value }.
 *   color          Color de las barras (token M3). Default var(--md-primary).
 *   maxValue       Máximo del eje (auto por defecto: valor más alto de data).
 *   showValues     Muestra el valor sobre cada barra (visible en hover y en la
 *                  barra resaltada). Default true. Siempre hay tooltip nativo
 *                  (title) con "label: value".
 *   height         Alto del área de barras en px. Default 180.
 *   highlightIndex Índice de la barra resaltada (color pleno + glow). Opcional.
 *   ariaLabel      Resumen para lectores de pantalla (default: genera uno con data).
 *
 * Accesibilidad: contenedor role="img" + aria-label con resumen de la serie.
 * Animación de entrada: scaleY desde 0 con stagger por índice (CSS keyframes).
 * Barras con radio superior (rounded) y hover a color pleno.
 */
export function BarChart({
  data = [],
  color = 'var(--md-primary)',
  maxValue,
  showValues = true,
  height = 180,
  highlightIndex,
  ariaLabel,
  className = '',
  ...props
}) {
  const values = data.map((d) => Number(d.value) || 0)
  const max = maxValue != null && maxValue > 0 ? Number(maxValue) : Math.max(...values, 1)

  const summary =
    ariaLabel ||
    (data.length > 0
      ? `Gráfico de barras: ${data.map((d) => `${d.label}: ${d.value}`).join(', ')}`
      : 'Gráfico de barras vacío')

  return (
    <div className={`barchart ${className}`.trim()} role="img" aria-label={summary} {...props}>
      <div className="barchart__plot" style={{ height }}>
        {data.map((d, i) => {
          const value = Number(d.value) || 0
          const pct = Math.max(0, Math.round((value / max) * 100))
          const highlighted = highlightIndex === i
          return (
            <div
              key={`${d.label}-${i}`}
              className={`barchart__col ${highlighted ? 'barchart__col--highlight' : ''}`.trim()}
              style={{ '--bar-height': `${pct}%`, animationDelay: `${i * 60}ms` }}
              title={`${d.label}: ${d.value}`}
            >
              {showValues && <span className="barchart__value">{d.value}</span>}
              <span
                className="barchart__bar"
                style={{ backgroundColor: color, color }}
              />
            </div>
          )
        })}
      </div>
      {data.length > 0 && (
        <div className="barchart__labels">
          {data.map((d, i) => (
            <span key={`${d.label}-${i}`} className="barchart__label">
              {d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}