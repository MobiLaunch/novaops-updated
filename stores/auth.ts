import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'

export const useAuthStore = defineStore('auth', () => {
  const { $supabase } = useNuxtApp()
  const user = ref<any>(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const supabaseReady = ref(!!$supabase)

  const checkAuth = async () => {
    if (!$supabase) return null
    const { data: { session } } = await ($supabase as any).auth.getSession()
    if (!session) return null
    const { data: { user: authUser } } = await ($supabase as any).auth.getUser()
    user.value = authUser
    return authUser
  }

  const logout = async () => {
    if ($supabase) await ($supabase as any).auth.signOut()
    user.value = null
    isLoaded.value = false
    navigateTo('/login')
  }

  return {
    user,
    isLoaded,
    isLoading,
    supabaseReady,
    checkAuth,
    logout
  }
})
