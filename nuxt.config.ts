/**
 * nuxt.config.ts
 *
 * FIX NOTES (TDZ / renderer$1 error):
 *
 *   1. Added `nitro.imports` to explicitly expose server/utils/* as Nitro
 *      auto-imports. Although Nitro scans server/utils by default, being
 *      explicit prevents edge cases where the scan order races the lazy-load
 *      phase that triggers the TDZ.
 *
 *   2. The `imports.autoImport: true` setting is retained so composable
 *      auto-imports keep working in the Vue layer.
 *
 *   3. All server route files (reply.ts, publish.ts, callback/[platform].ts,
 *      and all server/api/square/*.ts) have been updated to use dynamic
 *      import() for @supabase/supabase-js and ~/server/utils/squareClient
 *      instead of top-level static imports. This is the primary fix.
 *
 *   4. Electron compatibility is preserved: ssr: false is kept, and the
 *      nitro preset falls back to 'node-server' when not on Vercel.
 *
 * FIX: ERR_STREAM_WRITE_AFTER_END restart loop
 *   Vite's HMR WebSocket has a race condition: when a browser tab closes,
 *   Vite tries to send a WS close frame to an already-ended stream. The
 *   resulting rejected Promise surfaces as an `unhandledRejection` event.
 *   Nuxt's dev server catches ALL unhandledRejections and restarts — turning
 *   a harmless WebSocket race into an infinite restart loop.
 *
 *   Fix: patch process.emit BEFORE Nuxt installs its listener (this file is
 *   evaluated first) so the specific ERR_STREAM_WRITE_AFTER_END rejections
 *   are consumed here and never reach Nuxt's handler.
 */

// Suppress the Vite HMR WebSocket race-condition restart loop in dev mode.
// Must run BEFORE defineNuxtConfig so it is in place before Nuxt registers
// its own unhandledRejection listener.
if (process.env.NODE_ENV !== 'production') {
  const _emit = process.emit.bind(process)
  // @ts-ignore — overriding process.emit is intentional here
  process.emit = function (event: string, ...args: unknown[]) {
    if (
      event === 'unhandledRejection' &&
      ((args[0] as any)?.code === 'ERR_STREAM_WRITE_AFTER_END' ||
        (args[0] as any)?.code === 'ECONNRESET')
    ) {
      return true // swallow — harmless Vite HMR WebSocket race
    }
    return _emit(event, ...args)
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vite-pwa/nuxt'],

  pwa: {
    registerType: 'autoUpdate',
    registerWebManifestInRouteRules: true,
    manifest: {
      name: 'NovaOps',
      short_name: 'NovaOps',
      description: 'Modern Repair Shop Management System',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkOnly',
          options: {
            cacheName: 'supabase-api-cache',
            backgroundSync: {
              name: 'supabase-sync',
              options: {
                maxRetentionTime: 24 * 60
              }
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    },
  },

  runtimeConfig: {
    // ── Private (server-side only) ─────────────────────────────────────────
    squareAccessToken: process.env.SQUARE_ACCESS_TOKEN || '',
    squareLocationId: process.env.SQUARE_LOCATION_ID || '',
    squareSandbox: process.env.SQUARE_SANDBOX === 'true',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

    // Google OAuth — used for Gmail email support integration
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

    public: {
      // ── Public (safe in browser bundle) ─────────────────────────────────
      squareApplicationId: process.env.SQUARE_APPLICATION_ID || '',
      squareLocationId: process.env.SQUARE_LOCATION_ID || '',
      squareSandbox: process.env.SQUARE_SANDBOX === 'true',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',

      // EmailJS
      emailjsServiceId: process.env.NUXT_PUBLIC_EMAILJS_SERVICE_ID || '',
      emailjsPublicKey: process.env.NUXT_PUBLIC_EMAILJS_PUBLIC_KEY || '',
      emailjsTemplateCustomer: process.env.NUXT_PUBLIC_EMAILJS_TEMPLATE_CUSTOMER || '',
    }
  },

  app: {
    baseURL: '/',
    buildAssetsDir: 'assets',
  },

  imports: { autoImport: true },
  css: ['~/assets/css/main.css'],

  components: [
    {
      path: '~/components',
      ignore: ['**/index.ts'],
    },
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : 'node-server',

    // Explicitly register server/utils so Nitro's auto-import scanner
    // resolves them before any lazy-loaded route handler runs.
    // This prevents the TDZ race that manifests as "Cannot access
    // 'renderer$1' before initialization".
    imports: {
      dirs: ['server/utils']
    }
  }
})
