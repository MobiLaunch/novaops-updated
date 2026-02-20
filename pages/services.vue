<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Services</h1>
        <p class="text-sm text-muted-foreground mt-1">Manage your labor and service catalog</p>
      </div>
      <Button size="lg" @click="openNew" class="gap-2">
        <Plus class="w-4 h-4" />
        Add Service
      </Button>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card class="stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
        <CardContent class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Wrench class="w-6 h-6 text-amber-500" />
            </div>
            <div class="text-3xl font-bold">{{ services.length }}</div>
          </div>
          <p class="text-sm text-muted-foreground">Total Services</p>
          <p class="text-xs text-muted-foreground mt-1">{{ categories.length }} categories</p>
        </CardContent>
      </Card>
      <Card class="stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
        <CardContent class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign class="w-6 h-6 text-emerald-500" />
            </div>
            <div class="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">avg</div>
          </div>
          <p class="text-sm text-muted-foreground mb-1">Avg Flat Rate</p>
          <p class="text-3xl font-bold">{{ formatCurrency(avgRate) }}</p>
        </CardContent>
      </Card>
      <Card class="stat-card group cursor-pointer hover:scale-[1.02] transition-transform">
        <CardContent class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Tag class="w-6 h-6 text-blue-500" />
            </div>
            <div class="text-3xl font-bold">{{ categories.length }}</div>
          </div>
          <p class="text-sm text-muted-foreground">Categories</p>
          <p class="text-xs text-muted-foreground mt-1">Across all services</p>
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
      <div class="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Services Grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="service in filteredServices"
        :key="service.id"
        class="pos-card group relative hover:scale-[1.01] transition-transform"
      >
        <CardContent class="p-5">
          <div class="flex items-start justify-between gap-2 mb-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: #f59e0b18">
                <Wrench class="w-5 h-5" style="color: #f59e0b" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-sm truncate">{{ service.name }}</p>
                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border" style="background: #6366f115; color: #6366f1; border-color: #6366f130">
                  {{ service.category }}
                </span>
              </div>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 text-muted-foreground transition-colors" @click="openEdit(service)">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" @click="confirmDelete(service)">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p v-if="service.description" class="text-xs text-muted-foreground mb-3">{{ service.description }}</p>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/30 rounded-lg p-3 border border-border text-center">
              <p class="text-xs text-muted-foreground mb-1">Flat Rate</p>
              <p class="text-base font-bold text-emerald-500">{{ formatCurrency(service.flat_rate) }}</p>
            </div>
            <div class="bg-muted/30 rounded-lg p-3 border border-border text-center">
              <p class="text-xs text-muted-foreground mb-1">Est. Time</p>
              <p class="text-base font-bold">{{ formatMinutes(service.estimated_minutes) }}</p>
            </div>
          </div>
          <div v-if="service.hourly_rate > 0" class="mt-2 text-center text-xs text-muted-foreground">
            {{ formatCurrency(service.hourly_rate) }}/hr when time-based
          </div>
        </CardContent>
      </Card>

      <div v-if="filteredServices.length === 0" class="col-span-3">
        <Card class="pos-card">
          <CardContent class="flex flex-col items-center justify-center py-16">
            <div class="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mb-4">
              <Wrench class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold mb-2">No services found</h3>
            <p class="text-sm text-muted-foreground mb-6">Add your first service to get started</p>
            <Button @click="openNew"><Plus class="w-4 h-4 mr-2" />Add Service</Button>
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
              <p class="text-xs text-muted-foreground">Used when billing by time</p>
            </div>
            <div class="space-y-1.5">
              <Label>Estimated Time (minutes)</Label>
              <Input v-model.number="form.estimated_minutes" type="number" min="0" placeholder="30" />
            </div>
            <div class="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea v-model="form.description" placeholder="Brief description..." :rows="2" />
            </div>
          </div>
          <div class="rounded-xl border bg-muted/30 p-4">
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preview</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: #f59e0b18">
                  <Wrench class="w-4 h-4" style="color: #f59e0b" />
                </div>
                <span class="text-sm font-semibold">{{ form.name || 'Service Name' }}</span>
              </div>
              <span class="text-sm font-bold text-emerald-500">{{ formatCurrency(form.flat_rate || 0) }}</span>
            </div>
            <p class="text-xs text-muted-foreground pl-10 mt-1">
              {{ form.estimated_minutes ? formatMinutes(form.estimated_minutes) : 'No time estimate' }}
              <span v-if="form.hourly_rate > 0"> · {{ formatCurrency(form.hourly_rate) }}/hr if time-based</span>
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

    <!-- Delete Confirm -->
    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader><DialogTitle>Delete Service</DialogTitle></DialogHeader>
        <div class="py-3">
          <div class="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <Trash2 class="w-4 h-4 text-destructive flex-shrink-0" />
            <p class="text-sm text-destructive">Delete <strong>{{ deletingService?.name }}</strong>? This cannot be undone.</p>
          </div>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="deleteDialogOpen = false">Cancel</Button>
          <Button variant="destructive" class="flex-1" :disabled="saving" @click="deleteService">
            <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { Plus, Search, Wrench, DollarSign, Tag, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { from } = useSupabase()
const { $supabase } = useNuxtApp()
const { addNotification } = useNotifications()
const settings = computed(() => appStore.settings)

const services = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const searchQuery = ref('')
const filterCategory = ref('all')
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editingService = ref<any>(null)
const deletingService = ref<any>(null)

const emptyForm = () => ({ name: '', category: '', description: '', flat_rate: 0, hourly_rate: 0, estimated_minutes: 30 })
const form = ref(emptyForm())

const fetchServices = async () => {
  loading.value = true
  const { data, error } = await from('services').select('*').eq('active', true).order('category').order('name')
  if (!error && data) services.value = data
  loading.value = false
}
onMounted(fetchServices)

const categories = computed(() => [...new Set(services.value.map(s => s.category))].sort())
const filteredServices = computed(() => services.value.filter(s => {
  const q = searchQuery.value.toLowerCase()
  const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
  return matchesSearch && (filterCategory.value === 'all' || s.category === filterCategory.value)
}))
const avgRate = computed(() => !services.value.length ? 0 : services.value.reduce((sum, s) => sum + (s.flat_rate || 0), 0) / services.value.length)

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${Number(n).toFixed(2)}`
const formatMinutes = (m: number) => {
  if (!m) return '—'
  const h = Math.floor(m / 60), rem = m % 60
  return m < 60 ? `${m}m` : rem ? `${h}h ${rem}m` : `${h}h`
}

const openNew = () => { editingService.value = null; form.value = emptyForm(); dialogOpen.value = true }
const openEdit = (svc: any) => {
  editingService.value = svc
  form.value = { name: svc.name, category: svc.category, description: svc.description || '', flat_rate: svc.flat_rate, hourly_rate: svc.hourly_rate, estimated_minutes: svc.estimated_minutes }
  dialogOpen.value = true
}
const confirmDelete = (svc: any) => { deletingService.value = svc; deleteDialogOpen.value = true }

const saveService = async () => {
  if (!form.value.name.trim()) return
  saving.value = true
  const { data: { user } } = await ($supabase as any).auth.getUser()
  if (!user) { saving.value = false; return }
  const payload = { profile_id: user.id, name: form.value.name.trim(), category: form.value.category.trim() || 'General', description: form.value.description.trim(), flat_rate: form.value.flat_rate || 0, hourly_rate: form.value.hourly_rate || 0, estimated_minutes: form.value.estimated_minutes || 0, active: true }
  if (editingService.value) {
    const { error } = await from('services').update(payload).eq('id', editingService.value.id)
    if (!error) { const idx = services.value.findIndex(s => s.id === editingService.value.id); if (idx !== -1) services.value[idx] = { ...services.value[idx], ...payload }; addNotification('Service Updated', `${payload.name} updated`, 'success') }
  } else {
    const { data, error } = await from('services').insert(payload).select().single()
    if (!error && data) { services.value.push(data); addNotification('Service Added', `${payload.name} added`, 'success') }
  }
  saving.value = false; dialogOpen.value = false
}

const deleteService = async () => {
  if (!deletingService.value) return
  saving.value = true
  const { error } = await from('services').update({ active: false }).eq('id', deletingService.value.id)
  if (!error) { services.value = services.value.filter(s => s.id !== deletingService.value.id); addNotification('Service Deleted', `${deletingService.value.name} removed`, 'success') }
  saving.value = false; deleteDialogOpen.value = false
}
</script>

