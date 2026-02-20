<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="w-full max-w-sm space-y-6">

      <!-- Logo -->
      <div class="flex flex-col items-center gap-3">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" style="width:28px;height:28px">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 2.5a.5.5 0 0 0-.707 0L11.5 3.793l-.647-.646a.5.5 0 0 0-.707.707L11 4.707 9.146 6.561A4 4 0 0 0 4 11.5a.5.5 0 0 0 .854.354l1.292-1.293a.5.5 0 0 1 .708 0l.585.585a.5.5 0 0 1 0 .708L6.146 13.146A.5.5 0 0 0 6.5 14a4 4 0 0 0 4.939-4.146L13.5 7.707l.293.293a.5.5 0 0 0 .707-.707l-.646-.647 1.293-1.293a.5.5 0 0 0 0-.707L13.5 2.5Z" />
          </svg>
        </div>
        <div class="text-center">
          <h1 class="text-2xl font-bold tracking-tight">NovaOps</h1>
          <p class="text-sm text-muted-foreground mt-1">Sign in to your repair shop</p>
        </div>
      </div>

      <!-- Card -->
      <Card class="stat-card">
        <CardContent class="p-6 space-y-4">

          <!-- Error -->
          <div v-if="error" class="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertCircle class="w-4 h-4 text-destructive flex-shrink-0" />
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>

          <div class="space-y-2">
            <Label for="email" class="text-sm font-medium">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              @keyup.enter="handleLogin"
              :disabled="loading"
              class="h-10"
            />
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-sm font-medium">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              @keyup.enter="handleLogin"
              :disabled="loading"
              class="h-10"
            />
          </div>

          <Button
            class="w-full h-10 font-semibold"
            @click="handleLogin"
            :disabled="loading"
          >
            <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            <LogIn v-else class="w-4 h-4 mr-2" />
            Sign In
          </Button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-border" />
            </div>
            <div class="relative flex justify-center">
              <span class="bg-card px-3 text-xs text-muted-foreground">New here?</span>
            </div>
          </div>

          <NuxtLink to="/register">
            <Button variant="outline" class="w-full h-10">
              Create an account
            </Button>
          </NuxtLink>

        </CardContent>
      </Card>

      <p class="text-center text-xs text-muted-foreground">
        Repair shop management by NovaOps
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2, LogIn, AlertCircle } from 'lucide-vue-next'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

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
  error.value   = ''
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
          id: data.user.id,
          email: data.user.email,
          business_name: '',
          phone: '',
          address: '',
          currency: '$'
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

