<template>
  <div class="flex flex-col gap-8">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Services</h1>
        <p class="text-sm text-muted-foreground mt-1">Manage your labor and service catalog</p>
      </div>
      <Button size="lg" @click="openNew">
        <Plus class="w-4 h-4 mr-2" />
        Add Service
      </Button>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Wrench class="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Total Services</p>
            <p class="text-2xl font-bold">{{ services.length }}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign class="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Avg Flat Rate</p>
            <p class="text-2xl font-bold">{{ formatCurrency(avgRate) }}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Tag class="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Categories</p>
            <p class="text-2xl font-bold">{{ categories.length }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Search services..." class="pl-9" />
      </div>
      <Select v-model="filterCategory">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Services Grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="service in filteredServices"
        :key="service.id"
        class="relative group"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <CardTitle class="text-base truncate">{{ service.name }}</CardTitle>
              <Badge variant="outline" class="mt-1 text-xs">{{ service.category }}</Badge>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEdit(service)">
                <Pencil class="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="confirmDelete(service)">
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <p v-if="service.description" class="text-xs text-muted-foreground">{{ service.description }}</p>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="rounded-lg bg-muted/50 p-2 text-center">
              <p class="text-xs text-muted-foreground">Flat Rate</p>
              <p class="text-sm font-bold text-emerald-600">{{ formatCurrency(service.flat_rate) }}</p>
            </div>
            <div class="rounded-lg bg-muted/50 p-2 text-center">
              <p class="text-xs text-muted-foreground">Est. Time</p>
              <p class="text-sm font-bold">{{ formatMinutes(service.estimated_minutes) }}</p>
            </div>
          </div>
          <div v-if="service.hourly_rate > 0" class="text-xs text-muted-foreground text-center">
            Hourly override: {{ formatCurrency(service.hourly_rate) }}/hr
          </div>
        </CardContent>
      </Card>

      <!-- Empty -->
      <div v-if="filteredServices.length === 0" class="col-span-3">
        <Card>
          <CardContent class="flex flex-col items-center justify-center py-16">
            <Wrench class="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
            <h3 class="text-lg font-semibold mb-2">No services found</h3>
            <p class="text-sm text-muted-foreground mb-6">Add your first service to get started</p>
            <Button @click="openNew">
              <Plus class="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Add / Edit Dialog -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingService ? 'Edit Service' : 'New Service' }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2 space-y-1.5">
              <Label>Service Name *</Label>
              <Input v-model="form.name" placeholder="e.g. Screen Replacement" />
            </div>

            <div class="space-y-1.5">
              <Label>Category *</Label>
              <Input v-model="form.category" placeholder="e.g. Screen, Battery..." list="category-list" />
              <datalist id="category-list">
                <option v-for="cat in categories" :key="cat" :value="cat" />
              </datalist>
            </div>

            <div class="space-y-1.5">
              <Label>Flat Rate ($) *</Label>
              <Input v-model.number="form.flat_rate" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>

            <div class="space-y-1.5">
              <Label>Hourly Rate ($/hr)</Label>
              <Input v-model.number="form.hourly_rate" type="number" min="0" step="0.01" placeholder="0.00" />
              <p class="text-xs text-muted-foreground">Used when overriding with time</p>
            </div>

            <div class="space-y-1.5">
              <Label>Estimated Time (minutes)</Label>
              <Input v-model.number="form.estimated_minutes" type="number" min="0" placeholder="30" />
            </div>

            <div class="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea v-model="form.description" placeholder="Brief description of this service..." :rows="2" />
            </div>
          </div>

          <!-- Live preview -->
          <div class="rounded-lg border bg-muted/30 p-3 space-y-1">
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview</p>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{ form.name || 'Service Name' }}</span>
              <span class="text-sm font-bold text-emerald-600">{{ formatCurrency(form.flat_rate || 0) }}</span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ form.estimated_minutes ? formatMinutes(form.estimated_minutes) : 'No time estimate' }}
              <span v-if="form.hourly_rate > 0"> · {{ formatCurrency(form.hourly_rate) }}/hr if overridden</span>
            </p>
          </div>
        </div>

        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="dialogOpen = false">Cancel</Button>
          <Button class="flex-1" :disabled="!form.name || saving" @click="saveService">
            <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
            {{ editingService ? 'Save Changes' : 'Add Service' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirm Dialog -->
    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Service</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-muted-foreground py-2">
          Are you sure you want to delete <strong>{{ deletingService?.name }}</strong>? This cannot be undone.
        </p>
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="deleteDialogOpen = false">Cancel</Button>
          <Button variant="destructive" class="flex-1" :disabled="saving" @click="deleteService">
            <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import {
  Plus, Search, Wrench, DollarSign, Tag,
  Pencil, Trash2, Loader2
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { settings } = appStore
const { from } = useSupabase()
const { $supabase } = useNuxtApp()
const { addNotification } = useNotifications()

// ── State ─────────────────────────────────────────────────────────
const services = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const searchQuery = ref('')
const filterCategory = ref('all')
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingService = ref<any>(null)
const deletingService = ref<any>(null)

const emptyForm = () => ({
  name: '',
  category: '',
  description: '',
  flat_rate: 0,
  hourly_rate: 0,
  estimated_minutes: 30,
})
const form = ref(emptyForm())

// ── Fetch ─────────────────────────────────────────────────────────
const fetchServices = async () => {
  loading.value = true
  const { data, error } = await from('services')
    .select('*')
    .eq('active', true)
    .order('category')
    .order('name')
  if (!error && data) services.value = data
  loading.value = false
}

onMounted(fetchServices)

// ── Computed ──────────────────────────────────────────────────────
const categories = computed(() => [...new Set(services.value.map(s => s.category))].sort())

const filteredServices = computed(() => {
  return services.value.filter(s => {
    const matchesSearch = !searchQuery.value ||
      s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCat = filterCategory.value === 'all' || s.category === filterCategory.value
    return matchesSearch && matchesCat
  })
})

const avgRate = computed(() => {
  if (!services.value.length) return 0
  return services.value.reduce((sum, s) => sum + (s.flat_rate || 0), 0) / services.value.length
})

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${Number(n).toFixed(2)}`
const formatMinutes = (m: number) => {
  if (!m) return '—'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

// ── Dialog helpers ────────────────────────────────────────────────
const openNew = () => {
  editingService.value = null
  form.value = emptyForm()
  dialogOpen.value = true
}

const openEdit = (service: any) => {
  editingService.value = service
  form.value = {
    name: service.name,
    category: service.category,
    description: service.description || '',
    flat_rate: service.flat_rate,
    hourly_rate: service.hourly_rate,
    estimated_minutes: service.estimated_minutes,
  }
  dialogOpen.value = true
}

const confirmDelete = (service: any) => {
  deletingService.value = service
  deleteDialogOpen.value = true
}

// ── CRUD ──────────────────────────────────────────────────────────
const saveService = async () => {
  if (!form.value.name.trim()) return
  saving.value = true

  const { data: { user } } = await ($supabase as any).auth.getUser()
  if (!user) { saving.value = false; return }

  const payload = {
    profile_id: user.id,
    name: form.value.name.trim(),
    category: form.value.category.trim() || 'General',
    description: form.value.description.trim(),
    flat_rate: form.value.flat_rate || 0,
    hourly_rate: form.value.hourly_rate || 0,
    estimated_minutes: form.value.estimated_minutes || 0,
    active: true,
  }

  if (editingService.value) {
    const { error } = await from('services').update(payload).eq('id', editingService.value.id)
    if (!error) {
      const idx = services.value.findIndex(s => s.id === editingService.value.id)
      if (idx !== -1) services.value[idx] = { ...services.value[idx], ...payload }
      addNotification('Service Updated', `${payload.name} has been updated`, 'success')
    }
  } else {
    const { data, error } = await from('services').insert(payload).select().single()
    if (!error && data) {
      services.value.push(data)
      addNotification('Service Added', `${payload.name} added to catalog`, 'success')
    }
  }

  saving.value = false
  dialogOpen.value = false
}

const deleteService = async () => {
  if (!deletingService.value) return
  saving.value = true
  const { error } = await from('services')
    .update({ active: false })
    .eq('id', deletingService.value.id)
  if (!error) {
    services.value = services.value.filter(s => s.id !== deletingService.value.id)
    addNotification('Service Deleted', `${deletingService.value.name} removed`, 'success')
  }
  saving.value = false
  deleteDialogOpen.value = false
}
</script>
