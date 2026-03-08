<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg"
          style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 4px 20px #8b5cf650">
          <Package class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Inventory & Services</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Track parts, tools, accessories & repair services</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button class="m3-btn-tonal flex items-center gap-2 h-10 px-5 rounded-full text-sm font-bold" @click="handleBatchPrint" title="Print barcodes for all currently filtered items">
          <Printer class="w-4 h-4" /> Print Labels
        </button>
        <button class="m3-btn-tonal flex items-center gap-2 h-10 px-5 rounded-full text-sm font-bold" @click="checkLowStock">
          <AlertTriangle class="w-4 h-4" /> Low Stock
        </button>
        <button class="m3-fab flex items-center gap-2.5 h-10 px-5 rounded-full text-sm font-black text-white"
          style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 4px 20px #8b5cf650"
          @click="openNew">
          <Plus class="w-5 h-5" /> Add Item
        </button>
      </div>
    </div>

    <!-- ── Stat Cards ───────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="stat in stats" :key="stat.label"
        class="m3-stat-card rounded-[28px] p-5 flex flex-col gap-3"
        :style="`background:${stat.color}12;outline:2px solid ${stat.color}28;outline-offset:0`">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" :style="`background:${stat.color}24`">
            <component :is="stat.icon" class="w-5 h-5" :style="`color:${stat.color}`" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" :style="`background:${stat.color}20;color:${stat.color}`">{{ stat.badge }}</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">{{ stat.label }}</p>
          <p class="text-2xl font-black" :style="`color:${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Search & Filters ─────────────────────────────────────── -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input v-model="q" placeholder="Search by name, SKU, or category…"
          class="w-full h-12 pl-11 pr-4 rounded-full text-sm font-medium transition-all"
          style="background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.6);outline:none"
          @focus="($event.target as HTMLElement).style.cssText+=';border-color:#8b5cf6;box-shadow:0 0 0 3px #8b5cf618'"
          @blur="($event.target as HTMLElement).style.borderColor='hsl(var(--border)/0.6)'" />
      </div>
      <!-- Type toggle -->
      <div class="flex gap-2">
        <button v-for="t in ['All', 'product', 'service']" :key="t"
          class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 capitalize"
          :style="typeFilter === (t === 'All' ? null : t)
            ? 'background:#8b5cf624;color:#8b5cf6;outline:2px solid #8b5cf650;outline-offset:0'
            : 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))'"
          @click="typeFilter = t === 'All' ? null : t">{{ t === 'product' ? 'Products' : t === 'service' ? 'Services' : t }}</button>
      </div>
      <!-- Category pills -->
      <div class="flex gap-2 flex-wrap">
        <button v-for="cat in ['All', ...dynamicCategories]" :key="cat"
          class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
          :style="selectedCat === (cat==='All' ? null : cat)
            ? 'background:#8b5cf624;color:#8b5cf6;outline:2px solid #8b5cf650;outline-offset:0'
            : 'background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground))'"
          @click="selectedCat = cat==='All' ? null : cat">{{ cat }}</button>
      </div>
    </div>

    <!-- ── Grid ─────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="item in filtered" :key="item.id"
        class="m3-item-card rounded-[28px] p-5 flex flex-col gap-4 cursor-pointer bg-card"
        style="outline:2px solid hsl(var(--border)/0.6);outline-offset:0"
        @click="openEdit(item)">
        <div class="flex items-start justify-between">
          <div class="w-12 h-12 rounded-[22px] flex items-center justify-center"
            :style="item.itemType === 'service' ? 'background:linear-gradient(135deg,#22d3ee18,#0891b218)' : 'background:linear-gradient(135deg,#8b5cf620,#7c3aed20)'">
            <component :is="item.itemType === 'service' ? Wrench : Package" class="w-6 h-6"
              :style="item.itemType === 'service' ? 'color:#22d3ee' : 'color:#8b5cf6'" />
          </div>
          <div class="flex flex-col items-end gap-1">
            <span class="text-[9px] font-black px-2 py-0.5 rounded-full"
              :style="item.itemType === 'service' ? 'background:#22d3ee20;color:#22d3ee' : 'background:#8b5cf620;color:#8b5cf6'">
              {{ item.itemType === 'service' ? 'SERVICE' : 'PRODUCT' }}
            </span>
            <span class="text-[10px] font-black px-2.5 py-1 rounded-full"
              :style="item.itemType === 'service' ? 'background:#3b82f620;color:#3b82f6' : (item.stock <= (item.low||5) ? 'background:#ef444420;color:#ef4444' : 'background:#10b98120;color:#10b981')">
              {{ item.itemType === 'service' ? 'AVAILABLE' : (item.stock <= (item.low||5) ? '⚠ LOW' : 'IN STOCK') }}
            </span>
          </div>
        </div>
        <div class="flex-1">
          <h3 class="font-black text-sm leading-tight mb-1">{{ item.name }}</h3>
          <p class="text-xs text-muted-foreground font-medium">
            {{ item.itemType !== 'service' ? `SKU: ${item.sku || '—'}` : (item.description || '') }}
          </p>
          <p class="text-xs text-muted-foreground font-medium mt-0.5">{{ item.category }}</p>
        </div>
        <div class="flex items-end justify-between pt-3 border-t border-border/50">
          <div>
            <p class="text-xl font-black" :style="item.itemType === 'service' ? 'color:#22d3ee' : 'color:#8b5cf6'">
              {{ formatCurrency(item.price) }}
            </p>
            <p v-if="item.itemType !== 'service'" class="text-xs text-muted-foreground font-semibold">Cost: {{ formatCurrency(item.cost||0) }}</p>
            <p v-else class="text-xs text-muted-foreground font-semibold">
              {{ item.estimated_minutes || item.duration ? `~${item.estimated_minutes || item.duration} min` : 'Labor rate' }}
            </p>
          </div>
          <div class="text-right" v-if="item.itemType !== 'service'">
            <p class="text-2xl font-black">{{ item.stock }}</p>
            <p class="text-[10px] text-muted-foreground font-semibold tracking-wide">UNITS</p>
          </div>
          <div class="text-right" v-else>
            <p class="text-2xl font-black">∞</p>
            <p class="text-[10px] text-muted-foreground font-semibold tracking-wide">UNLIMITED</p>
          </div>
        </div>
      </div>

      <div v-if="filtered.length===0" class="col-span-full rounded-[32px] py-20 flex flex-col items-center gap-4 bg-card"
        style="outline:2px solid hsl(var(--border)/0.6);outline-offset:0">
        <div class="w-20 h-20 rounded-[32px] flex items-center justify-center" style="background:#8b5cf614">
          <Package class="w-10 h-10" style="color:#8b5cf6;opacity:0.5" />
        </div>
        <div class="text-center">
          <h3 class="text-lg font-black mb-1">No items found</h3>
          <p class="text-sm text-muted-foreground font-medium">{{ q ? 'Try a different search' : 'Add your first item' }}</p>
        </div>
      </div>
    </div>

    <!-- ── Add/Edit Dialog ─────────────────────────────────────── -->
    <Dialog v-model:open="newOpen">
      <DialogContent class="w-full max-w-[96vw] sm:max-w-md">
        <div class="flex flex-col gap-5 p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center"
              :style="form.itemType === 'service' ? 'background:linear-gradient(135deg,#22d3ee,#0891b2)' : 'background:linear-gradient(135deg,#8b5cf6,#7c3aed)'">
              <component :is="form.itemType === 'service' ? Wrench : Package" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">{{ editingItem ? 'Edit Item' : 'Add Item' }}</h2>
              <p class="text-xs text-muted-foreground font-medium">{{ form.itemType === 'service' ? 'Service or labor item' : 'Inventory details' }}</p>
            </div>
          </div>

          <!-- Item type toggle -->
          <div class="flex gap-2 p-1 rounded-[20px]" style="background:hsl(var(--muted)/0.4)">
            <button v-for="t in ['product', 'service']" :key="t"
              class="flex-1 h-10 rounded-[16px] text-xs font-black capitalize transition-all"
              :style="form.itemType === t
                ? 'background:white;color:#8b5cf6;box-shadow:0 2px 8px rgba(0,0,0,0.08)'
                : 'color:hsl(var(--muted-foreground))'"
              @click="form.itemType = t as 'product' | 'service'">
              {{ t === 'product' ? '📦 Product' : '🔧 Service' }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="col-span-2 space-y-2">
              <label class="m3-label">Name</label>
              <input v-model="form.name" :placeholder="form.itemType === 'service' ? 'Screen Replacement Labor' : 'Screen Replacement'" class="m3-input" />
            </div>

            <!-- Product fields -->
            <template v-if="form.itemType === 'product'">
              <div class="space-y-2"><label class="m3-label">SKU</label><input v-model="form.sku" placeholder="SKU-001" class="m3-input" /></div>
              <div class="space-y-2"><label class="m3-label">Category</label>
                <select v-model="form.category" class="m3-input">
                  <option v-for="c in allCategories" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div class="space-y-2"><label class="m3-label">Price</label><input v-model.number="form.price" type="number" step="0.01" placeholder="29.99" class="m3-input" /></div>
              <div class="space-y-2"><label class="m3-label">Cost</label><input v-model.number="form.cost" type="number" step="0.01" placeholder="15.00" class="m3-input" /></div>
              <div class="space-y-2"><label class="m3-label">Stock Qty</label><input v-model.number="form.stock" type="number" placeholder="10" class="m3-input" /></div>
              <div class="space-y-2"><label class="m3-label">Low Stock Alert</label><input v-model.number="form.low" type="number" placeholder="5" class="m3-input" /></div>
            </template>

            <!-- Service fields -->
            <template v-else>
              <div class="space-y-2"><label class="m3-label">Price ($)</label><input v-model.number="form.price" type="number" step="0.01" placeholder="75.00" class="m3-input" /></div>
              <div class="space-y-2"><label class="m3-label">Duration (min)</label><input v-model.number="form.estimated_minutes" type="number" placeholder="60" class="m3-input" /></div>
              <div class="col-span-2 space-y-2"><label class="m3-label">Category</label>
                <input v-model="form.category" placeholder="e.g. Apple Repairs, Samsung Repairs" class="m3-input" />
              </div>
              <div class="col-span-2 space-y-2"><label class="m3-label">Description</label>
                <textarea v-model="form.description" placeholder="Brief description of the service" rows="2"
                  class="m3-input resize-none" style="height:auto;padding-top:12px" />
              </div>
            </template>
          </div>

          <div class="flex gap-3 pt-1 w-full flex-wrap">
            <button v-if="editingItem"
              class="flex items-center justify-center gap-2 h-12 px-5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style="outline:2px solid hsl(var(--border));outline-offset:0"
              @click="printCurrentLabel">
              <Printer class="w-4 h-4" /> Print Label
            </button>
            <div class="flex-1 flex gap-3 min-w-[200px]">
              <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
                style="outline:2px solid hsl(var(--border));outline-offset:0"
                @click="newOpen=false;editingItem=null">Cancel</button>
              <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                :style="form.itemType === 'service'
                  ? 'background:linear-gradient(135deg,#22d3ee,#0891b2);box-shadow:0 4px 16px #22d3ee40'
                  : 'background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 4px 16px #8b5cf640'"
                @click="saveItem">{{ editingItem ? 'Save Changes' : 'Add Item' }}</button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Package, Search, Plus, AlertTriangle, Wrench, Printer } from 'lucide-vue-next'
import { DollarSign, Tag } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { useAppStore } from '~/stores/app'
import { printBarcodeLabel, printBarcodeBatch } from '~/utils/print'

definePageMeta({ middleware: ['auth'] })

const appStore  = useAppStore()
const settings  = computed(() => appStore.settings ?? { currency: '$' })

// Merge inventory products + services from their respective tables
const allItems = computed(() => {
  const products = (appStore.inventory ?? []).map((i: any) => ({ ...i, itemType: i.itemType || i.item_type || 'product' }))
  const services = (appStore.services ?? []).map((s: any) => ({ ...s, itemType: 'service', stock: 9999, low: 0, sku: s.sku || '' }))
  return [...products, ...services]
})

const q            = ref('')
const selectedCat  = ref<string|null>(null)
const typeFilter   = ref<string|null>(null)
const newOpen      = ref(false)
const editingItem  = ref<any>(null)
const isSaving     = ref(false)

const blankForm = () => ({
  name: '', sku: '', category: 'Parts', description: '',
  price: 0, cost: 0, stock: 0, low: 5,
  estimated_minutes: 60,
  itemType: 'product' as 'product' | 'service',
})
const form = ref(blankForm())

const PRODUCT_CATEGORIES = ['Parts', 'Tools', 'Accessories', 'Devices']
const SERVICE_CATEGORIES = ['Services', 'Repairs', 'Diagnostics', 'Labor', 'Apple Repairs', 'Samsung Repairs', 'Google Repairs', 'House Calls', 'Data Services', 'SSD Upgrades', 'Trade-In Repairs', 'Board Repairs', 'Batteries']

const dynamicCategories = computed(() => {
  const cats = [...new Set(allItems.value.map((i: any) => i.category).filter(Boolean))]
  return [...new Set([...PRODUCT_CATEGORIES, ...SERVICE_CATEGORIES, ...cats])].sort()
})
const allCategories = dynamicCategories

const filtered = computed(() => allItems.value.filter((i: any) => {
  const ms = !q.value || i.name?.toLowerCase().includes(q.value.toLowerCase()) || i.sku?.toLowerCase().includes(q.value.toLowerCase()) || i.category?.toLowerCase().includes(q.value.toLowerCase())
  const mc = !selectedCat.value || i.category === selectedCat.value
  const mt = !typeFilter.value || i.itemType === typeFilter.value
  return ms && mc && mt
}))

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`

const stats = computed(() => {
  const products = allItems.value.filter((i: any) => i.itemType === 'product')
  const services = allItems.value.filter((i: any) => i.itemType === 'service')
  return [
    { label: 'Total Items',  value: allItems.value.length,  color: '#8b5cf6', badge: 'TOTAL',    icon: Package },
    { label: 'Products',     value: products.length,         color: '#6366f1', badge: 'PRODUCTS', icon: Package },
    { label: 'Services',     value: services.length,         color: '#22d3ee', badge: 'SERVICES', icon: Wrench  },
    { label: 'Low Stock',    value: products.filter((i: any) => i.stock <= (i.low||5)).length, color: '#f59e0b', badge: 'ALERT', icon: AlertTriangle },
  ]
})

const checkLowStock = () => {
  const low = allItems.value.filter((i: any) => i.itemType === 'product' && i.stock <= (i.low||5))
  if (!low.length) alert('All products are well stocked!')
  else alert(`${low.length} item(s) need restocking:\n${low.map((i: any) => `• ${i.name} (${i.stock} left)`).join('\n')}`)
}

const openNew = () => { form.value = blankForm(); editingItem.value = null; newOpen.value = true }
const openEdit = (item: any) => {
  editingItem.value = item
  form.value = { ...blankForm(), ...item, itemType: item.itemType || 'product' }
  newOpen.value = true
}

const saveItem = async () => {
  if (!form.value.name.trim()) return alert('Please enter a name')
  if (isSaving.value) return
  isSaving.value = true

  try {
    if (form.value.itemType === 'service') {
      // Save to services table
      const payload = {
        name: form.value.name,
        category: form.value.category,
        description: form.value.description,
        price: form.value.price,
        estimated_minutes: form.value.estimated_minutes,
        duration: form.value.estimated_minutes,
        active: true,
      }
      if (editingItem.value && editingItem.value.itemType === 'service') {
        await appStore.updateService(editingItem.value.id, payload)
      } else {
        await appStore.createService(payload)
      }
    } else {
      // Save to inventory table
      const payload = { ...form.value }
      if (editingItem.value && editingItem.value.itemType !== 'service') {
        await appStore.updateInventoryItem(editingItem.value.id, payload)
      } else {
        await appStore.createInventoryItem(payload)
      }
    }
    newOpen.value = false
    editingItem.value = null
    form.value = blankForm()
  } catch (e) {
    console.error('Save failed', e)
    alert('Failed to save. Please try again.')
  } finally {
    isSaving.value = false
  }
}

// --- Barcode Printing ---
const printCurrentLabel = () => {
  if (!form.value.name) return
  // Fallback to a placeholder SKU if it's a service without one
  const sku = form.value.sku || (editingItem.value?.id ? `SVC-${editingItem.value.id}` : 'NO-SKU')
  printBarcodeLabel({
    sku,
    name: form.value.name,
    price: form.value.price || 0,
    currency: settings.value?.currency || '$',
    format: form.value.itemType === 'service' ? 'CODE128' : 'UPC' // Compact barcode for services
  })
}

const handleBatchPrint = () => {
  if (!filtered.value.length) return alert('No items to print.')
  const count = filtered.value.length
  if (count > 50) {
    if (!confirm(`You are about to print ${count} labels. Are you sure you want to proceed?`)) return
  }
  
  const payload = filtered.value.map((i: any) => ({
    sku: i.sku || `SVC-${i.id}`,
    name: i.name,
    price: i.price || 0,
    currency: settings.value?.currency || '$',
    format: i.itemType === 'service' ? 'CODE128' : 'UPC' as any
  }))

  printBarcodeBatch(payload)
}
</script>

<style scoped>
.m3-fab { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-fab:hover  { transform: scale(1.05) translateY(-2px); }
.m3-fab:active { transform: scale(0.92); }
.m3-btn-tonal { background:hsl(var(--muted)/0.7);outline:2px solid hsl(var(--border)/0.6);outline-offset:0;border-radius:999px;transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }
.m3-btn-tonal:hover  { transform: scale(1.04); }
.m3-btn-tonal:active { transform: scale(0.94); }
.m3-stat-card { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-stat-card:hover  { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.m3-stat-card:active { transform: scale(0.96); }
.m3-item-card { transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease; }
.m3-item-card:hover  { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-item-card:active { transform: scale(0.96); }
.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.m3-input:focus { border-color:#8b5cf6;box-shadow:0 0 0 3px #8b5cf618; }
.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
</style>
