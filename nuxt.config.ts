/**
 * nuxt.config.ts — NovaOps (Vuetify 3 Edition)
 * vuetify-nuxt-module replaces @nuxtjs/tailwindcss
 */



export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,

  css: ['~/assets/css/utilities.scss'],

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
  ],

  vuetify: {
    moduleOptions: {
      styles: { configFile: 'assets/css/vuetify-settings.scss' },
    },
    vuetifyOptions: {
      labComponents: true,
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary:            '#6366f1',
              'primary-darken-1': '#4f46e5',
              secondary:          '#64748b',
              success:            '#10b981',
              warning:            '#f59e0b',
              error:              '#ef4444',
              info:               '#3b82f6',
              background:         '#f8fafc',
              surface:            '#ffffff',
              'surface-variant':  '#f1f5f9',
              'on-surface-variant': '#64748b',
            },
          },
          dark: {
            dark: true,
            colors: {
              primary:            '#818cf8',
              'primary-darken-1': '#6366f1',
              secondary:          '#94a3b8',
              success:            '#34d399',
              warning:            '#fbbf24',
              error:              '#f87171',
              info:               '#60a5fa',
              background:         '#0f172a',
              surface:            '#1e293b',
              'surface-variant':  '#162032',
              'on-surface-variant': '#94a3b8',
            },
          },
        },
      },

      defaults: {
        VCard:        { rounded: 'lg', elevation: 1, border: false },
        VBtn:         { rounded: 'pill', elevation: 0 },
        VChip:        { rounded: 'pill' },
        VTextField:   { variant: 'outlined', density: 'comfortable', rounded: 'lg', hideDetails: 'auto' },
        VSelect:      { variant: 'outlined', density: 'comfortable', rounded: 'lg', hideDetails: 'auto' },
        VTextarea:    { variant: 'outlined', density: 'comfortable', rounded: 'lg', hideDetails: 'auto' },
        VSwitch:      { color: 'primary', hideDetails: true, density: 'compact' },
        VDialog:      { maxWidth: '480', rounded: 'lg' },
        VSnackbar:    { rounded: 'lg', location: 'bottom right', timeout: 4000 },
        VDataTable:   { density: 'comfortable', hover: true },
        VNavigationDrawer: { elevation: 0 },
        VList:        { density: 'compact', nav: true },
        VListItem:    { rounded: 'lg' },
      },

      icons: { defaultSet: 'mdi' },
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

  imports: { autoImport: true },
  components: [{ path: '~/components', ignore: ['**/index.ts'] }],

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : 'node-server',
    imports: { dirs: ['server/utils'] },
  },
})
