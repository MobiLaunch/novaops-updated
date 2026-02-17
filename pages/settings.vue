<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold">Settings</h2>
      <p class="text-sm text-muted-foreground mt-1">Configure your business and integrations</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="business-name">Business Name</Label>
            <Input id="business-name" v-model="form.businessName" placeholder="Your Repair Shop" />
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="form.email" type="email" placeholder="contact@yourshop.com" />
          </div>

          <div class="space-y-2">
            <Label for="phone">Phone</Label>
            <Input id="phone" v-model="form.phone" placeholder="(555) 123-4567" />
          </div>

          <div class="space-y-2">
            <Label for="address">Address</Label>
            <Textarea id="address" v-model="form.address" :rows="3" placeholder="123 Main St, City, State ZIP" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="currency">Currency</Label>
              <Input id="currency" v-model="form.currency" placeholder="$" />
            </div>

            <div class="space-y-2">
              <Label for="tax-rate">Tax Rate (%)</Label>
              <Input id="tax-rate" v-model.number="form.taxRate" type="number" step="0.01" />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="statuses">Ticket Statuses (comma separated)</Label>
            <Input id="statuses" v-model="form.statuses" placeholder="Open, In Progress, Completed" />
          </div>

          <div class="space-y-2">
            <Label for="pin">Screen Lock PIN (4 digits)</Label>
            <Input 
              id="pin" 
              v-model="form.pin" 
              type="password"
              maxlength="4"
              placeholder="1234" 
            />
            <p class="text-xs text-muted-foreground">Screen locks after 3 minutes of inactivity</p>
          </div>

          <Button @click="saveSettings">
            <Save class="w-4 h-4 mr-2" />
            Save Business Settings
          </Button>
        </CardContent>
      </Card>

      <div class="space-y-6">
        
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <CreditCard class="w-5 h-5" />
              Square Integration
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div class="flex items-start gap-3">
                <Info class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div class="text-sm text-blue-500">
                  <p class="font-medium mb-1">Square Setup</p>
                  <p class="text-xs opacity-80">Your Access Token, Application ID, and Location ID must be set as Vercel environment variables: <code class="font-mono">SQUARE_ACCESS_TOKEN</code>, <code class="font-mono">SQUARE_APPLICATION_ID</code>, <code class="font-mono">SQUARE_LOCATION_ID</code>. Enter your Terminal Device ID below to push payments directly to the terminal.</p>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="square-device-id">Terminal Device ID</Label>
              <div class="flex gap-2">
                <Input 
                  id="square-device-id" 
                  v-model="squareSettings.deviceId"
                  placeholder="device:..."
                  @change="saveSquareSettings"
                />
                <Button variant="outline" size="sm" @click="startPairing" :disabled="isPairing" class="flex-shrink-0">
                  <MonitorSmartphone class="w-4 h-4 mr-1.5" />
                  Pair
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">Leave blank to use browser card form only.</p>
            </div>

            <!-- Pairing Flow -->
            <div v-if="pairingState !== 'idle'" class="p-4 rounded-lg border space-y-3"
              :class="pairingState === 'paired' ? 'bg-emerald-500/5 border-emerald-500/20' : pairingState === 'expired' ? 'bg-red-500/5 border-red-500/20' : 'bg-blue-500/5 border-blue-500/20'">
              
              <div v-if="pairingState === 'loading'" class="flex items-center gap-2 text-sm text-muted-foreground">
                <div class="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                Generating pairing code...
              </div>

              <div v-else-if="pairingState === 'waiting'" class="space-y-3">
                <div class="flex items-start gap-3">
                  <MonitorSmartphone class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium">Enter this code on your Square Terminal</p>
                    <p class="text-xs text-muted-foreground">On the terminal: Sign In → Use a Device Code</p>
                  </div>
                </div>
                <div class="flex items-center justify-center">
                  <div class="bg-background border-2 border-primary/30 rounded-xl px-8 py-4">
                    <span class="text-4xl font-bold tracking-[0.3em] font-mono text-primary">{{ pairingCode }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <div class="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  Waiting for terminal to pair...
                </div>
              </div>

              <div v-else-if="pairingState === 'paired'" class="flex items-center gap-3">
                <CheckCircle class="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p class="text-sm font-medium text-emerald-700">Terminal paired successfully!</p>
                  <p class="text-xs text-muted-foreground font-mono">{{ squareSettings.deviceId }}</p>
                </div>
              </div>

              <div v-else-if="pairingState === 'expired'" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p class="text-sm text-red-600">Pairing code expired</p>
                </div>
                <Button variant="outline" size="sm" @click="startPairing">Try Again</Button>
              </div>
            </div>

            <div class="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="squareSettings.enabled ? 'bg-emerald-500' : 'bg-gray-500'"></div>
                <span class="text-sm font-medium">{{ squareSettings.enabled ? 'Connected' : 'Disconnected' }}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                @click="toggleSquare"
              >
                {{ squareSettings.enabled ? 'Disable' : 'Enable' }}
              </Button>
            </div>

            <Button 
              variant="outline" 
              class="w-full"
              @click="testSquareConnection"
            >
              <Zap class="w-4 h-4 mr-2" />
              Test Server Connection
            </Button>
            
            <div class="pt-2 border-t text-center">
              <a href="https://developer.squareup.com/apps" target="_blank" class="text-xs text-primary hover:underline inline-flex items-center gap-1">
                Square Developer Dashboard
                <ExternalLink class="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Database class="w-5 h-5" />
              Supabase Integration
            </CardTitle>
          </CardHeader>

          <CardContent class="space-y-4">
            <div class="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div class="flex items-start gap-3">
                <Info class="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div class="text-sm text-emerald-500">
                  <p class="font-medium mb-1">Cloud Database</p>
                  <p class="text-xs opacity-80">
                    Data syncs automatically using environment configuration.
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Project URL</Label>
              <Input :model-value="supabaseUrl" disabled placeholder="Set in .env file" />
            </div>

            <div class="flex items-center justify-between p-3 rounded-lg border">
              <div class="text-sm">
                <p class="font-medium">
                  <span v-if="supabaseStatus.state === 'checking'" class="text-yellow-600">Checking...</span>
                  <span v-else-if="supabaseStatus.state === 'connected'" class="text-emerald-500">Connected</span>
                  <span v-else class="text-red-500">Disconnected</span>
                </p>
                <p class="text-xs opacity-70">{{ supabaseStatus.message }}</p>
              </div>

              <Button variant="outline" size="sm" @click="checkSupabaseConnection" :disabled="supabaseStatus.state === 'checking'">
                <RefreshCw v-if="supabaseStatus.state === 'checking'" class="w-3 h-3 animate-spin" />
                <span v-else>Test</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button variant="outline" class="w-full" @click="exportData">
              <Download class="w-4 h-4 mr-2" />
              Export All Data
            </Button>

            <Button variant="outline" class="w-full" @click="clearCache">
              <RefreshCw class="w-4 h-4 mr-2" />
              Clear Cache
            </Button>

            <Button variant="destructive" class="w-full" @click="resetData">
              <Trash2 class="w-4 h-4 mr-2" />
              Reset All Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span class="text-sm font-semibold text-primary-foreground">{{ userInitials }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ userEmail }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ form.businessName || 'Business User' }}</p>
              </div>
            </div>

            <Button variant="outline" class="w-full" @click="logout">
              <LogOut class="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <Dialog v-model:open="sqlModalOpen">
      <DialogContent class="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-amber-500" />
            Manual SQL Setup Required
          </DialogTitle>
        </DialogHeader>
        
        <div class="flex-1 overflow-y-auto space-y-4 py-4">
          <div class="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p class="text-sm text-amber-600">
              Automatic table creation failed. Please run the SQL below in your Supabase SQL Editor.
            </p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-base font-semibold">SQL Commands</Label>
              <Button size="sm" variant="outline" @click="copySQLToClipboard">
                <Copy class="w-4 h-4 mr-2" />
                Copy SQL
              </Button>
            </div>
            
            <div class="relative">
              <pre class="p-4 rounded-lg bg-muted text-xs overflow-x-auto max-h-96 overflow-y-auto"><code>{{ sqlCommands }}</code></pre>
            </div>
          </div>

          <div class="space-y-3 pt-4 border-t">
            <p class="font-medium">Steps to complete setup:</p>
            <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Click "Copy SQL" button above</li>
              <li>Go to <a href="https://app.supabase.com" target="_blank" class="text-primary hover:underline">Supabase Dashboard</a></li>
              <li>Navigate to SQL Editor</li>
              <li>Paste the SQL commands</li>
              <li>Click "Run" to execute</li>
              <li>Come back here and click "Test Connection"</li>
            </ol>
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t">
          <Button variant="outline" class="flex-1" @click="sqlModalOpen = false">
            Close
          </Button>
          <Button class="flex-1" @click="openSupabaseDashboard">
            <ExternalLink class="w-4 h-4 mr-2" />
            Open Supabase
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAppStore } from '~/stores/app'
import { 
  Save, CreditCard, Info, Zap, ExternalLink, Download, 
  RefreshCw, Trash2, LogOut, Database, AlertCircle, Copy,
  MonitorSmartphone, CheckCircle
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
// FIX: Manual Import
import { createClient } from '@supabase/supabase-js'

const appStore = useAppStore()
const config = useRuntimeConfig()

// Initialize Supabase client manually to avoid auto-import issues
const supabaseUrl = config.public.supabaseUrl as string
const supabaseKey = config.public.supabaseKey as string
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize form with store settings
const form = ref({
  businessName: appStore.settings?.businessName || '',
  email: appStore.settings?.email || '',
  phone: appStore.settings?.phone || '',
  address: appStore.settings?.address || '',
  currency: appStore.settings?.currency || '$',
  taxRate: appStore.settings?.taxRate || 0,
  statuses: appStore.settings?.statuses || 'Open, In Progress, Completed',
  pin: appStore.settings?.pin || '1234'
})

const saveSettings = async () => {
  // Update local store
  appStore.settings = { ...appStore.settings, ...form.value }
  
  // Persist to Supabase if logged in
  if (appStore.user) {
    try {
      await supabase.from('profiles').update({
        business_name: form.value.businessName,
        phone: form.value.phone,
        address: form.value.address,
        currency: form.value.currency,
      }).eq('id', appStore.user.id)
    } catch (e) {
      console.error('Failed to sync settings to cloud', e)
    }
  }
  
  appStore.saveAll() // Fallback to local storage
  alert('Settings saved successfully!')
}

// --- Square Integration ---
const squareSettings = ref({
  enabled: false,
  deviceId: '',
})

onMounted(() => {
  const saved = localStorage.getItem('squareSettings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      squareSettings.value.enabled = parsed.enabled || false
      squareSettings.value.deviceId = parsed.deviceId || ''
    } catch(e) {}
  }
})

const isPairing = ref(false)
const pairingState = ref<'idle' | 'loading' | 'waiting' | 'paired' | 'expired'>('idle')
const pairingCode = ref('')
const pairingDeviceCodeId = ref('')
let pairingPollTimer: ReturnType<typeof setInterval> | null = null

const startPairing = async () => {
  isPairing.value = true
  pairingState.value = 'loading'
  pairingCode.value = ''
  pairingDeviceCodeId.value = ''
  if (pairingPollTimer) clearInterval(pairingPollTimer)

  try {
    const data: any = await $fetch('/api/square/pair-device', { method: 'POST' })
    pairingCode.value = data.pairingCode
    pairingDeviceCodeId.value = data.deviceCodeId
    pairingState.value = 'waiting'
    startPairingPoll()
  } catch (err: any) {
    isPairing.value = false
    pairingState.value = 'idle'
    alert('❌ Failed to generate pairing code: ' + (err.data?.statusMessage || err.message) + '\n\nMake sure your Vercel environment variables are set correctly.')
  }
}

const startPairingPoll = () => {
  pairingPollTimer = setInterval(async () => {
    try {
      const data: any = await $fetch('/api/square/device-status?deviceCodeId=' + pairingDeviceCodeId.value)
      if (data.status === 'PAIRED' && data.deviceId) {
        clearInterval(pairingPollTimer!)
        pairingState.value = 'paired'
        isPairing.value = false
        squareSettings.value.deviceId = data.deviceId
        squareSettings.value.enabled = true
        saveSquareSettings()
      } else if (data.status === 'EXPIRED') {
        clearInterval(pairingPollTimer!)
        pairingState.value = 'expired'
        isPairing.value = false
      }
    } catch (e) {
      console.error('Pairing poll error', e)
    }
  }, 3000)
}

const saveSquareSettings = () => {
  localStorage.setItem('squareSettings', JSON.stringify(squareSettings.value))
}

const toggleSquare = () => {
  squareSettings.value.enabled = !squareSettings.value.enabled
  saveSquareSettings()
}

const testSquareConnection = async () => {
  try {
    const data = await $fetch('/api/square/test', { method: 'POST' })
    alert(`✅ Connected to Square location: ${(data as any).locationName}`)
    squareSettings.value.enabled = true
    saveSquareSettings()
  } catch (e: any) {
    squareSettings.value.enabled = false
    alert(`❌ Connection failed: ${e.data?.statusMessage || e.statusMessage || e.message}\n\nMake sure SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID are set in your Vercel environment variables.`)
  }
}

// --- Supabase Integration ---
const sqlModalOpen = ref(false)
const supabaseStatus = ref({
  state: 'idle', // 'idle' | 'checking' | 'connected' | 'error'
  message: 'Click Test to check connection'
})

const checkSupabaseConnection = async () => {
  supabaseStatus.value = { state: 'checking', message: 'Pinging database...' }

  if (!supabaseUrl) {
    supabaseStatus.value = { state: 'error', message: 'Missing NUXT_PUBLIC_SUPABASE_URL' }
    return
  }

  try {
    // Simple query to check connectivity
    const { error } = await supabase.from('tickets').select('id').limit(1)
    
    // Check for "table missing" error codes (Postgres 42P01 or PGRST204)
    if (error && (error.code === 'PGRST204' || error.code === '42P01')) {
      sqlModalOpen.value = true
      supabaseStatus.value = { state: 'error', message: 'Connected, but tables missing.' }
    } else if (error) {
      throw error
    } else {
      supabaseStatus.value = { state: 'connected', message: 'Database reachable.' }
    }
  } catch (err: any) {
    console.error('Supabase connection error:', err)
    supabaseStatus.value = { 
      state: 'error', 
      message: err.message || 'Connection failed' 
    }
  }
}

const copySQLToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(sqlCommands)
    alert('SQL copied to clipboard!')
  } catch (e) {
    alert('Failed to copy. Please select text manually.')
  }
}

const openSupabaseDashboard = () => {
  window.open('https://app.supabase.com/project/_/sql', '_blank')
}

// --- Data Management ---
const userEmail = computed(() => appStore.user?.email || form.value.email || 'user@example.com')
const userInitials = computed(() => userEmail.value.substring(0, 2).toUpperCase())

const exportData = () => {
  const data = {
    settings: appStore.settings,
    tickets: appStore.tickets,
    customers: appStore.customers,
    inventory: appStore.inventory
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const clearCache = () => {
  if (confirm('Clear local cache and refresh?')) {
    localStorage.clear()
    location.reload()
  }
}

const resetData = () => {
  if (confirm('WARNING: This will delete ALL local data. Continue?')) {
    localStorage.clear()
    location.reload()
  }
}

const logout = async () => {
  await appStore.logout()
}

const sqlCommands = `-- Create profiles table
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  business_name text,
  phone text,
  address text,
  currency text default '$',
  created_at timestamp with time zone default now()
);

-- Create customers table
create table if not exists customers (
  id bigserial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  driver_license text,
  address text,
  tags text[],
  notes text,
  created_at timestamp with time zone default now()
);

-- Create tickets table
create table if not exists tickets (
  id bigserial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  customer_id bigint references customers(id),
  device text not null,
  device_model text,
  device_description text,
  issue text not null,
  status text default 'Open',
  priority text default 'normal',
  price numeric default 0,
  serial_number text,
  signature text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create house_calls table
create table if not exists house_calls (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  customer_id bigint references customers(id),
  description text not null,
  date date not null,
  time time not null,
  address text not null,
  estimated_duration integer,
  status text default 'scheduled',
  notes text,
  created_at timestamp with time zone default now()
);

-- Create appointments table
create table if not exists appointments (
  id text primary key,
  profile_id uuid references profiles(id) on delete cascade,
  customer_id bigint references customers(id),
  description text not null,
  date date not null,
  time time not null,
  status text default 'scheduled',
  notes text,
  created_at timestamp with time zone default now()
);

-- Create inventory table
create table if not exists inventory (
  id bigserial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  sku text,
  stock integer default 0,
  low integer default 5,
  cost numeric default 0,
  price numeric default 0,
  category text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table customers enable row level security;
alter table tickets enable row level security;
alter table house_calls enable row level security;
alter table appointments enable row level security;
alter table inventory enable row level security;

-- Create RLS Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can view own customers" on customers for all using (profile_id = auth.uid());
create policy "Users can view own tickets" on tickets for all using (profile_id = auth.uid());
create policy "Users can view own house calls" on house_calls for all using (profile_id = auth.uid());
create policy "Users can view own appointments" on appointments for all using (profile_id = auth.uid());
create policy "Users can view own inventory" on inventory for all using (profile_id = auth.uid());
`
</script>