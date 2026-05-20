<template>
  <div class="flex flex-col gap-6">

    <header class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs text-muted-foreground m-0">{{ settings.businessName || 'Your Business' }}</p>
        <h1 class="text-xl font-black m-0">Customers</h1>
        <p class="text-sm text-muted-foreground m-0">{{ customers.length }} total clients</p>
      </div>
      <Button label="Add Customer" class="font-bold text-none" @click="openNew">
        <i class="mdi mdi-account-plus mr-2"></i>
      </Button>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div v-for="kpi in kpiCards" :key="kpi.label" class="bg-surface border border-border rounded-xl p-4">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-2" :style="{ backgroundColor: kpi.color + '18', color: kpi.color }">
          <i class="mdi text-lg" :class="kpi.icon"></i>
        </div>
        <div class="text-2xl font-black" :style="{ color: kpi.color }">{{ kpi.value }}</div>
        <div class="text-xs text-muted-foreground">{{ kpi.label }}</div>
      </div>
    </div>

    <div class="bg-surface border border-border rounded-xl overflow-hidden">
      <div class="p-4 border-b border-border">
        <div class="relative max-w-xs">
          <i class="mdi mdi-magnify absolute left-3 text-muted-foreground" style="top: 50%; transform: translateY(-50%);"></i>
          <InputText v-model="q" placeholder="Search customers…" class="w-full pl-9 rounded-full" />
        </div>
      </div>

      <DataTable
        :value="filteredCustomers"
        :rows="20"
        class="text-sm"
        row-hover
        @row-click="(e: any) => openDetail(e.data)"
      >
        <Column field="name" header="Name" style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex items-center gap-3 py-1">
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                :style="{ backgroundColor: avatarColor(data.name) }"
              >{{ initials(data.name) }}</div>
              <div>
                <div class="text-sm font-bold">{{ data.name }}</div>
                <div v-if="data.email" class="text-xs text-muted-foreground">{{ data.email }}</div>
              </div>
            </div>
          </template>
        </Column>
        <Column field="phone" header="Phone">
          <template #body="{ data }">{{ data.phone || '—' }}</template>
        </Column>
        <Column header="Tickets" style="width: 100px">
          <template #body="{ data }">
            <Tag :value="String(custTickets(data.id))" :severity="custTickets(data.id) > 0 ? 'info' : 'secondary'" />
          </template>
        </Column>
        <Column header="Revenue" style="width: 120px">
          <template #body="{ data }">
            <span class="font-bold text-emerald-600">{{ formatCurrency(custRevenue(data.id)) }}</span>
          </template>
        </Column>
        <Column header="" style="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-1" @click.stop>
              <Button variant="text" size="small" class="!w-8 !h-8" @click.stop="startEdit(data)">
                <i class="mdi mdi-pencil-outline text-sm"></i>
              </Button>
              <Button variant="text" size="small" severity="info" class="!w-8 !h-8" :disabled="!data.email && !data.phone" @click.stop="contactCustomer(data)">
                <i class="mdi mdi-email-outline text-sm"></i>
              </Button>
              <Button variant="text" size="small" severity="danger" class="!w-8 !h-8" @click.stop="deleteCustomer(data)">
                <i class="mdi mdi-delete-outline text-sm"></i>
              </Button>
            </div>
          </template>
        </Column>
        <template #empty>
          <div class="text-center py-10 text-muted-foreground">
            <i class="mdi mdi-account-group text-5xl block mb-2 opacity-40"></i>
            <p class="text-sm font-medium m-0">No customers yet</p>
            <Button label="Add First Customer" class="mt-3 text-none" size="small" @click="openNew" />
          </div>
        </template>
      </DataTable>
    </div>

    <Dialog v-model:visible="detailOpen" modal :draggable="false" class="w-full max-w-lg mx-4" :header="selected?.name">
      <template v-if="selected" #header>
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full text-white flex items-center justify-center font-bold" :style="{ backgroundColor: avatarColor(selected.name) }">
            {{ initials(selected.name) }}
          </div>
          <div>
            <span class="font-black block">{{ selected.name }}</span>
            <span class="text-xs text-muted-foreground">{{ selected.email || 'No email' }}</span>
          </div>
        </div>
      </template>
      <div v-if="selected" class="flex flex-col gap-4">
        <ul class="m-0 p-0 list-none flex flex-col gap-2 text-sm">
          <li v-if="selected.phone" class="flex items-center gap-2">
            <i class="mdi mdi-phone-outline text-muted-foreground"></i>
            <a :href="`tel:${selected.phone}`">{{ selected.phone }}</a>
          </li>
          <li v-if="selected.email" class="flex items-center gap-2">
            <i class="mdi mdi-email-outline text-muted-foreground"></i>
            <button type="button" class="text-left underline" @click="contactCustomer(selected)">{{ selected.email }}</button>
          </li>
          <li v-if="selected.address" class="flex items-center gap-2">
            <i class="mdi mdi-map-marker-outline text-muted-foreground"></i>{{ selected.address }}
          </li>
          <li v-if="selected.driversLicense" class="flex items-center gap-2">
            <i class="mdi mdi-card-account-details-outline text-muted-foreground"></i>{{ selected.driversLicense }}
          </li>
        </ul>
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-primary/10 rounded-lg p-3 text-center">
            <div class="text-xl font-black">{{ custTickets(selected.id) }}</div>
            <div class="text-xs text-muted-foreground">Tickets</div>
          </div>
          <div class="bg-emerald-500/10 rounded-lg p-3 text-center">
            <div class="text-xl font-black text-emerald-600">{{ formatCurrency(custRevenue(selected.id)) }}</div>
            <div class="text-xs text-muted-foreground">Revenue</div>
          </div>
        </div>
        <p class="text-[10px] font-black text-muted-foreground uppercase m-0">Ticket History</p>
        <div v-if="custTicketList(selected.id).length === 0" class="text-center py-4 text-muted-foreground text-xs">
          No tickets yet
        </div>
        <ul v-else class="m-0 p-0 list-none flex flex-col gap-2">
          <li
            v-for="t in custTicketList(selected.id).slice(0, 6)"
            :key="t.id"
            class="flex items-center justify-between p-2 rounded-lg border border-border"
          >
            <Tag :value="`#${t.id}`" :severity="statusSeverity(t.status)" class="text-[10px]" />
            <span class="text-xs font-medium">{{ t.status }}</span>
            <span class="text-xs text-muted-foreground">{{ t.device }} · {{ formatCurrency(t.price) }}</span>
          </li>
        </ul>
        <div v-if="selected.notes" class="p-3 rounded-lg bg-muted text-sm">
          <p class="text-[10px] font-black uppercase text-muted-foreground m-0 mb-1">Notes</p>
          <p class="m-0">{{ selected.notes }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex flex-wrap gap-2 w-full justify-end">
          <Button label="Delete" severity="danger" variant="text" class="text-none" @click="deleteCustomer(selected!); detailOpen = false" />
          <Button label="New Ticket" severity="warn" variant="outlined" class="text-none" @click="createTicketForCustomer" />
          <Button label="Edit" variant="outlined" class="text-none" @click="startEdit()" />
          <Button label="Contact" class="text-none" :disabled="!selected?.email && !selected?.phone" @click="contactCustomer(selected!)" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="newOpen"
      modal
      :draggable="false"
      class="w-full max-w-lg mx-4"
      :header="editingCustomer ? `Edit ${editingCustomer.name}` : 'New Customer'"
    >
      <Message v-if="validationError" severity="warn" :closable="true" class="mb-4" @close="validationError = ''">{{ validationError }}</Message>
      <div class="grid grid-cols-1 gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-muted-foreground uppercase">Full Name *</label>
          <InputText v-model="form.name" placeholder="Jane Smith" class="w-full rounded-xl" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">Phone</label>
            <InputText v-model="form.phone" placeholder="(555) 123-4567" class="w-full rounded-xl" @input="form.phone = formatPhone(form.phone)" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">Email</label>
            <InputText v-model="form.email" type="email" placeholder="jane@email.com" class="w-full rounded-xl" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">Driver's License</label>
            <InputText v-model="form.driversLicense" placeholder="Optional" class="w-full rounded-xl" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">Address</label>
            <InputText v-model="form.address" placeholder="Street, City, State" class="w-full rounded-xl" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-muted-foreground uppercase">Notes</label>
          <Textarea v-model="form.notes" rows="2" placeholder="Additional info…" class="w-full rounded-xl" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="newOpen = false; editingCustomer = null" />
        <Button :label="editingCustomer ? 'Save Changes' : 'Add Customer'" class="text-none font-bold" @click="saveCustomer" />
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteDialogOpen" modal header="Delete customer?" class="w-full max-w-sm mx-4">
      <p class="text-sm m-0">Delete <strong>{{ deleteConfirmTarget?.name }}</strong>? This cannot be undone.</p>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="deleteConfirmTarget = null" />
        <Button label="Delete" severity="danger" class="text-none" @click="executeDeleteCustomer" />
      </template>
    </Dialog>

    <NewTicketDialog v-model="ticketDialogOpen" :customers="customers" @create="handleCreateTicket" />
  </div>
</template>

<script setup lang="ts">
import { openCustomerContact } from '~/utils/contact'
import { formatPhoneNumber as formatPhone } from '~/utils/phone'
import NewTicketDialog from '~/components/NewTicketDialog.vue'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const customers = computed(() => appStore.customers ?? [])
const tickets = computed(() => appStore.tickets ?? [])
const settings = computed(() => appStore.settings ?? { currency: '$' })
const { toast } = useToast()

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const custRevenue = (id: number) => tickets.value.filter((t: any) => t.customerId === id).reduce((a: number, t: any) => a + (t.price || 0), 0)
const custTickets = (id: number) => tickets.value.filter((t: any) => t.customerId === id).length
const custTicketList = (id: number) => tickets.value.filter((t: any) => t.customerId === id)
const totalRevenue = computed(() => tickets.value.reduce((a: number, t: any) => a + (t.price || 0), 0))
const avgRevenue = computed(() => (customers.value.length > 0 ? totalRevenue.value / customers.value.length : 0))

const statusSeverity = (s: string) =>
  ({ Open: 'info', 'In Progress': 'warn', 'Waiting for Parts': 'danger', Completed: 'success', Delivered: 'secondary' })[s] || 'secondary'

const AVATAR_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444']
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

const kpiCards = computed(() => [
  { label: 'Total Customers', value: customers.value.length, icon: 'mdi-account-group', color: '#3b82f6' },
  { label: 'Total Revenue', value: formatCurrency(totalRevenue.value), icon: 'mdi-currency-usd', color: '#10b981' },
  { label: 'Avg per Customer', value: formatCurrency(avgRevenue.value), icon: 'mdi-trending-up', color: '#f59e0b' },
  { label: 'Total Tickets', value: tickets.value.length, icon: 'mdi-ticket-outline', color: '#6366f1' },
])

const q = ref('')
const newOpen = ref(false)
const detailOpen = ref(false)
const selected = ref<any>(null)
const editingCustomer = ref<any>(null)
const validationError = ref('')
const form = ref({ name: '', phone: '', email: '', driversLicense: '', address: '', notes: '' })
const deleteConfirmTarget = ref<any>(null)
const deleteDialogOpen = computed({
  get: () => !!deleteConfirmTarget.value,
  set: (v) => { if (!v) deleteConfirmTarget.value = null },
})

const filteredCustomers = computed(() =>
  customers.value.filter(
    (c: any) =>
      !q.value ||
      c.name?.toLowerCase().includes(q.value.toLowerCase()) ||
      c.email?.toLowerCase().includes(q.value.toLowerCase()) ||
      c.phone?.includes(q.value),
  ),
)

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
    await appStore.updateCustomer(editingCustomer.value.id, {
      name: form.value.name,
      phone: form.value.phone,
      email: form.value.email,
      notes: form.value.notes,
      driversLicense: form.value.driversLicense,
      address: form.value.address,
    })
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

function contactCustomer(c: any) {
  detailOpen.value = false
  if (!openCustomerContact(c)) toast.warning('No contact method', 'Add an email or phone for this customer.')
}

const ticketDialogOpen = ref(false)

function createTicketForCustomer() {
  detailOpen.value = false
  ticketDialogOpen.value = true
}

const { sendTicketEmail, sendInternalAlert } = useEmailNotifications()

async function handleCreateTicket(ticketData: any) {
  const toastId = toast.loading('Creating ticket…')
  try {
    let customerId = ticketData.customerId || selected.value?.id
    if (ticketData.newCustomer?.name) {
      const nc = await appStore.createCustomer(ticketData.newCustomer)
      customerId = nc.id
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
    toast.dismiss(toastId)
    toast.success('Ticket Created', `Ticket #${ticket.id} created successfully`)
    ticketDialogOpen.value = false
    sendTicketEmail({ ...ticket, customerId }).catch(() => {})
    sendInternalAlert({
      eventType: 'New Ticket',
      eventSummary: `Ticket #${ticket.id} created`,
      customerName: selected.value?.name || '',
      deviceName: ticketData.device || '',
      issueDescription: ticketData.issue || '',
      ticketNumber: String(ticket.id),
    }).catch(() => {})
  } catch (err: any) {
    toast.dismiss(toastId)
    toast.danger('Error', err.message || 'Failed to create ticket')
  }
}
</script>
