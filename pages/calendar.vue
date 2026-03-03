<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg"
          :style="activeMode === 'housecall'
            ? 'background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 20px #10b98150'
            : 'background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 20px #06b6d450'">
          <component :is="activeMode === 'housecall' ? MapPin : Calendar" class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Calendar</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">
            {{ activeMode === 'housecall' ? 'On-site house calls & field repairs' : 'In-shop appointments & scheduling' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button class="h-10 px-4 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
          style="background: hsl(var(--muted)/0.6)" @click="goToday">Today</button>

        <!-- Mode toggle -->
        <div class="flex gap-0.5 rounded-full p-1" style="background: hsl(var(--muted)/0.5)">
          <button class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all"
            :style="activeMode === 'appointment'
              ? 'background: white; color: #06b6d4; box-shadow: 0 2px 8px rgba(0,0,0,0.12)'
              : 'color: hsl(var(--muted-foreground))'"
            @click="activeMode = 'appointment'">
            <Calendar class="w-3 h-3" /> In-Shop
          </button>
          <button class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all"
            :style="activeMode === 'housecall'
              ? 'background: white; color: #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.12)'
              : 'color: hsl(var(--muted-foreground))'"
            @click="activeMode = 'housecall'">
            <MapPin class="w-3 h-3" /> House Calls
          </button>
        </div>

        <button class="m3-fab flex items-center gap-2 h-10 px-5 rounded-full text-sm font-black text-white"
          :style="activeMode === 'housecall'
            ? 'background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140'
            : 'background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 16px #06b6d440'"
          @click="openNew">
          <Plus class="w-4 h-4" />
          {{ activeMode === 'housecall' ? 'Schedule Call' : 'New Appointment' }}
        </button>
      </div>
    </div>

    <!-- ── Stat Cards ───────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="stat in statCards" :key="stat.label"
        class="m3-stat-card rounded-[28px] p-5 flex flex-col gap-3"
        :style="`background: ${stat.color}12; outline: 2px solid ${stat.color}28; outline-offset: 0`">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" :style="`background: ${stat.color}24`">
            <component :is="stat.icon" class="w-5 h-5" :style="`color: ${stat.color}`" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full"
            :style="`background: ${stat.color}20; color: ${stat.color}`">{{ stat.badge }}</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">{{ stat.label }}</p>
          <p class="text-2xl font-black" :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Month Navigation ───────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="prevMonth">
        <ChevronLeft class="w-5 h-5" />
      </button>
      <h2 class="text-xl font-black flex-1 text-center">{{ monthLabel }}</h2>
      <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="nextMonth">
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>

    <!-- ── Calendar Grid ─────────────────────────────────────── -->
    <div class="rounded-[32px] overflow-hidden bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="grid grid-cols-7 border-b border-border/60"
        :style="activeMode === 'housecall' ? 'background: #10b98108' : 'background: #06b6d408'">
        <div v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d"
          class="py-3 text-center text-xs font-black text-muted-foreground uppercase tracking-widest">{{ d }}</div>
      </div>
      <div class="grid grid-cols-7">
        <div v-for="(day, idx) in calendarDays" :key="idx"
          class="min-h-[80px] p-2 border-b border-r border-border/20 last:border-r-0 cursor-pointer transition-all hover:bg-muted/20 relative"
          :class="{ 'opacity-35': !day.currentMonth }"
          :style="day.isToday ? (activeMode === 'housecall' ? 'background: #10b9810d' : 'background: #06b6d40d') : ''"
          @click="day.currentMonth && selectDay(day.date)">
          <div class="w-6 h-6 flex items-center justify-center rounded-full mb-1 text-xs font-black"
            :style="day.isToday ? (activeMode === 'housecall' ? 'background:#10b981;color:white' : 'background:#06b6d4;color:white') : ''">
            {{ day.day }}
          </div>
          <div class="space-y-0.5">
            <div v-for="appt in getDayAppts(day.date)" :key="appt.id"
              class="text-[9px] font-bold px-1.5 py-0.5 rounded-[6px] truncate flex items-center gap-0.5"
              :style="appt.type === 'housecall'
                ? 'background: #10b98122; color: #10b981'
                : 'background: #06b6d422; color: #06b6d4'">
              <MapPin v-if="appt.type === 'housecall'" class="w-2 h-2 flex-shrink-0" />
              {{ appt.title || appt.description }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Upcoming List ──────────────────────────────────────── -->
    <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center"
            :style="activeMode === 'housecall' ? 'background: #10b98120' : 'background: #06b6d420'">
            <Clock class="w-4 h-4" :style="activeMode === 'housecall' ? 'color:#10b981' : 'color:#06b6d4'" />
          </div>
          <h3 class="text-sm font-black">
            Upcoming {{ activeMode === 'housecall' ? 'House Calls' : 'Appointments' }}
          </h3>
        </div>
        <span class="text-xs text-muted-foreground font-semibold">{{ upcomingList.length }} scheduled</span>
      </div>

      <div v-if="upcomingList.length" class="space-y-2">
        <div v-for="appt in upcomingList" :key="appt.id"
          class="m3-appt-row flex items-center gap-3 px-4 py-3 rounded-[20px] cursor-pointer"
          :style="activeMode === 'housecall'
            ? 'background: #10b98110; outline: 1.5px solid #10b98122; outline-offset: 0'
            : 'background: #06b6d410; outline: 1.5px solid #06b6d422; outline-offset: 0'"
          @click="openEdit(appt)">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center flex-shrink-0"
            :style="activeMode === 'housecall' ? 'background:#10b98120' : 'background:#06b6d420'">
            <component :is="activeMode === 'housecall' ? MapPin : Calendar" class="w-5 h-5"
              :style="activeMode === 'housecall' ? 'color:#10b981' : 'color:#06b6d4'" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate">{{ appt.title || appt.description }}</p>
            <p class="text-xs text-muted-foreground font-medium">{{ formatApptDate(appt.date) }} at {{ appt.time || '—' }}</p>
            <p v-if="appt.address" class="text-xs font-semibold flex items-center gap-1 mt-0.5" style="color:#10b981">
              <MapPin class="w-3 h-3" />{{ appt.address }}
            </p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-[10px] font-black px-2.5 py-1 rounded-full capitalize"
              :style="statusStyle(appt.status)">{{ appt.status }}</span>
            <button v-if="activeMode === 'housecall' && appt.status !== 'Completed' && appt.status !== 'completed'"
              class="h-8 px-3 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style="background:#f59e0b20;color:#f59e0b"
              @click.stop="advanceCall(appt)">
              {{ appt.status === 'In Progress' ? 'Complete' : 'Start' }}
            </button>
            <button class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-110 active:scale-90"
              @click.stop="deleteAppt(appt)">
              <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center gap-3 py-10">
        <div class="w-16 h-16 rounded-[28px] flex items-center justify-center"
          :style="activeMode === 'housecall' ? 'background:#10b98114' : 'background:#06b6d414'">
          <component :is="activeMode === 'housecall' ? MapPin : Calendar" class="w-8 h-8"
            :style="activeMode === 'housecall' ? 'color:#10b981;opacity:0.45' : 'color:#06b6d4;opacity:0.45'" />
        </div>
        <p class="text-sm font-bold text-muted-foreground">
          No upcoming {{ activeMode === 'housecall' ? 'house calls' : 'appointments' }}
        </p>
        <button class="px-5 py-2.5 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
          :style="activeMode === 'housecall'
            ? 'background:linear-gradient(135deg,#10b981,#059669)'
            : 'background:linear-gradient(135deg,#06b6d4,#0891b2)'"
          @click="openNew">
          {{ activeMode === 'housecall' ? 'Schedule First Call' : 'Book Appointment' }}
        </button>
      </div>
    </div>

    <!-- ── Form Dialog ────────────────────────────────────────── -->
    <Dialog v-model:open="formOpen">
      <DialogContent class="max-w-md">
        <div class="flex flex-col gap-5 p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center"
              :style="activeMode === 'housecall'
                ? 'background:linear-gradient(135deg,#10b981,#059669)'
                : 'background:linear-gradient(135deg,#06b6d4,#0891b2)'">
              <component :is="activeMode === 'housecall' ? MapPin : Calendar" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">
                {{ editingAppt ? 'Edit' : 'New' }} {{ activeMode === 'housecall' ? 'House Call' : 'Appointment' }}
              </h2>
              <p class="text-xs text-muted-foreground font-medium">
                {{ activeMode === 'housecall' ? 'On-site repair visit' : 'In-shop appointment' }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="m3-label">Title</label>
            <input v-model="form.title" :placeholder="activeMode === 'housecall' ? 'TV repair at client home' : 'Screen repair consultation'" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Customer</label>
            <CustomerSelect v-model="form.customerId" />
          </div>
          <div v-if="activeMode === 'housecall'" class="space-y-2">
            <label class="m3-label">Address</label>
            <input v-model="form.address" placeholder="123 Main St, City, State" class="m3-input" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="m3-label">Date</label>
              <input v-model="form.date" type="date" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="m3-label">Time</label>
              <input v-model="form.time" type="time" class="m3-input" />
            </div>
          </div>
          <div v-if="editingAppt" class="space-y-2">
            <label class="m3-label">Status</label>
            <select v-model="form.status" class="m3-input">
              <option value="scheduled">Scheduled</option>
              <option v-if="activeMode === 'housecall'" value="In Progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="m3-label">Notes</label>
            <textarea v-model="form.description" placeholder="Details…" rows="2"
              class="m3-input resize-none" style="height:auto;padding-top:12px" />
          </div>

          <div class="flex gap-3 pt-1">
            <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style="outline:2px solid hsl(var(--border));outline-offset:0"
              @click="formOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
              :style="activeMode === 'housecall'
                ? 'background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 4px 16px #10b98140'
                : 'background:linear-gradient(135deg,#06b6d4,#0891b2);box-shadow:0 4px 16px #06b6d440'"
              @click="saveAppt">
              {{ editingAppt ? 'Save Changes' : 'Schedule' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calendar, MapPin, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle, Trash2, TicketCheck } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { useAppStore } from '~/stores/app'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const allAppts  = computed(() => appStore.appointments ?? [])
const customers = computed(() => appStore.customers ?? [])

// ── Mode ──────────────────────────────────────────────────────
const activeMode = ref<'appointment' | 'housecall'>('appointment')

// Appointments for the active mode
// Treat missing/undefined type as 'appointment' for backward compat
const viewAppts = computed(() =>
  allAppts.value.filter((a: any) =>
    activeMode.value === 'housecall'
      ? a.type === 'housecall'
      : (a.type === 'appointment' || !a.type)
  )
)

// ── Calendar nav ───────────────────────────────────────────────
const now = new Date()
const viewYear  = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const today = new Date().toISOString().split('T')[0]

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value).toLocaleDateString([], { month: 'long', year: 'numeric' })
)
const prevMonth = () => { if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- } else viewMonth.value-- }
const nextMonth = () => { if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ } else viewMonth.value++ }
const goToday   = () => { viewYear.value = now.getFullYear(); viewMonth.value = now.getMonth() }

const calendarDays = computed(() => {
  const firstDay    = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const daysInPrev  = new Date(viewYear.value, viewMonth.value, 0).getDate()
  const todayStr    = today
  const days: any[] = []
  for (let i = firstDay - 1; i >= 0; i--)
    days.push({ day: daysInPrev - i, currentMonth: false, date: '', isToday: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ day: d, currentMonth: true, date: dateStr, isToday: dateStr === todayStr })
  }
  while (days.length % 7 !== 0) days.push({ day: days.length - firstDay - daysInMonth + 1, currentMonth: false, date: '', isToday: false })
  return days
})

// Show ALL appointments on grid (color coded), filtered list below
const getDayAppts = (date: string) => date ? allAppts.value.filter((a: any) => a.date === date) : []

// ── Stats ──────────────────────────────────────────────────────
const upcomingList = computed(() =>
  viewAppts.value
    .filter((a: any) => a.date >= today && a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a: any, b: any) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')))
    .slice(0, 10)
)

const color = computed(() => activeMode.value === 'housecall' ? '#10b981' : '#06b6d4')

const statCards = computed(() => [
  {
    label: activeMode.value === 'housecall' ? 'All Calls' : 'All Appts',
    value: viewAppts.value.length,
    color: color.value,
    badge: 'TOTAL',
    icon: activeMode.value === 'housecall' ? MapPin : Calendar
  },
  {
    label: 'Upcoming',
    value: viewAppts.value.filter((a: any) => a.date >= today && a.status !== 'completed' && a.status !== 'cancelled').length,
    color: '#3b82f6',
    badge: 'SCHED',
    icon: Clock
  },
  {
    label: 'Completed',
    value: viewAppts.value.filter((a: any) => a.status === 'completed' || a.status === 'Completed').length,
    color: '#10b981',
    badge: 'DONE',
    icon: CheckCircle
  },
  {
    label: 'Today',
    value: viewAppts.value.filter((a: any) => a.date === today).length,
    color: '#f59e0b',
    badge: 'TODAY',
    icon: Calendar
  },
])

// ── Form ───────────────────────────────────────────────────────
const formOpen    = ref(false)
const editingAppt = ref<any>(null)
const selectedDay = ref(today)

const form = ref({
  title: '', customerId: null as any, date: today,
  time: '', description: '', status: 'scheduled',
  address: '', type: 'appointment'
})

const openNew = () => {
  editingAppt.value = null
  form.value = {
    title: '', customerId: null,
    date: selectedDay.value || today,
    time: '', description: '', status: 'scheduled',
    address: '', type: activeMode.value
  }
  formOpen.value = true
}

const selectDay = (date: string) => {
  selectedDay.value = date
  openNew()
}

const openEdit = (appt: any) => {
  editingAppt.value = appt
  form.value = { ...appt }
  formOpen.value = true
}

const saveAppt = async () => {
  if (!form.value.title && !form.value.description) return
  const data = { ...form.value, type: activeMode.value }
  if (editingAppt.value) {
    await appStore.updateAppointment(editingAppt.value.id, data)
  } else {
    await appStore.createAppointment(data)
  }
  formOpen.value = false
  editingAppt.value = null
}

const deleteAppt = async (appt: any) => {
  if (!confirm(`Delete "${appt.title || appt.description}"?`)) return
  await appStore.deleteAppointment(appt.id)
}

const advanceCall = async (appt: any) => {
  const s = appt.status
  const next = (s === 'scheduled' || s === 'Scheduled') ? 'In Progress' : 'completed'
  await appStore.updateAppointment(appt.id, { status: next })
}

// ── Helpers ────────────────────────────────────────────────────
const formatApptDate = (d: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const statusStyle = (s: string) => ({
  'scheduled':   'background:#3b82f620;color:#3b82f6',
  'Scheduled':   'background:#3b82f620;color:#3b82f6',
  'In Progress': 'background:#f59e0b20;color:#f59e0b',
  'completed':   'background:#10b98120;color:#10b981',
  'Completed':   'background:#10b98120;color:#10b981',
  'cancelled':   'background:#ef444420;color:#ef4444',
}[s] || 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))')
</script>

<style scoped>
.m3-fab {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
}
.m3-fab:hover  { transform: scale(1.05) translateY(-2px); }
.m3-fab:active { transform: scale(0.92); }

.m3-stat-card {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
}
.m3-stat-card:hover  { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.m3-stat-card:active { transform: scale(0.96); }

.m3-appt-row {
  transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1);
}
.m3-appt-row:hover  { transform: scale(1.01) translateY(-1px); }
.m3-appt-row:active { transform: scale(0.98); }

.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.m3-input:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px #06b6d418; }

.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
</style>
