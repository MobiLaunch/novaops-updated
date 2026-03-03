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

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  runtimeConfig: {
    // ── Private (server-side only) ─────────────────────────────────────────
    squareAccessToken: process.env.SQUARE_ACCESS_TOKEN || '',
    squareLocationId: process.env.SQUARE_LOCATION_ID || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    brandOauthRedirectBase: process.env.BRAND_OAUTH_REDIRECT_BASE || '',

    // Facebook / Instagram (same Meta app)
    fbAppId: process.env.FB_APP_ID || '',
    fbAppSecret: process.env.FB_APP_SECRET || '',
    igAppId: process.env.IG_APP_ID || '',
    igAppSecret: process.env.IG_APP_SECRET || '',

    // Google Business Profile
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

    // Yelp (OAuth 2 — limited public API)
    yelpClientId: process.env.YELP_CLIENT_ID || '',
    yelpClientSecret: process.env.YELP_CLIENT_SECRET || '',

    public: {
      // ── Public (safe in browser bundle) ─────────────────────────────────
      squareApplicationId: process.env.SQUARE_APPLICATION_ID || '',
      squareLocationId: process.env.SQUARE_LOCATION_ID || '',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',

      // Social sign-in buttons on the login page
      socialGoogleEnabled: process.env.NUXT_PUBLIC_SOCIAL_GOOGLE === 'true',
      socialFacebookEnabled: process.env.NUXT_PUBLIC_SOCIAL_FACEBOOK === 'true',

      // OAuth app IDs (non-secret — used to build authorization URLs in the browser)
      fbAppId: process.env.NUXT_PUBLIC_FB_APP_ID || '',
      igAppId: process.env.NUXT_PUBLIC_IG_APP_ID || '',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      yelpClientId: process.env.NUXT_PUBLIC_YELP_CLIENT_ID || '',
    }
  },

  app: {
    // ELECTRON FIX: Use './' so all asset paths are relative.
    // When Electron loads the app via loadFile() (file:// protocol),
    // an empty baseURL produces absolute paths like /assets/... which
    // 404 because there is no server. './' makes them relative so the
    // browser resolves them correctly from the HTML file's location.
    baseURL: process.env.ELECTRON_BUILD ? './' : '/',
    buildAssetsDir: 'assets',
  },

  imports: { autoImport: true },
  css: ['~/assets/css/main.css'],

  // SSR off — required for Electron (no server renderer in the desktop shell)
  ssr: false,

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
