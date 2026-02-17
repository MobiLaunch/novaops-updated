export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

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

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : 'node-server',
    externals: {
      // Don't bundle square — use it from node_modules at runtime
      external: ['square'],
      inline: []
    }
  }
})
