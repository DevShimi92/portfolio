import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['app/[locale]/**/**/*.{ts,tsx}'],
      exclude: ['node_modules/', '.next/', '**/*.config.*','app/[locale]/_articles/*.{ts,tsx}','app/[locale]/[slug]/*.{ts,tsx}'],
      thresholds: {
          lines: 50,
          functions: 50,
          branches: 50,
          statements: 50,
        },
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
  },
})
