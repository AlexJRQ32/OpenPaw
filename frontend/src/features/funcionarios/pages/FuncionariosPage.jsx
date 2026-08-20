import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { FuncionariosPanel } from '../components/FuncionariosPanel'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { useFuncionarios } from '../../../hooks/useFuncionarios'
import { FUNCIONARIO_ROLES, ROLE_IDS, API_BASE_URL } from '../../../constants'
import { useAuth } from '../../auth/context/AuthContext'
import { authFetch } from '../../../shared/utils/api'
import './FuncionariosPage.css'

export function FuncionariosPage() {
  const { user } = useAuth()
  const location = useLocation()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esAdmin = userRol === ROLE_IDS.ADMINISTRADOR
  const [tab, setTab] = useState('funcionarios')
  const [showCreate, setShowCreate] = useState(location.state?.openCreate === true)
  const [comercios, setComercios] = useState([])
  const [loadingComercios, setLoadingComercios] = useState(false)
  const { funcionarios, admins, form, errors, status, ultimoCreado, updateField, setValue, crearFuncionario } = useFuncionarios()

  useEffect(() => {
    if (!esAdmin) return
    let cancelled = false
    async function load() {
      setLoadingComercios(true)
      const [vets, stores] = await Promise.all([
        authFetch(`${API_BASE_URL}/veterinarias`).then(r => r.ok ? r.json() : []),
        authFetch(`${API_BASE_URL}/almacenes`).then(r => r.ok ? r.json() : []),
      ])
      if (cancelled) return
      const items = [
        ...(Array.isArray(vets) ? vets.map((v) => ({ id: v.id, nombre: v.nombre, tipo: 'Veterinaria' })) : []),
        ...(Array.isArray(stores) ? stores.map((s) => ({ id: s.id, nombre: s.nombre, tipo: 'Almacen' })) : []),
      ]
      setComercios(items)
      setLoadingComercios(false)
    }
    load()
    return () => { cancelled = true }
  }, [esAdmin])

  const handleCreate = async (e) => {
    e.preventDefault()
    await crearFuncionario(e)
    if (!errors.submit) setShowCreate(false)
  }

  return (
    <AppShell>
      <div className="func-page">
        <div className="approvals-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <h1 className="approvals-title">Gestion de funcionarios</h1>
            <p className="approvals-subtitle">Administra el acceso del personal de tu comercio.</p>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo funcionario
          </Button>
        </div>
        {esAdmin && (
          <div className="func-tabs">
            <button className={`func-tab ${tab === 'funcionarios' ? 'active' : ''}`} onClick={() => setTab('funcionarios')}>Funcionarios ({funcionarios.length})</button>
            <button className={`func-tab ${tab === 'admins' ? 'active' : ''}`} onClick={() => setTab('admins')}>Administradores ({admins.length})</button>
          </div>
        )}
        {esAdmin && tab === 'admins' ? (
          <>
            <div className="func-stats">
              <div className="func-stat">
                <span className="func-stat-number">{admins.length}</span>
                <span className="func-stat-label">Total</span>
              </div>
              <div className="func-stat">
                <span className="func-stat-number">{admins.filter((a) => a.activo).length}</span>
                <span className="func-stat-label">Activos</span>
              </div>
              <div className="func-stat">
                <span className="func-stat-number">{admins.filter((a) => !a.activo).length}</span>
                <span className="func-stat-label">Inactivos</span>
              </div>
            </div>
            <div className="func-card">
              <div className="func-card-header">
                <h3>Administradores del sistema</h3>
              </div>
              <div className="func-table-wrap">
                <table className="func-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 && (
                      <tr><td colSpan="3" style={{textAlign:'center',padding:40,color:'#888'}}>No hay administradores.</td></tr>
                    )}
                    {admins.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <div className="func-name">
                            <span className="func-avatar">{a.nombre?.charAt(0)?.toUpperCase() || '?'}</span>
                            {a.nombre}
                          </div>
                        </td>
                        <td>{a.email}</td>
                        <td><span className={`badge badge--${a.activo ? 'active' : 'inactive'}`}>{a.activo ? 'Activo' : 'Inactivo'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <FuncionariosPanel />
        )}

        <Modal open={showCreate} onClose={() => setShowCreate(false)} className="funcionarios-modal">
          <div>
            <h2>Nuevo funcionario</h2>
            <form onSubmit={handleCreate} noValidate>
              <div className="field-grid">
                <Field label="Nombre" name="nombre" value={form.nombre} error={errors.nombre} onChange={updateField} />
                <Field label="Email" name="email" type="email" value={form.email} error={errors.email} onChange={updateField} />
                {(esAdmin || comercios.length > 0) && (
                  <label className="field">
                    <span>Comercio</span>
                    {loadingComercios ? <span className="spinner" style={{marginTop:8}} /> : (
                      <select name="comercioId" value={form.comercioId || ''} onChange={updateField}>
                        <option value="">Seleccionar comercio...</option>
                        {comercios.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
                      </select>
                    )}
                    {errors.comercioId && <small>{errors.comercioId}</small>}
                  </label>
                )}
                <label className="field">
                  <span>Rol</span>
                  <select name="rolId" value={form.rolId} onChange={updateField}>
                    {FUNCIONARIO_ROLES.filter((r) => esAdmin ? true : r.id === userRol).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                  {errors.rolId && <small>{errors.rolId}</small>}
                </label>
              </div>
              {errors.submit && <p className="submit-error">{errors.submit}</p>}
              <div className="funcionarios-modal-actions">
                <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={status==='submitting'}>
                  {status==='submitting' ? 'Creando...' : 'Crear funcionario'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {ultimoCreado && (
          <Modal open={true} onClose={() => window.location.reload()}>
            <div>
              <h2 style={{margin:'0 0 20px',fontSize:20,color:'#000'}}>Funcionario creado</h2>
              <p style={{margin:'0 0 12px',color:'#555',lineHeight:1.6}}>
                <strong>{ultimoCreado?.usuario?.nombre}</strong> ({ultimoCreado?.usuario?.email}) registrado.
              </p>
              <div style={{padding:16,background:'#f5f5f5',borderRadius:12,marginBottom:16}}>
                <p style={{margin:'0 0 8px',fontSize:13,color:'#888',fontWeight:700}}>CONTRASENA TEMPORAL</p>
                <p style={{margin:0,fontSize:18,fontWeight:700,color:'#000',fontFamily:'monospace'}}>
                  {ultimoCreado?.passwordTemporal}
                </p>
              </div>
              <p style={{margin:'0 0 20px',fontSize:13,color:'#b42318'}}>Compartela solo una vez.</p>
              <Button variant="primary" onClick={() => window.location.reload()}>Cerrar</Button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  )
}

export default FuncionariosPage
