<template>
  <div class="space-y-8 max-w-6xl">

    <!-- ── Page Header ── -->
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl" style="background: linear-gradient(135deg, #64748b, #475569)">
        <SettingsIcon class="w-7 h-7 text-white" />
      </div>
      <div>
        <h1 class="text-3xl font-black tracking-tight">Settings</h1>
        <p class="text-sm text-muted-foreground font-medium mt-0.5">Configure your business, integrations, and account</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- ── LEFT: Business Settings ── -->
      <div class="lg:col-span-2 space-y-5">

        <!-- Business Info — Bento Card -->
        <div class="m3-bento-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-border/60" style="background: #6366f108">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
              <Building class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Business Information</p>
              <p class="text-xs text-muted-foreground font-medium">Your shop's public details and preferences</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Business Name</label>
                <input v-model="form.businessName" placeholder="Your Repair Shop" class="m3-input" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Phone</label>
                <input v-model="form.phone" placeholder="(555) 123-4567" class="m3-input" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Email</label>
              <input v-model="form.email" type="email" placeholder="contact@yourshop.com" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Address</label>
              <textarea v-model="form.address" :rows="2" placeholder="123 Main St, City, State ZIP" class="m3-input resize-none" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Currency Symbol</label>
                <input v-model="form.currency" placeholder="$" class="m3-input" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Tax Rate (%)</label>
                <input v-model.number="form.taxRate" type="number" step="0.01" placeholder="0.00" class="m3-input" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Ticket Statuses</label>
              <input v-model="form.statuses" placeholder="Open, In Progress, Completed" class="m3-input" />
              <p class="text-xs text-muted-foreground font-medium">Separate each status with a comma</p>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Screen Lock PIN</label>
              <input v-model="form.pin" type="password" maxlength="4" placeholder="4-digit PIN" class="m3-input w-[160px] font-mono tracking-widest" />
              <p class="text-xs text-muted-foreground font-medium">Screen locks after 3 minutes of inactivity</p>
            </div>
            <div class="pt-4 border-t border-border/60">
              <button @click="saveSettings" class="m3-btn-primary flex items-center gap-2.5 h-12 px-7 rounded-full text-sm font-black text-white">
                <Save class="w-4 h-4" />
                Save Business Settings
              </button>
            </div>
          </div>
        </div>

        <!-- Square Integration -->
        <div class="m3-bento-card" v-if="form">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-border/60" style="background: #10b98108">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #10b981, #059669)">
              <CreditCard class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Square Integration</p>
              <p class="text-xs text-muted-foreground font-medium">Connect your Square account for payments</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Square Access Token</label>
              <input v-model="form.squareAccessToken" type="password" placeholder="EAAAl..." class="m3-input font-mono text-xs" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Location ID</label>
              <input v-model="form.squareLocationId" placeholder="L1234..." class="m3-input font-mono text-xs" />
            </div>
            <div class="flex items-center justify-between p-4 rounded-[20px]" style="background: hsl(var(--muted)/0.3)">
              <div>
                <p class="text-sm font-bold">Use Square Sandbox</p>
                <p class="text-xs text-muted-foreground font-medium">Test mode for development</p>
              </div>
              <button
                class="m3-toggle"
                :class="{ 'active': form.squareSandbox }"
                @click="form.squareSandbox = !form.squareSandbox"
              >
                <span class="m3-toggle-thumb">
                  <component :is="form.squareSandbox ? Check : X" class="w-3 h-3" />
                </span>
              </button>
            </div>
            <button @click="saveSettings" class="m3-btn-tonal flex items-center gap-2 h-11 px-6 rounded-full text-sm font-bold">
              <Save class="w-4 h-4" /> Save Integration
            </button>
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="m3-bento-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-border/60" style="background: #f59e0b08">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
              <Bell class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Notifications</p>
              <p class="text-xs text-muted-foreground font-medium">Alert preferences for your shop</p>
            </div>
          </div>
          <div class="p-3">
            <div v-for="(notif, key) in notificationSettings" :key="key" class="flex items-center justify-between px-3 py-3.5 rounded-[20px] hover:bg-muted/20 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-[16px] flex items-center justify-center flex-shrink-0" :style="`background: ${notif.color}18`">
                  <component :is="notif.icon" class="w-4 h-4" :style="`color: ${notif.color}`" />
                </div>
                <div>
                  <p class="text-sm font-bold">{{ notif.label }}</p>
                  <p class="text-xs text-muted-foreground font-medium">{{ notif.desc }}</p>
                </div>
              </div>
              <button
                class="m3-toggle"
                :class="{ 'active': notif.enabled }"
                @click="notif.enabled = !notif.enabled"
              >
                <span class="m3-toggle-thumb">
                  <component :is="notif.enabled ? Check : X" class="w-3 h-3" />
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- ── RIGHT: Quick actions & danger zone ── -->
      <div class="space-y-5">

        <!-- Account info -->
        <div class="m3-bento-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-border/60" style="background: #8b5cf608">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
              <User class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Account</p>
              <p class="text-xs text-muted-foreground font-medium">Your profile and auth</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3 p-4 rounded-[20px]" style="background: hsl(var(--muted)/0.3)">
              <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
                {{ userInitials }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold truncate">{{ userEmail }}</p>
                <p class="text-xs text-muted-foreground font-medium truncate">{{ form.businessName || 'NovaOps' }}</p>
              </div>
            </div>
            <button @click="handleSignOut" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style="background: #ef444414; color: #ef4444; outline: 2px solid #ef444428; outline-offset: 0">
              <LogOut class="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <!-- Data Management -->
        <div class="m3-bento-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-border/60" style="background: #06b6d408">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #06b6d4, #0891b2)">
              <Database class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Data Management</p>
              <p class="text-xs text-muted-foreground font-medium">Backup and restore your data</p>
            </div>
          </div>
          <div class="p-6 space-y-3">
            <button @click="handleExport" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style="background: #06b6d414; color: #06b6d4; outline: 2px solid #06b6d428; outline-offset: 0">
              <Download class="w-4 h-4" /> Export All Data
            </button>
            <button @click="navigateTo('/import')" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style="background: hsl(var(--muted)/0.5); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
              <Upload class="w-4 h-4" /> Import Data
            </button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="m3-bento-card" style="outline-color: #ef444430 !important">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-border/60" style="background: #ef444408">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #ef4444, #dc2626)">
              <AlertTriangle class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black" style="color: #ef4444">Danger Zone</p>
              <p class="text-xs text-muted-foreground font-medium">Irreversible actions</p>
            </div>
          </div>
          <div class="p-6">
            <button @click="confirmReset" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 text-white" style="background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 16px #ef444440">
              <Trash2 class="w-4 h-4" /> Reset All Data
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Settings as SettingsIcon, Building, CreditCard, Bell, User, Database,
  AlertTriangle, Trash2, Save, Download, Upload, LogOut, Check, X,
  TicketCheck, ShoppingCart, UserPlus, Calendar
} from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const router = useRouter()
const { $supabase } = useNuxtApp()

const settings = computed(() => appStore.settings ?? {})
const userEmail = computed(() => settings.value?.email || 'user@novaops.com')
const userInitials = computed(() => {
  const e = userEmail.value
  const parts = e.split('@')[0].split('.')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : e.substring(0,2).toUpperCase()
})

const form = ref({
  businessName: '', phone: '', email: '', address: '',
  currency: '$', taxRate: 0, statuses: 'Open,In Progress,Completed',
  pin: '', squareAccessToken: '', squareLocationId: '', squareSandbox: false
})

onMounted(() => {
  if (settings.value) {
    form.value = { ...form.value, ...(settings.value as any) }
  }
})

const notificationSettings = ref({
  newTicket:    { label: 'New Ticket',    desc: 'Alert when a ticket is created',  color: '#f59e0b', icon: TicketCheck,   enabled: true  },
  newSale:      { label: 'New Sale',      desc: 'Alert when POS sale completes',   color: '#10b981', icon: ShoppingCart,  enabled: true  },
  newCustomer:  { label: 'New Customer',  desc: 'Alert when customer is added',    color: '#3b82f6', icon: UserPlus,      enabled: false },
  appointment:  { label: 'Appointments',  desc: 'Alert for upcoming appointments', color: '#8b5cf6', icon: Calendar,      enabled: true  },
})

const saveSettings = async () => {
  await appStore.saveSettings({ ...settings.value, ...form.value })
}
const navigateTo = (path: string) => router.push(path)
const handleSignOut = async () => {
  try { await ($supabase as any).auth.signOut() } catch {}
  navigateTo('/login')
}
const handleExport = () => {
  const data = { settings: appStore.settings, tickets: appStore.tickets, customers: appStore.customers, inventory: appStore.inventory }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `novaops-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
  URL.revokeObjectURL(url)
}
const confirmReset = () => {
  if (confirm('Are you sure? This will delete ALL data. This cannot be undone.')) {
    localStorage.clear()
    window.location.reload()
  }
}
</script>

<style scoped>
/* M3 Bento card — 32dp corners per Pixel 10 XL spec */
.m3-bento-card {
  border-radius: 32px;
  overflow: hidden;
  background: hsl(var(--card));
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
}

/* M3 Expressive input */
.m3-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.7);
  outline: none;
  transition: all 0.2s ease;
}
.m3-input:focus {
  border-color: hsl(var(--primary)/0.5);
  box-shadow: 0 0 0 3px hsl(var(--primary)/0.12);
}
.m3-input.resize-none { height: auto; padding-top: 12px; padding-bottom: 12px; }

/* M3 Primary button */
.m3-btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 20px #6366f140;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-btn-primary:hover  { transform: scale(1.05) translateY(-2px); box-shadow: 0 8px 28px #6366f160; }
.m3-btn-primary:active { transform: scale(0.92); }

/* M3 Tonal button */
.m3-btn-tonal {
  background: hsl(var(--muted)/0.7);
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.m3-btn-tonal:hover  { transform: scale(1.04); }
.m3-btn-tonal:active { transform: scale(0.94); }

/* M3 Expressive toggle switch — thick track + icon thumb */
.m3-toggle {
  position: relative;
  width: 56px;
  height: 32px;
  border-radius: 999px;
  background: hsl(var(--muted));
  border: 2px solid hsl(var(--border)/0.8);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  cursor: pointer;
}
.m3-toggle.active {
  background: #6366f1;
  border-color: #6366f1;
  box-shadow: 0 2px 12px #6366f140;
}
.m3-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground));
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.m3-toggle.active .m3-toggle-thumb {
  left: calc(100% - 25px);
  color: #6366f1;
}
</style>