<template>
  <div class="space-y-5">

    <!-- ── Page Header ── -->
    <div class="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
      <div class="flex items-center gap-3">
        <!-- Month nav -->
        <div class="flex items-center gap-1 rounded-2xl border border-border bg-card p-1">
          <button @click="previousMonth" class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <h2 class="text-sm font-bold min-w-[148px] text-center px-1">{{ currentMonthYear }}</h2>
          <button @click="nextMonth" class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
        <button @click="goToToday" class="h-8 px-3 rounded-2xl text-xs font-semibold border border-border bg-card hover:bg-muted transition-colors">
          Today
        </button>
      </div>

      <div class="flex items-center gap-2">
        <!-- Legend -->
        <div class="hidden sm:flex items-center gap-3 mr-1 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full inline-block" style="background:#6366f1" />
            Appointment
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full inline-block" style="background:#10b981" />
            House Call
          </span>
        </div>
        <!-- New Appointment button -->
        <button @click="openNewAppointment" class="flex items-center gap-1.5 h-9 px-4 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
          <Plus class="w-4 h-4" />
          Appointment
        </button>
        <!-- New House Call button -->
        <button @click="openNewHouseCall" class="flex items-center gap-1.5 h-9 px-4 rounded-2xl text-sm font-semibold border border-border bg-card hover:bg-muted transition-colors" style="outline:1px solid #10b98130; color:#10b981">
          <MapPin class="w-4 h-4" />
          House Call
        </button>
      </div>
    </div>

    <!-- ── Stats Row ── -->
    <div class="grid grid-cols-3 gap-3">
      <div class="rounded-3xl bg-card border border-border p-4 flex items-center gap-3" style="outline:1px solid #3b82f625">
        <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:#3b82f618">
          <CalendarDays class="w-4 h-4" style="color:#3b82f6" />
        </div>
        <div>
          <p class="text-[11px] text-muted-foreground font-medium">This Month</p>
          <p class="text-2xl font-bold leading-none mt-0.5">{{ thisMonthCount }}</p>
        </div>
      </div>
      <div class="rounded-3xl bg-card border border-border p-4 flex items-center gap-3" style="outline:1px solid #f59e0b25">
        <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:#f59e0b18">
          <Clock class="w-4 h-4" style="color:#f59e0b" />
        </div>
        <div>
          <p class="text-[11px] text-muted-foreground font-medium">Today</p>
          <p class="text-2xl font-bold leading-none mt-0.5">{{ todayCount }}</p>
        </div>
      </div>
      <div class="rounded-3xl bg-card border border-border p-4 flex items-center gap-3" style="outline:1px solid #10b98125">
        <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:#10b98118">
          <CheckCircle class="w-4 h-4" style="color:#10b981" />
        </div>
        <div>
          <p class="text-[11px] text-muted-foreground font-medium">Upcoming</p>
          <p class="text-2xl font-bold leading-none mt-0.5">{{ upcomingCount }}</p>
        </div>
      </div>
    </div>

    <!-- ── Calendar + Sidebar layout ── -->
    <div class="flex gap-4 items-start">

      <!-- Calendar Grid -->
      <div class="flex-1 min-w-0 rounded-3xl bg-card border border-border overflow-hidden">
        <!-- Day headers -->
        <div class="grid grid-cols-7 border-b border-border" style="background:hsl(var(--muted)/0.3)">
          <div
            v-for="day in dayHeaders"
            :key="day"
            class="py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          >{{ day }}</div>
        </div>

        <!-- Calendar cells -->
        <div class="grid grid-cols-7">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="min-h-[100px] border-b border-r border-border/60 p-1.5 relative cursor-pointer transition-colors"
            :class="[
              !cell.currentMonth && 'bg-muted/10',
              i % 7 === 6 && 'border-r-0',
              Math.floor(i / 7) === Math.floor((calendarCells.length - 1) / 7) && 'border-b-0',
              cell.currentMonth && !cell.isToday && 'hover:bg-muted/30'
            ]"
            :style="cell.isToday ? 'background:#6366f108; box-shadow:inset 0 0 0 1.5px #6366f130' : ''"
            @click="handleDayClick(cell)"
          >
            <!-- Date number -->
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                :class="[
                  !cell.currentMonth && 'text-muted-foreground/30',
                  !cell.isToday && cell.currentMonth && 'text-foreground'
                ]"
                :style="cell.isToday ? 'background:#6366f1; color:white' : ''"
              >{{ cell.date.getDate() }}</span>
              <span v-if="cell.events.length > 0 && cell.currentMonth" class="text-[9px] text-muted-foreground font-medium">
                {{ cell.events.length }}
              </span>
            </div>

            <!-- Events -->
            <div class="space-y-0.5">
              <div
                v-for="event in cell.events.slice(0, 3)"
                :key="event.id"
                class="text-[10px] leading-tight px-1.5 py-0.5 rounded-lg font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                :style="event.type === 'appointment'
                  ? 'background:#6366f115; color:#6366f1'
                  : 'background:#10b98115; color:#10b981'"
                :title="`${event.time} — ${event.title}`"
                @click.stop="openEvent(event)"
              >{{ event.time }} {{ event.title }}</div>
              <div
                v-if="cell.events.length > 3"
                class="text-[10px] text-muted-foreground px-1.5 cursor-pointer hover:text-foreground font-medium"
                @click.stop="showDayEvents(cell)"
              >+{{ cell.events.length - 3 }} more</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Today's Events Sidebar (desktop) -->
      <div class="hidden lg:flex flex-col w-[240px] flex-shrink-0 rounded-3xl bg-card border border-border overflow-hidden">
        <div class="p-4 border-b border-border" style="background:#06b6d408">
          <div class="flex items-center gap-2 mb-0.5">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background:#06b6d418">
              <CalendarDays class="w-3.5 h-3.5" style="color:#06b6d4" />
            </div>
            <h3 class="text-sm font-semibold">
              {{ new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }}
            </h3>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ todayCount === 0 ? 'Nothing scheduled' : `${todayCount} event${todayCount !== 1 ? 's' : ''}` }}
          </p>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="todayEvents.length === 0" class="flex flex-col items-center justify-center py-10 px-4 text-center">
            <CalendarDays class="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p class="text-xs text-muted-foreground">No events today</p>
          </div>
          <div
            v-for="event in todayEvents"
            :key="event.id"
            class="flex items-start gap-3 p-3 hover:bg-muted/40 cursor-pointer transition-colors border-b border-border/60 last:border-b-0"
            @click="openEvent(event)"
          >
            <div class="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              :style="event.type === 'appointment' ? 'background:#6366f118' : 'background:#10b98118'">
              <CalendarDays v-if="event.type === 'appointment'" class="w-3.5 h-3.5" style="color:#6366f1" />
              <MapPin v-else class="w-3.5 h-3.5" style="color:#10b981" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold truncate">{{ event.title }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ event.subtitle }}</p>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="text-[10px] text-muted-foreground">{{ event.time }}</span>
                <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" :class="getStatusClass(event.status)">{{ event.status }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-3 border-t border-border">
          <button @click="openNewAppointment" class="w-full flex items-center justify-center gap-1.5 h-8 rounded-2xl text-xs font-medium border border-border bg-muted/50 hover:bg-muted transition-colors">
            <Plus class="w-3.5 h-3.5" />Add Event
          </button>
        </div>
      </div>
    </div>

    <!-- ── Selected Day Panel ── -->
    <div v-if="selectedDayEvents.length > 0" class="rounded-3xl bg-card border border-border overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border" style="background:#6366f108">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-xl flex items-center justify-center" style="background:#6366f118">
            <CalendarDays class="w-3.5 h-3.5" style="color:#6366f1" />
          </div>
          <span class="text-sm font-semibold">{{ selectedDayLabel }}</span>
        </div>
        <button @click="selectedDay = null" class="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground">
          <X class="w-4 h-4" />
        </button>
      </div>
      <div class="p-4 space-y-2">
        <div
          v-for="event in selectedDayEvents"
          :key="event.id"
          class="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors border"
          :class="event.type === 'appointment' ? 'border-indigo-500/20 hover:bg-indigo-500/5' : 'border-emerald-500/20 hover:bg-emerald-500/5'"
          @click="openEvent(event)"
        >
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            :style="event.type === 'appointment' ? 'background:#6366f118' : 'background:#10b98118'">
            <CalendarDays v-if="event.type === 'appointment'" class="w-4 h-4" style="color:#6366f1" />
            <MapPin v-else class="w-4 h-4" style="color:#10b981" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ event.title }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ event.subtitle }}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-xs font-medium">{{ event.time }}</p>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 inline-block" :class="getStatusClass(event.status)">{{ event.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Appointment Dialog ── -->
    <Dialog v-model:open="appointmentDialogOpen">
      <DialogContent class="p-0 rounded-3xl gap-0 overflow-hidden">
        <!-- Tonal header -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-border" style="background:#6366f108">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#6366f118">
            <CalendarDays class="w-4 h-4" style="color:#6366f1" />
          </div>
          <div>
            <p class="text-sm font-semibold">{{ editingAppointment ? 'Edit Appointment' : 'New Appointment' }}</p>
            <p class="text-xs text-muted-foreground">Schedule a customer visit</p>
          </div>
        </div>
        <div class="p-5 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer *</label>
            <select v-model="appointmentForm.customerId" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              <option :value="null" disabled>Select customer</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description *</label>
            <textarea v-model="appointmentForm.description" placeholder="e.g. Screen repair pickup" :rows="2" class="w-full px-3 py-2 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date *</label>
              <input v-model="appointmentForm.date" type="date" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time *</label>
              <input v-model="appointmentForm.time" type="time" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
          <!-- Inline status chips -->
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in ['scheduled','confirmed','completed','cancelled']" :key="s"
                @click="appointmentForm.status = s"
                class="h-8 px-3 rounded-2xl text-xs font-semibold border transition-all capitalize"
                :style="appointmentForm.status === s
                  ? 'background:#6366f118; color:#6366f1; border-color:#6366f140; outline:1.5px solid #6366f140'
                  : 'background:hsl(var(--muted)/0.5); border-color:hsl(var(--border)); color:hsl(var(--muted-foreground))'">
                {{ s }}
              </button>
            </div>
          </div>
          <div class="flex gap-2 pt-1">
            <button v-if="editingAppointment" @click="deleteAppointment" class="flex-1 h-9 rounded-2xl text-sm font-semibold text-red-600 transition-colors" style="background:#ef444412; outline:1px solid #ef444425">Delete</button>
            <button @click="appointmentDialogOpen = false" class="flex-1 h-9 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors">Cancel</button>
            <button @click="saveAppointment" class="flex-1 h-9 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
              {{ editingAppointment ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── House Call Dialog ── -->
    <Dialog v-model:open="houseCallDialogOpen">
      <DialogContent class="p-0 rounded-3xl gap-0 overflow-hidden">
        <!-- Tonal header -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-border" style="background:#10b98108">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#10b98118">
            <MapPin class="w-4 h-4" style="color:#10b981" />
          </div>
          <div>
            <p class="text-sm font-semibold">{{ editingHouseCall ? 'Edit House Call' : 'New House Call' }}</p>
            <p class="text-xs text-muted-foreground">Schedule an on-site visit</p>
          </div>
        </div>
        <div class="p-5 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer *</label>
            <select v-model="houseCallForm.customerId" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
              <option :value="null" disabled>Select customer</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description *</label>
            <textarea v-model="houseCallForm.description" placeholder="e.g. On-site repair" :rows="2" class="w-full px-3 py-2 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address *</label>
            <input v-model="houseCallForm.address" placeholder="123 Main St" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date *</label>
              <input v-model="houseCallForm.date" type="date" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time *</label>
              <input v-model="houseCallForm.time" type="time" class="w-full h-9 px-3 rounded-2xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
            </div>
          </div>
          <!-- Inline status chips -->
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in ['scheduled','confirmed','in-progress','completed','cancelled']" :key="s"
                @click="houseCallForm.status = s"
                class="h-8 px-3 rounded-2xl text-xs font-semibold border transition-all capitalize"
                :style="houseCallForm.status === s
                  ? 'background:#10b98118; color:#10b981; border-color:#10b98140; outline:1.5px solid #10b98140'
                  : 'background:hsl(var(--muted)/0.5); border-color:hsl(var(--border)); color:hsl(var(--muted-foreground))'">
                {{ s }}
              </button>
            </div>
          </div>
          <div class="flex gap-2 pt-1">
            <button v-if="editingHouseCall" @click="deleteHouseCall" class="flex-1 h-9 rounded-2xl text-sm font-semibold text-red-600 transition-colors" style="background:#ef444412; outline:1px solid #ef444425">Delete</button>
            <button @click="houseCallDialogOpen = false" class="flex-1 h-9 rounded-2xl text-sm font-medium border border-border bg-muted/50 hover:bg-muted transition-colors">Cancel</button>
            <button @click="saveHouseCall" class="flex-1 h-9 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90" style="background:linear-gradient(135deg,#10b981,#06b6d4)">
              {{ editingHouseCall ? 'Update' : 'Schedule' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { CalendarDays, CheckCircle, Clock, ChevronLeft, ChevronRight, Plus, MapPin, X } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { appointments, customers, houseCalls } = storeToRefs(appStore)
const {
  createAppointment: storeCreateAppointment,
  updateAppointment: storeUpdateAppointment,
  deleteAppointment: storeDeleteAppointment,
  createHouseCall: storeCreateHouseCall,
  updateHouseCall: storeUpdateHouseCall,
  deleteHouseCall: storeDeleteHouseCall
} = appStore

const currentDate = ref(new Date())
const selectedDay = ref<Date | null>(null)
const appointmentDialogOpen = ref(false)
const houseCallDialogOpen = ref(false)
const editingAppointment = ref<any>(null)
const editingHouseCall = ref<any>(null)

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Calendar cells ────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string
  type: 'appointment' | 'housecall'
  title: string
  subtitle: string
  time: string
  status: string
  raw: any
}

interface CalendarCell {
  date: Date
  currentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

const allEvents = computed<CalendarEvent[]>(() => {
  const evts: CalendarEvent[] = []

  ;(appointments.value || []).forEach((apt: any) => {
    evts.push({
      id: `apt-${apt.id}`,
      type: 'appointment',
      title: getCustomerName(apt.customerId),
      subtitle: apt.description,
      time: formatTime(apt.time),
      status: apt.status,
      raw: apt,
    })
  })

  ;(houseCalls.value || []).forEach((hc: any) => {
    evts.push({
      id: `hc-${hc.id}`,
      type: 'housecall',
      title: getCustomerName(hc.customerId),
      subtitle: hc.description,
      time: formatTime(hc.time),
      status: hc.status,
      raw: hc,
    })
  })

  return evts
})

const calendarCells = computed<CalendarCell[]>(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells: CalendarCell[] = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    const d = new Date(year, month, -firstDay.getDay() + i + 1)
    cells.push({ date: d, currentMonth: false, isToday: false, events: [] })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const dateStr = date.toISOString().split('T')[0]
    date.setHours(0, 0, 0, 0)

    const events = allEvents.value
      .filter(e => e.raw.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time))

    cells.push({
      date,
      currentMonth: true,
      isToday: date.getTime() === today.getTime(),
      events,
    })
  }

  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      cells.push({ date: d, currentMonth: false, isToday: false, events: [] })
    }
  }

  return cells
})

// ── Stats ─────────────────────────────────────────────────────────────────────
const thisMonthCount = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth()
  return allEvents.value.filter(e => {
    const d = new Date(e.raw.date)
    return d.getFullYear() === y && d.getMonth() === m
  }).length
})

const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return allEvents.value.filter(e => e.raw.date === today).length
})

const upcomingCount = computed(() => {
  const now = new Date()
  return allEvents.value.filter(e => {
    const d = new Date(`${e.raw.date}T${e.raw.time}`)
    return d >= now && e.status !== 'cancelled' && e.status !== 'completed'
  }).length
})

// ── Today's events for sidebar ────────────────────────────────────────────────
const todayEvents = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return allEvents.value
    .filter(e => e.raw.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))
})

// ── Selected day ──────────────────────────────────────────────────────────────
const selectedDayEvents = computed(() => {
  if (!selectedDay.value) return []
  const dateStr = selectedDay.value.toISOString().split('T')[0]
  return allEvents.value.filter(e => e.raw.date === dateStr)
})

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''
  return selectedDay.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

const handleDayClick = (cell: CalendarCell) => {
  if (cell.events.length > 0) {
    selectedDay.value = cell.date
  } else {
    selectedDay.value = null
  }
}

const showDayEvents = (cell: CalendarCell) => {
  selectedDay.value = cell.date
}

const openEvent = (event: CalendarEvent) => {
  if (event.type === 'appointment') {
    editingAppointment.value = event.raw
    appointmentForm.value = { ...event.raw }
    appointmentDialogOpen.value = true
  } else {
    editingHouseCall.value = event.raw
    houseCallForm.value = { ...event.raw }
    houseCallDialogOpen.value = true
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────
const currentMonthYear = computed(() =>
  currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
)
const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}
const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}
const goToToday = () => {
  currentDate.value = new Date()
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getCustomerName = (customerId: number) => {
  return (customers.value || []).find((c: any) => c.id === customerId)?.name || 'Unknown'
}

const formatTime = (time: string) => {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-600',
    confirmed: 'bg-emerald-500/10 text-emerald-600',
    'in-progress': 'bg-amber-500/10 text-amber-600',
    completed: 'bg-gray-500/10 text-gray-500',
    cancelled: 'bg-red-500/10 text-red-600',
  }
  return map[status] || 'bg-gray-500/10 text-gray-500'
}
// ── Appointment CRUD ──────────────────────────────────────────────────────────
const appointmentForm = ref({ customerId: null as any, description: '', date: '', time: '', status: 'scheduled' })

const openNewAppointment = () => {
  editingAppointment.value = null
  appointmentForm.value = { customerId: null, description: '', date: '', time: '', status: 'scheduled' }
  appointmentDialogOpen.value = true
}

const saveAppointment = async () => {
  if (!appointmentForm.value.customerId || !appointmentForm.value.description || !appointmentForm.value.date || !appointmentForm.value.time) {
    alert('Please fill in all required fields')
    return
  }
  try {
    if (editingAppointment.value) {
      await storeUpdateAppointment(editingAppointment.value.id, { ...appointmentForm.value })
    } else {
      await storeCreateAppointment({ ...appointmentForm.value, notes: '' })
    }
    appointmentDialogOpen.value = false
    editingAppointment.value = null
  } catch (err: any) {
    alert('Failed to save appointment: ' + (err.message || err))
  }
}

const deleteAppointment = async () => {
  if (!editingAppointment.value || !confirm('Delete this appointment?')) return
  try {
    await storeDeleteAppointment(editingAppointment.value.id)
  } catch (err: any) {
    alert('Failed to delete: ' + (err.message || err))
  }
  appointmentDialogOpen.value = false
  editingAppointment.value = null
}

// ── House Call CRUD ───────────────────────────────────────────────────────────
const houseCallForm = ref({ customerId: null as any, description: '', address: '', date: '', time: '', status: 'scheduled' as any, notes: '' })

const openNewHouseCall = () => {
  editingHouseCall.value = null
  houseCallForm.value = { customerId: null, description: '', address: '', date: '', time: '', status: 'scheduled', notes: '' }
  houseCallDialogOpen.value = true
}

const saveHouseCall = async () => {
  if (!houseCallForm.value.customerId || !houseCallForm.value.description || !houseCallForm.value.date || !houseCallForm.value.time) {
    alert('Please fill in all required fields')
    return
  }
  try {
    if (editingHouseCall.value) {
      await storeUpdateHouseCall(editingHouseCall.value.id, { ...houseCallForm.value })
    } else {
      await storeCreateHouseCall({ ...houseCallForm.value })
    }
    houseCallDialogOpen.value = false
    editingHouseCall.value = null
  } catch (err: any) {
    alert('Failed to save house call: ' + (err.message || err))
  }
}

const deleteHouseCall = async () => {
  if (!editingHouseCall.value || !confirm('Delete this house call?')) return
  try {
    await storeDeleteHouseCall(editingHouseCall.value.id)
  } catch (err: any) {
    alert('Failed to delete: ' + (err.message || err))
  }
  houseCallDialogOpen.value = false
  editingHouseCall.value = null
}
</script>
