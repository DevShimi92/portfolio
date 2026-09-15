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
      //include: ['app/[locale]/_components/**/*.{ts,tsx}'],
      exclude: ['node_modules/', '.next/', '**/*.config.*'],
      //thresholds: {
      //    lines: 75,
      //    functions: 75,
      //    branches: 75,
      //    statements: 75,
      //  },
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
  },
})
