import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../../../shared/components/Icon/Icon'
import './VetCarousel.css'

/**
 * VetCarousel — carrusel horizontal accesible de veterinarias aliadas (T39).
 *
 * Wireframe marketplace_openpaw: fila "Veterinarias Aliadas" con tarjetas
 * desplazables (scroll-snap), encabezado con icono filled y acción "Ver todas".
 *
 * Accesibilidad:
 *  - Botones prev/next con aria-label y estado disabled en los extremos.
 *  - Teclado: ArrowLeft/ArrowRight desplazan; Home/End van al inicio/fin.
 *    (Los slides son <button> nativos: focusable + Enter/Space ya incluidos.)
 *  - aria-roledescription="carrusel", region con aria-label y live region
 *    que anuncia el total de opciones.
 *  - Selección con aria-pressed (no solo color).
 *  - prefers-reduced-motion: el desplazamiento pasa de smooth a auto.
 *  - Sin autoplay: es un selector de filtro interactivo, no un escaparate
 *    pasivo, por lo que no hay movimiento que pausar.
 */
export function VetCarousel({
  items = [],
  selectedId,
  onSelect,
  label = 'Veterinarias aliadas',
  title = 'Veterinarias Aliadas',
  onSeeAll,
}) {
  const scrollerRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const prefersReducedMotion = () =>
    typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth')

  /* Recalcula el estado de las flechas segun el overflow real del track */
  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    const hasOverflow = maxScroll > 4
    setCanPrev(hasOverflow && el.scrollLeft > 4)
    setCanNext(hasOverflow && el.scrollLeft < maxScroll - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = scrollerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const obs = new ResizeObserver(updateArrows)
    obs.observe(el)
    return () => obs.disconnect()
  }, [updateArrows, items.length])

  /* Gap real del track (CSS --gutter) con fallback 16px; evita avance corto
     por desincronización entre JS y CSS (fix QA LOW T39) */
  const trackGap = () => {
    const el = scrollerRef.current
    if (!el || typeof window.getComputedStyle !== 'function') return 16
    try {
      const raw = parseFloat(window.getComputedStyle(el).columnGap ?? '')
      return Number.isNaN(raw) ? 16 : raw
    } catch {
      return 16
    }
  }

  const slideStep = () => {
    const el = scrollerRef.current
    if (!el) return 320
    const slide = el.querySelector('.vet-carousel__slide')
    const width = slide?.getBoundingClientRect?.().width ?? 0
    return width > 0 ? width + trackGap() : 320
  }

  const scrollBySlide = (dir) => {
    const el = scrollerRef.current
    if (!el || typeof el.scrollBy !== 'function') return
    el.scrollBy({ left: dir * slideStep(), behavior: scrollBehavior() })
  }

  const scrollToEdge = (edge) => {
    const el = scrollerRef.current
    if (!el || typeof el.scrollTo !== 'function') return
    const left = edge === 'start' ? 0 : el.scrollWidth
    el.scrollTo({ left, behavior: scrollBehavior() })
  }

  /* Teclado sobre el carrusel (los eventos burbujean desde los slides) */
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollBySlide(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollBySlide(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      scrollToEdge('start')
    } else if (event.key === 'End') {
      event.preventDefault()
      scrollToEdge('end')
    }
  }

  /* Al seleccionar, trae la tarjeta a la vista (no-op seguro en jsdom) */
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const active = el.querySelector('.vet-carousel__slide-btn[aria-pressed="true"]')
    if (!active || typeof active.scrollIntoView !== 'function') return
    try {
      active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: scrollBehavior() })
    } catch {
      /* navegadores sin opciones: ignorar */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    <section
      className="vet-carousel"
      aria-roledescription="carrusel"
      aria-label={label}
      data-testid="vet-carousel"
    >
      <div className="vet-carousel__head">
        <h2 className="mp-h2">
          <Icon name="local_hospital" size={26} filled className="mp-h2__icon mp-h2__icon--primary" />
          {title}
          <span className="mp-h2__count">{items.length}</span>
        </h2>
        <div className="vet-carousel__actions">
          {onSeeAll && (
            <button type="button" className="vet-carousel__see-all" onClick={onSeeAll}>
              Ver todas
              <Icon name="arrow_forward_ios" size={16} />
            </button>
          )}
          <div className="vet-carousel__arrows">
            <button
              type="button"
              className="vet-carousel__arrow"
              onClick={() => scrollBySlide(-1)}
              disabled={!canPrev}
              aria-label="Veterinarias anteriores"
            >
              <Icon name="chevron_left" size={22} />
            </button>
            <button
              type="button"
              className="vet-carousel__arrow"
              onClick={() => scrollBySlide(1)}
              disabled={!canNext}
              aria-label="Veterinarias siguientes"
            >
              <Icon name="chevron_right" size={22} />
            </button>
          </div>
        </div>
      </div>

      <p className="mp-sr-only" aria-live="polite">
        {items.length} {items.length === 1 ? 'opción disponible' : 'opciones disponibles'}. Usa los
        botones anterior y siguiente o las flechas del teclado para navegar.
      </p>

      <ul
        ref={scrollerRef}
        className="vet-carousel__track"
        data-testid="vet-carousel-track"
        onKeyDown={handleKeyDown}
        onScroll={updateArrows}
      >
        {items.map((item) => {
          const isSelected = selectedId === item.id
          return (
            <li key={item.id} className="vet-carousel__slide">
              <button
                type="button"
                className={`vet-carousel__slide-btn ${isSelected ? 'is-selected' : ''}`.trim()}
                aria-pressed={isSelected}
                onClick={() => onSelect?.(item.id)}
              >
                <span className="vet-carousel__media" aria-hidden="true">
                  <Icon name={item.icon || 'local_hospital'} size={34} filled />
                  {isSelected && <Icon name="check_circle" size={20} filled className="vet-carousel__check" />}
                </span>
                <span className="vet-carousel__body">
                  <span className="vet-carousel__name">{item.nombre}</span>
                  {item.direccion && (
                    <span className="vet-carousel__direccion">
                      <Icon name="location_on" size={15} />
                      {item.direccion}
                    </span>
                  )}
                  {item.meta && <span className="vet-carousel__meta">{item.meta}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
