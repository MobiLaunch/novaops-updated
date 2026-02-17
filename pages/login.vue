<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-3xl text-center">NovaOps</CardTitle>
      <CardDescription class="text-center">Sign in to your account</CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <div v-if="error" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <p class="text-sm text-destructive">{{ error }}</p>
      </div>

      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input 
          id="email" 
          v-model="email" 
          type="email" 
          placeholder="Enter your email"
          @keyup.enter="handleLogin"
          :disabled="loading"
        />
      </div>
      
      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input 
          id="password" 
          v-model="password" 
          type="password" 
          placeholder="Enter your password"
          @keyup.enter="handleLogin"
          :disabled="loading"
        />
      </div>

      <Button 
        class="w-full" 
        size="lg"
        @click="handleLogin"
        :disabled="loading"
      >
        <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
        Sign In
      </Button>

      <div class="text-center">
        <p class="text-sm text-muted-foreground">
          Don't have an account?
          <NuxtLink to="/register" class="text-primary hover:underline">
            Sign up
          </NuxtLink>
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

definePageMeta({
  layout: 'auth'
})

const { $supabase } = useNuxtApp()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data, error: authError } = await $supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    if (data.user) {
      // Check if profile exists, create if not
      const { data: profile, error: profileError } = await $supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await $supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            business_name: '',
            phone: '',
            address: '',
            currency: '$'
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
        }
      }

      // Navigate to dashboard
      await navigateTo('/dashboard')
    }
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.message || 'Failed to sign in. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>
