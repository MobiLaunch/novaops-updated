<template>
  <div class="min-h-screen bg-background">

    <!-- ── Mobile Overlay ─────────────────────────────────────────── -->
    <Transition name="overlay">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-50 lg:hidden"
        @click="mobileMenuOpen = false"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
    </Transition>

    <!-- ── Mobile Sidebar ────────────────────────────────────────── -->
    <Transition name="sidebar">
      <aside
        v-show="mobileMenuOpen"
        class="fixed left-0 top-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col lg:hidden shadow-xl"
      >
        <SidebarContent :navigation="navigation" :user-initials="userInitials" :user-email="userEmail" :settings="settings" @close="mobileMenuOpen = false" @navigate="mobileMenuOpen = false" />
      </aside>
    </Transition>

    <!-- ── Desktop Sidebar ────────────────────────────────────────── -->
    <aside class="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border flex-col">
      <SidebarContent :navigation="navigation" :user-initials="userInitials" :user-email="userEmail" :settings="settings" />
    </aside>

    <!-- ── Main ───────────────────────────────────────────────────── -->
    <div class="lg:pl-64 flex flex-col min-h-screen">

      <!-- Mobile top bar — hamburger only, minimal height -->
      <header class="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 h-12 lg:hidden">
        <Button variant="ghost" size="icon" class="h-8 w-8 -ml-1" @click="mobileMenuOpen = true">
          <Menu class="h-4 w-4" />
        </Button>
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
        <slot v-else />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineComponent, h, resolveComponent } from 'vue'
import { useAppStore } from '~/stores/app'

import {
  LayoutDashboard,
  TicketCheck,
  Users,
  Package,
  CalendarDays,
  ShoppingCart,
  FileText,
  Settings as SettingsIcon,
  Menu,
  X,
  MapPin,
  ScanLine,
  Upload,
  Globe,
  Plus,
  Monitor,
  Moon,
  Sun,
  Download,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import NotificationsPanel from '~/components/NotificationsPanel.vue'
import SidebarWidget from '~/components/SidebarWidget.vue'
import { useScreenLock } from '~/composables/useScreenLock'

const appStore = useAppStore()
const settings = computed(() => appStore.settings ?? { businessName: '', email: '' })
const route = useRoute()

const mobileMenuOpen = ref(false)

const { checkLockStatus, setupActivityListeners, cleanup } = useScreenLock()

onMounted(() => {
  appStore.initializeData()
  checkLockStatus()
  setupActivityListeners()
})

onUnmounted(() => {
  cleanup()
})

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
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }
  return 'UN'
})

const navigation = [
  { name: 'Dashboard',   path: '/dashboard',        icon: LayoutDashboard, color: '#6366f1', badge: null },
  { name: 'Tickets',     path: '/tickets',           icon: TicketCheck,     color: '#f59e0b', badge: { label: 'New',    color: '#f59e0b' } },
  { name: 'House Calls', path: '/housecalls',        icon: MapPin,          color: '#10b981', badge: null },
  { name: 'Customers',   path: '/customers',         icon: Users,           color: '#3b82f6', badge: null },
  { name: 'Inventory',   path: '/inventory',         icon: Package,         color: '#8b5cf6', badge: null },
  { name: 'Calendar',    path: '/calendar',          icon: CalendarDays,    color: '#06b6d4', badge: null },
  { name: 'POS',         path: '/pos',               icon: ShoppingCart,    color: '#ec4899', badge: { label: 'Live',   color: '#10b981' } },
  { name: 'Reports',     path: '/reports',           icon: FileText,        color: '#f97316', badge: null },
  { name: 'Barcodes',    path: '/barcodes',          icon: ScanLine,        color: '#06b6d4', badge: null },
  { name: 'Import',      path: '/import',            icon: Upload,          color: '#8b5cf6', badge: null },
  { name: 'Forms',       path: '/forms',             icon: FileText,        color: '#10b981', badge: { label: 'New',    color: '#10b981' } },
  { name: 'Website',     path: '/website-settings',  icon: Globe,           color: '#f59e0b', badge: { label: 'Portal', color: '#f59e0b' } },
  { name: 'Settings',    path: '/settings',          icon: SettingsIcon,    color: '#64748b', badge: null },
]

const currentPageNav = computed(() => navigation.find(item => item.path === route.path))
const currentPageTitle = computed(() => currentPageNav.value?.name || 'Dashboard')

watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

// ── Shared helpers (passed into sidebar via closure) ──────────────
function quickAction(type: string) {
  const routes: Record<string, string> = {
    ticket: '/tickets', housecall: '/housecalls', customer: '/customers',
    register: '/pos', invoice: '/forms', scan: '/barcodes', import: '/import',
  }
  if (routes[type]) navigateTo(routes[type])
}

function exportData() {
  const data = { settings: appStore.settings, tickets: appStore.tickets, customers: appStore.customers, inventory: appStore.inventory }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `novaops-backup-${new Date().toISOString().split('T')[0]}.json`; a.click()
  URL.revokeObjectURL(url)
}

function applyTheme(theme: string) {
  if (typeof localStorage !== 'undefined') localStorage.setItem('theme', theme)
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else if (theme === 'light') root.classList.remove('dark')
  else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
}

function getStoredTheme(): string {
  return (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) || 'system'
}

// ── SidebarContent component (inline) ─────────────────────────────
const SidebarContent = defineComponent({
  name: 'SidebarContent',
  props: {
    navigation: { type: Array as () => typeof navigation, required: true },
    userInitials: { type: String, required: true },
    userEmail: { type: String, required: true },
    settings: { type: Object, required: true },
  },
  emits: ['close', 'navigate'],
  setup(props, { emit }) {
    const NuxtLink = resolveComponent('NuxtLink')
    const SidebarWidgetComp = SidebarWidget
    const NotificationsPanelComp = NotificationsPanel

    const primaryNav = computed(() => props.navigation.slice(0, 8))
    const secondaryNav = computed(() => props.navigation.slice(8, -1))
    const settingsNav = computed(() => props.navigation[props.navigation.length - 1])

    const quickAddOpen = ref(false)
    const themeMenuOpen = ref(false)
    const currentTheme = ref(getStoredTheme())

    const navLinkClass = 'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-100 text-muted-foreground hover:bg-muted/60 hover:text-foreground group'
    const activeClass = '!bg-primary/10 !text-primary'

    const quickItems = [
      { type: 'ticket',    label: 'New Ticket',    icon: TicketCheck,  color: '#f59e0b', kbd: '⌘T' },
      { type: 'housecall', label: 'House Call',     icon: MapPin,       color: '#10b981', kbd: '⌘H' },
      { type: 'customer',  label: 'New Customer',   icon: Users,        color: '#3b82f6', kbd: '⌘U' },
      { type: 'register',  label: 'Open Register',  icon: ShoppingCart, color: '#ec4899', kbd: '⌘R' },
      { type: 'invoice',   label: 'New Invoice',    icon: FileText,     color: '#10b981', kbd: '⌘I' },
      { type: 'scan',      label: 'Scan Barcode',   icon: ScanLine,     color: '#06b6d4', kbd: '⌘B' },
    ]

    const themeOptions = [
      { key: 'system', label: 'System', icon: Monitor },
      { key: 'dark',   label: 'Dark',   icon: Moon },
      { key: 'light',  label: 'Light',  icon: Sun },
    ]

    function doNavigate(path: string) {
      navigateTo(path)
      emit('navigate')
    }

    function doQuickAction(type: string) {
      quickAction(type)
      quickAddOpen.value = false
      emit('navigate')
    }

    function doSetTheme(theme: string) {
      currentTheme.value = theme
      applyTheme(theme)
      themeMenuOpen.value = false
    }

    // Close theme menu on outside click
    function onThemeClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-theme-menu]')) {
        themeMenuOpen.value = false
      }
    }
    onMounted(() => document.addEventListener('mousedown', onThemeClickOutside))
    onUnmounted(() => document.removeEventListener('mousedown', onThemeClickOutside))

    // Keyboard shortcuts
    function onKeydown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return
      const map: Record<string, () => void> = {
        't': () => doQuickAction('ticket'),
        'h': () => doQuickAction('housecall'),
        'u': () => doQuickAction('customer'),
        'r': () => doQuickAction('register'),
        'i': () => doQuickAction('invoice'),
        'b': () => doQuickAction('scan'),
        'd': () => doNavigate('/dashboard'),
        ',': () => doNavigate('/settings'),
      }
      const fn = map[e.key.toLowerCase()]
      if (fn) { e.preventDefault(); fn() }
    }
    onMounted(() => window.addEventListener('keydown', onKeydown))
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))

    return () => h('div', { class: 'flex flex-col h-full' }, [

      // ── Logo header ──
      h('div', { class: 'flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0' }, [
        h('img', { src: '/posicon.svg', alt: 'NovaOps', class: 'h-6 w-auto' }),
        h(Button, {
          variant: 'ghost', size: 'icon',
          class: 'h-7 w-7 lg:hidden',
          onClick: () => emit('close')
        }, () => h(X, { class: 'w-4 h-4' }))
      ]),

      // ── Quick Add ──
      h('div', { class: 'px-2 pt-2 pb-1 flex-shrink-0' }, [
        // Collapsible header
        h('button', {
          class: 'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground transition-colors',
          onClick: () => { quickAddOpen.value = !quickAddOpen.value }
        }, [
          h('span', {}, 'Quick Add'),
          h(Plus, {
            class: 'w-3 h-3 transition-transform duration-200',
            style: quickAddOpen.value ? 'transform: rotate(45deg)' : ''
          })
        ]),

        // 2-col grid of quick action tiles
        quickAddOpen.value
          ? h('div', { class: 'mt-2 grid grid-cols-2 gap-1.5' },
              quickItems.map(item =>
                h('button', {
                  key: item.type,
                  class: 'flex flex-col items-start gap-1 px-2.5 py-2 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/50 hover:border-border transition-all text-left',
                  onClick: () => doQuickAction(item.type)
                }, [
                  h('div', {
                    class: 'w-5 h-5 rounded-md flex items-center justify-center',
                    style: `background: ${item.color}18`
                  }, [
                    h(item.icon, { class: 'w-3 h-3', style: `color: ${item.color}` })
                  ]),
                  h('span', { class: 'text-[11px] font-medium text-foreground leading-tight' }, item.label),
                  h('span', { class: 'text-[9px] text-muted-foreground/40 font-mono' }, item.kbd),
                ])
              )
            )
          : null,
      ]),

      // ── Nav ──
      h('nav', { class: 'flex-1 overflow-y-auto px-2 py-2 space-y-0.5' }, [

        // Primary
        ...primaryNav.value.map(item =>
          h(NuxtLink, {
            key: item.path,
            to: item.path,
            class: navLinkClass,
            activeClass,
            onClick: () => emit('navigate')
          }, () => [
            h('div', {
              class: 'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
              style: `background: ${item.color}18`
            }, [h(item.icon, { class: 'h-3.5 w-3.5', style: `color: ${item.color}` })]),
            h('span', { class: 'flex-1 truncate' }, item.name),
            item.badge ? h('span', {
              class: 'text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
              style: `background: ${item.badge.color}20; color: ${item.badge.color}`
            }, item.badge.label) : null
          ])
        ),

        // Tools divider
        h('div', { class: 'pt-3 pb-1' }, [
          h('p', { class: 'text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-2.5' }, 'Tools')
        ]),

        // Secondary
        ...secondaryNav.value.map(item =>
          h(NuxtLink, {
            key: item.path,
            to: item.path,
            class: navLinkClass,
            activeClass,
            onClick: () => emit('navigate')
          }, () => [
            h('div', {
              class: 'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
              style: `background: ${item.color}18`
            }, [h(item.icon, { class: 'h-3.5 w-3.5', style: `color: ${item.color}` })]),
            h('span', { class: 'flex-1 truncate' }, item.name),
            item.badge ? h('span', {
              class: 'text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
              style: `background: ${item.badge.color}20; color: ${item.badge.color}`
            }, item.badge.label) : null
          ])
        ),

        h('div', { class: 'pt-3' }, [h(SidebarWidgetComp)])
      ]),

      // ── Bottom ──
      h('div', { class: 'flex-shrink-0 border-t border-border' }, [

        // Icon action row
        h('div', { class: 'flex items-center justify-between gap-1 px-3 pt-2.5 pb-1.5' }, [

          // Notifications
          h('div', {
            class: 'flex items-center justify-center w-8 h-8',
            title: 'Notifications'
          }, [h(NotificationsPanelComp)]),

          // Theme toggle with popover
          h('div', {
            class: 'relative flex items-center justify-center',
            'data-theme-menu': ''
          }, [
            h('button', {
              class: 'flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors',
              title: 'Change theme',
              onClick: () => { themeMenuOpen.value = !themeMenuOpen.value }
            }, [
              h(currentTheme.value === 'dark' ? Moon : currentTheme.value === 'light' ? Sun : Monitor, { class: 'h-4 w-4' })
            ]),
            themeMenuOpen.value ? h('div', {
              class: 'absolute bottom-9 left-0 z-50 bg-popover border border-border rounded-xl shadow-xl p-1.5 flex flex-col gap-0.5 min-w-[130px]',
            }, themeOptions.map(opt =>
              h('button', {
                key: opt.key,
                class: `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-muted/60 w-full text-left ${currentTheme.value === opt.key ? 'text-primary' : 'text-foreground'}`,
                onClick: () => doSetTheme(opt.key)
              }, [
                h(opt.icon, { class: 'w-3.5 h-3.5' }),
                opt.label,
                currentTheme.value === opt.key ? h('span', { class: 'ml-auto text-primary' }, '✓') : null
              ])
            )) : null
          ]),

          // Export
          h('button', {
            class: 'flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors',
            title: 'Export data',
            onClick: () => exportData()
          }, [h(Download, { class: 'h-4 w-4' })]),

          // Settings
          h(NuxtLink, {
            to: '/settings',
            onClick: () => emit('navigate')
          }, () => h('div', {
            class: 'flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors',
            title: 'Settings'
          }, [h(SettingsIcon, { class: 'h-4 w-4' })]))
        ]),

        // User row
        h('div', {
          class: 'flex items-center gap-2.5 mx-2 mb-3 px-2.5 py-2 rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/70 transition-colors',
          onClick: () => navigateTo('/settings')
        }, [
          h('div', {
            class: 'w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm shadow-primary/20'
          }, [h('span', { class: 'text-xs font-bold' }, props.userInitials)]),
          h('div', { class: 'flex-1 min-w-0' }, [
            h('p', { class: 'text-xs font-semibold truncate' }, props.userEmail),
            h('p', { class: 'text-[10px] text-muted-foreground truncate' }, props.settings.businessName || 'NovaOps')
          ])
        ])
      ])
    ])
  }
})
</script>

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>


