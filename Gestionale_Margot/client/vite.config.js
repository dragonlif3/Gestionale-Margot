import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Gestionale Margot', 
        short_name: 'Margot', 
        description: 'Gestionale del Circolo Arci Margot', 
        theme_color: '#1B1230', 
        background_color: '#FFF9F0'
      },
      workbox: {
        importScripts: ['push-sw.js'],
        // le chiamate API sempre "fresche" dalla rete, non cachate,
        // altrimenti vedresti quantità/vini non aggiornati offline
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly'
          }
        ],
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/images': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})