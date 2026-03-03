export const useAuth = () => {
  const { $supabase } = useNuxtApp()

  const login = async (email: string, password: string) => {
    if ($supabase) {
      const { error } = await $supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    }
    localStorage.setItem('isAuthenticated', 'true')
  }

  const logout = async () => {
    if ($supabase) await $supabase.auth.signOut()
    localStorage.clear()
    navigateTo('/login')
  }

  return { login, logout }
}