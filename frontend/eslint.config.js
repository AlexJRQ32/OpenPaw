import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Deuda #74: globals vitest para tests (describe/it/test/expect/vi/beforeEach/afterEach/beforeAll/afterAll)
  // sin necesidad de import; evita ~68 errores no-undef en npx eslint.
  {
    files: [
      '**/__tests__/**/*.{js,jsx}',
      '**/*.test.{js,jsx}',
      '**/*.spec.{js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
    },
  },
])
