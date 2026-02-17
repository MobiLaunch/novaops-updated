<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-3xl text-center">Create Account</CardTitle>
      <CardDescription class="text-center">Sign up for NovaOps</CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <div v-if="error" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <p class="text-sm text-destructive">{{ error }}</p>
      </div>

      <div v-if="success" class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <p class="text-sm text-emerald-600">{{ success }}</p>
      </div>

      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input 
          id="email" 
          v-model="email" 
          type="email" 
          placeholder="Enter your email"
          :disabled="loading"
        />
      </div>
      
      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input 
          id="password" 
          v-model="password" 
          type="password" 
          placeholder="Create a password (min 6 characters)"
          :disabled="loading"
        />
      </div>

      <div class="space-y-2">
        <Label for="confirm-password">Confirm Password</Label>
        <Input 
          id="confirm-password" 
          v-model="confirmPassword" 
          type="password" 
          placeholder="Confirm your password"
          @keyup.enter="handleRegister"
          :disabled="loading"
        />
      </div>

      <Button 
        class="w-full" 
        size="lg"
        @click="handleRegister"
        :disabled="loading"
      >
        <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
        Create Account
      </Button>

      <div class="text-center">
        <p class="text-sm text-muted-foreground">
          Already have an account?
          <NuxtLink to="/login" class="text-primary hover:underline">
            Sign in
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
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  // Validation
  if (!email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    // Sign up with Supabase
    const { data, error: authError } = await $supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    if (data.user) {
      // Create profile in profiles table
      const { error: profileError } = await $supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          business_name: '',
          phone: '',
          address: '',
          currency: '$'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }

      // Check if email confirmation is required
      if (data.session) {
        // User is logged in, redirect to dashboard
        success.value = 'Account created successfully! Redirecting...'
        setTimeout(() => {
          navigateTo('/dashboard')
        }, 1500)
      } else {
        // Email confirmation required
        success.value = 'Account created! Please check your email to confirm your account.'
      }
    }
  } catch (err: any) {
    console.error('Registration error:', err)
    error.value = err.message || 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
