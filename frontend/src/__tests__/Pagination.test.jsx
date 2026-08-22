/* global describe, test, expect, vi */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '../shared/components/Pagination/Pagination'

describe('Pagination', () => {
  test('muestra el texto "Mostrando X-Y de Z"', () => {
    render(<Pagination page={1} pageSize={3} total={142} onChange={vi.fn()} />)
    expect(screen.getByText('Mostrando 1-3 de 142')).toBeInTheDocument()
  })

  test('prev deshabilitado en la primera página y next en la última', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Pagination page={1} pageSize={3} total={12} onChange={onChange} />)

    const prev = screen.getByRole('button', { name: 'Página anterior' })
    expect(prev).toBeDisabled()
    await user.click(prev)
    expect(onChange).not.toHaveBeenCalled()

    rerender(<Pagination page={4} pageSize={3} total={12} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
  })

  test('navega al hacer clic en un número de página y marca aria-current', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Pagination page={5} pageSize={1} total={20} onChange={onChange} />)

    const active = screen.getByRole('button', { name: '5' })
    expect(active).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: '6' }))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  test('renderiza elipsis con muchas páginas (ventana alrededor de la actual)', () => {
    render(<Pagination page={10} pageSize={1} total={20} onChange={vi.fn()} />)
    // 1 ... 9 10 11 ... 20
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '8' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('.pagination__ellipsis')).toHaveLength(2)
  })

  test('no dispara onChange al hacer clic en la página activa', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Pagination page={4} pageSize={3} total={12} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '4' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('clampa una página fuera de rango a la última página válida', () => {
    // page=12 con total=30 y pageSize=3 (10 páginas) → clamp a 10.
    render(<Pagination page={12} pageSize={3} total={30} onChange={vi.fn()} />)

    expect(screen.getByText('Mostrando 28-30 de 30')).toBeInTheDocument()

    const last = screen.getByRole('button', { name: '10' })
    expect(last).toHaveClass('is-active')
    expect(last).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
  })

  test('pageSize inválido (0 o NaN) se trata como una sola página', () => {
    // Con pageSize=0 el fallback es 1: sin NaN ni división por cero; total=0 → única página.
    render(<Pagination page={5} pageSize={0} total={0} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
    expect(document.querySelectorAll('.pagination__page')).toHaveLength(1)
  })
})
