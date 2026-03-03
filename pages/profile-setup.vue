<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style="background: hsl(var(--background))">
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10 blur-3xl" style="background: radial-gradient(circle, #6366f1, transparent)" />
    </div>
    <div class="relative w-full max-w-lg flex flex-col gap-7" style="animation: setupEnter 0.5s cubic-bezier(0.34,1.3,0.64,1) both">
      <div class="text-center flex flex-col items-center gap-4">
        <div class="w-20 h-20 rounded-[32px] flex items-center justify-center shadow-2xl" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 8px 40px #6366f160">
          <Briefcase class="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Welcome to NovaOps!</h1>
          <p class="text-sm text-muted-foreground mt-1 font-medium">Let's set up your repair shop profile</p>
        </div>
      </div>
      <div class="rounded-[32px] bg-card p-8 flex flex-col gap-5 shadow-xl" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="space-y-2">
          <label class="m3-label">Business Name *</label>
          <input v-model="profile.businessName" placeholder="NovaOps Repair Shop" class="m3-input" />
        </div>
        <div class="space-y-2">
          <label class="m3-label">Business Email *</label>
          <input v-model="profile.email" type="email" placeholder="contact@yourshop.com" class="m3-input" />
        </div>
        <div class="space-y-2">
          <label class="m3-label">Phone Number</label>
          <input v-model="profile.phone" type="tel" placeholder="(555) 123-4567" class="m3-input" />
        </div>
        <div class="space-y-2">
          <label class="m3-label">Business Address</label>
          <textarea v-model="profile.address" placeholder="123 Main St, City, State 12345" :rows="2" class="m3-input resize-none" style="height: auto; padding-top: 12px; padding-bottom: 12px;" />
        </div>
        <div class="space-y-2">
          <label class="m3-label">Currency</label>
          <div class="flex gap-2 flex-wrap">
            <button v-for="c in currencies" :key="c.value" class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
              :style="profile.currency === c.value ? 'background: #6366f124; color: #6366f1; outline: 2px solid #6366f150; outline-offset: 0' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
              @click="profile.currency = c.value">{{ c.label }}</button>
          </div>
        </div>

        <!-- Error banner -->
        <div v-if="errorMsg" class="flex items-center gap-2.5 px-4 py-3 rounded-[16px] text-sm font-semibold" style="background: #ef444412; color: #ef4444; outline: 1.5px solid #ef444428; outline-offset: 0">
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          {{ errorMsg }}
        </div>

        <button class="m3-jelly-btn w-full h-14 rounded-full text-sm font-black text-white shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-60"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 20px #6366f150"
          :disabled="!isValid || loading" @click="handleSubmit">
          <div v-if="loading" class="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
          <Briefcase v-else class="w-5 h-5" />
          {{ loading ? 'Setting up…' : 'Complete Setup' }}
        </button>
        <p class="text-xs text-center text-muted-foreground font-medium">You can update these details anytime in Settings</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Briefcase, AlertCircle } from 'lucide-vue-next'
definePageMeta({ layout: 'auth', middleware: ['auth'] })

const { $supabase } = useNuxtApp()
const appStore = useAppStore()

const profile = ref({ businessName: '', email: '', phone: '', address: '', currency: '$' })
const loading = ref(false)
const errorMsg = ref('')

const currencies = [
  { label: '$ USD', value: '$' }, { label: '€ EUR', value: '€' },
  { label: '£ GBP', value: '£' }, { label: '¥ JPY', value: '¥' }, { label: '₹ INR', value: '₹' },
]

onMounted(async () => {
  if ($supabase) {
    const { data: { user } } = await ($supabase as any).auth.getUser()
    if (user?.email) profile.value.email = user.email
    if (user?.user_metadata?.full_name) profile.value.businessName = user.user_metadata.full_name
  }
})

const isValid = computed(() => profile.value.businessName.trim() && profile.value.email.trim())

const handleSubmit = async () => {
  if (!isValid.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    if (!$supabase) throw new Error('Supabase not configured')

    const { data: { user } } = await ($supabase as any).auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await ($supabase as any).from('profiles').upsert({
      id: user.id,
      email: profile.value.email,
      business_name: profile.value.businessName,
      phone: profile.value.phone,
      address: profile.value.address,
      currency: profile.value.currency,
      tax_rate: 0,
      statuses: 'Open, In Progress, Waiting for Parts, Completed, Delivered',
      pin: '1234',
      services: [],
      expenses: [],
    }, { onConflict: 'id' })

    if (error) throw error

    // Sync into store immediately
    appStore.settings.businessName = profile.value.businessName
    appStore.settings.email = profile.value.email
    appStore.settings.phone = profile.value.phone
    appStore.settings.address = profile.value.address
    appStore.settings.currency = profile.value.currency

    await navigateTo('/dashboard')
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to save profile. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
@keyframes setupEnter {
  0% { transform: scale(0.94) translateY(20px); opacity: 0; }
  65% { transform: scale(1.02) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}
.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.7); outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px #6366f118; }
.m3-jelly-btn { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-jelly-btn:hover:not(:disabled) { transform: scale(1.04) translateY(-2px); box-shadow: 0 8px 32px #6366f160 !important; }
.m3-jelly-btn:active:not(:disabled) { transform: scale(0.92); }
</style>
