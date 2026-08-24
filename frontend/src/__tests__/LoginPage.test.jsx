import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../features/auth/pages/LoginPage'

const { mockNavigate, mockLogin, mockShowLoader, mockHideLoader, mockLocation } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
  mockShowLoader: vi.fn(),
  mockHideLoader: vi.fn(),
  mockLocation: { state: null, pathname: '/login' },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}))

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, loginWithSocial: vi.fn() }),
}))

vi.mock('../shared/context/LoadingContext', () => ({
  useLoading: () => ({ showLoader: mockShowLoader, hideLoader: mockHideLoader }),
}))

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  loginGoogleApi: vi.fn(),
}))

vi.mock('../constants', () => ({
  GOOGLE_CLIENT_ID: 'test-client-id',
  AUTH_TOKEN_KEY: 'op_token',
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  test('renderiza el formulario con campos y botón Ingresar', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: 'OpenPaw' })).toBeInTheDocument()
    expect(screen.getByText('Iniciar sesión para continuar')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
    expect(screen.getByText(/O continuar con/)).toBeInTheDocument()
  })

  test('al enviar llama a login con las credenciales y navega a /dashboard', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce({ token: 'fake-token' })

    render(<LoginPage />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@openpaw.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await user.click(screen.getByRole('button', { name: /^ingresar$/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@openpaw.com', 'secreto123')
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
    expect(mockShowLoader).toHaveBeenCalled()
    expect(mockHideLoader).toHaveBeenCalled()
  })

  test('respeta location.state.from cuando viene de ProtectedRoute', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce({ token: 'fake-token' })
    mockLocation.state = { from: { pathname: '/dashboard/citas' } }

    render(<LoginPage />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@openpaw.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await user.click(screen.getByRole('button', { name: /^ingresar$/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/citas', { replace: true })
    })
    mockLocation.state = null
  })

  test('muestra el banner de error (role=alert) cuando falla el inicio de sesión', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'))

    render(<LoginPage />)

    await user.type(screen.getByLabelText('Correo electrónico'), 'mal@openpaw.com')
    await user.type(screen.getByLabelText('Contraseña'), 'mala123')
    await user.click(screen.getByRole('button', { name: /^ingresar$/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Credenciales inválidas')
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
