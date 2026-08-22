/* global describe, test, expect */
import { render, screen } from '@testing-library/react'
import { Badge } from '../shared/components/Badge/Badge'

describe('Badge', () => {
  test('renderiza con texto y variante por defecto (pending)', () => {
    render(<Badge>Pendiente</Badge>)
    const badge = screen.getByText('Pendiente')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('badge', 'badge--pending')
  })

  test('aplica la variante indicada como clase', () => {
    render(<Badge variant="success">Aprobado</Badge>)
    expect(screen.getByText('Aprobado')).toHaveClass('badge--success')
  })

  test('renderiza el icono Material Symbols cuando se pasa icon', () => {
    render(<Badge icon="check_circle">Confirmada</Badge>)
    const icon = document.querySelector('.material-symbols-outlined')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveTextContent('check_circle')
    expect(icon).toHaveClass('badge__icon')
  })

  test('renderiza el dot de estado cuando dot=true', () => {
    const { container } = render(<Badge dot>Activo</Badge>)
    const dot = container.querySelector('.badge__dot')
    expect(dot).toBeInTheDocument()
  })

  test('mapea un color semantico del dot a tokens M3', () => {
    const { container } = render(
      <Badge dot="error">Sin stock</Badge>
    )
    const dot = container.querySelector('.badge__dot')
    expect(dot).toHaveStyle({ backgroundColor: 'var(--md-error)' })
  })

  test('mantiene compatibilidad con children heredados (FontAwesome)', () => {
    const { container } = render(
      <Badge>
        <i className="fas fa-check" /> Activo
      </Badge>
    )
    expect(container.querySelector('.fas.fa-check')).toBeInTheDocument()
  })
})
