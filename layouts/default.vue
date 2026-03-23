<template>
  <div :class="{ 'electron-app': isElectron }" class="nova-mesh-bg" style="min-height:100vh;position:relative;">

    <!-- ── Mobile overlay ────────────────────────────────────────── -->
    <Transition name="overlay">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 lg:hidden" @click="mobileMenuOpen = false">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
    </Transition>

    <!-- ── Mobile drawer sidebar ─────────────────────────────────── -->
    <Transition name="mobile-slide">
      <aside v-if="mobileMenuOpen" class="fixed inset-y-0 left-0 z-50 flex lg:hidden" style="width:300px">
        <div class="w-full h-full mac-sidebar flex flex-col shadow-2xl">
          <MobileNav
            :navigation="navigation"
            :user-initials="userInitials"
            :user-email="userEmail"
            :settings="settings"
            :current-theme="currentTheme"
            @navigate="mobileMenuOpen = false"
            @set-theme="handleSetTheme"
            @export="handleExport"
          />
        </div>
      </aside>
    </Transition>

    <!-- ── Slide-up Panel (drawer from dock) ─────────────────────── -->
    <Transition name="panel-up">
      <div
        v-if="activePanel && !mobileMenuOpen"
        class="fixed z-40 hidden lg:flex"
        :style="panelStyle"
      >
        <div class="mac-glass rounded-2xl shadow-2xl overflow-hidden flex flex-col" style="width:300px;max-height:520px;">
          <DrawerContent
            :drawer="activePanel"
            :navigation="navigation"
            :user-email="userEmail"
            :settings="settings"
            @navigate="activePanel = null"
            @close="activePanel = null"
          />
        </div>
      </div>
    </Transition>

    <!-- click-outside to close panel -->
    <Transition name="overlay">
      <div
        v-if="activePanel && !mobileMenuOpen"
        class="fixed inset-0 z-30 hidden lg:block"
        @click="activePanel = null"
      />
    </Transition>

    <!-- ── Main content ───────────────────────────────────────────── -->
    <div class="flex flex-col min-h-screen" :style="mainPaddingStyle">

      <!-- Mobile top bar -->
      <header class="sticky top-0 z-30 flex items-center gap-3 lg:hidden mac-glass border-b border-white/20 px-4" style="height:52px">
        <button
          class="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-black/5 transition-all active:scale-90"
          @click="mobileMenuOpen = true"
        >
          <Menu class="h-5 w-5 text-foreground" />
        </button>
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <div v-if="currentPageNav" class="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" :style="`background: ${currentPageNav.color}22`">
            <component :is="currentPageNav.icon" class="w-4 h-4" :style="`color: ${currentPageNav.color}`" />
          </div>
          <span class="text-sm font-bold tracking-tight truncate">{{ currentPageTitle }}</span>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-6 pb-28 lg:pb-8">
        <div v-if="appStore.isLoading && !noLoadingGate" class="flex items-center justify-center py-32">
          <div class="flex flex-col items-center gap-4">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center" style="background:linear-gradient(135deg,#5b5ef4,#8b5cf6)">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <div class="w-48 h-1.5 rounded-full overflow-hidden relative" style="background:hsl(var(--muted))">
              <div class="absolute top-0 h-full rounded-full m3-elastic-bar" style="background:linear-gradient(90deg,#5b5ef4,#8b5cf6)" />
            </div>
            <p class="text-xs text-muted-foreground font-semibold tracking-wide">Loading your workspace…</p>
          </div>
        </div>
        <div v-else class="m3-page-enter"><slot /></div>
      </main>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         macOS DOCK  —  bottom-anchored, floating glass pill
         ═════════════════════════════════════════════════════════ -->
    <div
      ref="dockWrapRef"
      class="dock-wrap hidden lg:flex"
      @mousemove="onDockMouseMove"
      @mouseleave="onDockMouseLeave"
    >
      <div class="dock-pill mac-glass">

        <!-- Brand logo (non-nav) -->
        <div class="dock-brand">
          <div class="dock-brand-inner">
            <span>N</span>
          </div>
          <div class="dock-brand-dot" />
        </div>

        <div class="dock-divider" />

        <!-- Core nav items -->
        <template v-for="(item, idx) in coreNav" :key="item.path">
          <DockItem
            :item="item"
            :scale="dockScales[idx]"
            :is-active="currentPath === item.path"
            :is-bouncing="bouncingItem === item.path"
            @click="handleNavClick(item)"
          />
        </template>

        <div class="dock-divider" />

        <!-- Quick Add FAB -->
        <div
          class="dock-item-wrap"
          :style="{ '--s': dockScales[coreNav.length] }"
          @click="togglePanel('quick')"
        >
          <div class="dock-tooltip">Quick Actions</div>
          <div
            class="dock-icon dock-fab"
            :class="{ 'dock-fab-open': activePanel === 'quick' }"
          >
            <Plus class="dock-icon-svg" :style="activePanel === 'quick' ? 'transform:rotate(45deg)' : ''" />
          </div>
          <div class="dock-dot" style="background: #ec4899; opacity: 1" />
        </div>

        <!-- Tools -->
        <div
          class="dock-item-wrap"
          :style="{ '--s': dockScales[coreNav.length + 1] }"
          @click="togglePanel('tools')"
        >
          <div class="dock-tooltip">Tools</div>
          <div class="dock-icon dock-icon-muted" :class="{ 'dock-icon-active-tools': activePanel === 'tools' }">
            <Grid3x3 class="dock-icon-svg" />
          </div>
          <div v-if="activePanel === 'tools'" class="dock-dot" style="background:#64748b;opacity:1" />
        </div>

        <div class="dock-divider" />

        <!-- Theme toggle -->
        <div
          class="dock-item-wrap"
          :style="{ '--s': dockScales[coreNav.length + 2] }"
          @click="cycleTheme"
        >
          <div class="dock-tooltip">{{ themeLabel }}</div>
          <div class="dock-icon dock-icon-muted">
            <component :is="themeIcon" class="dock-icon-svg" />
          </div>
        </div>

        <!-- Settings -->
        <div
          class="dock-item-wrap"
          :style="{ '--s': dockScales[coreNav.length + 3] }"
          @click="handleNavClick({ path: '/settings', color: '#64748b' })"
        >
          <div class="dock-tooltip">Settings</div>
          <div class="dock-icon dock-icon-muted" :class="{ 'dock-icon-active-settings': currentPath === '/settings' }">
            <Settings class="dock-icon-svg" />
          </div>
          <div v-if="currentPath === '/settings'" class="dock-dot" style="background:#64748b" />
        </div>

        <!-- Avatar -->
        <div
          class="dock-item-wrap"
          :style="{ '--s': dockScales[coreNav.length + 4] }"
          @click="navigateTo('/settings')"
        >
          <div class="dock-tooltip">{{ userEmail || 'Account' }}</div>
          <div class="dock-avatar">{{ userInitials }}</div>
        </div>

      </div>
    </div>
    <!-- end dock -->

  </div>
</template>

<script setup lang="ts">
import {
  ref, computed, watch, onMounted, onUnmounted, defineComponent, h, resolveComponent,
} from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import {
  LayoutDashboard, TicketCheck, Users, Package, CalendarDays, ShoppingCart,
  ClipboardList, FileText, Settings, Menu, X, MapPin,
  ScanLine, Upload, Plus, Monitor, Moon, Sun,
  TicketPlus, UserPlus, Tag, Barcode,
  MessageCircle, Tv, BarChart3, ArrowLeftRight, Grid3x3,
  ChevronRight,
} from 'lucide-vue-next'
import { useScreenLock } from '~/composables/useScreenLock'

const appStore = useAppStore()
const { tickets, appointments } = storeToRefs(appStore)
const settings = computed(() => appStore.settings ?? { businessName: '', email: '' })
const route = useRoute()
const currentPath = computed(() => route.path)

// ── Loading gate ────────────────────────────────────────────────
const NO_LOADING_GATE = ['/settings','/barcodes','/tradein','/forms','/import','/display','/analytics','/messages']
const noLoadingGate = computed(() => NO_LOADING_GATE.includes(route.path))

// ── Screen lock ─────────────────────────────────────────────────
const { checkLockStatus, setupActivityListeners, cleanup } = useScreenLock()

const isElectron = ref(false)
const mobileMenuOpen = ref(false)
const activePanel = ref<string | null>(null)
const currentTheme = ref('light')

onMounted(() => {
  isElectron.value = !!(window as any).electronAPI?.isElectron
  appStore.setupAuthListener()
  checkLockStatus()
  setupActivityListeners()
  currentTheme.value = localStorage.getItem('theme') || 'light'
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => { cleanup(); window.removeEventListener('keydown', onKeydown) })

// ── User ────────────────────────────────────────────────────────
const userEmail = computed(() => appStore.user?.email || settings.value.email || '')
const userInitials = computed(() => {
  const e = userEmail.value
  if (e) {
    const p = e.split('@')[0].split('.')
    return (p.length >= 2 ? p[0][0] + p[1][0] : e.substring(0,2)).toUpperCase()
  }
  return 'UN'
})

// ── Navigation ──────────────────────────────────────────────────
const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: '#5b5ef4', badge: null,                                group: 'core' },
  { name: 'Bookings',  path: '/bookings',  icon: ClipboardList,   color: '#5b5ef4', badge: { label:'New', color:'#f59e0b' },   group: 'core' },
  { name: 'Customers', path: '/customers', icon: Users,           color: '#3b82f6', badge: null,                                group: 'core' },
  { name: 'Inventory', path: '/inventory', icon: Package,         color: '#8b5cf6', badge: null,                                group: 'core' },
  { name: 'Calendar',  path: '/calendar',  icon: CalendarDays,    color: '#06b6d4', badge: null,                                group: 'core' },
  { name: 'POS',       path: '/pos',       icon: ShoppingCart,    color: '#ec4899', badge: { label:'Live', color:'#10b981' },  group: 'core' },
  { name: 'Trade-In',  path: '/tradein',   icon: ArrowLeftRight,  color: '#f59e0b', badge: null,                                group: 'core' },
  { name: 'Analytics', path: '/analytics', icon: BarChart3,       color: '#10b981', badge: null,                                group: 'tools' },
  { name: 'Messages',  path: '/messages',  icon: MessageCircle,   color: '#ec4899', badge: null,                                group: 'tools' },
  { name: 'Display',   path: '/display',   icon: Tv,              color: '#06b6d4', badge: null,                                group: 'tools' },
  { name: 'Barcodes',  path: '/barcodes',  icon: ScanLine,        color: '#06b6d4', badge: null,                                group: 'tools' },
  { name: 'Import',    path: '/import',    icon: Upload,          color: '#8b5cf6', badge: null,                                group: 'tools' },
  { name: 'Forms',     path: '/forms',     icon: FileText,        color: '#10b981', badge: null,                                group: 'tools' },
]
const coreNav = computed(() => navigation.filter(n => n.group === 'core'))

const currentPageNav = computed(() => navigation.find(i => i.path === route.path))
const currentPageTitle = computed(() => currentPageNav.value?.name || 'NovaOps')

watch(() => route.path, () => { mobileMenuOpen.value = false })

// ── Theme ───────────────────────────────────────────────────────
const themeLabel = computed(() => ({ light: 'Light Mode', dark: 'Dark Mode', system: 'System' }[currentTheme.value] || 'Light Mode'))
const themeIcon  = computed(() => ({ light: Sun, dark: Moon, system: Monitor }[currentTheme.value] || Sun))

function cycleTheme() {
  const next = currentTheme.value === 'light' ? 'dark' : currentTheme.value === 'dark' ? 'system' : 'light'
  handleSetTheme(next)
}
function handleSetTheme(theme: string) {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
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

// ── Panel (slide-up drawer) ────────────────────────────────────
function togglePanel(name: string) {
  activePanel.value = activePanel.value === name ? null : name
}

// Position the panel above the dock item that opened it
const panelStyle = computed(() => {
  return 'bottom: 90px; left: 50%; transform: translateX(-150px);'
})

// ── Bounce on click ─────────────────────────────────────────────
const bouncingItem = ref<string | null>(null)
function handleNavClick(item: { path: string; color?: string }) {
  bouncingItem.value = item.path
  setTimeout(() => { bouncingItem.value = null }, 600)
  navigateTo(item.path)
}

// ── Dock Magnification ──────────────────────────────────────────
const dockWrapRef = ref<HTMLElement | null>(null)
const TOTAL_DOCK_ITEMS = computed(() => coreNav.value.length + 5) // +FAB+Tools+Theme+Settings+Avatar
const dockScales = ref<number[]>(Array(20).fill(1))

const ICON_SIZE    = 52   // px, base
const ICON_GAP     = 8    // px between icons
const MAG_RANGE    = 140  // px — radius of magnification effect
const MAX_SCALE    = 1.75 // maximum magnification
const MID_SCALE    = 1.35 // neighbour magnification

function onDockMouseMove(e: MouseEvent) {
  if (!dockWrapRef.value) return
  const items = dockWrapRef.value.querySelectorAll<HTMLElement>('.dock-item-wrap, .dock-brand')
  const scales: number[] = []
  items.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const dist = Math.abs(e.clientX - centerX)
    if (dist < MAG_RANGE) {
      const t = 1 - dist / MAG_RANGE
      // Smooth cubic ease-out
      const ease = t * t * (3 - 2 * t)
      scales.push(1 + (MAX_SCALE - 1) * ease)
    } else {
      scales.push(1)
    }
  })
  dockScales.value = scales
}

function onDockMouseLeave() {
  // Spring back to 1 — CSS transition handles the animation
  dockScales.value = Array(20).fill(1)
}

// ── Main content padding (dock is at bottom, not left) ─────────
const mainPaddingStyle = computed(() => 'padding-bottom: 0')

// ── Keyboard shortcuts ─────────────────────────────────────────
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

// ── Upcoming items (for panel) ─────────────────────────────────
const upcomingItems = computed(() => {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  return [
    ...(appointments.value || [])
      .filter((a: any) => a.status === 'scheduled' && a.date >= todayStr)
      .sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 4)
      .map((a: any) => ({ id: a.id, label: a.title || 'Appointment', sub: a.date, color: '#06b6d4', icon: CalendarDays })),
    ...(tickets.value || [])
      .filter((t: any) => t.status === 'Open' || t.status === 'In Progress')
      .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
      .slice(0, 3)
      .map((t: any) => ({ id: t.id, label: `#${t.id} ${t.device || ''}`.trim(), sub: t.status, color: t.status === 'In Progress' ? '#f59e0b' : '#5b5ef4', icon: TicketCheck })),
  ]
})

// ══════════════════════════════════════════════════════════════
// DockItem — individual icon with magnification + bounce + tooltip
// ══════════════════════════════════════════════════════════════
const DockItem = defineComponent({
  name: 'DockItem',
  props: {
    item:       { type: Object as () => typeof navigation[0], required: true },
    scale:      { type: Number, default: 1 },
    isActive:   { type: Boolean, default: false },
    isBouncing: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('div', {
      class: 'dock-item-wrap',
      style: { '--s': props.scale },
      onClick: () => emit('click'),
    }, [
      // Tooltip
      h('div', { class: 'dock-tooltip' }, props.item.name),

      // Icon shell
      h('div', {
        class: [
          'dock-icon',
          props.isActive ? 'dock-icon-active' : 'dock-icon-inactive',
          props.isBouncing ? 'dock-bounce' : '',
        ].join(' '),
        style: props.isActive ? `--ic: ${props.item.color}` : '',
      }, [
        h(props.item.icon, {
          class: 'dock-icon-svg',
          style: props.isActive ? `color: ${props.item.color}` : '',
        }),
        // Badge dot
        props.item.badge ? h('div', {
          class: 'dock-badge-dot',
          style: `background: ${props.item.badge.color}`,
        }) : null,
      ]),

      // Running dot
      props.isActive
        ? h('div', { class: 'dock-dot', style: `background: ${props.item.color}` })
        : null,
    ])
  },
})

// ══════════════════════════════════════════════════════════════
// DrawerContent — panel that slides up from the dock
// ══════════════════════════════════════════════════════════════
const DrawerContent = defineComponent({
  name: 'DrawerContent',
  props: {
    drawer:     { type: String, required: true },
    navigation: { type: Array as () => typeof navigation, required: true },
    userEmail:  { type: String, required: true },
    settings:   { type: Object, required: true },
  },
  emits: ['navigate', 'close'],
  setup(props, { emit }) {
    const NuxtLink = resolveComponent('NuxtLink')
    const toolsNav = computed(() => props.navigation.filter(n => n.group === 'tools'))

    const quickItems = [
      { label: 'New Ticket',   icon: TicketPlus,   color: '#f59e0b', path: '/bookings',  kbd: '⌘T' },
      { label: 'House Call',   icon: MapPin,        color: '#10b981', path: '/bookings',  kbd: '⌘H' },
      { label: 'New Customer', icon: UserPlus,      color: '#3b82f6', path: '/customers', kbd: '⌘U' },
      { label: 'Open Register',icon: ShoppingCart,  color: '#ec4899', path: '/pos',       kbd: '⌘R' },
      { label: 'New Invoice',  icon: Tag,           color: '#10b981', path: '/forms',     kbd: '⌘I' },
      { label: 'Scan Barcode', icon: Barcode,       color: '#06b6d4', path: '/barcodes',  kbd: '⌘B' },
    ]

    return () => {
      const headerBar = (title: string, icon: any, color: string) =>
        h('div', {
          class: 'flex items-center justify-between px-4 py-3 border-b flex-shrink-0',
          style: 'border-color: hsl(var(--border)/0.5)',
        }, [
          h('div', { class: 'flex items-center gap-2.5' }, [
            h('div', {
              class: 'w-7 h-7 rounded-xl flex items-center justify-center',
              style: `background: ${color}20`,
            }, [h(icon, { class: 'w-3.5 h-3.5', style: `color: ${color}` })]),
            h('h2', { class: 'text-sm font-bold tracking-tight' }, title),
          ]),
          h('button', {
            class: 'w-6 h-6 rounded-lg flex items-center justify-center hover:bg-muted/60 text-muted-foreground transition-all hover:scale-110 active:scale-90',
            onClick: () => emit('close'),
          }, [h(X, { class: 'w-3 h-3' })]),
        ])

      if (props.drawer === 'quick') {
        return h('div', { class: 'flex flex-col h-full overflow-hidden' }, [
          headerBar('Quick Actions', Plus, '#5b5ef4'),
          h('div', { class: 'flex-1 overflow-y-auto p-3' }, [
            h('div', { class: 'space-y-0.5' },
              quickItems.map((item) =>
                h('button', {
                  key: item.label,
                  class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all text-left group hover:scale-[1.01] active:scale-[0.97]',
                  onClick: () => { navigateTo(item.path); emit('navigate') },
                }, [
                  h('div', {
                    class: 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110',
                    style: `background: ${item.color}18`,
                  }, [h(item.icon, { class: 'w-4 h-4', style: `color: ${item.color}` })]),
                  h('p', { class: 'text-sm font-semibold flex-1' }, item.label),
                  h('kbd', {
                    class: 'text-[10px] font-mono text-muted-foreground/50 px-1.5 py-0.5 rounded-md',
                    style: 'background: hsl(var(--muted)/0.6)',
                  }, item.kbd),
                ])
              )
            ),
          ]),
        ])
      }

      if (props.drawer === 'tools') {
        return h('div', { class: 'flex flex-col h-full overflow-hidden' }, [
          headerBar('Tools', Grid3x3, '#64748b'),
          h('nav', { class: 'flex-1 p-3 space-y-0.5 overflow-y-auto' },
            toolsNav.value.map((item: any) =>
              h(NuxtLink, {
                key: item.path, to: item.path,
                class: 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:scale-[1.01] active:scale-[0.97]',
                onClick: () => emit('navigate'),
              }, () => [
                h('div', {
                  class: 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                  style: `background: ${item.color}18`,
                }, [h(item.icon, { class: 'w-4 h-4', style: `color: ${item.color}` })]),
                h('span', { class: 'flex-1' }, item.name),
                item.badge ? h('span', {
                  class: 'text-[9px] font-bold px-2 py-0.5 rounded-full',
                  style: `background: ${item.badge.color}18; color: ${item.badge.color}`,
                }, item.badge.label) : null,
              ])
            )
          ),
          h('div', {
            class: 'p-3 border-t',
            style: 'border-color: hsl(var(--border)/0.5)',
          }, [
            h('div', {
              class: 'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/40 transition-all',
              style: 'background: hsl(var(--muted)/0.3)',
              onClick: () => navigateTo('/settings'),
            }, [
              h('div', {
                class: 'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                style: 'background: linear-gradient(135deg, #5b5ef4, #8b5cf6)',
              }, [h('span', {}, props.userEmail.substring(0,2).toUpperCase())]),
              h('div', { class: 'min-w-0 flex-1' }, [
                h('p', { class: 'text-xs font-bold truncate' }, props.userEmail),
                h('p', { class: 'text-[10px] text-muted-foreground truncate' }, (props.settings as any).businessName || 'NovaOps'),
              ]),
            ]),
          ]),
        ])
      }

      return h('div')
    }
  },
})

// ══════════════════════════════════════════════════════════════
// MobileNav — full sidebar for mobile
// ══════════════════════════════════════════════════════════════
const MobileNav = defineComponent({
  name: 'MobileNav',
  props: {
    navigation:  { type: Array as () => typeof navigation, required: true },
    userInitials:{ type: String, required: true },
    userEmail:   { type: String, required: true },
    settings:    { type: Object, required: true },
    currentTheme:{ type: String, required: true },
  },
  emits: ['navigate', 'set-theme', 'export'],
  setup(props, { emit }) {
    const NuxtLink = resolveComponent('NuxtLink')
    const route = useRoute()
    return () => h('div', { class: 'flex flex-col h-full' }, [
      h('div', {
        class: 'flex items-center gap-3 px-5 py-4 border-b',
        style: 'border-color: hsl(var(--border)/0.5)',
      }, [
        h('div', {
          class: 'w-9 h-9 rounded-xl flex items-center justify-center',
          style: 'background: linear-gradient(135deg, #5b5ef4, #8b5cf6)',
        }, [h('span', { class: 'text-white font-black text-sm' }, 'N')]),
        h('div', [
          h('p', { class: 'text-sm font-bold' }, 'NovaOps'),
          h('p', { class: 'text-xs text-muted-foreground' }, (props.settings as any).businessName || 'Repair Shop'),
        ]),
      ]),
      h('nav', { class: 'flex-1 p-3 space-y-0.5 overflow-y-auto' },
        props.navigation.map((item: any) =>
          h(NuxtLink, {
            key: item.path, to: item.path,
            class: [
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
              route.path === item.path
                ? 'text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            ].join(' '),
            style: route.path === item.path ? `background: ${item.color}12` : '',
            onClick: () => emit('navigate'),
          }, () => [
            h('div', {
              class: 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
              style: `background: ${item.color}18`,
            }, [h(item.icon, { class: 'w-4 h-4', style: `color: ${item.color}` })]),
            h('span', { class: 'flex-1' }, item.name),
            item.badge ? h('span', {
              class: 'text-[9px] font-bold px-2 py-0.5 rounded-full',
              style: `background: ${item.badge.color}18; color: ${item.badge.color}`,
            }, item.badge.label) : null,
          ])
        )
      ),
      h('div', {
        class: 'p-4 border-t',
        style: 'border-color: hsl(var(--border)/0.5)',
      }, [
        h('div', { class: 'flex items-center gap-3' }, [
          h('div', {
            class: 'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold',
            style: 'background: linear-gradient(135deg, #5b5ef4, #8b5cf6)',
          }, [h('span', {}, props.userInitials)]),
          h('div', { class: 'flex-1 min-w-0' }, [
            h('p', { class: 'text-sm font-bold truncate' }, props.userEmail || 'User'),
            h('p', { class: 'text-xs text-muted-foreground' }, 'NovaOps Account'),
          ]),
        ]),
      ]),
    ])
  },
})
</script>

<style>
/* ══════════════════════════════════════════════════════════════
   macOS DOCK styles
   ══════════════════════════════════════════════════════════════ */

/* Wrap — centered at bottom */
.dock-wrap {
  position: fixed;
  bottom: 16px;
  left: 0;
  right: 0;
  z-index: 50;
  justify-content: center;
  align-items: flex-end;
  pointer-events: none;
}

/* Floating glass pill */
.dock-pill {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 22px;
  pointer-events: all;
  /* Extra Dock-specific shadow depth */
  box-shadow:
    0 8px 32px rgba(0,0,0,0.18),
    0 2px 8px rgba(0,0,0,0.12),
    0 0 0 0.5px rgba(255,255,255,0.6) inset,
    0 1px 0 rgba(255,255,255,0.8) inset;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(28px) saturate(200%);
  -webkit-backdrop-filter: blur(28px) saturate(200%);
  border: 1px solid rgba(255,255,255,0.85);
}
.dark .dock-pill {
  background: rgba(24,26,40,0.82);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.5),
    0 2px 8px rgba(0,0,0,0.35),
    0 0 0 0.5px rgba(255,255,255,0.05) inset;
}

/* ── Dock item wrapper ── */
.dock-item-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  /* Scale is driven by JS via --s custom property */
  transform: scale(var(--s, 1));
  transform-origin: bottom center;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Reserve space so pill doesn't resize */
  width: 56px;
}

/* ── Tooltip (label above icon) ── */
.dock-tooltip {
  position: absolute;
  bottom: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%) scale(calc(1 / var(--s, 1)));
  background: rgba(0,0,0,0.75);
  color: white;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.12s ease, transform 0.12s ease;
  backdrop-filter: blur(8px);
  z-index: 100;
}
.dark .dock-tooltip { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.08); }
.dock-item-wrap:hover .dock-tooltip { opacity: 1; }

/* ── Icon shell ── */
.dock-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s ease,
    box-shadow 0.2s ease;
  position: relative;
  flex-shrink: 0;
}

.dock-icon-inactive {
  background: rgba(0,0,0,0.05);
}
.dark .dock-icon-inactive { background: rgba(255,255,255,0.06); }
.dock-item-wrap:hover .dock-icon-inactive {
  background: rgba(0,0,0,0.08);
}
.dark .dock-item-wrap:hover .dock-icon-inactive { background: rgba(255,255,255,0.1); }

.dock-icon-active {
  background: linear-gradient(145deg, color-mix(in srgb, var(--ic) 18%, white), color-mix(in srgb, var(--ic) 10%, white));
  box-shadow: 0 2px 10px color-mix(in srgb, var(--ic) 30%, transparent);
}
.dark .dock-icon-active {
  background: linear-gradient(145deg, color-mix(in srgb, var(--ic) 28%, transparent), color-mix(in srgb, var(--ic) 16%, transparent));
}

/* Muted utility icons (theme, settings) */
.dock-icon-muted {
  background: rgba(0,0,0,0.04);
}
.dark .dock-icon-muted { background: rgba(255,255,255,0.05); }
.dock-item-wrap:hover .dock-icon-muted { background: rgba(0,0,0,0.08); }
.dark .dock-item-wrap:hover .dock-icon-muted { background: rgba(255,255,255,0.1); }
.dock-icon-active-settings { background: rgba(100,116,139,0.15) !important; }
.dock-icon-active-tools    { background: rgba(100,116,139,0.15) !important; }

/* SVG icon size */
.dock-icon-svg {
  width: 22px;
  height: 22px;
  color: hsl(var(--muted-foreground));
  transition: color 0.15s;
  flex-shrink: 0;
}

/* FAB — pink gradient */
.dock-fab {
  background: linear-gradient(135deg, #f9a8d4, #ec4899) !important;
  box-shadow: 0 4px 14px rgba(236,72,153,0.4) !important;
  transition: box-shadow 0.2s, background 0.2s !important;
}
.dock-fab-open {
  background: rgba(236,72,153,0.12) !important;
  box-shadow: 0 0 0 2px rgba(236,72,153,0.35) !important;
}
.dock-fab .dock-icon-svg { color: white !important; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.dock-fab-open .dock-icon-svg { color: #ec4899 !important; }

/* Badge dot (notification) */
.dock-badge-dot {
  position: absolute;
  top: 6px; right: 6px;
  width: 8px; height: 8px;
  border-radius: 50%;
  border: 2px solid hsl(var(--card));
}

/* Running indicator dot */
.dock-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 4px currentColor;
}

/* ── Divider ── */
.dock-divider {
  width: 1px;
  height: 36px;
  background: rgba(0,0,0,0.1);
  border-radius: 1px;
  margin: 0 2px;
  align-self: center;
  flex-shrink: 0;
}
.dark .dock-divider { background: rgba(255,255,255,0.08); }

/* ── Brand logo ── */
.dock-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 56px;
  flex-shrink: 0;
  cursor: default;
}
.dock-brand-inner {
  width: 50px; height: 50px; border-radius: 14px;
  background: linear-gradient(135deg, #5b5ef4, #8b5cf6);
  box-shadow: 0 4px 14px rgba(91,94,244,0.38);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 900; font-size: 20px; color: white;
  letter-radius: -0.5px;
}
.dock-brand-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #5b5ef4; box-shadow: 0 0 4px #5b5ef4;
}

/* ── Avatar ── */
.dock-avatar {
  width: 50px; height: 50px; border-radius: 50%;
  background: linear-gradient(135deg, #5b5ef4, #8b5cf6);
  box-shadow: 0 3px 10px rgba(91,94,244,0.35);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Outfit', sans-serif;
  font-size: 16px; font-weight: 700; color: white;
  flex-shrink: 0;
  transition: box-shadow 0.2s;
}
.dock-item-wrap:hover .dock-avatar {
  box-shadow: 0 6px 20px rgba(91,94,244,0.5);
}

/* ── Bounce animation (click) ── */
@keyframes dockBounce {
  0%   { transform: translateY(0); }
  25%  { transform: translateY(-18px); }
  50%  { transform: translateY(-6px); }
  68%  { transform: translateY(-12px); }
  84%  { transform: translateY(-3px); }
  100% { transform: translateY(0); }
}
.dock-bounce {
  animation: dockBounce 0.55s cubic-bezier(0.36,0.07,0.19,0.97);
}

/* ── Slide-up panel ── */
.panel-up-enter-active {
  transition: transform 0.32s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease;
}
.panel-up-leave-active {
  transition: transform 0.18s ease-in, opacity 0.16s ease;
}
.panel-up-enter-from {
  transform: translateY(20px) translateX(-150px);
  opacity: 0;
}
.panel-up-leave-to {
  transform: translateY(14px) translateX(-150px);
  opacity: 0;
}

/* ── Mobile sidebar ── */
.mobile-slide-enter-active { transition: transform 0.3s cubic-bezier(0.34,1.3,0.64,1); }
.mobile-slide-leave-active { transition: transform 0.16s ease-in; }
.mobile-slide-enter-from,
.mobile-slide-leave-to     { transform: translateX(-100%); }

/* ── Overlay ── */
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.18s ease; }
.overlay-enter-from,   .overlay-leave-to     { opacity: 0; }

/* ── Main content respects dock height ── */
main {
  padding-bottom: 96px !important; /* dock + breathing room */
}
@media (max-width: 1023px) {
  main { padding-bottom: 2rem !important; }
}
</style>
