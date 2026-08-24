import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "../context/AuthContext"
import { loginGoogleApi, loginFacebookApi } from "../../../shared/utils/api"
import { useLoading } from "../../../shared/context/LoadingContext"
import { GOOGLE_CLIENT_ID } from "../../../constants"
import { Icon } from "../../../shared/components/Icon/Icon"
import "./AuthMethodPage.css"

window.fbAsyncInit = function() {
  window.FB.init({
    appId: import.meta.env.VITE_FACEBOOK_APP_ID ?? "2470437836755419",
    cookie: true,
    xfbml: true,
    version: "v19.0"
  })
  window.FB.AppEvents.logPageView()
  window.__fbReady = true
}

function loadFbSdk() {
  if (window.FB) { window.__fbReady = true; return }
  var js, fjs = document.getElementsByTagName("script")[0]
  if (document.getElementById("facebook-jssdk")) return
  js = document.createElement("script")
  js.id = "facebook-jssdk"
  js.src = "https://connect.facebook.net/en_US/sdk.js"
  fjs.parentNode.insertBefore(js, fjs)
}

export function AuthMethodPage() {
  const { loginWithSocial } = useAuth()
  const { showLoader, hideLoader } = useLoading()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || location.state?.from || "/dashboard"
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadFbSdk()
  }, [])

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

  const handleFacebookLogin = () => {
    if (!window.__fbReady) {
      setError("Facebook SDK no listo. Intenta de nuevo.")
      return
    }
    if (!window.FB) {
      setError("Facebook SDK no cargo. Intente de nuevo.")
      return
    }
    window.FB.login((response) => {
      if (response.authResponse) {
        setSubmitting(true)
        setError("")
        showLoader()
        loginFacebookApi(response.authResponse.accessToken).then(data => {
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
      } else {
        setError("Inicio de sesion con Facebook cancelado")
      }
    }, { scope: "public_profile,email" })
  }

  /* ==========================================================================
     Rediseño Sprint 1 / Task #21 (wireframe Stitch "Método de acceso").
     Funcionalidad conservada íntegra: banner error role=alert, estado
     submitting/disabled, SDK Google/Facebook reales, redirect requiereTelefono,
     email -> /register (Link), footer -> /login.
     ========================================================================== */
  return (
    <main className="auth-method-page">
      <div className="auth-method-bg" aria-hidden="true">
        <span className="auth-method-blob auth-method-blob--primary" />
        <span className="auth-method-blob auth-method-blob--secondary" />
      </div>

      <div className="auth-method-card">
        <header className="auth-method-brand">
          {/* Logo unificado con LoginPage (#20): círculo pets + anillo ping */}
          <div className="auth-method-logo">
            <Icon name="pets" size={32} filled className="auth-method-logo-icon" />
            <span className="auth-method-logo-ring" aria-hidden="true" />
          </div>
          <h1 className="auth-method-title">Bienvenido a OpenPaw</h1>
          <p className="auth-method-subtitle">Elige una forma de continuar</p>
        </header>

        {error && (
          <div className="auth-method-error" role="alert">{error}</div>
        )}

        <div className="auth-method-options">
          <Link to="/register" className="auth-option">
            <Icon name="mail" size={24} className="auth-option-icon" />
            <span className="auth-option-label">Continuar con Email</span>
          </Link>

          <button
            type="button"
            className="auth-option"
            onClick={() => handleGoogleLogin()}
            disabled={submitting || !GOOGLE_CLIENT_ID}
          >
            {/* Marca Google: SVG oficial multicolor (hex documentado, sin token M3) */}
            <svg viewBox="0 0 48 48" width="24" height="24" className="auth-option-icon" aria-hidden="true">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            <span className="auth-option-label">
              {GOOGLE_CLIENT_ID ? "Continuar con Google" : "Google no configurado"}
            </span>
          </button>

          <button
            type="button"
            className="auth-option"
            onClick={handleFacebookLogin}
            disabled={submitting}
            aria-label="Continuar con Facebook"
          >
            <svg viewBox="0 0 48 48" width="24" height="24" className="auth-option-icon" aria-hidden="true">
              <path fill="currentColor" d="M24 5C13.5 5 5 13.5 5 24c0 9.5 6.9 17.4 16 18.9V30h-4.8v-6H21v-4.2c0-4.8 2.8-7.4 7.2-7.4 2.1 0 4.3.4 4.3.4v4.7h-2.4c-2.4 0-3.1 1.5-3.1 3v3.5h5.3l-.8 6H27v12.9c9.1-1.5 16-9.4 16-18.9 0-10.5-8.5-19-19-19z"/>
            </svg>
            <span className="auth-option-label">Continuar con Facebook</span>
          </button>
        </div>

        <p className="auth-method-legal">
          Al continuar, aceptas nuestros{" "}
          <a href="#" className="auth-method-legal-link" onClick={(e) => e.preventDefault()}>
            Términos de Servicio
          </a>{" "}
          y{" "}
          <a href="#" className="auth-method-legal-link" onClick={(e) => e.preventDefault()}>
            Política de Privacidad
          </a>.
        </p>

        <p className="auth-method-footer">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="auth-method-footer-link">Inicia sesión</Link>
        </p>
      </div>
    </main>
  )
}

export default AuthMethodPage
