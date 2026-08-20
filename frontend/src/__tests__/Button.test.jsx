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
})