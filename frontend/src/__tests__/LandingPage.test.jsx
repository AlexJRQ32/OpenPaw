import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { useAuth } from '../features/auth/context/AuthContext'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

/* Polyfill mínimo de IntersectionObserver para <Reveal> (jsdom no lo incluye) */
class IntersectionObserverStub {
  constructor(callback) { this.callback = callback }
  observe() { this.callback([{ isIntersecting: true }]) }
  unobserve() {}
  disconnect() {}
}

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LandingPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  window.IntersectionObserver = IntersectionObserverStub
  useAuth.mockReturnValue({ user: null, isAuthenticated: false })
})

describe('LandingPage nueva (T40)', () => {
  test('renderiza el hero con propuesta de valor y CTAs públicos', () => {
    renderLanding()

    /* H1 única con la promesa de valor */
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/en una sola pantalla/i)

    /* CTA de registro y salida al marketplace */
    const signup = screen.getAllByRole('link', { name: /Crear cuenta gratis/i })
    expect(signup.length).toBeGreaterThanOrEqual(1)
    expect(signup[0]).toHaveAttribute('href', '/auth-method')
    expect(screen.getByRole('link', { name: /Explorar el marketplace/i })).toHaveAttribute('href', '/marketplace')
  })

  test('usuario autenticado ve "Ir al dashboard" en lugar del registro', () => {
    useAuth.mockReturnValue({ user: { nombre: 'Ana' }, isAuthenticated: true })
    renderLanding()

    const dash = screen.getAllByRole('link', { name: /Ir al dashboard/i })
    expect(dash.length).toBeGreaterThanOrEqual(1)
    expect(dash[0]).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: /Crear cuenta gratis/i })).not.toBeInTheDocument()
  })

  test('expone las anclas #about / #features / #how que usa el LandingNavbar', () => {
    const { container } = renderLanding()

    for (const id of ['about', 'features', 'how']) {
      const section = container.querySelector(`#${id}`)
      expect(section).not.toBeNull()
      /* Cada sección es etiquetable por su heading (accesible para SR) */
      expect(section.getAttribute('aria-labelledby')).toBeTruthy()
    }
  })

  test('muestra los cinco módulos reales del producto en el bento', () => {
    renderLanding()

    expect(screen.getByRole('heading', { level: 3, name: /Citas con calendario real/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /Expediente clínico en línea de tiempo/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /Emergencias con severidad/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /Inventario que avisa/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /Marketplace con stock real/i })).toBeInTheDocument()
  })

  test('usa datos reales del producto: severidad, estados de cita y colones', () => {
    renderLanding()

    /* Severidad real de EmergenciasPage (aparece en collage y celda bento) */
    expect(screen.getAllByText(/Nivel 1 · Crítico/i).length).toBeGreaterThan(0)
    /* Estados reales de CitasPage */
    expect(screen.getAllByText('Confirmada').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0)
    /* Precios en colones como el marketplace (Intl es-CR agrupa con espacio) */
    expect(screen.getAllByText(/₡10\s000/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/₡15\s000/).length).toBeGreaterThan(0)
  })

  test('declara para quién es: veterinarias, dueños y almacenes', () => {
    renderLanding()

    expect(screen.getByRole('heading', { level: 3, name: 'Veterinarias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Dueños de mascotas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Almacenes' })).toBeInTheDocument()
  })

  test('"cómo funciona" presenta exactamente tres pasos ordenados', () => {
    renderLanding()

    const pasos = screen.getByRole('list', { name: /Pasos para empezar/i })
    const items = within(pasos).getAllByRole('listitem')
    expect(items).toHaveLength(3)

    const textos = items.map((li) => li.textContent)
    expect(textos[0]).toMatch(/Registrá tu cuenta/)
    expect(textos[1]).toMatch(/Cargá pacientes e inventario/)
    expect(textos[2]).toMatch(/Operá el día a día/)
  })

  test('el footer mantiene las rutas públicas del landing anterior', () => {
    renderLanding()

    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(within(footer).getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/auth-method')
    expect(within(footer).getByRole('link', { name: 'Marketplace' })).toHaveAttribute('href', '/marketplace')

    /* CTA final hacia registro con sesión cerrada */
    const ctaFinal = screen.getAllByRole('link', { name: /Crear cuenta gratis/i })
    expect(ctaFinal.some((a) => a.closest('.lp-cta-final'))).toBe(true)
  })

  test('incluye skip-link y una sola H1 (jerarquía accesible)', () => {
    const { container } = renderLanding()

    expect(container.querySelector('.lp-skip')).toHaveAttribute('href', '#contenido')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})
