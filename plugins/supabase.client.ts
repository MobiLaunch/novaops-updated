import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const url = config.public.supabaseUrl
  const key = config.public.supabaseKey

  if (!url || !key) {
    console.warn(
      '[NovaOps] Supabase env vars missing.\n' +
      'Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY in your .env file or Vercel dashboard.'
    )
    // Provide null so app doesn't crash — pages will handle gracefully
    return { provide: { supabase: null } }
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return {
    provide: {
      supabase
    }
  }
})

