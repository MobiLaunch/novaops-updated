<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div class="flex items-center gap-3">
        <Button variant="outline" size="icon" @click="previousMonth">
          <ChevronLeft class="w-4 h-4" />
        </Button>
        <h2 class="text-xl font-semibold min-w-[200px] text-center">
          {{ currentMonthYear }}
        </h2>
        <Button variant="outline" size="icon" @click="nextMonth">
          <ChevronRight class="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" @click="goToToday">
          Today
        </Button>
      </div>
      <Button size="lg" @click="newAppointmentOpen = true">
        <Plus class="w-4 h-4 mr-2" />
        New Appointment
      </Button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CalendarDays class="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Scheduled</p>
              <p class="text-2xl font-bold">{{ scheduledCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle class="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Completed</p>
              <p class="text-2xl font-bold">{{ completedCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock class="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Today</p>
              <p class="text-2xl font-bold">{{ todayCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Upcoming Appointments -->
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div
            v-for="appointment in upcomingAppointments"
            :key="appointment.id"
            class="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
            @click="editAppointment(appointment)"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays class="w-6 h-6 text-primary" />
              </div>
              <div>
                <p class="font-medium">{{ getCustomerName(appointment.customerId) }}</p>
                <p class="text-sm text-muted-foreground">{{ appointment.description }}</p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ formatDateTime(appointment.date, appointment.time) }}
                </p>
              </div>
            </div>
            <Badge :class="getStatusBadgeClass(appointment.status)">
              {{ appointment.status }}
            </Badge>
          </div>

          <div v-if="upcomingAppointments.length === 0" class="text-center py-12">
            <CalendarDays class="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p class="text-muted-foreground">No upcoming appointments</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- New Appointment Dialog -->
    <Dialog v-model:open="newAppointmentOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingAppointment ? 'Edit' : 'New' }} Appointment</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="apt-customer">Customer *</Label>
            <Select v-model="appointmentForm.customerId">
              <SelectTrigger id="apt-customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="customer in customers"
                  :key="customer.id"
                  :value="customer.id"
                >
                  {{ customer.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="apt-desc">Description *</Label>
            <Textarea
              id="apt-desc"
              v-model="appointmentForm.description"
              placeholder="e.g., Screen repair pickup"
              :rows="2"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="apt-date">Date *</Label>
              <Input
                id="apt-date"
                v-model="appointmentForm.date"
                type="date"
              />
            </div>

            <div class="space-y-2">
              <Label for="apt-time">Time *</Label>
              <Input
                id="apt-time"
                v-model="appointmentForm.time"
                type="time"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="apt-status">Status</Label>
            <Select v-model="appointmentForm.status">
              <SelectTrigger id="apt-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex gap-3 pt-4">
            <Button
              v-if="editingAppointment"
              variant="destructive"
              class="flex-1"
              @click="deleteAppointment"
            >
              Delete
            </Button>
            <Button variant="outline" class="flex-1" @click="cancelEdit">
              Cancel
            </Button>
            <Button class="flex-1" @click="saveAppointment">
              {{ editingAppointment ? 'Update' : 'Create' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

import type { Appointment } from '~/types'
import { 
  CalendarDays as CalendarDays, 
  CheckCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus 
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'

definePageMeta({
  middleware: ['auth']
})

const appStore = useAppStore()
const { appointments, customers, isLoaded } = storeToRefs(appStore)
const { saveAll } = appStore

const currentDate = ref(new Date())
const newAppointmentOpen = ref(false)
const editingAppointment = ref<Appointment | null>(null)

const appointmentForm = ref({
  customerId: null as number | null,
  description: '',
  date: '',
  time: '',
  status: 'scheduled'
})

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const upcomingAppointments = computed(() => {
  const now = new Date()
  return appointments.value
    .filter(apt => {
      const aptDate = new Date(`${apt.date}T${apt.time}`)
      return aptDate >= now && apt.status !== 'cancelled'
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 10)
})

const scheduledCount = computed(() => {
  return (appointments.value || []).filter(a => a.status === 'scheduled').length
})

const completedCount = computed(() => {
  return (appointments.value || []).filter(a => a.status === 'completed').length
})

const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return (appointments.value || []).filter(a => a.date === today).length
})

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const goToToday = () => {
  currentDate.value = new Date()
}

const getCustomerName = (customerId: number) => {
  const customer = (customers.value || []).find(c => c.id === customerId)
  return customer?.name || 'Unknown'
}

const formatDateTime = (date: string, time: string) => {
  return `${new Date(date).toLocaleDateString()} at ${time}`
}

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    'scheduled': 'bg-blue-500/10 text-blue-500',
    'confirmed': 'bg-emerald-500/10 text-emerald-500',
    'completed': 'bg-gray-500/10 text-gray-500',
    'cancelled': 'bg-red-500/10 text-red-500'
  }
  return classes[status] || 'bg-gray-500/10 text-gray-500'
}

const saveAppointment = () => {
  if (!appointmentForm.value.customerId || !appointmentForm.value.description || 
      !appointmentForm.value.date || !appointmentForm.value.time) {
    alert('Please fill in all required fields')
    return
  }

  if (editingAppointment.value) {
    const index = (appointments.value || []).findIndex(a => a.id === editingAppointment.value!.id)
    if (index > -1) {
      appointments.value[index] = {
        ...editingAppointment.value,
        ...appointmentForm.value
      }
    }
  } else {
    const newApt: Appointment = {
      id: Date.now().toString(),
      ...appointmentForm.value,
      customerId: appointmentForm.value.customerId!,
      notes: ''
    }
    appointments.value.push(newApt)
  }

  saveAll()
  cancelEdit()
}

const editAppointment = (appointment: Appointment) => {
  editingAppointment.value = appointment
  appointmentForm.value = { ...appointment }
  newAppointmentOpen.value = true
}

const deleteAppointment = () => {
  if (!editingAppointment.value) return
  
  if (confirm('Delete this appointment?')) {
    const index = (appointments.value || []).findIndex(a => a.id === editingAppointment.value!.id)
    if (index > -1) {
      appointments.value.splice(index, 1)
      saveAll()
      cancelEdit()
    }
  }
}

const cancelEdit = () => {
  newAppointmentOpen.value = false
  editingAppointment.value = null
  appointmentForm.value = {
    customerId: null,
    description: '',
    date: '',
    time: '',
    status: 'scheduled'
  }
}
</script>
