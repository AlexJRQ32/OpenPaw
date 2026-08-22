import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { ROLE_LABELS, canManageFuncionarios, isAdmin, getUserRoleId } from '../../../constants'
import { useStats } from '../../../hooks/useStats'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Icon } from '../../../shared/components/Icon/Icon'
import { StatCards } from '../components/StatCards'
import { RegistrationForm } from '../../veterinary-registration/components/RegistrationForm'
import { StoreRegistrationForm } from '../../store-registration/components/StoreRegistrationForm'
import './DashboardPage.css'

// T24 — Stats reales de /usuarios/me/stats por rol (UsuariosController):
//   admin(1): vets | stores | pending | users
//   vet(2): veterinarias | citas | mascotas | pendientes
//   almacén(3): almacenes | pendientes
//   cliente(4): mascotas | citas | veterinarias
// El wireframe pide tendencia (+%), cupo diario de citas y traslados "en
// ruta", pero el backend no expone series históricas, capacidad ni traslados:
// esas cards se mapean a los stats reales de cada rol y sus adornos se
// omiten (sin datos inventados). Roles sin cierto stat simplemente muestran
// menos cards. `alert` marca la card de solicitudes pendientes —única fuente
// real de alertas— que solo se pinta crítica cuando el valor es > 0.
const STAT_CONFIG = {
  1: [
    { key: 'vets', tone: 'primary', icon: 'local_hospital', label: 'Veterinarias activas' },
    { key: 'stores', tone: 'tertiary', icon: 'inventory_2', label: 'Almacenes activos' },
    { key: 'users', tone: 'secondary', icon: 'group', label: 'Usuarios activos' },
    { key: 'pending', tone: 'error', icon: 'warning', chipIcon: 'emergency', label: 'Solicitudes pendientes', alert: true },
  ],
  2: [
    { key: 'mascotas', tone: 'primary', icon: 'pets', label: 'Mascotas atendidas' },
    { key: 'citas', tone: 'tertiary', icon: 'calendar_month', label: 'Citas registradas' },
    { key: 'veterinarias', tone: 'secondary', icon: 'local_hospital', label: 'Mis veterinarias' },
    { key: 'pendientes', tone: 'error', icon: 'warning', chipIcon: 'emergency', label: 'Solicitudes pendientes', alert: true },
  ],
  3: [
    { key: 'almacenes', tone: 'tertiary', icon: 'inventory_2', label: 'Mis almacenes' },
    { key: 'pendientes', tone: 'error', icon: 'warning', chipIcon: 'emergency', label: 'Solicitudes pendientes', alert: true },
  ],
  4: [
    { key: 'mascotas', tone: 'primary', icon: 'pets', label: 'Mis mascotas' },
    { key: 'citas', tone: 'tertiary', icon: 'calendar_month', label: 'Mis citas' },
    { key: 'veterinarias', tone: 'secondary', icon: 'local_hospital', label: 'Veterinarias vinculadas' },
  ],
}

// T23: fecha actual en español con el formato del wireframe ("Lunes, 24 de octubre").
// El dateTime del <time> y el texto visible se derivan del MISMO Date usando
// componentes locales (no ISO/UTC) para que no queden desfasados un día
// cuando la zona horaria local difiere de UTC.
const dateFormatter = new Intl.DateTimeFormat('es-CR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function buildFechaHoy(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const label = dateFormatter.format(now)
  return { dateTime, label: label.charAt(0).toUpperCase() + label.slice(1) }
}

const RESUMEN_BASE = 'Aquí tienes un resumen de la actividad para el día de hoy.'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { stats, loading: statsLoading } = useStats()
  const roleId = getUserRoleId(user)
  const userIsAdmin = isAdmin(user)
  const userCanManageFuncionarios = canManageFuncionarios(user)
  const [modal, setModal] = useState(null)
  const fechaHoy = buildFechaHoy()

  // T23: "alertas" = solicitudes pendientes que ya expone /usuarios/me/stats
  // (`pendientes` para veterinaria/almacén, `pending` para admin). Única fuente
  // de alertas disponible hoy; mientras carga y para roles sin pendientes se
  // muestra solo el resumen genérico.
  const alertasPendientes = Number(stats?.pendientes ?? stats?.pending ?? 0)
  const detalleAlertas = statsLoading
    ? ''
    : alertasPendientes > 0
      ? ` Hay ${alertasPendientes} ${alertasPendientes === 1 ? 'alerta' : 'alertas'} que requieren tu atención.`
      : ' No hay alertas pendientes por ahora.'

  // T25 — Acciones rápidas (wireframe dashboard_openpaw). Se conservan las
  // mismas acciones y navegaciones por rol que ya existían (modal vet/store,
  // link aprobaciones solo admin, funcionarios con openCreate); solo cambia
  // la presentación: icono Material Symbols en tile tintado por tono,
  // descripción y CTA "acción →" revelado al hover/focus.
  const actions = [
    { key: 'vet', icon: 'add_business', tone: 'primary', title: 'Registrar veterinaria', desc: 'Solicita el registro de una nueva veterinaria en la red.', cta: 'Comenzar registro', action: () => setModal('vet') },
    { key: 'store', icon: 'inventory_2', tone: 'tertiary', title: 'Registrar almacén', desc: 'Registra un nuevo almacén veterinario de insumos.', cta: 'Comenzar registro', action: () => setModal('store') },
    { key: 'aprob', icon: 'fact_check', tone: 'success', title: 'Aprobar solicitudes', desc: 'Revisa y aprueba las solicitudes pendientes.', cta: 'Revisar solicitudes', adminOnly: true, to: '/dashboard/aprobaciones' },
    { key: 'func', icon: 'manage_accounts', tone: 'neutral', title: 'Gestionar personal', desc: 'Administra funcionarios y sus roles de acceso.', cta: 'Administrar equipo', funcionariosOnly: true, action: () => navigate('/dashboard/funcionarios', { state: { openCreate: true } }) },
  ].filter(
    (a) => (!a.adminOnly || userIsAdmin) && (!a.funcionariosOnly || userCanManageFuncionarios)
  )

  return (
    <AppShell>
      <div className="dashboard-page">
        {/* T23 — Header enriquecido (wireframe dashboard_openpaw):
            badge de rol + fecha sobre el título, subtítulo de alertas y
            acciones (Personalizar / Nueva Consulta) a la derecha. */}
        <section className="dashboard-header">
          <div className="dashboard-header__info">
            <div className="dashboard-header__meta">
              <Badge variant="active" className="dashboard-role-badge">{ROLE_LABELS[roleId] ?? 'Usuario'}</Badge>
              <time className="dashboard-header__date" dateTime={fechaHoy.dateTime}>
                {fechaHoy.label}
              </time>
            </div>
            <h1 className="dashboard-header__title">
              Bienvenido, <span className="dashboard-header__name">{user?.nombre || 'Usuario'}</span>
            </h1>
            <p className="dashboard-header__subtitle">
              {RESUMEN_BASE}
              {detalleAlertas}
            </p>
          </div>
          <div className="dashboard-header__actions">
            {/* Placeholder T23: la personalización del panel se definirá en un sprint posterior. */}
            <Button variant="outline" icon="tune" title="Personalización disponible próximamente" disabled={true}>Personalizar</Button>
            {/* Reutiliza la navegación existente: la Agenda de citas es donde toda
                la app crea consultas (CitasPage). Cuando CitasPage soporte
                deep-link openCreate como FuncionariosPage, se pasa el state. */}
            <Button variant="primary" icon="add" onClick={() => navigate('/dashboard/citas')}>Nueva Consulta</Button>
          </div>
        </section>
        {statsLoading ? <div className="spinner-wrap"><span className="spinner" /></div> : <StatCards config={STAT_CONFIG[roleId]} data={stats} />}
        <h2 className="dashboard-section-title">Acciones rápidas</h2>
        <div className="dashboard-actions">
          {actions.map((a) => {
            const cardProps = {
              className: `action-card action-card--${a.tone}`,
              'aria-label': `${a.title}. ${a.desc}`,
            }
            const content = (
              <>
                <span className="action-icon"><Icon name={a.icon} size={24} /></span>
                <span className="action-body">
                  <span className="action-title">{a.title}</span>
                  <span className="action-desc">{a.desc}</span>
                </span>
                {/* aria-hidden: el CTA repite la info del aria-label de la card */}
                <span className="action-cta" aria-hidden="true">
                  {a.cta}
                  <Icon name="arrow_forward" size={18} />
                </span>
              </>
            )
            return a.to ? (
              <Link key={a.key} to={a.to} {...cardProps}>{content}</Link>
            ) : (
              <button key={a.key} type="button" onClick={a.action} {...cardProps}>{content}</button>
            )
          })}
        </div>
      </div>

      <Modal open={modal === 'vet'} onClose={() => setModal(null)} className="reg-modal">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2 style={{margin:0,fontSize:20}}>Registrar veterinaria</h2>
          <button onClick={() => setModal(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888',padding:'4px 8px'}}>✕</button>
        </div>
        <RegistrationForm />
      </Modal>

      <Modal open={modal === 'store'} onClose={() => setModal(null)} className="reg-modal">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2 style={{margin:0,fontSize:20}}>Registrar almacen</h2>
          <button onClick={() => setModal(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888',padding:'4px 8px'}}>✕</button>
        </div>
        <StoreRegistrationForm />
      </Modal>
    </AppShell>
  )
}
