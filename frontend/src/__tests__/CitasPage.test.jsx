/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CitasPage } from '../features/citas/pages/CitasPage'
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

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

/* Fecha local con desplazamiento de días y hora fija (evita problemas de UTC) */
function diaLocal(offsetDias, h = 10, min = 30) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  d.setHours(h, min, 0, 0)
  return d
}

function hoyEn(h = 10, min = 30) {
  return diaLocal(0, h, min)
}

/* Día dentro del mes visible distinto de hoy (para probar la selección) */
function diaObjetivoEnMes() {
  const hoy = new Date()
  const daysInMonth = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  if (hoy.getDate() < daysInMonth) return diaLocal(1, 14, 0)
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1, 14, 0, 0)
}

function cita(overrides = {}) {
  return {
    id: 1,
    mascotaId: 1,
    mascotaNombre: 'Max',
    veterinariaId: 1,
    veterinariaNombre: 'Clinica San Jose',
    usuarioId: 5,
    usuarioNombre: 'David Chen',
    fechaHora: hoyEn().toISOString(),
    estado: 'Confirmada',
    tipoCita: 'Rutina',
    servicio: 'Consulta general',
    categoria: 'Consulta',
    notas: null,
    costo: null,
    ...overrides,
  }
}

/* Mock del API por URL: veterinaria-info, aprobadas y el endpoint de citas */
function mockApi({ citas = [], mascotas = [], veterinarias = [], info = {} }) {
  authFetch.mockImplementation(async (url) => {
    if (url.includes('/usuarios/me/veterinaria-info')) {
      return { ok: true, json: async () => ({ mascotas, ...info }) }
    }
    if (url.includes('/veterinarias/aprobadas')) {
      return { ok: true, json: async () => veterinarias }
    }
    if (url.includes('/citas')) {
      return { ok: true, json: async () => citas }
    }
    return { ok: false, json: async () => ({}) }
  })
}

function renderCitas(user) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={['/dashboard/citas']}>
      <CitasPage />
    </MemoryRouter>
  )
}

const vet = { nombre: 'David', sub: '5', rolId: ROLE_IDS.VETERINARIA }
const cliente = { nombre: 'Maria', sub: '10', rolId: ROLE_IDS.CLIENTE }

describe('CitasPage - rediseno calendario con dots por tipo (T27)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header "Gestion de Citas", boton Nueva cita y leyenda de tipos', async () => {
    mockApi({ citas: [cita()], info: { veterinariaId: 5, mascotas: [] } })
    renderCitas(vet)

    expect(await screen.findByRole('heading', { level: 1, name: 'Gestión de Citas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nueva cita/ })).toBeInTheDocument()
    expect(screen.getByText('Rutina')).toBeInTheDocument()
    expect(screen.getByText('Especialista')).toBeInTheDocument()
    expect(screen.getByText('Urgencia')).toBeInTheDocument()
  })

  test('dia con dos tipos de cita muestra dos dots de color', async () => {
    mockApi({
      citas: [
        cita({ id: 1, tipoCita: 'Rutina', fechaHora: hoyEn(9, 0).toISOString() }),
        cita({ id: 2, mascotaNombre: 'Luna', tipoCita: 'Especialista', fechaHora: hoyEn(11, 0).toISOString() }),
      ],
      info: { veterinariaId: 5, mascotas: [] },
    })
    renderCitas(vet)

    // El dia de hoy (seleccionado por defecto) muestra un dot por tipo
    const hoy = new Date()
    const hoyBtn = await screen.findByRole('button', {
      name: new RegExp(`Día ${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`),
    })
    expect(hoyBtn).toHaveAttribute('aria-pressed', 'true')
    expect(hoyBtn.querySelectorAll('.citas-dot').length).toBe(2)
  })

  test('clic en otro dia lo selecciona y filtra el panel de citas', async () => {
    const objetivo = diaObjetivoEnMes()
    const mes = MESES[objetivo.getMonth()]
    mockApi({
      citas: [
        cita({ id: 1, mascotaNombre: 'Max', servicio: 'Consulta general', fechaHora: hoyEn(9, 0).toISOString() }),
        cita({
          id: 2,
          mascotaNombre: 'Luna',
          servicio: 'Consulta dermatologia',
          tipoCita: 'Especialista',
          fechaHora: objetivo.toISOString(),
        }),
      ],
      info: { veterinariaId: 5, mascotas: [] },
    })
    renderCitas(vet)

    const btnObjetivo = await screen.findByRole('button', {
      name: new RegExp(`Día ${objetivo.getDate()} de ${mes} de ${objetivo.getFullYear()}`),
    })
    fireEvent.click(btnObjetivo)

    expect(screen.getByRole('heading', { level: 4, name: 'Luna' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 4, name: 'Max' })).not.toBeInTheDocument()
    // El servicio aparece en el panel y en "Mis citas"; se valida dentro del panel
    expect(within(screen.getByLabelText('Citas del día seleccionado')).getByText('Consulta dermatologia')).toBeInTheDocument()
  })

  test('veterinaria ve solicitudes pendientes con acciones Aceptar/Rechazar', async () => {
    const pendiente = cita({
      id: 3,
      estado: 'Pendiente',
      tipoCita: 'Urgencia',
      mascotaNombre: 'Rocky',
      servicio: 'Atencion de urgencia',
      fechaHora: diaLocal(2, 16, 30).toISOString(),
    })
    mockApi({ citas: [cita(), pendiente], info: { veterinariaId: 5, mascotas: [] } })
    renderCitas(vet)

    expect(await screen.findByText('Solicitudes de citas')).toBeInTheDocument()
    expect(screen.getByText(/1 pendiente/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
  })

  test('cliente ve catalogo de veterinarias y no el boton Nueva cita', async () => {
    mockApi({
      citas: [cita({ usuarioId: 10 })],
      veterinarias: [
        {
          id: 1,
          nombre: 'Clinica San Jose',
          direccion: 'Av. Central',
          descripcion: 'Atencion general',
          horario: '8am-6pm',
        },
      ],
      info: { mascotas: [] },
    })
    renderCitas(cliente)

    expect(await screen.findByText('Veterinarias aliadas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pedir cita/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nueva cita/ })).not.toBeInTheDocument()
  })

  test('filtros de estado en "Mis citas" siguen funcionando', async () => {
    mockApi({
      citas: [
        cita({ id: 1, estado: 'Confirmada', servicio: 'Consulta general' }),
        cita({ id: 2, estado: 'Pendiente', mascotaNombre: 'Luna', servicio: 'Vacunacion' }),
      ],
      info: { veterinariaId: 5, mascotas: [] },
    })
    renderCitas(vet)

    expect(await screen.findByText('Mis citas')).toBeInTheDocument()
    const seccion = screen.getByLabelText('Mis citas')

    // Con "Todas" se ven ambas citas en el listado
    expect(within(seccion).getByText('Vacunacion')).toBeInTheDocument()
    expect(within(seccion).getByText('Consulta general')).toBeInTheDocument()

    fireEvent.click(within(seccion).getByRole('button', { name: 'Confirmada' }))

    expect(within(seccion).queryByText('Vacunacion')).not.toBeInTheDocument()
    expect(within(seccion).getByText('Consulta general')).toBeInTheDocument()
  })
})