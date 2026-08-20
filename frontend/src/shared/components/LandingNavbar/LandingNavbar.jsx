import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../../features/auth/context/AuthContext"
import "./LandingNavbar.css"

export function LandingNavbar({ onLanding }) {
  const { user, isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className="landing-navbar" aria-label="Navegacion principal">
        <Link to="/" className="landing-navbar-brand">
          <img src="/logo.png" alt="OpenPaw logo" />
          <span>OpenPaw</span>
        </Link>
        <div className="landing-navbar-links">
          {onLanding ? (
            <Link to="/" className="landing-navbar-back">Volver al inicio</Link>
          ) : (
            <>
              <a href="#about">La idea</a>
              <a href="#features">Funcionalidades</a>
              <a href="#how">Como funciona</a>
            </>
          )}
          <Link to="/marketplace">Marketplace</Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="landing-navbar-user-pill" title="Ir al Dashboard">
              <span className="landing-navbar-user-avatar">
                {user?.fotoUrl
                  ? <img src={user.fotoUrl} alt="" referrerPolicy="no-referrer" className="landing-navbar-user-img" />
                  : (user?.nombre || user?.name || "U")[0].toUpperCase()}
              </span>
              <span className="landing-navbar-user-name">{user?.nombre || user?.name || "Usuario"}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-navbar-login">Iniciar sesion</Link>
              <Link to="/auth-method" className="landing-btn-nav">Comenzar</Link>
            </>
          )}
        </div>
        <button
          type="button"
          className={`landing-navbar-burger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>

      {menuOpen && <div className="landing-mobile-backdrop" onClick={closeMenu} aria-hidden="true" />}
      <div className={`landing-mobile-menu${menuOpen ? " landing-mobile-menu--open" : ""}`}>
        <nav className="landing-mobile-menu__nav" aria-label="Menu movil">
          {onLanding ? (
            <Link to="/" onClick={closeMenu}><i className="fas fa-home" /> Volver al inicio</Link>
          ) : (
            <>
              <a href="#about" onClick={closeMenu}><i className="fas fa-lightbulb" /> La idea</a>
              <a href="#features" onClick={closeMenu}><i className="fas fa-th-large" /> Funcionalidades</a>
              <a href="#how" onClick={closeMenu}><i className="fas fa-circle-info" /> Como funciona</a>
            </>
          )}
          <Link to="/marketplace" onClick={closeMenu}><i className="fas fa-store" /> Marketplace</Link>
          <div className="landing-mobile-menu__divider" />
          {isAuthenticated ? (
            <Link to="/dashboard" onClick={closeMenu}><i className="fas fa-gauge" /> Ir al dashboard</Link>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}><i className="fas fa-user" /> Iniciar sesion</Link>
              <Link to="/auth-method" className="landing-mobile-menu__cta" onClick={closeMenu}>
                Comenzar <i className="fas fa-arrow-right" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
