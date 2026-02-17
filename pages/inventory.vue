<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row gap-4 justify-between">
      <div class="flex-1 relative">
        <Search class="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search inventory..."
          class="pl-10 h-11"
        />
      </div>
      <div class="flex gap-2">
        <Select v-model="filterCategory">
          <SelectTrigger class="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="null">All Categories</SelectItem>
            <SelectItem value="Parts">Parts</SelectItem>
            <SelectItem value="Tools">Tools</SelectItem>
            <SelectItem value="Accessories">Accessories</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="lg" @click="checkLowStock">
          <RefreshCw class="w-4 h-4 mr-2" />
          Check Stock
        </Button>
        <Button size="lg" @click="newItemOpen = true">
          <Plus class="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package class="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Total Items</p>
              <p class="text-2xl font-bold">{{ (inventory || []).length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle class="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Low Stock</p>
              <p class="text-2xl font-bold">{{ lowStockCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign class="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Total Value</p>
              <p class="text-2xl font-bold">{{ formatCurrency(totalValue) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 class="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">In Stock</p>
              <p class="text-2xl font-bold">{{ totalStock }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Inventory Table -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead class="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredInventory" :key="item.id">
              <TableCell>
                <div>
                  <p class="font-medium">{{ item.name }}</p>
                  <p class="text-sm text-muted-foreground">SKU: {{ item.sku }}</p>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant="outline" class="text-xs">
                  {{ item.category || 'Uncategorized' }}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge 
                  :class="item.stock <= item.low ? 'bg-red-500/10 text-red-500' : 
                         item.stock <= item.low * 2 ? 'bg-amber-500/10 text-amber-500' : 
                         'bg-emerald-500/10 text-emerald-500'"
                >
                  {{ item.stock }} units
                </Badge>
              </TableCell>

              <TableCell>
                <span>{{ formatCurrency(item.cost) }}</span>
              </TableCell>

              <TableCell>
                <span class="text-emerald-500 font-medium">{{ formatCurrency(item.price) }}</span>
              </TableCell>

              <TableCell>
                <span>{{ calculateMargin(item) }}%</span>
              </TableCell>

              <TableCell>
                <div class="flex gap-1">
                  <Button variant="ghost" size="icon" @click="editItem(item)">
                    <Pencil class="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" @click="adjustStock(item)">
                    <PlusCircle class="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" @click="deleteItem(item.id)">
                    <Trash2 class="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <TableRow v-if="filteredInventory.length === 0">
              <TableCell colspan="7" class="h-24 text-center">
                <div class="flex flex-col items-center justify-center py-8">
                  <Package class="w-12 h-12 text-muted-foreground opacity-50 mb-2" />
                  <p class="text-muted-foreground">No inventory items found</p>
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

          <Card>
            <CardContent class="p-3">
              <p class="text-sm text-muted-foreground">
                Profit Margin: 
                <span class="text-emerald-500 font-medium">
                  {{ calculateFormMargin() }}%
                </span>
              </p>
            </CardContent>
          </Card>
          
          <div class="flex gap-3 pt-4">
            <Button variant="outline" class="flex-1" @click="cancelEdit">
              Cancel
            </Button>
            <Button class="flex-1" @click="saveItem">
              {{ editingItem ? 'Update' : 'Add' }} Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Adjust Stock Dialog -->
    <Dialog v-model:open="adjustStockOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock: {{ selectedItem?.name }}</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <Card>
            <CardContent class="p-4">
              <p class="text-sm text-muted-foreground">Current Stock</p>
              <p class="text-2xl font-bold">{{ selectedItem?.stock }} units</p>
            </CardContent>
          </Card>

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

          <Card class="border-blue-500/20 bg-blue-500/5">
            <CardContent class="p-3">
              <p class="text-sm text-blue-500">
                New stock will be: 
                <span class="font-bold">{{ calculateNewStock() }} units</span>
              </p>
            </CardContent>
          </Card>
          
          <div class="flex gap-3 pt-4">
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
const { saveAll } = appStore

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

const saveItem = () => {
  if (!itemForm.value.name || !itemForm.value.sku) {
    alert('Name and SKU are required')
    return
  }
  if (editingItem.value) {
    const index = (inventory.value || []).findIndex(i => i.id === editingItem.value!.id)
    if (index > -1) {
      inventory.value[index] = { ...editingItem.value, ...itemForm.value }
    }
  } else {
    const newItem: any = {
      id: Math.max(...(inventory.value || []).map(i => i.id), 0) + 1,
      ...itemForm.value
    }
    inventory.value.push(newItem)
  }
  saveAll()
  cancelEdit()
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

const applyStockAdjustment = () => {
  if (!selectedItem.value) return
  const item = (inventory.value || []).find(i => i.id === selectedItem.value!.id)
  if (item) {
    item.stock = calculateNewStock()
    saveAll()
  }
  adjustStockOpen.value = false
  selectedItem.value = null
}

const deleteItem = (id: number) => {
  const item = (inventory.value || []).find(i => i.id === id)
  if (!item) return
  if (confirm(`Delete ${item.name}? This cannot be undone.`)) {
    const index = (inventory.value || []).findIndex(i => i.id === id)
    if (index > -1) {
      inventory.value.splice(index, 1)
      saveAll()
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
