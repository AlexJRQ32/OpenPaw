import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterPage } from '../features/auth/pages/RegisterPage'

const { mockShowLoader, mockHideLoader, mockRegisterApi } = vi.hoisted(() => ({
  mockShowLoader: vi.fn(),
  mockHideLoader: vi.fn(),
  mockRegisterApi: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  // Stub mínimo de Link para verificar el destino sin Router
  Link: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('../shared/context/LoadingContext', () => ({
  useLoading: () => ({ showLoader: mockShowLoader, hideLoader: mockHideLoader }),
}))

vi.mock('../shared/utils/api', () => ({
  registerApi: mockRegisterApi,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RegisterPage', () => {
  test('renderiza subtítulo, los 6 campos en orden del wireframe y el botón Crear cuenta', () => {
    const { container } = render(<RegisterPage />)

    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(
      screen.getByText('Únete a OpenPaw para gestionar la salud de tu mascota.')
    ).toBeInTheDocument()

    const controls = container.querySelectorAll('.register-form input, .register-form textarea')
    expect(controls.length).toBe(6)
    expect([...controls].map((c) => c.name)).toEqual([
      'nombre',
      'email',
      'telefono',
      'direccion', // textarea de 2 filas
      'password',
      'confirmPassword',
    ])
    expect(controls[3].tagName.toLowerCase()).toBe('textarea')
    expect(controls[3].rows).toBe(2)

    expect(
      screen.getByRole('button', { name: /crear cuenta/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/¿Ya tienes una cuenta\?/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /inicia sesión/i })
    ).toHaveAttribute('href', '/login')
  })

  test('al enviar con datos válidos llama a registerApi y muestra el mensaje de éxito', async () => {
    const user = userEvent.setup()
    mockRegisterApi.mockResolvedValueOnce({ ok: true })

    render(<RegisterPage />)

    await user.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@openpaw.com')
    await user.type(screen.getByLabelText('Teléfono'), '8888-8888')
    await user.type(screen.getByLabelText('Dirección'), 'San José, Costa Rica')
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'secreto123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(mockRegisterApi).toHaveBeenCalledWith({
        nombre: 'Ana Pérez',
        email: 'ana@openpaw.com',
        password: 'secreto123',
        telefono: '8888-8888',
        direccion: 'San José, Costa Rica',
      })
    })
    expect(mockShowLoader).toHaveBeenCalled()
    expect(mockHideLoader).toHaveBeenCalled()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Usuario registrado correctamente.'
    )
  })

  test('al enviar vacío muestra errores de validación por campo y no llama a la API', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El correo electrónico es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument()
    expect(screen.getByText('Debe confirmar la contraseña.')).toBeInTheDocument()
    expect(mockRegisterApi).not.toHaveBeenCalled()
  })

  test('muestra el error de contraseñas que no coinciden', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    await user.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@openpaw.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'distinta123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(mockRegisterApi).not.toHaveBeenCalled()
  })
})
