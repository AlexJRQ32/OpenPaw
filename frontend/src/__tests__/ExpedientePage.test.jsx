import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ExpedientePage } from '../features/expediente/pages/ExpedientePage'
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

/* Mascota "completa" (MascotaDto camelCase — fuente /mascotas) */
function mascota(overrides = {}) {
  return {
    id: 1,
    nombre: 'Luna',
    especie: 'Perro',
    raza: 'Golden Retriever',
    peso: 28.5,
    estadoSalud: 'Saludable',
    fechaNacimiento: '2021-05-01',
    fotoUrl: null,
    proximaVacuna: 'Séxtuple',
    ...overrides,
  }
}

/* Los endpoints de expedientes/aportes devuelven la ENTIDAD cruda:
   claves PascalCase en el JSON (se normalizan en el hook). */
function expediente(overrides = {}) {
  return {
    Id: 10,
    MascotaId: 1,
    VeterinariaId: 5,
    FechaConsulta: '2023-10-15T10:00:00Z',
    Diagnostico: 'Revisión Anual de Rutina',
    Tratamiento: 'Continuar dieta actual',
    Observaciones: 'Buen estado general.',
    RecetaUrl: 'https://cdn.example/receta.pdf',
    ArchivoUrl: null,
    ...overrides,
  }
}

function aporte(overrides = {}) {
  return {
    Id: 7,
    MascotaId: 1,
    PropietarioId: 10,
    VeterinariaNombre: 'PetCare Center',
    FechaAtencion: '2023-09-10T09:00:00Z',
    TipoAtencion: 'Vacuna',
    Descripcion: 'Refuerzo séxtuple',
    Diagnostico: null,
    Medicamentos: null,
    ArchivoAdjuntoUrl: null,
    FechaRegistro: '2023-09-10T09:00:00Z',
    ...overrides,
  }
}

function emergencia(overrides = {}) {
  return {
    id: 3,
    mascotaId: 1,
    veterinariaNombreExterna: 'Vet 24h',
    fechaAtencion: '2023-08-05T15:00:00Z',
    motivo: 'Intoxicación leve',
    sintomas: 'Vómito y decaimiento',
    tratamientoAplicado: 'Fluidoterapia',
    diagnostico: 'Gastroenteritis',
    esEnPlataforma: false,
    temperatura: 38.6,
    frecuenciaCardiaca: 95,
    ...overrides,
  }
}

function cita(overrides = {}) {
  return {
    id: 21,
    mascotaId: 1,
    mascotaNombre: 'Luna',
    veterinariaNombre: 'Clinica San Jose',
    fechaHora: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    estado: 'Confirmada',
    servicio: 'Consulta general',
    ...overrides,
  }
}

/* Mock del API por URL (mismas rutas que usa useExpediente) */
function mockApi({ mascotas = [], mascotasFull = [], expedientes = [], aportes = [], emergencias = [], citas = [], info = {} }) {
  authFetch.mockImplementation(async (url, options = {}) => {
    if (options.method === 'POST') {
      return { ok: true, status: 201, json: async () => ({}) }
    }
    if (url.includes('/usuarios/me/veterinaria-info')) {
      return { ok: true, json: async () => ({ mascotas, ...info }) }
    }
    if (url.includes('/mascotas')) {
      return { ok: true, json: async () => mascotasFull }
    }
    if (url.includes('/expedientes/mascota/')) {
      const id = url.split('/').pop()
      return { ok: true, json: async () => expedientes.filter((e) => e.MascotaId === Number(id)) }
    }
    if (url.includes('/expediente-aportes')) {
      return { ok: true, json: async () => aportes }
    }
    if (url.includes('/emergencias')) {
      return { ok: true, json: async () => emergencias }
    }
    if (url.includes('/citas/mascota/')) {
      const id = url.split('/').pop()
      return { ok: true, json: async () => citas.filter((c) => c.mascotaId === Number(id)) }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  })
}

function renderExpediente(user) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={['/dashboard/expediente']}>
      <ExpedientePage />
    </MemoryRouter>
  )
}

const cliente = { nombre: 'Maria', sub: '10', rolId: ROLE_IDS.CLIENTE }
const vet = { nombre: 'David', sub: '5', rolId: ROLE_IDS.VETERINARIA }
const admin = { nombre: 'Ana', sub: '1', rolId: ROLE_IDS.ADMINISTRADOR }

describe('ExpedientePage - expediente médico (T29)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header con eyebrow, título y contador de registros', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      expedientes: [expediente()],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    expect(await screen.findByRole('heading', { level: 1, name: 'Historial Clínico' })).toBeInTheDocument()
    expect(screen.getByText('Expediente Médico')).toBeInTheDocument()
    expect(screen.getByText('Registros Totales')).toBeInTheDocument()
    // El contador depende de la carga async del historial → findBy
    expect(await screen.findByText('1', { selector: '.expediente-stat__num' }, { timeout: 3000 })).toBeInTheDocument()
  })

  test('bento de mascotas: activa con aria-pressed y clic cambia la selección', async () => {
    mockApi({
      mascotas: [
        { id: 1, nombre: 'Luna' },
        { id: 2, nombre: 'Milo' },
      ],
      mascotasFull: [mascota(), mascota({ id: 2, nombre: 'Milo', peso: 4.2 })],
      expedientes: [
        expediente(),
        expediente({ Id: 11, MascotaId: 2, Diagnostico: 'Control dermatológico' }),
      ],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    const luna = await screen.findByRole('button', { name: 'Seleccionar Luna' })
    expect(luna).toHaveAttribute('aria-pressed', 'true')
    expect(within(luna).getByText(/Golden Retriever/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar Milo' }))

    expect(await screen.findByText('Control dermatológico')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Seleccionar Milo' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('timeline mezcla expedientes, aportes y emergencias con sus badges', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      expedientes: [expediente()],
      aportes: [aporte()],
      emergencias: [emergencia()],
      citas: [cita({ estado: 'Completada', fechaHora: '2023-07-01T10:00:00Z', servicio: 'Baño y corte' })],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    expect(await screen.findByText('Revisión Anual de Rutina')).toBeInTheDocument()
    expect(screen.getByText('Refuerzo séxtuple')).toBeInTheDocument()
    expect(screen.getByText('Intoxicación leve')).toBeInTheDocument()
    expect(screen.getByText('Baño y corte')).toBeInTheDocument()
    // Badges por tipo
    expect(screen.getByText('Vacunación')).toBeInTheDocument()
    expect(screen.getByText('Emergencia')).toBeInTheDocument()
    // Detalles clínicos (extensión Timeline): vitales de la emergencia
    expect(screen.getByText('38.6°C')).toBeInTheDocument()
    expect(screen.getByText('95 lpm')).toBeInTheDocument()
    // Adjunto de la receta del expediente
    expect(screen.getByText('Receta')).toBeInTheDocument()
  })

  test('filtros por categoría: "Vacunas" solo muestra la vacuna', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      expedientes: [expediente()],
      aportes: [aporte()],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    expect(await screen.findByText('Revisión Anual de Rutina')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Vacunas' }))

    expect(screen.getByText('Refuerzo séxtuple')).toBeInTheDocument()
    expect(screen.queryByText('Revisión Anual de Rutina')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(screen.getByText('Revisión Anual de Rutina')).toBeInTheDocument()
  })

  test('índice de salud: RingProgress con score y etiqueta (mascota saludable = 100)', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    const ring = await screen.findByRole('progressbar', {
      name: /Índice de salud de Luna: 100 por ciento, Excelente/,
    })
    expect(ring).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Excelente')).toBeInTheDocument()
  })

  test('historial de peso: BarChart con serie estimada anclada al peso actual', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota({ peso: 30 })],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    const chart = await screen.findByRole('img', { name: /Historial de peso estimado de Luna/ })
    expect(chart).toBeInTheDocument()
    // La última barra resaltada es el peso actual
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Datos estimados')).toBeInTheDocument()
  })

  test('FAB cliente: "Nuevo aporte" abre modal y registra POST a expediente-aportes', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    const fab = await screen.findByRole('button', { name: 'Nuevo aporte' })
    fireEvent.click(fab)

    expect(screen.getByRole('heading', { name: 'Nuevo aporte de expediente' })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Nombre de la veterinaria externa'), { target: { value: 'VetExterna' } })
    fireEvent.change(screen.getByLabelText('Fecha de atención'), { target: { value: '2026-01-15T10:00' } })
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Atención de rutina' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar aporte' }))

    expect(await screen.findByRole('button', { name: 'Nuevo aporte' })).toBeInTheDocument()
    const post = authFetch.mock.calls.find(([, opts]) => opts?.method === 'POST')
    expect(post).toBeTruthy()
    expect(post[0]).toContain('/expediente-aportes')
    expect(JSON.parse(post[1].body)).toMatchObject({
      mascotaId: 1,
      veterinariaNombre: 'VetExterna',
      descripcion: 'Atención de rutina',
    })
  })

  test('FAB funcionario: "Nueva consulta" registra POST a /expedientes', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      info: { veterinariaId: 5 },
    })
    renderExpediente(vet)

    const fab = await screen.findByRole('button', { name: 'Nueva consulta' })
    fireEvent.click(fab)

    expect(screen.getByRole('heading', { name: 'Nueva consulta' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Diagnóstico'), { target: { value: 'Control postoperatorio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar consulta' }))

    expect(await screen.findByRole('button', { name: 'Nueva consulta' })).toBeInTheDocument()
    const post = authFetch.mock.calls.find(([, opts]) => opts?.method === 'POST')
    expect(post).toBeTruthy()
    expect(post[0]).toContain('/expedientes')
    expect(JSON.parse(post[1].body)).toMatchObject({
      mascotaId: 1,
      veterinariaId: 5,
      diagnostico: 'Control postoperatorio',
    })
  })

  test('estado vacío cuando la mascota no tiene registros', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    // Espera por etapas: primero el bento (mascotas cargadas) y luego el
    // EmptyState (cadena mascotas → historial; timeout amplio por estabilidad).
    await screen.findByRole('button', { name: 'Seleccionar Luna' })
    expect(await screen.findByText('Sin registros en este filtro', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText(/no tiene registros en su expediente/)).toBeInTheDocument()
  })

  test('admin: bento lleno desde /mascotas aunque veterinaria-info devuelva [] (B1)', async () => {
    mockApi({
      mascotas: [],
      mascotasFull: [mascota(), mascota({ id: 2, nombre: 'Milo', peso: 4.2 })],
      expedientes: [expediente()],
      info: { veterinariaId: 5 },
    })
    renderExpediente(admin)

    expect(await screen.findByRole('button', { name: 'Seleccionar Luna' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Seleccionar Milo' })).toBeInTheDocument()
    expect(await screen.findByText('Revisión Anual de Rutina')).toBeInTheDocument()
    // Vet/admin no ven la card "Añadir Mascota" (dead-end en /dashboard/mascotas)
    expect(screen.queryByText('Añadir Mascota')).not.toBeInTheDocument()
    // FAB habilitado: hay mascota seleccionada
    expect(screen.getByRole('button', { name: 'Nueva consulta' })).toBeEnabled()
  })

  test('filtro Vacunas detecta una vacuna registrada como consulta (M2)', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      expedientes: [
        expediente(),
        expediente({ Id: 12, Diagnostico: 'Vacuna Rabia aplicada' }),
      ],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    expect(await screen.findByText('Revisión Anual de Rutina')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Vacunas' }))

    expect(screen.getByText('Vacuna Rabia aplicada')).toBeInTheDocument()
    expect(screen.queryByText('Revisión Anual de Rutina')).not.toBeInTheDocument()
  })

  test('tratamiento farmacológico va a Consultas, no a Cirugías (M2)', async () => {
    mockApi({
      mascotas: [{ id: 1, nombre: 'Luna' }],
      mascotasFull: [mascota()],
      aportes: [
        aporte({ TipoAtencion: 'Tratamiento', Descripcion: 'Antibióticos por 7 días' }),
        aporte({ Id: 8, TipoAtencion: 'Tratamiento', Descripcion: 'Cirugía de extracción de cálculo' }),
      ],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    expect(await screen.findByText('Antibióticos por 7 días')).toBeInTheDocument()

    // Tratamiento farmacológico → Consultas
    fireEvent.click(screen.getByRole('button', { name: 'Consultas' }))
    expect(screen.getByText('Antibióticos por 7 días')).toBeInTheDocument()

    // Solo el que menciona cirugía → Cirugías
    fireEvent.click(screen.getByRole('button', { name: 'Cirugías' }))
    expect(screen.getByText('Cirugía de extracción de cálculo')).toBeInTheDocument()
    expect(screen.queryByText('Antibióticos por 7 días')).not.toBeInTheDocument()
  })

  test('FAB deshabilitado cuando no hay mascota seleccionada', async () => {
    mockApi({
      mascotas: [],
      mascotasFull: [],
      info: { veterinariaId: 5 },
    })
    renderExpediente(cliente)

    expect(await screen.findByText('Sin mascotas registradas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo aporte' })).toBeDisabled()
  })
})