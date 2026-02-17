export const useSupabaseStatus = () => {
  const { $supabase } = useNuxtApp()
  const status = ref<'checking' | 'connected' | 'disconnected'>('checking')

  const check = async () => {
    try {
      // minimal request
      const { error } = await $supabase.from('profiles').select('id').limit(1)

      status.value = error ? 'disconnected' : 'connected'
    } catch {
      status.value = 'disconnected'
    }
  }

  onMounted(check)

  return { status, check }
}
