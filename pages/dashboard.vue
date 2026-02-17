<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card class="stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
        <CardContent class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Banknote class="w-6 h-6 text-emerald-500" />
            </div>
            <div class="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
              +12.5%
            </div>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p class="text-3xl font-bold">{{ formatCurrency(totalRevenue) }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ completedTickets.length }} completed</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        class="stat-card group cursor-pointer hover:scale-[1.02] transition-transform" 
        @click="navigateTo('/tickets')"
      >
        <CardContent class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TicketCheck class="w-6 h-6 text-blue-500" />
            </div>
            <div class="text-3xl font-bold">{{ activeTickets.length }}</div>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-1">Active Tickets</p>
            <p class="text-xs text-muted-foreground">{{ completedToday }} completed today</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        class="stat-card group cursor-pointer hover:scale-[1.02] transition-transform" 
        @click="navigateTo('/customers')"
      >
        <CardContent class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users class="w-6 h-6 text-purple-500" />
            </div>
            <div class="text-3xl font-bold">{{ (customers || []).length }}</div>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-1">Total Customers</p>
            <p class="text-xs text-muted-foreground">Lifetime value tracked</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        class="stat-card group cursor-pointer hover:scale-[1.02] transition-transform" 
        @click="loadWeather"
      >
        <CardContent class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <component 
                :is="weather.loaded ? Sun : Cloud" 
                class="w-6 h-6 text-cyan-500"
                :class="{ 'animate-pulse': weather.loading }"
              />
            </div>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-1">{{ weather.location || 'Local' }}</p>
            <p class="text-3xl font-bold">
              {{ weather.loaded ? weather.temp + '°' : '--°' }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ weather.description || 'Tap to load' }}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card 
        class="stat-card group cursor-pointer hover:scale-[1.02] transition-transform" 
        @click="navigateTo('/inventory')"
      >
        <CardContent class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Box class="w-6 h-6 text-amber-500" />
            </div>
            <div class="text-3xl font-bold">{{ (inventory || []).length }}</div>
          </div>
          <div>
            <p class="text-sm text-muted-foreground mb-1">Inventory Items</p>
            <p class="text-xs text-muted-foreground">
              <span v-if="lowStockItems > 0" class="text-amber-500">{{ lowStockItems }} low stock</span>
              <span v-else class="text-emerald-500">All stocked</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card class="pos-card pos-card-hover p-8 cursor-pointer group" @click="newTicketOpen = true">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wrench class="w-8 h-8 text-white" />
          </div>
          <div>
            <p class="text-xl font-semibold mb-1">New Repair</p>
            <p class="text-sm text-muted-foreground">Create repair order</p>
          </div>
        </div>
      </Card>

      <Card class="pos-card pos-card-hover p-8 cursor-pointer group" @click="navigateTo('/pos')">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingCart class="w-8 h-8 text-white" />
          </div>
          <div>
            <p class="text-xl font-semibold mb-1">New Sale</p>
            <p class="text-sm text-muted-foreground">Start POS transaction</p>
          </div>
        </div>
      </Card>

      <Card class="pos-card pos-card-hover p-8 cursor-pointer group" @click="navigateTo('/calendar')">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarDays class="w-8 h-8 text-white" />
          </div>
          <div>
            <p class="text-xl font-semibold mb-1">Schedule</p>
            <p class="text-sm text-muted-foreground">{{ upcomingAppointments }} upcoming</p>
          </div>
        </div>
      </Card>

      <Card class="pos-card pos-card-hover p-8 cursor-pointer group" @click="navigateTo('/inventory')">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package class="w-8 h-8 text-white" />
          </div>
          <div>
            <p class="text-xl font-semibold mb-1">Inventory Hub</p>
            <p class="text-sm text-muted-foreground">Manage stock levels</p>
          </div>
        </div>
      </Card>

      <Card class="pos-card pos-card-hover p-8 cursor-pointer group" @click="navigateTo('/tickets')">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClipboardCheck class="w-8 h-8 text-white" />
          </div>
          <div>
            <p class="text-xl font-semibold mb-1">Assign Task</p>
            <p class="text-sm text-muted-foreground">Manage repairs</p>
          </div>
        </div>
      </Card>

      <Card class="pos-card pos-card-hover p-8 cursor-pointer group" @click="navigateTo('/customers')">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus class="w-8 h-8 text-white" />
          </div>
          <div>
            <p class="text-xl font-semibold mb-1">Customers</p>
            <p class="text-sm text-muted-foreground">Manage customers</p>
          </div>
        </div>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card class="pos-card p-6">
        <CardHeader class="px-0 pt-0">
          <CardTitle class="text-lg">Today's Summary</CardTitle>
        </CardHeader>
        <CardContent class="px-0 pb-0">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-muted/30 rounded-lg p-4 border border-border">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <DollarSign class="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Total Sales</p>
                  <p class="text-xl font-bold">{{ formatCurrency(totalRevenue) }}</p>
                </div>
              </div>
            </div>
            <div class="bg-muted/30 rounded-lg p-4 border border-border">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp class="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Completed</p>
                  <p class="text-xl font-bold">{{ completedToday }}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="pos-card p-6">
        <CardHeader class="px-0 pt-0">
          <CardTitle class="text-lg">Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent class="px-0 pb-0 space-y-3">
          <div 
            v-for="ticket in recentTickets" 
            :key="ticket.id"
            class="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
            @click="navigateTo('/tickets')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span class="text-sm font-bold text-primary">#{{ ticket.id }}</span>
              </div>
              <div>
                <p class="font-medium">{{ ticket.device }}</p>
                <p class="text-xs text-muted-foreground">{{ getCustomerName(ticket.customerId) }}</p>
              </div>
            </div>
            <span 
              class="px-2 py-1 rounded text-xs font-medium"
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
          <div v-if="recentTickets.length === 0" class="text-center py-8 text-muted-foreground">
            <TicketCheck class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tickets yet</p>
          </div>
        </CardContent>
      </Card>
    </div>

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

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
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

const recentTickets = computed(() => [...(tickets.value || [])].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5))

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
    deviceModel: '', // Added missing required field
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