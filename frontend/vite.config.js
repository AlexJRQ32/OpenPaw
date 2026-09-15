import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    globals: true,
    // API_BASE_PINNED: tests hard-codecanean la base como URL hermetica.
    // Nota (R12): .env.local se rompio una vez (Vercel CLI) y el fallback fortuito
    // al prod coincidia con esta constante. Pin el env para que la suite no
    // dependa del .env.local del desarrollador.
    env: { VITE_API_BASE_URL: 'https://openpaw.alwaysdata.net/api' },
    // Excluir la suite Playwright (Sprint 2 T41). Sus specs usan sintaxis
    // específica de @playwright/test y no deben correr bajo vitest.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/e2e/**',
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
