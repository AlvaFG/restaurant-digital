import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"

const rootDir = fileURLToPath(new URL("./", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(rootDir),
    },
  },
  test: {
    environment: "jsdom",
    clearMocks: true,
    setupFiles: ["./vitest.setup.ts"],
    // Excluir tests de Playwright (E2E) que deben ejecutarse separadamente
    exclude: [
      '**/node_modules/**',
      '**/tests/e2e/**/*.spec.ts',  // Tests de Playwright
      '**/*.spec.ts',                // Cualquier archivo .spec.ts es E2E
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['hooks/**/*.ts', 'lib/services/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**'],
    },
  },
  esbuild: {
    jsx: "automatic",
  },
})
