/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AportesPage } from '../features/expediente/pages/AportesPage'
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

/* ------------------------------- datos de prueba ------------------------- */

const PET_MAX = { id: 1, nombre: 'Max', especie: 'Perro', raza: 'Golden Retriever' }
const PET_LUNA = { id: 2, nombre: 'Luna', especie: 'Gato', raza: 'Siamés' }

const PET_FULL_MAX = { ...PET_MAX, peso: 28, proximaVacuna: 'Rabia — Oct 2026' }
const PET_FULL_LUNA = { ...PET_LUNA, peso: 4, proximaVacuna: null }

/* Entidad cruda del endpoint (PascalCase — se normaliza en el hook). */
function aporte(overrides = {}) {
  return {
    Id: 7,
    MascotaId: 1,
    PropietarioId: 10,
    VeterinariaNombre: 'PetCare Center',
    FechaAtencion: '2023-08-12T09:00:00Z',
    TipoAtencion: 'Vacuna',
    Descripcion: 'Refuerzo séxtuple anual',
    Diagnostico: 'Buen estado general de salud.',
    Medicamentos: null,
    ArchivoAdjuntoUrl: null,
    FechaRegistro: '2023-08-12T10:00:00Z',
    ...overrides,
  }
}

function haceDias(dias) {
  return new Date(Date.now() - dias * 24 * 3600 * 1000).toISOString()
}

/* Mock del API con mini-store en memoria: POST/PUT/DELETE mutan el store y
   los GET siguientes reflejan el cambio (igual que el backend). */
let DB

function seedDb({ mascotasInfo = [], mascotasFull = [], aportes = [] }) {
  DB = { mascotasInfo, mascotasFull, aportes, nextId: 100 }
}

/* Handler expuesto para que tests individuales lo deleguen tras un
   mockImplementationOnce (p. ej. para simular un 400 del PUT). */
async function apiHandler(url, options = {}) {
  const method = options.method || 'GET'

  if (method === 'POST' && url.includes('/expediente-aportes')) {
    const body = JSON.parse(options.body)
    DB.aportes.push({
      Id: ++DB.nextId,
      MascotaId: body.mascotaId,
      PropietarioId: 10,
      VeterinariaNombre: body.veterinariaNombre,
      FechaAtencion: body.fechaAtencion,
      TipoAtencion: body.tipoAtencion,
      Descripcion: body.descripcion,
      Diagnostico: body.diagnostico ?? null,
      Medicamentos: body.medicamentos ?? null,
      ArchivoAdjuntoUrl: body.archivoAdjuntoUrl ?? null,
      FechaRegistro: new Date().toISOString(),
    })
    return { ok: true, status: 201, json: async () => ({}) }
  }

  /* PUT parcial T36: aplica solo los campos enviados (null preserva).
     El body llega camelCase y el backend actualiza las propiedades de la
     entidad (PascalCase en este store), igual que haría EF Core. */
  if (method === 'PUT') {
    const id = Number(url.split('/').pop())
    const idx = DB.aportes.findIndex((a) => Number(a.Id ?? a.id) === id)
    if (idx < 0) return { ok: false, status: 404, json: async () => ({ mensaje: 'no encontrado' }) }
    const body = JSON.parse(options.body || '{}')
    const CLAVES = {
      veterinariaNombre: 'VeterinariaNombre',
      fechaAtencion: 'FechaAtencion',
      tipoAtencion: 'TipoAtencion',
      descripcion: 'Descripcion',
      diagnostico: 'Diagnostico',
      medicamentos: 'Medicamentos',
      archivoAdjuntoUrl: 'ArchivoAdjuntoUrl',
    }
    const cambiosEntidad = {}
    for (const [clave, valor] of Object.entries(body)) {
      cambiosEntidad[CLAVES[clave] ?? clave] = valor
    }
    DB.aportes[idx] = { ...DB.aportes[idx], ...cambiosEntidad }
    return { ok: true, status: 204, json: async () => ({}) }
  }

  if (method === 'DELETE') {
    const id = Number(url.split('/').pop())
    DB.aportes = DB.aportes.filter((a) => Number(a.Id ?? a.id) !== id)
    return { ok: true, status: 204, json: async () => ({}) }
  }

  /* El orden importa: veterinaria-info antes que /mascotas. */
  if (url.includes('/usuarios/me/veterinaria-info')) {
    return { ok: true, status: 200, json: async () => ({ rol: 'Cliente', mascotas: DB.mascotasInfo }) }
  }
  if (url.includes('/mascotas')) {
    return { ok: true, status: 200, json: async () => DB.mascotasFull }
  }
  if (url.includes('/expediente-aportes')) {
    const mascotaId = Number(new URL(url).searchParams.get('mascotaId'))
    return {
      ok: true,
      status: 200,
      json: async () =>
        DB.aportes.filter((a) => Number(a.MascotaId ?? a.mascotaId) === mascotaId),
    }
  }
  return { ok: false, status: 404, json: async () => ({}) }
}

function mockApi() {
  authFetch.mockImplementation(apiHandler)
}

function renderAportes(user = { nombre: 'Maria', sub: '10', rolId: ROLE_IDS.CLIENTE }) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={['/dashboard/aportes']}>
      <AportesPage />
    </MemoryRouter>
  )
}

describe('AportesPage - rediseño Sprint 2 (T36)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi()
  })

  test('header del wireframe + píldoras PetSelector con la primera mascota activa', async () => {
    seedDb({
      mascotasInfo: [PET_MAX, PET_LUNA],
      mascotasFull: [PET_FULL_MAX, PET_FULL_LUNA],
      aportes: [aporte()],
    })
    renderAportes()

    expect(await screen.findByRole('heading', { level: 1, name: 'Mis Aportes Médicos' })).toBeInTheDocument()
    expect(screen.getByText('Registrar aporte')).toBeInTheDocument()

    // Las píldoras llegan cuando resuelve /veterinaria-info
    const max = await screen.findByRole('radio', { name: 'Max' })
    expect(max).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Luna' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Ver Todos' })).toBeInTheDocument()
  })

  test('card: badge por tipo, borde de color, veterinaria y diagnóstico/notas', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [
        aporte({
          TipoAtencion: 'Tratamiento',
          Descripcion: 'Cuidado postoperatorio',
          VeterinariaNombre: 'Clínica San Francisco',
          Diagnostico: 'Reposo absoluto por 7 días.',
        }),
      ],
    })
    const { container } = renderAportes()

    expect(await screen.findByRole('heading', { name: 'Cuidado postoperatorio' })).toBeInTheDocument()
    expect(screen.getByText('Tratamiento')).toBeInTheDocument()
    expect(screen.getByText('Clínica San Francisco')).toBeInTheDocument()
    expect(screen.getByText('Reposo absoluto por 7 días.')).toBeInTheDocument()
    expect(screen.getByText(/Registrado el/)).toBeInTheDocument()

    const card = container.querySelector('.apr-card')
    expect(card).toHaveClass('apr-card--tratamiento')
    expect(card.querySelector('.apr-card__edge')).toBeInTheDocument()
  })

  test('chips de medicación: texto libre separado por comas se muestra como píldoras', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [
        aporte({ Medicamentos: 'Meloxicam 1mg/kg, Amoxicilina 15mg/kg' }),
      ],
    })
    renderAportes()

    const lista = await screen.findByRole('list', { name: 'Medicamentos indicados' })
    const chips = within(lista).getAllByRole('listitem')
    expect(chips).toHaveLength(2)
    expect(chips[0]).toHaveTextContent('Meloxicam 1mg/kg')
    expect(chips[1]).toHaveTextContent('Amoxicilina 15mg/kg')
  })

  test('adjunto seguro: enlace http con nombre de archivo, icono según extensión y nueva pestaña', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [
        aporte({ ArchivoAdjuntoUrl: 'https://cdn.openpaw.dev/recetas/receta-postop.pdf' }),
      ],
    })
    renderAportes()

    const enlace = await screen.findByRole('link', { name: /receta-postop\.pdf/ })
    expect(enlace).toHaveAttribute('href', 'https://cdn.openpaw.dev/recetas/receta-postop.pdf')
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(enlace.getAttribute('rel')).toContain('noopener')
    // Icono de documento para .pdf (Material Symbols renderiza el nombre)
    expect(within(enlace).getByText('description')).toBeInTheDocument()
    expect(screen.getByText('Adjuntos')).toBeInTheDocument()
  })

  test('hardening XSS: adjunto con protocolo no http(s) nunca se usa como href', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [aporte({ ArchivoAdjuntoUrl: 'javascript:alert(1)' })],
    })
    renderAportes()

    expect(await screen.findByText('Adjunto con URL no válida')).toBeInTheDocument()
    // El shell tiene enlaces propios; ninguno debe apuntar a javascript:
    const enlaces = screen.getAllByRole('link')
    expect(
      enlaces.filter((l) => (l.getAttribute('href') || '').trim().toLowerCase().startsWith('javascript:'))
    ).toHaveLength(0)
  })

  test('sin adjuntos: mini estado vacío de la columna', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [aporte()],
    })
    renderAportes()

    expect(await screen.findByText('Sin adjuntos')).toBeInTheDocument()
  })

  test('paginación DS: 6 aportes en páginas de 4 con clamp y navegación', async () => {
    const lote = Array.from({ length: 6 }, (_, i) =>
      aporte({
        Id: i + 1,
        FechaAtencion: haceDias(10 * (i + 1)),
        Descripcion: `Aporte número ${i + 1}`,
      })
    )
    seedDb({ mascotasInfo: [PET_MAX], mascotasFull: [PET_FULL_MAX], aportes: lote })
    renderAportes()

    expect(await screen.findByText('Aporte número 1')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 1-4 de 6')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))

    expect(await screen.findByText('Mostrando 5-6 de 6')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
  })

  test('"Ver Todos": mezcla aportes de todas las mascotas ordenados por fecha y muestra chip de mascota', async () => {
    seedDb({
      mascotasInfo: [PET_MAX, PET_LUNA],
      mascotasFull: [PET_FULL_MAX, PET_FULL_LUNA],
      aportes: [
        // Mascota 1: entidad PascalCase
        aporte({ Id: 1, FechaAtencion: '2024-03-01T10:00:00Z', Descripcion: 'Consulta de Max' }),
        // Mascota 2: misma entidad en camelCase (normalización defensiva)
        {
          id: 2,
          mascotaId: 2,
          veterinariaNombre: 'VetCare Centro',
          fechaAtencion: '2024-05-20T10:00:00Z',
          tipoAtencion: 'Vacuna',
          descripcion: 'Consulta de Luna',
          diagnostico: null,
          medicamentos: null,
          archivoAdjuntoUrl: null,
          fechaRegistro: '2024-05-20T11:00:00Z',
        },
        aporte({ Id: 3, MascotaId: 1, FechaAtencion: '2024-01-10T10:00:00Z', Descripcion: 'Control de Max' }),
      ],
    })
    renderAportes()

    expect(await screen.findByText('Consulta de Max')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Ver Todos' }))

    expect(await screen.findByText('Consulta de Luna')).toBeInTheDocument()
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(3)
    // Orden descendente por fecha de atención: Luna (mayo) primero
    expect(cards[0]).toHaveTextContent('Consulta de Luna')
    // Chip de mascota visible al ver todas
    expect(within(cards[0]).getByText('Luna')).toBeInTheDocument()
    expect(within(cards[1]).getByText('Max')).toBeInTheDocument()
  })

  test('resumen del wireframe: total, última visita relativa y próxima vacuna real (/mascotas)', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [
        aporte({ FechaAtencion: haceDias(70), Descripcion: 'Visita reciente' }),
        aporte({ Id: 8, FechaAtencion: haceDias(400), Descripcion: 'Visita antigua' }),
      ],
    })
    renderAportes()

    expect(await screen.findByText('Rabia — Oct 2026')).toBeInTheDocument()
    expect(screen.getByText('Total aportes')).toBeInTheDocument()
    // Datos que dependen de la carga de aportes → queries asíncronas
    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(await screen.findByText('Hace 2 meses')).toBeInTheDocument()
    expect(screen.getByText('Próxima vacuna')).toBeInTheDocument()
  })

  test('eliminar: ConfirmDialog y DELETE al endpoint existente', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [aporte()],
    })
    renderAportes()

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar aporte de PetCare Center' }))
    expect(screen.getByText('¿Eliminar aporte?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar', exact: true }))

    await screen.findByText('Sin aportes')
    const llamada = authFetch.mock.calls.find(
      ([u, o]) => o?.method === 'DELETE' && u.endsWith('/expediente-aportes/7')
    )
    expect(llamada).toBeTruthy()
  })

  test('crear: modal registra POST y la nueva card aparece tras refrescar', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [aporte()],
    })
    renderAportes()

    // Espera a que /veterinaria-info cargue (CTA deshabilitado durante la carga)
    await screen.findByRole('radio', { name: 'Max' })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar aporte' }))
    expect(screen.getByRole('heading', { name: 'Registrar aporte de expediente' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Veterinaria'), { target: { value: 'Clínica San Rafael' } })
    fireEvent.change(screen.getByLabelText('Fecha de atención'), { target: { value: '2026-01-15T10:00' } })
    fireEvent.change(screen.getByLabelText('Tipo de atención'), { target: { value: 'Vacuna' } })
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Refuerzo antirrábico' } })
    fireEvent.change(screen.getByLabelText('Medicamentos (opcional)'), {
      target: { value: 'Antirrábica 1ml' },
    })

    // Dos botones "Registrar aporte" (CTA del header + submit del modal)
    const submit = screen.getAllByRole('button', { name: 'Registrar aporte' }).at(-1)
    fireEvent.click(submit)

    // Señal determinista: el POST con el payload correcto. La card aparece
    // cuando refrescar() resuelve (timeout amplio por estabilidad en CI).
    await waitFor(() => {
      const post = authFetch.mock.calls.find(([, opts]) => opts?.method === 'POST')
      expect(post).toBeTruthy()
      expect(post[0]).toContain('/expediente-aportes')
      expect(JSON.parse(post[1].body)).toMatchObject({
        mascotaId: 1,
        veterinariaNombre: 'Clínica San Rafael',
        tipoAtencion: 'Vacuna',
        descripcion: 'Refuerzo antirrábico',
        medicamentos: 'Antirrábica 1ml',
      })
    })

    expect(await screen.findByText('Refuerzo antirrábico', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  test('estado vacío cuando la mascota seleccionada no tiene aportes', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [],
    })
    renderAportes()

    expect(await screen.findByRole('heading', { name: 'Sin aportes' })).toBeInTheDocument()
    expect(screen.getByText(/No hay aportes registrados para Max/)).toBeInTheDocument()
  })

  test('sin mascotas registradas muestra estado vacío dedicado', async () => {
    seedDb({ mascotasInfo: [], mascotasFull: [], aportes: [] })
    renderAportes()

    expect(await screen.findByText('Sin mascotas')).toBeInTheDocument()
  })

  /* ------------------------------- edición (PUT parcial, T36) ------------ */

  const EDITOR = { nombre: 'Maria', sub: '10', rolId: ROLE_IDS.CLIENTE }

  async function abrirEditorEnCard() {
    fireEvent.click(await screen.findByRole('button', { name: 'Editar aporte de PetCare Center' }))
    expect(screen.getByRole('heading', { name: 'Editar aporte' })).toBeInTheDocument()
    // Precargado con los valores actuales normalizados
    expect(screen.getByLabelText('Veterinaria')).toHaveValue('PetCare Center')
    expect(screen.getByLabelText('Descripción')).toHaveValue('Refuerzo séxtuple anual')
    expect(screen.getByLabelText('Tipo de atención')).toHaveValue('Vacuna')
  }

  test('editar: dueño ve el botón ✎, el PUT va a /{id} con SOLO los campos cambiados y refresca', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [aporte({ Medicamentos: 'Meloxicam 1mg/kg' })],
    })
    renderAportes(EDITOR)
    await abrirEditorEnCard()

    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Descripción corregida' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // Señal determinista: PUT con body de un solo campo (null preserva lo demás)
    await waitFor(() => {
      const put = authFetch.mock.calls.find(([, opts]) => opts?.method === 'PUT')
      expect(put).toBeTruthy()
      expect(put[0]).toContain('/expediente-aportes/7')
      expect(JSON.parse(put[1].body)).toEqual({ descripcion: 'Descripción corregida' })
    })

    // La card muestra el valor actualizado tras el refresh en sitio
    expect(await screen.findByText('Descripción corregida', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Editar aporte' })).not.toBeInTheDocument()
  })

  test('editar: PUT 400 muestra el mensaje del servidor dentro del modal sin cerrarlo', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [aporte()],
    })
    renderAportes(EDITOR)
    await abrirEditorEnCard()

    authFetch.mockImplementationOnce(async (url, options = {}) => {
      if ((options.method || 'GET') === 'PUT') {
        return {
          ok: false,
          status: 400,
          json: async () => ({ mensaje: 'La fecha de atención no puede estar en el futuro' }),
        }
      }
      return apiHandler(url, options)
    })

    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Intento fallido' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La fecha de atención no puede estar en el futuro'
    )
    // El modal permanece abierto y re-habilitado para reintentar
    expect(screen.getByRole('heading', { name: 'Editar aporte' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled()
    expect(screen.getByLabelText('Descripción')).toHaveValue('Intento fallido')
  })

  test('editar: no-dueño no-admin no ve el botón ✎ (gating por propietarioId)', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [aporte()], // PropietarioId: 10
    })
    renderAportes({ nombre: 'Otro', sub: '99', rolId: ROLE_IDS.CLIENTE })

    expect(await screen.findByText('Refuerzo séxtuple anual')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Editar aporte de/ })).not.toBeInTheDocument()
  })

  test('editar: administrador ve el botón ✎ aunque no sea propietario', async () => {
    seedDb({
      mascotasInfo: [PET_MAX],
      mascotasFull: [PET_FULL_MAX],
      aportes: [aporte()],
    })
    renderAportes({ nombre: 'Ana', sub: '99', rolId: ROLE_IDS.ADMINISTRADOR })

    expect(await screen.findByText('Refuerzo séxtuple anual')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar aporte de PetCare Center' })).toBeInTheDocument()
  })
})
