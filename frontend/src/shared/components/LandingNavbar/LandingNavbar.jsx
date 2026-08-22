import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../../features/auth/context/AuthContext"
import { Icon } from "../Icon/Icon"
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
          aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={24} />
        </button>
      </nav>

      {menuOpen && <div className="landing-mobile-backdrop" onClick={closeMenu} aria-hidden="true" />}
      <div className={`landing-mobile-menu${menuOpen ? " landing-mobile-menu--open" : ""}`}>
        <nav className="landing-mobile-menu__nav" aria-label="Menu movil">
          {onLanding ? (
            <Link to="/" onClick={closeMenu}><Icon name="home" size={18} /> Volver al inicio</Link>
          ) : (
            <>
              <a href="#about" onClick={closeMenu}><Icon name="lightbulb" size={18} /> La idea</a>
              <a href="#features" onClick={closeMenu}><Icon name="dashboard" size={18} /> Funcionalidades</a>
              <a href="#how" onClick={closeMenu}><Icon name="info" size={18} /> Como funciona</a>
            </>
          )}
          <Link to="/marketplace" onClick={closeMenu}><Icon name="store" size={18} /> Marketplace</Link>
          <div className="landing-mobile-menu__divider" />
          {isAuthenticated ? (
            <Link to="/dashboard" onClick={closeMenu}><Icon name="speed" size={18} /> Ir al dashboard</Link>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}><Icon name="person" size={18} /> Iniciar sesion</Link>
              <Link to="/auth-method" className="landing-mobile-menu__cta" onClick={closeMenu}>
                Comenzar <Icon name="arrow_forward" size={18} />
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
