import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RingProgress } from '../shared/components/RingProgress/RingProgress'

describe('RingProgress', () => {
  test('expone el valor con role progressbar y aria-valuenow/min/max', () => {
    render(<RingProgress value={85} label="85%" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '85')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  test('clampa el valor a 0-100', () => {
    render(<RingProgress value={120} label="120%" />)
    render(<RingProgress value={-5} label="-5%" />)
    const bars = screen.getAllByRole('progressbar')
    expect(bars[0]).toHaveAttribute('aria-valuenow', '100')
    expect(bars[1]).toHaveAttribute('aria-valuenow', '0')
  })

  test('renderiza label y sublabel centrales', () => {
    render(<RingProgress value={85} label="85%" sublabel="Excelente" />)
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('Excelente')).toBeInTheDocument()
  })

  test('aplica size y strokeWidth al SVG', () => {
    const { container } = render(<RingProgress value={50} size={160} strokeWidth={12} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '160')
    expect(svg).toHaveAttribute('height', '160')
    const fill = container.querySelector('.ringprogress__fill')
    expect(fill).toHaveAttribute('stroke-width', '12')
  })

  test('usa --md-primary como color por defecto', () => {
    const { container } = render(<RingProgress value={50} />)
    expect(container.querySelector('.ringprogress__fill')).toHaveAttribute(
      'stroke',
      'var(--md-primary)'
    )
  })

  test('calcula el dashoffset objetivo según el valor', () => {
    const { container } = render(<RingProgress value={85} size={120} strokeWidth={10} />)
    const fill = container.querySelector('.ringprogress__fill')
    const radius = (120 - 10) / 2
    const circumference = 2 * Math.PI * radius
    expect(Number(fill.getAttribute('data-dashoffset'))).toBeCloseTo(
      circumference * (1 - 85 / 100),
      1
    )
  })
})