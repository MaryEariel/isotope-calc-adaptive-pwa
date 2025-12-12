import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Калькулятор изотопов',
        short_name: 'Изотопы',
        description: 'Приложение для расчета периода полураспада радиоактивных изотопов',
        theme_color: '#0B2149',
        background_color: '#f4f4f4',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 год
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  
  base: '/', // ← ПРОВЕРЬТЕ СВОЙ РЕПОЗИТОРИЙ!
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // ← ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ!
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Оставляем /api
      },
      '/minio': {
        target: 'http://localhost:9000', // ← ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ!
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/minio/, '/'),
      }
    },
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})