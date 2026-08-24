import { test, expect, type ConsoleMessage, type Page } from '@playwright/test'
import {
  cargarReferencia,
  comparar,
  registrarResultado,
  escribirReportes,
  SCREENSHOTS_DIR,
  PAGE_TO_WIREFRAME,
  type PageKey,
} from './visual-helper'
import {
  loginInyectandoToken,
  redirigirApiALocal,
  limpiarSesion,
  USUARIOS_DEMO,
} from './auth-helper'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Hook global: una vez terminada la suite escribimos reporte-visual.md/json.
test.afterAll(async () => {
  escribirReportes()
})

// Umbrales por página. Justificación:
// - 0.40 (40%) para páginas con datos reales del seed (dashboard, mascotas,
//   citas, expediente, perfil, aportes, traslados, inventario, funcionarios,
//   aprobaciones, emergencias, servicios): los wireframes muestran datos mock,
//   la diferencia se concentra en nombres/textos reales.
// - 0.30 (30%) para páginas estáticas (registro, login, auth-method): única
//   fuente de variabilidad es tipografía/render del navegador.
// - 0.35 (35%) para veterinary/store registration: formularios largos con
//   inputs vacíos + secciones replegables (estructura cambiante con scroll).
// - 0.30 (30%) para marketplace: cards con datos reales pero layout estable.
// Estos valores NO fuerzan a pasar: si una página rediseñada rompe layout o
// pierde secciones, el ratio subirá muy por encima del umbral.
const UMBRALES: Partial<Record<PageKey, number>> = {
  '/login': 0.30,
  '/auth-method': 0.30,
  '/register': 0.30,
  '/dashboard': 0.40,
  '/dashboard/mascotas': 0.40,
  '/dashboard/citas': 0.40,
  '/dashboard/perfil': 0.40,
  '/dashboard/expediente': 0.40,
  '/dashboard/emergencias': 0.40,
  '/dashboard/servicios': 0.40,
  '/dashboard/funcionarios': 0.40,
  '/dashboard/aprobaciones': 0.40,
  '/dashboard/inventario': 0.40,
  '/dashboard/traslados': 0.40,
  '/dashboard/aportes': 0.40,
  '/dashboard/veterinary-registration': 0.35,
  '/dashboard/store-registration': 0.35,
  '/marketplace': 0.30,
}

interface ConsoleTracker {
  errors: ConsoleMessage[]
  pageErrors: Error[]
  install(page: Page): void
}

function makeTracker(): ConsoleTracker {
  const t: ConsoleTracker = { errors: [], pageErrors: [], install() {} }
  t.install = (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') t.errors.push(msg)
    })
    page.on('pageerror', (err) => t.pageErrors.push(err))
  }
  return t
}

interface VisualCheckArgs {
  page: Page
  route: string
  pageKey: PageKey
  extraWait?: number
  selectorVisible?: string
  preScreenshot?: (page: Page) => Promise<void>
}

/**
 * Flujo común: navega, espera a que la página esté lista, screenshot, compara.
 */
async function ejecutarVerificacionVisual(args: VisualCheckArgs) {
  const { page, route, pageKey, extraWait = 800, selectorVisible, preScreenshot } = args
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})

  if (selectorVisible) {
    await page.locator(selectorVisible).first().waitFor({ state: 'visible', timeout: 25_000 })
  }
  if (preScreenshot) {
    await preScreenshot(page)
  }
  // Espera fija para que las animaciones (entry / page-transition) terminen.
  await page.waitForTimeout(extraWait)

  const screenshot = await page.screenshot({ fullPage: true })
  const safeName = pageKey.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'root'
  const shotPath = resolve(SCREENSHOTS_DIR, `${safeName}.png`)
  if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  writeFileSync(shotPath, screenshot)

  const wireframeName = PAGE_TO_WIREFRAME[pageKey]
  const ref = cargarReferencia(wireframeName)
  const umbral = UMBRALES[pageKey] ?? 0.40

  if (!ref) {
    return {
      ok: false,
      ratio: 1,
      diffPixels: 0,
      totalPixels: 0,
      note: `wireframe no encontrado: ${wireframeName}`,
      screenshot: shotPath,
    }
  }

  const cmp = comparar(screenshot, ref, safeName, umbral)
  return {
    ok: cmp.pass,
    ratio: cmp.ratio,
    diffPixels: cmp.diffPixels,
    totalPixels: cmp.totalPixels,
    note: undefined as string | undefined,
    screenshot: shotPath,
    diffPath: cmp.diffPath,
    width: cmp.width,
    height: cmp.height,
  }
}

/** Helper que ejecuta el flujo completo y registra el resultado en el reporte. */
async function testPagina({
  page,
  route,
  pageKey,
  rol,
  selector,
  extraWait,
  preScreenshot,
}: {
  page: Page
  route: PageKey | string
  pageKey: PageKey
  rol?: keyof typeof USUARIOS_DEMO
  selector?: string
  extraWait?: number
  preScreenshot?: (page: Page) => Promise<void>
}) {
  const t = makeTracker()
  t.install(page)
  const start = Date.now()

  if (rol) {
    // Login reescribiendo el contexto: la primera page del context trae la sesión
    // ya inyectada; las llamadas a la API se redirigen a localhost por
    // redirigirApiALocal (instalado dentro de loginInyectandoToken).
    const context = page.context()
    await context.clearCookies()
    const aux = await loginInyectandoToken(context, rol)
    // Copia localStorage del aux a la page principal. Más simple: usamos aux
    // directamente como la page de test.
    await aux.close()
  }

  const result = await test.step('render + comparar', async () => {
    return ejecutarVerificacionVisual({
      page,
      route,
      pageKey,
      selectorVisible: selector,
      extraWait: extraWait ?? 1000,
      preScreenshot,
    })
  })

  await expect(page, `URL final inesperada: ${page.url()}`).toHaveURL(new RegExp(`${String(route).replace(/\//g, '\\/')}$`))
  // Errores de consola: prioridad 1. pageErrors son crashes JS reales.
  expect(
    t.pageErrors,
    `pageerror en ${route}: ${t.pageErrors.map((e) => e.message).join('; ')}`,
  ).toHaveLength(0)
  expect(
    t.errors,
    `console.error en ${route}: ${t.errors.map((m) => m.text()).join('; ')}`,
  ).toHaveLength(0)

  registrarResultado({
    page: pageKey,
    wireframe: PAGE_TO_WIREFRAME[pageKey],
    ratio: result.ratio,
    diffPixels: result.diffPixels,
    totalPixels: result.totalPixels,
    pass: result.ok,
    threshold: UMBRALES[pageKey] ?? 0.40,
    note: result.note,
    durationMs: Date.now() - start,
    errors: t.errors.length,
    pageErrors: t.pageErrors.length,
  })
  expect(result.ok, `Similitud ${((1 - result.ratio) * 100).toFixed(1)}% < esperado para ${pageKey}`).toBe(true)
}

test.describe('Sprint 2 T41 - Verificación visual por página', () => {
  test.describe('Páginas públicas (sin auth)', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('/login', async ({ page }) => {
      await redirigirApiALocal(page)
      await testPagina({
        page,
        route: '/login',
        pageKey: '/login',
        selector: 'form.login-form',
        extraWait: 500,
      })
    })

    test('/auth-method', async ({ page }) => {
      await redirigirApiALocal(page)
      await testPagina({
        page,
        route: '/auth-method',
        pageKey: '/auth-method',
        selector: 'main',
        extraWait: 500,
      })
    })

    test('/register', async ({ page }) => {
      await redirigirApiALocal(page)
      await testPagina({
        page,
        route: '/register',
        pageKey: '/register',
        selector: 'form',
        extraWait: 500,
      })
    })

    test('/marketplace', async ({ page }) => {
      await redirigirApiALocal(page)
      await testPagina({
        page,
        route: '/marketplace',
        pageKey: '/marketplace',
        // MarketplacePage usa <section class="marketplace-page"> como root.
        // Esperamos a esa sección para asegurar que el shell renderizó.
        selector: 'section.marketplace-page',
        extraWait: 2500,
      })
    })

    test('/ (Landing) — solo smoke', async ({ page }) => {
      await redirigirApiALocal(page)
      const t = makeTracker()
      t.install(page)
      const start = Date.now()
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
      await expect(page.locator('text=OpenPaw').first()).toBeVisible({ timeout: 10_000 })
      // La Landing es una decisión de PO distinta a propósito del wireframe
      // openpaw_bienvenido. Solo verificamos que renderiza sin errores.
      expect(t.pageErrors, `pageerror en /: ${t.pageErrors.map((e) => e.message).join('; ')}`).toHaveLength(0)
      expect(t.errors, `console.error en /: ${t.errors.map((m) => m.text()).join('; ')}`).toHaveLength(0)
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)

      registrarResultado({
        page: '/' as PageKey,
        wireframe: 'openpaw_bienvenido (NO COMPARADO: decision PO)',
        ratio: 0,
        diffPixels: 0,
        totalPixels: 0,
        pass: true,
        threshold: 0,
        note: 'smoke OK: render sin errores. Landing intencionalmente distinta al wireframe.',
        durationMs: Date.now() - start,
        errors: t.errors.length,
        pageErrors: t.pageErrors.length,
      })
    })
  })

  test.describe('Páginas autenticadas — admin', () => {
    // Rutas accesibles para rol administrador (rol 1).
    const adminRoutes: Array<{ route: PageKey; selector?: string; extraWait?: number }> = [
      { route: '/dashboard' },
      { route: '/dashboard/mascotas', selector: 'main' },
      { route: '/dashboard/citas', selector: 'main' },
      { route: '/dashboard/perfil', selector: 'main' },
      { route: '/dashboard/expediente', selector: 'main' },
      { route: '/dashboard/servicios', selector: 'main' },
      { route: '/dashboard/funcionarios', selector: 'main' },
      { route: '/dashboard/aprobaciones', selector: 'main' },
      { route: '/dashboard/inventario', selector: 'main' },
      { route: '/dashboard/traslados', selector: 'main' },
      { route: '/dashboard/veterinary-registration', selector: 'main' },
      { route: '/dashboard/store-registration', selector: 'main' },
    ]

    for (const { route, selector, extraWait } of adminRoutes) {
      test(`${route} como admin`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
        try {
          const page = await loginInyectandoToken(context, 'admin')
          await testPagina({
            page,
            route,
            pageKey: route,
            selector,
            extraWait,
          })
        } finally {
          await context.close()
        }
      })
    }
  })

  test.describe('Páginas autenticadas — veterinaria', () => {
    // Emergencias está restringido a CLIENTE y VETERINARIA (App.jsx).
    test('/dashboard/emergencias como vet', async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      try {
        const page = await loginInyectandoToken(context, 'vet')
        await testPagina({
          page,
          route: '/dashboard/emergencias',
          pageKey: '/dashboard/emergencias',
          selector: 'main',
          extraWait: 1000,
        })
      } finally {
        await context.close()
      }
    })
  })

  test.describe('Páginas autenticadas — cliente', () => {
    // Aportes está restringido a CLIENTE (App.jsx).
    test('/dashboard/aportes como cliente', async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      try {
        const page = await loginInyectandoToken(context, 'cliente')
        await testPagina({
          page,
          route: '/dashboard/aportes',
          pageKey: '/dashboard/aportes',
          selector: 'main',
          extraWait: 1500,
        })
      } finally {
        await context.close()
      }
    })
  })
})
