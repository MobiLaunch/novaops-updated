// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { $supabase } = useNuxtApp()

  // Pages that never require auth
  const publicPaths = ['/login', '/register', '/auth/callback', '/intro']
  if (publicPaths.includes(to.path)) {
    // If already authenticated, skip login/register (but not callback)
    if ($supabase && to.path !== '/auth/callback') {
      const { data: { user } } = await ($supabase as any).auth.getUser()
      if (user) return navigateTo('/dashboard')
    }
    return
  }

  // If Supabase isn't configured, only allow public pages
  if (!$supabase) return navigateTo('/login')

  // Validate session server-side (getUser hits the Supabase JWT endpoint)
  const { data: { user } } = await ($supabase as any).auth.getUser()
  if (!user) return navigateTo('/login')
})
