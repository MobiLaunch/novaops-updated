<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold">Barcode Scanner & Printer</h2>
        <p class="text-sm text-muted-foreground mt-1">Scan barcodes to look up inventory, or print labels for any item.</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="openPrintQueue" :disabled="printQueue.length === 0">
          <Printer class="w-4 h-4 mr-2" />
          Print Queue
          <span v-if="printQueue.length > 0" class="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{{ printQueue.length }}</span>
        </Button>
        <Button @click="scannerOpen = true">
          <ScanLine class="w-4 h-4 mr-2" />
          Open Scanner
        </Button>
      </div>
    </div>

    <!-- Mode Tabs -->
    <div class="flex gap-1 p-1 bg-muted rounded-lg w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2 rounded-md text-sm font-medium transition-all',
          activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ── SCAN TAB ── -->
    <div v-if="activeTab === 'scan'" class="space-y-4">
      <!-- Manual barcode entry -->
      <Card>
        <CardContent class="p-5">
          <div class="flex gap-3 items-end">
            <div class="flex-1 space-y-2">
              <Label>Scan or Type Barcode / SKU</Label>
              <div class="relative">
                <ScanLine class="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  ref="scanInput"
                  v-model="scanQuery"
                  class="pl-9 font-mono text-base"
                  placeholder="Focus here, then scan with your scanner…"
                  @keyup.enter="performScan"
                  autofocus
                />
              </div>
            </div>
            <Button @click="performScan" :disabled="!scanQuery.trim()">Lookup</Button>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            💡 USB / Bluetooth barcode scanners act as a keyboard — just focus this field and scan.
          </p>
        </CardContent>
      </Card>

      <!-- Scan Result -->
      <div v-if="scanResult !== null">
        <!-- Found -->
        <Card v-if="scanResult" class="border-emerald-500/30 bg-emerald-500/5">
          <CardContent class="p-5">
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Package class="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-lg">{{ scanResult.name }}</p>
                    <Badge :class="scanResult.stock <= scanResult.low ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'">
                      {{ scanResult.stock }} in stock
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground font-mono">SKU: {{ scanResult.sku }}</p>
                  <p class="text-sm text-muted-foreground">{{ scanResult.category || 'Uncategorized' }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-emerald-500">{{ formatCurrency(scanResult.price) }}</p>
                <p class="text-sm text-muted-foreground">Cost: {{ formatCurrency(scanResult.cost) }}</p>
                <div class="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" @click="addToPrintQueue(scanResult)">
                    <Printer class="w-3 h-3 mr-1" />
                    Print Label
                  </Button>
                  <Button size="sm" variant="outline" @click="editInventoryItem(scanResult)">
                    <Pencil class="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Not Found -->
        <Card v-else class="border-amber-500/30 bg-amber-500/5">
          <CardContent class="p-5 flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Search class="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p class="font-semibold text-amber-600">No item found for "{{ lastScanned }}"</p>
              <p class="text-sm text-muted-foreground">That barcode or SKU isn't in your inventory.</p>
            </div>
            <Button variant="outline" size="sm" class="ml-auto flex-shrink-0" @click="createFromScan">
              <Plus class="w-3 h-3 mr-1" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Scans -->
      <Card v-if="recentScans.length > 0">
        <CardHeader>
          <CardTitle class="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Scans</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div
            v-for="scan in recentScans"
            :key="scan.ts"
            class="flex items-center gap-3 px-5 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
            @click="quickLookup(scan.sku)"
          >
            <div :class="['w-2 h-2 rounded-full flex-shrink-0', scan.found ? 'bg-emerald-500' : 'bg-red-400']" />
            <span class="font-mono text-sm flex-1">{{ scan.sku }}</span>
            <span v-if="scan.name" class="text-sm text-muted-foreground flex-1">{{ scan.name }}</span>
            <span v-else class="text-sm text-red-400">Not found</span>
            <span class="text-xs text-muted-foreground flex-shrink-0">{{ formatTime(scan.ts) }}</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ── PRINT TAB ── -->
    <div v-if="activeTab === 'print'" class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Label Builder -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Tag class="w-5 h-5 text-primary" />
              Label Builder
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Label Type</Label>
              <Select v-model="labelConfig.type">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory / Price Tag</SelectItem>
                  <SelectItem value="ticket">Repair Ticket</SelectItem>
                  <SelectItem value="asset">Asset Tag</SelectItem>
                  <SelectItem value="shipping">Shipping Label</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Barcode Format</Label>
              <Select v-model="labelConfig.barcodeFormat">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODE128">Code 128 (recommended)</SelectItem>
                  <SelectItem value="CODE39">Code 39</SelectItem>
                  <SelectItem value="EAN13">EAN-13</SelectItem>
                  <SelectItem value="QR">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Label Size</Label>
              <Select v-model="labelConfig.size">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x1">2" × 1" (small)</SelectItem>
                  <SelectItem value="2x1.5">2" × 1.5" (medium)</SelectItem>
                  <SelectItem value="2x2">2" × 2" (square)</SelectItem>
                  <SelectItem value="4x2">4" × 2" (large)</SelectItem>
                  <SelectItem value="4x6">4" × 6" (shipping)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="showPrice" v-model="labelConfig.showPrice" class="w-4 h-4 rounded" />
                <Label for="showPrice" class="cursor-pointer">Show Price</Label>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="showSku" v-model="labelConfig.showSku" class="w-4 h-4 rounded" />
                <Label for="showSku" class="cursor-pointer">Show SKU</Label>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="showName" v-model="labelConfig.showName" class="w-4 h-4 rounded" />
                <Label for="showName" class="cursor-pointer">Show Name</Label>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="showBiz" v-model="labelConfig.showBiz" class="w-4 h-4 rounded" />
                <Label for="showBiz" class="cursor-pointer">Show Business</Label>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Custom Text (optional)</Label>
              <Input v-model="labelConfig.customText" placeholder="e.g. 90-Day Warranty" />
            </div>

            <div class="space-y-2">
              <Label>Copies per Label</Label>
              <Input v-model.number="labelConfig.copies" type="number" min="1" max="100" />
            </div>
          </CardContent>
        </Card>

        <!-- Label Preview -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Eye class="w-5 h-5 text-cyan-500" />
              Label Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col items-center gap-4">
              <!-- Preview Box -->
              <div
                class="border-2 border-dashed border-border rounded-lg bg-white text-black p-3 flex flex-col items-center justify-between gap-1 shadow-sm"
                :style="getLabelPreviewStyle()"
              >
                <div v-if="labelConfig.showBiz" class="text-xs font-bold tracking-wide text-center" style="font-size:9px">
                  {{ settings?.businessName || 'NovaOps Repair' }}
                </div>
                <div v-if="labelConfig.showName" class="font-bold text-center leading-tight" style="font-size:11px;max-width:100%">
                  {{ previewItem?.name || 'Item Name' }}
                </div>
                <!-- Barcode placeholder -->
                <div class="w-full flex justify-center my-0.5">
                  <canvas :id="`preview-barcode`" style="max-width:100%;height:32px"></canvas>
                </div>
                <div v-if="labelConfig.showSku" class="font-mono" style="font-size:8px">
                  {{ previewItem?.sku || 'SKU-00000' }}
                </div>
                <div v-if="labelConfig.showPrice" class="font-bold" style="font-size:13px">
                  {{ previewItem ? formatCurrency(previewItem.price) : '$0.00' }}
                </div>
                <div v-if="labelConfig.customText" class="text-center" style="font-size:8px;color:#555">
                  {{ labelConfig.customText }}
                </div>
              </div>

              <div class="text-xs text-muted-foreground text-center">
                {{ labelConfig.size }} label · {{ labelConfig.copies }} cop{{ labelConfig.copies === 1 ? 'y' : 'ies' }}
              </div>

              <!-- Item picker -->
              <div class="w-full space-y-2">
                <Label class="text-xs">Preview with item:</Label>
                <Select v-model="previewItemId" @update:modelValue="updatePreview">
                  <SelectTrigger class="text-sm">
                    <SelectValue placeholder="Select an item to preview…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="item in inventory" :key="item.id" :value="String(item.id)">
                      {{ item.name }} — {{ item.sku }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="flex gap-2 w-full">
                <Button variant="outline" class="flex-1" @click="addPreviewToPrintQueue" :disabled="!previewItem">
                  <Plus class="w-4 h-4 mr-2" />
                  Add to Queue
                </Button>
                <Button class="flex-1" @click="printPreviewNow" :disabled="!previewItem">
                  <Printer class="w-4 h-4 mr-2" />
                  Print Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Bulk Print -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Layers class="w-5 h-5 text-purple-500" />
            Bulk Print from Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex gap-3 mb-4">
            <Input v-model="bulkSearch" placeholder="Filter items…" class="max-w-xs" />
            <Button variant="outline" size="sm" @click="selectAllFiltered">Select All</Button>
            <Button variant="outline" size="sm" @click="clearSelection">Clear</Button>
            <Button size="sm" @click="addSelectedToPrintQueue" :disabled="selectedItems.size === 0">
              <Printer class="w-4 h-4 mr-2" />
              Queue Selected ({{ selectedItems.size }})
            </Button>
          </div>
          <div class="border rounded-lg overflow-hidden">
            <div
              v-for="item in filteredBulkInventory"
              :key="item.id"
              class="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
              @click="toggleItemSelect(item.id)"
            >
              <input
                type="checkbox"
                :checked="selectedItems.has(item.id)"
                class="w-4 h-4 rounded"
                @click.stop="toggleItemSelect(item.id)"
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm truncate">{{ item.name }}</p>
                <p class="text-xs text-muted-foreground font-mono">{{ item.sku }}</p>
              </div>
              <span class="text-sm font-semibold">{{ formatCurrency(item.price) }}</span>
              <Badge variant="outline" class="text-xs">{{ item.stock }} units</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- ── GENERATE TAB ── -->
    <div v-if="activeTab === 'generate'" class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Barcode class="w-5 h-5 text-amber-500" />
            Generate Barcodes
          </CardTitle>
          <CardDescription>Create barcodes for items that don't have one yet, or generate standalone barcodes.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Barcode Value</Label>
              <Input v-model="genBarcode.value" placeholder="e.g. SKU-12345 or any text" />
            </div>
            <div class="space-y-2">
              <Label>Format</Label>
              <Select v-model="genBarcode.format">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODE128">Code 128</SelectItem>
                  <SelectItem value="CODE39">Code 39</SelectItem>
                  <SelectItem value="EAN13">EAN-13</SelectItem>
                  <SelectItem value="QR">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button @click="generateBarcode" :disabled="!genBarcode.value.trim()">
            <Barcode class="w-4 h-4 mr-2" />
            Generate
          </Button>

          <!-- Generated barcode display -->
          <div v-if="genBarcode.generated" class="flex flex-col items-center gap-4 p-6 border rounded-xl bg-white">
            <canvas id="gen-barcode-canvas" class="max-w-full"></canvas>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="downloadBarcode">
                <Download class="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button size="sm" @click="printGeneratedBarcode">
                <Printer class="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Auto-generate for inventory items without barcodes -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Auto-Assign Barcodes to Inventory</CardTitle>
          <CardDescription>Items below have no SKU or barcode. Generate and assign them automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="itemsWithoutSku.length === 0" class="text-center py-8 text-muted-foreground">
            <CheckCircle class="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p>All inventory items have SKUs assigned!</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="item in itemsWithoutSku" :key="item.id" class="flex items-center gap-3 p-3 rounded-lg border">
              <div class="flex-1">
                <p class="font-medium text-sm">{{ item.name }}</p>
                <p class="text-xs text-muted-foreground">No SKU assigned</p>
              </div>
              <Button size="sm" variant="outline" @click="autoAssignSku(item)">
                <Wand2 class="w-3 h-3 mr-1" />
                Auto-Assign
              </Button>
            </div>
            <Button class="w-full mt-2" variant="outline" @click="autoAssignAll">
              <Wand2 class="w-4 h-4 mr-2" />
              Auto-Assign All ({{ itemsWithoutSku.length }})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Print Queue Dialog -->
    <Dialog v-model:open="printQueueOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Printer class="w-5 h-5 text-primary" />
            Print Queue ({{ printQueue.length }} label{{ printQueue.length !== 1 ? 's' : '' }})
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-3 py-4 max-h-96 overflow-y-auto">
          <div v-if="printQueue.length === 0" class="text-center py-8 text-muted-foreground">
            Queue is empty. Add items from the Print tab.
          </div>
          <div
            v-for="(qItem, idx) in printQueue"
            :key="idx"
            class="flex items-center gap-3 p-3 rounded-lg border"
          >
            <div class="flex-1">
              <p class="font-medium text-sm">{{ qItem.item.name }}</p>
              <p class="text-xs text-muted-foreground font-mono">{{ qItem.item.sku }}</p>
            </div>
            <div class="flex items-center gap-2">
              <Label class="text-xs text-muted-foreground">Qty:</Label>
              <Input
                v-model.number="qItem.copies"
                type="number"
                min="1"
                max="999"
                class="w-16 h-7 text-sm"
              />
            </div>
            <Button variant="ghost" size="icon" class="h-7 w-7 text-destructive" @click="printQueue.splice(idx, 1)">
              <X class="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div class="flex gap-3 pt-2 border-t">
          <Button variant="outline" @click="printQueue = []" :disabled="printQueue.length === 0">Clear All</Button>
          <Button class="flex-1" @click="printAllQueued" :disabled="printQueue.length === 0">
            <Printer class="w-4 h-4 mr-2" />
            Print All Labels
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Camera Scanner Dialog -->
    <Dialog v-model:open="scannerOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <ScanLine class="w-5 h-5 text-primary" />
            Camera Scanner
          </DialogTitle>
        </DialogHeader>
        <div class="py-4 space-y-4">
          <div class="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            <video ref="cameraFeed" class="w-full h-full object-cover" autoplay playsinline></video>
            <!-- Aim overlay -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-48 h-32 border-2 border-primary rounded-lg relative">
                <div class="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl" />
                <div class="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr" />
                <div class="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl" />
                <div class="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br" />
              </div>
            </div>
          </div>
          <p class="text-sm text-muted-foreground text-center">Position the barcode within the frame. Scanning uses your device camera.</p>
          <p class="text-xs text-amber-600 bg-amber-500/10 rounded-lg px-3 py-2 text-center">Camera scanning requires the <strong>ZXing</strong> or <strong>QuaggaJS</strong> library to be configured. USB scanners work without this — just focus the input on the Scan tab.</p>
          <Button variant="outline" class="w-full" @click="stopCamera">Close Camera</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Edit Item Dialog (quick edit from scan result) -->
    <Dialog v-model:open="editItemOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit: {{ editingItem?.name }}</DialogTitle>
        </DialogHeader>
        <div v-if="editingItem" class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5 col-span-2">
              <Label>Name</Label>
              <Input v-model="editingItem.name" />
            </div>
            <div class="space-y-1.5">
              <Label>SKU / Barcode</Label>
              <Input v-model="editingItem.sku" class="font-mono" />
            </div>
            <div class="space-y-1.5">
              <Label>Category</Label>
              <Input v-model="(editingItem as any).category" />
            </div>
            <div class="space-y-1.5">
              <Label>Stock</Label>
              <Input v-model.number="editingItem.stock" type="number" />
            </div>
            <div class="space-y-1.5">
              <Label>Low Stock Alert</Label>
              <Input v-model.number="editingItem.low" type="number" />
            </div>
            <div class="space-y-1.5">
              <Label>Cost</Label>
              <Input v-model.number="editingItem.cost" type="number" step="0.01" />
            </div>
            <div class="space-y-1.5">
              <Label>Price</Label>
              <Input v-model.number="editingItem.price" type="number" step="0.01" />
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <Button variant="outline" class="flex-1" @click="editItemOpen = false">Cancel</Button>
            <Button class="flex-1" @click="saveEditedItem">Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import type { InventoryItem } from '~/types'
import {
  ScanLine, Printer, Package, Search, Plus, Tag, Eye, Layers, Barcode,
  Pencil, X, Download, CheckCircle, Wand2
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { inventory, settings } = storeToRefs(appStore)
const { saveAll } = appStore

// ── Tabs ──────────────────────────────────────────
const tabs = [
  { id: 'scan',     label: '🔍 Scan' },
  { id: 'print',    label: '🖨 Print Labels' },
  { id: 'generate', label: '📊 Generate' },
]
const activeTab = ref('scan')

// ── Scan logic ────────────────────────────────────
const scanQuery    = ref('')
const scanResult   = ref<InventoryItem | null | undefined>(undefined) // undefined = not searched yet
const lastScanned  = ref('')
const recentScans  = ref<{ sku: string; name?: string; found: boolean; ts: number }[]>([])
const scanInput    = ref<HTMLInputElement | null>(null)

function performScan() {
  const q = scanQuery.value.trim()
  if (!q) return
  lastScanned.value = q
  quickLookup(q)
  scanQuery.value = ''
}

function quickLookup(q: string) {
  const lower = q.toLowerCase()
  const found = (inventory.value || []).find(item =>
    item.sku?.toLowerCase() === lower ||
    item.name?.toLowerCase() === lower ||
    String(item.id) === lower
  ) ?? null
  scanResult.value = found
  recentScans.value.unshift({ sku: q, name: found?.name, found: !!found, ts: Date.now() })
  if (recentScans.value.length > 10) recentScans.value.pop()
}

const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`

// ── Print Queue ───────────────────────────────────
const printQueueOpen = ref(false)
const printQueue     = ref<{ item: InventoryItem; copies: number }[]>([])

function addToPrintQueue(item: InventoryItem) {
  const existing = printQueue.value.find(q => q.item.id === item.id)
  if (existing) { existing.copies += labelConfig.value.copies; }
  else printQueue.value.push({ item, copies: labelConfig.value.copies })
  printQueueOpen.value = true
}

function openPrintQueue() { printQueueOpen.value = true }

function printAllQueued() {
  // Build a print-ready HTML page with all labels
  const html = buildPrintHTML(printQueue.value.flatMap(q => Array(q.copies).fill(q.item)))
  openPrintWindow(html)
}

// ── Label Config ──────────────────────────────────
const labelConfig = ref({
  type:          'inventory',
  barcodeFormat: 'CODE128',
  size:          '2x1.5',
  showPrice:     true,
  showSku:       true,
  showName:      true,
  showBiz:       true,
  customText:    '',
  copies:        1,
})

const previewItemId = ref('')
const previewItem   = computed(() => inventory.value?.find(i => String(i.id) === previewItemId.value) ?? null)

function getLabelPreviewStyle() {
  const sizes: Record<string, { width: string; height: string }> = {
    '2x1':   { width: '160px', height: '80px' },
    '2x1.5': { width: '160px', height: '120px' },
    '2x2':   { width: '160px', height: '160px' },
    '4x2':   { width: '220px', height: '110px' },
    '4x6':   { width: '220px', height: '330px' },
  }
  return sizes[labelConfig.value.size] || sizes['2x1.5']
}

function updatePreview() { /* barcode canvas rendering would go here with JsBarcode */ }
function addPreviewToPrintQueue() { if (previewItem.value) addToPrintQueue(previewItem.value) }
function printPreviewNow() {
  if (!previewItem.value) return
  const html = buildPrintHTML(Array(labelConfig.value.copies).fill(previewItem.value))
  openPrintWindow(html)
}

// ── Bulk Print ────────────────────────────────────
const bulkSearch    = ref('')
const selectedItems = ref<Set<number>>(new Set())

const filteredBulkInventory = computed(() =>
  (inventory.value || []).filter(i =>
    !bulkSearch.value ||
    i.name.toLowerCase().includes(bulkSearch.value.toLowerCase()) ||
    (i.sku || '').toLowerCase().includes(bulkSearch.value.toLowerCase())
  )
)

function toggleItemSelect(id: number) {
  if (selectedItems.value.has(id)) selectedItems.value.delete(id)
  else selectedItems.value.add(id)
  selectedItems.value = new Set(selectedItems.value)
}

function selectAllFiltered() {
  filteredBulkInventory.value.forEach(i => selectedItems.value.add(i.id))
  selectedItems.value = new Set(selectedItems.value)
}
function clearSelection() { selectedItems.value = new Set() }

function addSelectedToPrintQueue() {
  const items = (inventory.value || []).filter(i => selectedItems.value.has(i.id))
  items.forEach(item => addToPrintQueue(item))
  clearSelection()
}

// ── Barcode Generator ─────────────────────────────
const genBarcode = ref({ value: '', format: 'CODE128', generated: false })

function generateBarcode() {
  genBarcode.value.generated = true
  // JsBarcode would render to #gen-barcode-canvas here
}

function downloadBarcode() {
  const canvas = document.getElementById('gen-barcode-canvas') as HTMLCanvasElement
  if (!canvas) return
  const link = document.createElement('a')
  link.download = `barcode-${genBarcode.value.value}.png`
  link.href = canvas.toDataURL()
  link.click()
}

function printGeneratedBarcode() {
  const canvas = document.getElementById('gen-barcode-canvas') as HTMLCanvasElement
  if (!canvas) return
  const html = `<html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${canvas.toDataURL()}" style="max-width:100%"/></body></html>`
  openPrintWindow(html)
}

// ── Auto-assign SKU ───────────────────────────────
const itemsWithoutSku = computed(() =>
  (inventory.value || []).filter(i => !i.sku || i.sku.trim() === '')
)

function autoAssignSku(item: InventoryItem) {
  const prefix = item.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase()
  item.sku = `${prefix}-${String(item.id).padStart(5, '0')}`
  saveAll()
}

function autoAssignAll() {
  itemsWithoutSku.value.forEach(item => autoAssignSku(item))
}

// ── Quick Edit from Scan ──────────────────────────
const editItemOpen  = ref(false)
const editingItem   = ref<InventoryItem | null>(null)

function editInventoryItem(item: InventoryItem) {
  editingItem.value = { ...item }
  editItemOpen.value = true
}

function saveEditedItem() {
  if (!editingItem.value) return
  const idx = (inventory.value || []).findIndex(i => i.id === editingItem.value!.id)
  if (idx > -1) { inventory.value[idx] = { ...editingItem.value } }
  saveAll()
  editItemOpen.value = false
  // Refresh scan result
  if (scanResult.value?.id === editingItem.value.id) scanResult.value = { ...editingItem.value }
}

function createFromScan() {
  // Pre-fill new item dialog with the scanned value as SKU
  navigateTo('/inventory')
}

// ── Camera Scanner ────────────────────────────────
const scannerOpen = ref(false)
const cameraFeed  = ref<HTMLVideoElement | null>(null)

watch(scannerOpen, async (open) => {
  if (open) {
    await nextTick()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (cameraFeed.value) cameraFeed.value.srcObject = stream
    } catch { /* camera permission denied */ }
  } else stopCamera()
})

function stopCamera() {
  if (cameraFeed.value?.srcObject) {
    const tracks = (cameraFeed.value.srcObject as MediaStream).getTracks()
    tracks.forEach(t => t.stop())
  }
  scannerOpen.value = false
}

// ── Print HTML Builder ────────────────────────────
function buildPrintHTML(items: InventoryItem[]): string {
  const cfg = labelConfig.value
  const [w, h] = cfg.size.split('x').map(Number)
  const labelsHtml = items.map(item => `
    <div class="label" style="width:${w}in;height:${h}in">
      ${cfg.showBiz ? `<div class="biz">${settings.value?.businessName || 'NovaOps'}</div>` : ''}
      ${cfg.showName ? `<div class="name">${item.name}</div>` : ''}
      <div class="sku-bar">${item.sku || String(item.id)}</div>
      ${cfg.showSku ? `<div class="sku">${item.sku}</div>` : ''}
      ${cfg.showPrice ? `<div class="price">${formatCurrency(item.price)}</div>` : ''}
      ${cfg.customText ? `<div class="custom">${cfg.customText}</div>` : ''}
    </div>
  `).join('')

  return `<!DOCTYPE html><html><head>
    <style>
      @page { margin: 0.25in }
      body { margin: 0; font-family: sans-serif; }
      .grid { display: flex; flex-wrap: wrap; gap: 4px; }
      .label { border: 1px solid #ccc; padding: 4px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; box-sizing: border-box; page-break-inside: avoid; }
      .biz { font-size: 7px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
      .name { font-size: 9px; font-weight: bold; text-align: center; line-height: 1.2; }
      .sku-bar { font-family: 'Libre Barcode 128', monospace; font-size: 24px; line-height: 1; }
      .sku { font-size: 7px; font-family: monospace; }
      .price { font-size: 14px; font-weight: bold; }
      .custom { font-size: 6px; color: #555; }
    </style>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap">
  </head><body onload="window.print()">
    <div class="grid">${labelsHtml}</div>
  </body></html>`
}

function openPrintWindow(html: string) {
  const win = window.open('', '_blank', 'width=800,height=600')
  if (win) { win.document.write(html); win.document.close() }
}
</script>
