import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { Pagination } from '../../../shared/components/Pagination/Pagination'
import { EmptyState } from '../../../shared/components/EmptyState'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { FuncionariosPanel } from '../components/FuncionariosPanel'
import { useFuncionarios } from '../../../hooks/useFuncionarios'
import { FUNCIONARIO_ROLES, ROLE_IDS, API_BASE_URL } from '../../../constants'
import { useAuth } from '../../auth/context/AuthContext'
import { authFetch } from '../../../shared/utils/api'
import './FuncionariosPage.css'

const PAGE_SIZE = 8

/* ---------------------------------------------------------------------------
   Stat bento (wireframe funcionarios_openpaw): Personal Activo | Personal
   Medico | Soporte y Admin con icono en circulo tintado.
   --------------------------------------------------------------------------- */
function StatCard({ label, value, icon, tone, filled = false }) {
  return (
    <div className={`func-stat func-stat--${tone}`}>
      <div className="func-stat__text">
        <p className="func-stat__label">{label}</p>
        <p className="func-stat__value">{value}</p>
      </div>
      <span className="func-stat__icon" aria-hidden="true">
        <Icon name={icon} size={24} filled={filled} />
      </span>
    </div>
  )
}

function iniciales(nombre) {
  const partes = String(nombre ?? '?').trim().split(/\s+/).slice(0, 2)
  const siglas = partes.map((p) => p[0]?.toUpperCase() ?? '').join('')
  return siglas || '?'
}

export function FuncionariosPage() {
  const { user } = useAuth()
  const location = useLocation()
  const userRol = Number(user?.rolId ?? user?.rol ?? user?.role)
  const esAdmin = userRol === ROLE_IDS.ADMINISTRADOR
  const userId = Number(user?.sub ?? user?.id)

  const [tab, setTab] = useState('funcionarios')
  const [showCreate, setShowCreate] = useState(location.state?.openCreate === true)
  const [comercios, setComercios] = useState([])
  const [loadingComercios, setLoadingComercios] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [rolFilter, setRolFilter] = useState(null)
  const [page, setPage] = useState(1)
  const [rowError, setRowError] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const {
    funcionarios, admins, listStatus, listError,
    form, errors, status, ultimoCreado,
    updateField, crearFuncionario, cambiarRol, alternarActivo,
  } = useFuncionarios()

  /* Comercios para el select del modal de creacion (solo admin).
     Deuda #82: keys/values compuestos vet-{id} / alm-{id} para evitar colision
     entre veterinarias (ids 1-4) y almacenes (ids 2,3). El backend distingue
     por tipoComercio + comercioId (ver useFuncionarios + CrearFuncionarioDto). */
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
        ...(Array.isArray(vets) ? vets.map((v) => ({ id: v.id, nombre: v.nombre, tipo: 'Veterinaria', value: `vet-${v.id}` })) : []),
        ...(Array.isArray(stores) ? stores.map((s) => ({ id: s.id, nombre: s.nombre, tipo: 'Almacen', value: `alm-${s.id}` })) : []),
      ]
      setComercios(items)
      setLoadingComercios(false)
    }
    load()
    return () => { cancelled = true }
  }, [esAdmin])

  /* Reseteo de pagina al cambiar busqueda, filtro o seccion (en handlers,
     sin setState sincrono en effects — regla react-hooks/set-state-in-effect). */
  const resetPage = () => setPage(1)

  const buscando = searchTerm.trim() !== ''

  /* Filtro combinado: rol (chips) + texto (nombre, email, ID, rol, especialidad, sede...). */
  const filtrados = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return funcionarios.filter((f) => {
      if (rolFilter !== null && Number(f.rolId) !== Number(rolFilter)) return false
      if (!q) return true
      const hay = (v) => (v ?? '').toString().toLowerCase().includes(q)
      const rol = FUNCIONARIO_ROLES.find((r) => Number(r.id) === Number(f.rolId))?.nombre ?? ''
      return (
        hay(f.nombre) || hay(f.email) || hay(f.id) || hay(f.idCorporativo) ||
        hay(rol) || hay(f.especialidad) || hay(f.sede) || hay(f.comercioNombre) || hay(f.estado)
      )
    })
  }, [funcionarios, searchTerm, rolFilter])

  /* Pagina derivada: clamp al rango valido [1, totalPages] sin effects. */
  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const pageItems = useMemo(
    () => filtrados.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtrados, safePage]
  )

  const activos = funcionarios.filter((f) => f.activo).length
  const medicos = funcionarios.filter((f) => Number(f.rolId) === ROLE_IDS.VETERINARIA).length
  const soporte = funcionarios.filter((f) => Number(f.rolId) === ROLE_IDS.ALMACEN).length

  const rolChips = [{ id: null, nombre: 'Todos' }, ...FUNCIONARIO_ROLES]
  const sinResultados = listStatus === 'loaded' && filtrados.length === 0

  const handleCreate = async (e) => {
    e.preventDefault()
    // M1 (QA): crearFuncionario resuelve true solo si el alta fue exitosa.
    // Con error (400 / validacion) el modal permanece abierto mostrando errors.submit.
    const creado = await crearFuncionario(e)
    if (creado) setShowCreate(false)
  }

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
    setTogglingId(funcionario.id)
    try {
      await alternarActivo(funcionario)
    } catch (error) {
      setRowError(error.message)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <AppShell>
      <div className="func-page">
        {/* ------------------------------------------------------------ header */}
        <header className="func-header">
          <div>
            <div className="func-kicker">
              <span className="func-kicker__dash" aria-hidden="true" />
              Gestión Humana
            </div>
            <h1 className="func-title">Funcionarios</h1>
            <p className="func-subtitle">
              Administre el personal médico y administrativo de la red OpenPaw.
              Monitoree capacidades y roles de forma unificada.
            </p>
          </div>
          <Button variant="primary" size="md" icon="add" onClick={() => setShowCreate(true)}>
            Nuevo Funcionario
          </Button>
        </header>

        {/* ---------------------------------------------------------- stats */}
        <div className="func-stats" role="group" aria-label="Resumen de funcionarios">
          <StatCard label="Personal Activo" value={activos} icon="group" tone="activos" />
          <StatCard label="Personal Médico" value={medicos} icon="stethoscope" tone="medicos" filled />
          <StatCard label="Soporte y Admin" value={soporte} icon="admin_panel_settings" tone="soporte" />
        </div>

        {/* --------------------------------------------- tabs (solo admin) */}
        {esAdmin && (
          <div className="func-tabs" role="tablist" aria-label="Secciones de funcionarios">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'funcionarios'}
              className={`func-tab ${tab === 'funcionarios' ? 'is-active' : ''}`.trim()}
              onClick={() => { setTab('funcionarios'); resetPage() }}
            >
              Funcionarios <span className="func-tab__count">{funcionarios.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'admins'}
              className={`func-tab ${tab === 'admins' ? 'is-active' : ''}`.trim()}
              onClick={() => { setTab('admins'); resetPage() }}
            >
              Administradores <span className="func-tab__count">{admins.length}</span>
            </button>
          </div>
        )}

        {esAdmin && tab === 'admins' ? (
          /* ------------------------------------------------- tab admins */
          <section className="func-card" aria-label="Administradores del sistema">
            <div className="func-card-header">
              <h3>Administradores del sistema</h3>
            </div>
            <div className="func-table-wrap">
              <table className="func-table" aria-label="Lista de administradores">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Email</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={3} className="func-empty-row">No hay administradores.</td>
                    </tr>
                  )}
                  {admins.map((a) => (
                    <tr key={a.id} className="func-row">
                      <td>
                        <div className="func-name">
                          <span className="func-avatar" aria-hidden="true">{iniciales(a.nombre)}</span>
                          <span className="func-name__nombre">{a.nombre}</span>
                        </div>
                      </td>
                      <td>{a.email}</td>
                      <td>
                        <Badge variant={a.activo ? 'active' : 'inactive'} dot>
                          {a.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          /* --------------------------------------------------- funcionarios */
          <>
            <div className="func-filters">
              <div className="func-chips" role="group" aria-label="Filtrar por rol">
                {rolChips.map((chip) => (
                  <button
                    key={chip.id ?? 'todos'}
                    type="button"
                    className={`func-chip ${rolFilter === chip.id ? 'is-active' : ''}`.trim()}
                    aria-pressed={rolFilter === chip.id}
                    onClick={() => { setRolFilter(chip.id); resetPage() }}
                  >
                    {chip.nombre}
                  </button>
                ))}
              </div>
              <div className="func-search" role="search">
                <Icon name="search" size={20} className="func-search__icon" aria-hidden="true" />
                <input
                  type="search"
                  className="func-search__input"
                  placeholder="Buscar por nombre, ID o rol..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); resetPage() }}
                  aria-label="Buscar funcionario"
                />
                {buscando && (
                  <button
                    type="button"
                    className="func-search__clear"
                    title="Limpiar busqueda"
                    aria-label="Limpiar busqueda"
                    onClick={() => { setSearchTerm(''); resetPage() }}
                  >
                    <Icon name="close" size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {listStatus === 'loading' && (
              <div className="func-loading" role="status" aria-label="Cargando funcionarios">
                <span className="spinner" />
              </div>
            )}
            {listStatus === 'error' && <p className="submit-error">{listError}</p>}

            {sinResultados && (
              <EmptyState
                icon="group"
                title={buscando || rolFilter !== null ? 'Sin resultados' : 'Sin funcionarios'}
                description={
                  buscando || rolFilter !== null
                    ? 'No hay funcionarios que coincidan con el filtro actual. Prueba con otros términos o roles.'
                    : 'No hay funcionarios registrados todavía.'
                }
                action={
                  <Button variant="primary" icon="add" onClick={() => setShowCreate(true)}>
                    Nuevo Funcionario
                  </Button>
                }
              />
            )}

            {listStatus === 'loaded' && filtrados.length > 0 && (
              <section className="func-card">
                <FuncionariosPanel
                  items={pageItems}
                  esAdmin={esAdmin}
                  userId={userId}
                  togglingId={togglingId}
                  onCambiarRol={handleCambiarRol}
                  onAlternarActivo={handleAlternarActivo}
                />
                <div className="func-pagination">
                  <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtrados.length} onChange={setPage} />
                </div>
              </section>
            )}

            {rowError && <p className="submit-error">{rowError}</p>}
          </>
        )}

        {/* --------------------------------------------------- modal crear */}
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
                    {loadingComercios ? <span className="spinner" /> : (
                      <select name="comercioId" value={form.comercioId || ''} onChange={updateField} aria-label="Comercio">
                        <option value="">Seleccionar comercio...</option>
                        {comercios.filter((c) => c.tipo === 'Veterinaria').length > 0 && (
                          <optgroup label="Veterinarias">
                            {comercios.filter((c) => c.tipo === 'Veterinaria').map((c) => (
                              <option key={c.value} value={c.value}>{c.nombre}</option>
                            ))}
                          </optgroup>
                        )}
                        {comercios.filter((c) => c.tipo === 'Almacen').length > 0 && (
                          <optgroup label="Almacenes">
                            {comercios.filter((c) => c.tipo === 'Almacen').map((c) => (
                              <option key={c.value} value={c.value}>{c.nombre}</option>
                            ))}
                          </optgroup>
                        )}
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
                <Button variant="primary" type="submit" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Creando...' : 'Crear funcionario'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* ------------------------------------- modal contrasena temporal */}
        {ultimoCreado && (
          <Modal open onClose={() => window.location.reload()} className="funcionarios-modal">
            <div>
              <h2>Funcionario creado</h2>
              <p className="func-created-sub">
                <strong>{ultimoCreado?.usuario?.nombre}</strong> ({ultimoCreado?.usuario?.email}) registrado.
              </p>
              <div className="func-created-pass">
                <p className="func-created-pass__label">CONTRASEÑA TEMPORAL</p>
                <p className="func-created-pass__value">{ultimoCreado?.passwordTemporal}</p>
              </div>
              <p className="func-created-warn">Compártela solo una vez. No se volverá a mostrar.</p>
              <div className="funcionarios-modal-actions">
                <Button variant="primary" onClick={() => window.location.reload()}>Cerrar</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  )
}

export default FuncionariosPage