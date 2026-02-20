<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- M3 icon container matching rail icon style -->
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #10b98118">
          <MapPin class="w-5 h-5" style="color: #10b981" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">House Calls</h1>
          <p class="text-xs text-muted-foreground mt-0.5">Manage on-site repair appointments</p>
        </div>
      </div>
      <!-- M3 FAB-style filled button -->
      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        style="background: linear-gradient(135deg, #10b981 0%, #059669 100%)"
        @click="newHouseCallOpen = true"
      >
        <Plus class="w-4 h-4" />
        Schedule House Call
      </button>
    </div>

    <!-- ── Filter Chips (M3 filter chip pattern) ──────────────────── -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="opt in statusOptions"
        :key="opt.value ?? 'all'"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition-all duration-150"
        :style="filterStatus === opt.value
          ? `background: ${opt.color}22; color: ${opt.color}; outline: 1.5px solid ${opt.color}50`
          : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
        @click="filterStatus = opt.value"
      >
        <component :is="opt.icon" class="w-3 h-3" v-if="opt.icon" />
        {{ opt.label }}
      </button>
    </div>

    <!-- ── Stat Cards (M3 surface tonal) ──────────────────────────── -->
    <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="rounded-3xl p-4 flex flex-col gap-3"
        :style="`background: ${stat.color}12; outline: 1px solid ${stat.color}25`"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted-foreground">{{ stat.label }}</span>
          <div class="w-8 h-8 rounded-2xl flex items-center justify-center" :style="`background: ${stat.color}20`">
            <component :is="stat.icon" class="w-4 h-4" :style="`color: ${stat.color}`" />
          </div>
        </div>
        <div class="text-3xl font-bold" :style="`color: ${stat.color}`">{{ stat.value }}</div>
      </div>
    </div>

    <!-- ── House Call Cards ────────────────────────────────────────── -->
    <div class="space-y-3">
      <div
        v-for="call in filteredHouseCalls"
        :key="call.id"
        class="rounded-3xl cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 bg-card"
        style="outline: 1px solid hsl(var(--border))"
        @click="editHouseCall(call)"
      >
        <!-- Card top: customer + status -->
        <div class="flex items-start justify-between p-5 pb-3">
          <div class="flex items-center gap-3">
            <!-- M3 avatar: tonal container -->
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style="background: #6366f118; color: #6366f1"
            >
              {{ getCustomerName(call.customerId).charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-semibold text-sm text-foreground">{{ getCustomerName(call.customerId) }}</p>
              <p class="text-xs text-muted-foreground mt-0.5 line-clamp-1">{{ call.description }}</p>
            </div>
          </div>
          <!-- M3 status chip -->
          <span
            class="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize"
            :style="`background: ${getStatusColor(call.status)}18; color: ${getStatusColor(call.status)}`"
          >
            {{ call.status }}
          </span>
        </div>

        <!-- Card meta row -->
        <div class="px-5 pb-4 flex flex-wrap gap-3">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div class="w-5 h-5 rounded-lg flex items-center justify-center bg-muted/60">
              <Clock class="w-3 h-3" />
            </div>
            {{ formatDateTime(call.date, call.time) }}
          </div>
          <div v-if="call.address" class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div class="w-5 h-5 rounded-lg flex items-center justify-center bg-muted/60">
              <MapPin class="w-3 h-3" />
            </div>
            <span class="line-clamp-1 max-w-[180px]">{{ call.address }}</span>
          </div>
          <div v-if="call.estimatedDuration" class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div class="w-5 h-5 rounded-lg flex items-center justify-center bg-muted/60">
              <Timer class="w-3 h-3" />
            </div>
            {{ call.estimatedDuration }} min
          </div>
        </div>

        <!-- Card actions: M3 tonal buttons -->
        <div class="flex items-center gap-2 px-5 py-3 border-t border-border/50">
          <button
            v-if="call.address"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition-all duration-150 hover:scale-[1.02]"
            style="background: #3b82f618; color: #3b82f6"
            @click.stop="openMaps(call.address)"
          >
            <Navigation class="w-3.5 h-3.5" />
            Directions
          </button>
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium transition-all duration-150 hover:scale-[1.02]"
            style="background: #10b98118; color: #10b981"
            @click.stop="callCustomer(call.customerId)"
          >
            <Phone class="w-3.5 h-3.5" />
            Call
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredHouseCalls.length === 0" class="rounded-3xl bg-card flex flex-col items-center justify-center py-20 gap-4" style="outline: 1px solid hsl(var(--border))">
        <div class="w-16 h-16 rounded-3xl flex items-center justify-center" style="background: #10b98112">
          <MapPin class="w-8 h-8" style="color: #10b981" />
        </div>
        <div class="text-center">
          <h3 class="font-semibold text-base">No house calls found</h3>
          <p class="text-sm text-muted-foreground mt-1">Schedule your first on-site appointment</p>
        </div>
        <button
          class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style="background: linear-gradient(135deg, #10b981 0%, #059669 100%)"
          @click="newHouseCallOpen = true"
        >
          <Plus class="w-4 h-4" />
          Schedule House Call
        </button>
      </div>
    </div>

    <!-- ── Dialog (M3 modal surface) ──────────────────────────────── -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0">

        <!-- Dialog header with tonal surface -->
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #10b98108">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #10b98120">
            <MapPin class="w-4 h-4" style="color: #10b981" />
          </div>
          <div>
            <h2 class="font-semibold text-base">{{ editingCall ? 'Edit' : 'Schedule' }} House Call</h2>
            <p class="text-xs text-muted-foreground mt-0.5">{{ editingCall ? 'Update appointment details' : 'Book a new on-site appointment' }}</p>
          </div>
        </div>

        <div class="p-6 space-y-5">

          <!-- Customer select -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer *</label>
            <Select v-model="callForm.customerId">
              <SelectTrigger class="rounded-2xl h-11 border-0 bg-muted/50 focus:ring-2 focus:ring-emerald-500/30">
                <SelectValue placeholder="Select a customer…" />
              </SelectTrigger>
              <SelectContent class="rounded-2xl">
                <SelectItem
                  v-for="customer in customers"
                  :key="customer.id"
                  :value="customer.id"
                  class="rounded-xl"
                >
                  {{ customer.name }} — {{ customer.phone }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service Description *</label>
            <Textarea
              v-model="callForm.description"
              placeholder="e.g., MacBook screen replacement, on-site diagnosis…"
              :rows="3"
              class="rounded-2xl border-0 bg-muted/50 resize-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <!-- Date + Time (M3-styled native inputs) -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date *</label>
              <div class="relative">
                <CalendarDays class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  v-model="callForm.date"
                  type="date"
                  class="w-full h-11 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time *</label>
              <div class="relative">
                <Clock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  v-model="callForm.time"
                  type="time"
                  class="w-full h-11 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service Address *</label>
            <Textarea
              v-model="callForm.address"
              placeholder="123 Main St, Suite 100, City, State 12345"
              :rows="2"
              class="rounded-2xl border-0 bg-muted/50 resize-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <!-- Duration + Status -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration (min)</label>
              <div class="relative">
                <Timer class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  v-model.number="callForm.estimatedDuration"
                  type="number"
                  placeholder="60"
                  class="w-full h-11 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground"
                />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
              <!-- M3 segmented-style status selector -->
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="s in ['scheduled','confirmed','in-progress','completed','cancelled']"
                  :key="s"
                  class="px-2.5 py-1 rounded-xl text-[10px] font-semibold capitalize transition-all duration-150"
                  :style="callForm.status === s
                    ? `background: ${getStatusColor(s)}22; color: ${getStatusColor(s)}; outline: 1.5px solid ${getStatusColor(s)}50`
                    : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                  @click="callForm.status = s"
                >
                  {{ s }}
                </button>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Additional Notes</label>
            <Textarea
              v-model="callForm.notes"
              placeholder="Special instructions, parking info, gate codes…"
              :rows="2"
              class="rounded-2xl border-0 bg-muted/50 resize-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <!-- Action buttons: M3 filled + outlined + error tonal -->
          <div class="flex gap-3 pt-2">
            <button
              v-if="editingCall"
              class="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style="background: #ef444418; color: #ef4444"
              @click="handleDeleteHouseCall"
            >
              <Trash2 class="w-4 h-4" />
              Delete
            </button>
            <!-- Outlined cancel -->
            <button
              class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 hover:bg-muted/60"
              style="outline: 1.5px solid hsl(var(--border)); color: hsl(var(--foreground))"
              @click="cancelEdit"
            >
              Cancel
            </button>
            <!-- Filled save -->
            <button
              class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              style="background: linear-gradient(135deg, #10b981 0%, #059669 100%)"
              @click="saveHouseCall"
            >
              {{ editingCall ? 'Update' : 'Schedule' }}
            </button>
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

import { 
  Plus, 
  Clock, 
  CalendarDays,
  CheckCircle,
  MapPin,
  Navigation,
  Phone,
  Timer,
  Trash2,
  CalendarClock,
  Calendar,
} from 'lucide-vue-next'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import { Dialog, DialogContent } from '~/components/ui/dialog'

definePageMeta({
  middleware: ['auth']
})

interface HouseCall {
  id: string
  customerId: number
  description: string
  date: string
  time: string
  address: string
  estimatedDuration?: number
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  notes: string
}

const appStore = useAppStore()
const { customers, houseCalls, isLoaded } = storeToRefs(appStore)
const { createHouseCall: storeCreateHouseCall, updateHouseCall: storeUpdateHouseCall, deleteHouseCall: storeDeleteHouseCall, initializeData } = appStore
const { addNotification } = useNotifications()

onMounted(() => {
  initializeData()
})

const newHouseCallOpen = ref(false)
const editingCall = ref<HouseCall | null>(null)
const filterStatus = ref<string | null>(null)

const showDialog = computed({
  get: () => newHouseCallOpen.value || editingCall.value !== null,
  set: (val) => {
    if (!val) {
      cancelEdit()
    }
  }
})

const callForm = ref({
  customerId: null as number | null,
  description: '',
  date: '',
  time: '',
  address: '',
  estimatedDuration: 60,
  status: 'scheduled' as HouseCall['status'],
  notes: ''
})

const filteredHouseCalls = computed(() => {
  return (houseCalls.value || [])
    .filter(call => !filterStatus.value || call.status === filterStatus.value)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })
})

const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return (houseCalls.value || []).filter(c => c.date === today && c.status !== 'cancelled' && c.status !== 'completed').length
})

const upcomingCount = computed(() => {
  const now = new Date()
  return (houseCalls.value || []).filter(c => {
    const callDate = new Date(`${c.date}T${c.time}`)
    return callDate >= now && c.status !== 'cancelled' && c.status !== 'completed'
  }).length
})

const completedCount = computed(() => {
  return (houseCalls.value || []).filter(c => c.status === 'completed').length
})

const thisWeekCount = computed(() => {
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return (houseCalls.value || []).filter(c => {
    const callDate = new Date(c.date)
    return callDate >= now && callDate <= weekFromNow && c.status !== 'cancelled' && c.status !== 'completed'
  }).length
})

const getCustomerName = (customerId: number) => {
  const customer = (customers.value || []).find(c => c.id === customerId)
  return customer?.name || 'Unknown'
}

const formatDateTime = (date: string, time: string) => {
  return `${new Date(date + 'T' + time).toLocaleDateString()} at ${time}`
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'scheduled': 'default',
    'confirmed': 'secondary',
    'in-progress': 'outline',
    'completed': 'outline',
    'cancelled': 'destructive'
  }
  return variants[status] || 'outline'
}

// M3 helpers
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'scheduled':   '#3b82f6',
    'confirmed':   '#8b5cf6',
    'in-progress': '#f59e0b',
    'completed':   '#10b981',
    'cancelled':   '#ef4444',
  }
  return colors[status] || '#64748b'
}

const statCards = computed(() => [
  { label: 'Today',     value: todayCount.value,     color: '#3b82f6', icon: Clock },
  { label: 'Upcoming',  value: upcomingCount.value,  color: '#8b5cf6', icon: CalendarClock },
  { label: 'Completed', value: completedCount.value, color: '#10b981', icon: CheckCircle },
  { label: 'This Week', value: thisWeekCount.value,  color: '#f59e0b', icon: Calendar },
])

const statusOptions = [
  { value: null,          label: 'All',         color: '#64748b', icon: null },
  { value: 'scheduled',   label: 'Scheduled',   color: '#3b82f6', icon: Clock },
  { value: 'confirmed',   label: 'Confirmed',   color: '#8b5cf6', icon: CheckCircle },
  { value: 'in-progress', label: 'In Progress', color: '#f59e0b', icon: Timer },
  { value: 'completed',   label: 'Completed',   color: '#10b981', icon: CheckCircle },
  { value: 'cancelled',   label: 'Cancelled',   color: '#ef4444', icon: null },
]

const saveHouseCall = async () => {
  if (!callForm.value.customerId || !callForm.value.description || 
      !callForm.value.date || !callForm.value.time || !callForm.value.address) {
    addNotification('Missing Information', 'Please fill in all required fields', 'warning')
    return
  }
  try {
    if (editingCall.value) {
      await storeUpdateHouseCall(editingCall.value.id, {
        customerId: callForm.value.customerId,
        description: callForm.value.description,
        date: callForm.value.date,
        time: callForm.value.time,
        address: callForm.value.address,
        status: callForm.value.status,
        notes: callForm.value.notes,
      })
      addNotification('Updated', 'House call updated successfully', 'success')
    } else {
      await storeCreateHouseCall({ ...callForm.value })
      addNotification('Scheduled', 'House call scheduled successfully', 'success')
    }
    cancelEdit()
  } catch (err: any) {
    addNotification('Error', 'Failed to save house call: ' + (err.message || err), 'error')
  }
}

const editHouseCall = (call: HouseCall) => {
  editingCall.value = call
  callForm.value = {
    customerId: call.customerId,
    description: call.description,
    date: call.date,
    time: call.time,
    address: call.address,
    estimatedDuration: call.estimatedDuration || 60,
    status: call.status,
    notes: call.notes
  }
}

const handleDeleteHouseCall = async () => {
  if (!editingCall.value) return
  if (confirm('Delete this house call?')) {
    try {
      await storeDeleteHouseCall(editingCall.value.id)
      addNotification('Deleted', 'House call deleted', 'info')
      cancelEdit()
    } catch (err: any) {
      addNotification('Error', 'Failed to delete: ' + (err.message || err), 'error')
    }
  }
}

const cancelEdit = () => {
  newHouseCallOpen.value = false
  editingCall.value = null
  callForm.value = {
    customerId: null,
    description: '',
    date: '',
    time: '',
    address: '',
    estimatedDuration: 60,
    status: 'scheduled',
    notes: ''
  }
}

const openMaps = (address: string) => {
  const url = `https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(address)}`
  window.open(url, '_blank')
}

const callCustomer = (customerId: number) => {
  const customer = (customers.value || []).find(c => c.id === customerId)
  if (customer?.phone) {
    window.location.href = `tel:${customer.phone}`
  }
}
</script>

