import { useEffect, useState } from 'react'
import './RingProgress.css'

/**
 * RingProgress — anillo de progreso circular SVG (Material 3, Task #16).
 *
 *   <RingProgress value={85} label="85%" sublabel="Excelente" />
 *
 * Props:
 *   value       0-100 (se clampa). Default 0.
 *   size        Diámetro del anillo en px. Default 120.
 *   strokeWidth Grosor del trazo en px. Default 10.
 *   color       Color del progreso (token M3). Default var(--md-primary).
 *   label       Texto central principal (ej. "85%").
 *   sublabel    Texto central secundario (ej. "Excelente").
 *   ariaLabel   Descripción para lectores de pantalla. Por defecto se arma
 *               con label/sublabel, o "Progreso".
 *
 * Accesibilidad: role="progressbar" + aria-valuenow/min/max sobre el contenedor;
 * el SVG es decorativo (aria-hidden). Animación de entrada: CSS transition en
 * stroke-dashoffset desde 0% hasta el valor (1s ease-out, patrón wireframe).
 */
export function RingProgress({
  value = 0,
  size = 120,
  strokeWidth = 10,
  color = 'var(--md-primary)',
  label,
  sublabel,
  ariaLabel,
  className = '',
  ...props
}) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))
  const radius = Math.max(0, (size - strokeWidth) / 2)
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference * (1 - clamped / 100)

  const [dashoffset, setDashoffset] = useState(circumference)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDashoffset(targetOffset))
    return () => cancelAnimationFrame(id)
  }, [targetOffset])

  const resolvedLabel =
    ariaLabel || (label ? `${label}${sublabel ? ` — ${sublabel}` : ''}` : sublabel) || 'Progreso'

  return (
    <div
      className={`ringprogress ${className}`.trim()}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={resolvedLabel}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        className="ringprogress__svg"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-hidden="true"
      >
        <circle
          className="ringprogress__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className="ringprogress__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          data-dashoffset={targetOffset}
        />
      </svg>
      <div className="ringprogress__content">
        {label != null && (
          <span className="ringprogress__label" style={{ color }}>
            {label}
          </span>
        )}
        {sublabel != null && <span className="ringprogress__sublabel">{sublabel}</span>}
      </div>
    </div>
  )
}