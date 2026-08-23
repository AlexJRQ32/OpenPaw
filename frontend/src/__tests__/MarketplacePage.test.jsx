import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MarketplacePage } from '../features/marketplace/pages/MarketplacePage'
import { useAuth } from '../features/auth/context/AuthContext'

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

/* Se conserva el router real (Link/LandingNavbar) y solo se espia useNavigate */
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

/* ---------------------------------------------------------------- fixtures */

function inventarioItem(i) {
  const vetId = i % 2 === 0 ? 1 : 2
  return {
    id: 100 + i,
    cantidad: 5 + i,
    stockMinimo: 2,
    stockMaximo: 30,
    almacenId: vetId === 1 ? 3 : 4,
    almacen: {
      id: vetId === 1 ? 3 : 4,
      nombre: vetId === 1 ? 'Almacén Central' : 'Almacén Norte',
      veterinariaId: vetId,
      veterinaria: { id: vetId, nombre: vetId === 1 ? 'Clínica San Roque' : 'Pet Spa & Care' },
    },
    producto: {
      id: 500 + i,
      nombre: i === 0 ? 'Alimento Perro Premium 5kg' : `Producto Veterinario ${i}`,
      descripcion: 'Descripción de prueba',
      precio: 10000 + i * 100,
      categoria: i === 0 ? 'Alimentos' : 'Higiene',
      proveedor: 'Acme',
      imagenUrl: null,
      unidadMedida: 'unidad',
      activo: true,
    },
  }
}

const INVENTARIO = Array.from({ length: 9 }, (_, i) => inventarioItem(i))

const VETERINARIAS = [
  { id: 1, nombre: 'Clínica San Roque', direccion: 'San José Centro' },
  { id: 2, nombre: 'Pet Spa & Care', direccion: 'Heredia' },
]

const SERVICIOS = [
  {
    id: 6, nombre: 'Chequeo Preventivo', descripcion: 'Evaluación general', precio: 20000,
    categoria: 'Consulta', duracionMinutos: 30, veterinariaId: 2, veterinariaNombre: null, activo: true,
  },
  {
    id: 5, nombre: 'Grooming Completo', descripcion: 'Baño y corte estilizado', precio: 15000,
    categoria: 'Grooming', duracionMinutos: 60, veterinariaId: 1, veterinariaNombre: 'Clínica San Roque', activo: true,
  },
]

function mockFetchOk(url) {
  const target = String(url)
  if (target.includes('/inventario')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(INVENTARIO) })
  }
  if (target.includes('/veterinarias/aprobadas')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(VETERINARIAS) })
  }
  if (target.includes('/serviciosveterinarios')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(SERVICIOS) })
  }
  return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve([]) })
}

/* Polyfill minimo de IntersectionObserver para <Reveal> (jsdom no lo incluye) */
class IntersectionObserverStub {
  constructor(callback) { this.callback = callback }
  observe() { this.callback([{ isIntersecting: true }]) }
  unobserve() {}
  disconnect() {}
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/marketplace']}>
      <MarketplacePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  window.fetch = vi.fn((url) => mockFetchOk(url))
  window.IntersectionObserver = IntersectionObserverStub
  useAuth.mockReturnValue({ user: { sub: 'user-1' }, isAuthenticated: false })
})

describe('MarketplacePage (T39)', () => {
  test('renderiza el hero azul con título, buscador y toggle de vista', async () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /Marketplace OpenPaw/i })).toBeInTheDocument()
    expect(await screen.findByPlaceholderText(/Buscar alimentos/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Productos' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Servicios' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('button', { name: /Abrir carrito/i })).toBeInTheDocument()
  })

  test('muestra los productos destacados con badge de stock, precio y paginación', async () => {
    renderPage()

    expect(await screen.findByText('Alimento Perro Premium 5kg')).toBeInTheDocument()
    expect(screen.getAllByText('Disponible').length).toBeGreaterThan(0)
    /* Intl es-CR agrupa miles con espacio (ICU del entorno) */
    expect(screen.getByText('₡10 000')).toBeInTheDocument()
    /* Pagination DS visible con 9 productos y pageSize 8 */
    expect(screen.getByText('Mostrando 1-8 de 9')).toBeInTheDocument()
  })

  test('agregar al carrito actualiza el indicador del hero', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Agregar Alimento Perro Premium 5kg al carrito/i }))

    expect(await screen.findByLabelText(/Abrir carrito, 1 artículo,/i)).toBeInTheDocument()
  })

  test('checkout anónimo + login limpia el carrito del usuario (fix carrito fantasma)', async () => {
    /* Regresión QA HIGH T39: onSuccess debe recibir el userId explícito de
       CheckoutAuthModal (decoded.sub). Si se usara user?.sub del closure
       pre-login (null), clearCart limpiaría la clave anónima vacía y los items
       comprados persistirían en openpaw_cart_user_<sub>. */
    const USER_ID = 'user-77'
    const itemMigrado = {
      productoId: 500, inventarioId: null, nombre: 'Alimento Perro Premium 5kg',
      precio: 10000, cantidad: 2, stock: 9,
    }
    localStorage.setItem('openpaw_cart_anon', JSON.stringify([itemMigrado]))
    /* Simula el estado tras migrateAnonymousCart(sub) durante el login */
    localStorage.setItem(`openpaw_cart_user_${USER_ID}`, JSON.stringify([itemMigrado]))

    const login = vi.fn().mockResolvedValue({ sub: USER_ID })
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, login })

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Abrir carrito/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Finalizar compra' }))

    /* Modal de autenticación: login con credenciales válidas (mock) */
    fireEvent.change(
      await screen.findByPlaceholderText('tucorreo@ejemplo.com'),
      { target: { value: 'maria.rodriguez@openpaw.dev' } },
    )
    fireEvent.change(screen.getByPlaceholderText('Tu contrasena'), { target: { value: 'Demo123!' } })
    fireEvent.submit(document.querySelector('form.cauth-form'))

    expect(login).toHaveBeenCalled()
    /* El carrito del usuario logueado queda VACÍO (items comprados eliminados)
       y el chip del hero marca 0 artículos */
    await waitFor(() => {
      const userCart = JSON.parse(localStorage.getItem(`openpaw_cart_user_${USER_ID}`) ?? '[]')
      expect(userCart).toHaveLength(0)
    })
    expect(await screen.findByLabelText(/Abrir carrito, 0 artículos,/i)).toBeInTheDocument()
  })

  test('la búsqueda filtra los productos', async () => {
    renderPage()
    const input = await screen.findByPlaceholderText(/Buscar alimentos/i)

    fireEvent.change(input, { target: { value: 'Alimento Perro' } })

    expect(await screen.findByText('Alimento Perro Premium 5kg')).toBeInTheDocument()
    expect(screen.queryByText('Producto Veterinario 3')).not.toBeInTheDocument()
    expect(screen.getByText('1 producto con stock')).toBeInTheDocument()
  })

  test('sin coincidencias muestra EmptyState y "Ver todos" restaura', async () => {
    renderPage()
    const input = await screen.findByPlaceholderText(/Buscar alimentos/i)

    fireEvent.change(input, { target: { value: 'zzzinexistente' } })
    expect(await screen.findByText('No encontramos coincidencias')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos' }))
    expect(await screen.findByText('Alimento Perro Premium 5kg')).toBeInTheDocument()
  })

  test('el carrusel filtra por veterinaria y "Ver todas" restablece', async () => {
    renderPage()

    const slide = await screen.findByRole('button', { name: /Clínica San Roque/ })
    expect(slide).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(slide)

    expect(slide).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText('5 productos con stock')).toBeInTheDocument()
    expect(screen.queryByText('Producto Veterinario 3')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ver todas/ }))
    expect(await screen.findByText('9 productos con stock')).toBeInTheDocument()
  })

  test('la paginación avanza a la segunda página', async () => {
    renderPage()
    await screen.findByText('Alimento Perro Premium 5kg')

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))

    expect(screen.getByText('Mostrando 9-9 de 9')).toBeInTheDocument()
    expect(screen.queryByText('Alimento Perro Premium 5kg')).not.toBeInTheDocument()
  })

  test('agenda cita desde servicios con deep-link hacia CitasPage', async () => {
    /* Autenticado: el clic navega directo al formulario de citas */
    useAuth.mockReturnValue({ user: { sub: 'user-1' }, isAuthenticated: true })
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: 'Servicios' }))
    expect(await screen.findByText('Grooming Completo')).toBeInTheDocument()

    const card = screen.getByText('Grooming Completo').closest('article')
    fireEvent.click(within(card).getByRole('button', { name: 'Agendar cita' }))

    const expectedParams = new URLSearchParams({
      servicio: 'Grooming Completo',
      veterinariaId: '1',
    })
    expectedParams.set('precio', '15000')
    expectedParams.set('duracion', '60')
    expect(mockNavigate).toHaveBeenCalledWith(`/dashboard/citas?${expectedParams.toString()}`)
  })

  test('agendar sin sesión abre el modal de autenticación en vez de navegar', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: 'Servicios' }))
    const card = (await screen.findByText('Chequeo Preventivo')).closest('article')
    fireEvent.click(within(card).getByRole('button', { name: 'Agendar cita' }))

    expect(await screen.findByText('Para agendar tu cita')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
