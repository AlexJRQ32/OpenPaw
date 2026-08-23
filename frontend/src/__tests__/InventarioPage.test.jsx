/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { InventarioPage } from '../features/inventario/pages/InventarioPage'
import { inventarioACSV } from '../features/inventario/utils/exportarCSV'
import { escapeHtml, buildPopupHtml } from '../features/inventario/utils/popupMapa'
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

/* DTO de inventario (Sprint 1): producto y almacen embebidos con nombre,
   categoria, direccion; cantidad, stockMinimo, stockMaximo. */
function registro(overrides = {}) {
  return {
    id: 1,
    productoId: 1,
    producto: { id: 1, nombre: 'Amoxicilina 250mg', precio: 2500, categoria: 'Antibiótico' },
    almacenId: 1,
    almacen: { id: 1, nombre: 'Almacén Central A', direccion: 'San José, Costa Rica' },
    cantidad: 450,
    stockMinimo: 10,
    stockMaximo: 500,
    ...overrides,
  }
}

function adminUser() {
  return { nombre: 'Ana Admin', sub: '10', rolId: ROLE_IDS.ADMINISTRADOR }
}

function vetUser() {
  return { nombre: 'David', sub: '5', rolId: ROLE_IDS.VETERINARIA }
}

/* Mock del API por URL (mismo patron que FuncionariosPage.test). */
function mockApi({ inventario = [], productos = [], almacenes = [] } = {}) {
  authFetch.mockImplementation(async (url) => {
    if (url.includes('/inventario')) return { ok: true, json: async () => inventario }
    if (url.includes('/productos')) return { ok: true, json: async () => productos }
    if (url.includes('/almacenes')) return { ok: true, json: async () => almacenes }
    return { ok: false, json: async () => ({}) }
  })
}

function renderInventario(user, initialEntries = ['/dashboard/inventario']) {
  useAuth.mockReturnValue({ user, logout: vi.fn() })
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <InventarioPage />
    </MemoryRouter>
  )
}

function makeRegistros(n, base = {}) {
  return Array.from({ length: n }, (_, i) =>
    registro({
      id: i + 1,
      productoId: i + 1,
      producto: { id: i + 1, nombre: `Producto ${i + 1}`, precio: 1000, categoria: 'Consumibles' },
      ...base,
    })
  )
}

/* 8 con stock + 1 bajo + 1 agotado = 10 registros (donut 80/10/10).
   El primero es Amoxicilina (registro default) para las aserciones de tabla. */
function inventarioMixto() {
  const conStock = Array.from({ length: 7 }, (_, i) =>
    registro({
      id: i + 2,
      productoId: i + 2,
      producto: { id: i + 2, nombre: `Producto ${i + 2}`, precio: 1000, categoria: 'Consumibles' },
      cantidad: 100,
      stockMinimo: 10,
    })
  )
  return [
    registro(),
    ...conStock,
    registro({ id: 9, producto: { id: 9, nombre: 'Vacuna Antirrábica', categoria: 'Biológicos' }, cantidad: 5, stockMinimo: 10 }),
    registro({ id: 10, producto: { id: 10, nombre: 'Kit Sutura Catgut', categoria: 'Quirúrgico' }, cantidad: 0, stockMinimo: 2 }),
  ]
}

describe('InventarioPage - rediseno donut, mapa, exportar y paginacion (T34)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('header "Inventario", subtitulo y botones Exportar + Nuevo Producto', async () => {
    mockApi({ inventario: [registro()], almacenes: [{ id: 1, nombre: 'Almacén Central A' }] })
    renderInventario(adminUser())

    expect(await screen.findByRole('heading', { level: 1, name: 'Inventario' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nuevo Producto/ })).toBeInTheDocument()
  })

  test('stats bento: Total Productos, Stock Critico, Stock Bajo y En Stock', async () => {
    mockApi({ inventario: inventarioMixto(), almacenes: [{ id: 1, nombre: 'Almacén Central A' }] })
    renderInventario(adminUser())

    const stats = await screen.findByRole('group', { name: 'Resumen de inventario' })
    expect(within(stats).getByText('Total Productos')).toBeInTheDocument()
    expect(within(stats).getByText('Stock Crítico')).toBeInTheDocument()
    expect(within(stats).getByText('Stock Bajo')).toBeInTheDocument()
    expect(within(stats).getByText('En Stock')).toBeInTheDocument()
    // 10 registros: 8 ok, 1 bajo, 1 agotado
    expect(within(stats).getByText('10')).toBeInTheDocument()
    expect(within(stats).getByText('8')).toBeInTheDocument()
  })

  test('donut de distribucion: aria-label resumen + leyenda textual con %', async () => {
    mockApi({ inventario: inventarioMixto(), almacenes: [{ id: 1, nombre: 'Almacén Central A' }] })
    renderInventario(adminUser())

    // Contenedor del grafico con resumen para lectores de pantalla
    const donut = await screen.findByRole('img', { name: /Distribución de stock/ })
    expect(donut).toBeInTheDocument()

    // Leyenda textual (el color NO es el unico canal): "80%" aparece en el
    // centro del donut y en la leyenda; se verifican ambos dentro de la leyenda.
    const leyenda = donut.closest('.donut')
    expect(within(leyenda).getByText('En stock', { selector: '.donut__legend-label' })).toBeInTheDocument()
    expect(within(leyenda).getAllByText('80%')).toHaveLength(2) // centro + leyenda
    expect(within(leyenda).getAllByText('10%')).toHaveLength(2) // stock bajo + agotado
  })

  test('mapa Leaflet: contenedor role="img" con aria-label de almacenes', async () => {
    mockApi({
      inventario: [registro()],
      almacenes: [{ id: 1, nombre: 'Almacén Central A', direccion: 'San José, Costa Rica' }],
    })
    renderInventario(adminUser())

    const map = await screen.findByRole('img', { name: 'Mapa de ubicaciones de almacenamiento del inventario' })
    expect(map).toBeInTheDocument()
    // El caption con la ubicacion principal es visible (info textual accesible)
    expect(screen.getByText('Ubicación Principal')).toBeInTheDocument()
    expect(screen.getAllByText('Almacén Central A').length).toBeGreaterThan(0) // caption + fila de tabla
  })

  test('tabla con columnas del wireframe y datos (producto, categoria, ubicacion, estado)', async () => {
    mockApi({ inventario: inventarioMixto(), almacenes: [{ id: 1, nombre: 'Almacén Central A' }] })
    renderInventario(adminUser())

    const table = await screen.findByRole('table', { name: 'Lista de inventario' })
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['Producto', 'Categoría', 'Ubicación', 'Cantidad', 'Estado', 'Acciones'])

    expect(screen.getByText('Amoxicilina 250mg')).toBeInTheDocument()
    expect(screen.getByText('Antibiótico')).toBeInTheDocument()
    expect(screen.getAllByText('Almacén Central A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('En stock').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Stock bajo').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Agotado').length).toBeGreaterThan(0)
    // acciones por fila con aria-label
    expect(screen.getByRole('button', { name: 'Editar Amoxicilina 250mg' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar Amoxicilina 250mg' })).toBeInTheDocument()
  })

  test('chips de estado filtran la tabla y resetean la pagina', async () => {
    mockApi({ inventario: inventarioMixto(), almacenes: [{ id: 1, nombre: 'Almacén Central A' }] })
    renderInventario(adminUser())

    await screen.findByText('Amoxicilina 250mg')

    fireEvent.click(screen.getByRole('button', { name: /Agotados/ }))
    expect(screen.getByText('Kit Sutura Catgut')).toBeInTheDocument()
    expect(screen.queryByText('Amoxicilina 250mg')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Stock Bajo/ }))
    expect(screen.getByText('Vacuna Antirrábica')).toBeInTheDocument()
    expect(screen.queryByText('Kit Sutura Catgut')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Todos/ }))
    expect(screen.getByText('Amoxicilina 250mg')).toBeInTheDocument()
  })

  test('paginacion: "Mostrando 1-8 de N" y navegacion a la pagina 2', async () => {
    mockApi({ inventario: makeRegistros(10), almacenes: [{ id: 1, nombre: 'Almacén Central A' }] })
    renderInventario(adminUser())

    const pagination = await screen.findByRole('navigation', { name: 'Paginación' })
    expect(within(pagination).getByText('Mostrando 1-8 de 10')).toBeInTheDocument()
    expect(screen.getByText('Producto 1')).toBeInTheDocument()
    expect(screen.queryByText('Producto 9')).not.toBeInTheDocument()

    fireEvent.click(within(pagination).getByRole('button', { name: '2' }))

    expect(await within(pagination).findByText('Mostrando 9-10 de 10')).toBeInTheDocument()
    expect(screen.getByText('Producto 9')).toBeInTheDocument()
    expect(screen.queryByText('Producto 1')).not.toBeInTheDocument()
  })

  test('exportar descarga CSV con BOM, encabezados y filas (URL.createObjectURL mockeado)', async () => {
    mockApi({ inventario: inventarioMixto(), almacenes: [{ id: 1, nombre: 'Almacén Central A' }] })
    const createUrl = vi.fn(() => 'blob:inventario-test')
    const revokeUrl = vi.fn()
    URL.createObjectURL = createUrl
    URL.revokeObjectURL = revokeUrl
    renderInventario(adminUser())

    fireEvent.click(await screen.findByRole('button', { name: /Exportar/ }))

    expect(createUrl).toHaveBeenCalledTimes(1)
    // el revoke es diferido (setTimeout 100ms, fix Firefox QA T34)
    await waitFor(() => expect(revokeUrl).toHaveBeenCalledTimes(1))
  })

  test('inventarioACSV genera CSV con encabezados, estado y escape de comas', () => {
    const estadoStock = (item) => (item.cantidad === 0 ? { label: 'Agotado' } : { label: 'En stock' })
    const csv = inventarioACSV([
      registro({ producto: { nombre: 'Amoxicilina, 250mg', categoria: 'Antibiótico' } }),
      registro({ id: 2, cantidad: 0, producto: { nombre: 'Kit Sutura', categoria: 'Quirúrgico' } }),
    ], estadoStock)

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('Producto,Categoría,Almacén,Cantidad,Stock mínimo,Stock máximo,Estado')
    expect(csv).toContain('"Amoxicilina, 250mg"') // escape de comas
    expect(csv).toContain('Kit Sutura')
    expect(csv).toContain('Agotado')
  })

  test('modal crear conserva el POST /inventario', async () => {
    mockApi({
      inventario: [],
      productos: [{ id: 1, nombre: 'Amoxicilina 250mg' }, { id: 2, nombre: 'Vendas' }],
      almacenes: [{ id: 1, nombre: 'Almacén Central A' }],
    })
    renderInventario(adminUser())

    fireEvent.click(await screen.findByRole('button', { name: /Nuevo Producto/ }))
    expect(screen.getByRole('heading', { name: 'Nuevo registro de inventario' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Producto'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Almacen'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '25' } })
    fireEvent.change(screen.getByLabelText('Stock minimo'), { target: { value: '5' } })

    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/inventario`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"cantidad":25'),
        })
      )
    })
  })

  test('editar conserva el PUT /inventario/{id}', async () => {
    mockApi({
      inventario: [registro()],
      productos: [{ id: 1, nombre: 'Amoxicilina 250mg' }],
      almacenes: [{ id: 1, nombre: 'Almacén Central A' }],
    })
    renderInventario(adminUser())

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Amoxicilina 250mg' }))
    expect(screen.getByRole('heading', { name: 'Editar registro de inventario' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '300' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        `${API_BASE}/inventario/1`,
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"cantidad":300'),
        })
      )
    })
  })

  test('eliminar conserva el DELETE /inventario/{id}', async () => {
    mockApi({
      inventario: [registro()],
      productos: [{ id: 1, nombre: 'Amoxicilina 250mg' }],
      almacenes: [{ id: 1, nombre: 'Almacén Central A' }],
    })
    renderInventario(adminUser())

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar Amoxicilina 250mg' }))
    expect(screen.getByRole('heading', { name: '¿Eliminar registro de inventario?' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(`${API_BASE}/inventario/1`, { method: 'DELETE' })
    })
  })

  test('no-admin consulta /inventario/mios y /almacenes/mios', async () => {
    mockApi({
      inventario: [registro()],
      almacenes: [{ id: 1, nombre: 'Almacén Central A' }],
    })
    renderInventario(vetUser())

    expect(await screen.findByText('Amoxicilina 250mg')).toBeInTheDocument()
    const urls = authFetch.mock.calls.map(([url]) => url)
    expect(urls.some((u) => u.includes('/inventario/mios'))).toBe(true)
    expect(urls.some((u) => u.includes('/almacenes/mios'))).toBe(true)
  })

  test('empty state sin registros de inventario', async () => {
    mockApi({ inventario: [], productos: [], almacenes: [{ id: 1, nombre: 'Almacén Central A' }] })
    renderInventario(adminUser())

    expect(await screen.findByText('Sin registros de inventario')).toBeInTheDocument()
  })
})

/* ==========================================================================
   Seguridad (QA T34):
   - XSS stored en popup del mapa: escapeHtml + buildPopupHtml.
   - CSV formula injection (Excel): prefijo ' en valores que inician con = + - @.
   ========================================================================== */
describe('InventarioPage - seguridad (QA T34)', () => {
  test('escapeHtml escapa & < > " y apostrofo', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;')
    expect(escapeHtml('A & B')).toBe('A &amp; B')
    expect(escapeHtml('"comillas" y \'apostrofo\'')).toBe('&quot;comillas&quot; y &#39;apostrofo&#39;')
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  test('buildPopupHtml escapa nombre y direccion maliciosos (XSS stored)', () => {
    const html = buildPopupHtml([
      { id: 1, nombre: '<img src=x onerror=alert(1)>', direccion: '"><script>alert(2)</script>' },
    ])
    // El HTML generado NO contiene el payload crudo (que ejecutaria como tag)
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<script>alert(2)</script>')
    expect(html).not.toContain('"><script>')
    // Contiene la version escapada (texto plano seguro)
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&quot;&gt;&lt;script&gt;alert(2)&lt;/script&gt;')
  })

  test('buildPopupHtml con datos normales muestra nombre y direccion', () => {
    const html = buildPopupHtml([
      { id: 1, nombre: 'Almacén Central A', direccion: 'San José, Costa Rica' },
    ])
    expect(html).toContain('1 almacén')
    expect(html).toContain('Almacén Central A')
    expect(html).toContain('San José, Costa Rica')
  })

  test('inventarioACSV neutraliza formula injection (= + - @) con prefijo apostrofo', () => {
    const estadoStock = () => ({ label: 'En stock' })
    const csv = inventarioACSV([
      registro({ producto: { nombre: '=2+2', categoria: 'Antibiótico' } }),
      registro({ id: 2, producto: { nombre: '+SUM(A1:A2)', categoria: 'Consumibles' } }),
      registro({ id: 3, producto: { nombre: '-1+1', categoria: 'Consumibles' } }),
      registro({ id: 4, producto: { nombre: '@cmd', categoria: 'Consumibles' } }),
      registro({ id: 5, producto: { nombre: 'Amoxicilina 250mg', categoria: 'Antibiótico' } }),
    ], estadoStock)

    expect(csv).toContain("'=2+2")
    expect(csv).toContain("'+SUM(A1:A2)")
    expect(csv).toContain("'-1+1")
    expect(csv).toContain("'@cmd")
    // Un nombre normal NO se toca
    expect(csv).toContain('Amoxicilina 250mg')
  })

  test('el trend "12%" inventado ya no se muestra en el header de stats', async () => {
    mockApi({ inventario: [], productos: [], almacenes: [] })
    renderInventario(adminUser())

    expect(await screen.findByText('Total Productos')).toBeInTheDocument()
    expect(screen.queryByText('12%')).not.toBeInTheDocument()
  })
})