<template>
  <div class="dash-root">

    <!-- ── Context Banner ──────────────────────────────────────────── -->
    <div class="context-banner" :class="bannerVariant">
      <div class="context-banner-left">
        <div class="banner-weather-icon">
          <component :is="weatherIconComponent" class="w-6 h-6 banner-icon-svg" :class="{ 'animate-spin-slow': weather.loaded && weather.conditionCode >= 95 }" />
        </div>
        <div class="banner-text">
          <p class="banner-greeting">{{ banner.greeting }}</p>
          <p class="banner-message" v-if="weather.loaded">
            It's <strong>{{ weather.temp }}°F</strong> and {{ weather.description.toLowerCase() }} in {{ weather.location }}.
            Perfect weather for <strong>{{ banner.suggestion }}</strong> {{ banner.emoji }}
          </p>
          <p class="banner-message" v-else-if="weather.loading">
            Fetching your local weather…
          </p>
          <p class="banner-message banner-tap" v-else @click="loadWeather">
            Tap to load local weather &amp; get a suggestion ☕
          </p>
        </div>
      </div>
      <div class="banner-right" v-if="weather.loaded">
        <p class="banner-temp">{{ weather.temp }}°</p>
        <p class="banner-feels">feels {{ weather.feelsLike }}°</p>
      </div>
    </div>

    <!-- ── Header ─────────────────────────────────────────────────── -->
    <div class="dash-header">
      <div class="flex items-center gap-4">
        <div class="dash-header-icon">
          <LayoutDashboard class="w-5 h-5 text-white" />
        </div>
        <div>
          <p class="dash-greeting">{{ greeting }}</p>
          <h1 class="dash-title">Dashboard</h1>
        </div>
      </div>
      <div class="dash-date">
        <CalendarDays class="w-4 h-4" />
        <span>{{ todayLabel }}</span>
      </div>
    </div>

    <!-- ── Revenue Hero + Core Stats ──────────────────────────────── -->
    <div class="stats-zone">

      <!-- Revenue Hero Card -->
      <div class="hero-card" @click="navigateTo('/analytics')">
        <div class="hero-bg-shape" />
        <div class="hero-content">
          <div class="hero-icon-wrap">
            <Banknote class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="hero-label">Total Revenue</p>
            <p class="hero-value">{{ formatCurrency(totalRevenue) }}</p>
            <p class="hero-sub">{{ completedTickets.length }} completed jobs</p>
          </div>
        </div>
        <div class="hero-trend">
          <TrendingUp class="w-4 h-4" />
          <span>View analytics →</span>
        </div>
      </div>

      <!-- Secondary Stats Column -->
      <div class="secondary-stats">
        <div class="stat-pill" style="--c: #3b82f6" @click="navigateTo('/bookings')">
          <div class="stat-pill-icon"><TicketCheck class="w-4 h-4" /></div>
          <div class="stat-pill-body">
            <p class="stat-pill-label">Active Tickets</p>
            <p class="stat-pill-value">{{ activeTickets.length }}</p>
          </div>
          <p class="stat-pill-sub">{{ completedToday }} done today</p>
        </div>

        <div class="stat-pill" style="--c: #8b5cf6" @click="navigateTo('/customers')">
          <div class="stat-pill-icon"><Users class="w-4 h-4" /></div>
          <div class="stat-pill-body">
            <p class="stat-pill-label">Customers</p>
            <p class="stat-pill-value">{{ (customers || []).length }}</p>
          </div>
          <p class="stat-pill-sub">Total clients</p>
        </div>

        <div class="stat-pill" style="--c: #f59e0b" @click="navigateTo('/inventory')">
          <div class="stat-pill-icon"><Box class="w-4 h-4" /></div>
          <div class="stat-pill-body">
            <p class="stat-pill-label">Inventory</p>
            <p class="stat-pill-value">{{ (inventory || []).length }}</p>
          </div>
          <p class="stat-pill-sub" :class="lowStockItems > 0 ? 'text-amber-500' : 'text-emerald-500'">
            {{ lowStockItems > 0 ? `${lowStockItems} low stock` : 'All stocked' }}
          </p>
        </div>

        <div class="stat-pill" style="--c: #06b6d4" @click="navigateTo('/calendar')">
          <div class="stat-pill-icon"><CalendarDays class="w-4 h-4" /></div>
          <div class="stat-pill-body">
            <p class="stat-pill-label">Upcoming</p>
            <p class="stat-pill-value">{{ upcomingAppointments }}</p>
          </div>
          <p class="stat-pill-sub">Appointments</p>
        </div>
      </div>
    </div>

    <!-- ── Quick Actions ──────────────────────────────────────────── -->
    <div class="quick-actions-section">
      <p class="section-label">Quick Actions</p>
      <div class="quick-actions-grid">
        <button
          v-for="action in quickActions"
          :key="action.label"
          class="action-tile"
          :style="`--ac: ${action.color}`"
          @click="action.onClick()"
        >
          <div class="action-icon" :style="`background: linear-gradient(135deg, ${action.color}, ${action.colorDark}); box-shadow: 0 4px 14px ${action.color}40`">
            <component :is="action.icon" class="w-5 h-5 text-white" />
          </div>
          <p class="action-label">{{ action.label }}</p>
          <p class="action-sub">{{ action.sub }}</p>
        </button>
      </div>
    </div>

    <!-- ── Bottom Row ─────────────────────────────────────────────── -->
    <div class="bottom-row">

      <!-- Today's Summary -->
      <div class="summary-card">
        <div class="card-header">
          <div class="card-header-icon" style="background: #5b5ef418; color: #5b5ef4">
            <TrendingUp class="w-4 h-4" />
          </div>
          <h3 class="card-title">Today</h3>
        </div>
        <div class="summary-grid">
          <div
            v-for="s in todaySummary"
            :key="s.label"
            class="summary-chip"
            :style="`--sc: ${s.color}`"
          >
            <component :is="s.icon" class="w-3.5 h-3.5 summary-chip-icon" />
            <div>
              <p class="summary-chip-label">{{ s.label }}</p>
              <p class="summary-chip-value">{{ s.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Repair Shop Alerts (Warranty & Parts) -->
      <div v-if="warrantyExpiringSoon.length > 0 || waitingForParts.length > 0" class="summary-card" style="border: 2px solid #f59e0b30; background: #fef3c708; grid-column: 1 / -1">
        <div class="card-header">
          <div class="card-header-icon" style="background: #f59e0b18; color: #f59e0b">
            <AlertCircle class="w-4 h-4" />
          </div>
          <h3 class="card-title">Repair Alerts</h3>
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="t in warrantyExpiringSoon.slice(0, 3)"
            :key="'w-' + t.id"
            class="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors"
            style="background: #f59e0b08; border: 1px solid #f59e0b20"
            @click="navigateTo('/bookings')"
          >
            <span class="text-xs font-semibold">#{{ t.id }} — Warranty expiring</span>
            <span class="text-[10px] text-amber-600 font-bold">{{ warrantyDaysLeft(t) }}d left</span>
          </div>
          <div
            v-for="t in waitingForParts.slice(0, 3)"
            :key="'p-' + t.id"
            class="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors"
            style="background: #ef444408; border: 1px solid #ef444420"
            @click="navigateTo('/bookings')"
          >
            <span class="text-xs font-semibold">#{{ t.id }} — Waiting for parts</span>
            <span class="text-[10px] text-red-600 font-bold">{{ t.device }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Tickets -->
      <div class="tickets-card">
        <div class="card-header">
          <div class="card-header-icon" style="background: #f59e0b18; color: #f59e0b">
            <TicketCheck class="w-4 h-4" />
          </div>
          <h3 class="card-title">Recent Tickets</h3>
          <button class="view-all-btn" @click="navigateTo('/bookings')">View all →</button>
        </div>

        <div class="ticket-list">
          <div
            v-for="ticket in recentTickets"
            :key="ticket.id"
            class="ticket-row"
            @click="navigateTo('/bookings')"
          >
            <div class="ticket-dot" :style="`background: ${ticketStatusColor(ticket.status)}`" />
            <div class="ticket-info">
              <p class="ticket-title">#{{ ticket.id }} — {{ ticket.device }}</p>
              <p class="ticket-customer">{{ getCustomerName(ticket.customerId) }}</p>
            </div>
            <div class="ticket-meta">
              <span class="ticket-status-badge" :style="`background: ${ticketStatusColor(ticket.status)}18; color: ${ticketStatusColor(ticket.status)}`">
                {{ ticket.status }}
              </span>
              <span class="ticket-price" :style="`color: ${ticketStatusColor(ticket.status)}`">
                {{ formatCurrency(ticket.price) }}
              </span>
            </div>
          </div>
          <div v-if="recentTickets.length === 0" class="tickets-empty">
            <TicketCheck class="w-6 h-6 opacity-20" />
            <p>No tickets yet — create your first one!</p>
          </div>
        </div>
      </div>

    </div>

    <!-- New Ticket Dialog -->
    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import type { Ticket } from '~/types'
import {
  Banknote, TicketCheck, Users, Box, Wrench,
  ShoppingCart, CalendarDays, Package, ClipboardCheck, UserPlus,
  DollarSign, TrendingUp, LayoutDashboard, MessageCircle,
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Snowflake, AlertCircle,
} from 'lucide-vue-next'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import { useWeather, wmoIconKey, getContextBanner } from '~/composables/useWeather'
import { useNotifications } from '~/composables/useNotifications'

definePageMeta({ middleware: ['auth'] })

const router    = useRouter()
const appStore  = useAppStore()
const { customers, tickets, inventory, appointments, settings } = storeToRefs(appStore)
const { trackDevice } = appStore
const { weather, fetchWeather } = useWeather()

const newTicketOpen = ref(false)
const navigateTo    = (path: string) => router.push(path)

// Auto-load weather on mount (silent — no geolocation prompt unless user hasn't granted yet)
onMounted(() => {
  if (!weather.value.loaded && !weather.value.loading) {
    fetchWeather().catch(() => {})
  }
})

const loadWeather = async () => { if (!weather.value.loaded) await fetchWeather() }

// ── Banner ─────────────────────────────────────────────────────────
const banner = computed(() =>
  weather.value.loaded
    ? getContextBanner(weather.value.temp, weather.value.conditionCode)
    : getContextBanner(68, 0)   // neutral default before load
)

const bannerVariant = computed(() => {
  const t = weather.value.temp
  if (!weather.value.loaded) return 'banner-neutral'
  if (t <= 40) return 'banner-cold'
  if (t <= 65) return 'banner-mild'
  return 'banner-warm'
})

// Resolve lucide icon from WMO icon key
const weatherIconComponent = computed(() => {
  const key = weather.value.icon || 'cloud'
  const map: Record<string, any> = {
    'sun': Sun,
    'cloud-sun': Cloud,
    'cloud': Cloud,
    'cloud-rain': CloudRain,
    'snowflake': Snowflake,
    'cloud-drizzle': CloudDrizzle,
    'cloud-snow': CloudSnow,
    'cloud-lightning': CloudLightning,
  }
  return map[key] || Cloud
})

// ── Computed Data ──────────────────────────────────────────────────
const totalRevenue = computed(() =>
  (tickets.value || []).filter(t => t.price > 0 && (t.status === 'Completed' || t.status === 'Delivered'))
    .reduce((acc, t) => acc + (t.price || 0), 0)
)
const activeTickets    = computed(() => (tickets.value || []).filter(t => t.status !== 'Closed' && t.status !== 'Delivered'))
const completedTickets = computed(() => (tickets.value || []).filter(t => t.status === 'Completed' || t.status === 'Delivered'))
const completedToday   = computed(() => {
  const today = new Date().toDateString()
  return (tickets.value || []).filter(t => {
    const ua = t.updatedAt ? new Date(t.updatedAt).toDateString() : null
    return (t.status === 'Completed' || t.status === 'Delivered') && ua === today
  }).length
})
const lowStockItems        = computed(() => (inventory.value || []).filter(item => (item.itemType || 'product') !== 'service' && item.stock <= (item.low || 5)).length)
const upcomingAppointments = computed(() => (appointments.value || []).filter(a => a.status === 'scheduled').length)
const recentTickets        = computed(() => [...(tickets.value || [])].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 8))
const waitingForParts     = computed(() => (tickets.value || []).filter(t => t.status === 'Waiting for Parts'))
const warrantyExpiringSoon = computed(() => {
  const now = new Date()
  const inDays = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / 86400000)
  return (tickets.value || [])
    .filter(t => (t.status === 'Completed' || t.status === 'Delivered') && t.warrantyDays > 0 && t.warrantyStart)
    .map(t => {
      const start = new Date(t.warrantyStart)
      const end = new Date(start.getTime() + (t.warrantyDays || 0) * 86400000)
      return { ...t, _daysLeft: inDays(end) }
    })
    .filter(t => t._daysLeft >= 0 && t._daysLeft <= 14)
    .sort((a, b) => a._daysLeft - b._daysLeft)
})
const warrantyDaysLeft = (t: any) => {
  if (!t.warrantyStart || !t.warrantyDays) return 0
  const start = new Date(t.warrantyStart)
  const end = new Date(start.getTime() + (t.warrantyDays || 0) * 86400000)
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
}

const formatCurrency   = (amount: number) => `${settings.value?.currency || '$'}${(amount || 0).toFixed(2)}`
const getCustomerName  = (customerId: number) => (customers.value || []).find(c => c.id === customerId)?.name || 'Unknown'
const ticketStatusColor = (status: string) => {
  const map: Record<string, string> = {
    'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316',
    'Completed': '#10b981', 'Delivered': '#64748b'
  }
  return map[status] || '#64748b'
}

// ── Greeting ───────────────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})
const todayLabel = computed(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))

// ── Quick Actions ──────────────────────────────────────────────────
const quickActions = computed(() => [
  { label: 'New Sale',   sub: 'POS transaction',              color: '#ec4899', colorDark: '#db2777', icon: ShoppingCart,   onClick: () => navigateTo('/pos') },
  { label: 'Schedule',   sub: `${upcomingAppointments.value} upcoming`,  color: '#8b5cf6', colorDark: '#7c3aed', icon: CalendarDays,   onClick: () => navigateTo('/calendar') },
  { label: 'Inventory',  sub: 'Manage stock',                 color: '#f59e0b', colorDark: '#d97706', icon: Package,        onClick: () => navigateTo('/inventory') },
  { label: 'Bookings',   sub: 'Repairs, House Calls & Shipments', color: '#3b82f6', colorDark: '#2563eb', icon: ClipboardCheck, onClick: () => navigateTo('/bookings') },
  { label: 'Customers',  sub: 'Manage clients',               color: '#06b6d4', colorDark: '#0891b2', icon: UserPlus,       onClick: () => navigateTo('/customers') },
  { label: 'Messages',   sub: 'Email & chat',                 color: '#ec4899', colorDark: '#db2777', icon: MessageCircle,  onClick: () => navigateTo('/messages') },
])

// ── Today Summary ──────────────────────────────────────────────────
const todayRevenue = computed(() => {
  const today = new Date().toDateString()
  return (tickets.value || [])
    .filter(t => t.price > 0 && (t.status === 'Completed' || t.status === 'Delivered')
      && t.updatedAt && new Date(t.updatedAt).toDateString() === today)
    .reduce((acc, t) => acc + (t.price || 0), 0)
})
const todaySummary = computed(() => [
  { label: 'Revenue',   value: formatCurrency(todayRevenue.value),   color: '#3b82f6', icon: DollarSign },
  { label: 'Completed', value: String(completedToday.value),         color: '#10b981', icon: TicketCheck },
  { label: 'Active',    value: String(activeTickets.value.length),   color: '#f97316', icon: TicketCheck },
  { label: 'Scheduled', value: String(upcomingAppointments.value),   color: '#8b5cf6', icon: CalendarDays },
])

const { addNotification } = useNotifications()
const { sendTicketEmail, sendInternalAlert } = useEmailNotifications()

const getCustomerPhone = (customerId: number) => (customers.value || []).find((c: any) => c.id === customerId)?.phone || ''

const handleCreateTicket = async (ticketData: any) => {
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) {
      const newCust = await appStore.createCustomer(ticketData.newCustomer)
      customerId = newCust.id
    }
    const ticket = await appStore.createTicket({
      ...ticketData,
      customerId,
      status: 'Open',
      price: 0,
      services: [],
      parts: [],
      payments: [],
      notes: [],
      timeLog: [],
    })
    trackDevice(ticket.device)
    addNotification('Ticket Created', `Ticket #${ticket.id} created successfully`, 'success')
    newTicketOpen.value = false
    // Fire email notifications (non-blocking)
    sendTicketEmail({ ...ticket, customerId }).catch(() => {})
    sendInternalAlert({ eventType: 'New Ticket', eventSummary: `Ticket #${ticket.id} created`, customerName: getCustomerName(customerId), customerPhone: getCustomerPhone(customerId), deviceName: ticketData.device || '', issueDescription: ticketData.issue || '', ticketNumber: String(ticket.id) }).catch(() => {})
  } catch (err: any) {
    addNotification('Error', err.message || 'Failed to create ticket', 'error')
  }
}
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────── */
.dash-root {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Context Banner ───────────────────────────────────────────────── */
.context-banner {
  border-radius: 18px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: all 0.35s ease;
  border: 1px solid transparent;
}
.banner-cold    { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-color: rgba(147,197,253,0.4); color: #1e40af; }
.banner-mild    { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-color: rgba(110,231,183,0.4); color: #065f46; }
.banner-warm    { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-color: rgba(252,211,77,0.4); color: #92400e; }
.banner-neutral { background: hsl(var(--muted)/0.5); border-color: hsl(var(--border)/0.5); }

.context-banner-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
.banner-weather-icon {
  width: 44px; height: 44px; border-radius: 14px;
  background: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; backdrop-filter: blur(8px);
}
.banner-icon-svg { opacity: 0.9; }
.banner-text { min-width: 0; }
.banner-greeting { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.65; margin-bottom: 2px; }
.banner-message { font-size: 13px; font-weight: 600; line-height: 1.4; opacity: 0.9; }
.banner-message strong { font-weight: 900; }
.banner-tap { cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.banner-right { text-align: right; flex-shrink: 0; }
.banner-temp  { font-size: 28px; font-weight: 900; line-height: 1; letter-spacing: -1px; }
.banner-feels { font-size: 11px; font-weight: 600; opacity: 0.6; }

/* ── Header ──────────────────────────────────────────────────────── */
.dash-header { display: flex; align-items: center; justify-content: space-between; }
.dash-header-icon {
  width: 38px; height: 38px; border-radius: 12px;
  background: linear-gradient(135deg, #5b5ef4, #8b5cf6);
  box-shadow: 0 4px 14px rgba(91,94,244,0.35);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.dash-greeting { font-size: 11px; font-weight: 600; color: hsl(var(--muted-foreground)); margin-bottom: 1px; }
.dash-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1; }
.dash-date {
  display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
  color: hsl(var(--muted-foreground)); background: hsl(var(--muted)/0.5);
  padding: 6px 14px; border-radius: 999px; border: 1px solid hsl(var(--border)/0.5);
}

/* ── Stats Zone ──────────────────────────────────────────────────── */
.stats-zone { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 900px) { .stats-zone { grid-template-columns: 1fr; } }

/* Hero Revenue Card */
.hero-card {
  position: relative; border-radius: 20px;
  background: linear-gradient(135deg, #059669 0%, #10b981 55%, #34d399 100%);
  padding: 22px; cursor: pointer; overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
  display: flex; flex-direction: column; justify-content: space-between; min-height: 160px;
  box-shadow: 0 6px 20px rgba(16,185,129,0.25);
}
.hero-card:hover  { transform: scale(1.02) translateY(-3px); box-shadow: 0 16px 40px rgba(16,185,129,0.35); }
.hero-card:active { transform: scale(0.97); }
.hero-bg-shape {
  position: absolute; top: -24px; right: -24px;
  width: 140px; height: 140px; border-radius: 50%;
  background: rgba(255,255,255,0.12); pointer-events: none;
}
.hero-bg-shape::after {
  content: ''; position: absolute; bottom: -40px; left: -60px;
  width: 100px; height: 100px; border-radius: 50%;
  background: rgba(255,255,255,0.07);
}
.hero-content { display: flex; align-items: flex-start; gap: 14px; position: relative; z-index: 1; }
.hero-icon-wrap {
  width: 42px; height: 42px; border-radius: 13px;
  background: rgba(255,255,255,0.22); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; backdrop-filter: blur(4px);
}
.hero-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 4px; letter-spacing: 0.02em; }
.hero-value { font-size: 30px; font-weight: 900; color: white; line-height: 1; letter-spacing: -1px; font-family: 'JetBrains Mono', 'SF Mono', monospace; }
.hero-sub   { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; font-weight: 600; }
.hero-trend { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); position: relative; z-index: 1; }

/* Secondary Stats */
.secondary-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-pill {
  display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 16px;
  background: hsl(var(--card)); border: 1px solid hsl(var(--border)/0.6); cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.2s;
  position: relative; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.stat-pill::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: var(--c); opacity: 0.7; border-radius: 0;
}
.stat-pill:hover  { transform: translateY(-3px) scale(1.02); border-color: color-mix(in srgb, var(--c) 35%, transparent); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.stat-pill:active { transform: scale(0.97); }
.stat-pill-icon {
  width: 28px; height: 28px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c);
}
.stat-pill-label  { font-size: 11px; font-weight: 600; color: hsl(var(--muted-foreground)); }
.stat-pill-value  { font-size: 22px; font-weight: 900; color: hsl(var(--foreground)); line-height: 1.1; letter-spacing: -0.5px; font-family: 'JetBrains Mono', monospace; }
.stat-pill-sub    { font-size: 10px; font-weight: 600; color: hsl(var(--muted-foreground)); }

/* ── Quick Actions ───────────────────────────────────────────────── */
.section-label {
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.12em; color: hsl(var(--muted-foreground)); margin-bottom: 12px;
}
.quick-actions-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
@media (max-width: 1200px) { .quick-actions-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 640px)  { .quick-actions-grid { grid-template-columns: repeat(3, 1fr); } }

.action-tile {
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 10px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--ac) 6%, hsl(var(--card)));
  border: 1px solid color-mix(in srgb, var(--ac) 18%, transparent);
  cursor: pointer; text-align: center;
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.action-tile:hover  { transform: scale(1.06) translateY(-4px); box-shadow: 0 10px 24px rgba(0,0,0,0.1); }
.action-tile:active { transform: scale(0.93); }
.action-icon {
  width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
  transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.action-tile:hover .action-icon { transform: scale(1.1) rotate(-4deg); }
.action-label { font-size: 12px; font-weight: 800; color: hsl(var(--foreground)); line-height: 1; }
.action-sub   { font-size: 10px; font-weight: 600; color: hsl(var(--muted-foreground)); line-height: 1; }

/* ── Bottom Row ──────────────────────────────────────────────────── */
.bottom-row { display: grid; grid-template-columns: 220px 1fr; gap: 14px; align-items: start; }
@media (max-width: 900px) { .bottom-row { grid-template-columns: 1fr; } }

.summary-card,
.tickets-card {
  border-radius: 18px; background: hsl(var(--card));
  border: 1px solid hsl(var(--border)/0.6); padding: 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.card-header-icon {
  width: 30px; height: 30px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.card-title { font-size: 13px; font-weight: 800; flex: 1; letter-spacing: -0.2px; }
.view-all-btn {
  font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px;
  background: rgba(91,94,244,0.1); color: #5b5ef4; transition: all 0.2s;
}
.view-all-btn:hover { background: rgba(91,94,244,0.18); transform: scale(1.04); }

/* Summary Grid */
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.summary-chip {
  display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px;
  background: color-mix(in srgb, var(--sc) 10%, hsl(var(--muted)/0.3));
  border: 1px solid color-mix(in srgb, var(--sc) 20%, transparent);
}
.summary-chip-icon  { color: var(--sc); flex-shrink: 0; }
.summary-chip-label { font-size: 10px; font-weight: 600; color: hsl(var(--muted-foreground)); }
.summary-chip-value { font-size: 16px; font-weight: 900; color: hsl(var(--foreground)); line-height: 1; font-family: 'JetBrains Mono', monospace; }

/* Tickets List */
.ticket-list { display: flex; flex-direction: column; gap: 3px; }
.ticket-row {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 12px; cursor: pointer;
  transition: background 0.12s, transform 0.2s cubic-bezier(0.34,1.4,0.64,1);
}
.ticket-row:hover  { background: hsl(var(--muted)/0.4); transform: translateX(2px); }
.ticket-row:active { transform: scale(0.98); }
.ticket-dot    { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ticket-info   { flex: 1; min-width: 0; }
.ticket-title    { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ticket-customer { font-size: 11px; color: hsl(var(--muted-foreground)); }
.ticket-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ticket-status-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.ticket-price { font-size: 12px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
.tickets-empty {
  display: flex; align-items: center; gap: 8px; padding: 24px;
  font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground)); justify-content: center;
}

@keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.animate-spin-slow { animation: spinSlow 4s linear infinite; }
</style>
