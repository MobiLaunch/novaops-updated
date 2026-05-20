<template>
  <div class="page-shell">
    <header class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs text-muted-foreground m-0">Repair Shop</p>
        <h1 class="text-xl font-black m-0">Booking Management</h1>
        <p class="text-sm text-muted-foreground m-0">Tickets, house calls & vendor repairs</p>
      </div>
      <Button v-if="activeTab === 'tickets'" label="New Ticket" class="font-bold text-none" @click="newTicketOpen = true">
        <i class="mdi mdi-plus mr-1"></i>
      </Button>
      <Button v-else-if="activeTab === 'housecalls'" label="Schedule Call" severity="success" class="font-bold text-none" @click="openNewHousecall">
        <i class="mdi mdi-plus mr-1"></i>
      </Button>
      <Button v-else-if="activeTab === 'thirdparty'" label="New Vendor Repair" severity="secondary" class="font-bold text-none" @click="openNewVendorRepair">
        <i class="mdi mdi-plus mr-1"></i>
      </Button>
    </header>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="tickets">
          <i class="mdi mdi-ticket-outline mr-1"></i> Tickets
          <Tag v-if="openTicketCount" :value="String(openTicketCount)" severity="warn" class="ml-2" />
        </Tab>
        <Tab value="housecalls">
          <i class="mdi mdi-map-marker-outline mr-1"></i> House Calls
          <Tag v-if="activeHousecallCount" :value="String(activeHousecallCount)" severity="success" class="ml-2" />
        </Tab>
        <Tab value="thirdparty">
          <i class="mdi mdi-domain mr-1"></i> Vendor Repairs
          <Tag v-if="activeVendorCount" :value="String(activeVendorCount)" class="ml-2" />
        </Tab>
        <Tab value="calendar"><i class="mdi mdi-calendar mr-1"></i> Calendar</Tab>
      </TabList>

      <TabPanels class="pt-4">
        <!-- TICKETS -->
        <TabPanel value="tickets">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div v-for="stat in ticketStats" :key="stat.label" class="kpi-card">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-2" :style="{ backgroundColor: stat.color + '18', color: stat.color }">
                <i class="mdi text-lg" :class="stat.icon"></i>
              </div>
              <div class="text-2xl font-black" :style="{ color: stat.color }">{{ stat.value }}</div>
              <div class="text-xs text-muted-foreground">{{ stat.label }}</div>
            </div>
          </div>

          <div class="bg-surface border border-border rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
            <div class="search-field-wrap flex-1 min-w-[200px]">
              <i class="mdi mdi-magnify"></i>
              <InputText v-model="ticketSearch" placeholder="Search tickets…" class="w-full" />
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in [null, ...statusList]"
                :key="s ?? 'all'"
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip--active': ticketFilter === s }"
                @click="ticketFilter = s"
              >{{ s ?? 'All' }}</button>
            </div>
          </div>

          <div class="bg-surface border border-border rounded-xl overflow-hidden">
            <DataTable :value="filteredTickets" :rows="15" class="text-sm" row-hover @row-click="(e: any) => openTicket(e.data)">
              <Column field="id" header="#" style="width: 70px">
                <template #body="{ data }"><span class="text-xs font-bold text-amber-600">#{{ data.id }}</span></template>
              </Column>
              <Column header="Customer" style="min-width: 140px">
                <template #body="{ data }"><span class="text-sm font-medium">{{ getCustomerName(data.customerId) }}</span></template>
              </Column>
              <Column header="Device" style="min-width: 180px">
                <template #body="{ data }">
                  <div class="text-sm font-medium">{{ data.device }} {{ data.deviceModel || '' }}</div>
                  <div class="text-xs text-muted-foreground truncate">{{ data.issue }}</div>
                </template>
              </Column>
              <Column header="Priority" style="width: 100px">
                <template #body="{ data }"><Tag :value="data.priority || 'normal'" :severity="prioritySeverity(data.priority)" /></template>
              </Column>
              <Column header="Status" style="width: 160px">
                <template #body="{ data }"><Tag :value="data.status" :severity="ticketStatusSeverity(data.status)" /></template>
              </Column>
              <Column header="Price" style="width: 100px">
                <template #body="{ data }">
                  <span class="text-sm font-bold" :style="{ color: ticketStatusHex(data.status) }">{{ formatCurrency(data.price) }}</span>
                </template>
              </Column>
              <Column header="Date" style="width: 120px">
                <template #body="{ data }"><span class="text-xs text-muted-foreground">{{ formatDate(data.createdAt) }}</span></template>
              </Column>
              <Column header="" style="width: 110px">
                <template #body="{ data }">
                  <div class="flex gap-1" @click.stop>
                    <Button variant="text" size="small" class="!w-8 !h-8" @click.stop="openTicket(data)"><i class="mdi mdi-pencil-outline text-sm"></i></Button>
                    <Button variant="text" size="small" class="!w-8 !h-8" @click.stop="copyTicketInfo(data)"><i class="mdi mdi-content-copy text-sm"></i></Button>
                    <Button variant="text" size="small" severity="danger" class="!w-8 !h-8" @click.stop="pendingDelete = data"><i class="mdi mdi-delete-outline text-sm"></i></Button>
                  </div>
                </template>
              </Column>
              <template #empty>
                <div class="text-center py-10 text-muted-foreground">
                  <i class="mdi mdi-ticket-outline text-5xl block mb-2 opacity-40"></i>
                  <p class="text-sm font-medium m-0">No tickets found</p>
                  <Button label="Create First Ticket" class="mt-3 text-none" size="small" @click="newTicketOpen = true" />
                </div>
              </template>
            </DataTable>
          </div>
        </TabPanel>

        <!-- HOUSE CALLS -->
        <TabPanel value="housecalls">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div class="kpi-card">
              <div class="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center mb-2"><i class="mdi mdi-map-marker"></i></div>
              <div class="text-2xl font-black text-emerald-600">{{ housecalls.length }}</div>
              <div class="text-xs text-muted-foreground">All Calls</div>
            </div>
            <div class="kpi-card">
              <div class="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-600 flex items-center justify-center mb-2"><i class="mdi mdi-clock-outline"></i></div>
              <div class="text-2xl font-black text-sky-600">{{ countHousecallByStatus('Scheduled') }}</div>
              <div class="text-xs text-muted-foreground">Scheduled</div>
            </div>
            <div class="kpi-card">
              <div class="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center mb-2"><i class="mdi mdi-wrench"></i></div>
              <div class="text-2xl font-black text-amber-600">{{ countHousecallByStatus('In Progress') }}</div>
              <div class="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div class="kpi-card">
              <div class="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-2"><i class="mdi mdi-check-circle-outline"></i></div>
              <div class="text-2xl font-black text-primary">{{ countHousecallByStatus('Completed') }}</div>
              <div class="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="search-field-wrap flex-1 min-w-[200px]">
              <i class="mdi mdi-magnify"></i>
              <InputText v-model="housecallSearch" placeholder="Search name, address or issue…" class="w-full" />
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="f in housecallFilterOptions"
                :key="f"
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip--active': housecallFilter === f }"
                @click="housecallFilter = f"
              >{{ f }}</button>
            </div>
          </div>

          <div v-if="filteredHousecalls.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="call in filteredHousecalls"
              :key="call.id"
              class="bg-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              @click="viewHousecall(call)"
            >
              <div class="p-4 flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <i class="mdi mdi-map-marker"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold truncate">{{ getCustomerName(call.customerId) }}</div>
                  <div class="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <i class="mdi mdi-map-marker-outline"></i>{{ call.address }}
                  </div>
                </div>
                <Tag :value="call.status" :severity="housecallStatusSeverity(call.status)" class="shrink-0" />
              </div>
              <div class="px-4 pb-3">
                <p class="text-xs text-emerald-700 font-bold m-0 mb-2">
                  <i class="mdi mdi-calendar mr-1"></i>{{ formatDate(call.date) }} at {{ call.time }}
                </p>
                <div v-if="getOsmCardUrl(call.address)" class="rounded-lg overflow-hidden mb-2 h-20 pointer-events-none">
                  <iframe :src="getOsmCardUrl(call.address)" class="w-full h-full border-0" title="Map" />
                </div>
                <p class="text-xs text-muted-foreground m-0 line-clamp-2">{{ call.issue }}</p>
              </div>
              <div class="flex items-center gap-2 px-4 py-3 border-t border-border" @click.stop>
                <Button
                  v-if="call.status !== 'Completed'"
                  size="small"
                  class="text-none"
                  :severity="call.status === 'Scheduled' ? 'warn' : 'success'"
                  @click.stop="advanceHousecallStatus(call)"
                >{{ call.status === 'Scheduled' ? 'Start Call' : 'Complete' }}</Button>
                <div class="flex-1"></div>
                <Button variant="text" severity="danger" size="small" @click.stop="pendingDeleteHousecall = call">
                  <i class="mdi mdi-delete-outline"></i>
                </Button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 border border-dashed border-border rounded-xl">
            <i class="mdi mdi-map-marker text-5xl text-muted-foreground opacity-40 block mb-2"></i>
            <p class="font-bold m-0">No house calls {{ housecallFilter !== 'All' ? `with status "${housecallFilter}"` : 'scheduled' }}</p>
            <p class="text-sm text-muted-foreground mb-4">Schedule your first on-site visit</p>
            <Button label="Schedule Call" severity="success" class="text-none" @click="openNewHousecall" />
          </div>
        </TabPanel>

        <!-- VENDOR REPAIRS -->
        <TabPanel value="thirdparty">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div v-for="stat in vendorStats" :key="stat.label" class="kpi-card">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-2" :style="{ backgroundColor: stat.color + '18', color: stat.color }">
                <i class="mdi text-lg" :class="stat.icon"></i>
              </div>
              <div class="text-2xl font-black" :style="{ color: stat.color }">{{ stat.value }}</div>
              <div class="text-xs text-muted-foreground">{{ stat.label }}</div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="search-field-wrap flex-1 min-w-[200px]">
              <i class="mdi mdi-magnify"></i>
              <InputText v-model="vendorSearch" placeholder="Search vendor repairs…" class="w-full" />
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in [null, ...vendorStatusList]"
                :key="s ?? 'all'"
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip--active': vendorFilter === s }"
                @click="vendorFilter = s"
              >{{ s ?? 'All' }}</button>
            </div>
          </div>

          <div v-if="filteredVendorRepairs.length" class="flex flex-col gap-3">
            <div
              v-for="repair in filteredVendorRepairs"
              :key="repair.id"
              class="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              @click="openVendorRepair(repair)"
            >
              <div class="flex items-start gap-3 flex-wrap">
                <div class="w-10 h-10 rounded-lg bg-violet-500/15 text-violet-600 flex items-center justify-center shrink-0">
                  <i class="mdi mdi-domain"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold flex items-center gap-2 flex-wrap">
                    {{ repair.vendor }}
                    <Tag v-if="repair.ticketRef" :value="'#' + repair.ticketRef" severity="warn" />
                  </div>
                  <div class="text-xs text-muted-foreground">{{ repair.device }} — {{ repair.issue }} · {{ getCustomerName(repair.customerId) }}</div>
                </div>
                <div class="flex gap-2 shrink-0">
                  <Tag v-if="isOverdue(repair)" value="OVERDUE" severity="danger" />
                  <Tag :value="repair.status" :severity="vendorStatusSeverity(repair.status)" />
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm">
                <div><p class="text-[10px] font-black text-muted-foreground uppercase m-0 mb-0.5">Tracking</p><p class="m-0 font-medium">{{ repair.trackingNumber || 'Not provided' }}</p></div>
                <div><p class="text-[10px] font-black text-muted-foreground uppercase m-0 mb-0.5">Sent</p><p class="m-0 font-medium">{{ repair.sentDate ? formatDate(repair.sentDate) : '—' }}</p></div>
                <div>
                  <p class="text-[10px] font-black text-muted-foreground uppercase m-0 mb-0.5">Est. Return</p>
                  <p class="m-0 font-medium" :class="isOverdue(repair) ? 'text-red-600' : ''">{{ repair.estReturn ? formatDate(repair.estReturn) : '—' }}</p>
                </div>
                <div v-if="repair.notes"><p class="text-xs text-muted-foreground m-0">📝 {{ repair.notes }}</p></div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 border border-dashed border-border rounded-xl">
            <i class="mdi mdi-domain text-5xl text-muted-foreground opacity-40 block mb-2"></i>
            <p class="font-bold m-0">No vendor repairs</p>
            <p class="text-sm text-muted-foreground mb-4">Send your first device out for third-party repair</p>
            <Button label="New Vendor Repair" severity="secondary" class="text-none" @click="openNewVendorRepair" />
          </div>
        </TabPanel>

        <TabPanel value="calendar">
          <CalendarTab />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />
    <TicketDetailDialog
      v-if="selectedTicket"
      v-model="ticketDetailOpen"
      :ticket="selectedTicket"
      @save="handleSaveTicket"
      @delete="handleDeleteTicket"
    />

    <Dialog v-model:visible="deleteDialogOpen" modal header="Delete ticket permanently?" class="w-full max-w-sm mx-4">
      <p v-if="pendingDelete" class="text-sm text-muted-foreground m-0">
        Ticket #{{ pendingDelete.id }} for {{ getCustomerName(pendingDelete.customerId) }} — this cannot be undone.
      </p>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="pendingDelete = null" />
        <Button label="Delete" severity="danger" class="text-none" @click="executePendingDelete" />
      </template>
    </Dialog>

    <HouseCallDialog v-model="housecallFormOpen" :editing-call="editingHousecall" />

    <Dialog v-model:visible="deleteHousecallDialogOpen" modal header="Delete house call?" class="w-full max-w-sm mx-4">
      <p v-if="pendingDeleteHousecall" class="text-sm m-0">Remove call for {{ getCustomerName(pendingDeleteHousecall.customerId) }}?</p>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="pendingDeleteHousecall = null" />
        <Button label="Delete" severity="danger" class="text-none" @click="executeDeleteHousecall" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="vendorFormOpen"
      modal
      :header="editingVendorRepair ? 'Edit Vendor Repair' : 'New Vendor Repair'"
      class="w-full max-w-lg mx-4"
    >
      <p class="text-xs text-muted-foreground mt-0 mb-4">Third-party repair sent out to vendor</p>
      <div class="flex flex-col gap-4">
        <CustomerSelect v-model="vendorForm.customerId" />
        <div class="grid grid-cols-2 gap-3">
          <InputText v-model="vendorForm.device" placeholder="Device" class="rounded-xl" />
          <InputText v-model="vendorForm.issue" placeholder="Issue" class="rounded-xl" />
          <InputText v-model="vendorForm.vendor" placeholder="Vendor / repair center" class="rounded-xl" />
          <InputText v-model="vendorForm.ticketRef" placeholder="Ticket # (optional)" class="rounded-xl" />
          <InputText v-model="vendorForm.trackingNumber" placeholder="Tracking number" class="rounded-xl" />
          <Select v-model="vendorForm.status" :options="vendorStatusList" placeholder="Status" class="w-full" />
          <InputText v-model="vendorForm.sentDate" type="date" placeholder="Date sent" class="rounded-xl" />
          <InputText v-model="vendorForm.estReturn" type="date" placeholder="Est. return" class="rounded-xl" />
        </div>
        <Textarea v-model="vendorForm.notes" rows="3" placeholder="Notes" class="w-full rounded-xl" />
      </div>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="vendorFormOpen = false" />
        <Button :label="editingVendorRepair ? 'Save Changes' : 'Create'" class="text-none font-bold" @click="saveVendorRepair" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Ticket } from '~/types'
import {
  ticketStatusHex,
  ticketStatusSeverity,
  prioritySeverity,
  housecallStatusSeverity,
  vendorStatusSeverity,
} from '~/utils/status'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import TicketDetailDialog from '~/components/TicketDetailDialog.vue'
import HouseCallDialog from '~/components/HouseCallDialog.vue'
import CustomerSelect from '~/components/CustomerSelect.vue'
import CalendarTab from '~/components/CalendarTab.vue'
definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { tickets, customers, settings, houseCalls: housecalls, vendorRepairs } = storeToRefs(appStore)
const { sendTicketEmail, sendVendorRepairEmail, sendInternalAlert } = useEmailNotifications()
const { toast, dismiss } = useToast()
const latLonCache = ref<Record<string, any>>({})
if (typeof window !== 'undefined') {
  try { latLonCache.value = JSON.parse(localStorage.getItem('osm_cache') || '{}') } catch {}
}

const activeTab = ref<'tickets' | 'housecalls' | 'thirdparty' | 'calendar'>('tickets')

const openTicketCount    = computed(() => (tickets.value ?? []).filter(t => t.status === 'Open' || t.status === 'In Progress').length)
const activeHousecallCount = computed(() => housecalls.value.filter((c: any) => c.status !== 'Completed' && c.status !== 'Cancelled').length)
const activeVendorCount  = computed(() => vendorRepairs.value.filter((r: any) => r.status !== 'Returned to Customer' && r.status !== 'Cancelled').length)

const formatCurrency  = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const formatDate      = (d?: string) => d ? new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const getCustomerName = (id: number) => (customers.value ?? []).find((c: any) => c.id === id)?.name || 'Unknown'
const getCustomerPhone = (id: number) => (customers.value ?? []).find((c: any) => c.id === id)?.phone || ''

const ticketSearch  = ref('')
const ticketFilter  = ref<string | null>(null)
const newTicketOpen = ref(false)
const selectedTicket   = ref<Ticket | null>(null)
const ticketDetailOpen = ref(false)
const pendingDelete    = ref<Ticket | null>(null)
const deleteDialogOpen = computed({ get: () => !!pendingDelete.value, set: v => { if (!v) pendingDelete.value = null } })

const statusList = computed(() => {
  const custom = (settings.value?.statuses || 'Open,In Progress,Completed').split(',').map((s: string) => s.trim())
  const live = [...new Set((tickets.value ?? []).map(t => t.status))].filter(Boolean)
  return [...new Set([...custom, ...live])]
})

const filteredTickets = computed(() =>
  (tickets.value ?? []).filter(t => {
    const q = ticketSearch.value.toLowerCase()
    const matchSearch = !q || t.device?.toLowerCase().includes(q) || t.issue?.toLowerCase().includes(q) || t.id?.toString().includes(q) || getCustomerName(t.customerId).toLowerCase().includes(q)
    const matchStatus = !ticketFilter.value || t.status === ticketFilter.value
    return matchSearch && matchStatus
  }).sort((a, b) => (b.id || 0) - (a.id || 0))
)

const ticketStats = computed(() => [
  { label: 'Open',        value: (tickets.value ?? []).filter(t => t.status === 'Open').length,        color: '#3b82f6', icon: 'mdi-inbox' },
  { label: 'In Progress', value: (tickets.value ?? []).filter(t => t.status === 'In Progress').length, color: '#f59e0b', icon: 'mdi-clock-outline' },
  { label: 'Completed',   value: (tickets.value ?? []).filter(t => t.status === 'Completed').length,   color: '#10b981', icon: 'mdi-check-circle-outline' },
  { label: 'Total',       value: (tickets.value ?? []).length,                                         color: '#8b5cf6', icon: 'mdi-chart-bar' },
])

function openTicket(ticket: Ticket) { selectedTicket.value = { ...ticket }; ticketDetailOpen.value = true }
function handleSaveTicket() {
  if (selectedTicket.value) {
    const fresh = tickets.value.find(t => t.id === selectedTicket.value!.id)
    if (fresh) selectedTicket.value = { ...fresh }
  }
}
function handleDeleteTicket(ticket: Ticket) {
  appStore.deleteTicket(ticket.id)
  ticketDetailOpen.value = false
  selectedTicket.value = null
  toast.success('Deleted', `Ticket #${ticket.id} deleted`)
}
async function executePendingDelete() {
  if (!pendingDelete.value) return
  try { await appStore.deleteTicket(pendingDelete.value.id); toast.success('Deleted', `Ticket #${pendingDelete.value.id} deleted`) }
  catch (e: any) { toast.danger('Error', e.message) }
  pendingDelete.value = null
}
function copyTicketInfo(ticket: Ticket) {
  const text = `Ticket #${ticket.id} | ${getCustomerName(ticket.customerId)} | ${ticket.device} | ${ticket.status} | ${formatCurrency(ticket.price)}`
  navigator.clipboard.writeText(text).then(() => toast.success('Copied', 'Ticket info copied'))
}
async function handleCreateTicket(ticketData: any) {
  const id = toast.loading('Creating ticket…')
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) { const nc = await appStore.createCustomer(ticketData.newCustomer); customerId = nc.id }
    const ticket = await appStore.createTicket({ ...ticketData, customerId, status: 'Open', price: 0, services: [], parts: [], payments: [], notes: [], timeLog: [] })
    dismiss(id); toast.success('Ticket Created', `Ticket #${ticket.id} created`)
    newTicketOpen.value = false
    sendTicketEmail({ ...ticket, customerId }).catch(() => {})
    sendInternalAlert({ eventType: 'New Ticket', eventSummary: `Ticket #${ticket.id} created`, customerName: getCustomerName(customerId), customerPhone: getCustomerPhone(customerId), deviceName: ticketData.device || '', issueDescription: ticketData.issue || '', ticketNumber: String(ticket.id) }).catch(() => {})
  } catch (err: any) { dismiss(id); toast.danger('Error', err.message || 'Failed to create ticket') }
}

const housecallFilter      = ref('All')
const housecallFilterOptions = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled']
const housecallFormOpen    = ref(false)
const editingHousecall     = ref<any>(null)
const pendingDeleteHousecall = ref<any>(null)
const deleteHousecallDialogOpen = computed({ get: () => !!pendingDeleteHousecall.value, set: v => { if (!v) pendingDeleteHousecall.value = null } })
const housecallSearch      = ref('')
const countHousecallByStatus = (s: string) => housecalls.value.filter((c: any) => c.status === s).length
const filteredHousecalls = computed(() => {
  return housecalls.value.filter((c: any) => {
    const q = housecallSearch.value.toLowerCase()
    const matchSearch = !q ||
      getCustomerName(c.customerId).toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.issue || '').toLowerCase().includes(q)
    const matchStatus = housecallFilter.value === 'All' || c.status === housecallFilter.value
    return matchSearch && matchStatus
  })
})

function openNewHousecall() { editingHousecall.value = null; housecallFormOpen.value = true }
function viewHousecall(call: any) { editingHousecall.value = call; housecallFormOpen.value = true }

async function executeDeleteHousecall() {
  if (!pendingDeleteHousecall.value) return
  try { await appStore.deleteHouseCall(pendingDeleteHousecall.value.id); toast.success('Deleted', 'House call removed') }
  catch { toast.danger('Error', 'Failed to delete house call') }
  pendingDeleteHousecall.value = null
}

async function advanceHousecallStatus(call: any) {
  try { await appStore.updateHouseCall(call.id, { status: call.status === 'Scheduled' ? 'In Progress' : 'Completed' }) }
  catch { toast.danger('Error', 'Failed to update status') }
}

const osmQueue = ref<string[]>([]); let processingOsm = false
const processOsmQueue = async () => {
  if (processingOsm || !osmQueue.value.length) return; processingOsm = true
  while (osmQueue.value.length) { const addr = osmQueue.value.shift(); if (addr && !latLonCache.value[addr]) { try { const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`); const data = await res.json(); latLonCache.value[addr] = (data && data[0]) ? data[0] : { notfound: true }; localStorage.setItem('osm_cache', JSON.stringify(latLonCache.value)) } catch {} await new Promise(r => setTimeout(r, 1200)) } }
  processingOsm = false
}
const getOsmCardUrl = (address: string) => {
  if (!address || address.length < 5) return ''
  const cached = latLonCache.value[address]
  if (cached) { if (cached.notfound) return ''; const [lat1, lat2, lon1, lon2] = cached.boundingbox || [parseFloat(cached.lat) - 0.005, parseFloat(cached.lat) + 0.005, parseFloat(cached.lon) - 0.005, parseFloat(cached.lon) + 0.005]; return `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${cached.lat}%2C${cached.lon}` }
  if (!osmQueue.value.includes(address)) { osmQueue.value.push(address); processOsmQueue() }
  return ''
}

const vendorSearch   = ref('')
const vendorFilter   = ref<string | null>(null)
const vendorFormOpen = ref(false)
const editingVendorRepair = ref<any>(null)
const defaultVendorForm = () => ({ customerId: null as any, device: '', issue: '', vendor: '', ticketRef: '', trackingNumber: '', status: 'Preparing to Ship', sentDate: '', estReturn: '', notes: '' })
const vendorForm = ref(defaultVendorForm())
const vendorStatusList = ['Preparing to Ship', 'Shipped to Vendor', 'In Repair', 'Shipped Back', 'Received', 'Returned to Customer', 'Cancelled']

const filteredVendorRepairs = computed(() =>
  vendorRepairs.value.filter((r: any) => {
    const q = vendorSearch.value.toLowerCase()
    return (!q || r.vendor?.toLowerCase().includes(q) || r.device?.toLowerCase().includes(q) || r.issue?.toLowerCase().includes(q) || r.trackingNumber?.toLowerCase().includes(q) || getCustomerName(r.customerId).toLowerCase().includes(q))
      && (!vendorFilter.value || r.status === vendorFilter.value)
  }).sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
)

const vendorStats = computed(() => [
  { label: 'Total Sent',  value: vendorRepairs.value.length, color: '#8b5cf6', icon: 'mdi-package-variant' },
  { label: 'In Transit',  value: vendorRepairs.value.filter((r: any) => r.status === 'Shipped to Vendor' || r.status === 'Shipped Back').length, color: '#3b82f6', icon: 'mdi-truck' },
  { label: 'In Repair',   value: vendorRepairs.value.filter((r: any) => r.status === 'In Repair').length, color: '#f59e0b', icon: 'mdi-wrench' },
  { label: 'Overdue',     value: vendorRepairs.value.filter((r: any) => isOverdue(r)).length, color: '#ef4444', icon: 'mdi-alert-circle' },
])

const isOverdue = (r: any) => { if (!r.estReturn || r.status === 'Returned to Customer' || r.status === 'Cancelled') return false; return new Date(r.estReturn) < new Date() }

function openNewVendorRepair() { editingVendorRepair.value = null; vendorForm.value = defaultVendorForm(); vendorFormOpen.value = true }
function openVendorRepair(repair: any) { editingVendorRepair.value = repair; vendorForm.value = { ...repair }; vendorFormOpen.value = true }
async function saveVendorRepair() {
  try {
    const isNew = !editingVendorRepair.value
    if (editingVendorRepair.value) await appStore.updateVendorRepair(editingVendorRepair.value.id, { ...vendorForm.value })
    else await appStore.createVendorRepair({ ...vendorForm.value })
    vendorFormOpen.value = false; editingVendorRepair.value = null
    toast.success('Saved', isNew ? 'Vendor repair created' : 'Vendor repair updated')
    if (isNew) { sendVendorRepairEmail(vendorForm.value).catch(() => {}); sendInternalAlert({ eventType: 'Vendor Repair', eventSummary: 'New vendor repair dispatched', customerName: getCustomerName(vendorForm.value.customerId), deviceName: vendorForm.value.device || '', issueDescription: vendorForm.value.issue || '', ticketNumber: vendorForm.value.ticketRef || '' }).catch(() => {}) }
  } catch (e: any) { toast.danger('Error', e.message || 'Failed to save vendor repair') }
}
</script>
