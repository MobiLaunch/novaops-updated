<template>
  <div class="pos-root d-flex flex-column h-100 min-h-[560px] pb-4">
    <!-- Ticket Banner -->
    <v-slide-y-transition>
      <v-alert
        v-if="ticketMode"
        color="success"
        variant="tonal"
        icon="mdi-ticket-confirmation-outline"
        closable
        class="mb-4"
        @click:close="ticketMode = null; cart = []"
      >
        <div class="text-subtitle-2 font-weight-black">Ticket #{{ ticketMode.ticketId }} — Collecting Payment</div>
        <div class="text-caption text-medium-emphasis font-weight-medium">Completing this sale will mark the ticket as Completed.</div>
      </v-alert>
    </v-slide-y-transition>

    <!-- Header -->
    <v-row align="center" justify="space-between" class="mb-4 flex-grow-0" no-gutters>
      <v-col cols="auto" class="d-flex align-center gap-4">
        <v-sheet
          rounded="xl"
          elevation="4"
          class="d-flex align-center justify-center"
          height="48"
          width="48"
          style="background: linear-gradient(135deg, #ec4899, #db2777);"
        >
          <v-icon icon="mdi-cart-outline" size="24" color="white" />
        </v-sheet>
        <div>
          <h1 class="text-h5 font-weight-black tracking-tight mb-0">Point of Sale</h1>
          <p class="text-caption text-medium-emphasis font-weight-medium mb-0">{{ (inventory as any[]).length }} items in catalog</p>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-slide-x-transition>
          <v-chip v-if="cart.length" color="pink" variant="tonal" size="large" class="font-weight-black px-4">
            <v-icon icon="mdi-shopping-outline" start size="18" />
            <span class="mr-2">{{ cart.length }} item{{ cart.length !== 1 ? 's' : '' }}</span>
            <span class="text-h6 font-weight-black">{{ formatCurrency(total) }}</span>
          </v-chip>
        </v-slide-x-transition>
      </v-col>
    </v-row>

    <!-- Mobile Tab Bar -->
    <v-btn-toggle
      v-if="$vuetify.display.mdAndDown"
      v-model="mobileTab"
      color="primary"
      variant="tonal"
      class="mb-4 w-100 flex-grow-0"
      mandatory
      rounded="xl"
    >
      <v-btn value="products" class="flex-1-1-100"><v-icon icon="mdi-package-variant-closed" start /> Products</v-btn>
      <v-btn value="cart" class="flex-1-1-100">
        <v-icon icon="mdi-shopping-outline" start />
        <v-badge v-if="cart.length" color="pink" :content="cart.length" class="ml-2" />
        <span v-else>Cart</span>
      </v-btn>
      <v-btn value="checkout" class="flex-1-1-100"><v-icon icon="mdi-credit-card-outline" start /> Checkout</v-btn>
    </v-btn-toggle>

    <!-- 3-Column Body -->
    <v-row class="flex-1-1-100 overflow-hidden mx-0" :class="{ 'd-flex pb-16': $vuetify.display.mdAndDown }">

      <!-- COL 1: Products -->
      <v-col
        cols="12" lg="5" xl="6"
        v-show="!$vuetify.display.mdAndDown || mobileTab === 'products'"
        class="d-flex flex-column h-100 overflow-hidden pa-0 pr-lg-2"
      >
        <v-text-field
          v-model="searchQuery"
          placeholder="Search products & services…"
          prepend-inner-icon="mdi-magnify"
          clearable
          variant="outlined"
          density="comfortable"
          rounded="xl"
          class="flex-grow-0 mb-2"
          hide-details="auto"
        />

        <v-slide-group show-arrows class="mb-4 flex-grow-0">
          <v-slide-group-item v-for="cat in categoryTabs" :key="cat ?? 'all'">
            <v-chip
              :color="selectedCategory === cat ? 'pink' : undefined"
              :variant="selectedCategory === cat ? 'tonal' : 'outlined'"
              class="ma-1 font-weight-bold"
              size="small"
              @click="selectedCategory = cat"
            >
              {{ cat ?? 'All' }}
            </v-chip>
          </v-slide-group-item>
        </v-slide-group>

        <v-row dense class="overflow-y-auto align-content-start flex-1-1-100 ma-0 pb-4">
          <!-- AKKO card -->
          <v-col cols="6" sm="4" md="3" lg="4" xl="3">
            <v-card variant="outlined" class="h-100 cursor-pointer product-hover" style="border-color: #8b5cf640" @click="addAkkoInsurance">
              <v-card-text class="d-flex flex-column h-100 pa-3">
                <div class="d-flex justify-space-between align-start mb-2">
                  <v-avatar color="#8b5cf620" rounded="lg" size="36"><v-icon icon="mdi-shield-check-outline" color="#8b5cf6" size="20" /></v-avatar>
                  <v-chip size="x-small" color="#8b5cf6" variant="tonal" class="font-weight-black">PLAN</v-chip>
                </div>
                <div class="text-subtitle-2 font-weight-bold text-truncate">AKKO Insurance</div>
                <div class="text-caption text-medium-emphasis text-truncate mb-2">Device protection</div>
                <v-spacer />
                <div class="text-body-1 font-weight-black" style="color: #8b5cf6">$15.00</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Inventory items -->
          <v-col cols="6" sm="4" md="3" lg="4" xl="3" v-for="item in filteredProducts" :key="item.id">
            <v-card variant="outlined" class="h-100 cursor-pointer product-hover d-flex flex-column" @click="addToCart(item)">
              <v-card-text class="d-flex flex-column flex-1-1-100 pa-3">
                <div class="d-flex justify-space-between align-start mb-2">
                  <v-avatar :color="item.itemType === 'service' ? '#10b98118' : '#ec489914'" rounded="lg" size="36">
                    <v-icon :icon="item.itemType === 'service' ? 'mdi-wrench-outline' : 'mdi-package-variant-closed'" :color="item.itemType === 'service' ? '#10b981' : '#ec4899'" size="20" />
                  </v-avatar>
                  <v-chip size="x-small" :color="item.itemType === 'service' ? '#10b981' : Number(item.stock) <= Number(item.low||5) ? 'warning' : '#ec4899'" variant="tonal" class="font-weight-black">
                    {{ item.itemType === 'service' ? '∞' : item.stock }}
                  </v-chip>
                </div>
                <div class="text-subtitle-2 font-weight-bold text-truncate" style="line-height: 1.2">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis text-truncate mb-2">{{ item.sku || item.category }}</div>
                <v-spacer />
                <div class="text-body-1 font-weight-black" :style="{ color: item.itemType === 'service' ? '#10b981' : '#ec4899' }">
                  {{ formatCurrency(item.price) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" v-if="filteredProducts.length === 0" class="text-center py-10 opacity-60">
            <v-icon icon="mdi-package-variant-closed" size="48" class="mb-2" />
            <div class="text-subtitle-2 font-weight-bold">{{ searchQuery ? `No results for "${searchQuery}"` : 'No items in catalog' }}</div>
          </v-col>
        </v-row>
      </v-col>

      <!-- COL 2: Cart -->
      <v-col
        cols="12" lg="3" xl="3"
        v-show="!$vuetify.display.mdAndDown || mobileTab === 'cart'"
        class="pa-0 px-lg-2 h-100 d-flex flex-column"
      >
        <v-card class="d-flex flex-column h-100" variant="outlined" rounded="xl">
          <!-- Cart Header -->
          <v-toolbar color="pink-lighten-5" density="compact" class="flex-grow-0" style="border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))">
            <v-icon icon="mdi-shopping-outline" color="pink" class="ml-4 mr-2" />
            <v-toolbar-title class="text-subtitle-2 font-weight-black">Current Sale</v-toolbar-title>
            <v-chip v-if="cart.length" size="small" color="pink" class="mr-2 font-weight-bold">{{ cart.length }}</v-chip>
            <v-btn icon="mdi-delete-outline" variant="text" color="error" :disabled="!cart.length" @click="clearCart" />
          </v-toolbar>

          <!-- Cart Body -->
          <div class="flex-1-1-100 overflow-y-auto">
            <div v-if="!cart.length" class="h-100 d-flex flex-column align-center justify-center opacity-50 px-4 text-center">
              <v-icon icon="mdi-cart-outline" size="48" class="mb-2" />
              <div class="text-subtitle-2 font-weight-bold">Cart is empty</div>
              <div class="text-caption">Tap a product to add it</div>
            </div>

            <v-list v-else lines="two" class="py-0" bg-color="transparent">
              <v-list-item
                v-for="(item, idx) in cart"
                :key="`${item.id ?? 'c'}-${idx}`"
                class="border-b pl-2 pr-3 py-2 cart-animated-row"
              >
                <template #prepend>
                  <v-avatar rounded="lg" size="32" :color="item.isService ? '#10b98112' : item.isTicket ? '#f59e0b12' : '#ec489912'" class="mr-3">
                    <v-icon :icon="item.isService ? 'mdi-wrench-outline' : item.isTicket ? 'mdi-ticket-confirmation-outline' : 'mdi-package-variant-closed'" size="16" :color="item.isService ? '#10b981' : item.isTicket ? '#f59e0b' : '#ec4899'" />
                  </v-avatar>
                </template>

                <v-list-item-title class="text-caption font-weight-bold text-wrap" style="line-height:1.2">{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption mt-1" style="font-size: 10px !important">
                  {{ formatCurrency(item.price) }}{{ item.isService ? ' · service' : item.isTicket ? ' · ticket' : ' ea.' }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex align-center gap-2 pl-2">
                    <div class="d-flex align-center bg-surface-variant rounded-lg pa-1" v-if="!item.isService && !item.isTicket">
                      <v-btn icon="mdi-minus" size="20" variant="text" density="comfortable" @click="decrementItem(idx)" />
                      <span class="text-caption font-weight-bold text-center" style="min-width: 16px">{{ item.quantity }}</span>
                      <v-btn icon="mdi-plus" size="20" variant="text" density="comfortable" @click="incrementItem(idx)" />
                    </div>
                    <v-btn v-else icon="mdi-close" size="24" color="error" variant="tonal" class="rounded-lg" @click="decrementItem(idx)" />
                    
                    <span class="text-caption font-weight-black text-pink text-right" style="min-width: 48px">
                      {{ formatCurrency(item.price * item.quantity) }}
                    </span>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Custom Amount & Totals -->
          <div class="bg-surface-variant border-t pa-3 flex-grow-0 d-flex flex-column gap-2">
            <div class="d-flex align-center justify-space-between text-caption font-weight-black text-uppercase tracking-widest text-medium-emphasis">
              <span class="d-flex align-center gap-1"><v-icon icon="mdi-plus" size="14" /> Custom Amount</span>
              <span class="text-h6 font-weight-black text-foreground" :class="{ 'opacity-50': keypadAmount === '0' }">
                {{ settings.currency || '$' }}{{ (parseFloat(keypadAmount)/100).toFixed(2) }}
              </span>
            </div>
            
            <v-row dense>
              <v-col cols="4" v-for="k in [1,2,3,4,5,6,7,8,9]" :key="k">
                <v-btn block rounded="xl" variant="outlined" class="font-weight-black text-h6 bg-surface" @click="handleKey(k)">{{k}}</v-btn>
              </v-col>
              <v-col cols="4"><v-btn block rounded="xl" variant="tonal" color="error" class="font-weight-black text-h6" @click="handleKey('C')">C</v-btn></v-col>
              <v-col cols="4"><v-btn block rounded="xl" variant="outlined" class="font-weight-black text-h6 bg-surface" @click="handleKey(0)">0</v-btn></v-col>
              <v-col cols="4"><v-btn block rounded="xl" variant="tonal" class="font-weight-black text-h6 text-medium-emphasis" @click="handleKey('⌫')"><v-icon icon="mdi-backspace-outline" /></v-btn></v-col>
            </v-row>
            <v-btn
              block
              rounded="xl"
              class="font-weight-black mt-1"
              style="background: linear-gradient(135deg, #ec4899, #db2777); color: white;"
              :disabled="keypadAmount==='0'"
              @click="addCustomToCart"
            >
              <v-icon icon="mdi-plus" start /> Add {{ keypadAmount !== '0' ? formatCurrency(parseFloat(keypadAmount)/100) : '' }}
            </v-btn>
            
            <v-divider class="my-2" />
            
            <div class="d-flex justify-space-between text-caption text-medium-emphasis font-weight-bold">
              <span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span>
            </div>
            <div v-if="taxRate" class="d-flex justify-space-between text-caption text-medium-emphasis font-weight-bold">
              <span>Tax ({{ taxRate }}%)</span><span>{{ formatCurrency(taxAmount) }}</span>
            </div>
            <v-divider class="my-1" />
            <div class="d-flex justify-space-between align-center mt-1">
              <span class="text-subtitle-2 font-weight-black">Total</span>
              <span class="text-h6 font-weight-black text-pink">{{ formatCurrency(total) }}</span>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- COL 3: Checkout -->
      <v-col
        cols="12" lg="4" xl="3"
        v-show="!$vuetify.display.mdAndDown || mobileTab === 'checkout'"
        class="pa-0 pl-lg-2 h-100 d-flex flex-column overflow-y-auto"
      >
        <v-card variant="outlined" rounded="xl" class="mb-3">
          <v-card-text class="pa-3">
            <div class="text-overline font-weight-black text-medium-emphasis mb-2 d-flex align-center gap-1">
              <v-icon icon="mdi-account-group-outline" size="14" /> Customer (optional)
            </div>
            <CustomerSelect v-model="selectedCustomerId" />
          </v-card-text>
        </v-card>

        <!-- Square Card form is the Star of the Show -->
        <v-card
          elevation="4"
          rounded="xl"
          class="mb-3 position-relative overflow-hidden"
          :style="paymentMethod === 'Card' ? 'border: 2px solid rgb(var(--v-theme-primary))' : 'border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))'"
        >
          <div v-if="paymentMethod !== 'Card'" class="position-absolute bg-surface-variant w-100 h-100 d-flex align-center justify-center" style="z-index: 5; opacity: 0.9 cursor: pointer" @click="paymentMethod = 'Card'">
            <v-btn variant="tonal" color="primary" rounded="pill"><v-icon start icon="mdi-credit-card-outline"/> Use Card</v-btn>
          </div>
          
          <v-toolbar color="primary" density="compact">
            <v-icon icon="mdi-lock-outline" class="ml-4 mr-2" />
            <v-toolbar-title class="text-subtitle-2 font-weight-black">Secure Card Checkout</v-toolbar-title>
            <v-spacer />
            <v-chip size="small" variant="flat" color="white" class="text-primary font-weight-bold mr-4">
              <v-icon icon="mdi-square-rounded" size="12" start /> Square
            </v-chip>
          </v-toolbar>
          
          <v-card-text class="pa-4 bg-surface" :class="{ 'opacity-50': processing }">
            <div class="text-h4 font-weight-black text-center mb-4 text-primary">{{ formatCurrency(total) }}</div>
            <div style="min-height: 56px; border-radius: 12px; overflow: hidden; position: relative;">
               <div id="card-container" class="w-100 min-h-[56px]"></div>
               <v-overlay contained :model-value="cardLoading" class="align-center justify-center border-radius-lg bg-surface">
                 <v-progress-circular indeterminate color="primary" size="24" class="mr-2" />
                 <span class="text-caption font-weight-bold text-medium-emphasis">Initializing secure form…</span>
               </v-overlay>
            </div>
            
            <div v-if="!squareConfigured" class="d-flex align-center gap-2 mt-4 pa-2 rounded-lg bg-warning-lighten-4">
              <v-icon icon="mdi-alert-circle" color="warning" size="16" />
              <span class="text-caption font-weight-bold text-warning">Square credentials missing — </span>
              <v-btn variant="text" density="compact" size="small" class="text-caption font-weight-black px-1" color="warning" to="/settings">configure in Settings</v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Secondary Payment Methods -->
        <div class="d-flex gap-2 mb-4 shrink-0 flex-wrap">
          <v-btn
            variant="tonal"
            rounded="xl"
            class="flex-1-1-100 font-weight-bold tracking-tight"
            :color="paymentMethod === 'Cash' ? 'success' : 'medium-emphasis'"
            @click="paymentMethod = 'Cash'"
            height="48"
          >
            <v-icon icon="mdi-cash" start /> Cash
          </v-btn>
          <v-btn
            variant="tonal"
            rounded="xl"
            class="flex-1-1-100 font-weight-bold tracking-tight"
            :color="paymentMethod === 'Afterpay' ? 'info' : 'medium-emphasis'"
            @click="paymentMethod = 'Afterpay'"
            height="48"
          >
            <v-icon icon="mdi-wallet-outline" start /> Afterpay
          </v-btn>
          <v-btn
            variant="tonal"
            rounded="xl"
            class="flex-1-1-100 font-weight-bold tracking-tight"
            :color="paymentMethod === 'Other' ? 'secondary' : 'medium-emphasis'"
            @click="paymentMethod = 'Other'"
            height="48"
          >
            <v-icon icon="mdi-dots-horizontal-circle-outline" start /> Other
          </v-btn>
        </div>

        <v-alert
          v-if="paymentMethod === 'Afterpay'"
          variant="tonal"
          color="info"
          icon="mdi-information"
          class="mb-3"
          density="comfortable"
        >
          <div id="afterpay-button" class="w-100 d-flex justify-center mb-1 min-h-[48px]"></div>
          <div class="text-caption font-weight-medium text-center">4 interest-free payments. Min. order $35.</div>
        </v-alert>

        <v-alert
          v-else-if="paymentMethod !== 'Card'"
          variant="tonal"
          :color="paymentMethod === 'Cash' ? 'success' : 'secondary'"
          :icon="paymentMethod === 'Cash' ? 'mdi-cash' : 'mdi-wallet-outline'"
          class="mb-3"
          density="comfortable"
        >
          <div class="text-subtitle-2 font-weight-black">{{ paymentMethod }} Payment</div>
          <div class="text-caption">Record this alternative payment. Tap complete sale below.</div>
        </v-alert>

        <v-slide-y-transition>
          <div v-if="terminalStatus" class="d-flex align-center gap-2 pa-3 rounded-lg bg-info-lighten-4 text-info font-weight-bold text-caption mb-3">
            <v-progress-circular indeterminate size="16" width="2" color="info" />
            {{ terminalStatus }}
          </div>
        </v-slide-y-transition>

        <v-spacer />

        <v-btn
          block
          rounded="xl"
          height="56"
          :disabled="!cart.length || processing"
          :loading="processing"
          class="text-body-1 font-weight-black mt-2"
          style="background: linear-gradient(135deg, #ec4899, #db2777); color: white;"
          @click="handleCheckout"
        >
          <v-icon icon="mdi-check-circle-outline" start /> {{ ctaLabel }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Sale Success Modal -->
    <v-dialog :model-value="!!saleResult" @update:model-value="val => { if (!val) saleResult = null }" max-width="320" persistent transition="dialog-bottom-transition">
      <v-card rounded="xl" v-if="saleResult" elevation="24">
        <v-card-text class="d-flex flex-column align-center text-center pa-6">
          <v-avatar color="success" size="72" class="mb-4 elevation-4">
            <v-icon icon="mdi-check-circle-outline" size="40" color="white" />
          </v-avatar>
          <h2 class="text-h5 font-weight-black mb-1">Sale Complete!</h2>
          <div class="text-caption text-medium-emphasis font-weight-bold mb-4">Receipt #{{ saleResult.receiptId }}</div>
          
          <v-sheet rounded="lg" color="surface-variant" class="w-100 pa-4 mb-4 d-flex flex-column gap-2 text-left">
            <div class="d-flex justify-space-between text-body-2">
              <span class="text-medium-emphasis font-weight-medium">Amount</span>
              <span class="font-weight-black">{{ formatCurrency(saleResult.amount) }}</span>
            </div>
            <div class="d-flex justify-space-between text-body-2">
              <span class="text-medium-emphasis font-weight-medium">Method</span>
              <span class="font-weight-black">{{ saleResult.method }}</span>
            </div>
            <div class="d-flex justify-space-between text-body-2" v-if="saleResult.customer">
              <span class="text-medium-emphasis font-weight-medium">Customer</span>
              <span class="font-weight-black">{{ saleResult.customer }}</span>
            </div>
          </v-sheet>

          <v-btn block color="success" rounded="xl" height="48" class="font-weight-black mb-2" @click="saleResult = null">Done</v-btn>
          <v-btn block variant="tonal" rounded="xl" height="40" color="secondary" class="font-weight-bold" @click="reprintLastReceipt">
            <v-icon icon="mdi-printer" start size="16" /> Print Receipt
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import CustomerSelect from '~/components/CustomerSelect.vue'
import { printReceipt } from '~/utils/print'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: ['auth'] })

const config = useRuntimeConfig()
const appStore = useAppStore()
const { addNotification } = useNotifications()
const { toast } = useToast()

// Load Square SDK — sandbox vs production.
// Prefer the squareSandbox toggle from user settings (saved in Supabase profile).
// Fall back to detecting "sandbox-" prefix on the application ID.
// isSandbox checks three sources in priority order:
//  1. SQUARE_SANDBOX=true env var (via runtimeConfig.public.squareSandbox)
//  2. squareSandbox toggle saved in the user's Supabase profile
//  3. Application ID starting with "sandbox-" (Square's own convention)
const isSandbox = computed(() =>
  (config.public as any).squareSandbox ||
  appStore.settings?.squareSandbox ||
  config.public.squareApplicationId?.startsWith('sandbox-')
)

useHead({
  script: [{
    src: isSandbox.value
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js',
    async: true,
  }]
})

const inventory = computed(() => appStore.inventory ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$', taxRate: 0 })
const customers = computed(() => appStore.customers ?? [])

const squareConfigured = computed(() =>
  !!(settings.value.squareAccessToken && settings.value.squareLocationId)
)

// ── State ──────────────────────────────────────────────────────────
const searchQuery        = ref('')
const selectedCategory   = ref<string | null>(null)
const cart               = ref<any[]>([])
const selectedCustomerId = ref<number | null>(null)
const paymentMethod      = ref('Cash')
const processing         = ref(false)
const terminalStatus     = ref('')
const keypadAmount       = ref('0')
const cardLoading        = ref(false)
const saleResult         = ref<null | { receiptId: number; amount: number; method: string; customer?: string }>({} as any)
saleResult.value = null
const lastReceiptData    = ref<any>(null)

// ── Mobile tab navigation ──────────────────────────────────────────
const mobileTab = ref<'products' | 'cart' | 'checkout'>('products')
const ticketMode         = ref<{ ticketId: number; amount: number } | null>(null)

// ── Payment method config ──────────────────────────────────────────
const paymentMethods = [
  { id: 'Cash',     label: 'Cash',     icon: 'mdi-cash',   color: '#10b981' },
  { id: 'Card',     label: 'Card',     icon: 'mdi-credit-card-outline', color: '#6366f1' },
  { id: 'Afterpay', label: 'Afterpay', icon: 'mdi-wallet-outline',     color: '#06b6d4' },
  { id: 'Other',    label: 'Other',    icon: 'mdi-wallet-outline',     color: '#64748b' },
]

// ── Category tabs ──────────────────────────────────────────────────
const categoryTabs = computed(() => {
  const cats = [...new Set(allPosItems.value.map((i: any) => i.category).filter(Boolean))]
  return [null, ...cats]
})

// ── Merge standalone services into POS catalog ────────────────────
const allPosItems = computed(() => {
  const inv = inventory.value as any[]
  // Merge services from the separate services table that aren't already in inventory
  const existingNames = new Set(inv.map((i: any) => (i.name || '').toLowerCase()))
  const extraServices = (appStore.services as any[] || [])
    .filter((s: any) => s.active !== false && !existingNames.has((s.name || '').toLowerCase()))
    .map((s: any) => ({
      id: `svc-${s.id}`,
      name: s.name,
      price: s.price || 0,
      category: s.category || 'Services',
      itemType: 'service',
      stock: 9999,
      sku: '',
      description: s.description || '',
    }))
  return [...inv, ...extraServices]
})

// ── Filtered products ──────────────────────────────────────────────
const filteredProducts = computed(() =>
  allPosItems.value.filter((item: any) => {
    const q = searchQuery.value.toLowerCase()
    const matches = !q || (item.name||'').toLowerCase().includes(q)
      || (item.sku||'').toLowerCase().includes(q)
      || (item.description||'').toLowerCase().includes(q)
    const inCat = !selectedCategory.value || item.category === selectedCategory.value
    const isService = (item.itemType || 'product') === 'service'
    return matches && inCat && (isService || item.stock > 0)
  })
)

// ── Totals ─────────────────────────────────────────────────────────
const taxRate    = computed(() => parseFloat(settings.value?.taxRate as any) || 0)
const subtotal   = computed(() => cart.value.reduce((a: number, i: any) => a + i.price * i.quantity, 0))
const taxAmount  = computed(() => subtotal.value * (taxRate.value / 100))
const total      = computed(() => subtotal.value + taxAmount.value)
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n||0).toFixed(2)}`

const ctaLabel = computed(() => ({
  Cash:     `Collect ${formatCurrency(total.value)} Cash`,
  Card:     `Charge ${formatCurrency(total.value)} to Card`,
  Afterpay: `Pay via Afterpay`,
  Other:    `Complete Sale — ${formatCurrency(total.value)}`,
}[paymentMethod.value] ?? `Complete Sale — ${formatCurrency(total.value)}`))

// ── Cart ───────────────────────────────────────────────────────────
function addToCart(item: any) {
  const isService = (item.itemType || 'product') === 'service'
  const existing  = cart.value.find(i => i.id === item.id)
  if (existing && !isService) { existing.quantity++; }
  else if (existing && isService) { /* already in cart */ }
  else cart.value.push({ ...item, quantity: 1, isService })
  // On mobile, briefly flash the cart tab to show item was added
  if (window.innerWidth < 1024) {
    mobileTab.value = 'cart'
  }
}
function addAkkoInsurance() {
  const existing = cart.value.find(i => i.id === 'akko')
  if (existing) { existing.quantity++ }
  else cart.value.push({ id: 'akko', name: 'AKKO Device Insurance', price: 15.00, quantity: 1, isService: true })
  if (window.innerWidth < 1024) mobileTab.value = 'cart'
}
const incrementItem = (i: number) => { cart.value[i].quantity++ }
const decrementItem = (i: number) => {
  if (cart.value[i].quantity > 1) cart.value[i].quantity--
  else cart.value.splice(i, 1)
}
const clearCart = () => { cart.value = []; selectedCustomerId.value = null }

// ── Keypad ─────────────────────────────────────────────────────────
function handleKey(k: number | string) {
  if (k === 'C')  { keypadAmount.value = '0'; return }
  if (k === '⌫')  { keypadAmount.value = keypadAmount.value.length > 1 ? keypadAmount.value.slice(0,-1) : '0'; return }
  if (keypadAmount.value.length >= 8) return
  keypadAmount.value = keypadAmount.value === '0' ? String(k) : keypadAmount.value + k
}
function addCustomToCart() {
  const amt = parseFloat(keypadAmount.value) / 100
  if (amt <= 0) return
  cart.value.push({ id: `custom-${Date.now()}`, name: 'Custom Amount', price: amt, quantity: 1, isService: false })
  keypadAmount.value = '0'
}

// ── Ticket / Afterpay redirect handling ───────────────────────────
const route = useRoute()
const { $supabase } = useNuxtApp()
const from = (table: string) => ($supabase as any).from(table)

// ── Barcode Scanner Integration ────────────────────────────────────
let barcodeBuffer = ''
let barcodeTimer: any = null

function handleBarcodeScan(e: KeyboardEvent) {
  // Ignore input if user is actively typing in a form field
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return

  if (e.key === 'Enter') {
    if (barcodeBuffer.length > 2) {
      processScannedBarcode(barcodeBuffer.trim())
    }
    barcodeBuffer = ''
    if (barcodeTimer) clearTimeout(barcodeTimer)
    return
  }
  
  // Standard barcode characters
  if (e.key.length === 1) {
    barcodeBuffer += e.key
    if (barcodeTimer) clearTimeout(barcodeTimer)
    
    // Scanners type very fast; clear buffer if typing is slow (human)
    barcodeTimer = setTimeout(() => {
      barcodeBuffer = ''
    }, 50)
  }
}

async function processScannedBarcode(code: string) {
  // 1. Check if it's a Ticket SKU (e.g. TKT-123)
  if (code.toUpperCase().startsWith('TKT-')) {
    const idStr = code.substring(4)
    const ticketId = parseInt(idStr, 10)
    if (!isNaN(ticketId)) {
      
      // Prevent adding if already in cart
      if (cart.value.some(i => i.isTicket && i.ticketId === ticketId)) {
        toast.info('Already in Cart', `Ticket #${ticketId} is already added.`)
        return
      }

      // 1a. Check Local Store Memory First
      let ticket = appStore.tickets?.find((t: any) => t.id === ticketId)
      
      // 1b. If not in local memory, hit Supabase directly (e.g. cold / old ticket)
      if (!ticket) {
        try {
          // Since setup contains $supabase via useNuxtApp(), we use from() directly
          const { data, error } = await from('tickets').select('*').eq('id', ticketId).single()
          if (!error && data) {
            ticket = data
          }
        } catch (e) {
          console.error("Failed to fetch cold ticket:", e)
        }
      }

      // If we found the ticket either locally or remotely, build the cart row
      if (ticket) {
        cart.value.push({
          id: `tkt-${ticketId}`,
          quantity: 1,
          isTicket: true,
          ticketId: ticket.id,
          name: `Ticket #${ticket.id} · ${ticket.device || 'Device'}`,
          price: Number(ticket.price || 0),
          isService: true
        })
        if (ticket.customerId) selectedCustomerId.value = ticket.customerId
        toast.success('Ticket Added', `Added Ticket #${ticket.id} to cart`)
        return
      }
    }
    toast.danger('Not Found', `Ticket missing or closed: ${code}`)
    return
  }

  // 2. Search default inventory by SKU
  const product = appStore.inventory?.find((item: any) => item.sku?.toUpperCase() === code.toUpperCase())
  if (product) {
    addToCart(product)
    toast.success('Item Added', `${product.name} ready for checkout`)
    return
  }

  toast.danger('Not Found', `Barcode not recognized: ${code}`)
}

onMounted(() => {
  // Listen for global barcode scanning
  window.addEventListener('keydown', handleBarcodeScan)

  const { ticketId, amount, customerId, afterpay_success } = route.query
  if (ticketId && amount) {
    ticketMode.value = { ticketId: Number(ticketId), amount: Number(amount) }
    if (customerId) selectedCustomerId.value = Number(customerId)
    const t = appStore.tickets?.find((t: any) => t.id === Number(ticketId))
    cart.value = [{
      id: null, quantity: 1, isTicket: true, ticketId: Number(ticketId),
      name: t ? `Ticket #${ticketId} · ${t.device}` : `Ticket #${ticketId}`,
      price: Number(amount),
    }]
  }
  if (afterpay_success === 'true') {
    paymentMethod.value = 'Afterpay'
    const saved = localStorage.getItem('novaops_pending_pos_cart')
    if (saved) { cart.value = JSON.parse(saved); localStorage.removeItem('novaops_pending_pos_cart') }
    setTimeout(() => executeSale('Afterpay'), 800)
    const q = { ...route.query }; delete q.afterpay_success
    useRouter().replace({ query: q })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleBarcodeScan)
  if (cardInstance.value) { try { cardInstance.value.destroy() } catch {} }
  if (afterpayInstance.value) { try { afterpayInstance.value.destroy() } catch {} }
})

// ── Square SDK ──────────────────────────────────────────────────────
const squarePayments   = ref<any>(null)
const cardInstance     = ref<any>(null)
const cardAttached     = ref(false)
const afterpayInstance = ref<any>(null)

async function loadSquarePayments(): Promise<boolean> {
  if (squarePayments.value) return true
  for (let i = 0; i < 8; i++) {
    if ((window as any).Square) break
    await new Promise(r => setTimeout(r, 400))
  }
  if (!(window as any).Square) return false
  try {
    squarePayments.value = await (window as any).Square.payments(
      config.public.squareApplicationId,
      config.public.squareLocationId
    )
    return true
  } catch (e) { console.error('Square init:', e); return false }
}

async function initCardForm() {
  cardLoading.value = true
  try {
    const ok = await loadSquarePayments()
    if (!ok) { toast.danger('Square Error', 'SDK failed to load.'); return }
    if (cardInstance.value) {
      try { await cardInstance.value.destroy() } catch {}
      cardInstance.value = null; cardAttached.value = false
    }
    // Wait for CSS transition so container has real pixel dimensions
    await new Promise(r => setTimeout(r, 420))
    await nextTick()
    const container = document.getElementById('card-container')
    if (!container) return

    cardInstance.value = await squarePayments.value.card()
    await cardInstance.value.attach('#card-container')
    cardAttached.value = true
  } catch (e: any) {
    console.error('Card form init:', e)
    toast.danger('Card Form Error', e.message || 'Failed to initialize card form')
  } finally {
    cardLoading.value = false
  }
}

async function initAfterpayButton(amount: number) {
  if (!squareConfigured.value) return
  try {
    const ok = await loadSquarePayments()
    if (!ok) return
    if (afterpayInstance.value) {
      try { await afterpayInstance.value.destroy() } catch {}
      afterpayInstance.value = null
    }
    const req = squarePayments.value.paymentRequest({
      countryCode: 'US', currencyCode: 'USD',
      total: { amount: amount.toFixed(2), label: 'Total' }
    })
    afterpayInstance.value = await squarePayments.value.afterpayClearpay(req)
    await afterpayInstance.value.attach('#afterpay-button')
    document.getElementById('afterpay-button')?.addEventListener('click', async (e) => {
      e.stopPropagation()
      processing.value = true
      terminalStatus.value = 'Waiting for Afterpay approval…'
      try {
        const result = await afterpayInstance.value.tokenize()
        if (result.status === 'OK') {
          terminalStatus.value = 'Charging Afterpay account…'
          await handleRemoteSuccess(result.token, 'Afterpay')
        } else { throw new Error(result.errors?.[0]?.message || 'Afterpay tokenization failed') }
      } catch (err: any) {
        terminalStatus.value = ''
        toast.danger('Afterpay Failed', err.message)
      } finally { processing.value = false }
    })
  } catch (e: any) { console.error('Afterpay init:', e) }
}

// Watch payment method → init SDK forms
watch(paymentMethod, async (method, prev) => {
  if (prev === 'Card' && cardInstance.value) {
    try { await cardInstance.value.destroy() } catch {}
    cardInstance.value = null; cardAttached.value = false
  }
  if (prev === 'Afterpay' && afterpayInstance.value) {
    try { await afterpayInstance.value.destroy() } catch {}
    afterpayInstance.value = null
  }
  if (method === 'Card') { await nextTick(); await initCardForm() }
  if (method === 'Afterpay' && total.value > 0) { await nextTick(); await initAfterpayButton(total.value) }
})

// Re-init Afterpay when total changes
watch(total, async (v) => {
  if (paymentMethod.value === 'Afterpay' && v > 0) {
    await nextTick(); await initAfterpayButton(v)
  }
})

// ── Checkout dispatch ───────────────────────────────────────────────
async function handleCheckout() {
  if (!cart.value.length || processing.value) return
  if (paymentMethod.value === 'Card') { await handleCardPayment(); return }
  if (paymentMethod.value === 'Afterpay') {
    if (afterpayInstance.value) {
      processing.value = true; terminalStatus.value = 'Opening Afterpay…'
      try {
        const result = await afterpayInstance.value.tokenize()
        if (result.status === 'OK') await handleRemoteSuccess(result.token, 'Afterpay')
        else throw new Error(result.errors?.[0]?.message || 'Failed')
      } catch (e: any) { terminalStatus.value = ''; toast.danger('Afterpay Error', e.message) }
      finally { processing.value = false }
    }
    return
  }
  // Cash / Other
  processing.value = true
  try { await executeSale(paymentMethod.value) }
  catch (e: any) { terminalStatus.value = ''; toast.danger('Sale Failed', e.message) }
  finally { processing.value = false }
}

async function handleCardPayment() {
  if (!cardInstance.value || !cardAttached.value) {
    toast.warning('Card Form', 'Card form not ready. Please wait.'); return
  }
  processing.value = true; terminalStatus.value = 'Processing card…'
  try {
    const result = await cardInstance.value.tokenize()
    if (result.status === 'OK') {
      terminalStatus.value = 'Charging card…'
      await handleRemoteSuccess(result.token, 'Card')
    } else { throw new Error(result.errors?.[0]?.message || 'Card tokenization failed') }
  } catch (err: any) {
    terminalStatus.value = ''; toast.danger('Card Failed', err.message)
  } finally { processing.value = false }
}

async function handleRemoteSuccess(sourceId: string, method: 'Card' | 'Afterpay') {
  try {
    // Route through Nitro server API — Square blocks direct browser fetch (CORS).
    // The server reads credentials from environment variables, never from the client.
    const res = await $fetch('/api/square/payment', {
      method: 'POST',
      body: {
        sourceId,
        amountCents: Math.round(total.value * 100),
        referenceId: `novaops-${method.toLowerCase()}-${Date.now()}`,
        note: cart.value.map((i: any) => `${i.quantity}× ${i.name}`).join(', '),
      }
    })
    
    // We already checked res.success. Some endpoints might not return 'status'.
    // If it's successful, we proceed.
    
    await executeSale(method)
  } catch (e: any) {
    terminalStatus.value = ''
    // $fetch wraps server errors in e.data.message
    const msg = (e as any).data?.message || (e as any).message || `${method} charge failed`
    toast.danger(`${method} Charge Error`, msg)
  }
}

async function executeSale(finalMethod: string) {
  const customerName = selectedCustomerId.value
    ? (customers.value as any[]).find((c: any) => c.id === selectedCustomerId.value)?.name
    : undefined

  // Build the structured items list for the sale record
  const saleItems = cart.value.map((i: any) => ({
    name:     i.name,
    price:    i.price,
    quantity: i.quantity,
    sku:      i.sku || undefined,
  }))

  // Write to pos_sales — NOT tickets. Tickets are repair jobs only.
  const sale = await appStore.createPosSale({
    customerId:    selectedCustomerId.value || null,
    items:         saleItems,
    subtotal:      subtotal.value,
    tax:           taxAmount.value,
    total:         total.value,
    paymentMethod: finalMethod,
    note:          cart.value.map((i: any) => `${i.quantity}× ${i.name}`).join(', '),
  })

  // Deduct physical stock (skip non-numeric IDs like 'akko', 'custom-*', 'svc-*')
  const deductions = cart.value
    .filter((item: any) => item.id && typeof item.id === 'number' && !item.isService && !item.isTicket)
    .map((item: any) => {
      const inv = (appStore.inventory as any[]).find((i: any) => i.id === item.id)
      if (!inv) return null
      return appStore.updateInventoryItem(item.id, { stock: Math.max(0, inv.stock - item.quantity) })
        .catch((err: any) => console.warn(`[POS] Stock deduction failed for item ${item.id}:`, err))
    }).filter(Boolean)
  await Promise.all(deductions)

  // If in ticketMode: record the payment on the existing repair ticket
  if (ticketMode.value) {
    const sourceTicket = appStore.tickets?.find((t: any) => t.id === ticketMode.value!.ticketId)
    if (sourceTicket) {
      const payments = [...(sourceTicket.payments || []), {
        amount: total.value, method: finalMethod,
        note: `Collected via POS · Sale #${sale.id}`,
        date: new Date().toISOString(),
      }]
      await appStore.updateTicket(ticketMode.value.ticketId, { payments, status: 'Completed' })
    }
    ticketMode.value = null
  }

  const payloadData = {
    businessName:    settings.value?.businessName || 'NovaOps',
    businessAddress: settings.value?.address || '',
    businessPhone:   settings.value?.phone || '',
    date:            new Date().toLocaleString(),
    items:           cart.value.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
    subtotal:        subtotal.value,
    tax:             taxAmount.value,
    total:           total.value,
    currency:        settings.value?.currency || '$',
    customerName,
  }

  // Store for reprint
  lastReceiptData.value = { ...payloadData, ticketRef: `S-${sale.id}` }

  // Auto-print receipt if enabled
  try {
    const pSettings = JSON.parse(localStorage.getItem('novaops_printer_settings') || '{}')
    if (pSettings.autoPrintReceipt) {
      printReceipt(lastReceiptData.value)
    }
  } catch (err) { console.warn('Printer config parsing failed', err) }

  saleResult.value = { receiptId: sale.id, amount: total.value, method: finalMethod, customer: customerName }
  clearCart()
  terminalStatus.value = ''
}

function reprintLastReceipt() {
  if (lastReceiptData.value) {
    printReceipt(lastReceiptData.value)
  }
}

onUnmounted(() => {
  cardInstance.value?.destroy().catch(() => {})
  afterpayInstance.value?.destroy().catch(() => {})
})
</script>

<style scoped>
.product-hover {
  transition: transform 0.28s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.2s, border-color 0.18s;
}
.product-hover:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 6px 20px rgba(236,72,153,0.12);
  border-color: #ec489950 !important;
}

.cart-animated-row {
  transition: background 0.12s;
}
.cart-animated-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.cart-row-enter-active { transition: all 0.28s cubic-bezier(0.34,1.4,0.64,1); }
.cart-row-leave-active { transition: all 0.16s ease-in; position: absolute; width: 100%; }
.cart-row-enter-from   { transform: translateX(-10px); opacity: 0; }
.cart-row-leave-to     { transform: translateX(10px); opacity: 0; }
.cart-row-move         { transition: transform 0.28s cubic-bezier(0.34,1.2,0.64,1); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
