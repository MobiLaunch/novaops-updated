<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ───────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #6366f118">
          <LayoutDashboard class="w-5 h-5" style="color: #6366f1" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p class="text-xs text-muted-foreground mt-0.5">Welcome back — here's what's happening today.</p>
        </div>
      </div>
      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
        @click="newTicketOpen = true"
      >
        <Wrench class="w-4 h-4" /> New Repair
      </button>
    </div>

    <!-- ── Stat Cards ────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <!-- Revenue -->
      <div class="rounded-3xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" style="background: #10b98112; outline: 1px solid #10b98125">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #10b98120">
            <Banknote class="w-4 h-4" style="color: #10b981" />
          </div>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" style="background: #10b98120; color: #10b981">+12.5%</span>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Total Revenue</p>
          <p class="text-2xl font-bold" style="color: #10b981">{{ formatCurrency(totalRevenue) }}</p>
          <p class="text-[10px] text-muted-foreground mt-0.5">{{ completedTickets.length }} completed</p>
        </div>
      </div>

      <!-- Active Tickets -->
      <div class="rounded-3xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" style="background: #3b82f612; outline: 1px solid #3b82f625" @click="navigateTo('/tickets')">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #3b82f620">
            <TicketCheck class="w-4 h-4" style="color: #3b82f6" />
          </div>
          <span class="text-2xl font-bold" style="color: #3b82f6">{{ activeTickets.length }}</span>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Active Tickets</p>
          <p class="text-[10px] text-muted-foreground mt-0.5">{{ completedToday }} completed today</p>
        </div>
      </div>

      <!-- Customers -->
      <div class="rounded-3xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" style="background: #8b5cf612; outline: 1px solid #8b5cf625" @click="navigateTo('/customers')">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #8b5cf620">
            <Users class="w-4 h-4" style="color: #8b5cf6" />
          </div>
          <span class="text-2xl font-bold" style="color: #8b5cf6">{{ (customers || []).length }}</span>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Total Customers</p>
          <p class="text-[10px] text-muted-foreground mt-0.5">Lifetime value tracked</p>
        </div>
      </div>

      <!-- Weather -->
      <div class="rounded-3xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" style="background: #06b6d412; outline: 1px solid #06b6d425" @click="loadWeather">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #06b6d420">
            <component :is="weather.loaded ? Sun : Cloud" class="w-4 h-4" :class="{ 'animate-pulse': weather.loading }" style="color: #06b6d4" />
          </div>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{{ weather.location || 'Local' }}</p>
          <p class="text-2xl font-bold" style="color: #06b6d4">{{ weather.loaded ? weather.temp + '°' : '--°' }}</p>
          <p class="text-[10px] text-muted-foreground mt-0.5">{{ weather.description || 'Tap to load' }}</p>
        </div>
      </div>

      <!-- Inventory -->
      <div class="rounded-3xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" style="background: #f59e0b12; outline: 1px solid #f59e0b25" @click="navigateTo('/inventory')">
        <div class="flex items-center justify-between">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #f59e0b20">
            <Box class="w-4 h-4" style="color: #f59e0b" />
          </div>
          <span class="text-2xl font-bold" style="color: #f59e0b">{{ (inventory || []).length }}</span>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Inventory Items</p>
          <p class="text-[10px] font-medium mt-0.5" :style="lowStockItems > 0 ? 'color: #f59e0b' : 'color: #10b981'">
            {{ lowStockItems > 0 ? `${lowStockItems} low stock` : 'All stocked' }}
          </p>
        </div>
      </div>
    </div>

    <!-- ── Quick Actions ─────────────────────────────────────────── -->
    <div>
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          v-for="action in quickActions"
          :key="action.label"
          class="rounded-3xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md text-center group"
          :style="`background: ${action.color}0e; outline: 1px solid ${action.color}25`"
          @click="action.onClick()"
        >
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
            :style="`background: linear-gradient(135deg, ${action.color} 0%, ${action.colorDark} 100%)`"
          >
            <component :is="action.icon" class="w-6 h-6 text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold">{{ action.label }}</p>
            <p class="text-xs text-muted-foreground">{{ action.sub }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- ── Bottom Row ───────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Today's Summary -->
      <div class="rounded-3xl p-5 bg-card" style="outline: 1px solid hsl(var(--border))">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-7 h-7 rounded-xl flex items-center justify-center" style="background: #6366f118">
            <TrendingUp class="w-3.5 h-3.5" style="color: #6366f1" />
          </div>
          <h3 class="text-sm font-semibold">Today's Summary</h3>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="s in todaySummary" :key="s.label" class="rounded-2xl p-3" :style="`background: ${s.color}12; outline: 1px solid ${s.color}20`">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-6 h-6 rounded-lg flex items-center justify-center" :style="`background: ${s.color}20`">
                <component :is="s.icon" class="w-3 h-3" :style="`color: ${s.color}`" />
              </div>
              <p class="text-xs text-muted-foreground">{{ s.label }}</p>
            </div>
            <p class="text-lg font-bold" :style="`color: ${s.color}`">{{ s.value }}</p>
          </div>
        </div>
      </div>

      <!-- Recent Tickets -->
      <div class="lg:col-span-2 rounded-3xl p-5 bg-card" style="outline: 1px solid hsl(var(--border))">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-xl flex items-center justify-center" style="background: #f59e0b18">
              <TicketCheck class="w-3.5 h-3.5" style="color: #f59e0b" />
            </div>
            <h3 class="text-sm font-semibold">Recent Tickets</h3>
          </div>
          <button
            class="text-xs font-medium px-3 py-1.5 rounded-2xl transition-all hover:scale-[1.02]"
            style="background: #6366f112; color: #6366f1"
            @click="navigateTo('/tickets')"
          >View all →</button>
        </div>
        <div class="space-y-2">
          <div
            v-for="ticket in recentTickets"
            :key="ticket.id"
            class="flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all hover:shadow-sm cursor-pointer group"
            style="background: hsl(var(--muted)/0.3)"
            @click="navigateTo('/tickets')"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: #6366f115">
                <span class="text-xs font-bold" style="color: #6366f1">#{{ ticket.id }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium truncate">{{ ticket.device }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ getCustomerName(ticket.customerId) }}</p>
              </div>
            </div>
            <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" :style="`background: ${ticketStatusColor(ticket.status)}18; color: ${ticketStatusColor(ticket.status)}`">
              {{ ticket.status }}
            </span>
          </div>
          <div v-if="recentTickets.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div class="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center" style="background: #f59e0b12">
              <TicketCheck class="w-6 h-6" style="color: #f59e0b" />
            </div>
            <p class="text-sm">No tickets yet</p>
            <button class="mt-3 text-xs font-semibold px-4 py-2 rounded-2xl" style="background: #6366f112; color: #6366f1" @click="newTicketOpen = true">Create first ticket</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── New Repair Dialog ──────────────────────────────────── -->
    <Dialog v-model:open="newTicketOpen">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #6366f108">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #6366f120">
            <Wrench class="w-4 h-4" style="color: #6366f1" />
          </div>
          <div>
            <h2 class="font-semibold text-base">Create New Repair</h2>
            <p class="text-xs text-muted-foreground mt-0.5">Fill in the repair details</p>
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer *</label>
            <Select :model-value="newTicket.customerId ? String(newTicket.customerId) : ''" @update:model-value="(val) => newTicket.customerId = val ? parseInt(val) : null">
              <SelectTrigger class="rounded-2xl h-11 border-0 bg-muted/50">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent class="rounded-2xl">
                <SelectItem v-for="customer in customers" :key="customer.id" :value="String(customer.id)" class="rounded-xl">
                  {{ customer.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Device *</label>
            <input v-model="newTicket.device" placeholder="e.g., iPhone 14 Pro" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-indigo-500/30 text-foreground" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue *</label>
            <Textarea v-model="newTicket.issue" placeholder="Describe the problem" :rows="3" class="rounded-2xl border-0 bg-muted/50 resize-none" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</label>
            <div class="flex gap-2">
              <button v-for="p in ['low','normal','high']" :key="p"
                class="px-3 py-1.5 rounded-2xl text-xs font-semibold capitalize transition-all"
                :style="newTicket.priority === p ? `background: ${priorityColor(p)}22; color: ${priorityColor(p)}; outline: 1.5px solid ${priorityColor(p)}50` : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                @click="newTicket.priority = p"
              >{{ p }}</button>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-muted/60" style="outline: 1.5px solid hsl(var(--border))" @click="newTicketOpen = false">Cancel</button>
            <button class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02]" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" @click="createTicket">Create Ticket</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import type { Ticket } from '~/types'

import {
  Banknote,
  TicketCheck,
  Users,
  Sun,
  Cloud,
  Box,
  Wrench,
  ShoppingCart,
  CalendarDays,
  Package,
  ClipboardCheck,
  UserPlus,
  DollarSign,
  TrendingUp,
  LayoutDashboard
} from 'lucide-vue-next'

import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useWeather } from '~/composables/useWeather'

definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const appStore = useAppStore()
const { customers, tickets, inventory, appointments, settings, isLoaded } = storeToRefs(appStore)
const { saveAll, trackDevice } = appStore
const { weather, fetchWeather } = useWeather()

const newTicketOpen = ref(false)
const newTicket = ref({
  customerId: null as number | null,
  device: '',
  issue: '',
  priority: 'normal'
})

const navigateTo = (path: string) => {
  router.push(path)
}

const loadWeather = async () => {
  if (!weather.value.loaded) {
    await fetchWeather()
  }
}

const totalRevenue = computed(() => (tickets.value || []).reduce((acc, t) => acc + (t.price || 0), 0))

const activeTickets = computed(() => (tickets.value || []).filter(t => t.status !== 'Closed' && t.status !== 'Delivered'))

const completedToday = computed(() => {
  const today = new Date().toDateString()
  return (tickets.value || []).filter(t => {
    const updatedAt = t.updatedAt ? new Date(t.updatedAt).toDateString() : null
    return (t.status === 'Completed' || t.status === 'Delivered') && updatedAt === today
  }).length
})

const completedTickets = computed(() => (tickets.value || []).filter(t => t.status === 'Closed' || t.status === 'Delivered'))

const lowStockItems = computed(() => (inventory.value || []).filter(item => item.stock <= (item.low || 5)).length)

const upcomingAppointments = computed(() => (appointments.value || []).filter(a => a.status === 'scheduled').length)

const recentTickets = computed(() => [...(tickets.value || [])].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 8))

const formatCurrency = (amount: number) => `${settings.value?.currency || '$'}${(amount || 0).toFixed(2)}`

const getCustomerName = (customerId: number) => (customers.value || []).find(c => c.id === customerId)?.name || 'Unknown'

const ticketStatusColor = (status: string) => {
  const map: Record<string, string> = {
    'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316',
    'Completed': '#10b981', 'Delivered': '#64748b'
  }
  return map[status] || '#64748b'
}

const priorityColor = (p: string) => ({ low: '#64748b', normal: '#3b82f6', high: '#ef4444' }[p] || '#64748b')

const quickActions = computed(() => [
  { label: 'New Repair',  sub: 'Create order',         color: '#10b981', colorDark: '#059669', icon: Wrench,        onClick: () => { newTicketOpen.value = true } },
  { label: 'New Sale',    sub: 'POS transaction',       color: '#3b82f6', colorDark: '#2563eb', icon: ShoppingCart,  onClick: () => navigateTo('/pos') },
  { label: 'Schedule',    sub: `${upcomingAppointments.value} upcoming`, color: '#8b5cf6', colorDark: '#7c3aed', icon: CalendarDays, onClick: () => navigateTo('/calendar') },
  { label: 'Inventory',   sub: 'Manage stock',          color: '#6366f1', colorDark: '#4f46e5', icon: Package,       onClick: () => navigateTo('/inventory') },
  { label: 'Tickets',     sub: 'Manage repairs',        color: '#06b6d4', colorDark: '#0891b2', icon: ClipboardCheck,onClick: () => navigateTo('/tickets') },
  { label: 'Customers',   sub: 'Manage clients',        color: '#ec4899', colorDark: '#db2777', icon: UserPlus,      onClick: () => navigateTo('/customers') },
])

const todaySummary = computed(() => [
  { label: 'Total Sales', value: formatCurrency(totalRevenue.value),  color: '#3b82f6', icon: DollarSign },
  { label: 'Completed',   value: completedToday.value,                color: '#10b981', icon: TicketCheck },
  { label: 'Active',      value: activeTickets.value.length,          color: '#f97316', icon: TicketCheck },
  { label: 'Scheduled',   value: upcomingAppointments.value,          color: '#8b5cf6', icon: CalendarDays },
])

const createTicket = () => {
  if (!newTicket.value.customerId || !newTicket.value.device || !newTicket.value.issue) {
    alert('Please fill in all required fields')
    return
  }
  const ticket: Ticket = {
    id: Math.max(...(tickets.value || []).map(t => t.id), 100) + 1,
    customerId: newTicket.value.customerId,
    device: newTicket.value.device,
    deviceModel: '',
    deviceDescription: '',
    issue: newTicket.value.issue,
    status: 'Open',
    tracking: null,
    price: 0,
    serialNumber: '',
    warrantyDays: 0,
    warrantyStart: null,
    photos: [],
    signature: null,
    notes: [],
    parts: [],
    payments: [],
    timeLog: [],
    priority: newTicket.value.priority as 'low' | 'normal' | 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  if (!tickets.value) tickets.value = []

  tickets.value.push(ticket)
  trackDevice(ticket.device)
  saveAll()
  newTicketOpen.value = false
  newTicket.value = { customerId: null, device: '', issue: '', priority: 'normal' }
}
</script>
