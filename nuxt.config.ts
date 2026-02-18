export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vite-pwa/nuxt'],

  runtimeConfig: {
    public: {
      squareApplicationId: process.env.SQUARE_APPLICATION_ID || '',
      squareLocationId: process.env.SQUARE_LOCATION_ID || '',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }
  },

  imports: { autoImport: true },
  css: ['~/assets/css/main.css'],

  ssr: false,

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'NovaOps',
      short_name: 'NovaOps',
      description: 'Repair Shop Management',
      theme_color: '#1e1e2e',
      background_color: '#1e1e2e',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/pkluxhfcdbdjsyypxvrg\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 300 },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : 'node-server',
  }
})
