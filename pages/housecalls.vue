<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #10b981, #059669)">
          <MapPin class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">House Calls</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">On-site repair appointments and scheduling</p>
        </div>
      </div>
      <button class="m3-btn flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-black text-white shadow-lg" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 20px #10b98150" @click="newCallOpen = true">
        <Plus class="w-5 h-5" /> Schedule Call
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="call in housecalls" :key="call.id" class="m3-card rounded-[28px] p-5 flex flex-col gap-3 bg-card cursor-pointer" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0" @click="viewCall(call)">
        <div class="flex items-start justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #10b98120"><MapPin class="w-5 h-5" style="color: #10b981" /></div>
          <span class="text-[10px] font-black px-2.5 py-1 rounded-full" :style="callStatusStyle(call.status)">{{ call.status }}</span>
        </div>
        <div>
          <h3 class="font-black text-sm">{{ call.customerName }}</h3>
          <p class="text-xs text-muted-foreground font-medium mt-1">{{ call.address }}</p>
          <p class="text-xs font-semibold mt-2" style="color: #10b981">{{ call.date }} at {{ call.time }}</p>
        </div>
        <p class="text-xs text-muted-foreground font-medium line-clamp-2 border-t border-border/60 pt-2">{{ call.issue }}</p>
      </div>
      <div v-if="housecalls.length === 0" class="col-span-full rounded-[32px] py-16 flex flex-col items-center gap-4 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background: #10b98114"><MapPin class="w-8 h-8" style="color: #10b981; opacity: 0.5" /></div>
        <div class="text-center"><p class="font-black">No house calls scheduled</p><p class="text-xs text-muted-foreground font-medium mt-1">Schedule your first on-site visit</p></div>
        <button class="px-5 py-2.5 rounded-full text-sm font-bold text-white" style="background: linear-gradient(135deg, #10b981, #059669)" @click="newCallOpen = true">Schedule First Call</button>
      </div>
    </div>

    <Dialog v-model:open="newCallOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <h2 class="text-base font-black">Schedule House Call</h2>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</label>
            <select v-model="callForm.customerId" class="m3-input"><option :value="null">Select customer</option><option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Address</label><input v-model="callForm.address" placeholder="123 Main St, City, State" class="m3-input" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Date</label><input v-model="callForm.date" type="date" class="m3-input" /></div>
            <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Time</label><input v-model="callForm.time" type="time" class="m3-input" /></div>
          </div>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Issue</label><textarea v-model="callForm.issue" placeholder="Describe the repair needed…" rows="2" class="m3-input resize-none" style="height: auto; padding-top: 12px" /></div>
          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="newCallOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white" style="background: linear-gradient(135deg, #10b981, #059669)" @click="saveCall">Schedule</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { MapPin, Plus } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const customers = computed(() => appStore.customers ?? [])
const housecalls = ref<any[]>([])
const newCallOpen = ref(false)
const callForm = ref({ customerId: null as any, address: '', date: '', time: '', issue: '' })
const callStatusStyle = (s: string) => ({ 'Scheduled': 'background: #3b82f620; color: #3b82f6', 'In Progress': 'background: #f59e0b20; color: #f59e0b', 'Completed': 'background: #10b98120; color: #10b981' }[s] || 'background: hsl(var(--muted)/0.5)')
const viewCall = (call: any) => {}
const saveCall = () => {
  const customer = customers.value.find((c: any) => c.id === callForm.value.customerId)
  housecalls.value.unshift({ ...callForm.value, id: Date.now(), status: 'Scheduled', customerName: customer?.name || 'Unknown' })
  newCallOpen.value = false; callForm.value = { customerId: null, address: '', date: '', time: '', issue: '' }
}
</script>
<style scoped>
.m3-btn { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.m3-btn:hover { transform: scale(1.05) translateY(-2px); } .m3-btn:active { transform: scale(0.92); }
.m3-card { transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease; }
.m3-card:hover { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); } .m3-card:active { transform: scale(0.96); }
.m3-input { width: 100%; height: 48px; padding: 0 16px; border-radius: 20px; font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); outline: none; transition: all 0.2s ease; }
.m3-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px #10b98118; }
</style>