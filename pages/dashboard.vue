<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ───────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-[24px] flex items-center justify-center flex-shrink-0 shadow-lg"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
        >
          <LayoutDashboard class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Dashboard</h1>
          <p class="text-sm text-muted-foreground mt-0.5">Welcome back — here's what's happening today.</p>
        </div>
      </div>
      <button
        class="m3-btn-primary flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg"
        style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 20px #6366f150"
        @click="newTicketOpen = true"
      >
        <Wrench class="w-4 h-4" /> New Repair
      </button>
    </div>

    <!-- ── Stat Cards ────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

      <div class="m3-stat-card rounded-[28px] p-5 flex flex-col gap-3 cursor-pointer" style="background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: #10b98124">
            <Banknote class="w-5 h-5" style="color: #10b981" />
          </div>
          <span class="text-[11px] font-bold px-2.5 py-1 rounded-full" style="background: #10b98120; color: #10b981">+12.5%</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Revenue</p>
          <p class="text-2xl font-black" style="color: #10b981">{{ formatCurrency(totalRevenue) }}</p>
          <p class="text-[10px] text-muted-foreground mt-0.5 font-medium">{{ completedTickets.length }} completed</p>
        </div>
      </div>

      <div class="m3-stat-card rounded-[28px] p-5 flex flex-col gap-3 cursor-pointer" style="background: #3b82f614; outline: 2px solid #3b82f628; outline-offset: 0" @click="navigateTo('/tickets')">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: #3b82f624">
            <TicketCheck class="w-5 h-5" style="color: #3b82f6" />
          </div>
          <span class="text-2xl font-black" style="color: #3b82f6">{{ activeTickets.length }}</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Active Tickets</p>
          <p class="text-[10px] text-muted-foreground mt-0.5 font-medium">{{ completedToday }} completed today</p>
        </div>
      </div>

      <div class="m3-stat-card rounded-[28px] p-5 flex flex-col gap-3 cursor-pointer" style="background: #8b5cf614; outline: 2px solid #8b5cf628; outline-offset: 0" @click="navigateTo('/customers')">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: #8b5cf624">
            <Users class="w-5 h-5" style="color: #8b5cf6" />
          </div>
          <span class="text-2xl font-black" style="color: #8b5cf6">{{ (customers || []).length }}</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Customers</p>
          <p class="text-[10px] text-muted-foreground mt-0.5 font-medium">Lifetime value tracked</p>
        </div>
      </div>

      <div class="m3-stat-card rounded-[28px] p-5 flex flex-col gap-3 cursor-pointer" style="background: #06b6d414; outline: 2px solid #06b6d428; outline-offset: 0" @click="loadWeather">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: #06b6d424">
            <component :is="weather.loaded ? Sun : Cloud" class="w-5 h-5" :class="{ 'animate-pulse': weather.loading }" style="color: #06b6d4" />
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">{{ weather.location || 'Local' }}</p>
          <p class="text-2xl font-black" style="color: #06b6d4">{{ weather.loaded ? weather.temp + '°' : '--°' }}</p>
          <p class="text-[10px] text-muted-foreground mt-0.5 font-medium">{{ weather.description || 'Tap to load' }}</p>
        </div>
      </div>

      <div class="m3-stat-card rounded-[28px] p-5 flex flex-col gap-3 cursor-pointer" style="background: #f59e0b14; outline: 2px solid #f59e0b28; outline-offset: 0" @click="navigateTo('/inventory')">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: #f59e0b24">
            <Box class="w-5 h-5" style="color: #f59e0b" />
          </div>
          <span class="text-2xl font-black" style="color: #f59e0b">{{ (inventory || []).length }}</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Inventory Items</p>
          <p class="text-[10px] font-bold mt-0.5" :style="lowStockItems > 0 ? 'color: #f59e0b' : 'color: #10b981'">
            {{ lowStockItems > 0 ? `${lowStockItems} low stock` : 'All stocked' }}
          </p>
        </div>
      </div>

    </div>

    <!-- ── Quick Actions ─────────────────────────────────────────── -->
    <div>
      <p class="text-xs font-black text-muted-foreground uppercase tracking-[0.15em] mb-4">Quick Actions</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          v-for="action in quickActions"
          :key="action.label"
          class="m3-action-card rounded-[28px] p-5 flex flex-col items-center gap-3 cursor-pointer text-center group"
          :style="`background: ${action.color}10; outline: 2px solid ${action.color}28; outline-offset: 0`"
          @click="action.onClick()"
        >
          <div
            class="w-14 h-14 rounded-[28px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-90 shadow-md"
            :style="`background: linear-gradient(135deg, ${action.color} 0%, ${action.colorDark} 100%); box-shadow: 0 4px 16px ${action.color}40`"
          >
            <component :is="action.icon" class="w-7 h-7 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold">{{ action.label }}</p>
            <p class="text-xs text-muted-foreground font-medium">{{ action.sub }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- ── Bottom Row ───────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Today's Summary -->
      <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.8); outline-offset: 0">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #6366f120">
            <TrendingUp class="w-4.5 h-4.5" style="color: #6366f1" />
          </div>
          <h3 class="text-sm font-bold">Today's Summary</h3>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="s in todaySummary"
            :key="s.label"
            class="rounded-[20px] p-3.5"
            :style="`background: ${s.color}14; outline: 1.5px solid ${s.color}24; outline-offset: 0`"
          >
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 rounded-[12px] flex items-center justify-center" :style="`background: ${s.color}24`">
                <component :is="s.icon" class="w-3 h-3" :style="`color: ${s.color}`" />
              </div>
              <p class="text-[10px] font-semibold text-muted-foreground">{{ s.label }}</p>
            </div>
            <p class="text-xl font-black" :style="`color: ${s.color}`">{{ s.value }}</p>
          </div>
        </div>
      </div>

      <!-- Recent Tickets — M3 ticket shape used for list items -->
      <div class="lg:col-span-2 rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.8); outline-offset: 0">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #f59e0b20">
              <TicketCheck class="w-4.5 h-4.5" style="color: #f59e0b" />
            </div>
            <h3 class="text-sm font-bold">Recent Tickets</h3>
          </div>
          <button
            class="text-xs font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
            style="background: #6366f114; color: #6366f1"
            @click="navigateTo('/tickets')"
          >View all →</button>
        </div>
        <div class="space-y-2">
          <div
            v-for="ticket in recentTickets"
            :key="ticket.id"
            class="m3-ticket-row flex items-center justify-between px-4 py-3 rounded-[20px] transition-all hover:scale-[1.01] cursor-pointer group"
            :style="`background: hsl(var(--muted)/0.3); outline: 1.5px solid hsl(var(--border)/0.6); outline-offset: 0`"
            @click="navigateTo('/tickets')"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                :style="`background: ${ticketStatusColor(ticket.status)}`"
              />
              <div class="min-w-0">
                <p class="text-xs font-bold truncate">#{{ ticket.id }} — {{ ticket.device }}</p>
                <p class="text-[10px] text-muted-foreground truncate">{{ getCustomerName(ticket.customerId) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <span
                class="text-[10px] font-bold px-2.5 py-1 rounded-full"
                :style="`background: ${ticketStatusColor(ticket.status)}20; color: ${ticketStatusColor(ticket.status)}`"
              >{{ ticket.status }}</span>
              <span class="text-xs font-bold" :style="`color: ${ticketStatusColor(ticket.status)}`">
                {{ formatCurrency(ticket.price) }}
              </span>
            </div>
          </div>
          <div v-if="recentTickets.length === 0" class="text-center py-8 text-xs text-muted-foreground font-medium">No tickets yet — create your first one!</div>
        </div>
      </div>

    </div>

    <!-- ── New Ticket Dialog ─────────────────────────────────────── -->
    <Dialog v-model:open="newTicketOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
              <Wrench class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-bold">New Repair Ticket</h2>
              <p class="text-xs text-muted-foreground">Fill in the device and issue details</p>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Customer</label>
            <Select v-model="newTicket.customerId">
              <SelectTrigger class="rounded-[16px] h-10"><SelectValue placeholder="Select a customer" /></SelectTrigger>
              <SelectContent class="rounded-[20px]">
                <SelectItem v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Device</label>
            <input v-model="newTicket.device" placeholder="iPhone 15 Pro" class="w-full h-10 px-4 rounded-[16px] text-sm bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Issue</label>
            <Textarea v-model="newTicket.issue" placeholder="Describe the problem…" class="rounded-[16px] resize-none" :rows="3" />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Priority</label>
            <div class="flex gap-2">
              <button
                v-for="p in ['low','normal','high']"
                :key="p"
                class="px-4 py-2 rounded-full text-xs font-bold capitalize transition-all hover:scale-105 active:scale-95"
                :style="newTicket.priority === p
                  ? `background: ${priorityColor(p)}24; color: ${priorityColor(p)}; outline: 2px solid ${priorityColor(p)}50; outline-offset: 0`
                  : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                @click="newTicket.priority = p"
              >{{ p }}</button>
            </div>
          </div>

          <div class="flex gap-3 pt-1">
            <button
              class="flex-1 flex items-center justify-center px-4 py-3 rounded-full text-sm font-bold transition-all hover:bg-muted/60 hover:scale-105 active:scale-95"
              style="outline: 2px solid hsl(var(--border)); outline-offset: 0"
              @click="newTicketOpen = false"
            >Cancel</button>
            <button
              class="flex-1 flex items-center justify-center px-4 py-3 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
              style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 4px 16px #6366f140"
              @click="createTicket"
            >Create Ticket</button>
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
  Banknote, TicketCheck, Users, Sun, Cloud, Box, Wrench,
  ShoppingCart, CalendarDays, Package, ClipboardCheck, UserPlus,
  DollarSign, TrendingUp, LayoutDashboard
} from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useWeather } from '~/composables/useWeather'

definePageMeta({ middleware: ['auth'] })

const router = useRouter()
const appStore = useAppStore()
const { customers, tickets, inventory, appointments, settings } = storeToRefs(appStore)
const { saveAll, trackDevice } = appStore
const { weather, fetchWeather } = useWeather()

const newTicketOpen = ref(false)
const newTicket = ref({ customerId: null as number | null, device: '', issue: '', priority: 'normal' })
const navigateTo = (path: string) => router.push(path)
const loadWeather = async () => { if (!weather.value.loaded) await fetchWeather() }

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
  { label: 'New Repair', sub: 'Create order',   color: '#10b981', colorDark: '#059669', icon: Wrench,        onClick: () => { newTicketOpen.value = true } },
  { label: 'New Sale',   sub: 'POS transaction', color: '#ec4899', colorDark: '#db2777', icon: ShoppingCart,  onClick: () => navigateTo('/pos') },
  { label: 'Schedule',   sub: `${upcomingAppointments.value} upcoming`, color: '#8b5cf6', colorDark: '#7c3aed', icon: CalendarDays, onClick: () => navigateTo('/calendar') },
  { label: 'Inventory',  sub: 'Manage stock',    color: '#f59e0b', colorDark: '#d97706', icon: Package,       onClick: () => navigateTo('/inventory') },
  { label: 'Tickets',    sub: 'Manage repairs',  color: '#3b82f6', colorDark: '#2563eb', icon: ClipboardCheck,onClick: () => navigateTo('/tickets') },
  { label: 'Customers',  sub: 'Manage clients',  color: '#06b6d4', colorDark: '#0891b2', icon: UserPlus,      onClick: () => navigateTo('/customers') },
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
    deviceModel: '', deviceDescription: '',
    issue: newTicket.value.issue,
    status: 'Open', tracking: null, price: 0,
    serialNumber: '', warrantyDays: 0, warrantyStart: null,
    photos: [], signature: null, notes: [], parts: [], payments: [], timeLog: [],
    priority: newTicket.value.priority as 'low' | 'normal' | 'high',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
  if (!tickets.value) tickets.value = []
  tickets.value.push(ticket)
  trackDevice(ticket.device)
  saveAll()
  newTicketOpen.value = false
  newTicket.value = { customerId: null, device: '', issue: '', priority: 'normal' }
}
</script>

<style scoped>
/* M3 Expressive spring interactions */
.m3-btn-primary {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-btn-primary:hover  { transform: scale(1.05) translateY(-2px); }
.m3-btn-primary:active { transform: scale(0.92); }

.m3-stat-card {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-stat-card:hover  { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
.m3-stat-card:active { transform: scale(0.96); }

.m3-action-card {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-action-card:hover  { transform: scale(1.04) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
.m3-action-card:active { transform: scale(0.93); }

.m3-ticket-row {
  transition: transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.m3-ticket-row:active { transform: scale(0.97); }
</style>