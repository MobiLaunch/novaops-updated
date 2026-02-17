// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { $supabase } = useNuxtApp()

  // If Supabase isn't configured, allow navigation to login/register only
  if (!$supabase) {
    if (to.path !== '/login' && to.path !== '/register') {
      return navigateTo('/login')
    }
    return
  }

  // Get current session
  const { data: { user } } = await ($supabase as any).auth.getUser()

  // Not authenticated → redirect to login (except for auth pages)
  if (!user && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }

  // Already authenticated → skip login/register pages
  if (user && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/dashboard')
  }
})

