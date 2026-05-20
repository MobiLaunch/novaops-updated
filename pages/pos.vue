<template>
  <div class="pos-root flex flex-col h-full max-h-full overflow-hidden -m-4 md:-m-6 p-4 md:p-6">

    <!-- Ticket payment mode -->
    <Message
      v-if="ticketMode"
      severity="success"
      :closable="true"
      class="mb-4 shrink-0"
      @close="ticketMode = null; cart = []"
    >
      <span class="text-sm font-bold">Ticket #{{ ticketMode.ticketId }} — Collecting Payment</span>
      <p class="text-xs text-muted-foreground mt-1 mb-0">Completing this sale will mark the ticket as Completed.</p>
    </Message>

    <!-- Header -->
    <header class="flex items-center justify-between gap-4 mb-4 shrink-0 flex-wrap">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
          style="background: linear-gradient(135deg, #ec4899, #db2777);"
        >
          <i class="mdi mdi-cart-outline-text-2xl"></i>
        </div>
        <div>
          <h1 class="text-xl font-black m-0">Point of Sale</h1>
          <p class="text-xs text-muted-foreground font-medium m-0 mt-0.5">
            {{ allPosItems.length }} items · scan barcode to add
          </p>
        </div>
      </div>
      <div
        v-if="cart.length"
        class="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-600 dark:text-pink-400"
      >
        <i class="mdi mdi-shopping-outline"></i>
        <span class="text-xs font-bold">{{ cart.length }} item{{ cart.length !== 1 ? 's' : '' }}</span>
        <span class="text-lg font-black">{{ formatCurrency(total) }}</span>
      </div>
    </header>

    <!-- Mobile step tabs -->
    <nav v-if="isCompact" class="flex gap-1 mb-4 shrink-0 bg-muted rounded-xl p-1 border border-border">
      <button
        v-for="tab in mobileTabs"
        :key="tab.id"
        type="button"
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all"
        :class="mobileTab === tab.id ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground'"
        @click="mobileTab = tab.id"
      >
        <i class="mdi" :class="tab.icon"></i>
        {{ tab.label }}
        <span
          v-if="tab.id === 'cart' && cart.length"
          class="min-w-4 h-4 px-1 text-[9px] font-black text-white bg-pink-500 rounded-full flex items-center justify-center"
        >{{ cart.length }}</span>
      </button>
    </nav>

    <!-- 3-column body -->
    <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">

      <!-- Products -->
      <section
        v-show="!isCompact || mobileTab === 'products'"
        class="lg:col-span-5 xl:col-span-6 flex flex-col min-h-0 overflow-hidden"
      >
        <div class="relative shrink-0 mb-2">
          <i class="mdi mdi-magnify absolute left-3.5 text-muted-foreground" style="top: 50%; transform: translateY(-50%);"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Search products & services…"
            class="w-full pl-10 rounded-xl"
          />
        </div>

        <div class="flex gap-1.5 overflow-x-auto pb-2 shrink-0 scrollbar-thin">
          <button
            v-for="cat in categoryTabs"
            :key="String(cat ?? 'all')"
            type="button"
            class="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
            :class="selectedCategory === cat
              ? 'bg-pink-500/15 border-pink-500/40 text-pink-600 dark:text-pink-400'
              : 'border-border text-muted-foreground hover:text-foreground'"
            @click="selectedCategory = cat"
          >
            {{ cat ?? 'All' }}
          </button>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0 pb-2 pos-product-grid">
          <!-- AKKO -->
          <button
            type="button"
            class="pos-product-card text-left border border-violet-500/30 hover:border-violet-500/60"
            @click="addAkkoInsurance"
          >
            <div class="flex justify-between items-start mb-2">
              <div class="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-500 flex items-center justify-center">
                <i class="mdi mdi-shield-check-outline-text-lg"></i>
              </div>
              <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600">PLAN</span>
            </div>
            <div class="text-sm font-bold truncate">AKKO Insurance</div>
            <div class="text-[10px] text-muted-foreground truncate">Device protection</div>
            <div class="text-sm font-black text-violet-500 mt-2">$15.00</div>
          </button>

          <button
            v-for="item in filteredProducts"
            :key="item.id"
            type="button"
            class="pos-product-card text-left"
            :class="item.itemType === 'service' ? 'pos-product-card--service' : ''"
            @click="addToCart(item)"
          >
            <div class="flex justify-between items-start mb-2">
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center"
                :class="item.itemType === 'service' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-pink-500/15 text-pink-500'"
              >
                <i
                  class="mdi mdi-text-lg"
                  :class="item.itemType === 'service' ? 'mdi-wrench-outline' : 'mdi-package-variant-closed'"
                ></i>
              </div>
              <span
                class="text-[9px] font-black px-1.5 py-0.5 rounded"
                :class="item.itemType === 'service'
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : Number(item.stock) <= Number(item.low || 5)
                    ? 'bg-amber-500/15 text-amber-600'
                    : 'bg-pink-500/15 text-pink-600'"
              >
                {{ item.itemType === 'service' ? '∞' : item.stock }}
              </span>
            </div>
            <div class="text-sm font-bold truncate leading-tight">{{ item.name }}</div>
            <div class="text-[10px] text-muted-foreground truncate">{{ item.sku || item.category }}</div>
            <div
              class="text-sm font-black mt-2"
              :class="item.itemType === 'service' ? 'text-emerald-500' : 'text-pink-500'"
            >
              {{ formatCurrency(item.price) }}
            </div>
          </button>
        </div>

        <div
          v-if="filteredProducts.length === 0"
          class="flex flex-col items-center justify-center py-12 opacity-60 text-center"
        >
          <i class="mdi mdi-package-variant-closed-text-5xl-text-muted-foreground-mb-2"></i>
          <p class="text-sm font-bold m-0">
            {{ searchQuery ? `No results for "${searchQuery}"` : 'No items in catalog' }}
          </p>
        </div>
      </section>

      <!-- Cart -->
      <section
        v-show="!isCompact || mobileTab === 'cart'"
        class="lg:col-span-3 flex flex-col min-h-0"
      >
        <div class="flex flex-col h-full min-h-0 border border-border rounded-xl bg-surface overflow-hidden">
          <div class="flex items-center gap-2 px-4 py-3 border-b border-border bg-pink-500/5 shrink-0">
            <i class="mdi mdi-shopping-outline-text-pink-500"></i>
            <span class="text-sm font-black flex-1">Current Sale</span>
            <span
              v-if="cart.length"
              class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-600"
            >{{ cart.length }}</span>
            <Button
              severity="danger"
              variant="text"
              rounded
              :disabled="!cart.length"
              class="!w-9 !h-9"
              @click="clearCart"
            >
              <i class="mdi mdi-delete-outline"></i>
            </Button>
          </div>

          <div class="flex-1 overflow-y-auto min-h-0">
            <div v-if="!cart.length" class="h-full flex flex-col items-center justify-center p-6 text-center opacity-50">
              <i class="mdi mdi-cart-outline-text-5xl-mb-2"></i>
              <p class="text-sm font-bold m-0">Cart is empty</p>
              <p class="text-xs text-muted-foreground mt-1 m-0">Tap a product or scan a barcode</p>
            </div>

            <ul v-else class="m-0 p-0 list-none divide-y divide-border">
              <li
                v-for="(item, idx) in cart"
                :key="`${item.id ?? 'c'}-${idx}`"
                class="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors cart-row"
              >
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  :class="item.isService ? 'bg-emerald-500/12 text-emerald-500' : item.isTicket ? 'bg-amber-500/12 text-amber-500' : 'bg-pink-500/12 text-pink-500'"
                >
                  <i
                    class="mdi mdi-text-sm"
                    :class="item.isService ? 'mdi-wrench-outline' : item.isTicket ? 'mdi-ticket-confirmation-outline' : 'mdi-package-variant-closed'"
                  ></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold truncate">{{ item.name }}</div>
                  <div class="text-[10px] text-muted-foreground">
                    {{ formatCurrency(item.price) }}{{ item.isService ? ' · service' : item.isTicket ? ' · ticket' : ' ea.' }}
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div
                    v-if="!item.isService && !item.isTicket"
                    class="flex items-center gap-0.5 bg-muted rounded-lg px-1"
                  >
                    <Button variant="text" size="small" class="!w-7 !h-7" @click="decrementItem(idx)">
                      <i class="mdi mdi-minus-text-sm"></i>
                    </Button>
                    <span class="text-xs font-bold min-w-4 text-center">{{ item.quantity }}</span>
                    <Button variant="text" size="small" class="!w-7 !h-7" @click="incrementItem(idx)">
                      <i class="mdi mdi-plus-text-sm"></i>
                    </Button>
                  </div>
                  <Button
                    v-else
                    severity="danger"
                    variant="text"
                    size="small"
                    rounded
                    class="!w-7 !h-7"
                    @click="decrementItem(idx)"
                  >
                    <i class="mdi mdi-close-text-sm"></i>
                  </Button>
                  <span class="text-xs font-black text-pink-500 min-w-12 text-right">
                    {{ formatCurrency(item.price * item.quantity) }}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <!-- Totals + collapsible keypad -->
          <div class="border-t border-border p-3 shrink-0 bg-muted/30">
            <button
              type="button"
              class="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-muted-foreground mb-2"
              @click="showKeypad = !showKeypad"
            >
              <span class="flex items-center gap-1"><i class="mdi mdi-plus-circle-outline"></i> Custom amount</span>
              <span class="flex items-center gap-2">
                <span class="text-base font-black text-foreground normal-case tracking-normal">
                  {{ settings.currency || '$' }}{{ (parseFloat(keypadAmount) / 100).toFixed(2) }}
                </span>
                <i class="mdi" :class="showKeypad ? 'mdi-chevron-up' : 'mdi-chevron-down'"></i>
              </span>
            </button>

            <div v-show="showKeypad" class="mb-3">
              <div class="grid grid-cols-3 gap-1.5 mb-2">
                <Button
                  v-for="k in [1,2,3,4,5,6,7,8,9]"
                  :key="k"
                  :label="String(k)"
                  variant="outlined"
                  class="font-black text-lg py-3"
                  @click="handleKey(k)"
                />
                <Button label="C" severity="danger" variant="outlined" class="font-black text-lg py-3" @click="handleKey('C')" />
                <Button label="0" variant="outlined" class="font-black text-lg py-3" @click="handleKey(0)" />
                <Button variant="outlined" class="py-3" @click="handleKey('⌫')">
                  <i class="mdi mdi-backspace-outline-text-lg"></i>
                </Button>
              </div>
              <Button
                label="Add to cart"
                class="w-full font-black text-none"
                style="background: linear-gradient(135deg, #ec4899, #db2777); border: none; color: white;"
                :disabled="keypadAmount === '0'"
                @click="addCustomToCart"
              />
            </div>

            <div class="flex justify-between text-xs font-bold text-muted-foreground">
              <span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span>
            </div>
            <div v-if="taxRate" class="flex justify-between text-xs font-bold text-muted-foreground mt-1">
              <span>Tax ({{ taxRate }}%)</span><span>{{ formatCurrency(taxAmount) }}</span>
            </div>
            <div class="flex justify-between items-center mt-2 pt-2 border-t border-border">
              <span class="text-sm font-black">Total</span>
              <span class="text-xl font-black text-pink-500">{{ formatCurrency(total) }}</span>
            </div>

            <Button
              v-if="isCompact && cart.length"
              class="w-full mt-3 font-bold text-none"
              severity="secondary"
              @click="mobileTab = 'checkout'"
            >
              Continue to checkout
              <i class="mdi mdi-arrow-right-ml-2"></i>
            </Button>
          </div>
        </div>
      </section>

      <!-- Checkout -->
      <section
        v-show="!isCompact || mobileTab === 'checkout'"
        class="lg:col-span-4 flex flex-col min-h-0 overflow-y-auto"
      >
        <div class="bg-surface border border-border rounded-xl p-3 mb-3 shrink-0">
          <p class="text-[10px] font-black text-muted-foreground uppercase tracking-wider m-0 mb-2 flex items-center gap-1">
            <i class="mdi mdi-account-group-outline"></i> Customer (optional)
          </p>
          <CustomerSelect v-model="selectedCustomerId" />
        </div>

        <!-- Payment method picker -->
        <p class="text-[10px] font-black text-muted-foreground uppercase tracking-wider m-0 mb-2">Payment method</p>
        <div class="grid grid-cols-2 gap-2 mb-3 shrink-0">
          <button
            v-for="pm in paymentMethods"
            :key="pm.id"
            type="button"
            class="flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left"
            :class="paymentMethod === pm.id
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/40'"
            @click="paymentMethod = pm.id"
          >
            <i class="mdi mdi-text-xl" :class="pm.icon" :style="{ color: pm.color }"></i>
            <span class="text-xs font-bold">{{ pm.label }}</span>
          </button>
        </div>

        <!-- Card form -->
        <div
          class="relative border-2 rounded-xl overflow-hidden mb-3 shrink-0 transition-colors"
          :class="paymentMethod === 'Card' ? 'border-primary' : 'border-border'"
        >
          <div
            v-if="paymentMethod !== 'Card'"
            class="absolute inset-0 z-10 bg-surface/90 flex items-center justify-center cursor-pointer"
            @click="paymentMethod = 'Card'"
          >
            <Button severity="primary" rounded>
              <i class="mdi mdi-credit-card-outline-mr-2"></i>
              Use card payment
            </Button>
          </div>

          <div class="flex items-center gap-2 px-4 py-2.5 bg-primary text-white">
            <i class="mdi mdi-lock-outline"></i>
            <span class="text-sm font-black flex-1">Secure card checkout</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">Square</span>
          </div>

          <div class="p-4 bg-surface relative" :class="{ 'opacity-50 pointer-events-none': processing }">
            <p class="text-2xl font-black text-center text-primary m-0 mb-4">{{ formatCurrency(total) }}</p>
            <div class="relative rounded-xl overflow-hidden min-h-[56px]">
              <div id="card-container" class="w-full min-h-[56px]"></div>
              <div
                v-if="cardLoading"
                class="absolute inset-0 flex items-center justify-center gap-2 bg-surface rounded-xl"
              >
                <ProgressSpinner style="width: 24px; height: 24px" stroke-width="4" />
                <span class="text-xs font-bold text-muted-foreground">Initializing secure form…</span>
              </div>
            </div>

            <Message
              v-if="!squareCardSdkReady"
              severity="warn"
              :closable="false"
              class="mt-3 text-xs"
            >
              <span v-if="!squareConfigured">Square credentials missing —</span>
              <span v-else>Add your Square Application ID in Settings —</span>
              <NuxtLink to="/settings" class="font-bold underline ml-1">configure</NuxtLink>
            </Message>
          </div>
        </div>

        <Message
          v-if="paymentMethod === 'Afterpay'"
          severity="info"
          :closable="false"
          class="mb-3"
        >
          <div id="afterpay-button" class="w-full flex justify-center min-h-[48px] mb-2"></div>
          <p class="text-xs text-center m-0">4 interest-free payments. Min. order $35.</p>
        </Message>

        <Message
          v-else-if="paymentMethod !== 'Card'"
          :severity="paymentMethod === 'Cash' ? 'success' : 'secondary'"
          :closable="false"
          class="mb-3"
        >
          <span class="text-sm font-bold">{{ paymentMethod }} payment</span>
          <p class="text-xs m-0 mt-1">Record this payment, then tap complete sale below.</p>
        </Message>

        <div
          v-if="terminalStatus"
          class="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-bold mb-3"
        >
          <ProgressSpinner style="width: 16px; height: 16px" stroke-width="4" />
          {{ terminalStatus }}
        </div>

        <div class="flex-1 min-h-2"></div>

        <Button
          :label="ctaLabel"
          class="w-full font-black text-none shrink-0 sticky bottom-0"
          style="background: linear-gradient(135deg, #ec4899, #db2777); border: none; color: white; min-height: 3.5rem;"
          :disabled="!cart.length || processing"
          :loading="processing"
          @click="handleCheckout"
        />
      </section>
    </div>

    <!-- Success dialog -->
    <Dialog
      :visible="!!saleResult"
      modal
      :closable="false"
      :draggable="false"
      class="w-full max-w-[320px]"
      :show-header="false"
      pt:content:class="!p-0 !rounded-2xl"
      @update:visible="(v: boolean) => { if (!v) saleResult = null }"
    >
      <div v-if="saleResult" class="p-6 text-center flex flex-col items-center bg-surface rounded-2xl">
        <div class="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg">
          <i class="mdi mdi-check-circle-outline-text-4xl"></i>
        </div>
        <h2 class="text-xl font-black m-0">Sale complete!</h2>
        <p class="text-xs text-muted-foreground font-bold mt-1 mb-4">Receipt #{{ saleResult.receiptId }}</p>

        <div class="w-full bg-muted rounded-xl p-4 text-left flex flex-col gap-2 mb-4">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Amount</span>
            <span class="font-black">{{ formatCurrency(saleResult.amount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Method</span>
            <span class="font-black">{{ saleResult.method }}</span>
          </div>
          <div v-if="saleResult.customer" class="flex justify-between text-sm">
            <span class="text-muted-foreground">Customer</span>
            <span class="font-black truncate ml-2">{{ saleResult.customer }}</span>
          </div>
        </div>

        <Button label="Done" severity="success" class="w-full font-black mb-2 text-none" @click="saleResult = null" />
        <Button
          severity="secondary"
          variant="outlined"
          class="w-full font-bold text-none"
          @click="reprintLastReceipt"
        >
          <i class="mdi mdi-printer-mr-2"></i>
          Print receipt
        </Button>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import CustomerSelect from '~/components/CustomerSelect.vue'
import { printReceipt } from '~/utils/print'
import { useToast } from '~/composables/useToast'
import { useMediaQuery } from '@vueuse/core'

definePageMeta({ middleware: ['auth'] })

const config = useRuntimeConfig()
const appStore = useAppStore()
const { toast } = useToast()
const isCompact = useMediaQuery('(max-width: 959px)')

const isSandbox = computed(() =>
  (config.public as any).squareSandbox ||
  appStore.settings?.squareSandbox ||
  config.public.squareApplicationId?.startsWith('sandbox-') ||
  (settings.value as any).squareApplicationId?.startsWith?.('sandbox-'),
)

const inventory = computed(() => appStore.inventory ?? [])
const settings = computed(() => appStore.settings ?? { currency: '$', taxRate: 0 })
const customers = computed(() => appStore.customers ?? [])

const squareClientApplicationId = computed(
  () =>
    String((settings.value as any).squareApplicationId || '').trim() ||
    String(config.public.squareApplicationId || '').trim(),
)
const squareClientLocationId = computed(
  () =>
    String(settings.value.squareLocationId || '').trim() ||
    String(config.public.squareLocationId || '').trim(),
)

const squareScriptUrl = computed(() => {
  if (!squareClientApplicationId.value) return null
  return isSandbox.value
    ? 'https://sandbox.web.squarecdn.com/v1/square.js'
    : 'https://web.squarecdn.com/v1/square.js'
})

useHead(() => ({
  script: squareScriptUrl.value
    ? [{ key: 'square-web-payments-sdk', src: squareScriptUrl.value, async: true }]
    : [],
}))

const squareConfigured = computed(
  () => !!(settings.value.squareAccessToken && settings.value.squareLocationId),
)

const squareCardSdkReady = computed(
  () =>
    squareConfigured.value &&
    !!squareClientApplicationId.value &&
    !!squareClientLocationId.value,
)

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const cart = ref<any[]>([])
const selectedCustomerId = ref<number | null>(null)
const paymentMethod = ref('Cash')
const processing = ref(false)
const terminalStatus = ref('')
const keypadAmount = ref('0')
const showKeypad = ref(false)
const cardLoading = ref(false)
const saleResult = ref<null | { receiptId: number; amount: number; method: string; customer?: string }>(null)
const lastReceiptData = ref<any>(null)

const mobileTab = ref<'products' | 'cart' | 'checkout'>('products')
const mobileTabs = [
  { id: 'products' as const, label: 'Products', icon: 'mdi-package-variant-closed' },
  { id: 'cart' as const, label: 'Cart', icon: 'mdi-shopping-outline' },
  { id: 'checkout' as const, label: 'Pay', icon: 'mdi-credit-card-outline' },
]
const ticketMode = ref<{ ticketId: number; amount: number } | null>(null)

const paymentMethods = [
  { id: 'Cash', label: 'Cash', icon: 'mdi-cash', color: '#10b981' },
  { id: 'Card', label: 'Card', icon: 'mdi-credit-card-outline', color: '#6366f1' },
  { id: 'Afterpay', label: 'Afterpay', icon: 'mdi-wallet-outline', color: '#06b6d4' },
  { id: 'Other', label: 'Other', icon: 'mdi-dots-horizontal-circle-outline', color: '#64748b' },
]

const categoryTabs = computed(() => {
  const cats = [...new Set(allPosItems.value.map((i: any) => i.category).filter(Boolean))]
  return [null, ...cats]
})

const allPosItems = computed(() => {
  const inv = inventory.value as any[]
  const existingNames = new Set(inv.map((i: any) => (i.name || '').toLowerCase()))
  const extraServices = ((appStore.services as any[]) || [])
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

const filteredProducts = computed(() =>
  allPosItems.value.filter((item: any) => {
    const q = searchQuery.value.toLowerCase()
    const matches =
      !q ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    const inCat = !selectedCategory.value || item.category === selectedCategory.value
    const isService = (item.itemType || 'product') === 'service'
    return matches && inCat && (isService || item.stock > 0)
  }),
)

const taxRate = computed(() => parseFloat(settings.value?.taxRate as any) || 0)
const subtotal = computed(() => cart.value.reduce((a: number, i: any) => a + i.price * i.quantity, 0))
const taxAmount = computed(() => subtotal.value * (taxRate.value / 100))
const total = computed(() => subtotal.value + taxAmount.value)
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`

const ctaLabel = computed(
  () =>
    ({
      Cash: `Collect ${formatCurrency(total.value)} — Cash`,
      Card: `Charge ${formatCurrency(total.value)} — Card`,
      Afterpay: 'Pay via Afterpay',
      Other: `Complete sale — ${formatCurrency(total.value)}`,
    })[paymentMethod.value] ?? `Complete sale — ${formatCurrency(total.value)}`,
)

function addToCart(item: any) {
  const isService = (item.itemType || 'product') === 'service'
  const existing = cart.value.find((i) => i.id === item.id)
  if (existing && !isService) existing.quantity++
  else if (!existing) cart.value.push({ ...item, quantity: 1, isService })
  if (isCompact.value) mobileTab.value = 'cart'
}

function addAkkoInsurance() {
  const existing = cart.value.find((i) => i.id === 'akko')
  if (existing) existing.quantity++
  else cart.value.push({ id: 'akko', name: 'AKKO Device Insurance', price: 15.0, quantity: 1, isService: true })
  if (isCompact.value) mobileTab.value = 'cart'
}

const incrementItem = (i: number) => {
  cart.value[i].quantity++
}
const decrementItem = (i: number) => {
  if (cart.value[i].quantity > 1) cart.value[i].quantity--
  else cart.value.splice(i, 1)
}
const clearCart = () => {
  cart.value = []
  selectedCustomerId.value = null
}

function handleKey(k: number | string) {
  if (k === 'C') {
    keypadAmount.value = '0'
    return
  }
  if (k === '⌫') {
    keypadAmount.value = keypadAmount.value.length > 1 ? keypadAmount.value.slice(0, -1) : '0'
    return
  }
  if (keypadAmount.value.length >= 8) return
  keypadAmount.value = keypadAmount.value === '0' ? String(k) : keypadAmount.value + k
}

function addCustomToCart() {
  const amt = parseFloat(keypadAmount.value) / 100
  if (amt <= 0) return
  cart.value.push({ id: `custom-${Date.now()}`, name: 'Custom Amount', price: amt, quantity: 1, isService: false })
  keypadAmount.value = '0'
  showKeypad.value = false
}

const route = useRoute()
const { $supabase } = useNuxtApp()
const from = (table: string) => ($supabase as any).from(table)

let barcodeBuffer = ''
let barcodeTimer: ReturnType<typeof setTimeout> | null = null

function handleBarcodeScan(e: KeyboardEvent) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return

  if (e.key === 'Enter') {
    if (barcodeBuffer.length > 2) processScannedBarcode(barcodeBuffer.trim())
    barcodeBuffer = ''
    if (barcodeTimer) clearTimeout(barcodeTimer)
    return
  }

  if (e.key.length === 1) {
    barcodeBuffer += e.key
    if (barcodeTimer) clearTimeout(barcodeTimer)
    barcodeTimer = setTimeout(() => {
      barcodeBuffer = ''
    }, 50)
  }
}

async function processScannedBarcode(code: string) {
  if (code.toUpperCase().startsWith('TKT-')) {
    const ticketId = parseInt(code.substring(4), 10)
    if (!isNaN(ticketId)) {
      if (cart.value.some((i) => i.isTicket && i.ticketId === ticketId)) {
        toast.info('Already in Cart', `Ticket #${ticketId} is already added.`)
        return
      }

      let ticket = appStore.tickets?.find((t: any) => t.id === ticketId)

      if (!ticket) {
        try {
          const { data, error } = await from('tickets').select('*').eq('id', ticketId).single()
          if (!error && data) ticket = data
        } catch (e) {
          console.error('Failed to fetch cold ticket:', e)
        }
      }

      if (ticket) {
        cart.value.push({
          id: `tkt-${ticketId}`,
          quantity: 1,
          isTicket: true,
          ticketId: ticket.id,
          name: `Ticket #${ticket.id} · ${ticket.device || 'Device'}`,
          price: Number(ticket.price || 0),
          isService: true,
        })
        if (ticket.customerId) selectedCustomerId.value = ticket.customerId
        toast.success('Ticket Added', `Added Ticket #${ticket.id} to cart`)
        if (isCompact.value) mobileTab.value = 'cart'
        return
      }
    }
    toast.danger('Not Found', `Ticket missing or closed: ${code}`)
    return
  }

  const product = appStore.inventory?.find((item: any) => item.sku?.toUpperCase() === code.toUpperCase())
  if (product) {
    addToCart(product)
    toast.success('Item Added', `${product.name} ready for checkout`)
    return
  }

  toast.danger('Not Found', `Barcode not recognized: ${code}`)
}

const squarePayments = ref<any>(null)
const cardInstance = ref<any>(null)
const cardAttached = ref(false)
const afterpayInstance = ref<any>(null)

async function loadSquarePayments(): Promise<boolean> {
  if (squarePayments.value) return true
  for (let i = 0; i < 8; i++) {
    if ((window as any).Square) break
    await new Promise((r) => setTimeout(r, 400))
  }
  if (!(window as any).Square) return false
  const appId = squareClientApplicationId.value
  const locId = squareClientLocationId.value
  if (!appId || !locId) {
    console.error('[Square] Missing application ID or location ID for Web Payments SDK')
    return false
  }
  try {
    squarePayments.value = await (window as any).Square.payments(appId, locId)
    return true
  } catch (e) {
    console.error('Square init:', e)
    return false
  }
}

async function initCardForm() {
  cardLoading.value = true
  try {
    if (!squareCardSdkReady.value) {
      toast.warning(
        'Square setup',
        !squareConfigured.value
          ? 'Add your Square access token and location in Settings.'
          : 'Add your Square Application ID in Settings (Developer Dashboard → Application → Application ID).',
      )
      return
    }
    const ok = await loadSquarePayments()
    if (!ok) {
      toast.danger('Square Error', 'SDK failed to load. Check Application ID, location, and sandbox mode.')
      return
    }
    if (cardInstance.value) {
      try {
        await cardInstance.value.destroy()
      } catch {}
      cardInstance.value = null
      cardAttached.value = false
    }
    await new Promise((r) => setTimeout(r, 420))
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
  if (!squareCardSdkReady.value) return
  try {
    const ok = await loadSquarePayments()
    if (!ok) return
    if (afterpayInstance.value) {
      try {
        await afterpayInstance.value.destroy()
      } catch {}
      afterpayInstance.value = null
    }
    const req = squarePayments.value.paymentRequest({
      countryCode: 'US',
      currencyCode: 'USD',
      total: { amount: amount.toFixed(2), label: 'Total' },
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
        } else throw new Error(result.errors?.[0]?.message || 'Afterpay tokenization failed')
      } catch (err: any) {
        terminalStatus.value = ''
        toast.danger('Afterpay Failed', err.message)
      } finally {
        processing.value = false
      }
    })
  } catch (e: any) {
    console.error('Afterpay init:', e)
  }
}

watch(paymentMethod, async (method, prev) => {
  if (prev === 'Card' && cardInstance.value) {
    try {
      await cardInstance.value.destroy()
    } catch {}
    cardInstance.value = null
    cardAttached.value = false
  }
  if (prev === 'Afterpay' && afterpayInstance.value) {
    try {
      await afterpayInstance.value.destroy()
    } catch {}
    afterpayInstance.value = null
  }
  if (method === 'Card') {
    await nextTick()
    await initCardForm()
  }
  if (method === 'Afterpay' && total.value > 0) {
    await nextTick()
    await initAfterpayButton(total.value)
  }
})

watch(
  squareCardSdkReady,
  async (ready) => {
    if (ready && !cardAttached.value) {
      await nextTick()
      await initCardForm()
    }
  },
  { immediate: true },
)

watch(total, async (v) => {
  if (paymentMethod.value === 'Afterpay' && v > 0) {
    await nextTick()
    await initAfterpayButton(v)
  }
})

async function handleCheckout() {
  if (!cart.value.length || processing.value) return
  if (paymentMethod.value === 'Card') {
    await handleCardPayment()
    return
  }
  if (paymentMethod.value === 'Afterpay') {
    if (afterpayInstance.value) {
      processing.value = true
      terminalStatus.value = 'Opening Afterpay…'
      try {
        const result = await afterpayInstance.value.tokenize()
        if (result.status === 'OK') await handleRemoteSuccess(result.token, 'Afterpay')
        else throw new Error(result.errors?.[0]?.message || 'Failed')
      } catch (e: any) {
        terminalStatus.value = ''
        toast.danger('Afterpay Error', e.message)
      } finally {
        processing.value = false
      }
    }
    return
  }
  processing.value = true
  try {
    await executeSale(paymentMethod.value)
  } catch (e: any) {
    terminalStatus.value = ''
    toast.danger('Sale Failed', e.message)
  } finally {
    processing.value = false
  }
}

async function handleCardPayment() {
  if (!cardInstance.value || !cardAttached.value) {
    toast.warning('Card Form', 'Card form not ready. Please wait.')
    return
  }
  processing.value = true
  terminalStatus.value = 'Processing card…'
  try {
    const result = await cardInstance.value.tokenize()
    if (result.status === 'OK') {
      terminalStatus.value = 'Charging card…'
      await handleRemoteSuccess(result.token, 'Card')
    } else throw new Error(result.errors?.[0]?.message || 'Card tokenization failed')
  } catch (err: any) {
    terminalStatus.value = ''
    toast.danger('Card Failed', err.message)
  } finally {
    processing.value = false
  }
}

async function handleRemoteSuccess(sourceId: string, method: 'Card' | 'Afterpay') {
  try {
    const headers: Record<string, string> = {}
    if (settings.value.squareAccessToken && settings.value.squareLocationId) {
      headers['x-square-access-token'] = settings.value.squareAccessToken
      headers['x-square-location-id'] = settings.value.squareLocationId
    }
    await $fetch('/api/square/payment', {
      method: 'POST',
      headers: Object.keys(headers).length ? headers : undefined,
      body: {
        sourceId,
        amountCents: Math.round(total.value * 100),
        referenceId: `novaops-${method.toLowerCase()}-${Date.now()}`,
        note: cart.value.map((i: any) => `${i.quantity}× ${i.name}`).join(', '),
      },
    })
    await executeSale(method)
  } catch (e: any) {
    terminalStatus.value = ''
    const msg = (e as any).data?.message || (e as any).message || `${method} charge failed`
    toast.danger(`${method} Charge Error`, msg)
  }
}

async function executeSale(finalMethod: string) {
  const customerName = selectedCustomerId.value
    ? (customers.value as any[]).find((c: any) => c.id === selectedCustomerId.value)?.name
    : undefined

  const saleItems = cart.value.map((i: any) => ({
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    sku: i.sku || undefined,
  }))

  const sale = await appStore.createPosSale({
    customerId: selectedCustomerId.value || null,
    items: saleItems,
    subtotal: subtotal.value,
    tax: taxAmount.value,
    total: total.value,
    paymentMethod: finalMethod,
    note: cart.value.map((i: any) => `${i.quantity}× ${i.name}`).join(', '),
  })

  const deductions = cart.value
    .filter((item: any) => item.id && typeof item.id === 'number' && !item.isService && !item.isTicket)
    .map((item: any) => {
      const inv = (appStore.inventory as any[]).find((i: any) => i.id === item.id)
      if (!inv) return null
      return appStore
        .updateInventoryItem(item.id, { stock: Math.max(0, inv.stock - item.quantity) })
        .catch((err: any) => console.warn(`[POS] Stock deduction failed for item ${item.id}:`, err))
    })
    .filter(Boolean)
  await Promise.all(deductions)

  if (ticketMode.value) {
    const sourceTicket = appStore.tickets?.find((t: any) => t.id === ticketMode.value!.ticketId)
    if (sourceTicket) {
      const payments = [
        ...(sourceTicket.payments || []),
        {
          amount: total.value,
          method: finalMethod,
          note: `Collected via POS · Sale #${sale.id}`,
          date: new Date().toISOString(),
        },
      ]
      await appStore.updateTicket(ticketMode.value.ticketId, { payments, status: 'Completed' })
    }
    ticketMode.value = null
  }

  const payloadData = {
    businessName: settings.value?.businessName || 'NovaOps',
    businessAddress: settings.value?.address || '',
    businessPhone: settings.value?.phone || '',
    date: new Date().toLocaleString(),
    items: cart.value.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })),
    subtotal: subtotal.value,
    tax: taxAmount.value,
    total: total.value,
    currency: settings.value?.currency || '$',
    customerName,
  }

  lastReceiptData.value = { ...payloadData, ticketRef: `S-${sale.id}` }

  try {
    const pSettings = JSON.parse(localStorage.getItem('novaops_printer_settings') || '{}')
    if (pSettings.autoPrintReceipt) printReceipt(lastReceiptData.value)
  } catch (err) {
    console.warn('Printer config parsing failed', err)
  }

  saleResult.value = {
    receiptId: sale.id,
    amount: total.value,
    method: finalMethod,
    customer: customerName,
  }
  clearCart()
  terminalStatus.value = ''
  mobileTab.value = 'products'
}

function reprintLastReceipt() {
  if (lastReceiptData.value) printReceipt(lastReceiptData.value)
}

onMounted(async () => {
  window.addEventListener('keydown', handleBarcodeScan)

  const { ticketId, amount, customerId, afterpay_success } = route.query
  if (ticketId && amount) {
    ticketMode.value = { ticketId: Number(ticketId), amount: Number(amount) }
    if (customerId) selectedCustomerId.value = Number(customerId)
    const t = appStore.tickets?.find((t: any) => t.id === Number(ticketId))
    cart.value = [
      {
        id: null,
        quantity: 1,
        isTicket: true,
        ticketId: Number(ticketId),
        name: t ? `Ticket #${ticketId} · ${t.device}` : `Ticket #${ticketId}`,
        price: Number(amount),
      },
    ]
    mobileTab.value = 'checkout'
  }
  if (afterpay_success === 'true') {
    paymentMethod.value = 'Afterpay'
    const saved = localStorage.getItem('novaops_pending_pos_cart')
    if (saved) {
      cart.value = JSON.parse(saved)
      localStorage.removeItem('novaops_pending_pos_cart')
    }
    setTimeout(() => executeSale('Afterpay'), 800)
    const q = { ...route.query }
    delete q.afterpay_success
    useRouter().replace({ query: q })
  }

  await new Promise((r) => setTimeout(r, 1500))
  if (squareCardSdkReady.value && !cardAttached.value) await initCardForm()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleBarcodeScan)
  if (barcodeTimer) clearTimeout(barcodeTimer)
  if (cardInstance.value) {
    try {
      cardInstance.value.destroy()
    } catch {}
  }
  if (afterpayInstance.value) {
    try {
      afterpayInstance.value.destroy()
    } catch {}
  }
})
</script>

<style scoped>
.pos-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
  align-content: start;
}

.pos-product-card {
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--p-content-border-color, hsl(var(--border)));
  background: var(--p-content-background, #fff);
  transition: transform 0.2s ease, box-shadow 0.2s, border-color 0.18s;
}

.pos-product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.12);
  border-color: #ec489950;
}

.pos-product-card--service:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.12);
  border-color: #10b98150;
}

.cart-row:hover {
  background: hsl(var(--muted) / 0.5);
}
</style>
