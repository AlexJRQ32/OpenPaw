import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import {
  API_BASE_URL,
  canManageFuncionarios,
  getUserRoleId,
  isAdmin,
  ROLE_IDS,
  ROLE_LABELS,
} from '../../../constants'
import { authFetch } from '../../../shared/utils/api'
import { Icon } from '../Icon/Icon'
import { Badge } from '../Badge/Badge'
import './appshell.css'

/* Variante M3 del Badge de rol en el header (tarea #18):
   Administrador -> primary | Veterinaria -> success | Almacen -> warning | Cliente -> neutral */
const ROLE_BADGE_VARIANTS = {
  [ROLE_IDS.ADMINISTRADOR]: 'primary',
  [ROLE_IDS.VETERINARIA]: 'success',
  [ROLE_IDS.ALMACEN]: 'warning',
  [ROLE_IDS.CLIENTE]: 'neutral',
}

export function AppShell({ children }) {
  /* Sidebar collapsible (patron Trustride): estado persistido en localStorage,
     transicion de width, labels ocultos en rail y tooltip via title. */
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
    localStorage.setItem('sidebar-collapsed', (!collapsed).toString())
  }

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userIsAdmin = isAdmin(user)
  const userCanManageFuncionarios = canManageFuncionarios(user)

  /* Rol resuelto una sola vez (misma semantica que el gating existente) */
  const roleId = getUserRoleId(user)
  const roleLabel = ROLE_LABELS[roleId]

  const [pendingCount, setPendingCount] = useState(0)
  const [pendingLoading, setPendingLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  /* Buscador global: navegacion basica a mascotas con query param */
  const handleSearch = (event) => {
    event.preventDefault()
    const query = search.trim()
    if (query) navigate(`/dashboard/mascotas?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--sidebar-collapsed' : ''}`}>
      <header className="app-topbar">
        <div className="topbar-left">
          {/* Solo visible en mobile (CSS): salida al landing desde el dashboard */}
          <Link to="/" className="topbar-back" aria-label="Volver al inicio">
            <Icon name="arrow_back" size={20} />
          </Link>
          <Link to="/dashboard" className="topbar-brand">
            <img src="/logo.png" alt="OpenPaw" className="topbar-logo" />
            <span className="topbar-title">OpenPaw</span>
          </Link>
        </div>
        <form className="topbar-search" role="search" onSubmit={handleSearch}>
          <Icon name="search" size={20} className="topbar-search-icon" />
          <input
            type="search"
            className="topbar-search-input"
            placeholder="Buscar mascota o dueño..."
            aria-label="Buscar mascota o dueño"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>
        <div className="topbar-right">
          <div className="topbar-user-dropdown">
            <div className="topbar-user">
              <span className="topbar-user-info">
                <span className="topbar-name">{user?.nombre || user?.name || "Usuario"}</span>
                {roleLabel && (
                  <Badge variant={ROLE_BADGE_VARIANTS[roleId]} className="topbar-role-badge">
                    {roleLabel}
                  </Badge>
                )}
              </span>
              {user?.fotoUrl ? (
                <img src={user.fotoUrl} alt="" className="topbar-avatar topbar-avatar-img" referrerPolicy="no-referrer" />
              ) : (
                <span className="topbar-avatar">{(user?.nombre || user?.name)?.[0]?.toUpperCase() || 'U'}</span>
              )}
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
        <aside className="app-sidebar" aria-label="Navegacion del dashboard">
          <div className="sidebar-top">
            {/* Sin logo en el sidebar (solo el wordmark de texto; oculto en rail) */}
            <Link to="/dashboard" className="sidebar-brand">
              <span className="sidebar-brand-text">OpenPaw</span>
            </Link>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleCollapsed}
              title={collapsed ? 'Expandir' : 'Colapsar'}
              aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              aria-expanded={!collapsed}
            >
              {/* Icono panel estandar (M3 "left_panel_close": contorno con
                  divisor vertical a la izquierda, analogo a Lucide PanelLeft);
                  estatico en ambos estados, sin flip. */}
              <Icon name="left_panel_close" size={20} className="sidebar-toggle-icon" />
            </button>
          </div>
          <nav className="sidebar-nav">
            {!collapsed && <span className="sidebar-section-label">Navegacion</span>}
            <Link to="/dashboard" className={isActive('/dashboard')} title={collapsed ? 'Dashboard' : undefined}>
              <Icon name="dashboard" />
              <span className="sidebar-label">Dashboard</span>
            </Link>
            <Link to="/dashboard/perfil" className={isActive('/dashboard/perfil')} title={collapsed ? 'Perfil' : undefined}>
              <Icon name="person" />
              <span className="sidebar-label">Perfil</span>
            </Link>
            <div className="sidebar-divider" />
            <Link to="/dashboard/mascotas" className={isActive('/dashboard/mascotas')} title={collapsed ? 'Mascotas' : undefined}>
              <Icon name="pets" />
              <span className="sidebar-label">Mascotas</span>
            </Link>
            <Link to="/dashboard/citas" className={isActive('/dashboard/citas')} title={collapsed ? 'Citas' : undefined}>
              <Icon name="calendar_today" />
              <span className="sidebar-label">Citas</span>
            </Link>
            {roleId !== ROLE_IDS.ALMACEN && (
              <Link to="/dashboard/traslados" className={isActive('/dashboard/traslados')} title={collapsed ? 'Traslados' : undefined}>
                <Icon name="local_shipping" />
                <span className="sidebar-label">Traslados</span>
              </Link>
            )}
            {(roleId === ROLE_IDS.CLIENTE || roleId === ROLE_IDS.VETERINARIA) && (
              <Link to="/dashboard/emergencias" className={isActive('/dashboard/emergencias')} title={collapsed ? 'Emergencias' : undefined}>
                <Icon name="emergency" />
                <span className="sidebar-label">Emergencias</span>
              </Link>
            )}
            {(roleId === ROLE_IDS.CLIENTE || roleId === ROLE_IDS.VETERINARIA || userIsAdmin) && (
              <Link to="/dashboard/expediente" className={isActive('/dashboard/expediente')} title={collapsed ? 'Expediente' : undefined}>
                <Icon name="folder_shared" />
                <span className="sidebar-label">Expediente</span>
              </Link>
            )}
            {(userIsAdmin || roleId === ROLE_IDS.VETERINARIA) && (
              <Link to="/dashboard/servicios" className={isActive('/dashboard/servicios')} title={collapsed ? 'Servicios' : undefined}>
                <Icon name="medical_services" />
                <span className="sidebar-label">Servicios</span>
              </Link>
            )}
            <div className="sidebar-divider" />
            {userCanManageFuncionarios && (
              <Link to="/dashboard/inventario" className={isActive('/dashboard/inventario')} title={collapsed ? 'Inventario' : undefined}>
                <Icon name="inventory_2" />
                <span className="sidebar-label">Inventario</span>
              </Link>
            )}
            {userIsAdmin && (
              <Link to="/dashboard/aprobaciones" className={isActive('/dashboard/aprobaciones')} title={collapsed ? 'Aprobaciones' : undefined}>
                <Icon name="fact_check" />
                <span className="sidebar-label">Aprobaciones</span>
                {pendingLoading ? <span className="sidebar-spinner" /> : pendingCount > 0 && <span className="sidebar-dot" role="img" aria-label={`${pendingCount} aprobaciones pendientes`} title={pendingCount + " pendiente(s)"}></span>}
              </Link>
            )}
            {userCanManageFuncionarios && (
              <Link to="/dashboard/funcionarios" className={isActive('/dashboard/funcionarios')} title={collapsed ? 'Funcionarios' : undefined}>
                <Icon name="badge" />
                <span className="sidebar-label">Funcionarios</span>
              </Link>
            )}
          </nav>
          <div className="sidebar-spacer" />
          <Link to="/" className="sidebar-link sidebar-link--home" title={collapsed ? 'Volver al inicio' : undefined}>
            <Icon name="logout" />
            <span className="sidebar-label">Volver al inicio</span>
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
        {roleId !== ROLE_IDS.ALMACEN && (
          <Link to="/dashboard/traslados" className={'bottom-nav-link' + (location.pathname === '/dashboard/traslados' ? ' active' : '')}>
            <Icon name="local_shipping" />
            <span>Traslados</span>
          </Link>
        )}
        {(roleId === ROLE_IDS.CLIENTE || roleId === ROLE_IDS.VETERINARIA) && (
          <Link to="/dashboard/emergencias" className={'bottom-nav-link' + (location.pathname === '/dashboard/emergencias' ? ' active' : '')}>
            <Icon name="emergency" />
            <span>Emergencias</span>
          </Link>
        )}
        {(roleId === ROLE_IDS.CLIENTE || roleId === ROLE_IDS.VETERINARIA || userIsAdmin) && (
          <Link to="/dashboard/expediente" className={'bottom-nav-link' + (location.pathname === '/dashboard/expediente' ? ' active' : '')}>
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
