<template>
  <div class="flex flex-col gap-8 max-w-4xl">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
        <Globe class="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 class="text-3xl font-black tracking-tight">Website Settings</h1>
        <p class="text-sm text-muted-foreground font-medium mt-0.5">Customer portal, booking page, and online presence</p>
      </div>
    </div>

    <!-- Portal toggle -->
    <div class="rounded-[32px] overflow-hidden bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-border/60" style="background: #f59e0b08">
        <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
          <Globe class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-black">Customer Portal</p>
          <p class="text-xs text-muted-foreground font-medium">Let customers check repair status online</p>
        </div>
        <button class="m3-toggle" :class="{ 'active': portalEnabled }" @click="portalEnabled = !portalEnabled">
          <span class="m3-toggle-thumb"><component :is="portalEnabled ? Check : X" class="w-3 h-3" /></span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Portal URL Slug</label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground font-medium">novaops.app/</span>
            <input v-model="portalSlug" placeholder="your-shop" class="m3-input flex-1" />
          </div>
          <p class="text-xs text-muted-foreground font-medium">Customers visit this URL to check ticket status</p>
        </div>
        <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Welcome Message</label>
          <textarea v-model="welcomeMessage" placeholder="Welcome to our repair portal! Enter your ticket ID to check status." rows="2" class="m3-input resize-none" style="height: auto; padding-top: 12px" /></div>
      </div>
    </div>

    <!-- Booking settings -->
    <div class="rounded-[32px] overflow-hidden bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-border/60" style="background: #8b5cf608">
        <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
          <CalendarDays class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1"><p class="text-sm font-black">Online Booking</p><p class="text-xs text-muted-foreground font-medium">Allow customers to book appointments online</p></div>
        <button class="m3-toggle" :class="{ 'active': bookingEnabled }" @click="bookingEnabled = !bookingEnabled">
          <span class="m3-toggle-thumb"><component :is="bookingEnabled ? Check : X" class="w-3 h-3" /></span>
        </button>
      </div>
      <div v-if="bookingEnabled" class="p-6 grid grid-cols-2 gap-4">
        <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Open Time</label><input v-model="businessHours.open" type="time" class="m3-input" /></div>
        <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Close Time</label><input v-model="businessHours.close" type="time" class="m3-input" /></div>
        <div class="col-span-2 space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Slot Duration</label>
          <div class="flex gap-2">
            <button v-for="d in [15,30,60]" :key="d" class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105" :style="slotDuration === d ? 'background: #8b5cf624; color: #8b5cf6; outline: 2px solid #8b5cf650; outline-offset: 0' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'" @click="slotDuration = d">{{ d }}min</button>
          </div>
        </div>
      </div>
    </div>

    <button class="self-start flex items-center gap-2.5 h-12 px-7 rounded-full text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 16px #f59e0b40" @click="saveWebsiteSettings">
      <Save class="w-4 h-4" /> Save Website Settings
    </button>
  </div>
</template>

<script setup lang="ts">
import { Globe, CalendarDays, Check, X, Save } from 'lucide-vue-next'
definePageMeta({ middleware: ['auth'] })
const portalEnabled = ref(false); const bookingEnabled = ref(false)
const portalSlug = ref(''); const welcomeMessage = ref(''); const slotDuration = ref(30)
const businessHours = ref({ open: '09:00', close: '17:00' })
const saveWebsiteSettings = () => { alert('Website settings saved!') }
</script>
<style scoped>
.m3-input { width: 100%; height: 48px; padding: 0 16px; border-radius: 20px; font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); outline: none; transition: all 0.2s ease; }
.m3-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px #f59e0b18; }
.m3-toggle { position: relative; width: 56px; height: 32px; border-radius: 999px; background: hsl(var(--muted)); border: 2px solid hsl(var(--border)/0.8); transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); flex-shrink: 0; cursor: pointer; }
.m3-toggle.active { background: #f59e0b; border-color: #f59e0b; box-shadow: 0 2px 12px #f59e0b40; }
.m3-toggle-thumb { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; color: hsl(var(--muted-foreground)); transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.m3-toggle.active .m3-toggle-thumb { left: calc(100% - 25px); color: #f59e0b; }
</style>
