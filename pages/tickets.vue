<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ───────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #f59e0b18">
          <TicketIcon class="w-5 h-5" style="color: #f59e0b" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p class="text-xs text-muted-foreground mt-0.5">Manage and track repair tickets</p>
        </div>
      </div>
      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
        style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        @click="newTicketOpen = true"
      >
        <Plus class="w-4 h-4" /> New Ticket
      </button>
    </div>

    <!-- ── Stat / Filter Cards ───────────────────────────────────── -->
    <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <div
        v-for="stat in ticketStats"
        :key="stat.label"
        class="rounded-3xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
        :style="`background: ${stat.color}12; outline: ${filterStatus === stat.filter ? `2px solid ${stat.color}60` : `1px solid ${stat.color}25`}`"
        @click="filterStatus = stat.filter"
      >
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" :style="`background: ${stat.color}20`">
          <component :is="stat.icon" class="h-5 w-5" :style="`color: ${stat.color}`" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
          <p class="text-2xl font-bold" :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Search & Filters ──────────────────────────────────────── -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input v-model="searchQuery" placeholder="Search tickets…" class="w-full h-10 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground" />
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          class="px-3 py-1.5 rounded-2xl text-xs font-medium transition-all"
          :style="!filterStatus ? 'background: #f59e0b22; color: #f59e0b; outline: 1.5px solid #f59e0b50' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
          @click="filterStatus = null"
        >All</button>
        <button
          v-for="status in statusList"
          :key="status"
          class="px-3 py-1.5 rounded-2xl text-xs font-medium transition-all"
          :style="filterStatus === status ? `background: ${ticketStatusColor(status)}22; color: ${ticketStatusColor(status)}; outline: 1.5px solid ${ticketStatusColor(status)}50` : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
          @click="filterStatus = status"
        >{{ status }}</button>
      </div>
      <span v-if="filterStatus" class="text-xs text-muted-foreground">{{ filteredTickets.length }} result{{ filteredTickets.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- ── Tickets Table ─────────────────────────────────────────── -->
    <div class="rounded-3xl overflow-hidden bg-card" style="outline: 1px solid hsl(var(--border))">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b" style="background: hsl(var(--muted)/0.3)">
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
            class="cursor-pointer transition-colors border-b border-border/40 last:border-0 hover:bg-muted/30 group"
            @click="openTicket(ticket)"
          >
            <TableCell>
              <div class="flex items-center gap-2">
                <div class="w-1 h-8 rounded-full flex-shrink-0" :style="`background: ${priorityColor(ticket.priority)}`" />
                <span class="text-sm font-mono font-medium text-muted-foreground">#{{ ticket.id }}</span>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style="background: #f59e0b18">
                  <span class="text-xs font-bold" style="color: #f59e0b">{{ getCustomerName(ticket.customerId).charAt(0).toUpperCase() }}</span>
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
              <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize" :style="`background: ${priorityColor(ticket.priority)}18; color: ${priorityColor(ticket.priority)}`">
                {{ ticket.priority || 'normal' }}
              </span>
            </TableCell>
            <TableCell>
              <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" :style="`background: ${ticketStatusColor(ticket.status)}18; color: ${ticketStatusColor(ticket.status)}`">
                {{ ticket.status }}
              </span>
            </TableCell>
            <TableCell class="hidden lg:table-cell text-right"><span class="text-sm font-medium">{{ formatCurrency(ticket.price) }}</span></TableCell>
            <TableCell class="hidden lg:table-cell text-right"><span class="text-xs text-muted-foreground">{{ formatDate(ticket.createdAt) }}</span></TableCell>
          </TableRow>

          <!-- Empty State -->
          <TableRow v-if="filteredTickets.length === 0">
            <TableCell colspan="8" class="h-48 text-center">
              <div class="flex flex-col items-center justify-center gap-3">
                <div class="w-14 h-14 rounded-3xl flex items-center justify-center" style="background: #f59e0b12">
                  <Inbox class="h-7 w-7" style="color: #f59e0b" />
                </div>
                <p class="text-sm font-semibold">No tickets found</p>
                <p class="text-xs text-muted-foreground">{{ searchQuery || filterStatus ? 'Try adjusting your search or filter.' : 'Get started by creating your first ticket.' }}</p>
                <button class="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold" style="background: #f59e0b18; color: #f59e0b" @click="newTicketOpen = true">
                  <Plus class="w-3.5 h-3.5" /> Create Ticket
                </button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />

    <!-- ── Ticket Detail Dialog ──────────────────────────────────── -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-2xl rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #f59e0b08">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #f59e0b20">
            <Smartphone class="w-4 h-4" style="color: #f59e0b" />
          </div>
          <div>
            <h2 class="font-semibold text-base">Ticket #{{ selectedTicket?.id }}</h2>
            <p class="text-xs text-muted-foreground mt-0.5">{{ selectedTicket?.device }}</p>
          </div>
        </div>

        <div v-if="selectedTicket" class="p-6 space-y-5">
          <!-- Info grid -->
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm rounded-2xl p-4" style="background: hsl(var(--muted)/0.3)">
            <div v-for="field in ticketFields(selectedTicket)" :key="field.label">
              <p class="text-muted-foreground text-xs mb-0.5">{{ field.label }}</p>
              <p class="font-medium">{{ field.value }}</p>
            </div>
          </div>

          <!-- Status + Priority chips -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="s in statusList" :key="s"
                  class="px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all"
                  :style="editStatus === s ? `background: ${ticketStatusColor(s)}22; color: ${ticketStatusColor(s)}; outline: 1.5px solid ${ticketStatusColor(s)}50` : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                  @click="editStatus = s"
                >{{ s }}</button>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</label>
              <div class="flex gap-2">
                <button v-for="p in ['low','normal','high']" :key="p"
                  class="flex-1 py-1.5 rounded-xl text-[10px] font-semibold capitalize transition-all"
                  :style="editPriority === p ? `background: ${priorityColor(p)}22; color: ${priorityColor(p)}; outline: 1.5px solid ${priorityColor(p)}50` : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                  @click="editPriority = p"
                >{{ p }}</button>
              </div>
            </div>
          </div>

          <!-- Note -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Note</label>
            <Textarea v-model="newNote" placeholder="Add a note…" :rows="2" class="rounded-2xl border-0 bg-muted/50 resize-none" />
          </div>

          <!-- Quick complete banner -->
          <div v-if="editStatus !== 'Completed'" class="flex items-center justify-between rounded-2xl px-4 py-3" style="background: #10b98112; outline: 1px solid #10b98120">
            <div class="flex items-center gap-2 text-sm" style="color: #10b981">
              <CheckCircle class="w-4 h-4" />
              <span>Mark this ticket as complete?</span>
            </div>
            <button class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105" style="background: #10b98118; color: #10b981; outline: 1px solid #10b98130" @click="editStatus = 'Completed'">
              Complete
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-1">
            <button class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-muted/60" style="outline: 1.5px solid hsl(var(--border))" @click="detailOpen = false">Cancel</button>
            <button class="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50" style="background: #ef444418" :disabled="saving" @click="handleDeleteTicket">
              <Trash2 class="w-4 h-4" style="color: #ef4444" />
            </button>
            <button
              class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-50"
              style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              :disabled="saving"
              @click="handleSaveTicket"
            >{{ saving ? 'Saving…' : 'Save Changes' }}</button>
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
import { Search, Plus, Smartphone, Inbox, Clock, CheckCircle, BarChart3, Trash2, TicketCheck as TicketIcon } from 'lucide-vue-next'
import type { Ticket } from '~/types'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/table'
import { Dialog, DialogContent } from '~/components/ui/dialog'
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

const ticketStatusColor = (status: string) => {
  const map: Record<string, string> = {
    'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316',
    'Completed': '#10b981', 'Delivered': '#64748b'
  }
  return map[status] || '#64748b'
}

const priorityColor = (p: string) => ({ low: '#64748b', normal: '#3b82f6', high: '#ef4444' }[p] || '#64748b')

const ticketStats = computed(() => [
  { label: 'Total',       value: (tickets.value || []).length, color: '#64748b', icon: BarChart3,    filter: null },
  { label: 'Open',        value: getStatusCount('Open'),        color: '#3b82f6', icon: Inbox,        filter: 'Open' },
  { label: 'In Progress', value: getStatusCount('In Progress'), color: '#f59e0b', icon: Clock,        filter: 'In Progress' },
  { label: 'Completed',   value: getStatusCount('Completed'),   color: '#10b981', icon: CheckCircle,  filter: 'Completed' },
])

const ticketFields = (t: Ticket) => [
  { label: 'Customer', value: getCustomerName(t.customerId) },
  { label: 'Device',   value: `${t.device} ${t.deviceModel || ''}`.trim() },
  { label: 'Issue',    value: t.issue },
  { label: 'Price',    value: formatCurrency(t.price) },
  ...(t.serialNumber ? [{ label: 'Serial #', value: t.serialNumber }] : []),
  { label: 'Created',  value: formatDate(t.createdAt) },
]

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
    // If a new customer was submitted inline, create them first
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) {
      const created = await appStore.createCustomer({
        name: ticketData.newCustomer.name,
        phone: ticketData.newCustomer.phone || '',
        email: ticketData.newCustomer.email || '',
        address: ticketData.newCustomer.address || '',
      })
      customerId = created?.id ?? null
    }
    await createTicket({
      customerId,
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

