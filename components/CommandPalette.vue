<template>
  <v-dialog
    v-model="isOpen"
    max-width="600"
    content-class="command-palette-dialog"
    :scrim="true"
    scrim-class="command-palette-scrim"
    transition="dialog-top-transition"
  >
    <v-card class="command-palette-card" rounded="xl" elevation="24">
      <!-- Search input -->
      <div class="d-flex align-center px-4 py-3 border-b">
        <v-icon color="medium-emphasis" size="20" class="me-3">mdi-magnify</v-icon>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Search tickets, customers, inventory…"
          class="command-input flex-grow-1"
          @keydown.esc="isOpen = false"
          @keydown.down.prevent="moveSelection(1)"
          @keydown.up.prevent="moveSelection(-1)"
          @keydown.enter.prevent="executeSelected"
        />
        <v-chip size="x-small" variant="outlined" class="ms-2 opacity-60">ESC</v-chip>
      </div>

      <!-- Results -->
      <div class="command-results" style="max-height:380px; overflow-y:auto">
        <!-- Empty state -->
        <div v-if="!query" class="pa-6 text-center text-medium-emphasis">
          <v-icon size="40" class="mb-2 opacity-20">mdi-text-search</v-icon>
          <p class="text-body-2 mb-1">Type to search across everything</p>
          <div class="d-flex justify-center gap-3 mt-3">
            <v-chip size="x-small" variant="tonal" color="warning">Tickets</v-chip>
            <v-chip size="x-small" variant="tonal" color="info">Customers</v-chip>
            <v-chip size="x-small" variant="tonal" color="purple">Inventory</v-chip>
          </div>
        </div>

        <!-- No results -->
        <div v-else-if="allResults.length === 0" class="pa-6 text-center text-medium-emphasis">
          <v-icon size="36" class="mb-2 opacity-20">mdi-emoticon-sad-outline</v-icon>
          <p class="text-body-2">No results for "{{ query }}"</p>
        </div>

        <!-- Grouped results -->
        <template v-else>
          <!-- Tickets -->
          <div v-if="ticketResults.length">
            <p class="text-caption font-weight-black text-medium-emphasis text-uppercase px-4 pt-3 pb-1">
              <v-icon size="12" class="me-1">mdi-ticket-outline</v-icon> Tickets ({{ ticketResults.length }})
            </p>
            <v-list density="compact" class="py-0">
              <v-list-item
                v-for="(item, idx) in ticketResults"
                :key="'t-' + item.id"
                :class="{ 'command-selected': selectedIndex === getGlobalIndex('ticket', idx) }"
                rounded="lg"
                class="mx-2 command-item"
                @click="goToTicket(item)"
                @mouseenter="selectedIndex = getGlobalIndex('ticket', idx)"
              >
                <template #prepend>
                  <v-chip :color="statusColor(item.status)" size="x-small" variant="tonal" class="me-2">#{{ item.id }}</v-chip>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">{{ item.device }} {{ item.deviceModel || '' }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ getCustomerName(item.customerId) }} · {{ item.status }}</v-list-item-subtitle>
                <template #append>
                  <span class="text-caption font-weight-bold text-success">{{ formatCurrency(item.price) }}</span>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Customers -->
          <div v-if="customerResults.length">
            <p class="text-caption font-weight-black text-medium-emphasis text-uppercase px-4 pt-3 pb-1">
              <v-icon size="12" class="me-1">mdi-account-group</v-icon> Customers ({{ customerResults.length }})
            </p>
            <v-list density="compact" class="py-0">
              <v-list-item
                v-for="(item, idx) in customerResults"
                :key="'c-' + item.id"
                :class="{ 'command-selected': selectedIndex === getGlobalIndex('customer', idx) }"
                rounded="lg"
                class="mx-2 command-item"
                @click="goToCustomer(item)"
                @mouseenter="selectedIndex = getGlobalIndex('customer', idx)"
              >
                <template #prepend>
                  <v-avatar :color="avatarColor(item.name)" size="28" class="text-caption font-weight-bold text-white me-2">
                    {{ initials(item.name) }}
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ item.phone || item.email || 'No contact' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>

          <!-- Inventory -->
          <div v-if="inventoryResults.length">
            <p class="text-caption font-weight-black text-medium-emphasis text-uppercase px-4 pt-3 pb-1">
              <v-icon size="12" class="me-1">mdi-package-variant-closed</v-icon> Inventory ({{ inventoryResults.length }})
            </p>
            <v-list density="compact" class="py-0">
              <v-list-item
                v-for="(item, idx) in inventoryResults"
                :key="'i-' + item.id"
                :class="{ 'command-selected': selectedIndex === getGlobalIndex('inventory', idx) }"
                rounded="lg"
                class="mx-2 command-item"
                @click="goToInventory()"
                @mouseenter="selectedIndex = getGlobalIndex('inventory', idx)"
              >
                <template #prepend>
                  <v-avatar color="deep-purple" size="28" variant="tonal" rounded="lg" class="me-2">
                    <v-icon size="14">mdi-package-variant</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ item.sku || 'No SKU' }} · {{ item.stock }} in stock</v-list-item-subtitle>
                <template #append>
                  <span class="text-caption font-weight-bold" :class="item.stock <= (item.low || 5) ? 'text-error' : 'text-success'">{{ formatCurrency(item.price) }}</span>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="d-flex align-center justify-space-between px-4 py-2 border-t text-caption text-medium-emphasis" style="background:rgba(0,0,0,0.02)">
        <div class="d-flex align-center gap-3">
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>esc</kbd> Close</span>
        </div>
        <span class="opacity-60">⌘K</span>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
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
const statusColor = (s: string) => ({ Open: 'info', 'In Progress': 'warning', 'Waiting for Parts': 'error', Completed: 'success', Delivered: 'secondary' }[s] || 'secondary')
const AVATAR_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444']
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}
</script>

<style scoped>
.command-palette-card {
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(20px);
}

.command-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: inherit;
  font-weight: 500;
  width: 100%;
}

.command-item {
  transition: background 0.15s ease;
}

.command-selected {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}

kbd {
  display: inline-block;
  padding: 1px 5px;
  font-size: 11px;
  font-family: inherit;
  border-radius: 4px;
  border: 1px solid rgba(128,128,128,0.3);
  background: rgba(128,128,128,0.08);
}
</style>
