<template>
  <div class="p-4 sm:p-6 flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
          style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);"
        >
          <i class="mdi mdi-calendar text-2xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-black m-0">Calendar</h1>
          <p class="text-xs text-muted-foreground m-0">Appointments, house calls & repairs</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button label="Today" variant="outlined" class="text-none font-bold rounded-xl" @click="goToday" />
        <SelectButton
          v-model="calView"
          :options="views"
          option-label="label"
          option-value="key"
          :allow-empty="false"
          class="rounded-xl"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <span class="text-[10px] font-black text-muted-foreground uppercase">Key:</span>
      <Tag
        v-for="t in eventTypes"
        :key="t.key"
        :value="t.label"
        class="font-bold"
        :style="{ backgroundColor: t.color + '22', color: t.color }"
      >
        <i class="mdi mr-1" :class="t.icon"></i>
      </Tag>
    </div>

    <div class="bg-surface border border-border rounded-xl overflow-hidden mb-6">
      <div class="flex items-center px-2 py-2 relative">
        <Button variant="text" rounded class="!w-9 !h-9" @click="prev"><i class="mdi mdi-chevron-left"></i></Button>
        <h2 class="text-base font-black text-center flex-1 m-0 pointer-events-none">{{ currentLabel }}</h2>
        <Button variant="text" rounded class="!w-9 !h-9" @click="next"><i class="mdi mdi-chevron-right"></i></Button>
      </div>

      <hr class="border-border m-0" />

      <template v-if="calView === 'month' || calView === 'week'">
        <div class="v-calendar-grid bg-muted/30">
          <div
            v-for="(day, i) in (calView === 'month' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : weekDays)"
            :key="i"
            class="text-center py-3 border-b border-r border-dashed border-border"
          >
            <span class="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              {{ calView === 'month' ? day : day.dow }}
            </span>
            <div v-if="calView === 'week'" class="flex justify-center mt-1">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                :class="day.isToday ? 'bg-primary text-white' : ''"
              >
                {{ day.dayNum }}
              </div>
            </div>
          </div>
        </div>

        <div class="v-calendar-grid bg-surface">
          <div
            v-for="(day, idx) in currentDays"
            :key="idx"
            class="cal-cell border-b border-r border-dashed border-border p-2 flex flex-col"
            :class="{ 'opacity-50': !day.currentMonth && calView === 'month', 'cal-cell--today': day.isToday }"
          >
            <div v-if="calView === 'month'" class="flex justify-center mb-2">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                :class="day.isToday ? 'bg-primary text-white' : ''"
              >
                {{ day.day }}
              </div>
            </div>

            <div class="flex flex-col gap-1 flex-1 overflow-y-auto w-full min-h-0">
              <div
                v-for="event in getDayEvents(day.date).slice(0, calView === 'month' ? 3 : undefined)"
                :key="event._id"
                class="px-2 py-1 rounded-lg cb-event truncate cursor-pointer"
                :style="`background: ${eColor(event)}22; color: ${eColor(event)}; border-left: 3px solid ${eColor(event)}`"
              >
                <div class="flex items-center gap-1">
                  <i class="mdi text-sm shrink-0" :class="eIcon(event)"></i>
                  <span class="text-[10px] font-bold truncate leading-tight">{{ eLabel(event) }}</span>
                </div>
                <div v-if="calView === 'week' && event.time" class="text-[10px] opacity-70 mt-0.5">{{ event.time }}</div>
              </div>

              <div
                v-if="calView === 'month' && getDayEvents(day.date).length > 3"
                class="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-center cursor-pointer"
              >
                <span class="text-[9px] font-bold">+{{ getDayEvents(day.date).length - 3 }} more</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div v-if="agendaGroups.length" class="p-4 sm:p-8 flex flex-col gap-6">
          <div v-for="group in agendaGroups" :key="group.date">
            <div class="flex items-center gap-4 mb-4">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-black"
                :class="group.date === today ? 'bg-primary text-white' : 'bg-muted'"
              >
                {{ new Date(group.date + 'T00:00:00').getDate() }}
              </div>
              <span class="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {{ formatAgendaDate(group.date) }}
              </span>
              <hr class="flex-1 border-border" />
            </div>

            <div class="md:pl-14 pl-2 flex flex-col gap-3">
              <div
                v-for="event in group.events"
                :key="event._id"
                class="agenda-card border rounded-xl p-4 flex items-center gap-4 cursor-pointer"
                :style="`border-color: ${eColor(event)}40; background: ${eColor(event)}08`"
              >
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                  :style="{ backgroundColor: eColor(event) + '22', color: eColor(event) }"
                >
                  <i class="mdi text-xl" :class="eIcon(event)"></i>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="text-sm font-bold truncate">{{ eLabel(event) }}</div>
                  <div class="text-xs text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                    <i class="mdi mdi-clock-outline"></i>
                    {{ event.time || 'All day' }}
                    <template v-if="event.address">
                      <span class="text-muted-foreground">•</span>
                      <i class="mdi mdi-map-marker-outline"></i>
                      <span :style="`color: ${eColor(event)}`">{{ event.address }}</span>
                    </template>
                  </div>
                </div>

                <Tag
                  :value="event.status || 'open'"
                  :severity="statusSeverity(event.status)"
                  class="font-bold capitalize shrink-0"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-16">
          <div class="w-20 h-20 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-4">
            <i class="mdi mdi-calendar-blank text-4xl"></i>
          </div>
          <div class="text-sm font-bold text-muted-foreground">No events found for {{ currentLabel }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { appointments, tickets } = storeToRefs(appStore)

const eventTypes = [
  { key: 'appointment', label: 'Appointment',   color: '#06b6d4', icon: 'mdi-calendar' },
  { key: 'housecall',   label: 'House Call',    color: '#10b981', icon: 'mdi-map-marker-outline' },
  { key: 'ticket',      label: 'Repair Ticket', color: '#f59e0b', icon: 'mdi-ticket-confirmation-outline' },
]

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
  if (e._kind === 'housecall') return 'mdi-map-marker-outline'
  if (e._kind === 'ticket')    return 'mdi-ticket-confirmation-outline'
  return 'mdi-calendar'
}
function eLabel(e: any) { return e.title || e.description || 'Untitled' }

const getDayEvents = (date: string) =>
  date ? allEvents.value.filter((e: any) => e.date === date) : []

const today     = new Date().toISOString().split('T')[0]
const now       = new Date()
const viewYear  = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
const calView   = ref<'month' | 'week' | 'agenda'>('month')
const views     = [{ key: 'month', label: 'Month' }, { key: 'week', label: 'Week' }, { key: 'agenda', label: 'Agenda' }]

const mode = computed(() => calView.value)

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value).toLocaleDateString([], { month: 'long', year: 'numeric' })
)

const goToday = () => {
  viewYear.value = now.getFullYear(); viewMonth.value = now.getMonth(); weekStart.value = startOfWeek(now)
}

const prev = () => {
  if (mode.value === 'week') { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d; return; }
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- } else viewMonth.value--
}
const next = () => {
  if (mode.value === 'week') { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d; return; }
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ } else viewMonth.value++
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
  while (days.length % 7 !== 0)
    days.push({ day: days.length - firstDay - daysInMonth + 1, currentMonth: false, date: '', isToday: false })
  return days
})

function startOfWeek(d: Date) {
  const date = new Date(d)
  date.setDate(d.getDate() - d.getDay())
  return new Date(date.toISOString().split('T')[0] + 'T00:00:00')
}
const weekStart = ref(startOfWeek(now))
const weekLabel = computed(() => {
  const end = new Date(weekStart.value); end.setDate(end.getDate() + 6)
  return `${weekStart.value.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
})
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value); d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    return { date: dateStr, dow: d.toLocaleDateString([], { weekday: 'short' }), dayNum: d.getDate(), isToday: dateStr === today, currentMonth: true }
  })
)

const currentLabel = computed(() => mode.value === 'week' ? weekLabel.value : monthLabel.value)
const currentDays = computed(() => mode.value === 'week' ? weekDays.value : calendarDays.value)

const agendaGroups = computed(() => {
  const ms = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2,'0')}-01`
  const me = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2,'0')}-${new Date(viewYear.value, viewMonth.value + 1, 0).getDate()}`
  const evts = allEvents.value.filter((e: any) => e.date >= ms && e.date <= me)
  const byDate: Record<string, any[]> = {}
  for (const e of evts) { if (!byDate[e.date]) byDate[e.date] = []; byDate[e.date].push(e) }
  return Object.keys(byDate).sort().map(date => ({ date, events: byDate[date] }))
})

const formatAgendaDate = (d: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : ''

const statusSeverity = (s: string) => {
  const st = (s || '').toLowerCase()
  if (['scheduled', 'open'].includes(st)) return 'info'
  if (['in progress'].includes(st)) return 'warn'
  if (['completed', 'delivered'].includes(st)) return 'success'
  if (['cancelled'].includes(st)) return 'danger'
  return 'secondary'
}
</script>

<style scoped>
.v-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.cal-cell {
  min-height: 120px;
  max-height: 180px;
  transition: background-color 0.2s;
}
.cal-cell--today {
  background-color: rgba(99, 102, 241, 0.06);
}
.cb-event {
  transition: transform 0.2s, background-color 0.2s;
}
.cb-event:hover {
  transform: translateY(-1px);
  filter: brightness(0.95);
}
.agenda-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.agenda-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
</style>
