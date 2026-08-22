import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarChart } from '../shared/components/BarChart/BarChart'

const data = [
  { label: 'May', value: 27 },
  { label: 'Jun', value: 27.5 },
  { label: 'Jul', value: 28 },
  { label: 'Ago', value: 28.2 },
  { label: 'Oct', value: 28.5 },
]

describe('BarChart', () => {
  test('renderiza una barra por dato y las etiquetas', () => {
    render(<BarChart data={data} />)
    const bars = document.querySelectorAll('.barchart__bar')
    expect(bars).toHaveLength(data.length)
    expect(screen.getByText('May')).toBeInTheDocument()
    expect(screen.getByText('Oct')).toBeInTheDocument()
  })

  test('calcula la altura relativa al valor máximo (auto)', () => {
    const { container } = render(<BarChart data={data} />)
    const cols = container.querySelectorAll('.barchart__col')
    // El máximo (28.5) ocupa el 100%; May (27) ocupa el 95%
    expect(cols[0]).toHaveStyle({ '--bar-height': '95%' })
    expect(cols[4]).toHaveStyle({ '--bar-height': '100%' })
  })

  test('respeta un maxValue explícito', () => {
    const { container } = render(<BarChart data={data} maxValue={30} />)
    const cols = container.querySelectorAll('.barchart__col')
    expect(cols[0]).toHaveStyle({ '--bar-height': '90%' })
    expect(cols[4]).toHaveStyle({ '--bar-height': '95%' })
  })

  test('resalta la barra indicada por highlightIndex', () => {
    const { container } = render(<BarChart data={data} highlightIndex={4} />)
    const cols = container.querySelectorAll('.barchart__col')
    expect(cols[4]).toHaveClass('barchart__col--highlight')
    expect(cols[0]).not.toHaveClass('barchart__col--highlight')
  })

  test('muestra los valores con showValues y tooltip nativo (title)', () => {
    render(<BarChart data={data} />)
    expect(screen.getByText('28.5')).toBeInTheDocument()
    const col = document.querySelector('.barchart__col')
    expect(col).toHaveAttribute('title', 'May: 27')
  })

  test('incluye aria-label con el resumen de la serie', () => {
    render(<BarChart data={data} />)
    const chart = screen.getByRole('img')
    expect(chart).toHaveAttribute(
      'aria-label',
      'Gráfico de barras: May: 27, Jun: 27.5, Jul: 28, Ago: 28.2, Oct: 28.5'
    )
  })

  test('no renderiza etiquetas ni valores si data está vacío', () => {
    const { container } = render(<BarChart data={[]} />)
    expect(container.querySelectorAll('.barchart__bar')).toHaveLength(0)
    expect(container.querySelector('.barchart__labels')).not.toBeInTheDocument()
  })
})