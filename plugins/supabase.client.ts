import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

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

  // Clear any stale sessions stored under the old default Supabase key.
  // This prevents leftover example/demo accounts from being auto-restored.
  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach(k => localStorage.removeItem(k))
  }

  if (!_supabase) {
    _supabase = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'novaops-auth',
      }
    })
  }

  return {
    provide: {
      supabase: _supabase
    }
  }
})

