import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "../context/AuthContext"
import { loginGoogleApi } from "../../../shared/utils/api"
import { useLoading } from "../../../shared/context/LoadingContext"
import { GOOGLE_CLIENT_ID } from "../../../constants"
import { Button } from "../../../shared/components/Button/Button"
import { Icon } from "../../../shared/components/Icon/Icon"
import "./LoginPage.css"

export function LoginPage() {
  const { login, loginWithSocial } = useAuth()
  const { showLoader, hideLoader } = useLoading()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || location.state?.from || "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setSubmitting(true)
      setError("")
      showLoader()
      loginGoogleApi(tokenResponse.access_token).then(data => {
        loginWithSocial(data)
        if (data.requiereTelefono) {
          navigate("/perfil", { replace: true, state: { completarTelefono: true } })
        } else {
          navigate(from, { replace: true })
        }
      }).catch(err => {
        setError(err.message)
      }).finally(() => {
        setSubmitting(false)
        hideLoader()
      })
    },
    onError: () => {
      setError("No se pudo iniciar sesion con Google")
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    showLoader()
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      hideLoader()
    }
  }

  return (
    <main className="login-page">
      <div className="login-bg" aria-hidden="true">
        <span className="login-bg-blob login-bg-blob--primary" />
        <span className="login-bg-blob login-bg-blob--secondary" />
      </div>

      <div className="login-card">
        <header className="login-brand">
          <div className="login-logo">
            <Icon name="pets" size={32} filled className="login-logo-icon" />
            <span className="login-logo-ring" aria-hidden="true" />
          </div>
          <h1 className="login-title">OpenPaw</h1>
          <p className="login-subtitle">Iniciar sesión para continuar</p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="login-form">
          {error && (
            <div className="login-error" role="alert">{error}</div>
          )}

          <div className="login-field">
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              required
              autoFocus
              autoComplete="email"
            />
            <label htmlFor="login-email">Correo electrónico</label>
          </div>

          <div className="login-field">
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              autoComplete="current-password"
            />
            <label htmlFor="login-password">Contraseña</label>
          </div>

          <div className="login-forgot">
            <a href="#" className="login-link" onClick={(e) => e.preventDefault()}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <Button
            type="submit"
            size="lg"
            className="login-submit"
            icon={submitting ? undefined : "arrow_forward"}
            iconPosition="right"
            loading={submitting}
          >
            {submitting ? "Iniciando sesión..." : "Ingresar"}
          </Button>
        </form>

        <div className="social-divider">
          <span>O continuar con</span>
        </div>

        <div className="social-login-group">
          <button
            type="button"
            className="social-btn social-btn--google"
            onClick={() => handleGoogleLogin()}
            disabled={submitting || !GOOGLE_CLIENT_ID}
            aria-label="Iniciar sesion con Google"
          >
            <svg viewBox="0 0 48 48" width="20" height="20">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            {GOOGLE_CLIENT_ID ? "Continuar con Google" : "Google no configurado"}
          </button>
        </div>
      </div>

      <footer className="login-footer">
        © 2024 OpenPaw. Sistema de gestión de salud veterinaria.
      </footer>
    </main>
  )
}

export default LoginPage
