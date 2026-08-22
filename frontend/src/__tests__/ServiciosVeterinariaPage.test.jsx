/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ServiciosVeterinariaPage } from '../features/servicios/pages/ServiciosVeterinariaPage'
import { ROLE_IDS } from '../constants'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  authFetch: vi.fn(),
}))

vi.mock('../shared/context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }),
}))

import { useAuth } from '../features/auth/context/AuthContext'
import { authFetch } from '../shared/utils/api'

const API_BASE = 'https://openpaw.alwaysdata.net/api'

function servicio(overrides = {}) {
  return {
    id: 1,
    veterinariaId: 1,
    veterinariaNombre: 'Vet Central',
    nombre: 'Consulta General',
    descripcion: 'Evaluación física completa y diagnóstico primario.',
    categoria: 'Consulta',
    precio: 15000,
    duracionMinutos: 30,
    activo: true,
    ...overrides,
  }
}

const VETERINARIAS = [{ id: 1, nombre: 'Vet Central', aprobada: true }]

/* Mock del API por URL + metodo (mismo patron que EmergenciasPage.test.jsx) */
function mockApi({ servicios = [], veterinarias = VETERINARIAS, info = {} } = {}) {
  authFetch.mockImplementation(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/usuarios/me/veterinaria-info')) {
      return { ok: true, json: async () => ({ veterinariaId: 1, ...info }) }
    }
    if (method === 'PUT' && url.includes('/serviciosveterinarios/')) {
      return { ok: true, status: 204, json: async () => ({}) }
    }
    if (method === 'POST' && url.includes('/serviciosveterinarios')) {
      return { ok: true, status: 201, json: async () => ({}) }
    }
    if (method === 'DELETE' && url.includes('/serviciosveterinarios/')) {
      return { ok: true, status: 204, json: async () => ({}) }
    }
    if (url.includes('/veterinarias/aprobadas')) {
      return { ok: true, json: async () => veterinarias }
    }
    if (url.includes('/serviciosveterinarios')) {
      return { ok: true, json: async () => servicios }
    }
    return { ok: false, json: async () => ({}) }
  })
}

function renderServicios(user) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={['/dashboard/servicios']}>
      <ServiciosVeterinariaPage />
    </MemoryRouter>
  )
}

const admin = { nombre: 'Admin', sub: '1', rolId: ROLE_IDS.ADMINISTRADOR }
const vet = { nombre: 'David', sub: '5', rolId: ROLE_IDS.VETERINARIA }

describe('ServiciosVeterinariaPage - rediseno catalogo con grid, toggle y busqueda (T31)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header "Catálogo de Servicios", boton Nuevo Servicio y stats bento', async () => {
    mockApi({
      servicios: [servicio(), servicio({ id: 2, nombre: 'Grooming Basico', categoria: 'Grooming', activo: false })],
    })
    renderServicios(admin)

    expect(await screen.findByRole('heading', { level: 1, name: 'Catálogo de Servicios' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nuevo Servicio/ })).toBeInTheDocument()

    const stats = screen.getByRole('group', { name: 'Resumen de servicios' })
    expect(within(stats).getByText('Total Servicios')).toBeInTheDocument()
    expect(within(stats).getByText('Activos')).toBeInTheDocument()
    expect(within(stats).getByText('Inactivos')).toBeInTheDocument()
    // valores: 2 totales, 1 activo + 1 inactivo
    expect(within(stats).getByText('2')).toBeInTheDocument()
    expect(within(stats).getAllByText('1')).toHaveLength(2)
  })

  test('grid de tarjetas: badge estado + precio + acciones editar/eliminar', async () => {
    mockApi({ servicios: [servicio(), servicio({ id: 2, nombre: 'Grooming Basico', categoria: 'Grooming', activo: false })] })
    renderServicios(admin)

    const cardActivo = await screen.findByLabelText('Servicio Consulta General')
    expect(within(cardActivo).getByText('Activo')).toBeInTheDocument()
    expect(within(cardActivo).getByText('Precio Base')).toBeInTheDocument()
    expect(within(cardActivo).getByText(/₡15\s?000/)).toBeInTheDocument()
    expect(within(cardActivo).getByRole('button', { name: 'Editar Consulta General' })).toBeInTheDocument()
    expect(within(cardActivo).getByRole('button', { name: 'Eliminar Consulta General' })).toBeInTheDocument()
    expect(within(cardActivo).getByRole('switch', { name: 'Desactivar Consulta General' })).toBeChecked()

    const cardInactivo = screen.getByLabelText('Servicio Grooming Basico')
    expect(within(cardInactivo).getByText('Inactivo')).toBeInTheDocument()
    expect(within(cardInactivo).getByRole('switch', { name: 'Activar Grooming Basico' })).not.toBeChecked()
  })

  test('los chips de categoria filtran el grid', async () => {
    mockApi({
      servicios: [servicio(), servicio({ id: 2, nombre: 'Peluqueria Completa', categoria: 'Grooming' })],
    })
    renderServicios(admin)

    await screen.findByText('Consulta General')

    fireEvent.click(screen.getByRole('button', { name: 'Grooming' }))

    expect(screen.getByText('Peluqueria Completa')).toBeInTheDocument()
    expect(screen.queryByText('Consulta General')).not.toBeInTheDocument()

    // volver a Todas restaura la grilla completa
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))
    expect(screen.getByText('Consulta General')).toBeInTheDocument()
  })

  test('el buscador filtra por texto (nombre/descripcion) y se puede limpiar', async () => {
    mockApi({
      servicios: [servicio(), servicio({ id: 2, nombre: 'Vacunacion Anual', categoria: 'Procedimiento', descripcion: 'Esquema basico de vacunas.' })],
    })
    renderServicios(admin)

    await screen.findByText('Consulta General')

    const search = screen.getByRole('searchbox', { name: 'Buscar servicio' })
    fireEvent.change(search, { target: { value: 'vacunacion' } })

    expect(screen.getByText('Vacunacion Anual')).toBeInTheDocument()
    expect(screen.queryByText('Consulta General')).not.toBeInTheDocument()

    // limpiar restaura todo
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar busqueda' }))
    expect(screen.getByText('Consulta General')).toBeInTheDocument()
  })

  test('empty state cuando la busqueda no coincide', async () => {
    mockApi({ servicios: [servicio()] })
    renderServicios(admin)

    await screen.findByText('Consulta General')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar servicio' }), { target: { value: 'zzzz' } })

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
  })

  test('toggle inline desactiva el servicio con PUT (payload completo) y actualiza el badge', async () => {
    mockApi({ servicios: [servicio()] })
    renderServicios(admin)

    const card = await screen.findByLabelText('Servicio Consulta General')
    const sw = within(card).getByRole('switch', { name: 'Desactivar Consulta General' })
    fireEvent.click(sw)

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/serviciosveterinarios/1`,
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"activo":false'),
        })
      )
    })

    // actualizacion optimista: badge Inactivo + switch ahora "Activar"
    expect(await within(card).findByText('Inactivo')).toBeInTheDocument()
    expect(within(card).getByRole('switch', { name: 'Activar Consulta General' })).not.toBeChecked()
  })

  test('toggle inline reactiva un servicio inactivo (PUT activo:true)', async () => {
    mockApi({ servicios: [servicio({ activo: false })] })
    renderServicios(admin)

    const card = await screen.findByLabelText('Servicio Consulta General')
    fireEvent.click(within(card).getByRole('switch', { name: 'Activar Consulta General' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/serviciosveterinarios/1`,
        expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"activo":true') })
      )
    })
    expect(await within(card).findByText('Activo')).toBeInTheDocument()
  })

  test('modal crear conserva POST con payload completo', async () => {
    mockApi({ servicios: [], veterinarias: VETERINARIAS })
    renderServicios(admin)

    fireEvent.click(await screen.findByRole('button', { name: /Nuevo Servicio/ }))
    expect(screen.getByRole('heading', { name: 'Nuevo servicio' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nombre del servicio'), { target: { value: 'Vacunacion Anual' } })
    fireEvent.change(screen.getByLabelText('Precio (CRC)'), { target: { value: '35000' } })
    fireEvent.change(screen.getByLabelText('Duracion (minutos)'), { target: { value: '20' } })

    fireEvent.click(screen.getByRole('button', { name: 'Crear servicio' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/serviciosveterinarios`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"nombre":"Vacunacion Anual"'),
        })
      )
    })
    const body = authFetch.mock.calls.find(([, opts]) => opts?.method === 'POST')?.[1]?.body
    expect(body).toContain('"precio":35000')
    expect(body).toContain('"duracionMinutos":20')
  })

  test('modal editar conserva PUT con nombre actualizado y checkbox activo', async () => {
    mockApi({ servicios: [servicio()] })
    renderServicios(admin)

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Consulta General' }))
    expect(screen.getByRole('heading', { name: 'Editar servicio' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nombre del servicio'), { target: { value: 'Consulta Premium' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/serviciosveterinarios/1`,
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"nombre":"Consulta Premium"'),
        })
      )
    })
  })

  test('eliminar pasa por ConfirmDialog y ejecuta DELETE', async () => {
    mockApi({ servicios: [servicio()] })
    renderServicios(admin)

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar Consulta General' }))

    expect(screen.getByText('¿Eliminar servicio?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(`${API_BASE}/serviciosveterinarios/1`, { method: 'DELETE' })
    })
  })

  test('veterinaria consulta el endpoint /mios', async () => {
    mockApi({ servicios: [servicio()] })
    renderServicios(vet)

    expect(await screen.findByText('Consulta General')).toBeInTheDocument()
    const urls = authFetch.mock.calls.map(([url]) => url)
    expect(urls.some((u) => u.includes('/serviciosveterinarios/mios'))).toBe(true)
  })

  test('empty state cuando no hay servicios', async () => {
    mockApi({ servicios: [] })
    renderServicios(admin)

    expect(await screen.findByText('Sin servicios')).toBeInTheDocument()
  })
})