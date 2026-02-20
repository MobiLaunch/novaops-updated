<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style="background: hsl(var(--background))">

    <!-- M3 Expressive background blobs -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style="background: radial-gradient(circle, #6366f1, transparent)" />
      <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style="background: radial-gradient(circle, #a855f7, transparent)" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl" style="background: radial-gradient(circle, #06b6d4, transparent)" />
    </div>

    <div class="relative w-full max-w-sm flex flex-col gap-7" style="animation: loginEnter 0.5s cubic-bezier(0.34,1.3,0.64,1) both">

      <!-- Logo & Brand -->
      <div class="flex flex-col items-center gap-4">
        <div
          class="w-20 h-20 rounded-[32px] flex items-center justify-center shadow-2xl m3-logo-bounce"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 8px 40px #6366f160"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" style="width:36px;height:36px">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 2.5a.5.5 0 0 0-.707 0L11.5 3.793l-.647-.646a.5.5 0 0 0-.707.707L11 4.707 9.146 6.561A4 4 0 0 0 4 11.5a.5.5 0 0 0 .854.354l1.292-1.293a.5.5 0 0 1 .708 0l.585.585a.5.5 0 0 1 0 .708L6.146 13.146A.5.5 0 0 0 6.5 14a4 4 0 0 0 4.939-4.146L13.5 7.707l.293.293a.5.5 0 0 0 .707-.707l-.646-.647 1.293-1.293a.5.5 0 0 0 0-.707L13.5 2.5Z" />
          </svg>
        </div>
        <div class="text-center">
          <h1 class="text-3xl font-black tracking-tight">NovaOps</h1>
          <p class="text-sm text-muted-foreground mt-1 font-medium">Sign in to your repair shop</p>
        </div>
      </div>

      <!-- Card -->
      <div class="rounded-[32px] bg-card p-7 flex flex-col gap-5 shadow-xl" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">

        <!-- Error alert -->
        <div
          v-if="error"
          class="flex items-center gap-3 p-4 rounded-[20px]"
          style="background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0"
        >
          <AlertCircle class="w-5 h-5 flex-shrink-0" style="color: #ef4444" />
          <p class="text-sm font-semibold" style="color: #ef4444">{{ error }}</p>
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="w-full h-12 px-4 rounded-[20px] text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full h-12 px-4 rounded-[20px] text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Sign In button — stadium shape jelly bean -->
        <button
          class="m3-jelly-btn w-full h-14 rounded-full text-sm font-black text-white shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 20px #6366f150"
          :disabled="loading"
          @click="handleLogin"
        >
          <div v-if="loading" class="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
          <LogIn v-else class="w-5 h-5" />
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>

        <!-- Divider -->
        <div class="relative flex items-center gap-3">
          <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
          <span class="text-xs text-muted-foreground font-semibold">New here?</span>
          <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
        </div>

        <!-- Register button — tonal secondary -->
        <NuxtLink to="/register">
          <button class="m3-tonal-btn w-full h-12 rounded-full text-sm font-bold transition-all" style="background: hsl(var(--muted)); color: hsl(var(--foreground))">
            Create an account
          </button>
        </NuxtLink>

      </div>

      <p class="text-center text-xs text-muted-foreground font-medium">
        Repair shop management by NovaOps
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LogIn, AlertCircle } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const { $supabase } = useNuxtApp()
const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data, error: authError } = await ($supabase as any).auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (authError) throw authError
    if (data.user) {
      const { error: profileError } = await ($supabase as any)
        .from('profiles').select('*').eq('id', data.user.id).single()
      if (profileError?.code === 'PGRST116') {
        await ($supabase as any).from('profiles').insert({
          id: data.user.id, email: data.user.email,
          business_name: '', phone: '', address: '', currency: '$'
        })
      }
      await navigateTo('/dashboard')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to sign in. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes loginEnter {
  0%   { transform: scale(0.94) translateY(20px); opacity: 0; }
  65%  { transform: scale(1.02) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}

.m3-logo-bounce {
  animation: logoBounce 0.6s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes logoBounce {
  0%   { transform: scale(0.6) rotate(-10deg); opacity: 0; }
  65%  { transform: scale(1.1) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); }
}

.m3-jelly-btn {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-jelly-btn:hover:not(:disabled)  { transform: scale(1.04) translateY(-2px); box-shadow: 0 8px 32px #6366f160 !important; }
.m3-jelly-btn:active:not(:disabled) { transform: scale(0.92); }

.m3-tonal-btn {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.m3-tonal-btn:hover  { transform: scale(1.03); }
.m3-tonal-btn:active { transform: scale(0.95); }
</style>