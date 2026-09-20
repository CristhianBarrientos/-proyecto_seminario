/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  server: {
    // permite acceder al dev server vía túneles temporales (Cloudflare Tunnel)
    // para compartirlo con el equipo - no afecta al backend, que sigue siendo OCI
    allowedHosts: ['.trycloudflare.com'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
