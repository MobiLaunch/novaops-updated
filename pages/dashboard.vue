<template>
  <div>

    <!-- ── Page header ─────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div>
        <p class="text-caption text-medium-emphasis mb-0">{{ greeting }}</p>
        <h1 class="text-h5 font-weight-black">Dashboard</h1>
      </div>
      <div class="d-flex align-center gap-2">
        <v-chip color="primary" variant="tonal" prepend-icon="mdi-calendar" size="small">
          {{ todayLabel }}
        </v-chip>
        <v-btn
          color="primary"
          size="small"
          prepend-icon="mdi-plus"
          @click="newTicketOpen = true"
        >New Ticket</v-btn>
      </div>
    </div>

    <!-- ── Weather / context banner ────────────────────────────── -->
    <v-alert
      v-if="weather.loaded"
      :color="bannerColor"
      variant="tonal"
      rounded="lg"
      class="mb-5"
      density="compact"
    >
      <template #prepend>
        <component :is="weatherIconComponent" :size="20" />
      </template>
      <span class="text-body-2 font-weight-medium">
        {{ weather.temp }}°F · {{ weather.description }} in {{ weather.location }} —
        <strong>{{ banner.suggestion }}</strong> {{ banner.emoji }}
      </span>
      <template #append>
        <span class="text-h6 font-weight-black">{{ weather.temp }}°</span>
      </template>
    </v-alert>
    <v-alert
      v-else-if="!weather.loading"
      color="surface-variant"
      variant="tonal"
      rounded="lg"
      class="mb-5"
      density="compact"
      style="cursor:pointer"
      @click="loadWeather"
    >
      <span class="text-body-2">Tap to load local weather ☕</span>
    </v-alert>

    <!-- ── Repair alerts ────────────────────────────────────────── -->
    <div v-if="warrantyExpiringSoon.length || waitingForParts.length" class="mb-5 d-flex flex-column gap-2">
      <v-alert
        v-for="t in warrantyExpiringSoon.slice(0,2)"
        :key="'w-'+t.id"
        type="warning"
        variant="tonal"
        density="compact"
        rounded="lg"
        closable
      >
        <strong>#{{ t.id }}</strong> — Warranty expiring in {{ warrantyDaysLeft(t) }} days · {{ t.device }}
      </v-alert>
      <v-alert
        v-for="t in waitingForParts.slice(0,2)"
        :key="'p-'+t.id"
        type="error"
        variant="tonal"
        density="compact"
        rounded="lg"
        closable
      >
        <strong>#{{ t.id }}</strong> — Waiting for parts · {{ t.device }}
      </v-alert>
    </div>

    <!-- ── KPI Cards ─────────────────────────────────────────────── -->
    <v-row dense class="mb-4">
      <!-- Revenue hero -->
      <v-col cols="12" md="4">
        <v-card
          color="success"
          variant="flat"
          rounded="xl"
          class="revenue-hero pa-5"
          style="cursor:pointer;min-height:140px"
          @click="navigateTo('/analytics')"
        >
          <div class="d-flex align-center justify-space-between mb-2">
            <v-icon color="white" size="28">mdi-currency-usd</v-icon>
            <v-chip color="white" variant="tonal" size="x-small" class="font-weight-bold">
              {{ completedTickets.length }} jobs
            </v-chip>
          </div>
          <div class="text-caption text-white" style="opacity:.75">Total Revenue</div>
          <div class="text-h4 font-weight-black text-white mt-1">{{ formatCurrency(totalRevenue) }}</div>
          <div class="text-caption text-white mt-2" style="opacity:.65">
            <v-icon size="14">mdi-trending-up</v-icon> View analytics →
          </div>
        </v-card>
      </v-col>

      <!-- Stat cards -->
      <v-col
        v-for="stat in kpiStats"
        :key="stat.label"
        cols="6"
        md="2"
      >
        <v-card
          rounded="xl"
          class="pa-4"
          style="cursor:pointer;height:100%"
          @click="navigateTo(stat.path)"
        >
          <div class="d-flex align-center justify-space-between mb-3">
            <v-avatar :color="stat.color" size="36" rounded="lg" variant="tonal">
              <v-icon :color="stat.color" size="18">{{ stat.icon }}</v-icon>
            </v-avatar>
            <v-chip
              v-if="stat.chip"
              :color="stat.chipColor"
              size="x-small"
              variant="tonal"
            >{{ stat.chip }}</v-chip>
          </div>
          <div class="text-h5 font-weight-black">{{ stat.value }}</div>
          <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Quick Actions ──────────────────────────────────────────── -->
    <div class="mb-6">
      <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3">Quick Actions</p>
      <v-row dense>
        <v-col
          v-for="action in quickActions"
          :key="action.label"
          cols="4"
          sm="2"
        >
          <v-card
            rounded="xl"
            class="pa-3 text-center action-tile"
            style="cursor:pointer"
            @click="action.onClick()"
          >
            <v-avatar
              :color="action.color"
              size="44"
              rounded="lg"
              class="mb-2"
            >
              <component :is="action.icon" :size="20" color="white" />
            </v-avatar>
            <div class="text-caption font-weight-bold text-truncate">{{ action.label }}</div>
            <div class="text-caption text-medium-emphasis text-truncate" style="font-size:10px">{{ action.sub }}</div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- ── Bottom row ─────────────────────────────────────────────── -->
    <v-row>

      <!-- Today summary -->
      <v-col cols="12" md="3">
        <v-card rounded="xl" class="pa-4" style="height:100%">
          <div class="d-flex align-center gap-2 mb-4">
            <v-avatar color="primary" size="30" rounded="lg" variant="tonal">
              <v-icon color="primary" size="16">mdi-trending-up</v-icon>
            </v-avatar>
            <span class="text-subtitle-2 font-weight-bold">Today</span>
          </div>
          <v-row dense>
            <v-col
              v-for="s in todaySummary"
              :key="s.label"
              cols="6"
            >
              <div
                class="pa-3 rounded-lg"
                :style="`background: ${s.color}12; border: 1px solid ${s.color}25`"
              >
                <v-icon :color="s.color" size="16" class="mb-1">{{ s.icon }}</v-icon>
                <div class="text-caption text-medium-emphasis" style="font-size:10px">{{ s.label }}</div>
                <div class="text-subtitle-2 font-weight-black">{{ s.value }}</div>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Recent tickets table -->
      <v-col cols="12" md="9">
        <v-card rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between pa-4 pb-0">
            <div class="d-flex align-center gap-2">
              <v-avatar color="warning" size="30" rounded="lg" variant="tonal">
                <v-icon color="warning" size="16">mdi-ticket-outline</v-icon>
              </v-avatar>
              <span class="text-subtitle-2 font-weight-bold">Recent Tickets</span>
            </div>
            <v-btn
              variant="tonal"
              color="primary"
              size="x-small"
              rounded="pill"
              @click="navigateTo('/bookings')"
            >View all</v-btn>
          </v-card-title>

          <v-data-table
            :headers="ticketHeaders"
            :items="recentTickets"
            :items-per-page="8"
            hide-default-footer
            density="comfortable"
          >
            <!-- ID column -->
            <template #item.id="{ item }">
              <span class="text-caption font-weight-bold text-primary">#{{ item.id }}</span>
            </template>

            <!-- Customer column -->
            <template #item.customerId="{ item }">
              <span class="text-body-2">{{ getCustomerName(item.customerId) }}</span>
            </template>

            <!-- Device column -->
            <template #item.device="{ item }">
              <span class="text-body-2">{{ item.device }} {{ item.deviceModel || '' }}</span>
            </template>

            <!-- Status column -->
            <template #item.status="{ item }">
              <v-chip
                :color="ticketStatusColor(item.status)"
                size="x-small"
                variant="tonal"
                rounded="pill"
              >
                <v-icon start size="8">mdi-circle</v-icon>
                {{ item.status }}
              </v-chip>
            </template>

            <!-- Price column -->
            <template #item.price="{ item }">
              <span class="text-body-2 font-weight-bold" :style="`color: ${ticketStatusColor(item.status)}`">
                {{ formatCurrency(item.price) }}
              </span>
            </template>

            <!-- Empty state -->
            <template #no-data>
              <div class="text-center py-8 text-medium-emphasis">
                <v-icon size="40" class="mb-2 opacity-30">mdi-ticket-outline</v-icon>
                <p class="text-body-2">No tickets yet — create your first one!</p>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- New Ticket Dialog -->
    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import {
  ShoppingCart, CalendarDays, Package, UserPlus, MessageCircle,
  ClipboardCheck, Sun, Cloud, CloudRain, CloudSnow,
  CloudDrizzle, CloudLightning, Snowflake,
} from 'lucide-vue-next'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
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
const navigateTo = (path: string) => router.push(path)

const newTicketOpen = ref(false)

onMounted(() => {
  if (!weather.value.loaded && !weather.value.loading) fetchWeather().catch(() => {})
})
const loadWeather = async () => { if (!weather.value.loaded) await fetchWeather() }

// Banner
const banner = computed(() =>
  weather.value.loaded
    ? getContextBanner(weather.value.temp, weather.value.conditionCode)
    : getContextBanner(68, 0)
)
const bannerColor = computed(() => {
  const t = weather.value.temp
  if (t <= 40) return 'info'
  if (t <= 65) return 'success'
  return 'warning'
})
const weatherIconComponent = computed(() => {
  const map: Record<string, any> = {
    'sun': Sun, 'cloud-sun': Cloud, 'cloud': Cloud,
    'cloud-rain': CloudRain, 'snowflake': Snowflake,
    'cloud-drizzle': CloudDrizzle, 'cloud-snow': CloudSnow,
    'cloud-lightning': CloudLightning,
  }
  return map[weather.value.icon || 'cloud'] || Cloud
})

// Computed data
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
  const end = new Date(new Date(t.warrantyStart).getTime() + (t.warrantyDays || 0) * 86400000)
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
}

const formatCurrency   = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const getCustomerName  = (id: number) => (customers.value || []).find((c: any) => c.id === id)?.name || 'Unknown'

const ticketStatusColor = (status: string) => ({
  'Open': 'info', 'In Progress': 'warning',
  'Waiting for Parts': 'error', 'Completed': 'success', 'Delivered': 'secondary',
}[status] || 'secondary')

// Greeting
const greeting   = computed(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' })
const todayLabel = computed(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))

// KPI stats
const kpiStats = computed(() => [
  {
    label: 'Active Tickets', value: activeTickets.value.length, icon: 'mdi-ticket-outline',
    color: '#3b82f6', path: '/bookings',
    chip: `${completedToday.value} today`, chipColor: 'success',
  },
  {
    label: 'Customers', value: (customers.value || []).length, icon: 'mdi-account-group-outline',
    color: '#8b5cf6', path: '/customers', chip: null, chipColor: '',
  },
  {
    label: 'Inventory', value: (inventory.value || []).length, icon: 'mdi-package-variant-closed',
    color: '#f59e0b', path: '/inventory',
    chip: lowStockItems.value > 0 ? `${lowStockItems.value} low` : 'Stocked',
    chipColor: lowStockItems.value > 0 ? 'warning' : 'success',
  },
  {
    label: 'Upcoming', value: upcomingAppointments.value, icon: 'mdi-calendar-clock',
    color: '#06b6d4', path: '/calendar', chip: null, chipColor: '',
  },
])

// Quick actions
const quickActions = computed(() => [
  { label: 'New Sale',  sub: 'POS',          color: '#ec4899', icon: ShoppingCart,   onClick: () => navigateTo('/pos') },
  { label: 'Schedule', sub: 'Calendar',      color: '#8b5cf6', icon: CalendarDays,   onClick: () => navigateTo('/calendar') },
  { label: 'Inventory',sub: 'Stock',         color: '#f59e0b', icon: Package,        onClick: () => navigateTo('/inventory') },
  { label: 'Bookings', sub: 'Repairs',       color: '#3b82f6', icon: ClipboardCheck, onClick: () => navigateTo('/bookings') },
  { label: 'Customers',sub: 'Clients',       color: '#06b6d4', icon: UserPlus,       onClick: () => navigateTo('/customers') },
  { label: 'Messages', sub: 'Email & chat',  color: '#10b981', icon: MessageCircle,  onClick: () => navigateTo('/messages') },
])

// Today summary
const todayRevenue = computed(() => {
  const today = new Date().toDateString()
  return (tickets.value || []).filter(t => t.price > 0 && (t.status === 'Completed' || t.status === 'Delivered') && t.updatedAt && new Date(t.updatedAt).toDateString() === today).reduce((a, t) => a + (t.price || 0), 0)
})
const todaySummary = computed(() => [
  { label: 'Revenue',   value: formatCurrency(todayRevenue.value), color: '#3b82f6', icon: 'mdi-currency-usd' },
  { label: 'Completed', value: String(completedToday.value),       color: '#10b981', icon: 'mdi-check-circle-outline' },
  { label: 'Active',    value: String(activeTickets.value.length), color: '#f97316', icon: 'mdi-ticket-outline' },
  { label: 'Scheduled', value: String(upcomingAppointments.value), color: '#8b5cf6', icon: 'mdi-calendar-check' },
])

// Ticket table headers
const ticketHeaders = [
  { title: '#',       key: 'id',         width: 60 },
  { title: 'Customer',key: 'customerId', minWidth: 140 },
  { title: 'Device',  key: 'device',     minWidth: 160 },
  { title: 'Status',  key: 'status',     width: 150 },
  { title: 'Price',   key: 'price',      width: 100, align: 'end' as const },
]

// Create ticket
const { addNotification } = useNotifications()
const { sendTicketEmail, sendInternalAlert } = useEmailNotifications()
const getCustomerPhone = (id: number) => (customers.value || []).find((c: any) => c.id === id)?.phone || ''

const handleCreateTicket = async (ticketData: any) => {
  const toastId = toast.loading('Creating ticket…')
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) {
      const nc = await appStore.createCustomer(ticketData.newCustomer)
      customerId = nc.id
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
.revenue-hero {
  background: linear-gradient(135deg, #059669, #10b981 60%, #34d399) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.revenue-hero:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(16,185,129,0.3) !important; }

.action-tile { transition: transform 0.25s cubic-bezier(0.34,1.5,0.64,1); }
.action-tile:hover { transform: translateY(-3px) scale(1.04); }
</style>
