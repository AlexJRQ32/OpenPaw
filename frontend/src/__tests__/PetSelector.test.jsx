/* global describe, test, expect, vi */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PetSelector } from '../shared/components/PetSelector/PetSelector'

const PETS = [
  { id: 1, nombre: 'Rocky', fotoUrl: 'rocky.jpg' },
  { id: 2, nombre: 'Luna Peluda' },
]

describe('PetSelector', () => {
  test('renderiza una píldora por mascota con su nombre', () => {
    render(<PetSelector pets={PETS} value="all" onChange={vi.fn()} />)
    expect(screen.getByText('Rocky')).toBeInTheDocument()
    expect(screen.getByText('Luna Peluda')).toBeInTheDocument()
  })

  test('muestra "Ver Todos" con showAllOption y lo marca activo con value="all"', () => {
    render(<PetSelector pets={PETS} value="all" onChange={vi.fn()} showAllOption />)
    const all = screen.getByText('Ver Todos').closest('.pet-selector__pill')
    expect(all).toBeInTheDocument()
    expect(all).toHaveClass('is-active')
    expect(document.querySelector('.material-symbols-outlined')).toHaveTextContent('pets')
  })

  test('selecciona una mascota y notifica su id; la activa queda resaltada', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PetSelector pets={PETS} value={1} onChange={onChange} />)

    const rocky = screen.getByText('Rocky').closest('.pet-selector__pill')
    expect(rocky).toHaveClass('is-active')

    await user.click(screen.getByText('Luna Peluda'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  test('sin fotoUrl muestra iniciales sobre círculo (secondary-container)', () => {
    render(<PetSelector pets={PETS} value={2} onChange={vi.fn()} />)
    expect(screen.getByText('LP')).toBeInTheDocument() // iniciales de "Luna Peluda"
    const img = document.querySelector('.pet-selector__avatar:not(.pet-selector__avatar--initials)')
    expect(img).toHaveAttribute('src', 'rocky.jpg')
  })
})
