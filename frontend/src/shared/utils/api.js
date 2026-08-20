import { API_BASE_URL } from '../../constants'

export async function loginApi(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.mensaje || "Error al iniciar sesion")
  }

  return data
}

export async function loginGoogleApi(idToken) {
  const response = await fetch(`${API_BASE_URL}/auth/login-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: idToken }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.mensaje || "Error al iniciar sesion con Google")
  }

  return data
}
export async function registerApi(usuario) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.mensaje || 'Error al registrar usuario')
  }

  return data
}

export async function registerExpressApi(credenciales) {
  const response = await fetch(`${API_BASE_URL}/auth/register-express`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credenciales.email, password: credenciales.password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.mensaje || 'Error al crear la cuenta rapida')
  }

  return data
}

export async function registerGoogleApi(idToken) {
  const response = await fetch(`${API_BASE_URL}/auth/login-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: idToken }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.mensaje || 'Error al registrarse con Google')
  }

  return data
}
export async function loginFacebookApi(accessToken) {
  const response = await fetch(`${API_BASE_URL}/auth/login-facebook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: accessToken }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.mensaje || "Error al iniciar sesion con Facebook")
  }

  return data
}

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("openpaw_auth_token")
  const headers = { ...options.headers }

  if (token) {
    headers["Authorization"] = "Bearer " + token
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    localStorage.removeItem("openpaw_auth_token")
    window.location.href = "/login"
    throw new Error("Sesion expirada")
  }

  return response
}

