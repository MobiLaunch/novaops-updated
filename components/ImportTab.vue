<template>
  <div class="d-flex flex-column gap-6">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-2">
      <div class="d-flex align-center gap-4">
        <v-avatar size="56" color="deep-purple-accent-2" variant="tonal" class="rounded-xl">
          <v-icon icon="mdi-upload" size="28" color="deep-purple-accent-2" />
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-black">Import & Export</h1>
          <p class="text-body-2 text-medium-emphasis mb-0 mt-1">Import and export customers, inventory, and tickets</p>
        </div>
      </div>
    </div>

    <!-- ── Mode Tabs ─────────────────────────────────────────── -->
    <div class="bg-surface-variant rounded-pill pa-1 d-flex gap-1 align-self-start">
      <v-btn
        v-for="m in ['Import', 'Export']"
        :key="m"
        :variant="activeTab === m ? 'flat' : 'text'"
        :color="activeTab === m ? 'deep-purple-accent-2' : undefined"
        class="rounded-pill text-none px-6 font-weight-bold"
        size="small"
        @click="activeTab = m"
      >
        {{ m }}
      </v-btn>
    </div>

    <!-- ── Import Section ─────────────────────────────────────── -->
    <v-row v-if="activeTab === 'Import'">
      <v-col v-for="type in importTypes" :key="type.label" cols="12" lg="6" xl="4">
        <v-card class="rounded-xl border pa-6 h-100 d-flex flex-column" elevation="0">
          <div class="d-flex align-center gap-3 mb-6">
            <v-avatar size="44" :color="type.color" variant="tonal" class="rounded-lg">
              <v-icon :icon="type.icon" size="24" :color="type.color" />
            </v-avatar>
            <div>
              <h3 class="text-subtitle-1 font-weight-black mb-0">Import {{ type.label }}</h3>
              <p class="text-caption font-weight-medium text-medium-emphasis">{{ type.desc }}</p>
            </div>
          </div>

          <!-- Drop zone -->
          <v-card
            class="rounded-xl pa-8 d-flex flex-column align-center gap-4 cursor-pointer flex-grow-1"
            :style="`border: 2px dashed ${type.color}40; background-color: ${type.color}06`"
            elevation="0"
            @dragover.prevent
            @drop.prevent="handleDrop($event, type.key)"
            @click="triggerUpload(type.key)"
          >
            <v-avatar size="56" :color="type.color" variant="tonal" class="rounded-xl">
              <v-icon icon="mdi-file-upload-outline" size="28" :color="type.color" class="opacity-80" />
            </v-avatar>
            <div class="text-center">
              <p class="text-body-2 font-weight-black">Drop file here or click</p>
              <p class="text-caption text-medium-emphasis font-weight-medium mt-1">Supports CSV and JSON</p>
            </div>
            <v-btn
              :color="type.color"
              variant="flat"
              class="rounded-pill text-none px-6 mt-2 font-weight-bold"
            >
              Choose File
            </v-btn>
          </v-card>
          <input :ref="el => fileInputs[type.key] = el as HTMLInputElement" type="file" accept=".csv,.json" class="d-none" @change="handleFileUpload($event, type.key)" />

          <!-- Result -->
          <v-card v-if="importResults[type.key]" class="mt-4 pa-4 rounded-lg" :color="importResults[type.key].startsWith('✅') ? 'success' : 'error'" variant="tonal" elevation="0">
            <p class="text-body-2 font-weight-black" :class="importResults[type.key].startsWith('✅') ? 'text-success' : 'text-error'">
              {{ importResults[type.key] }}
            </p>
          </v-card>

          <!-- Template download -->
          <v-btn
            variant="tonal"
            color="surface-variant"
            class="mt-4 w-100 rounded-pill text-none font-weight-bold"
            @click="downloadTemplate(type)"
          >
            <v-icon start>mdi-download</v-icon> Download {{ type.label }} Template
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Export Section ─────────────────────────────────────── -->
    <v-row v-if="activeTab === 'Export'">
      <v-col v-for="type in importTypes" :key="type.label" cols="12" lg="6" xl="4">
        <v-card class="rounded-xl border pa-6 h-100 d-flex flex-column" elevation="0">
          <div class="d-flex align-center gap-3 mb-6">
            <v-avatar size="44" :color="type.color" variant="tonal" class="rounded-lg">
              <v-icon :icon="type.icon" size="24" :color="type.color" />
            </v-avatar>
            <div>
              <h3 class="text-subtitle-1 font-weight-black mb-0">Export {{ type.label }}</h3>
              <p class="text-caption font-weight-medium text-medium-emphasis">{{ exportCount(type.key) }} records</p>
            </div>
          </div>

          <v-card class="rounded-xl pa-6 d-flex flex-column align-center gap-4 mb-4 flex-grow-1" :style="`background-color: ${type.color}08; border: 2px solid ${type.color}18`" elevation="0">
            <v-avatar size="48" :color="type.color" variant="tonal" class="rounded-xl">
              <v-icon icon="mdi-download" size="24" :color="type.color" />
            </v-avatar>
            <div class="text-center">
              <p class="text-h4 font-weight-black" :style="`color: ${type.color}`">{{ exportCount(type.key) }}</p>
              <p class="text-caption text-medium-emphasis font-weight-medium">records available</p>
            </div>
          </v-card>

          <div class="d-flex gap-3">
            <v-btn
              :color="type.color"
              variant="flat"
              class="flex-grow-1 rounded-pill text-none font-weight-bold"
              @click="exportData(type.key, 'csv')"
            >
              Export CSV
            </v-btn>
            <v-btn
              color="secondary"
              variant="flat"
              class="flex-grow-1 rounded-pill text-none font-weight-bold"
              @click="exportData(type.key, 'json')"
            >
              Export JSON
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Import History ─────────────────────────────────────── -->
    <v-card v-if="importLog.length > 0" class="rounded-xl border pa-6 mt-2" elevation="0">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center gap-3">
          <v-avatar size="36" color="deep-purple-accent-2" variant="tonal" class="rounded-lg">
            <v-icon icon="mdi-clock-outline" size="20" color="deep-purple-accent-2" />
          </v-avatar>
          <h3 class="text-subtitle-1 font-weight-black mb-0">Import History</h3>
        </div>
        <v-btn variant="text" size="small" color="medium-emphasis" class="font-weight-bold text-none" @click="importLog = []">
          Clear
        </v-btn>
      </div>
      
      <v-list lines="two" bg-color="transparent" class="pa-0">
        <v-list-item
          v-for="log in importLog"
          :key="log.id"
          class="rounded-xl mb-2 bg-surface-variant"
        >
          <template #prepend>
            <v-avatar size="40" color="success" variant="tonal" class="rounded-lg">
              <v-icon icon="mdi-check-circle-outline" size="20" />
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-bold text-body-2">{{ log.message }}</v-list-item-title>
          <v-list-item-subtitle class="font-weight-medium text-caption">{{ log.time }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>

  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const appStore = useAppStore()
const { toast } = useToast()
const fileInputs = ref<Record<string, HTMLInputElement>>({})
const importResults = ref<Record<string, string>>({})
const importLog = ref<{ id: number; message: string; time: string }[]>([])
const activeTab = ref('Import')

const importTypes = [
  { label: 'Customers', key: 'customers', icon: 'mdi-account-group-outline', color: '#3b82f6', colorDark: '#2563eb', desc: 'Name, phone, email columns' },
  { label: 'Inventory', key: 'inventory', icon: 'mdi-package-variant-closed', color: '#8b5cf6', colorDark: '#7c3aed', desc: 'Name, SKU, price, stock columns' },
  { label: 'Tickets',   key: 'tickets',   icon: 'mdi-ticket-confirmation-outline', color: '#f59e0b', colorDark: '#d97706', desc: 'Device, issue, status, price columns' },
]

const exportCount = (key: string) => ((appStore as any)[key] ?? []).length

const triggerUpload = (key: string) => fileInputs.value[key]?.click()
const handleDrop = (e: DragEvent, key: string) => { const file = e.dataTransfer?.files?.[0]; if (file) processFile(file, key) }
const handleFileUpload = (e: Event, key: string) => { const file = (e.target as HTMLInputElement)?.files?.[0]; if (file) processFile(file, key) }

const processFile = async (file: File, key: string) => {
  try {
    const text = await file.text()
    let rows: any[] = []

    if (file.name.endsWith('.json')) {
      const data = JSON.parse(text)
      rows = Array.isArray(data) ? data : data[key] || []
    } else {
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase())
      rows = lines.slice(1).map((line: string) => {
        const vals = line.split(',')
        const obj: any = {}
        headers.forEach((h: string, i: number) => { obj[h] = vals[i]?.trim() })
        return obj
      })
    }

    if (!rows.length) {
      importResults.value[key] = '❌ No rows found in file.'
      return
    }

    // Route each data type to its proper store method
    if (key === 'inventory') {
      for (const row of rows) {
        await appStore.createInventoryItem({
          name: row.name || '',
          sku: row.sku || '',
          price: parseFloat(row.price) || 0,
          cost: parseFloat(row.cost) || 0,
          stock: parseInt(row.stock) || 0,
          low: parseInt(row.low) || 5,
          category: row.category || 'Parts',
          model: row.model || '',
          itemType: row.item_type || row.itemType || 'product',
          description: row.description || '',
        })
      }
    } else if (key === 'customers') {
      for (const row of rows) {
        await appStore.createCustomer({
          name: row.name || '',
          phone: row.phone || '',
          email: row.email || '',
          notes: row.notes || '',
        })
      }
    } else if (key === 'tickets') {
      for (const row of rows) {
        await appStore.createTicket({
          device: row.device || '',
          issue: row.issue || '',
          status: row.status || 'Open',
          price: parseFloat(row.price) || 0,
          customerId: row.customerid || row.customerId || null,
        })
      }
    }

    importResults.value[key] = `✅ Imported ${rows.length} ${key}`
    importLog.value.unshift({ id: Date.now(), message: importResults.value[key], time: new Date().toLocaleTimeString() })
  } catch (err: any) {
    console.error('[Import Error]', err)
    importResults.value[key] = `❌ Import failed: ${err?.message || 'Check format and try again.'}`
  }
}

const downloadTemplate = (type: any) => {
  const templates: Record<string, string> = {
    customers: 'name,phone,email,notes\nJane Smith,(555) 123-4567,jane@email.com,VIP customer\n',
    inventory: 'name,sku,price,stock,category\niPhone 14 Screen,IPH14-SCR,89.99,5,Screens\n',
    tickets: 'device,issue,status,price,customerId\niPhone 13,Cracked screen,Open,120,\n',
  }
  const csv = templates[type.key] || ''
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${type.key}-template.csv`; a.click()
  URL.revokeObjectURL(url)
}

const exportData = (key: string, format: 'csv' | 'json') => {
  const data = (appStore as any)[key] ?? []
  let content = ''
  let filename = ''
  if (format === 'json') {
    content = JSON.stringify(data, null, 2)
    filename = `${key}-export-${new Date().toISOString().split('T')[0]}.json`
  } else {
    if (!data.length) { toast.warning('Nothing to Export', 'No data available to export'); return }
    const headers = Object.keys(data[0])
    const rows = [headers.join(','), ...data.map((r: any) => headers.map(h => `"${r[h] ?? ''}"`).join(','))]
    content = rows.join('\n')
    filename = `${key}-export-${new Date().toISOString().split('T')[0]}.csv`
  }
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.m3-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px #8b5cf618; }
</style>
