/* global describe, test, expect */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from '../shared/components/EmptyState'
import { Button } from '../shared/components/Button/Button'

describe('EmptyState', () => {
  test('renderiza icono en círculo tintado, título y descripción', () => {
    render(
      <EmptyState title="Sin citas" description="No hay citas para este filtro." />
    )
    expect(screen.getByText('Sin citas')).toBeInTheDocument()
    expect(screen.getByText('No hay citas para este filtro.')).toBeInTheDocument()

    const icon = document.querySelector('.empty-state__icon .material-symbols-outlined')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveTextContent('pets')
  })

  test('la variante dashed aplica su clase (estilo wireframe aprobaciones)', () => {
    const { container } = render(
      <EmptyState variant="dashed" title="¡Todo al día!" />
    )
    const root = container.querySelector('.empty-state')
    expect(root).toHaveClass('empty-state--dashed')
    expect(root).not.toHaveClass('empty-state--undefined')
  })

  test('la acción declarativa (actionLabel + onAction) dispara onClick', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(
      <EmptyState
        title="Sin servicios"
        description="Agrega el primero."
        actionLabel="Agregar servicio"
        onAction={() => {
          clicked = true
        }}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Agregar servicio' }))
    expect(clicked).toBe(true)
  })

  test('mantiene compatibilidad: action como nodo React se renderiza igual que antes', () => {
    render(
      <EmptyState
        title="Sin registros"
        description="Sin movimientos."
        action={<Button onClick={() => {}}>Agregar producto</Button>}
      />
    )
    expect(
      screen.getByRole('button', { name: 'Agregar producto' })
    ).toBeInTheDocument()
  })
})
