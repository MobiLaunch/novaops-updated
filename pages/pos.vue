<template>
  <div class="pos-root">

    <!-- ── Ticket Mode Banner ─────────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="ticketMode" class="ticket-banner">
        <div class="ticket-banner-pip" />
        <div class="ticket-banner-icon"><TicketCheck class="w-4 h-4" /></div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-black" style="color:#10b981">Ticket #{{ ticketMode.ticketId }} — Collecting Payment</p>
          <p class="text-xs text-muted-foreground font-medium">Completing this sale will mark the ticket as Completed.</p>
        </div>
        <button class="banner-dismiss" @click="ticketMode = null; cart = []">✕ Dismiss</button>
      </div>
    </Transition>

    <!-- ── Page Header ────────────────────────────────────────────── -->
    <div class="pos-header">
      <div class="flex items-center gap-3">
        <div class="pos-header-icon">
          <ShoppingCart class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-black tracking-tight leading-none">Point of Sale</h1>
          <p class="text-[11px] text-muted-foreground font-medium mt-0.5">{{ (inventory as any[]).length }} items in catalog</p>
        </div>
      </div>
      <Transition name="fade-scale">
        <div v-if="cart.length" class="header-total-pill">
          <ShoppingBag class="w-3.5 h-3.5" />
          <span>{{ cart.length }} item{{ cart.length !== 1 ? 's' : '' }}</span>
          <span class="header-total-amt">{{ formatCurrency(total) }}</span>
        </div>
      </Transition>
    </div>

    <!-- ── Mobile Tab Bar ────────────────────────────────────────── -->
    <div class="mob-tabs">
      <button class="mob-tab" :class="{ active: mobileTab === 'products' }" @click="mobileTab = 'products'">
        <Package class="w-4 h-4" /> Products
      </button>
      <button class="mob-tab" :class="{ active: mobileTab === 'cart' }" @click="mobileTab = 'cart'">
        <ShoppingBag class="w-4 h-4" />
        Cart
        <span v-if="cart.length" class="mob-tab-badge">{{ cart.length }}</span>
      </button>
      <button class="mob-tab" :class="{ active: mobileTab === 'checkout' }" @click="mobileTab = 'checkout'">
        <CreditCard class="w-4 h-4" /> Checkout
      </button>
    </div>

    <!-- ── 3-Column Body ──────────────────────────────────────────── -->
    <div class="pos-body">

      <!-- ══ COL 1: Products ══════════════════════════════════════ -->
      <div class="col-products" :class="{ 'mob-hidden': mobileTab !== 'products' }">

        <!-- Search -->
        <div class="search-wrap">
          <Search class="search-icon" />
          <input
            v-model="searchQuery"
            placeholder="Search products & services…"
            class="search-input"
            @keydown.escape="searchQuery = ''"
          />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Category tabs -->
        <div class="cat-strip">
          <button
            v-for="cat in categoryTabs"
            :key="cat ?? 'all'"
            class="cat-tab"
            :class="{ active: selectedCategory === cat }"
            @click="selectedCategory = cat"
          >{{ cat ?? 'All' }}</button>
        </div>

        <!-- Product grid — scrollable -->
        <div class="product-grid">

          <!-- AKKO pinned card -->
          <button class="product-card akko-card" @click="addAkkoInsurance">
            <div class="product-card-top">
              <div class="product-icon-wrap" style="background:linear-gradient(135deg,#8b5cf620,#3b82f620)">
                <ShieldCheck class="w-5 h-5" style="color:#8b5cf6" />
              </div>
              <span class="product-badge akko-badge">PLAN</span>
            </div>
            <p class="product-name">AKKO Insurance</p>
            <p class="product-sku">Device protection</p>
            <p class="product-price" style="color:#8b5cf6">$15.00</p>
          </button>

          <!-- Inventory items -->
          <button
            v-for="item in filteredProducts"
            :key="item.id"
            class="product-card"
            :class="{ 'svc-card': (item.itemType||'product') === 'service' }"
            @click="addToCart(item)"
          >
            <div class="product-card-top">
              <div class="product-icon-wrap"
                :style="(item.itemType||'product') === 'service'
                  ? 'background:linear-gradient(135deg,#10b98118,#05966918)'
                  : 'background:linear-gradient(135deg,#ec489914,#db277714)'">
                <component :is="(item.itemType||'product') === 'service' ? Wrench : Package" class="w-5 h-5"
                  :style="(item.itemType||'product') === 'service' ? 'color:#10b981' : 'color:#ec4899'" />
              </div>
              <span class="product-badge"
                :style="(item.itemType||'product') === 'service'
                  ? 'background:#10b98114;color:#10b981'
                  : Number(item.stock) <= Number(item.low||5)
                    ? 'background:#f59e0b14;color:#f59e0b'
                    : 'background:#ec489910;color:#ec4899'">
                {{ (item.itemType||'product') === 'service' ? '∞' : item.stock }}
              </span>
            </div>
            <p class="product-name">{{ item.name }}</p>
            <p class="product-sku">{{ item.sku || item.category }}</p>
            <p class="product-price"
              :style="(item.itemType||'product') === 'service' ? 'color:#10b981' : 'color:#ec4899'">
              {{ formatCurrency(item.price) }}
            </p>
          </button>

          <div v-if="filteredProducts.length === 0" class="product-empty">
            <Package class="w-8 h-8 opacity-10" />
            <p class="text-sm font-bold text-muted-foreground">
              {{ searchQuery ? `No results for "${searchQuery}"` : 'No items in catalog' }}
            </p>
          </div>
        </div>
      </div>

      <!-- ══ COL 2: Cart ══════════════════════════════════════════ -->
      <div class="col-cart" :class="{ 'mob-hidden': mobileTab !== 'cart' }">

        <!-- Cart header -->
        <div class="cart-head">
          <div class="flex items-center gap-2">
            <div class="cart-head-icon"><ShoppingBag class="w-3.5 h-3.5 text-white" /></div>
            <span class="font-black text-sm">Current Sale</span>
            <span v-if="cart.length" class="cart-count-badge">{{ cart.length }}</span>
          </div>
          <button class="cart-clear-btn" :disabled="!cart.length" @click="clearCart" title="Clear cart">
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Cart items (scrollable) -->
        <div class="cart-body">
          <div v-if="!cart.length" class="cart-empty">
            <div class="cart-empty-ring">
              <ShoppingBag class="w-6 h-6 opacity-20" />
            </div>
            <p class="text-sm font-bold text-muted-foreground">Cart is empty</p>
            <p class="text-xs text-muted-foreground">Tap a product to add it</p>
          </div>

          <TransitionGroup v-else name="cart-row" tag="div" class="divide-y divide-border/25">
            <div v-for="(item, idx) in cart" :key="`${item.id ?? 'c'}-${idx}`" class="cart-row">
              <div class="cart-row-icon"
                :style="item.isService ? 'background:#10b98112;color:#10b981'
                  : item.isTicket ? 'background:#f59e0b12;color:#f59e0b'
                  : 'background:#ec489912;color:#ec4899'">
                <component :is="item.isService ? Wrench : item.isTicket ? TicketCheck : Package" class="w-3 h-3" />
              </div>
              <div class="cart-row-info">
                <p class="cart-item-name">{{ item.name }}</p>
                <p class="cart-item-sub">{{ formatCurrency(item.price) }}{{ item.isService ? ' · service' : item.isTicket ? ' · ticket' : ' ea.' }}</p>
              </div>
              <div class="cart-row-qty">
                <template v-if="!item.isService && !item.isTicket">
                  <button class="qty-btn" @click="decrementItem(idx)"><Minus class="w-2.5 h-2.5" /></button>
                  <span class="qty-num">{{ item.quantity }}</span>
                  <button class="qty-btn" @click="incrementItem(idx)"><Plus class="w-2.5 h-2.5" /></button>
                </template>
                <button v-else class="qty-remove-btn" @click="decrementItem(idx)" title="Remove">
                  <X class="w-2.5 h-2.5" />
                </button>
              </div>
              <span class="cart-row-total">{{ formatCurrency(item.price * item.quantity) }}</span>
            </div>
          </TransitionGroup>
        </div>

        <!-- Custom amount keypad (compact) -->
        <div class="custom-bar">
          <div class="custom-bar-header">
            <Plus class="w-3 h-3" />
            <span>Custom amount</span>
            <span class="custom-display" :class="{ dim: keypadAmount === '0' }">
              {{ settings.currency || '$' }}{{ (parseFloat(keypadAmount)/100).toFixed(2) }}
            </span>
          </div>
          <div class="keypad-mini">
            <button v-for="k in [1,2,3,4,5,6,7,8,9,'C',0,'⌫']" :key="k"
              class="key-mini" :class="{ 'key-clr': k==='C', 'key-bk': k==='⌫' }"
              @click="handleKey(k)">{{ k }}</button>
          </div>
          <button class="add-custom-btn" :disabled="keypadAmount==='0'" @click="addCustomToCart">
            <Plus class="w-3 h-3" /> Add {{ keypadAmount !== '0' ? formatCurrency(parseFloat(keypadAmount)/100) : '' }}
          </button>
        </div>

        <!-- Totals -->
        <div class="cart-totals">
          <div class="total-line"><span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span></div>
          <div v-if="taxRate" class="total-line"><span>Tax ({{ taxRate }}%)</span><span>{{ formatCurrency(taxAmount) }}</span></div>
          <div class="total-line total-grand">
            <span>Total</span>
            <span class="grand-amt">{{ formatCurrency(total) }}</span>
          </div>
        </div>

        <!-- Mobile: proceed to checkout button -->
        <button v-if="cart.length" class="mob-checkout-cta"
          @click="mobileTab = 'checkout'">
          <CheckCircle class="w-4 h-4" />
          Proceed to Checkout · {{ formatCurrency(total) }}
        </button>
      </div>

      <!-- ══ COL 3: Checkout ══════════════════════════════════════ -->
      <div class="col-checkout" :class="{ 'mob-hidden': mobileTab !== 'checkout' }">

        <!-- Customer -->
        <div class="checkout-card">
          <p class="card-label"><Users class="w-3 h-3" /> Customer <span class="optional">(optional)</span></p>
          <CustomerSelect v-model="selectedCustomerId" />
        </div>

        <!-- Payment method selector -->
        <div class="checkout-card">
          <p class="card-label"><CreditCard class="w-3 h-3" /> Payment Method</p>
          <div class="pm-grid">
            <button v-for="m in paymentMethods" :key="m.id"
              class="pm-tile"
              :class="{ active: paymentMethod === m.id }"
              :style="paymentMethod === m.id ? `--accent:${m.color}` : ''"
              @click="paymentMethod = m.id">
              <component :is="m.icon" class="w-4 h-4" />
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- Square Card Form — always in DOM, hidden via CSS height trick -->
        <!-- Square SDK measures the container at attach time; never remove from DOM -->
        <div class="card-form-card" :class="{ visible: paymentMethod === 'Card' }">
          <p class="card-label">
            <Lock class="w-3 h-3" /> Card Details
            <span class="sq-badge">
              <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                <rect width="14" height="14" rx="3" fill="currentColor"/>
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="white"/>
              </svg>
              Square
            </span>
          </p>
          <div class="card-host-wrap" :style="processing ? 'opacity:0.5;pointer-events:none' : ''">
            <div id="card-container" class="card-host"></div>
            <Transition name="fade">
              <div v-if="cardLoading" class="card-loading">
                <div class="spin-ring" />
                <span class="text-xs font-medium text-muted-foreground">Initializing secure form…</span>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Afterpay -->
        <div v-if="paymentMethod === 'Afterpay'" class="checkout-card afterpay-card">
          <p class="card-label">
            <span class="afterpay-dot" />
            Afterpay / Clearpay
          </p>
          <div id="afterpay-button" class="afterpay-host"></div>
          <p class="afterpay-note">4 interest-free payments. Min. order $35.</p>
        </div>

        <!-- Cash / Other hint -->
        <div v-if="paymentMethod === 'Cash' || paymentMethod === 'Other'" class="checkout-card cash-card">
          <component :is="paymentMethod === 'Cash' ? Banknote : Wallet" class="w-5 h-5 cash-icon" />
          <div>
            <p class="text-sm font-black">{{ paymentMethod }} Payment</p>
            <p class="text-xs text-muted-foreground font-medium mt-0.5">
              {{ paymentMethod === 'Cash'
                ? 'Collect cash, then tap Complete Sale to record the transaction.'
                : 'Record any payment — check, store credit, or other method.' }}
            </p>
          </div>
        </div>

        <!-- Processing status -->
        <Transition name="fade-up">
          <div v-if="terminalStatus" class="status-bar">
            <div class="status-spinner" />
            {{ terminalStatus }}
          </div>
        </Transition>

        <div class="checkout-spacer" />

        <!-- Charge amount -->
        <div class="charge-block">
          <span class="charge-label">Charge</span>
          <span class="charge-amt" :class="{ lit: cart.length }">{{ formatCurrency(total) }}</span>
        </div>

        <!-- Primary checkout button -->
        <button
          class="checkout-btn"
          :disabled="!cart.length || processing"
          :class="{ processing }"
          @click="handleCheckout"
        >
          <Transition name="btn-swap" mode="out-in">
            <span v-if="processing" key="proc" class="btn-inner">
              <div class="btn-spin" />{{ terminalStatus || 'Processing…' }}
            </span>
            <span v-else-if="!cart.length" key="empty" class="btn-inner">
              <ShoppingCart class="w-4 h-4" /> Add items to checkout
            </span>
            <span v-else key="go" class="btn-inner">
              <CheckCircle class="w-4 h-4" /> {{ ctaLabel }}
            </span>
          </Transition>
        </button>

        <!-- Square config warning -->
        <div v-if="paymentMethod === 'Card' && !squareConfigured" class="sq-warning">
          <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
          Square credentials missing —
          <button class="sq-warning-link" @click="useRouter().push('/settings')">configure in Settings</button>
        </div>

      </div><!-- /col-checkout -->
    </div><!-- /pos-body -->

    <!-- ── Sale Success Modal ──────────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="saleResult" class="modal-backdrop" @click="saleResult = null">
        <div class="modal-card" @click.stop>
          <div class="modal-success-ring">
            <CheckCircle class="w-9 h-9 text-white" />
          </div>
          <h2 class="modal-title">Sale Complete!</h2>
          <p class="modal-receipt">Receipt #{{ saleResult.receiptId }}</p>
          <div class="modal-details">
            <div class="modal-detail-row">
              <span>Amount</span>
              <strong>{{ formatCurrency(saleResult.amount) }}</strong>
            </div>
            <div class="modal-detail-row">
              <span>Method</span>
              <strong>{{ saleResult.method }}</strong>
            </div>
            <div v-if="saleResult.customer" class="modal-detail-row">
              <span>Customer</span>
              <strong>{{ saleResult.customer }}</strong>
            </div>
          </div>
          <button class="modal-done-btn" @click="saleResult = null">Done</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import {
  Search, Package, ShoppingCart, ShoppingBag, Trash2, Plus, Minus, X,
  CheckCircle, CreditCard, TicketCheck, ShieldCheck, Wrench,
  Banknote, Wallet, Users, Lock, AlertCircle,
} from 'lucide-vue-next'
import CustomerSelect from '~/components/CustomerSelect.vue'

definePageMeta({ middleware: ['auth'] })

const config = useRuntimeConfig()
const appStore = useAppStore()
const { addNotification } = useNotifications()

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
const saleResult         = ref<null | { receiptId: number; amount: number; method: string; customer?: string }>(null)

// ── Mobile tab navigation ──────────────────────────────────────────
const mobileTab = ref<'products' | 'cart' | 'checkout'>('products')
const ticketMode         = ref<{ ticketId: number; amount: number } | null>(null)

// ── Payment method config ──────────────────────────────────────────
const paymentMethods = [
  { id: 'Cash',     label: 'Cash',     icon: Banknote,   color: '#10b981' },
  { id: 'Card',     label: 'Card',     icon: CreditCard, color: '#6366f1' },
  { id: 'Afterpay', label: 'Afterpay', icon: Wallet,     color: '#06b6d4' },
  { id: 'Other',    label: 'Other',    icon: Wallet,     color: '#64748b' },
]

// ── Category tabs ──────────────────────────────────────────────────
const categoryTabs = computed(() => {
  const cats = [...new Set((inventory.value as any[]).map((i: any) => i.category).filter(Boolean))]
  return [null, ...cats]
})

// ── Filtered products ──────────────────────────────────────────────
const filteredProducts = computed(() =>
  (inventory.value as any[]).filter((item: any) => {
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
onMounted(() => {
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
    setTimeout(() => executeTicketCreation('Afterpay'), 800)
    const q = { ...route.query }; delete q.afterpay_success
    useRouter().replace({ query: q })
  }
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
    if (!ok) { addNotification('Square Error', 'SDK failed to load.', 'error'); return }
    if (cardInstance.value) {
      try { await cardInstance.value.destroy() } catch {}
      cardInstance.value = null; cardAttached.value = false
    }
    // Wait for CSS transition so container has real pixel dimensions
    await new Promise(r => setTimeout(r, 420))
    await nextTick()
    const container = document.getElementById('card-container')
    if (!container) return

    cardInstance.value = await squarePayments.value.card({
      style: {
        '.input-container':         { borderRadius: '12px', borderColor: 'hsl(var(--border))' },
        '.input-container.is-focus':{ borderColor: '#6366f1', boxShadow: '0 0 0 3px #6366f118' },
        '.input-container.is-error':{ borderColor: '#ef4444' },
        'input': { fontFamily: "'Google Sans','Nunito',system-ui,sans-serif", fontSize: '14px', fontWeight: '500' },
        '.message-text': { color: '#ef4444', fontSize: '12px' },
      }
    })
    await cardInstance.value.attach('#card-container')
    cardAttached.value = true
  } catch (e: any) {
    console.error('Card form init:', e)
    addNotification('Card Form Error', e.message || 'Failed to initialize card form', 'error')
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
        addNotification('Afterpay Failed', err.message, 'error')
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
      } catch (e: any) { terminalStatus.value = ''; addNotification('Afterpay Error', e.message, 'error') }
      finally { processing.value = false }
    }
    return
  }
  // Cash / Other
  processing.value = true
  try { await executeTicketCreation(paymentMethod.value) }
  catch (e: any) { terminalStatus.value = ''; addNotification('Sale Failed', e.message, 'error') }
  finally { processing.value = false }
}

async function handleCardPayment() {
  if (!cardInstance.value || !cardAttached.value) {
    addNotification('Card Form', 'Card form not ready. Please wait.', 'warning'); return
  }
  processing.value = true; terminalStatus.value = 'Processing card…'
  try {
    const result = await cardInstance.value.tokenize()
    if (result.status === 'OK') {
      terminalStatus.value = 'Charging card…'
      await handleRemoteSuccess(result.token, 'Card')
    } else { throw new Error(result.errors?.[0]?.message || 'Card tokenization failed') }
  } catch (err: any) {
    terminalStatus.value = ''; addNotification('Card Failed', err.message, 'error')
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
    if (!res.success || res.status !== 'COMPLETED')
      throw new Error(`${method} capture failed — status: ${res.status}`)
    await executeTicketCreation(method)
  } catch (e: any) {
    terminalStatus.value = ''
    // $fetch wraps server errors in e.data.message
    const msg = (e as any).data?.message || (e as any).message || `${method} charge failed`
    addNotification(`${method} Charge Error`, msg, 'error')
  }
}

async function executeTicketCreation(finalMethod: string) {
  const customerName = selectedCustomerId.value
    ? (customers.value as any[]).find((c: any) => c.id === selectedCustomerId.value)?.name
    : undefined

  const ticket = await appStore.createTicket({
    customerId: selectedCustomerId.value,
    device: 'POS Sale',
    issue: cart.value.map((i: any) => `${i.quantity}× ${i.name}`).join(', '),
    status: 'Completed',
    price: total.value,
    posOrder: true,
    paymentMethod: finalMethod,
  } as any)

  // Deduct physical stock
  const deductions = cart.value
    .filter((item: any) => item.id && !item.isService && !item.isTicket)
    .map((item: any) => {
      const inv = (appStore.inventory as any[]).find((i: any) => i.id === item.id)
      if (!inv) return null
      return appStore.updateInventoryItem(item.id, { stock: Math.max(0, inv.stock - item.quantity) })
    }).filter(Boolean)
  await Promise.all(deductions)

  // Record payment on ticket if in ticket mode
  if (ticketMode.value) {
    const sourceTicket = appStore.tickets?.find((t: any) => t.id === ticketMode.value!.ticketId)
    if (sourceTicket) {
      const payments = [...(sourceTicket.payments || []), {
        amount: total.value, method: finalMethod,
        note: `Collected via POS · Sale #${ticket.id}`,
        date: new Date().toISOString(),
      }]
      await appStore.updateTicket(ticketMode.value.ticketId, { payments, status: 'Completed' })
    }
    ticketMode.value = null
  }

  saleResult.value = { receiptId: ticket.id, amount: total.value, method: finalMethod, customer: customerName }
  clearCart()
  terminalStatus.value = ''
}

onUnmounted(() => {
  cardInstance.value?.destroy().catch(() => {})
  afterpayInstance.value?.destroy().catch(() => {})
})
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────── */
.pos-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: calc(100dvh - 160px);
  min-height: 560px;
}

/* ── Mobile Tab Bar ────────────────────────────────────────────────── */
.mob-tabs {
  display: none;
  gap: 6px;
  padding: 4px;
  border-radius: 16px;
  background: hsl(var(--muted)/0.6);
  flex-shrink: 0;
}
.mob-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: hsl(var(--muted-foreground));
  transition: all 0.2s ease;
  position: relative;
}
.mob-tab.active {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.mob-tab-badge {
  position: absolute;
  top: 4px; right: 4px;
  min-width: 16px; height: 16px;
  border-radius: 8px;
  background: #ec4899;
  color: white;
  font-size: 9px;
  font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
}

@media (max-width: 1023px) {
  .mob-tabs { display: flex; }
  .mob-hidden { display: none !important; }
  .pos-body {
    grid-template-columns: 1fr !important;
    overflow: visible !important;
  }
  .col-products,
  .col-cart,
  .col-checkout {
    min-height: 0;
    height: 100%;
    overflow-y: auto;
  }
  .pos-root {
    height: auto;
    min-height: calc(100dvh - 160px);
  }
}

/* ── Ticket Banner ─────────────────────────────────────────────────── */
.ticket-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px;
  border-radius: 14px;
  background: #10b98108;
  border: 1.5px solid #10b98128;
  flex-shrink: 0;
  position: relative; overflow: hidden;
}
.ticket-banner-pip {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: #10b981;
  border-radius: 0 2px 2px 0;
}
.ticket-banner-icon {
  width: 28px; height: 28px; border-radius: 9px;
  background: #10b98120; color: #10b981;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.banner-dismiss {
  font-size: 11px; font-weight: 700;
  color: hsl(var(--muted-foreground));
  padding: 4px 10px; border-radius: 8px;
  transition: all 0.15s; flex-shrink: 0;
}
.banner-dismiss:hover { background: hsl(var(--muted)/0.5); color: hsl(var(--foreground)); }

/* ── Header ────────────────────────────────────────────────────────── */
.pos-header {
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.pos-header-icon {
  width: 38px; height: 38px; border-radius: 13px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  box-shadow: 0 4px 14px #ec489940;
  display: flex; align-items: center; justify-content: center;
}
.header-total-pill {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 14px; border-radius: 99px;
  background: #ec489912; border: 1.5px solid #ec489928;
  font-size: 12px; font-weight: 700; color: #ec4899;
}
.header-total-amt { font-weight: 900; font-size: 14px; }

/* ── 3-Column Grid ─────────────────────────────────────────────────── */
.pos-body {
  display: grid;
  grid-template-columns: 1fr 300px 272px;
  gap: 14px;
  flex: 1; min-height: 0; overflow: hidden;
}

/* ══ Products Column ══════════════════════════════════════════════════ */
.col-products {
  display: flex; flex-direction: column; gap: 10px;
  min-height: 0; overflow: hidden;
}

/* Search */
.search-wrap { position: relative; flex-shrink: 0; }
.search-icon {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  width: 14px; height: 14px; color: hsl(var(--muted-foreground)); pointer-events: none;
}
.search-input {
  width: 100%; height: 40px;
  padding-left: 36px; padding-right: 32px;
  border-radius: 12px; font-size: 13px; font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 1.5px solid hsl(var(--border)/0.6);
  color: hsl(var(--foreground)); outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus { border-color: #ec489950; box-shadow: 0 0 0 3px #ec489910; }
.search-clear {
  position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
  width: 22px; height: 22px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: hsl(var(--muted-foreground)); transition: all 0.12s;
}
.search-clear:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }

/* Category tabs */
.cat-strip {
  display: flex; gap: 5px; flex-wrap: nowrap; overflow-x: auto;
  flex-shrink: 0; scrollbar-width: none; padding-bottom: 2px;
}
.cat-strip::-webkit-scrollbar { display: none; }
.cat-tab {
  padding: 5px 13px; border-radius: 99px;
  font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
  background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground));
  border: 1.5px solid transparent; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34,1.4,0.64,1);
}
.cat-tab:hover { color: hsl(var(--foreground)); transform: scale(1.03); }
.cat-tab.active { background: #ec489914; color: #ec4899; border-color: #ec489932; transform: scale(1.05); }

/* Product grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px; overflow-y: auto; align-content: start; padding-right: 2px;
}
.product-grid::-webkit-scrollbar { width: 3px; }
.product-grid::-webkit-scrollbar-thumb { background: hsl(var(--border)/0.5); border-radius: 99px; }

.product-card {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px; border-radius: 16px;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border)/0.5);
  cursor: pointer; text-align: left;
  transition: transform 0.28s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.2s, border-color 0.18s;
}
.product-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 6px 20px rgba(236,72,153,0.12);
  border-color: #ec489938;
}
.product-card:active { transform: scale(0.96); }
.akko-card { border-color: #8b5cf628; background: color-mix(in srgb, #8b5cf6 3%, hsl(var(--card))); }
.akko-card:hover { border-color: #8b5cf650; box-shadow: 0 6px 20px #8b5cf618; }
.svc-card:hover  { border-color: #10b98138; box-shadow: 0 6px 20px #10b98112; }

.product-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
.product-icon-wrap {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.product-badge {
  font-size: 9px; font-weight: 800;
  padding: 2px 6px; border-radius: 99px;
}
.akko-badge { background: #8b5cf614; color: #8b5cf6; }
.product-name { font-size: 12px; font-weight: 800; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.product-sku  { font-size: 10px; color: hsl(var(--muted-foreground)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-price { font-size: 15px; font-weight: 900; margin-top: 2px; }
.product-empty {
  grid-column: 1/-1; display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 40px 16px; text-align: center;
}

/* ══ Cart Column ══════════════════════════════════════════════════════ */
.col-cart {
  display: flex; flex-direction: column;
  border-radius: 20px;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border)/0.6);
  overflow: hidden; min-height: 0;
}

.cart-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid hsl(var(--border)/0.4);
  background: #ec489904; flex-shrink: 0;
}
.cart-head-icon {
  width: 24px; height: 24px; border-radius: 8px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  display: flex; align-items: center; justify-content: center;
}
.cart-count-badge {
  font-size: 10px; font-weight: 800;
  background: #ec489918; color: #ec4899;
  padding: 1px 7px; border-radius: 99px;
}
.cart-clear-btn {
  width: 28px; height: 28px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: #ef444410; color: #ef4444; transition: all 0.15s;
}
.cart-clear-btn:not(:disabled):hover { background: #ef444420; transform: scale(1.1); }
.cart-clear-btn:disabled { opacity: 0.2; cursor: not-allowed; }

.cart-body { flex: 1; overflow-y: auto; min-height: 0; }
.cart-body::-webkit-scrollbar { width: 3px; }
.cart-body::-webkit-scrollbar-thumb { background: hsl(var(--border)/0.4); border-radius: 99px; }

.cart-empty {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px; padding: 24px;
}
.cart-empty-ring {
  width: 46px; height: 46px; border-radius: 50%;
  border: 2px dashed hsl(var(--border)/0.5);
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}

.cart-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  transition: background 0.12s;
}
.cart-row:hover { background: hsl(var(--muted)/0.12); }
.cart-row-icon {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.cart-row-info { flex: 1; min-width: 0; }
.cart-item-name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cart-item-sub  { font-size: 10px; color: hsl(var(--muted-foreground)); }
.cart-row-qty {
  display: flex; align-items: center; gap: 2px;
  background: hsl(var(--muted)/0.4); border-radius: 9px; padding: 2px; flex-shrink: 0;
}
.qty-btn {
  width: 20px; height: 20px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: hsl(var(--muted-foreground)); transition: all 0.1s;
}
.qty-btn:hover { background: hsl(var(--background)); color: hsl(var(--foreground)); }
.qty-num { width: 22px; text-align: center; font-size: 12px; font-weight: 800; }
.qty-remove-btn {
  width: 24px; height: 24px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: #ef444410; color: #ef4444; transition: all 0.12s;
}
.qty-remove-btn:hover { background: #ef444420; }
.cart-row-total { font-size: 12px; font-weight: 800; color: #ec4899; min-width: 48px; text-align: right; flex-shrink: 0; }

/* Custom amount bar */
.custom-bar {
  flex-shrink: 0; padding: 9px 14px;
  border-top: 1px solid hsl(var(--border)/0.3);
  background: hsl(var(--muted)/0.12);
  display: flex; flex-direction: column; gap: 7px;
}
.custom-bar-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700;
  color: hsl(var(--muted-foreground));
}
.custom-display {
  margin-left: auto; font-size: 18px; font-weight: 900;
  color: hsl(var(--foreground)); transition: color 0.2s;
}
.custom-display.dim { color: hsl(var(--muted-foreground)/0.25); }
.keypad-mini {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px;
}
.key-mini {
  height: 26px; border-radius: 7px; font-size: 12px; font-weight: 800;
  background: hsl(var(--muted)/0.5); color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border)/0.35);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.1s;
}
.key-mini:hover  { transform: scale(1.08); background: hsl(var(--muted)); }
.key-mini:active { transform: scale(0.9); }
.key-clr { background: #ef444410; color: #ef4444; border-color: #ef444420; font-size: 10px; }
.key-bk  { font-size: 10px; color: hsl(var(--muted-foreground)); }
.add-custom-btn {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  height: 28px; border-radius: 8px; font-size: 11px; font-weight: 800;
  color: white; background: linear-gradient(135deg, #ec4899, #db2777);
  box-shadow: 0 3px 10px #ec489930;
  transition: all 0.2s cubic-bezier(0.34,1.4,0.64,1);
}
.add-custom-btn:not(:disabled):hover { transform: scale(1.05); box-shadow: 0 4px 14px #ec489950; }
.add-custom-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Cart totals */
.mob-checkout-cta {
  display: none;
  width: 100%;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  font-size: 13px;
  font-weight: 900;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}
.mob-checkout-cta:hover { transform: scale(1.02); }
.mob-checkout-cta:active { transform: scale(0.97); }
@media (max-width: 1023px) {
  .mob-checkout-cta { display: flex; }
}

.cart-totals {
  flex-shrink: 0; padding: 10px 14px 12px;
  border-top: 1px solid hsl(var(--border)/0.4);
  display: flex; flex-direction: column; gap: 3px;
}
.total-line {
  display: flex; justify-content: space-between;
  font-size: 12px; color: hsl(var(--muted-foreground));
}
.total-grand {
  font-size: 14px; font-weight: 900; color: hsl(var(--foreground));
  padding-top: 7px; margin-top: 4px;
  border-top: 1px solid hsl(var(--border)/0.4);
}
.grand-amt { color: #ec4899; font-size: 17px; }

/* ══ Checkout Column ══════════════════════════════════════════════════ */
.col-checkout {
  display: flex; flex-direction: column; gap: 8px;
  overflow-y: auto; padding-right: 2px;
}
.col-checkout::-webkit-scrollbar { width: 3px; }
.col-checkout::-webkit-scrollbar-thumb { background: hsl(var(--border)/0.4); border-radius: 99px; }

.checkout-card {
  flex-shrink: 0; padding: 13px; border-radius: 16px;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border)/0.5);
}
.card-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.1em; color: hsl(var(--muted-foreground));
  margin-bottom: 9px;
}
.optional { font-weight: 600; text-transform: none; letter-spacing: 0; font-size: 9px; }

/* Payment method grid */
.pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.pm-tile {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 10px; border-radius: 11px;
  font-size: 12px; font-weight: 700;
  background: hsl(var(--muted)/0.4); color: hsl(var(--muted-foreground));
  border: 1.5px solid transparent; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34,1.3,0.64,1);
}
.pm-tile:hover { color: hsl(var(--foreground)); transform: scale(1.02); }
.pm-tile.active {
  background: color-mix(in srgb, var(--accent, #6366f1) 12%, hsl(var(--card)));
  color: var(--accent, #6366f1);
  border-color: color-mix(in srgb, var(--accent, #6366f1) 35%, transparent);
  transform: scale(1.03);
}

/* Square card form — always in DOM, collapsed when not on Card */
/* Square SDK needs real pixel dimensions at attach time.
   We use height: 0 → auto trick so it stays in the DOM but invisible. */
.card-form-card {
  flex-shrink: 0; border-radius: 16px;
  background: hsl(var(--card)); border: 1.5px solid hsl(var(--border)/0.5);
  overflow: hidden;
  max-height: 0; padding-top: 0; padding-bottom: 0;
  opacity: 0; pointer-events: none;
  transition: max-height 0.35s ease, opacity 0.3s ease, padding 0.3s ease;
}
.card-form-card.visible {
  max-height: 200px;
  padding: 13px; opacity: 1; pointer-events: auto;
}

.sq-badge {
  display: inline-flex; align-items: center; gap: 4px;
  margin-left: auto; font-size: 9px; font-weight: 600;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted)/0.4);
  padding: 2px 7px; border-radius: 99px;
  text-transform: none; letter-spacing: 0;
}
.card-host-wrap { position: relative; min-height: 56px; border-radius: 12px; overflow: hidden; }
.card-host { width: 100%; min-height: 56px; }
.card-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  background: hsl(var(--card)); border-radius: 12px;
}
.spin-ring {
  width: 18px; height: 18px;
  border: 2px solid hsl(var(--border)); border-top-color: #6366f1;
  border-radius: 50%; animation: spin 0.65s linear infinite;
}

/* Afterpay section */
.afterpay-card {}
.afterpay-dot { width: 7px; height: 7px; border-radius: 50%; background: #06b6d4; }
.afterpay-host {
  width: 100%; min-height: 48px;
  display: flex; justify-content: center; margin-bottom: 6px;
}
.afterpay-note { font-size: 10px; color: hsl(var(--muted-foreground)); text-align: center; font-weight: 500; }

/* Cash/Other card */
.cash-card { display: flex; align-items: flex-start; gap: 10px; }
.cash-icon { color: #10b981; flex-shrink: 0; margin-top: 2px; }

/* Processing status */
.status-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 13px; border-radius: 11px; flex-shrink: 0;
  background: #06b6d410; border: 1.5px solid #06b6d430;
  font-size: 12px; font-weight: 700; color: #06b6d4;
}
.status-spinner {
  width: 13px; height: 13px;
  border: 2px solid #06b6d430; border-top-color: #06b6d4;
  border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0;
}

.checkout-spacer { flex: 1; min-height: 6px; }

/* Charge amount */
.charge-block { text-align: center; padding: 8px 0 4px; flex-shrink: 0; }
.charge-label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: hsl(var(--muted-foreground)); }
.charge-amt {
  display: block; font-size: 34px; font-weight: 900; letter-spacing: -1.5px;
  color: hsl(var(--foreground)); line-height: 1.1; transition: color 0.25s;
}
.charge-amt.lit { color: #ec4899; }

/* Checkout button */
.checkout-btn {
  width: 100%; height: 50px; border-radius: 15px; flex-shrink: 0;
  font-size: 13px; font-weight: 900; color: white;
  background: linear-gradient(135deg, #ec4899, #db2777);
  box-shadow: 0 4px 18px #ec489930;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, opacity 0.2s;
}
.checkout-btn:not(:disabled):not(.processing):hover {
  transform: scale(1.03) translateY(-2px); box-shadow: 0 8px 26px #ec489950;
}
.checkout-btn:not(:disabled):not(.processing):active { transform: scale(0.96); }
.checkout-btn:disabled { opacity: 0.3; cursor: not-allowed; background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); box-shadow: none; }
.checkout-btn.processing { pointer-events: none; opacity: 0.8; }
.btn-inner { display: flex; align-items: center; gap: 7px; }
.btn-spin {
  width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  animation: spin 0.65s linear infinite;
}

/* Square warning */
.sq-warning {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 10px; flex-shrink: 0;
  font-size: 11px; font-weight: 600; color: #f59e0b;
  background: #f59e0b10; border: 1px solid #f59e0b25;
}
.sq-warning-link { font-weight: 800; text-decoration: underline; cursor: pointer; }

/* ── Sale Success Modal ─────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal-card {
  background: hsl(var(--card)); border-radius: 28px;
  padding: 36px 30px; width: 308px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
  border: 1.5px solid hsl(var(--border)/0.6);
}
.modal-success-ring {
  width: 68px; height: 68px; border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 8px 28px #10b98145;
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.modal-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
.modal-receipt { font-size: 12px; color: hsl(var(--muted-foreground)); font-weight: 600; margin-top: -2px; }
.modal-details {
  width: 100%; background: hsl(var(--muted)/0.25);
  border-radius: 14px; padding: 13px 16px;
  display: flex; flex-direction: column; gap: 7px; margin-top: 4px;
}
.modal-detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.modal-detail-row span { color: hsl(var(--muted-foreground)); font-weight: 500; }
.modal-detail-row strong { font-weight: 800; }
.modal-done-btn {
  width: 100%; height: 48px; border-radius: 14px; margin-top: 4px;
  font-size: 14px; font-weight: 900; color: white;
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 16px #10b98130;
  transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
.modal-done-btn:hover { transform: scale(1.03) translateY(-1px); box-shadow: 0 6px 22px #10b98150; }
.modal-done-btn:active { transform: scale(0.97); }

/* ── Transitions ────────────────────────────────────────────────────── */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-8px); opacity: 0; }

.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.22s cubic-bezier(0.34,1.4,0.64,1); }
.fade-scale-enter-from, .fade-scale-leave-to { transform: scale(0.85); opacity: 0; }

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.22s ease; }
.fade-up-enter-from, .fade-up-leave-to { transform: translateY(-4px); opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.cart-row-enter-active { transition: all 0.28s cubic-bezier(0.34,1.4,0.64,1); }
.cart-row-leave-active { transition: all 0.16s ease-in; position: absolute; width: 100%; }
.cart-row-enter-from   { transform: translateX(-10px); opacity: 0; }
.cart-row-leave-to     { transform: translateX(10px); opacity: 0; }
.cart-row-move         { transition: transform 0.28s cubic-bezier(0.34,1.2,0.64,1); }

.btn-swap-enter-active, .btn-swap-leave-active { transition: all 0.15s ease; }
.btn-swap-enter-from, .btn-swap-leave-to { opacity: 0; transform: translateY(3px); }

.modal-enter-active { transition: all 0.32s cubic-bezier(0.34,1.35,0.64,1); }
.modal-leave-active { transition: all 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.88) translateY(16px); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
