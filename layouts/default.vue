<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground" :class="{ 'electron-app': isElectron }">

    <!-- ── Mobile top app bar ──────────────────────────────────── -->
    <header
      v-if="isMobile"
      class="h-14 border-b flex items-center justify-between px-4 bg-surface z-40 shrink-0"
    >
      <div class="flex items-center gap-3">
        <button 
          class="p-2 -ml-2 rounded-full hover:bg-muted text-foreground transition-colors"
          @click="mobileDrawerOpen = true"
        >
          <i class="mdi mdi-menu text-xl"></i>
        </button>
        
        <div class="flex items-center gap-2">
          <div
            v-if="currentPageNav"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            :style="{ backgroundColor: currentPageNav.color }"
          >
            <i class="mdi text-sm" :class="currentPageNav.icon"></i>
          </div>
          <span class="text-sm font-bold">{{ currentPageTitle }}</span>
        </div>
      </div>

      <button 
        class="p-2 rounded-full hover:bg-muted text-foreground transition-colors"
        @click="toggleTheme"
      >
        <i class="mdi text-lg" :class="theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"></i>
      </button>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- ── Desktop Navigation Rail ─────────────────────────────── -->
      <aside
        v-if="!isMobile"
        class="w-[72px] border-r flex flex-col justify-between py-3 bg-surface items-center shrink-0 z-40"
      >
        <div class="flex flex-col items-center w-full gap-2.5 py-1">
          <!-- + New Action -->
          <button
            type="button"
            class="nav-rail-btn w-12 h-12 rounded-xl hover:bg-muted text-primary flex items-center justify-center transition-colors relative"
            v-tooltip.right="'Quick Actions'"
            @click="toggleQuickActions"
          >
            <i class="mdi mdi-plus-circle text-2xl"></i>
          </button>
          
          <Popover ref="quickActionsPopover">
            <div class="p-2 min-w-[200px] flex flex-col gap-1">
              <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Quick Actions</div>
              <button
                v-for="q in quickItems"
                :key="q.type"
                class="w-full text-left p-2 rounded-lg hover:bg-muted flex items-center justify-between text-foreground transition-colors"
                @click="triggerAction(q.type)"
              >
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white" :style="{ backgroundColor: q.color }">
                    <i class="mdi text-sm" :class="q.icon"></i>
                  </div>
                  <span class="text-xs font-bold">{{ q.label }}</span>
                </div>
                <span class="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{{ q.kbd }}</span>
              </button>
            </div>
          </Popover>

          <hr class="w-8 border-t border-border my-1" />

          <!-- Core nav items -->
          <NuxtLink
            v-for="item in coreNav"
            :key="item.path"
            :to="item.path"
            class="nav-rail-btn w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative"
            :class="[route.path === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground']"
            v-tooltip.right="item.name"
          >
            <i class="mdi text-xl" :class="item.icon" :style="{ color: route.path === item.path ? item.color : undefined }"></i>
            <span
              v-if="item.badge"
              class="absolute top-2 right-2 w-2 h-2 rounded-full"
              :class="[item.badge.color === 'warning' ? 'bg-amber-500' : 'bg-emerald-500']"
            ></span>
          </NuxtLink>
        </div>

        <!-- Bottom: theme + settings + avatar -->
        <div class="flex flex-col items-center w-full gap-2">
          <!-- Upcoming -->
          <button
            type="button"
            class="nav-rail-btn w-12 h-12 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors relative"
            v-tooltip.right="'Upcoming'"
            @click="toggleUpcoming"
          >
            <i class="mdi mdi-calendar-clock text-xl"></i>
            <span
              v-if="upcomingCount > 0"
              class="absolute top-2 right-2 px-1 py-0.5 min-w-4 h-4 text-[9px] font-bold text-white bg-blue-500 rounded-full flex items-center justify-center leading-none"
            >
              {{ upcomingCount }}
            </span>
          </button>

          <Popover ref="upcomingPopover">
            <div class="p-3 min-w-[280px] max-w-[320px] flex flex-col gap-2">
              <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Upcoming Tasks</div>
              <div v-if="upcomingItems.length === 0" class="text-xs text-muted-foreground py-2 text-center">No upcoming tasks</div>
              <div 
                v-for="u in upcomingItems" 
                :key="u.id" 
                class="flex items-start gap-2.5 p-2 rounded-lg border hover:bg-muted transition-colors text-foreground"
              >
                <div class="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 mt-0.5" :style="{ backgroundColor: u.color }">
                  <i class="mdi text-xs" :class="u.icon"></i>
                </div>
                <div class="flex-grow min-w-0">
                  <div class="text-xs font-bold truncate">{{ u.label }}</div>
                  <div class="text-[10px] text-muted-foreground mt-0.5">{{ u.sub }}</div>
                </div>
              </div>
            </div>
          </Popover>

          <!-- Theme toggle -->
          <button
            type="button"
            class="nav-rail-btn w-12 h-12 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            v-tooltip.right="`Theme: ${theme}`"
            @click="toggleTheme"
          >
            <i class="mdi text-xl" :class="theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'"></i>
          </button>

          <!-- Settings -->
          <NuxtLink
            to="/settings"
            class="nav-rail-btn w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
            :class="[route.path === '/settings' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground']"
            v-tooltip.right="'Settings'"
          >
            <i class="mdi mdi-cog-outline text-xl"></i>
          </NuxtLink>

          <!-- Avatar -->
          <NuxtLink to="/settings" class="w-9 h-9 rounded-xl overflow-hidden mt-1 bg-primary text-white flex items-center justify-center text-xs font-bold">
            {{ userInitials }}
          </NuxtLink>
        </div>
      </aside>

      <!-- ── Mobile drawer (full sidebar) ────────────────────────── -->
      <Drawer
        v-model:visible="mobileDrawerOpen"
        position="left"
        class="w-72"
        header="Navigation"
      >
        <template #header>
          <div class="flex items-center gap-3 py-2">
            <div class="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold">
              {{ userInitials }}
            </div>
            <div>
              <div class="text-sm font-bold">{{ settings?.businessName || 'NovaOps' }}</div>
              <div class="text-[10px] text-muted-foreground mt-0.5">{{ userEmail }}</div>
            </div>
          </div>
        </template>

        <div class="flex flex-col gap-1 py-2">
          <NuxtLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            class="flex items-center justify-between p-2.5 rounded-xl transition-colors"
            :class="[route.path === item.path ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-muted']"
            @click="mobileDrawerOpen = false"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                :style="{ backgroundColor: route.path === item.path ? undefined : `${item.color}15`, color: item.color }"
                :class="[route.path === item.path ? 'bg-primary text-white' : '']"
              >
                <i class="mdi text-base" :class="item.icon" :style="{ color: route.path === item.path ? '#fff' : undefined }"></i>
              </div>
              <span class="text-sm font-medium">{{ item.name }}</span>
            </div>
            
            <span 
              v-if="item.badge"
              class="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              :class="[
                item.badge.color === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' :
                item.badge.color === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
              ]"
            >
              {{ item.badge.label }}
            </span>
          </NuxtLink>
        </div>
      </Drawer>

      <!-- ── Main content ─────────────────────────────────────────── -->
      <main class="flex-1 flex flex-col h-full overflow-hidden relative">
        <ProgressBar
          v-if="appStore.isLoading && !noLoadingGate"
          mode="indeterminate"
          class="absolute top-0 left-0 right-0 h-0.5 z-50 rounded-none bg-transparent"
        />

        <div class="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden bg-background">
          <slot />
        </div>
      </main>
    </div>

    <!-- ── Global Toast Queue ────────────────────────────────────── -->
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" style="min-width: 320px; max-width: 400px;">
      <transition-group name="toast-list">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 bg-surface border-border text-foreground"
          :style="{ borderLeft: `4px solid ${toastLeftColor(t.status)}` }"
        >
          <div class="shrink-0 mt-0.5">
            <i class="mdi text-lg" :class="snackIcon(t.status)" :style="{ color: toastLeftColor(t.status) }"></i>
          </div>
          <div class="flex-grow min-w-0">
            <div class="text-xs font-bold leading-snug truncate">{{ t.title }}</div>
            <div v-if="t.description" class="text-[10px] text-muted-foreground mt-0.5 break-words">{{ t.description }}</div>
          </div>
          <button 
            v-if="t.status !== 'loading'" 
            class="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 -mr-1" 
            @click="dismiss(t.id)"
          >
            <i class="mdi mdi-close text-xs"></i>
          </button>
        </div>
      </transition-group>
    </div>

    <!-- ── Global Dialogs ──────────────────────────────────────── -->
    <NewTicketDialog v-model="newTicketOpen" />
    <HouseCallDialog v-model="newHousecallOpen" @saved="appStore.initializeData" />
    <CustomerEditDialog v-model="newCustomerOpen" />
    <CommandPalette v-model="commandPaletteOpen" />
    <KeyboardShortcutsOverlay v-model="shortcutsOverlayOpen" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { navigateTo } from '#imports'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import HouseCallDialog from '~/components/HouseCallDialog.vue'
import CustomerEditDialog from '~/components/CustomerEditDialog.vue'
import CommandPalette from '~/components/CommandPalette.vue'
import KeyboardShortcutsOverlay from '~/components/KeyboardShortcutsOverlay.vue'
import { useMediaQuery } from '@vueuse/core'
import { useScreenLock } from '~/composables/useScreenLock'

const appStore = useAppStore()
const { tickets, appointments, settings } = storeToRefs(appStore)
const { toasts, dismiss } = useToast()
const route = useRoute()

// Responsive breakpoints
const isMobile = useMediaQuery('(max-width: 959px)')
const mobileDrawerOpen = ref(false)
const upcomingPopover = ref()
const quickActionsPopover = ref()

// Theme
const theme = ref('light')
onMounted(() => {
  theme.value = localStorage.getItem('novaops_theme') || 'light'
  updateDarkClass()
  appStore.setupAuthListener()
  checkLockStatus()
  setupActivityListeners()
})
const { checkLockStatus, setupActivityListeners, cleanup } = useScreenLock()
onUnmounted(cleanup)

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('novaops_theme', theme.value)
  updateDarkClass()
}

function updateDarkClass() {
  if (theme.value === 'dark') {
    document.documentElement.classList.add('p-dark')
  } else {
    document.documentElement.classList.remove('p-dark')
  }
}

// User info
const userEmail = computed(() => appStore.user?.email || settings.value?.email || '')
const userInitials = computed(() => {
  const e = userEmail.value
  if (!e) return 'UN'
  const parts = e.split('@')[0].split('.')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : e.slice(0, 2).toUpperCase()
})

const navigation = [
  { name: 'Dashboard',   path: '/dashboard',  icon: 'mdi-rocket-launch-outline',          color: '#6366f1', badge: null,                         group: 'core' },
  { name: 'Bookings',    path: '/bookings',   icon: 'mdi-calendar-star-outline',          color: '#f59e0b', badge: { label: 'New',  color: 'warning' }, group: 'core' },
  { name: 'Customers',   path: '/customers',  icon: 'mdi-account-heart-outline',          color: '#3b82f6', badge: null,                         group: 'core' },
  { name: 'Inventory',   path: '/inventory',  icon: 'mdi-treasure-chest-outline',         color: '#8b5cf6', badge: null,                         group: 'core' },
  { name: 'POS',         path: '/pos',        icon: 'mdi-cash-register',                  color: '#ec4899', badge: { label: 'Live', color: 'success' }, group: 'core' },
  { name: 'Library',     path: '/library',    icon: 'mdi-book-open-page-variant-outline', color: '#f43f5e', badge: null,                         group: 'core' },
  { name: 'Analytics',   path: '/analytics',  icon: 'mdi-chart-donut-variant',            color: '#10b981', badge: null,                         group: 'core' },
  { name: 'Tools',       path: '/tools',      icon: 'mdi-magic-staff',                    color: '#06b6d4', badge: null,                         group: 'core' },
]

const coreNav  = navigation.filter(n => n.group === 'core')

const currentPageNav   = computed(() => navigation.find(n => n.path === route.path))
const currentPageTitle = computed(() => currentPageNav.value?.name || 'NovaOps')

watch(() => route.path, () => {
  mobileDrawerOpen.value = false
})

// Popover triggers
function toggleQuickActions(e: Event) {
  quickActionsPopover.value?.toggle(e)
}
function toggleUpcoming(e: Event) {
  upcomingPopover.value?.toggle(e)
}

// Quick items for the New popover
const quickItems = [
  { type: 'ticket',    label: 'New Ticket',    icon: 'mdi-ticket-outline',           color: '#f59e0b', kbd: '⌘T' },
  { type: 'housecall', label: 'House Call',     icon: 'mdi-map-marker-outline',     color: '#10b981', kbd: '⌘H' },
  { type: 'customer',  label: 'New Customer',   icon: 'mdi-account-plus-outline',   color: '#3b82f6', kbd: '⌘U' },
  { type: 'register',  label: 'Open Register',  icon: 'mdi-cart-outline',           color: '#ec4899', kbd: '⌘R' },
]

const newTicketOpen = ref(false)
const newHousecallOpen = ref(false)
const newCustomerOpen = ref(false)
const commandPaletteOpen = ref(false)
const shortcutsOverlayOpen = ref(false)

function triggerAction(type: string) {
  quickActionsPopover.value?.hide()
  if (type === 'ticket') newTicketOpen.value = true
  else if (type === 'housecall') newHousecallOpen.value = true
  else if (type === 'customer') newCustomerOpen.value = true
  else if (type === 'register') navigateTo('/pos')
}

// Upcoming items
const upcomingItems = computed(() => {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const appts = (appointments.value || [])
    .filter((a: any) => a.status === 'scheduled' && a.date >= todayStr)
    .sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 4)
    .map((a: any) => ({ id: a.id, label: a.title || 'Appointment', sub: `${a.date} ${a.time}`, color: '#06b6d4', icon: 'mdi-calendar' }))
  const openTickets = (tickets.value || [])
    .filter((t: any) => t.status === 'Open' || t.status === 'In Progress')
    .slice(0, 3)
    .map((t: any) => ({ id: t.id, label: `#${t.id} ${t.device || ''}`.trim(), sub: t.status, color: '#6366f1', icon: 'mdi-ticket-confirmation-outline' }))
  return [...appts, ...openTickets]
})
const upcomingCount = computed(() => upcomingItems.value.length)

const NO_LOADING_GATE_PATHS = ['/settings', '/tools', '/analytics']
const noLoadingGate = computed(() => NO_LOADING_GATE_PATHS.includes(route.path))

// Electron checks
const isElectron = ref(false)
onMounted(() => {
  isElectron.value = !!(window as any).electronAPI?.isElectron
})

// Toast helper styling
function toastLeftColor(status: string) {
  return {
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    loading: '#6366f1'
  }[status] || '#94a3b8'
}

function snackIcon(status: string) {
  return { 
    success: 'mdi-check-circle', 
    danger: 'mdi-alert-circle', 
    warning: 'mdi-alert', 
    info: 'mdi-information',
    loading: 'mdi-loading animate-spin'
  }[status] || 'mdi-bell'
}

// Keyboard shortcuts
function onKeydown(e: KeyboardEvent) {
  if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const target = e.target as HTMLElement
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return
    e.preventDefault()
    shortcutsOverlayOpen.value = !shortcutsOverlayOpen.value
    return
  }

  if (!e.metaKey && !e.ctrlKey) return
  const key = e.key.toLowerCase()

  if (key === 'k') { e.preventDefault(); commandPaletteOpen.value = true; return }
  if (key === 't' || key === 'h') { e.preventDefault(); triggerAction(key === 't' ? 'ticket' : 'housecall'); return }
  if (key === 'u') { e.preventDefault(); triggerAction('customer'); return }
  if (key === 'r') { e.preventDefault(); navigateTo('/pos'); return }

  const map: Record<string, string> = {
    'i': '/tools', 'b': '/tools',
    'd': '/dashboard', ',': '/settings', 'a': '/analytics',
  }
  const path = map[key]
  if (path) { e.preventDefault(); navigateTo(path) }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* Toast List Transitions */
.toast-list-enter-from { 
  opacity: 0; 
  transform: translateY(20px) scale(0.95); 
}
.toast-list-enter-active { 
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
}
.toast-list-leave-to { 
  opacity: 0; 
  transform: translateY(10px) scale(0.95); 
}
.toast-list-leave-active { 
  transition: all 0.25s ease-in; 
  position: absolute; 
  width: 100%;
}
.toast-list-move { 
  transition: transform 0.3s ease; 
}
</style>
