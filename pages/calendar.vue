<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); box-shadow: 0 6px 28px #06b6d450"
        >
          <CalendarDays class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Calendar</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Schedule appointments and manage your time</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="h-11 px-4 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
          style="background: hsl(var(--muted)/0.6); color: hsl(var(--foreground))"
          @click="goToday"
        >Today</button>
        <button
          class="m3-btn flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white"
          style="background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 16px #06b6d440"
          @click="openNew"
        >
          <Plus class="w-4 h-4" /> New Appointment
        </button>
      </div>
    </div>

    <!-- ── KPI Row ─────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #06b6d414; outline: 2px solid #06b6d428; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #06b6d424">
            <CalendarDays class="w-5 h-5" style="color: #06b6d4" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #06b6d420; color: #06b6d4">TOTAL</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Appointments</p>
          <p class="text-2xl font-black" style="color: #06b6d4">{{ appointments.length }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #3b82f614; outline: 2px solid #3b82f628; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #3b82f624">
            <Clock class="w-5 h-5" style="color: #3b82f6" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #3b82f620; color: #3b82f6">UPCOMING</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Upcoming</p>
          <p class="text-2xl font-black" style="color: #3b82f6">{{ upcomingCount }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #10b98124">
            <CheckCircle class="w-5 h-5" style="color: #10b981" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #10b98120; color: #10b981">DONE</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Completed</p>
          <p class="text-2xl font-black" style="color: #10b981">{{ appointments.filter((a: any) => a.status === 'completed').length }}</p>
        </div>
      </div>
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #f59e0b14; outline: 2px solid #f59e0b28; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #f59e0b24">
            <CalendarDays class="w-5 h-5" style="color: #f59e0b" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #f59e0b20; color: #f59e0b">TODAY</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Today</p>
          <p class="text-2xl font-black" style="color: #f59e0b">{{ todayCount }}</p>
        </div>
      </div>
    </div>

    <!-- ── Month Navigation ───────────────────────────────────── -->
    <div class="flex items-center gap-4">
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
      <div class="grid grid-cols-7 border-b border-border/60" style="background: #06b6d408">
        <div v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d" class="py-3 text-center text-xs font-black text-muted-foreground uppercase tracking-widest">{{ d }}</div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="day in calendarDays"
          :key="day.date || day.day + '-' + Math.random()"
          class="min-h-[80px] p-2 border-b border-r border-border/30 last:border-r-0 cursor-pointer transition-all hover:bg-muted/20 relative"
          :class="{ 'opacity-40': !day.currentMonth }"
          :style="day.isToday ? 'background: #06b6d40d' : ''"
          @click="day.currentMonth && selectDay(day.date)"
        >
          <div
            class="w-6 h-6 flex items-center justify-center rounded-full mb-1 text-xs font-black"
            :style="day.isToday ? 'background: #06b6d4; color: white' : ''"
          >{{ day.day }}</div>
          <div class="space-y-0.5">
            <div
              v-for="appt in getAppts(day.date)"
              :key="appt.id"
              class="text-[9px] font-bold px-1.5 py-0.5 rounded-[6px] truncate"
              style="background: #06b6d420; color: #06b6d4"
            >{{ appt.title || appt.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Upcoming Appointments ─────────────────────────────── -->
    <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #06b6d420">
          <Clock class="w-4 h-4" style="color: #06b6d4" />
        </div>
        <h3 class="text-sm font-black">Upcoming Appointments</h3>
      </div>
      <div v-if="upcomingAppts.length" class="space-y-2">
        <div
          v-for="appt in upcomingAppts"
          :key="appt.id"
          class="flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all hover:scale-[1.005]"
          style="background: #06b6d410; outline: 1.5px solid #06b6d420; outline-offset: 0"
        >
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center flex-shrink-0" style="background: #06b6d420">
            <CalendarDays class="w-5 h-5" style="color: #06b6d4" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate">{{ appt.title || appt.description }}</p>
            <p class="text-xs text-muted-foreground font-medium">{{ formatApptDate(appt.date) }} at {{ appt.time }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-xs font-black px-2.5 py-1 rounded-full" style="background: #06b6d420; color: #06b6d4">{{ appt.status }}</span>
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90"
              title="Edit"
              @click="editAppt(appt)"
            >
              <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-110 active:scale-90"
              title="Delete"
              @click="deleteAppt(appt)"
            >
              <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center gap-3 py-8">
        <div class="w-14 h-14 rounded-[26px] flex items-center justify-center" style="background: #06b6d414">
          <CalendarDays class="w-7 h-7" style="color: #06b6d4; opacity: 0.5" />
        </div>
        <p class="text-sm font-bold text-muted-foreground">No upcoming appointments</p>
      </div>
    </div>

    <!-- ── Add / Edit Dialog ─────────────────────────────────── -->
    <Dialog v-model:open="formOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #06b6d4, #0891b2)">
              <CalendarDays class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">{{ editingAppt ? 'Edit Appointment' : 'New Appointment' }}</h2>
              <p class="text-xs text-muted-foreground font-medium">Schedule an appointment</p>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Title</label>
            <input v-model="apptForm.title" placeholder="Screen Repair Consultation" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</label>
            <select v-model="apptForm.customerId" class="m3-input">
              <option :value="null">Walk-in</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Date</label>
              <input v-model="apptForm.date" type="date" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Time</label>
              <input v-model="apptForm.time" type="time" class="m3-input" />
            </div>
          </div>
          <div v-if="editingAppt" class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Status</label>
            <select v-model="apptForm.status" class="m3-input">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Notes</label>
            <textarea v-model="apptForm.description" placeholder="Appointment details…" rows="2" class="m3-input resize-none" style="height: auto; padding-top: 12px" />
          </div>
          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="formOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #06b6d4, #0891b2)" @click="saveAppt">
              {{ editingAppt ? 'Save Changes' : 'Schedule' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle, Trash2, Pencil } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const appointments = computed(() => appStore.appointments ?? [])
const customers = computed(() => appStore.customers ?? [])

const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const formOpen = ref(false)
const editingAppt = ref<any>(null)
const selectedDay = ref('')
const apptForm = ref({ title: '', customerId: null as any, date: '', time: '', description: '', status: 'scheduled' })

const today = new Date().toISOString().split('T')[0]
const upcomingCount = computed(() => appointments.value.filter((a: any) => a.date >= today && a.status === 'scheduled').length)
const todayCount = computed(() => appointments.value.filter((a: any) => a.date === today).length)

const monthLabel = computed(() => new Date(viewYear.value, viewMonth.value).toLocaleDateString([], { month: 'long', year: 'numeric' }))
const prevMonth = () => { if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- } else viewMonth.value-- }
const nextMonth = () => { if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ } else viewMonth.value++ }
const goToday = () => { viewYear.value = now.getFullYear(); viewMonth.value = now.getMonth() }

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const daysInPrev = new Date(viewYear.value, viewMonth.value, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]
  const days: any[] = []
  for (let i = firstDay - 1; i >= 0; i--) days.push({ day: daysInPrev - i, currentMonth: false, date: '', isToday: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ day: d, currentMonth: true, date: dateStr, isToday: dateStr === todayStr })
  }
  while (days.length % 7 !== 0) days.push({ day: days.length - firstDay - daysInMonth + 1, currentMonth: false, date: '', isToday: false })
  return days
})

const getAppts = (date: string) => date ? appointments.value.filter((a: any) => a.date === date) : []

const upcomingAppts = computed(() =>
  appointments.value
    .filter((a: any) => a.date >= today && a.status === 'scheduled')
    .sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 8)
)

const formatApptDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const openNew = () => {
  editingAppt.value = null
  apptForm.value = { title: '', customerId: null, date: selectedDay.value || today, time: '', description: '', status: 'scheduled' }
  formOpen.value = true
}

const selectDay = (date: string) => {
  selectedDay.value = date
  openNew()
}

const editAppt = (appt: any) => {
  editingAppt.value = appt
  apptForm.value = { ...appt }
  formOpen.value = true
}

const saveAppt = async () => {
  if (!apptForm.value.title && !apptForm.value.description) return
  if (!appStore.appointments) (appStore as any).appointments = []
  if (editingAppt.value) {
    const idx = appStore.appointments.findIndex((a: any) => a.id === editingAppt.value.id)
    if (idx > -1) appStore.appointments[idx] = { ...editingAppt.value, ...apptForm.value }
  } else {
    const appt = { ...apptForm.value, id: Date.now(), status: 'scheduled', date: apptForm.value.date || selectedDay.value }
    appStore.appointments.push(appt as any)
  }
  await appStore.saveAll()
  formOpen.value = false
  editingAppt.value = null
  apptForm.value = { title: '', customerId: null, date: '', time: '', description: '', status: 'scheduled' }
}

const deleteAppt = async (appt: any) => {
  if (confirm(`Delete appointment "${appt.title || appt.description}"?`)) {
    const idx = appStore.appointments.findIndex((a: any) => a.id === appt.id)
    if (idx > -1) appStore.appointments.splice(idx, 1)
    await appStore.saveAll()
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

.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px #06b6d418; }
</style>
