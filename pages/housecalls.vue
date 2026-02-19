<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">House Calls</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Manage on-site repair appointments
        </p>
      </div>
      <Button size="lg" @click="newHouseCallOpen = true" class="shadow-sm rounded-xl">
        <Plus class="w-4 h-4 mr-2" />
        Schedule House Call
      </Button>
    </div>

    <div class="flex items-center gap-4">
      <Select v-model="filterStatus">
        <SelectTrigger class="w-[180px] rounded-xl bg-card border-border">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent class="rounded-xl">
          <SelectItem :value="null">All Statuses</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Today
          </CardTitle>
          <div class="w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-105" style="background: #3b82f618">
            <Clock class="h-4 w-4" style="color: #3b82f6" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold" style="color: #3b82f6">{{ todayCount }}</div>
        </CardContent>
      </Card>

      <Card class="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Upcoming
          </CardTitle>
          <div class="w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-105" style="background: #8b5cf618">
            <CalendarClock class="h-4 w-4" style="color: #8b5cf6" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold" style="color: #8b5cf6">{{ upcomingCount }}</div>
        </CardContent>
      </Card>

      <Card class="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Completed
          </CardTitle>
          <div class="w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-105" style="background: #10b98118">
            <CheckCircle class="h-4 w-4" style="color: #10b981" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold" style="color: #10b981">{{ completedCount }}</div>
        </CardContent>
      </Card>

      <Card class="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            This Week
          </CardTitle>
          <div class="w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-105" style="background: #f59e0b18">
            <Calendar class="h-4 w-4" style="color: #f59e0b" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold" style="color: #f59e0b">{{ thisWeekCount }}</div>
        </CardContent>
      </Card>
    </div>

    <div class="space-y-4">
      <Card
        v-for="call in filteredHouseCalls"
        :key="call.id"
        class="cursor-pointer transition-all duration-200 hover:shadow-md border border-border bg-card rounded-2xl hover:border-emerald-500/40 group"
        @click="editHouseCall(call)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="space-y-1 w-full">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style="background: #10b98118">
                  <span class="text-xs font-bold" style="color: #10b981">{{ getCustomerName(call.customerId).charAt(0).toUpperCase() }}</span>
                </div>
                <CardTitle class="text-base font-semibold text-foreground flex-1 truncate">
                  {{ getCustomerName(call.customerId) }}
                </CardTitle>
                <span 
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 capitalize"
                  :style="`background: ${getStatusColor(call.status)}15; color: ${getStatusColor(call.status)}; border-color: ${getStatusColor(call.status)}30`"
                >
                  {{ call.status }}
                </span>
              </div>
              <p class="text-sm text-muted-foreground pl-11">
                {{ call.description }}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-2 text-sm pl-11">
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: #64748b18">
                <Clock class="h-3.5 w-3.5" style="color: #64748b" />
              </div>
              <span class="font-medium text-foreground/80">{{ formatDateTime(call.date, call.time) }}</span>
            </div>
            <div v-if="call.address" class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: #64748b18">
                <MapPin class="h-3.5 w-3.5" style="color: #64748b" />
              </div>
              <span class="line-clamp-1 text-foreground/80">{{ call.address }}</span>
            </div>
            <div v-if="call.estimatedDuration" class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: #64748b18">
                <Timer class="h-3.5 w-3.5" style="color: #64748b" />
              </div>
              <span class="text-foreground/80">{{ call.estimatedDuration }} min</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 pt-2 pl-11">
            <Button
              v-if="call.address"
              variant="outline"
              size="sm"
              class="rounded-xl h-8 px-3 text-xs gap-1.5 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-colors"
              @click.stop="openMaps(call.address)"
            >
              <Navigation class="w-3.5 h-3.5" />
              Directions
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="rounded-xl h-8 px-3 text-xs gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-colors"
              @click.stop="callCustomer(call.customerId)"
            >
              <Phone class="w-3.5 h-3.5" />
              Call
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card v-if="filteredHouseCalls.length === 0" class="bg-card border border-border rounded-2xl shadow-sm">
        <CardContent class="flex flex-col items-center justify-center py-16">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style="background: #10b98118">
            <MapPin class="h-6 w-6" style="color: #10b981" />
          </div>
          <h3 class="text-lg font-semibold mb-2">No house calls found</h3>
          <p class="text-sm text-muted-foreground mb-6">
            Schedule your first on-site appointment
          </p>
          <Button @click="newHouseCallOpen = true" class="rounded-xl">
            <Plus class="w-4 h-4 mr-2" />
            Schedule House Call
          </Button>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{{ editingCall ? 'Edit' : 'Schedule' }} House Call</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="customer">Customer *</Label>
            <Select v-model="callForm.customerId">
              <SelectTrigger id="customer" class="rounded-xl">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent class="rounded-xl">
                <SelectItem
                  v-for="customer in customers"
                  :key="customer.id"
                  :value="customer.id"
                >
                  {{ customer.name }} - {{ customer.phone }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="description">Service Description *</Label>
            <Textarea
              id="description"
              v-model="callForm.description"
              class="rounded-xl"
              placeholder="e.g., MacBook screen replacement, on-site diagnosis"
              :rows="3"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="date">Date *</Label>
              <Input
                id="date"
                v-model="callForm.date"
                type="date"
                class="rounded-xl"
              />
            </div>
            <div class="space-y-2">
              <Label for="time">Time *</Label>
              <Input
                id="time"
                v-model="callForm.time"
                type="time"
                class="rounded-xl"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="address">Service Address *</Label>
            <Textarea
              id="address"
              v-model="callForm.address"
              class="rounded-xl"
              placeholder="123 Main St, Suite 100, City, State 12345"
              :rows="2"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                v-model.number="callForm.estimatedDuration"
                type="number"
                class="rounded-xl"
                placeholder="60"
              />
            </div>
            <div class="space-y-2">
              <Label for="status">Status</Label>
              <Select v-model="callForm.status">
                <SelectTrigger id="status" class="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent class="rounded-xl">
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              v-model="callForm.notes"
              class="rounded-xl"
              placeholder="Special instructions, parking info, etc."
              :rows="2"
            />
          </div>

          <div class="flex gap-3 pt-4">
            <Button
              v-if="editingCall"
              variant="destructive"
              class="rounded-xl"
              @click="handleDeleteHouseCall"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" class="flex-1 rounded-xl" @click="cancelEdit">
              Cancel
            </Button>
            <Button class="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" @click="saveHouseCall">
              {{ editingCall ? 'Update' : 'Schedule' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { useNotifications } from '~/composables/useNotifications' 

import { 
  Plus, 
  Clock, 
  CalendarClock,
  CheckCircle,
  Calendar,
  MapPin,
  Navigation,
  Phone,
  Timer,
  Trash2
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'

definePageMeta({
  middleware: ['auth']
})

interface HouseCall {
  id: string
  customerId: number
  description: string
  date: string
  time: string
  address: string
  estimatedDuration?: number
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  notes: string
}

const appStore = useAppStore()
const { customers, houseCalls, isLoaded } = storeToRefs(appStore)
const { createHouseCall: storeCreateHouseCall, updateHouseCall: storeUpdateHouseCall, deleteHouseCall: storeDeleteHouseCall, initializeData } = appStore
const { addNotification } = useNotifications()

onMounted(() => {
  initializeData()
})

const newHouseCallOpen = ref(false)
const editingCall = ref<HouseCall | null>(null)
const filterStatus = ref<string | null>(null)

const showDialog = computed({
  get: () => newHouseCallOpen.value || editingCall.value !== null,
  set: (val) => {
    if (!val) {
      cancelEdit()
    }
  }
})

const callForm = ref({
  customerId: null as number | null,
  description: '',
  date: '',
  time: '',
  address: '',
  estimatedDuration: 60,
  status: 'scheduled' as HouseCall['status'],
  notes: ''
})

const filteredHouseCalls = computed(() => {
  return (houseCalls.value || [])
    .filter(call => !filterStatus.value || call.status === filterStatus.value)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })
})

const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return (houseCalls.value || []).filter(c => c.date === today && c.status !== 'cancelled' && c.status !== 'completed').length
})

const upcomingCount = computed(() => {
  const now = new Date()
  return (houseCalls.value || []).filter(c => {
    const callDate = new Date(`${c.date}T${c.time}`)
    return callDate >= now && c.status !== 'cancelled' && c.status !== 'completed'
  }).length
})

const completedCount = computed(() => {
  return (houseCalls.value || []).filter(c => c.status === 'completed').length
})

const thisWeekCount = computed(() => {
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return (houseCalls.value || []).filter(c => {
    const callDate = new Date(c.date)
    return callDate >= now && callDate <= weekFromNow && c.status !== 'cancelled' && c.status !== 'completed'
  }).length
})

const getCustomerName = (customerId: number) => {
  const customer = (customers.value || []).find(c => c.id === customerId)
  return customer?.name || 'Unknown'
}

const formatDateTime = (date: string, time: string) => {
  return `${new Date(date + 'T' + time).toLocaleDateString()} at ${time}`
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'scheduled': '#3b82f6', // blue
    'confirmed': '#8b5cf6', // purple
    'in-progress': '#f59e0b', // amber
    'completed': '#10b981', // emerald
    'cancelled': '#ef4444'  // red
  }
  return colors[status] || '#64748b' // slate
}

const saveHouseCall = async () => {
  if (!callForm.value.customerId || !callForm.value.description || 
      !callForm.value.date || !callForm.value.time || !callForm.value.address) {
    addNotification('Missing Information', 'Please fill in all required fields', 'warning')
    return
  }
  try {
    if (editingCall.value) {
      await storeUpdateHouseCall(editingCall.value.id, {
        customerId: callForm.value.customerId,
        description: callForm.value.description,
        date: callForm.value.date,
        time: callForm.value.time,
        address: callForm.value.address,
        status: callForm.value.status,
        notes: callForm.value.notes,
      })
      addNotification('Updated', 'House call updated successfully', 'success')
    } else {
      await storeCreateHouseCall({ ...callForm.value })
      addNotification('Scheduled', 'House call scheduled successfully', 'success')
    }
    cancelEdit()
  } catch (err: any) {
    addNotification('Error', 'Failed to save house call: ' + (err.message || err), 'error')
  }
}

const editHouseCall = (call: HouseCall) => {
  editingCall.value = call
  callForm.value = {
    customerId: call.customerId,
    description: call.description,
    date: call.date,
    time: call.time,
    address: call.address,
    estimatedDuration: call.estimatedDuration || 60,
    status: call.status,
    notes: call.notes
  }
}

const handleDeleteHouseCall = async () => {
  if (!editingCall.value) return
  if (confirm('Delete this house call?')) {
    try {
      await storeDeleteHouseCall(editingCall.value.id)
      addNotification('Deleted', 'House call deleted', 'info')
      cancelEdit()
    } catch (err: any) {
      addNotification('Error', 'Failed to delete: ' + (err.message || err), 'error')
    }
  }
}

const cancelEdit = () => {
  newHouseCallOpen.value = false
  editingCall.value = null
  callForm.value = {
    customerId: null,
    description: '',
    date: '',
    time: '',
    address: '',
    estimatedDuration: 60,
    status: 'scheduled',
    notes: ''
  }
}

const openMaps = (address: string) => {
  const url = `https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(address)}`
  window.open(url, '_blank')
}

const callCustomer = (customerId: number) => {
  const customer = (customers.value || []).find(c => c.id === customerId)
  if (customer?.phone) {
    window.location.href = `tel:${customer.phone}`
  }
}
</script>