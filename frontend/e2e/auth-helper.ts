import type { Page, BrowserContext } from '@playwright/test'

// AuthContext.jsx usa estas claves directamente (ver frontend/src/constants.js).
// Las hardcodeamos aquí para evitar la resolución de imports .js -> .ts fuera
// del scope de Vite/Rollup (Playwright no procesa el bundle del frontend).
const AUTH_TOKEN_KEY = 'openpaw_auth_token'
const USER_STORAGE_KEY = 'openpaw_user'

// El frontend usa esta URL por defecto para todas las llamadas API
// (frontend/src/constants.js). En runtime apunta al backend de alwaysdata,
// pero los tests visuales (Sprint 2 T41) se ejecutan contra el backend local
// en :5000, así que reescribimos esa URL mediante Playwright `page.route()`.
const FRONTEND_API_BASE = 'https://openpaw.alwaysdata.net/api'
const LOCAL_API_BASE = 'http://localhost:5000/api'

// AuthContext.jsx lee `openpaw_auth_token` (AUTH_TOKEN_KEY) y, si existe,
// decodifica el JWT para obtener { sub, email, nombre, rol }. También carga
// `openpaw_user` (USER_STORAGE_KEY) si está presente y lo prefiere sobre el
// JWT (es el que mantiene `updateUser`). Inyectar ambos deja al contexto en el
// mismo estado que un login real sin pasar por la pantalla de login (más
// estable contra animaciones y contra el modal de "requiere teléfono").
//
// Para el flujo "iniciar-sesión-real" seguimos exponiendo `loginPorUi`, que
// es el mismo flujo que usa el equipo en sus tests manuales.

export interface CredencialesDemo {
  email: string
  password: string
}

export const USUARIOS_DEMO: Record<string, CredencialesDemo> = {
  admin: { email: 'admin@openpaw.dev', password: 'Admin123!' },
  vet: { email: 'david.chen@openpaw.dev', password: 'Vet123!' },
  cliente: { email: 'maria.rodriguez@openpaw.dev', password: 'Demo123!' },
}

// Cache de tokens por rol. El backend tiene un rate limiter de 10 logins/min
// por IP (Program.cs), así que no podemos pedir un JWT nuevo en cada test.
// Reutilizamos el primer token que obtuvimos para cada rol mientras no expire
// (los tokens de demo tienen 60 min de validez).
const tokenCache: Partial<Record<keyof typeof USUARIOS_DEMO, { token: string; expira: number }>> = {}

async function obtenerToken(rol: keyof typeof USUARIOS_DEMO): Promise<string> {
  const cached = tokenCache[rol]
  const now = Date.now()
  if (cached && cached.expira > now + 30_000) {
    return cached.token
  }
  const { email, password } = USUARIOS_DEMO[rol]
  const resp = await fetch(`${LOCAL_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Login backend falló (${resp.status}): ${text}`)
  }
  const data = (await resp.json()) as { token: string; expiraEn?: string }
  // Decodifica exp del JWT como fallback si la API no devuelve expiraEn.
  let expiraMs = now + 50 * 60 * 1000
  if (data.expiraEn) {
    const t = Date.parse(data.expiraEn)
    if (!Number.isNaN(t)) expiraMs = t
  } else {
    const payload = decodeJwtPayload(data.token) as { exp?: number } | null
    if (payload?.exp) expiraMs = payload.exp * 1000
  }
  tokenCache[rol] = { token: data.token, expira: expiraMs }
  return data.token
}

/**
 * Redirige las llamadas del frontend que van a `FRONTEND_API_BASE` (URL hardcodeada
 * en constants.js) hacia el backend local en :5000. Debe instalarse ANTES de
 * cualquier navegación, idealmente justo después de crear el context.
 *
 * Playwright no permite cambiar el esquema (https -> http) en `route.continue()`,
 * así que implementamos un proxy manual: reenviamos la request con `fetch()`
 * desde el contexto de Node al backend local y devolvemos la respuesta al
 * navegador con `route.ulfill()`. Esto preserva método, headers (incluido
 * Authorization: Bearer), body, query string y código de estado.
 */
export async function redirigirApiALocal(page: Page) {
  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = req.url()

    // Solo intervenimos las llamadas a la API del frontend.
    if (!url.startsWith(FRONTEND_API_BASE)) {
      return route.continue()
    }

    const rewritten = LOCAL_API_BASE + url.slice(FRONTEND_API_BASE.length)

    try {
      const headers: Record<string, string> = {}
      // Conservar headers del request original; algunos hop-by-hop no se
      // reenvían (host, content-length, connection) pero Playwright ya los
      // gestiona al pasar a fetch.
      for (const [k, v] of Object.entries(req.headers())) {
        if (v == null) continue
        const lower = k.toLowerCase()
        if (lower === 'host' || lower === 'content-length' || lower === 'connection') continue
        headers[k] = String(v)
      }
      const method = req.method()
      const body =
        method === 'GET' || method === 'HEAD' ? undefined : req.postData() ?? undefined

      const upstream = await fetch(rewritten, { method, headers, body })

      const respHeaders: Record<string, string> = {}
      upstream.headers.forEach((value, key) => {
        // Evitar headers que rompen al navegador o son hop-by-hop.
        const lower = key.toLowerCase()
        if (lower === 'content-encoding' || lower === 'transfer-encoding' || lower === 'connection') return
        respHeaders[key] = value
      })

      const buf = Buffer.from(await upstream.arrayBuffer())
      await route.fulfill({
        status: upstream.status,
        statusText: upstream.statusText,
        headers: respHeaders,
        body: buf,
      })
    } catch (err) {
      // Si el backend local no responde, devolvemos 502 para que el frontend
      // muestre un estado de error y podamos detectarlo en el reporte.
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ mensaje: `Proxy E2E -> backend local falló: ${(err as Error).message}` }),
      })
    }
  })
}

/**
 * Login por UI. Útil cuando queremos validar que la página de login renderiza
 * correctamente y queremos que la transición a /dashboard sea parte del test.
 * Usa selectores accesibles (getByLabel) en español.
 */
export async function loginPorUi(page: Page, rol: keyof typeof USUARIOS_DEMO = 'admin') {
  const { email, password } = USUARIOS_DEMO[rol]
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: /ingresar/i }).click()
  // Después de un login correcto la app navega a "/" (Landing) o a "/dashboard"
  // según el flujo; esperamos a que cambie la URL.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
}

/**
 * Login por inyección directa del token en localStorage.
 * Es el método preferido para los tests visuales: no depende del flujo de UI,
 * evita el modal "requiere teléfono" de Google y es determinista.
 *
 * Requiere que el backend esté vivo (levantado por el orquestador en :5000)
 * para que el endpoint /api/auth/login devuelva un JWT válido.
 *
 * Además configura la redirección de la URL de la API (FRONTEND_API_BASE
 * -> LOCAL_API_BASE) en la página que devuelve, de modo que el resto de
 * llamadas del navegador se redirijan al backend local.
 */
export async function loginInyectandoToken(
  context: BrowserContext,
  rol: keyof typeof USUARIOS_DEMO = 'admin',
) {
  const token = await obtenerToken(rol)

  // Decodifica el payload del JWT (base64url) para llenar el objeto user
  // exactamente como lo haría AuthContext en el navegador.
  const payload = decodeJwtPayload(token)

  // Inyecta antes de cualquier navegación. Una página vacía basta.
  const page = await context.newPage()
  // Importante: route() debe instalarse ANTES de goto, para que las llamadas
  // a la API que haga la página se redirijan al backend local.
  await redirigirApiALocal(page)
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ([tokenKey, userKey, tok, userJson]) => {
      localStorage.setItem(tokenKey, tok)
      localStorage.setItem(userKey, userJson)
    },
    [AUTH_TOKEN_KEY, USER_STORAGE_KEY, token, JSON.stringify(payload)],
  )
  return page
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

/** Limpia localStorage y cookies del contexto. */
export async function limpiarSesion(context: BrowserContext) {
  await context.clearCookies()
  const pages = context.pages()
  for (const p of pages) {
    try {
      await p.evaluate(() => {
        try { localStorage.clear() } catch {}
        try { sessionStorage.clear() } catch {}
      })
    } catch {
      // La página puede no tener documento aún; ignorar.
    }
  }
}
