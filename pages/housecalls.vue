<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 6px 28px #10b98150"
        >
          <MapPin class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">House Calls</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">On-site repair appointments and scheduling</p>
        </div>
      </div>
      <button
        class="m3-btn flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white"
        style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140"
        @click="openNew"
      >
        <Plus class="w-4 h-4" /> Schedule Call
      </button>
    </div>

    <!-- ── KPI Row ─────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #10b98124">
            <MapPin class="w-5 h-5" style="color: #10b981" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #10b98120; color: #10b981">TOTAL</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">All Calls</p>
          <p class="text-2xl font-black" style="color: #10b981">{{ housecalls.length }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #3b82f614; outline: 2px solid #3b82f628; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #3b82f624">
            <Clock class="w-5 h-5" style="color: #3b82f6" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #3b82f620; color: #3b82f6">SCHED</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Scheduled</p>
          <p class="text-2xl font-black" style="color: #3b82f6">{{ countByStatus('Scheduled') }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #f59e0b14; outline: 2px solid #f59e0b28; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #f59e0b24">
            <Wrench class="w-5 h-5" style="color: #f59e0b" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #f59e0b20; color: #f59e0b">ACTIVE</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">In Progress</p>
          <p class="text-2xl font-black" style="color: #f59e0b">{{ countByStatus('In Progress') }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #6366f114; outline: 2px solid #6366f128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #6366f124">
            <CheckCircle class="w-5 h-5" style="color: #6366f1" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #6366f120; color: #6366f1">DONE</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Completed</p>
          <p class="text-2xl font-black" style="color: #6366f1">{{ countByStatus('Completed') }}</p>
        </div>
      </div>
    </div>

    <!-- ── Filter Tabs ─────────────────────────────────────────── -->
    <div class="flex gap-1.5 rounded-full p-1 self-start" style="background: hsl(var(--muted)/0.5)">
      <button
        v-for="f in filterOptions"
        :key="f"
        class="px-4 py-2 rounded-full text-xs font-black transition-all"
        :style="filter === f
          ? 'background: white; color: #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.1)'
          : 'color: hsl(var(--muted-foreground))'"
        @click="filter = f"
      >{{ f }}</button>
    </div>

    <!-- ── House Call Cards ─────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="call in filteredCalls"
        :key="call.id"
        class="m3-card rounded-[28px] p-5 flex flex-col gap-3 bg-card cursor-pointer"
        style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
        @click="viewCall(call)"
      >
        <div class="flex items-start justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #10b98120">
            <MapPin class="w-5 h-5" style="color: #10b981" />
          </div>
          <span class="text-[10px] font-black px-2.5 py-1 rounded-full" :style="callStatusStyle(call.status)">{{ call.status }}</span>
        </div>
        <div>
          <h3 class="font-black text-sm">{{ call.customerName }}</h3>
          <p class="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
            <MapPin class="w-3 h-3 flex-shrink-0" />{{ call.address }}
          </p>
          <p class="text-xs font-semibold mt-2" style="color: #10b981">{{ formatDate(call.date) }} at {{ call.time }}</p>
        </div>
        <p class="text-xs text-muted-foreground font-medium line-clamp-2 border-t border-border/60 pt-2">{{ call.issue }}</p>
        <div class="flex items-center gap-2 pt-1">
          <button
            v-if="call.status !== 'Completed'"
            class="flex-1 h-8 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
            :style="call.status === 'Scheduled' ? 'background: #f59e0b20; color: #f59e0b' : 'background: #10b98120; color: #10b981'"
            @click.stop="advanceStatus(call)"
          >{{ call.status === 'Scheduled' ? 'Start Call' : 'Complete' }}</button>
          <button
            class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-110 active:scale-90"
            @click.stop="deleteCall(call)"
          >
            <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div v-if="filteredCalls.length === 0" class="col-span-full rounded-[32px] py-16 flex flex-col items-center gap-4 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background: #10b98114">
          <MapPin class="w-8 h-8" style="color: #10b981; opacity: 0.5" />
        </div>
        <div class="text-center">
          <p class="font-black">No house calls {{ filter !== 'All' ? `with status "${filter}"` : 'scheduled' }}</p>
          <p class="text-xs text-muted-foreground font-medium mt-1">{{ filter === 'All' ? 'Schedule your first on-site visit' : 'Try a different filter' }}</p>
        </div>
        <button class="px-5 py-2.5 rounded-full text-sm font-bold text-white" style="background: linear-gradient(135deg, #10b981, #059669)" @click="openNew">Schedule Call</button>
      </div>
    </div>

    <!-- ── Schedule / Edit Dialog ─────────────────────────────── -->
    <Dialog v-model:open="formOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #10b981, #059669)">
              <MapPin class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">{{ editingCall ? 'Edit House Call' : 'Schedule House Call' }}</h2>
              <p class="text-xs text-muted-foreground font-medium">On-site repair appointment</p>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</label>
            <select v-model="callForm.customerId" class="m3-input">
              <option :value="null">Select customer</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Address</label>
            <input v-model="callForm.address" placeholder="123 Main St, City, State" class="m3-input" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Date</label>
              <input v-model="callForm.date" type="date" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Time</label>
              <input v-model="callForm.time" type="time" class="m3-input" />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Issue / Description</label>
            <textarea v-model="callForm.issue" placeholder="Describe the repair needed…" rows="3" class="m3-input resize-none" style="height: auto; padding-top: 12px" />
          </div>
          <div v-if="editingCall" class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Status</label>
            <select v-model="callForm.status" class="m3-input">
              <option>Scheduled</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="formOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #10b981, #059669)" @click="saveCall">
              {{ editingCall ? 'Save Changes' : 'Schedule' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { MapPin, Plus, Clock, Wrench, CheckCircle, Trash2 } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const customers = computed(() => appStore.customers ?? [])

const housecalls = ref<any[]>([])
const formOpen = ref(false)
const editingCall = ref<any>(null)
const filter = ref('All')
const filterOptions = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled']

const callForm = ref({ customerId: null as any, address: '', date: '', time: '', issue: '', status: 'Scheduled' })

const countByStatus = (s: string) => housecalls.value.filter(c => c.status === s).length

const filteredCalls = computed(() =>
  filter.value === 'All' ? housecalls.value : housecalls.value.filter(c => c.status === filter.value)
)

const callStatusStyle = (s: string) => ({
  'Scheduled':   'background: #3b82f620; color: #3b82f6',
  'In Progress': 'background: #f59e0b20; color: #f59e0b',
  'Completed':   'background: #10b98120; color: #10b981',
  'Cancelled':   'background: #ef444420; color: #ef4444',
}[s] || 'background: hsl(var(--muted)/0.5)')

const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const openNew = () => {
  editingCall.value = null
  callForm.value = { customerId: null, address: '', date: '', time: '', issue: '', status: 'Scheduled' }
  formOpen.value = true
}

const viewCall = (call: any) => {
  editingCall.value = call
  callForm.value = { ...call }
  formOpen.value = true
}

const saveCall = () => {
  const customer = customers.value.find((c: any) => c.id === callForm.value.customerId)
  const customerName = customer?.name || 'Unknown Customer'
  if (editingCall.value) {
    const idx = housecalls.value.findIndex(c => c.id === editingCall.value.id)
    if (idx > -1) housecalls.value[idx] = { ...editingCall.value, ...callForm.value, customerName }
  } else {
    housecalls.value.unshift({ ...callForm.value, id: Date.now(), status: 'Scheduled', customerName })
  }
  formOpen.value = false
  editingCall.value = null
}

const advanceStatus = (call: any) => {
  const idx = housecalls.value.findIndex(c => c.id === call.id)
  if (idx > -1) housecalls.value[idx].status = call.status === 'Scheduled' ? 'In Progress' : 'Completed'
}

const deleteCall = (call: any) => {
  if (confirm(`Delete house call for ${call.customerName}?`)) {
    housecalls.value = housecalls.value.filter(c => c.id !== call.id)
  }
}
</script>

<style scoped>
.m3-btn {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
}
.m3-btn:hover  { transform: scale(1.05) translateY(-2px); }
.m3-btn:active { transform: scale(0.92); }

.m3-kpi {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
}
.m3-kpi:hover  { transform: scale(1.04) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.m3-kpi:active { transform: scale(0.96); }

.m3-card {
  transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease;
}
.m3-card:hover  { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-card:active { transform: scale(0.96); }

.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px #10b98118; }
</style>
