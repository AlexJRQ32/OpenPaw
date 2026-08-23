import { defineConfig, devices } from '@playwright/test'

// Suite de verificación visual Sprint 2 - T41.
// NO usa webServer porque los servidores (backend 5000 + frontend preview 5173)
// los levanta el orquestador manualmente antes de correr `npx playwright test`.
// Si el orquestador lo prefiere, puede exportar PLAYWRIGHT_AUTO_WEB_SERVER=1
// para forzar un build + preview automático.
const AUTO_WEB_SERVER = process.env.PLAYWRIGHT_AUTO_WEB_SERVER === '1'

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts$/,
  // Los specs visuales son lentos (carga, screenshot, pixelmatch por página).
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // 1 worker: evita contención de CPU/Chrome con un solo browser
  // y mantiene el orden de los reportes predecible.
  workers: 1,
  // Reintentos: 0 por defecto; configurable via CLI si el entorno es flaky.
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e/artifacts/html-report' }],
    ['json', { outputFile: 'e2e/artifacts/results.json' }],
  ],
  outputDir: 'e2e/artifacts/test-output',
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1440, height: 900 },
    // Screenshots y traces solo on-failure (los nuestros los tomamos manualmente).
    screenshot: 'off',
    trace: 'retain-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: AUTO_WEB_SERVER
    ? {
        command: 'npm run build && npm run preview -- --port 5173 --strictPort',
        url: 'http://localhost:5173',
        timeout: 120_000,
        reuseExistingServer: true,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
})
