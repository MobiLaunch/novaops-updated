import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Module-level singleton — survives hot reload, guarantees one instance
let _supabase: SupabaseClient | null = null

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const url = config.public.supabaseUrl
  const key = config.public.supabaseKey

  if (!url || !key) {
    console.warn(
      '[NovaOps] Supabase env vars missing.\n' +
      'Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY in your .env file or Vercel dashboard.'
    )
    return { provide: { supabase: null } }
  }

  if (!_supabase) {
    _supabase = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'novaops-auth', // unique key prevents conflicts with any other Supabase clients
      }
    })
  }

  return {
    provide: {
      supabase: _supabase
    }
  }
})
