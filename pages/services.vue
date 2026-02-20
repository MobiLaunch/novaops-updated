<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #10b981, #059669)">
          <Wrench class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Services</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Manage your service catalog and pricing</p>
        </div>
      </div>
      <button class="m3-btn flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-black text-white shadow-lg" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 20px #10b98150" @click="newServiceOpen = true">
        <Plus class="w-5 h-5" /> Add Service
      </button>
    </div>

    <div class="relative max-w-sm">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input v-model="search" placeholder="Search services…" class="w-full h-12 pl-11 pr-4 rounded-full text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all font-medium" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="service in filteredServices" :key="service.id" class="m3-card rounded-[28px] p-5 flex flex-col gap-4 bg-card cursor-pointer" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0" @click="editService(service)">
        <div class="flex items-start justify-between">
          <div class="w-12 h-12 rounded-[22px] flex items-center justify-center" style="background: linear-gradient(135deg, #10b98120, #05966920)">
            <Wrench class="w-6 h-6" style="color: #10b981" />
          </div>
          <span class="text-[10px] font-black px-2.5 py-1 rounded-full" :style="service.active ? 'background: #10b98120; color: #10b981' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'">{{ service.active ? 'ACTIVE' : 'INACTIVE' }}</span>
        </div>
        <div class="flex-1">
          <h3 class="font-black text-sm mb-1">{{ service.name }}</h3>
          <p class="text-xs text-muted-foreground font-medium line-clamp-2">{{ service.description || 'No description' }}</p>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-black" style="color: #10b981">{{ formatCurrency(service.price) }}</span>
          <span class="text-xs text-muted-foreground font-semibold">{{ service.duration ? service.duration + ' min' : '' }}</span>
        </div>
      </div>
      <div v-if="filteredServices.length === 0" class="col-span-full rounded-[32px] py-16 flex flex-col items-center gap-4 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background: #10b98114"><Wrench class="w-8 h-8" style="color: #10b981; opacity: 0.5" /></div>
        <p class="font-black">No services yet</p>
        <button class="px-5 py-2.5 rounded-full text-sm font-bold text-white" style="background: linear-gradient(135deg, #10b981, #059669)" @click="newServiceOpen = true">Add First Service</button>
      </div>
    </div>

    <Dialog v-model:open="newServiceOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <h2 class="text-base font-black">{{ editingService ? 'Edit Service' : 'New Service' }}</h2>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Service Name</label><input v-model="serviceForm.name" placeholder="Screen Repair" class="m3-input" /></div>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Description</label><textarea v-model="serviceForm.description" placeholder="What this service includes…" class="m3-input resize-none" style="height: auto; padding-top: 12px" rows="2" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Price</label><input v-model.number="serviceForm.price" type="number" step="0.01" placeholder="29.99" class="m3-input" /></div>
            <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Duration (min)</label><input v-model.number="serviceForm.duration" type="number" placeholder="60" class="m3-input" /></div>
          </div>
          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="newServiceOpen = false; editingService = null">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white transition-all hover:scale-105 active:scale-95" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140" @click="saveService">{{ editingService ? 'Save' : 'Add Service' }}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Wrench, Search, Plus } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const services = computed(() => (appStore as any).services ?? [])
const settings = computed(() => appStore.settings ?? { currency: '$' })
const search = ref(''); const newServiceOpen = ref(false); const editingService = ref<any>(null)
const serviceForm = ref({ name: '', description: '', price: 0, duration: 60, active: true })
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const filteredServices = computed(() => services.value.filter((s: any) => !search.value || s.name.toLowerCase().includes(search.value.toLowerCase())))
const editService = (s: any) => { editingService.value = s; serviceForm.value = { ...s }; newServiceOpen.value = true }
const saveService = async () => {
  if (!serviceForm.value.name) return
  if (editingService.value) {
    const idx = (appStore as any).services.findIndex((s: any) => s.id === editingService.value.id)
    if (idx > -1) (appStore as any).services[idx] = { ...editingService.value, ...serviceForm.value }
  } else {
    ((appStore as any).services || []).push({ ...serviceForm.value, id: Date.now() })
  }
  await appStore.saveAll(); newServiceOpen.value = false; editingService.value = null
  serviceForm.value = { name: '', description: '', price: 0, duration: 60, active: true }
}
</script>
<style scoped>
.m3-btn { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-btn:hover { transform: scale(1.05) translateY(-2px); } .m3-btn:active { transform: scale(0.92); }
.m3-card { transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease; }
.m3-card:hover { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-card:active { transform: scale(0.96); }
.m3-input { width: 100%; height: 48px; padding: 0 16px; border-radius: 20px; font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); outline: none; transition: all 0.2s ease; }
.m3-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px #10b98118; }
</style>
