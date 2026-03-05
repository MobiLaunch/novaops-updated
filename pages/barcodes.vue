<template>
  <div class="flex flex-col gap-8">

    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg"
          style="background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 6px 28px #06b6d450">
          <ScanLine class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Barcodes</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Generate and scan barcodes for inventory</p>
        </div>
      </div>
      <div class="flex gap-1.5 rounded-full p-1" style="background: hsl(var(--muted)/0.5)">
        <button v-for="m in ['Generate', 'Scan']" :key="m"
          class="px-4 py-2 rounded-full text-xs font-black transition-all"
          :style="mode === m ? 'background: white; color: #06b6d4; box-shadow: 0 2px 8px rgba(0,0,0,0.1)' : 'color: hsl(var(--muted-foreground))'"
          @click="mode = m">{{ m }}</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Generate Panel -->
      <div v-if="mode === 'Generate'" class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #06b6d420">
            <Barcode class="w-4 h-4" style="color: #06b6d4" />
          </div>
          <h3 class="text-sm font-black">Generate Barcode</h3>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="m3-label">Content / SKU</label>
            <input v-model="barcodeValue" placeholder="Enter SKU or item code…" class="m3-input" @input="debouncedGenerate" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Label (optional)</label>
            <input v-model="barcodeLabel" placeholder="Product name or description" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Format</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="t in barcodeFormats" :key="t.value"
                class="px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                :style="barcodeFormat === t.value ? 'background: #06b6d424; color: #06b6d4; outline: 1.5px solid #06b6d440; outline-offset:0' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                @click="barcodeFormat = t.value; debouncedGenerate()">{{ t.label }}</button>
            </div>
          </div>

          <!-- Live barcode preview -->
          <div v-if="barcodeValue" class="rounded-[24px] p-6 flex flex-col items-center gap-4" style="background: white; outline: 2px solid #06b6d420; outline-offset: 0">
            <div v-show="barcodeFormat === 'QR'">
              <canvas ref="qrCanvas" class="rounded-[12px]" />
            </div>
            <svg v-show="barcodeFormat !== 'QR'" ref="barcodeSvg" class="max-w-full" />
            <p class="text-xs font-bold text-gray-500">{{ barcodeLabel || barcodeValue }}</p>
            <p v-if="barcodeError" class="text-xs font-bold text-red-500">{{ barcodeError }}</p>
            <div class="flex gap-2">
              <button class="px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105" style="background: #06b6d420; color: #06b6d4" @click="printBarcode">
                🖨 Print Label
              </button>
              <button class="px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105" style="background: hsl(var(--muted)/0.5); color: hsl(var(--foreground))" @click="downloadBarcode">
                ⬇ Download
              </button>
            </div>
          </div>

          <div v-if="!barcodeValue" class="rounded-[24px] p-8 flex flex-col items-center gap-2 text-muted-foreground" style="background: hsl(var(--muted)/0.2); outline: 2px dashed hsl(var(--border)/0.4); outline-offset: 0">
            <Barcode class="w-8 h-8 opacity-30" />
            <p class="text-xs font-bold">Enter a value above to preview your barcode</p>
          </div>
        </div>
      </div>

      <!-- Scan Panel -->
      <div v-if="mode === 'Scan'" class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #06b6d420">
            <ScanLine class="w-4 h-4" style="color: #06b6d4" />
          </div>
          <h3 class="text-sm font-black">Scan / Lookup</h3>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="m3-label">Scan or type SKU</label>
            <input ref="scanInput" v-model="scanValue" placeholder="Scan barcode or enter SKU…" class="m3-input" autofocus @keyup.enter="lookupScan" />
          </div>
          <button class="w-full h-12 rounded-full text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #06b6d4, #0891b2)" @click="lookupScan">
            Lookup Item
          </button>
          <div v-if="scanResult" class="rounded-[24px] p-5 flex flex-col gap-2"
            :style="scanResult.found ? 'background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0' : 'background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0'">
            <div v-if="scanResult.found" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: #10b98120">
                <Package class="w-5 h-5" style="color: #10b981" />
              </div>
              <div>
                <p class="text-sm font-black" style="color: #10b981">{{ scanResult.item?.name }}</p>
                <p class="text-xs text-muted-foreground font-medium">SKU: {{ scanResult.item?.sku }} · Stock: {{ scanResult.item?.stock ?? '—' }} · {{ formatCurrency(scanResult.item?.price) }}</p>
              </div>
            </div>
            <p v-else class="text-sm font-bold" style="color: #ef4444">❌ No item found for "{{ scanValue }}"</p>
          </div>
        </div>
      </div>

      <!-- Inventory Items — click to auto-populate generator -->
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
        <div class="space-y-1.5 max-h-96 overflow-y-auto">
          <div v-for="item in inventory" :key="item.id"
            class="flex items-center gap-3 px-4 py-3 rounded-[20px] hover:bg-muted/20 transition-all cursor-pointer group"
            @click="selectInventoryItem(item)">
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
            <Package class="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p class="text-sm font-bold text-muted-foreground">No inventory items yet</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch generator -->
    <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #06b6d420">
            <Layers class="w-4 h-4" style="color: #06b6d4" />
          </div>
          <h3 class="text-sm font-black">Batch Print — Inventory Labels</h3>
        </div>
        <button
          class="h-9 px-5 rounded-full text-xs font-black text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
          style="background: linear-gradient(135deg, #06b6d4, #0891b2)"
          :disabled="selectedItems.length === 0"
          @click="printBatch"
        >Print {{ selectedItems.length > 0 ? selectedItems.length : '' }} Label{{ selectedItems.length !== 1 ? 's' : '' }}</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button v-for="item in inventory" :key="item.id"
          class="flex items-center gap-2 px-3 py-2 rounded-[14px] text-xs font-bold transition-all hover:scale-[1.02]"
          :style="selectedItems.includes(item.id)
            ? 'background: #06b6d424; color: #06b6d4; outline: 1.5px solid #06b6d440; outline-offset:0'
            : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
          @click="toggleSelected(item.id)">
          <Barcode class="w-3 h-3" />
          {{ item.name }}
        </button>
        <p v-if="!inventory.length" class="text-xs text-muted-foreground font-medium py-2">No inventory items. Add items to batch print labels.</p>
      </div>
    </div>

    <!-- Hidden print frame for batch -->
    <iframe ref="printFrame" class="hidden" />
  </div>
</template>

<script setup lang="ts">
import { ScanLine, Barcode, Package, Layers } from 'lucide-vue-next'
definePageMeta({ middleware: ['auth'] })

const appStore  = useAppStore()
const inventory = computed(() => appStore.inventory ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$' })
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`

const mode          = ref('Generate')
const barcodeValue  = ref('')
const barcodeLabel  = ref('')
const barcodeFormat = ref('CODE128')
const barcodeError  = ref('')
const scanValue     = ref('')
const scanResult    = ref<any>(null)
const selectedItems = ref<any[]>([])

const barcodeSvg  = ref<SVGElement | null>(null)
const qrCanvas    = ref<HTMLCanvasElement | null>(null)
const printFrame  = ref<HTMLIFrameElement | null>(null)

const barcodeFormats = [
  { label: 'CODE128', value: 'CODE128' },
  { label: 'CODE39',  value: 'CODE39' },
  { label: 'EAN-13',  value: 'EAN13' },
  { label: 'UPC-A',   value: 'UPC' },
  { label: 'QR Code', value: 'QR' },
]

// ── Library loading ───────────────────────────────────────────────────────────
let jsBarcodeLoaded = false
let qrCodeLoaded    = false

async function loadJsBarcode(): Promise<void> {
  if (jsBarcodeLoaded || (window as any).JsBarcode) { jsBarcodeLoaded = true; return }
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'
    s.onload = () => { jsBarcodeLoaded = true; resolve() }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function loadQrCode(): Promise<void> {
  if (qrCodeLoaded || (window as any).QRCode) { qrCodeLoaded = true; return }
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
    s.onload = () => { qrCodeLoaded = true; resolve() }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// ── Barcode generation ────────────────────────────────────────────────────────
let genTimer: ReturnType<typeof setTimeout> | null = null
function debouncedGenerate() {
  if (genTimer) clearTimeout(genTimer)
  genTimer = setTimeout(generateBarcode, 300)
}

async function generateBarcode() {
  if (!barcodeValue.value) return
  barcodeError.value = ''
  await nextTick()

  try {
    if (barcodeFormat.value === 'QR') {
      await loadQrCode()
      if (!qrCanvas.value) return
      await (window as any).QRCode.toCanvas(qrCanvas.value, barcodeValue.value, {
        width: 180, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' }
      })
    } else {
      await loadJsBarcode()
      if (!barcodeSvg.value) return
      ;(window as any).JsBarcode(barcodeSvg.value, barcodeValue.value, {
        format: barcodeFormat.value,
        lineColor: '#1a1a1a',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 13,
        margin: 10,
        background: '#ffffff',
      })
    }
  } catch (e: any) {
    barcodeError.value = e.message?.includes('is not a valid') ? `"${barcodeValue.value}" is not valid for ${barcodeFormat.value}` : (e.message || 'Could not generate barcode')
  }
}

watch(barcodeValue, debouncedGenerate)
watch(barcodeFormat, debouncedGenerate)
watch(mode, () => { if (mode.value === 'Generate' && barcodeValue.value) nextTick(debouncedGenerate) })

// ── Print ─────────────────────────────────────────────────────────────────────
function getSvgDataUrl(): string | null {
  if (barcodeFormat.value === 'QR') {
    return qrCanvas.value?.toDataURL() ?? null
  }
  if (!barcodeSvg.value) return null
  const svgData = new XMLSerializer().serializeToString(barcodeSvg.value)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`
}

function printBarcode() {
  const dataUrl = getSvgDataUrl()
  const label   = barcodeLabel.value || barcodeValue.value
  const tag     = barcodeFormat.value === 'QR' ? `<img src="${dataUrl}" style="width:180px;height:180px" />` : `<img src="${dataUrl}" style="max-width:320px" />`
  const html = `<!DOCTYPE html><html><head><title>Label: ${label}</title><style>
.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
    body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:white}
    .label{padding:20px;text-align:center;border:1px solid #e5e7eb;border-radius:12px}
    p{margin:8px 0 0;font-size:13px;font-weight:700;color:#374151}
  </style></head><body><div class="label">${tag}<p>${label}</p></div><script>window.onload=()=>window.print()<\/script></body></html>`
  const w = window.open(''); if (w) { w.document.write(html); w.document.close() }
}

function downloadBarcode() {
  const dataUrl = getSvgDataUrl()
  if (!dataUrl) return
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `barcode-${barcodeValue.value}.${barcodeFormat.value === 'QR' ? 'png' : 'svg'}`
  a.click()
}

// ── Batch Print ───────────────────────────────────────────────────────────────
const toggleSelected = (id: any) => {
  const idx = selectedItems.value.indexOf(id)
  if (idx === -1) selectedItems.value.push(id)
  else selectedItems.value.splice(idx, 1)
}

async function printBatch() {
  await loadJsBarcode()
  await loadQrCode()

  const items = (inventory.value as any[]).filter((i: any) => selectedItems.value.includes(i.id))
  const labelHtmlParts = await Promise.all(items.map(async (item: any) => {
    const val = item.sku || String(item.id)
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      ;(window as any).JsBarcode(svg, val, { format: 'CODE128', width: 2, height: 50, displayValue: true, fontSize: 11, margin: 6 })
      const svgStr = new XMLSerializer().serializeToString(svg)
      return `<div class="label"><img src="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}" /><p>${item.name}</p></div>`
    } catch { return `<div class="label"><p style="font-family:monospace;font-size:18px;font-weight:bold">${val}</p><p>${item.name}</p></div>` }
  }))

  const html = `<!DOCTYPE html><html><head><title>Batch Labels</title><style>
    body{margin:0;font-family:system-ui,sans-serif;background:white}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px}
    .label{border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center;break-inside:avoid}
    img{max-width:100%} p{margin:6px 0 0;font-size:11px;font-weight:700;color:#374151}
    @media print{.grid{gap:4px;padding:4px}}
  </style></head><body><div class="grid">${labelHtmlParts.join('')}</div><script>window.onload=()=>window.print()<\/script></body></html>`
  const w = window.open(''); if (w) { w.document.write(html); w.document.close() }
}

// ── Scan Lookup ───────────────────────────────────────────────────────────────
const lookupScan = () => {
  if (!scanValue.value) return
  const q = scanValue.value.toLowerCase().trim()
  const found = (inventory.value as any[]).find((i: any) =>
    i.sku === scanValue.value || String(i.id) === scanValue.value || i.name?.toLowerCase() === q
  )
  scanResult.value = { found: !!found, item: found }
}

const selectInventoryItem = (item: any) => {
  barcodeValue.value = item.sku || String(item.id)
  barcodeLabel.value = item.name
  mode.value = 'Generate'
  nextTick(debouncedGenerate)
}
</script>

<style scoped>
.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.m3-input:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px #06b6d418; }
</style>
