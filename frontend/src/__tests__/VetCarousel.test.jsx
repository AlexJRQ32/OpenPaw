import { render, screen, fireEvent } from '@testing-library/react'
import { VetCarousel } from '../features/marketplace/components/VetCarousel'

const ITEMS = [
  { id: 'todas', nombre: 'Todas las veterinarias', meta: '9 en total', icon: 'apps' },
  { id: 1, nombre: 'Clínica San Roque', direccion: 'San José Centro', meta: '5 productos' },
  { id: 2, nombre: 'Pet Spa & Care', direccion: 'Heredia', meta: '4 servicios' },
]

function renderCarousel(props = {}) {
  return render(<VetCarousel items={ITEMS} selectedId="todas" onSelect={vi.fn()} {...props} />)
}

describe('VetCarousel', () => {
  test('renderiza los slides con nombre, dirección y metadatos', () => {
    renderCarousel()

    expect(screen.getByRole('region', { name: /Veterinarias aliadas/i })).toBeInTheDocument()
    expect(screen.getByText('Todas las veterinarias')).toBeInTheDocument()
    expect(screen.getByText('Clínica San Roque')).toBeInTheDocument()
    expect(screen.getByText(/San José Centro/)).toBeInTheDocument()
    expect(screen.getByText('4 servicios')).toBeInTheDocument()
  })

  test('anuncia la cantidad de opciones en una live region', () => {
    renderCarousel()
    expect(screen.getByText(/3 opciones disponibles/i)).toBeInTheDocument()
  })

  test('marca la selección con aria-pressed (no solo color)', () => {
    renderCarousel({ selectedId: 2 })

    expect(screen.getByRole('button', { name: /Pet Spa & Care/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Clínica San Roque/ })).toHaveAttribute('aria-pressed', 'false')
  })

  test('notifica la selección al hacer clic en un slide', () => {
    const onSelect = vi.fn()
    renderCarousel({ onSelect })

    fireEvent.click(screen.getByRole('button', { name: /Pet Spa & Care/ }))
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  test('sin overflow ambos botones prev/next quedan deshabilitados', () => {
    renderCarousel()

    /* En jsdom scrollWidth = clientWidth = 0: no hay nada que desplazar */
    expect(screen.getByRole('button', { name: 'Veterinarias anteriores' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Veterinarias siguientes' })).toBeDisabled()
  })

  test('con overflow habilita "siguiente" y desplaza una tarjeta', () => {
    /* jsdom no implementa scrollBy: se agrega al prototipo y se restaura */
    const originalScrollBy = Element.prototype.scrollBy
    Element.prototype.scrollBy = vi.fn()
    try {
      renderCarousel()
      const track = screen.getByTestId('vet-carousel-track')

      /* Simula overflow horizontal real */
      Object.defineProperty(track, 'scrollWidth', { value: 1200, configurable: true })
      Object.defineProperty(track, 'clientWidth', { value: 400, configurable: true })
      Object.defineProperty(track, 'scrollLeft', { value: 0, configurable: true })
      fireEvent.scroll(track)

      const next = screen.getByRole('button', { name: 'Veterinarias siguientes' })
      expect(next).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Veterinarias anteriores' })).toBeDisabled()

      fireEvent.click(next)
      expect(Element.prototype.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 320 }))
    } finally {
      if (originalScrollBy === undefined) delete Element.prototype.scrollBy
      else Element.prototype.scrollBy = originalScrollBy
    }
  })

  test('las flechas del teclado desplazan el carrusel', () => {
    const originalScrollBy = Element.prototype.scrollBy
    Element.prototype.scrollBy = vi.fn()
    try {
      renderCarousel()
      fireEvent.keyDown(screen.getByTestId('vet-carousel-track'), { key: 'ArrowRight' })
      expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(screen.getByTestId('vet-carousel-track'), { key: 'ArrowLeft' })
      expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(2)
    } finally {
      if (originalScrollBy === undefined) delete Element.prototype.scrollBy
      else Element.prototype.scrollBy = originalScrollBy
    }
  })

  test('usa el gap computado del track (CSS --gutter) como paso de scroll', () => {
    /* Regresión QA LOW T39: el gap real es --gutter 24px, no 16px hardcodeado */
    const originalScrollBy = Element.prototype.scrollBy
    const originalGCS = window.getComputedStyle
    Element.prototype.scrollBy = vi.fn()
    /* Mock compatible con consumidores internos (exige getPropertyValue) */
    window.getComputedStyle = (el) => {
      let base = {}
      try { base = { ...originalGCS.call(window, el) } } catch { /* jsdom limitado */ }
      return {
        ...base,
        columnGap: '24px',
        gap: '24px',
        getPropertyValue: (prop) => (
          String(prop).toLowerCase() === 'column-gap' ? '24px' : (base[String(prop)] ?? '')
        ),
      }
    }
    try {
      renderCarousel()
      const track = screen.getByTestId('vet-carousel-track')
      Object.defineProperty(track, 'scrollWidth', { value: 1200, configurable: true })
      Object.defineProperty(track, 'clientWidth', { value: 400, configurable: true })
      Object.defineProperty(track, 'scrollLeft', { value: 0, configurable: true })
      fireEvent.scroll(track)

      /* Ancho de slide simulado: 280px + gap 24px = paso 304px */
      const slide = track.querySelector('.vet-carousel__slide')
      vi.spyOn(slide, 'getBoundingClientRect').mockReturnValue({
        width: 280, height: 100, top: 0, left: 0, right: 280, bottom: 100, x: 0, y: 0, toJSON() {},
      })

      fireEvent.click(screen.getByRole('button', { name: 'Veterinarias siguientes' }))
      expect(Element.prototype.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 304 }))
    } finally {
      window.getComputedStyle = originalGCS
      if (originalScrollBy === undefined) delete Element.prototype.scrollBy
      else Element.prototype.scrollBy = originalScrollBy
    }
  })

  test('"Ver todas" ejecuta la acción recibida', () => {
    const onSeeAll = vi.fn()
    renderCarousel({ onSeeAll })

    fireEvent.click(screen.getByRole('button', { name: /Ver todas/ }))
    expect(onSeeAll).toHaveBeenCalledTimes(1)
  })
})
