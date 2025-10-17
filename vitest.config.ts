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
