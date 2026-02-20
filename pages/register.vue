<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style="background: hsl(var(--background))">

    <!-- Background glows -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl" style="background: radial-gradient(circle, #8b5cf6, transparent)" />
      <div class="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 blur-3xl" style="background: radial-gradient(circle, #6366f1, transparent)" />
    </div>

    <div class="relative w-full max-w-sm flex flex-col gap-7" style="animation: registerEnter 0.5s cubic-bezier(0.34,1.3,0.64,1) both">

      <!-- Logo & Title -->
      <div class="flex flex-col items-center gap-4">
        <div
          class="w-20 h-20 rounded-[32px] flex items-center justify-center shadow-2xl"
          style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); box-shadow: 0 8px 40px #8b5cf660"
        >
          <UserPlus class="w-9 h-9 text-white" />
        </div>
        <div class="text-center">
          <h1 class="text-3xl font-black tracking-tight">Create Account</h1>
          <p class="text-sm text-muted-foreground mt-1 font-medium">Join NovaOps to manage your repair shop</p>
        </div>
      </div>

      <!-- Form Card -->
      <div class="rounded-[32px] bg-card p-7 flex flex-col gap-5 shadow-xl" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">

        <!-- Error banner -->
        <div v-if="error" class="flex items-center gap-3 p-4 rounded-[20px]" style="background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0">
          <AlertCircle class="w-5 h-5 flex-shrink-0" style="color: #ef4444" />
          <p class="text-sm font-semibold" style="color: #ef4444">{{ error }}</p>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Business Name</label>
          <input v-model="businessName" type="text" placeholder="Acme Repair Shop" class="m3-input" :disabled="loading" @keyup.enter="handleRegister" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" class="m3-input" :disabled="loading" @keyup.enter="handleRegister" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Password</label>
          <input v-model="password" type="password" placeholder="At least 6 characters" class="m3-input" :disabled="loading" @keyup.enter="handleRegister" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Confirm Password</label>
          <input v-model="confirmPassword" type="password" placeholder="••••••••" class="m3-input" :disabled="loading" @keyup.enter="handleRegister" />
        </div>

        <button
          class="m3-jelly-btn w-full h-14 rounded-full text-sm font-black text-white shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-60"
          style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); box-shadow: 0 4px 20px #8b5cf650"
          :disabled="loading"
          @click="handleRegister"
        >
          <div v-if="loading" class="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
          <UserPlus v-else class="w-5 h-5" />
          {{ loading ? 'Creating account…' : 'Create Account' }}
        </button>

        <p class="text-[10px] text-center text-muted-foreground font-medium">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>

        <div class="relative flex items-center gap-3">
          <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
          <span class="text-xs text-muted-foreground font-semibold">Already have an account?</span>
          <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
        </div>

        <NuxtLink to="/login">
          <button class="m3-tonal-btn w-full h-12 rounded-full text-sm font-bold" style="background: hsl(var(--muted)); color: hsl(var(--foreground))">
            Sign In Instead
          </button>
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UserPlus, AlertCircle } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })
const { $supabase } = useNuxtApp()

const businessName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!businessName.value) { error.value = 'Please enter your business name'; return }
  if (!email.value || !password.value) { error.value = 'Please fill in all fields'; return }
  if (password.value !== confirmPassword.value) { error.value = 'Passwords do not match'; return }
  if (password.value.length < 6) { error.value = 'Password must be at least 6 characters'; return }
  loading.value = true; error.value = ''
  try {
    const { data, error: authError } = await ($supabase as any).auth.signUp({
      email: email.value,
      password: password.value,
      options: { data: { businessName: businessName.value } },
    })
    if (authError) throw authError
    if (data.user) await navigateTo('/profile-setup')
  } catch (err: any) {
    error.value = err.message || 'Failed to create account.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes registerEnter {
  0%   { transform: scale(0.94) translateY(20px); opacity: 0; }
  65%  { transform: scale(1.02) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}

.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px #8b5cf618; }

.m3-jelly-btn {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
}
.m3-jelly-btn:hover:not(:disabled)  { transform: scale(1.04) translateY(-2px); box-shadow: 0 8px 32px #8b5cf660 !important; }
.m3-jelly-btn:active:not(:disabled) { transform: scale(0.92); }

.m3-tonal-btn {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
  width: 100%;
}
.m3-tonal-btn:hover  { transform: scale(1.03); }
.m3-tonal-btn:active { transform: scale(0.95); }
</style>
