import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Updates app automatically when you deploy new code
      devOptions: {
        enabled: true // Enables PWA for localhost/development
      },
      includeAssets: ['logo-square-black.jpg', 'robots.txt'], // Ensure these files are in your /public folder
      manifest: {
        name: 'Candy Pic Admin',
        short_name: 'CandyAdmin',
        description: 'Internal Booking System for Candy Pic',
        theme_color: '#0f172a', // Matches your Admin Calendar background
        background_color: '#0f172a',
        display: 'standalone', // CRITICAL: Removes browser address bar
        orientation: 'portrait',
        start_url: '/calendar', // Tries to open directly to calendar
        icons: [
          {
            src: '/logo-square-black.jpg', // Ensure you have this image in /public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-square-black.jpg', 
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
