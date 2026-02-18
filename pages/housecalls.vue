<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">House Calls</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Manage on-site repair appointments
        </p>
      </div>
      <Button size="lg" @click="newHouseCallOpen = true">
        <Plus class="w-4 h-4 mr-2" />
        Schedule House Call
      </Button>
    </div>

    <div class="flex items-center gap-4">
      <Select v-model="filterStatus">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
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
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Today
          </CardTitle>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ todayCount }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Upcoming
          </CardTitle>
          <CalendarClock class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ upcomingCount }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Completed
          </CardTitle>
          <CheckCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ completedCount }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            This Week
          </CardTitle>
          <Calendar class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ thisWeekCount }}</div>
        </CardContent>
      </Card>
    </div>

    <div class="space-y-4">
      <Card
        v-for="call in filteredHouseCalls"
        :key="call.id"
        class="cursor-pointer transition-colors hover:bg-accent"
        @click="editHouseCall(call)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <CardTitle class="text-base">{{ getCustomerName(call.customerId) }}</CardTitle>
                <Badge :variant="getStatusVariant(call.status)">
                  {{ call.status }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ call.description }}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="grid gap-2 text-sm">
            <div class="flex items-center gap-2">
              <Clock class="h-4 w-4 text-muted-foreground" />
              <span>{{ formatDateTime(call.date, call.time) }}</span>
            </div>
            <div v-if="call.address" class="flex items-center gap-2">
              <MapPin class="h-4 w-4 text-muted-foreground" />
              <span class="line-clamp-1">{{ call.address }}</span>
            </div>
            <div v-if="call.estimatedDuration" class="flex items-center gap-2">
              <Timer class="h-4 w-4 text-muted-foreground" />
              <span>{{ call.estimatedDuration }} min</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 pt-2">
            <Button
              v-if="call.address"
              variant="outline"
              size="sm"
              @click.stop="openMaps(call.address)"
            >
              <Navigation class="w-4 h-4 mr-2" />
              Directions
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click.stop="callCustomer(call.customerId)"
            >
              <Phone class="w-4 h-4 mr-2" />
              Call
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card v-if="filteredHouseCalls.length === 0">
        <CardContent class="flex flex-col items-center justify-center py-16">
          <MapPin class="h-12 w-12 text-muted-foreground mb-4" />
          <h3 class="text-lg font-semibold mb-2">No house calls found</h3>
          <p class="text-sm text-muted-foreground mb-6">
            Schedule your first on-site appointment
          </p>
          <Button @click="newHouseCallOpen = true">
            <Plus class="w-4 h-4 mr-2" />
            Schedule House Call
          </Button>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingCall ? 'Edit' : 'Schedule' }} House Call</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="customer">Customer *</Label>
            <Select v-model="callForm.customerId">
              <SelectTrigger id="customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
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
              />
            </div>
            <div class="space-y-2">
              <Label for="time">Time *</Label>
              <Input
                id="time"
                v-model="callForm.time"
                type="time"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="address">Service Address *</Label>
            <Textarea
              id="address"
              v-model="callForm.address"
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
                placeholder="60"
              />
            </div>
            <div class="space-y-2">
              <Label for="status">Status</Label>
              <Select v-model="callForm.status">
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              placeholder="Special instructions, parking info, etc."
              :rows="2"
            />
          </div>

          <div class="flex gap-3 pt-4">
            <Button
              v-if="editingCall"
              variant="destructive"
              @click="handleDeleteHouseCall"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" class="flex-1" @click="cancelEdit">
              Cancel
            </Button>
            <Button class="flex-1" @click="saveHouseCall">
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
import { Badge } from '~/components/ui/badge'
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

const getStatusVariant = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'scheduled': 'default',
    'confirmed': 'secondary',
    'in-progress': 'outline',
    'completed': 'outline',
    'cancelled': 'destructive'
  }
  return variants[status] || 'outline'
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