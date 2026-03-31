<template>
  <div>

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div class="d-flex align-center gap-4">
        <v-avatar
          size="48"
          rounded="xl"
          style="background: linear-gradient(135deg,#8b5cf6,#7c3aed); box-shadow: 0 4px 20px #8b5cf650"
        >
          <v-icon icon="mdi-package-variant-closed" size="22" color="white" />
        </v-avatar>
        <div>
          <h1 class="text-h5 font-weight-black">Inventory &amp; Services</h1>
          <p class="text-body-2 text-medium-emphasis">Track parts, tools, accessories &amp; repair services</p>
        </div>
      </div>
      <div class="d-flex gap-2">
        <v-btn variant="tonal" prepend-icon="mdi-printer" @click="handleBatchPrint">Print Labels</v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-alert-outline" @click="checkLowStock">Low Stock</v-btn>
        <v-btn
          color="deep-purple"
          prepend-icon="mdi-plus"
          style="background: linear-gradient(135deg,#8b5cf6,#7c3aed)"
          @click="openNew"
        >Add Item</v-btn>
      </div>
    </div>

    <!-- ── Stat Cards ───────────────────────────────────────────── -->
    <v-row dense class="mb-5">
      <v-col v-for="stat in stats" :key="stat.label" cols="6" sm="3">
        <v-card
          class="pa-4 stat-card"
          :style="`background:${stat.color}12; outline:2px solid ${stat.color}28; outline-offset:0`"
        >
          <div class="d-flex align-center justify-space-between mb-3">
            <v-avatar size="40" rounded="lg" :style="`background:${stat.color}24`">
              <v-icon :icon="stat.icon" size="20" :style="`color:${stat.color}`" />
            </v-avatar>
            <v-chip size="x-small" :style="`background:${stat.color}20;color:${stat.color}`" variant="flat">
              {{ stat.badge }}
            </v-chip>
          </div>
          <div class="text-caption text-medium-emphasis font-weight-medium">{{ stat.label }}</div>
          <div class="text-h5 font-weight-black" :style="`color:${stat.color}`">{{ stat.value }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Search & Filters ─────────────────────────────────────── -->
    <v-card class="pa-4 mb-4">
      <div class="d-flex align-center gap-3 flex-wrap">
        <v-text-field
          v-model="q"
          placeholder="Search by name, SKU, or category…"
          prepend-inner-icon="mdi-magnify"
          hide-details
          density="compact"
          rounded="pill"
          style="max-width:320px; min-width:200px"
        />
        <v-chip-group v-model="typeFilterIdx" mandatory selected-class="text-deep-purple">
          <v-chip
            v-for="t in typeOptions"
            :key="t.value ?? 'all'"
            size="small"
            :color="typeFilter === t.value ? 'deep-purple' : undefined"
            :variant="typeFilter === t.value ? 'tonal' : 'outlined'"
            @click="typeFilter = t.value"
          >{{ t.label }}</v-chip>
        </v-chip-group>
        <div v-if="dynamicCategories.length" class="d-flex gap-2 flex-wrap">
          <v-chip
            v-for="cat in ['All', ...dynamicCategories]"
            :key="cat"
            size="small"
            :color="selectedCat === (cat === 'All' ? null : cat) ? 'deep-purple' : undefined"
            :variant="selectedCat === (cat === 'All' ? null : cat) ? 'tonal' : 'outlined'"
            @click="selectedCat = cat === 'All' ? null : cat"
          >{{ cat }}</v-chip>
        </div>
      </div>
    </v-card>

    <!-- ── Item Grid ─────────────────────────────────────────────── -->
    <v-row>
      <v-col
        v-for="item in filtered"
        :key="item.id"
        cols="12"
        sm="6"
        lg="4"
        xl="3"
      >
        <v-card
          class="item-card pa-4 h-100"
          style="cursor:pointer"
          @click="openEdit(item)"
        >
          <div class="d-flex align-start justify-space-between mb-3">
            <v-avatar
              size="48"
              rounded="xl"
              :style="item.itemType === 'service'
                ? 'background:linear-gradient(135deg,#22d3ee18,#0891b218)'
                : 'background:linear-gradient(135deg,#8b5cf620,#7c3aed20)'"
            >
              <v-icon :icon="item.itemType === 'service' ? 'mdi-wrench-outline' : 'mdi-package-variant-closed'" size="22" :style="item.itemType === 'service' ? 'color:#22d3ee' : 'color:#8b5cf6'" />
            </v-avatar>
            <div class="d-flex flex-column align-end gap-1">
              <v-chip
                size="x-small"
                variant="flat"
                :style="item.itemType === 'service'
                  ? 'background:#22d3ee20;color:#22d3ee'
                  : 'background:#8b5cf620;color:#8b5cf6'"
              >{{ item.itemType === 'service' ? 'SERVICE' : 'PRODUCT' }}</v-chip>
              <v-chip
                size="x-small"
                variant="flat"
                :color="item.itemType === 'service' ? 'info'
                  : item.stock <= (item.low || 5) ? 'error' : 'success'"
              >{{ item.itemType === 'service' ? 'AVAILABLE'
                  : item.stock <= (item.low || 5) ? '⚠ LOW' : 'IN STOCK' }}</v-chip>
            </div>
          </div>

          <div class="flex-grow-1 mb-3">
            <div class="text-body-2 font-weight-black mb-1">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.itemType !== 'service' ? `SKU: ${item.sku || '—'}` : (item.description || '') }}
            </div>
            <div class="text-caption text-medium-emphasis">{{ item.category }}</div>
          </div>

          <v-divider class="mb-3" />
          <div class="d-flex align-end justify-space-between">
            <div>
              <div
                class="text-h6 font-weight-black"
                :style="item.itemType === 'service' ? 'color:#22d3ee' : 'color:#8b5cf6'"
              >{{ formatCurrency(item.price) }}</div>
              <div v-if="item.itemType !== 'service'" class="text-caption text-medium-emphasis">
                Cost: {{ formatCurrency(item.cost || 0) }}
              </div>
              <div v-else class="text-caption text-medium-emphasis">
                {{ item.estimated_minutes || item.duration
                    ? `~${item.estimated_minutes || item.duration} min`
                    : 'Labor rate' }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-h5 font-weight-black">
                {{ item.itemType !== 'service' ? item.stock : '∞' }}
              </div>
              <div class="text-caption text-medium-emphasis font-weight-bold" style="font-size:10px">
                {{ item.itemType !== 'service' ? 'UNITS' : 'UNLIMITED' }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Empty state -->
      <v-col v-if="filtered.length === 0" cols="12">
        <v-card class="pa-12 text-center">
          <v-avatar size="80" rounded="xl" color="deep-purple" variant="tonal" class="mb-4 mx-auto">
            <v-icon icon="mdi-package-variant-closed" size="40" style="opacity:0.5" />
          </v-avatar>
          <div class="text-h6 font-weight-black mb-1">No items found</div>
          <div class="text-body-2 text-medium-emphasis">
            {{ q ? 'Try a different search' : 'Add your first item' }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Add/Edit Dialog ─────────────────────────────────────── -->
    <v-dialog v-model="newOpen" max-width="520" scrollable>
      <v-card>
        <v-card-item class="border-b">
          <template #prepend>
            <v-avatar
              size="40"
              rounded="xl"
              :style="form.itemType === 'service'
                ? 'background:linear-gradient(135deg,#22d3ee,#0891b2)'
                : 'background:linear-gradient(135deg,#8b5cf6,#7c3aed)'"
            >
              <v-icon :icon="form.itemType === 'service' ? 'mdi-wrench-outline' : 'mdi-package-variant-closed'" size="18" color="white" />
            </v-avatar>
          </template>
          <v-card-title>{{ editingItem ? 'Edit Item' : 'Add Item' }}</v-card-title>
          <v-card-subtitle>{{ form.itemType === 'service' ? 'Service or labor item' : 'Inventory details' }}</v-card-subtitle>
          <template #append>
            <v-btn icon="mdi-close" variant="text" size="small" @click="newOpen = false; editingItem = null" />
          </template>
        </v-card-item>

        <v-card-text class="pa-6">
          <!-- Item type toggle -->
          <v-btn-toggle
            v-model="form.itemType"
            mandatory
            rounded="pill"
            density="compact"
            color="deep-purple"
            class="mb-5 w-100"
            divided
          >
            <v-btn value="product" class="flex-1">📦 Product</v-btn>
            <v-btn value="service" class="flex-1">🔧 Service</v-btn>
          </v-btn-toggle>

          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                :label="form.itemType === 'service' ? 'Service Name' : 'Item Name'"
                :placeholder="form.itemType === 'service' ? 'Screen Replacement Labor' : 'Screen Replacement'"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <!-- Product fields -->
            <template v-if="form.itemType === 'product'">
              <v-col cols="6">
                <v-text-field v-model="form.sku" label="SKU" placeholder="SKU-001" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="form.category"
                  :items="allCategories"
                  label="Category"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.price" type="number" label="Price" placeholder="29.99" variant="outlined" density="comfortable" prefix="$" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.cost" type="number" label="Cost" placeholder="15.00" variant="outlined" density="comfortable" prefix="$" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.stock" type="number" label="Stock Qty" placeholder="10" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.low" type="number" label="Low Stock Alert" placeholder="5" variant="outlined" density="comfortable" />
              </v-col>
            </template>

            <!-- Service fields -->
            <template v-else>
              <v-col cols="6">
                <v-text-field v-model.number="form.price" type="number" label="Price ($)" placeholder="75.00" variant="outlined" density="comfortable" prefix="$" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.estimated_minutes" type="number" label="Duration (min)" placeholder="60" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.category" label="Category" placeholder="e.g. Apple Repairs, Samsung Repairs" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="form.description" label="Description" placeholder="Brief description of the service" rows="2" variant="outlined" density="comfortable" />
              </v-col>
            </template>
          </v-row>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn
            v-if="editingItem"
            variant="outlined"
            prepend-icon="mdi-printer"
            @click="printCurrentLabel"
          >Print Label</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="newOpen = false; editingItem = null">Cancel</v-btn>
          <v-btn
            :color="form.itemType === 'service' ? 'cyan' : 'deep-purple'"
            :loading="isSaving"
            @click="saveItem"
          >{{ editingItem ? 'Save Changes' : 'Add Item' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Batch print confirmation -->
    <v-dialog v-model="batchPrintConfirmOpen" max-width="420">
      <v-card>
        <v-card-item>
          <template #prepend>
            <v-avatar color="warning" size="40" rounded="lg" variant="tonal">
              <v-icon color="warning">mdi-printer</v-icon>
            </v-avatar>
          </template>
          <v-card-title>Print {{ batchPrintCount }} labels?</v-card-title>
          <v-card-subtitle>Make sure your label printer is ready.</v-card-subtitle>
        </v-card-item>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="batchPrintConfirmOpen = false">Cancel</v-btn>
          <v-btn color="warning" @click="executeBatchPrint">Print All</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '~/composables/useToast'
import { useAppStore } from '~/stores/app'
import { printBarcodeLabel, printBarcodeBatch } from '~/utils/print'

definePageMeta({ middleware: ['auth'] })

const appStore  = useAppStore()
const settings  = computed(() => appStore.settings ?? { currency: '$' })

const allItems = computed(() => {
  const products = (appStore.inventory ?? []).map((i: any) => ({ ...i, itemType: i.itemType || i.item_type || 'product' }))
  const services = (appStore.services ?? []).map((s: any) => ({ ...s, itemType: 'service', stock: 9999, low: 0, sku: s.sku || '' }))
  return [...products, ...services]
})

const q            = ref('')
const selectedCat  = ref<string|null>(null)
const typeFilter   = ref<string|null>(null)
const typeFilterIdx = ref(0)
const newOpen      = ref(false)
const editingItem  = ref<any>(null)
const isSaving     = ref(false)

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
