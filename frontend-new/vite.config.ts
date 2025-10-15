import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mkcert()
  ],
  server: {
    port: 5173,
    https: true,
    host: '0.0.0.0', // Allow connections from any IP address
    proxy: {
      '/api': {
        target: 'https://localhost:3001', // Updated to match new backend port
        secure: false,
        changeOrigin: true
      }
    }
  }
})