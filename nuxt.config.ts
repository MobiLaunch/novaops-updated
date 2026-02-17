export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  runtimeConfig: {
    // Server-only (never sent to client)
    squareAccessToken: process.env.SQUARE_ACCESS_TOKEN || '',
    squareLocationId: process.env.SQUARE_LOCATION_ID || '',

    public: {
      // Safe to expose to client — needed for Web Payments SDK
      squareApplicationId: process.env.SQUARE_APPLICATION_ID || '',
      squareLocationId: process.env.SQUARE_LOCATION_ID || '',

      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }
  },

  imports: { autoImport: true },
  css: ['~/assets/css/main.css'],

  ssr: false,

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : 'node-server',
    // Prevent Nitro from trying to bundle the Square SDK — use the installed package as-is
    externals: {
      external: ['square']
    }
  }
})
