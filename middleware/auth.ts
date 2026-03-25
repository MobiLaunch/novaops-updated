// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { $supabase } = useNuxtApp()

  // Pages that never require auth
  const publicPaths = ['/login', '/register', '/auth/callback', '/intro', '/display']
  if (publicPaths.includes(to.path)) {
    // If already authenticated, skip login/register
    if ($supabase && to.path !== '/auth/callback') {
      // getSession() is local (no network) — fine for nav guards
      const { data: { session } } = await ($supabase as any).auth.getSession()
      if (session?.user) return navigateTo('/dashboard')
    }
    return
  }

  if (!$supabase) return navigateTo('/login')

  // getSession() reads from localStorage — fast, no JWT roundtrip.
  // The auth state listener in app.ts keeps it fresh via token refresh.
  const { data: { session } } = await ($supabase as any).auth.getSession()
  if (!session?.user) return navigateTo('/login')
})
