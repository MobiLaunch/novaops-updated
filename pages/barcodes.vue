<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #06b6d4, #0891b2)">
          <ScanLine class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Barcodes</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Generate and scan barcodes for inventory</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Generator -->
      <div class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #06b6d420"><Barcode class="w-4.5 h-4.5" style="color: #06b6d4" /></div>
          <h3 class="text-sm font-black">Generate Barcode</h3>
        </div>
        <div class="space-y-4">
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Content / SKU</label>
            <input v-model="barcodeValue" placeholder="Enter SKU or item code…" class="m3-input" /></div>
          <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Label</label>
            <input v-model="barcodeLabel" placeholder="Product name (optional)" class="m3-input" /></div>
          <button class="w-full h-12 rounded-full text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 16px #06b6d440" @click="generateBarcode">Generate Barcode</button>
          <div v-if="generatedBarcode" class="rounded-[24px] p-6 flex flex-col items-center gap-3 text-center" style="background: #06b6d408; outline: 2px solid #06b6d420; outline-offset: 0">
            <div class="font-mono text-4xl font-black tracking-[0.3em] select-all" style="color: #06b6d4">{{ generatedBarcode }}</div>
            <div class="flex gap-3 justify-center" style="line-height: 0">
              <div v-for="(char, i) in generatedBarcode.split('')" :key="i" class="inline-block bg-current rounded-sm" :style="`height: 48px; width: ${char === ' ' ? 4 : Math.random() > 0.5 ? 3 : 2}px; color: hsl(var(--foreground))`" />
            </div>
            <p class="text-xs font-semibold text-muted-foreground">{{ barcodeLabel || barcodeValue }}</p>
            <button class="px-5 py-2 rounded-full text-xs font-bold transition-all hover:scale-105" style="background: #06b6d420; color: #06b6d4" @click="printBarcode">🖨 Print Label</button>
          </div>
        </div>
      </div>

      <!-- Inventory barcode list -->
      <div class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #8b5cf620"><Package class="w-4.5 h-4.5" style="color: #8b5cf6" /></div>
          <h3 class="text-sm font-black">Inventory Items</h3>
        </div>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div v-for="item in inventory" :key="item.id" class="flex items-center gap-3 px-4 py-3 rounded-[20px] hover:bg-muted/20 transition-all cursor-pointer group" @click="barcodeValue = item.sku || String(item.id); barcodeLabel = item.name">
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center flex-shrink-0" style="background: #8b5cf618"><Package class="w-4 h-4" style="color: #8b5cf6" /></div>
            <div class="flex-1 min-w-0"><p class="text-sm font-bold truncate">{{ item.name }}</p><p class="text-xs text-muted-foreground font-medium font-mono">{{ item.sku || 'No SKU' }}</p></div>
            <span class="text-xs font-black text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Generate →</span>
          </div>
          <div v-if="!inventory.length" class="text-center py-8 text-xs text-muted-foreground font-semibold">No inventory items yet</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ScanLine, Barcode, Package } from 'lucide-vue-next'
definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const inventory = computed(() => appStore.inventory ?? [])
const barcodeValue = ref(''); const barcodeLabel = ref(''); const generatedBarcode = ref('')
const generateBarcode = () => { if (!barcodeValue.value) return; generatedBarcode.value = barcodeValue.value.toUpperCase() }
const printBarcode = () => { window.print() }
</script>
<style scoped>
.m3-input { width: 100%; height: 48px; padding: 0 16px; border-radius: 20px; font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); outline: none; transition: all 0.2s ease; }
.m3-input:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px #06b6d418; }
</style>