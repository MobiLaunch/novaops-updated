<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Tickets</h1>
        <p class="text-sm text-muted-foreground mt-1">Manage and track repair tickets</p>
      </div>
      <Button size="lg" @click="newTicketOpen = true">
        <Plus class="w-4 h-4 mr-2" />New Ticket
      </Button>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search tickets..." class="pl-9" />
      </div>
      <Select v-model="filterStatus">
        <SelectTrigger class="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="null">All Statuses</SelectItem>
          <SelectItem v-for="status in statusList" :key="status" :value="status">{{ status }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Open</CardTitle>
          <Inbox class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div class="text-2xl font-bold">{{ getStatusCount('Open') }}</div></CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div class="text-2xl font-bold">{{ getStatusCount('In Progress') }}</div></CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div class="text-2xl font-bold">{{ getStatusCount('Completed') }}</div></CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Total</CardTitle>
          <BarChart3 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div class="text-2xl font-bold">{{ (tickets || []).length }}</div></CardContent>
      </Card>
    </div>

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
                <Badge :variant="getPriorityVariant(ticket.priority)" class="font-normal">{{ ticket.priority }}</Badge>
              </div>
              <p class="text-sm text-muted-foreground">{{ getCustomerName(ticket.customerId) }}</p>
            </div>
            <Badge :variant="getStatusVariant(ticket.status)">{{ ticket.status }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <Smartphone class="h-4 w-4 text-muted-foreground" />
            <span class="font-medium">{{ ticket.device }} {{ ticket.deviceModel || '' }}</span>
          </div>
          <p class="text-sm text-muted-foreground">{{ ticket.issue }}</p>
          <div class="flex items-center justify-between pt-2">
            <span class="text-sm font-medium">{{ formatCurrency(ticket.price) }}</span>
            <span class="text-xs text-muted-foreground">{{ formatDate(ticket.createdAt) }}</span>
          </div>
        </CardContent>
      </Card>

      <Card v-if="filteredTickets.length === 0">
        <CardContent class="flex flex-col items-center justify-center py-16">
          <Inbox class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No tickets found</h3>
          <p class="text-sm text-muted-foreground mb-6">Get started by creating your first ticket</p>
          <Button @click="newTicketOpen = true"><Plus class="w-4 h-4 mr-2" />Create Ticket</Button>
        </CardContent>
      </Card>
    </div>

    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />

    <!-- Ticket Detail Dialog -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Smartphone class="w-4 h-4" />
            Ticket #{{ selectedTicket?.id }}
          </DialogTitle>
        </DialogHeader>

        <div v-if="selectedTicket" class="space-y-5 py-2">
          <!-- Info grid -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-muted-foreground mb-1">Customer</p>
              <p class="font-medium">{{ getCustomerName(selectedTicket.customerId) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">Device</p>
              <p class="font-medium">{{ selectedTicket.device }} {{ selectedTicket.deviceModel || '' }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">Issue</p>
              <p class="font-medium">{{ selectedTicket.issue }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">Price</p>
              <p class="font-medium">{{ formatCurrency(selectedTicket.price) }}</p>
            </div>
            <div v-if="selectedTicket.serialNumber">
              <p class="text-muted-foreground mb-1">Serial #</p>
              <p class="font-medium">{{ selectedTicket.serialNumber }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">Created</p>
              <p class="font-medium">{{ formatDate(selectedTicket.createdAt) }}</p>
            </div>
          </div>

          <div class="border-t pt-4 space-y-3">
            <!-- Status -->
            <div class="space-y-1.5">
              <Label>Status</Label>
              <Select v-model="editStatus">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="s in statusList" :key="s" :value="s">{{ s }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Priority -->
            <div class="space-y-1.5">
              <Label>Priority</Label>
              <Select v-model="editPriority">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Note -->
            <div class="space-y-1.5">
              <Label>Add Note</Label>
              <Textarea v-model="newNote" placeholder="Add a note..." :rows="2" />
            </div>
          </div>

          <!-- Quick complete banner -->
          <div
            v-if="editStatus !== 'Completed'"
            class="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3"
          >
            <div class="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle class="w-4 h-4" />
              <span>Mark this ticket as complete?</span>
            </div>
            <Button size="sm" variant="outline" class="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10" @click="editStatus = 'Completed'">
              Complete
            </Button>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-1">
            <Button variant="outline" class="flex-1" @click="detailOpen = false">Cancel</Button>
            <Button variant="destructive" size="icon" :disabled="saving" @click="handleDeleteTicket">
              <Trash2 class="w-4 h-4" />
            </Button>
            <Button class="flex-1" :disabled="saving" @click="handleSaveTicket">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { useNotifications } from '~/composables/useNotifications'
import { Search, Plus, Smartphone, Inbox, Clock, CheckCircle, BarChart3, Trash2 } from 'lucide-vue-next'
import type { Ticket } from '~/types'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import NewTicketDialog from '~/components/NewTicketDialog.vue'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { tickets, customers, settings, isLoaded } = storeToRefs(appStore)
const { createTicket, updateTicket, deleteTicket, trackDevice, initializeData } = appStore
const { addNotification } = useNotifications()

onMounted(() => { initializeData() })

const searchQuery = ref('')
const filterStatus = ref<string | null>(null)
const newTicketOpen = ref(false)
const detailOpen = ref(false)
const selectedTicket = ref<Ticket | null>(null)
const editStatus = ref('')
const editPriority = ref('')
const newNote = ref('')
const saving = ref(false)

const statusList = computed(() =>
  (settings.value?.statuses || 'Open, In Progress, Completed').split(',').map(s => s.trim())
)

const filteredTickets = computed(() =>
  (tickets.value || []).filter(ticket => {
    const matchesSearch = !searchQuery.value ||
      (ticket.device || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (ticket.deviceModel && ticket.deviceModel.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (ticket.issue || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      ticket.id.toString().includes(searchQuery.value) ||
      getCustomerName(ticket.customerId).toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !filterStatus.value || ticket.status === filterStatus.value
    return matchesSearch && matchesStatus
  }).sort((a, b) => (b.id || 0) - (a.id || 0))
)

const getStatusCount = (status: string) => (tickets.value || []).filter(t => t.status === status).length
const formatCurrency = (amount: number) => `${settings.value?.currency || '$'}${(amount || 0).toFixed(2)}`
const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString() : 'N/A'
const getCustomerName = (customerId: number) => (customers.value || []).find(c => c.id === customerId)?.name || 'Unknown'

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Open': 'default', 'In Progress': 'secondary', 'Waiting for Parts': 'outline',
    'Completed': 'outline', 'Delivered': 'secondary'
  }
  return variants[status] || 'outline'
}

const getPriorityVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'low': 'secondary', 'normal': 'outline', 'high': 'destructive'
  }
  return variants[priority] || 'outline'
}

const openTicket = (ticket: Ticket) => {
  selectedTicket.value = { ...ticket }
  editStatus.value = ticket.status
  editPriority.value = ticket.priority || 'normal'
  newNote.value = ''
  detailOpen.value = true
}

const handleSaveTicket = async () => {
  if (!selectedTicket.value) return
  saving.value = true
  try {
    const updates: any = {
      status: editStatus.value,
      priority: editPriority.value,
      updated_at: new Date().toISOString(),
    }
    if (newNote.value.trim()) {
      const existingNotes = Array.isArray(selectedTicket.value.notes) ? selectedTicket.value.notes : []
      updates.notes = [...existingNotes, {
        id: Date.now().toString(),
        text: newNote.value.trim(),
        timestamp: new Date().toISOString(),
        author: 'Staff'
      }]
    }
    await updateTicket(selectedTicket.value.id, updates)
    addNotification('Ticket Updated', `Ticket #${selectedTicket.value.id} saved`, 'success')
    detailOpen.value = false
  } catch (err: any) {
    addNotification('Error', 'Failed to update ticket: ' + (err.message || err), 'error')
  } finally {
    saving.value = false
  }
}

const handleDeleteTicket = async () => {
  if (!selectedTicket.value) return
  if (!confirm(`Delete Ticket #${selectedTicket.value.id}? This cannot be undone.`)) return
  saving.value = true
  try {
    await deleteTicket(selectedTicket.value.id)
    addNotification('Deleted', `Ticket #${selectedTicket.value.id} deleted`, 'info')
    detailOpen.value = false
  } catch (err: any) {
    addNotification('Error', 'Failed to delete ticket: ' + (err.message || err), 'error')
  } finally {
    saving.value = false
  }
}

const handleCreateTicket = async (ticketData: any) => {
  try {
    await createTicket({
      customerId: ticketData.customerId,
      device: ticketData.device,
      deviceModel: ticketData.deviceModel,
      deviceDescription: ticketData.deviceDescription,
      issue: ticketData.issue,
      status: 'Open',
      price: ticketData.price || 0,
      serialNumber: ticketData.serialNumber,
      warrantyDays: ticketData.warrantyDays || 0,
      warrantyStart: null,
      photos: [],
      signature: ticketData.signature,
      notes: [],
      parts: [],
      payments: [],
      timeLog: [],
      priority: ticketData.priority || 'normal',
      tracking: null,
    })
    if (trackDevice) trackDevice(ticketData.device)
    addNotification('Ticket Created', 'Ticket created successfully', 'success')
    newTicketOpen.value = false
  } catch (err: any) {
    addNotification('Error', 'Failed to create ticket: ' + (err.message || err), 'error')
  }
}
</script>
