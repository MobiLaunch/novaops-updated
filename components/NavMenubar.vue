<template>
  <div class="relative flex items-center gap-0.5" data-menubar>
    <!-- Settings Menu -->
    <div class="relative">
      <button @click="toggleMenu('settings')" :class="['menubar-trigger', openMenu === 'settings' && 'menubar-trigger-active']">
        <v-icon icon="mdi-cog-outline" size="12" />
        Settings
      </button>
      <div v-if="openMenu === 'settings'" class="menu-dropdown">
        <div class="menu-section-label">Preferences</div>
        <button class="menu-item" @click="go('/settings')">
          <v-icon icon="mdi-cog-outline" size="14" class="text-muted-foreground" />
          Business Settings
          <kbd>⌘,</kbd>
        </button>
        <div class="menu-divider" />
        <div class="menu-section-label">Data</div>
        <button class="menu-item" @click="exportData">
          <v-icon icon="mdi-download" size="14" class="text-muted-foreground" />
          Export All Data
        </button>
        <button class="menu-item" @click="go('/import')">
          <v-icon icon="mdi-upload" size="14" style="color:#8b5cf6" />
          Import CSV
        </button>
      </div>
    </div>

    <!-- Navigate Menu -->
    <div class="relative">
      <button @click="toggleMenu('navigate')" :class="['menubar-trigger', openMenu === 'navigate' && 'menubar-trigger-active']">
        Navigate
      </button>
      <div v-if="openMenu === 'navigate'" class="menu-dropdown">
        <div class="menu-section-label">Core</div>
        <button class="menu-item" @click="go('/dashboard')">
          <v-icon icon="mdi-view-dashboard-outline" size="14" style="color:#6366f1" />
          Dashboard
        </button>
        <button class="menu-item" @click="go('/bookings')">
          <v-icon icon="mdi-ticket-confirmation-outline" size="14" style="color:#f59e0b" />
          Tickets
        </button>
        <button class="menu-item" @click="go('/customers')">
          <v-icon icon="mdi-account-group-outline" size="14" style="color:#3b82f6" />
          Customers
        </button>
        <button class="menu-item" @click="go('/inventory')">
          <v-icon icon="mdi-package-variant-closed" size="14" style="color:#8b5cf6" />
          Inventory
        </button>
        <button class="menu-item" @click="go('/calendar')">
          <v-icon icon="mdi-calendar" size="14" style="color:#06b6d4" />
          Calendar &amp; House Calls
        </button>
        <button class="menu-item" @click="go('/pos')">
          <v-icon icon="mdi-cart-outline" size="14" style="color:#ec4899" />
          POS / Register
        </button>
        <button class="menu-item" @click="go('/services')">
          <v-icon icon="mdi-chip" size="14" style="color:#22d3ee" />
          Repair Services
        </button>
        <button class="menu-item" @click="go('/messages')">
          <v-icon icon="mdi-message-outline" size="14" style="color:#ec4899" />
          Messages &amp; Email
        </button>
        <div class="menu-divider" />
        <div class="menu-section-label">Tools & Finance</div>
        <button class="menu-item" @click="go('/analytics')">
          <v-icon icon="mdi-chart-bar" size="14" style="color:#10b981" />
          Analytics &amp; Accounting
        </button>
        <button class="menu-item" @click="go('/barcodes')">
          <v-icon icon="mdi-barcode-scan" size="14" style="color:#06b6d4" />
          Barcode Scanner
        </button>
        <button class="menu-item" @click="go('/forms')">
          <v-icon icon="mdi-file-document-outline" size="14" style="color:#8b5cf6" />
          Invoices & Forms
        </button>
      </div>
    </div>

    <!-- Quick Add Menu -->
    <div class="relative">
      <button @click="toggleMenu('quickAdd')" :class="['menubar-trigger menubar-trigger-bold', openMenu === 'quickAdd' && 'menubar-trigger-active']">
        Quick Add
      </button>
      <div v-if="openMenu === 'quickAdd'" class="menu-dropdown">
        <button class="menu-item" @click="quickAction('ticket')">
          <v-icon icon="mdi-plus" size="14" class="text-amber-500" />
          New Ticket
          <kbd>⌘T</kbd>
        </button>
        <button class="menu-item" @click="quickAction('housecall')">
          <v-icon icon="mdi-plus" size="14" class="text-emerald-500" />
          New House Call
          <kbd>⌘H</kbd>
        </button>
        <button class="menu-item" @click="quickAction('customer')">
          <v-icon icon="mdi-plus" size="14" class="text-blue-500" />
          New Customer
          <kbd>⌘U</kbd>
        </button>
        <button class="menu-item" @click="quickAction('register')">
          <v-icon icon="mdi-cart-outline" size="14" class="text-pink-500" />
          Open Register
          <kbd>⌘R</kbd>
        </button>
        <div class="menu-divider" />
        <button class="menu-item" @click="quickAction('invoice')">
          <v-icon icon="mdi-plus" size="14" class="text-emerald-500" />
          New Invoice
          <kbd>⌘I</kbd>
        </button>
        <button class="menu-item" @click="quickAction('scan')">
          <v-icon icon="mdi-barcode-scan" size="14" class="text-cyan-500" />
          Scan Barcode
          <kbd>⌘B</kbd>
        </button>
        <button class="menu-item" @click="quickAction('import')">
          <v-icon icon="mdi-upload" size="14" class="text-violet-500" />
          Import CSV
        </button>
      </div>
    </div>

    <!-- View Menu -->
    <div class="relative">
      <button @click="toggleMenu('view')" :class="['menubar-trigger', openMenu === 'view' && 'menubar-trigger-active']">
        View
      </button>
      <div v-if="openMenu === 'view'" class="menu-dropdown">
        <div class="menu-section-label">Theme</div>
        <button class="menu-item" @click="setTheme('system')">
          <v-icon icon="mdi-monitor" size="14" class="text-muted-foreground" />
          System Default
          <span v-if="currentTheme === 'system'" class="ml-auto text-primary text-xs">✓</span>
        </button>
        <button class="menu-item" @click="setTheme('dark')">
          <v-icon icon="mdi-weather-night" size="14" class="text-muted-foreground" />
          Dark Mode
          <span v-if="currentTheme === 'dark'" class="ml-auto text-primary text-xs">✓</span>
        </button>
        <button class="menu-item" @click="setTheme('light')">
          <v-icon icon="mdi-weather-sunny" size="14" class="text-muted-foreground" />
          Light Mode
          <span v-if="currentTheme === 'light'" class="ml-auto text-primary text-xs">✓</span>
        </button>
        <div class="menu-divider" />
        <div class="menu-section-label">Page</div>
        <button class="menu-item" @click="go('/dashboard')">
          <v-icon icon="mdi-view-dashboard-outline" size="14" class="text-muted-foreground" />
          Dashboard
          <kbd>⌘D</kbd>
        </button>
        <button class="menu-item" @click="reload">
          <v-icon icon="mdi-refresh" size="14" class="text-muted-foreground" />
          Reload
          <kbd>⌘⇧R</kbd>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const openMenu = ref<string | null>(null)
const currentTheme = ref(
  (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) || 'system'
)

function toggleMenu(name: string) {
  openMenu.value = openMenu.value === name ? null : name
}

function closeAll() { openMenu.value = null }

function go(path: string) { closeAll(); navigateTo(path) }

function quickAction(type: string) {
  closeAll()
  const routes: Record<string, string> = {
    ticket: '/bookings', housecall: '/calendar', customer: '/customers',
    register: '/pos', invoice: '/forms', scan: '/barcodes', import: '/import',
  }
  if (routes[type]) navigateTo(routes[type])
}

function setTheme(theme: string) {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else if (theme === 'light') root.classList.remove('dark')
  else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
  closeAll()
}

function exportData() {
  closeAll()
  const data = { settings: appStore.settings, tickets: appStore.tickets, customers: appStore.customers, inventory: appStore.inventory }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `novaops-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
  URL.revokeObjectURL(url)
}

function reload() { closeAll(); location.reload() }

function onKeydown(e: KeyboardEvent) {
  if (!e.metaKey && !e.ctrlKey) return
  const map: Record<string, () => void> = {
    't': () => quickAction('ticket'),
    'h': () => quickAction('housecall'),
    'u': () => quickAction('customer'),
    'r': () => quickAction('register'),
    'i': () => quickAction('invoice'),
    'b': () => quickAction('scan'),
    'd': () => go('/dashboard'),
    ',': () => go('/settings'),
  }
  const fn = map[e.key.toLowerCase()]
  if (fn) { e.preventDefault(); fn() }
}

function onClickOutside(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('[data-menubar]')) closeAll()
}

onMounted(() => { window.addEventListener('keydown', onKeydown); document.addEventListener('mousedown', onClickOutside) })
onUnmounted(() => { window.removeEventListener('keydown', onKeydown); document.removeEventListener('mousedown', onClickOutside) })
</script>

<style scoped>
.menubar-trigger {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 8px; border-radius: 5px; border: none;
  background: transparent; cursor: pointer;
  font-size: 13px; font-weight: 400;
  color: hsl(var(--foreground));
  transition: background 0.12s; white-space: nowrap; font-family: inherit;
}
.menubar-trigger:hover, .menubar-trigger-active { background: hsl(var(--accent)); }
.menubar-trigger-bold { font-weight: 600; }

.menu-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 200;
  background: hsl(var(--popover)); border: 1px solid hsl(var(--border));
  border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  padding: 4px; min-width: 210px;
  animation: menuIn 0.1s ease;
}
@keyframes menuIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.menu-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 6px 10px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; font-size: 13px;
  color: hsl(var(--foreground)); text-align: left;
  transition: background 0.1s; font-family: inherit; white-space: nowrap;
}
.menu-item:hover { background: hsl(var(--accent)); }
.menu-section-label {
  padding: 4px 10px 2px; font-size: 10px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}
.menu-divider { height: 1px; background: hsl(var(--border)); margin: 4px 0; }
kbd {
  margin-left: auto; font-size: 11px; color: hsl(var(--muted-foreground));
  font-family: inherit; background: hsl(var(--muted));
  border-radius: 4px; padding: 1px 5px;
}
</style>
