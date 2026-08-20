import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../features/auth/context/AuthContext'
import { AUTH_TOKEN_KEY } from '../constants'

vi.mock('../shared/utils/api', () => ({
  loginApi: vi.fn(),
}))

import { loginApi } from '../shared/utils/api'

function createJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

beforeEach(() => {
  localStorage.clear()
  loginApi.mockReset()
})

test('renderiza el provider', () => {
  const { result } = renderHook(() => useAuth(), { wrapper })
  expect(result.current).toBeDefined()
  expect(result.current.isAuthenticated).toBe(false)
})

test('login almacena el token en localStorage', async () => {
  const token = createJwt({ rolId: 1, email: 'test@test.com' })
  loginApi.mockResolvedValueOnce({ token })

  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => {
    await result.current.login('test@test.com', 'password')
  })

  expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(token)
})

test('isAuthenticated es true después de login', async () => {
  const token = createJwt({ rolId: 1, email: 'test@test.com' })
  loginApi.mockResolvedValueOnce({ token })

  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => {
    await result.current.login('test@test.com', 'password')
  })

  expect(result.current.isAuthenticated).toBe(true)
})

test('logout limpia el token', async () => {
  const token = createJwt({ rolId: 1, email: 'test@test.com' })
  loginApi.mockResolvedValueOnce({ token })

  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => {
    await result.current.login('test@test.com', 'password')
  })

  act(() => {
    result.current.logout()
  })

  expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
  expect(result.current.isAuthenticated).toBe(false)
})