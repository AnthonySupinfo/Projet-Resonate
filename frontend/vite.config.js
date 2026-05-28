import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,    // ← détecte les changements sur Windows
      interval: 100
    },
    hmr: {
      protocol: 'wss',
      clientPort: 443,
      host: 'localhost'
    }
  }
})