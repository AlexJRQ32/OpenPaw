/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TrasladosPage } from '../features/traslados/pages/TrasladosPage'
import {
  construirEventosTimeline,
  buildPopupHtml,
  esCoordenadaValida,
  resolverPunto,
  coordsPosicionales,
  puntoOrigen,
  puntoDestino,
} from '../features/traslados/utils/coordsTraslado'
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

/* Leaflet se mockea a nivel de módulo: el mapa real necesita layout y DOM
   con medidas (jsdom no los da). El componente TrasladoMap solo invoca la
   API de L dentro de useEffect; el fake permite verificar que se inicializa
   sin romper el render (mismo criterio que ProfilePage.test T28). */
vi.mock('leaflet', () => {
  const addTo = vi.fn()
  const remove = vi.fn()
  return {
    default: {
      map: vi.fn(() => ({ remove, fitBounds: vi.fn(), setView: vi.fn() })),
      divIcon: vi.fn(() => ({})),
      tileLayer: vi.fn(() => ({ addTo })),
      marker: vi.fn(() => ({ addTo: vi.fn(() => ({ bindPopup: vi.fn() })) })),
      polyline: vi.fn(() => ({ addTo })),
      latLng: vi.fn((lat, lng) => ({ lat, lng })),
      latLngBounds: vi.fn(() => ({ pad: vi.fn(() => ({})) })),
    },
  }
})

import { useAuth } from '../features/auth/context/AuthContext'
import { authFetch } from '../shared/utils/api'

const API_BASE = 'https://openpaw.alwaysdata.net/api'

/* Fecha construida con componentes locales y serializada a ISO: el parseo en
   el componente vuelve a la MISMA fecha local (patrón MascotasPage.test). */
function fechaLocalISO(anio, mes, dia) {
  return new Date(anio, mes - 1, dia).toISOString()
}

/* DTO de traslado (Sprint 1 Tarea 10): ciclo de aprobación + ciclo logístico
   paralelo (EstadoLogistica, coordenadas, ETA, salida). */
function traslado(overrides = {}) {
  return {
    id: 1,
    mascotaId: 101,
    veterinariaOrigenId: 1,
    veterinariaDestinoId: 2,
    estado: 'Solicitado',
    estadoLogistica: 'Programado',
    fechaSolicitud: fechaLocalISO(2026, 8, 10),
    solicitadoPorId: 10,
    comentario: 'Paciente estable',
    ...overrides,
  }
}

function clienteUser() {
  return { nombre: 'Maria Rodriguez', sub: '10', rolId: ROLE_IDS.CLIENTE }
}

function vetUser() {
  return { nombre: 'David Chen', sub: '5', rolId: ROLE_IDS.VETERINARIA }
}

function adminUser() {
  return { nombre: 'Ana Admin', sub: '1', rolId: ROLE_IDS.ADMINISTRADOR }
}

/* Mock del API por URL (patrón InventarioPage.test): info de mascotas +
   veterinarias aprobadas + traslados. */
function mockApi({ traslados = [], mascotas = [], veterinarias = [], veterinariaId = null } = {}) {
  authFetch.mockImplementation(async (url, opts = {}) => {
    const u = String(url)
    if (u.includes('/usuarios/me/veterinaria-info')) {
      return { ok: true, json: async () => ({ mascotas, veterinariaId }) }
    }
    if (u.includes('/veterinarias/aprobadas')) {
      return { ok: true, json: async () => veterinarias }
    }
    if (u.includes('/traslados-expediente')) {
      if (opts.method === 'POST') return { ok: true, status: 201, json: async () => ({}) }
      if (opts.method === 'PUT') return { ok: true, status: 204 }
      return { ok: true, json: async () => traslados }
    }
    return { ok: false, json: async () => ({}) }
  })
}

function renderTraslados(user, api = {}) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  mockApi(api)
  return render(
    <MemoryRouter initialEntries={['/dashboard/traslados']}>
      <TrasladosPage />
    </MemoryRouter>
  )
}

const MASCOTA_LUNA = { id: 101, nombre: 'Luna', veterinaria: { id: 1 } }
const MASCOTA_MAX = { id: 102, nombre: 'Max', veterinaria: { id: 2 } }
const VET_NORTE = { id: 1, nombre: 'Clínica Norte' }
const VET_SUR = { id: 2, nombre: 'Hospital Sur' }

/* 1 solicitado (Luna, 1→2) + 1 aceptado (Max, 2→1) + 1 rechazado (Luna, 2→1). */
function trasladosMixtos() {
  return [
    traslado(),
    traslado({
      id: 2,
      mascotaId: 102,
      veterinariaOrigenId: 2,
      veterinariaDestinoId: 1,
      estado: 'Aceptado',
      estadoLogistica: 'Completado',
      fechaSolicitud: fechaLocalISO(2026, 8, 5),
      fechaRespuesta: fechaLocalISO(2026, 8, 6),
    }),
    traslado({
      id: 3,
      mascotaId: 101,
      veterinariaOrigenId: 2,
      veterinariaDestinoId: 1,
      estado: 'Rechazado',
      fechaSolicitud: fechaLocalISO(2026, 7, 20),
      fechaRespuesta: fechaLocalISO(2026, 7, 21),
      motivoRechazo: 'Cupo completo de pacientes',
    }),
  ]
}

describe('TrasladosPage - rediseño (T35): quick stats, cards, timeline y mapa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header "Traslados", eyebrow de logística y CTA solo para cliente', async () => {
    renderTraslados(clienteUser(), { traslados: [traslado()], mascotas: [MASCOTA_LUNA], veterinarias: [VET_NORTE, VET_SUR] })

    expect(await screen.findByRole('heading', { level: 1, name: 'Traslados' })).toBeInTheDocument()
    expect(screen.getByText('Logística de Pacientes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Solicitar traslado' })).toBeInTheDocument()
  })

  test('quick stats con datos reales del backend (total, pendientes, aceptados, rechazados)', async () => {
    renderTraslados(clienteUser(), {
      traslados: trasladosMixtos(),
      mascotas: [MASCOTA_LUNA, MASCOTA_MAX],
      veterinarias: [VET_NORTE, VET_SUR],
    })

    const stats = await screen.findByRole('group', { name: 'Resumen de traslados' })
    expect(within(stats).getByText('Total traslados')).toBeInTheDocument()
    expect(within(stats).getByText('Pendientes')).toBeInTheDocument()
    expect(within(stats).getByText('Aceptados')).toBeInTheDocument()
    expect(within(stats).getByText('Rechazados')).toBeInTheDocument()
    expect(within(stats).getByText('3')).toBeInTheDocument()
    expect(within(stats).getAllByText('1').length).toBeGreaterThanOrEqual(3)
  })

  test('mapa punto a punto: role img + aria-label con ruta y badge de coords aproximadas (sin coords reales)', async () => {
    renderTraslados(clienteUser(), {
      traslados: [traslado()],
      mascotas: [MASCOTA_LUNA],
      veterinarias: [VET_NORTE, VET_SUR], // sin latitud/longitud → aproximación posicional
    })

    const mapa = await screen.findByRole('img', {
      name: /Mapa de la ruta de Luna desde Clínica Norte hasta Hospital Sur/,
    })
    expect(mapa).toBeInTheDocument()
    // Caption con la ruta + descripción del timeline (información textual accesible)
    expect(screen.getAllByText(/Clínica Norte → Hospital Sur/).length).toBeGreaterThan(0)
    // Aproximación posicional DOCUMENTADA (criterio T28/T34)
    expect(screen.getByText('Coordenadas aproximadas')).toBeInTheDocument()
  })

  test('mapa usa coordenadas REALES de la veterinaria y NO muestra el badge de aproximación', async () => {
    renderTraslados(clienteUser(), {
      traslados: [traslado()],
      mascotas: [MASCOTA_LUNA],
      veterinarias: [
        { ...VET_NORTE, latitud: 9.9347, longitud: -84.0792 },
        { ...VET_SUR, latitud: 9.9216, longitud: -84.1202 },
      ],
    })

    await screen.findByRole('img', { name: /Mapa de la ruta de Luna/ })
    expect(screen.queryByText('Coordenadas aproximadas')).not.toBeInTheDocument()
    // El estado logístico (Programado) aparece en la caption del mapa
    expect(screen.getByText('Programado')).toBeInTheDocument()
  })

  test('cards con mascota, ruta origen→destino, Badge de estado y fecha', async () => {
    renderTraslados(clienteUser(), {
      traslados: trasladosMixtos(),
      mascotas: [MASCOTA_LUNA, MASCOTA_MAX],
      veterinarias: [VET_NORTE, VET_SUR],
    })

    expect((await screen.findAllByText('Luna')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Max')).length).toBeGreaterThan(0)
    // Ruta origen → destino en las cards
    expect(screen.getAllByText('Clínica Norte').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hospital Sur').length).toBeGreaterThan(0)
    // Badge de estado + id de la solicitud
    expect(screen.getAllByText('Solicitado').length).toBeGreaterThan(0)
    expect(screen.getByText(/#TR-0001/)).toBeInTheDocument()
    // Motivo de rechazo real (card + timeline)
    expect(screen.getAllByText(/Cupo completo de pacientes/).length).toBeGreaterThan(0)
    // Aceptado el {fecha}
    expect(screen.getByText(/Aceptado el/)).toBeInTheDocument()
  })

  test('chips de filtro (con conteo) filtran las cards', async () => {
    renderTraslados(clienteUser(), {
      traslados: trasladosMixtos(),
      mascotas: [MASCOTA_LUNA, MASCOTA_MAX],
      veterinarias: [VET_NORTE, VET_SUR],
    })

    // 'Luna' aparece en la card, en el subtítulo del mapa y en el timeline
    expect((await screen.findAllByText('Luna')).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Aceptados/ }))
    expect((await screen.findAllByText('Max')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Luna')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Rechazados/ }))
    expect(screen.getAllByText(/Cupo completo de pacientes/).length).toBeGreaterThan(0)
    expect(screen.queryByText('Max')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Todos/ }))
    expect((await screen.findAllByText('Luna')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Max')).length).toBeGreaterThan(0)
  })

  test('timeline: historial del traslado seleccionado con datos reales del backend', async () => {
    renderTraslados(clienteUser(), {
      traslados: trasladosMixtos(),
      mascotas: [MASCOTA_LUNA, MASCOTA_MAX],
      veterinarias: [VET_NORTE, VET_SUR],
    })

    // El primer traslado (Solicitado) es el seleccionado por defecto
    expect(await screen.findByText('Historial del traslado')).toBeInTheDocument()
    expect(screen.getByText('Solicitud de traslado')).toBeInTheDocument()
    expect(screen.getByText('A la espera de aprobación')).toBeInTheDocument()

    // Seleccionar el traslado aceptado actualiza el historial
    fireEvent.click(screen.getByRole('button', { name: 'Ver ruta de Max' }))
    expect(await screen.findByText('Traslado aceptado')).toBeInTheDocument()
  })

  test('botón "Ver ruta" selecciona la card (aria-pressed) y actualiza el mapa', async () => {
    renderTraslados(clienteUser(), {
      traslados: [traslado()],
      mascotas: [MASCOTA_LUNA],
      veterinarias: [VET_NORTE, VET_SUR],
    })

    const btn = await screen.findByRole('button', { name: 'Ver ruta de Luna' })
    expect(btn).toHaveAttribute('aria-pressed', 'true') // seleccionado por defecto

    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  test('veterinaria: panel de solicitudes pendientes con Aceptar/Rechazar', async () => {
    renderTraslados(vetUser(), {
      traslados: [traslado(), traslado({ id: 2, estado: 'Aceptado' })],
      mascotas: [MASCOTA_LUNA],
      veterinarias: [VET_NORTE, VET_SUR],
      veterinariaId: 2, // destino de la solicitud pendiente
    })

    expect(await screen.findByText('Solicitudes pendientes')).toBeInTheDocument()
    expect(screen.getByText('1 pendiente')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Aceptar/ }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('button', { name: /Rechazar/ }).length).toBeGreaterThanOrEqual(1)
  })

  test('empty state cuando no hay traslados', async () => {
    renderTraslados(clienteUser(), { traslados: [], mascotas: [], veterinarias: [] })

    expect(await screen.findByText('Sin traslados')).toBeInTheDocument()
    expect(screen.getByText('No hay traslados para este filtro.')).toBeInTheDocument()
  })
})

describe('TrasladosPage - funcionalidad conservada (crear, aceptar, rechazar)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('cliente crea solicitud vía POST /traslados-expediente', async () => {
    renderTraslados(clienteUser(), {
      traslados: [],
      mascotas: [MASCOTA_LUNA],
      veterinarias: [VET_NORTE, VET_SUR],
    })

    fireEvent.click(await screen.findByRole('button', { name: 'Solicitar traslado' }))
    expect(screen.getByRole('heading', { name: 'Solicitar traslado de expediente' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Mascota'), { target: { value: '101' } })
    fireEvent.change(screen.getByLabelText('Veterinaria destino'), { target: { value: '2' } })
    // Hay 3 botones "Solicitar traslado": CTA del header, EmptyState y submit
    // del modal. El último es el submit del formulario.
    const botones = screen.getAllByRole('button', { name: 'Solicitar traslado' })
    fireEvent.click(botones[botones.length - 1])

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/traslados-expediente`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"mascotaId":101'),
        })
      )
    })
  })

  test('veterinaria acepta vía PUT /traslados-expediente/{id}/aceptar', async () => {
    renderTraslados(vetUser(), {
      traslados: [traslado()],
      mascotas: [MASCOTA_LUNA],
      veterinarias: [VET_NORTE, VET_SUR],
      veterinariaId: 2,
    })

    fireEvent.click((await screen.findAllByRole('button', { name: /Aceptar/ }))[0])
    expect(screen.getByRole('heading', { name: '¿Aceptar traslado?' })).toBeInTheDocument()
    const dialog = screen.getByRole('heading', { name: '¿Aceptar traslado?' }).closest('.confirm-dialog-body')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(`${API_BASE}/traslados-expediente/1/aceptar`, { method: 'PUT' })
    })
  })

  test('veterinaria rechaza con motivo obligatorio vía PUT /rechazar', async () => {
    renderTraslados(vetUser(), {
      traslados: [traslado()],
      mascotas: [MASCOTA_LUNA],
      veterinarias: [VET_NORTE, VET_SUR],
      veterinariaId: 2,
    })

    fireEvent.click((await screen.findAllByRole('button', { name: /Rechazar/ }))[0])
    expect(screen.getByRole('heading', { name: '¿Rechazar traslado?' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Motivo de rechazo'), { target: { value: 'Sin cupo' } })
    const dialog = screen.getByRole('heading', { name: '¿Rechazar traslado?' }).closest('.confirm-dialog-body')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rechazar' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/traslados-expediente/1/rechazar`,
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"motivoRechazo":"Sin cupo"'),
        })
      )
    })
  })

  test('admin ve el listado completo sin CTA de crear', async () => {
    renderTraslados(adminUser(), {
      traslados: trasladosMixtos(),
      mascotas: [MASCOTA_LUNA, MASCOTA_MAX],
      veterinarias: [VET_NORTE, VET_SUR],
    })

    expect((await screen.findAllByText('Luna')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Solicitar traslado' })).not.toBeInTheDocument()
  })
})

/* ==========================================================================
   Utilidades de coordenadas y popup (QA T35):
   - Estrategia de 3 capas: traslado → veterinaria → aproximación posicional.
   - XSS stored en el popup del mapa (escapeHtml).
   - Timeline con datos reales del backend.
   ========================================================================== */
describe('TrasladosPage - coordenadas del mapa (T35)', () => {
  test('resolverPunto prioriza coords reales del traslado, luego de la veterinaria, luego posicional', () => {
    // 1) Coordenadas REALES del traslado ganan
    const a = resolverPunto({ lat: 9.99, lng: -84.1 }, { lat: 9.5, lng: -84.2 }, 5)
    expect(a).toEqual({ lat: 9.99, lng: -84.1, esReal: true })

    // 2) Si el traslado no las trae, usa las de la veterinaria del listado
    const b = resolverPunto({ lat: null, lng: null }, { lat: 9.5, lng: -84.2 }, 5)
    expect(b).toEqual({ lat: 9.5, lng: -84.2, esReal: true })

    // 3) Sin ninguna: APROXIMACIÓN POSICIONAL documentada (esReal=false)
    const c = resolverPunto({}, {}, 3)
    expect(c.esReal).toBe(false)
    expect(esCoordenadaValida(c.lat, c.lng)).toBe(true)
  })

  test('coordsPosicionales produce puntos válidos y distintos por id (origen ≠ destino)', () => {
    const origen = coordsPosicionales(1)
    const destino = coordsPosicionales(2)
    expect(esCoordenadaValida(origen.lat, origen.lng)).toBe(true)
    expect(esCoordenadaValida(destino.lat, destino.lng)).toBe(true)
    expect(origen.lat).not.toBe(destino.lat)
    expect(origen.lng).not.toBe(destino.lng)
  })

  test('puntoOrigen/puntoDestino resuelven con el id de cada veterinaria', () => {
    const t = traslado()
    const veterinarias = [{ id: 1, latitud: 9.9347, longitud: -84.0792 }, { id: 2, latitud: 9.9216, longitud: -84.1202 }]
    const origen = puntoOrigen(t, veterinarias)
    const destino = puntoDestino(t, veterinarias)
    expect(origen.esReal).toBe(true)
    expect(origen.lat).toBe(9.9347)
    expect(destino.esReal).toBe(true)
    expect(destino.lat).toBe(9.9216)
  })

  test('coords del traslado ganan sobre las de la veterinaria', () => {
    const t = traslado({
      origenLatitud: 9.9999, origenLongitud: -84.0777,
      destinoLatitud: 9.8888, destinoLongitud: -84.1234,
    })
    const veterinarias = [{ id: 1, latitud: 9.1, longitud: -84.1 }, { id: 2, latitud: 9.2, longitud: -84.2 }]
    expect(puntoOrigen(t, veterinarias)).toEqual({ lat: 9.9999, lng: -84.0777, esReal: true })
    expect(puntoDestino(t, veterinarias)).toEqual({ lat: 9.8888, lng: -84.1234, esReal: true })
  })

  test('buildPopupHtml escapa nombres maliciosos (XSS stored) y nota la aproximación', () => {
    const html = buildPopupHtml(
      { nombre: '<img src=x onerror=alert(1)>', esReal: false },
      { nombre: 'Hospital Sur', esReal: false }
    )
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('Coordenadas aproximadas')
  })

  test('buildPopupHtml sin nota de aproximación cuando ambos puntos son reales', () => {
    const html = buildPopupHtml({ nombre: 'Clínica Norte', esReal: true }, { nombre: 'Hospital Sur', esReal: true })
    expect(html).toContain('Clínica Norte')
    expect(html).toContain('Hospital Sur')
    expect(html).not.toContain('aproximadas')
  })
})

describe('TrasladosPage - timeline del historial (T35)', () => {
  test('solicitado: eventos Solicitud + Pendiente', () => {
    const eventos = construirEventosTimeline(traslado(), {
      mascota: 'Luna', origen: 'Clínica Norte', destino: 'Hospital Sur',
    })
    expect(eventos.map((e) => e.tipoLabel)).toEqual(['Solicitud', 'Pendiente'])
    expect(eventos[0].ubicacion).toBe('Clínica Norte')
  })

  test('aceptado: eventos Solicitud + Aceptado (con fecha de respuesta)', () => {
    const eventos = construirEventosTimeline(
      traslado({ estado: 'Aceptado', fechaRespuesta: fechaLocalISO(2026, 8, 6) }),
      { mascota: 'Luna', origen: 'Clínica Norte', destino: 'Hospital Sur' }
    )
    expect(eventos.map((e) => e.tipoLabel)).toEqual(['Solicitud', 'Aceptado'])
    expect(eventos[1].icono).toBe('check_circle')
  })

  test('rechazado: incluye el motivo real del backend', () => {
    const eventos = construirEventosTimeline(
      traslado({ estado: 'Rechazado', fechaRespuesta: fechaLocalISO(2026, 7, 21), motivoRechazo: 'Cupo completo' }),
      { mascota: 'Luna', origen: 'Clínica Norte', destino: 'Hospital Sur' }
    )
    expect(eventos.map((e) => e.tipoLabel)).toEqual(['Solicitud', 'Rechazado'])
    expect(eventos[1].descripcion).toContain('Cupo completo')
    expect(eventos[1].tipo).toBe('error')
  })

  test('logística: EnTransito agrega evento de salida; Completado agrega llegada', () => {
    const enTransito = construirEventosTimeline(
      traslado({ estadoLogistica: 'EnTransito', salida: fechaLocalISO(2026, 8, 10) }),
      { mascota: 'Luna', origen: 'Clínica Norte', destino: 'Hospital Sur' }
    )
    expect(enTransito.map((e) => e.tipoLabel)).toEqual(['Solicitud', 'En tránsito', 'Pendiente'])

    const completado = construirEventosTimeline(
      traslado({ estado: 'Aceptado', estadoLogistica: 'Completado', etaLlegada: fechaLocalISO(2026, 8, 10) }),
      { mascota: 'Luna', origen: 'Clínica Norte', destino: 'Hospital Sur' }
    )
    expect(completado.map((e) => e.tipoLabel)).toEqual(['Solicitud', 'Completado', 'Aceptado'])
  })
})