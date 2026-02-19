<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Welcome back — here's what's happening today.</p>
      </div>
      <Button size="sm" @click="newTicketOpen = true">
        <Wrench class="w-4 h-4 mr-2" /> New Repair
      </Button>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Card class="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Banknote class="w-5 h-5 text-emerald-500" />
            </div>
            <span class="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+12.5%</span>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">Total Revenue</p>
          <p class="text-2xl font-bold tracking-tight">{{ formatCurrency(totalRevenue) }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ completedTickets.length }} completed</p>
        </CardContent>
      </Card>

      <Card class="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" @click="navigateTo('/tickets')">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TicketCheck class="w-5 h-5 text-blue-500" />
            </div>
            <span class="text-2xl font-bold">{{ activeTickets.length }}</span>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">Active Tickets</p>
          <p class="text-xs text-muted-foreground">{{ completedToday }} completed today</p>
        </CardContent>
      </Card>

      <Card class="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" @click="navigateTo('/customers')">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users class="w-5 h-5 text-purple-500" />
            </div>
            <span class="text-2xl font-bold">{{ (customers || []).length }}</span>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">Total Customers</p>
          <p class="text-xs text-muted-foreground">Lifetime value tracked</p>
        </CardContent>
      </Card>

      <Card class="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" @click="loadWeather">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <component
                :is="weather.loaded ? Sun : Cloud"
                class="w-5 h-5 text-cyan-500"
                :class="{ 'animate-pulse': weather.loading }"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">{{ weather.location || 'Local' }}</p>
          <p class="text-2xl font-bold tracking-tight">{{ weather.loaded ? weather.temp + '°' : '--°' }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ weather.description || 'Tap to load' }}</p>
        </CardContent>
      </Card>

      <Card class="group cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" @click="navigateTo('/inventory')">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Box class="w-5 h-5 text-amber-500" />
            </div>
            <span class="text-2xl font-bold">{{ (inventory || []).length }}</span>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">Inventory Items</p>
          <p class="text-xs mt-1">
            <span v-if="lowStockItems > 0" class="text-amber-500 font-medium">{{ lowStockItems }} low stock</span>
            <span v-else class="text-emerald-500 font-medium">All stocked</span>
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div>
      <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card class="cursor-pointer group hover:shadow-md transition-all hover:-translate-y-0.5 border-dashed hover:border-solid" @click="newTicketOpen = true">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">New Repair</p>
              <p class="text-xs text-muted-foreground">Create order</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-md transition-all hover:-translate-y-0.5 border-dashed hover:border-solid" @click="navigateTo('/pos')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">New Sale</p>
              <p class="text-xs text-muted-foreground">POS transaction</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-md transition-all hover:-translate-y-0.5 border-dashed hover:border-solid" @click="navigateTo('/calendar')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDays class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">Schedule</p>
              <p class="text-xs text-muted-foreground">{{ upcomingAppointments }} upcoming</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-md transition-all hover:-translate-y-0.5 border-dashed hover:border-solid" @click="navigateTo('/inventory')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">Inventory</p>
              <p class="text-xs text-muted-foreground">Manage stock</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-md transition-all hover:-translate-y-0.5 border-dashed hover:border-solid" @click="navigateTo('/tickets')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">Tickets</p>
              <p class="text-xs text-muted-foreground">Manage repairs</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-md transition-all hover:-translate-y-0.5 border-dashed hover:border-solid" @click="navigateTo('/customers')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">Customers</p>
              <p class="text-xs text-muted-foreground">Manage clients</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Bottom Row: Today's Summary + Recent Tickets -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Today's Summary -->
      <Card class="p-5">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-muted-foreground" />
          Today's Summary
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-muted/30 rounded-lg p-3 border border-border">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center">
                <DollarSign class="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p class="text-xs text-muted-foreground">Total Sales</p>
            </div>
            <p class="text-lg font-bold">{{ formatCurrency(totalRevenue) }}</p>
          </div>
          <div class="bg-muted/30 rounded-lg p-3 border border-border">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <TicketCheck class="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p class="text-xs text-muted-foreground">Completed</p>
            </div>
            <p class="text-lg font-bold">{{ completedToday }}</p>
          </div>
          <div class="bg-muted/30 rounded-lg p-3 border border-border">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center">
                <TicketCheck class="w-3.5 h-3.5 text-orange-500" />
              </div>
              <p class="text-xs text-muted-foreground">Active</p>
            </div>
            <p class="text-lg font-bold">{{ activeTickets.length }}</p>
          </div>
          <div class="bg-muted/30 rounded-lg p-3 border border-border">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center">
                <CalendarDays class="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p class="text-xs text-muted-foreground">Scheduled</p>
            </div>
            <p class="text-lg font-bold">{{ upcomingAppointments }}</p>
          </div>
        </div>
      </Card>

      <!-- Recent Tickets -->
      <Card class="lg:col-span-2 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <TicketCheck class="w-4 h-4 text-muted-foreground" />
            Recent Tickets
          </h3>
          <Button variant="ghost" size="sm" class="text-xs h-7" @click="navigateTo('/tickets')">
            View all →
          </Button>
        </div>
        <div class="space-y-2">
          <div
            v-for="ticket in recentTickets"
            :key="ticket.id"
            class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors group"
            @click="navigateTo('/tickets')"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-bold text-primary">#{{ ticket.id }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium truncate">{{ ticket.device }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ getCustomerName(ticket.customerId) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-blue-500/10 text-blue-500': ticket.status === 'Open',
                  'bg-yellow-500/10 text-yellow-500': ticket.status === 'In Progress',
                  'bg-orange-500/10 text-orange-500': ticket.status === 'Waiting for Parts',
                  'bg-green-500/10 text-green-500': ticket.status === 'Completed',
                  'bg-gray-500/10 text-gray-500': ticket.status === 'Delivered'
                }"
              >
                {{ ticket.status }}
              </span>
            </div>
          </div>

          <div v-if="recentTickets.length === 0" class="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <TicketCheck class="w-10 h-10 mb-2 opacity-30" />
            <p class="text-sm">No tickets yet</p>
            <Button size="sm" variant="outline" class="mt-3" @click="newTicketOpen = true">Create first ticket</Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- New Repair Dialog (unchanged) -->
    <Dialog v-model:open="newTicketOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Repair</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="customer">Customer *</Label>
            <Select :model-value="newTicket.customerId ? String(newTicket.customerId) : ''" @update:model-value="(val) => newTicket.customerId = val ? parseInt(val) : null">
              <SelectTrigger id="customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="customer in customers" :key="customer.id" :value="String(customer.id)">
                  {{ customer.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="device">Device *</Label>
            <Input id="device" v-model="newTicket.device" placeholder="e.g., iPhone 14 Pro" />
          </div>
          <div class="space-y-2">
            <Label for="issue">Issue *</Label>
            <Textarea id="issue" v-model="newTicket.issue" placeholder="Describe the problem" :rows="3" />
          </div>
          <div class="space-y-2">
            <Label for="priority">Priority</Label>
            <Select v-model="newTicket.priority">
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex gap-3 pt-4">
            <Button variant="outline" class="flex-1" @click="newTicketOpen = false">Cancel</Button>
            <Button class="flex-1" @click="createTicket">Create Ticket</Button>
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
  TrendingUp
} from 'lucide-vue-next'

import { Card, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
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
