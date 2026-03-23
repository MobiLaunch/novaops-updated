<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
          style="background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 20px #3b82f650">
          <Users class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Customers</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">{{ customers.length }} total customers</p>
        </div>
      </div>
      <button class="m3-fab flex items-center gap-2 h-10 px-5 rounded-full text-sm font-black text-white"
        style="background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 16px #3b82f640"
        @click="newOpen = true">
        <Plus class="w-4 h-4" /> Add Customer
      </button>
    </div>

    <!-- ── Stat Cards ───────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="m3-stat-card rounded-2xl p-5 flex flex-col gap-3" style="background:#3b82f614;outline:2px solid #3b82f628;outline-offset:0">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#3b82f624"><Users class="w-5 h-5" style="color:#3b82f6" /></div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background:#3b82f620;color:#3b82f6">TOTAL</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Customers</p>
          <p class="text-2xl font-black" style="color:#3b82f6">{{ customers.length }}</p>
        </div>
      </div>
      <div class="m3-stat-card rounded-2xl p-5 flex flex-col gap-3" style="background:#10b98114;outline:2px solid #10b98128;outline-offset:0">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#10b98124"><DollarSign class="w-5 h-5" style="color:#10b981" /></div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background:#10b98120;color:#10b981">REVENUE</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Revenue</p>
          <p class="text-2xl font-black" style="color:#10b981">{{ formatCurrency(totalRevenue) }}</p>
        </div>
      </div>
      <div class="m3-stat-card rounded-2xl p-5 flex flex-col gap-3" style="background:#f59e0b14;outline:2px solid #f59e0b28;outline-offset:0">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#f59e0b24"><TicketCheck class="w-5 h-5" style="color:#f59e0b" /></div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background:#f59e0b20;color:#f59e0b">TICKETS</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Tickets</p>
          <p class="text-2xl font-black" style="color:#f59e0b">{{ tickets.length }}</p>
        </div>
      </div>
      <div class="m3-stat-card rounded-2xl p-5 flex flex-col gap-3" style="background:#5b5ef414;outline:2px solid #5b5ef428;outline-offset:0">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#5b5ef424"><TrendingUp class="w-5 h-5" style="color:#5b5ef4" /></div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background:#5b5ef420;color:#5b5ef4">AVG</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Avg Per Customer</p>
          <p class="text-2xl font-black" style="color:#5b5ef4">{{ formatCurrency(avgRevenue) }}</p>
        </div>
      </div>
    </div>

    <!-- ── Search ─────────────────────────────────────────────── -->
    <div class="relative max-w-md">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input v-model="q" placeholder="Search by name, phone, or email…"
        class="w-full h-12 pl-11 pr-4 rounded-full text-sm font-medium transition-all"
        style="background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);outline:none"
        @focus="($event.target as HTMLElement).style.cssText += ';border-color:#3b82f6;box-shadow:0 0 0 3px #3b82f618'"
        @blur="($event.target as HTMLElement).style.cssText = ($event.target as HTMLElement).style.cssText.replace(/border-color:[^;]+;box-shadow:[^;]+;/,'')" />
    </div>

    <!-- ── Customer Cards Grid ────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="c in filteredCustomers" :key="c.id"
        class="m3-customer-card rounded-2xl p-5 flex flex-col gap-4 bg-card cursor-pointer"
        style="outline:2px solid hsl(var(--border)/0.6);outline-offset:0"
        @click="openDetail(c)">
        <!-- Avatar + actions -->
        <div class="flex items-start justify-between">
          <div class="w-14 h-14 rounded-[26px] flex items-center justify-center font-black text-lg flex-shrink-0"
            style="background:linear-gradient(135deg,#3b82f620,#2563eb20);color:#3b82f6">
            {{ c.name?.substring(0,2).toUpperCase() || '??' }}
          </div>
          <div class="flex gap-1">
            <button class="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:bg-red-50 dark:hover:bg-red-950/30"
              @click.stop="deleteCustomer(c)">
              <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <!-- Info -->
        <div class="flex-1">
          <h3 class="font-black text-sm leading-tight">{{ c.name }}</h3>
          <p v-if="c.phone" class="text-xs text-muted-foreground font-medium mt-1">{{ c.phone }}</p>
          <p v-if="c.email" class="text-xs text-muted-foreground font-medium truncate">{{ c.email }}</p>
        </div>
        <!-- Stats -->
        <div class="flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            <p class="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Revenue</p>
            <p class="text-base font-black" style="color:#10b981">{{ formatCurrency(custRevenue(c.id)) }}</p>
          </div>
          <span class="text-xs font-black px-3 py-1.5 rounded-full" style="background:#3b82f618;color:#3b82f6">
            {{ custTickets(c.id) }} tickets
          </span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredCustomers.length === 0" class="col-span-full rounded-2xl py-20 flex flex-col items-center gap-4 bg-card"
        style="outline:2px solid hsl(var(--border)/0.6);outline-offset:0">
        <div class="w-20 h-20 rounded-2xl flex items-center justify-center" style="background:#3b82f614">
          <Users class="w-10 h-10" style="color:#3b82f6;opacity:0.5" />
        </div>
        <div class="text-center">
          <h3 class="text-lg font-black mb-1">No customers found</h3>
          <p class="text-sm text-muted-foreground font-medium">{{ q ? 'Try a different search' : 'Add your first customer to get started' }}</p>
        </div>
        <button v-if="!q" class="m3-fab flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black text-white mt-2"
          style="background:linear-gradient(135deg,#3b82f6,#2563eb)"
          @click="newOpen = true">
          <Plus class="w-4 h-4" /> Add Customer
        </button>
      </div>
    </div>

    <!-- ── Add Customer Dialog ─────────────────────────────────── -->
    <Dialog v-model:open="newOpen">
      <DialogContent class="max-w-md">
        <div class="flex flex-col gap-5 p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">
              <UserPlus class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">New Customer</h2>
              <p class="text-xs text-muted-foreground font-medium">Add a customer to your shop</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="col-span-2 space-y-2"><label class="m3-label">Full Name *</label><input v-model="form.name" placeholder="Jane Smith" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Phone</label><input v-model="form.phone" placeholder="(555) 123-4567" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Email</label><input v-model="form.email" type="email" placeholder="jane@email.com" class="m3-input" /></div>
            <div class="col-span-2 space-y-2"><label class="m3-label">Notes</label><textarea v-model="form.notes" placeholder="Any additional notes…" class="m3-input resize-none" rows="2" style="height:auto;padding-top:12px" /></div>
          </div>
          <div class="flex gap-3 pt-1">
            <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style="outline:2px solid hsl(var(--border));outline-offset:0" @click="newOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
              style="background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 4px 16px #3b82f640"
              @click="saveCustomer">Add Customer</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Customer Detail Dialog ─────────────────────────────── -->
    <Dialog v-model:open="detailOpen">
      <DialogContent class="w-full max-w-[96vw] sm:max-w-lg">
        <div v-if="selected" class="flex flex-col gap-5 p-7">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0"
              style="background:linear-gradient(135deg,#3b82f620,#2563eb20);color:#3b82f6">
              {{ selected.name?.substring(0,2).toUpperCase() || '??' }}
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-black truncate">{{ selected.name }}</h2>
              <p class="text-xs text-muted-foreground font-medium">Customer #{{ selected.id }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-lg font-black" style="color:#10b981">{{ formatCurrency(custRevenue(selected.id)) }}</span>
              <span class="text-[10px] text-muted-foreground font-semibold">Total Spent</span>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3 rounded-xl" style="background:hsl(var(--muted)/0.4)">
              <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Phone</p>
              <p class="text-sm font-bold">{{ selected.phone || '—' }}</p>
            </div>
            <div class="p-3 rounded-xl" style="background:hsl(var(--muted)/0.4)">
              <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Email</p>
              <p class="text-sm font-bold truncate">{{ selected.email || '—' }}</p>
            </div>
            <div v-if="selected.notes" class="col-span-2 p-3 rounded-xl" style="background:hsl(var(--muted)/0.4)">
              <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Notes</p>
              <p class="text-sm font-medium">{{ selected.notes }}</p>
            </div>
          </div>
          <div>
            <p class="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">
              Repair History ({{ custTickets(selected.id) }} tickets)
            </p>
            <div class="space-y-2 max-h-52 overflow-y-auto">
              <div v-for="t in custTicketList(selected.id)" :key="t.id"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl" style="background:hsl(var(--muted)/0.4)">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#f59e0b20">
                  <TicketCheck class="w-4 h-4" style="color:#f59e0b" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold truncate">#{{ t.id }} — {{ t.device }}</p>
                  <p class="text-[10px] text-muted-foreground font-medium truncate">{{ t.issue }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-xs font-black" style="color:#10b981">{{ formatCurrency(t.price || 0) }}</p>
                  <p class="text-[10px] text-muted-foreground">{{ t.status }}</p>
                </div>
              </div>
              <div v-if="custTickets(selected.id) === 0" class="text-center py-4 text-xs text-muted-foreground font-semibold">No tickets yet</div>
            </div>
          </div>
          <div class="flex gap-3 pt-1">
            <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style="outline:2px solid hsl(var(--border));outline-offset:0" @click="detailOpen = false">Close</button>
            <button class="h-12 px-4 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
              style="background:linear-gradient(135deg,#ec4899,#db2777)"
              @click="messageCustomer(selected)" :disabled="!selected?.email && !selected?.phone">📨</button>
            <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
              style="background:linear-gradient(135deg,#3b82f6,#2563eb)" @click="startEdit">Edit Customer</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Users, Plus, Search, Trash2, UserPlus, DollarSign, TrendingUp, TicketCheck } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { useAppStore } from '~/stores/app'
definePageMeta({ middleware: ['auth'] })
const appStore  = useAppStore()
const customers = computed(() => appStore.customers ?? [])
const tickets   = computed(() => appStore.tickets ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$' })
const q = ref(''); const newOpen = ref(false); const detailOpen = ref(false); const selected = ref<any>(null)
const form = ref({ name:'', phone:'', email:'', notes:'' })
const filteredCustomers = computed(() => customers.value.filter(c =>
  !q.value || c.name?.toLowerCase().includes(q.value.toLowerCase()) ||
  c.phone?.includes(q.value) || c.email?.toLowerCase().includes(q.value.toLowerCase())
))
const formatCurrency = (n: number) => `${settings.value?.currency||'$'}${(n||0).toFixed(2)}`
const custRevenue = (id: number) => tickets.value.filter((t:any) => t.customerId===id).reduce((a:number,t:any)=>a+(t.price||0),0)
const custTickets = (id: number) => tickets.value.filter((t:any) => t.customerId===id).length
const custTicketList = (id: number) => tickets.value.filter((t:any) => t.customerId===id)
const totalRevenue = computed(() => tickets.value.reduce((a:number,t:any)=>a+(t.price||0),0))
const avgRevenue = computed(() => customers.value.length > 0 ? totalRevenue.value / customers.value.length : 0)
const openDetail = (c: any) => { selected.value = c; detailOpen.value = true }
const editingCustomer = ref<any>(null)
const startEdit = () => { editingCustomer.value = selected.value; form.value = { ...selected.value }; detailOpen.value = false; newOpen.value = true }
const saveCustomer = async () => {
  if (!form.value.name) return alert('Please enter a name')
  if (editingCustomer.value?.id) {
    // Update existing customer via store (persists to Supabase)
    await appStore.updateCustomer(editingCustomer.value.id, {
      name: form.value.name,
      phone: form.value.phone,
      email: form.value.email,
      notes: form.value.notes,
    })
  } else {
    await appStore.createCustomer({ ...form.value })
  }
  newOpen.value = false; editingCustomer.value = null; form.value = { name:'', phone:'', email:'', notes:'' }
}
const messageCustomer = (c: any) => {
  detailOpen.value = false
  navigateTo({ path: '/messages', query: { compose: '1', customerId: String(c.id) } })
}

const deleteCustomer = async (c: any) => {
  if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return
  await appStore.deleteCustomer(c.id)
}
</script>

<style scoped>
.m3-fab { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-fab:hover  { transform: scale(1.05) translateY(-2px); }
.m3-fab:active { transform: scale(0.92); }
.m3-stat-card { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-stat-card:hover  { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.m3-stat-card:active { transform: scale(0.96); }
.m3-customer-card { transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease; }
.m3-customer-card:hover  { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-customer-card:active { transform: scale(0.96); }
.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.m3-input:focus { border-color:#3b82f6;box-shadow:0 0 0 3px #3b82f618; }
.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
</style>
