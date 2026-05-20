<template>
  <div class="flex flex-col gap-6">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex align-center justify-between flex-wrap gap-4 mb-2">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
          <i class="mdi mdi-upload-text-2xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-black">Import & Export</h1>
          <p class="text-sm text-muted-foreground mt-1">Import and export customers, inventory, and tickets</p>
        </div>
      </div>
    </div>

    <!-- ── Mode Tabs ─────────────────────────────────────────── -->
    <div class="bg-muted border rounded-full p-1 flex gap-1 self-start">
      <Button
        v-for="m in ['Import', 'Export']"
        :key="m"
        :label="m"
        :variant="activeTab === m ? undefined : 'text'"
        :severity="activeTab === m ? 'primary' : 'secondary'"
        class="rounded-full text-xs font-bold px-6 py-1.5 transition-all text-none"
        @click="activeTab = m"
      />
    </div>

    <!-- ── Import Section ─────────────────────────────────────── -->
    <div v-if="activeTab === 'Import'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="type in importTypes" :key="type.label" class="flex flex-col">
        <div class="bg-surface border border-border rounded-xl p-6 flex flex-col h-full">
          <div class="flex items-center gap-3 mb-6 shrink-0">
            <div 
              class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" 
              :style="{ backgroundColor: `${type.color}15`, color: type.color }"
            >
              <i class="mdi mdi-text-xl" :class="type.icon"></i>
            </div>
            <div>
              <h3 class="text-sm font-black">{{ type.label }}</h3>
              <p class="text-[11px] text-muted-foreground mt-0.5">{{ type.desc }}</p>
            </div>
          </div>

          <!-- Drop zone -->
          <div
            class="rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer flex-grow border border-dashed transition-all hover:bg-muted/30"
            :style="{ borderColor: `${type.color}40`, backgroundColor: `${type.color}06` }"
            @dragover.prevent
            @drop.prevent="handleDrop($event, type.key)"
            @click="triggerUpload(type.key)"
          >
            <div 
              class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" 
              :style="{ backgroundColor: `${type.color}15`, color: type.color }"
            >
              <i class="mdi mdi-file-upload-outline-text-2xl-opacity-80"></i>
            </div>
            <div class="text-center">
              <p class="text-xs font-bold">Drop file here or click</p>
              <p class="text-[10px] text-muted-foreground mt-1">Supports CSV and JSON</p>
            </div>
            <Button
              label="Choose File"
              :severity="type.key === 'customers' ? 'primary' : type.key === 'inventory' ? 'help' : 'warn'"
              class="rounded-full text-[11px] font-bold px-5 py-1 mt-2 text-none"
            />
          </div>
          <input :ref="el => fileInputs[type.key] = el as HTMLInputElement" type="file" accept=".csv,.json" class="hidden" @change="handleFileUpload($event, type.key)" />

          <!-- Result -->
          <div 
            v-if="importResults[type.key]" 
            class="mt-4 p-4 rounded-xl border text-xs font-bold" 
            :class="[
              importResults[type.key].startsWith('✅') 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100' 
                : 'bg-red-50 border-red-200 text-red-950 dark:bg-red-950 dark:border-red-800 dark:text-red-100'
            ]"
          >
            {{ importResults[type.key] }}
          </div>

          <!-- Template download -->
          <Button
            variant="outlined"
            severity="secondary"
            class="mt-4 w-full rounded-full text-xs font-bold text-none"
            icon="mdi mdi-download"
            :label="`Download ${type.label} Template`"
            @click="downloadTemplate(type)"
          />
        </div>
      </div>
    </div>

    <!-- ── Export Section ─────────────────────────────────────── -->
    <div v-if="activeTab === 'Export'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="type in importTypes" :key="type.label" class="flex flex-col">
        <div class="bg-surface border border-border rounded-xl p-6 flex flex-col h-full">
          <div class="flex items-center gap-3 mb-6 shrink-0">
            <div 
              class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" 
              :style="{ backgroundColor: `${type.color}15`, color: type.color }"
            >
              <i class="mdi mdi-text-xl" :class="type.icon"></i>
            </div>
            <div>
              <h3 class="text-sm font-black">Export {{ type.label }}</h3>
              <p class="text-[11px] text-muted-foreground mt-0.5">{{ exportCount(type.key) }} records</p>
            </div>
          </div>

          <div 
            class="rounded-xl p-6 flex flex-col items-center justify-center gap-4 mb-4 flex-grow border" 
            :style="{ backgroundColor: `${type.color}08`, borderColor: `${type.color}18` }"
          >
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" 
              :style="{ backgroundColor: `${type.color}15`, color: type.color }"
            >
              <i class="mdi mdi-download-text-xl"></i>
            </div>
            <div class="text-center">
              <p class="text-3xl font-black" :style="{ color: type.color }">{{ exportCount(type.key) }}</p>
              <p class="text-[10px] text-muted-foreground uppercase font-bold mt-1 tracking-wider">records available</p>
            </div>
          </div>

          <div class="flex gap-3 shrink-0">
            <Button
              label="Export CSV"
              :severity="type.key === 'customers' ? 'primary' : type.key === 'inventory' ? 'help' : 'warn'"
              class="flex-grow rounded-full text-xs font-bold text-none"
              @click="exportData(type.key, 'csv')"
            />
            <Button
              label="Export JSON"
              severity="secondary"
              class="flex-grow rounded-full text-xs font-bold text-none"
              @click="exportData(type.key, 'json')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Import History ─────────────────────────────────────── -->
    <div v-if="importLog.length > 0" class="bg-surface border border-border rounded-xl p-6 mt-2">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <i class="mdi mdi-clock-outline-text-lg"></i>
          </div>
          <h3 class="text-base font-black">Import History</h3>
        </div>
        <Button 
          label="Clear" 
          variant="text" 
          severity="secondary" 
          class="text-xs text-none font-bold" 
          @click="importLog = []" 
        />
      </div>
      
      <div class="flex flex-col gap-2">
        <div
          v-for="log in importLog"
          :key="log.id"
          class="flex items-center gap-3 p-3 border border-border bg-muted/40 rounded-xl"
        >
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <i class="mdi mdi-check-circle-outline-text-lg"></i>
          </div>
          <div>
            <div class="text-xs font-bold">{{ log.message }}</div>
            <div class="text-[10px] text-muted-foreground mt-0.5">{{ log.time }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'

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
