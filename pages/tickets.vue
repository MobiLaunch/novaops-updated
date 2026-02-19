<template>
  <div class="flex flex-col gap-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Tickets</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Manage and track repair tickets</p>
      </div>
      <Button size="sm" @click="newTicketOpen = true">
        <Plus class="w-4 h-4 mr-2" />New Ticket
      </Button>
    </div>

    <!-- Stat Cards -->
    <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Card class="cursor-pointer hover:shadow-sm transition-shadow" @click="filterStatus = null">
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <BarChart3 class="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Total</p>
            <p class="text-2xl font-bold">{{ (tickets || []).length }}</p>
          </div>
        </CardContent>
      </Card>
      <Card class="cursor-pointer hover:shadow-sm transition-shadow" @click="filterStatus = 'Open'">
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Inbox class="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Open</p>
            <p class="text-2xl font-bold">{{ getStatusCount('Open') }}</p>
          </div>
        </CardContent>
      </Card>
      <Card class="cursor-pointer hover:shadow-sm transition-shadow" @click="filterStatus = 'In Progress'">
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <Clock class="h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">In Progress</p>
            <p class="text-2xl font-bold">{{ getStatusCount('In Progress') }}</p>
          </div>
        </CardContent>
      </Card>
      <Card class="cursor-pointer hover:shadow-sm transition-shadow" @click="filterStatus = 'Completed'">
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle class="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Completed</p>
            <p class="text-2xl font-bold">{{ getStatusCount('Completed') }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Search & Filters -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search tickets..." class="pl-9 h-9" />
      </div>
      <Select v-model="filterStatus">
        <SelectTrigger class="w-[160px] h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="null">All Statuses</SelectItem>
          <SelectItem v-for="status in statusList" :key="status" :value="status">{{ status }}</SelectItem>
        </SelectContent>
      </Select>
      <span v-if="filterStatus" class="text-xs text-muted-foreground">
        {{ filteredTickets.length }} result{{ filteredTickets.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Tickets Table -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead class="w-[60px]">ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead class="hidden md:table-cell">Issue</TableHead>
              <TableHead class="hidden sm:table-cell">Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="hidden lg:table-cell text-right">Price</TableHead>
              <TableHead class="hidden lg:table-cell text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="ticket in filteredTickets"
              :key="ticket.id"
              class="cursor-pointer hover:bg-muted/40 transition-colors"
              @click="openTicket(ticket)"
            >
              <!-- Priority indicator bar + ID -->
              <TableCell>
                <div class="flex items-center gap-2">
                  <div
                    class="w-1 h-8 rounded-full flex-shrink-0"
                    :class="{
                      'bg-red-500': ticket.priority === 'high',
                      'bg-yellow-400': ticket.priority === 'normal',
                      'bg-muted': ticket.priority === 'low' || !ticket.priority
                    }"
                  />
                  <span class="text-sm font-mono font-medium text-muted-foreground">#{{ ticket.id }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-semibold text-primary">
                      {{ getCustomerName(ticket.customerId).charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <span class="text-sm font-medium truncate max-w-[120px]">{{ getCustomerName(ticket.customerId) }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1.5">
                  <Smartphone class="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span class="text-sm">{{ ticket.device }} <span class="text-muted-foreground text-xs">{{ ticket.deviceModel || '' }}</span></span>
                </div>
              </TableCell>
              <TableCell class="hidden md:table-cell">
                <p class="text-sm text-muted-foreground truncate max-w-[200px]">{{ ticket.issue }}</p>
              </TableCell>
              <TableCell class="hidden sm:table-cell">
                <Badge :variant="getPriorityVariant(ticket.priority)" class="font-normal text-xs capitalize">
                  {{ ticket.priority || 'normal' }}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                  :class="{
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400': ticket.status === 'Open',
                    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400': ticket.status === 'In Progress',
                    'bg-orange-500/10 text-orange-600 dark:text-orange-400': ticket.status === 'Waiting for Parts',
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400': ticket.status === 'Completed',
                    'bg-gray-500/10 text-gray-500': ticket.status === 'Delivered'
                  }"
                >
                  {{ ticket.status }}
                </span>
              </TableCell>
              <TableCell class="hidden lg:table-cell text-right">
                <span class="text-sm font-medium">{{ formatCurrency(ticket.price) }}</span>
              </TableCell>
              <TableCell class="hidden lg:table-cell text-right">
                <span class="text-xs text-muted-foreground">{{ formatDate(ticket.createdAt) }}</span>
              </TableCell>
            </TableRow>

            <!-- Empty State -->
            <TableRow v-if="filteredTickets.length === 0">
              <TableCell colspan="8" class="h-48 text-center">
                <div class="flex flex-col items-center justify-center">
                  <Inbox class="h-10 w-10 text-muted-foreground opacity-40 mb-3" />
                  <h3 class="text-sm font-semibold mb-1">No tickets found</h3>
                  <p class="text-xs text-muted-foreground mb-4">
                    {{ searchQuery || filterStatus ? 'Try adjusting your search or filter.' : 'Get started by creating your first ticket.' }}
                  </p>
                  <Button size="sm" variant="outline" @click="newTicketOpen = true">
                    <Plus class="w-3.5 h-3.5 mr-1.5" />Create Ticket
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />

    <!-- Ticket Detail Dialog -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Smartphone class="w-4 h-4" />
            Ticket #{{ selectedTicket?.id }}
          </DialogTitle>
        </DialogHeader>

        <div v-if="selectedTicket" class="space-y-5 py-2">
          <!-- Info grid -->
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm bg-muted/30 rounded-lg p-4">
            <div>
              <p class="text-muted-foreground text-xs mb-0.5">Customer</p>
              <p class="font-medium">{{ getCustomerName(selectedTicket.customerId) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs mb-0.5">Device</p>
              <p class="font-medium">{{ selectedTicket.device }} {{ selectedTicket.deviceModel || '' }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs mb-0.5">Issue</p>
              <p class="font-medium">{{ selectedTicket.issue }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs mb-0.5">Price</p>
              <p class="font-medium">{{ formatCurrency(selectedTicket.price) }}</p>
            </div>
            <div v-if="selectedTicket.serialNumber">
              <p class="text-muted-foreground text-xs mb-0.5">Serial #</p>
              <p class="font-medium">{{ selectedTicket.serialNumber }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs mb-0.5">Created</p>
              <p class="font-medium">{{ formatDate(selectedTicket.createdAt) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
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
          </div>

          <!-- Note -->
          <div class="space-y-1.5">
            <Label>Add Note</Label>
            <Textarea v-model="newNote" placeholder="Add a note..." :rows="2" />
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
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/table'
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
