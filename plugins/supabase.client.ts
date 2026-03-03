import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton — prevents multiple GoTrue instances which causes auth warnings
let _supabase: SupabaseClient | null = null

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Priority 1: environment variables (production / server deployments)
  let url = config.public.supabaseUrl as string
  let key = config.public.supabaseKey as string

  // Priority 2: user-supplied credentials stored in localStorage
  // (Electron / self-hosted where env vars aren't baked in)
  if (process.client && (!url || !key)) {
    url = localStorage.getItem('novaops_sb_url') || ''
    key = localStorage.getItem('novaops_sb_key') || ''
  }

  if (!url || !key) {
    console.warn(
      '[NovaOps] Supabase credentials not found.\n' +
      'Either set NUXT_PUBLIC_SUPABASE_URL + NUXT_PUBLIC_SUPABASE_ANON_KEY in .env,\n' +
      'or connect via Settings → Database Connection.'
    )
    return { provide: { supabase: null } }
  }

  if (!_supabase) {
    // In Electron, detectSessionInUrl causes errors because the page URL is
    // file:// (no hash fragments from OAuth). The Electron OAuth loopback
    // flow sets the session explicitly via exchangeCodeForSession().
    const isElectron = process.client && !!(window as any).electronAPI?.isElectron

    _supabase = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !isElectron,
        storageKey: 'novaops-auth',
      }
    })
  }

  return { provide: { supabase: _supabase } }
})
