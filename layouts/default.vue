<template>
  <div class="min-h-screen bg-surface-low flex">

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
        <div class="w-[76px] h-full bg-card border-r border-border/60 flex flex-col items-center py-3 gap-1 flex-shrink-0">
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
        <Transition name="drawer">
          <div
            v-if="activeDrawer"
            class="w-64 h-full bg-card border-r border-border/60 flex flex-col"
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
    <aside class="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-[76px] bg-card border-r border-border/60 flex-col items-center py-3 gap-1">
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
        class="hidden lg:flex fixed left-[76px] top-0 z-30 h-screen w-64 bg-card border-r border-border/60 flex-col shadow-xl"
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
      class="flex flex-col min-h-screen w-full transition-[padding-left] duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
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
      <main class="flex-1 p-4 sm:p-6">
        <div v-if="appStore.isLoading" class="flex items-center justify-center py-32">
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
  FileText, Settings as SettingsIcon, Menu, X, MapPin, Wrench, ScanLine, Upload,
  Globe, Plus, Monitor, Moon, Sun, Download, ChevronRight,
  TicketPlus, UserPlus, Tag, Barcode, Clock, AlertCircle,
} from 'lucide-vue-next'
import { useScreenLock } from '~/composables/useScreenLock'

const appStore = useAppStore()
const { tickets, appointments } = storeToRefs(appStore)
const settings = computed(() => appStore.settings ?? { businessName: '', email: '' })
const route = useRoute()

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
  appStore.setupAuthListener()
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
  { name: 'Services',    path: '/services',          icon: Wrench,          color: '#10b981', badge: null,                         group: 'core' },
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
    't': '/tickets', 'h': '/housecalls', 'u': '/customers',
    'r': '/pos', 'i': '/forms', 'b': '/barcodes',
    'd': '/dashboard', ',': '/settings',
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
      return h(NuxtLink, {
        key: item.path,
        to: item.path,
        class: 'flex flex-col items-center gap-1 w-full px-1 group',
        style: 'text-decoration: none',
        onClick: () => emit('navigate'),
      }, () => [
        h('div', {
          class: [
            'w-14 h-9 rounded-[18px] flex items-center justify-center transition-all duration-300 relative',
            active ? 'shadow-md' : 'hover:bg-muted/60',
          ].join(' '),
          style: active
            ? `background: ${item.color}28; transform: scale(1.05)`
            : '',
        }, [
          h(item.icon, {
            class: 'w-5 h-5 transition-all duration-200',
            style: active ? `color: ${item.color}` : 'color: hsl(var(--muted-foreground))',
          }),
          item.badge ? h('span', {
            class: 'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
            style: `background: ${item.badge.color}`,
          }) : null,
        ]),
        h('span', {
          class: 'text-[10px] font-semibold leading-none transition-all duration-200',
          style: active ? `color: ${item.color}` : 'color: hsl(var(--muted-foreground))',
        }, item.name),
      ])
    }

    return () => h('div', { class: 'flex flex-col items-center h-full w-full gap-0' }, [

      // Logo
      h('div', { class: 'flex flex-col items-center pb-3 pt-1 flex-shrink-0' }, [
        h('div', {
          class: 'w-11 h-11 rounded-[22px] flex items-center justify-center shadow-lg flex-shrink-0',
          style: 'background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        }, [
          h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 16 16', fill: 'white', style: 'width:22px;height:22px' }, [
            h('path', {
              d: 'M13.5 2.5a.5.5 0 0 0-.707 0L11.5 3.793l-.647-.646a.5.5 0 0 0-.707.707L11 4.707 9.146 6.561A4 4 0 0 0 4 11.5a.5.5 0 0 0 .854.354l1.292-1.293a.5.5 0 0 1 .708 0l.585.585a.5.5 0 0 1 0 .708L6.146 13.146A.5.5 0 0 0 6.5 14a4 4 0 0 0 4.939-4.146L13.5 7.707l.293.293a.5.5 0 0 0 .707-.707l-.646-.647 1.293-1.293a.5.5 0 0 0 0-.707L13.5 2.5Z',
              'fill-rule': 'evenodd', 'clip-rule': 'evenodd',
            }),
          ]),
        ]),
      ]),

      // Quick Add button — vibrant tertiary FAB style
      h('div', { class: 'flex flex-col items-center w-full px-2 pb-3 flex-shrink-0' }, [
        h('button', {
          class: 'w-14 h-9 rounded-[18px] flex items-center justify-center transition-all duration-300 active:scale-[0.92]',
          style: props.activeDrawer === 'quickadd'
            ? 'background: #a855f728; transform: scale(1.06)'
            : 'background: linear-gradient(135deg, #a855f7, #7c3aed); box-shadow: 0 4px 12px #a855f740',
          title: 'Quick Add',
          onClick: () => emit('set-drawer', 'quickadd'),
        }, [
          h(Plus, {
            class: 'w-5 h-5 text-white transition-transform duration-300',
            style: props.activeDrawer === 'quickadd' ? 'transform: rotate(45deg)' : '',
          }),
        ]),
        h('span', {
          class: 'text-[10px] font-semibold leading-none mt-1',
          style: props.activeDrawer === 'quickadd' ? 'color: #a855f7' : 'color: hsl(var(--muted-foreground))',
        }, 'Add'),
      ]),

      // Core nav
      h('nav', { class: 'flex-1 flex flex-col items-center w-full gap-0.5 overflow-y-auto overflow-x-hidden py-1' }, [
        ...coreNav.value.map(item => railItem(item)),
        h('div', { class: 'w-8 h-px my-2 flex-shrink-0', style: 'background: hsl(var(--border)/0.6)' }),
        h('button', {
          class: 'flex flex-col items-center gap-1 w-full px-1 group',
          onClick: () => emit('set-drawer', 'tools'),
        }, [
          h('div', {
            class: 'w-14 h-9 rounded-[18px] flex items-center justify-center transition-all duration-300',
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
            class: 'text-[10px] font-semibold leading-none',
            style: props.activeDrawer === 'tools' ? 'color: #64748b' : 'color: hsl(var(--muted-foreground))',
          }, 'Tools'),
        ]),
      ]),

      // Bottom utilities
      h('div', { class: 'flex flex-col items-center gap-0.5 pt-2 border-t border-border/60 w-full flex-shrink-0 pb-1' }, [

        // Upcoming
        h('div', { class: 'flex flex-col items-center gap-1 w-full px-1 relative', 'data-upcoming': '' }, [
          h('button', {
            class: 'w-14 h-9 rounded-[18px] flex items-center justify-center transition-all duration-300 relative',
            style: upcomingOpen.value ? 'background: #06b6d428; transform: scale(1.05)' : '',
            onClick: () => { upcomingOpen.value = !upcomingOpen.value },
          }, [
            h(CalendarDays, { class: 'w-4 h-4 transition-colors', style: upcomingOpen.value ? 'color: #06b6d4' : 'color: hsl(var(--muted-foreground))' }),
            props.upcomingItems.length > 0
              ? h('span', {
                  class: 'absolute -top-0.5 -right-1 min-w-[15px] h-[15px] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5 border-2 border-card',
                  style: 'background: #06b6d4',
                }, String(props.upcomingItems.length))
              : null,
          ]),
          h('span', { class: 'text-[10px] font-semibold leading-none', style: upcomingOpen.value ? 'color: #06b6d4' : 'color: hsl(var(--muted-foreground))' }, 'Soon'),

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
            const next = props.currentTheme === 'system' ? 'dark' : props.currentTheme === 'dark' ? 'light' : 'system'
            emit('set-theme', next)
          },
        }, [
          h('div', { class: 'w-14 h-9 rounded-[18px] flex items-center justify-center hover:bg-muted/60 transition-all duration-200 hover:scale-105 active:scale-90' }, [
            h(props.currentTheme === 'dark' ? Moon : props.currentTheme === 'light' ? Sun : Monitor, { class: 'w-4 h-4 text-muted-foreground' }),
          ]),
          h('span', { class: 'text-[10px] text-muted-foreground font-semibold leading-none' },
            props.currentTheme === 'dark' ? 'Dark' : props.currentTheme === 'light' ? 'Light' : 'Auto'),
        ]),

        // User avatar
        h('button', {
          class: 'flex flex-col items-center gap-1 w-full px-1 group mt-1',
          onClick: () => navigateTo('/settings'),
          title: 'Account & Settings',
        }, [
          h('div', {
            class: 'w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300 group-hover:scale-110 group-active:scale-90',
            style: 'background: linear-gradient(135deg, #6366f1, #8b5cf6)',
          }, [
            h('span', { class: 'text-xs font-bold' }, props.userInitials),
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
      { type: 'ticket',    label: 'New Ticket',     icon: TicketPlus,   color: '#f59e0b', path: '/tickets',   kbd: '⌘T' },
      { type: 'housecall', label: 'House Call',      icon: MapPin,       color: '#10b981', path: '/housecalls',kbd: '⌘H' },
      { type: 'customer',  label: 'New Customer',    icon: UserPlus,     color: '#3b82f6', path: '/customers', kbd: '⌘U' },
      { type: 'register',  label: 'Open Register',   icon: ShoppingCart, color: '#ec4899', path: '/pos',       kbd: '⌘R' },
      { type: 'invoice',   label: 'New Invoice',     icon: Tag,          color: '#10b981', path: '/forms',     kbd: '⌘I' },
      { type: 'scan',      label: 'Scan Barcode',    icon: Barcode,      color: '#06b6d4', path: '/barcodes',  kbd: '⌘B' },
    ]

    return () => {

      if (props.drawer === 'quickadd') {
        return h('div', { class: 'flex flex-col h-full' }, [
          h('div', { class: 'flex items-center justify-between px-4 py-4 border-b border-border/60 flex-shrink-0' }, [
            h('div', { class: 'flex items-center gap-2.5' }, [
              h('div', { class: 'w-8 h-8 rounded-[18px] flex items-center justify-center', style: 'background: linear-gradient(135deg, #a855f7, #7c3aed)' }, [
                h(Plus, { class: 'w-4 h-4 text-white' }),
              ]),
              h('h2', { class: 'text-sm font-bold' }, 'Quick Add'),
            ]),
            h('button', {
              class: 'w-8 h-8 rounded-[16px] flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90 text-muted-foreground',
              onClick: () => emit('close'),
            }, [h(X, { class: 'w-4 h-4' })]),
          ]),
          h('div', { class: 'flex-1 p-3 space-y-1 overflow-y-auto' },
            quickItems.map(item =>
              h('button', {
                key: item.type,
                class: 'w-full flex items-center gap-3 px-3 py-3 rounded-[20px] hover:bg-muted/60 transition-all text-left group hover:scale-[1.01] active:scale-[0.97]',
                onClick: () => { navigateTo(item.path); emit('navigate') },
              }, [
                h('div', {
                  class: 'w-10 h-10 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-active:scale-90',
                  style: `background: ${item.color}22`,
                }, [
                  h(item.icon, { class: 'w-5 h-5', style: `color: ${item.color}` }),
                ]),
                h('div', { class: 'flex-1 min-w-0' }, [
                  h('p', { class: 'text-sm font-semibold text-foreground' }, item.label),
                ]),
                h('kbd', {
                  class: 'text-[10px] text-muted-foreground/60 font-mono rounded-lg flex-shrink-0 px-2 py-1',
                  style: 'background: hsl(var(--muted)/0.6)',
                }, item.kbd),
              ])
            )
          ),
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

/* ── Page enter spring ────────────────────────────────────────── */
@keyframes pageEnter {
  0%  { transform: translateY(16px); opacity: 0; }
  65% { transform: translateY(-3px); opacity: 1; }
  100%{ transform: translateY(0); }
}
.m3-page-enter { animation: pageEnter 0.42s cubic-bezier(0.34,1.3,0.64,1) both; }

/* ── Popout spring ────────────────────────────────────────────── */
@keyframes m3BounceIn {
  0%   { transform: scale(0.88) translateY(6px); opacity: 0; }
  65%  { transform: scale(1.04) translateY(-1px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}
</style>