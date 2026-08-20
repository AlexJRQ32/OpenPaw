import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { ROLE_LABELS, canManageFuncionarios, isAdmin, getUserRoleId } from '../../../constants'
import { useStats } from '../../../hooks/useStats'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { Modal } from '../../../shared/components/Modal/Modal'
import { StatCards } from '../components/StatCards'
import { RegistrationForm } from '../../veterinary-registration/components/RegistrationForm'
import { StoreRegistrationForm } from '../../store-registration/components/StoreRegistrationForm'
import './DashboardPage.css'

const STAT_CONFIG = {
  1: [
    { key: 'vets', icon: 'fas fa-clinic-medical', color: 'blue', label: 'Veterinarias' },
    { key: 'stores', icon: 'fas fa-warehouse', color: 'purple', label: 'Almacenes' },
    { key: 'pending', icon: 'fas fa-hourglass-half', color: 'orange', label: 'Pendientes' },
    { key: 'users', icon: 'fas fa-users', color: 'green', label: 'Usuarios activos' },
  ],
  2: [
    { key: 'veterinarias', icon: 'fas fa-clinic-medical', color: 'blue', label: 'Mis veterinarias' },
    { key: 'citas', icon: 'fas fa-calendar-check', color: 'green', label: 'Citas registradas' },
    { key: 'mascotas', icon: 'fas fa-paw', color: 'purple', label: 'Mascotas atendidas' },
    { key: 'pendientes', icon: 'fas fa-hourglass-half', color: 'orange', label: 'Solicitudes pendientes' },
  ],
  3: [
    { key: 'almacenes', icon: 'fas fa-warehouse', color: 'purple', label: 'Mis almacenes' },
    { key: 'pendientes', icon: 'fas fa-hourglass-half', color: 'orange', label: 'Solicitudes pendientes' },
  ],
  4: [
    { key: 'mascotas', icon: 'fas fa-paw', color: 'blue', label: 'Mis mascotas' },
    { key: 'citas', icon: 'fas fa-calendar-check', color: 'green', label: 'Mis citas' },
    { key: 'veterinarias', icon: 'fas fa-clinic-medical', color: 'purple', label: 'Veterinarias vinculadas' },
  ],
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { stats, loading: statsLoading } = useStats()
  const roleId = getUserRoleId(user)
  const userIsAdmin = isAdmin(user)
  const userCanManageFuncionarios = canManageFuncionarios(user)
  const [modal, setModal] = useState(null)

  const actions = [
    { key: 'vet', icon: 'fas fa-hospital', color: 'blue', title: 'Registrar veterinaria', desc: 'Solicita el registro de una nueva veterinaria.', action: () => setModal('vet') },
    { key: 'store', icon: 'fas fa-warehouse', color: 'orange', title: 'Registrar almacen', desc: 'Registra un nuevo almacen veterinario.', action: () => setModal('store') },
    { key: 'aprob', icon: 'fas fa-check-circle', color: 'green', title: 'Aprobar solicitudes', desc: 'Revisa y aprueba solicitudes pendientes.', adminOnly: true, to: '/dashboard/aprobaciones' },
    { key: 'func', icon: 'fas fa-user-cog', color: 'gray', title: 'Gestionar personal', desc: 'Administra funcionarios y sus roles.', funcionariosOnly: true, action: () => navigate('/dashboard/funcionarios', { state: { openCreate: true } }) },
  ].filter(
    (a) => (!a.adminOnly || userIsAdmin) && (!a.funcionariosOnly || userCanManageFuncionarios)
  )

  return (
    <AppShell>
      <div className="dashboard-page">
        <div className="dashboard-greeting">
          <h1>Bienvenido, {user?.nombre || 'Usuario'}</h1>
          <span className="dashboard-role-badge">{ROLE_LABELS[roleId] ?? 'Usuario'}</span>
        </div>
        {statsLoading ? <div className="spinner-wrap"><span className="spinner" /></div> : <StatCards config={STAT_CONFIG[roleId]} data={stats} />}
        <h2 className="dashboard-section-title">Acciones rapidas</h2>
        <div className={'dashboard-actions' + (actions.length >= 4 ? ' dashboard-actions--grid' : '')}>
          {actions.map((a) =>
            a.to ? (
              <Link key={a.key} to={a.to} className="action-card">
                <div className={`action-icon action-icon--${a.color}`}><i className={a.icon}></i></div>
                <div className="action-title">{a.title}</div>
                <div className="action-desc">{a.desc}</div>
              </Link>
            ) : (
              <button key={a.key} className="action-card" onClick={a.action} style={{border:'none',width:'100%',textAlign:'left',font:'inherit',cursor:'pointer'}}>
                <div className={`action-icon action-icon--${a.color}`}><i className={a.icon}></i></div>
                <div className="action-title">{a.title}</div>
                <div className="action-desc">{a.desc}</div>
              </button>
            )
          )}
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
