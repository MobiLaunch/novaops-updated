<template>
  <div class="space-y-6 max-w-6xl">

    <!-- ── Page Header ── -->
    <div class="flex items-center gap-4">
      <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #64748b18; outline: 1.5px solid #64748b25; outline-offset: 0">
        <SettingsIcon class="w-5 h-5" style="color: #64748b" />
      </div>
      <div>
        <h1 class="text-xl font-bold tracking-tight">Settings</h1>
        <p class="text-xs text-muted-foreground mt-0.5">Configure your business, integrations, and account</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- ── LEFT: Business Settings ── -->
      <div class="lg:col-span-2 space-y-5">

        <!-- Business Info -->
        <div class="rounded-3xl bg-card border border-border overflow-hidden" style="outline: 1px solid hsl(var(--border)/0.5)">
          <!-- Tonal header strip -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-border" style="background: #6366f108">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: #6366f118">
              <Building class="w-4 h-4" style="color: #6366f1" />
            </div>
            <div>
              <p class="text-sm font-semibold">Business Information</p>
              <p class="text-xs text-muted-foreground">Your shop's public details and preferences</p>
            </div>
          </div>
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Name</label>
                <input v-model="form.businessName" placeholder="Your Repair Shop" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</label>
                <input v-model="form.phone" placeholder="(555) 123-4567" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
              <input v-model="form.email" type="email" placeholder="contact@yourshop.com" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</label>
              <textarea v-model="form.address" :rows="2" placeholder="123 Main St, City, State ZIP" class="w-full px-3 py-2 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Currency Symbol</label>
                <input v-model="form.currency" placeholder="$" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tax Rate (%)</label>
                <input v-model.number="form.taxRate" type="number" step="0.01" placeholder="0.00" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ticket Statuses</label>
              <input v-model="form.statuses" placeholder="Open, In Progress, Completed" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
              <p class="text-xs text-muted-foreground">Separate each status with a comma</p>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Screen Lock PIN</label>
              <input v-model="form.pin" type="password" maxlength="4" placeholder="4-digit PIN" class="w-[140px] h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
              <p class="text-xs text-muted-foreground">Screen locks after 3 minutes of inactivity</p>
            </div>
            <div class="pt-3 border-t border-border">
              <button @click="saveSettings" class="flex items-center gap-2 h-9 px-5 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
                <Save class="w-4 h-4" />
                Save Business Settings
              </button>
            </div>
          </div>
        </div>

        <!-- Square Integration -->
        <div class="rounded-3xl bg-card border border-border overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-border" style="background: #006AFF08">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: #006AFF18">
                <CreditCard class="w-4 h-4" style="color: #006AFF" />
              </div>
              <div>
                <p class="text-sm font-semibold">Square Integration</p>
                <p class="text-xs text-muted-foreground">Card payments and terminal pairing</p>
              </div>
            </div>
            <!-- Status pill -->
            <div class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
              :class="squareSettings.enabled ? 'text-emerald-600' : 'text-muted-foreground'"
              :style="squareSettings.enabled ? 'background:#10b98112; outline:1px solid #10b98130' : 'background:hsl(var(--muted)); outline:1px solid hsl(var(--border))'">
              <div class="w-1.5 h-1.5 rounded-full" :class="squareSettings.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'" />
              {{ squareSettings.enabled ? 'Connected' : 'Disconnected' }}
            </div>
          </div>
          <div class="p-5 space-y-4">
            <!-- Info notice -->
            <div class="p-3 rounded-2xl flex items-start gap-3" style="background: #006AFF08; outline: 1px solid #006AFF22">
              <Info class="w-4 h-4 mt-0.5 flex-shrink-0" style="color:#006AFF" />
              <div class="text-xs space-y-1" style="color:#006AFF">
                <p class="font-medium">Environment Variables Required</p>
                <p class="opacity-70">Set <code class="font-mono px-1 rounded" style="background:#006AFF15">SQUARE_ACCESS_TOKEN</code>, <code class="font-mono px-1 rounded" style="background:#006AFF15">SQUARE_APPLICATION_ID</code>, and <code class="font-mono px-1 rounded" style="background:#006AFF15">SQUARE_LOCATION_ID</code> in your Vercel project settings.</p>
              </div>
            </div>
            <!-- Terminal Device ID -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Terminal Device ID</label>
              <div class="flex gap-2">
                <input v-model="squareSettings.deviceId" placeholder="device:..." @change="saveSquareSettings" class="flex-1 h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
                <button @click="startPairing" :disabled="isPairing" class="flex items-center gap-1.5 h-9 px-4 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors flex-shrink-0 disabled:opacity-50">
                  <MonitorSmartphone class="w-4 h-4" />
                  Pair
                </button>
              </div>
              <p class="text-xs text-muted-foreground">Leave blank to use browser card form only.</p>
            </div>
            <!-- Pairing Flow -->
            <div v-if="pairingState !== 'idle'" class="p-4 rounded-2xl border space-y-3 transition-colors"
              :class="pairingState === 'paired' ? 'border-emerald-500/20' : pairingState === 'expired' ? 'border-red-500/20' : 'border-blue-500/20'"
              :style="pairingState === 'paired' ? 'background:#10b98108' : pairingState === 'expired' ? 'background:#ef444408' : 'background:#006AFF08'">
              <div v-if="pairingState === 'loading'" class="flex items-center gap-2 text-sm text-muted-foreground">
                <div class="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                Generating pairing code...
              </div>
              <div v-else-if="pairingState === 'waiting'" class="space-y-4">
                <div class="flex items-start gap-3">
                  <MonitorSmartphone class="w-4 h-4 flex-shrink-0 mt-0.5" style="color:#006AFF" />
                  <div>
                    <p class="text-sm font-medium">Enter this code on your Square Terminal</p>
                    <p class="text-xs text-muted-foreground">Sign In → Use a Device Code</p>
                  </div>
                </div>
                <div class="flex items-center justify-center">
                  <div class="rounded-2xl px-10 py-4" style="background:hsl(var(--background)); outline: 2px solid #6366f130">
                    <span class="text-4xl font-bold tracking-[0.3em] font-mono" style="color:#6366f1">{{ pairingCode }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <div class="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style="border-color:#006AFF; border-top-color:transparent" />
                  Waiting for terminal to pair...
                </div>
              </div>
              <div v-else-if="pairingState === 'paired'" class="flex items-center gap-3">
                <CheckCircle class="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">Terminal paired successfully!</p>
                  <p class="text-xs text-muted-foreground font-mono mt-0.5">{{ squareSettings.deviceId }}</p>
                </div>
              </div>
              <div v-else-if="pairingState === 'expired'" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <AlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p class="text-sm text-red-600">Pairing code expired</p>
                </div>
                <button @click="startPairing" class="h-8 px-3 rounded-xl text-xs font-medium border border-border bg-muted/50 hover:bg-muted transition-colors">Try Again</button>
              </div>
            </div>
            <!-- Actions row -->
            <div class="flex gap-2 pt-1">
              <button @click="testSquareConnection" class="flex-1 flex items-center justify-center gap-2 h-9 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors">
                <Zap class="w-4 h-4" />
                Test Connection
              </button>
              <button @click="toggleSquare" class="h-9 px-4 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors">
                {{ squareSettings.enabled ? 'Disable' : 'Enable' }}
              </button>
            </div>
            <div class="text-center">
              <a href="https://developer.squareup.com/apps" target="_blank" class="text-xs text-primary hover:underline inline-flex items-center gap-1">
                Square Developer Dashboard <ExternalLink class="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <!-- Supabase Integration -->
        <div class="rounded-3xl bg-card border border-border overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-border" style="background: #10b98108">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: #10b98118">
                <Database class="w-4 h-4" style="color: #10b981" />
              </div>
              <div>
                <p class="text-sm font-semibold">Supabase</p>
                <p class="text-xs text-muted-foreground">Cloud database and sync</p>
              </div>
            </div>
            <!-- Status pill -->
            <div class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
              :class="{
                'text-emerald-600': supabaseStatus.state === 'connected',
                'text-red-600': supabaseStatus.state === 'error',
                'text-muted-foreground': supabaseStatus.state === 'idle' || supabaseStatus.state === 'checking'
              }"
              :style="supabaseStatus.state === 'connected' ? 'background:#10b98112;outline:1px solid #10b98130' : supabaseStatus.state === 'error' ? 'background:#ef444412;outline:1px solid #ef444430' : 'background:hsl(var(--muted));outline:1px solid hsl(var(--border))'">
              <div class="w-1.5 h-1.5 rounded-full"
                :class="{
                  'bg-emerald-500': supabaseStatus.state === 'connected',
                  'bg-red-500': supabaseStatus.state === 'error',
                  'bg-muted-foreground/40 animate-pulse': supabaseStatus.state === 'checking',
                  'bg-muted-foreground/40': supabaseStatus.state === 'idle'
                }" />
              <span v-if="supabaseStatus.state === 'checking'">Checking...</span>
              <span v-else-if="supabaseStatus.state === 'connected'">Connected</span>
              <span v-else-if="supabaseStatus.state === 'error'">Error</span>
              <span v-else>Not tested</span>
            </div>
          </div>
          <div class="p-5 space-y-4">
            <div class="p-3 rounded-2xl flex items-start gap-3" style="background:#10b98108; outline:1px solid #10b98122">
              <Info class="w-4 h-4 mt-0.5 flex-shrink-0" style="color:#10b981" />
              <p class="text-xs opacity-90" style="color:#10b981">Data syncs automatically using your environment configuration. No manual setup needed.</p>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project URL</label>
              <input :value="supabaseUrl" disabled placeholder="Set in .env file" class="w-full h-9 px-3 rounded-2xl bg-muted/30 border border-border text-xs font-mono text-muted-foreground focus:outline-none" />
            </div>
            <div class="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/30">
              <p class="text-sm font-medium">{{ supabaseStatus.message }}</p>
              <button @click="checkSupabaseConnection" :disabled="supabaseStatus.state === 'checking'" class="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium border border-border bg-background hover:bg-muted transition-colors flex-shrink-0 disabled:opacity-50">
                <RefreshCw v-if="supabaseStatus.state === 'checking'" class="w-3.5 h-3.5 animate-spin" />
                <span v-else>Test</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── RIGHT: Account + Data ── -->
      <div class="space-y-4">

        <!-- Account Card -->
        <div class="rounded-3xl bg-card border border-border overflow-hidden">
          <div class="px-5 py-4 border-b border-border" style="background:#6366f108">
            <p class="text-sm font-semibold">Account</p>
          </div>
          <div class="p-4 space-y-3">
            <!-- User info tile -->
            <div class="flex items-center gap-3 p-3 rounded-2xl border border-border bg-muted/30">
              <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm" style="background: linear-gradient(135deg, #6366f1, #3b82f6)">
                {{ userInitials }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate">{{ userEmail }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ form.businessName || 'Business Account' }}</p>
              </div>
            </div>
            <button @click="logout" class="w-full flex items-center justify-center gap-2 h-9 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <LogOut class="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <!-- Data Management -->
        <div class="rounded-3xl bg-card border border-border overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-border" style="background:#64748b08">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#64748b18">
              <HardDrive class="w-4 h-4" style="color:#64748b" />
            </div>
            <p class="text-sm font-semibold">Data Management</p>
          </div>
          <div class="p-4 space-y-2">
            <button @click="exportData" class="w-full flex items-center gap-3 h-10 px-4 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors text-left">
              <Download class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              Export All Data
            </button>
            <button @click="clearCache" class="w-full flex items-center gap-3 h-10 px-4 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors text-left">
              <RefreshCw class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              Clear Cache
            </button>
            <div class="pt-2 border-t border-border space-y-2">
              <button @click="resetData" class="w-full flex items-center gap-3 h-10 px-4 rounded-2xl text-sm font-medium text-red-600 transition-colors text-left" style="background:#ef444412; outline:1px solid #ef444425">
                <Trash2 class="w-4 h-4 flex-shrink-0" />
                Reset All Data
              </button>
              <p class="text-xs text-muted-foreground text-center">This action cannot be undone.</p>
            </div>
          </div>
        </div>

        <!-- System Status -->
        <div class="rounded-3xl bg-card border border-border overflow-hidden">
          <div class="px-5 py-4 border-b border-border" style="background:#06b6d408">
            <p class="text-sm font-semibold">System Status</p>
          </div>
          <div class="p-4 space-y-1">
            <div class="flex items-center justify-between py-2.5 border-b border-border/60">
              <span class="text-sm text-muted-foreground">Square</span>
              <span class="flex items-center gap-1.5 text-xs font-medium" :class="squareSettings.enabled ? 'text-emerald-600' : 'text-muted-foreground'">
                <div class="w-1.5 h-1.5 rounded-full" :class="squareSettings.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'" />
                {{ squareSettings.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-border/60">
              <span class="text-sm text-muted-foreground">Database</span>
              <span class="flex items-center gap-1.5 text-xs font-medium" :class="supabaseStatus.state === 'connected' ? 'text-emerald-600' : 'text-muted-foreground'">
                <div class="w-1.5 h-1.5 rounded-full" :class="supabaseStatus.state === 'connected' ? 'bg-emerald-500' : 'bg-muted-foreground/40'" />
                {{ supabaseStatus.state === 'connected' ? 'Connected' : 'Unknown' }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <span class="text-sm text-muted-foreground">Screen Lock</span>
              <span class="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active (3 min)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SQL Setup Modal ── -->
    <Dialog v-model:open="sqlModalOpen">
      <DialogContent class="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col p-0 rounded-3xl gap-0">
        <!-- Tonal header -->
        <div class="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0" style="background:#f59e0b08">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#f59e0b18">
            <AlertCircle class="w-4 h-4" style="color:#f59e0b" />
          </div>
          <div>
            <p class="text-sm font-semibold">Manual SQL Setup Required</p>
            <p class="text-xs text-muted-foreground">Automatic table creation failed — run the SQL below</p>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto space-y-4 p-6">
          <div class="p-3 rounded-2xl text-sm" style="background:#f59e0b10; outline:1px solid #f59e0b25; color:#b45309">
            Please run the SQL below in your Supabase SQL Editor to create the required tables.
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">SQL Commands</p>
              <button @click="copySQLToClipboard" class="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium border border-border bg-muted/50 hover:bg-muted transition-colors">
                <Copy class="w-3.5 h-3.5" />
                Copy SQL
              </button>
            </div>
            <pre class="p-4 rounded-2xl bg-muted/60 text-xs overflow-x-auto max-h-72 overflow-y-auto border border-border font-mono"><code>{{ sqlCommands }}</code></pre>
          </div>
          <div class="space-y-3 pt-2 border-t border-border">
            <p class="font-medium text-sm">Steps to complete setup:</p>
            <ol class="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
              <li>Click "Copy SQL" button above</li>
              <li>Go to <a href="https://app.supabase.com" target="_blank" class="text-primary hover:underline">Supabase Dashboard</a></li>
              <li>Navigate to SQL Editor</li>
              <li>Paste and run the SQL commands</li>
              <li>Return here and click "Test Connection"</li>
            </ol>
          </div>
        </div>
        <div class="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button @click="sqlModalOpen = false" class="flex-1 h-9 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors">Close</button>
          <button @click="openSupabaseDashboard" class="flex-1 flex items-center justify-center gap-2 h-9 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90" style="background:linear-gradient(135deg,#10b981,#06b6d4)">
            <ExternalLink class="w-4 h-4" />
            Open Supabase
          </button>
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
  MonitorSmartphone, CheckCircle, Building, HardDrive,
  Settings as SettingsIcon
} from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
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

onMounted(async () => {
  // Load from Supabase profile first, fall back to localStorage
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('square_settings').eq('id', user.id).single()
      if (data?.square_settings) {
        squareSettings.value.enabled = data.square_settings.enabled || false
        squareSettings.value.deviceId = data.square_settings.deviceId || ''
        return
      }
    }
  } catch(e) {}
  // Fallback: localStorage
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

const saveSquareSettings = async () => {
  // Always save to localStorage as immediate fallback
  localStorage.setItem('squareSettings', JSON.stringify(squareSettings.value))
  // Also persist to Supabase profile
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        square_settings: squareSettings.value
      }).eq('id', user.id)
    }
  } catch(e) {
    console.warn('Could not save Square settings to Supabase:', e)
  }
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
