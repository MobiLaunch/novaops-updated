<template>
  <div class="page-shell">
    <header class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs text-muted-foreground m-0">Repair Shop</p>
        <h1 class="text-xl font-black m-0">Booking Management</h1>
        <p class="text-sm text-muted-foreground m-0">Tickets, house calls & vendor repairs</p>
      </div>
      <v-btn v-if="activeTab === 'tickets'" color="primary" class="font-bold text-none" @click="newTicketOpen = true">
        <i class="mdi mdi-plus mr-1"></i> New Ticket
      </v-btn>
      <v-btn v-else-if="activeTab === 'housecalls'" color="success" class="font-bold text-none" @click="openNewHousecall">
        <i class="mdi mdi-plus mr-1"></i> Schedule Call
      </v-btn>
      <v-btn v-else-if="activeTab === 'thirdparty'" color="secondary" class="font-bold text-none" @click="openNewVendorRepair">
        <i class="mdi mdi-plus mr-1"></i> New Vendor Repair
      </v-btn>
    </header>

    <v-tabs v-model="activeTab" bg-color="transparent" color="primary" align-tabs="start">
      <v-tab value="tickets">
        <i class="mdi mdi-ticket-outline mr-1"></i> Tickets
        <v-chip v-if="openTicketCount" size="x-small" color="warning" class="ml-2 font-bold">{{ openTicketCount }}</v-chip>
      </v-tab>
      <v-tab value="housecalls">
        <i class="mdi mdi-map-marker-outline mr-1"></i> House Calls
        <v-chip v-if="activeHousecallCount" size="x-small" color="success" class="ml-2 font-bold">{{ activeHousecallCount }}</v-chip>
      </v-tab>
      <v-tab value="thirdparty">
        <i class="mdi mdi-domain mr-1"></i> Vendor Repairs
        <v-chip v-if="activeVendorCount" size="x-small" color="secondary" class="ml-2 font-bold">{{ activeVendorCount }}</v-chip>
      </v-tab>
      <v-tab value="calendar"><i class="mdi mdi-calendar mr-1"></i> Calendar</v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="pt-4">
      <!-- TICKETS -->
      <v-window-item value="tickets">
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
          <v-text-field
            v-model="ticketSearch"
            placeholder="Search tickets…"
            prepend-inner-icon="mdi-magnify"
            hide-details
            variant="outlined"
            density="compact"
            class="flex-1 min-w-[200px] rounded-full"
          />
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
          <v-data-table
            :items="filteredTickets"
            :headers="[
              { title: '#', key: 'id', width: '70px' },
              { title: 'Customer', key: 'customer', minWidth: '140px' },
              { title: 'Device', key: 'device', minWidth: '180px' },
              { title: 'Priority', key: 'priority', width: '100px' },
              { title: 'Status', key: 'status', width: '160px' },
              { title: 'Price', key: 'price', width: '100px' },
              { title: 'Date', key: 'date', width: '120px' },
              { title: '', key: 'actions', width: '110px', sortable: false },
            ]"
            :items-per-page="15"
            class="text-sm"
            @click:row="(event, { item }) => openTicket(item)"
          >
            <template #item.id="{ item }">
              <span class="text-xs font-bold text-amber-600">#{{ item.id }}</span>
            </template>
            <template #item.customer="{ item }">
              <span class="text-sm font-medium">{{ getCustomerName(item.customerId) }}</span>
            </template>
            <template #item.device="{ item }">
              <div class="text-sm font-medium">{{ item.device }} {{ item.deviceModel || '' }}</div>
              <div class="text-xs text-muted-foreground truncate">{{ item.issue }}</div>
            </template>
            <template #item.priority="{ item }">
              <v-chip :color="prioritySeverity(item.priority)" size="x-small" class="font-bold">{{ item.priority || 'normal' }}</v-chip>
            </template>
            <template #item.status="{ item }">
              <v-chip :color="ticketStatusSeverity(item.status)" size="x-small" class="font-bold">{{ item.status }}</v-chip>
            </template>
            <template #item.price="{ item }">
              <span class="text-sm font-bold" :style="{ color: ticketStatusHex(item.status) }">{{ formatCurrency(item.price) }}</span>
            </template>
            <template #item.date="{ item }">
              <span class="text-xs text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
            </template>
            <template #item.actions="{ item }">
              <div class="flex gap-1" @click.stop>
                <v-btn variant="text" icon size="small" class="!w-8 !h-8" @click.stop="openTicket(item)"><i class="mdi mdi-pencil-outline text-sm"></i></v-btn>
                <v-btn variant="text" icon size="small" class="!w-8 !h-8" @click.stop="copyTicketInfo(item)"><i class="mdi mdi-content-copy text-sm"></i></v-btn>
                <v-btn variant="text" icon color="error" size="small" class="!w-8 !h-8" @click.stop="pendingDelete = item"><i class="mdi mdi-delete-outline text-sm"></i></v-btn>
              </div>
            </template>
            <template #no-data>
              <div class="text-center py-10 text-muted-foreground">
                <i class="mdi mdi-ticket-outline text-5xl block mb-2 opacity-40"></i>
                <p class="text-sm font-medium m-0">No tickets found</p>
                <v-btn color="primary" class="mt-3 text-none" size="small" @click="newTicketOpen = true">Create First Ticket</v-btn>
              </div>
            </template>
          </v-data-table>
        </div>
      </v-window-item>

      <!-- HOUSE CALLS -->
      <v-window-item value="housecalls">
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
          <v-text-field
            v-model="housecallSearch"
            placeholder="Search name, address or issue…"
            prepend-inner-icon="mdi-magnify"
            hide-details
            variant="outlined"
            density="compact"
            class="flex-1 min-w-[200px] rounded-full"
          />
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
              <v-chip :color="housecallStatusSeverity(call.status)" size="x-small" class="shrink-0 font-bold">{{ call.status }}</v-chip>
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
              <v-btn
                v-if="call.status !== 'Completed'"
                size="small"
                class="text-none"
                :color="call.status === 'Scheduled' ? 'warning' : 'success'"
                @click.stop="advanceHousecallStatus(call)"
              >{{ call.status === 'Scheduled' ? 'Start Call' : 'Complete' }}</v-btn>
              <div class="flex-grow-1"></div>
              <v-btn variant="text" color="error" size="small" @click.stop="pendingDeleteHousecall = call">
                <i class="mdi mdi-delete-outline"></i>
              </v-btn>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 border border-dashed border-border rounded-xl">
          <i class="mdi mdi-map-marker text-5xl text-muted-foreground opacity-40 block mb-2"></i>
          <p class="font-bold m-0">No house calls {{ housecallFilter !== 'All' ? `with status "${housecallFilter}"` : 'scheduled' }}</p>
          <p class="text-sm text-muted-foreground mb-4">Schedule your first on-site visit</p>
          <v-btn color="success" class="text-none" @click="openNewHousecall">Schedule Call</v-btn>
        </div>
      </v-window-item>

      <!-- VENDOR REPAIRS -->
      <v-window-item value="thirdparty">
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
          <v-text-field
            v-model="vendorSearch"
            placeholder="Search vendor repairs…"
            prepend-inner-icon="mdi-magnify"
            hide-details
            variant="outlined"
            density="compact"
            class="flex-1 min-w-[200px] rounded-full"
          />
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
                  <v-chip v-if="repair.ticketRef" size="x-small" color="warning" class="font-bold">#{{ repair.ticketRef }}</v-chip>
                </div>
                <div class="text-xs text-muted-foreground">{{ repair.device }} — {{ repair.issue }} · {{ getCustomerName(repair.customerId) }}</div>
              </div>
              <div class="flex gap-2 shrink-0">
                <v-chip v-if="isOverdue(repair)" size="x-small" color="error" class="font-bold">OVERDUE</v-chip>
                <v-chip :color="vendorStatusSeverity(repair.status)" size="x-small" class="font-bold">{{ repair.status }}</v-chip>
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
          <v-btn color="secondary" class="text-none" @click="openNewVendorRepair">New Vendor Repair</v-btn>
        </div>
      </v-window-item>

      <v-window-item value="calendar">
        <CalendarTab />
      </v-window-item>
    </v-window>

    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />
    <TicketDetailDialog
      v-if="selectedTicket"
      v-model="ticketDetailOpen"
      :ticket="selectedTicket"
      @save="handleSaveTicket"
      @delete="handleDeleteTicket"
    />

    <v-dialog v-model="deleteDialogOpen" max-width="400px">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="pa-0 mb-3 text-lg font-bold">Delete ticket permanently?</v-card-title>
        <p v-if="pendingDelete" class="text-sm text-muted-foreground m-0 mb-4">
          Ticket #{{ pendingDelete.id }} for {{ getCustomerName(pendingDelete.customerId) }} — this cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <v-btn variant="text" class="text-none" @click="pendingDelete = null">Cancel</v-btn>
          <v-btn color="error" class="text-none" @click="executePendingDelete">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <HouseCallDialog v-model="housecallFormOpen" :editing-call="editingHousecall" />

    <v-dialog v-model="deleteHousecallDialogOpen" max-width="400px">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="pa-0 mb-3 text-lg font-bold">Delete house call?</v-card-title>
        <p v-if="pendingDeleteHousecall" class="text-sm m-0 mb-4">Remove call for {{ getCustomerName(pendingDeleteHousecall.customerId) }}?</p>
        <div class="flex justify-end gap-2">
          <v-btn variant="text" class="text-none" @click="pendingDeleteHousecall = null">Cancel</v-btn>
          <v-btn color="error" class="text-none" @click="executeDeleteHousecall">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="vendorFormOpen" max-width="500px">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="pa-0 mb-1 text-lg font-bold">
          {{ editingVendorRepair ? 'Edit Vendor Repair' : 'New Vendor Repair' }}
        </v-card-title>
        <p class="text-xs text-muted-foreground mt-0 mb-4">Third-party repair sent out to vendor</p>
        <div class="flex flex-col gap-4">
          <CustomerSelect v-model="vendorForm.customerId" />
          <div class="grid grid-cols-2 gap-3">
            <v-text-field v-model="vendorForm.device" placeholder="Device" hide-details variant="outlined" density="compact" class="rounded-xl" />
            <v-text-field v-model="vendorForm.issue" placeholder="Issue" hide-details variant="outlined" density="compact" class="rounded-xl" />
            <v-text-field v-model="vendorForm.vendor" placeholder="Vendor / repair center" hide-details variant="outlined" density="compact" class="rounded-xl" />
            <v-text-field v-model="vendorForm.ticketRef" placeholder="Ticket # (optional)" hide-details variant="outlined" density="compact" class="rounded-xl" />
            <v-text-field v-model="vendorForm.trackingNumber" placeholder="Tracking number" hide-details variant="outlined" density="compact" class="rounded-xl" />
            <v-select v-model="vendorForm.status" :items="vendorStatusList" placeholder="Status" hide-details variant="outlined" density="compact" class="w-full" />
            <v-text-field v-model="vendorForm.sentDate" type="date" placeholder="Date sent" hide-details variant="outlined" density="compact" class="rounded-xl" />
            <v-text-field v-model="vendorForm.estReturn" type="date" placeholder="Est. return" hide-details variant="outlined" density="compact" class="rounded-xl" />
          </div>
          <v-textarea v-model="vendorForm.notes" rows="3" placeholder="Notes" hide-details variant="outlined" density="compact" class="w-full rounded-xl" />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <v-btn variant="text" class="text-none" @click="vendorFormOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="text-none font-bold" @click="saveVendorRepair">{{ editingVendorRepair ? 'Save Changes' : 'Create' }}</v-btn>
        </div>
      </v-card>
    </v-dialog>
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
