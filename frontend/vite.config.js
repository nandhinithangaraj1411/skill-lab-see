import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward /api requests to the Express backend (avoids CORS in development)
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
