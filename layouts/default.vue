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
          <component :is="currentPageNav.icon" :size="15" color="white" />
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
      <v-list nav density="compact" class="px-1 py-2">

        <!-- Logo / More FAB -->
        <v-list-item
          class="mb-1"
          :active="activeDrawer === 'more'"
          :base-color="activeDrawer === 'more' ? 'primary' : undefined"
          rounded="xl"
          @click="toggleDrawer('more')"
        >
          <template #prepend>
            <v-icon color="primary" size="22">mdi-plus-circle</v-icon>
          </template>
        </v-list-item>

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
              class="mb-0.5"
              nav
            >
              <template #prepend>
                <component
                  :is="item.icon"
                  :size="20"
                  :color="route.path === item.path ? item.color : '#94a3b8'"
                />
              </template>
              <template #append>
                <v-badge
                  v-if="item.badge"
                  :color="item.badge.color"
                  dot
                  floating
                />
              </template>
            </v-list-item>
          </template>
        </v-tooltip>

        <v-divider class="my-2" />

        <!-- Tools toggle -->
        <v-tooltip text="Tools" location="end">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :active="activeDrawer === 'tools'"
              rounded="xl"
              @click="toggleDrawer('tools')"
            >
              <template #prepend>
                <v-icon
                  :color="activeDrawer === 'tools' ? 'secondary' : '#94a3b8'"
                  size="20"
                >{{ activeDrawer === 'tools' ? 'mdi-chevron-right' : 'mdi-dots-horizontal' }}</v-icon>
              </template>
            </v-list-item>
          </template>
        </v-tooltip>
      </v-list>

      <!-- Bottom: theme + settings + avatar -->
      <template #append>
        <v-list nav density="compact" class="px-1 pb-3">
          <!-- Upcoming -->
          <v-tooltip text="Upcoming" location="end">
            <template #activator="{ props }">
              <v-list-item v-bind="props" rounded="xl" @click="upcomingMenu = true">
                <template #prepend>
                  <v-badge :content="upcomingCount || undefined" color="info" :model-value="upcomingCount > 0">
                    <v-icon color="#94a3b8" size="20">mdi-calendar-clock</v-icon>
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
                  <v-icon color="#94a3b8" size="20">
                    {{ theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
                  </v-icon>
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
                    size="20"
                  >mdi-cog-outline</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-tooltip>

          <!-- User avatar -->
          <v-list-item rounded="xl" @click="navigateTo('/settings')">
            <template #prepend>
              <v-avatar
                color="primary"
                size="32"
                class="text-caption font-weight-bold"
              >{{ userInitials }}</v-avatar>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- ── Desktop Contextual Drawer ───────────────────────────── -->
    <v-navigation-drawer
      v-if="!isMobile && activeDrawer"
      :model-value="!!activeDrawer"
      permanent
      :width="264"
      style="left: 72px"
    >
      <!-- More / Quick Actions drawer -->
      <template v-if="activeDrawer === 'more'">
        <v-list-item class="py-4 border-b" :subtitle="userEmail">
          <template #title><span class="text-subtitle-2 font-weight-bold">Quick Actions</span></template>
          <template #append>
            <v-btn icon="mdi-close" variant="text" size="small" @click="activeDrawer = null" />
          </template>
        </v-list-item>

        <div class="pa-3">
          <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2 px-1">Upcoming</p>
          <div v-if="upcomingItems.length === 0" class="text-center py-4 text-medium-emphasis">
            <v-icon>mdi-calendar-blank</v-icon>
            <p class="text-caption mt-1">Nothing coming up</p>
          </div>
          <v-list v-else density="compact" nav class="pa-0 mb-3">
            <v-list-item
              v-for="item in upcomingItems.slice(0, 5)"
              :key="item.id"
              :subtitle="item.sub"
              rounded="lg"
            >
              <template #prepend>
                <v-avatar :color="item.color" size="32" rounded="lg">
                  <component :is="item.icon" :size="16" color="white" />
                </v-avatar>
              </template>
              <template #title>
                <span class="text-caption font-weight-bold">{{ item.label }}</span>
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="mb-3" />
          <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2 px-1">Quick Actions</p>
          <v-list density="compact" nav class="pa-0">
            <v-list-item
              v-for="q in quickItems"
              :key="q.type"
              :subtitle="q.kbd"
              rounded="lg"
              @click="navigateTo(q.path); activeDrawer = null"
            >
              <template #prepend>
                <v-avatar :color="q.color" size="32" rounded="lg" variant="tonal">
                  <component :is="q.icon" :size="16" />
                </v-avatar>
              </template>
              <template #title>
                <span class="text-caption font-weight-bold">{{ q.label }}</span>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </template>

      <!-- Tools drawer -->
      <template v-if="activeDrawer === 'tools'">
        <v-list-item class="py-4 border-b">
          <template #title><span class="text-subtitle-2 font-weight-bold">Tools</span></template>
          <template #append>
            <v-btn icon="mdi-close" variant="text" size="small" @click="activeDrawer = null" />
          </template>
        </v-list-item>
        <v-list nav density="compact" class="pa-3">
          <v-list-item
            v-for="item in toolsNav"
            :key="item.path"
            :to="item.path"
            :value="item.path"
            rounded="lg"
            @click="activeDrawer = null"
          >
            <template #prepend>
              <v-avatar :color="item.color" size="32" rounded="lg" variant="tonal">
                <component :is="item.icon" :size="16" />
              </v-avatar>
            </template>
            <template #title>
              <span class="text-body-2 font-weight-semibold">{{ item.name }}</span>
            </template>
            <template #append>
              <v-chip v-if="item.badge" :color="item.badge.color" size="x-small" variant="tonal">
                {{ item.badge.label }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <template #append>
          <div class="pa-3 border-t">
            <v-list-item
              :subtitle="userEmail"
              rounded="lg"
              class="cursor-pointer"
              @click="navigateTo('/settings'); activeDrawer = null"
            >
              <template #prepend>
                <v-avatar color="primary" size="32">
                  <span class="text-caption font-weight-bold">{{ userInitials }}</span>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-caption font-weight-bold">{{ settings?.businessName || 'NovaOps' }}</span>
              </template>
            </v-list-item>
          </div>
        </template>
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
              <component :is="item.icon" :size="15" />
            </v-avatar>
          </template>
          <template #title>
            <span class="text-body-2 font-weight-semibold">{{ item.name }}</span>
          </template>
          <template #append>
            <v-chip v-if="item.badge" :color="item.badge.color" size="x-small" variant="tonal">
              {{ item.badge.label }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- ── Backdrop for desktop contextual drawer ───────────────── -->
    <div
      v-if="!isMobile && activeDrawer"
      class="drawer-overlay"
      @click="activeDrawer = null"
    />

    <!-- ── Main content ─────────────────────────────────────────── -->
    <v-main>
      <!-- Loading bar -->
      <v-progress-linear
        v-if="appStore.isLoading && !noLoadingGate"
        indeterminate
        color="primary"
        height="2"
        style="position: fixed; top: 0; left: 0; right: 0; z-index: 9999"
      />

      <div class="pa-4 pa-sm-6">
        <slot />
      </div>
    </v-main>

    <!-- ── Global snackbar (useToast compatible) ────────────────── -->
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

  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import { useDisplay } from 'vuetify'
import {
  LayoutDashboard, TicketCheck, Users, Package, CalendarDays, ShoppingCart,
  ClipboardList, FileText, ScanLine, Upload, BarChart3, MessageCircle,
  Tv, ArrowLeftRight, TicketPlus, UserPlus, Tag, Barcode, MapPin,
} from 'lucide-vue-next'
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

// Navigation definition
const navigation = [
  { name: 'Dashboard',   path: '/dashboard',  icon: LayoutDashboard, color: '#6366f1', badge: null,                         group: 'core' },
  { name: 'Bookings',    path: '/bookings',   icon: ClipboardList,   color: '#f59e0b', badge: { label: 'New',  color: 'warning' }, group: 'core' },
  { name: 'Customers',   path: '/customers',  icon: Users,           color: '#3b82f6', badge: null,                         group: 'core' },
  { name: 'Inventory',   path: '/inventory',  icon: Package,         color: '#8b5cf6', badge: null,                         group: 'core' },
  { name: 'Calendar',    path: '/calendar',   icon: CalendarDays,    color: '#06b6d4', badge: null,                         group: 'core' },
  { name: 'POS',         path: '/pos',        icon: ShoppingCart,    color: '#ec4899', badge: { label: 'Live', color: 'success' }, group: 'core' },
  { name: 'Trade-In',    path: '/tradein',    icon: ArrowLeftRight,  color: '#f59e0b', badge: null,                         group: 'core' },
  { name: 'Analytics',   path: '/analytics',  icon: BarChart3,       color: '#10b981', badge: null,                         group: 'tools' },
  { name: 'Messages',    path: '/messages',   icon: MessageCircle,   color: '#ec4899', badge: null,                         group: 'tools' },
  { name: 'Display',     path: '/display',    icon: Tv,              color: '#06b6d4', badge: null,                         group: 'tools' },
  { name: 'Barcodes',    path: '/barcodes',   icon: ScanLine,        color: '#06b6d4', badge: null,                         group: 'tools' },
  { name: 'Import',      path: '/import',     icon: Upload,          color: '#8b5cf6', badge: null,                         group: 'tools' },
  { name: 'Forms',       path: '/forms',      icon: FileText,        color: '#10b981', badge: null,                         group: 'tools' },
]

const coreNav  = navigation.filter(n => n.group === 'core')
const toolsNav = navigation.filter(n => n.group === 'tools')

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

// Quick items for the More drawer
const quickItems = [
  { type: 'ticket',   label: 'New Ticket',   icon: TicketPlus,   color: '#f59e0b', path: '/bookings',  kbd: '⌘T' },
  { type: 'housecall',label: 'House Call',   icon: MapPin,       color: '#10b981', path: '/bookings',  kbd: '⌘H' },
  { type: 'customer', label: 'New Customer', icon: UserPlus,     color: '#3b82f6', path: '/customers', kbd: '⌘U' },
  { type: 'register', label: 'Open Register',icon: ShoppingCart, color: '#ec4899', path: '/pos',       kbd: '⌘R' },
  { type: 'invoice',  label: 'New Invoice',  icon: Tag,          color: '#10b981', path: '/forms',     kbd: '⌘I' },
  { type: 'scan',     label: 'Scan Barcode', icon: Barcode,      color: '#06b6d4', path: '/barcodes',  kbd: '⌘B' },
]

// Upcoming items
const upcomingItems = computed(() => {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const appts = (appointments.value || [])
    .filter((a: any) => a.status === 'scheduled' && a.date >= todayStr)
    .sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 4)
    .map((a: any) => ({ id: a.id, label: a.title || 'Appointment', sub: a.date, color: '#06b6d4', icon: CalendarDays }))
  const openTickets = (tickets.value || [])
    .filter((t: any) => t.status === 'Open' || t.status === 'In Progress')
    .slice(0, 3)
    .map((t: any) => ({ id: t.id, label: `#${t.id} ${t.device || ''}`.trim(), sub: t.status, color: '#6366f1', icon: TicketCheck }))
  return [...appts, ...openTickets]
})
const upcomingCount = computed(() => upcomingItems.value.length)

// No-loading-gate pages
const NO_LOADING_GATE_PATHS = ['/settings', '/barcodes', '/tradein', '/forms', '/import', '/display', '/analytics', '/messages']
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
  const map: Record<string, string> = {
    't': '/bookings', 'h': '/bookings', 'u': '/customers',
    'r': '/pos', 'i': '/forms', 'b': '/barcodes',
    'd': '/dashboard', ',': '/settings', 'm': '/messages',
  }
  const path = map[e.key.toLowerCase()]
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
</style>
