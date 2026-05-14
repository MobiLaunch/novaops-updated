<template>
  <v-app :theme="theme">

    <!-- ── Mobile top app bar ──────────────────────────────────── -->
    <v-app-bar
      v-if="isMobile"
      class="px-2"
      elevation="0"
      border="b"
    >
      <v-app-bar-nav-icon @click="mobileDrawerOpen = true" />
      <div class="d-flex align-center gap-2 ms-1">
        <v-avatar
          v-if="currentPageNav"
          :color="currentPageNav.color"
          size="28"
          rounded="lg"
        >
          <v-icon :icon="currentPageNav.icon" size="15" color="white" />
        </v-avatar>
        <span class="text-subtitle-2 font-weight-bold">{{ currentPageTitle }}</span>
      </div>
      <v-spacer />
      <v-btn :icon="theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'" variant="text" @click="toggleTheme" />
    </v-app-bar>

    <!-- ── Desktop Navigation Rail ─────────────────────────────── -->
    <v-navigation-drawer
      v-if="!isMobile"
      permanent
      rail
      :rail-width="72"
      class="rail-drawer"
    >
      <v-list nav density="compact" class="rail-nav-list py-2">

        <!-- + New FAB -->
        <v-menu location="end" :close-on-content-click="true" offset="10">
          <template #activator="{ props }">
            <v-list-item
              class="mb-1 text-center"
              rounded="xl"
              v-bind="props"
            >
              <template #prepend>
                <v-icon color="primary" size="22">mdi-plus-circle</v-icon>
              </template>
            </v-list-item>
          </template>
          
          <v-list density="compact" min-width="200" class="pa-2" rounded="xl" elevation="3">
            <div class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2 px-3 pt-1">Quick Actions</div>
            <v-list-item
              v-for="q in quickItems"
              :key="q.type"
              rounded="lg"
              class="mb-1"
              @click="triggerAction(q.type)"
            >
              <template #prepend>
                <v-avatar :color="q.color" size="28" rounded="lg" class="mr-3">
                  <v-icon :icon="q.icon" size="14" color="white" />
                </v-avatar>
              </template>
              <template #title>
                <span class="text-body-2 font-weight-bold">{{ q.label }}</span>
              </template>
              <template #append>
                <span class="text-caption text-medium-emphasis ml-2">{{ q.kbd }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-divider class="mb-2" />

        <!-- Core nav items -->
        <v-tooltip
          v-for="item in coreNav"
          :key="item.path"
          :text="item.name"
          location="end"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :to="item.path"
              :value="item.path"
              :active="route.path === item.path"
              rounded="xl"
              class="mb-2"
              nav
            >
              <template #prepend>
                <div class="position-relative">
                  <v-icon
                    :icon="item.icon"
                    size="24"
                    :color="route.path === item.path ? item.color : '#94a3b8'"
                  />
                  <v-badge
                    v-if="item.badge"
                    :color="item.badge.color"
                    dot
                    class="nav-badge-dot"
                  />
                </div>
              </template>
            </v-list-item>
          </template>
        </v-tooltip>

        <v-divider class="my-2" />
      </v-list>

      <!-- Bottom: theme + settings + avatar -->
      <template #append>
        <v-list nav density="compact" class="rail-nav-list pb-3">
          <!-- Upcoming -->
          <v-tooltip text="Upcoming" location="end">
            <template #activator="{ props }">
              <v-list-item v-bind="props" rounded="xl" @click="upcomingMenu = true">
                <template #prepend>
                  <v-badge :content="upcomingCount || undefined" color="info" :model-value="upcomingCount > 0" offset-x="2" offset-y="2">
                    <v-icon color="#94a3b8" size="24" icon="mdi-calendar-clock" />
                  </v-badge>
                </template>
              </v-list-item>
            </template>
          </v-tooltip>

          <!-- Theme toggle -->
          <v-tooltip :text="`Theme: ${theme}`" location="end">
            <template #activator="{ props }">
              <v-list-item v-bind="props" rounded="xl" @click="toggleTheme">
                <template #prepend>
                  <v-icon color="#94a3b8" size="24" :icon="theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'" />
                </template>
              </v-list-item>
            </template>
          </v-tooltip>

          <!-- Settings -->
          <v-tooltip text="Settings" location="end">
            <template #activator="{ props }">
              <v-list-item v-bind="props" rounded="xl" :to="'/settings'" :active="route.path === '/settings'">
                <template #prepend>
                  <v-icon
                    :color="route.path === '/settings' ? 'secondary' : '#94a3b8'"
                    size="24"
                    icon="mdi-cog-outline"
                  />
                </template>
              </v-list-item>
            </template>
          </v-tooltip>

          <v-list-item rounded="xl" :to="'/settings'" :active="route.path === '/settings'">
                <template #prepend>
                  <v-avatar
                    color="primary"
                    size="36"
                    class="text-caption font-weight-bold"
                  >{{ userInitials }}</v-avatar>
                </template>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>



    <!-- ── Mobile drawer (full sidebar) ────────────────────────── -->
    <v-navigation-drawer
      v-if="isMobile"
      v-model="mobileDrawerOpen"
      temporary
      :width="280"
    >
      <v-list-item class="py-4" :subtitle="userEmail">
        <template #title><span class="text-subtitle-2 font-weight-bold">{{ settings?.businessName || 'NovaOps' }}</span></template>
        <template #prepend>
          <v-avatar color="primary" size="36">
            <span class="text-caption font-weight-bold">{{ userInitials }}</span>
          </v-avatar>
        </template>
      </v-list-item>
      <v-divider />
      <v-list nav density="compact" class="pa-3">
        <v-list-item
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :value="item.path"
          rounded="lg"
          @click="mobileDrawerOpen = false"
        >
          <template #prepend>
            <v-avatar :color="item.color" size="30" rounded="lg" variant="tonal">
              <v-icon :icon="item.icon" size="15" />
            </v-avatar>
          </template>
          <template #title>
            <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
          </template>
          <template #append>
            <v-chip v-if="item.badge" :color="item.badge.color" size="x-small" variant="tonal">
              {{ item.badge.label }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>



    <!-- ── Main content ─────────────────────────────────────────── -->
    <v-main class="d-flex flex-column h-screen" style="overflow: hidden">
      <v-progress-linear
        v-if="appStore.isLoading && !noLoadingGate"
        indeterminate
        color="primary"
        height="2"
        style="position: absolute; top: 0; left: 0; right: 0; z-index: 9999"
      />

      <div class="flex-1-1-100 pa-4 pa-sm-6" style="overflow-y: auto; overflow-x: hidden;">
        <slot />
      </div>
    </v-main>

    <!-- ── Global snackbar ──────────────────────────────────────── -->
    <v-snackbar
      v-for="t in toasts"
      :key="t.id"
      :model-value="true"
      :color="snackColor(t.status)"
      location="bottom right"
      :timeout="t.duration || 4000"
      rounded="lg"
      @update:model-value="dismiss(t.id)"
    >
      <div class="d-flex align-center gap-2">
        <v-icon size="18">{{ snackIcon(t.status) }}</v-icon>
        <div>
          <div class="text-body-2 font-weight-bold">{{ t.title }}</div>
          <div v-if="t.description" class="text-caption opacity-80">{{ t.description }}</div>
        </div>
      </div>
      <template #actions>
        <v-btn icon="mdi-close" variant="text" size="x-small" @click="dismiss(t.id)" />
      </template>
    </v-snackbar>

    <!-- ── Global Dialogs ──────────────────────────────────────── -->
    <NewTicketDialog v-model="newTicketOpen" />
    <CustomerEditDialog v-model="newCustomerOpen" />

  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import CustomerEditDialog from '~/components/CustomerEditDialog.vue'
import { useDisplay } from 'vuetify'
import { useScreenLock } from '~/composables/useScreenLock'

const appStore = useAppStore()
const { tickets, appointments, settings } = storeToRefs(appStore)
const { toasts, dismiss } = useToast()
const { mobile } = useDisplay()
const route = useRoute()

const isMobile = computed(() => mobile.value)
const mobileDrawerOpen = ref(false)
const activeDrawer = ref<string | null>(null)
const upcomingMenu = ref(false)

// Theme
const theme = ref('light')
onMounted(() => {
  theme.value = localStorage.getItem('novaops_theme') || 'light'
  appStore.setupAuthListener()
  checkLockStatus()
  setupActivityListeners()
})
const { checkLockStatus, setupActivityListeners, cleanup } = useScreenLock()
onUnmounted(cleanup)

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('novaops_theme', theme.value)
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
  { name: 'Dashboard',   path: '/dashboard',  icon: 'mdi-view-dashboard-outline', color: '#6366f1', badge: null,                         group: 'core' },
  { name: 'Bookings',    path: '/bookings',   icon: 'mdi-clipboard-text-outline', color: '#f59e0b', badge: { label: 'New',  color: 'warning' }, group: 'core' },
  { name: 'Customers',   path: '/customers',  icon: 'mdi-account-group-outline',  color: '#3b82f6', badge: null,                         group: 'core' },
  { name: 'Inventory',   path: '/inventory',  icon: 'mdi-package-variant-closed', color: '#8b5cf6', badge: null,                         group: 'core' },
  { name: 'POS',         path: '/pos',        icon: 'mdi-cart-outline',           color: '#ec4899', badge: { label: 'Live', color: 'success' }, group: 'core' },
  { name: 'Analytics',   path: '/analytics',  icon: 'mdi-chart-bar',              color: '#10b981', badge: null,                         group: 'core' },
  { name: 'Tools',       path: '/tools',      icon: 'mdi-toolbox-outline',        color: '#06b6d4', badge: null,                         group: 'core' },
]

const coreNav  = navigation.filter(n => n.group === 'core')

const currentPageNav   = computed(() => navigation.find(n => n.path === route.path))
const currentPageTitle = computed(() => currentPageNav.value?.name || 'NovaOps')

// Drawer
function toggleDrawer(name: string) {
  activeDrawer.value = activeDrawer.value === name ? null : name
}
watch(() => route.path, () => {
  mobileDrawerOpen.value = false
  activeDrawer.value = null
})

// Quick items for the New popover
const quickItems = [
  { type: 'ticket',    label: 'New Ticket',    icon: 'mdi-ticket-outline',           color: '#f59e0b', kbd: '⌘T' },
  { type: 'housecall', label: 'House Call',     icon: 'mdi-map-marker-outline',     color: '#10b981', kbd: '⌘H' },
  { type: 'customer',  label: 'New Customer',   icon: 'mdi-account-plus-outline',   color: '#3b82f6', kbd: '⌘U' },
  { type: 'register',  label: 'Open Register',  icon: 'mdi-cart-outline',           color: '#ec4899', kbd: '⌘R' },
]

const newTicketOpen = ref(false)
const newCustomerOpen = ref(false)

function triggerAction(type: string) {
  if (type === 'ticket' || type === 'housecall') newTicketOpen.value = true
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
    .map((a: any) => ({ id: a.id, label: a.title || 'Appointment', sub: a.date, color: '#06b6d4', icon: 'mdi-calendar' }))
  const openTickets = (tickets.value || [])
    .filter((t: any) => t.status === 'Open' || t.status === 'In Progress')
    .slice(0, 3)
    .map((t: any) => ({ id: t.id, label: `#${t.id} ${t.device || ''}`.trim(), sub: t.status, color: '#6366f1', icon: 'mdi-ticket-confirmation-outline' }))
  return [...appts, ...openTickets]
})
const upcomingCount = computed(() => upcomingItems.value.length)

const NO_LOADING_GATE_PATHS = ['/settings', '/tools', '/analytics']
const noLoadingGate = computed(() => NO_LOADING_GATE_PATHS.includes(route.path))

// Snackbar helpers
function snackColor(status: string) {
  return { success: 'success', danger: 'error', warning: 'warning', info: 'info' }[status] || 'surface'
}
function snackIcon(status: string) {
  return { success: 'mdi-check-circle', danger: 'mdi-alert-circle', warning: 'mdi-alert', info: 'mdi-information' }[status] || 'mdi-bell'
}

// Keyboard shortcuts
function onKeydown(e: KeyboardEvent) {
  if (!e.metaKey && !e.ctrlKey) return
  const key = e.key.toLowerCase()
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
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1003;
  background: transparent;
}

.rail-drawer {
  z-index: 1004;
}

/* Active rail item highlight */
:deep(.v-list-item--active) {
  font-weight: 700;
}

/* Floating dot behavior for rail nav badges */
.nav-badge-dot {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(25%, -25%);
  pointer-events: none;
}
</style>
