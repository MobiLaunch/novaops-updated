<template>
  <div class="flex flex-col gap-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Tickets</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Manage and track repair tickets
        </p>
      </div>
      <Button size="lg" @click="newTicketOpen = true">
        <Plus class="w-4 h-4 mr-2" />
        New Ticket
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search tickets..."
          class="pl-9"
        />
      </div>
      <Select v-model="filterStatus">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="null">All Statuses</SelectItem>
          <SelectItem
            v-for="status in statusList"
            :key="status"
            :value="status"
          >
            {{ status }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Open
          </CardTitle>
          <Inbox class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ getStatusCount('Open') }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            In Progress
          </CardTitle>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ getStatusCount('In Progress') }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Completed
          </CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ getStatusCount('Completed') }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Total
          </CardTitle>
          <BarChart3 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ tickets.length }}</div>
        </CardContent>
      </Card>
    </div>

    <!-- Tickets List -->
    <div class="space-y-4">
      <Card
        v-for="ticket in filteredTickets"
        :key="ticket.id"
        class="cursor-pointer transition-colors hover:bg-accent"
        @click="openTicket(ticket)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <CardTitle class="text-base">#{{ ticket.id }}</CardTitle>
                <Badge variant="outline" class="font-normal">
                  {{ ticket.priority }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ getCustomerName(ticket.customerId) }}
              </p>
            </div>
            <Badge :variant="getStatusVariant(ticket.status)">
              {{ ticket.status }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <Smartphone class="h-4 w-4 text-muted-foreground" />
            <span class="font-medium">{{ ticket.device }} {{ ticket.deviceModel || '' }}</span>
          </div>
          <p class="text-sm text-muted-foreground">{{ ticket.issue }}</p>
          <div class="flex items-center justify-between pt-2">
            <span class="text-sm font-medium">
              {{ formatCurrency(ticket.price) }}
            </span>
            <span class="text-xs text-muted-foreground">
              {{ formatDate(ticket.createdAt) }}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card v-if="filteredTickets.length === 0">
        <CardContent class="flex flex-col items-center justify-center py-16">
          <Inbox class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No tickets found</h3>
          <p class="text-sm text-muted-foreground mb-6">
            Get started by creating your first ticket
          </p>
          <Button @click="newTicketOpen = true">
            <Plus class="w-4 h-4 mr-2" />
            Create Ticket
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- New Ticket Dialog -->
    <NewTicketDialog
      v-model="newTicketOpen"
      :customers="customers"
      @create="handleCreateTicket"
    />

    <!-- Ticket Detail Dialog -->
    <TicketDetailDialog
      v-if="selectedTicket"
      v-model="detailOpen"
      :ticket="selectedTicket"
      @save="selectedTicket = null"
      @delete="handleDeleteTicket"
    />
  </div>
</template>

<script setup lang="ts">
import { 
  Search, 
  Plus, 
  Smartphone, 
  Inbox, 
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-vue-next'
import type { Ticket } from '~/types'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import TicketDetailDialog from '~/components/TicketDetailDialog.vue'

definePageMeta({
  middleware: ['auth']
})

const appStore = useAppStore()
const { tickets, customers, settings, trackDevice } = appStore
const { addNotification } = useNotifications()

const searchQuery = ref('')
const filterStatus = ref<string | null>(null)
const newTicketOpen = ref(false)
const selectedTicket = ref<Ticket | null>(null)

const statusList = computed(() => {
  return settings.value.statuses.split(',').map(s => s.trim())
})

const filteredTickets = computed(() => {
  return tickets.value.filter(ticket => {
    const matchesSearch = !searchQuery.value || 
      ticket.device.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (ticket.deviceModel && ticket.deviceModel.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      ticket.issue.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      ticket.id.toString().includes(searchQuery.value) ||
      getCustomerName(ticket.customerId).toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = !filterStatus.value || ticket.status === filterStatus.value
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => (b.id || 0) - (a.id || 0))
})

const getStatusCount = (status: string) => {
  return tickets.value.filter(t => t.status === status).length
}

const formatCurrency = (amount: number) => {
  return `${settings.value.currency}${amount.toFixed(2)}`
}

const formatDate = (date?: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

const getCustomerName = (customerId: number) => {
  const customer = customers.value.find(c => c.id === customerId)
  return customer?.name || 'Unknown'
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Open': 'default',
    'In Progress': 'secondary',
    'Waiting for Parts': 'outline',
    'Completed': 'outline',
    'Delivered': 'secondary'
  }
  return variants[status] || 'outline'
}

const getPriorityVariant = (priority: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'low': 'secondary',
    'normal': 'outline',
    'high': 'destructive'
  }
  return variants[priority] || 'outline'
}

const detailOpen = ref(false)

const openTicket = (ticket: Ticket) => {
  selectedTicket.value = { ...ticket }
  detailOpen.value = true
}

const handleDeleteTicket = async (ticket: Ticket) => {
  await appStore.deleteTicket(ticket.id)
  detailOpen.value = false
  selectedTicket.value = null
  addNotification('Ticket Deleted', `Ticket #${ticket.id} deleted`, 'success')
}

const handleCreateTicket = async (ticketData: any) => {
  try {
    // Handle inline new customer creation
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

    trackDevice(ticketData.device)
    addNotification('Ticket Created', `Ticket #${ticket.id} created successfully`, 'success')
    newTicketOpen.value = false
  } catch (err: any) {
    addNotification('Error', err.message || 'Failed to create ticket', 'error')
  }
}

</script>
