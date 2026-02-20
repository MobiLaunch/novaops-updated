<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 6px 28px #3b82f650"
        >
          <Users class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Customers</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">{{ (customers || []).length }} total customers</p>
        </div>
      </div>
      <button
        class="m3-btn-primary flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white"
        style="background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 16px #3b82f640"
        @click="newCustomerOpen = true"
      >
        <Plus class="w-4 h-4" /> Add Customer
      </button>
    </div>

    <!-- ── KPI Row ─────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #3b82f614; outline: 2px solid #3b82f628; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #3b82f624">
            <Users class="w-5 h-5" style="color: #3b82f6" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #3b82f620; color: #3b82f6">TOTAL</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Customers</p>
          <p class="text-2xl font-black" style="color: #3b82f6">{{ customers.length }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #10b98124">
            <DollarSign class="w-5 h-5" style="color: #10b981" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #10b98120; color: #10b981">REVENUE</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Revenue</p>
          <p class="text-2xl font-black" style="color: #10b981">{{ formatCurrency(totalRevenue) }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #f59e0b14; outline: 2px solid #f59e0b28; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #f59e0b24">
            <TicketCheck class="w-5 h-5" style="color: #f59e0b" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #f59e0b20; color: #f59e0b">TICKETS</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Tickets</p>
          <p class="text-2xl font-black" style="color: #f59e0b">{{ tickets.length }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #6366f114; outline: 2px solid #6366f128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #6366f124">
            <TrendingUp class="w-5 h-5" style="color: #6366f1" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #6366f120; color: #6366f1">AVG</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Avg Per Customer</p>
          <p class="text-2xl font-black" style="color: #6366f1">{{ formatCurrency(avgRevenue) }}</p>
        </div>
      </div>
    </div>

    <!-- ── Search ─────────────────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          v-model="searchQuery"
          placeholder="Search by name, phone, or email…"
          class="w-full h-12 pl-11 pr-4 rounded-full text-sm font-medium transition-all"
          style="background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); outline: none"
          @focus="($event.target as HTMLElement).style.borderColor = '#3b82f6'"
          @blur="($event.target as HTMLElement).style.borderColor = 'hsl(var(--border)/0.7)'"
        />
      </div>
      <span v-if="searchQuery" class="text-xs text-muted-foreground font-semibold">
        {{ filteredCustomers.length }} result{{ filteredCustomers.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- ── Customers Table ─────────────────────────────────────── -->
    <div class="rounded-[32px] overflow-hidden bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b border-border/60" style="background: #3b82f608">
            <TableHead class="font-black text-xs uppercase tracking-widest py-4 px-6">Customer</TableHead>
            <TableHead class="hidden sm:table-cell font-black text-xs uppercase tracking-widest">Phone</TableHead>
            <TableHead class="hidden md:table-cell font-black text-xs uppercase tracking-widest">Email</TableHead>
            <TableHead class="hidden lg:table-cell text-right font-black text-xs uppercase tracking-widest">Total Spent</TableHead>
            <TableHead class="text-center font-black text-xs uppercase tracking-widest">Tickets</TableHead>
            <TableHead class="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="customer in filteredCustomers"
            :key="customer.id"
            class="m3-table-row border-b border-border/40 last:border-0 hover:bg-muted/20 transition-all cursor-pointer"
            @click="openCustomer(customer)"
          >
            <TableCell class="py-4 px-6">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-[22px] flex items-center justify-center flex-shrink-0 font-black text-sm" style="background: linear-gradient(135deg, #3b82f620, #2563eb20); color: #3b82f6">
                  {{ customer.name?.substring(0,2).toUpperCase() || '??' }}
                </div>
                <div>
                  <p class="font-bold text-sm">{{ customer.name }}</p>
                  <p class="text-xs text-muted-foreground font-medium">ID #{{ customer.id }}</p>
                </div>
              </div>
            </TableCell>
            <TableCell class="hidden sm:table-cell text-sm font-semibold">{{ customer.phone || '—' }}</TableCell>
            <TableCell class="hidden md:table-cell text-sm font-semibold text-muted-foreground">{{ customer.email || '—' }}</TableCell>
            <TableCell class="hidden lg:table-cell text-right">
              <span class="text-sm font-black" style="color: #10b981">{{ formatCurrency(getCustomerRevenue(customer.id)) }}</span>
            </TableCell>
            <TableCell class="text-center">
              <span class="text-xs font-black px-3 py-1.5 rounded-full" style="background: #3b82f618; color: #3b82f6">
                {{ getCustomerTickets(customer.id) }}
              </span>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-1">
                <button
                  class="w-9 h-9 rounded-[18px] flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90"
                  title="View details"
                  @click.stop="openCustomer(customer)"
                >
                  <Eye class="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  class="w-9 h-9 rounded-[18px] flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-110 active:scale-90"
                  title="Delete customer"
                  @click.stop="deleteCustomer(customer)"
                >
                  <Trash2 class="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredCustomers.length === 0">
            <TableCell colspan="6" class="py-20 text-center">
              <div class="flex flex-col items-center gap-3">
                <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background: #3b82f614">
                  <Users class="w-8 h-8" style="color: #3b82f6; opacity: 0.5" />
                </div>
                <p class="text-sm font-black">No customers found</p>
                <p class="text-xs text-muted-foreground font-medium">{{ searchQuery ? 'Try a different search' : 'Add your first customer to get started' }}</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- ── Add Customer Dialog ─────────────────────────────────── -->
    <Dialog v-model:open="newCustomerOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #3b82f6, #2563eb)">
              <UserPlus class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">New Customer</h2>
              <p class="text-xs text-muted-foreground font-medium">Add a customer to your shop</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2 space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Full Name *</label>
              <input v-model="customerForm.name" placeholder="Jane Smith" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Phone</label>
              <input v-model="customerForm.phone" placeholder="(555) 123-4567" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Email</label>
              <input v-model="customerForm.email" type="email" placeholder="jane@email.com" class="m3-input" />
            </div>
            <div class="col-span-2 space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Notes</label>
              <textarea v-model="customerForm.notes" placeholder="Any additional notes…" class="m3-input resize-none" rows="2" style="height: auto; padding-top: 12px" />
            </div>
          </div>
          <div class="flex gap-3 pt-1">
            <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="newCustomerOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95" style="background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 16px #3b82f640" @click="saveCustomer">Add Customer</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Customer Detail Dialog ─────────────────────────────── -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="rounded-[32px] max-w-lg">
        <div v-if="selectedCustomer" class="flex flex-col gap-5 p-1">
          <!-- Header -->
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-[28px] flex items-center justify-center font-black text-xl flex-shrink-0" style="background: linear-gradient(135deg, #3b82f620, #2563eb20); color: #3b82f6">
              {{ selectedCustomer.name?.substring(0,2).toUpperCase() || '??' }}
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-black truncate">{{ selectedCustomer.name }}</h2>
              <p class="text-xs text-muted-foreground font-medium">Customer #{{ selectedCustomer.id }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-lg font-black" style="color: #10b981">{{ formatCurrency(getCustomerRevenue(selectedCustomer.id)) }}</span>
              <span class="text-[10px] text-muted-foreground font-semibold">Total Spent</span>
            </div>
          </div>

          <!-- Contact info -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-[20px]" style="background: hsl(var(--muted)/0.4)">
              <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Phone</p>
              <p class="text-sm font-bold">{{ selectedCustomer.phone || '—' }}</p>
            </div>
            <div class="p-3 rounded-[20px]" style="background: hsl(var(--muted)/0.4)">
              <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Email</p>
              <p class="text-sm font-bold truncate">{{ selectedCustomer.email || '—' }}</p>
            </div>
            <div v-if="selectedCustomer.notes" class="col-span-2 p-3 rounded-[20px]" style="background: hsl(var(--muted)/0.4)">
              <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Notes</p>
              <p class="text-sm font-medium">{{ selectedCustomer.notes }}</p>
            </div>
          </div>

          <!-- Tickets list -->
          <div>
            <p class="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">
              Repair History ({{ getCustomerTickets(selectedCustomer.id) }} tickets)
            </p>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="ticket in getCustomerTicketList(selectedCustomer.id)"
                :key="ticket.id"
                class="flex items-center gap-3 px-3 py-2.5 rounded-[18px]"
                style="background: hsl(var(--muted)/0.4)"
              >
                <div class="w-8 h-8 rounded-[16px] flex items-center justify-center flex-shrink-0" style="background: #f59e0b20">
                  <TicketCheck class="w-4 h-4" style="color: #f59e0b" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold truncate">#{{ ticket.id }} — {{ ticket.device }}</p>
                  <p class="text-[10px] text-muted-foreground font-medium">{{ ticket.issue }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-xs font-black" style="color: #10b981">{{ formatCurrency(ticket.price || 0) }}</p>
                  <p class="text-[10px] text-muted-foreground">{{ ticket.status }}</p>
                </div>
              </div>
              <div v-if="getCustomerTickets(selectedCustomer.id) === 0" class="text-center py-4 text-xs text-muted-foreground font-semibold">No tickets yet</div>
            </div>
          </div>

          <div class="flex gap-3 pt-1">
            <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="detailOpen = false">Close</button>
            <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95" style="background: linear-gradient(135deg, #3b82f6, #2563eb)" @click="editCustomer">Edit Customer</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { Users, Plus, Search, Trash2, UserPlus, DollarSign, TrendingUp, Eye, TicketCheck } from 'lucide-vue-next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Dialog, DialogContent } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const customers = computed(() => appStore.customers ?? [])
const tickets   = computed(() => appStore.tickets ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$' })

const searchQuery = ref('')
const newCustomerOpen = ref(false)
const detailOpen = ref(false)
const selectedCustomer = ref<any>(null)
const customerForm = ref({ name: '', phone: '', email: '', notes: '' })

const filteredCustomers = computed(() =>
  customers.value.filter(c =>
    !searchQuery.value ||
    c.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.phone?.includes(searchQuery.value) ||
    c.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const getCustomerRevenue = (id: number) => tickets.value.filter((t: any) => t.customerId === id).reduce((a: number, t: any) => a + (t.price || 0), 0)
const getCustomerTickets = (id: number) => tickets.value.filter((t: any) => t.customerId === id).length
const getCustomerTicketList = (id: number) => tickets.value.filter((t: any) => t.customerId === id)

const totalRevenue = computed(() => tickets.value.reduce((a: number, t: any) => a + (t.price || 0), 0))
const avgRevenue = computed(() => customers.value.length > 0 ? totalRevenue.value / customers.value.length : 0)

const openCustomer = (customer: any) => {
  selectedCustomer.value = customer
  detailOpen.value = true
}

const editCustomer = () => {
  // Could open edit form — for now mirror the add form
  customerForm.value = { ...selectedCustomer.value }
  detailOpen.value = false
  newCustomerOpen.value = true
}

const saveCustomer = async () => {
  if (!customerForm.value.name) return alert('Please enter a name')
  await appStore.createCustomer({ ...customerForm.value })
  newCustomerOpen.value = false
  customerForm.value = { name: '', phone: '', email: '', notes: '' }
}

const deleteCustomer = async (customer: any) => {
  if (confirm(`Delete ${customer.name}? This cannot be undone.`)) {
    const idx = appStore.customers.findIndex((c: any) => c.id === customer.id)
    if (idx > -1) appStore.customers.splice(idx, 1)
    await appStore.saveAll()
  }
}
</script>

<style scoped>
.m3-btn-primary {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
}
.m3-btn-primary:hover  { transform: scale(1.05) translateY(-2px); }
.m3-btn-primary:active { transform: scale(0.92); }

.m3-kpi {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
}
.m3-kpi:hover  { transform: scale(1.04) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.m3-kpi:active { transform: scale(0.96); }

.m3-table-row { transition: transform 0.2s ease; }
.m3-table-row:active { transform: scale(0.995); }

.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px #3b82f618; }
</style>
