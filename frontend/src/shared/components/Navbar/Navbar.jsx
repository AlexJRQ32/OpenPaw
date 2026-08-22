import { useState, useEffect, useCallback } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../../features/auth/context/AuthContext"
import { Icon } from "../Icon/Icon"
import "./Navbar.css"

export function Navbar() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const isMarketplace = location.pathname === "/marketplace"
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    closeMenu()
  }, [location.pathname, closeMenu])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  return (
    <>
      <nav className="navbar" aria-label="Navegacion principal">
        <div className="navbar-left">
          {isMarketplace && <Link to="/" className="navbar-back" aria-label="Volver al inicio" onClick={closeMenu}><Icon name="arrow_back" size={18} /></Link>}
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <img src="/logo.png" alt="OpenPaw logo" />
            <span>OpenPaw</span>
          </Link>
        </div>
        <div className="navbar-links">
          <a href="/#features">Funcionalidades</a>
          <a href="/#how">Como funciona</a>
          <Link to="/marketplace">Marketplace</Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="navbar-user-pill" title="Ir al Dashboard">
              {user?.fotoUrl ? <img src={user.fotoUrl} alt="" className="navbar-user-avatar navbar-user-img" referrerPolicy="no-referrer" /> : <span className="navbar-user-avatar">{(user?.name || user?.nombre || "U")[0].toUpperCase()}</span>}
              <span className="navbar-user-name">{user?.name || user?.nombre || "Usuario"}</span>
            </Link>
          ) : (
            <>
              <Link to="/login">Iniciar sesion</Link>
              <Link to="/auth-method" className="btn-nav">Comenzar</Link>
            </>
          )}
        </div>
        <button
          className={`navbar-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={24} />
        </button>
      </nav>

      {menuOpen && <div className="navbar-overlay" onClick={closeMenu} />}

      <div className={`navbar-mobile ${menuOpen ? "open" : ""}`}>
        <a href="/#features" onClick={closeMenu}>Funcionalidades</a>
        <a href="/#how" onClick={closeMenu}>Como funciona</a>
        <Link to="/marketplace" onClick={closeMenu}>Marketplace</Link>
        <div className="navbar-mobile-divider" />
        {isAuthenticated ? (
          <>
            <div className="navbar-mobile-user">
              {user?.fotoUrl ? <img src={user.fotoUrl} alt="" className="navbar-mobile-avatar navbar-user-img" referrerPolicy="no-referrer" /> : <span className="navbar-mobile-avatar">{(user?.nombre || user?.name || "U")[0].toUpperCase()}</span>}
              <span>{user?.name || user?.nombre || "Usuario"}</span>
            </div>
            <Link to="/dashboard" className="navbar-mobile-link" onClick={closeMenu}>Ir al Dashboard</Link>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-mobile-link" onClick={closeMenu}>Iniciar sesion</Link>
            <Link to="/auth-method" className="navbar-mobile-link navbar-mobile-link--primary" onClick={closeMenu}>Comenzar</Link>
          </>
        )}
      </div>
    </>
  )
}
