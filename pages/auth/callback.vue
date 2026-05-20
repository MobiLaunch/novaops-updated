<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="flex flex-col items-center text-center gap-4">
      <ProgressSpinner style="width: 40px; height: 40px" stroke-width="4" />
      <p class="text-sm text-muted-foreground font-medium m-0">{{ status }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { $supabase } = useNuxtApp()
const status = ref('Completing sign-in…')

onMounted(async () => {
  try {
    const { data: { session }, error } = await ($supabase as any).auth.getSession()
    if (error) throw error

    if (!session?.user) {
      const { data: { subscription } } = ($supabase as any).auth.onAuthStateChange(
        async (event: string, sess: any) => {
          if (event === 'SIGNED_IN' && sess?.user) {
            subscription.unsubscribe()
            await finalize(sess.user)
          }
        },
      )
      setTimeout(() => {
        status.value = 'Sign-in timed out. Redirecting to login…'
        setTimeout(() => navigateTo('/login'), 2000)
      }, 10_000)
    } else {
      await finalize(session.user)
    }
  } catch (err: any) {
    status.value = err.message ?? 'Sign-in failed. Redirecting…'
    setTimeout(() => navigateTo('/login'), 3000)
  }
})

async function finalize(user: any) {
  status.value = 'Setting up your account…'
  try {
    const { error: profileError } = await ($supabase as any)
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError?.code === 'PGRST116') {
      await ($supabase as any).from('profiles').insert({
        id: user.id,
        email: user.email,
        business_name: user.user_metadata?.full_name ?? '',
        phone: '',
        address: '',
        currency: '$',
      })
      await navigateTo('/intro')
      return
    }
  } catch { /* non-fatal */ }
  await navigateTo('/dashboard')
}
</script>
