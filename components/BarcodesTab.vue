<template>
  <div class="flex flex-col gap-6">

    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4 mb-2">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
          <i class="mdi mdi-barcode-scan text-2xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-black">Barcodes</h1>
          <p class="text-sm text-muted-foreground mt-1">Generate and scan barcodes for inventory</p>
        </div>
      </div>
      <div class="bg-muted rounded-full p-1 flex gap-1 border">
        <Button
          v-for="m in ['Generate', 'Scan']"
          :key="m"
          :label="m"
          :variant="mode === m ? undefined : 'text'"
          :severity="mode === m ? 'info' : 'secondary'"
          class="rounded-full text-xs font-bold px-6 py-1.5 transition-all text-none"
          @click="mode = m"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Panel: Generate or Scan -->
      <div class="flex flex-col">
        
        <!-- Generate Panel -->
        <div v-if="mode === 'Generate'" class="bg-surface border border-border rounded-xl p-6 flex flex-col flex-grow">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
              <i class="mdi mdi-barcode text-xl"></i>
            </div>
            <h3 class="text-base font-black">Generate Barcode</h3>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Content / SKU</label>
              <InputText
                v-model="barcodeValue"
                placeholder="Enter SKU or item code..."
                class="w-full rounded-xl"
                @input="debouncedGenerate"
              />
            </div>
            
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Label (optional)</label>
              <InputText
                v-model="barcodeLabel"
                placeholder="Product name or description"
                class="w-full rounded-xl"
              />
            </div>
            
            <div class="flex flex-col gap-2">
              <span class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Format</span>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="t in barcodeFormats"
                  :key="t.value"
                  class="px-4 py-1.5 rounded-full text-xs font-bold transition-all border"
                  :class="[
                    barcodeFormat === t.value 
                      ? 'bg-cyan-500 text-white border-cyan-500 dark:bg-cyan-600 dark:border-cyan-600' 
                      : 'bg-cyan-500/10 text-cyan-600 border-transparent dark:text-cyan-400 hover:bg-cyan-500/20'
                  ]"
                  @click="barcodeFormat = t.value; debouncedGenerate()"
                >
                  {{ t.label }}
                </button>
              </div>
            </div>

            <!-- Live barcode preview -->
            <div 
              v-if="barcodeValue" 
              class="mt-4 p-6 flex flex-col align-center items-center justify-center gap-4 bg-surface border rounded-xl" 
              style="border-color: rgba(6,182,212,0.2)"
            >
              <div v-show="barcodeFormat === 'QR'">
                <canvas ref="qrCanvas" class="rounded-lg" />
              </div>
              <svg v-show="barcodeFormat !== 'QR'" ref="barcodeSvg" class="max-w-full" />
              
              <p class="text-sm font-bold text-muted-foreground">{{ barcodeLabel || barcodeValue }}</p>
              <p v-if="barcodeError" class="text-xs font-bold text-red-500">{{ barcodeError }}</p>
              
              <div class="flex gap-3 mt-2">
                <Button 
                  label="Print Label" 
                  icon="mdi mdi-printer" 
                  severity="info" 
                  variant="outlined" 
                  class="rounded-full text-xs text-none" 
                  @click="printBarcode" 
                />
                <Button 
                  label="Download" 
                  icon="mdi mdi-download" 
                  severity="secondary" 
                  class="rounded-full text-xs text-none" 
                  @click="downloadBarcode" 
                />
              </div>
            </div>

            <div 
              v-if="!barcodeValue" 
              class="mt-4 p-8 flex flex-col items-center justify-center gap-2 bg-muted rounded-xl border border-dashed border-border"
            >
              <i class="mdi mdi-barcode text-5xl text-muted"></i>
              <p class="text-sm font-bold text-muted-foreground text-center">Enter a value above to preview your barcode</p>
            </div>
          </div>
        </div>

        <!-- Scan Panel -->
        <div v-if="mode === 'Scan'" class="bg-surface border border-border rounded-xl p-6 flex flex-col flex-grow">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
              <i class="mdi mdi-barcode-scan text-xl"></i>
            </div>
            <h3 class="text-base font-black">Scan / Lookup</h3>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-muted-foreground uppercase tracking-wide">Scan or type SKU</label>
              <div class="flex gap-2">
                <InputText
                  ref="scanInput"
                  v-model="scanValue"
                  placeholder="Scan barcode or enter SKU..."
                  class="flex-1 rounded-xl"
                  autofocus
                  @keyup.enter="lookupScan"
                />
                <Button 
                  label="Lookup" 
                  severity="info" 
                  class="rounded-xl text-xs font-bold px-4" 
                  @click="lookupScan" 
                />
              </div>
            </div>

            <div 
              v-if="scanResult" 
              class="p-5 mt-2 rounded-xl border"
              :class="[
                scanResult.found 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100' 
                  : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100'
              ]"
            >
              <div v-if="scanResult.found" class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <i class="mdi mdi-package-variant-closed text-2xl"></i>
                </div>
                <div>
                  <p class="text-base font-black text-emerald-700 dark:text-emerald-300 leading-tight">{{ scanResult.item?.name }}</p>
                  <p class="text-xs font-semibold opacity-95 mt-1.5">
                    SKU: {{ scanResult.item?.sku }} • Stock: {{ scanResult.item?.stock ?? '—' }} • {{ formatCurrency(scanResult.item?.price) }}
                  </p>
                </div>
              </div>
              <p v-else class="text-sm font-bold flex items-center gap-2 m-0">
                <i class="mdi mdi-close-circle text-lg"></i> No item found for "{{ scanValue }}"
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Inventory Items -->
      <div class="flex flex-col">
        <div class="bg-surface border border-border rounded-xl p-6 flex flex-col h-full" style="max-height: 600px">
          <div class="flex items-center justify-between mb-6 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <i class="mdi mdi-package-variant-closed text-xl"></i>
              </div>
              <h3 class="text-base font-black">Inventory Items</h3>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500">
              {{ inventory.length }}
            </span>
          </div>
          
          <div class="flex-grow overflow-y-auto pr-1">
            <div class="flex flex-col gap-2">
              <div
                v-for="item in inventory"
                :key="item.id"
                class="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                @click="selectInventoryItem(item)"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <i class="mdi mdi-package-variant-closed text-lg"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-bold truncate leading-tight">{{ item.name }}</div>
                    <div class="text-[10px] text-muted-foreground font-mono mt-0.5">{{ item.sku || 'No SKU' }}</div>
                  </div>
                </div>
                <Button 
                  label="Generate" 
                  icon="mdi mdi-barcode" 
                  variant="text" 
                  severity="secondary" 
                  class="text-[11px] rounded-full px-3 py-1 text-none shrink-0" 
                />
              </div>
            </div>
            
            <div v-if="!inventory.length" class="text-center py-12">
              <i class="mdi mdi-package-variant-closed text-5xl text-muted"></i>
              <p class="text-sm font-bold text-muted-foreground">No inventory items yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch generator -->
    <div class="bg-surface border border-border rounded-xl p-6 mt-2">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
            <i class="mdi mdi-layers-outline text-xl"></i>
          </div>
          <h3 class="text-base font-black">Batch Print — Inventory Labels</h3>
        </div>
        <Button
          :label="`Print ${selectedItems.length > 0 ? selectedItems.length : ''} Label${selectedItems.length !== 1 ? 's' : ''}`"
          severity="info"
          class="rounded-full text-xs font-bold px-6 text-none"
          :disabled="selectedItems.length === 0"
          @click="printBatch"
        />
      </div>
      
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in inventory"
          :key="item.id"
          class="px-4.5 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5"
          :class="[
            selectedItems.includes(item.id) 
              ? 'bg-cyan-500 text-white border-cyan-500 dark:bg-cyan-600 dark:border-cyan-600' 
              : 'bg-cyan-500/10 text-cyan-600 border-transparent dark:text-cyan-400 hover:bg-cyan-500/20'
          ]"
          @click="toggleSelected(item.id)"
        >
          <i class="mdi mdi-barcode"></i>
          {{ item.name }}
        </button>
        <p v-if="!inventory.length" class="text-xs font-medium text-muted-foreground py-2">
          No inventory items. Add items to batch print labels.
        </p>
      </div>
    </div>

    <!-- Hidden print frame for batch -->
    <iframe ref="printFrame" class="hidden" />
  </div>
</template>

<script setup lang="ts">
import { printHtmlContent, printBarcodeLabel, printBarcodeBatch } from '~/utils/print'
import { useToast } from '~/composables/useToast'
import { nextTick, ref, computed, watch } from 'vue'
import { useAppStore } from '~/stores/app'

const appStore  = useAppStore()
const inventory = computed(() => appStore.inventory ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$' })
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const { toast } = useToast()

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
  const mod = await import('jsbarcode')
  ;(window as any).JsBarcode = mod.default || mod
  jsBarcodeLoaded = true
}

async function loadQrCode(): Promise<void> {
  if (qrCodeLoaded || (window as any).QRCode) { qrCodeLoaded = true; return }
  const mod = await import('qrcode')
  ;(window as any).QRCode = mod.default || mod
  qrCodeLoaded = true
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
  const label = barcodeLabel.value || barcodeValue.value
  printBarcodeLabel({
    sku: barcodeValue.value,
    name: label,
    format: barcodeFormat.value === 'QR' ? 'QR' : 'CODE128',
  })
  toast.success('Sent to Printer', label)
}

function downloadBarcode() {
  const dataUrl = getSvgDataUrl()
  if (!dataUrl) return
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `barcode-${barcodeValue.value}.${barcodeFormat.value === 'QR' ? 'png' : 'svg'}`
  a.click()
  toast.success('Downloaded', `barcode-${barcodeValue.value}`)
}

// ── Batch Print ───────────────────────────────────────────────────────────────
const toggleSelected = (id: any) => {
  const idx = selectedItems.value.indexOf(id)
  if (idx === -1) selectedItems.value.push(id)
  else selectedItems.value.splice(idx, 1)
}

async function printBatch() {
  const items = (inventory.value as any[]).filter((i: any) => selectedItems.value.includes(i.id))
  
  const payload = items.map((item: any) => ({
    sku: item.sku || String(item.id),
    name: item.name,
    price: item.price,
    currency: settings.value?.currency,
    format: 'CODE128'
  }))

  printBarcodeBatch(payload)
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
