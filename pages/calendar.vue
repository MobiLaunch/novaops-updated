<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" @click="previousMonth">
          <ChevronLeft class="w-4 h-4" />
        </Button>
        <h2 class="text-xl font-semibold min-w-[200px] text-center" style="font-family: 'Plus Jakarta Sans', sans-serif;">
          {{ currentMonthYear }}
        </h2>
        <Button variant="outline" size="icon" @click="nextMonth">
          <ChevronRight class="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" @click="goToToday">Today</Button>
      </div>

      <div class="flex items-center gap-2">
        <!-- Legend -->
        <div class="hidden sm:flex items-center gap-3 mr-2 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Appointment</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> House Call</span>
        </div>
        <Button size="sm" @click="openNewAppointment">
          <Plus class="w-4 h-4 mr-1.5" /> Appointment
        </Button>
        <Button size="sm" variant="outline" @click="openNewHouseCall">
          <MapPin class="w-4 h-4 mr-1.5" /> House Call
        </Button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-3">
      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <CalendarDays class="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">This Month</p>
            <p class="text-xl font-bold">{{ thisMonthCount }}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Clock class="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Today</p>
            <p class="text-xl font-bold">{{ todayCount }}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle class="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Upcoming</p>
            <p class="text-xl font-bold">{{ upcomingCount }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Calendar Grid -->
    <Card>
      <CardContent class="p-0">
        <!-- Day headers -->
        <div class="grid grid-cols-7 border-b">
          <div
            v-for="day in dayHeaders"
            :key="day"
            class="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar cells -->
        <div class="grid grid-cols-7">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="min-h-[110px] border-b border-r last:border-r-0 p-1.5 relative"
            :class="[
              !cell.currentMonth && 'bg-muted/20',
              cell.isToday && 'bg-primary/5',
              i % 7 === 6 && 'border-r-0',
              Math.floor(i / 7) === Math.floor((calendarCells.length - 1) / 7) && 'border-b-0'
            ]"
            @click="handleDayClick(cell)"
          >
            <!-- Date number -->
            <div class="flex items-center justify-between mb-1">
              <span
                class="text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full"
                :class="[
                  !cell.currentMonth && 'text-muted-foreground/40',
                  cell.isToday && 'bg-primary text-primary-foreground font-bold',
                  !cell.isToday && cell.currentMonth && 'text-foreground'
                ]"
              >
                {{ cell.date.getDate() }}
              </span>
            </div>

            <!-- Events -->
            <div class="space-y-0.5">
              <div
                v-for="event in cell.events.slice(0, 3)"
                :key="event.id"
                class="text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                :class="event.type === 'appointment'
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'"
                :title="`${event.time} — ${event.title}`"
                @click.stop="openEvent(event)"
              >
                {{ event.time }} {{ event.title }}
              </div>
              <div
                v-if="cell.events.length > 3"
                class="text-[10px] text-muted-foreground px-1.5 cursor-pointer hover:text-foreground"
                @click.stop="showDayEvents(cell)"
              >
                +{{ cell.events.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Day detail panel (shown when a day with events is clicked) -->
    <Card v-if="selectedDayEvents.length > 0">
      <CardHeader class="pb-2">
        <CardTitle class="text-base flex items-center justify-between">
          <span>{{ selectedDayLabel }}</span>
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="selectedDay = null">
            <X class="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        <div
          v-for="event in selectedDayEvents"
          :key="event.id"
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border"
          :class="event.type === 'appointment' ? 'border-indigo-500/20' : 'border-emerald-500/20'"
          @click="openEvent(event)"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="event.type === 'appointment' ? 'bg-indigo-500/10' : 'bg-emerald-500/10'"
          >
            <CalendarDays v-if="event.type === 'appointment'" class="w-4 h-4 text-indigo-500" />
            <MapPin v-else class="w-4 h-4 text-emerald-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ event.title }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ event.subtitle }}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-xs font-medium">{{ event.time }}</p>
            <Badge class="text-[10px] mt-0.5" :class="getStatusClass(event.status)">{{ event.status }}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Appointment Dialog -->
    <Dialog v-model:open="appointmentDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingAppointment ? 'Edit Appointment' : 'New Appointment' }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Customer *</Label>
            <Select v-model="appointmentForm.customerId">
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Description *</Label>
            <Textarea v-model="appointmentForm.description" placeholder="e.g. Screen repair pickup" :rows="2" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Date *</Label>
              <Input v-model="appointmentForm.date" type="date" />
            </div>
            <div class="space-y-2">
              <Label>Time *</Label>
              <Input v-model="appointmentForm.time" type="time" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="appointmentForm.status">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex gap-3 pt-2">
            <Button v-if="editingAppointment" variant="destructive" class="flex-1" @click="deleteAppointment">Delete</Button>
            <Button variant="outline" class="flex-1" @click="appointmentDialogOpen = false">Cancel</Button>
            <Button class="flex-1" @click="saveAppointment">{{ editingAppointment ? 'Update' : 'Create' }}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- House Call Dialog -->
    <Dialog v-model:open="houseCallDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingHouseCall ? 'Edit House Call' : 'New House Call' }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>Customer *</Label>
            <Select v-model="houseCallForm.customerId">
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Description *</Label>
            <Textarea v-model="houseCallForm.description" placeholder="e.g. On-site repair" :rows="2" />
          </div>
          <div class="space-y-2">
            <Label>Address *</Label>
            <Input v-model="houseCallForm.address" placeholder="123 Main St" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Date *</Label>
              <Input v-model="houseCallForm.date" type="date" />
            </div>
            <div class="space-y-2">
              <Label>Time *</Label>
              <Input v-model="houseCallForm.time" type="time" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="houseCallForm.status">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex gap-3 pt-2">
            <Button v-if="editingHouseCall" variant="destructive" class="flex-1" @click="deleteHouseCall">Delete</Button>
            <Button variant="outline" class="flex-1" @click="houseCallDialogOpen = false">Cancel</Button>
            <Button class="flex-1" @click="saveHouseCall">{{ editingHouseCall ? 'Update' : 'Schedule' }}</Button>
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
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { appointments, customers, houseCalls } = storeToRefs(appStore)
const { createAppointment, updateAppointment, deleteAppointment, createHouseCall, updateHouseCall, deleteHouseCall } = appStore

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
  const today = new Date().toISOString().split('T')[0]
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

  // Pad start
  for (let i = 0; i < firstDay.getDay(); i++) {
    const d = new Date(year, month, -firstDay.getDay() + i + 1)
    cells.push({ date: d, currentMonth: false, isToday: false, events: [] })
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const dateStr = date.toISOString().split('T')[0]
    date.setHours(0, 0, 0, 0)

    const events = allEvents.value
      .filter(e => {
        const eDate = e.raw.date
        return eDate === dateStr
      })
      .sort((a, b) => a.time.localeCompare(b.time))

    cells.push({
      date,
      currentMonth: true,
      isToday: date.getTime() === today.getTime(),
      events,
    })
  }

  // Pad end to complete the grid
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
      await updateAppointment(editingAppointment.value.id, { ...appointmentForm.value })
    } else {
      await createAppointment({ ...appointmentForm.value, notes: '' })
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
    await deleteAppointment(editingAppointment.value.id)
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
      await updateHouseCall(editingHouseCall.value.id, { ...houseCallForm.value })
    } else {
      await createHouseCall({ ...houseCallForm.value })
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
    await deleteHouseCall(editingHouseCall.value.id)
  } catch (err: any) {
    alert('Failed to delete: ' + (err.message || err))
  }
  houseCallDialogOpen.value = false
  editingHouseCall.value = null
}
</script>
