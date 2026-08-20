import { useState, Fragment } from 'react'
import { Field } from '../../../shared/components/Field/Field'
import { Button } from '../../../shared/components/Button/Button'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Modal } from '../../../shared/components/Modal/Modal'
import { useFuncionarios } from '../../../hooks/useFuncionarios'
import { FUNCIONARIO_ROLES, ROLE_IDS } from '../../../constants'
import { useAuth } from '../../auth/context/AuthContext'

function rolNombre(rolId) {
  return FUNCIONARIO_ROLES.find((rol) => rol.id === rolId)?.nombre ?? rolId
}

export function FuncionariosPanel() {
  const { user } = useAuth()
  const userId = Number(user?.sub ?? user?.id)
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esAdmin = userRol === ROLE_IDS.ADMINISTRADOR
  const esPropietario = (id) => Number(id) === userId

  const {
    funcionarios, listStatus, listError,
    form, errors, status, ultimoCreado,
    updateField, crearFuncionario, cambiarRol, alternarActivo,
  } = useFuncionarios()

  const [rowError, setRowError] = useState(null)

  const comercioGroups = {}
  funcionarios.forEach((f) => {
    const key = f.comercioNombre || 'Sin comercio'
    if (!comercioGroups[key]) comercioGroups[key] = []
    comercioGroups[key].push(f)
  })
  const grupos = Object.entries(comercioGroups).sort(([a], [b]) => a.localeCompare(b))

  const handleCambiarRol = async (funcionario, event) => {
    setRowError(null)
    try {
      await cambiarRol(funcionario.id, Number(event.target.value))
    } catch (error) {
      setRowError(error.message)
    }
  }

  const handleAlternarActivo = async (funcionario) => {
    setRowError(null)
    try {
      await alternarActivo(funcionario)
    } catch (error) {
      setRowError(error.message)
    }
  }

  const activeCount = funcionarios.filter((f) => f.activo).length
  const inactiveCount = funcionarios.filter((f) => !f.activo).length

  return (
    <div className="func-panel">
      <div className="func-stats">
        <div className="func-stat">
          <span className="func-stat-number">{funcionarios.length}</span>
          <span className="func-stat-label">Total</span>
        </div>
        <div className="func-stat">
          <span className="func-stat-number">{activeCount}</span>
          <span className="func-stat-label">Activos</span>
        </div>
        <div className="func-stat">
          <span className="func-stat-number">{inactiveCount}</span>
          <span className="func-stat-label">Inactivos</span>
        </div>
      </div>

      <Modal open={!!ultimoCreado} onClose={() => {}}>
        <div className="modal-form">
          <h2 style={{ margin: '0 0 20px', fontSize: 20, color: '#000' }}>Funcionario creado</h2>
          <p style={{ margin: '0 0 12px', color: '#555', lineHeight: 1.6 }}>
            <strong>{ultimoCreado?.usuario?.nombre}</strong> ({ultimoCreado?.usuario?.email}) fue registrado como {rolNombre(ultimoCreado?.usuario?.rolId)}.
          </p>
          <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 12, marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#888', fontWeight: 700 }}>CONTRASEÑA TEMPORAL</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#000', fontFamily: 'monospace' }}>
              {ultimoCreado?.passwordTemporal}
            </p>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#b42318' }}>
            Compártela solo una vez. No se volverá a mostrar.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {rowError && <p className="submit-error">{rowError}</p>}

      {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}
      {listStatus === 'error' && <p className="submit-error">{listError}</p>}

      {listStatus === 'loaded' && (
        <div className="func-card">
          <div className="func-card-header">
            <h3>{esAdmin ? 'Funcionarios por comercio' : 'Funcionarios de tu comercio'}</h3>
          </div>
          <div className="func-table-wrap">
            <table className="func-table">
              <thead>
                <tr>
                  <th>Funcionario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                      No hay funcionarios registrados.
                    </td>
                  </tr>
                )}
                {esAdmin ? (
                  grupos.map(([comercio, miembros]) => (
                    <Fragment key={comercio}>
                      <tr className="func-group-row">
                        <td colSpan={5}><strong>{comercio}</strong> ({miembros.length})</td>
                      </tr>
                      {miembros.map((funcionario) => (
                          <tr key={funcionario.id}>
                          <td>
                            <div className="func-name">
                              <span className="func-avatar">
                                {funcionario.nombre?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                              {funcionario.nombre}
                              {esPropietario(funcionario.id) && <span className="owner-badge">Propietario</span>}
                            </div>
                          </td>
                          <td>{funcionario.email}</td>
                          <td>
                            <select value={funcionario.rolId} onChange={(event) => handleCambiarRol(funcionario, event)}>
                              {FUNCIONARIO_ROLES.filter((r) => esAdmin ? true : r.id === userRol).map((rol) => (
                                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <Badge variant={funcionario.activo ? 'active' : 'inactive'}>
                              {funcionario.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td>
                            <div className="func-actions">
                              <button type="button" onClick={() => handleAlternarActivo(funcionario)}>
                                {funcionario.activo ? 'Desactivar' : 'Reactivar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))
                ) : (
                  funcionarios.map((funcionario) => (
                    <tr key={funcionario.id}>
                      <td>
                        <div className="func-name">
                          <span className="func-avatar">
                            {funcionario.nombre?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                          {funcionario.nombre}
                          {esPropietario(funcionario.id) && <span className="owner-badge">Propietario</span>}
                        </div>
                      </td>
                      <td>{funcionario.email}</td>
                      <td>
                        <select value={funcionario.rolId} onChange={(event) => handleCambiarRol(funcionario, event)}>
                          {FUNCIONARIO_ROLES.filter((r) => esAdmin ? true : r.id === userRol).map((rol) => (
                            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Badge variant={funcionario.activo ? 'active' : 'inactive'}>
                          {funcionario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td>
                        <div className="func-actions">
                          <button type="button" onClick={() => handleAlternarActivo(funcionario)}>
                            {funcionario.activo ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
