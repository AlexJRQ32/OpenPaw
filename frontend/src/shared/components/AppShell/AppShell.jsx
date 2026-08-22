import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import { API_BASE_URL, canManageFuncionarios, isAdmin, ROLE_IDS } from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { Icon } from '../Icon/Icon'
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
              <Icon name="expand_more" className="topbar-chevron" />
            </div>
            <div className="topbar-dropdown">
              <Link to="/dashboard/perfil" className="dropdown-item">
                <Icon name="person" size={16} />
                Mi perfil
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                <Icon name="logout" size={16} />
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
              <Icon name="dashboard" />
              Dashboard
            </Link>
            <Link to="/dashboard/perfil" className={isActive('/dashboard/perfil')}>
              <Icon name="person" />
              Perfil
            </Link>
            <div className="sidebar-divider" />
            <Link to="/dashboard/mascotas" className={isActive('/dashboard/mascotas')}>
              <Icon name="pets" />
              Mascotas
            </Link>
            <Link to="/dashboard/citas" className={isActive('/dashboard/citas')}>
              <Icon name="calendar_today" />
              Citas
            </Link>
            {Number(user?.rolId ?? user?.rol ?? user?.role) !== ROLE_IDS.ALMACEN && (
              <Link to="/dashboard/traslados" className={isActive('/dashboard/traslados')}>
                <Icon name="local_shipping" />
                Traslados
              </Link>
            )}
            {(Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.CLIENTE || Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.VETERINARIA) && (
              <Link to="/dashboard/emergencias" className={isActive('/dashboard/emergencias')}>
                <Icon name="emergency" />
                Emergencias
              </Link>
            )}
            {Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.CLIENTE && (
              <Link to="/dashboard/aportes" className={isActive('/dashboard/aportes')}>
                <Icon name="folder_shared" />
                Expediente
              </Link>
            )}
            {(userIsAdmin || Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.VETERINARIA) && (
              <Link to="/dashboard/servicios" className={isActive('/dashboard/servicios')}>
                <Icon name="medical_services" />
                Servicios
              </Link>
            )}
            {userCanManageFuncionarios && (
              <Link to="/dashboard/inventario" className={isActive('/dashboard/inventario')}>
                <Icon name="inventory_2" />
                Inventario
              </Link>
            )}
            {userIsAdmin && (
              <>
                <Link to="/dashboard/aprobaciones" className={isActive('/dashboard/aprobaciones')}>
                  <Icon name="fact_check" />
                  <span className="sidebar-link-text">Aprobaciones</span>{pendingLoading ? <span className="sidebar-spinner" /> : pendingCount > 0 && <span className="sidebar-dot" title={pendingCount + " pendiente(s)"}></span>}
                </Link>
              </>
            )}
            {userCanManageFuncionarios && (
              <Link to="/dashboard/funcionarios" className={isActive('/dashboard/funcionarios')}>
                <Icon name="badge" />
                Funcionarios
              </Link>
            )}
          </nav>
          <div className="sidebar-spacer" />
          <Link to="/" className="sidebar-link sidebar-link--home">
            <Icon name="home" />
            Volver al inicio
          </Link>
        </aside>
        <main className="app-content">{children}</main>
      </div>
      <nav className="bottom-nav">
        <Link to="/dashboard" className={'bottom-nav-link' + (location.pathname === '/dashboard' ? ' active' : '')}>
          <Icon name="dashboard" />
          <span>Dashboard</span>
        </Link>
        <Link to="/dashboard/perfil" className={'bottom-nav-link' + (location.pathname === '/dashboard/perfil' ? ' active' : '')}>
          <Icon name="person" />
          <span>Perfil</span>
        </Link>
        <Link to="/dashboard/mascotas" className={'bottom-nav-link' + (location.pathname === '/dashboard/mascotas' ? ' active' : '')}>
          <Icon name="pets" />
          <span>Mascotas</span>
        </Link>
        {userIsAdmin && (
          <Link to="/dashboard/aprobaciones" className={'bottom-nav-link' + (location.pathname === '/dashboard/aprobaciones' ? ' active' : '')}>
            <Icon name="fact_check" />
            <span>Aprobaciones</span>
          </Link>
        )}
        {userCanManageFuncionarios && (
          <Link to="/dashboard/funcionarios" className={'bottom-nav-link' + (location.pathname === '/dashboard/funcionarios' ? ' active' : '')}>
            <Icon name="badge" />
            <span>Personal</span>
          </Link>
        )}
        <Link to="/dashboard/citas" className={'bottom-nav-link' + (location.pathname === '/dashboard/citas' ? ' active' : '')}>
          <Icon name="calendar_today" />
          <span>Citas</span>
        </Link>
        {Number(user?.rolId ?? user?.rol ?? user?.role) !== ROLE_IDS.ALMACEN && (
          <Link to="/dashboard/traslados" className={'bottom-nav-link' + (location.pathname === '/dashboard/traslados' ? ' active' : '')}>
            <Icon name="local_shipping" />
            <span>Traslados</span>
          </Link>
        )}
        {(Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.CLIENTE || Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.VETERINARIA) && (
          <Link to="/dashboard/emergencias" className={'bottom-nav-link' + (location.pathname === '/dashboard/emergencias' ? ' active' : '')}>
            <Icon name="emergency" />
            <span>Emergencias</span>
          </Link>
        )}
        {Number(user?.rolId ?? user?.rol ?? user?.role) === ROLE_IDS.CLIENTE && (
          <Link to="/dashboard/aportes" className={'bottom-nav-link' + (location.pathname === '/dashboard/aportes' ? ' active' : '')}>
            <Icon name="folder_shared" />
            <span>Expediente</span>
          </Link>
        )}
        <Link to="/" className={'bottom-nav-link' + (location.pathname === '/' ? ' active' : '')}>
          <Icon name="home" />
          <span>Inicio</span>
        </Link>
      </nav>
    </div>
  )
}
