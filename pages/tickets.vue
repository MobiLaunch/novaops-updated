<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ───────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
          <TicketCheck class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Tickets</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Manage and track repair tickets</p>
        </div>
      </div>
      <button
        class="m3-fab-btn flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-black text-white shadow-lg"
        style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 20px #f59e0b50"
        @click="newTicketOpen = true"
      >
        <Plus class="w-5 h-5" /> New Ticket
      </button>
    </div>

    <!-- ── Filters ────────────────────────────────────────────────── -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          v-model="searchQuery"
          placeholder="Search tickets…"
          class="w-full h-12 pl-11 pr-4 rounded-full text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all font-medium"
        />
      </div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="s in [null, ...statusList]"
          :key="s ?? 'all'"
          class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          :style="filterStatus === s
            ? 'background: #f59e0b24; color: #f59e0b; outline: 2px solid #f59e0b50; outline-offset: 0'
            : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
          @click="filterStatus = s"
        >{{ s ?? 'All Statuses' }}</button>
      </div>
    </div>

    <!-- ── Stat Cards ────────────────────────────────────────────── -->
    <div class="grid gap-3 grid-cols-2 md:grid-cols-4">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="m3-stat rounded-[28px] p-5 flex flex-col gap-3"
        :style="`background: ${stat.color}12; outline: 2px solid ${stat.color}28; outline-offset: 0`"
      >
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" :style="`background: ${stat.color}24`">
            <component :is="stat.icon" class="w-5 h-5" :style="`color: ${stat.color}`" />
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">{{ stat.label }}</p>
          <p class="text-3xl font-black" :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Tickets List — M3 Ticket Shape ───────────────────────── -->
    <div class="space-y-4">

      <!-- M3 specialty ticket cards -->
      <div
        v-for="ticket in filteredTickets"
        :key="ticket.id"
        class="m3-ticket-card cursor-pointer"
        @click="openTicket(ticket)"
      >
        <!-- Upper portion: Primary Container color -->
        <div
          class="px-6 pt-5 pb-4 rounded-t-[24px] flex items-start justify-between"
          :style="`background: ${ticketStatusColor(ticket.status)}14`"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2.5">
              <span class="text-lg font-black" :style="`color: ${ticketStatusColor(ticket.status)}`">#{{ ticket.id }}</span>
              <span
                class="text-[10px] font-black px-2.5 py-1 rounded-full"
                :style="`background: ${priorityColor(ticket.priority)}20; color: ${priorityColor(ticket.priority)}`"
              >{{ ticket.priority?.toUpperCase() }}</span>
            </div>
            <p class="text-sm font-bold text-foreground">{{ getCustomerName(ticket.customerId) }}</p>
            <div class="flex items-center gap-2 text-sm">
              <Smartphone class="h-3.5 w-3.5 text-muted-foreground" />
              <span class="font-semibold text-foreground">{{ ticket.device }} {{ ticket.deviceModel || '' }}</span>
            </div>
          </div>
          <span
            class="text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0 ml-4"
            :style="`background: ${ticketStatusColor(ticket.status)}24; color: ${ticketStatusColor(ticket.status)}`"
          >{{ ticket.status }}</span>
        </div>

        <!-- Ticket tear line with scalloped cutouts -->
        <div class="m3-tear-line relative flex items-center px-4 py-0" :style="`background: ${ticketStatusColor(ticket.status)}08`">
          <div class="m3-scallop-left" :style="`background: hsl(var(--background))`" />
          <div class="flex-1 border-t-2 border-dashed mx-6" :style="`border-color: ${ticketStatusColor(ticket.status)}40`" />
          <div class="m3-scallop-right" :style="`background: hsl(var(--background))`" />
        </div>

        <!-- Lower stub: Tertiary Container color -->
        <div
          class="px-6 py-4 rounded-b-[24px] flex items-center justify-between"
          :style="`background: ${ticketStatusColor(ticket.status)}08`"
        >
          <p class="text-sm text-muted-foreground font-medium line-clamp-1 flex-1">{{ ticket.issue }}</p>
          <div class="flex items-center gap-4 flex-shrink-0 ml-4">
            <span class="text-base font-black" :style="`color: ${ticketStatusColor(ticket.status)}`">
              {{ formatCurrency(ticket.price) }}
            </span>
            <span class="text-[10px] text-muted-foreground font-semibold">{{ formatDate(ticket.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredTickets.length === 0" class="rounded-[32px] py-20 flex flex-col items-center gap-4 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="w-20 h-20 rounded-[32px] flex items-center justify-center" style="background: #f59e0b14">
          <Inbox class="w-10 h-10" style="color: #f59e0b; opacity: 0.5" />
        </div>
        <div class="text-center">
          <h3 class="text-lg font-black mb-1">No tickets found</h3>
          <p class="text-sm text-muted-foreground font-medium">Get started by creating your first ticket</p>
        </div>
        <button
          class="m3-fab-btn flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black text-white mt-2"
          style="background: linear-gradient(135deg, #f59e0b, #d97706)"
          @click="newTicketOpen = true"
        >
          <Plus class="w-4 h-4" /> Create Ticket
        </button>
      </div>

    </div>

    <!-- Dialogs -->
    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />
    <TicketDetailDialog v-if="selectedTicket" v-model="detailOpen" :ticket="selectedTicket" @save="selectedTicket = null" @delete="handleDeleteTicket" />

  </div>
</template>

<script setup lang="ts">
import { Search, Plus, Smartphone, Inbox, Clock, CheckCircle, BarChart3, TicketCheck } from 'lucide-vue-next'
import type { Ticket } from '~/types'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import TicketDetailDialog from '~/components/TicketDetailDialog.vue'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { trackDevice } = appStore
const tickets  = computed(() => appStore.tickets ?? [])
const customers = computed(() => appStore.customers ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$', statuses: 'Open,In Progress,Completed' })
const { addNotification } = useNotifications()

const searchQuery  = ref('')
const filterStatus = ref<string | null>(null)
const newTicketOpen = ref(false)
const selectedTicket = ref<Ticket | null>(null)
const detailOpen = ref(false)

const statusList = computed(() => (settings.value?.statuses || 'Open,In Progress,Completed').split(',').map((s: string) => s.trim()))

const filteredTickets = computed(() =>
  tickets.value.filter(ticket => {
    const matchesSearch = !searchQuery.value ||
      ticket.device.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      ticket.issue.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      ticket.id.toString().includes(searchQuery.value) ||
      getCustomerName(ticket.customerId).toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !filterStatus.value || ticket.status === filterStatus.value
    return matchesSearch && matchesStatus
  }).sort((a, b) => (b.id || 0) - (a.id || 0))
)

const statCards = computed(() => [
  { label: 'Open',      value: getStatusCount('Open'),        color: '#3b82f6', icon: Inbox },
  { label: 'In Progress',value: getStatusCount('In Progress'), color: '#f59e0b', icon: Clock },
  { label: 'Completed', value: getStatusCount('Completed'),   color: '#10b981', icon: CheckCircle },
  { label: 'Total',     value: tickets.value.length,          color: '#8b5cf6', icon: BarChart3 },
])

const getStatusCount = (status: string) => tickets.value.filter(t => t.status === status).length
const formatCurrency = (amount: number) => `${settings.value?.currency || '$'}${(amount || 0).toFixed(2)}`
const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : 'N/A'
const getCustomerName = (customerId: number) => customers.value.find(c => c.id === customerId)?.name || 'Unknown'

const ticketStatusColor = (status: string) => ({
  'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316',
  'Completed': '#10b981', 'Delivered': '#64748b'
}[status] || '#64748b')

const priorityColor = (p: string) => ({ low: '#64748b', normal: '#3b82f6', high: '#ef4444' }[p] || '#64748b')

const openTicket = (ticket: Ticket) => { selectedTicket.value = { ...ticket }; detailOpen.value = true }

const handleDeleteTicket = async (ticket: Ticket) => {
  await appStore.deleteTicket(ticket.id)
  detailOpen.value = false
  selectedTicket.value = null
  addNotification('Ticket Deleted', `Ticket #${ticket.id} deleted`, 'success')
}

const handleCreateTicket = async (ticketData: any) => {
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) {
      const newCust = await appStore.createCustomer(ticketData.newCustomer)
      customerId = newCust.id
    }
    const ticket = await appStore.createTicket({ ...ticketData, customerId, status: 'Open', price: 0, services: [], parts: [], payments: [], notes: [], timeLog: [] })
    trackDevice(ticketData.device)
    addNotification('Ticket Created', `Ticket #${ticket.id} created successfully`, 'success')
    newTicketOpen.value = false
  } catch (err: any) {
    addNotification('Error', err.message || 'Failed to create ticket', 'error')
  }
}
</script>

<style scoped>
.m3-fab-btn {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-fab-btn:hover  { transform: scale(1.05) translateY(-2px); box-shadow: 0 8px 28px rgba(245,158,11,0.4) !important; }
.m3-fab-btn:active { transform: scale(0.92); }

.m3-stat {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-stat:hover  { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.m3-stat:active { transform: scale(0.96); }

/* M3 Ticket specialty card */
.m3-ticket-card {
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease;
  border-radius: 24px;
  overflow: hidden;
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
}
.m3-ticket-card:hover  { transform: scale(1.01) translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-ticket-card:active { transform: scale(0.98); }

/* Tear line with 12px radius scallops */
.m3-tear-line {
  height: 20px;
  position: relative;
  overflow: visible;
}
.m3-scallop-left,
.m3-scallop-right {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}
.m3-scallop-left  { left: -12px; }
.m3-scallop-right { right: -12px; }
</style>