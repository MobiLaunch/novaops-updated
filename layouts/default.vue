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

    <!-- ── Mobile Full Sidebar ────────────────────────────────────── -->
    <Transition name="sidebar">
      <aside
        v-if="mobileMenuOpen"
        class="fixed left-0 top-0 z-50 h-screen flex lg:hidden shadow-2xl"
      >
        <div class="w-[96px] h-full bg-card border-r border-border/60 flex flex-col items-center py-3 gap-1 flex-shrink-0 mob-rail">
          <RailContent
            :navigation="navigation"
            :user-initials="userInitials"
            :active-drawer="activeDrawer"
            :current-theme="currentTheme"
            :upcoming-items="upcomingItems"
            :is-mobile="true"
            @set-drawer="setDrawer"
            @navigate="mobileMenuOpen = false"
            @set-theme="handleSetTheme"
            @export="handleExport"
          />
        </div>
        <Transition name="drawer">
          <div
            v-if="activeDrawer"
            class="w-72 h-full bg-card border-r border-border/60 flex flex-col"
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
    <!-- In Electron the custom titlebar is 40px fixed at top:0, so the sidebar
         must start below it. fixed elements ignore the padding-top on the page
         root, so we set top/height dynamically based on isElectron. -->
    <aside
      class="hidden lg:flex fixed left-0 z-40 w-[76px] bg-card border-r border-border/60 flex-col items-center py-3 gap-1"
      :style="isElectron ? 'top:40px;height:calc(100vh - 40px)' : 'top:0;height:100vh'"
    >
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

    <!-- ── Desktop Drawer ─────────────────────────────────────────── -->
    <Transition name="drawer">
      <aside
        v-if="activeDrawer && !mobileMenuOpen"
        class="hidden lg:flex fixed left-[76px] z-30 w-64 bg-card border-r border-border/60 flex-col shadow-xl"
        :style="isElectron ? 'top:40px;height:calc(100vh - 40px)' : 'top:0;height:100vh'"
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

    <Transition name="overlay">
      <div
        v-if="activeDrawer && !mobileMenuOpen"
        class="hidden lg:block fixed inset-0 z-20"
        @click="activeDrawer = null"
      />
    </Transition>

    <!-- ── Main ───────────────────────────────────────────────────── -->
    <div
      class="flex flex-col min-h-screen w-full transition-[padding-left] duration-200 ease-out"
      :class="activeDrawer && !mobileMenuOpen ? 'lg:pl-[340px]' : 'lg:pl-[76px]'"
    >
      <!-- Mobile top bar -->
      <header class="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-card/90 backdrop-blur-xl px-4 h-14 lg:hidden">
        <button
          class="h-10 w-10 flex items-center justify-center rounded-[20px] hover:bg-muted/60 transition-all duration-200 hover:scale-105 active:scale-95 -ml-1"
          @click="mobileMenuOpen = true"
        >
          <Menu class="h-5 w-5" />
        </button>
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            v-if="currentPageNav"
            class="w-7 h-7 rounded-[14px] flex items-center justify-center flex-shrink-0"
            :style="`background: ${currentPageNav.color}20`"
          >
            <component :is="currentPageNav.icon" class="w-4 h-4" :style="`color: ${currentPageNav.color}`" />
          </div>
          <span class="text-sm font-bold truncate">{{ currentPageTitle }}</span>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-6 pb-8 sm:pb-6">
        <!-- Loading spinner: only shown on data-heavy pages, never on settings/config pages -->
        <div v-if="appStore.isLoading && !noLoadingGate" class="flex items-center justify-center py-32">
          <div class="flex flex-col items-center gap-4">
            <!-- M3 Expressive elastic progress bar -->
            <div class="w-48 h-2 rounded-full overflow-hidden relative" style="background: hsl(var(--muted))">
              <div class="absolute top-0 h-full rounded-full m3-elastic-bar" style="background: linear-gradient(90deg, #6366f1, #8b5cf6)" />
            </div>
            <p class="text-xs text-muted-foreground font-medium">Loading your data…</p>
          </div>
        </div>
        <div v-else class="m3-page-enter">
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
  ClipboardList,
  FileText, Settings as SettingsIcon, Menu, X, MapPin, Wrench, ScanLine, Upload,
  Globe, Plus, Monitor, Moon, Sun, Download, ChevronRight, Sparkles,
  TicketPlus, UserPlus, Tag, Barcode, Clock, AlertCircle,
  MessageCircle, Cpu, Tv, BarChart3,
} from 'lucide-vue-next'
import { useScreenLock } from '~/composables/useScreenLock'

const appStore = useAppStore()
const { tickets, appointments } = storeToRefs(appStore)
const settings = computed(() => appStore.settings ?? { businessName: '', email: '' })
const route = useRoute()

// Detect Electron so fixed sidebars can clear the custom 40px titlebar
const isElectron = ref(false)
onMounted(() => { isElectron.value = !!(window as any).electronAPI?.isElectron })

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
const currentTheme = ref<string>('light')

// Pages that should never be blocked by the data-loading spinner.
// Settings, website-settings, services etc. have their own data loads
// and must be accessible even when the main store hasn't finished yet.
const NO_LOADING_GATE_PATHS = [
  '/settings', '/website-settings', '/services', '/barcodes',
  '/forms', '/import', '/display', '/analytics', '/messages',
]
const noLoadingGate = computed(() => NO_LOADING_GATE_PATHS.includes(route.path))

const { checkLockStatus, setupActivityListeners, cleanup } = useScreenLock()

onMounted(() => {
  appStore.setupAuthListener()
  checkLockStatus()
  setupActivityListeners()
  currentTheme.value = (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) || 'light'
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
  { name: 'Bookings',    path: '/bookings',          icon: ClipboardList,   color: '#6366f1', badge: { label: 'New',    color: '#f59e0b' }, group: 'core' },
  { name: 'Customers',   path: '/customers',         icon: Users,           color: '#3b82f6', badge: null,                         group: 'core' },
  { name: 'Inventory',   path: '/inventory',         icon: Package,         color: '#8b5cf6', badge: null,                         group: 'core' },
  { name: 'Services',       path: '/services',          icon: Cpu,             color: '#22d3ee', badge: null,                         group: 'core' },
  { name: 'Calendar',    path: '/calendar',          icon: CalendarDays,    color: '#06b6d4', badge: null,                         group: 'core' },
  { name: 'POS',         path: '/pos',               icon: ShoppingCart,    color: '#ec4899', badge: { label: 'Live',   color: '#10b981' }, group: 'core' },
  { name: 'Analytics',   path: '/analytics',         icon: BarChart3,       color: '#10b981', badge: null,                         group: 'tools' },
  { name: 'Messages',    path: '/messages',          icon: MessageCircle,   color: '#ec4899', badge: null,                         group: 'tools' },
  { name: 'Display',     path: '/display',           icon: Tv,              color: '#06b6d4', badge: null,                         group: 'tools' },
  { name: 'Barcodes',    path: '/barcodes',          icon: ScanLine,        color: '#06b6d4', badge: null,                         group: 'tools' },
  { name: 'Import',      path: '/import',            icon: Upload,          color: '#8b5cf6', badge: null,                         group: 'tools' },
  { name: 'Forms',       path: '/forms',             icon: FileText,        color: '#10b981', badge: null,                         group: 'tools' },
  { name: 'Brand Mgr',   path: '/website-settings',  icon: Sparkles,        color: '#8b5cf6', badge: { label: 'Social', color: '#8b5cf6' }, group: 'tools' },
  { name: 'Settings',    path: '/settings',          icon: SettingsIcon,    color: '#64748b', badge: null,                         group: 'bottom' },
]

const currentPageNav = computed(() => navigation.find(item => item.path === route.path))
const currentPageTitle = computed(() => currentPageNav.value?.name || 'Dashboard')

watch(() => route.path, () => { mobileMenuOpen.value = false })

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

function onKeydown(e: KeyboardEvent) {
  if (!e.metaKey && !e.ctrlKey) return
  const map: Record<string, string> = {
    't': '/bookings', 'h': '/bookings', 'u': '/customers',
    'r': '/pos', 'i': '/forms', 'b': '/barcodes',
    'd': '/dashboard', ',': '/settings', 'm': '/messages',
    'n': '/services',
  }
  const path = map[e.key.toLowerCase()]
  if (path) { e.preventDefault(); navigateTo(path) }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ── Rail Component ────────────────────────────────────────────────
const RailContent = defineComponent({
  name: 'RailContent',
  props: {
    navigation:     { type: Array as () => typeof navigation, required: true },
    userInitials:   { type: String, required: true },
    activeDrawer:   { type: String as () => string | null, default: null },
    currentTheme:   { type: String, required: true },
    upcomingItems:  { type: Array as () => typeof upcomingItems.value, default: () => [] },
    isMobile:       { type: Boolean, default: false },
  },
  emits: ['set-drawer', 'navigate', 'set-theme', 'export'],
  setup(props, { emit }) {
    const route = useRoute()
    const NuxtLink = resolveComponent('NuxtLink')
    const upcomingOpen = ref(false)

    const coreNav = computed(() => props.navigation.filter(n => n.group === 'core'))

    function onClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-upcoming]')) upcomingOpen.value = false
    }
    onMounted(() => document.addEventListener('mousedown', onClickOutside))
    onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

    function isActive(path: string) { return route.path === path }

    function railItem(item: typeof navigation[0]) {
      const active = isActive(item.path)
      const m = props.isMobile
      return h(NuxtLink, {
        key: item.path,
        to: item.path,
        class: 'flex flex-col items-center gap-1.5 w-full px-1.5 group',
        style: 'text-decoration: none',
        onClick: () => emit('navigate'),
      }, () => [
        h('div', {
          class: [
            `${m ? 'w-[72px] h-12' : 'w-14 h-9'} rounded-[18px] flex items-center justify-center transition-all duration-300 relative`,
            active ? 'shadow-md' : 'hover:bg-muted/60',
          ].join(' '),
          style: active
            ? `background: ${item.color}28; transform: scale(1.05)`
            : '',
        }, [
          h(item.icon, {
            class: `${m ? 'w-6 h-6' : 'w-5 h-5'} transition-all duration-200`,
            style: active ? `color: ${item.color}` : 'color: hsl(var(--muted-foreground))',
          }),
          item.badge ? h('span', {
            class: 'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
            style: `background: ${item.badge.color}`,
          }) : null,
        ]),
        h('span', {
          class: `${m ? 'text-[11px]' : 'text-[10px]'} font-semibold leading-none transition-all duration-200`,
          style: active ? `color: ${item.color}` : 'color: hsl(var(--muted-foreground))',
        }, item.name),
      ])
    }

    return () => h('div', { class: 'flex flex-col items-center h-full w-full gap-0' }, [

      // ── Wordmark logo ──────────────────────────────────────────────
      h('div', { class: 'flex flex-col items-center w-full px-2 pt-1 pb-2 flex-shrink-0' }, [
        h('div', {
          class: props.isMobile ? 'w-[72px] h-12 rounded-[18px] flex items-center justify-center select-none cursor-pointer' : 'w-14 h-10 rounded-[16px] flex items-center justify-center select-none cursor-pointer',
          style: 'background: linear-gradient(145deg, #6366f1 0%, #818cf8 100%); box-shadow: 0 2px 8px #6366f130',
          onClick: () => navigateTo('/dashboard'),
        }, [
          h('div', { style: 'display: flex; flex-direction: column; align-items: center; line-height: 1' }, [
            h('span', {
              style: `color: rgba(255,255,255,0.75); font-size: ${props.isMobile ? '9' : '8'}px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase`,
            }, 'nova'),
            h('span', {
              style: `color: white; font-size: ${props.isMobile ? '15' : '13'}px; font-weight: 900; letter-spacing: -0.04em; margin-top: -1px`,
            }, 'ops'),
          ]),
        ]),
      ]),

      // More button — opens the upcoming + quick-add drawer
      h('div', { class: 'flex flex-col items-center w-full px-2 pb-3 flex-shrink-0' }, [
        h('button', {
          class: `${props.isMobile ? 'w-[72px] h-12' : 'w-14 h-9'} rounded-[18px] flex items-center justify-center transition-all duration-200 active:scale-[0.92] hover:scale-[1.04]`,
          style: props.activeDrawer === 'more'
            ? 'background: #6366f118; border: 2px solid #6366f140'
            : 'background: #6366f1; box-shadow: 0 2px 8px #6366f145; border: 2px solid transparent',
          title: 'More',
          onClick: () => emit('set-drawer', 'more'),
        }, [
          h(Plus, {
            class: `${props.isMobile ? 'w-6 h-6' : 'w-5 h-5'} transition-all duration-200`,
            style: props.activeDrawer === 'more'
              ? 'color: #6366f1; transform: rotate(45deg)'
              : 'color: white',
          }),
        ]),
        h('span', {
          class: `${props.isMobile ? 'text-[11px]' : 'text-[10px]'} font-semibold leading-none mt-1`,
          style: props.activeDrawer === 'more' ? 'color: #6366f1' : 'color: hsl(var(--muted-foreground))',
        }, 'More'),
      ]),

      // Core nav
      h('nav', { class: 'flex-1 flex flex-col items-center w-full gap-0.5 overflow-y-auto overflow-x-hidden py-1',  }, [
        ...coreNav.value.map(item => railItem(item)),
        h('div', { class: 'w-8 h-px my-2 flex-shrink-0', style: 'background: hsl(var(--border)/0.6)' }),
        h('button', {
          class: 'flex flex-col items-center gap-1.5 w-full px-1.5 group',
          onClick: () => emit('set-drawer', 'tools'),
        }, [
          h('div', {
            class: `${props.isMobile ? 'w-[72px] h-12' : 'w-14 h-9'} rounded-[18px] flex items-center justify-center transition-all duration-300`,
            style: props.activeDrawer === 'tools'
              ? 'background: #64748b28; transform: scale(1.05)'
              : '',
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
            class: `${props.isMobile ? 'text-[11px]' : 'text-[10px]'} font-semibold leading-none`,
            style: props.activeDrawer === 'tools' ? 'color: #64748b' : 'color: hsl(var(--muted-foreground))',
          }, 'Tools'),
        ]),
      ]),

      // Bottom utilities
      h('div', { class: 'flex flex-col items-center gap-0.5 pt-2 border-t border-border/60 w-full flex-shrink-0 pb-1' }, [

        // Upcoming
        h('div', { class: 'flex flex-col items-center gap-1 w-full px-1 relative', 'data-upcoming': '' }, [
          h('button', {
            class: `${props.isMobile ? 'w-[72px] h-12' : 'w-14 h-9'} rounded-[18px] flex items-center justify-center transition-all duration-300 relative`,
            style: upcomingOpen.value ? 'background: #06b6d428; transform: scale(1.05)' : '',
            onClick: () => { upcomingOpen.value = !upcomingOpen.value },
          }, [
            h(CalendarDays, { class: `${props.isMobile ? 'w-5 h-5' : 'w-4 h-4'} transition-colors`, style: upcomingOpen.value ? 'color: #06b6d4' : 'color: hsl(var(--muted-foreground))' }),
            props.upcomingItems.length > 0
              ? h('span', {
                  class: 'absolute -top-0.5 -right-1 min-w-[15px] h-[15px] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5 border-2 border-card',
                  style: 'background: #06b6d4',
                }, String(props.upcomingItems.length))
              : null,
          ]),
          h('span', { class: `${props.isMobile ? 'text-[11px]' : 'text-[10px]'} font-semibold leading-none`, style: upcomingOpen.value ? 'color: #06b6d4' : 'color: hsl(var(--muted-foreground))' }, 'Soon'),

          upcomingOpen.value ? h('div', {
            class: 'absolute bottom-0 left-[calc(100%+8px)] w-68 bg-popover border border-border/60 rounded-3xl shadow-2xl overflow-hidden z-50',
            style: 'animation: m3BounceIn 0.35s cubic-bezier(0.34,1.56,0.64,1); width: 272px',
          }, [
            h('div', { class: 'flex items-center justify-between px-4 py-3.5 border-b border-border/60' }, [
              h('div', { class: 'flex items-center gap-2.5' }, [
                h('div', { class: 'w-7 h-7 rounded-2xl flex items-center justify-center', style: 'background: #06b6d420' }, [
                  h(CalendarDays, { class: 'w-3.5 h-3.5', style: 'color: #06b6d4' }),
                ]),
                h('span', { class: 'text-sm font-bold' }, 'Upcoming'),
              ]),
              h('button', {
                class: 'w-7 h-7 rounded-xl flex items-center justify-center hover:bg-muted/60 text-muted-foreground transition-all hover:scale-110 active:scale-90',
                onClick: () => { upcomingOpen.value = false },
              }, [h(X, { class: 'w-3.5 h-3.5' })]),
            ]),
            props.upcomingItems.length === 0
              ? h('div', { class: 'px-4 py-8 text-center' }, [h('p', { class: 'text-xs text-muted-foreground' }, 'Nothing coming up')])
              : h('div', { class: 'py-2 max-h-72 overflow-y-auto' },
                  props.upcomingItems.map(item =>
                    h('div', { key: item.id, class: 'flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors' }, [
                      h('div', { class: 'w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0', style: `background: ${item.color}18` }, [
                        h(item.icon, { class: 'w-4 h-4', style: `color: ${item.color}` }),
                      ]),
                      h('div', { class: 'flex-1 min-w-0' }, [
                        h('p', { class: 'text-xs font-semibold text-foreground truncate' }, item.label),
                        h('p', { class: 'text-[10px] text-muted-foreground truncate' }, item.sub),
                      ]),
                    ])
                  )
                ),
            h('div', { class: 'border-t border-border/60' }, [
              h('button', {
                class: 'w-full text-xs font-semibold py-3 hover:bg-muted/40 transition-colors text-center',
                style: 'color: #06b6d4',
                onClick: () => { navigateTo('/calendar'); upcomingOpen.value = false },
              }, 'Open Calendar →'),
            ]),
          ]) : null,
        ]),

        // Theme toggle
        h('button', {
          class: 'flex flex-col items-center gap-1 w-full px-1 group',
          onClick: () => {
            const next = props.currentTheme === 'light' ? 'dark' : props.currentTheme === 'dark' ? 'system' : 'light'
            emit('set-theme', next)
          },
        }, [
          h('div', { class: `${props.isMobile ? 'w-[72px] h-12' : 'w-14 h-9'} rounded-[18px] flex items-center justify-center hover:bg-muted/60 transition-all duration-200 hover:scale-105 active:scale-90` }, [
            h(props.currentTheme === 'dark' ? Moon : props.currentTheme === 'light' ? Sun : Monitor, { class: `${props.isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-muted-foreground` }),
          ]),
          h('span', { class: `${props.isMobile ? 'text-[11px]' : 'text-[10px]'} text-muted-foreground font-semibold leading-none` },
            props.currentTheme === 'dark' ? 'Dark' : props.currentTheme === 'light' ? 'Light' : 'Auto'),
        ]),

        // Settings shortcut
        h('div', { class: 'flex flex-col items-center gap-1 w-full px-1' }, [
          h('button', {
            class: `${props.isMobile ? 'w-[72px] h-12' : 'w-14 h-9'} rounded-[18px] flex items-center justify-center transition-all duration-300 hover:bg-muted/60 hover:scale-105 active:scale-90`,
            style: isActive('/settings') ? 'background: #64748b28; transform: scale(1.05)' : '',
            title: 'Settings',
            onClick: () => { navigateTo('/settings'); emit('navigate') },
          }, [
            h(SettingsIcon, {
              class: `${props.isMobile ? 'w-5 h-5' : 'w-4 h-4'} transition-colors`,
              style: isActive('/settings') ? 'color: #64748b' : 'color: hsl(var(--muted-foreground))',
            }),
          ]),
          h('span', {
            class: `${props.isMobile ? 'text-[11px]' : 'text-[10px]'} font-semibold leading-none`,
            style: isActive('/settings') ? 'color: #64748b' : 'color: hsl(var(--muted-foreground))',
          }, 'Settings'),
        ]),

        // User avatar
        h('button', {
          class: 'flex flex-col items-center gap-1 w-full px-1 group mt-1',
          onClick: () => navigateTo('/settings'),
          title: 'Account & Settings',
        }, [
          h('div', {
            class: `${props.isMobile ? 'w-12 h-12' : 'w-9 h-9'} rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300 group-hover:scale-110 group-active:scale-90`,
            style: 'background: linear-gradient(135deg, #6366f1, #8b5cf6)',
          }, [
            h('span', { class: `${props.isMobile ? 'text-sm' : 'text-xs'} font-bold` }, props.userInitials),
          ]),
        ]),
      ]),
    ])
  },
})

// ── Drawer Component ──────────────────────────────────────────────
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

    const navLinkClass = 'flex items-center gap-3 rounded-[20px] px-3 py-2.5 text-sm font-semibold transition-all duration-200 text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:scale-[1.01] active:scale-[0.98]'
    const activeClass  = '!bg-primary/10 !text-primary'

    const quickItems = [
      { type: 'ticket',    label: 'New Ticket',     icon: TicketPlus,   color: '#f59e0b', path: '/bookings',   kbd: '⌘T' },
      { type: 'housecall', label: 'House Call',      icon: MapPin,       color: '#10b981', path: '/bookings',  kbd: '⌘H' },
      { type: 'customer',  label: 'New Customer',    icon: UserPlus,     color: '#3b82f6', path: '/customers', kbd: '⌘U' },
      { type: 'register',  label: 'Open Register',   icon: ShoppingCart, color: '#ec4899', path: '/pos',       kbd: '⌘R' },
      { type: 'invoice',   label: 'New Invoice',     icon: Tag,          color: '#10b981', path: '/forms',     kbd: '⌘I' },
      { type: 'scan',      label: 'Scan Barcode',    icon: Barcode,      color: '#06b6d4', path: '/barcodes',  kbd: '⌘B' },
    ]

    return () => {

      if (props.drawer === 'more') {
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const { appointments, tickets, customers } = storeToRefs(useAppStore())

        // Build rich upcoming appointments list
        const upcomingAppts = (appointments.value || [])
          .filter((a: any) => a.status === 'scheduled' && a.date >= todayStr)
          .sort((a: any, b: any) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
          .slice(0, 6)

        // Build open tickets list
        const openTickets = (tickets.value || [])
          .filter((t: any) => t.status === 'Open' || t.status === 'In Progress')
          .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
          .slice(0, 4)

        function getCustomerName(customerId: any) {
          const c = (customers.value || []).find((c: any) => c.id == customerId)
          return c?.name || 'Unknown'
        }

        function apptTime(date: string, time: string) {
          try {
            const d = new Date(`${date}T${time || '00:00'}`)
            const isToday = date === todayStr
            const isTomorrow = date === new Date(now.getTime() + 86400000).toISOString().split('T')[0]
            const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
            const timeLabel = time ? ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
            return dayLabel + timeLabel
          } catch { return date }
        }

        function minutesUntil(date: string, time: string) {
          try {
            const d = new Date(`${date}T${time || '00:00'}`)
            return Math.round((d.getTime() - now.getTime()) / 60000)
          } catch { return Infinity }
        }

        function urgencyStyle(mins: number) {
          if (mins < 30)  return { dot: '#ef4444', label: mins <= 0 ? 'Now' : `${mins}m`,  bg: '#ef444415' }
          if (mins < 120) return { dot: '#f59e0b', label: `${mins}m`,  bg: '#f59e0b12' }
          if (mins < 1440) return { dot: '#06b6d4', label: `${Math.round(mins/60)}h`, bg: '#06b6d410' }
          return { dot: '#8b5cf6', label: `${Math.round(mins/1440)}d`, bg: '#8b5cf610' }
        }

        function ticketStatusColor(status: string) {
          return ({ 'Open': '#6366f1', 'In Progress': '#f59e0b', 'Waiting for Parts': '#ef4444', 'Completed': '#10b981' } as any)[status] || '#64748b'
        }

        const hasUpcoming = upcomingAppts.length > 0 || openTickets.length > 0

        return h('div', { class: 'flex flex-col h-full overflow-hidden' }, [

          // ── Header
          h('div', { class: 'flex items-center justify-between px-4 py-4 border-b border-border/60 flex-shrink-0' }, [
            h('div', { class: 'flex items-center gap-2.5' }, [
              h('div', { class: 'w-8 h-8 rounded-[18px] flex items-center justify-center', style: 'background: linear-gradient(135deg, #6366f1, #8b5cf6)' }, [
                h(CalendarDays, { class: 'w-4 h-4 text-white' }),
              ]),
              h('h2', { class: 'text-sm font-bold' }, 'More'),
            ]),
            h('button', {
              class: 'w-8 h-8 rounded-[16px] flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90 text-muted-foreground',
              onClick: () => emit('close'),
            }, [h(X, { class: 'w-4 h-4' })]),
          ]),

          // ── Scrollable body
          h('div', { class: 'flex-1 overflow-y-auto' }, [

            // ── Upcoming Appointments section
            h('div', { class: 'px-3 pt-3 pb-1' }, [
              h('div', { class: 'flex items-center justify-between mb-2 px-1' }, [
                h('p', { class: 'text-[10px] font-black uppercase tracking-widest text-muted-foreground' }, 'Upcoming'),
                h('button', {
                  class: 'text-[10px] font-bold px-2.5 py-1 rounded-full transition-all hover:scale-105',
                  style: 'color: #06b6d4; background: #06b6d412',
                  onClick: () => { navigateTo('/calendar'); emit('navigate') },
                }, 'Calendar →'),
              ]),

              upcomingAppts.length === 0
                ? h('div', { class: 'flex items-center gap-3 px-3 py-4 rounded-[18px] text-muted-foreground', style: 'background: hsl(var(--muted)/0.3)' }, [
                    h(CalendarDays, { class: 'w-4 h-4 opacity-40' }),
                    h('p', { class: 'text-xs font-medium' }, 'No appointments scheduled'),
                  ])
                : h('div', { class: 'space-y-1.5' },
                    upcomingAppts.map((a: any) => {
                      const mins = minutesUntil(a.date, a.time)
                      const urg = urgencyStyle(mins)
                      return h('div', {
                        key: a.id,
                        class: 'flex items-start gap-3 px-3 py-3 rounded-[18px] cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] group',
                        style: `background: ${urg.bg}; outline: 1.5px solid ${urg.dot}20; outline-offset: 0`,
                        onClick: () => { navigateTo('/calendar'); emit('navigate') },
                      }, [
                        h('div', {
                          class: 'w-9 h-9 rounded-[14px] flex items-center justify-center flex-shrink-0',
                          style: `background: ${urg.dot}22`,
                        }, [
                          h(CalendarDays, { class: 'w-4 h-4', style: `color: ${urg.dot}` }),
                        ]),
                        h('div', { class: 'flex-1 min-w-0' }, [
                          h('p', { class: 'text-xs font-black truncate text-foreground' }, a.title || a.description || 'Appointment'),
                          h('p', { class: 'text-[10px] text-muted-foreground font-medium mt-0.5 truncate' }, getCustomerName(a.customerId)),
                          h('p', { class: 'text-[10px] font-semibold mt-0.5', style: `color: ${urg.dot}` }, apptTime(a.date, a.time)),
                        ]),
                        h('span', {
                          class: 'text-[9px] font-black px-2 py-1 rounded-full flex-shrink-0',
                          style: `background: ${urg.dot}20; color: ${urg.dot}`,
                        }, urg.label),
                      ])
                    })
                  ),
            ]),

            // ── Open Tickets section
            h('div', { class: 'px-3 pt-3 pb-1' }, [
              h('div', { class: 'flex items-center justify-between mb-2 px-1' }, [
                h('p', { class: 'text-[10px] font-black uppercase tracking-widest text-muted-foreground' }, 'Open Tickets'),
                h('button', {
                  class: 'text-[10px] font-bold px-2.5 py-1 rounded-full transition-all hover:scale-105',
                  style: 'color: #6366f1; background: #6366f112',
                  onClick: () => { navigateTo('/bookings'); emit('navigate') },
                }, 'Bookings →'),
              ]),

              openTickets.length === 0
                ? h('div', { class: 'flex items-center gap-3 px-3 py-4 rounded-[18px] text-muted-foreground', style: 'background: hsl(var(--muted)/0.3)' }, [
                    h(TicketCheck, { class: 'w-4 h-4 opacity-40' }),
                    h('p', { class: 'text-xs font-medium' }, 'No open tickets'),
                  ])
                : h('div', { class: 'space-y-1.5' },
                    openTickets.map((t: any) => {
                      const sc = ticketStatusColor(t.status)
                      return h('div', {
                        key: t.id,
                        class: 'flex items-start gap-3 px-3 py-3 rounded-[18px] cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98]',
                        style: `background: ${sc}10; outline: 1.5px solid ${sc}20; outline-offset: 0`,
                        onClick: () => { navigateTo('/bookings'); emit('navigate') },
                      }, [
                        h('div', {
                          class: 'w-9 h-9 rounded-[14px] flex items-center justify-center flex-shrink-0',
                          style: `background: ${sc}22`,
                        }, [
                          h(TicketCheck, { class: 'w-4 h-4', style: `color: ${sc}` }),
                        ]),
                        h('div', { class: 'flex-1 min-w-0' }, [
                          h('div', { class: 'flex items-center gap-1.5' }, [
                            h('span', { class: 'text-[10px] font-black', style: `color: ${sc}` }, `#${t.id}`),
                            h('p', { class: 'text-xs font-bold truncate text-foreground' }, `${t.device || ''} ${t.deviceModel || ''}`.trim() || 'Device'),
                          ]),
                          h('p', { class: 'text-[10px] text-muted-foreground font-medium mt-0.5 truncate' }, getCustomerName(t.customerId)),
                          t.issue ? h('p', { class: 'text-[10px] text-muted-foreground truncate mt-0.5' }, t.issue) : null,
                        ]),
                        h('span', {
                          class: 'text-[9px] font-black px-2 py-1 rounded-full flex-shrink-0',
                          style: `background: ${sc}20; color: ${sc}`,
                        }, t.status === 'In Progress' ? 'Active' : 'Open'),
                      ])
                    })
                  ),
            ]),

            // Spacer before Quick Add
            h('div', { class: 'mx-3 my-3 h-px', style: 'background: hsl(var(--border)/0.6)' }),

            // ── Quick Actions section
            h('div', { class: 'px-3 pb-3' }, [
              h('p', { class: 'text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-2' }, 'Quick Actions'),
              h('div', { class: 'space-y-1' },
                quickItems.map((item: any) =>
                  h('button', {
                    key: item.type,
                    class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-[16px] hover:bg-muted/60 transition-all text-left group hover:scale-[1.01] active:scale-[0.97]',
                    onClick: () => { navigateTo(item.path); emit('navigate') },
                  }, [
                    h('div', {
                      class: 'w-8 h-8 rounded-[14px] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110',
                      style: `background: ${item.color}20`,
                    }, [
                      h(item.icon, { class: 'w-4 h-4', style: `color: ${item.color}` }),
                    ]),
                    h('p', { class: 'text-sm font-semibold text-foreground flex-1' }, item.label),
                    h('kbd', {
                      class: 'text-[10px] text-muted-foreground/60 font-mono rounded-lg flex-shrink-0 px-2 py-1',
                      style: 'background: hsl(var(--muted)/0.6)',
                    }, item.kbd),
                  ])
                )
              ),
            ]),
          ]),
        ])
      }

      if (props.drawer === 'tools') {
        return h('div', { class: 'flex flex-col h-full' }, [
          h('div', { class: 'flex items-center justify-between px-4 py-4 border-b border-border/60 flex-shrink-0' }, [
            h('div', { class: 'flex items-center gap-2.5' }, [
              h('div', { class: 'w-8 h-8 rounded-[18px] flex items-center justify-center', style: 'background: #64748b22' }, [
                h(ChevronRight, { class: 'w-4 h-4', style: 'color: #64748b' }),
              ]),
              h('h2', { class: 'text-sm font-bold' }, 'Tools'),
            ]),
            h('button', {
              class: 'w-8 h-8 rounded-[16px] flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90 text-muted-foreground',
              onClick: () => emit('close'),
            }, [h(X, { class: 'w-4 h-4' })]),
          ]),
          h('nav', { class: 'flex-1 p-3 space-y-0.5 overflow-y-auto' },
            toolsNav.value.map(item =>
              h(NuxtLink, {
                key: item.path,
                to: item.path,
                class: navLinkClass,
                activeClass,
                onClick: () => emit('navigate'),
              }, () => [
                h('div', {
                  class: 'w-9 h-9 rounded-[18px] flex items-center justify-center flex-shrink-0',
                  style: `background: ${item.color}20`,
                }, [
                  h(item.icon, { class: 'w-4 h-4', style: `color: ${item.color}` }),
                ]),
                h('span', { class: 'flex-1 truncate' }, item.name),
                item.badge ? h('span', {
                  class: 'text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 border',
                  style: `background: ${item.badge.color}18; color: ${item.badge.color}; border-color: ${item.badge.color}35`,
                }, item.badge.label) : null,
              ])
            )
          ),
          h('div', { class: 'p-3 border-t border-border/60 flex-shrink-0 space-y-1' }, [
            h(NuxtLink, {
              to: '/settings',
              class: navLinkClass,
              activeClass,
              onClick: () => emit('navigate'),
            }, () => [
              h('div', { class: 'w-9 h-9 rounded-[18px] flex items-center justify-center flex-shrink-0', style: 'background: #64748b18' }, [
                h(SettingsIcon, { class: 'w-4 h-4', style: 'color: #64748b' }),
              ]),
              h('span', { class: 'flex-1 truncate' }, 'Settings'),
            ]),
            h('div', {
              class: 'mt-1 px-3 py-2.5 rounded-[20px] flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-all hover:scale-[1.01] active:scale-[0.97]',
              style: 'background: hsl(var(--muted)/0.3)',
              onClick: () => navigateTo('/settings'),
            }, [
              h('div', {
                class: 'w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0',
                style: 'background: linear-gradient(135deg, #6366f1, #8b5cf6)',
              }, [h('span', { class: 'text-xs font-bold' }, props.userEmail.substring(0,2).toUpperCase())]),
              h('div', { class: 'flex-1 min-w-0' }, [
                h('p', { class: 'text-xs font-bold truncate' }, props.userEmail),
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
/* ── Spring sidebar ───────────────────────────────────────────── */
.sidebar-enter-active { transition: transform 0.35s cubic-bezier(0.34,1.3,0.64,1); }
.sidebar-leave-active { transition: transform 0.18s ease-in; }
.sidebar-enter-from, .sidebar-leave-to { transform: translateX(-100%); }

/* ── Drawer spring ────────────────────────────────────────────── */
.drawer-enter-active { transition: transform 0.3s cubic-bezier(0.34,1.3,0.64,1), opacity 0.2s ease; }
.drawer-leave-active { transition: transform 0.15s ease-in, opacity 0.15s ease; }
.drawer-enter-from   { transform: translateX(-100%); opacity: 0; }
.drawer-leave-to     { transform: translateX(-100%); opacity: 0; }

/* ── Overlay ──────────────────────────────────────────────────── */
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to       { opacity: 0; }

/* ── Elastic progress bar ─────────────────────────────────────── */
@keyframes elasticBar {
  0%   { left: -35%; width: 35%; }
  40%  { left: 15%; width: 70%; }
  70%  { left: 65%; width: 40%; }
  100% { left: 110%; width: 35%; }
}
.m3-elastic-bar { animation: elasticBar 1.8s cubic-bezier(0.4,0,0.2,1) infinite; }

/* ── Page enter — smooth crossfade + gentle lift, no overshoot ── */
@keyframes pageEnter {
  0%   { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0);   opacity: 1; }
}
.m3-page-enter { animation: pageEnter 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }

/* ── Popout spring ────────────────────────────────────────────── */
@keyframes m3BounceIn {
  0%   { transform: scale(0.88) translateY(6px); opacity: 0; }
  65%  { transform: scale(1.04) translateY(-1px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}
</style>