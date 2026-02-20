<template>
  <div class="min-h-screen bg-background flex">

    <!-- ── Mobile Overlay ─────────────────────────────────────────── -->
    <Transition name="overlay">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-50 lg:hidden"
        @click="mobileMenuOpen = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>
    </Transition>

    <!-- ── Mobile Full Sidebar (slides in) ───────────────────────── -->
    <Transition name="sidebar">
      <aside
        v-if="mobileMenuOpen"
        class="fixed left-0 top-0 z-50 h-screen flex lg:hidden shadow-2xl"
      >
        <!-- Rail -->
        <div class="w-[72px] h-full bg-card border-r border-border flex flex-col items-center py-3 gap-1 flex-shrink-0">
          <RailContent
            :navigation="navigation"
            :user-initials="userInitials"
            :active-drawer="activeDrawer"
            :current-theme="currentTheme"
            :upcoming-items="upcomingItems"
            @set-drawer="setDrawer"
            @navigate="mobileMenuOpen = false"
            @set-theme="handleSetTheme"
            @export="handleExport"
          />
        </div>
        <!-- Drawer panel -->
        <Transition name="drawer">
          <div
            v-if="activeDrawer"
            class="w-64 h-full bg-card border-r border-border flex flex-col"
          >
            <DrawerContent
              :drawer="activeDrawer"
              :navigation="navigation"
              :user-email="userEmail"
              :settings="settings"
              @navigate="mobileMenuOpen = false; activeDrawer = null"
              @close="activeDrawer = null"
            />
          </div>
        </Transition>
      </aside>
    </Transition>

    <!-- ── Desktop Rail ───────────────────────────────────────────── -->
    <aside class="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-[72px] bg-card border-r border-border flex-col items-center py-3 gap-1">
      <RailContent
        :navigation="navigation"
        :user-initials="userInitials"
        :active-drawer="activeDrawer"
        :current-theme="currentTheme"
        :upcoming-items="upcomingItems"
        @set-drawer="setDrawer"
        @navigate="() => {}"
        @set-theme="handleSetTheme"
        @export="handleExport"
      />
    </aside>

    <!-- ── Desktop Drawer (slides right of rail) ──────────────────── -->
    <Transition name="drawer">
      <aside
        v-if="activeDrawer && !mobileMenuOpen"
        class="hidden lg:flex fixed left-[72px] top-0 z-30 h-screen w-64 bg-card border-r border-border flex-col shadow-xl"
      >
        <DrawerContent
          :drawer="activeDrawer"
          :navigation="navigation"
          :user-email="userEmail"
          :settings="settings"
          @navigate="activeDrawer = null"
          @close="activeDrawer = null"
        />
      </aside>
    </Transition>

    <!-- ── Drawer backdrop click-away ─────────────────────────────── -->
    <Transition name="overlay">
      <div
        v-if="activeDrawer && !mobileMenuOpen"
        class="hidden lg:block fixed inset-0 z-20"
        @click="activeDrawer = null"
      />
    </Transition>

    <!-- ── Main ───────────────────────────────────────────────────── -->
    <div
      class="flex flex-col min-h-screen w-full transition-[padding-left] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
      :class="activeDrawer && !mobileMenuOpen ? 'lg:pl-[336px]' : 'lg:pl-[72px]'"
    >
      <!-- Mobile top bar -->
      <header class="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 h-12 lg:hidden">
        <button class="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-muted/60 transition-colors -ml-1" @click="mobileMenuOpen = true">
          <Menu class="h-4 w-4" />
        </button>
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div
            v-if="currentPageNav"
            class="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            :style="`background: ${currentPageNav.color}18`"
          >
            <component :is="currentPageNav.icon" class="w-3 h-3" :style="`color: ${currentPageNav.color}`" />
          </div>
          <span class="text-sm font-semibold truncate">{{ currentPageTitle }}</span>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-6">
        <div v-if="appStore.isLoading" class="flex items-center justify-center py-32">
          <div class="flex flex-col items-center gap-3">
            <div class="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            <p class="text-xs text-muted-foreground">Loading your data...</p>
          </div>
        </div>
        <div v-else>
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineComponent, h, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import {
  LayoutDashboard, TicketCheck, Users, Package, CalendarDays, ShoppingCart,
  FileText, Settings as SettingsIcon, Menu, X, MapPin, ScanLine, Upload,
  Globe, Plus, Monitor, Moon, Sun, Download, ChevronRight,
  TicketPlus, UserPlus, Tag, Barcode, Clock, AlertCircle,
} from 'lucide-vue-next'
import NotificationsPanel from '~/components/NotificationsPanel.vue'
import { useScreenLock } from '~/composables/useScreenLock'

const appStore = useAppStore()
const { tickets, appointments } = storeToRefs(appStore)
const settings = computed(() => appStore.settings ?? { businessName: '', email: '' })
const route = useRoute()

// ── Upcoming widget data ──────────────────────────────────────────
const upcomingItems = computed(() => {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const appts = (appointments.value || [])
    .filter(a => a.status === 'scheduled' && a.date >= todayStr)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 4)
    .map(a => ({
      id: a.id,
      label: a.title || a.description || 'Appointment',
      sub: formatApptTime(a.date, a.time),
      color: '#06b6d4',
      icon: CalendarDays,
    }))

  const openTickets = (tickets.value || [])
    .filter(t => t.status === 'Open' || t.status === 'In Progress')
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 3)
    .map(t => ({
      id: t.id,
      label: `#${t.id} ${t.device || ''}`.trim(),
      sub: t.status,
      color: t.status === 'In Progress' ? '#f59e0b' : '#6366f1',
      icon: TicketCheck,
    }))

  return [...appts, ...openTickets]
})

function formatApptTime(date: string, time: string) {
  try {
    const d = new Date(`${date}T${time || '00:00'}`)
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return date }
}

const mobileMenuOpen = ref(false)
const activeDrawer = ref<string | null>(null)
const currentTheme = ref<string>('system')

const { checkLockStatus, setupActivityListeners, cleanup } = useScreenLock()

onMounted(() => {
  appStore.initializeData()
  checkLockStatus()
  setupActivityListeners()
  currentTheme.value = (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) || 'system'
})
onUnmounted(() => cleanup())

const userEmail = computed(() => {
  if (process.client) {
    const profile = localStorage.getItem('business_profile')
    if (profile) {
      const data = JSON.parse(profile)
      return data.email || settings.value.email || 'user@novaops.com'
    }
  }
  return settings.value.email || 'user@novaops.com'
})

const userInitials = computed(() => {
  const email = userEmail.value
  if (email) {
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return email.substring(0, 2).toUpperCase()
  }
  return 'UN'
})

const navigation = [
  { name: 'Dashboard',   path: '/dashboard',        icon: LayoutDashboard, color: '#6366f1', badge: null,                         group: 'core' },
  { name: 'Tickets',     path: '/tickets',           icon: TicketCheck,     color: '#f59e0b', badge: { label: 'New',    color: '#f59e0b' }, group: 'core' },
  { name: 'House Calls', path: '/housecalls',        icon: MapPin,          color: '#10b981', badge: null,                         group: 'core' },
  { name: 'Customers',   path: '/customers',         icon: Users,           color: '#3b82f6', badge: null,                         group: 'core' },
  { name: 'Inventory',   path: '/inventory',         icon: Package,         color: '#8b5cf6', badge: null,                         group: 'core' },
  { name: 'Calendar',    path: '/calendar',          icon: CalendarDays,    color: '#06b6d4', badge: null,                         group: 'core' },
  { name: 'POS',         path: '/pos',               icon: ShoppingCart,    color: '#ec4899', badge: { label: 'Live',   color: '#10b981' }, group: 'core' },
  { name: 'Reports',     path: '/reports',           icon: FileText,        color: '#f97316', badge: null,                         group: 'tools' },
  { name: 'Barcodes',    path: '/barcodes',          icon: ScanLine,        color: '#06b6d4', badge: null,                         group: 'tools' },
  { name: 'Import',      path: '/import',            icon: Upload,          color: '#8b5cf6', badge: null,                         group: 'tools' },
  { name: 'Forms',       path: '/forms',             icon: FileText,        color: '#10b981', badge: { label: 'New',    color: '#10b981' }, group: 'tools' },
  { name: 'Website',     path: '/website-settings',  icon: Globe,           color: '#f59e0b', badge: { label: 'Portal', color: '#f59e0b' }, group: 'tools' },
  { name: 'Settings',    path: '/settings',          icon: SettingsIcon,    color: '#64748b', badge: null,                         group: 'bottom' },
]

const currentPageNav = computed(() => navigation.find(item => item.path === route.path))
const currentPageTitle = computed(() => currentPageNav.value?.name || 'Dashboard')

// Close drawer on route change
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

function setDrawer(name: string | null) {
  activeDrawer.value = activeDrawer.value === name ? null : name
}

function handleSetTheme(theme: string) {
  currentTheme.value = theme
  if (typeof localStorage !== 'undefined') localStorage.setItem('theme', theme)
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else if (theme === 'light') root.classList.remove('dark')
  else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
}

function handleExport() {
  const data = { settings: appStore.settings, tickets: appStore.tickets, customers: appStore.customers, inventory: appStore.inventory }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `novaops-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
  URL.revokeObjectURL(url)
}

// Keyboard shortcuts
function onKeydown(e: KeyboardEvent) {
  if (!e.metaKey && !e.ctrlKey) return
  const map: Record<string, string> = {
    't': '/tickets', 'h': '/housecalls', 'u': '/customers',
    'r': '/pos', 'i': '/forms', 'b': '/barcodes',
    'd': '/dashboard', ',': '/settings',
  }
  const path = map[e.key.toLowerCase()]
  if (path) { e.preventDefault(); navigateTo(path) }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ──────────────────────────────────────────────────────────────────
// Rail Component — narrow icon-only strip (Material nav rail style)
// ──────────────────────────────────────────────────────────────────
const RailContent = defineComponent({
  name: 'RailContent',
  props: {
    navigation:     { type: Array as () => typeof navigation, required: true },
    userInitials:   { type: String, required: true },
    activeDrawer:   { type: String as () => string | null, default: null },
    currentTheme:   { type: String, required: true },
    upcomingItems:  { type: Array as () => typeof upcomingItems.value, default: () => [] },
  },
  emits: ['set-drawer', 'navigate', 'set-theme', 'export'],
  setup(props, { emit }) {
    const route = useRoute()
    const NuxtLink = resolveComponent('NuxtLink')
    const upcomingOpen = ref(false)

    const coreNav  = computed(() => props.navigation.filter(n => n.group === 'core'))
    const toolsNav = computed(() => props.navigation.filter(n => n.group === 'tools'))

    // Close upcoming popout when clicking outside
    function onClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-upcoming]')) upcomingOpen.value = false
    }
    onMounted(() => document.addEventListener('mousedown', onClickOutside))
    onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

    function isActive(path: string) { return route.path === path }

    // Rail item: icon pill + label below (Material nav rail pattern)
    function railItem(item: typeof navigation[0]) {
      const active = isActive(item.path)
      return h(NuxtLink, {
        key: item.path,
        to: item.path,
        class: 'flex flex-col items-center gap-1 w-full px-1 group',
        style: 'text-decoration: none',
        onClick: () => emit('navigate'),
      }, () => [
        // Pill highlight
        h('div', {
          class: [
            'w-14 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 relative',
            active
              ? 'shadow-sm'
              : 'hover:bg-muted/60 group-hover:scale-105'
          ].join(' '),
          style: active ? `background: ${item.color}22` : '',
        }, [
          h(item.icon, {
            class: 'w-5 h-5 transition-colors',
            style: active ? `color: ${item.color}` : 'color: hsl(var(--muted-foreground))',
          }),
          // Badge dot
          item.badge ? h('span', {
            class: 'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-card',
            style: `background: ${item.badge.color}`,
          }) : null,
        ]),
        // Label
        h('span', {
          class: 'text-[10px] font-medium leading-none transition-colors',
          style: active ? `color: ${item.color}` : 'color: hsl(var(--muted-foreground))',
        }, item.name),
      ])
    }

    return () => h('div', { class: 'flex flex-col items-center h-full w-full gap-0' }, [

      // ── Logo badge ──
      h('div', { class: 'flex flex-col items-center pb-3 pt-1 flex-shrink-0' }, [
        h('div', {
          class: 'w-10 h-10 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0',
          style: 'background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        }, [
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 16 16',
            fill: 'white',
            style: 'width:20px;height:20px',
          }, [
            h('path', {
              d: 'M13.5 2.5a.5.5 0 0 0-.707 0L11.5 3.793l-.647-.646a.5.5 0 0 0-.707.707L11 4.707 9.146 6.561A4 4 0 0 0 4 11.5a.5.5 0 0 0 .854.354l1.292-1.293a.5.5 0 0 1 .708 0l.585.585a.5.5 0 0 1 0 .708L6.146 13.146A.5.5 0 0 0 6.5 14a4 4 0 0 0 4.939-4.146L13.5 7.707l.293.293a.5.5 0 0 0 .707-.707l-.646-.647 1.293-1.293a.5.5 0 0 0 0-.707L13.5 2.5Z',
              'fill-rule': 'evenodd', 'clip-rule': 'evenodd',
            }),
          ]),
        ]),
      ]),

      // ── Quick Add FAB ──
      h('div', { class: 'flex flex-col items-center w-full px-1 pb-4 flex-shrink-0' }, [
        h('button', {
          class: [
            'w-14 h-8 rounded-2xl flex items-center justify-center transition-all duration-200',
            props.activeDrawer === 'quickadd'
              ? 'shadow-sm'
              : 'hover:scale-105',
          ].join(' '),
          style: props.activeDrawer === 'quickadd'
            ? 'background: #6366f122'
            : 'background: hsl(var(--muted)/0.5)',
          title: 'Quick Add',
          onClick: () => emit('set-drawer', 'quickadd'),
        }, [
          h(Plus, {
            class: 'w-5 h-5 transition-all duration-300',
            style: props.activeDrawer === 'quickadd'
              ? 'color: #6366f1; transform: rotate(45deg)'
              : 'color: hsl(var(--muted-foreground))',
          })
        ]),
        h('span', {
          class: 'text-[10px] font-medium leading-none mt-1',
          style: props.activeDrawer === 'quickadd' ? 'color: #6366f1' : 'color: hsl(var(--muted-foreground))',
        }, 'Add'),
      ]),

      // ── Core nav ──
      h('nav', { class: 'flex-1 flex flex-col items-center w-full gap-1 overflow-y-auto overflow-x-hidden py-1' }, [
        ...coreNav.value.map(item => railItem(item)),

        // Divider
        h('div', { class: 'w-8 h-px bg-border/60 my-2 flex-shrink-0' }),

        // Tools drawer toggle
        h('button', {
          class: [
            'flex flex-col items-center gap-1 w-full px-1 group',
          ].join(' '),
          onClick: () => emit('set-drawer', 'tools'),
        }, [
          h('div', {
            class: [
              'w-14 h-8 rounded-2xl flex items-center justify-center transition-all duration-200',
              props.activeDrawer === 'tools' ? 'shadow-sm' : 'hover:bg-muted/60 group-hover:scale-105',
            ].join(' '),
            style: props.activeDrawer === 'tools' ? 'background: #64748b22' : '',
          }, [
            h(ChevronRight, {
              class: 'w-4 h-4 transition-all duration-300',
              style: [
                props.activeDrawer === 'tools' ? 'color: #64748b' : 'color: hsl(var(--muted-foreground))',
                props.activeDrawer === 'tools' ? 'transform: rotate(180deg)' : '',
              ].join('; '),
            }),
          ]),
          h('span', {
            class: 'text-[10px] font-medium leading-none',
            style: props.activeDrawer === 'tools' ? 'color: #64748b' : 'color: hsl(var(--muted-foreground))',
          }, 'Tools'),
        ]),
      ]),

      // ── Bottom utilities ──
      h('div', { class: 'flex flex-col items-center gap-1 pt-2 border-t border-border w-full flex-shrink-0 pb-1' }, [

        // Upcoming widget
        h('div', {
          class: 'flex flex-col items-center gap-1 w-full px-1 relative',
          'data-upcoming': '',
        }, [
          h('button', {
            class: [
              'w-14 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 relative group',
              upcomingOpen.value ? 'shadow-sm' : 'hover:bg-muted/60 group-hover:scale-105',
            ].join(' '),
            style: upcomingOpen.value ? 'background: #06b6d422' : '',
            title: 'Upcoming',
            onClick: () => { upcomingOpen.value = !upcomingOpen.value },
          }, [
            h(CalendarDays, {
              class: 'w-4 h-4 transition-colors',
              style: upcomingOpen.value ? 'color: #06b6d4' : 'color: hsl(var(--muted-foreground))',
            }),
            // Badge showing count if any
            props.upcomingItems.length > 0
              ? h('span', {
                  class: 'absolute -top-0.5 -right-1 min-w-[14px] h-[14px] rounded-full bg-cyan-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 border-2 border-card',
                }, String(props.upcomingItems.length))
              : null,
          ]),
          h('span', {
            class: 'text-[10px] font-medium leading-none',
            style: upcomingOpen.value ? 'color: #06b6d4' : 'color: hsl(var(--muted-foreground))',
          }, 'Upcoming'),

          // ── Popout panel ──
          upcomingOpen.value
            ? h('div', {
                class: 'absolute bottom-0 left-[calc(100%+8px)] w-64 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden z-50',
                style: 'animation: popIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
              }, [
                // Header
                h('div', { class: 'flex items-center justify-between px-3.5 py-3 border-b border-border' }, [
                  h('div', { class: 'flex items-center gap-2' }, [
                    h('div', { class: 'w-6 h-6 rounded-lg flex items-center justify-center', style: 'background: #06b6d418' }, [
                      h(CalendarDays, { class: 'w-3.5 h-3.5', style: 'color: #06b6d4' }),
                    ]),
                    h('span', { class: 'text-sm font-semibold' }, 'Upcoming'),
                  ]),
                  h('button', {
                    class: 'w-6 h-6 rounded-lg flex items-center justify-center hover:bg-muted/60 text-muted-foreground transition-colors',
                    onClick: () => { upcomingOpen.value = false },
                  }, [h(X, { class: 'w-3.5 h-3.5' })]),
                ]),
                // Items
                props.upcomingItems.length === 0
                  ? h('div', { class: 'px-4 py-8 text-center' }, [
                      h('p', { class: 'text-xs text-muted-foreground' }, 'Nothing coming up'),
                    ])
                  : h('div', { class: 'py-1.5 max-h-72 overflow-y-auto' },
                      props.upcomingItems.map(item =>
                        h('div', {
                          key: item.id,
                          class: 'flex items-center gap-3 px-3.5 py-2 hover:bg-muted/40 transition-colors',
                        }, [
                          h('div', {
                            class: 'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0',
                            style: `background: ${item.color}18`,
                          }, [
                            h(item.icon, { class: 'w-3.5 h-3.5', style: `color: ${item.color}` }),
                          ]),
                          h('div', { class: 'flex-1 min-w-0' }, [
                            h('p', { class: 'text-xs font-medium text-foreground truncate' }, item.label),
                            h('p', { class: 'text-[10px] text-muted-foreground truncate' }, item.sub),
                          ]),
                        ])
                      )
                    ),
                // Footer link
                h('div', { class: 'border-t border-border' }, [
                  h('button', {
                    class: 'w-full text-xs text-cyan-500 font-medium py-2.5 hover:bg-muted/40 transition-colors text-center',
                    onClick: () => { navigateTo('/calendar'); upcomingOpen.value = false },
                  }, 'Open Calendar →'),
                ]),
              ])
            : null,
        ]),

        // Theme
        h('button', {
          class: 'flex flex-col items-center gap-1 w-full px-1 group',
          onClick: () => {
            const next = props.currentTheme === 'system' ? 'dark' : props.currentTheme === 'dark' ? 'light' : 'system'
            emit('set-theme', next)
          },
          title: 'Toggle theme',
        }, [
          h('div', {
            class: 'w-14 h-8 rounded-2xl flex items-center justify-center hover:bg-muted/60 transition-colors group-hover:scale-105',
          }, [
            h(props.currentTheme === 'dark' ? Moon : props.currentTheme === 'light' ? Sun : Monitor, {
              class: 'w-4 h-4 text-muted-foreground',
            }),
          ]),
          h('span', { class: 'text-[10px] text-muted-foreground font-medium leading-none' },
            props.currentTheme === 'dark' ? 'Dark' : props.currentTheme === 'light' ? 'Light' : 'Auto'),
        ]),

        // User avatar
        h('button', {
          class: 'flex flex-col items-center gap-1 w-full px-1 group mt-1',
          onClick: () => navigateTo('/settings'),
          title: 'Account & Settings',
        }, [
          h('div', {
            class: 'w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white shadow-sm shadow-primary/20 group-hover:scale-110 transition-transform',
          }, [
            h('span', { class: 'text-xs font-bold' }, props.userInitials),
          ]),
        ]),
      ]),
    ])
  },
})

// ──────────────────────────────────────────────────────────────────
// Drawer Component — slides in from rail, shows contextual content
// ──────────────────────────────────────────────────────────────────
const DrawerContent = defineComponent({
  name: 'DrawerContent',
  props: {
    drawer:      { type: String, required: true },
    navigation:  { type: Array as () => typeof navigation, required: true },
    userEmail:   { type: String, required: true },
    settings:    { type: Object, required: true },
  },
  emits: ['navigate', 'close'],
  setup(props, { emit }) {
    const NuxtLink = resolveComponent('NuxtLink')
    const route = useRoute()

    const toolsNav = computed(() => props.navigation.filter(n => n.group === 'tools'))

    const navLinkClass = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
    const activeClass  = '!bg-primary/8 !text-primary'

    const quickItems = [
      { type: 'ticket',    label: 'New Ticket',     icon: TicketPlus,  color: '#f59e0b', path: '/tickets',   kbd: '⌘T' },
      { type: 'housecall', label: 'House Call',      icon: MapPin,      color: '#10b981', path: '/housecalls',kbd: '⌘H' },
      { type: 'customer',  label: 'New Customer',    icon: UserPlus,    color: '#3b82f6', path: '/customers', kbd: '⌘U' },
      { type: 'register',  label: 'Open Register',   icon: ShoppingCart,color: '#ec4899', path: '/pos',       kbd: '⌘R' },
      { type: 'invoice',   label: 'New Invoice',     icon: Tag,         color: '#10b981', path: '/forms',     kbd: '⌘I' },
      { type: 'scan',      label: 'Scan Barcode',    icon: Barcode,     color: '#06b6d4', path: '/barcodes',  kbd: '⌘B' },
    ]

    return () => {

      // ── Quick Add drawer ──
      if (props.drawer === 'quickadd') {
        return h('div', { class: 'flex flex-col h-full' }, [
          // Header
          h('div', { class: 'flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0' }, [
            h('h2', { class: 'text-sm font-semibold text-foreground' }, 'Quick Add'),
            h('button', {
              class: 'w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground',
              onClick: () => emit('close'),
            }, [h(X, { class: 'w-4 h-4' })]),
          ]),
          // Items
          h('div', { class: 'flex-1 p-3 space-y-1 overflow-y-auto' }, [
            ...quickItems.map(item =>
              h('button', {
                key: item.type,
                class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all text-left group',
                onClick: () => { navigateTo(item.path); emit('navigate') },
              }, [
                h('div', {
                  class: 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
                  style: `background: ${item.color}18`,
                }, [
                  h(item.icon, { class: 'w-4 h-4', style: `color: ${item.color}` }),
                ]),
                h('div', { class: 'flex-1 min-w-0' }, [
                  h('p', { class: 'text-sm font-medium text-foreground' }, item.label),
                ]),
                h('kbd', {
                  class: 'text-[10px] text-muted-foreground/50 font-mono bg-muted/60 px-1.5 py-0.5 rounded flex-shrink-0',
                }, item.kbd),
              ])
            ),
          ]),
        ])
      }

      // ── Tools drawer ──
      if (props.drawer === 'tools') {
        return h('div', { class: 'flex flex-col h-full' }, [
          h('div', { class: 'flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0' }, [
            h('h2', { class: 'text-sm font-semibold text-foreground' }, 'Tools'),
            h('button', {
              class: 'w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground',
              onClick: () => emit('close'),
            }, [h(X, { class: 'w-4 h-4' })]),
          ]),
          h('nav', { class: 'flex-1 p-3 space-y-0.5 overflow-y-auto' }, [
            ...toolsNav.value.map(item =>
              h(NuxtLink, {
                key: item.path,
                to: item.path,
                class: navLinkClass,
                activeClass,
                onClick: () => emit('navigate'),
              }, () => [
                h('div', {
                  class: 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                  style: `background: ${item.color}18`,
                }, [
                  h(item.icon, { class: 'w-4 h-4', style: `color: ${item.color}` }),
                ]),
                h('span', { class: 'flex-1 truncate' }, item.name),
                item.badge ? h('span', {
                  class: 'text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 border',
                  style: `background: ${item.badge.color}15; color: ${item.badge.color}; border-color: ${item.badge.color}30`,
                }, item.badge.label) : null,
              ])
            ),
          ]),
          // Settings link at bottom of tools
          h('div', { class: 'p-3 border-t border-border flex-shrink-0' }, [
            h(NuxtLink, {
              to: '/settings',
              class: navLinkClass,
              activeClass,
              onClick: () => emit('navigate'),
            }, () => [
              h('div', {
                class: 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                style: 'background: #64748b18',
              }, [h(SettingsIcon, { class: 'w-4 h-4', style: 'color: #64748b' })]),
              h('span', { class: 'flex-1 truncate' }, 'Settings'),
            ]),
            h('div', { class: 'mt-2 px-3 py-2 rounded-xl bg-muted/30 flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 transition-colors', onClick: () => navigateTo('/settings') }, [
              h('div', {
                class: 'w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white shadow-sm flex-shrink-0',
              }, [h('span', { class: 'text-[11px] font-bold' }, props.userEmail.substring(0,2).toUpperCase())]),
              h('div', { class: 'flex-1 min-w-0' }, [
                h('p', { class: 'text-xs font-semibold truncate' }, props.userEmail),
                h('p', { class: 'text-[10px] text-muted-foreground truncate' }, props.settings.businessName || 'NovaOps'),
              ]),
            ]),
          ]),
        ])
      }

      return h('div', {})
    }
  },
})
</script>

<style scoped>
/* ── Mobile sidebar — slides in from left ─────────────────────── */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}

/* ── Desktop drawer — slides in from behind the rail ─────────── */
.drawer-enter-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}
.drawer-leave-active {
  transition: transform 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease;
}
.drawer-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.drawer-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* ── Overlay fade ─────────────────────────────────────────────── */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.22s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}


/* ── Upcoming popout spring animation ─────────────────────────── */
@keyframes popIn {
  from { opacity: 0; transform: scale(0.92) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>


