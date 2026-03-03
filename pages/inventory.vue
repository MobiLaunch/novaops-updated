<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
          <Package class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Inventory</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Track parts, tools, and accessories</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button class="m3-btn-tonal flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold" @click="checkLowStock">
          <RefreshCw class="w-4 h-4" /> Check Stock
        </button>
        <button class="m3-btn-primary flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-black text-white shadow-lg" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 20px #8b5cf650" @click="newItemOpen = true">
          <Plus class="w-5 h-5" /> Add Item
        </button>
      </div>
    </div>

    <!-- ── Stat Cards ───────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="stat in inventoryStats"
        :key="stat.label"
        class="m3-stat-card rounded-[28px] p-5 flex items-center gap-4"
        :style="`background: ${stat.color}12; outline: 2px solid ${stat.color}28; outline-offset: 0`"
      >
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center flex-shrink-0" :style="`background: ${stat.color}24`">
          <component :is="stat.icon" class="w-6 h-6" :style="`color: ${stat.color}`" />
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">{{ stat.label }}</p>
          <p class="text-2xl font-black" :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Search & Filters ─────────────────────────────────────── -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input v-model="searchQuery" placeholder="Search by name or SKU…" class="w-full h-12 pl-11 pr-4 rounded-full text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 transition-all font-medium" />
      </div>
      <div class="flex gap-2">
        <button
          v-for="cat in ['All', 'Parts', 'Tools', 'Accessories']"
          :key="cat"
          class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
          :style="selectedCategory === (cat === 'All' ? null : cat)
            ? 'background: #8b5cf624; color: #8b5cf6; outline: 2px solid #8b5cf650; outline-offset: 0'
            : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
          @click="selectedCategory = cat === 'All' ? null : cat"
        >{{ cat }}</button>
      </div>
    </div>

    <!-- ── Inventory Grid ───────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="item in filteredInventory"
        :key="item.id"
        class="m3-item-card rounded-[28px] p-5 flex flex-col gap-4 cursor-pointer bg-card"
        style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
        @click="editItem(item)"
      >
        <div class="flex items-start justify-between">
          <div class="w-12 h-12 rounded-[22px] flex items-center justify-center" style="background: linear-gradient(135deg, #8b5cf620, #7c3aed20)">
            <Package class="w-6 h-6" style="color: #8b5cf6" />
          </div>
          <span
            class="text-[10px] font-black px-2.5 py-1 rounded-full"
            :style="item.stock <= (item.low || 5)
              ? 'background: #ef444420; color: #ef4444'
              : 'background: #10b98120; color: #10b981'"
          >
            {{ item.stock <= (item.low || 5) ? '⚠ LOW' : 'IN STOCK' }}
          </span>
        </div>
        <div class="flex-1">
          <h3 class="font-black text-sm leading-tight mb-1">{{ item.name }}</h3>
          <p class="text-xs text-muted-foreground font-medium">SKU: {{ item.sku }}</p>
          <p class="text-xs text-muted-foreground font-medium mt-0.5">{{ item.category }}</p>
        </div>
        <div class="flex items-end justify-between">
          <div>
            <p class="text-xl font-black" style="color: #8b5cf6">{{ formatCurrency(item.price) }}</p>
            <p class="text-xs text-muted-foreground font-semibold">Cost: {{ formatCurrency(item.cost || 0) }}</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-black">{{ item.stock }}</p>
            <p class="text-[10px] text-muted-foreground font-semibold">IN STOCK</p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredInventory.length === 0" class="col-span-full rounded-[32px] py-20 flex flex-col items-center gap-4 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="w-20 h-20 rounded-[32px] flex items-center justify-center" style="background: #8b5cf614">
          <Package class="w-10 h-10" style="color: #8b5cf6; opacity: 0.5" />
        </div>
        <div class="text-center">
          <h3 class="text-lg font-black mb-1">No items found</h3>
          <p class="text-sm text-muted-foreground font-medium">Add your first inventory item</p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="newItemOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px]" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
              <Package class="w-5 h-5 text-white m-2.5" />
            </div>
            <div>
              <h2 class="text-base font-black">{{ editingItem ? 'Edit Item' : 'Add Item' }}</h2>
              <p class="text-xs text-muted-foreground font-medium">Inventory details</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2 space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Item Name</label>
              <input v-model="itemForm.name" placeholder="Screen Replacement" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">SKU</label>
              <input v-model="itemForm.sku" placeholder="SKU-001" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Category</label>
              <input v-model="itemForm.category" placeholder="Parts" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Price</label>
              <input v-model.number="itemForm.price" type="number" step="0.01" placeholder="29.99" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Cost</label>
              <input v-model.number="itemForm.cost" type="number" step="0.01" placeholder="15.00" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Stock Qty</label>
              <input v-model.number="itemForm.stock" type="number" placeholder="10" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Low Stock Alert</label>
              <input v-model.number="itemForm.low" type="number" placeholder="5" class="m3-input" />
            </div>
          </div>
          <div class="flex gap-3 pt-1">
            <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="newItemOpen = false; editingItem = null">Cancel</button>
            <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 16px #8b5cf640" @click="saveItem">{{ editingItem ? 'Save Changes' : 'Add Item' }}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { Package, Search, Plus, RefreshCw, Box, AlertTriangle, TrendingDown, DollarSign } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const inventory = computed(() => appStore.inventory ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$' })

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const newItemOpen = ref(false)
const editingItem = ref<any>(null)
const itemForm = ref({ name: '', sku: '', category: '', price: 0, cost: 0, stock: 0, low: 5 })

const filteredInventory = computed(() =>
  inventory.value.filter(item => {
    const matchSearch = !searchQuery.value ||
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchCat = !selectedCategory.value || item.category === selectedCategory.value
    return matchSearch && matchCat
  })
)

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`

const inventoryStats = computed(() => [
  { label: 'Total Items',   value: inventory.value.length,                                    color: '#8b5cf6', icon: Package },
  { label: 'Total Value',   value: formatCurrency(inventory.value.reduce((a, i) => a + (i.price * i.stock), 0)), color: '#10b981', icon: DollarSign },
  { label: 'Low Stock',     value: inventory.value.filter(i => i.stock <= (i.low || 5)).length, color: '#f59e0b', icon: AlertTriangle },
  { label: 'Out of Stock',  value: inventory.value.filter(i => i.stock === 0).length,          color: '#ef4444', icon: TrendingDown },
])

const checkLowStock = () => {
  const low = inventory.value.filter(i => i.stock <= (i.low || 5))
  if (low.length === 0) alert('All items are well stocked!')
  else alert(`${low.length} item(s) need restocking:\n${low.map(i => `• ${i.name} (${i.stock} left)`).join('\n')}`)
}

const editItem = (item: any) => {
  editingItem.value = item
  itemForm.value = { ...item }
  newItemOpen.value = true
}

const saveItem = async () => {
  if (!itemForm.value.name) return alert('Please enter an item name')
  if (editingItem.value) {
    const idx = appStore.inventory.findIndex((i: any) => i.id === editingItem.value.id)
    if (idx > -1) appStore.inventory[idx] = { ...editingItem.value, ...itemForm.value }
  } else {
    const newItem = { ...itemForm.value, id: Date.now() }
    appStore.inventory.push(newItem)
  }
  await appStore.saveAll()
  newItemOpen.value = false
  editingItem.value = null
  itemForm.value = { name: '', sku: '', category: '', price: 0, cost: 0, stock: 0, low: 5 }
}
</script>

<style scoped>
.m3-stat-card { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-stat-card:hover  { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.m3-stat-card:active { transform: scale(0.96); }

.m3-item-card { transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease; }
.m3-item-card:hover  { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-item-card:active { transform: scale(0.96); }

.m3-btn-primary { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-btn-primary:hover  { transform: scale(1.05) translateY(-2px); }
.m3-btn-primary:active { transform: scale(0.92); }

.m3-btn-tonal {
  background: hsl(var(--muted)/0.7);
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
}
.m3-btn-tonal:hover  { transform: scale(1.04); }
.m3-btn-tonal:active { transform: scale(0.94); }

.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: hsl(var(--primary)/0.5); box-shadow: 0 0 0 3px hsl(var(--primary)/0.12); }
</style>