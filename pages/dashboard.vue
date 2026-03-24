<template>
  <div class="dash-root">

    <!-- ── Context Banner ─────────────────────────────────────────── -->
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
          <p class="banner-message" v-else-if="weather.loading">Fetching your local weather…</p>
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

    <!-- ── Page Header ──────────────────────────────────────────────── -->
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

    <!-- ── Repair Alerts ────────────────────────────────────────────── -->
    <div v-if="warrantyExpiringSoon.length > 0 || waitingForParts.length > 0" class="alerts-row">
      <AppAlert
        v-for="t in warrantyExpiringSoon.slice(0,2)"
        :key="'w-' + t.id"
        status="warning"
        :title="`#${t.id} — Warranty expiring`"
        :description="`${warrantyDaysLeft(t)} days left · ${t.device || 'Device'}`"
        :inline="true"
        :dismissible="true"
      />
      <AppAlert
        v-for="t in waitingForParts.slice(0,2)"
        :key="'p-' + t.id"
        status="danger"
        :title="`#${t.id} — Waiting for parts`"
        :description="t.device || 'Device'"
        :inline="true"
        :dismissible="true"
      />
    </div>

    <!-- ── Stats Zone ───────────────────────────────────────────────── -->
    <div class="stats-zone">
      <div class="hero-card" @click="navigateTo('/analytics')">
        <div class="hero-bg-blob hero-bg-blob--1" />
        <div class="hero-bg-blob hero-bg-blob--2" />
        <div class="hero-content">
          <div class="hero-top">
            <div class="hero-icon-wrap">
              <Banknote class="w-6 h-6 text-white" />
            </div>
            <StatusChip variant="success" :show-dot="true" size="sm" class="hero-chip">
              {{ completedTickets.length }} jobs done
            </StatusChip>
          </div>
          <div class="hero-figures">
            <p class="hero-label">Total Revenue</p>
            <p class="hero-value">{{ formatCurrency(totalRevenue) }}</p>
          </div>
        </div>
        <div class="hero-trend">
          <TrendingUp class="w-4 h-4" />
          <span>View analytics →</span>
        </div>
      </div>

      <div class="secondary-stats">
        <div class="stat-card" style="--c: #3b82f6" @click="navigateTo('/bookings')">
          <div class="stat-card-header">
            <div class="stat-icon"><TicketCheck class="w-4 h-4" /></div>
            <StatusChip variant="info" size="sm">{{ completedToday }} today</StatusChip>
          </div>
          <p class="stat-value">{{ activeTickets.length }}</p>
          <p class="stat-label">Active Tickets</p>
        </div>
        <div class="stat-card" style="--c: #8b5cf6" @click="navigateTo('/customers')">
          <div class="stat-card-header">
            <div class="stat-icon"><Users class="w-4 h-4" /></div>
          </div>
          <p class="stat-value">{{ (customers || []).length }}</p>
          <p class="stat-label">Customers</p>
        </div>
        <div class="stat-card" style="--c: #f59e0b" @click="navigateTo('/inventory')">
          <div class="stat-card-header">
            <div class="stat-icon"><Box class="w-4 h-4" /></div>
            <StatusChip :variant="lowStockItems > 0 ? 'warning' : 'success'" size="sm">
              {{ lowStockItems > 0 ? `${lowStockItems} low` : 'Stocked' }}
            </StatusChip>
          </div>
          <p class="stat-value">{{ (inventory || []).length }}</p>
          <p class="stat-label">Inventory</p>
        </div>
        <div class="stat-card" style="--c: #06b6d4" @click="navigateTo('/calendar')">
          <div class="stat-card-header">
            <div class="stat-icon"><CalendarDays class="w-4 h-4" /></div>
          </div>
          <p class="stat-value">{{ upcomingAppointments }}</p>
          <p class="stat-label">Appointments</p>
        </div>
      </div>
    </div>

    <!-- ── Quick Actions ─────────────────────────────────────────────── -->
    <div class="section">
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

    <!-- ── Bottom Row ─────────────────────────────────────────────────── -->
    <div class="bottom-row">
      <div class="card">
        <div class="card-header">
          <div class="card-header-icon" style="background: #6366f118; color: #6366f1">
            <TrendingUp class="w-4 h-4" />
          </div>
          <h3 class="card-title">Today</h3>
        </div>
        <div class="summary-grid">
          <div v-for="s in todaySummary" :key="s.label" class="summary-chip" :style="`--sc: ${s.color}`">
            <component :is="s.icon" class="w-3.5 h-3.5 summary-chip-icon" />
            <div>
              <p class="summary-chip-label">{{ s.label }}</p>
              <p class="summary-chip-value">{{ s.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
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
            <div class="ticket-info">
              <p class="ticket-title">#{{ ticket.id }} — {{ ticket.device }}</p>
              <p class="ticket-customer">{{ getCustomerName(ticket.customerId) }}</p>
            </div>
            <div class="ticket-meta">
              <StatusChip :variant="ticketStatusVariant(ticket.status)" size="sm" :show-dot="true">
                {{ ticket.status }}
              </StatusChip>
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

    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />
    <ToastStack />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import {
  Banknote, TicketCheck, Users, Box,
  ShoppingCart, CalendarDays, Package, ClipboardCheck, UserPlus,
  DollarSign, TrendingUp, LayoutDashboard, MessageCircle,
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Snowflake,
} from 'lucide-vue-next'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import StatusChip from '~/components/ui/StatusChip.vue'
import AppAlert from '~/components/ui/AppAlert.vue'
import ToastStack from '~/components/ui/ToastStack.vue'
import { useToast } from '~/composables/useToast'
import { useWeather, getContextBanner } from '~/composables/useWeather'
import { useNotifications } from '~/composables/useNotifications'

definePageMeta({ middleware: ['auth'] })

const router   = useRouter()
const appStore = useAppStore()
const { customers, tickets, inventory, appointments, settings } = storeToRefs(appStore)
const { trackDevice } = appStore
const { weather, fetchWeather } = useWeather()
const { toast } = useToast()

const newTicketOpen = ref(false)
const navigateTo    = (path: string) => router.push(path)

onMounted(() => {
  if (!weather.value.loaded && !weather.value.loading) fetchWeather().catch(() => {})
})
const loadWeather = async () => { if (!weather.value.loaded) await fetchWeather() }

const banner = computed(() => weather.value.loaded ? getContextBanner(weather.value.temp, weather.value.conditionCode) : getContextBanner(68, 0))
const bannerVariant = computed(() => {
  const t = weather.value.temp
  if (!weather.value.loaded) return 'banner-neutral'
  if (t <= 40) return 'banner-cold'
  if (t <= 65) return 'banner-mild'
  return 'banner-warm'
})
const weatherIconComponent = computed(() => {
  const key = weather.value.icon || 'cloud'
  return ({ 'sun': Sun, 'cloud-sun': Cloud, 'cloud': Cloud, 'cloud-rain': CloudRain, 'snowflake': Snowflake, 'cloud-drizzle': CloudDrizzle, 'cloud-snow': CloudSnow, 'cloud-lightning': CloudLightning } as any)[key] || Cloud
})

const totalRevenue     = computed(() => (tickets.value || []).filter(t => t.price > 0 && (t.status === 'Completed' || t.status === 'Delivered')).reduce((a, t) => a + (t.price || 0), 0))
const activeTickets    = computed(() => (tickets.value || []).filter(t => t.status !== 'Closed' && t.status !== 'Delivered'))
const completedTickets = computed(() => (tickets.value || []).filter(t => t.status === 'Completed' || t.status === 'Delivered'))
const completedToday   = computed(() => {
  const today = new Date().toDateString()
  return (tickets.value || []).filter(t => (t.status === 'Completed' || t.status === 'Delivered') && t.updatedAt && new Date(t.updatedAt).toDateString() === today).length
})
const lowStockItems        = computed(() => (inventory.value || []).filter((i: any) => (i.itemType || 'product') !== 'service' && i.stock <= (i.low || 5)).length)
const upcomingAppointments = computed(() => (appointments.value || []).filter((a: any) => a.status === 'scheduled').length)
const recentTickets        = computed(() => [...(tickets.value || [])].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 8))
const waitingForParts      = computed(() => (tickets.value || []).filter(t => t.status === 'Waiting for Parts'))
const warrantyExpiringSoon = computed(() => {
  const now = new Date()
  return (tickets.value || [])
    .filter(t => (t.status === 'Completed' || t.status === 'Delivered') && t.warrantyDays > 0 && t.warrantyStart)
    .map(t => {
      const end = new Date(new Date(t.warrantyStart).getTime() + (t.warrantyDays || 0) * 86400000)
      return { ...t, _daysLeft: Math.ceil((end.getTime() - now.getTime()) / 86400000) }
    })
    .filter(t => t._daysLeft >= 0 && t._daysLeft <= 14)
    .sort((a, b) => a._daysLeft - b._daysLeft)
})
const warrantyDaysLeft = (t: any) => {
  if (!t.warrantyStart || !t.warrantyDays) return 0
  const end = new Date(new Date(t.warrantyStart).getTime() + (t.warrantyDays || 0) * 86400000)
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
}

const formatCurrency    = (amount: number) => `${settings.value?.currency || '$'}${(amount || 0).toFixed(2)}`
const getCustomerName   = (id: number) => (customers.value || []).find((c: any) => c.id === id)?.name || 'Unknown'
const ticketStatusColor = (status: string) => {
  const map: Record<string, string> = { 'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316', 'Completed': '#10b981', 'Delivered': '#64748b' }
  return map[status] || '#64748b'
}
const ticketStatusVariant = (status: string) => {
  const map: Record<string, string> = { 'Open': 'info', 'In Progress': 'warning', 'Waiting for Parts': 'danger', 'Completed': 'success', 'Delivered': 'muted' }
  return map[status] || 'muted'
}

const greeting   = computed(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' })
const todayLabel = computed(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))

const quickActions = computed(() => [
  { label: 'New Sale',  sub: 'POS transaction',            color: '#ec4899', colorDark: '#db2777', icon: ShoppingCart,   onClick: () => navigateTo('/pos') },
  { label: 'Schedule', sub: `${upcomingAppointments.value} upcoming`, color: '#8b5cf6', colorDark: '#7c3aed', icon: CalendarDays, onClick: () => navigateTo('/calendar') },
  { label: 'Inventory',sub: 'Manage stock',                color: '#f59e0b', colorDark: '#d97706', icon: Package,        onClick: () => navigateTo('/inventory') },
  { label: 'Bookings', sub: 'Repairs & House Calls',       color: '#3b82f6', colorDark: '#2563eb', icon: ClipboardCheck, onClick: () => navigateTo('/bookings') },
  { label: 'Customers',sub: 'Manage clients',              color: '#06b6d4', colorDark: '#0891b2', icon: UserPlus,       onClick: () => navigateTo('/customers') },
  { label: 'Messages', sub: 'Email & chat',                color: '#10b981', colorDark: '#059669', icon: MessageCircle,  onClick: () => navigateTo('/messages') },
])

const todayRevenue = computed(() => {
  const today = new Date().toDateString()
  return (tickets.value || []).filter(t => t.price > 0 && (t.status === 'Completed' || t.status === 'Delivered') && t.updatedAt && new Date(t.updatedAt).toDateString() === today).reduce((a, t) => a + (t.price || 0), 0)
})
const todaySummary = computed(() => [
  { label: 'Revenue',   value: formatCurrency(todayRevenue.value), color: '#3b82f6', icon: DollarSign },
  { label: 'Completed', value: String(completedToday.value),       color: '#10b981', icon: TicketCheck },
  { label: 'Active',    value: String(activeTickets.value.length), color: '#f97316', icon: TicketCheck },
  { label: 'Scheduled', value: String(upcomingAppointments.value), color: '#8b5cf6', icon: CalendarDays },
])

const { addNotification } = useNotifications()
const { sendTicketEmail, sendInternalAlert } = useEmailNotifications()
const getCustomerPhone = (id: number) => (customers.value || []).find((c: any) => c.id === id)?.phone || ''

const handleCreateTicket = async (ticketData: any) => {
  const toastId = toast.loading('Creating ticket…')
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) {
      const newCust = await appStore.createCustomer(ticketData.newCustomer)
      customerId = newCust.id
    }
    const ticket = await appStore.createTicket({ ...ticketData, customerId, status: 'Open', price: 0, services: [], parts: [], payments: [], notes: [], timeLog: [] })
    trackDevice(ticket.device)
    toast.dismiss(toastId)
    toast.success('Ticket Created', `Ticket #${ticket.id} created successfully`)
    newTicketOpen.value = false
    sendTicketEmail({ ...ticket, customerId }).catch(() => {})
    sendInternalAlert({ eventType: 'New Ticket', eventSummary: `Ticket #${ticket.id} created`, customerName: getCustomerName(customerId), customerPhone: getCustomerPhone(customerId), deviceName: ticketData.device || '', issueDescription: ticketData.issue || '', ticketNumber: String(ticket.id) }).catch(() => {})
  } catch (err: any) {
    toast.dismiss(toastId)
    toast.danger('Error', err.message || 'Failed to create ticket')
  }
}
</script>

<style scoped>
.dash-root { display: flex; flex-direction: column; gap: 20px; }

.context-banner {
  border-radius: 20px; padding: 16px 20px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; transition: all 0.4s ease; border: 1.5px solid transparent;
}
.banner-cold    { background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-color: #93c5fd50; color: #1e40af; }
.banner-mild    { background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-color: #6ee7b750; color: #065f46; }
.banner-warm    { background: linear-gradient(135deg, #fef3c7, #fde68a); border-color: #fcd34d50; color: #92400e; }
.banner-neutral { background: hsl(var(--muted)/0.4); border-color: hsl(var(--border)/0.4); }
.context-banner-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
.banner-weather-icon { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.banner-greeting  { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; margin-bottom: 2px; }
.banner-message   { font-size: 13px; font-weight: 600; line-height: 1.4; opacity: 0.9; }
.banner-message strong { font-weight: 900; }
.banner-tap { cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.banner-right { text-align: right; flex-shrink: 0; }
.banner-temp  { font-size: 28px; font-weight: 900; line-height: 1; }
.banner-feels { font-size: 11px; font-weight: 600; opacity: 0.6; }

.dash-header { display: flex; align-items: center; justify-content: space-between; }
.dash-header-icon {
  width: 40px; height: 40px; border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 14px #6366f140;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.dash-greeting { font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground)); margin-bottom: 1px; }
.dash-title    { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1; }
.dash-date {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground));
  background: hsl(var(--muted)/0.4); padding: 6px 12px; border-radius: 99px;
}

.alerts-row { display: flex; flex-direction: column; gap: 8px; }

.stats-zone { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 900px) { .stats-zone { grid-template-columns: 1fr; } }

.hero-card {
  position: relative; border-radius: 22px;
  background: linear-gradient(135deg, #059669, #10b981 60%, #34d399);
  padding: 22px; cursor: pointer; overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
  display: flex; flex-direction: column; justify-content: space-between; min-height: 160px;
}
.hero-card:hover  { transform: scale(1.02) translateY(-3px); box-shadow: 0 16px 40px #10b98140; }
.hero-card:active { transform: scale(0.97); }
.hero-bg-blob { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.08); pointer-events: none; }
.hero-bg-blob--1 { width: 160px; height: 160px; top: -40px; right: -30px; }
.hero-bg-blob--2 { width: 80px; height: 80px; bottom: 10px; left: 20px; }
.hero-content { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
.hero-top     { display: flex; align-items: center; justify-content: space-between; }
.hero-icon-wrap {
  width: 42px; height: 42px; border-radius: 14px;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
}
.hero-chip { background: rgba(255,255,255,0.25) !important; color: white !important; border-color: rgba(255,255,255,0.3) !important; }
.hero-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.75); margin-bottom: 4px; }
.hero-value { font-size: 30px; font-weight: 900; color: white; line-height: 1; letter-spacing: -1px; }
.hero-figures { position: relative; z-index: 1; }
.hero-trend {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.65);
  position: relative; z-index: 1;
}

.secondary-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-card {
  border-radius: 18px; background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border)/0.7);
  padding: 14px 16px; cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.2s;
  display: flex; flex-direction: column; gap: 6px;
  position: relative; overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2.5px; background: var(--c); opacity: 0.5;
}
.stat-card:hover  { transform: translateY(-3px) scale(1.02); border-color: color-mix(in srgb, var(--c) 35%, transparent); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.stat-card:active { transform: scale(0.97); }
.stat-card-header { display: flex; align-items: center; justify-content: space-between; }
.stat-icon {
  width: 28px; height: 28px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c);
}
.stat-value { font-size: 24px; font-weight: 900; color: hsl(var(--foreground)); line-height: 1; }
.stat-label { font-size: 11px; font-weight: 600; color: hsl(var(--muted-foreground)); }

.section { display: flex; flex-direction: column; gap: 10px; }
.section-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: hsl(var(--muted-foreground)); }

.quick-actions-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
@media (max-width: 1200px) { .quick-actions-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 640px)  { .quick-actions-grid { grid-template-columns: repeat(3, 1fr); } }
.action-tile {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 16px 8px; border-radius: 18px;
  background: color-mix(in srgb, var(--ac) 7%, hsl(var(--card)));
  border: 1.5px solid color-mix(in srgb, var(--ac) 20%, transparent);
  cursor: pointer; text-align: center;
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
}
.action-tile:hover  { transform: scale(1.06) translateY(-4px); box-shadow: 0 10px 28px rgba(0,0,0,0.1); }
.action-tile:active { transform: scale(0.93); }
.action-icon { width: 46px; height: 46px; border-radius: 15px; display: flex; align-items: center; justify-content: center; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.action-tile:hover .action-icon { transform: scale(1.1) rotate(-4deg); }
.action-label { font-size: 12px; font-weight: 800; color: hsl(var(--foreground)); line-height: 1; }
.action-sub   { font-size: 10px; font-weight: 600; color: hsl(var(--muted-foreground)); line-height: 1.2; }

.bottom-row { display: grid; grid-template-columns: 240px 1fr; gap: 14px; align-items: start; }
@media (max-width: 900px) { .bottom-row { grid-template-columns: 1fr; } }

.card { border-radius: 20px; background: hsl(var(--card)); border: 1.5px solid hsl(var(--border)/0.7); padding: 18px; }
.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.card-header-icon { width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-title { font-size: 13px; font-weight: 800; flex: 1; }
.view-all-btn { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; background: #6366f112; color: #6366f1; transition: all 0.2s; }
.view-all-btn:hover { background: #6366f120; transform: scale(1.04); }

.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.summary-chip { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 13px; background: color-mix(in srgb, var(--sc) 10%, hsl(var(--muted)/0.3)); border: 1px solid color-mix(in srgb, var(--sc) 20%, transparent); }
.summary-chip-icon  { color: var(--sc); flex-shrink: 0; }
.summary-chip-label { font-size: 10px; font-weight: 600; color: hsl(var(--muted-foreground)); }
.summary-chip-value { font-size: 15px; font-weight: 900; color: hsl(var(--foreground)); line-height: 1; }

.ticket-list { display: flex; flex-direction: column; gap: 3px; }
.ticket-row { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-radius: 13px; cursor: pointer; transition: background 0.15s, transform 0.25s cubic-bezier(0.34,1.4,0.64,1); }
.ticket-row:hover  { background: hsl(var(--muted)/0.35); transform: translateX(2px); }
.ticket-row:active { transform: scale(0.99); }
.ticket-info   { flex: 1; min-width: 0; }
.ticket-title    { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ticket-customer { font-size: 11px; color: hsl(var(--muted-foreground)); }
.ticket-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ticket-price { font-size: 12px; font-weight: 800; }
.tickets-empty { display: flex; align-items: center; gap: 8px; padding: 24px; font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground)); justify-content: center; }

@keyframes spinSlow { to { transform: rotate(360deg); } }
.animate-spin-slow { animation: spinSlow 4s linear infinite; }
</style>

