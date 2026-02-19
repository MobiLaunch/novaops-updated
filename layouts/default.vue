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

    <!-- ── Sidebar (shared styles via computed nav) ───────────────── -->
    <Transition name="sidebar">
      <aside
        v-show="mobileMenuOpen"
        class="fixed left-0 top-0 z-50 h-screen w-60 bg-card border-r border-border flex flex-col lg:hidden shadow-xl"
      >
        <SidebarContent :navigation="navigation" :user-initials="userInitials" :user-email="userEmail" :settings="settings" @close="mobileMenuOpen = false" @navigate="mobileMenuOpen = false" />
      </aside>
    </Transition>

    <!-- ── Desktop Sidebar ────────────────────────────────────────── -->
    <aside class="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-60 bg-card border-r border-border flex-col">
      <SidebarContent :navigation="navigation" :user-initials="userInitials" :user-email="userEmail" :settings="settings" />
    </aside>

    <!-- ── Main ───────────────────────────────────────────────────── -->
    <div class="lg:pl-60 flex flex-col min-h-screen">

      <!-- Top Bar -->
      <header class="sticky top-0 z-30 h-13 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4">

        <!-- Mobile hamburger -->
        <Button variant="ghost" size="icon" class="lg:hidden h-8 w-8 -ml-1" @click="mobileMenuOpen = true">
          <Menu class="h-4 w-4" />
        </Button>

        <!-- Page title + icon -->
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div
            v-if="currentPageNav"
            class="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            :style="`background: ${currentPageNav.color}18`"
          >
            <component :is="currentPageNav.icon" class="w-3.5 h-3.5" :style="`color: ${currentPageNav.color}`" />
          </div>
          <h1 class="text-sm font-semibold truncate">{{ currentPageTitle }}</h1>
          <div class="hidden md:flex ml-1">
            <NavMenubar />
          </div>
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-0.5 flex-shrink-0">
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <NotificationsPanel />
          </Button>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="navigateTo('/settings')">
            <SettingsIcon class="h-4 w-4" />
          </Button>
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

<!-- ─────────────────────────────────────────────────────────────────
     SidebarContent — extracted so mobile & desktop share identical markup
──────────────────────────────────────────────────────────────────── -->
<template id="sidebar-content">
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
    const route = useRoute()
    const NuxtLink = resolveComponent('NuxtLink')
    const SidebarWidgetComp = SidebarWidget

    // Split nav into primary (first 8) and secondary (rest, excluding Settings)
    const primaryNav = computed(() => props.navigation.slice(0, 8))
    const secondaryNav = computed(() => props.navigation.slice(8, -1))
    const settingsNav = computed(() => props.navigation[props.navigation.length - 1])

    const navLinkClass = 'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-100 text-muted-foreground hover:bg-muted/60 hover:text-foreground group'
    const activeClass = '!bg-primary/10 !text-primary'

    return () => h('div', { class: 'flex flex-col h-full' }, [

      // ── Logo header ──
      h('div', { class: 'flex items-center justify-between h-13 px-4 border-b border-border flex-shrink-0' }, [
        h('img', { src: '/posicon.svg', alt: 'NovaOps', class: 'h-6 w-auto' }),
        h(Button, {
          variant: 'ghost', size: 'icon',
          class: 'h-7 w-7 lg:hidden',
          onClick: () => emit('close')
        }, () => h(X, { class: 'w-4 h-4' }))
      ]),

      // ── Nav ──
      h('nav', { class: 'flex-1 overflow-y-auto px-2 py-3 space-y-0.5' }, [

        // Primary nav items
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
            }, [
              h(item.icon, { class: 'h-3.5 w-3.5', style: `color: ${item.color}` })
            ]),
            h('span', { class: 'flex-1 truncate' }, item.name),
            item.badge ? h('span', {
              class: 'text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
              style: `background: ${item.badge.color}20; color: ${item.badge.color}`
            }, item.badge.label) : null
          ])
        ),

        // Divider + secondary label
        h('div', { class: 'pt-3 pb-1' }, [
          h('p', { class: 'text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-2.5' }, 'Tools')
        ]),

        // Secondary nav items
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
            }, [
              h(item.icon, { class: 'h-3.5 w-3.5', style: `color: ${item.color}` })
            ]),
            h('span', { class: 'flex-1 truncate' }, item.name),
            item.badge ? h('span', {
              class: 'text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
              style: `background: ${item.badge.color}20; color: ${item.badge.color}`
            }, item.badge.label) : null
          ])
        ),

        // Sidebar Widget
        h('div', { class: 'pt-3' }, [h(SidebarWidgetComp)])
      ]),

      // ── Bottom: Settings + User ──
      h('div', { class: 'flex-shrink-0 border-t border-border' }, [

        // Settings link
        h(NuxtLink, {
          to: settingsNav.value.path,
          class: `${navLinkClass} mx-2 my-2`,
          activeClass,
          onClick: () => emit('navigate')
        }, () => [
          h('div', {
            class: 'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
            style: `background: ${settingsNav.value.color}18`
          }, [
            h(settingsNav.value.icon, { class: 'h-3.5 w-3.5', style: `color: ${settingsNav.value.color}` })
          ]),
          h('span', { class: 'flex-1' }, settingsNav.value.name)
        ]),

        // User row
        h('div', {
          class: 'flex items-center gap-2.5 mx-2 mb-3 px-2.5 py-2 rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/70 transition-colors',
          onClick: () => navigateTo('/settings')
        }, [
          h('div', {
            class: 'w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm shadow-primary/20'
          }, [
            h('span', { class: 'text-xs font-bold' }, props.userInitials)
          ]),
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
/* Mobile sidebar slide transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}

/* Overlay fade transition */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Topbar height utility */
.h-13 {
  height: 3.25rem;
}
</style>

