/* global describe, test, expect, vi */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleSwitch } from '../shared/components/ToggleSwitch/ToggleSwitch'

describe('ToggleSwitch', () => {
  test('renderiza con role switch y aria-checked según estado', () => {
    render(<ToggleSwitch checked label="Activo" />)
    const sw = screen.getByRole('switch')
    expect(sw).toBeInTheDocument()
    expect(sw).toHaveAttribute('aria-checked', 'true')
    expect(sw).toHaveClass('is-on')
  })

  test('invoca onChange con el nuevo estado al hacer clic', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<ToggleSwitch checked={false} onChange={handleChange} label="Activo" />)
    await user.click(screen.getByRole('switch'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  test('el estado deshabilitado no permite interactuar', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<ToggleSwitch disabled onChange={handleChange} label="Activo" />)
    const sw = screen.getByRole('switch')
    expect(sw).toBeDisabled()
    await user.click(sw)
    expect(handleChange).not.toHaveBeenCalled()
  })

  test('muestra la etiqueta visible junto al switch (Activo/Inactivo)', () => {
    render(<ToggleSwitch checked={false} label="Inactivo" />)
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })
})
