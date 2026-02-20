<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ───────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #8b5cf618">
          <Package class="w-5 h-5" style="color: #8b5cf6" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p class="text-xs text-muted-foreground mt-0.5">Track parts, tools, and accessories</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          class="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02]"
          style="background: hsl(var(--muted)/0.6); color: hsl(var(--foreground)); outline: 1.5px solid hsl(var(--border))"
          @click="checkLowStock"
        >
          <RefreshCw class="w-4 h-4" /> Check Stock
        </button>
        <button
          class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
          style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
          @click="newItemOpen = true"
        >
          <Plus class="w-4 h-4" /> Add Item
        </button>
      </div>
    </div>

    <!-- ── Stat Cards ────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="stat in inventoryStats" :key="stat.label" class="rounded-3xl p-4 flex items-center gap-3" :style="`background: ${stat.color}12; outline: 1px solid ${stat.color}25`">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" :style="`background: ${stat.color}20`">
          <component :is="stat.icon" class="w-5 h-5" :style="`color: ${stat.color}`" />
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
          <p class="text-2xl font-bold" :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ── Search & Filters ──────────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          v-model="searchQuery"
          placeholder="Search by name or SKU…"
          class="w-full h-10 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground"
        />
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="cat in ['All', 'Parts', 'Tools', 'Accessories']"
          :key="cat"
          class="px-3 py-1.5 rounded-2xl text-xs font-medium transition-all"
          :style="(filterCategory === null && cat === 'All') || filterCategory === cat
            ? 'background: #8b5cf622; color: #8b5cf6; outline: 1.5px solid #8b5cf650'
            : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
          @click="filterCategory = cat === 'All' ? null : cat"
        >{{ cat }}</button>
      </div>
    </div>

    <!-- ── Inventory Table ───────────────────────────────────────── -->
    <div class="rounded-3xl overflow-hidden bg-card" style="outline: 1px solid hsl(var(--border))">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b" style="background: hsl(var(--muted)/0.3)">
            <TableHead>Item</TableHead>
            <TableHead class="hidden sm:table-cell">Category</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead class="hidden md:table-cell">Cost</TableHead>
            <TableHead class="hidden md:table-cell">Price</TableHead>
            <TableHead class="hidden lg:table-cell">Margin</TableHead>
            <TableHead class="w-[110px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="item in filteredInventory"
            :key="item.id"
            class="transition-colors border-b border-border/40 last:border-0"
            :style="item.stock <= item.low ? 'background: #f59e0b05' : ''"
          >
            <TableCell>
              <div class="flex items-center gap-2">
                <div v-if="item.stock <= item.low" class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background: #f59e0b" />
                <div>
                  <p class="font-medium text-sm">{{ item.name }}</p>
                  <p class="text-xs text-muted-foreground">SKU: {{ item.sku }}</p>
                </div>
              </div>
            </TableCell>
            <TableCell class="hidden sm:table-cell">
              <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full" style="background: #8b5cf618; color: #8b5cf6">
                {{ item.category || 'Uncategorized' }}
              </span>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium" :style="item.stock <= item.low ? 'color: #ef4444' : item.stock <= item.low * 2 ? 'color: #f59e0b' : ''">
                  {{ item.stock }}
                </span>
                <span class="text-xs text-muted-foreground">units</span>
                <AlertTriangle v-if="item.stock <= item.low" class="w-3 h-3" style="color: #f59e0b" />
              </div>
            </TableCell>
            <TableCell class="hidden md:table-cell"><span class="text-sm">{{ formatCurrency(item.cost) }}</span></TableCell>
            <TableCell class="hidden md:table-cell"><span class="text-sm font-medium" style="color: #10b981">{{ formatCurrency(item.price) }}</span></TableCell>
            <TableCell class="hidden lg:table-cell"><span class="text-sm text-muted-foreground">{{ calculateMargin(item) }}%</span></TableCell>
            <TableCell>
              <div class="flex gap-1 justify-end">
                <button class="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110" style="background: #6366f112" @click="editItem(item)">
                  <Pencil class="w-3.5 h-3.5" style="color: #6366f1" />
                </button>
                <button class="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110" style="background: #3b82f612" @click="adjustStock(item)">
                  <PlusCircle class="w-3.5 h-3.5" style="color: #3b82f6" />
                </button>
                <button class="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110" style="background: #ef444412" @click="deleteItem(item.id)">
                  <Trash2 class="w-3.5 h-3.5" style="color: #ef4444" />
                </button>
              </div>
            </TableCell>
          </TableRow>

          <TableRow v-if="filteredInventory.length === 0">
            <TableCell colspan="7" class="h-48 text-center">
              <div class="flex flex-col items-center justify-center gap-3">
                <div class="w-14 h-14 rounded-3xl flex items-center justify-center" style="background: #8b5cf612">
                  <Package class="w-7 h-7" style="color: #8b5cf6" />
                </div>
                <p class="text-sm font-medium">{{ searchQuery || filterCategory ? 'No items match your filters' : 'No inventory items yet' }}</p>
                <p class="text-xs text-muted-foreground">{{ searchQuery || filterCategory ? 'Try clearing your search or filter.' : 'Start by adding parts, tools, or accessories.' }}</p>
                <button v-if="!searchQuery && !filterCategory" class="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold" style="background: #8b5cf618; color: #8b5cf6" @click="newItemOpen = true">
                  <Plus class="w-3.5 h-3.5" /> Add First Item
                </button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- ── Add/Edit Item Dialog ──────────────────────────────────── -->
    <Dialog v-model:open="newItemOpen">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #8b5cf608">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #8b5cf620">
            <Package class="w-4 h-4" style="color: #8b5cf6" />
          </div>
          <div>
            <h2 class="font-semibold text-base">{{ editingItem ? 'Edit Item' : 'Add New Item' }}</h2>
            <p class="text-xs text-muted-foreground mt-0.5">{{ editingItem ? 'Update item details' : 'Add a new inventory item' }}</p>
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item Name *</label>
            <input v-model="itemForm.name" placeholder="e.g., iPhone 13 Screen" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU *</label>
              <input v-model="itemForm.sku" placeholder="e.g., SCR-IP13" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
              <div class="flex gap-1.5 flex-wrap pt-1">
                <button v-for="cat in ['Parts','Tools','Accessories']" :key="cat"
                  class="px-2.5 py-1 rounded-xl text-xs font-semibold transition-all"
                  :style="itemForm.category === cat ? 'background: #8b5cf622; color: #8b5cf6; outline: 1.5px solid #8b5cf650' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                  @click="itemForm.category = cat"
                >{{ cat }}</button>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock Quantity *</label>
              <input v-model.number="itemForm.stock" type="number" min="0" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Low Stock Alert *</label>
              <input v-model.number="itemForm.low" type="number" min="0" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cost Price *</label>
              <input v-model.number="itemForm.cost" type="number" min="0" step="0.01" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selling Price *</label>
              <input v-model.number="itemForm.price" type="number" min="0" step="0.01" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-violet-500/30 text-foreground" />
            </div>
          </div>
          <div class="flex items-center justify-between rounded-2xl px-4 py-3" style="background: #10b98112">
            <p class="text-sm text-muted-foreground">Profit Margin</p>
            <span class="text-sm font-bold" style="color: #10b981">{{ calculateFormMargin() }}%</span>
          </div>
          <div class="flex gap-3 pt-2">
            <button class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-muted/60" style="outline: 1.5px solid hsl(var(--border))" @click="cancelEdit">Cancel</button>
            <button class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02]" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" @click="saveItem">
              {{ editingItem ? 'Update Item' : 'Add Item' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Adjust Stock Dialog ───────────────────────────────────── -->
    <Dialog v-model:open="adjustStockOpen">
      <DialogContent class="rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #3b82f608">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #3b82f620">
            <PlusCircle class="w-4 h-4" style="color: #3b82f6" />
          </div>
          <div>
            <h2 class="font-semibold text-base">Adjust Stock</h2>
            <p class="text-xs text-muted-foreground mt-0.5">{{ selectedItem?.name }}</p>
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div class="flex items-center justify-between rounded-2xl px-4 py-3" style="background: hsl(var(--muted)/0.4)">
            <p class="text-sm text-muted-foreground">Current Stock</p>
            <p class="text-2xl font-bold">{{ selectedItem?.stock }} <span class="text-sm font-normal text-muted-foreground">units</span></p>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adjustment Type</label>
            <div class="flex gap-2">
              <button v-for="type in [{v:'add',label:'Add'},{v:'remove',label:'Remove'},{v:'set',label:'Set'}]" :key="type.v"
                class="flex-1 py-2 rounded-2xl text-xs font-semibold transition-all"
                :style="adjustmentType === type.v ? 'background: #3b82f622; color: #3b82f6; outline: 1.5px solid #3b82f650' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                @click="adjustmentType = type.v"
              >{{ type.label }}</button>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantity</label>
            <input v-model.number="adjustmentQty" type="number" min="0" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-blue-500/30 text-foreground" />
          </div>
          <div class="flex items-center justify-between rounded-2xl px-4 py-2.5" style="background: #3b82f608; outline: 1px solid #3b82f620">
            <p class="text-sm text-muted-foreground">New stock will be</p>
            <span class="text-lg font-bold" style="color: #3b82f6">{{ calculateNewStock() }} units</span>
          </div>
          <div class="flex gap-3 pt-2">
            <button class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-muted/60" style="outline: 1.5px solid hsl(var(--border))" @click="adjustStockOpen = false">Cancel</button>
            <button class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02]" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" @click="applyStockAdjustment">Apply</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

import type { InventoryItem } from '~/types'
import {
  Search, RefreshCw, Plus, Package, AlertTriangle, DollarSign, BarChart3, Pencil, PlusCircle, Trash2
} from 'lucide-vue-next'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/table'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { ref, computed } from 'vue'

definePageMeta({
  middleware: ['auth']
})

const appStore = useAppStore()
const { inventory, settings, isLoaded } = storeToRefs(appStore)
const { createInventoryItem, updateInventoryItem, deleteInventoryItem } = appStore

const searchQuery = ref('')
const filterCategory = ref<string | null>(null)
const newItemOpen = ref(false)
const adjustStockOpen = ref(false)
const editingItem = ref<InventoryItem | null>(null)
const selectedItem = ref<InventoryItem | null>(null)
const adjustmentType = ref('add')
const adjustmentQty = ref(0)

const itemForm = ref({
  name: '',
  sku: '',
  category: 'Parts',
  stock: 0,
  low: 5,
  cost: 0,
  price: 0
})

const filteredInventory = computed(() => {
  return (inventory.value || []).filter(item => {
    const query = searchQuery.value.toLowerCase()
    const matchesSearch = item.name.toLowerCase().includes(query) || (item.sku || "").toLowerCase().includes(query)
    const matchesCategory = !filterCategory.value || (item as any).category === filterCategory.value
    return matchesSearch && matchesCategory
  })
})

const lowStockCount = computed(() => (inventory.value || []).filter(item => item.stock <= item.low).length)
const totalValue = computed(() => (inventory.value || []).reduce((sum, item) => sum + (item.price * item.stock), 0))
const totalStock = computed(() => (inventory.value || []).reduce((sum, item) => sum + item.stock, 0))

const inventoryStats = computed(() => [
  { label: 'Total Items', value: (inventory.value || []).length,     color: '#3b82f6', icon: Package },
  { label: 'Low Stock',   value: lowStockCount.value,                 color: '#f59e0b', icon: AlertTriangle },
  { label: 'Total Value', value: formatCurrency(totalValue.value),    color: '#10b981', icon: DollarSign },
  { label: 'In Stock',    value: totalStock.value,                    color: '#8b5cf6', icon: BarChart3 },
])

const formatCurrency = (amount: number) => `${settings.value.currency}${amount.toFixed(2)}`
const calculateMargin = (item: InventoryItem) => item.price === 0 ? 0 : Math.round(((item.price - item.cost) / item.price) * 100)
const calculateFormMargin = () => itemForm.value.price === 0 ? 0 : Math.round(((itemForm.value.price - itemForm.value.cost) / itemForm.value.price) * 100)
const calculateNewStock = () => {
  if (!selectedItem.value) return 0
  if (adjustmentType.value === 'add') return selectedItem.value.stock + adjustmentQty.value
  else if (adjustmentType.value === 'remove') return Math.max(0, selectedItem.value.stock - adjustmentQty.value)
  else return adjustmentQty.value
}

const saveItem = async () => {
  if (!itemForm.value.name || !itemForm.value.sku) {
    alert('Name and SKU are required')
    return
  }
  try {
    if (editingItem.value) {
      await updateInventoryItem(editingItem.value.id, { ...itemForm.value })
    } else {
      await createInventoryItem({ ...itemForm.value })
    }
    cancelEdit()
  } catch (err: any) {
    alert('Failed to save item: ' + (err.message || err))
  }
}

const editItem = (item: InventoryItem) => {
  editingItem.value = item
  itemForm.value = { ...item, category: (item as any).category || 'Parts' }
  newItemOpen.value = true
}

const cancelEdit = () => {
  newItemOpen.value = false
  editingItem.value = null
  itemForm.value = { name: '', sku: '', category: 'Parts', stock: 0, low: 5, cost: 0, price: 0 }
}

const adjustStock = (item: InventoryItem) => {
  selectedItem.value = item
  adjustmentType.value = 'add'
  adjustmentQty.value = 0
  adjustStockOpen.value = true
}

const applyStockAdjustment = async () => {
  if (!selectedItem.value) return
  try {
    await updateInventoryItem(selectedItem.value.id, { stock: calculateNewStock() })
  } catch (err: any) {
    alert('Failed to adjust stock: ' + (err.message || err))
  }
  adjustStockOpen.value = false
  selectedItem.value = null
}

const deleteItem = async (id: number) => {
  const item = (inventory.value || []).find(i => i.id === id)
  if (!item) return
  if (confirm(`Delete ${item.name}? This cannot be undone.`)) {
    try {
      await deleteInventoryItem(id)
    } catch (err: any) {
      alert('Failed to delete item: ' + (err.message || err))
    }
  }
}

const checkLowStock = () => {
  const lowItems = (inventory.value || []).filter(item => item.stock <= item.low)
  if (lowItems.length === 0) {
    alert('All good! No low stock items')
  } else {
    alert(`Low stock alert: ${lowItems.length} item(s) need restocking`)
  }
}
</script>
