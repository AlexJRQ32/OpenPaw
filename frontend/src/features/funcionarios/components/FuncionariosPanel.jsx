import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { FUNCIONARIO_ROLES } from '../../../constants'

/* ---------------------------------------------------------------------------
   Helpers de presentacion. El DTO de Usuario (Sprint 1 - Tarea 9) ya trae los
   campos del wireframe de Funcionarios: IdCorporativo, Especialidad, Sede,
   Estado y ComercioNombre.
   --------------------------------------------------------------------------- */

function rolNombre(rolId) {
  return FUNCIONARIO_ROLES.find((rol) => Number(rol.id) === Number(rolId))?.nombre ?? rolId
}

/* Estado del wireframe (Activo | Vacaciones | Inactivo) con fallback al bool Activo. */
function estadoFuncionario(funcionario) {
  if (funcionario.estado) return funcionario.estado
  return funcionario.activo ? 'Activo' : 'Inactivo'
}

function estadoVariant(funcionario) {
  const estado = estadoFuncionario(funcionario)
  if (estado === 'Vacaciones') return 'warning'
  if (estado === 'Inactivo' || !funcionario.activo) return 'inactive'
  return 'active'
}

function iniciales(nombre) {
  const partes = String(nombre ?? '?').trim().split(/\s+/).slice(0, 2)
  const siglas = partes.map((p) => p[0]?.toUpperCase() ?? '').join('')
  return siglas || '?'
}

/* ---------------------------------------------------------------------------
   Tabla de funcionarios (wireframe funcionarios_openpaw):
     Funcionario (avatar + nombre + ID corporativo) | Rol / Especialidad |
     Ubicacion | Estado | Acciones (cambio de rol + activar/desactivar).
   Componente presentacional: los datos y handlers vienen de la pagina.
   --------------------------------------------------------------------------- */
export function FuncionariosPanel({ items, esAdmin, userId, togglingId, onCambiarRol, onAlternarActivo }) {
  if (!items || items.length === 0) return null

  const esPropietario = (id) => Number(id) === Number(userId)

  return (
    <div className="func-table-wrap">
      <table className="func-table" aria-label="Lista de funcionarios">
        <thead>
          <tr>
            <th scope="col">Funcionario</th>
            <th scope="col" className="func-col-rol">Rol / Especialidad</th>
            <th scope="col" className="func-col-ubic">Ubicación</th>
            <th scope="col">Estado</th>
            <th scope="col" className="func-th-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((funcionario) => {
            const activo = funcionario.activo
            const toggling = togglingId === funcionario.id
            return (
              <tr key={funcionario.id} className="func-row">
                <td>
                  <div className="func-name">
                    <span className="func-avatar" aria-hidden="true">
                      {iniciales(funcionario.nombre)}
                    </span>
                    <div className="func-name__text">
                      <p className="func-name__nombre">
                        {funcionario.nombre}
                        {esPropietario(funcionario.id) && <span className="owner-badge">Propietario</span>}
                      </p>
                      <p className="func-name__id">{funcionario.idCorporativo || `ID: ${funcionario.id}`}</p>
                    </div>
                  </div>
                </td>
                <td className="func-col-rol">
                  {esAdmin ? (
                    <select
                      className="func-rol-select"
                      value={funcionario.rolId}
                      aria-label={`Cambiar rol de ${funcionario.nombre}`}
                      onChange={(event) => onCambiarRol(funcionario, event)}
                    >
                      {FUNCIONARIO_ROLES.map((rol) => (
                        <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="func-rol-text">{rolNombre(funcionario.rolId)}</span>
                  )}
                  <p className="func-especialidad">{funcionario.especialidad || '—'}</p>
                </td>
                <td className="func-col-ubic">
                  <div className="func-ubic">
                    <Icon name="location_on" size={16} aria-hidden="true" />
                    <span>{funcionario.sede || funcionario.comercioNombre || '—'}</span>
                  </div>
                </td>
                <td>
                  <Badge variant={estadoVariant(funcionario)} dot>
                    {estadoFuncionario(funcionario)}
                  </Badge>
                </td>
                <td>
                  <div className="func-actions">
                    {/* M2 (QA): solo admin cambia roles Y desactiva/reactiva. */}
                    {esAdmin && (
                      <button
                        type="button"
                        className={`func-actions__btn ${activo ? '' : 'func-actions__btn--reactivar'}`.trim()}
                        title={activo ? 'Desactivar funcionario' : 'Reactivar funcionario'}
                        aria-label={`${activo ? 'Desactivar' : 'Reactivar'} ${funcionario.nombre}`}
                        disabled={toggling}
                        onClick={() => onAlternarActivo(funcionario)}
                      >
                        <Icon name={activo ? 'block' : 'check_circle'} size={18} filled={!activo} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}