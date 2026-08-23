import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApprovalsListPage } from '../features/aprobaciones/pages/ApprovalsListPage'
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
const LEAVE_MS = 400 // duración animación de salida (ApprovalsPanel.css)

/* Fecha relativa a hoy para que la urgencia derivada sea determinista:
   >7 días = alta, 2-7 días = media, <2 días = baja.
   IMPORTANTE (Re-QA H1): se devuelve SIN sufijo 'Z', igual que el backend
   ("2026-08-22T23:44:10.1661162"); el componente debe parsearla como UTC. */
function hace(dias) {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  d.setHours(10, 0, 0, 0)
  return d.toISOString().replace('Z', '')
}

function haceMinutos(min) {
  const d = new Date()
  d.setMinutes(d.getMinutes() - min)
  return d.toISOString().replace('Z', '')
}

function vet(overrides = {}) {
  return {
    id: 1,
    nombre: 'Vet Central',
    cedulaJuridica: '3-101-123456',
    email: 'contacto@vetcentral.com',
    telefono: '2222-1111',
    direccion: 'San Jose, Centro',
    descripcion: 'Clinica veterinaria general con servicio de emergencias.',
    fechaRegistro: hace(10),
    aprobada: false,
    rechazada: false,
    documentoPersoneriaJuridica: 'doc.pdf',
    ...overrides,
  }
}

function alm(overrides = {}) {
  return {
    id: 2,
    nombre: 'Almacen Norte',
    cedulaJuridica: '3-102-654321',
    email: 'almacen@vetcentral.com',
    telefono: '2222-2222',
    direccion: 'Heredia, Belen',
    descripcion: 'Almacen de insumos veterinarios con control de temperatura.',
    tipoAlmacen: 'Farmaceutico',
    nombreResponsable: 'Ana Perez',
    capacidadAlmacenamiento: '500 m2',
    controlTemperatura: 'Si',
    fechaRegistro: hace(1),
    aprobada: false,
    rechazada: false,
    ...overrides,
  }
}

/* Mock del API por URL + metodo (mismo patron que el resto de los tests).
   IMPORTANTE: cada fetch devuelve un ARRAY NUEVO ([...lista]) igual que haria
   JSON.parse del backend real; si se devolviera la misma referencia, React
   haria bail-out en setSolicitudes y el refetch no re-renderizaria la pagina.
   Aprobar marca el item (el refetch lo lista como aprobado); Rechazar lo
   ELIMINA de la lista (el backend real no re-lista rechazadas en este DTO):
   asi el test de "Actividad Reciente" demuestra que la accion local de la
   sesion es la que antepone el item recien actuado. */
function mockApi({ veterinarias: vets = [], almacenes: alms = [] } = {}) {
  let veterinarias = [...vets]
  let almacenes = [...alms]

  authFetch.mockImplementation(async (url, options = {}) => {
    const method = options.method || 'GET'
    const idVet = Number((url.match(/\/veterinarias\/(\d+)\/aprobar/) || [])[1])
    const idAlm = Number((url.match(/\/almacenes\/(\d+)\/aprobar/) || [])[1])

    if (method === 'PUT' && url.includes('/aprobar')) {
      const item = veterinarias.find((x) => x.id === idVet) || almacenes.find((x) => x.id === idAlm)
      if (item) item.aprobada = true
      return { ok: true, status: 200, json: async () => ({}) }
    }
    if (method === 'PUT' && url.includes('/rechazar')) {
      veterinarias = veterinarias.filter((x) => x.id !== idVet)
      almacenes = almacenes.filter((x) => x.id !== idAlm)
      return { ok: true, status: 200, json: async () => ({}) }
    }
    if (url.includes('/veterinarias')) {
      return { ok: true, json: async () => [...veterinarias] }
    }
    if (url.includes('/almacenes')) {
      return { ok: true, json: async () => [...almacenes] }
    }
    return { ok: false, json: async () => ({}) }
  })
}

function renderAprobaciones(user) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={['/dashboard/aprobaciones']}>
      <ApprovalsListPage />
    </MemoryRouter>
  )
}

const admin = { nombre: 'Ana Admin', sub: '10', rolId: ROLE_IDS.ADMINISTRADOR }

describe('ApprovalsListPage - feed de cards con urgencia y animacion (T33)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header, stats y feed de cards pendientes (veterinaria + almacen)', async () => {
    mockApi({ veterinarias: [vet()], almacenes: [alm()] })
    renderAprobaciones(admin)

    expect(await screen.findByRole('heading', { level: 1, name: 'Aprobaciones Pendientes' })).toBeInTheDocument()
    // Stats: 2 pendientes
    expect(screen.getByText('Pendientes')).toBeInTheDocument()

    // esperar a que carguen AMBAS fuentes (veterinarias + almacenes)
    await screen.findByText('Almacen Norte')
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(2)

    // Card veterinaria (fecha vieja -> Urgente) y card almacen (reciente -> Baja)
    const cardVet = cards.find((c) => within(c).queryByText('Vet Central'))
    expect(within(cardVet).getByText('Nuevo Registro Veterinaria')).toBeInTheDocument()
    expect(within(cardVet).getByText('Urgente')).toBeInTheDocument()
    expect(within(cardVet).getByText('3-101-123456')).toBeInTheDocument()
    expect(within(cardVet).getByText('contacto@vetcentral.com')).toBeInTheDocument()

    const cardAlm = cards.find((c) => within(c).queryByText('Almacen Norte'))
    expect(within(cardAlm).getByText('Solicitud de Almacen')).toBeInTheDocument()
    expect(within(cardAlm).getByText('Baja')).toBeInTheDocument()
    expect(within(cardAlm).getByText('Farmaceutico')).toBeInTheDocument()

    // Acciones conservadas en cada card
    expect(within(cardVet).getByRole('button', { name: 'Aprobar' })).toBeInTheDocument()
    expect(within(cardVet).getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
    expect(within(cardVet).getByRole('button', { name: /Ver detalle/ })).toBeInTheDocument()
  })

  test('la card mas urgente se ordena primero en el feed', async () => {
    mockApi({ veterinarias: [vet({ id: 1 }), vet({ id: 3, nombre: 'Vet Reciente', fechaRegistro: hace(1) })] })
    renderAprobaciones(admin)

    const cards = await screen.findAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByText('Vet Central')).toBeInTheDocument() // alta primero
    expect(within(cards[1]).getByText('Vet Reciente')).toBeInTheDocument() // baja despues
  })

  test('filtros por tipo de solicitud ocultan las cards', async () => {
    mockApi({ veterinarias: [vet()], almacenes: [alm()] })
    renderAprobaciones(admin)

    await screen.findByText('Almacen Norte')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Almacenes' }))
    expect(screen.queryByText('Almacen Norte')).not.toBeInTheDocument()
    expect(screen.getByText('Vet Central')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Veterinarias' }))
    expect(screen.getByText('Sin solicitudes con estos filtros')).toBeInTheDocument()
  })

  test('chips de urgencia filtran el feed (aria-pressed)', async () => {
    mockApi({ veterinarias: [vet()], almacenes: [alm()] })
    renderAprobaciones(admin)

    await screen.findByText('Almacen Norte')

    const chipUrgente = screen.getByRole('button', { name: 'Urgente' })
    expect(chipUrgente).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(chipUrgente)
    expect(chipUrgente).toHaveAttribute('aria-pressed', 'true')

    // Solo queda la veterinaria (alta); el almacen (baja) se oculta
    expect(screen.getByText('Vet Central')).toBeInTheDocument()
    expect(screen.queryByText('Almacen Norte')).not.toBeInTheDocument()
  })

  test('Ver detalle abre el modal con la informacion del comercio', async () => {
    mockApi({ veterinarias: [vet()] })
    renderAprobaciones(admin)

    const card = (await screen.findAllByRole('article'))[0]
    fireEvent.click(within(card).getByRole('button', { name: /Ver detalle/ }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText('Vet Central').length).toBeGreaterThan(0)
    expect(within(dialog).getByText('3-101-123456')).toBeInTheDocument()
    expect(within(dialog).getByText('Documento de personeria juridica adjunto')).toBeInTheDocument()
  })

  test('aprobar desde la card anima la salida (2 fases) y llama PUT /aprobar', async () => {
    mockApi({ veterinarias: [vet({ id: 7 })] })
    renderAprobaciones(admin)

    const card = (await screen.findAllByRole('article'))[0]

    // fake timers ANTES del clic: el setTimeout de la animación de salida
    // debe quedar registrado en el reloj falso para poder avanzarlo.
    vi.useFakeTimers()
    fireEvent.click(within(card).getByRole('button', { name: 'Aprobar' }))

    // fase 1 (anchor): altura real fijada inline, aún sin clase de colapso
    const wrapper = screen.getByText('Vet Central').closest('.approval-feed-item')
    expect(wrapper.style.maxHeight).not.toBe('')
    expect(screen.getByText('Vet Central').closest('article').className).not.toContain('approval-card--leaving')

    // fase 2 (rAF ~16ms): colapso con max-height:0
    await act(async () => { await vi.advanceTimersByTimeAsync(20) })
    expect(screen.getByText('Vet Central').closest('article').className).toContain('approval-card--leaving')

    // fase 3: PUT + refetch
    await act(async () => { await vi.advanceTimersByTimeAsync(LEAVE_MS) })
    vi.useRealTimers()

    expect(authFetch).toHaveBeenCalledWith(
      `${API_BASE}/veterinarias/7/aprobar`,
      expect.objectContaining({ method: 'PUT' })
    )
    // tras el refetch la solicitud ya no esta pendiente
    await waitFor(() => {
      expect(screen.queryByText('Vet Central')).not.toBeInTheDocument()
    })
  })

  test('rechazar pide motivo en el modal y llama PUT /rechazar', async () => {
    mockApi({ veterinarias: [vet({ id: 7 })] })
    renderAprobaciones(admin)

    const card = (await screen.findAllByRole('article'))[0]
    fireEvent.click(within(card).getByRole('button', { name: 'Rechazar' }))

    const textarea = await screen.findByLabelText('Motivo de rechazo')
    fireEvent.change(textarea, { target: { value: 'Documentacion incompleta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar rechazo' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/veterinarias/7/rechazar`,
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivoRechazo: 'Documentacion incompleta' }),
        })
      )
    })
  })

  test('actividad reciente antepone la accion recien hecha (mitigacion local de sesion)', async () => {
    mockApi({
      veterinarias: [
        vet({ id: 7 }), // pendiente -> se rechaza
        vet({ id: 8, nombre: 'Vet Antigua 1', aprobada: true, fechaRegistro: hace(15) }),
        vet({ id: 9, nombre: 'Vet Antigua 2', aprobada: true, fechaRegistro: hace(20) }),
      ],
    })
    renderAprobaciones(admin)

    await screen.findByText('Vet Central')

    // Actividad inicial: las dos aprobadas del backend (orden por registro)
    const listaInicial = screen.getAllByRole('listitem')
    expect(listaInicial).toHaveLength(2)
    expect(listaInicial[0]).toHaveTextContent(/Vet Antigua 1/)
    expect(listaInicial[1]).toHaveTextContent(/Vet Antigua 2/)

    // Rechazar la pendiente; el mock la ELIMINA del GET, así que solo la
    // accion local de la sesion puede mostrarla en Actividad Reciente.
    const card = screen.getAllByRole('article')[0]
    fireEvent.click(within(card).getByRole('button', { name: 'Rechazar' }))
    fireEvent.change(await screen.findByLabelText('Motivo de rechazo'), { target: { value: 'Docs' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar rechazo' }))

    await waitFor(() => {
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(3)
      // la accion recien hecha queda ANTEPUESTA con icono close
      expect(items[0]).toHaveTextContent(/Vet Central/)
      expect(items[0]).toHaveTextContent(/rechazado/)
      expect(items[0].querySelector('.material-symbols-outlined')?.textContent).toBe('close')
      // M1: el snapshot local conserva el motivo en el meta
      expect(items[0]).toHaveTextContent(/Docs/)
    })
  })

  test('la accion local gana al parseo UTC de fechas recientes del backend (H1)', async () => {
    mockApi({
      veterinarias: [
        // aprobada del backend con fecha RECIENTE sin 'Z': sin parsear como
        // UTC su epoch se inflaria ~+offset y enterraria la accion local
        vet({ id: 8, nombre: 'Vet Recien Aprobada', aprobada: true, fechaRegistro: haceMinutos(30) }),
        vet({ id: 7 }), // pendiente -> se aprueba en esta sesion
      ],
    })
    renderAprobaciones(admin)

    await screen.findByText('Vet Central')

    // actividad inicial: la aprobada reciente del backend
    const inicial = screen.getAllByRole('listitem')
    expect(inicial[0]).toHaveTextContent(/Vet Recien Aprobada/)

    const card = screen.getAllByRole('article')[0]
    fireEvent.click(within(card).getByRole('button', { name: 'Aprobar' }))

    // la accion local (Date.now) debe quedar PRIMERA, por encima de la fecha
    // reciente del backend (hace 30 min) una vez parseada como UTC
    await waitFor(() => {
      const items = screen.getAllByRole('listitem')
      expect(items[0]).toHaveTextContent(/Vet Central/)
      expect(items[0]).toHaveTextContent(/aprobado/)
      expect(items[0]).toHaveTextContent(/Hace un momento/)
    }, { timeout: 3000 })
  })

  test('empty state "Todo al dia" cuando no hay pendientes + actividad reciente', async () => {
    mockApi({ veterinarias: [vet({ aprobada: true })] })
    renderAprobaciones(admin)

    expect(await screen.findByText('¡Todo al día!')).toBeInTheDocument()
    // actividad reciente muestra la solicitud aprobada
    expect(screen.getByText(/Vet Central. aprobado/)).toBeInTheDocument()
  })
})