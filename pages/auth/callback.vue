<template>
  <div class="d-flex min-h-screen align-center justify-center" style="background: rgb(var(--v-theme-background))">
    <div class="d-flex flex-column align-center text-center gap-4">
      <v-progress-circular indeterminate color="primary" size="40" width="4" />
      <p class="text-body-2 text-medium-emphasis font-weight-medium">{{ status }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * /auth/callback
 *
 * Landing page for Supabase OAuth PKCE redirects (Google, Facebook).
 * Supabase's JS client automatically exchanges the code from the URL for a
 * session.  We wait for it, ensure the profile row exists, then redirect.
 */
import { ref, onMounted } from 'vue'

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
        }
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
      .from('profiles').select('id').eq('id', user.id).single()

    if (profileError?.code === 'PGRST116') {
      await ($supabase as any).from('profiles').insert({
        id: user.id, email: user.email,
        business_name: user.user_metadata?.full_name ?? '',
        phone: '', address: '', currency: '$',
      })
      // First social login → intro → profile setup
      await navigateTo('/intro')
      return
    }
  } catch { /* non-fatal */ }
  await navigateTo('/dashboard')
}
</script>
