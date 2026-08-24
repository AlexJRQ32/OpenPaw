import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../shared/components/Button/Button'

describe('Button', () => {
  test('renderiza con texto', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  test('aplica la variante primary como clase', () => {
    render(<Button variant="primary">Test</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn--primary')
  })

  test('ejecuta onClick al hacer clic', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('aplica el estado disabled cuando está deshabilitado', () => {
    render(<Button disabled>Test</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  test('renderiza el icono Material Symbols cuando se pasa icon', () => {
    render(<Button icon="arrow_forward">Click</Button>)
    const icon = document.querySelector('.material-symbols-outlined')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveTextContent('arrow_forward')
  })

  test('coloca el icono a la derecha con iconPosition="right"', () => {
    const { container } = render(
      <Button icon="arrow_forward" iconPosition="right">
        Click
      </Button>
    )
    const button = screen.getByRole('button')
    const icon = button.querySelector('.btn__icon--right')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('material-symbols-outlined')
    // el icono va después del texto en el DOM
    expect(button.lastChild).toBe(icon)
  })

  test('muestra el estado loading: spinner, disabled y aria-busy', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Button loading onClick={onClick}>
        Click
      </Button>
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(button.querySelector('.btn__spinner')).toBeInTheDocument()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  test('renderiza children heredados (FontAwesome) dentro del botón', () => {
    const { container } = render(
      <Button>
        <i className="fas fa-plus" />
      </Button>
    )
    expect(container.querySelector('.fas.fa-plus')).toBeInTheDocument()
  })
})