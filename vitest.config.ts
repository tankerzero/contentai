import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/*.spec.ts'],
    reporters: ['verbose', 'json'],
    outputFile: './test_reports/vitest-results.json',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './test_reports/coverage',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
