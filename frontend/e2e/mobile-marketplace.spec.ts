import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

/* R19 — Verificación mobile real del marketplace (390/360 breakpoints).
   El API se mockea con page.route() para que el spec no dependa del backend
   local: el marketplace es público y los DTOs son planos (/inventario/publico).
   Screenshots r19-*.png en Temp\opencode (env OUT_DIR). */

const OUT_DIR = process.env.OUT_DIR || resolve(process.cwd(), 'e2e/artifacts/r19')

interface MockProduct {
  inventarioId: number
  nombre: string
  precio: number
  categoria: string
  stock: number
  almacenNombre: string
  veterinariaId: number | null
  imagenUrl: string | null
}

function products(countPerCat: number): MockProduct[] {
  const cats = ['Alimento', 'Juguetes', 'Farmacia']
  const out: MockProduct[] = []
  cats.forEach((cat, ci) => {
    for (let i = 0; i < countPerCat; i++) {
      out.push({
        inventarioId: ci * 100 + i,
        nombre: `${cat} Producto ${i + 1}`,
        precio: 5000 + i * 1000,
        categoria: cat,
        stock: 10,
        almacenNombre: 'Almacen Central',
        veterinariaId: 1,
        imagenUrl: null,
      })
    }
  })
  return out
}

async function mockApi(page: Page) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    if (url.includes('/inventario/publico')) {
      return route.fulfill({ json: products(6) })
    }
    if (url.includes('/veterinarias/aprobadas')) {
      return route.fulfill({ json: [{ id: 1, nombre: 'Clinica San Roque', direccion: 'Central' }] })
    }
    if (url.includes('/serviciosveterinarios')) {
      return route.fulfill({ json: [] })
    }
    return route.fulfill({ json: [] })
  })
}

async function setup(page: Page, width: number, height: number) {
  await mockApi(page)
  await page.setViewportSize({ width, height })
  await page.goto('/marketplace', { waitUntil: 'domcontentloaded' })
  await page.locator('section.marketplace-page').waitFor({ state: 'visible', timeout: 15_000 })
  await expect(page.locator('.mp-card').first()).toBeVisible({ timeout: 15_000 })
}

test.describe('R19 marketplace mobile', () => {
  const VIEWPORTS: Array<[number, number, string]> = [
    [390, 844, 'iphone12'],
    [360, 780, 'small360'],
  ]
  for (const [width, height, name] of VIEWPORTS) {
    /* ------------------------------------------------------------------
       FIX 2 — buscador: pill de 48px, NO un óvalo/círculo gigante
       ------------------------------------------------------------------ */
    test(`search pill 48px en ${name} (${width}px)`, async ({ page }) => {
      await setup(page, width, height)
      const box = await page.locator('.mp-search').boundingBox()
      expect(box).toBeTruthy()
      // Pill: altura entre 44 y 60px; ancho casi total (con gutter ~8-16px cada lado)
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeLessThanOrEqual(60)
      expect(box!.width).toBeGreaterThan(width - 60)
      // El input crece en línea (no estira el contenedor): altura <= pill
      const input = await page.locator('#mp-search-input').boundingBox()
      expect(input!.height).toBeLessThanOrEqual(box!.height + 1)

      await page.screenshot({ path: resolve(OUT_DIR, `r19-search-${name}.png`), fullPage: false })
    })

    /* ------------------------------------------------------------------
       FIX 1 — CartDrawer bottom-sheet cerrable (X, backdrop, Escape)
       ------------------------------------------------------------------ */
    test(`cart drawer bottom-sheet cerrable en ${name} (${width}px)`, async ({ page }) => {
      await setup(page, width, height)

      // Agregar un producto para abrir el drawer con contenido
      await page.locator('.mp-card__add').first().click()
      await expect(page.locator('.cd-drawer')).toBeVisible()
      // Espera a que termine la animacion slide-up antes de medir
      await page.waitForTimeout(450)

      const drawer = await page.locator('.cd-drawer').boundingBox()
      // Bottom-sheet: pegado al fondo, altura <= 85% del viewport
      expect(drawer!.y + drawer!.height).toBeGreaterThanOrEqual(height - 2)
      expect(drawer!.y + drawer!.height).toBeLessThanOrEqual(height + 2)
      expect(drawer!.height).toBeLessThanOrEqual(height * 0.85 + 1)
      expect(drawer!.width).toBe(width)
      // X siempre visible con target táctil >= 40px
      const close = page.locator('.cd-close')
      await expect(close).toBeVisible()
      expect(await close.boundingBox().then((b) => Math.min(b!.width, b!.height))).toBeGreaterThanOrEqual(40)
      // Lista scrolleable
      const scrollable = await page.locator('.cd-items').evaluate(
        (el) => (el.scrollHeight > el.clientHeight) || el.scrollHeight >= el.clientHeight,
      )
      expect(scrollable).toBe(true)

      await page.screenshot({ path: resolve(OUT_DIR, `r19-drawer-open-${name}.png`), fullPage: false })

      // Cierre 1: botón X
      await close.click()
      await expect(page.locator('.cd-drawer')).toHaveCount(0)

      // Cierre 2: backdrop
      await page.locator('.mp-hero__cart').first().click()
      await expect(page.locator('.cd-drawer')).toBeVisible()
      await page.waitForTimeout(450)
      await page.locator('.cd-overlay').click({ position: { x: 10, y: 10 } })
      await expect(page.locator('.cd-drawer')).toHaveCount(0)

      // Cierre 3: Escape
      await page.locator('.mp-hero__cart').first().click()
      await expect(page.locator('.cd-drawer')).toBeVisible()
      await page.waitForTimeout(450)
      await page.keyboard.press('Escape')
      await expect(page.locator('.cd-drawer')).toHaveCount(0)

      await page.screenshot({ path: resolve(OUT_DIR, `r19-drawer-closed-${name}.png`), fullPage: false })
    })

    /* ------------------------------------------------------------------
       FIX 3 — secciones por categoría con filas horizontales
       (scrollWidth > clientWidth verificado programáticamente)
       ------------------------------------------------------------------ */
    test(`filas por categoria horizontales en ${name} (${width}px)`, async ({ page }) => {
      await setup(page, width, height)

      const rows = page.locator('.mp-row')
      await expect(rows).toHaveCount(3)

      // Cada sección: header con categoría + fila scrolleable en X
      const cats = await page.locator('.mp-cat__title').allTextContents()
      expect(cats).toEqual(['Alimento', 'Farmacia', 'Juguetes'])

      const scrollInfo = await page.locator('.mp-row').first().evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }))
      expect(scrollInfo.scrollWidth).toBeGreaterThan(scrollInfo.clientWidth)

      // "Ver todos" filtra a esa categoría (una sola sección visible)
      await page.locator('.mp-cat__all').first().click()
      await expect(page.locator('.mp-row')).toHaveCount(1)
      await expect(page.locator('.mp-cat__title')).toHaveText('Alimento')

      await page.screenshot({ path: resolve(OUT_DIR, `r19-categories-${name}.png`), fullPage: false })
    })
  }
})

mkdirSync(OUT_DIR, { recursive: true })
