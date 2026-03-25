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
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Appointments, house calls &amp; repairs</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button class="h-11 px-4 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
          style="background: hsl(var(--muted)/0.6)"
          @click="goToday">Today</button>

        <div class="flex gap-0.5 rounded-full p-1" style="background: hsl(var(--muted)/0.5)">
          <button v-for="v in views" :key="v.key"
            class="px-4 py-2 rounded-full text-xs font-black transition-all"
            :style="calView === v.key
              ? 'background: hsl(var(--card)); color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.12)'
              : 'color: hsl(var(--muted-foreground))'"
            @click="calView = v.key">{{ v.label }}</button>
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
            class="min-h-[90px] p-2 border-b border-r border-border/20 last:border-r-0"
            :class="{ 'opacity-40': !day.currentMonth }"
            :style="day.isToday ? 'background: #6366f10d' : ''">
            <div class="w-7 h-7 flex items-center justify-center rounded-full mb-1 text-xs font-black"
              :style="day.isToday ? 'background: #6366f1; color: white' : ''">
              {{ day.day }}
            </div>
            <div class="space-y-0.5">
              <div v-for="event in getDayEvents(day.date).slice(0, 3)" :key="event._id"
                class="text-[9px] font-bold px-1.5 py-0.5 rounded-[6px] truncate flex items-center gap-0.5"
                :style="`background: ${eColor(event)}22; color: ${eColor(event)}`">
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
            class="p-2 border-r border-border/20 last:border-r-0 space-y-1"
            :style="day.isToday ? 'background: #6366f108' : ''">
            <div v-for="event in getDayEvents(day.date)" :key="event._id"
              class="text-[10px] font-bold px-2 py-1.5 rounded-[10px]"
              :style="`background: ${eColor(event)}18; color: ${eColor(event)}; outline: 1.5px solid ${eColor(event)}30; outline-offset: 0`">
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
          <div class="space-y-2 pl-12">
            <div v-for="event in group.events" :key="event._id"
              class="m3-row flex items-center gap-3 px-4 py-3 rounded-[20px]"
              :style="`background: ${eColor(event)}10; outline: 1.5px solid ${eColor(event)}25; outline-offset: 0`">
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
              <span class="text-[10px] font-black px-2.5 py-1 rounded-full capitalize flex-shrink-0"
                :style="statusStyle(event.status)">{{ event.status || 'open' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center gap-3 py-20">
        <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background:#6366f114">
          <CalendarDays class="w-8 h-8" style="color:#6366f1;opacity:0.4" />
        </div>
        <p class="text-sm font-bold text-muted-foreground">No events this month</p>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarDays, MapPin, ChevronLeft, ChevronRight, TicketCheck } from 'lucide-vue-next'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { appointments, tickets } = storeToRefs(appStore)

// ── Event type config ──────────────────────────────────────────
const eventTypes = [
  { key: 'appointment', label: 'Appointment',   color: '#06b6d4', icon: CalendarDays },
  { key: 'housecall',   label: 'House Call',    color: '#10b981', icon: MapPin       },
  { key: 'ticket',      label: 'Repair Ticket', color: '#f59e0b', icon: TicketCheck  },
]

// ── Unified events ─────────────────────────────────────────────
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
function eLabel(e: any) { return e.title || e.description || 'Untitled' }

const getDayEvents = (date: string) =>
  date ? allEvents.value.filter((e: any) => e.date === date) : []

// ── Calendar nav ───────────────────────────────────────────────
const today     = new Date().toISOString().split('T')[0]
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
const goToday   = () => { viewYear.value = now.getFullYear(); viewMonth.value = now.getMonth(); weekStart.value = startOfWeek(now) }

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
  while (days.length % 7 !== 0)
    days.push({ day: days.length - firstDay - daysInMonth + 1, currentMonth: false, date: '', isToday: false })
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

// ── Helpers ────────────────────────────────────────────────────
const formatAgendaDate = (d: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : ''

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
.m3-row {
  transition: transform 0.35s cubic-bezier(0.34,1.4,0.64,1);
}
.m3-row:hover  { transform: scale(1.01) translateY(-1px); }
.m3-row:active { transform: scale(0.98); }
</style>
