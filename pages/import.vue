<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold">CSV Import</h2>
      <p class="text-sm text-muted-foreground mt-1">Bulk-import inventory items or customers from a CSV or spreadsheet export.</p>
    </div>

    <!-- Mode tabs -->
    <div class="flex gap-1 p-1 bg-muted rounded-lg w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="switchTab(tab.id)"
        :class="[
          'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
          activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ── UPLOAD AREA ── -->
    <Card v-if="stage === 'upload'">
      <CardContent class="p-6 space-y-5">
        <!-- Drop zone -->
        <div
          class="border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer"
          :class="isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
        >
          <div class="flex flex-col items-center gap-3">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center" :class="isDragging ? 'bg-primary/10' : 'bg-muted'">
              <Upload class="w-7 h-7" :class="isDragging ? 'text-primary' : 'text-muted-foreground'" />
            </div>
            <div>
              <p class="font-semibold">Drop your CSV file here</p>
              <p class="text-sm text-muted-foreground mt-1">or click to browse — .csv, .tsv, .txt supported</p>
            </div>
          </div>
          <input ref="fileInput" type="file" accept=".csv,.tsv,.txt" class="hidden" @change="handleFileSelect" />
        </div>

        <!-- Format guide -->
        <div class="rounded-xl border overflow-hidden">
          <div class="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
            <FileText class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-semibold">Expected CSV Format — {{ activeTab === 'inventory' ? 'Inventory' : 'Customers' }}</span>
            <Button variant="ghost" size="sm" class="ml-auto h-7 text-xs" @click="downloadTemplate">
              <Download class="w-3 h-3 mr-1" />
              Download Template
            </Button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-muted/30">
                <tr>
                  <th v-for="col in activeColumns" :key="col.key" class="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">
                    {{ col.label }}
                    <span v-if="col.required" class="text-destructive ml-0.5">*</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-t">
                  <td v-for="col in activeColumns" :key="col.key" class="px-3 py-2 text-muted-foreground font-mono whitespace-nowrap">
                    {{ col.example }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="px-4 py-2 text-xs text-muted-foreground border-t">* Required fields. Column order doesn't matter — we'll detect headers automatically.</p>
        </div>

        <!-- Paste option -->
        <div class="space-y-2">
          <Label>Or paste CSV data directly:</Label>
          <Textarea
            v-model="pastedCsv"
            :rows="5"
            placeholder="name,phone,email&#10;John Doe,555-1234,john@example.com&#10;…"
            class="font-mono text-xs"
          />
          <Button variant="outline" @click="parsePasted" :disabled="!pastedCsv.trim()">
            <Table2 class="w-4 h-4 mr-2" />
            Parse Pasted Data
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- ── MAPPING STAGE ── -->
    <div v-if="stage === 'mapping'" class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ArrowLeftRight class="w-5 h-5 text-primary" />
            Map CSV Columns
          </CardTitle>
          <CardDescription>
            We detected {{ parsedRows.length }} rows and {{ csvHeaders.length }} columns.
            Match your CSV columns to NovaOps fields.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-for="field in activeColumns" :key="field.key" class="flex items-center gap-4">
            <div class="w-40 flex-shrink-0">
              <p class="text-sm font-medium">{{ field.label }}
                <span v-if="field.required" class="text-destructive text-xs"> *</span>
              </p>
              <p class="text-xs text-muted-foreground">{{ field.description }}</p>
            </div>
            <div class="text-muted-foreground flex-shrink-0">→</div>
            <Select v-model="columnMapping[field.key]">
              <SelectTrigger class="flex-1 max-w-xs">
                <SelectValue placeholder="Skip this field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__skip__">— Skip —</SelectItem>
                <SelectItem v-for="h in csvHeaders" :key="h" :value="h">{{ h }}</SelectItem>
              </SelectContent>
            </Select>
            <div class="text-xs text-muted-foreground min-w-24">
              Preview: <span class="font-mono">{{ getPreviewValue(field.key) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Duplicate handling -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-amber-500" />
            Duplicate Handling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex gap-3 flex-wrap">
            <label v-for="opt in duplicateOptions" :key="opt.value" class="flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-all" :class="duplicateMode === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'">
              <input type="radio" :value="opt.value" v-model="duplicateMode" class="w-4 h-4" />
              <div>
                <p class="text-sm font-medium">{{ opt.label }}</p>
                <p class="text-xs text-muted-foreground">{{ opt.desc }}</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <div class="flex gap-3">
        <Button variant="outline" @click="stage = 'upload'">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button @click="runPreview" :disabled="!requiredFieldsMapped">
          Preview Import →
        </Button>
      </div>
    </div>

    <!-- ── PREVIEW STAGE ── -->
    <div v-if="stage === 'preview'" class="space-y-4">
      <!-- Summary bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent class="p-4 text-center">
            <p class="text-2xl font-bold text-emerald-500">{{ previewStats.willImport }}</p>
            <p class="text-xs text-muted-foreground mt-1">Will Import</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4 text-center">
            <p class="text-2xl font-bold text-amber-500">{{ previewStats.duplicates }}</p>
            <p class="text-xs text-muted-foreground mt-1">Duplicates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4 text-center">
            <p class="text-2xl font-bold text-red-500">{{ previewStats.errors }}</p>
            <p class="text-xs text-muted-foreground mt-1">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4 text-center">
            <p class="text-2xl font-bold">{{ parsedRows.length }}</p>
            <p class="text-xs text-muted-foreground mt-1">Total Rows</p>
          </CardContent>
        </Card>
      </div>

      <!-- Preview table -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="text-base">Preview (first 50 rows)</CardTitle>
            <div class="flex gap-2">
              <Badge
                v-for="filter in ['all','ok','duplicate','error']"
                :key="filter"
                :variant="previewFilter === filter ? 'default' : 'outline'"
                class="cursor-pointer capitalize"
                @click="previewFilter = filter as any"
              >
                {{ filter }}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent class="p-0 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/30">
              <tr>
                <th class="text-left px-4 py-2 text-xs font-semibold text-muted-foreground w-8">#</th>
                <th class="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Status</th>
                <th v-for="col in activeColumns.filter(c => columnMapping[c.key] && columnMapping[c.key] !== '__skip__')" :key="col.key" class="text-left px-4 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr
                v-for="(row, idx) in filteredPreviewRows"
                :key="idx"
                :class="row._status === 'error' ? 'bg-red-500/5' : row._status === 'duplicate' ? 'bg-amber-500/5' : ''"
              >
                <td class="px-4 py-2 text-xs text-muted-foreground">{{ idx + 1 }}</td>
                <td class="px-4 py-2">
                  <Badge
                    :class="{
                      'bg-emerald-500/10 text-emerald-500': row._status === 'ok',
                      'bg-amber-500/10 text-amber-600': row._status === 'duplicate',
                      'bg-red-500/10 text-red-500': row._status === 'error',
                    }"
                    class="text-xs capitalize"
                  >
                    {{ row._status }}
                  </Badge>
                  <span v-if="row._error" class="text-xs text-red-500 ml-2">{{ row._error }}</span>
                </td>
                <td
                  v-for="col in activeColumns.filter(c => columnMapping[c.key] && columnMapping[c.key] !== '__skip__')"
                  :key="col.key"
                  class="px-4 py-2 text-sm"
                >
                  {{ row[col.key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div class="flex gap-3">
        <Button variant="outline" @click="stage = 'mapping'">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back to Mapping
        </Button>
        <Button @click="executeImport" :disabled="previewStats.willImport === 0 || isImporting" class="flex-1 max-w-xs">
          <CheckCircle class="w-4 h-4 mr-2" />
          {{ isImporting ? 'Importing...' : `Import ${previewStats.willImport} Records` }}
        </Button>
      </div>
    </div>

    <!-- ── DONE STAGE ── -->
    <Card v-if="stage === 'done'" class="border-emerald-500/30 bg-emerald-500/5">
      <CardContent class="p-8 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle class="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <h3 class="text-xl font-bold">Import Complete!</h3>
          <p class="text-muted-foreground mt-1">
            Successfully imported <strong class="text-foreground">{{ importResult.imported }}</strong> records.
            <span v-if="importResult.skipped > 0"> Skipped {{ importResult.skipped }} duplicates.</span>
          </p>
        </div>
        <div class="flex gap-3 justify-center">
          <Button variant="outline" @click="resetImport">Import Another File</Button>
          <Button @click="navigateTo(activeTab === 'inventory' ? '/inventory' : '/customers')">
            View {{ activeTab === 'inventory' ? 'Inventory' : 'Customers' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import {
  Upload, FileText, Download, ArrowLeftRight, ArrowLeft, AlertTriangle,
  CheckCircle, Package, Users, Table2
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { inventory, customers, settings } = storeToRefs(appStore)
const { createInventoryItem, updateInventoryItem, createCustomer, updateCustomer } = appStore

// ── Tabs ──────────────────────────────────────────
const tabs = [
  { id: 'inventory', label: 'Inventory',  icon: Package },
  { id: 'customers', label: 'Customers',  icon: Users },
]
const activeTab = ref<'inventory' | 'customers'>('inventory')

const INVENTORY_COLUMNS = [
  { key: 'name',     label: 'Name',        required: true,  description: 'Item name',           example: 'iPhone 15 Screen' },
  { key: 'sku',      label: 'SKU',         required: true,  description: 'Barcode / SKU',        example: 'SCR-IP15-BLK' },
  { key: 'category', label: 'Category',    required: false, description: 'Parts / Tools / etc.', example: 'Parts' },
  { key: 'stock',    label: 'Stock',       required: false, description: 'Current quantity',     example: '10' },
  { key: 'low',      label: 'Low Alert',   required: false, description: 'Low stock threshold',  example: '3' },
  { key: 'cost',     label: 'Cost',        required: false, description: 'Purchase cost',        example: '29.99' },
  { key: 'price',    label: 'Sell Price',  required: false, description: 'Selling price',        example: '89.99' },
]

const CUSTOMER_COLUMNS = [
  { key: 'name',    label: 'Full Name',  required: true,  description: 'Customer full name', example: 'Jane Smith' },
  { key: 'phone',   label: 'Phone',      required: true,  description: 'Primary phone',      example: '555-123-4567' },
  { key: 'email',   label: 'Email',      required: false, description: 'Email address',      example: 'jane@example.com' },
  { key: 'address', label: 'Address',    required: false, description: 'Street address',     example: '123 Main St' },
  { key: 'notes',   label: 'Notes',      required: false, description: 'Any extra notes',    example: 'Preferred customer' },
]

const activeColumns = computed(() => activeTab.value === 'inventory' ? INVENTORY_COLUMNS : CUSTOMER_COLUMNS)

function switchTab(id: string) {
  activeTab.value = id as 'inventory' | 'customers'
  resetImport()
}

// ── Upload / Parse ────────────────────────────────
const stage       = ref<'upload' | 'mapping' | 'preview' | 'done'>('upload')
const isImporting = ref(false)
const isDragging  = ref(false)
const fileInput   = ref<HTMLInputElement | null>(null)
const pastedCsv   = ref('')
const csvHeaders  = ref<string[]>([])
const parsedRows  = ref<Record<string, string>[]>([])
const columnMapping = ref<Record<string, string>>({})
const duplicateMode = ref<'skip' | 'overwrite' | 'add'>('skip')
const previewFilter = ref<'all' | 'ok' | 'duplicate' | 'error'>('all')
const importResult  = ref({ imported: 0, skipped: 0 })

const duplicateOptions = [
  { value: 'skip',      label: 'Skip Duplicates',      desc: 'Ignore rows that already exist' },
  { value: 'overwrite', label: 'Overwrite Duplicates',  desc: 'Update existing records' },
  { value: 'add',       label: 'Add Anyway',           desc: 'Import all rows regardless' },
]

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function parsePasted() {
  parseCSV(pastedCsv.value)
}

function processFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => parseCSV(e.target?.result as string)
  reader.readAsText(file)
}

function parseCSV(raw: string) {
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) { alert('CSV must have at least a header row and one data row.'); return }

  // Auto-detect delimiter
  const firstLine = lines[0]
  const delimiter = firstLine.includes('\t') ? '\t' : ','

  const parseLine = (line: string) => {
    const result: string[] = []
    let inQuote = false, current = ''
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === delimiter && !inQuote) { result.push(current.trim()); current = '' }
      else current += ch
    }
    result.push(current.trim())
    return result
  }

  csvHeaders.value = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
  parsedRows.value = lines.slice(1).map(line => {
    const vals = parseLine(line)
    return Object.fromEntries(csvHeaders.value.map((h, i) => [h, vals[i]?.replace(/^"|"$/g, '') ?? '']))
  })

  // Auto-map columns by fuzzy matching
  columnMapping.value = {}
  activeColumns.value.forEach(field => {
    columnMapping.value[field.key] = '__skip__'
    const matches = csvHeaders.value.filter(h => {
      const hn = h.toLowerCase().replace(/[^a-z]/g, '')
      const fn = field.key.toLowerCase().replace(/[^a-z]/g, '')
      return hn.includes(fn) || fn.includes(hn) ||
        field.label.toLowerCase().replace(/\s/g,'').includes(hn) ||
        hn.includes(field.label.toLowerCase().replace(/\s/g,'').substring(0, 4))
    })
    if (matches.length > 0) columnMapping.value[field.key] = matches[0]
  })

  stage.value = 'mapping'
}

function getPreviewValue(fieldKey: string): string {
  const col = columnMapping.value[fieldKey]
  if (!col || col === '__skip__') return '—'
  return parsedRows.value[0]?.[col] ?? '—'
}

const requiredFieldsMapped = computed(() =>
  activeColumns.value
    .filter(c => c.required)
    .every(c => columnMapping.value[c.key] && columnMapping.value[c.key] !== '__skip__')
)

// ── Preview ───────────────────────────────────────
interface PreviewRow extends Record<string, string> {
  _status: 'ok' | 'duplicate' | 'error'
  _error?: string
}

const previewRows = ref<PreviewRow[]>([])

const filteredPreviewRows = computed(() => {
  const rows = previewRows.value.slice(0, 50)
  if (previewFilter.value === 'all') return rows
  return rows.filter(r => r._status === previewFilter.value)
})

const previewStats = computed(() => ({
  willImport: previewRows.value.filter(r => r._status === 'ok' || (r._status === 'duplicate' && duplicateMode.value === 'overwrite') || (r._status === 'duplicate' && duplicateMode.value === 'add')).length,
  duplicates: previewRows.value.filter(r => r._status === 'duplicate').length,
  errors:     previewRows.value.filter(r => r._status === 'error').length,
}))

function mapRow(rawRow: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {}
  activeColumns.value.forEach(field => {
    const csvCol = columnMapping.value[field.key]
    if (csvCol && csvCol !== '__skip__') {
      mapped[field.key] = rawRow[csvCol] ?? ''
    }
  })
  return mapped
}

function runPreview() {
  previewRows.value = parsedRows.value.map(rawRow => {
    const mapped = mapRow(rawRow) as PreviewRow

    // Validation
    const nameVal = mapped.name || mapped.phone || ''
    if (!nameVal) {
      mapped._status = 'error'
      mapped._error = 'Required field missing'
      return mapped
    }

    // Duplicate check
    let isDup = false
    if (activeTab.value === 'inventory') {
      isDup = !!(inventory.value || []).find(i =>
        (mapped.sku && i.sku?.toLowerCase() === mapped.sku.toLowerCase()) ||
        i.name?.toLowerCase() === mapped.name?.toLowerCase()
      )
    } else {
      isDup = !!(customers.value || []).find(c =>
        (mapped.email && c.email?.toLowerCase() === mapped.email.toLowerCase()) ||
        (mapped.phone && c.phone === mapped.phone)
      )
    }

    mapped._status = isDup ? 'duplicate' : 'ok'
    return mapped
  })
  stage.value = 'preview'
}

// ── Execute Import ────────────────────────────────
async function executeImport() {
  isImporting.value = true
  let imported = 0, skipped = 0

  for (const row of previewRows.value) {
    if (row._status === 'error') continue

    if (row._status === 'duplicate' && duplicateMode.value === 'skip') {
      skipped++
      continue
    }

    try {
      if (activeTab.value === 'inventory') {
        const item = {
          name:     row.name || '',
          sku:      row.sku || '',
          category: row.category || 'Parts',
          stock:    parseInt(row.stock) || 0,
          low:      parseInt(row.low) || 5,
          cost:     parseFloat(row.cost) || 0,
          price:    parseFloat(row.price) || 0,
          model:    '',
        }
        if (row._status === 'duplicate' && duplicateMode.value === 'overwrite') {
          const existing = (inventory.value || []).find(i =>
            i.sku?.toLowerCase() === row.sku?.toLowerCase() ||
            i.name?.toLowerCase() === row.name?.toLowerCase()
          )
          if (existing) await updateInventoryItem(existing.id, item)
        } else {
          await createInventoryItem(item)
        }
      } else {
        const customer = {
          name:    row.name || '',
          phone:   row.phone || '',
          email:   row.email || '',
          address: row.address || '',
          notes:   row.notes || '',
          tags:    [],
          driversLicense: '',
        }
        if (row._status === 'duplicate' && duplicateMode.value === 'overwrite') {
          const existing = (customers.value || []).find(c =>
            (row.email && c.email?.toLowerCase() === row.email?.toLowerCase()) ||
            (row.phone && c.phone === row.phone)
          )
          if (existing) await updateCustomer(existing.id, customer)
        } else {
          await createCustomer(customer)
        }
      }
      imported++
    } catch (err) {
      console.error('[import] row failed:', row, err)
      skipped++
    }
  }

  importResult.value = { imported, skipped }
  isImporting.value = false
  stage.value = 'done'
}


// ── Template Download ─────────────────────────────
function downloadTemplate() {
  const cols = activeColumns.value
  const header = cols.map(c => c.label).join(',')
  const example = cols.map(c => `"${c.example}"`).join(',')
  const csv = `${header}\n${example}\n`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `novaops-${activeTab.value}-template.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function resetImport() {
  stage.value     = 'upload'
  csvHeaders.value = []
  parsedRows.value = []
  previewRows.value = []
  columnMapping.value = {}
  pastedCsv.value = ''
  previewFilter.value = 'all'
}
</script>
