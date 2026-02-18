<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile Menu Overlay -->
    <div 
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-50 lg:hidden"
      @click="mobileMenuOpen = false"
    >
      <div class="fixed inset-0 bg-background/80 backdrop-blur-sm" />
      <aside class="fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card shadow-2xl animate-in slide-in-from-left">
        <div class="flex h-full flex-col">
          <!-- Logo -->
          <div class="flex h-16 items-center justify-between border-b border-border px-5 bg-gradient-to-r from-primary/5 to-blue-500/5">
            <img src="/posicon.svg" alt="NovaOps" class="h-7 w-auto" />
            <Button variant="ghost" size="icon" class="h-7 w-7" @click="mobileMenuOpen = false">
              <X class="w-4 h-4" />
            </Button>
          </div>
          <!-- Navigation -->
          <nav class="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
            <NuxtLink
              v-for="item in navigation"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-accent hover:text-accent-foreground text-muted-foreground group"
              active-class="!bg-primary/10 !text-primary border border-primary/20 shadow-sm"
              @click="mobileMenuOpen = false"
            >
              <div class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150"
                :style="`background: ${item.color}18`">
                <component :is="item.icon" class="h-4 w-4 transition-colors duration-150" :style="`color: ${item.color}`" />
              </div>
              <span class="flex-1">{{ item.name }}</span>
              <span v-if="item.badge" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                :style="`background: ${item.badge.color}20; color: ${item.badge.color}`">
                {{ item.badge.label }}
              </span>
            </NuxtLink>

            <!-- Sidebar Widget -->
            <div class="pt-3">
              <SidebarWidget />
            </div>
          </nav>

          <!-- User Section -->
          <div class="border-t border-border p-3">
            <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" @click="navigateTo('/settings')">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500 text-white shadow-md shadow-primary/25 flex-shrink-0">
                <span class="text-sm font-bold">{{ userInitials }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate">{{ userEmail }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ settings.businessName || 'NovaOps' }}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card flex-col">
      <!-- Logo -->
      <div class="flex h-16 items-center border-b border-border px-5 bg-gradient-to-r from-primary/5 to-blue-500/5 flex-shrink-0">
        <img src="/posicon.svg" alt="NovaOps" class="h-7 w-auto" />
      </div>

      <!-- Navigation label -->
      <div class="px-5 pt-4 pb-1">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Menu</p>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 pb-3 overflow-y-auto space-y-0.5">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-muted/60 text-muted-foreground group"
          active-class="!bg-primary/10 !text-primary border border-primary/20 shadow-sm"
        >
          <div class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
            :style="`background: ${item.color}18`">
            <component :is="item.icon" class="h-4 w-4" :style="`color: ${item.color}`" />
          </div>
          <span class="flex-1">{{ item.name }}</span>
          <span v-if="item.badge" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
            :style="`background: ${item.badge.color}20; color: ${item.badge.color}`">
            {{ item.badge.label }}
          </span>
        </NuxtLink>

        <!-- Sidebar Widget -->
        <div class="pt-3">
          <SidebarWidget />
        </div>
      </nav>

      <!-- User Section -->
      <div class="border-t border-border p-3 flex-shrink-0">
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" @click="navigateTo('/settings')">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500 text-white shadow-md shadow-primary/25 flex-shrink-0">
            <span class="text-sm font-bold">{{ userInitials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">{{ userEmail }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ settings.businessName || 'NovaOps' }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="lg:pl-64">
      <!-- Top Bar -->
      <header class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 shadow-sm">
        <!-- Mobile Menu Button -->
        <Button 
          variant="ghost" 
          size="icon" 
          class="lg:hidden"
          @click="mobileMenuOpen = true"
        >
          <Menu class="h-5 w-5" />
        </Button>

        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div v-if="currentPageNav" class="w-5 h-5 rounded flex items-center justify-center" :style="`background: ${currentPageNav?.color}18`">
              <component :is="currentPageNav?.icon" class="w-3 h-3" :style="`color: ${currentPageNav?.color}`" />
            </div>
            <h2 class="text-sm font-semibold" style="font-family: 'Plus Jakarta Sans', sans-serif;">{{ currentPageTitle }}</h2>
          </div>
          <h2 class="text-sm font-semibold sm:hidden" style="font-family: 'Plus Jakarta Sans', sans-serif;">{{ currentPageTitle }}</h2>
          <div class="hidden md:flex">
            <NavMenubar />
          </div>
        </div>
        
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <NotificationsPanel />
          </Button>
          <Button variant="ghost" size="icon" @click="navigateTo('/settings')">
            <SettingsIcon class="h-5 w-5" />
          </Button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 sm:p-6">
        <div v-if="appStore.isLoading" class="flex items-center justify-center py-24">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-muted-foreground">Loading your data...</p>
          </div>
        </div>
        <slot v-else />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Globe } from 'lucide-vue-next'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import NotificationsPanel from "~/components/NotificationsPanel.vue"
import SidebarWidget from "~/components/SidebarWidget.vue"
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
  { 
    name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, 
    color: '#6366f1',
    badge: null
  },
  { 
    name: 'Tickets', path: '/tickets', icon: TicketCheck, 
    color: '#f59e0b',
    badge: { label: 'New', color: '#f59e0b' }
  },
  { 
    name: 'House Calls', path: '/housecalls', icon: MapPin, 
    color: '#10b981',
    badge: null
  },
  { 
    name: 'Customers', path: '/customers', icon: Users, 
    color: '#3b82f6',
    badge: null
  },
  { 
    name: 'Inventory', path: '/inventory', icon: Package, 
    color: '#8b5cf6',
    badge: null
  },
  { 
    name: 'Calendar', path: '/calendar', icon: CalendarDays, 
    color: '#06b6d4',
    badge: null
  },
  { 
    name: 'POS', path: '/pos', icon: ShoppingCart, 
    color: '#ec4899',
    badge: { label: 'Live', color: '#10b981' }
  },
  {
  name: 'Website',
  path: '/website-settings',
  icon: Globe,
  color: '#06b6d4',
  badge: { label: 'Portal', color: '#06b6d4' }
  },
  { 
    name: 'Reports', path: '/reports', icon: FileText, 
    color: '#f97316',
    badge: null
  },
  { 
    name: 'Settings', path: '/settings', icon: SettingsIcon, 
    color: '#64748b',
    badge: null
  },
]

const currentPageNav = computed(() => {
  return navigation.find(item => item.path === route.path)
})

const currentPageTitle = computed(() => {
  return currentPageNav.value?.name || 'Dashboard'
})

watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>
