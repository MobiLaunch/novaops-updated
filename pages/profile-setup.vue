<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <Card class="w-full max-w-lg">
      <CardHeader class="space-y-1 text-center pb-8">
        <div class="mx-auto mb-4 w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
          <Briefcase class="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle class="text-2xl font-semibold tracking-tight">Welcome to NovaOps</CardTitle>
        <p class="text-sm text-muted-foreground">
          Let's set up your repair shop profile
        </p>
      </CardHeader>
      
      <CardContent class="space-y-6">
        <!-- Business Name -->
        <div class="space-y-2">
          <Label for="business-name">
            Business Name <span class="text-destructive">*</span>
          </Label>
          <Input 
            id="business-name" 
            v-model="profile.businessName" 
            placeholder="NovaOps Repair Shop"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <Label for="email">
            Business Email <span class="text-destructive">*</span>
          </Label>
          <Input 
            id="email" 
            v-model="profile.email" 
            type="email"
            placeholder="contact@yourshop.com"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- Phone -->
        <div class="space-y-2">
          <Label for="phone">Phone Number</Label>
          <Input 
            id="phone" 
            v-model="profile.phone" 
            type="tel"
            placeholder="(555) 123-4567"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- Address -->
        <div class="space-y-2">
          <Label for="address">Business Address</Label>
          <Textarea 
            id="address" 
            v-model="profile.address" 
            placeholder="123 Main St, Suite 100&#10;City, State 12345"
            :rows="3"
          />
        </div>

        <!-- Currency Selection -->
        <div class="space-y-2">
          <Label for="currency">Currency</Label>
          <Select v-model="profile.currency">
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="$">$ USD</SelectItem>
              <SelectItem value="€">€ EUR</SelectItem>
              <SelectItem value="£">£ GBP</SelectItem>
              <SelectItem value="¥">¥ JPY</SelectItem>
              <SelectItem value="₹">₹ INR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Submit Button -->
        <Button 
          class="w-full"
          @click="handleSubmit"
          :disabled="!isValid || loading"
        >
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          <span v-else>Complete Setup</span>
        </Button>

        <p class="text-xs text-center text-muted-foreground">
          You can update these details anytime in Settings
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Briefcase, Loader2 } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'

definePageMeta({
  layout: 'auth',
  middleware: ['auth']
})

const profile = ref({
  businessName: '',
  email: '',
  phone: '',
  address: '',
  currency: '$'
})

const loading = ref(false)

// Load email from login
onMounted(() => {
  if (process.client) {
    const userEmail = localStorage.getItem('user_email')
    if (userEmail) {
      profile.value.email = userEmail
    }
    
    // Load existing profile if any
    const existingProfile = localStorage.getItem('business_profile')
    if (existingProfile) {
      const data = JSON.parse(existingProfile)
      profile.value = { ...profile.value, ...data }
    }
  }
})

const isValid = computed(() => {
  return profile.value.businessName.trim() && profile.value.email.trim()
})

const handleSubmit = async () => {
  if (!isValid.value) {
    alert('Please fill in all required fields')
    return
  }

  loading.value = true

  try {
    // In production, this would save to Supabase
    // For now, save to localStorage and navigate
    if (process.client) {
      localStorage.setItem('profile_setup_complete', 'true')
      localStorage.setItem('business_profile', JSON.stringify(profile.value))
      
      // Also update settings
      const settings = {
        businessName: profile.value.businessName,
        email: profile.value.email,
        phone: profile.value.phone,
        address: profile.value.address,
        currency: profile.value.currency,
        taxRate: 0,
        statuses: 'Open, In Progress, Waiting for Parts, Completed, Delivered'
      }
      localStorage.setItem('nova_settings', JSON.stringify(settings))
      
      // Navigate to dashboard
      setTimeout(() => {
        navigateTo('/dashboard')
      }, 500)
    }
  } catch (error) {
    console.error('Profile setup error:', error)
    alert('Failed to save profile. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>
