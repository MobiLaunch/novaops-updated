<template>
  <div class="d-flex flex-column gap-6">

    <!-- Header -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-2">
      <div class="d-flex align-center gap-4">
        <v-avatar size="56" color="cyan" variant="tonal" class="rounded-xl">
          <v-icon icon="mdi-barcode-scan" size="28" color="cyan" />
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-black">Barcodes</h1>
          <p class="text-body-2 text-medium-emphasis mb-0 mt-1">Generate and scan barcodes for inventory</p>
        </div>
      </div>
      <div class="bg-surface-variant rounded-pill pa-1 d-flex gap-1">
        <v-btn
          v-for="m in ['Generate', 'Scan']"
          :key="m"
          :variant="mode === m ? 'flat' : 'text'"
          :color="mode === m ? 'cyan' : undefined"
          class="rounded-pill text-none px-6 font-weight-bold"
          size="small"
          @click="mode = m"
        >
          {{ m }}
        </v-btn>
      </div>
    </div>

    <v-row>
      <!-- Left Panel: Generate or Scan -->
      <v-col cols="12" lg="6">
        
        <!-- Generate Panel -->
        <v-card v-if="mode === 'Generate'" class="rounded-xl border pa-6 h-100" elevation="0">
          <div class="d-flex align-center gap-3 mb-6">
            <v-avatar size="36" color="cyan" variant="tonal" class="rounded-lg">
              <v-icon icon="mdi-barcode" size="20" color="cyan" />
            </v-avatar>
            <h3 class="text-subtitle-1 font-weight-black mb-0">Generate Barcode</h3>
          </div>
          
          <div class="d-flex flex-column gap-4">
            <v-text-field
              v-model="barcodeValue"
              label="Content / SKU"
              placeholder="Enter SKU or item code..."
              variant="outlined"
              hide-details
              density="comfortable"
              @input="debouncedGenerate"
            />
            
            <v-text-field
              v-model="barcodeLabel"
              label="Label (optional)"
              placeholder="Product name or description"
              variant="outlined"
              hide-details
              density="comfortable"
            />
            
            <div>
              <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2">Format</p>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="t in barcodeFormats"
                  :key="t.value"
                  :color="barcodeFormat === t.value ? 'cyan' : undefined"
                  :variant="barcodeFormat === t.value ? 'flat' : 'tonal'"
                  class="font-weight-bold cursor-pointer"
                  @click="barcodeFormat = t.value; debouncedGenerate()"
                >
                  {{ t.label }}
                </v-chip>
              </div>
            </div>

            <!-- Live barcode preview -->
            <v-card v-if="barcodeValue" class="mt-4 pa-6 d-flex flex-column align-center gap-4 bg-surface" variant="outlined" style="border-color: rgba(6,182,212,0.2)">
              <div v-show="barcodeFormat === 'QR'">
                <canvas ref="qrCanvas" class="rounded-lg" />
              </div>
              <svg v-show="barcodeFormat !== 'QR'" ref="barcodeSvg" class="max-w-100" />
              
              <p class="text-body-2 font-weight-bold text-medium-emphasis">{{ barcodeLabel || barcodeValue }}</p>
              <p v-if="barcodeError" class="text-caption font-weight-bold text-error">{{ barcodeError }}</p>
              
              <div class="d-flex gap-3 mt-2">
                <v-btn color="cyan" variant="tonal" class="rounded-pill text-none" @click="printBarcode">
                  <v-icon start>mdi-printer</v-icon> Print Label
                </v-btn>
                <v-btn color="surface-variant" variant="flat" class="rounded-pill text-none" @click="downloadBarcode">
                  <v-icon start>mdi-download</v-icon> Download
                </v-btn>
              </div>
            </v-card>

            <v-card v-if="!barcodeValue" class="mt-4 pa-8 d-flex flex-column align-center gap-2 bg-surface-variant" variant="flat" style="border: 2px dashed rgba(var(--v-theme-on-surface), 0.1)">
              <v-icon icon="mdi-barcode" size="48" color="medium-emphasis" class="opacity-50" />
              <p class="text-body-2 font-weight-bold text-medium-emphasis">Enter a value above to preview your barcode</p>
            </v-card>
          </div>
        </v-card>

        <!-- Scan Panel -->
        <v-card v-if="mode === 'Scan'" class="rounded-xl border pa-6 h-100" elevation="0">
          <div class="d-flex align-center gap-3 mb-6">
            <v-avatar size="36" color="cyan" variant="tonal" class="rounded-lg">
              <v-icon icon="mdi-barcode-scan" size="20" color="cyan" />
            </v-avatar>
            <h3 class="text-subtitle-1 font-weight-black mb-0">Scan / Lookup</h3>
          </div>
          
          <div class="d-flex flex-column gap-4">
            <v-text-field
              ref="scanInput"
              v-model="scanValue"
              label="Scan or type SKU"
              placeholder="Scan barcode or enter SKU..."
              variant="outlined"
              hide-details
              density="comfortable"
              autofocus
              @keyup.enter="lookupScan"
            >
              <template #append-inner>
                <v-btn color="cyan" variant="flat" class="rounded-lg text-none" size="small" @click="lookupScan">
                  Lookup
                </v-btn>
              </template>
            </v-text-field>

            <v-card v-if="scanResult" class="pa-5 mt-2 rounded-xl" :color="scanResult.found ? 'success' : 'error'" :variant="'tonal'">
              <div v-if="scanResult.found" class="d-flex align-center gap-4">
                <v-avatar size="48" color="success" class="rounded-lg" variant="flat">
                  <v-icon icon="mdi-package-variant-closed" color="white" />
                </v-avatar>
                <div>
                  <p class="text-subtitle-1 font-weight-black text-success">{{ scanResult.item?.name }}</p>
                  <p class="text-caption font-weight-bold mt-1">
                    SKU: {{ scanResult.item?.sku }} • Stock: {{ scanResult.item?.stock ?? '—' }} • {{ formatCurrency(scanResult.item?.price) }}
                  </p>
                </div>
              </div>
              <p v-else class="text-body-2 font-weight-bold d-flex align-center gap-2">
                <v-icon icon="mdi-close-circle" size="20" /> No item found for "{{ scanValue }}"
              </p>
            </v-card>
          </div>
        </v-card>
      </v-col>

      <!-- Right Panel: Inventory Items -->
      <v-col cols="12" lg="6">
        <v-card class="rounded-xl border pa-6 h-100 d-flex flex-column" elevation="0">
          <div class="d-flex align-center justify-space-between mb-6">
            <div class="d-flex align-center gap-3">
              <v-avatar size="36" color="deep-purple-accent-2" variant="tonal" class="rounded-lg">
                <v-icon icon="mdi-package-variant-closed" size="20" color="deep-purple-accent-2" />
              </v-avatar>
              <h3 class="text-subtitle-1 font-weight-black mb-0">Inventory Items</h3>
            </div>
            <v-chip size="small" color="deep-purple-accent-2" class="font-weight-bold" variant="tonal">
              {{ inventory.length }}
            </v-chip>
          </div>
          
          <div class="flex-grow-1 overflow-y-auto" style="max-height: 500px">
            <v-list lines="two" bg-color="transparent" class="pa-0">
              <v-list-item
                v-for="item in inventory"
                :key="item.id"
                class="rounded-xl mb-2 border"
                :class="{'bg-surface-variant': false}"
                @click="selectInventoryItem(item)"
              >
                <template #prepend>
                  <v-avatar size="40" color="deep-purple-accent-2" variant="tonal" class="rounded-lg">
                    <v-icon icon="mdi-package-variant-closed" size="20" />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold text-body-2">{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium text-caption text-mono">{{ item.sku || 'No SKU' }}</v-list-item-subtitle>
                <template #append>
                  <v-btn size="small" variant="text" color="deep-purple-accent-2" class="text-none">
                    <v-icon start>mdi-barcode</v-icon> Generate
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
            
            <div v-if="!inventory.length" class="text-center py-12">
              <v-icon icon="mdi-package-variant-closed" size="64" color="medium-emphasis" class="opacity-20 mb-4" />
              <p class="text-body-2 font-weight-bold text-medium-emphasis">No inventory items yet</p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Batch generator -->
    <v-card class="rounded-xl border pa-6 mt-2" elevation="0">
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-4">
        <div class="d-flex align-center gap-3">
          <v-avatar size="36" color="cyan" variant="tonal" class="rounded-lg">
            <v-icon icon="mdi-layers-outline" size="20" color="cyan" />
          </v-avatar>
          <h3 class="text-subtitle-1 font-weight-black mb-0">Batch Print — Inventory Labels</h3>
        </div>
        <v-btn
          color="cyan"
          variant="flat"
          class="rounded-pill text-none px-6"
          :disabled="selectedItems.length === 0"
          @click="printBatch"
        >
          Print {{ selectedItems.length > 0 ? selectedItems.length : '' }} Label{{ selectedItems.length !== 1 ? 's' : '' }}
        </v-btn>
      </div>
      
      <div class="d-flex flex-wrap gap-2">
        <v-chip
          v-for="item in inventory"
          :key="item.id"
          :color="selectedItems.includes(item.id) ? 'cyan' : undefined"
          :variant="selectedItems.includes(item.id) ? 'flat' : 'tonal'"
          class="font-weight-bold cursor-pointer"
          @click="toggleSelected(item.id)"
        >
          <v-icon start>mdi-barcode</v-icon>
          {{ item.name }}
        </v-chip>
        <p v-if="!inventory.length" class="text-caption font-weight-medium text-medium-emphasis py-2">
          No inventory items. Add items to batch print labels.
        </p>
      </div>
    </v-card>

    <!-- Hidden print frame for batch -->
    <iframe ref="printFrame" class="d-none" />
  </div>
</template>

<script setup lang="ts">
import { printHtmlContent, printBarcodeLabel, printBarcodeBatch } from '~/utils/print'
import { useToast } from '~/composables/useToast'

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
  
  // Build our standardized payload objects
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

<style scoped>
.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.m3-input:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px #06b6d418; }
</style>
