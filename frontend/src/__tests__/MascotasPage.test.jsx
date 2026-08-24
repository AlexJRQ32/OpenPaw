import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MascotasPage } from '../features/mascotas/pages/MascotasPage'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  authFetch: vi.fn(),
}))

vi.mock('../shared/context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

import { useAuth } from '../features/auth/context/AuthContext'
import { authFetch } from '../shared/utils/api'

// Fechas construidas con componentes locales y serializadas a ISO: así el
// parseo en el componente ("new Date(...)") vuelve a la MISMA fecha local y
// los asserts no dependen de la zona horaria de la máquina (ej. UTC-6 CR).
function fechaLocalISO(anio, mes, dia) {
  return new Date(anio, mes - 1, dia).toISOString()
}

function hoyLocalISO() {
  const now = new Date()
  return fechaLocalISO(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

const MAX = {
  id: 1,
  nombre: 'Max',
  especie: 'Perro',
  raza: 'Golden Retriever',
  sexo: 1,
  peso: 28,
  color: 'Dorado',
  identificacion: 'MICRO-001',
  fotoUrl: 'https://ejemplo.com/max.jpg',
  estadoSalud: 'Saludable',
  proximaVacuna: 'Rabia',
  proximaVacunaFecha: fechaLocalISO(2026, 10, 12),
  medicacionActual: null,
  proximaMedicacionFecha: null,
  veterinaria: 'Clinica Central',
}

const LUNA = {
  id: 2,
  nombre: 'Luna',
  especie: 'Gato',
  raza: 'Simes',
  sexo: 2,
  peso: 4.2,
  color: 'Blanco',
  identificacion: null,
  fotoUrl: null,
  estadoSalud: 'Tratamiento',
  proximaVacuna: null,
  proximaVacunaFecha: null,
  medicacionActual: 'Medicacion dental',
  proximaMedicacionFecha: hoyLocalISO(),
  veterinaria: null,
}

// Simula el merge del hook: /mascotas devuelve el DTO completo y
// veterinaria-info el reducido (id, nombre, especie, raza, veterinaria, ultimaCita).
function mockApiCon(mascotas) {
  authFetch.mockImplementation(async (url) => {
    if (String(url).includes('/mascotas')) {
      return { ok: true, json: async () => mascotas }
    }
    return {
      ok: true,
      json: async () => ({
        mascotas: mascotas.map(({ id, nombre, especie, raza, veterinaria, ultimaCita }) => ({
          id,
          nombre,
          especie,
          raza,
          veterinaria,
          ultimaCita,
        })),
      }),
    }
  })
}

function renderMascotas(user = { nombre: 'Ana', rolId: 4 }) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={['/dashboard/mascotas']}>
      <MascotasPage />
    </MemoryRouter>
  )
}

describe('MascotasPage - cards rediseñadas (T26)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renderiza foto real, badge de salud, sexo con icono y alerta de proxima vacuna', async () => {
    mockApiCon([MAX])
    const { container } = renderMascotas()

    expect(await screen.findByText('Max')).toBeInTheDocument()
    expect(screen.getByText('Saludable')).toBeInTheDocument()
    // Foto real en el avatar circular
    expect(screen.getByAltText('Foto de Max')).toHaveAttribute('src', 'https://ejemplo.com/max.jpg')
    // Icono de genero junto al sexo
    expect(container.querySelector('.mascota-detail-value--sexo .material-symbols-outlined')).toHaveTextContent('male')
    expect(screen.getByText('Macho')).toBeInTheDocument()
    // Footer de alerta: proxima vacuna + fecha corta
    expect(screen.getByText('Próx: Rabia')).toBeInTheDocument()
    expect(screen.getByText('12 Oct')).toBeInTheDocument()
    // Veterinaria de la cita mas reciente se conserva
    expect(screen.getByText('Clinica Central')).toBeInTheDocument()
    // Vacuna futura → sin alerta urgente → ring primary
    expect(container.querySelector('.mascota-card')).toHaveClass('mascota-card--primary')
  })

  test('tratamiento con medicacion hoy: badge warning, etiqueta "Hoy" y ring error', async () => {
    mockApiCon([LUNA])
    const { container } = renderMascotas()

    expect(await screen.findByText('Luna')).toBeInTheDocument()
    expect(screen.getByText('Tratamiento')).toBeInTheDocument()
    expect(screen.getByText('Medicacion dental')).toBeInTheDocument()
    expect(screen.getByText('Hoy')).toBeInTheDocument()
    // Sin foto → fallback icono pets en circulo tintado (no <img>)
    expect(screen.queryByAltText('Foto de Luna')).not.toBeInTheDocument()
    // Medicacion programada hoy → alerta urgente → ring error
    expect(container.querySelector('.mascota-card')).toHaveClass('mascota-card--error')
    // Icono de genero femenino
    expect(container.querySelector('.mascota-detail-value--sexo .material-symbols-outlined')).toHaveTextContent('female')
  })

  test('mascota sin datos de salud muestra badge Saludable por defecto', async () => {
    mockApiCon([{ ...MAX, estadoSalud: null, proximaVacuna: null, proximaVacunaFecha: null, medicacionActual: null, proximaMedicacionFecha: null }])
    const { container } = renderMascotas()

    expect(await screen.findByText('Max')).toBeInTheDocument()
    expect(screen.getByText('Saludable')).toBeInTheDocument()
    expect(container.querySelector('.mascota-card')).toHaveClass('mascota-card--primary')
    expect(screen.queryByText(/Próx:/)).not.toBeInTheDocument()
  })

  test('no cliente no ve el boton Agregar mascota', async () => {
    mockApiCon([MAX])
    renderMascotas({ nombre: 'Vet', rolId: 2 })

    expect(await screen.findByText('Max')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agregar mascota' })).not.toBeInTheDocument()
  })
})

describe('MascotasPage - fallbacks de carga (QA A1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('ambos endpoints fallan: error real visible, nunca EmptyState', async () => {
    authFetch.mockImplementation(async () => ({ ok: false }))
    renderMascotas() // rolId 4 (cliente)

    expect(await screen.findByText('No se pudieron cargar tus mascotas.')).toBeInTheDocument()
    expect(screen.queryByText(/Aun no tienes mascotas/)).not.toBeInTheDocument()
  })

  test('cliente: si solo falla veterinaria-info, usa /mascotas como driver sin perder datos', async () => {
    authFetch.mockImplementation(async (url) => {
      if (String(url).includes('/mascotas')) {
        return { ok: true, json: async () => [MAX] }
      }
      return { ok: false } // veterinaria-info falla
    })
    renderMascotas() // rolId 4 (cliente)

    expect(await screen.findByText('Max')).toBeInTheDocument()
    // Campos completos del DTO enriquecido siguen disponibles
    expect(screen.getByText('Próx: Rabia')).toBeInTheDocument()
    expect(screen.queryByText(/No se pudieron cargar/)).not.toBeInTheDocument()
  })

  test('veterinaria: si solo falla veterinaria-info, error visible y NO fallback a /mascotas', async () => {
    authFetch.mockImplementation(async (url) => {
      if (String(url).includes('/mascotas')) {
        return { ok: true, json: async () => [MAX] }
      }
      return { ok: false } // veterinaria-info falla
    })
    renderMascotas({ nombre: 'Vet', rolId: 2 })

    expect(
      await screen.findByText('No se pudieron cargar las mascotas de tu clínica.')
    ).toBeInTheDocument()
    // No se exponen mascotas de otras clínicas via fallback
    expect(screen.queryByText('Max')).not.toBeInTheDocument()
  })
})

describe('MascotasPage - urgencia por fila (QA M1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('vacuna vencida + medicacion futura: solo la fila de vacuna es urgente (ring global error se mantiene)', async () => {
    const MIXTA = {
      id: 3,
      nombre: 'Rocky',
      especie: 'Perro',
      raza: 'Bulldog',
      sexo: 1,
      peso: 20,
      color: 'Negro',
      identificacion: null,
      fotoUrl: null,
      estadoSalud: 'Saludable',
      proximaVacuna: 'Rabia',
      proximaVacunaFecha: fechaLocalISO(2020, 1, 1), // vencida
      medicacionActual: 'Antipulgas',
      proximaMedicacionFecha: fechaLocalISO(2030, 1, 1), // futura
      veterinaria: null,
    }
    mockApiCon([MIXTA])
    const { container } = renderMascotas()

    expect(await screen.findByText('Rocky')).toBeInTheDocument()
    const filas = container.querySelectorAll('.mascota-alert')
    expect(filas.length).toBe(2)
    // Fila 1 = vacuna (vencida) → urgente; fila 2 = medicacion (futura) → normal
    expect(filas[0]).toHaveClass('mascota-alert--urgent')
    expect(filas[1]).not.toHaveClass('mascota-alert--urgent')
    // El ring error por card (alerta global) se mantiene
    expect(container.querySelector('.mascota-card')).toHaveClass('mascota-card--error')
  })
})

describe('MascotasPage - modal Agregar mascota conservado (T26)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiCon([MAX])
  })

  test('el modal sigue abriendo y muestra el formulario completo', async () => {
    renderMascotas()

    fireEvent.click(await screen.findByRole('button', { name: 'Agregar mascota' }))
    expect(await screen.findByRole('heading', { name: 'Agregar mascota' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText('Especie')).toBeInTheDocument()
    expect(screen.getByLabelText('Sexo')).toBeInTheDocument()
    expect(screen.getByText('Guardar mascota')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  test('el modal se cierra con Cancelar', async () => {
    renderMascotas()

    fireEvent.click(await screen.findByRole('button', { name: 'Agregar mascota' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('heading', { name: 'Agregar mascota' })).not.toBeInTheDocument()
  })
})