import './pagination.css'
import { Icon } from '../Icon/Icon'

/**
 * Pagination - paginacion Material 3 (Design System OpenPaw).
 *
 * Renderiza (wireframes funcionarios/inventario):
 *   "Mostrando 1-3 de 142" + chevrons prev/next + paginas numeradas
 *   con elipsis (1 ... 4 5 6 ... 20 — ventana de ~3 alrededor de la actual).
 * Pagina activa: bg --md-primary + texto on-primary + aria-current="page".
 * Prev disabled en la primera pagina; next disabled en la ultima.
 *
 * Props:
 *   page      Pagina actual (1-indexed).
 *   pageSize  Elementos por pagina.
 *   total     Total de elementos.
 *   onChange  (page: number) => void
 *   showInfo  Muestra el texto "Mostrando X-Y de Z".       default true
 */
function buildPageItems(page, totalPages) {
  if (totalPages <= 1) return [1]

  const pages = new Set([1, totalPages])
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const items = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) items.push(`ellipsis-${items.length}`)
    items.push(p)
    prev = p
  }
  return items
}

export function Pagination({ page, pageSize, total, onChange, showInfo = true }) {
  // B1: pageSize invalido (0, negativo o NaN) se trata como 1 para evitar division por cero.
  const safePageSize = Math.max(1, Number(pageSize) || 1)
  const totalPages = Math.max(1, Math.ceil(total / safePageSize))
  // M2: clamp de la pagina al rango valido [1, totalPages].
  const current = Math.min(Math.max(1, page), totalPages)
  const start = total === 0 ? 0 : (current - 1) * safePageSize + 1
  const end = Math.min(current * safePageSize, total)
  const items = buildPageItems(current, totalPages)

  // M1: no re-notifica si ya se esta en esa pagina.
  const goTo = (p) => {
    if (p !== current) onChange?.(p)
  }

  return (
    <nav className="pagination" aria-label="Paginación">
      {showInfo && (
        <p className="pagination__info">
          Mostrando {start}-{end} de {total}
        </p>
      )}
      <div className="pagination__pages">
        <button
          type="button"
          className="pagination__arrow"
          aria-label="Página anterior"
          disabled={current <= 1}
          onClick={() => goTo(current - 1)}
        >
          <Icon name="chevron_left" size={20} />
        </button>

        {items.map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              className={`pagination__page ${item === current ? 'is-active' : ''}`.trim()}
              aria-current={item === current ? 'page' : undefined}
              onClick={() => goTo(item)}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="pagination__ellipsis" aria-hidden="true">
              …
            </span>
          )
        )}

        <button
          type="button"
          className="pagination__arrow"
          aria-label="Página siguiente"
          disabled={current >= totalPages}
          onClick={() => goTo(current + 1)}
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>
    </nav>
  )
}
