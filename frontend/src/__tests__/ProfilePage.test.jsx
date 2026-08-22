/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { ROLE_IDS } from '../constants'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  authFetch: vi.fn(),
}))

// Leaflet se mockea a nivel de módulo: el mapa real necesita layout y DOM
// con medidas (jsdom no los da). El componente ProfileMap solo invoca la API
// de L dentro de useEffect; el fake permite verificar que se inicializa sin
// romper el render.
vi.mock('leaflet', () => {
  const addTo = vi.fn()
  const remove = vi.fn()
  return {
    default: {
      map: vi.fn(() => ({ remove })),
      divIcon: vi.fn(() => ({})),
      tileLayer: vi.fn(() => ({ addTo })),
      marker: vi.fn(() => ({ addTo })),
    },
  }
})

import { useAuth } from '../features/auth/context/AuthContext'
import { authFetch } from '../shared/utils/api'

// Fecha construida con componentes locales y serializada a ISO: el parseo en
// el componente vuelve a la MISMA fecha local (patrón MascotasPage.test).
function fechaLocalISO(anio, mes, dia) {
  return new Date(anio, mes - 1, dia).toISOString()
}

const PROFILE_VET = {
  id: 5,
  nombre: 'David Chen',
  email: 'david.chen@openpaw.dev',
  telefono: '+506 6001 2345',
  telefonoEmergencia: '+506 6009 9900',
  direccion: 'Av. Central 123, San José',
  licenciaMedica: 'CMV-8472-CR',
  fechaIncorporacion: fechaLocalISO(2018, 3, 15),
  rolId: ROLE_IDS.VETERINARIA,
  rolNombre: 'Veterinaria',
  activo: true,
  estado: 'Activo',
  fechaRegistro: fechaLocalISO(2018, 3, 15),
  fotoUrl: 'https://ejemplo.com/david.jpg',
  especialidad: 'Especialista Cirugía',
  sede: 'Sede Central',
  idCorporativo: 'OP-VET-0002',
}

const PROFILE_CLIENTE = {
  id: 10,
  nombre: 'Maria Rodriguez',
  email: 'maria.rodriguez@openpaw.dev',
  telefono: null,
  telefonoEmergencia: null,
  direccion: null,
  licenciaMedica: null,
  fechaIncorporacion: null,
  rolId: ROLE_IDS.CLIENTE,
  rolNombre: 'Cliente',
  activo: true,
  estado: 'Activo',
  fechaRegistro: fechaLocalISO(2024, 1, 10),
  fotoUrl: null,
}

/* Mock del API por URL (patrón CitasPage.test): perfil, redes y stats. */
function mockApi({ profile = PROFILE_VET, social = [], stats = {}, onPutMe } = {}) {
  authFetch.mockImplementation(async (url, opts = {}) => {
    const u = String(url)
    if (u.includes('/usuarios/me/redes-sociales')) {
      if (opts.method === 'PUT') return { ok: true, json: async () => ({}) }
      if (opts.method === 'DELETE') return { ok: true, status: 204 }
      return { ok: true, json: async () => social }
    }
    if (u.includes('/usuarios/me/stats')) {
      return { ok: true, json: async () => stats }
    }
    if (u.includes('/usuarios/me')) {
      if (opts.method === 'PUT') {
        const updated = onPutMe ? onPutMe(opts) : profile
        return { ok: true, json: async () => updated }
      }
      return { ok: true, json: async () => profile }
    }
    return { ok: false, json: async () => ({}) }
  })
}

function renderProfile(user, entry) {
  useAuth.mockReturnValue({ user, logout: vi.fn(), updateUser: vi.fn() })
  const initialEntries = entry ? [entry] : ['/dashboard/perfil']
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ProfilePage />
    </MemoryRouter>
  )
}

const vetUser = { nombre: 'David Chen', rolId: ROLE_IDS.VETERINARIA }
const clienteUser = { nombre: 'Maria Rodriguez', rolId: ROLE_IDS.CLIENTE }

describe('ProfilePage - rediseño perfil (T28): header, stats y datos extendidos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header con nombre, email, rol y credenciales reales del perfil', async () => {
    mockApi({ profile: PROFILE_VET, stats: { veterinarias: 1 } })
    renderProfile(vetUser)

    expect(await screen.findByRole('heading', { level: 1, name: 'David Chen' })).toBeInTheDocument()
    expect(screen.getByText('david.chen@openpaw.dev')).toBeInTheDocument()
    // "Veterinaria" aparece en el badge del header del perfil y en el topbar del shell
    expect(screen.getAllByText('Veterinaria').length).toBeGreaterThanOrEqual(2)
    // Credenciales del perfil extendido (wireframe: badges de especialidad/sede)
    expect(screen.getAllByText('Especialista Cirugía').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Sede Central')).toBeInTheDocument()
    // Id corporativo en el badge del header y en la card de credenciales
    expect(screen.getAllByText('OP-VET-0002').length).toBeGreaterThanOrEqual(2)
    // Badge de estado Activo (verified) + acciones
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar Perfil' })).toBeInTheDocument()
  })

  test('bento grid de stats con datos reales por rol (formato es-CR)', async () => {
    mockApi({ profile: PROFILE_VET, stats: { veterinarias: 2, citas: 385, mascotas: 1200, pendientes: 1 } })
    const { container } = renderProfile(vetUser)

    expect(await screen.findByText('Mis veterinarias')).toBeInTheDocument()
    expect(screen.getByText('Citas registradas')).toBeInTheDocument()
    expect(screen.getByText('Mascotas atendidas')).toBeInTheDocument()
    expect(screen.getByText('Solicitudes pendientes')).toBeInTheDocument()
    // Números grandes con separador de miles es-CR (1 200 con espacio no separable)
    const values = [...container.querySelectorAll('.profile-stat__value')].map((v) => v.textContent)
    expect(values).toEqual(expect.arrayContaining(['385']))
    expect(values).toEqual(expect.arrayContaining([expect.stringMatching(/^1[\s.,\u00A0]200$/)]))

    // Sin datos inventados: el wireframe pedía calificación/cirugías demo,
    // se mapean a los stats reales del backend (nada de "4.9").
    expect(screen.queryByText('4.9')).not.toBeInTheDocument()
  })

  test('información personal: emergencia, licencia médica, dirección y fecha', async () => {
    mockApi({ profile: PROFILE_VET, stats: {} })
    renderProfile(vetUser)

    expect(await screen.findByText('+506 6001 2345')).toBeInTheDocument()
    expect(screen.getByText('+506 6009 9900')).toBeInTheDocument()
    expect(screen.getByText('CMV-8472-CR')).toBeInTheDocument()
    expect(screen.getByText('Av. Central 123, San José')).toBeInTheDocument()
    expect(screen.getByText(/15 de marzo de 2018/)).toBeInTheDocument()
  })

  test('valores ausentes muestran "No registrado/a" sin romper el layout', async () => {
    mockApi({ profile: PROFILE_CLIENTE, stats: {} })
    renderProfile(clienteUser)

    expect(await screen.findByText('Maria Rodriguez')).toBeInTheDocument()
    // Dos valores vacíos comparten el fallback "No registrado/a"
    expect(screen.getAllByText('No registrado').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('No registrada').length).toBeGreaterThanOrEqual(2)
  })

  test('mapa Leaflet se monta con rol img y aria-label accesible', async () => {
    mockApi({ profile: PROFILE_VET, stats: {} })
    renderProfile(vetUser)

    await screen.findByRole('heading', { level: 1, name: 'David Chen' })
    const mapa = screen.getByRole('img', { name: 'Mapa de ubicación de cobertura activa' })
    expect(mapa).toBeInTheDocument()
    // Chip de ubicación (HTML accesible sobre el mapa)
    expect(screen.getByText('Ubicación Actual')).toBeInTheDocument()
    expect(screen.getByText('Zona de cobertura activa')).toBeInTheDocument()
  })
})

describe('ProfilePage - redes sociales con logos SVG (T28)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('lista las 7 plataformas permitidas (sin Telegram), cuenta conectadas y muestra el handle', async () => {
    mockApi({
      profile: PROFILE_VET,
      social: [{ plataforma: 'linkedin', url: 'https://linkedin.com/in/davidchenvet' }],
      stats: {},
    })
    renderProfile(vetUser)

    expect(await screen.findByText('1 Conectadas')).toBeInTheDocument()
    // Logo SVG de marca en la tile conectada
    expect(screen.getByRole('button', { name: 'Editar LinkedIn' }).querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText('@davidchenvet')).toBeInTheDocument()
    // Plataformas sin conectar ofrecen Conectar
    expect(screen.getByRole('button', { name: 'Conectar Facebook' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Conectar Instagram' })).toBeInTheDocument()
    // QA T28 Fix 2: Telegram NO se ofrece (backend PlataformasPermitidas lo rechaza)
    expect(screen.queryByRole('button', { name: 'Conectar Telegram' })).not.toBeInTheDocument()
    // Tile "Vincular nueva cuenta" solo mientras queden plataformas libres
    expect(screen.getByRole('button', { name: 'Vincular nueva cuenta' })).toBeInTheDocument()
  })

  test('conectar una red guarda vía PUT y actualiza la tile', async () => {
    mockApi({ profile: PROFILE_VET, social: [], stats: {} })
    renderProfile(vetUser)

    fireEvent.click(await screen.findByRole('button', { name: 'Conectar Facebook' }))
    const input = screen.getByLabelText('Usuario de Facebook')
    fireEvent.change(input, { target: { value: 'openpawcr' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('@openpawcr')).toBeInTheDocument()
    const put = authFetch.mock.calls.find(([, opts]) => opts && opts.method === 'PUT')
    expect(put).toBeTruthy()
    expect(String(put[0])).toContain('/usuarios/me/redes-sociales/facebook')
    expect(JSON.parse(put[1].body)).toBe('https://facebook.com/openpawcr')
  })

  test('todas conectadas: oculta "Vincular nueva cuenta"', async () => {
    const todas = [
      'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'whatsapp',
    ].map((p) => ({ plataforma: p, url: `https://red.example/${p}user` }))
    mockApi({ profile: PROFILE_VET, social: todas, stats: {} })
    renderProfile(vetUser)

    expect(await screen.findByText('7 Conectadas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vincular nueva cuenta' })).not.toBeInTheDocument()
  })

  test('desvincular usa DELETE y muestra la tile como no conectada', async () => {
    mockApi({
      profile: PROFILE_VET,
      social: [{ plataforma: 'facebook', url: 'https://facebook.com/openpawcr' }],
      stats: {},
    })
    renderProfile(vetUser)

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Facebook' }))
    const input = screen.getByLabelText('Usuario de Facebook')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    // El tile vuelve a "Conectar Facebook" (sin handle)
    expect(await screen.findByRole('button', { name: 'Conectar Facebook' })).toBeInTheDocument()
    // QA T28 Fix 3 (v2): desvincular usa DELETE /usuarios/me/redes-sociales/{plataforma}
    const del = authFetch.mock.calls.find(([, opts]) => opts && opts.method === 'DELETE')
    expect(del).toBeTruthy()
    expect(String(del[0])).toContain('/usuarios/me/redes-sociales/facebook')
    // El contador baja de 1 a 0 conectadas
    expect(await screen.findByText('0 Conectadas')).toBeInTheDocument()
    // No se envió PUT con body "" (ruta vieja del bug)
    const put = authFetch.mock.calls.find(([, opts]) => opts && opts.method === 'PUT')
    expect(put).toBeFalsy()
  })

  test('PUT de red fallido muestra error real y NO pinta estado optimista', async () => {
    authFetch.mockImplementation(async (url, opts = {}) => {
      const u = String(url)
      if (u.includes('/usuarios/me/redes-sociales')) {
        if (opts.method === 'PUT') {
          return { ok: false, status: 400, json: async () => ({ mensaje: 'La URL de la red social es obligatoria' }) }
        }
        return { ok: true, json: async () => [] }
      }
      if (u.includes('/usuarios/me/stats')) return { ok: true, json: async () => ({}) }
      if (u.includes('/usuarios/me')) return { ok: true, json: async () => PROFILE_VET }
      return { ok: false, json: async () => ({}) }
    })
    renderProfile(vetUser)

    fireEvent.click(await screen.findByRole('button', { name: 'Conectar Facebook' }))
    fireEvent.change(screen.getByLabelText('Usuario de Facebook'), { target: { value: 'openpawcr' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('La URL de la red social es obligatoria')).toBeInTheDocument()
    // Sin estado optimista: sigue en modo edición y la tile no muestra handle
    expect(screen.getByLabelText('Usuario de Facebook')).toBeInTheDocument()
    expect(screen.queryByText('@openpawcr')).not.toBeInTheDocument()
  })
})

describe('ProfilePage - credenciales (certificación solo si el backend las expone)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('veterinaria con especialidad ve la card de credenciales vigente', async () => {
    mockApi({ profile: PROFILE_VET, stats: {} })
    renderProfile(vetUser)

    // La especialidad vive en el badge del header y en la card de credenciales
    expect((await screen.findAllByText('Especialista Cirugía')).length).toBeGreaterThanOrEqual(2)
    const card = screen.getByLabelText('Credenciales profesionales')
    expect(card).toBeInTheDocument()
    expect(screen.getByText('Vigente')).toBeInTheDocument()
  })

  test('perfil sin especialidad ni id corporativo NO muestra credenciales inventadas', async () => {
    mockApi({ profile: PROFILE_CLIENTE, stats: {} })
    renderProfile(clienteUser)

    expect(await screen.findByText('Maria Rodriguez')).toBeInTheDocument()
    expect(screen.queryByLabelText('Credenciales profesionales')).not.toBeInTheDocument()
  })
})

describe('ProfilePage - edición conservada (T28)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Editar perfil abre el formulario y guardar confirma vía PUT /usuarios/me', async () => {
    mockApi({ profile: PROFILE_VET, stats: {} })
    renderProfile(vetUser)

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Perfil' }))
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('David Chen')
    expect(screen.getByLabelText('Teléfono')).toHaveValue('+506 6001 2345')
    expect(screen.getByLabelText('Email')).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'David Chen R.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Los cambios se guardaron correctamente.')).toBeInTheDocument()
    const putMe = authFetch.mock.calls.find(([url, opts]) => String(url).includes('/usuarios/me') && opts && opts.method === 'PUT')
    expect(putMe).toBeTruthy()
    // QA T28 Fix 1: el teléfono con espacios se normaliza antes del PUT
    // (backend ActualizarUsuarioDto rechaza ^[0-9+\-()]{8,15}$ sin espacios)
    const body = JSON.parse(putMe[1].body)
    expect(body.telefono).toBe('+50660012345')
  })

  test('flujo completarTelefono entra directo a edición con aviso', async () => {
    mockApi({ profile: PROFILE_CLIENTE, stats: {} })
    renderProfile(clienteUser, {
      pathname: '/dashboard/perfil',
      state: { completarTelefono: true },
    })

    expect(await screen.findByText('Ingresa tu teléfono para completar tu registro.')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
  })
})

describe('ProfilePage - menú de usuario (kebab)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('menú más opciones permite cerrar sesión', async () => {
    const logout = vi.fn()
    useAuth.mockReturnValue({ user: vetUser, logout, updateUser: vi.fn() })
    mockApi({ profile: PROFILE_VET, stats: {} })

    render(
      <MemoryRouter initialEntries={['/dashboard/perfil']}>
        <ProfilePage />
      </MemoryRouter>
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Más opciones' }))
    expect(screen.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})