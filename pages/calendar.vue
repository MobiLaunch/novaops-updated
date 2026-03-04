<template>
  <div class="flex flex-col gap-6">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 6px 28px #6366f150">
          <CalendarDays class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Calendar</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Appointments, house calls &amp; repairs — all in one place</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button class="h-11 px-4 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
          style="background: hsl(var(--muted)/0.6)"
          @click="goToday">Today</button>

        <!-- View toggle -->
        <div class="flex gap-0.5 rounded-full p-1" style="background: hsl(var(--muted)/0.5)">
          <button v-for="v in views" :key="v.key"
            class="px-4 py-2 rounded-full text-xs font-black transition-all"
            :style="calView === v.key
              ? 'background: hsl(var(--card)); color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.12)'
              : 'color: hsl(var(--muted-foreground))'"
            @click="calView = v.key">{{ v.label }}</button>
        </div>

        <button class="m3-btn flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white"
          style="background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 16px #6366f140"
          @click="openPicker(today)">
          <Plus class="w-4 h-4" /> New Event
        </button>
      </div>
    </div>

    <!-- ── KPI Row ─────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #6366f114; outline: 2px solid #6366f128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #6366f124">
            <CalendarDays class="w-5 h-5" style="color: #6366f1" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #6366f120; color: #6366f1">TOTAL</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">All Events</p>
          <p class="text-2xl font-black" style="color: #6366f1">{{ allEvents.length }}</p>
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
          <p class="text-2xl font-black" style="color: #10b981">{{ completedCount }}</p>
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
          <p class="text-2xl font-black" style="color: #f59e0b">{{ getDayEvents(today).length }}</p>
        </div>
      </div>
    </div>

    <!-- ── Legend ─────────────────────────────────────────────── -->
    <div class="flex items-center gap-5 flex-wrap">
      <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Key:</span>
      <div v-for="t in eventTypes" :key="t.key" class="flex items-center gap-1.5">
        <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="`background: ${t.color}`" />
        <span class="text-xs font-semibold text-muted-foreground">{{ t.label }}</span>
      </div>
    </div>

    <!-- ══ MONTH VIEW ══════════════════════════════════════════════ -->
    <template v-if="calView === 'month'">
      <div class="flex items-center gap-4">
        <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="prevMonth">
          <ChevronLeft class="w-5 h-5" />
        </button>
        <h2 class="text-xl font-black flex-1 text-center">{{ monthLabel }}</h2>
        <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="nextMonth">
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <div class="rounded-[32px] overflow-hidden bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="grid grid-cols-7 border-b border-border/60" style="background: #6366f108">
          <div v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d"
            class="py-3 text-center text-xs font-black text-muted-foreground uppercase tracking-widest">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7">
          <div v-for="(day, idx) in calendarDays" :key="idx"
            class="min-h-[90px] p-2 border-b border-r border-border/20 last:border-r-0 cursor-pointer transition-all hover:bg-muted/20"
            :class="{ 'opacity-40': !day.currentMonth }"
            :style="day.isToday ? 'background: #6366f10d' : ''"
            @click="day.currentMonth && openPicker(day.date)">
            <div class="w-7 h-7 flex items-center justify-center rounded-full mb-1 text-xs font-black"
              :style="day.isToday ? 'background: #6366f1; color: white' : ''">
              {{ day.day }}
            </div>
            <div class="space-y-0.5">
              <div v-for="event in getDayEvents(day.date).slice(0, 3)" :key="event._id"
                class="text-[9px] font-bold px-1.5 py-0.5 rounded-[6px] truncate flex items-center gap-0.5 cursor-pointer hover:opacity-80"
                :style="`background: ${eColor(event)}22; color: ${eColor(event)}`"
                @click.stop="openEdit(event)">
                <component :is="eIcon(event)" class="w-2 h-2 flex-shrink-0" />
                {{ eLabel(event) }}
              </div>
              <div v-if="getDayEvents(day.date).length > 3"
                class="text-[9px] font-semibold px-1.5 py-0.5 rounded-[6px]"
                style="background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))">
                +{{ getDayEvents(day.date).length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ WEEK VIEW ══════════════════════════════════════════════ -->
    <template v-else-if="calView === 'week'">
      <div class="flex items-center gap-4">
        <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="prevWeek">
          <ChevronLeft class="w-5 h-5" />
        </button>
        <h2 class="text-xl font-black flex-1 text-center">{{ weekLabel }}</h2>
        <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="nextWeek">
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <div class="rounded-[32px] overflow-hidden bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="grid grid-cols-7 border-b border-border/60" style="background: #6366f108">
          <div v-for="day in weekDays" :key="day.date" class="py-3 text-center">
            <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{{ day.dow }}</p>
            <div class="w-8 h-8 flex items-center justify-center rounded-full mx-auto mt-1 text-sm font-black"
              :style="day.isToday ? 'background:#6366f1;color:white' : ''">
              {{ day.dayNum }}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-7 min-h-[220px]">
          <div v-for="day in weekDays" :key="day.date"
            class="p-2 border-r border-border/20 last:border-r-0 space-y-1 cursor-pointer"
            :style="day.isToday ? 'background: #6366f108' : ''"
            @click="openPicker(day.date)">
            <div v-for="event in getDayEvents(day.date)" :key="event._id"
              class="text-[10px] font-bold px-2 py-1.5 rounded-[10px] cursor-pointer transition-all hover:scale-[1.02]"
              :style="`background: ${eColor(event)}18; color: ${eColor(event)}; outline: 1.5px solid ${eColor(event)}30; outline-offset: 0`"
              @click.stop="openEdit(event)">
              <div class="flex items-center gap-1">
                <component :is="eIcon(event)" class="w-3 h-3 flex-shrink-0" />
                <span class="truncate">{{ eLabel(event) }}</span>
              </div>
              <div v-if="event.time" class="opacity-60 pl-4">{{ event.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ AGENDA VIEW ═════════════════════════════════════════════ -->
    <template v-else>
      <div class="flex items-center gap-4">
        <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="prevMonth">
          <ChevronLeft class="w-5 h-5" />
        </button>
        <h2 class="text-xl font-black flex-1 text-center">{{ monthLabel }}</h2>
        <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="nextMonth">
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <div v-if="agendaGroups.length" class="space-y-5">
        <div v-for="group in agendaGroups" :key="group.date">
          <!-- Date divider -->
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
              :style="group.date === today ? 'background:#6366f1;color:white' : 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))'">
              {{ new Date(group.date + 'T00:00:00').getDate() }}
            </div>
            <span class="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {{ formatAgendaDate(group.date) }}
            </span>
            <div class="flex-1 h-px" style="background: hsl(var(--border)/0.5)" />
          </div>
          <!-- Events -->
          <div class="space-y-2 pl-12">
            <div v-for="event in group.events" :key="event._id"
              class="m3-row flex items-center gap-3 px-4 py-3 rounded-[20px] cursor-pointer"
              :style="`background: ${eColor(event)}10; outline: 1.5px solid ${eColor(event)}25; outline-offset: 0`"
              @click="openEdit(event)">
              <div class="w-10 h-10 rounded-[20px] flex items-center justify-center flex-shrink-0"
                :style="`background: ${eColor(event)}22`">
                <component :is="eIcon(event)" class="w-5 h-5" :style="`color: ${eColor(event)}`" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold truncate">{{ eLabel(event) }}</p>
                <p class="text-xs text-muted-foreground font-medium">
                  {{ event.time || 'All day' }}
                  <span v-if="event.address" :style="`color: ${eColor(event)}`"> · {{ event.address }}</span>
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-[10px] font-black px-2.5 py-1 rounded-full capitalize"
                  :style="statusStyle(event.status)">{{ event.status || 'open' }}</span>
                <button class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-110 active:scale-90"
                  @click.stop="deleteEvent(event)">
                  <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center gap-3 py-16">
        <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background:#6366f114">
          <CalendarDays class="w-8 h-8" style="color:#6366f1;opacity:0.4" />
        </div>
        <p class="text-sm font-bold text-muted-foreground">No events this month</p>
        <button class="px-5 py-2.5 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
          style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
          @click="openPicker(today)">Add First Event</button>
      </div>
    </template>

    <!-- ── Event Type Picker Dialog ──────────────────────────── -->
    <Dialog v-model:open="pickerOpen">
      <DialogContent class="max-w-sm">
        <div class="flex flex-col gap-4 p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center"
              style="background: linear-gradient(135deg,#6366f1,#8b5cf6)">
              <Plus class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">New Event</h2>
              <p class="text-xs text-muted-foreground font-medium">{{ formatPickerDate(pickerDate) }}</p>
            </div>
          </div>
          <div class="space-y-2">
            <button v-for="t in eventTypes" :key="t.key"
              class="w-full flex items-center gap-4 px-4 py-3.5 rounded-[20px] transition-all hover:scale-[1.02] active:scale-[0.97] text-left"
              :style="`background: ${t.color}10; outline: 1.5px solid ${t.color}25; outline-offset: 0`"
              @click="pickType(t.key)">
              <div class="w-10 h-10 rounded-[18px] flex items-center justify-center flex-shrink-0"
                :style="`background: ${t.color}22`">
                <component :is="t.icon" class="w-5 h-5" :style="`color: ${t.color}`" />
              </div>
              <div>
                <p class="text-sm font-black" :style="`color: ${t.color}`">{{ t.label }}</p>
                <p class="text-xs text-muted-foreground font-medium">{{ t.desc }}</p>
              </div>
            </button>
          </div>
          <button class="w-full h-11 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style="outline:2px solid hsl(var(--border));outline-offset:0"
            @click="pickerOpen = false">Cancel</button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Appointment / House Call Form ─────────────────────── -->
    <Dialog v-model:open="apptOpen">
      <DialogContent class="max-w-md">
        <div class="flex flex-col gap-5 p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center"
              :style="apptType === 'housecall'
                ? 'background:linear-gradient(135deg,#10b981,#059669)'
                : 'background:linear-gradient(135deg,#06b6d4,#0891b2)'">
              <component :is="apptType === 'housecall' ? MapPin : CalendarDays" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">
                {{ editingEvent ? 'Edit' : 'New' }} {{ apptType === 'housecall' ? 'House Call' : 'Appointment' }}
              </h2>
              <p class="text-xs text-muted-foreground">{{ apptType === 'housecall' ? 'On-site repair visit' : 'In-shop appointment' }}</p>
            </div>
          </div>
          <div class="space-y-2">
            <label class="m3-label">Title</label>
            <input v-model="apptForm.title"
              :placeholder="apptType === 'housecall' ? 'TV repair at client home' : 'Screen repair consultation'"
              class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Customer</label>
            <select v-model="apptForm.customerId" class="m3-input">
              <option :value="null">Walk-in / No customer</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div v-if="apptType === 'housecall'" class="space-y-2">
            <label class="m3-label">Address</label>
            <input v-model="apptForm.address" placeholder="123 Main St, City, State" class="m3-input" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="m3-label">Date</label>
              <input v-model="apptForm.date" type="date" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="m3-label">Time</label>
              <input v-model="apptForm.time" type="time" class="m3-input" />
            </div>
          </div>
          <div v-if="editingEvent" class="space-y-2">
            <label class="m3-label">Status</label>
            <select v-model="apptForm.status" class="m3-input">
              <option value="scheduled">Scheduled</option>
              <option v-if="apptType === 'housecall'" value="In Progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="m3-label">Notes</label>
            <textarea v-model="apptForm.description" placeholder="Details…" rows="2"
              class="m3-input resize-none" style="height:auto;padding-top:12px" />
          </div>
          <div class="flex gap-3 pt-1">
            <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style="outline:2px solid hsl(var(--border));outline-offset:0"
              @click="apptOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
              :style="apptType === 'housecall'
                ? 'background:linear-gradient(135deg,#10b981,#059669)'
                : 'background:linear-gradient(135deg,#06b6d4,#0891b2)'"
              @click="saveAppt">
              {{ editingEvent ? 'Save Changes' : 'Schedule' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── New Ticket Dialog ──────────────────────────────────── -->
    <NewTicketDialog v-model="ticketOpen" :customers="customers" @create="handleCreateTicket" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CalendarDays, MapPin, Plus, ChevronLeft, ChevronRight,
  Clock, CheckCircle, Trash2, TicketCheck,
} from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import { useNotifications } from '~/composables/useNotifications'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { appointments, tickets, customers } = storeToRefs(appStore)
const { addNotification } = useNotifications()

// ── Event type config ──────────────────────────────────────────
const eventTypes = [
  { key: 'appointment', label: 'Appointment',   desc: 'In-shop visit or consultation',       color: '#06b6d4', icon: CalendarDays },
  { key: 'housecall',   label: 'House Call',    desc: 'On-site repair at customer location', color: '#10b981', icon: MapPin },
  { key: 'ticket',      label: 'Repair Ticket', desc: 'New repair job or service ticket',    color: '#f59e0b', icon: TicketCheck },
]

// ── Unified events (appointments + tickets that have a date) ───
const allEvents = computed(() => {
  const appts = (appointments.value || []).map((a: any) => ({
    ...a,
    _id: `appt-${a.id}`,
    _kind: a.type === 'housecall' ? 'housecall' : 'appointment',
  }))
  const tix = (tickets.value || [])
    .filter((t: any) => t.date || t.createdAt)
    .map((t: any) => ({
      ...t,
      _id: `ticket-${t.id}`,
      _kind: 'ticket',
      date: t.date || (t.createdAt ? t.createdAt.split('T')[0] : ''),
      title: `#${t.id} ${t.device || ''}`.trim(),
    }))
  return [...appts, ...tix]
})

function eColor(e: any) {
  if (e._kind === 'housecall') return '#10b981'
  if (e._kind === 'ticket')    return '#f59e0b'
  return '#06b6d4'
}
function eIcon(e: any) {
  if (e._kind === 'housecall') return MapPin
  if (e._kind === 'ticket')    return TicketCheck
  return CalendarDays
}
function eLabel(e: any) {
  return e.title || e.description || 'Untitled'
}

const getDayEvents = (date: string) =>
  date ? allEvents.value.filter((e: any) => e.date === date) : []

// ── Stats ──────────────────────────────────────────────────────
const today          = new Date().toISOString().split('T')[0]
const upcomingCount  = computed(() =>
  allEvents.value.filter((e: any) =>
    e.date >= today && e.status !== 'completed' && e.status !== 'Completed' && e.status !== 'cancelled'
  ).length
)
const completedCount = computed(() =>
  allEvents.value.filter((e: any) => e.status === 'completed' || e.status === 'Completed').length
)

// ── Calendar nav ───────────────────────────────────────────────
const now       = new Date()
const viewYear  = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const calView   = ref<'month' | 'week' | 'agenda'>('month')
const views     = [{ key: 'month', label: 'Month' }, { key: 'week', label: 'Week' }, { key: 'agenda', label: 'Agenda' }]

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value).toLocaleDateString([], { month: 'long', year: 'numeric' })
)
const prevMonth = () => { if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- } else viewMonth.value-- }
const nextMonth = () => { if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ } else viewMonth.value++ }
const goToday   = () => {
  viewYear.value = now.getFullYear()
  viewMonth.value = now.getMonth()
  weekStart.value = startOfWeek(now)
}

const calendarDays = computed(() => {
  const firstDay    = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const daysInPrev  = new Date(viewYear.value, viewMonth.value, 0).getDate()
  const days: any[] = []
  for (let i = firstDay - 1; i >= 0; i--)
    days.push({ day: daysInPrev - i, currentMonth: false, date: '', isToday: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ day: d, currentMonth: true, date: dateStr, isToday: dateStr === today })
  }
  while (days.length % 7 !== 0) days.push({ day: days.length - firstDay - daysInMonth + 1, currentMonth: false, date: '', isToday: false })
  return days
})

// ── Week nav ───────────────────────────────────────────────────
function startOfWeek(d: Date) {
  const date = new Date(d)
  date.setDate(d.getDate() - d.getDay())
  return new Date(date.toISOString().split('T')[0] + 'T00:00:00')
}
const weekStart = ref(startOfWeek(now))
const prevWeek  = () => { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d }
const nextWeek  = () => { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d }
const weekLabel = computed(() => {
  const end = new Date(weekStart.value); end.setDate(end.getDate() + 6)
  return `${weekStart.value.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
})
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value); d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    return { date: dateStr, dow: d.toLocaleDateString([], { weekday: 'short' }), dayNum: d.getDate(), isToday: dateStr === today }
  })
)

// ── Agenda groups ──────────────────────────────────────────────
const agendaGroups = computed(() => {
  const ms = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2,'0')}-01`
  const me = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2,'0')}-${new Date(viewYear.value, viewMonth.value + 1, 0).getDate()}`
  const evts = allEvents.value.filter((e: any) => e.date >= ms && e.date <= me)
  const byDate: Record<string, any[]> = {}
  for (const e of evts) { if (!byDate[e.date]) byDate[e.date] = []; byDate[e.date].push(e) }
  return Object.keys(byDate).sort().map(date => ({ date, events: byDate[date] }))
})

// ── Picker ─────────────────────────────────────────────────────
const pickerOpen = ref(false)
const pickerDate = ref(today)

const openPicker = (date: string) => {
  pickerDate.value = date || today
  pickerOpen.value = true
}

const pickType = (type: string) => {
  pickerOpen.value = false
  if (type === 'ticket') {
    ticketOpen.value = true
  } else {
    apptType.value = type as 'appointment' | 'housecall'
    editingEvent.value = null
    apptForm.value = { title: '', customerId: null, date: pickerDate.value, time: '', description: '', status: 'scheduled', address: '' }
    apptOpen.value = true
  }
}

// ── Appointment form ────────────────────────────────────────────
const apptOpen     = ref(false)
const apptType     = ref<'appointment' | 'housecall'>('appointment')
const editingEvent = ref<any>(null)
const apptForm     = ref({ title: '', customerId: null as any, date: today, time: '', description: '', status: 'scheduled', address: '' })

const openEdit = (event: any) => {
  if (event._kind === 'ticket') return
  editingEvent.value = event
  apptType.value = event._kind === 'housecall' ? 'housecall' : 'appointment'
  apptForm.value = { ...event }
  apptOpen.value = true
}

const saveAppt = async () => {
  if (!apptForm.value.title && !apptForm.value.description) return
  const data = { ...apptForm.value, type: apptType.value }
  if (editingEvent.value) {
    await appStore.updateAppointment(editingEvent.value.id, data)
  } else {
    await appStore.createAppointment(data)
  }
  apptOpen.value = false
  editingEvent.value = null
}

const deleteEvent = async (event: any) => {
  if (!confirm(`Delete "${eLabel(event)}"?`)) return
  if (event._kind === 'ticket') {
    await appStore.deleteTicket(event.id)
  } else {
    await appStore.deleteAppointment(event.id)
  }
}

// ── Ticket form ─────────────────────────────────────────────────
const ticketOpen = ref(false)

const handleCreateTicket = async (ticketData: any) => {
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) {
      const newCust = await appStore.createCustomer(ticketData.newCustomer)
      customerId = newCust.id
    }
    const ticket = await appStore.createTicket({
      ...ticketData, customerId,
      status: 'Open', price: 0,
      services: [], parts: [], payments: [], notes: [], timeLog: [],
    })
    addNotification('Ticket Created', `Ticket #${ticket.id} created successfully`, 'success')
    ticketOpen.value = false
  } catch (err: any) {
    addNotification('Error', err.message || 'Failed to create ticket', 'error')
  }
}

// ── Helpers ────────────────────────────────────────────────────
const formatPickerDate  = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : ''
const formatAgendaDate  = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : ''

const statusStyle = (s: string) => ({
  'scheduled':   'background:#3b82f620;color:#3b82f6',
  'Scheduled':   'background:#3b82f620;color:#3b82f6',
  'Open':        'background:#3b82f620;color:#3b82f6',
  'In Progress': 'background:#f59e0b20;color:#f59e0b',
  'completed':   'background:#10b98120;color:#10b981',
  'Completed':   'background:#10b98120;color:#10b981',
  'Delivered':   'background:#10b98120;color:#10b981',
  'cancelled':   'background:#ef444420;color:#ef4444',
}[s] || 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))')
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

.m3-row {
  transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1);
}
.m3-row:hover  { transform: scale(1.01) translateY(-1px); }
.m3-row:active { transform: scale(0.98); }

.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  color: hsl(var(--foreground)); outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px #6366f118; }

.m3-label {
  display: block; font-size: 10px; font-weight: 800;
  color: hsl(var(--muted-foreground)); text-transform: uppercase;
  letter-spacing: 0.12em; margin-bottom: 0.5rem;
}
</style>
