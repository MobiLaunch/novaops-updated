<template>
  <div class="page-shell">
    <header class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
          style="background: linear-gradient(135deg,#8b5cf6,#7c3aed)"
        >
          <i class="mdi mdi-package-variant-closed text-xl"></i>
        </div>
        <div>
          <h1 class="text-xl font-black m-0">Inventory & Services</h1>
          <p class="text-sm text-muted-foreground m-0">Track parts, tools, accessories & repair services</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <v-btn variant="outlined" class="text-none" @click="handleBatchPrint"><i class="mdi mdi-printer mr-1"></i> Print Labels</v-btn>
        <v-btn variant="outlined" class="text-none" @click="checkLowStock"><i class="mdi mdi-alert-outline mr-1"></i> Low Stock</v-btn>
        <v-btn class="text-none font-bold text-white" style="background: linear-gradient(135deg,#8b5cf6,#7c3aed)" @click="openNew">
          <i class="mdi mdi-plus mr-1"></i> Add Item
        </v-btn>
      </div>
    </header>

    <v-tabs v-model="activeTab" bg-color="transparent" color="primary" align-tabs="start">
      <v-tab value="stock"><i class="mdi mdi-package-variant-closed mr-1"></i> Stock & Services</v-tab>
      <v-tab value="services"><i class="mdi mdi-wrench-outline mr-1"></i> Service Pricing</v-tab>
      <v-tab value="tradein"><i class="mdi mdi-swap-horizontal mr-1"></i> Trade-In</v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="pt-4">
      <v-window-item value="stock">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="kpi-card stat-card"
            :style="`background:${stat.color}12; outline:2px solid ${stat.color}28`"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="`background:${stat.color}24;color:${stat.color}`">
                <i class="mdi text-xl" :class="stat.icon"></i>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :style="`background:${stat.color}20;color:${stat.color}`">{{ stat.badge }}</span>
            </div>
            <div class="text-xs text-muted-foreground">{{ stat.label }}</div>
            <div class="text-2xl font-black" :style="`color:${stat.color}`">{{ stat.value }}</div>
          </div>
        </div>

        <div class="bg-surface border border-border rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <v-text-field
            v-model="q"
            placeholder="Search by name, SKU, or category…"
            prepend-inner-icon="mdi-magnify"
            hide-details
            variant="outlined"
            density="compact"
            class="flex-1 min-w-[200px] rounded-full"
          />
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in typeOptions"
              :key="t.value ?? 'all'"
              type="button"
              class="filter-chip"
              :class="{ 'filter-chip--active': typeFilter === t.value }"
              @click="typeFilter = t.value"
            >{{ t.label }}</button>
          </div>
          <div v-if="dynamicCategories.length" class="flex flex-wrap gap-2">
            <button
              v-for="cat in ['All', ...dynamicCategories]"
              :key="cat"
              type="button"
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedCat === (cat === 'All' ? null : cat) }"
              @click="selectedCat = cat === 'All' ? null : cat"
            >{{ cat }}</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="item in filtered"
            :key="item.id"
            class="item-card bg-surface border border-border rounded-xl p-4 flex flex-col cursor-pointer h-full"
            @click="openEdit(item)"
          >
            <div class="flex items-start justify-between mb-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center"
                :style="item.itemType === 'service' ? 'background:#22d3ee18;color:#22d3ee' : 'background:#8b5cf620;color:#8b5cf6'"
              >
                <i class="mdi text-xl" :class="item.itemType === 'service' ? 'mdi-wrench-outline' : 'mdi-package-variant-closed'"></i>
              </div>
              <div class="flex flex-col items-end gap-1">
                <v-chip size="x-small" class="text-[9px] font-bold">
                  {{ item.itemType === 'service' ? 'SERVICE' : 'PRODUCT' }}
                </v-chip>
                <v-chip
                  :color="item.itemType === 'service' ? 'info' : item.stock <= (item.low || 5) ? 'error' : 'success'"
                  size="x-small"
                  class="text-[9px] font-bold"
                >
                  {{ item.itemType === 'service' ? 'AVAILABLE' : item.stock <= (item.low || 5) ? 'LOW' : 'IN STOCK' }}
                </v-chip>
              </div>
            </div>
            <div class="flex-1 mb-3 min-w-0">
              <div class="text-sm font-black mb-1 truncate">{{ item.name }}</div>
              <div class="text-xs text-muted-foreground truncate">
                {{ item.itemType !== 'service' ? `SKU: ${item.sku || '—'}` : (item.description || '') }}
              </div>
              <div class="text-xs text-muted-foreground">{{ item.category }}</div>
            </div>
            <hr class="border-border mb-3" />
            <div class="flex items-end justify-between">
              <div>
                <div class="text-lg font-black" :style="item.itemType === 'service' ? 'color:#22d3ee' : 'color:#8b5cf6'">{{ formatCurrency(item.price) }}</div>
                <div v-if="item.itemType !== 'service'" class="text-xs text-muted-foreground">Cost: {{ formatCurrency(item.cost || 0) }}</div>
                <div v-else class="text-xs text-muted-foreground">
                  {{ item.estimated_minutes || item.duration ? `~${item.estimated_minutes || item.duration} min` : 'Labor rate' }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-xl font-black">{{ item.itemType !== 'service' ? item.stock : '∞' }}</div>
                <div class="text-[10px] font-bold text-muted-foreground">{{ item.itemType !== 'service' ? 'UNITS' : 'UNLIMITED' }}</div>
              </div>
            </div>
          </div>
          <div v-if="!filtered.length" class="col-span-full text-center py-12 border border-dashed border-border rounded-xl">
            <i class="mdi mdi-package-variant-closed text-5xl text-violet-500 opacity-40 block mb-2"></i>
            <p class="font-black m-0">No items found</p>
            <p class="text-sm text-muted-foreground">{{ q ? 'Try a different search' : 'Add your first item' }}</p>
          </div>
        </div>
      </v-window-item>

      <v-window-item value="services">
        <div class="bg-surface border border-border rounded-xl overflow-hidden">
          <div class="p-4 border-b border-border flex items-center gap-3" style="background:#10b98108">
            <div class="w-10 h-10 rounded-xl text-white flex items-center justify-center" style="background:linear-gradient(135deg,#10b981,#059669)">
              <i class="mdi mdi-wrench-outline"></i>
            </div>
            <div>
              <div class="font-black text-sm">Service Pricing</div>
              <div class="text-xs text-muted-foreground">Manage repair services, prices, and time estimates</div>
            </div>
          </div>
          <div class="p-6">
            <div v-if="!servicesList.length" class="text-center py-10 text-muted-foreground">
              <i class="mdi mdi-wrench-outline text-5xl opacity-40 block mb-2"></i>
              <p class="font-bold m-0">No services yet</p>
              <p class="text-xs">Use Add Item with type Service</p>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="svc in servicesList"
                :key="svc.id"
                class="item-card border border-emerald-500/30 rounded-xl p-4 cursor-pointer"
                @click="openEdit(svc)"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                    <i class="mdi mdi-wrench-outline"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold truncate">{{ svc.name }}</div>
                    <div class="text-xs text-muted-foreground truncate">{{ svc.category || 'Services' }}</div>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-lg font-black text-emerald-600">{{ formatCurrency(svc.price) }}</span>
                  <v-chip v-if="svc.estimated_minutes" color="success" size="x-small" class="font-bold">{{ svc.estimated_minutes }} min</v-chip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-window-item>

      <v-window-item value="tradein">
        <div class="text-center py-12 px-6 border border-amber-500/30 rounded-xl bg-amber-500/5 max-w-lg mx-auto">
          <i class="mdi mdi-swap-horizontal text-5xl text-amber-500 block mb-4"></i>
          <h2 class="text-xl font-black m-0 mb-2">Trade-In Evaluator</h2>
          <p class="text-sm text-muted-foreground mb-6">
            Assess customer devices, calculate condition-based offers, and add purchased devices to inventory.
          </p>
          <v-btn color="warning" class="text-none font-bold" @click="tradeInWizardOpen = true">
            <i class="mdi mdi-calculator mr-1"></i> Start New Evaluation
          </v-btn>
        </div>
      </v-window-item>
    </v-window>

    <v-dialog v-model="newOpen" max-width="500px">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="pa-0 mb-1 text-lg font-bold">
          {{ editingItem ? 'Edit Item' : 'Add Item' }}
        </v-card-title>
        <p class="text-xs text-muted-foreground mt-0 mb-4">{{ form.itemType === 'service' ? 'Service or labor item' : 'Inventory details' }}</p>
        
        <v-btn-toggle
          v-model="form.itemType"
          mandatory
          color="primary"
          variant="outlined"
          class="mb-4 w-full justify-center"
        >
          <v-btn value="product" class="text-none flex-grow-1">Product</v-btn>
          <v-btn value="service" class="text-none flex-grow-1">Service</v-btn>
        </v-btn-toggle>

        <div class="flex flex-col gap-3">
          <v-text-field
            v-model="form.name"
            :placeholder="form.itemType === 'service' ? 'Service name' : 'Item name'"
            hide-details
            variant="outlined"
            density="compact"
            class="w-full rounded-xl"
          />
          <template v-if="form.itemType === 'product'">
            <div class="grid grid-cols-2 gap-3">
              <v-text-field v-model="form.sku" placeholder="SKU" hide-details variant="outlined" density="compact" class="rounded-xl" />
              <v-select v-model="form.category" :items="allCategories" placeholder="Category" hide-details variant="outlined" density="compact" class="w-full" />
              <v-text-field v-model.number="form.price" type="number" placeholder="Price" hide-details variant="outlined" density="compact" class="rounded-xl" />
              <v-text-field v-model.number="form.cost" type="number" placeholder="Cost" hide-details variant="outlined" density="compact" class="rounded-xl" />
              <v-text-field v-model.number="form.stock" type="number" placeholder="Stock qty" hide-details variant="outlined" density="compact" class="rounded-xl" />
              <v-text-field v-model.number="form.low" type="number" placeholder="Low stock alert" hide-details variant="outlined" density="compact" class="rounded-xl" />
            </div>
          </template>
          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <v-text-field v-model.number="form.price" type="number" placeholder="Price ($)" hide-details variant="outlined" density="compact" class="rounded-xl" />
              <v-text-field v-model.number="form.estimated_minutes" type="number" placeholder="Duration (min)" hide-details variant="outlined" density="compact" class="rounded-xl" />
            </div>
            <v-text-field v-model="form.category" placeholder="Category" hide-details variant="outlined" density="compact" class="rounded-xl w-full" />
            <v-textarea v-model="form.description" rows="2" placeholder="Description" hide-details variant="outlined" density="compact" class="w-full rounded-xl" />
          </template>
        </div>
        
        <div class="flex justify-end gap-2 mt-4">
          <v-btn v-if="editingItem" variant="outlined" class="text-none mr-auto" @click="printCurrentLabel">Print Label</v-btn>
          <v-btn variant="text" class="text-none" @click="newOpen = false; editingItem = null">Cancel</v-btn>
          <v-btn color="primary" class="text-none font-bold" :loading="isSaving" @click="saveItem">{{ editingItem ? 'Save Changes' : 'Add Item' }}</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="batchPrintConfirmOpen" max-width="400px">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="pa-0 mb-3 text-lg font-bold">Print {{ batchPrintCount }} labels?</v-card-title>
        <p class="text-sm text-muted-foreground m-0 mb-4">Make sure your label printer is ready.</p>
        <div class="flex justify-end gap-2">
          <v-btn variant="text" class="text-none" @click="batchPrintConfirmOpen = false">Cancel</v-btn>
          <v-btn color="warning" class="text-none" @click="executeBatchPrint">Print All</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <TradeInWizard v-model="tradeInWizardOpen" @saved="handleTradeInSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '~/composables/useToast'
import { useAppStore } from '~/stores/app'
import { printBarcodeLabel, printBarcodeBatch } from '~/utils/print'
import TradeInWizard from '~/components/TradeInWizard.vue'

definePageMeta({ middleware: ['auth'] })

const appStore  = useAppStore()
const settings  = computed(() => appStore.settings ?? { currency: '$' })

const allItems = computed(() => {
  const products = (appStore.inventory ?? []).map((i: any) => ({ ...i, itemType: i.itemType || i.item_type || 'product' }))
  const services = (appStore.services ?? []).map((s: any) => ({ ...s, itemType: 'service', stock: 9999, low: 0, sku: s.sku || '' }))
  return [...products, ...services]
})

const servicesList = computed(() => allItems.value.filter((i: any) => i.itemType === 'service'))

const q            = ref('')
const selectedCat  = ref<string|null>(null)
const typeFilter   = ref<string|null>(null)
const newOpen      = ref(false)
const editingItem  = ref<any>(null)
const isSaving     = ref(false)

const activeTab = ref('stock')
const tradeInWizardOpen = ref(false)

const handleTradeInSaved = () => {
  toast.success('Trade-In Complete', 'Device added to inventory')
  tradeInWizardOpen.value = false
  activeTab.value = 'stock'
}

const typeOptions = [
  { label: 'All', value: null },
  { label: 'Products', value: 'product' },
  { label: 'Services', value: 'service' },
]

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
    { label: 'Total Items',  value: allItems.value.length,  color: '#8b5cf6', badge: 'TOTAL',    icon: 'mdi-package-variant-closed' },
    { label: 'Products',     value: products.length,         color: '#6366f1', badge: 'PRODUCTS', icon: 'mdi-package-variant-closed' },
    { label: 'Services',     value: services.length,         color: '#22d3ee', badge: 'SERVICES', icon: 'mdi-wrench-outline'  },
    { label: 'Low Stock',    value: products.filter((i: any) => i.stock <= (i.low||5)).length, color: '#f59e0b', badge: 'ALERT', icon: 'mdi-alert-outline' },
  ]
})

const { toast } = useToast()
const batchPrintConfirmOpen = ref(false)
const batchPrintCount = ref(0)
let pendingBatchPayload: any[] = []

const checkLowStock = () => {
  const low = allItems.value.filter((i: any) => i.itemType === 'product' && i.stock <= (i.low||5))
  if (!low.length) toast.success('All Stocked', 'All products are well stocked!')
  else toast.warning('Low Stock Alert', `${low.length} item(s) need restocking`)
}

const openNew = () => { form.value = blankForm(); editingItem.value = null; newOpen.value = true }
const openEdit = (item: any) => {
  editingItem.value = item
  form.value = { ...blankForm(), ...item, itemType: item.itemType || 'product' }
  newOpen.value = true
}

const saveItem = async () => {
  if (!form.value.name.trim()) { toast.warning('Name required', 'Please enter an item name'); return }
  if (isSaving.value) return
  isSaving.value = true
  try {
    if (form.value.itemType === 'service') {
      const payload = { name: form.value.name, category: form.value.category, description: form.value.description, price: form.value.price, estimated_minutes: form.value.estimated_minutes, duration: form.value.estimated_minutes, active: true }
      if (editingItem.value && editingItem.value.itemType === 'service') await appStore.updateService(editingItem.value.id, payload)
      else await appStore.createService(payload)
    } else {
      const payload = { ...form.value }
      if (editingItem.value && editingItem.value.itemType !== 'service') await appStore.updateInventoryItem(editingItem.value.id, payload)
      else await appStore.createInventoryItem(payload)
    }
    toast.success(editingItem.value ? 'Item Updated' : 'Item Added', form.value.name)
    newOpen.value = false; editingItem.value = null; form.value = blankForm()
  } catch (e) {
    console.error('Save failed', e); toast.danger('Save Failed', 'Please try again.')
  } finally {
    isSaving.value = false
  }
}

const printCurrentLabel = () => {
  if (!form.value.name) return
  const sku = form.value.sku || (editingItem.value?.id ? `SVC-${editingItem.value.id}` : 'NO-SKU')
  printBarcodeLabel({ sku, name: form.value.name, price: form.value.price || 0, currency: settings.value?.currency || '$', format: form.value.itemType === 'service' ? 'CODE128' : 'UPC' })
}

const handleBatchPrint = () => {
  if (!filtered.value.length) { toast.warning('Nothing to Print', 'No items match the current filter.'); return }
  const count = filtered.value.length
  const payload = filtered.value.map((i: any) => ({ sku: i.sku || `SVC-${i.id}`, name: i.name, price: i.price || 0, currency: settings.value?.currency || '$', format: i.itemType === 'service' ? 'CODE128' : 'UPC' as any }))
  if (count > 50) { batchPrintCount.value = count; pendingBatchPayload = payload; batchPrintConfirmOpen.value = true; return }
  printBarcodeBatch(payload)
  toast.success('Printing', `${count} label${count !== 1 ? 's' : ''} sent to printer`)
}

const executeBatchPrint = () => {
  printBarcodeBatch(pendingBatchPayload)
  toast.success('Printing', `${pendingBatchPayload.length} labels sent to printer`)
  pendingBatchPayload = []
  batchPrintConfirmOpen.value = false
}
</script>

<style scoped>
.stat-card { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.stat-card:hover { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }

.item-card { transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease; }
.item-card:hover { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
</style>
