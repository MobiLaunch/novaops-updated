<template>
  <div class="pos-root">

    <!-- ═══════════════════════════════════════════════════════════
         MOBILE TAB BAR  (hidden on lg+)
    ════════════════════════════════════════════════════════════════ -->
    <div class="pos-tabs lg:hidden">
      <button
        v-for="tab in mobileTabs" :key="tab.id"
        class="pos-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
        <span v-if="tab.id === 'cart' && cart.length" class="tab-badge">{{ cart.length }}</span>
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         BODY — 2-col on desktop, single tab on mobile
    ════════════════════════════════════════════════════════════════ -->
    <div class="pos-body">

      <!-- ── COL 1: Products ─────────────────────────────────── -->
      <div class="pos-col products-col" :class="{ 'mob-hidden': activeTab !== 'products' }">

        <!-- Search + categories -->
        <div class="products-header">
          <div class="search-wrap">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              placeholder="Search products…"
              class="search-input"
              @keydown.escape="searchQuery = ''"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="cat-row">
            <button
              v-for="cat in categories" :key="cat ?? 'all'"
              class="cat-pill"
              :class="{ active: selectedCategory === cat }"
              @click="selectedCategory = cat"
            >{{ cat ?? 'All' }}</button>
          </div>
        </div>

        <!-- Product grid -->
        <div class="product-grid">
          <button
            v-for="item in filteredProducts" :key="item.id"
            class="product-card"
            :class="{ 'low-stock': item.stock <= (item.low ?? 5) }"
            @click="addToCart(item)"
          >
            <div class="product-icon">
              <Package class="w-6 h-6" />
            </div>
            <div class="product-info">
              <p class="product-name">{{ item.name }}</p>
              <p class="product-sku">{{ item.sku || item.category }}</p>
            </div>
            <div class="product-bottom">
              <span class="product-price">{{ fmt(item.price) }}</span>
              <span class="product-stock" :class="{ low: item.stock <= (item.low ?? 5) }">
                {{ item.stock }} left
              </span>
            </div>
          </button>

          <div v-if="filteredProducts.length === 0" class="product-empty">
            <Package class="w-10 h-10 opacity-20" />
            <p>{{ searchQuery ? `No results for "${searchQuery}"` : 'No items in catalog' }}</p>
          </div>
        </div>
      </div>

      <!-- ── COL 2: Cart ─────────────────────────────────────── -->
      <div class="pos-col cart-col" :class="{ 'mob-hidden': activeTab !== 'cart' }">

        <div class="cart-header">
          <div class="flex items-center gap-2.5">
            <div class="cart-header-icon"><ShoppingCart class="w-4 h-4 text-white" /></div>
            <span class="font-black text-sm">Current Sale</span>
            <span v-if="cart.length" class="cart-count">{{ cart.length }}</span>
          </div>
          <button class="cart-clear" :disabled="!cart.length" @click="clearCart" title="Clear cart">
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Cart items -->
        <div class="cart-items">
          <div v-if="!cart.length" class="cart-empty">
            <ShoppingCart class="w-8 h-8 opacity-15" />
            <p class="text-sm font-bold text-muted-foreground">Cart is empty</p>
            <p class="text-xs text-muted-foreground">Tap a product to add it</p>
          </div>
          <TransitionGroup v-else name="cart-item" tag="div" class="divide-y divide-border/30">
            <div v-for="(item, idx) in cart" :key="item.id" class="cart-row">
              <div class="cart-row-icon">
                <Package class="w-3.5 h-3.5" />
              </div>
              <div class="cart-row-info">
                <p class="cart-row-name">{{ item.name }}</p>
                <p class="cart-row-sub">{{ fmt(item.price) }} ea.</p>
              </div>
              <div class="cart-qty">
                <button class="qty-btn" @click="decrement(idx)"><Minus class="w-3 h-3" /></button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button class="qty-btn" @click="increment(idx)"><Plus class="w-3 h-3" /></button>
              </div>
              <span class="cart-row-total">{{ fmt(item.price * item.quantity) }}</span>
            </div>
          </TransitionGroup>
        </div>

        <!-- Totals -->
        <div class="cart-footer">
          <div class="totals">
            <div class="total-row"><span>Subtotal</span><span>{{ fmt(subtotal) }}</span></div>
            <div v-if="taxRate" class="total-row"><span>Tax ({{ taxRate }}%)</span><span>{{ fmt(taxAmount) }}</span></div>
            <div class="total-row grand"><span>Total</span><span class="grand-amt">{{ fmt(total) }}</span></div>
          </div>
          <!-- Mobile: go to checkout -->
          <button v-if="cart.length" class="mob-checkout-btn lg:hidden" @click="activeTab = 'checkout'">
            <CreditCard class="w-4 h-4" />
            Checkout · {{ fmt(total) }}
          </button>
        </div>
      </div>

      <!-- ── COL 3: Checkout ─────────────────────────────────── -->
      <div class="pos-col checkout-col" :class="{ 'mob-hidden': activeTab !== 'checkout' }">

        <!-- Customer -->
        <div class="checkout-card">
          <p class="checkout-label"><Users class="w-3.5 h-3.5" /> Customer <span class="text-muted-foreground font-medium">(optional)</span></p>
          <select v-model="selectedCustomerId" class="checkout-select">
            <option :value="null">Walk-in customer</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!-- Payment method -->
        <div class="checkout-card">
          <p class="checkout-label"><CreditCard class="w-3.5 h-3.5" /> Payment Method</p>
          <div class="pm-grid">
            <button
              v-for="m in paymentMethods" :key="m.id"
              class="pm-btn"
              :class="{ active: paymentMethod === m.id }"
              :style="paymentMethod === m.id ? `--pm-color: ${m.color}` : ''"
              @click="paymentMethod = m.id"
            >
              <component :is="m.icon" class="w-4 h-4" />
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- Square card form — always in DOM so SDK can measure it -->
        <div class="checkout-card card-form-wrap" :class="{ visible: paymentMethod === 'card' }">
          <p class="checkout-label"><Lock class="w-3.5 h-3.5" /> Card Details</p>
          <div class="card-host-outer" :style="processing ? 'opacity:0.5;pointer-events:none' : ''">
            <div id="sq-card-container" class="card-host" />
            <Transition name="fade">
              <div v-if="cardLoading" class="card-loading">
                <div class="card-spinner" />
                <span class="text-xs text-muted-foreground font-medium">Initializing secure form…</span>
              </div>
            </Transition>
          </div>
          <p v-if="!squareConfigured" class="sq-warn">
            <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
            Square Application ID or Location ID missing in environment variables.
          </p>
        </div>

        <!-- Cash / Other hint -->
        <div v-if="paymentMethod === 'cash' || paymentMethod === 'other'" class="checkout-card cash-hint">
          <component :is="paymentMethod === 'cash' ? Banknote : Wallet" class="w-5 h-5 cash-icon" />
          <div>
            <p class="text-sm font-black">{{ paymentMethod === 'cash' ? 'Cash' : 'Other' }} Payment</p>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ paymentMethod === 'cash'
                ? 'Collect cash and tap Complete Sale to record the transaction.'
                : 'Record any payment — check, store credit, or other method.' }}
            </p>
          </div>
        </div>

        <div class="checkout-spacer" />

        <!-- Processing status -->
        <Transition name="fade-up">
          <div v-if="processingStatus" class="processing-bar">
            <div class="processing-spinner" />
            {{ processingStatus }}
          </div>
        </Transition>

        <!-- Charge + CTA -->
        <div class="charge-row">
          <div>
            <p class="text-xs text-muted-foreground font-semibold">Charge</p>
            <p class="charge-amt" :class="{ lit: cart.length }">{{ fmt(total) }}</p>
          </div>
          <button
            class="cta-btn"
            :class="{ processing }"
            :disabled="!cart.length || processing"
            @click="handleCheckout"
          >
            <Transition name="btn-swap" mode="out-in">
              <span v-if="processing" key="proc" class="btn-inner">
                <div class="btn-spin" /> {{ processingStatus || 'Processing…' }}
              </span>
              <span v-else-if="!cart.length" key="empty" class="btn-inner">
                <ShoppingCart class="w-4 h-4" /> Add items
              </span>
              <span v-else key="go" class="btn-inner">
                <CheckCircle class="w-4 h-4" /> Complete Sale
              </span>
            </Transition>
          </button>
        </div>

      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         RECEIPT MODAL
    ════════════════════════════════════════════════════════════════ -->
    <Transition name="modal">
      <div v-if="receipt" class="modal-backdrop" @click.self="receipt = null">
        <div class="modal-card">
          <div class="receipt-header">
            <div class="receipt-check"><CheckCircle class="w-8 h-8 text-white" /></div>
            <h2 class="text-xl font-black mt-3">Sale Complete</h2>
            <p class="text-sm text-muted-foreground font-medium mt-1">
              {{ receipt.businessName || 'NovaOps POS' }}
            </p>
          </div>

          <div class="receipt-body">
            <div class="receipt-meta">
              <div class="receipt-meta-row">
                <span>Receipt #</span><strong>{{ receipt.ticketId }}</strong>
              </div>
              <div class="receipt-meta-row">
                <span>Date</span><strong>{{ receipt.date }}</strong>
              </div>
              <div v-if="receipt.customer" class="receipt-meta-row">
                <span>Customer</span><strong>{{ receipt.customer }}</strong>
              </div>
              <div class="receipt-meta-row">
                <span>Payment</span><strong>{{ receipt.method }}</strong>
              </div>
            </div>

            <div class="receipt-items">
              <div v-for="item in receipt.items" :key="item.name" class="receipt-item-row">
                <span class="flex-1 truncate">{{ item.quantity }}× {{ item.name }}</span>
                <span class="font-semibold">{{ fmt(item.price * item.quantity) }}</span>
              </div>
            </div>

            <div class="receipt-totals">
              <div class="receipt-total-row"><span>Subtotal</span><span>{{ fmt(receipt.subtotal) }}</span></div>
              <div v-if="receipt.tax" class="receipt-total-row"><span>Tax</span><span>{{ fmt(receipt.tax) }}</span></div>
              <div class="receipt-total-row grand">
                <span>Total</span><span>{{ fmt(receipt.total) }}</span>
              </div>
            </div>
          </div>

          <button class="receipt-done" @click="receipt = null">Done</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import {
  Search, Package, ShoppingCart, Trash2, Plus, Minus, X,
  CheckCircle, CreditCard, Users, Lock, AlertCircle,
  Banknote, Wallet,
} from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

// ── Store & config ────────────────────────────────────────────────
const appStore  = useAppStore()
const config    = useRuntimeConfig()

const inventory = computed(() => appStore.inventory ?? [])
const customers = computed(() => appStore.customers ?? [])
const settings  = computed(() => appStore.settings)

// ── Square config ─────────────────────────────────────────────────
const squareAppId   = computed(() => config.public.squareApplicationId as string || '')
const squareLocId   = computed(() => config.public.squareLocationId as string || '')
const squareConfigured = computed(() => !!squareAppId.value && !!squareLocId.value)
const isSandbox     = computed(() => squareAppId.value.startsWith('sandbox-'))

// Load Square Web Payments SDK
useHead({
  script: [{
    src: isSandbox.value
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js',
    async: true,
  }],
})

// ── Currency / tax ────────────────────────────────────────────────
const currency  = computed(() => settings.value?.currency || '$')
const taxRate   = computed(() => Number(settings.value?.taxRate) || 0)
const fmt       = (n: number) => `${currency.value}${(n || 0).toFixed(2)}`

// ── Mobile tabs ───────────────────────────────────────────────────
const activeTab = ref<'products' | 'cart' | 'checkout'>('products')
const mobileTabs = [
  { id: 'products',  label: 'Products',  icon: Package },
  { id: 'cart',      label: 'Cart',      icon: ShoppingCart },
  { id: 'checkout',  label: 'Checkout',  icon: CreditCard },
] as const

// ── Product filtering ─────────────────────────────────────────────
const searchQuery      = ref('')
const selectedCategory = ref<string | null>(null)

const categories = computed(() => {
  const cats = [...new Set((inventory.value as any[]).map(i => i.category).filter(Boolean))]
  return [null, ...cats.sort()]
})

const filteredProducts = computed(() =>
  (inventory.value as any[]).filter(item => {
    if (item.stock <= 0) return false
    if (selectedCategory.value && item.category !== selectedCategory.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)
    }
    return true
  })
)

// ── Cart ──────────────────────────────────────────────────────────
const cart               = ref<any[]>([])
const selectedCustomerId = ref<number | null>(null)

const subtotal  = computed(() => cart.value.reduce((s, i) => s + i.price * i.quantity, 0))
const taxAmount = computed(() => subtotal.value * (taxRate.value / 100))
const total     = computed(() => subtotal.value + taxAmount.value)

function addToCart(item: any) {
  const existing = cart.value.find(i => i.id === item.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ id: item.id, name: item.name, price: item.price, quantity: 1 })
  }
  // Auto-switch to cart tab on mobile
  if (window.innerWidth < 1024) activeTab.value = 'cart'
}

function increment(idx: number) { cart.value[idx].quantity++ }
function decrement(idx: number) {
  if (cart.value[idx].quantity > 1) cart.value[idx].quantity--
  else cart.value.splice(idx, 1)
}
function clearCart() { cart.value = []; selectedCustomerId.value = null }

// ── Payment methods ───────────────────────────────────────────────
const paymentMethod = ref('cash')
const paymentMethods = [
  { id: 'cash',  label: 'Cash',  icon: Banknote,    color: '#10b981' },
  { id: 'card',  label: 'Card',  icon: CreditCard,  color: '#6366f1' },
  { id: 'other', label: 'Other', icon: Wallet,      color: '#f59e0b' },
]

// ── Square SDK ────────────────────────────────────────────────────
const squarePayments = ref<any>(null)
const cardInstance   = ref<any>(null)
const cardAttached   = ref(false)
const cardLoading    = ref(false)
const processing     = ref(false)
const processingStatus = ref('')

async function loadSquareSDK(): Promise<boolean> {
  if (squarePayments.value) return true
  for (let i = 0; i < 10; i++) {
    if ((window as any).Square) break
    await new Promise(r => setTimeout(r, 400))
  }
  if (!(window as any).Square) return false
  try {
    squarePayments.value = await (window as any).Square.payments(
      squareAppId.value,
      squareLocId.value
    )
    return true
  } catch (e) {
    console.error('[POS] Square init:', e)
    return false
  }
}

async function initCardForm() {
  if (!squareConfigured.value) return
  cardLoading.value = true
  try {
    const ok = await loadSquareSDK()
    if (!ok) return

    if (cardInstance.value) {
      try { await cardInstance.value.destroy() } catch {}
      cardInstance.value = null
      cardAttached.value = false
    }

    // Wait for CSS transition so container has real dimensions
    await new Promise(r => setTimeout(r, 380))
    await nextTick()

    cardInstance.value = await squarePayments.value.card({
      style: {
        '.input-container':          { borderRadius: '14px', borderColor: 'hsl(var(--border))' },
        '.input-container.is-focus': { borderColor: '#6366f1', boxShadow: '0 0 0 3px #6366f118' },
        '.input-container.is-error': { borderColor: '#ef4444' },
        'input': { fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: '500' },
        '.message-text': { color: '#ef4444', fontSize: '12px' },
      },
    })
    await cardInstance.value.attach('#sq-card-container')
    cardAttached.value = true
  } catch (e: any) {
    console.error('[POS] Card form init:', e)
  } finally {
    cardLoading.value = false
  }
}

// Init / destroy card form when payment method changes
watch(paymentMethod, async (method, prev) => {
  if (prev === 'card' && cardInstance.value) {
    try { await cardInstance.value.destroy() } catch {}
    cardInstance.value = null
    cardAttached.value = false
  }
  if (method === 'card') {
    await nextTick()
    await initCardForm()
  }
})

// ── Checkout flow ─────────────────────────────────────────────────
const receipt = ref<any>(null)

async function handleCheckout() {
  if (!cart.value.length || processing.value) return
  if (paymentMethod.value === 'card') {
    await handleCardPayment()
  } else {
    await handleOfflinePayment()
  }
}

async function handleCardPayment() {
  if (!cardInstance.value || !cardAttached.value) {
    alert('Card form not ready. Please wait a moment.')
    return
  }
  processing.value = true
  processingStatus.value = 'Tokenizing card…'
  try {
    const result = await cardInstance.value.tokenize()
    if (result.status !== 'OK') {
      throw new Error(result.errors?.[0]?.message || 'Card tokenization failed')
    }
    processingStatus.value = 'Charging card…'

    // POST to server-side API route (avoids CORS)
    const res = await $fetch('/api/square/payment', {
      method: 'POST',
      body: {
        sourceId:    result.token,
        amountCents: Math.round(total.value * 100),
        referenceId: `novaops-pos-${Date.now()}`,
        note:        cart.value.map(i => `${i.quantity}× ${i.name}`).join(', '),
      },
    }) as any

    if (!res.success || res.status !== 'COMPLETED') {
      throw new Error('Card charge failed — status: ' + res.status)
    }

    await finalizeSale('Card')
  } catch (e: any) {
    processingStatus.value = ''
    processing.value = false
    const msg = (e as any).data?.message || (e as any).message || 'Card payment failed'
    alert(`Payment error: ${msg}`)
  }
}

async function handleOfflinePayment() {
  processing.value = true
  processingStatus.value = 'Saving sale…'
  try {
    await finalizeSale(paymentMethod.value === 'cash' ? 'Cash' : 'Other')
  } catch (e: any) {
    processingStatus.value = ''
    processing.value = false
    alert(`Sale error: ${e.message}`)
  }
}

async function finalizeSale(method: string) {
  const customerName = selectedCustomerId.value
    ? (customers.value as any[]).find(c => c.id === selectedCustomerId.value)?.name
    : undefined

  // Create ticket record in Supabase
  const ticket = await appStore.createTicket({
    customerId:    selectedCustomerId.value,
    device:        'POS Sale',
    issue:         cart.value.map(i => `${i.quantity}× ${i.name}`).join(', '),
    status:        'Completed',
    price:         total.value,
    paymentMethod: method,
  } as any)

  // Decrement stock for each item
  for (const cartItem of cart.value) {
    const inv = (appStore.inventory as any[]).find(i => i.id === cartItem.id)
    if (inv) {
      await appStore.updateInventoryItem(inv.id, {
        stock: Math.max(0, inv.stock - cartItem.quantity),
      })
    }
  }

  // Build receipt data
  receipt.value = {
    ticketId:     ticket?.id ?? '—',
    date:         new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    customer:     customerName,
    method,
    items:        [...cart.value],
    subtotal:     subtotal.value,
    tax:          taxAmount.value,
    total:        total.value,
    businessName: settings.value?.businessName,
  }

  clearCart()
  processingStatus.value = ''
  processing.value = false

  // Switch mobile tab back to products for next sale
  if (window.innerWidth < 1024) activeTab.value = 'products'
}
</script>

<style scoped>
/* ── Root ───────────────────────────────────────────────────────── */
.pos-root {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: calc(100dvh - 4rem);
  min-height: 500px;
}
@media (min-width: 1024px) {
  .pos-root { height: calc(100dvh - 5rem); gap: 0; }
}

/* ── Mobile Tab Bar ─────────────────────────────────────────────── */
.pos-tabs {
  display: flex;
  gap: 4px;
  padding: 6px;
  border-radius: 20px;
  background: hsl(var(--muted) / 0.6);
  flex-shrink: 0;
  margin-bottom: 10px;
}
.pos-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 8px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  color: hsl(var(--muted-foreground));
  transition: all 0.2s ease;
  position: relative;
}
.pos-tab.active {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
.tab-badge {
  position: absolute;
  top: 5px; right: 6px;
  min-width: 16px; height: 16px;
  border-radius: 8px;
  background: #ec4899;
  color: white;
  font-size: 9px;
  font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
}

/* ── Body ───────────────────────────────────────────────────────── */
.pos-body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 12px;
  overflow: hidden;
}
.pos-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.mob-hidden { display: none !important; }
@media (min-width: 1024px) {
  .mob-hidden { display: flex !important; }
  .pos-body { gap: 14px; }
}

/* ── Products col ───────────────────────────────────────────────── */
.products-col {
  flex: 1;
  overflow: hidden;
  gap: 10px;
}

.products-header { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }

.search-wrap { position: relative; }
.search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  width: 15px; height: 15px; color: hsl(var(--muted-foreground)); pointer-events: none;
}
.search-input {
  width: 100%; height: 42px;
  padding-left: 38px; padding-right: 34px;
  border-radius: 14px;
  font-size: 13px; font-weight: 500;
  background: hsl(var(--muted) / 0.5);
  border: 1.5px solid hsl(var(--border) / 0.6);
  transition: border-color 0.15s, box-shadow 0.15s;
  color: hsl(var(--foreground));
}
.search-input:focus {
  outline: none;
  border-color: #ec489960;
  box-shadow: 0 0 0 3px #ec489914;
}
.search-clear {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  width: 22px; height: 22px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: hsl(var(--muted)); color: hsl(var(--muted-foreground));
  transition: all 0.15s;
}
.search-clear:hover { background: hsl(var(--muted-foreground) / 0.2); }

.cat-row {
  display: flex; gap: 6px; overflow-x: auto; flex-shrink: 0;
  scrollbar-width: none; padding-bottom: 2px;
}
.cat-row::-webkit-scrollbar { display: none; }
.cat-pill {
  padding: 5px 14px; border-radius: 99px; white-space: nowrap;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
  background: hsl(var(--muted) / 0.5); color: hsl(var(--muted-foreground));
  border: 1.5px solid transparent;
  transition: all 0.15s;
}
.cat-pill.active {
  background: #ec489918; color: #ec4899;
  border-color: #ec489940;
}

/* Product grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  padding-right: 2px;
  align-content: start;
}
@media (min-width: 640px) {
  .product-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}

.product-card {
  display: flex; flex-direction: column; gap: 8px;
  padding: 14px 12px;
  border-radius: 20px;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border) / 0.6);
  text-align: left;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, border-color 0.15s;
}
.product-card:hover {
  transform: scale(1.03) translateY(-2px);
  box-shadow: 0 8px 24px rgba(236,72,153,0.15);
  border-color: #ec489950;
}
.product-card:active { transform: scale(0.95); }
.product-card.low-stock { border-color: #f59e0b40; }

.product-icon {
  width: 40px; height: 40px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #ec489918, #db277718);
  color: #ec4899;
  flex-shrink: 0;
}
.product-info { flex: 1; min-width: 0; }
.product-name { font-size: 12px; font-weight: 800; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.product-sku  { font-size: 10px; color: hsl(var(--muted-foreground)); font-weight: 500; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
.product-price { font-size: 14px; font-weight: 900; color: #ec4899; }
.product-stock { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground)); }
.product-stock.low { background: #f59e0b18; color: #f59e0b; }

.product-empty {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 48px 0;
  color: hsl(var(--muted-foreground)); font-size: 13px; font-weight: 600;
}

/* ── Cart col ───────────────────────────────────────────────────── */
.cart-col {
  width: 100%;
  border-radius: 24px;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border) / 0.6);
  overflow: hidden;
}
@media (min-width: 1024px) {
  .cart-col { width: 290px; flex-shrink: 0; }
}

.cart-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  background: #ec489906;
  flex-shrink: 0;
}
.cart-header-icon {
  width: 30px; height: 30px; border-radius: 12px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px #ec489940;
}
.cart-count {
  font-size: 10px; font-weight: 900; min-width: 18px; height: 18px;
  border-radius: 9px; background: #ec4899; color: white;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}
.cart-clear {
  width: 30px; height: 30px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  background: #ef444414; color: #ef4444;
  transition: all 0.15s;
}
.cart-clear:hover:not(:disabled) { background: #ef444428; transform: scale(1.1); }
.cart-clear:disabled { opacity: 0.3; cursor: not-allowed; }

.cart-items { flex: 1; overflow-y: auto; min-height: 0; }
.cart-empty {
  height: 100%; min-height: 120px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 32px;
  color: hsl(var(--muted-foreground));
}

.cart-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  transition: background 0.15s;
}
.cart-row:hover { background: hsl(var(--muted)/0.3); }
.cart-row-icon {
  width: 28px; height: 28px; border-radius: 10px; flex-shrink: 0;
  background: #ec489914; color: #ec4899;
  display: flex; align-items: center; justify-content: center;
}
.cart-row-info { flex: 1; min-width: 0; }
.cart-row-name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cart-row-sub  { font-size: 10px; color: hsl(var(--muted-foreground)); }
.cart-qty {
  display: flex; align-items: center; gap: 2px;
  background: hsl(var(--muted)/0.6); border-radius: 10px; padding: 2px;
  flex-shrink: 0;
}
.qty-btn {
  width: 22px; height: 22px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.qty-btn:hover { background: hsl(var(--card)); transform: scale(1.1); }
.qty-num { width: 22px; text-align: center; font-size: 12px; font-weight: 800; }
.cart-row-total {
  font-size: 12px; font-weight: 800; color: #ec4899;
  flex-shrink: 0; min-width: 52px; text-align: right;
}

.cart-footer { padding: 14px; border-top: 1px solid hsl(var(--border)/0.5); flex-shrink: 0; }
.totals { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.total-row {
  display: flex; justify-content: space-between;
  font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground));
}
.total-row.grand {
  font-size: 14px; font-weight: 900;
  color: hsl(var(--foreground));
  padding-top: 8px; margin-top: 4px;
  border-top: 1px solid hsl(var(--border)/0.5);
}
.grand-amt { color: #ec4899; }
.mob-checkout-btn {
  width: 100%; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white; font-size: 13px; font-weight: 900;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 16px #ec489940;
  transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
.mob-checkout-btn:hover { transform: scale(1.02) translateY(-1px); }
.mob-checkout-btn:active { transform: scale(0.97); }

/* Cart item transition */
.cart-item-enter-active { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.cart-item-leave-active { transition: all 0.15s ease-in; }
.cart-item-enter-from { opacity: 0; transform: translateX(-12px) scale(0.96); }
.cart-item-leave-to   { opacity: 0; transform: translateX(12px) scale(0.96); }

/* ── Checkout col ───────────────────────────────────────────────── */
.checkout-col {
  width: 100%;
  gap: 10px;
  overflow-y: auto;
}
@media (min-width: 1024px) {
  .checkout-col { width: 260px; flex-shrink: 0; overflow-y: auto; }
}

.checkout-card {
  border-radius: 20px;
  background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border)/0.6);
  padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
  flex-shrink: 0;
}
.checkout-label {
  font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: hsl(var(--muted-foreground));
  display: flex; align-items: center; gap: 5px;
}
.checkout-select {
  width: 100%; height: 38px; padding: 0 12px;
  border-radius: 12px; font-size: 13px; font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 1.5px solid hsl(var(--border)/0.6);
  color: hsl(var(--foreground));
  transition: border-color 0.15s;
}
.checkout-select:focus { outline: none; border-color: #ec489960; }

.pm-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.pm-btn {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 8px 4px;
  border-radius: 14px; font-size: 11px; font-weight: 700;
  background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground));
  border: 1.5px solid transparent;
  transition: all 0.18s;
}
.pm-btn.active {
  background: color-mix(in srgb, var(--pm-color, #ec4899) 14%, transparent);
  color: var(--pm-color, #ec4899);
  border-color: color-mix(in srgb, var(--pm-color, #ec4899) 35%, transparent);
}
.pm-btn:hover:not(.active) { background: hsl(var(--muted)/0.8); }

/* Square card form */
.card-form-wrap { overflow: hidden; max-height: 0; padding: 0; border-color: transparent; transition: max-height 0.35s ease, padding 0.25s, border-color 0.25s; }
.card-form-wrap.visible { max-height: 200px; padding: 14px; border-color: hsl(var(--border)/0.6); }
.card-host-outer { position: relative; min-height: 80px; }
.card-host { width: 100%; min-height: 80px; }
.card-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  background: hsl(var(--card)/0.9); border-radius: 14px;
}
.card-spinner {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2.5px solid hsl(var(--border));
  border-top-color: #6366f1;
  animation: spin 0.7s linear infinite;
}
.sq-warn {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 11px; font-weight: 600; color: #f59e0b;
  background: #f59e0b12; border-radius: 10px; padding: 8px 10px;
}

.cash-hint {
  flex-direction: row !important;
  align-items: flex-start;
  gap: 12px !important;
}
.cash-icon { color: #10b981; flex-shrink: 0; margin-top: 2px; }

.checkout-spacer { flex: 1; }

/* Processing bar */
.processing-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 14px;
  background: #6366f114; border: 1.5px solid #6366f130;
  font-size: 12px; font-weight: 700; color: #6366f1;
  flex-shrink: 0;
}
.processing-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid #6366f130; border-top-color: #6366f1;
  animation: spin 0.7s linear infinite; flex-shrink: 0;
}

/* Charge + CTA */
.charge-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-shrink: 0;
}
.charge-amt {
  font-size: 22px; font-weight: 900;
  color: hsl(var(--muted-foreground));
  transition: color 0.3s;
}
.charge-amt.lit { color: #ec4899; }

.cta-btn {
  height: 48px; border-radius: 16px; padding: 0 20px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white; font-size: 13px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px #ec489940;
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
  flex-shrink: 0;
}
.cta-btn:hover:not(:disabled) { transform: scale(1.04) translateY(-1px); box-shadow: 0 6px 20px #ec489960; }
.cta-btn:active:not(:disabled) { transform: scale(0.96); }
.cta-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.btn-inner { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.btn-spin {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  animation: spin 0.7s linear infinite;
}

/* ── Receipt Modal ──────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.modal-card {
  width: 100%; max-width: 380px;
  background: hsl(var(--card));
  border-radius: 32px;
  border: 1.5px solid hsl(var(--border)/0.6);
  box-shadow: 0 24px 64px rgba(0,0,0,0.25);
  overflow: hidden;
}
.receipt-header {
  padding: 28px 24px 20px;
  text-align: center;
  background: linear-gradient(160deg, #ec489908, transparent);
  border-bottom: 1px solid hsl(var(--border)/0.4);
}
.receipt-check {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
  box-shadow: 0 6px 20px #10b98140;
}
.receipt-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
.receipt-meta { display: flex; flex-direction: column; gap: 4px; }
.receipt-meta-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; padding: 3px 0;
  color: hsl(var(--muted-foreground));
}
.receipt-meta-row strong { color: hsl(var(--foreground)); font-weight: 700; }
.receipt-items {
  background: hsl(var(--muted)/0.4);
  border-radius: 14px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.receipt-item-row {
  display: flex; justify-content: space-between;
  font-size: 12px; font-weight: 600; gap: 8px;
}
.receipt-totals { display: flex; flex-direction: column; gap: 4px; }
.receipt-total-row {
  display: flex; justify-content: space-between;
  font-size: 12px; color: hsl(var(--muted-foreground)); font-weight: 600;
}
.receipt-total-row.grand {
  font-size: 15px; font-weight: 900;
  color: hsl(var(--foreground));
  padding-top: 8px; margin-top: 4px;
  border-top: 1px solid hsl(var(--border)/0.5);
}
.receipt-done {
  width: 100%; height: 52px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white; font-size: 14px; font-weight: 900;
  transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
.receipt-done:hover { transform: scale(1.02); }
.receipt-done:active { transform: scale(0.97); }

/* ── Transitions ────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-up-enter-active { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.fade-up-leave-active { transition: all 0.15s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(6px); }

.btn-swap-enter-active, .btn-swap-leave-active { transition: all 0.15s ease; }
.btn-swap-enter-from { opacity: 0; transform: scale(0.85); }
.btn-swap-leave-to   { opacity: 0; transform: scale(0.85); }

.modal-enter-active { transition: all 0.3s cubic-bezier(0.34,1.3,0.64,1); }
.modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from { opacity: 0; }
.modal-leave-to   { opacity: 0; }
.modal-enter-from .modal-card { transform: scale(0.9) translateY(20px); }
.modal-leave-to   .modal-card { transform: scale(0.95) translateY(10px); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>

