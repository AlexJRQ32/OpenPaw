/* global describe, test, expect, vi */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Fab } from '../shared/components/Fab/Fab'

describe('Fab', () => {
  test('renderiza botón circular con icono add por defecto', () => {
    render(<Fab label="Nuevo" />)
    const fab = screen.getByRole('button', { name: 'Nuevo' })
    expect(fab).toBeInTheDocument()
    expect(fab).toHaveClass('fab')
    const icon = fab.querySelector('.material-symbols-outlined')
    expect(icon).toHaveTextContent('add')
  })

  test('aplica aria-label, position y color como clases', () => {
    render(<Fab label="Eliminar" position="bottom-left" color="error" icon="delete" />)
    const fab = screen.getByRole('button', { name: 'Eliminar' })
    expect(fab).toHaveClass('fab--bottom-left')
    expect(fab).toHaveClass('fab--error')
  })

  test('posición por defecto bottom-right y color primary', () => {
    render(<Fab label="Agregar" />)
    const fab = screen.getByRole('button', { name: 'Agregar' })
    expect(fab).toHaveClass('fab--bottom-right')
    expect(fab).toHaveClass('fab--primary')
  })

  test('ejecuta onClick al hacer clic', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Fab label="Abrir" onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
