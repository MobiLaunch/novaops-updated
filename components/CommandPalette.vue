<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :draggable="false"
    class="w-full max-w-[600px] mx-4"
    :show-header="false"
    pt:content:class="!p-0 !rounded-2xl overflow-hidden"
  >
    <div class="flex flex-col bg-surface text-foreground shadow-2xl">
      <!-- Search input -->
      <div class="flex items-center px-4 py-3.5 border-b border-border/60">
        <i class="mdi mdi-magnify text-muted"></i>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Search tickets, customers, inventory…"
          class="command-input flex-grow bg-transparent border-none outline-none text-sm font-medium text-foreground w-full placeholder-muted-foreground"
          @keydown.esc="isOpen = false"
          @keydown.down.prevent="moveSelection(1)"
          @keydown.up.prevent="moveSelection(-1)"
          @keydown.enter.prevent="executeSelected"
        />
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border border-border/80 text-muted-foreground bg-muted shrink-0 select-none">ESC</span>
      </div>

      <!-- Results -->
      <div class="command-results max-h-[380px] overflow-y-auto">
        <!-- Empty state -->
        <div v-if="!query" class="p-8 text-center flex flex-col items-center gap-3">
          <i class="mdi mdi-text-search text-4xl text-muted"></i>
          <p class="text-xs text-muted-foreground font-medium">Type to search across everything</p>
          <div class="flex justify-center gap-2 mt-1">
            <span class="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">Tickets</span>
            <span class="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">Customers</span>
            <span class="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600">Inventory</span>
          </div>
        </div>

        <!-- No results -->
        <div v-else-if="allResults.length === 0" class="p-8 text-center flex flex-col items-center gap-2">
          <i class="mdi mdi-emoticon-sad-outline text-4xl text-muted"></i>
          <p class="text-xs text-muted-foreground font-medium">No results for "{{ query }}"</p>
        </div>

        <!-- Grouped results -->
        <template v-else>
          <!-- Tickets -->
          <div v-if="ticketResults.length" class="py-2">
            <p class="text-[10px] font-black text-muted-foreground/80 uppercase tracking-wider px-4 py-1.5 flex items-center gap-1.5">
              <i class="mdi mdi-ticket-outline text-xs"></i> Tickets ({{ ticketResults.length }})
            </p>
            <div class="flex flex-col px-2 gap-0.5">
              <div
                v-for="(item, idx) in ticketResults"
                :key="'t-' + item.id"
                class="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors"
                :class="[
                  selectedIndex === getGlobalIndex('ticket', idx)
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-muted/50'
                ]"
                @click="goToTicket(item)"
                @mouseenter="selectedIndex = getGlobalIndex('ticket', idx)"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span 
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                    :class="getStatusBadgeClass(item.status)"
                  >
                    #{{ item.id }}
                  </span>
                  <div class="min-w-0 leading-tight">
                    <p class="text-xs font-semibold truncate text-foreground">{{ item.device }} {{ item.deviceModel || '' }}</p>
                    <p class="text-[10px] text-muted-foreground truncate mt-0.5">{{ getCustomerName(item.customerId) }} · {{ item.status }}</p>
                  </div>
                </div>
                <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">{{ formatCurrency(item.price) }}</span>
              </div>
            </div>
          </div>

          <!-- Customers -->
          <div v-if="customerResults.length" class="py-2">
            <p class="text-[10px] font-black text-muted-foreground/80 uppercase tracking-wider px-4 py-1.5 flex items-center gap-1.5">
              <i class="mdi mdi-account-group text-xs"></i> Customers ({{ customerResults.length }})
            </p>
            <div class="flex flex-col px-2 gap-0.5">
              <div
                v-for="(item, idx) in customerResults"
                :key="'c-' + item.id"
                class="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors"
                :class="[
                  selectedIndex === getGlobalIndex('customer', idx)
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-muted/50'
                ]"
                @click="goToCustomer(item)"
                @mouseenter="selectedIndex = getGlobalIndex('customer', idx)"
              >
                <div 
                  class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm"
                  :style="{ backgroundColor: avatarColor(item.name) }"
                >
                  {{ initials(item.name) }}
                </div>
                <div class="min-w-0 leading-tight">
                  <p class="text-xs font-semibold truncate text-foreground">{{ item.name }}</p>
                  <p class="text-[10px] text-muted-foreground truncate mt-0.5">{{ item.phone || item.email || 'No contact' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Inventory -->
          <div v-if="inventoryResults.length" class="py-2">
            <p class="text-[10px] font-black text-muted-foreground/80 uppercase tracking-wider px-4 py-1.5 flex items-center gap-1.5">
              <i class="mdi mdi-package-variant-closed text-xs"></i> Inventory ({{ inventoryResults.length }})
            </p>
            <div class="flex flex-col px-2 gap-0.5">
              <div
                v-for="(item, idx) in inventoryResults"
                :key="'i-' + item.id"
                class="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors"
                :class="[
                  selectedIndex === getGlobalIndex('inventory', idx)
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-muted/50'
                ]"
                @click="goToInventory()"
                @mouseenter="selectedIndex = getGlobalIndex('inventory', idx)"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <i class="mdi mdi-package-variant text-sm"></i>
                  </div>
                  <div class="min-w-0 leading-tight">
                    <p class="text-xs font-semibold truncate text-foreground">{{ item.name }}</p>
                    <p class="text-[10px] text-muted-foreground truncate mt-0.5">{{ item.sku || 'No SKU' }} · {{ item.stock }} in stock</p>
                  </div>
                </div>
                <span 
                  class="text-xs font-bold shrink-0"
                  :class="item.stock <= (item.low || 5) ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'"
                >
                  {{ formatCurrency(item.price) }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-4 py-2.5 border-t border-border/60 text-[10px] text-muted-foreground bg-muted/30 shrink-0">
        <div class="flex items-center gap-3 font-semibold">
          <span><kbd class="px-1 py-0.5 bg-muted border rounded">↑↓</kbd> Navigate</span>
          <span><kbd class="px-1 py-0.5 bg-muted border rounded">↵</kbd> Open</span>
          <span><kbd class="px-1 py-0.5 bg-muted border rounded">esc</kbd> Close</span>
        </div>
        <span class="font-bold opacity-75">⌘K</span>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { ref, computed, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const appStore = useAppStore()
const { tickets, customers, inventory, settings } = storeToRefs(appStore)

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const query = ref('')
const selectedIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

// Reset on open
watch(isOpen, (val) => {
  if (val) {
    query.value = ''
    selectedIndex.value = 0
    nextTick(() => searchInput.value?.focus())
  }
})

// Search logic
const MAX = 5
const ticketResults = computed(() => {
  if (!query.value) return []
  const q = query.value.toLowerCase()
  return (tickets.value || []).filter(t =>
    String(t.id).includes(q) ||
    t.device?.toLowerCase().includes(q) ||
    (t.deviceModel || '').toLowerCase().includes(q) ||
    t.issue?.toLowerCase().includes(q) ||
    getCustomerName(t.customerId).toLowerCase().includes(q)
  ).slice(0, MAX)
})

const customerResults = computed(() => {
  if (!query.value) return []
  const q = query.value.toLowerCase()
  return (customers.value || []).filter(c =>
    c.name?.toLowerCase().includes(q) ||
    (c.phone || '').includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  ).slice(0, MAX)
})

const inventoryResults = computed(() => {
  if (!query.value) return []
  const q = query.value.toLowerCase()
  return (inventory.value || []).filter((i: any) =>
    i.name?.toLowerCase().includes(q) ||
    (i.sku || '').toLowerCase().includes(q) ||
    (i.category || '').toLowerCase().includes(q)
  ).slice(0, MAX)
})

const allResults = computed(() => [
  ...ticketResults.value.map(t => ({ type: 'ticket', ...t })),
  ...customerResults.value.map(c => ({ type: 'customer', ...c })),
  ...inventoryResults.value.map(i => ({ type: 'inventory', ...i })),
])

function getGlobalIndex(type: string, localIdx: number) {
  if (type === 'ticket') return localIdx
  if (type === 'customer') return ticketResults.value.length + localIdx
  return ticketResults.value.length + customerResults.value.length + localIdx
}

function moveSelection(dir: number) {
  const total = allResults.value.length
  if (total === 0) return
  selectedIndex.value = (selectedIndex.value + dir + total) % total
}

function executeSelected() {
  const item = allResults.value[selectedIndex.value]
  if (!item) return
  if (item.type === 'ticket') goToTicket(item)
  else if (item.type === 'customer') goToCustomer(item)
  else goToInventory()
}

function goToTicket(t: any) {
  isOpen.value = false
  navigateTo(`/bookings?ticket=${t.id}`)
}

function goToCustomer(c: any) {
  isOpen.value = false
  navigateTo(`/customers?highlight=${c.id}`)
}

function goToInventory() {
  isOpen.value = false
  navigateTo('/inventory')
}

// Helpers
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const getCustomerName = (id: number) => (customers.value || []).find((c: any) => c.id === id)?.name || 'Unknown'

const getStatusBadgeClass = (s: string) => {
  const mapping: Record<string, string> = {
    Open: 'bg-blue-500/10 text-blue-500',
    'In Progress': 'bg-amber-500/10 text-amber-500',
    'Waiting for Parts': 'bg-red-500/10 text-red-500',
    Completed: 'bg-emerald-500/10 text-emerald-500',
    Delivered: 'bg-gray-500/10 text-gray-500'
  }
  return mapping[s] || 'bg-gray-500/10 text-gray-500'
}

const AVATAR_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444']
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}
</script>
