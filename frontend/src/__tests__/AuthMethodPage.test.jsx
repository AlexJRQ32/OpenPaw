import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthMethodPage } from '../features/auth/pages/AuthMethodPage'

const { mockNavigate, mockLoginWithSocial, mockShowLoader, mockHideLoader } =
  vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockLoginWithSocial: vi.fn(),
    mockShowLoader: vi.fn(),
    mockHideLoader: vi.fn(),
  }))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  // Stub mínimo de Link para verificar el destino sin Router
  Link: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: () => ({ loginWithSocial: mockLoginWithSocial }),
}))

vi.mock('../shared/context/LoadingContext', () => ({
  useLoading: () => ({ showLoader: mockShowLoader, hideLoader: mockHideLoader }),
}))

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  loginGoogleApi: vi.fn(),
  loginFacebookApi: vi.fn(),
}))

vi.mock('../constants', () => ({
  GOOGLE_CLIENT_ID: 'test-client-id',
  AUTH_TOKEN_KEY: 'op_token',
}))

beforeEach(() => {
  vi.clearAllMocks()
  // loadFbSdk inserta el SDK antes del primer <script> del documento
  if (!document.getElementsByTagName('script').length) {
    document.head.appendChild(document.createElement('script'))
  }
})

describe('AuthMethodPage', () => {
  test('renderiza título, subtítulo y las 3 opciones de acceso', () => {
    render(<AuthMethodPage />)

    expect(
      screen.getByRole('heading', { name: 'Bienvenido a OpenPaw' })
    ).toBeInTheDocument()
    expect(screen.getByText('Elige una forma de continuar')).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: /continuar con email/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /continuar con google/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /continuar con facebook/i })
    ).toBeInTheDocument()
  })

  test('"Continuar con Email" navega a /register via Link', () => {
    render(<AuthMethodPage />)

    // La opción email es un Link (navegación declarativa), no useNavigate
    const emailOption = screen.getByRole('link', { name: /continuar con email/i })
    expect(emailOption).toHaveAttribute('href', '/register')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('conserva el acceso a cuenta existente y el footer legal', () => {
    render(<AuthMethodPage />)

    const loginLink = screen.getByRole('link', { name: /inicia sesión/i })
    expect(loginLink).toHaveAttribute('href', '/login')
    expect(screen.getByText(/al continuar, aceptas nuestros/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /términos de servicio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /política de privacidad/i })).toBeInTheDocument()
  })
})
