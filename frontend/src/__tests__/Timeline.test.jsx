import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from '../shared/components/Timeline/Timeline'

const items = [
  {
    icono: 'stethoscope',
    titulo: 'Revisión Anual',
    descripcion: 'Paciente acude a revisión anual.',
    fecha: '15 Oct, 2023',
    ubicacion: 'Clínica Veterinaria San José',
    tipo: 'primary',
    tipoLabel: 'Consulta General',
    adjuntos: [{ nombre: 'receta_oct23.pdf' }],
  },
  {
    icono: 'vaccines',
    titulo: 'Refuerzo Séxtuple',
    descripcion: 'Aplicación sin complicaciones.',
    fecha: '10 Sep, 2023',
    tipo: 'tertiary',
    tipoLabel: 'Vacunación',
  },
  { titulo: 'Evento sin metadatos', tipo: 'error' },
]

describe('Timeline', () => {
  test('renderiza los items como lista semántica con su título', () => {
    render(<Timeline items={items} />)
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Línea de tiempo')
    expect(screen.getAllByRole('listitem')).toHaveLength(items.length)
    expect(screen.getByText('Revisión Anual')).toBeInTheDocument()
    expect(screen.getByText('Refuerzo Séxtuple')).toBeInTheDocument()
  })

  test('aplica la clase de color del nodo según el tipo del item', () => {
    const { container } = render(<Timeline items={items} />)
    const nodes = container.querySelectorAll('.timeline__node')
    expect(nodes[0]).toHaveClass('timeline__node--primary')
    expect(nodes[1]).toHaveClass('timeline__node--tertiary')
    expect(nodes[2]).toHaveClass('timeline__node--error')
  })

  test('renderiza fecha, ubicación y adjuntos', () => {
    render(<Timeline items={items} />)
    expect(screen.getByText('15 Oct, 2023')).toBeInTheDocument()
    expect(screen.getByText('Clínica Veterinaria San José')).toBeInTheDocument()
    expect(screen.getByText('receta_oct23.pdf')).toBeInTheDocument()
  })

  test('renderiza el icono Material en el nodo cuando se provee icono', () => {
    const { container } = render(<Timeline items={items} />)
    const nodeIcons = container.querySelectorAll('.timeline__node .material-symbols-outlined')
    expect(nodeIcons).toHaveLength(2)
    expect(nodeIcons[0]).toHaveTextContent('stethoscope')
  })

  test('renderiza el badge pill de tipo con su texto', () => {
    render(<Timeline items={items} />)
    expect(screen.getByText('Consulta General')).toBeInTheDocument()
    expect(screen.getByText('Vacunación')).toBeInTheDocument()
  })

  test('soporta hijos custom en lugar de items', () => {
    render(
      <Timeline>
        <li>Evento custom</li>
      </Timeline>
    )
    expect(screen.getByText('Evento custom')).toBeInTheDocument()
  })
})