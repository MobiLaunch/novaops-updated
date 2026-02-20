<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #06b6d4, #0891b2)">
          <CalendarDays class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Calendar</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Schedule appointments and manage your time</p>
        </div>
      </div>
      <button class="m3-btn flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-black text-white" style="background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 20px #06b6d450" @click="newApptOpen = true">
        <Plus class="w-5 h-5" /> New Appointment
      </button>
    </div>

    <!-- Month header -->
    <div class="flex items-center gap-4">
      <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="prevMonth"><ChevronLeft class="w-5 h-5" /></button>
      <h2 class="text-xl font-black flex-1 text-center">{{ monthLabel }}</h2>
      <button class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="nextMonth"><ChevronRight class="w-5 h-5" /></button>
    </div>

    <!-- Calendar grid -->
    <div class="rounded-[32px] overflow-hidden bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="grid grid-cols-7 border-b border-border/60" style="background: #06b6d408">
        <div v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d" class="py-3 text-center text-xs font-black text-muted-foreground uppercase tracking-widest">{{ d }}</div>
      </div>
      <div class="grid grid-cols-7">
        <div v-for="day in calendarDays" :key="day.date"
          class="min-h-[80px] p-2 border-b border-r border-border/30 last:border-r-0 cursor-pointer transition-all hover:bg-muted/20"
          :class="{ 'opacity-40': !day.currentMonth, 'bg-cyan-50 dark:bg-cyan-950/20': day.isToday }"
          @click="selectedDay = day.date; newApptOpen = true">
          <div class="text-xs font-black mb-1" :style="day.isToday ? 'color: #06b6d4' : ''">{{ day.day }}</div>
          <div class="space-y-0.5">
            <div v-for="appt in getAppts(day.date)" :key="appt.id" class="text-[9px] font-bold px-1.5 py-0.5 rounded-[6px] truncate" style="background: #06b6d420; color: #06b6d4">{{ appt.title || appt.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming appointments -->
    <div v-if="upcomingAppts.length" class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <h3 class="text-sm font-black mb-4">Upcoming Appointments</h3>
      <div class="space-y-2">
        <div v-for="appt in upcomingAppts" :key="appt.id" class="flex items-center gap-3 px-4 py-3 rounded-[20px]" style="background: #06b6d410; outline: 1.5px solid #06b6d420; outline-offset: 0">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center flex-shrink-0" style="background: #06b6d420"><CalendarDays class="w-5 h-5" style="color: #06b6d4" /></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate">{{ appt.title || appt.description }}</p>
            <p class="text-xs text-muted-foreground font-medium">{{ appt.date }} at {{ appt.time }}</p>
          </div>
          <span class="text-xs font-black px-2.5 py-1 rounded-full" style="background: #06b6d420; color: #06b6d4">{{ appt.status }}</span>
        </div>
      </div>
    </div>

    <Dialog v-model:open="newApptOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <h2 class="text-base font-black">New Appointment</h2>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Title</label><input v-model="apptForm.title" placeholder="Screen Repair Consultation" class="m3-input" /></div>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</label>
            <select v-model="apptForm.customerId" class="m3-input"><option :value="null">Walk-in</option><option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Date</label><input v-model="apptForm.date" type="date" class="m3-input" /></div>
            <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Time</label><input v-model="apptForm.time" type="time" class="m3-input" /></div>
          </div>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Notes</label><textarea v-model="apptForm.description" placeholder="Appointment details…" rows="2" class="m3-input resize-none" style="height: auto; padding-top: 12px" /></div>
          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="newApptOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white" style="background: linear-gradient(135deg, #06b6d4, #0891b2)" @click="saveAppt">Schedule</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const appointments = computed(() => appStore.appointments ?? [])
const customers = computed(() => appStore.customers ?? [])

const now = new Date(); const viewYear = ref(now.getFullYear()); const viewMonth = ref(now.getMonth())
const newApptOpen = ref(false); const selectedDay = ref('')
const apptForm = ref({ title: '', customerId: null as any, date: '', time: '', description: '' })

const monthLabel = computed(() => new Date(viewYear.value, viewMonth.value).toLocaleDateString([], { month: 'long', year: 'numeric' }))
const prevMonth = () => { if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- } else viewMonth.value-- }
const nextMonth = () => { if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ } else viewMonth.value++ }

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const daysInPrev = new Date(viewYear.value, viewMonth.value, 0).getDate()
  const today = new Date().toISOString().split('T')[0]
  const days: any[] = []
  for (let i = firstDay - 1; i >= 0; i--) days.push({ day: daysInPrev - i, currentMonth: false, date: '', isToday: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ day: d, currentMonth: true, date: dateStr, isToday: dateStr === today })
  }
  while (days.length % 7 !== 0) days.push({ day: days.length - firstDay - daysInMonth + 1, currentMonth: false, date: '', isToday: false })
  return days
})

const getAppts = (date: string) => date ? appointments.value.filter((a: any) => a.date === date) : []
const upcomingAppts = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return appointments.value.filter((a: any) => a.date >= today && a.status === 'scheduled').sort((a: any, b: any) => a.date.localeCompare(b.date)).slice(0, 5)
})

const saveAppt = async () => {
  if (!apptForm.value.title && !apptForm.value.description) return
  const appt = { ...apptForm.value, id: Date.now(), status: 'scheduled', date: apptForm.value.date || selectedDay.value }
  if (!appStore.appointments) (appStore as any).appointments = []
  appStore.appointments.push(appt as any)
  await appStore.saveAll(); newApptOpen.value = false
  apptForm.value = { title: '', customerId: null, date: '', time: '', description: '' }
}
</script>
<style scoped>
.m3-btn { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.m3-btn:hover { transform: scale(1.05) translateY(-2px); } .m3-btn:active { transform: scale(0.92); }
.m3-input { width: 100%; height: 48px; padding: 0 16px; border-radius: 20px; font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); outline: none; transition: all 0.2s ease; }
.m3-input:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px #06b6d418; }
</style>