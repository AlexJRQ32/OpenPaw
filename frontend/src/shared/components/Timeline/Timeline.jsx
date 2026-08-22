import './Timeline.css'
import { Icon } from '../Icon/Icon'

/**
 * Timeline — línea de tiempo vertical (Material 3, Task #16).
 *
 * Uso con items:
 *   <Timeline items={[
 *     { icono: 'stethoscope', titulo: 'Revisión Anual', descripcion: '...',
 *       fecha: '15 Oct, 2023', ubicacion: 'Clínica Veterinaria San José',
 *       tipo: 'primary', adjuntos: [{ nombre: 'receta_oct23.pdf', icono: 'picture_as_pdf' }] },
 *   ]} />
 *
 * Uso con hijos custom:
 *   <Timeline>
 *     <li className="timeline__item">…</li>
 *   </Timeline>
 *
 * Props por item:
 *   icono       Nombre de Material Symbols para el nodo (si se omite: dot de color).
 *   titulo      Título del evento (headline).
 *   descripcion Texto descriptivo.
 *   fecha       Texto de fecha (se muestra con icono calendar_month).
 *   ubicacion   Lugar (se muestra con icono location_on).
 *   tipo        primary (default) | secondary | tertiary | error — color de nodo y badge.
 *   tipoLabel   Texto del badge pill (opcional). Ej: 'Consulta General'.
 *   adjuntos    Array de { nombre, icono? } o strings — chips al pie de la card.
 *
 * Semántica: <ol> con <li> por evento. Iconos decorativos con aria-hidden.
 */
const TIPO_CLASS = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  error: 'error',
}

function Attachment({ adjunto }) {
  const nombre = typeof adjunto === 'string' ? adjunto : adjunto.nombre
  const icono = typeof adjunto === 'string' ? 'picture_as_pdf' : adjunto.icono || 'picture_as_pdf'
  return (
    <span className="timeline__attachment">
      <Icon name={icono} size={16} aria-hidden="true" />
      {nombre}
    </span>
  )
}

export function Timeline({ items = [], ariaLabel = 'Línea de tiempo', className = '', children }) {
  return (
    <ol className={`timeline ${className}`.trim()} aria-label={ariaLabel}>
      {items.length > 0
        ? items.map((item, idx) => (
            <li key={item.key ?? idx} className="timeline__item">
              <span
                className={`timeline__node timeline__node--${TIPO_CLASS[item.tipo] || 'primary'}`}
                aria-hidden="true"
              >
                {item.icono ? (
                  <Icon name={item.icono} size={18} className="timeline__node-icon" />
                ) : null}
              </span>
              <article className="timeline__card">
                <header className="timeline__header">
                  {item.tipoLabel && (
                    <span
                      className={`timeline__badge timeline__badge--${TIPO_CLASS[item.tipo] || 'primary'}`}
                    >
                      {item.icono && <Icon name={item.icono} size={14} aria-hidden="true" />}
                      {item.tipoLabel}
                    </span>
                  )}
                  {item.fecha && (
                    <span className="timeline__meta">
                      <Icon name="calendar_month" size={16} aria-hidden="true" />
                      {item.fecha}
                    </span>
                  )}
                </header>
                {item.ubicacion && (
                  <p className="timeline__ubicacion">
                    <Icon name="location_on" size={16} aria-hidden="true" />
                    {item.ubicacion}
                  </p>
                )}
                <h3 className="timeline__titulo">{item.titulo}</h3>
                {item.descripcion && <p className="timeline__descripcion">{item.descripcion}</p>}
                {item.adjuntos?.length > 0 && (
                  <footer className="timeline__adjuntos">
                    <span className="timeline__adjuntos-label">Archivos adjuntos:</span>
                    {item.adjuntos.map((adjunto, i) => (
                      <Attachment key={i} adjunto={adjunto} />
                    ))}
                  </footer>
                )}
              </article>
            </li>
          ))
        : children}
    </ol>
  )
}