/* global describe, test, expect, vi, beforeEach */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../shared/components/AppShell/AppShell'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  authFetch: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
}))

import { useAuth } from '../features/auth/context/AuthContext'

function renderShell(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <div>contenido-hijo</div>
      </AppShell>
    </MemoryRouter>
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renderiza el shell con hijos, badge de rol admin y buscador global', () => {
    useAuth.mockReturnValue({ user: { nombre: 'Ana', rolId: 1 }, logout: vi.fn() })
    renderShell()

    expect(screen.getByText('contenido-hijo')).toBeInTheDocument()
    // Badge de rol en el header
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    // Buscador global presente
    expect(screen.getByPlaceholderText('Buscar mascota o dueño...')).toBeInTheDocument()
    // Item "Volver al inicio" al fondo del sidebar
    expect(screen.getByText('Volver al inicio')).toBeInTheDocument()
    // Gating admin: Aprobaciones visible (sidebar y bottom-nav)
    expect(screen.getAllByText('Aprobaciones').length).toBeGreaterThan(0)
  })

  test('cliente: muestra su badge, sin Aprobaciones y con Expediente', () => {
    useAuth.mockReturnValue({ user: { nombre: 'Beto', rolId: 4 }, logout: vi.fn() })
    renderShell()

    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.queryByText('Aprobaciones')).not.toBeInTheDocument()
    expect(screen.getAllByText('Expediente').length).toBeGreaterThan(0)
  })

  test('almacén: sin Traslados ni Emergencias, con Inventario', () => {
    useAuth.mockReturnValue({ user: { nombre: 'Caro', rolId: 3 }, logout: vi.fn() })
    renderShell('/dashboard/inventario')

    expect(screen.getByText('Almacen')).toBeInTheDocument()
    expect(screen.queryAllByText('Traslados')).toHaveLength(0)
    expect(screen.queryAllByText('Emergencias')).toHaveLength(0)
    expect(screen.getAllByText('Inventario').length).toBeGreaterThan(0)
  })
})
