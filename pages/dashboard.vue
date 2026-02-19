<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Dashboard</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Welcome back — here's what's happening today.</p>
      </div>
      <Button size="sm" @click="newTicketOpen = true" class="shadow-sm">
        <Wrench class="w-4 h-4 mr-2" /> New Repair
      </Button>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Card class="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent ring-1 ring-emerald-500/20">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-inner">
              <Banknote class="w-5 h-5 text-emerald-500" />
            </div>
            <span class="text-xs font-semibold text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">+12.5%</span>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">Total Revenue</p>
          <p class="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">{{ formatCurrency(totalRevenue) }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ completedTickets.length }} completed</p>
        </CardContent>
      </Card>

      <Card class="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent ring-1 ring-blue-500/20" @click="navigateTo('/tickets')">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-inner">
              <TicketCheck class="w-5 h-5 text-blue-500" />
            </div>
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ activeTickets.length }}</span>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">Active Tickets</p>
          <p class="text-xs text-muted-foreground">{{ completedToday }} completed today</p>
        </CardContent>
      </Card>

      <Card class="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent ring-1 ring-purple-500/20" @click="navigateTo('/customers')">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shadow-inner">
              <Users class="w-5 h-5 text-purple-500" />
            </div>
            <span class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ (customers || []).length }}</span>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">Total Customers</p>
          <p class="text-xs text-muted-foreground">Lifetime value tracked</p>
        </CardContent>
      </Card>

      <Card class="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent ring-1 ring-cyan-500/20" @click="loadWeather">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shadow-inner">
              <component
                :is="weather.loaded ? Sun : Cloud"
                class="w-5 h-5 text-cyan-500"
                :class="{ 'animate-pulse': weather.loading }"
              />
            </div>
          </div>
          <p class="text-xs text-muted-foreground mb-0.5">{{ weather.location || 'Local' }}</p>
          <p class="text-2xl font-bold tracking-tight text-cyan-600 dark:text-cyan-400">{{ weather.loaded ? weather.temp + '°' : '--°' }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ weather.description || 'Tap to load' }}</p>
        </CardContent>
      </Card>

      <Card class="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent ring-1 ring-amber-500/20" @click="navigateTo('/inventory')">
        <CardContent class="p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shadow-inner">
              <Box class="w-5 h-5 text-amber-500" />
            </div>
            <span class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ (inventory || []).length }}</span>
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
      <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card class="cursor-pointer group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent" @click="newTicketOpen = true">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/30">
              <Wrench class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">New Repair</p>
              <p class="text-xs text-muted-foreground">Create order</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent" @click="navigateTo('/pos')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-blue-500/30">
              <ShoppingCart class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">New Sale</p>
              <p class="text-xs text-muted-foreground">POS transaction</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent" @click="navigateTo('/calendar')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-purple-500/30">
              <CalendarDays class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">Schedule</p>
              <p class="text-xs text-muted-foreground">{{ upcomingAppointments }} upcoming</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 to-transparent" @click="navigateTo('/inventory')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-indigo-500/30">
              <Package class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">Inventory</p>
              <p class="text-xs text-muted-foreground">Manage stock</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-cyan-500/20 bg-gradient-to-b from-cyan-500/5 to-transparent" @click="navigateTo('/tickets')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-cyan-500/30">
              <ClipboardCheck class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-sm font-semibold">Tickets</p>
              <p class="text-xs text-muted-foreground">Manage repairs</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-pink-500/20 bg-gradient-to-b from-pink-500/5 to-transparent" @click="navigateTo('/customers')">
          <CardContent class="p-4 flex flex-col items-center text-center gap-2">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-pink-500/30">
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
      <Card class="p-5 border-0 ring-1 ring-border shadow-sm">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-primary" />
          Today's Summary
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-3 border border-blue-500/15">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <DollarSign class="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p class="text-xs text-muted-foreground">Total Sales</p>
            </div>
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency(totalRevenue) }}</p>
          </div>
          <div class="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-3 border border-emerald-500/15">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TicketCheck class="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p class="text-xs text-muted-foreground">Completed</p>
            </div>
            <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ completedToday }}</p>
          </div>
          <div class="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl p-3 border border-orange-500/15">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <TicketCheck class="w-3.5 h-3.5 text-orange-500" />
              </div>
              <p class="text-xs text-muted-foreground">Active</p>
            </div>
            <p class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ activeTickets.length }}</p>
          </div>
          <div class="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-3 border border-purple-500/15">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <CalendarDays class="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p class="text-xs text-muted-foreground">Scheduled</p>
            </div>
            <p class="text-lg font-bold text-purple-600 dark:text-purple-400">{{ upcomingAppointments }}</p>
          </div>
        </div>
      </Card>

      <!-- Recent Tickets -->
      <Card class="lg:col-span-2 p-5 border-0 ring-1 ring-border shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <TicketCheck class="w-4 h-4 text-primary" />
            Recent Tickets
          </h3>
          <Button variant="ghost" size="sm" class="text-xs h-7 text-primary hover:text-primary" @click="navigateTo('/tickets')">
            View all →
          </Button>
        </div>
        <div class="space-y-2">
          <div
            v-for="ticket in recentTickets"
            :key="ticket.id"
            class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/20 hover:bg-muted/50 cursor-pointer transition-all hover:shadow-sm group border border-transparent hover:border-border"
            @click="navigateTo('/tickets')"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/10">
                <span class="text-xs font-bold text-primary">#{{ ticket.id }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium truncate">{{ ticket.device }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ getCustomerName(ticket.customerId) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium border"
                :class="{
                  'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20': ticket.status === 'Open',
                  'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20': ticket.status === 'In Progress',
                  'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20': ticket.status === 'Waiting for Parts',
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20': ticket.status === 'Completed',
                  'bg-gray-500/10 text-gray-500 border-gray-500/20': ticket.status === 'Delivered'
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
