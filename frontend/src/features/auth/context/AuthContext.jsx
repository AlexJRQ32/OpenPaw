import { createContext, useContext, useState, useEffect } from "react"
import { loginApi } from "../../../shared/utils/api"
import { AUTH_TOKEN_KEY, USER_STORAGE_KEY } from "../../../constants"
import { migrateAnonymousCart } from "../../../shared/utils/cart"

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function loadSavedUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveUser(user) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [user, setUser] = useState(() => {
    // Prefer saved user object (has updateUser changes), fallback to JWT decode
    const saved = loadSavedUser()
    if (saved) return saved

    const jwt = localStorage.getItem(AUTH_TOKEN_KEY)
    return jwt ? decodeJwtPayload(jwt) : null
  })

  // Persist user to localStorage whenever it changes
  useEffect(() => { saveUser(user) }, [user])

  const isAuthenticated = !!token

  const login = async (email, password) => {
    const data = await loginApi(email, password)
    localStorage.setItem(AUTH_TOKEN_KEY, data.token)
    setToken(data.token)
    const decoded = decodeJwtPayload(data.token)
    setUser(decoded)
    migrateAnonymousCart(decoded?.sub)
    return decoded
  }

  const loginWithSocial = (data) => {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token)
    setToken(data.token)
    const decoded = decodeJwtPayload(data.token)
    setUser(decoded)
    migrateAnonymousCart(decoded?.sub)
    return decoded
  }

  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }))
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, loginWithSocial, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return context
}
