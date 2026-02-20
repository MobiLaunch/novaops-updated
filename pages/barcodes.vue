<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); box-shadow: 0 6px 28px #06b6d450"
        >
          <ScanLine class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Barcodes</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Generate and scan barcodes for inventory</p>
        </div>
      </div>
      <!-- Mode toggle -->
      <div class="flex gap-1.5 rounded-full p-1" style="background: hsl(var(--muted)/0.5)">
        <button
          v-for="m in ['Generate', 'Scan']"
          :key="m"
          class="px-4 py-2 rounded-full text-xs font-black transition-all"
          :style="mode === m
            ? 'background: white; color: #06b6d4; box-shadow: 0 2px 8px rgba(0,0,0,0.1)'
            : 'color: hsl(var(--muted-foreground))'"
          @click="mode = m"
        >{{ m }}</button>
      </div>
    </div>

    <!-- ── Main Grid ─────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- ── Generate Panel ────────────────────────────────── -->
      <div v-if="mode === 'Generate'" class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #06b6d420">
            <Barcode class="w-4 h-4" style="color: #06b6d4" />
          </div>
          <h3 class="text-sm font-black">Generate Barcode</h3>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Content / SKU</label>
            <input v-model="barcodeValue" placeholder="Enter SKU or item code…" class="m3-input" @keyup.enter="generateBarcode" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Label (optional)</label>
            <input v-model="barcodeLabel" placeholder="Product name" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Type</label>
            <div class="flex gap-1.5 rounded-full p-1 self-start" style="background: hsl(var(--muted)/0.4)">
              <button
                v-for="t in ['Barcode', 'QR']"
                :key="t"
                class="px-4 py-1.5 rounded-full text-xs font-black transition-all"
                :style="barcodeType === t
                  ? 'background: white; color: #06b6d4; box-shadow: 0 2px 8px rgba(0,0,0,0.1)'
                  : 'color: hsl(var(--muted-foreground))'"
                @click="barcodeType = t"
              >{{ t }}</button>
            </div>
          </div>
          <button
            class="w-full h-12 rounded-full text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95"
            style="background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 16px #06b6d440"
            @click="generateBarcode"
          >Generate {{ barcodeType }}</button>

          <!-- Preview -->
          <div v-if="generatedBarcode" class="rounded-[24px] p-6 flex flex-col items-center gap-4 text-center" style="background: #06b6d408; outline: 2px solid #06b6d420; outline-offset: 0">
            <div v-if="barcodeType === 'QR'" class="w-32 h-32 rounded-[20px] flex items-center justify-center" style="background: white; padding: 8px">
              <!-- QR placeholder grid -->
              <div class="grid grid-cols-7 gap-px w-full h-full">
                <div v-for="n in 49" :key="n" class="rounded-[1px]" :style="qrPixels[n % qrPixels.length] ? 'background: #1a1a1a' : 'background: transparent'" />
              </div>
            </div>
            <div v-else>
              <div class="font-mono text-2xl font-black tracking-[0.25em] select-all mb-2" style="color: #06b6d4">{{ generatedBarcode }}</div>
              <div class="flex gap-px justify-center" style="line-height: 0">
                <div v-for="(char, i) in barcodeStripes" :key="i" class="inline-block rounded-sm" :style="`height: 52px; width: ${char}px; background: hsl(var(--foreground))`" />
              </div>
            </div>
            <p class="text-xs font-semibold text-muted-foreground">{{ barcodeLabel || barcodeValue }}</p>
            <div class="flex gap-2">
              <button class="px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105" style="background: #06b6d420; color: #06b6d4" @click="printBarcode">🖨 Print Label</button>
              <button class="px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105" style="background: hsl(var(--muted)/0.5); color: hsl(var(--foreground))" @click="copyToClipboard">📋 Copy</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Scan Panel ─────────────────────────────────────── -->
      <div v-if="mode === 'Scan'" class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #06b6d420">
            <ScanLine class="w-4 h-4" style="color: #06b6d4" />
          </div>
          <h3 class="text-sm font-black">Scan / Lookup</h3>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Scan or type SKU</label>
            <input
              ref="scanInput"
              v-model="scanValue"
              placeholder="Scan barcode or enter SKU…"
              class="m3-input"
              autofocus
              @keyup.enter="lookupScan"
            />
          </div>
          <button class="w-full h-12 rounded-full text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #06b6d4, #0891b2)" @click="lookupScan">
            Lookup Item
          </button>
          <div v-if="scanResult" class="rounded-[24px] p-5 flex flex-col gap-2" :style="scanResult.found ? 'background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0' : 'background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0'">
            <div v-if="scanResult.found" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: #10b98120">
                <Package class="w-5 h-5" style="color: #10b981" />
              </div>
              <div>
                <p class="text-sm font-black" style="color: #10b981">{{ scanResult.item?.name }}</p>
                <p class="text-xs text-muted-foreground font-medium">SKU: {{ scanResult.item?.sku }} · Stock: {{ scanResult.item?.stock ?? '—' }}</p>
              </div>
            </div>
            <p v-else class="text-sm font-bold" style="color: #ef4444">❌ No item found for "{{ scanValue }}"</p>
          </div>
        </div>
      </div>

      <!-- ── Inventory Items ─────────────────────────────────── -->
      <div class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #8b5cf620">
              <Package class="w-4 h-4" style="color: #8b5cf6" />
            </div>
            <h3 class="text-sm font-black">Inventory Items</h3>
          </div>
          <span class="text-xs font-black px-2.5 py-1 rounded-full" style="background: #8b5cf618; color: #8b5cf6">{{ inventory.length }}</span>
        </div>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="item in inventory"
            :key="item.id"
            class="flex items-center gap-3 px-4 py-3 rounded-[20px] hover:bg-muted/20 transition-all cursor-pointer group"
            @click="selectInventoryItem(item)"
          >
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center flex-shrink-0" style="background: #8b5cf618">
              <Package class="w-4 h-4" style="color: #8b5cf6" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate">{{ item.name }}</p>
              <p class="text-xs text-muted-foreground font-medium font-mono">{{ item.sku || 'No SKU' }}</p>
            </div>
            <span class="text-xs font-black text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Barcode class="w-3 h-3" /> Generate
            </span>
          </div>
          <div v-if="!inventory.length" class="text-center py-8">
            <Package class="w-10 h-10 mx-auto mb-2" style="color: hsl(var(--muted-foreground)); opacity: 0.4" />
            <p class="text-sm font-bold text-muted-foreground">No inventory items yet</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Generated History ──────────────────────────────────── -->
    <div v-if="history.length > 0" class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #06b6d420">
            <Clock class="w-4 h-4" style="color: #06b6d4" />
          </div>
          <h3 class="text-sm font-black">Recent Labels</h3>
        </div>
        <button class="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors" @click="history = []">Clear</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="h in history"
          :key="h.value + h.ts"
          class="flex items-center gap-2 px-3 py-2 rounded-[16px] text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
          style="background: #06b6d410; color: #06b6d4; outline: 1px solid #06b6d428; outline-offset: 0"
          @click="barcodeValue = h.value; barcodeLabel = h.label; mode = 'Generate'"
        >
          <Barcode class="w-3 h-3" />
          {{ h.label || h.value }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ScanLine, Barcode, Package, Clock } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const inventory = computed(() => appStore.inventory ?? [])

const mode = ref('Generate')
const barcodeValue = ref('')
const barcodeLabel = ref('')
const barcodeType = ref('Barcode')
const generatedBarcode = ref('')
const scanValue = ref('')
const scanResult = ref<any>(null)
const history = ref<{ value: string; label: string; ts: number }[]>([])

// Deterministic "stripes" from value string
const barcodeStripes = computed(() => {
  const str = generatedBarcode.value
  const stripes: number[] = []
  for (let i = 0; i < Math.min(str.length * 6, 80); i++) {
    stripes.push(((str.charCodeAt(i % str.length) + i) % 2 === 0) ? 3 : 2)
    if (i % 3 === 0) stripes.push(1)
  }
  return stripes
})

// QR pseudo-pixel pattern
const qrPixels = computed(() => {
  const str = generatedBarcode.value
  return Array.from({ length: 49 }, (_, i) => (str.charCodeAt(i % str.length) + i) % 3 !== 0)
})

const generateBarcode = () => {
  if (!barcodeValue.value) return
  generatedBarcode.value = barcodeValue.value.toUpperCase()
  // Add to history
  if (!history.value.find(h => h.value === barcodeValue.value)) {
    history.value.unshift({ value: barcodeValue.value, label: barcodeLabel.value, ts: Date.now() })
    if (history.value.length > 12) history.value.pop()
  }
}

const selectInventoryItem = (item: any) => {
  barcodeValue.value = item.sku || String(item.id)
  barcodeLabel.value = item.name
  mode.value = 'Generate'
  generateBarcode()
}

const lookupScan = () => {
  if (!scanValue.value) return
  const found = inventory.value.find((i: any) =>
    i.sku === scanValue.value || String(i.id) === scanValue.value || i.name?.toLowerCase() === scanValue.value.toLowerCase()
  )
  scanResult.value = { found: !!found, item: found }
}

const printBarcode = () => { window.print() }

const copyToClipboard = async () => {
  try { await navigator.clipboard.writeText(generatedBarcode.value) } catch {}
}
</script>

<style scoped>
.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px #06b6d418; }
</style>
