<template>
  <div>

    <!-- ── Page header ─────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div>
        <p class="text-caption text-medium-emphasis mb-0">Mobicare Device Recovery</p>
        <h1 class="text-h5 font-weight-black">Customers</h1>
        <p class="text-body-2 text-medium-emphasis">{{ customers.length }} total clients</p>
      </div>
      <v-btn color="info" prepend-icon="mdi-account-plus" @click="openNew">Add Customer</v-btn>
    </div>

    <!-- ── KPI cards ─────────────────────────────────────────────── -->
    <v-row dense class="mb-4">
      <v-col cols="6" sm="3">
        <v-card rounded="xl" class="pa-4">
          <v-avatar color="info" size="36" rounded="lg" variant="tonal" class="mb-2">
            <v-icon color="info" size="18">mdi-account-group</v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-black text-info">{{ customers.length }}</div>
          <div class="text-caption text-medium-emphasis">Total Customers</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" class="pa-4">
          <v-avatar color="success" size="36" rounded="lg" variant="tonal" class="mb-2">
            <v-icon color="success" size="18">mdi-currency-usd</v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-black text-success">{{ formatCurrency(totalRevenue) }}</div>
          <div class="text-caption text-medium-emphasis">Total Revenue</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" class="pa-4">
          <v-avatar color="warning" size="36" rounded="lg" variant="tonal" class="mb-2">
            <v-icon color="warning" size="18">mdi-trending-up</v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-black text-warning">{{ formatCurrency(avgRevenue) }}</div>
          <div class="text-caption text-medium-emphasis">Avg per Customer</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" class="pa-4">
          <v-avatar color="primary" size="36" rounded="lg" variant="tonal" class="mb-2">
            <v-icon color="primary" size="18">mdi-ticket-outline</v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-black text-primary">{{ tickets.length }}</div>
          <div class="text-caption text-medium-emphasis">Total Tickets</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Customer table ────────────────────────────────────────── -->
    <v-card rounded="xl">
      <v-card-title class="pa-4 pb-0">
        <v-text-field
          v-model="q"
          placeholder="Search customers…"
          prepend-inner-icon="mdi-magnify"
          hide-details
          density="compact"
          rounded="pill"
          style="max-width:320px"
        />
      </v-card-title>

      <v-data-table
        :headers="customerHeaders"
        :items="filteredCustomers"
        :search="q"
        :items-per-page="20"
        density="comfortable"
        hover
        @click:row="(_, { item }) => openDetail(item)"
      >
        <!-- Avatar + name -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3 py-1">
            <v-avatar :color="avatarColor(item.name)" size="34" class="text-caption font-weight-bold text-white flex-shrink-0">
              {{ initials(item.name) }}
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-bold">{{ item.name }}</div>
              <div v-if="item.email" class="text-caption text-medium-emphasis">{{ item.email }}</div>
            </div>
          </div>
        </template>

        <!-- Phone -->
        <template #item.phone="{ item }">
          <span class="text-body-2">{{ item.phone || '—' }}</span>
        </template>

        <!-- Tickets count -->
        <template #item.ticketCount="{ item }">
          <v-chip
            :color="custTickets(item.id) > 0 ? 'primary' : undefined"
            :variant="custTickets(item.id) > 0 ? 'tonal' : 'outlined'"
            size="x-small"
          >{{ custTickets(item.id) }}</v-chip>
        </template>

        <!-- Revenue -->
        <template #item.revenue="{ item }">
          <span class="text-body-2 font-weight-bold text-success">
            {{ formatCurrency(custRevenue(item.id)) }}
          </span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1" @click.stop>
            <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click.stop="startEdit(item)" />
            <v-btn
              icon="mdi-email-outline"
              size="x-small"
              variant="text"
              color="info"
              :disabled="!item.email && !item.phone"
              @click.stop="messageCustomer(item)"
            />
            <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click.stop="deleteCustomer(item)" />
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-10 text-medium-emphasis">
            <v-icon size="48" class="mb-2 opacity-30">mdi-account-group</v-icon>
            <p class="text-body-2 font-weight-medium">No customers yet</p>
            <v-btn color="info" variant="tonal" size="small" class="mt-3" @click="openNew">Add First Customer</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Customer Detail Dialog ─────────────────────────────────── -->
    <v-dialog v-model="detailOpen" max-width="560" scrollable>
      <v-card v-if="selected" rounded="xl">
        <v-card-item class="border-b">
          <template #prepend>
            <v-avatar :color="avatarColor(selected.name)" size="44" class="text-body-1 font-weight-bold text-white">
              {{ initials(selected.name) }}
            </v-avatar>
          </template>
          <v-card-title>{{ selected.name }}</v-card-title>
          <v-card-subtitle>{{ selected.email || 'No email' }}</v-card-subtitle>
          <template #append>
            <v-btn icon="mdi-close" variant="text" @click="detailOpen = false" />
          </template>
        </v-card-item>

        <v-card-text class="pa-6">
          <!-- Contact info -->
          <v-list density="compact" class="mb-4">
            <v-list-item v-if="selected.phone" prepend-icon="mdi-phone-outline" :title="selected.phone" :href="`tel:${selected.phone}`" />
            <v-list-item v-if="selected.email" prepend-icon="mdi-email-outline" :title="selected.email" @click="messageCustomer(selected)" />
            <v-list-item v-if="selected.address" prepend-icon="mdi-map-marker-outline" :title="selected.address" />
            <v-list-item v-if="selected.driversLicense" prepend-icon="mdi-card-account-details-outline" :title="selected.driversLicense" subtitle="Driver's License" />
          </v-list>

          <!-- Stats -->
          <v-row dense class="mb-4">
            <v-col cols="6">
              <v-card color="primary" variant="tonal" rounded="lg" class="pa-3 text-center">
                <div class="text-h6 font-weight-black">{{ custTickets(selected.id) }}</div>
                <div class="text-caption">Tickets</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card color="success" variant="tonal" rounded="lg" class="pa-3 text-center">
                <div class="text-h6 font-weight-black">{{ formatCurrency(custRevenue(selected.id)) }}</div>
                <div class="text-caption">Revenue</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Ticket history -->
          <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2">Ticket History</p>
          <div v-if="custTicketList(selected.id).length === 0" class="text-center py-4 text-medium-emphasis">
            <v-icon class="opacity-30">mdi-ticket-outline</v-icon>
            <p class="text-caption mt-1">No tickets yet</p>
          </div>
          <v-list v-else density="compact" lines="two">
            <v-list-item
              v-for="t in custTicketList(selected.id).slice(0, 6)"
              :key="t.id"
              :subtitle="`${t.device} · ${formatCurrency(t.price)}`"
              rounded="lg"
            >
              <template #prepend>
                <v-chip :color="ticketStatusColor(t.status)" size="x-small" variant="tonal" class="me-2">#{{ t.id }}</v-chip>
              </template>
              <template #title>
                <span class="text-body-2 font-weight-medium">{{ t.status }}</span>
              </template>
            </v-list-item>
          </v-list>

          <div v-if="selected.notes" class="mt-4 pa-3 rounded-lg" style="background:rgba(0,0,0,0.04)">
            <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-1">Notes</p>
            <p class="text-body-2">{{ selected.notes }}</p>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn color="error" variant="text" prepend-icon="mdi-delete-outline" @click="deleteCustomer(selected); detailOpen = false">Delete</v-btn>
          <v-spacer />
          <v-btn variant="outlined" prepend-icon="mdi-pencil-outline" @click="startEdit()">Edit</v-btn>
          <v-btn color="info" prepend-icon="mdi-email-outline" :disabled="!selected.email && !selected.phone" @click="messageCustomer(selected)">Message</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── New / Edit Customer Dialog ─────────────────────────────── -->
    <v-dialog v-model="newOpen" max-width="560">
      <v-card rounded="xl">
        <v-card-item class="border-b">
          <template #prepend>
            <v-avatar color="info" size="40" rounded="lg">
              <v-icon color="white">{{ editingCustomer ? 'mdi-pencil' : 'mdi-account-plus' }}</v-icon>
            </v-avatar>
          </template>
          <v-card-title>{{ editingCustomer ? `Edit ${editingCustomer.name}` : 'New Customer' }}</v-card-title>
          <v-card-subtitle>{{ editingCustomer ? 'Update customer details' : 'Add a customer to your shop' }}</v-card-subtitle>
          <template #append>
            <v-btn icon="mdi-close" variant="text" @click="newOpen = false; editingCustomer = null" />
          </template>
        </v-card-item>

        <v-card-text class="pa-6">
          <!-- Validation alert -->
          <v-alert
            v-if="validationError"
            type="warning"
            variant="tonal"
            density="compact"
            rounded="lg"
            class="mb-4"
            closable
            @click:close="validationError = ''"
          >{{ validationError }}</v-alert>

          <v-row dense>
            <v-col cols="12">
              <v-text-field v-model="form.name" label="Full Name *" placeholder="Jane Smith" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.phone" label="Phone" placeholder="(555) 123-4567" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.email" label="Email" type="email" placeholder="jane@email.com" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.driversLicense" label="Driver's License" placeholder="Optional" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.address" label="Address" placeholder="Street, City, State" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.notes" label="Notes" rows="2" placeholder="Additional info…" />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="newOpen = false; editingCustomer = null">Cancel</v-btn>
          <v-btn color="info" @click="saveCustomer">{{ editingCustomer ? 'Save Changes' : 'Add Customer' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card rounded="xl">
        <v-card-item>
          <template #prepend>
            <v-avatar color="error" size="44" rounded="lg" variant="tonal">
              <v-icon color="error">mdi-delete-outline</v-icon>
            </v-avatar>
          </template>
          <v-card-title>Delete {{ deleteConfirmTarget?.name }}?</v-card-title>
          <v-card-subtitle>This cannot be undone.</v-card-subtitle>
        </v-card-item>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteConfirmTarget = null">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="executeDeleteCustomer">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: ['auth'] })

const router   = useRouter()
const appStore = useAppStore()
const customers = computed(() => appStore.customers ?? [])
const tickets   = computed(() => appStore.tickets ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$' })

const { toast } = useToast()

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const custRevenue = (id: number) => tickets.value.filter((t: any) => t.customerId === id).reduce((a: number, t: any) => a + (t.price || 0), 0)
const custTickets = (id: number) => tickets.value.filter((t: any) => t.customerId === id).length
const custTicketList = (id: number) => tickets.value.filter((t: any) => t.customerId === id)
const totalRevenue = computed(() => tickets.value.reduce((a: number, t: any) => a + (t.price || 0), 0))
const avgRevenue   = computed(() => customers.value.length > 0 ? totalRevenue.value / customers.value.length : 0)

const ticketStatusColor = (s: string) => ({ Open: 'info', 'In Progress': 'warning', 'Waiting for Parts': 'error', Completed: 'success', Delivered: 'secondary' }[s] || 'secondary')

const AVATAR_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444']
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials    = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

// ── State ─────────────────────────────────────────────────────────
const q               = ref('')
const newOpen         = ref(false)
const detailOpen      = ref(false)
const selected        = ref<any>(null)
const editingCustomer = ref<any>(null)
const validationError = ref('')
const form = ref({ name: '', phone: '', email: '', driversLicense: '', address: '', notes: '' })
const deleteConfirmTarget = ref<any>(null)
const deleteDialogOpen = computed({ get: () => !!deleteConfirmTarget.value, set: v => { if (!v) deleteConfirmTarget.value = null } })

const filteredCustomers = computed(() =>
  customers.value.filter((c: any) =>
    !q.value || c.name?.toLowerCase().includes(q.value.toLowerCase()) || c.email?.toLowerCase().includes(q.value.toLowerCase()) || c.phone?.includes(q.value)
  )
)

// ── Customer table headers ─────────────────────────────────────────
const customerHeaders = [
  { title: 'Name',    key: 'name',        minWidth: 200 },
  { title: 'Phone',   key: 'phone',       width: 150 },
  { title: 'Tickets', key: 'ticketCount', width: 100, align: 'center' as const, sortable: false },
  { title: 'Revenue', key: 'revenue',     width: 120, align: 'end' as const, sortable: false },
  { title: '',        key: 'actions',     width: 120, sortable: false },
]

// ── Actions ───────────────────────────────────────────────────────
function openNew() {
  editingCustomer.value = null
  form.value = { name: '', phone: '', email: '', driversLicense: '', address: '', notes: '' }
  validationError.value = ''
  newOpen.value = true
}

function openDetail(c: any) {
  selected.value = c
  detailOpen.value = true
}

function startEdit(c?: any) {
  const customer = c || selected.value
  editingCustomer.value = customer
  form.value = {
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    driversLicense: customer.driversLicense || '',
    address: customer.address || '',
    notes: customer.notes || '',
  }
  validationError.value = ''
  detailOpen.value = false
  newOpen.value = true
}

async function saveCustomer() {
  if (!form.value.name.trim()) {
    validationError.value = 'Please enter a customer name'
    toast.warning('Name required', 'Please enter a customer name')
    return
  }
  if (editingCustomer.value?.id) {
    await appStore.updateCustomer(editingCustomer.value.id, { name: form.value.name, phone: form.value.phone, email: form.value.email, notes: form.value.notes, driversLicense: form.value.driversLicense, address: form.value.address })
    toast.success('Updated', form.value.name)
  } else {
    await appStore.createCustomer({ ...form.value })
    toast.success('Customer Added', form.value.name)
  }
  newOpen.value = false
  editingCustomer.value = null
  form.value = { name: '', phone: '', email: '', driversLicense: '', address: '', notes: '' }
}

function deleteCustomer(c: any) {
  deleteConfirmTarget.value = c
}

async function executeDeleteCustomer() {
  if (!deleteConfirmTarget.value) return
  await appStore.deleteCustomer(deleteConfirmTarget.value.id)
  toast.success('Deleted', `${deleteConfirmTarget.value.name} removed`)
  deleteConfirmTarget.value = null
  detailOpen.value = false
}

function messageCustomer(c: any) {
  detailOpen.value = false
  router.push({ path: '/messages', query: { compose: '1', customerId: String(c.id) } })
}
</script>
