<template>
  <v-container fluid class="pa-4 pa-sm-6">
    <!-- ── Page Header ─────────────────────────────────────────── -->
    <v-row align="center" justify="space-between" class="mb-6">
      <v-col cols="12" md="6" class="d-flex align-center gap-4">
        <v-sheet
          rounded="xl"
          elevation="4"
          class="d-flex align-center justify-center"
          height="56"
          width="56"
          style="background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #8b5cf6 100%);"
        >
          <v-icon icon="mdi-calendar" size="28" color="white" />
        </v-sheet>
        <div>
          <h1 class="text-h4 font-weight-black tracking-tight mb-1">Calendar</h1>
          <p class="text-caption text-medium-emphasis font-weight-medium">Appointments, house calls & repairs</p>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="d-flex justify-md-end justify-start gap-4">
        <v-btn
          variant="tonal"
          rounded="xl"
          color="secondary"
          class="text-none font-weight-bold"
          @click="goToday"
        >
          Today
        </v-btn>

        <v-btn-toggle
          v-model="calView"
          color="primary"
          variant="tonal"
          rounded="xl"
          mandatory
        >
          <v-btn v-for="v in views" :key="v.key" :value="v.key" class="text-none font-weight-bold">
            {{ v.label }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <!-- ── Legend ─────────────────────────────────────────────── -->
    <div class="d-flex flex-wrap align-center gap-4 mb-4">
      <span class="text-overline text-medium-emphasis font-weight-black">Key:</span>
      <v-chip
        v-for="t in eventTypes"
        :key="t.key"
        size="small"
        :color="t.color"
        variant="tonal"
        class="font-weight-bold"
      >
        <v-icon :icon="t.icon" start size="16"></v-icon>
        {{ t.label }}
      </v-chip>
    </div>

    <!-- ── View Controls ──────────────────────────────────────── -->
    <v-card variant="outlined" rounded="xl" class="bg-surface mb-6">
      <v-toolbar color="transparent" density="comfortable">
        <v-btn icon="mdi-chevron-left" variant="text" @click="prev" />
        <v-spacer />
        <h2 class="text-h6 font-weight-black text-center w-100 position-absolute" style="left: 0; pointer-events: none;">
          {{ currentLabel }}
        </h2>
        <v-spacer />
        <v-btn icon="mdi-chevron-right" variant="text" @click="next" />
      </v-toolbar>

      <v-divider />

      <!-- ══ MONTH & WEEK GRID ══════════════════════════════════════════ -->
      <template v-if="calView === 'month' || calView === 'week'">
        <!-- Day Headers -->
        <div class="v-calendar-grid bg-surface-variant">
          <div
            v-for="(day, i) in (calView === 'month' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : weekDays)"
            :key="i"
            class="text-center py-3 border-b border-e border-dashed"
          >
            <span class="text-caption font-weight-black text-uppercase text-medium-emphasis tracking-widest">
              {{ calView === 'month' ? day : day.dow }}
            </span>
            <div
              v-if="calView === 'week'"
              class="d-flex justify-center mt-1"
            >
              <v-avatar
                :color="day.isToday ? 'primary' : 'transparent'"
                size="32"
                :class="{'text-white': day.isToday}"
              >
                <span class="text-body-2 font-weight-black">{{ day.dayNum }}</span>
              </v-avatar>
            </div>
          </div>
        </div>

        <!-- Grid Cells -->
        <div class="v-calendar-grid bg-surface">
          <div
            v-for="(day, idx) in currentDays"
            :key="idx"
            class="cal-cell border-b border-e border-dashed pa-2 d-flex flex-column"
            :class="{ 'opacity-50': !day.currentMonth && calView === 'month', 'bg-primary-lighten-5': day.isToday }"
          >
            <!-- Date Number -->
            <div class="d-flex justify-center mb-2" v-if="calView === 'month'">
              <v-avatar
                :color="day.isToday ? 'primary' : 'transparent'"
                size="28"
                :class="{'text-white': day.isToday}"
              >
                <span class="text-caption font-weight-bold">{{ day.day }}</span>
              </v-avatar>
            </div>

            <!-- Events -->
            <div class="d-flex flex-column gap-1 flex-1-1-100 overflow-y-auto w-100">
              <v-sheet
                v-for="event in getDayEvents(day.date).slice(0, calView === 'month' ? 3 : undefined)"
                :key="event._id"
                rounded="lg"
                class="px-2 py-1 cb-event text-truncate cursor-pointer"
                :style="`background: ${eColor(event)}22; color: ${eColor(event)}; border-left: 3px solid ${eColor(event)}`"
              >
                <div class="d-flex align-center gap-1">
                  <v-icon :icon="eIcon(event)" size="12" class="flex-shrink-0" />
                  <span class="text-caption font-weight-bold text-truncate" style="font-size: 10px !important; line-height: 1.2;">
                    {{ eLabel(event) }}
                  </span>
                </div>
                <div v-if="calView === 'week' && event.time" class="text-caption opacity-70 mt-1" style="font-size: 10px !important;">
                  {{ event.time }}
                </div>
              </v-sheet>

              <v-sheet
                v-if="calView === 'month' && getDayEvents(day.date).length > 3"
                rounded="lg"
                class="px-2 py-1 bg-surface-variant text-medium-emphasis text-center cursor-pointer"
              >
                <span class="text-caption font-weight-bold" style="font-size: 9px !important;">
                  +{{ getDayEvents(day.date).length - 3 }} more
                </span>
              </v-sheet>
            </div>
          </div>
        </div>
      </template>

      <!-- ══ AGENDA VIEW ═════════════════════════════════════════════ -->
      <template v-else>
        <div v-if="agendaGroups.length" class="pa-4 pa-sm-8 d-flex flex-column gap-6">
          <div v-for="group in agendaGroups" :key="group.date">
            <div class="d-flex align-center gap-4 mb-4">
              <v-avatar
                :color="group.date === today ? 'primary' : 'surface-variant'"
                size="40"
              >
                <span class="text-body-1 font-weight-black" :class="{ 'text-primary': group.date !== today }">
                  {{ new Date(group.date + 'T00:00:00').getDate() }}
                </span>
              </v-avatar>
              <span class="text-subtitle-2 font-weight-black text-uppercase tracking-widest text-medium-emphasis">
                {{ formatAgendaDate(group.date) }}
              </span>
              <v-divider class="flex-1-1-100" />
            </div>

            <div class="pl-md-14 pl-2 d-flex flex-column gap-3">
              <v-card
                v-for="event in group.events"
                :key="event._id"
                variant="outlined"
                rounded="xl"
                class="agenda-card cursor-pointer"
                :style="`border-color: ${eColor(event)}40; background: ${eColor(event)}08`"
              >
                <v-card-text class="d-flex align-center gap-4 pa-4">
                  <v-avatar :color="`${eColor(event)}22`" size="48" rounded="lg">
                    <v-icon :icon="eIcon(event)" size="24" :color="eColor(event)" />
                  </v-avatar>

                  <div class="flex-1-1-100 min-w-0">
                    <div class="text-body-1 font-weight-bold text-truncate">{{ eLabel(event) }}</div>
                    <div class="text-caption font-weight-medium text-medium-emphasis d-flex align-center gap-2 mt-1">
                      <v-icon icon="mdi-clock-outline" size="14" />
                      {{ event.time || 'All day' }}
                      <template v-if="event.address">
                        <span class="px-1 text-disabled">•</span>
                        <v-icon icon="mdi-map-marker-outline" size="14" :color="eColor(event)" />
                        <span :style="`color: ${eColor(event)}`">{{ event.address }}</span>
                      </template>
                    </div>
                  </div>

                  <v-chip
                    size="small"
                    class="font-weight-black text-capitalize"
                    variant="tonal"
                    :color="statusColor(event.status)"
                  >
                    {{ event.status || 'open' }}
                  </v-chip>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </div>

        <div v-else class="d-flex flex-column align-center justify-center py-16">
          <v-avatar color="primary" variant="tonal" size="80" class="mb-4">
            <v-icon icon="mdi-calendar-blank" size="40" />
          </v-avatar>
          <div class="text-body-1 font-weight-bold text-medium-emphasis">No events found for {{ currentLabel }}</div>
        </div>
      </template>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { appointments, tickets } = storeToRefs(appStore)

// ── Event type config ──────────────────────────────────────────
const eventTypes = [
  { key: 'appointment', label: 'Appointment',   color: '#06b6d4', icon: 'mdi-calendar' },
  { key: 'housecall',   label: 'House Call',    color: '#10b981', icon: 'mdi-map-marker-outline' },
  { key: 'ticket',      label: 'Repair Ticket', color: '#f59e0b', icon: 'mdi-ticket-confirmation-outline' },
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
  if (e._kind === 'housecall') return 'mdi-map-marker-outline'
  if (e._kind === 'ticket')    return 'mdi-ticket-confirmation-outline'
  return 'mdi-calendar'
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

// ── Week nav ───────────────────────────────────────────────────
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

const statusColor = (s: string) => {
  const st = (s || '').toLowerCase()
  if (['scheduled', 'open'].includes(st)) return 'info'
  if (['in progress'].includes(st)) return 'warning'
  if (['completed', 'delivered'].includes(st)) return 'success'
  if (['cancelled'].includes(st)) return 'error'
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
.bg-primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}
</style>
