<template>
  <div class="flex flex-col gap-8">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg"
        style="background: linear-gradient(135deg, #22d3ee 0%, #0891b2 100%); box-shadow: 0 4px 20px #22d3ee40">
        <Wrench class="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 class="text-3xl font-black tracking-tight">Repair Services</h1>
        <p class="text-sm text-muted-foreground font-medium mt-0.5">Manage your service catalog and labor rates</p>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="stat in kpis" :key="stat.label"
        class="rounded-[28px] p-5 flex flex-col gap-3"
        :style="`background: ${stat.color}14; outline: 2px solid ${stat.color}28; outline-offset: 0`">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" :style="`background: ${stat.color}24`">
            <component :is="stat.icon" class="w-5 h-5" :style="`color: ${stat.color}`" />
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">{{ stat.label }}</p>
          <p class="text-2xl font-black" :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Search + Add -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input v-model="search" placeholder="Search services…"
          class="w-full h-12 pl-11 pr-4 rounded-full text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all font-medium" />
      </div>
      <button @click="openNew"
        class="flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white transition-all hover:scale-[1.03] active:scale-95"
        style="background: linear-gradient(135deg, #22d3ee, #0891b2); box-shadow: 0 4px 16px #22d3ee40">
        <Plus class="w-4 h-4" /> Add Service
      </button>
    </div>

    <!-- Category Filter -->
    <div class="flex gap-1.5 flex-wrap">
      <button v-for="cat in ['All', ...categories]" :key="cat"
        class="px-4 py-2 rounded-full text-xs font-black transition-all"
        :style="selectedCat === cat
          ? 'background: #22d3ee24; color: #22d3ee; outline: 2px solid #22d3ee50; outline-offset: 0'
          : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
        @click="selectedCat = cat">{{ cat }}</button>
    </div>

    <!-- Service Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="svc in filtered" :key="svc.id"
        class="service-card rounded-[28px] p-5 flex flex-col gap-3 bg-card cursor-pointer"
        style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
        @click="openEdit(svc)">
        <div class="flex items-start justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #22d3ee20">
            <Wrench class="w-5 h-5" style="color: #22d3ee" />
          </div>
          <span class="text-[10px] font-black px-2.5 py-1 rounded-full" style="background: #22d3ee16; color: #22d3ee">
            {{ svc.category || 'General' }}
          </span>
        </div>
        <div>
          <h3 class="font-black text-sm">{{ svc.name }}</h3>
          <p class="text-xs text-muted-foreground font-medium mt-1">{{ svc.description || 'No description' }}</p>
        </div>
        <div class="flex items-center justify-between border-t border-border/60 pt-2">
          <p class="text-base font-black" style="color: #22d3ee">${{ (svc.price || 0).toFixed(2) }}</p>
          <div class="flex gap-2">
            <span class="text-xs font-semibold text-muted-foreground">{{ svc.duration || '—' }} min</span>
            <button class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 transition-all"
              @click.stop="deleteService(svc)">
              <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="filtered.length === 0"
        class="col-span-full rounded-[32px] py-16 flex flex-col items-center gap-4 bg-card"
        style="outline: 2px solid hsl(var(--border)/0.6)">
        <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background: #22d3ee14">
          <Wrench class="w-8 h-8" style="color: #22d3ee; opacity: 0.5" />
        </div>
        <div class="text-center">
          <p class="font-black">No services found</p>
          <p class="text-xs text-muted-foreground font-medium mt-1">Add your first service to get started</p>
        </div>
        <button @click="openNew" class="px-5 py-2.5 rounded-full text-sm font-bold text-white"
          style="background: linear-gradient(135deg, #22d3ee, #0891b2)">Add Service</button>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="formOpen">
      <DialogContent class="max-w-md">
        <div class="flex flex-col gap-5 p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center"
              style="background: linear-gradient(135deg, #22d3ee, #0891b2)">
              <Wrench class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">{{ editing ? 'Edit Service' : 'New Service' }}</h2>
              <p class="text-xs text-muted-foreground font-medium">Repair service or labor item</p>
            </div>
          </div>
          <div class="space-y-2"><label class="m3-label">Service Name</label>
            <input v-model="form.name" placeholder="e.g. Screen Replacement" class="m3-input" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2"><label class="m3-label">Price ($)</label>
              <input v-model.number="form.price" type="number" min="0" step="0.01" placeholder="0.00" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Duration (min)</label>
              <input v-model.number="form.duration" type="number" min="0" placeholder="60" class="m3-input" /></div>
          </div>
          <div class="space-y-2"><label class="m3-label">Category</label>
            <input v-model="form.category" placeholder="e.g. iPhone, Android, Laptop" class="m3-input" /></div>
          <div class="space-y-2"><label class="m3-label">Description</label>
            <textarea v-model="form.description" placeholder="Brief description…" rows="2"
              class="m3-input resize-none" style="height:auto;padding-top:12px" /></div>
          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm" style="outline: 2px solid hsl(var(--border)); outline-offset: 0"
              @click="formOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white"
              style="background: linear-gradient(135deg, #22d3ee, #0891b2)"
              @click="saveService">{{ editing ? 'Save' : 'Add Service' }}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { Wrench, Search, Plus, Trash2 } from 'lucide-vue-next'
import { BarChart3, Clock, DollarSign, Tag } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })

const services = ref<any[]>([])
const search = ref('')
const selectedCat = ref('All')
const formOpen = ref(false)
const editing = ref<any>(null)
const form = ref({ name: '', price: 0, duration: 60, category: '', description: '' })

const categories = computed(() => [...new Set(services.value.map(s => s.category).filter(Boolean))])
const filtered = computed(() => services.value.filter(s => {
  const q = search.value.toLowerCase()
  const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
  const matchCat = selectedCat.value === 'All' || s.category === selectedCat.value
  return matchSearch && matchCat
}))

const kpis = computed(() => [
  { label: 'Total Services', value: services.value.length, color: '#22d3ee', icon: Wrench },
  { label: 'Categories', value: categories.value.length, color: '#8b5cf6', icon: Tag },
  { label: 'Avg Price', value: services.value.length ? '$' + (services.value.reduce((a,s) => a + (s.price||0), 0) / services.value.length).toFixed(0) : '$0', color: '#10b981', icon: DollarSign },
  { label: 'Avg Duration', value: services.value.length ? (services.value.reduce((a,s) => a + (s.duration||0), 0) / services.value.length).toFixed(0) + 'm' : '0m', color: '#f59e0b', icon: Clock },
])

const openNew = () => { editing.value = null; form.value = { name: '', price: 0, duration: 60, category: '', description: '' }; formOpen.value = true }
const openEdit = (svc: any) => { editing.value = svc; form.value = { ...svc }; formOpen.value = true }
const saveService = () => {
  if (!form.value.name) return
  if (editing.value) {
    const i = services.value.findIndex(s => s.id === editing.value.id)
    if (i > -1) services.value[i] = { ...editing.value, ...form.value }
  } else {
    services.value.unshift({ ...form.value, id: Date.now() })
  }
  formOpen.value = false
}
const deleteService = (svc: any) => {
  if (confirm(`Delete "${svc.name}"?`)) services.value = services.value.filter(s => s.id !== svc.id)
}
</script>

<style scoped>
.m3-label { display: block; font-size: 10px; font-weight: 800; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
.m3-input { width: 100%; height: 48px; padding: 0 20px; border-radius: 20px; font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); color: hsl(var(--foreground)); outline: none; transition: all 0.2s ease; }
.m3-input:focus { border-color: #22d3ee; box-shadow: 0 0 0 3px #22d3ee18; }
.service-card { transition: transform 0.4s cubic-bezier(0.34, 1.5, 0.64, 1), box-shadow 0.3s ease; }
.service-card:hover { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.service-card:active { transform: scale(0.97); }
</style>
