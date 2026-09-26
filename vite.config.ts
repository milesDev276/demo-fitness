import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'FitFlow',
        short_name: 'FitFlow',
        description: 'Personal adaptive fitness tracker',
        theme_color: '#171717',
        background_color: '#fafafa',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        // Small app shell — precache the build output, nothing else.
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
})
