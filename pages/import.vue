<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); box-shadow: 0 6px 28px #8b5cf650"
        >
          <Upload class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Import & Export</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Import and export customers, inventory, and tickets</p>
        </div>
      </div>
    </div>

    <!-- ── Mode Tabs ─────────────────────────────────────────── -->
    <div class="flex gap-1.5 rounded-full p-1 self-start" style="background: hsl(var(--muted)/0.5)">
      <button
        v-for="m in ['Import', 'Export']"
        :key="m"
        class="px-5 py-2 rounded-full text-xs font-black transition-all"
        :style="activeTab === m
          ? 'background: white; color: #8b5cf6; box-shadow: 0 2px 8px rgba(0,0,0,0.1)'
          : 'color: hsl(var(--muted-foreground))'"
        @click="activeTab = m"
      >{{ m }}</button>
    </div>

    <!-- ── Import Section ─────────────────────────────────────── -->
    <div v-if="activeTab === 'Import'" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="type in importTypes" :key="type.label" class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" :style="`background: ${type.color}20`">
            <component :is="type.icon" class="w-5 h-5" :style="`color: ${type.color}`" />
          </div>
          <div>
            <h3 class="text-sm font-black">Import {{ type.label }}</h3>
            <p class="text-xs text-muted-foreground font-medium">{{ type.desc }}</p>
          </div>
        </div>

        <!-- Drop zone -->
        <div
          class="rounded-[24px] border-2 border-dashed p-8 flex flex-col items-center gap-4 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98]"
          :style="`border-color: ${type.color}40; background: ${type.color}06`"
          @dragover.prevent
          @drop.prevent="handleDrop($event, type.key)"
          @click="triggerUpload(type.key)"
        >
          <div class="w-14 h-14 rounded-[26px] flex items-center justify-center" :style="`background: ${type.color}20`">
            <FileUp class="w-7 h-7" :style="`color: ${type.color}; opacity: 0.8`" />
          </div>
          <div class="text-center">
            <p class="text-sm font-black">Drop file here or click</p>
            <p class="text-xs text-muted-foreground font-medium mt-1">Supports CSV and JSON</p>
          </div>
          <button class="px-5 py-2 rounded-full text-xs font-black text-white" :style="`background: linear-gradient(135deg, ${type.color}, ${type.colorDark})`">
            Choose File
          </button>
        </div>
        <input :ref="el => fileInputs[type.key] = el as HTMLInputElement" type="file" accept=".csv,.json" class="hidden" @change="handleFileUpload($event, type.key)" />

        <!-- Result -->
        <div v-if="importResults[type.key]" class="mt-4 p-4 rounded-[20px]" :style="importResults[type.key].startsWith('✅') ? `background: ${type.color}14; outline: 2px solid ${type.color}28; outline-offset: 0` : 'background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0'">
          <p class="text-sm font-black" :style="importResults[type.key].startsWith('✅') ? `color: ${type.color}` : 'color: #ef4444'">{{ importResults[type.key] }}</p>
        </div>

        <!-- Template download -->
        <button
          class="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-full text-xs font-bold transition-all hover:scale-[1.01] active:scale-95"
          style="background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))"
          @click="downloadTemplate(type)"
        >
          <Download class="w-3.5 h-3.5" /> Download {{ type.label }} Template
        </button>
      </div>
    </div>

    <!-- ── Export Section ─────────────────────────────────────── -->
    <div v-if="activeTab === 'Export'" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="type in importTypes" :key="type.label" class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" :style="`background: ${type.color}20`">
            <component :is="type.icon" class="w-5 h-5" :style="`color: ${type.color}`" />
          </div>
          <div>
            <h3 class="text-sm font-black">Export {{ type.label }}</h3>
            <p class="text-xs text-muted-foreground font-medium">{{ exportCount(type.key) }} records</p>
          </div>
        </div>

        <div class="rounded-[24px] p-5 flex flex-col items-center gap-4 mb-4" :style="`background: ${type.color}08; outline: 2px solid ${type.color}18; outline-offset: 0`">
          <div class="w-12 h-12 rounded-[22px] flex items-center justify-center" :style="`background: ${type.color}20`">
            <Download class="w-6 h-6" :style="`color: ${type.color}`" />
          </div>
          <div class="text-center">
            <p class="text-2xl font-black" :style="`color: ${type.color}`">{{ exportCount(type.key) }}</p>
            <p class="text-xs text-muted-foreground font-medium">records available</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="flex-1 h-11 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95"
            :style="`background: linear-gradient(135deg, ${type.color}, ${type.colorDark})`"
            @click="exportData(type.key, 'csv')"
          >
            Export CSV
          </button>
          <button
            class="flex-1 h-11 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95"
            style="background: linear-gradient(135deg, #374151, #111827)"
            @click="exportData(type.key, 'json')"
          >
            Export JSON
          </button>
        </div>
      </div>
    </div>

    <!-- ── Import History ─────────────────────────────────────── -->
    <div v-if="importLog.length > 0" class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #8b5cf620">
            <Clock class="w-4 h-4" style="color: #8b5cf6" />
          </div>
          <h3 class="text-sm font-black">Import History</h3>
        </div>
        <button class="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors" @click="importLog = []">Clear</button>
      </div>
      <div class="space-y-2">
        <div
          v-for="log in importLog"
          :key="log.id"
          class="flex items-center gap-3 px-4 py-3 rounded-[20px]"
          style="background: hsl(var(--muted)/0.4)"
        >
          <div class="w-8 h-8 rounded-[16px] flex items-center justify-center flex-shrink-0" style="background: #10b98120">
            <CheckCircle class="w-4 h-4" style="color: #10b981" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold">{{ log.message }}</p>
            <p class="text-xs text-muted-foreground font-medium">{{ log.time }}</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Upload, Users, Package, TicketCheck, FileUp, Download, Clock, CheckCircle } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const fileInputs = ref<Record<string, HTMLInputElement>>({})
const importResults = ref<Record<string, string>>({})
const importLog = ref<{ id: number; message: string; time: string }[]>([])
const activeTab = ref('Import')

const importTypes = [
  { label: 'Customers', key: 'customers', icon: Users, color: '#3b82f6', colorDark: '#2563eb', desc: 'Name, phone, email columns' },
  { label: 'Inventory', key: 'inventory', icon: Package, color: '#8b5cf6', colorDark: '#7c3aed', desc: 'Name, SKU, price, stock columns' },
  { label: 'Tickets',   key: 'tickets',   icon: TicketCheck, color: '#f59e0b', colorDark: '#d97706', desc: 'Device, issue, status, price columns' },
]

const exportCount = (key: string) => ((appStore as any)[key] ?? []).length

const triggerUpload = (key: string) => fileInputs.value[key]?.click()
const handleDrop = (e: DragEvent, key: string) => { const file = e.dataTransfer?.files?.[0]; if (file) processFile(file, key) }
const handleFileUpload = (e: Event, key: string) => { const file = (e.target as HTMLInputElement)?.files?.[0]; if (file) processFile(file, key) }

const processFile = async (file: File, key: string) => {
  try {
    const text = await file.text()
    let count = 0
    if (file.name.endsWith('.json')) {
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : data[key] || []
      ;(appStore as any)[key] = [...((appStore as any)[key] || []), ...arr.map((i: any, idx: number) => ({ ...i, id: i.id || Date.now() + idx }))]
      count = arr.length
      importResults.value[key] = `✅ Imported ${count} ${key} from JSON`
    } else {
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase())
      const rows = lines.slice(1).map((line: string) => {
        const vals = line.split(','); const obj: any = { id: Date.now() + Math.random() }
        headers.forEach((h: string, i: number) => { obj[h] = vals[i]?.trim() }); return obj
      })
      ;(appStore as any)[key] = [...((appStore as any)[key] || []), ...rows]
      count = rows.length
      importResults.value[key] = `✅ Imported ${count} ${key} from CSV`
    }
    await appStore.saveAll()
    importLog.value.unshift({ id: Date.now(), message: importResults.value[key], time: new Date().toLocaleTimeString() })
  } catch {
    importResults.value[key] = '❌ Failed to parse file. Check format and try again.'
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
    if (!data.length) { alert('No data to export'); return }
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
.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px #8b5cf618; }
</style>
