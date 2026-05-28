/**
 * nuxt.config.ts — NovaOps (Vuetify 3 Edition)
 */

if (process.env.NODE_ENV !== 'production') {
  const _emit = process.emit.bind(process)
  process.emit = function (event, ...args) {
    if (
      event === 'unhandledRejection' &&
      ((args[0]?.code === 'ERR_STREAM_WRITE_AFTER_END') ||
        (args[0]?.code === 'ECONNRESET'))
    ) return true
    return _emit(event, ...args)
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],

  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              background: '#f5f7fa',
              surface: '#ffffff',
              primary: '#6366f1',
              'primary-darken-1': '#4f46e5',
              secondary: '#64748b',
              accent: '#8b5cf6',
              error: '#ef4444',
              info: '#3b82f6',
              success: '#10b981',
              warning: '#f59e0b',
            },
          },
          dark: {
            dark: true,
            colors: {
              background: '#0f172a',
              surface: '#1e293b',
              primary: '#6366f1',
              'primary-darken-1': '#818cf8',
              secondary: '#94a3b8',
              accent: '#a78bfa',
              error: '#ef4444',
              info: '#3b82f6',
              success: '#10b981',
              warning: '#f59e0b',
            },
          },
        },
      },
      defaults: {
        VBtn: {
          variant: 'flat',
          rounded: 'lg',
        },
        VTextField: {
          variant: 'outlined',
          density: 'comfortable',
          rounded: 'lg',
        },
        VTextarea: {
          variant: 'outlined',
          density: 'comfortable',
          rounded: 'lg',
        },
        VSelect: {
          variant: 'outlined',
          density: 'comfortable',
          rounded: 'lg',
        },
        VAutocomplete: {
          variant: 'outlined',
          density: 'comfortable',
          rounded: 'lg',
        },
        VCard: {
          rounded: 'lg',
        },
        VDialog: {
          maxWidth: 560,
        },
        VChip: {
          rounded: 'lg',
        },
      },
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    registerWebManifestInRouteRules: true,
    manifest: {
      name: 'NovaOps',
      short_name: 'NovaOps',
      description: 'Modern Repair Shop Management System',
      theme_color: '#6366f1',
      background_color: '#0f172a',
      display: 'standalone',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      runtimeCaching: [
        { urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i, handler: 'NetworkOnly' },
      ],
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\//],
      type: 'module',
    },
  },

  runtimeConfig: {
    squareAccessToken:      process.env.SQUARE_ACCESS_TOKEN || '',
    squareLocationId:       process.env.SQUARE_LOCATION_ID || '',
    squareSandbox:          process.env.SQUARE_SANDBOX === 'true',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    geminiApiKey:           process.env.GEMINI_API_KEY || '',
    googleClientId:         process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret:     process.env.GOOGLE_CLIENT_SECRET || '',
    public: {
      squareApplicationId: process.env.SQUARE_APPLICATION_ID || '',
      squareLocationId:    process.env.SQUARE_LOCATION_ID || '',
      squareSandbox:       process.env.SQUARE_SANDBOX === 'true',
      supabaseUrl:         process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey:         process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
      googleClientId:      process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      emailjsServiceId:    process.env.NUXT_PUBLIC_EMAILJS_SERVICE_ID || '',
      emailjsPublicKey:    process.env.NUXT_PUBLIC_EMAILJS_PUBLIC_KEY || '',
      emailjsTemplateCustomer: process.env.NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER || '',
    },
  },

  app: {
    baseURL: '/',
    buildAssetsDir: 'assets',
    head: {
      meta: [{ name: 'theme-color', content: '#6366f1' }],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/icon.ico' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
      ],
    },
  },

  css: [
    '@mdi/font/css/materialdesignicons.min.css',
    '~/assets/css/main.css'
  ],
  imports: { autoImport: true },
  components: [{ path: '~/components', ignore: ['**/index.ts'] }],

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : 'node-server',
    imports: { dirs: ['server/utils'] },
  },
})
