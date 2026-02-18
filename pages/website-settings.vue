<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold">Website Settings</h2>
      <p class="text-sm text-muted-foreground mt-1">Customize your customer-facing portal — changes go live instantly.</p>
    </div>

    <!-- Live preview link -->
    <div class="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
      <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Globe class="w-5 h-5 text-primary" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold">Your Customer Portal</p>
        <p class="text-xs text-muted-foreground truncate">All changes save to Supabase and reflect on your public portal immediately.</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- ── LEFT COL: Main settings ── -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Brand & Hero -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-primary" />
              Branding & Hero
            </CardTitle>
            <CardDescription>What customers see first when they visit your portal.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Business Name</Label>
              <Input v-model="form.business_name" placeholder="NovaOps Repair" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Hero Line 1</Label>
                <Input v-model="form.hero_line1" placeholder="Your Device," />
              </div>
              <div class="space-y-2">
                <Label>Hero Line 2 (gradient)</Label>
                <Input v-model="form.hero_line2" placeholder="Fixed Fast." />
              </div>
            </div>

            <div class="space-y-2">
              <Label>Hero Subtitle</Label>
              <Textarea v-model="form.hero_subtitle" :rows="2" placeholder="Professional repair services…" />
            </div>

            <div class="space-y-2">
              <Label>Hero Badge Text</Label>
              <Input v-model="form.hero_badge" placeholder="Repair · Booking · Support" />
            </div>

            <div class="space-y-2">
              <Label>Primary Brand Color</Label>
              <div class="flex items-center gap-3">
                <input
                  type="color"
                  v-model="form.primary_color"
                  class="w-12 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <Input v-model="form.primary_color" placeholder="#6366f1" class="font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Stats Bar -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <BarChart3 class="w-5 h-5 text-blue-500" />
              Stats Bar
            </CardTitle>
            <CardDescription>The four numbers displayed below the hero. Leave blank to use live data from your tickets.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Repairs Done</Label>
                <Input v-model="form.stat_repairs" placeholder="Auto (from tickets)" />
              </div>
              <div class="space-y-2">
                <Label>Satisfaction Rate</Label>
                <Input v-model="form.stat_satisfaction" placeholder="98%" />
              </div>
              <div class="space-y-2">
                <Label>Avg Turnaround</Label>
                <Input v-model="form.stat_turnaround" placeholder="~2 hrs" />
              </div>
              <div class="space-y-2">
                <Label>Warranty</Label>
                <Input v-model="form.stat_warranty" placeholder="90-Day" />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Services -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Wrench class="w-5 h-5 text-amber-500" />
              Service Menu
            </CardTitle>
            <CardDescription>Control which services appear on the booking page.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="(service, idx) in form.services"
              :key="idx"
              class="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 group"
            >
              <div class="text-2xl w-9 text-center flex-shrink-0">{{ service.icon }}</div>
              <div class="flex-1 min-w-0 grid grid-cols-2 gap-3">
                <Input v-model="service.name" placeholder="Service name" class="text-sm h-8" />
                <Input v-model="service.price" placeholder="From $49" class="text-sm h-8" />
                <Input v-model="service.description" placeholder="Short description" class="text-sm h-8 col-span-2" />
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <Input v-model="service.icon" placeholder="🔧" class="w-14 text-center text-lg h-8 p-1" />
                <div class="flex items-center gap-1.5">
                  <Switch
                    :checked="service.enabled !== false"
                    @update:checked="v => service.enabled = v"
                  />
                  <span class="text-xs text-muted-foreground">{{ service.enabled !== false ? 'On' : 'Off' }}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  @click="removeService(idx)"
                >
                  <X class="w-3 h-3" />
                </Button>
              </div>
            </div>

            <Button variant="outline" size="sm" @click="addService" class="w-full mt-2">
              <Plus class="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </CardContent>
        </Card>

        <!-- Chat -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <MessageSquare class="w-5 h-5 text-cyan-500" />
              Chat Widget
            </CardTitle>
            <CardDescription>Customise the AI chat assistant that appears on your portal.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Bot Name</Label>
              <Input v-model="form.chat_bot_name" placeholder="Nova Assistant" />
            </div>
            <div class="space-y-2">
              <Label>Opening Greeting</Label>
              <Textarea v-model="form.chat_greeting" :rows="2" placeholder="Hey! 👋 I'm Nova…" />
            </div>
          </CardContent>
        </Card>

      </div>

      <!-- ── RIGHT COL ── -->
      <div class="space-y-6">

        <!-- Contact & Footer -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Phone class="w-5 h-5 text-emerald-500" />
              Contact & Footer
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Phone Number</Label>
              <Input v-model="form.phone" placeholder="(555) 123-4567" />
            </div>
            <div class="space-y-2">
              <Label>Address</Label>
              <Textarea v-model="form.address" :rows="2" placeholder="123 Main St, City, ST" />
            </div>
            <div class="space-y-2">
              <Label>Footer Text</Label>
              <Input v-model="form.footer_text" :placeholder="`© ${new Date().getFullYear()} ${form.business_name || 'NovaOps'}. All rights reserved.`" />
            </div>
            <div class="space-y-2">
              <Label>Currency Symbol</Label>
              <Input v-model="form.currency" placeholder="$" class="w-20" />
            </div>
          </CardContent>
        </Card>

        <!-- Features -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Star class="w-5 h-5 text-pink-500" />
              Feature Cards
            </CardTitle>
            <CardDescription>Edit the "Why Us" section. Use emoji for icons.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="(feat, idx) in form.features"
              :key="idx"
              class="p-3 rounded-xl border border-border bg-muted/20 space-y-2 group relative"
            >
              <div class="flex items-center gap-2">
                <Input v-model="feat.icon" placeholder="🔍" class="w-14 text-center text-lg h-8 p-1 flex-shrink-0" />
                <Input v-model="feat.title" placeholder="Feature title" class="text-sm h-8" />
                <Button
                  variant="ghost" size="icon"
                  class="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 text-destructive"
                  @click="removeFeature(idx)"
                >
                  <X class="w-3 h-3" />
                </Button>
              </div>
              <Textarea v-model="feat.description" :rows="2" placeholder="Short description…" class="text-xs" />
            </div>
            <Button variant="outline" size="sm" @click="addFeature" class="w-full">
              <Plus class="w-4 h-4 mr-2" />
              Add Feature Card
            </Button>
          </CardContent>
        </Card>

        <!-- Save card -->
        <Card class="sticky top-20">
          <CardContent class="p-5 space-y-3">
            <div v-if="saveStatus === 'saved'" class="flex items-center gap-2 text-sm text-emerald-500 font-medium">
              <CheckCircle class="w-4 h-4" />
              Saved & live!
            </div>
            <div v-else-if="saveStatus === 'error'" class="flex items-center gap-2 text-sm text-destructive font-medium">
              <AlertCircle class="w-4 h-4" />
              {{ saveError }}
            </div>
            <Button class="w-full" @click="saveSettings" :disabled="isSaving">
              <Save v-if="!isSaving" class="w-4 h-4 mr-2" />
              <div v-else class="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {{ isSaving ? 'Saving…' : 'Save & Publish' }}
            </Button>
            <Button variant="outline" class="w-full" @click="loadSettings" :disabled="isSaving">
              <RefreshCw class="w-4 h-4 mr-2" />
              Reload from Cloud
            </Button>
            <p class="text-xs text-center text-muted-foreground">
              Changes are published immediately to your customer portal.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>

    <!-- SQL setup notice -->
    <Card v-if="showSqlNotice" class="border-amber-500/30 bg-amber-500/5">
      <CardContent class="p-5">
        <div class="flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div class="flex-1 space-y-3">
            <div>
              <p class="font-semibold text-amber-600 text-sm">One-time setup required</p>
              <p class="text-xs text-muted-foreground mt-1">
                Run the SQL below in your Supabase SQL Editor to create the <code class="font-mono bg-muted px-1 rounded">website_settings</code> table.
              </p>
            </div>
            <pre class="p-3 rounded-lg bg-muted text-xs overflow-x-auto">{{ setupSQL }}</pre>
            <div class="flex gap-2">
              <Button size="sm" variant="outline" @click="copySQL">
                <Copy class="w-4 h-4 mr-2" />
                Copy SQL
              </Button>
              <Button size="sm" variant="outline" as="a" href="https://app.supabase.com/project/_/sql" target="_blank">
                <ExternalLink class="w-4 h-4 mr-2" />
                Open Supabase
              </Button>
              <Button size="sm" variant="ghost" @click="showSqlNotice = false">Dismiss</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#app'
import {
  Globe, Sparkles, BarChart3, Wrench, MessageSquare, Phone, Star,
  Save, RefreshCw, Plus, X, CheckCircle, AlertCircle, Copy, ExternalLink
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'

// ── Supabase ──────────────────────────────────────
const config = useRuntimeConfig()
const supabase = createClient(
  config.public.supabaseUrl as string,
  config.public.supabaseKey as string
)

// ── State ─────────────────────────────────────────
const isSaving    = ref(false)
const saveStatus  = ref<'idle' | 'saved' | 'error'>('idle')
const saveError   = ref('')
const showSqlNotice = ref(false)

const DEFAULT_SERVICES = [
  { icon: '📱', name: 'Screen Repair',          description: 'Cracks, dead pixels, touch issues',  price: 'From $49', enabled: true },
  { icon: '🔋', name: 'Battery Replacement',    description: 'Swollen, draining fast, won\'t charge', price: 'From $39', enabled: true },
  { icon: '💧', name: 'Water Damage Recovery',  description: 'Data recovery & component repair',   price: 'From $79', enabled: true },
  { icon: '⚡', name: 'Charging Port Fix',       description: 'Won\'t charge, loose connection',    price: 'From $45', enabled: true },
  { icon: '💻', name: 'Computer Repair',         description: 'Laptops, desktops, Mac & PC',        price: 'From $59', enabled: true },
  { icon: '🔧', name: 'Other Repair',            description: 'Cameras, tablets, smartwatches',     price: 'Get a quote', enabled: true },
]

const DEFAULT_FEATURES = [
  { icon: '🔍', title: 'Real-Time Tracking',    description: 'Know exactly where your device is in the repair process. No more waiting and wondering.', color: 'rgba(99,102,241,0.15)' },
  { icon: '⚡', title: 'Same-Day Service',       description: 'Most screen and battery repairs completed within 2 hours while you wait or run errands.',  color: 'rgba(245,158,11,0.15)' },
  { icon: '🛡️', title: '90-Day Warranty',       description: 'All parts and labor covered for 90 days. If it fails, we fix it — no questions asked.',    color: 'rgba(16,185,129,0.15)' },
  { icon: '🤝', title: 'Certified Technicians', description: 'Trained and certified. Thousands of successful repairs across all major brands.',           color: 'rgba(236,72,153,0.15)' },
  { icon: '💬', title: 'AI-Powered Chat',        description: 'Get instant answers about pricing, turnaround, and your specific repair — anytime.',       color: 'rgba(6,182,212,0.15)' },
  { icon: '🏠', title: 'House Calls Available',  description: 'Can\'t come to us? We\'ll come to you for select repairs. Ask about availability.',         color: 'rgba(249,115,22,0.15)' },
]

const form = ref({
  business_name:    '',
  hero_line1:       'Your Device,',
  hero_line2:       'Fixed Fast.',
  hero_subtitle:    'Professional repair services with real-time ticket tracking, easy online booking, and expert support.',
  hero_badge:       'Repair · Booking · Support',
  primary_color:    '#6366f1',
  stat_repairs:     '',
  stat_satisfaction:'98%',
  stat_turnaround:  '~2 hrs',
  stat_warranty:    '90-Day',
  phone:            '',
  address:          '',
  footer_text:      '',
  currency:         '$',
  chat_bot_name:    'Nova Assistant',
  chat_greeting:    'Hey! 👋 I\'m Nova. I can answer questions about your repair, pricing, or help you get booked. What do you need?',
  services:         JSON.parse(JSON.stringify(DEFAULT_SERVICES)) as typeof DEFAULT_SERVICES,
  features:         JSON.parse(JSON.stringify(DEFAULT_FEATURES)) as typeof DEFAULT_FEATURES,
})

// ── Load ──────────────────────────────────────────
async function loadSettings() {
  try {
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      // Table probably doesn't exist yet
      if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
        showSqlNotice.value = true
      }
      return
    }

    if (!data) return  // no rows yet — first time, use defaults

    // Merge fetched values into form
    Object.keys(form.value).forEach(k => {
      if (data[k] !== undefined && data[k] !== null) {
        // @ts-ignore
        form.value[k] = data[k]
      }
    })

    // Parse JSON arrays if stored as strings
    if (typeof form.value.services === 'string') {
      try { form.value.services = JSON.parse(form.value.services) } catch {}
    }
    if (typeof form.value.features === 'string') {
      try { form.value.features = JSON.parse(form.value.features) } catch {}
    }

  } catch (e: any) {
    console.error('[Website Settings] load error:', e)
    showSqlNotice.value = true
  }
}

// ── Save ──────────────────────────────────────────
async function saveSettings() {
  isSaving.value = true
  saveStatus.value = 'idle'

  try {
    const payload = {
      ...form.value,
      // Ensure JSONB arrays are proper objects (not strings)
      services: form.value.services,
      features: form.value.features,
      updated_at: new Date().toISOString(),
    }

    // Try update first, then insert (upsert on id=1 row)
    const { data: existing } = await supabase
      .from('website_settings')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase
        .from('website_settings')
        .update(payload)
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('website_settings')
        .insert(payload)
      if (error) throw error
    }

    saveStatus.value = 'saved'
    setTimeout(() => { saveStatus.value = 'idle' }, 3000)

  } catch (e: any) {
    saveStatus.value = 'error'
    saveError.value = e.message || 'Save failed'
    if (e.code === 'PGRST204' || e.code === '42P01' || e.message?.includes('does not exist')) {
      showSqlNotice.value = true
    }
  } finally {
    isSaving.value = false
  }
}

// ── Services CRUD ────────────────────────────────
function addService() {
  form.value.services.push({ icon: '🔧', name: '', description: '', price: '', enabled: true })
}
function removeService(idx: number) {
  form.value.services.splice(idx, 1)
}

// ── Features CRUD ────────────────────────────────
function addFeature() {
  form.value.features.push({ icon: '⭐', title: '', description: '', color: 'rgba(99,102,241,0.15)' })
}
function removeFeature(idx: number) {
  form.value.features.splice(idx, 1)
}

// ── SQL for table creation ────────────────────────
const setupSQL = `-- Run once in Supabase SQL Editor
create table if not exists website_settings (
  id bigserial primary key,
  business_name    text,
  hero_line1       text,
  hero_line2       text,
  hero_subtitle    text,
  hero_badge       text,
  primary_color    text default '#6366f1',
  stat_repairs     text,
  stat_satisfaction text,
  stat_turnaround  text,
  stat_warranty    text,
  phone            text,
  address          text,
  footer_text      text,
  currency         text default '$',
  chat_bot_name    text,
  chat_greeting    text,
  services         jsonb default '[]',
  features         jsonb default '[]',
  updated_at       timestamp with time zone default now()
);

-- Allow public read access so your portal HTML can load settings
alter table website_settings enable row level security;
create policy "Public read website_settings"
  on website_settings for select
  using (true);
create policy "Auth users manage website_settings"
  on website_settings for all
  using (auth.role() = 'authenticated');`

async function copySQL() {
  try {
    await navigator.clipboard.writeText(setupSQL)
    alert('SQL copied to clipboard!')
  } catch {
    alert('Copy failed — please select the SQL text manually.')
  }
}

onMounted(() => { loadSettings() })
</script>
