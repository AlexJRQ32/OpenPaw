import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import { API_BASE_URL, canManageFuncionarios, isAdmin, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import './appshell.css'

export function AppShell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userIsAdmin = isAdmin(user)
  const userCanManageFuncionarios = canManageFuncionarios(user)

  const [pendingCount, setPendingCount] = useState(0)
  const [pendingLoading, setPendingLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadPending() {
      if (!userIsAdmin) {
        setPendingCount(0)
        setPendingLoading(false)
        return
      }

      try {
        let total = 0
        const [vetRes, almRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/veterinarias`),
          authFetch(`${API_BASE_URL}/almacenes`)
        ])
        if (vetRes.ok) {
          const data = await vetRes.json()
          if (Array.isArray(data)) total += data.filter(s => !s.aprobada && !s.rechazada).length
        }
        if (almRes.ok) {
          const data = await almRes.json()
          if (Array.isArray(data)) total += data.filter(s => !s.aprobada && !s.rechazada).length
        }
        if (!cancelled) { setPendingCount(total); setPendingLoading(false) }
      } catch { if (!cancelled) setPendingLoading(false) }
    }
    function onPendingChanged() { loadPending() }
    window.addEventListener('pending-changed', onPendingChanged)
    loadPending()
    const interval = userIsAdmin ? setInterval(loadPending, 30000) : null
    return () => { cancelled = true; clearInterval(interval); window.removeEventListener('pending-changed', onPendingChanged) }
  }, [userIsAdmin])

  const isActive = (path) => location.pathname === path ? 'sidebar-link active' : 'sidebar-link'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="topbar-left">
          <Link to="/dashboard" className="topbar-brand">
            <img src="/logo.png" alt="OpenPaw" className="topbar-logo" />
            <span className="topbar-title">OpenPaw</span>
          </Link>
        </div>
        <div className="topbar-right">
<div className="topbar-user-dropdown">
            <div className="topbar-user">
              {user?.fotoUrl ? (
                <img src={user.fotoUrl} alt="" className="topbar-avatar topbar-avatar-img" referrerPolicy="no-referrer" />
              ) : (
                <span className="topbar-avatar">{(user?.nombre || user?.name)?.[0]?.toUpperCase() || 'U'}</span>
              )}
              <span className="topbar-name">{user?.nombre || user?.name || "Usuario"}</span>
              <i className="fas fa-chevron-down topbar-chevron"></i>
            </div>
            <div className="topbar-dropdown">
              <Link to="/dashboard/perfil" className="dropdown-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Mi perfil
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            <Link to="/dashboard" className={isActive('/dashboard')}>
              <i className="fas fa-th fa-fw"></i>
              Dashboard
            </Link>
            <Link to="/dashboard/perfil" className={isActive('/dashboard/perfil')}>
              <i className="fas fa-user fa-fw"></i>
              Perfil
            </Link>
            <div className="sidebar-divider" />
            <Link to="/dashboard/mascotas" className={isActive('/dashboard/mascotas')}>
              <i className="fas fa-paw fa-fw"></i>
              Mascotas
            </Link>
            <Link to="/dashboard/citas" className={isActive('/dashboard/citas')}>
              <i className="fas fa-calendar-alt fa-fw"></i>
              Citas
            </Link>
            {Number(user?.rolId ?? user?.rol ?? user?.role) !== ROLE_IDS.ALMACEN && (
              <Link to="/dashboard/traslados" className={isActive('/dashboard/traslados')}>
                <i className="fas fa-arrows-left-right fa-fw"></i>
                Traslados
              </Link>
            )}
            {(Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.CLIENTE || Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.VETERINARIA) && (
              <Link to="/dashboard/emergencias" className={isActive('/dashboard/emergencias')}>
                <i className="fas fa-ambulance fa-fw"></i>
                Emergencias
              </Link>
            )}
            {Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.CLIENTE && (
              <Link to="/dashboard/aportes" className={isActive('/dashboard/aportes')}>
                <i className="fas fa-notes-medical fa-fw"></i>
                Expediente
              </Link>
            )}
            {(userIsAdmin || Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.VETERINARIA) && (
              <Link to="/dashboard/servicios" className={isActive('/dashboard/servicios')}>
                <i className="fas fa-stethoscope fa-fw"></i>
                Servicios
              </Link>
            )}
            {userCanManageFuncionarios && (
              <Link to="/dashboard/inventario" className={isActive('/dashboard/inventario')}>
                <i className="fas fa-boxes-stacked fa-fw"></i>
                Inventario
              </Link>
            )}
            {userIsAdmin && (
              <>
                <Link to="/dashboard/aprobaciones" className={isActive('/dashboard/aprobaciones')}>
                  <i className="fas fa-check-circle fa-fw"></i>
                  <span className="sidebar-link-text">Aprobaciones</span>{pendingLoading ? <span className="sidebar-spinner" /> : pendingCount > 0 && <span className="sidebar-dot" title={pendingCount + " pendiente(s)"}></span>}
                </Link>
              </>
            )}
            {userCanManageFuncionarios && (
              <Link to="/dashboard/funcionarios" className={isActive('/dashboard/funcionarios')}>
                <i className="fas fa-user-cog fa-fw"></i>
                Funcionarios
              </Link>
            )}
          </nav>
          <div className="sidebar-spacer" />
          <Link to="/" className="sidebar-link sidebar-link--home">
            <i className="fas fa-home fa-fw"></i>
            Volver al inicio
          </Link>
        </aside>
        <main className="app-content">{children}</main>
      </div>
      <nav className="bottom-nav">
        <Link to="/dashboard" className={'bottom-nav-link' + (location.pathname === '/dashboard' ? ' active' : '')}>
          <i className="fas fa-th fa-fw"></i>
          <span>Dashboard</span>
        </Link>
        <Link to="/dashboard/perfil" className={'bottom-nav-link' + (location.pathname === '/dashboard/perfil' ? ' active' : '')}>
          <i className="fas fa-user"></i>
          <span>Perfil</span>
        </Link>
        <Link to="/dashboard/mascotas" className={'bottom-nav-link' + (location.pathname === '/dashboard/mascotas' ? ' active' : '')}>
          <i className="fas fa-paw"></i>
          <span>Mascotas</span>
        </Link>
        {userIsAdmin && (
          <Link to="/dashboard/aprobaciones" className={'bottom-nav-link' + (location.pathname === '/dashboard/aprobaciones' ? ' active' : '')}>
            <i className="fas fa-check-circle"></i>
            <span>Aprobaciones</span>
          </Link>
        )}
        {userCanManageFuncionarios && (
          <Link to="/dashboard/funcionarios" className={'bottom-nav-link' + (location.pathname === '/dashboard/funcionarios' ? ' active' : '')}>
            <i className="fas fa-user-cog fa-fw"></i>
            <span>Personal</span>
          </Link>
        )}
        <Link to="/dashboard/citas" className={'bottom-nav-link' + (location.pathname === '/dashboard/citas' ? ' active' : '')}>
          <i className="fas fa-calendar-alt"></i>
          <span>Citas</span>
        </Link>
        {Number(user?.rolId ?? user?.rol ?? user?.role) !== ROLE_IDS.ALMACEN && (
          <Link to="/dashboard/traslados" className={'bottom-nav-link' + (location.pathname === '/dashboard/traslados' ? ' active' : '')}>
            <i className="fas fa-arrows-left-right"></i>
            <span>Traslados</span>
          </Link>
        )}
        {(Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.CLIENTE || Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.VETERINARIA) && (
          <Link to="/dashboard/emergencias" className={'bottom-nav-link' + (location.pathname === '/dashboard/emergencias' ? ' active' : '')}>
            <i className="fas fa-ambulance"></i>
            <span>Emergencias</span>
          </Link>
        )}
        {Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.CLIENTE && (
          <Link to="/dashboard/aportes" className={'bottom-nav-link' + (location.pathname === '/dashboard/aportes' ? ' active' : '')}>
            <i className="fas fa-notes-medical"></i>
            <span>Expediente</span>
          </Link>
        )}
        <Link to="/" className={'bottom-nav-link' + (location.pathname === '/' ? ' active' : '')}>
          <i className="fas fa-home fa-fw"></i>
          <span>Inicio</span>
        </Link>
      </nav>
    </div>
  )
}
