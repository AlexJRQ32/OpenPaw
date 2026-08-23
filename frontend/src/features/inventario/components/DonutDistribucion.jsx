import './DonutDistribucion.css'

/**
 * DonutDistribucion — gráfico donut SVG propio de la feature Inventario (T34).
 *
 * Wireframe inventario_openpaw: donut de distribución por estado de stock
 * (En stock / Stock bajo / Agotado) con porcentaje central y leyenda textual.
 * No existe componente donut en el DS (solo BarChart de barras y RingProgress
 * de un solo anillo), así que se implementa SVG custom en la feature, no shared.
 *
 * a11y:
 *  - El SVG es decorativo (aria-hidden); la info real va en el texto central
 *    (role="status" no, mejor estructura visible) y en la leyenda textual
 *    con label + porcentaje, de modo que el color NO es el único canal.
 *  - El contenedor expone un aria-label resumen (lectores de pantalla).
 *  - prefers-reduced-motion: la animación de entrada se desactiva.
 *
 * Props:
 *   data    [{ label, value, color }] — segmentos a dibujar.
 *   center  Texto central principal (ej. "92%").
 *   centerSub Texto central secundario (ej. "Saludable").
 *   ariaLabel Resumen para lectores de pantalla (default: genera uno con data).
 *   size    Alto del donut en px (default 180).
 */
export function DonutDistribucion({ data = [], center, centerSub, ariaLabel, size = 180, className = '' }) {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0)

  /* Círculo SVG: r = 40, viewBox 100x100, trazo 8 (patrón wireframe). */
  const R = 40
  const C = 2 * Math.PI * R // 251.327...
  const rawSegments = data.filter((d) => (Number(d.value) || 0) > 0)
  /* Acumulación de fracciones por índice (sin mutación en render). */
  const segments = rawSegments.map((d, index) => {
    const frac = total > 0 ? (Number(d.value) || 0) / total : 0
    const len = frac * C
    const acumulado = rawSegments.slice(0, index).reduce(
      (sum, prev) => sum + (total > 0 ? (Number(prev.value) || 0) / total : 0),
      0
    )
    return {
      ...d,
      dasharray: `${len.toFixed(3)} ${(C - len).toFixed(3)}`,
      dashoffset: (-acumulado * C).toFixed(3),
      pct: Math.round(frac * 100),
      key: `${d.label}-${index}`,
    }
  })

  const summary =
    ariaLabel ||
    (segments.length > 0
      ? `Distribución de stock: ${segments.map((s) => `${s.label} ${s.pct}%`).join(', ')}`
      : 'Distribución de stock: sin datos')

  return (
    <figure className={`donut ${className}`.trim()}>
      <div className="donut__chart" style={{ width: size, height: size }} aria-label={summary} role="img">
        <svg viewBox="0 0 100 100" className="donut__svg" aria-hidden="true">
          {/* Pista de fondo */}
          <circle className="donut__track" cx="50" cy="50" r={R} fill="none" strokeWidth="8" />
          {/* Segmentos acumulados (rotados -90° para empezar arriba) */}
          <g transform="rotate(-90 50 50)">
            {segments.map((s) => (
              <circle
                key={s.key}
                className="donut__seg"
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="8"
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.dashoffset}
                strokeLinecap="butt"
              />
            ))}
          </g>
        </svg>
        {(center != null || centerSub != null) && (
          <div className="donut__center">
            {center != null && <span className="donut__center-value">{center}</span>}
            {centerSub != null && <span className="donut__center-sub">{centerSub}</span>}
          </div>
        )}
      </div>
      {/* Leyenda textual: label + % (el color no es el único canal) */}
      {segments.length > 0 && (
        <figcaption className="donut__legend">
          {segments.map((s) => (
            <div className="donut__legend-item" key={s.label}>
              <span className="donut__swatch" style={{ backgroundColor: s.color }} aria-hidden="true" />
              <span className="donut__legend-label">{s.label}</span>
              <span className="donut__legend-pct">{s.pct}%</span>
            </div>
          ))}
        </figcaption>
      )}
    </figure>
  )
}

export default DonutDistribucion