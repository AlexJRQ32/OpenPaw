/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EmergenciasPage } from '../features/emergencias/pages/EmergenciasPage'
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

function emergencia(overrides = {}) {
  return {
    id: 1,
    mascotaId: 1,
    propietarioId: 10,
    veterinariaId: 5,
    veterinariaNombreExterna: null,
    fechaAtencion: '2026-10-12T14:30:00',
    motivo: 'Shock anafilactico',
    sintomas: 'Dificultad respiratoria severa e hinchazon facial.',
    tratamientoAplicado: 'Adrenalina 0.01 mg/kg IM\nDexametasona 0.5 mg/kg IV',
    esEnPlataforma: true,
    archivoAdjuntoUrl: null,
    fechaRegistro: '2026-10-12T14:35:00',
    nivelSeveridad: 'Nivel1_Critico',
    frecuenciaCardiaca: 160,
    saturacionO2: 88,
    temperatura: 39.2,
    estadoPaciente: 'Estable',
    medicoACargo: 'Dr. Martinez',
    diagnostico: 'Shock anafilactico por picadura',
    ...overrides,
  }
}

const MASCOTAS = [
  { id: 1, nombre: 'Luna' },
  { id: 2, nombre: 'Max' },
]

function emergenciaResuelta(overrides = {}) {
  return emergencia({
    id: 2,
    mascotaId: 2,
    nivelSeveridad: 'Resuelto',
    motivo: 'Ingestion de cuerpo extrano',
    diagnostico: 'Transito normal',
    frecuenciaCardiaca: null,
    saturacionO2: null,
    temperatura: null,
    ...overrides,
  })
}

/* Mock del API por URL + metodo (mismo patron que CitasPage.test.jsx) */
function mockApi({ emergencias = [], mascotas = MASCOTAS, info = {} }) {
  authFetch.mockImplementation(async (url, options) => {
    if (url.includes('/usuarios/me/veterinaria-info')) {
      return { ok: true, json: async () => ({ mascotas, ...info }) }
    }
    if (url.includes('/emergencias/') && options?.method === 'PUT') {
      return { ok: true, status: 204, json: async () => ({}) }
    }
    if (url.includes('/emergencias') && options?.method === 'POST') {
      return { ok: true, status: 201, json: async () => ({}) }
    }
    if (url.includes('/emergencias')) {
      const match = url.match(/mascotaId=(\d+)/)
      const mascotaId = match ? Number(match[1]) : null
      const data = mascotaId ? emergencias.filter((e) => e.mascotaId === mascotaId) : emergencias
      return { ok: true, json: async () => data }
    }
    return { ok: false, json: async () => ({}) }
  })
}

function renderEmergencias(user) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={['/dashboard/emergencias']}>
      <EmergenciasPage />
    </MemoryRouter>
  )
}

const vet = { nombre: 'David', sub: '5', rolId: ROLE_IDS.VETERINARIA }
const cliente = { nombre: 'Maria', sub: '10', rolId: ROLE_IDS.CLIENTE }

describe('EmergenciasPage - rediseno con severidad y signos vitales (T30)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header "Registro de Emergencias", boton Nueva Emergencia y selector de pacientes', async () => {
    mockApi({ emergencias: [emergencia()] })
    renderEmergencias(vet)

    expect(await screen.findByRole('heading', { level: 1, name: 'Registro de Emergencias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nueva Emergencia/ })).toBeInTheDocument()
    // PetSelector: "Ver Todos" por defecto + pildoras por mascota
    expect(screen.getByRole('radio', { name: 'Ver Todos' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Luna' })).toBeInTheDocument()
  })

  test('tarjeta critica destacada: badge Nivel 1 - Critico + signos vitales', async () => {
    mockApi({ emergencias: [emergencia()] })
    renderEmergencias(vet)

    const critica = await screen.findByLabelText('Emergencia crítica destacada')
    expect(within(critica).getByText('Nivel 1 - Crítico')).toBeInTheDocument()
    expect(within(critica).getByRole('heading', { name: 'Shock anafilactico' })).toBeInTheDocument()

    const vitales = within(critica).getByRole('group', { name: 'Signos vitales' })
    expect(within(vitales).getByText('Frecuencia Cardíaca')).toBeInTheDocument()
    expect(within(vitales).getByText(/160/)).toBeInTheDocument()
    expect(within(vitales).getByText('Saturación O2')).toBeInTheDocument()
    expect(within(vitales).getByText(/88/)).toBeInTheDocument()
    expect(within(vitales).getByText('Temperatura')).toBeInTheDocument()
    expect(within(vitales).getByText(/39.2/)).toBeInTheDocument()
    // Estado del paciente y tratamiento administrado
    expect(within(critica).getByText('Estable')).toBeInTheDocument()
    expect(within(critica).getByText('Tratamiento Administrado')).toBeInTheDocument()
    expect(within(critica).getByText('Adrenalina 0.01 mg/kg IM')).toBeInTheDocument()
    expect(within(critica).getByText('Dexametasona 0.5 mg/kg IV')).toBeInTheDocument()
  })

  test('modo "Ver Todos" consulta el endpoint por cada mascota y muestra badges de severidad', async () => {
    mockApi({
      emergencias: [emergencia(), emergenciaResuelta()],
    })
    renderEmergencias(vet)

    // ambas mascotas consultadas
    expect(await screen.findByText('Ingestion de cuerpo extrano')).toBeInTheDocument()
    const urls = authFetch.mock.calls.map(([url]) => url).filter((u) => u.includes('/emergencias?mascotaId='))
    expect(urls).toHaveLength(2)

    // badge de resuelto en la grilla secundaria
    expect(screen.getByText('Resuelto')).toBeInTheDocument()
    expect(screen.getByText('Transito normal')).toBeInTheDocument()
  })

  test('clic en una pildora filtra por esa mascota', async () => {
    mockApi({ emergencias: [emergencia(), emergenciaResuelta()] })
    renderEmergencias(vet)

    await screen.findByText('Ingestion de cuerpo extrano')
    fireEvent.click(screen.getByRole('radio', { name: 'Luna' }))

    // solo las emergencias de Luna (mascotaId 1)
    expect(await screen.findByText('Shock anafilactico')).toBeInTheDocument()
    expect(screen.queryByText('Ingestion de cuerpo extrano')).not.toBeInTheDocument()
  })

  test('Ver Detalles abre el modal con diagnostico y permite actualizar estado (PUT)', async () => {
    mockApi({ emergencias: [emergencia(), emergenciaResuelta()] })
    renderEmergencias(vet)

    await screen.findByText('Ingestion de cuerpo extrano')
    fireEvent.click(screen.getAllByRole('button', { name: /Ver Detalles/ })[1])

    const dialog = await screen.findByRole('dialog', { name: 'Detalle de la emergencia' })
    expect(within(dialog).getByText('Ingestion de cuerpo extrano')).toBeInTheDocument()
    expect(within(dialog).getByText('Transito normal')).toBeInTheDocument()

    // actualizar estado: Resuelto -> Nivel 2 Urgente
    const select = within(dialog).getByLabelText('Nivel de severidad')
    fireEvent.change(select, { target: { value: 'Nivel2_Urgente' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar estado' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/emergencias/2`,
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ NivelSeveridad: 'Nivel2_Urgente' }),
        })
      )
    })
  })

  test('modal de registro conserva crear emergencia y envia severidad + signos vitales', async () => {
    mockApi({ emergencias: [emergencia()] })
    renderEmergencias(vet)

    fireEvent.click(await screen.findByRole('button', { name: /Nueva Emergencia/ }))

    expect(screen.getByRole('heading', { name: 'Registrar emergencia' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Mascota'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Fecha y hora de atencion'), { target: { value: '2026-10-13T09:00' } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Traumatismo extremidad' } })
    fireEvent.change(screen.getByLabelText('Nivel de severidad'), { target: { value: 'Nivel2_Urgente' } })
    fireEvent.change(screen.getByLabelText('Frecuencia cardíaca (bpm)'), { target: { value: '120' } })
    fireEvent.change(screen.getByLabelText('Saturación O2 (%)'), { target: { value: '95' } })

    fireEvent.click(screen.getByRole('button', { name: 'Registrar emergencia' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/emergencias`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"nivelSeveridad":"Nivel2_Urgente"'),
        })
      )
    })
    const body = authFetch.mock.calls.find(([, opts]) => opts?.method === 'POST')?.[1]?.body
    expect(body).toContain('"frecuenciaCardiaca":120')
    expect(body).toContain('"saturacionO2":95')
  })

  test('cliente ve enlace a expediente y no se rompe con mascotas vacias', async () => {
    mockApi({ mascotas: [], emergencias: [] })
    renderEmergencias(cliente)

    expect(await screen.findByText('Sin mascotas registradas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nueva Emergencia/ })).toBeDisabled()
  })
})