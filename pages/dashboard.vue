<template>
  <div class="page-shell">

    <header class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs text-muted-foreground m-0 mb-0.5">{{ greeting }}</p>
        <h1 class="text-xl font-black m-0">Dashboard</h1>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
          <i class="mdi mdi-calendar"></i> {{ todayLabel }}
        </span>
        <span v-if="lastSyncedLabel" class="text-[10px] text-muted-foreground flex items-center gap-1 opacity-60">
          <i class="mdi mdi-sync"></i> {{ lastSyncedLabel }}
        </span>
        <Button label="New Ticket" size="small" class="font-bold text-none" @click="newTicketOpen = true">
          <i class="mdi mdi-plus mr-1"></i>
        </Button>
      </div>
    </header>

    <Message
      v-if="weather.loaded"
      :severity="bannerSeverity"
      :closable="false"
      class="text-sm"
    >
      <span class="flex items-center justify-between gap-4 w-full flex-wrap">
        <span>
          <i class="mdi mr-2" :class="weatherIcon"></i>
          {{ weather.temp }}°F · {{ weather.description }} in {{ weather.location }} —
          <strong>{{ banner.suggestion }}</strong> {{ banner.emoji }}
        </span>
        <span class="text-2xl font-black">{{ weather.temp }}°</span>
      </span>
    </Message>
    <div
      v-else-if="!weather.loading"
      class="p-3 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground cursor-pointer text-center"
      @click="loadWeather"
    >
      Tap to load local weather
    </div>

    <div v-if="warrantyExpiringSoon.length || waitingForParts.length" class="flex flex-col gap-2">
      <Message
        v-for="t in warrantyExpiringSoon.slice(0, 2)"
        :key="'w-' + t.id"
        severity="warn"
        :closable="true"
        class="text-sm"
      >
        <strong>#{{ t.id }}</strong> — Warranty expiring in {{ warrantyDaysLeft(t) }} days · {{ t.device }}
      </Message>
      <Message
        v-for="t in waitingForParts.slice(0, 2)"
        :key="'p-' + t.id"
        severity="error"
        :closable="true"
        class="text-sm"
      >
        <strong>#{{ t.id }}</strong> — Waiting for parts · {{ t.device }}
      </Message>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-12 gap-3">
      <div
        class="col-span-2 md:col-span-4 revenue-hero rounded-xl p-5 text-white cursor-pointer min-h-[140px] flex flex-col"
        @click="navigateTo('/analytics')"
      >
        <div class="flex items-center justify-between mb-2">
          <i class="mdi mdi-currency-usd text-3xl"></i>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">{{ completedTickets.length }} jobs</span>
        </div>
        <div class="text-xs opacity-75">Total Revenue</div>
        <div class="text-3xl font-black mt-1">{{ formatCurrency(totalRevenue) }}</div>
        <div class="text-xs mt-2 opacity-65 flex items-center gap-1">
          <i class="mdi mdi-trending-up text-sm"></i> View analytics →
        </div>
      </div>

      <div
        v-for="stat in kpiStats"
        :key="stat.label"
        class="col-span-1 md:col-span-2 bg-surface border border-border rounded-xl p-4 cursor-pointer h-full hover:shadow-md transition-shadow"
        @click="navigateTo(stat.path)"
      >
        <div class="flex items-center justify-between mb-3">
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center"
            :style="{ backgroundColor: stat.color + '18', color: stat.color }"
          >
            <i class="mdi text-lg" :class="stat.icon"></i>
          </div>
          <Tag
            v-if="stat.chip"
            :value="stat.chip"
            :severity="stat.chipColor === 'warning' ? 'warn' : stat.chipColor === 'success' ? 'success' : 'secondary'"
            class="text-[9px]"
          />
        </div>
        <div class="text-2xl font-black">{{ stat.value }}</div>
        <div class="text-xs text-muted-foreground">{{ stat.label }}</div>
      </div>
    </div>

    <div>
      <p class="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
      <div class="tile-grid">
        <button
          v-for="action in quickActions"
          :key="action.label"
          type="button"
          class="bg-surface border border-border rounded-xl p-3 text-center action-tile min-h-[5.5rem]"
          @click="action.onClick()"
        >
          <div
            class="w-11 h-11 rounded-lg flex items-center justify-center text-white mx-auto mb-2"
            :style="{ backgroundColor: action.color }"
          >
            <i class="mdi text-xl" :class="action.icon"></i>
          </div>
          <div class="text-xs font-bold truncate">{{ action.label }}</div>
          <div class="text-[10px] text-muted-foreground truncate">{{ action.sub }}</div>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div class="md:col-span-3 bg-surface border border-border rounded-xl p-4 h-full">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <i class="mdi mdi-trending-up"></i>
          </div>
          <span class="text-sm font-bold">Today</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="s in todaySummary"
            :key="s.label"
            class="p-3 rounded-lg"
            :style="`background: ${s.color}12; border: 1px solid ${s.color}25`"
          >
            <i class="mdi mb-1" :class="s.icon" :style="{ color: s.color }"></i>
            <div class="text-[10px] text-muted-foreground">{{ s.label }}</div>
            <div class="text-sm font-black">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <div class="md:col-span-9 bg-surface border border-border rounded-xl overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-border">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <i class="mdi mdi-ticket-outline"></i>
            </div>
            <span class="text-sm font-bold">Recent Tickets</span>
          </div>
          <Button label="View all" size="small" variant="outlined" class="text-none text-xs" @click="navigateTo('/bookings')" />
        </div>

        <DataTable
          :value="recentTickets"
          :rows="8"
          class="text-sm"
          :pt="{ table: { class: 'w-full' } }"
        >
          <Column field="id" header="#" style="width: 4rem">
            <template #body="{ data }">
              <span class="text-xs font-bold text-primary">#{{ data.id }}</span>
            </template>
          </Column>
          <Column field="customerId" header="Customer">
            <template #body="{ data }">
              {{ getCustomerName(data.customerId) }}
            </template>
          </Column>
          <Column field="device" header="Device">
            <template #body="{ data }">
              {{ data.device }} {{ data.deviceModel || '' }}
            </template>
          </Column>
          <Column field="status" header="Status" style="width: 9rem">
            <template #body="{ data }">
              <div class="flex items-center gap-2 flex-wrap">
                <Tag
                  :value="data.status"
                  :severity="statusSeverity(data.status)"
                  class="text-[10px]"
                />
                <Tag
                  v-if="ticketAge(data) >= 3 && data.status !== 'Completed' && data.status !== 'Delivered'"
                  :value="`${ticketAge(data)}d`"
                  :severity="ticketAge(data) >= 7 ? 'danger' : 'warn'"
                  class="text-[10px]"
                />
              </div>
            </template>
          </Column>
          <Column field="price" header="Price" style="width: 6rem">
            <template #body="{ data }">
              <span class="font-bold" :style="{ color: ticketStatusColor(data.status) }">
                {{ formatCurrency(data.price) }}
              </span>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-10 text-muted-foreground">
              <i class="mdi mdi-ticket-outline text-5xl opacity-30 block mb-2"></i>
              <p class="text-sm m-0">No tickets yet — create your first one!</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import { useToast } from '~/composables/useToast'
import { useWeather, getContextBanner } from '~/composables/useWeather'
import { useNotifications } from '~/composables/useNotifications'

definePageMeta({ middleware: ['auth'] })

const router = useRouter()
const appStore = useAppStore()
const { customers, tickets, inventory, appointments, settings } = storeToRefs(appStore)
const { trackDevice } = appStore
const { weather, fetchWeather } = useWeather()
const { toast } = useToast()
const navigateTo = (path: string) => router.push(path)

const newTicketOpen = ref(false)
const lastSynced = ref<Date | null>(null)

onMounted(() => {
  if (!weather.value.loaded && !weather.value.loading) fetchWeather().catch(() => {})
  lastSynced.value = new Date()
})
const loadWeather = async () => {
  if (!weather.value.loaded) await fetchWeather()
}

const banner = computed(() =>
  weather.value.loaded
    ? getContextBanner(weather.value.temp, weather.value.conditionCode)
    : getContextBanner(68, 0),
)
const bannerSeverity = computed(() => {
  const t = weather.value.temp
  if (t <= 40) return 'info'
  if (t <= 65) return 'success'
  return 'warn'
})
const weatherIcon = computed(() => {
  const map: Record<string, string> = {
    sun: 'mdi-weather-sunny',
    'cloud-sun': 'mdi-weather-partly-cloudy',
    cloud: 'mdi-weather-cloudy',
    'cloud-rain': 'mdi-weather-rainy',
    snowflake: 'mdi-snowflake',
    'cloud-drizzle': 'mdi-weather-rainy',
    'cloud-snow': 'mdi-weather-snowy',
    'cloud-lightning': 'mdi-weather-lightning',
  }
  return map[weather.value.icon || 'cloud'] || 'mdi-weather-cloudy'
})

const totalRevenue = computed(() =>
  (tickets.value || [])
    .filter((t) => t.price > 0 && (t.status === 'Completed' || t.status === 'Delivered'))
    .reduce((a, t) => a + (t.price || 0), 0),
)
const activeTickets = computed(() =>
  (tickets.value || []).filter((t) => t.status !== 'Closed' && t.status !== 'Delivered'),
)
const completedTickets = computed(() =>
  (tickets.value || []).filter((t) => t.status === 'Completed' || t.status === 'Delivered'),
)
const completedToday = computed(() => {
  const today = new Date().toDateString()
  return (tickets.value || []).filter(
    (t) =>
      (t.status === 'Completed' || t.status === 'Delivered') &&
      t.updatedAt &&
      new Date(t.updatedAt).toDateString() === today,
  ).length
})
const lowStockItems = computed(() =>
  (inventory.value || []).filter(
    (i: any) => (i.itemType || 'product') !== 'service' && i.stock <= (i.low || 5),
  ).length,
)
const upcomingAppointments = computed(() =>
  (appointments.value || []).filter((a: any) => a.status === 'scheduled').length,
)
const recentTickets = computed(() =>
  [...(tickets.value || [])].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 8),
)
const waitingForParts = computed(() =>
  (tickets.value || []).filter((t) => t.status === 'Waiting for Parts'),
)
const ticketAge = (t: any) => {
  if (!t.createdAt) return 0
  return Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000)
}
const lastSyncedLabel = computed(() => {
  if (!lastSynced.value) return ''
  const diff = Math.floor((Date.now() - lastSynced.value.getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
})
const warrantyExpiringSoon = computed(() => {
  const now = new Date()
  return (tickets.value || [])
    .filter(
      (t) =>
        (t.status === 'Completed' || t.status === 'Delivered') &&
        t.warrantyDays > 0 &&
        t.warrantyStart,
    )
    .map((t) => {
      const end = new Date(
        new Date(t.warrantyStart).getTime() + (t.warrantyDays || 0) * 86400000,
      )
      return { ...t, _daysLeft: Math.ceil((end.getTime() - now.getTime()) / 86400000) }
    })
    .filter((t) => t._daysLeft >= 0 && t._daysLeft <= 14)
    .sort((a, b) => a._daysLeft - b._daysLeft)
})
const warrantyDaysLeft = (t: any) => {
  const end = new Date(
    new Date(t.warrantyStart).getTime() + (t.warrantyDays || 0) * 86400000,
  )
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
}

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const getCustomerName = (id: number) =>
  (customers.value || []).find((c: any) => c.id === id)?.name || 'Unknown'

const ticketStatusColor = (status: string) =>
  ({
    Open: '#3b82f6',
    'In Progress': '#f59e0b',
    'Waiting for Parts': '#ef4444',
    Completed: '#10b981',
    Delivered: '#64748b',
  })[status] || '#64748b'

const statusSeverity = (status: string) =>
  ({
    Open: 'info',
    'In Progress': 'warn',
    'Waiting for Parts': 'danger',
    Completed: 'success',
    Delivered: 'secondary',
  })[status] || 'secondary'

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
})
const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
)

const kpiStats = computed(() => [
  {
    label: 'Active Tickets',
    value: activeTickets.value.length,
    icon: 'mdi-ticket-outline',
    color: '#3b82f6',
    path: '/bookings',
    chip: `${completedToday.value} today`,
    chipColor: 'success',
  },
  {
    label: 'Customers',
    value: (customers.value || []).length,
    icon: 'mdi-account-group-outline',
    color: '#8b5cf6',
    path: '/customers',
    chip: null,
    chipColor: '',
  },
  {
    label: 'Inventory',
    value: (inventory.value || []).length,
    icon: 'mdi-package-variant-closed',
    color: '#f59e0b',
    path: '/inventory',
    chip: lowStockItems.value > 0 ? `${lowStockItems.value} low` : 'Stocked',
    chipColor: lowStockItems.value > 0 ? 'warning' : 'success',
  },
  {
    label: 'Upcoming',
    value: upcomingAppointments.value,
    icon: 'mdi-calendar-clock',
    color: '#06b6d4',
    path: '/bookings',
    chip: null,
    chipColor: '',
  },
])

const quickActions = computed(() => [
  {
    label: 'New Sale',
    sub: 'POS',
    color: '#ec4899',
    icon: 'mdi-cart-outline',
    onClick: () => navigateTo('/pos'),
  },
  {
    label: 'Schedule',
    sub: 'Calendar',
    color: '#8b5cf6',
    icon: 'mdi-calendar',
    onClick: () => navigateTo('/bookings'),
  },
  {
    label: 'Inventory',
    sub: 'Stock',
    color: '#f59e0b',
    icon: 'mdi-package-variant-closed',
    onClick: () => navigateTo('/inventory'),
  },
  {
    label: 'Bookings',
    sub: 'Repairs',
    color: '#3b82f6',
    icon: 'mdi-clipboard-check-outline',
    onClick: () => navigateTo('/bookings'),
  },
  {
    label: 'Customers',
    sub: 'Clients',
    color: '#06b6d4',
    icon: 'mdi-account-plus-outline',
    onClick: () => navigateTo('/customers'),
  },
  {
    label: 'Trade-In',
    sub: 'Quotes',
    color: '#f59e0b',
    icon: 'mdi-swap-horizontal',
    onClick: () => navigateTo('/inventory'),
  },
])

const todayRevenue = computed(() => {
  const today = new Date().toDateString()
  return (tickets.value || [])
    .filter(
      (t) =>
        t.price > 0 &&
        (t.status === 'Completed' || t.status === 'Delivered') &&
        t.updatedAt &&
        new Date(t.updatedAt).toDateString() === today,
    )
    .reduce((a, t) => a + (t.price || 0), 0)
})
const todaySummary = computed(() => [
  {
    label: 'Revenue',
    value: formatCurrency(todayRevenue.value),
    color: '#3b82f6',
    icon: 'mdi-currency-usd',
  },
  {
    label: 'Completed',
    value: String(completedToday.value),
    color: '#10b981',
    icon: 'mdi-check-circle-outline',
  },
  {
    label: 'Active',
    value: String(activeTickets.value.length),
    color: '#f97316',
    icon: 'mdi-ticket-outline',
  },
  {
    label: 'Scheduled',
    value: String(upcomingAppointments.value),
    color: '#8b5cf6',
    icon: 'mdi-calendar-check',
  },
])

const { addNotification } = useNotifications()
const { sendTicketEmail, sendInternalAlert } = useEmailNotifications()
const getCustomerPhone = (id: number) =>
  (customers.value || []).find((c: any) => c.id === id)?.phone || ''

const handleCreateTicket = async (ticketData: any) => {
  const toastId = toast.loading('Creating ticket…')
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) {
      const nc = await appStore.createCustomer(ticketData.newCustomer)
      customerId = nc.id
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
    toast.dismiss(toastId)
    toast.success('Ticket Created', `Ticket #${ticket.id} created successfully`)
    newTicketOpen.value = false
    sendTicketEmail({ ...ticket, customerId }).catch(() => {})
    sendInternalAlert({
      eventType: 'New Ticket',
      eventSummary: `Ticket #${ticket.id} created`,
      customerName: getCustomerName(customerId),
      customerPhone: getCustomerPhone(customerId),
      deviceName: ticketData.device || '',
      issueDescription: ticketData.issue || '',
      ticketNumber: String(ticket.id),
    }).catch(() => {})
  } catch (err: any) {
    toast.dismiss(toastId)
    toast.danger('Error', err.message || 'Failed to create ticket')
  }
}
</script>

<style scoped>
.revenue-hero {
  background: linear-gradient(135deg, #059669, #10b981 60%, #34d399);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.revenue-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.3);
}
.action-tile {
  transition: transform 0.25s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.action-tile:hover {
  transform: translateY(-3px) scale(1.04);
}
</style>
