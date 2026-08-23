import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FuncionariosPage } from '../features/funcionarios/pages/FuncionariosPage'
import { useFuncionarios } from '../hooks/useFuncionarios'
import { ROLE_IDS } from '../constants'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  authFetch: vi.fn(),
}))

vi.mock('../shared/context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }),
}))

import { useAuth } from '../features/auth/context/AuthContext'
import { authFetch } from '../shared/utils/api'

const API_BASE = 'https://openpaw.alwaysdata.net/api'

/* DTO de Usuario listado (Sprint 1 - Tarea 9): campos del wireframe de
   Funcionarios (IdCorporativo, Especialidad, Sede, Estado, ComercioNombre). */
function funcionario(overrides = {}) {
  return {
    id: 1,
    nombre: 'Dra. Elena Vargas',
    email: 'elena.vargas@openpaw.dev',
    rolId: ROLE_IDS.VETERINARIA,
    rolNombre: 'Veterinaria',
    activo: true,
    veterinariaId: 1,
    almacenId: null,
    comercioNombre: 'Vet Central',
    idCorporativo: 'OP-VET-0042',
    especialidad: 'Cirugía General',
    sede: 'Sede Norte',
    estado: 'Activo',
    ...overrides,
  }
}

function admin(overrides = {}) {
  return {
    id: 10,
    nombre: 'Ana Admin',
    email: 'ana@openpaw.dev',
    rolId: ROLE_IDS.ADMINISTRADOR,
    rolNombre: 'Administrador',
    activo: true,
    veterinariaId: null,
    almacenId: null,
    idCorporativo: 'OP-ADM-0001',
    ...overrides,
  }
}

/* Mock del API por URL + metodo (mismo patron que ServiciosVeterinariaPage.test).
   createFail: simula un POST /usuarios/funcionarios con error (ej. email duplicado). */
function mockApi({ usuarios = [], info = {}, createFail = null } = {}) {
  authFetch.mockImplementation(async (url, options = {}) => {
    const method = options.method || 'GET'
    if (url.includes('/usuarios/me/veterinaria-info')) {
      return { ok: true, json: async () => ({ ...info }) }
    }
    if (method === 'POST' && url.includes('/usuarios/funcionarios')) {
      if (createFail) {
        return { ok: false, status: createFail.status, json: async () => ({ mensaje: createFail.mensaje }) }
      }
      return {
        ok: true,
        json: async () => ({
          usuario: { id: 99, nombre: 'Nuevo Staff', email: 'nuevo@openpaw.dev', rolId: ROLE_IDS.ALMACEN },
          passwordTemporal: 'T3mp0r4l!',
        }),
      }
    }
    if (method === 'PUT' && url.includes('/rol')) {
      return { ok: true, json: async () => ({}) }
    }
    if (method === 'PUT' && url.includes('/reactivar')) {
      return { ok: true, json: async () => ({}) }
    }
    if (method === 'DELETE' && url.includes('/usuarios/')) {
      return { ok: true, status: 204, json: async () => ({}) }
    }
    if (url.includes('/veterinarias')) {
      return { ok: true, json: async () => [] }
    }
    if (url.includes('/almacenes')) {
      return { ok: true, json: async () => [] }
    }
    if (url.includes('/usuarios')) {
      return { ok: true, json: async () => usuarios }
    }
    return { ok: false, json: async () => ({}) }
  })
}

function renderFuncionarios(user, initialEntries = ['/dashboard/funcionarios']) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <FuncionariosPage />
    </MemoryRouter>
  )
}

const adminUser = { nombre: 'Ana Admin', sub: '10', rolId: ROLE_IDS.ADMINISTRADOR }
const vetUser = { nombre: 'David', sub: '5', rolId: ROLE_IDS.VETERINARIA }

function makeUsuarios(n, base = {}) {
  return Array.from({ length: n }, (_, i) =>
    funcionario({
      id: i + 1,
      nombre: `Funcionario ${i + 1}`,
      email: `f${i + 1}@openpaw.dev`,
      idCorporativo: `OP-VET-${String(i + 1).padStart(4, '0')}`,
      ...base,
    })
  )
}

describe('FuncionariosPage - rediseno tabla con buscador, filtros rol y paginacion (T32)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header "Funcionarios", kicker, boton Nuevo Funcionario y stats bento', async () => {
    mockApi({ usuarios: [funcionario(), funcionario({ id: 2, rolId: ROLE_IDS.ALMACEN, activo: false, estado: 'Inactivo' })] })
    renderFuncionarios(adminUser)

    expect(await screen.findByRole('heading', { level: 1, name: 'Funcionarios' })).toBeInTheDocument()
    expect(screen.getByText('Gestión Humana')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nuevo Funcionario/ })).toBeInTheDocument()

    const stats = screen.getByRole('group', { name: 'Resumen de funcionarios' })
    expect(within(stats).getByText('Personal Activo')).toBeInTheDocument()
    expect(within(stats).getByText('Personal Médico')).toBeInTheDocument()
    expect(within(stats).getByText('Soporte y Admin')).toBeInTheDocument()
    // 2 funcionarios: 1 activo, 1 medico (rol 2), 1 soporte (rol 3)
    expect(within(stats).getAllByText('1')).toHaveLength(3)
  })

  test('tabla con las columnas del wireframe y datos del DTO (ID corporativo, especialidad, sede, estado)', async () => {
    mockApi({ usuarios: [funcionario()] })
    renderFuncionarios(adminUser)

    const table = await screen.findByRole('table', { name: 'Lista de funcionarios' })
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['Funcionario', 'Rol / Especialidad', 'Ubicación', 'Estado', 'Acciones'])

    expect(screen.getByText('Dra. Elena Vargas')).toBeInTheDocument()
    expect(screen.getByText('OP-VET-0042')).toBeInTheDocument()
    expect(screen.getByText('Cirugía General')).toBeInTheDocument()
    expect(screen.getByText('Sede Norte')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    // select de rol (admin) con aria-label por fila
    expect(screen.getByLabelText('Cambiar rol de Dra. Elena Vargas')).toBeInTheDocument()
    // accion desactivar
    expect(screen.getByRole('button', { name: 'Desactivar Dra. Elena Vargas' })).toBeInTheDocument()
  })

  test('estado Vacaciones se muestra como badge de advertencia', async () => {
    mockApi({ usuarios: [funcionario({ estado: 'Vacaciones' })] })
    renderFuncionarios(adminUser)

    expect(await screen.findByText('Vacaciones')).toBeInTheDocument()
  })

  test('el buscador filtra por texto (nombre / ID corporativo) y se puede limpiar', async () => {
    mockApi({ usuarios: [funcionario(), funcionario({ id: 2, nombre: 'Carlos Mendoza', idCorporativo: 'OP-ALM-0105', rolId: ROLE_IDS.ALMACEN })] })
    renderFuncionarios(adminUser)

    await screen.findByText('Dra. Elena Vargas')

    const search = screen.getByRole('searchbox', { name: 'Buscar funcionario' })
    fireEvent.change(search, { target: { value: 'OP-ALM-0105' } })

    expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument()
    expect(screen.queryByText('Dra. Elena Vargas')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar busqueda' }))
    expect(screen.getByText('Dra. Elena Vargas')).toBeInTheDocument()
  })

  test('los chips de rol filtran la tabla', async () => {
    mockApi({
      usuarios: [
        funcionario({ id: 1, nombre: 'Vet Uno', rolId: ROLE_IDS.VETERINARIA }),
        funcionario({ id: 2, nombre: 'Alm Dos', rolId: ROLE_IDS.ALMACEN }),
      ],
    })
    renderFuncionarios(adminUser)

    await screen.findByText('Vet Uno')

    fireEvent.click(screen.getByRole('button', { name: 'Almacen' }))

    expect(screen.getByText('Alm Dos')).toBeInTheDocument()
    expect(screen.queryByText('Vet Uno')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(screen.getByText('Vet Uno')).toBeInTheDocument()
  })

  test('paginacion: "Mostrando 1-8 de N" y navegacion a la pagina 2', async () => {
    mockApi({ usuarios: makeUsuarios(10) })
    renderFuncionarios(adminUser)

    const pagination = await screen.findByRole('navigation', { name: 'Paginación' })
    expect(within(pagination).getByText('Mostrando 1-8 de 10')).toBeInTheDocument()
    // pagina 1: primeros 8
    expect(screen.getByText('Funcionario 1')).toBeInTheDocument()
    expect(screen.queryByText('Funcionario 9')).not.toBeInTheDocument()

    fireEvent.click(within(pagination).getByRole('button', { name: '2' }))

    expect(await within(pagination).findByText('Mostrando 9-10 de 10')).toBeInTheDocument()
    expect(screen.getByText('Funcionario 9')).toBeInTheDocument()
    expect(screen.queryByText('Funcionario 1')).not.toBeInTheDocument()
  })

  test('cambio de rol conserva el PUT /usuarios/{id}/rol', async () => {
    mockApi({ usuarios: [funcionario()] })
    renderFuncionarios(adminUser)

    await screen.findByText('Dra. Elena Vargas')
    fireEvent.change(screen.getByLabelText('Cambiar rol de Dra. Elena Vargas'), { target: { value: String(ROLE_IDS.ALMACEN) } })

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/usuarios/1/rol`,
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"rolId":3'),
        })
      )
    })
  })

  test('desactivar conserva el DELETE /usuarios/{id}', async () => {
    mockApi({ usuarios: [funcionario()] })
    renderFuncionarios(adminUser)

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Dra. Elena Vargas' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(`${API_BASE}/usuarios/1`, { method: 'DELETE' })
    })
  })

  test('reactivar conserva el PUT /usuarios/{id}/reactivar', async () => {
    mockApi({ usuarios: [funcionario({ activo: false, estado: 'Inactivo' })] })
    renderFuncionarios(adminUser)

    fireEvent.click(await screen.findByRole('button', { name: 'Reactivar Dra. Elena Vargas' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(`${API_BASE}/usuarios/1/reactivar`, { method: 'PUT' })
    })
  })

  test('modal crear conserva el POST /usuarios/funcionarios y muestra la contrasena temporal', async () => {
    mockApi({ usuarios: [funcionario()] })
    renderFuncionarios(adminUser)

    fireEvent.click(await screen.findByRole('button', { name: /Nuevo Funcionario/ }))
    expect(screen.getByRole('heading', { name: 'Nuevo funcionario' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo Staff' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nuevo@openpaw.dev' } })
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: String(ROLE_IDS.ALMACEN) } })

    fireEvent.click(screen.getByRole('button', { name: 'Crear funcionario' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/usuarios/funcionarios`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"nombre":"Nuevo Staff"'),
        })
      )
    })
    const body = authFetch.mock.calls.find(([, opts]) => opts?.method === 'POST')?.[1]?.body
    expect(body).toContain('"rolId":3')

    expect(await screen.findByText('CONTRASEÑA TEMPORAL')).toBeInTheDocument()
    expect(screen.getByText('T3mp0r4l!')).toBeInTheDocument()
    // M1: tras el alta exitosa el modal de creacion se cierra
    expect(screen.queryByRole('heading', { name: 'Nuevo funcionario' })).not.toBeInTheDocument()
  })

  test('M1: un POST 400 no cierra el modal y muestra el error del servidor', async () => {
    mockApi({ usuarios: [funcionario()], createFail: { status: 400, mensaje: 'El email ya está registrado.' } })
    renderFuncionarios(adminUser)

    fireEvent.click(await screen.findByRole('button', { name: /Nuevo Funcionario/ }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo Staff' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dup@openpaw.dev' } })
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: String(ROLE_IDS.ALMACEN) } })

    fireEvent.click(screen.getByRole('button', { name: 'Crear funcionario' }))

    // el error del servidor se muestra dentro del modal
    expect(await screen.findByText('El email ya está registrado.')).toBeInTheDocument()
    // el modal de creacion permanece abierto
    expect(screen.getByRole('heading', { name: 'Nuevo funcionario' })).toBeInTheDocument()
    // no aparece el modal de contrasena temporal
    expect(screen.queryByText('CONTRASEÑA TEMPORAL')).not.toBeInTheDocument()
  })

  test('empty state sin funcionarios', async () => {
    mockApi({ usuarios: [] })
    renderFuncionarios(adminUser)

    expect(await screen.findByText('Sin funcionarios')).toBeInTheDocument()
  })

  test('empty state con busqueda sin coincidencias', async () => {
    mockApi({ usuarios: [funcionario()] })
    renderFuncionarios(adminUser)

    await screen.findByText('Dra. Elena Vargas')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar funcionario' }), { target: { value: 'zzzz' } })

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
  })

  test('tab de Administradores (solo admin) muestra la tabla de admins', async () => {
    mockApi({ usuarios: [funcionario(), admin()] })
    renderFuncionarios(adminUser)

    fireEvent.click(await screen.findByRole('tab', { name: /Administradores/ }))

    const adminsTable = screen.getByRole('table', { name: 'Lista de administradores' })
    expect(within(adminsTable).getByText('Ana Admin')).toBeInTheDocument()
    expect(within(adminsTable).getByText('ana@openpaw.dev')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Funcionarios/ }))
    expect(screen.getByRole('table', { name: 'Lista de funcionarios' })).toBeInTheDocument()
  })

  test('no-admin: sin tabs, rol como texto (sin select) y consulta por su veterinaria', async () => {
    mockApi({
      usuarios: [funcionario({ veterinariaId: 5 })],
      info: { veterinariaId: 5 },
    })
    renderFuncionarios(vetUser)

    expect(await screen.findByText('Dra. Elena Vargas')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Cambiar rol de Dra. Elena Vargas')).not.toBeInTheDocument()
    // M2: no-admin tampoco ve el boton desactivar/reactivar
    expect(screen.queryByRole('button', { name: /Desactivar|Reactivar/ })).not.toBeInTheDocument()
    // rol como texto dentro de la tabla (sin select)
    expect(within(screen.getByRole('table', { name: 'Lista de funcionarios' })).getByText('Veterinaria')).toBeInTheDocument()

    const urls = authFetch.mock.calls.map(([url]) => url)
    expect(urls.some((u) => u.includes('/usuarios?') && u.includes('veterinariaId=5'))).toBe(true)
  })

  test('M3: no-admin conserva comercioId entre altas consecutivas', async () => {
    mockApi({ usuarios: [], info: { veterinariaId: 5 } })

    const api = {}
    function Harness() {
      const { form, setValue, crearFuncionario } = useFuncionarios()
      api.form = form
      api.setValue = setValue
      api.crearFuncionario = crearFuncionario
      return <div data-testid="harness" />
    }

    render(
      <MemoryRouter initialEntries={['/dashboard/funcionarios']}>
        <Harness />
      </MemoryRouter>
    )

    // el effect de carga (no-admin) vincula el comercio del usuario al form
    await waitFor(() => expect(api.form.comercioId).toBe(5))

    const submitEvent = { preventDefault: () => {} }
    for (let i = 1; i <= 2; i++) {
      act(() => api.setValue('nombre', `Juan ${i}`))
      act(() => api.setValue('email', `juan${i}@openpaw.dev`))
      const creado = await api.crearFuncionario(submitEvent)
      expect(creado).toBe(true)
    }

    const postsFuncionario = authFetch.mock.calls.filter(
      ([url, opts]) => opts?.method === 'POST' && url.includes('/usuarios/funcionarios')
    )
    expect(postsFuncionario).toHaveLength(2)
    // M3: ambos altas conservan el comercioId del no-admin (reset lo preserva)
    postsFuncionario.forEach(([, opts]) => {
      expect(opts.body).toContain('"comercioId":5')
    })
  })
})