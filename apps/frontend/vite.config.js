import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/tts': { target: 'http://127.0.0.1:3000', changeOrigin: true, secure: false },
      '/sts': { target: 'http://127.0.0.1:3000', changeOrigin: true, secure: false },
      '/voices': { target: 'http://127.0.0.1:3000', changeOrigin: true, secure: false },
      '/health': { target: 'http://127.0.0.1:3000', changeOrigin: true, secure: false },
    }
  }
})
