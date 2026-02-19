<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Inventory</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Track parts, tools, and accessories</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="checkLowStock">
          <RefreshCw class="w-4 h-4 mr-2" />
          Check Stock
        </Button>
        <Button size="sm" @click="newItemOpen = true">
          <Plus class="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Package class="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Total Items</p>
            <p class="text-2xl font-bold">{{ (inventory || []).length }}</p>
          </div>
        </CardContent>
      </Card>

      <Card :class="lowStockCount > 0 ? 'border-amber-500/30' : ''">
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle class="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Low Stock</p>
            <p class="text-2xl font-bold" :class="lowStockCount > 0 ? 'text-amber-500' : ''">{{ lowStockCount }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <DollarSign class="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Total Value</p>
            <p class="text-2xl font-bold">{{ formatCurrency(totalValue) }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 class="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p class="text-xs text-muted-foreground">In Stock</p>
            <p class="text-2xl font-bold">{{ totalStock }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Search & Filters -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search by name or SKU..."
          class="pl-9 h-9"
        />
      </div>
      <Select v-model="filterCategory">
        <SelectTrigger class="w-[160px] h-9">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="null">All Categories</SelectItem>
          <SelectItem value="Parts">Parts</SelectItem>
          <SelectItem value="Tools">Tools</SelectItem>
          <SelectItem value="Accessories">Accessories</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Inventory Table -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
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
              :class="item.stock <= item.low ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-muted/30'"
              class="transition-colors"
            >
              <TableCell>
                <div class="flex items-center gap-2">
                  <!-- Low stock indicator dot -->
                  <div
                    v-if="item.stock <= item.low"
                    class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"
                    title="Low stock"
                  />
                  <div>
                    <p class="font-medium text-sm">{{ item.name }}</p>
                    <p class="text-xs text-muted-foreground">SKU: {{ item.sku }}</p>
                  </div>
                </div>
              </TableCell>

              <TableCell class="hidden sm:table-cell">
                <Badge variant="outline" class="text-xs font-normal">
                  {{ item.category || 'Uncategorized' }}
                </Badge>
              </TableCell>

              <TableCell>
                <div class="flex items-center gap-1.5">
                  <span
                    class="text-sm font-medium"
                    :class="{
                      'text-red-500': item.stock <= item.low,
                      'text-amber-500': item.stock > item.low && item.stock <= item.low * 2,
                      'text-foreground': item.stock > item.low * 2
                    }"
                  >
                    {{ item.stock }}
                  </span>
                  <span class="text-xs text-muted-foreground">units</span>
                  <AlertTriangle v-if="item.stock <= item.low" class="w-3 h-3 text-amber-500" />
                </div>
              </TableCell>

              <TableCell class="hidden md:table-cell">
                <span class="text-sm">{{ formatCurrency(item.cost) }}</span>
              </TableCell>

              <TableCell class="hidden md:table-cell">
                <span class="text-sm font-medium text-emerald-600 dark:text-emerald-400">{{ formatCurrency(item.price) }}</span>
              </TableCell>

              <TableCell class="hidden lg:table-cell">
                <span class="text-sm text-muted-foreground">{{ calculateMargin(item) }}%</span>
              </TableCell>

              <TableCell>
                <div class="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" class="h-7 w-7" @click="editItem(item)" title="Edit">
                    <Pencil class="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-7 w-7" @click="adjustStock(item)" title="Adjust stock">
                    <PlusCircle class="w-3.5 h-3.5 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:text-destructive" @click="deleteItem(item.id)" title="Delete">
                    <Trash2 class="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <TableRow v-if="filteredInventory.length === 0">
              <TableCell colspan="7" class="h-48 text-center">
                <div class="flex flex-col items-center justify-center">
                  <Package class="w-10 h-10 text-muted-foreground opacity-40 mb-3" />
                  <p class="text-sm font-medium mb-1">
                    {{ searchQuery || filterCategory ? 'No items match your filters' : 'No inventory items yet' }}
                  </p>
                  <p class="text-xs text-muted-foreground mb-4">
                    {{ searchQuery || filterCategory ? 'Try clearing your search or filter.' : 'Start by adding parts, tools, or accessories.' }}
                  </p>
                  <Button v-if="!searchQuery && !filterCategory" size="sm" variant="outline" @click="newItemOpen = true">
                    <Plus class="w-3.5 h-3.5 mr-1.5" />Add First Item
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- New/Edit Item Dialog -->
    <Dialog v-model:open="newItemOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ editingItem ? 'Edit Item' : 'Add New Item' }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="item-name">Item Name *</Label>
            <Input id="item-name" v-model="itemForm.name" placeholder="e.g., iPhone 13 Screen" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="sku">SKU *</Label>
              <Input id="sku" v-model="itemForm.sku" placeholder="e.g., SCR-IP13" />
            </div>

            <div class="space-y-2">
              <Label for="category">Category *</Label>
              <Select v-model="itemForm.category">
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parts">Parts</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="stock">Stock Quantity *</Label>
              <Input id="stock" v-model.number="itemForm.stock" type="number" min="0" />
            </div>

            <div class="space-y-2">
              <Label for="low">Low Stock Alert *</Label>
              <Input id="low" v-model.number="itemForm.low" type="number" min="0" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="cost">Cost Price *</Label>
              <Input id="cost" v-model.number="itemForm.cost" type="number" min="0" step="0.01" />
            </div>

            <div class="space-y-2">
              <Label for="price">Selling Price *</Label>
              <Input id="price" v-model.number="itemForm.price" type="number" min="0" step="0.01" />
            </div>
          </div>

          <div class="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-2.5">
            <p class="text-sm text-muted-foreground">Profit Margin</p>
            <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{{ calculateFormMargin() }}%</span>
          </div>

          <div class="flex gap-3 pt-2">
            <Button variant="outline" class="flex-1" @click="cancelEdit">
              Cancel
            </Button>
            <Button class="flex-1" @click="saveItem">
              {{ editingItem ? 'Update Item' : 'Add Item' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Adjust Stock Dialog -->
    <Dialog v-model:open="adjustStockOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock — {{ selectedItem?.name }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-3">
            <p class="text-sm text-muted-foreground">Current Stock</p>
            <p class="text-2xl font-bold">{{ selectedItem?.stock }} <span class="text-sm font-normal text-muted-foreground">units</span></p>
          </div>

          <div class="space-y-2">
            <Label>Adjustment Type</Label>
            <Select v-model="adjustmentType">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Stock</SelectItem>
                <SelectItem value="remove">Remove Stock</SelectItem>
                <SelectItem value="set">Set Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="adj-qty">Quantity</Label>
            <Input id="adj-qty" v-model.number="adjustmentQty" type="number" min="0" />
          </div>

          <div class="flex items-center justify-between bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-2.5">
            <p class="text-sm text-muted-foreground">New stock will be</p>
            <span class="text-lg font-bold text-blue-500">{{ calculateNewStock() }} units</span>
          </div>

          <div class="flex gap-3 pt-2">
            <Button variant="outline" class="flex-1" @click="adjustStockOpen = false">
              Cancel
            </Button>
            <Button class="flex-1" @click="applyStockAdjustment">
              Apply
            </Button>
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
  Search,
  RefreshCw,
  Plus,
  Package,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Pencil,
  PlusCircle,
  Trash2
} from 'lucide-vue-next'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'

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
