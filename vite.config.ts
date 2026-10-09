import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { guide } from './guide/network-plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), guide()],
  server: { port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'] },
})
