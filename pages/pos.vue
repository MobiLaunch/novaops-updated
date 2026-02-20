<template>
  <div class="flex flex-col h-[calc(100vh-8rem)] gap-4">
    <div class="flex flex-1 gap-4 overflow-hidden">

      <!-- ── Product Grid ──────────────────────────────────────── -->
      <div class="flex-1 flex flex-col gap-4 overflow-hidden">
        <!-- Search + filter -->
        <div class="flex gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input v-model="searchQuery" placeholder="Search products…" class="w-full h-10 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-pink-500/30 text-foreground" />
          </div>
          <div class="flex gap-2">
            <button
              v-for="cat in [null, 'Accessories', 'Parts', 'Devices', 'Services']"
              :key="cat ?? 'all'"
              class="px-3 py-2 rounded-2xl text-xs font-medium transition-all whitespace-nowrap"
              :style="selectedCategory === cat ? 'background: #ec489922; color: #ec4899; outline: 1.5px solid #ec489950' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
              @click="selectedCategory = cat"
            >{{ cat ?? 'All' }}</button>
          </div>
        </div>

        <!-- Product cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pr-1">
          <div
            v-for="item in filteredProducts"
            :key="item.id"
            class="rounded-3xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] bg-card flex flex-col items-center text-center gap-2 p-4"
            style="outline: 1px solid hsl(var(--border))"
            @click="addToCart(item)"
          >
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background: #ec489918">
              <Package class="h-6 w-6" style="color: #ec4899" />
            </div>
            <div>
              <h3 class="font-semibold text-sm line-clamp-1">{{ item.name }}</h3>
              <p class="text-xs text-muted-foreground line-clamp-1">{{ item.sku }}</p>
            </div>
            <p class="text-lg font-bold" style="color: #ec4899">{{ formatCurrency(item.price) }}</p>
            <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full" style="background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))">
              Stock: {{ item.stock }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Cart Sidebar ──────────────────────────────────────── -->
      <div class="w-[400px] flex flex-col rounded-3xl overflow-hidden bg-card" style="outline: 1px solid hsl(var(--border))">
        <!-- Cart header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-border" style="background: hsl(var(--muted)/0.3)">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: #ec489918">
              <ShoppingCart class="w-4 h-4" style="color: #ec4899" />
            </div>
            <span class="font-semibold text-sm">Current Sale</span>
          </div>
          <button
            class="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
            style="background: #ef444412"
            :disabled="!cart.length"
            @click="clearCart"
          >
            <Trash2 class="h-3.5 w-3.5" style="color: #ef4444" />
          </button>
        </div>

        <!-- Cart items -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
            <div class="w-14 h-14 rounded-3xl flex items-center justify-center" style="background: #ec489912">
              <ShoppingCart class="h-7 w-7" style="color: #ec4899; opacity: 0.4" />
            </div>
            <p class="text-sm">Cart is empty</p>
          </div>
          <div v-else class="divide-y divide-border/50">
            <div v-for="(item, index) in cart" :key="index" class="px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-sm truncate">{{ item.name }}</h4>
                <p class="text-xs text-muted-foreground">{{ formatCurrency(item.price) }}</p>
              </div>
              <!-- M3 quantity stepper -->
              <div class="flex items-center gap-1 rounded-2xl p-1" style="background: hsl(var(--muted)/0.6)">
                <button class="w-6 h-6 rounded-xl flex items-center justify-center hover:bg-background transition-colors" @click="decrementItem(index)">
                  <Minus class="h-3 w-3" />
                </button>
                <span class="w-7 text-center text-sm font-semibold">{{ item.quantity }}</span>
                <button class="w-6 h-6 rounded-xl flex items-center justify-center hover:bg-background transition-colors" @click="incrementItem(index)">
                  <Plus class="h-3 w-3" />
                </button>
              </div>
              <div class="text-right font-bold text-sm min-w-[60px]" style="color: #ec4899">
                {{ formatCurrency(item.price * item.quantity) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Cart footer -->
        <div class="p-4 border-t border-border space-y-4" style="background: hsl(var(--muted)/0.2)">
          <!-- Totals -->
          <div class="rounded-2xl px-4 py-3 space-y-2 text-sm bg-card" style="outline: 1px solid hsl(var(--border))">
            <div class="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span></div>
            <div v-if="discountPercent > 0" class="flex justify-between" style="color: #10b981"><span>Discount ({{ discountPercent }}%)</span><span>-{{ formatCurrency(discountAmount) }}</span></div>
            <div class="flex justify-between text-muted-foreground"><span>Tax ({{ taxRate }}%)</span><span>{{ formatCurrency(taxAmount) }}</span></div>
            <div class="flex justify-between font-bold text-base border-t border-border pt-2"><span>Total</span><span style="color: #ec4899">{{ formatCurrency(total) }}</span></div>
          </div>

          <!-- Utility buttons (M3 tonal) -->
          <div class="grid grid-cols-4 gap-2">
            <button v-for="util in utilityButtons" :key="util.label" class="rounded-2xl py-2 flex flex-col items-center gap-0.5 transition-all hover:scale-105" :style="`background: ${util.color}18`" @click="util.onClick()" :title="util.label">
              <component :is="util.icon" class="h-4 w-4" :style="`color: ${util.color}`" />
            </button>
          </div>

          <!-- Payment buttons -->
          <div class="grid grid-cols-2 gap-3">
            <button
              class="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-40"
              style="background: #10b98118; color: #10b981; outline: 1.5px solid #10b98130"
              :disabled="!cart.length"
              @click="processPayment('cash')"
            >
              <DollarSign class="h-4 w-4" /> Cash
            </button>
            <button
              class="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-40"
              :style="squareEnabled ? 'background: #006AFF' : 'background: linear-gradient(135deg, #ec4899 0%, #db2777 100%)'"
              :disabled="!cart.length || isProcessing"
              @click="processPayment('card')"
            >
              <div v-if="isProcessing" class="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />
              <MonitorSmartphone v-else-if="squareEnabled && squareDeviceId" class="h-4 w-4" />
              <CreditCard v-else class="h-4 w-4" />
              {{ payButtonLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Discount Dialog ───────────────────────────────────────── -->
    <Dialog v-model:open="discountDialogOpen">
      <DialogContent class="sm:max-w-[425px] rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #10b98108">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #10b98120">
            <Percent class="w-4 h-4" style="color: #10b981" />
          </div>
          <h2 class="font-semibold text-base">Apply Discount</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discount Percentage</label>
            <div class="flex gap-2">
              <input type="number" v-model.number="discountPercent" min="0" max="100" class="flex-1 h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground" />
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center bg-muted/50"><Percent class="h-4 w-4 text-muted-foreground" /></div>
            </div>
          </div>
          <div class="flex gap-2">
            <button v-for="p in [5,10,20]" :key="p" class="flex-1 py-2 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02]" style="background: #10b98112; color: #10b981" @click="discountPercent = p">{{ p }}%</button>
          </div>
          <button class="w-full py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02]" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%)" @click="applyDiscount">Apply Discount</button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Warranty Dialog ───────────────────────────────────────── -->
    <Dialog v-model:open="warrantyDialogOpen">
      <DialogContent class="sm:max-w-[425px] rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #8b5cf608">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #8b5cf620">
            <Shield class="w-4 h-4" style="color: #8b5cf6" />
          </div>
          <h2 class="font-semibold text-base">Add Warranty</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 gap-3">
            <button v-for="w in warrantyOptions" :key="w.days" class="rounded-2xl py-4 flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md" style="background: #8b5cf612; outline: 1px solid #8b5cf625" @click="addWarranty(w.days, w.price)">
              <span class="font-bold text-base" style="color: #8b5cf6">{{ w.label }}</span>
              <span class="text-xs text-muted-foreground">{{ formatCurrency(w.price) }}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Refund Dialog ─────────────────────────────────────────── -->
    <Dialog v-model:open="refundDialogOpen">
      <DialogContent class="sm:max-w-[425px] rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #ef444408">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #ef444420">
            <RotateCcw class="w-4 h-4" style="color: #ef4444" />
          </div>
          <h2 class="font-semibold text-base">Process Refund</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Refund Amount</label>
            <div class="relative">
              <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input type="number" v-model.number="refundAmount" class="w-full h-11 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-red-500/30 text-foreground" />
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</label>
            <Textarea v-model="refundReason" placeholder="Reason for refund…" class="rounded-2xl border-0 bg-muted/50 resize-none" />
          </div>
          <button class="w-full py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02]" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" @click="processRefund">Process Refund</button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Terminal Status Modal ─────────────────────────────────── -->
    <Dialog v-model:open="terminalModalOpen">
      <DialogContent class="sm:max-w-[380px] rounded-3xl p-0 gap-0" :show-close="terminalStatus === 'FAILED' || terminalStatus === 'CANCELED'">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #3b82f608">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #3b82f620">
            <MonitorSmartphone class="w-4 h-4" style="color: #3b82f6" />
          </div>
          <h2 class="font-semibold text-base">{{ terminalModalTitle }}</h2>
        </div>
        <div class="py-8 px-6 flex flex-col items-center gap-4 text-center">
          <div v-if="terminalStatus === 'PENDING' || terminalStatus === 'IN_PROGRESS'" class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-3xl flex items-center justify-center" style="background: #3b82f612">
              <MonitorSmartphone class="w-8 h-8" style="color: #3b82f6" />
            </div>
            <p class="text-sm text-muted-foreground">Waiting for customer to tap, swipe, or insert card.</p>
            <p class="text-xs text-muted-foreground">Amount: <span class="font-bold text-foreground">{{ formatCurrency(total) }}</span></p>
            <div class="flex gap-1">
              <div class="w-2 h-2 rounded-full animate-bounce" style="background: #3b82f6; animation-delay: 0ms" />
              <div class="w-2 h-2 rounded-full animate-bounce" style="background: #3b82f6; animation-delay: 150ms" />
              <div class="w-2 h-2 rounded-full animate-bounce" style="background: #3b82f6; animation-delay: 300ms" />
            </div>
            <button class="px-4 py-2 rounded-2xl text-sm font-medium" style="outline: 1.5px solid hsl(var(--border))" @click="cancelTerminalPayment">Cancel</button>
          </div>
          <div v-else-if="terminalStatus === 'COMPLETED'" class="flex flex-col items-center gap-3">
            <div class="w-16 h-16 rounded-3xl flex items-center justify-center" style="background: #10b98112">
              <CheckCircle class="w-8 h-8" style="color: #10b981" />
            </div>
            <p class="text-sm font-semibold" style="color: #10b981">Payment complete!</p>
          </div>
          <div v-else-if="terminalStatus === 'FAILED' || terminalStatus === 'CANCELED'" class="flex flex-col items-center gap-3">
            <div class="w-16 h-16 rounded-3xl flex items-center justify-center" style="background: #ef444412">
              <AlertCircle class="w-8 h-8" style="color: #ef4444" />
            </div>
            <p class="text-sm font-semibold" style="color: #ef4444">{{ terminalStatus === 'CANCELED' ? 'Payment cancelled' : 'Terminal payment failed' }}</p>
            <p class="text-xs text-muted-foreground">Falling back to browser card payment…</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Card Form Modal ───────────────────────────────────────── -->
    <Dialog v-model:open="cardFormOpen">
      <DialogContent class="sm:max-w-[420px] rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #006AFF0a">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #006AFF20">
            <CreditCard class="w-4 h-4" style="color: #006AFF" />
          </div>
          <h2 class="font-semibold text-base">Card Payment</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex justify-between text-sm font-semibold">
            <span>Total Due</span><span class="text-lg" style="color: #006AFF">{{ formatCurrency(total) }}</span>
          </div>
          <div id="card-container" class="min-h-[90px]" />
          <p v-if="cardFormError" class="text-xs" style="color: #ef4444">{{ cardFormError }}</p>
          <button
            class="w-full py-3 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
            style="background: #006AFF"
            :disabled="isProcessing || !cardFormReady"
            @click="submitCardPayment"
          >
            <div v-if="isProcessing" class="flex items-center justify-center gap-2">
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" /> Processing…
            </div>
            <div v-else class="flex items-center justify-center gap-2">
              <CreditCard class="h-4 w-4" /> Pay {{ formatCurrency(total) }}
            </div>
          </button>
          <p class="text-center text-xs text-muted-foreground">Secured by Square</p>
        </div>
      </DialogContent>
    </Dialog>

    <!-- ── Custom Amount Dialog ──────────────────────────────────── -->
    <Dialog v-model:open="customAmountDialogOpen">
      <DialogContent class="sm:max-w-[400px] rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #f59e0b08">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #f59e0b20">
            <PenLine class="w-4 h-4" style="color: #f59e0b" />
          </div>
          <h2 class="font-semibold text-base">Add Custom Amount</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
            <input v-model="customAmountName" placeholder="e.g. Labor, Diagnostic fee…" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground" @keyup.enter="$refs.customAmountInput?.focus()" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</label>
            <div class="relative">
              <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input ref="customAmountInput" type="number" v-model.number="customAmountValue" class="w-full h-11 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30 text-foreground font-semibold" placeholder="0.00" min="0" step="0.01" @keyup.enter="addCustomAmount" />
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-for="preset in customAmountPresets" :key="preset" class="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all hover:scale-105" style="background: #f59e0b12; color: #f59e0b" @click="customAmountValue = preset">
              {{ formatCurrency(preset) }}
            </button>
          </div>
          <button
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] disabled:opacity-40"
            style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            :disabled="!customAmountValue || customAmountValue <= 0"
            @click="addCustomAmount"
          >
            <PenLine class="h-4 w-4" /> Add to Cart
          </button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import { useNotifications } from '~/composables/useNotifications' 
import type { InventoryItem } from '~/types/models'

import {
  Search, Package, Trash2, Plus, Minus, ShoppingCart, CreditCard, DollarSign,
  Percent, Shield, RotateCcw, PenLine, MonitorSmartphone, CheckCircle, AlertCircle
} from 'lucide-vue-next'

import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'

definePageMeta({ middleware: ['auth'] })

// M3 computed helpers
const utilityButtons = computed(() => [
  { label: 'Discount',      color: '#10b981', icon: Percent,   onClick: () => { discountDialogOpen.value = true } },
  { label: 'Warranty',      color: '#8b5cf6', icon: Shield,    onClick: () => { warrantyDialogOpen.value = true } },
  { label: 'Refund',        color: '#ef4444', icon: RotateCcw, onClick: () => { refundDialogOpen.value = true } },
  { label: 'Custom Amount', color: '#f59e0b', icon: PenLine,   onClick: () => { customAmountDialogOpen.value = true } },
])

const warrantyOptions = [
  { days: 30,  label: '30 Days',  price: 29.99 },
  { days: 90,  label: '90 Days',  price: 59.99 },
  { days: 180, label: '6 Months', price: 89.99 },
  { days: 365, label: '1 Year',   price: 149.99 },
]

const appStore = useAppStore()
const { inventory, settings } = storeToRefs(appStore)
const { updateInventoryItem, initializeData } = appStore
const { addNotification } = useNotifications()

// ── Square State ────────────────────────────────────────────────────────────
const squareEnabled = ref(false)
const squareDeviceId = ref('')
const isProcessing = ref(false)

// Terminal modal
const terminalModalOpen = ref(false)
const terminalStatus = ref<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELED' | ''>('')
const terminalCheckoutId = ref('')
let terminalPollTimer: ReturnType<typeof setInterval> | null = null

// Card form (Web Payments SDK fallback)
const cardFormOpen = ref(false)
const cardFormReady = ref(false)
const cardFormError = ref('')
let squareCard: any = null
let squarePayments: any = null

const payButtonLabel = computed(() => {
  if (isProcessing.value) return 'Processing...'
  if (squareEnabled.value && squareDeviceId.value) return 'Charge Terminal'
  if (squareEnabled.value) return 'Square Pay'
  return 'Card'
})

const terminalModalTitle = computed(() => {
  if (terminalStatus.value === 'COMPLETED') return 'Payment Complete'
  if (terminalStatus.value === 'FAILED') return 'Payment Failed'
  if (terminalStatus.value === 'CANCELED') return 'Payment Cancelled'
  return 'Waiting for Terminal'
})

const runtimeConfig = useRuntimeConfig()

onMounted(() => {
  initializeData()
  const savedSquare = localStorage.getItem('squareSettings')
  if (savedSquare) {
    try {
      const parsed = JSON.parse(savedSquare)
      if (parsed.enabled) {
        squareEnabled.value = true
        squareDeviceId.value = parsed.deviceId || ''
      }
    } catch (e) {
      console.error('Error reading square settings', e)
    }
  }
})

interface CartItem {
  id: string | number
  name: string
  price: number
  quantity: number
  isVirtual?: boolean
}

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const cart = ref<CartItem[]>([])
const discountPercent = ref(0)
const discountDialogOpen = ref(false)
const warrantyDialogOpen = ref(false)
const refundDialogOpen = ref(false)
const refundAmount = ref(0)
const refundReason = ref('')

const filteredProducts = computed<InventoryItem[]>(() => {
  return (inventory.value || []).filter(item => {
    const matchesSearch = !searchQuery.value ||
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.sku ?? '').toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory = !selectedCategory.value ||
      item.category?.toLowerCase() === selectedCategory.value.toLowerCase()

    return matchesSearch && matchesCategory && item.stock > 0
  })
})

const subtotal = computed<number>(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const discountAmount = computed<number>(() => subtotal.value * (discountPercent.value / 100))

const taxableAmount = computed<number>(() => Math.max(0, subtotal.value - discountAmount.value))

const taxRate = computed<number>(() => settings.value?.taxRate ?? 0)

const taxAmount = computed<number>(() => taxableAmount.value * (taxRate.value / 100))

const total = computed<number>(() => taxableAmount.value + taxAmount.value)

const formatCurrency = (amount: number) => `${settings.value?.currency ?? '$'}${amount.toFixed(2)}`

const addToCart = (item: InventoryItem) => {
  const existing = cart.value.find(c => c.id === item.id)
  
  if (existing) {
    if (existing.quantity < item.stock) {
      existing.quantity++
    } else {
      addNotification('Stock Limit', 'Cannot add more items than available in stock', 'warning')
    }
  } else {
    cart.value.push({ 
      id: item.id, 
      name: item.name, 
      price: item.price, 
      quantity: 1 
    })
  }
}

const incrementItem = (index: number) => {
  const cartItem = cart.value[index]
  
  if (cartItem.isVirtual) {
    cartItem.quantity++
    return
  }

  const invItem = inventory.value.find(i => i.id === cartItem.id)
  if (invItem && cartItem.quantity < invItem.stock) {
    cartItem.quantity++
  } else {
    addNotification('Stock Limit', 'Cannot add more items than available in stock', 'warning')
  }
}

const decrementItem = (index: number) => {
  if (cart.value[index].quantity > 1) cart.value[index].quantity--
  else cart.value.splice(index, 1)
}

const clearCart = () => {
  cart.value = []
  discountPercent.value = 0
}

const applyDiscount = () => {
  discountPercent.value = Math.min(100, Math.max(0, discountPercent.value))
  discountDialogOpen.value = false
  addNotification('Discount Applied', `${discountPercent.value}% discount applied to cart`, 'success')
}

const addWarranty = (days: number, price: number) => {
  cart.value.push({ 
    id: Date.now(), 
    name: `${days}-Day Warranty`, 
    price, 
    quantity: 1,
    isVirtual: true 
  })
  warrantyDialogOpen.value = false
  addNotification('Warranty Added', `${days}-day warranty protection added`, 'success')
}

const processRefund = () => {
  if (refundAmount.value <= 0) return addNotification('Invalid Amount', 'Please enter a valid refund amount', 'warning')
  if (!refundReason.value.trim()) return addNotification('Missing Reason', 'Please provide a reason for the refund', 'warning')

  addNotification('Refund Processed', `Refund of ${formatCurrency(refundAmount.value)} has been processed`, 'success')

  refundDialogOpen.value = false
  refundAmount.value = 0
  refundReason.value = ''
}

const customAmountDialogOpen = ref(false)
const customAmountName = ref('')
const customAmountValue = ref<number | null>(null)
const customAmountPresets = [25, 50, 75, 100, 150, 200]

const addCustomAmount = () => {
  if (!customAmountValue.value || customAmountValue.value <= 0) return
  cart.value.push({
    id: `custom-${Date.now()}`,
    name: customAmountName.value.trim() || 'Custom Amount',
    price: customAmountValue.value,
    quantity: 1,
    isVirtual: true
  })
  addNotification('Item Added', `Custom amount of ${formatCurrency(customAmountValue.value)} added to cart`, 'success')
  customAmountDialogOpen.value = false
  customAmountName.value = ''
  customAmountValue.value = null
}

// ── Complete sale (deduct stock, save, clear) ────────────────────────────────
const completeSale = async (method: string) => {
  try {
    for (const cartItem of cart.value) {
      if (cartItem.isVirtual) continue
      const inv = inventory.value.find(i => i.id === cartItem.id)
      if (inv) {
        const newStock = inv.stock - cartItem.quantity
        await updateInventoryItem(cartItem.id, { stock: newStock })
      }
    }
    addNotification('Sale Complete', `Payment of ${formatCurrency(total.value)} received via ${method}`, 'success')
    clearCart()
  } catch (err: any) {
    addNotification('Error', 'Sale recorded but stock update failed: ' + (err.message || err), 'error')
    clearCart()
  }
}

// ── Terminal flow ─────────────────────────────────────────────────────────────
const startTerminalPayment = async () => {
  const amountCents = Math.round(total.value * 100)
  terminalStatus.value = 'PENDING'
  terminalModalOpen.value = true

  try {
    const data: any = await $fetch('/api/square/terminal', {
      method: 'POST',
      body: { amountCents, deviceId: squareDeviceId.value, referenceId: `novaops-${Date.now()}`, note: 'NovaOps POS Sale' }
    })
    terminalCheckoutId.value = data.checkoutId
    terminalStatus.value = data.status || 'PENDING'
    startPolling()
  } catch (err: any) {
    console.error('Terminal error:', err)
    terminalModalOpen.value = false
    addNotification('Terminal Unavailable', 'Falling back to card form', 'warning')
    await openCardForm()
  }
}

const startPolling = () => {
  if (terminalPollTimer) clearInterval(terminalPollTimer)
  terminalPollTimer = setInterval(async () => {
    try {
      const data: any = await $fetch(`/api/square/terminal-status?checkoutId=${terminalCheckoutId.value}`)
      terminalStatus.value = data.status

      if (data.status === 'COMPLETED') {
        clearInterval(terminalPollTimer!)
        setTimeout(() => {
          terminalModalOpen.value = false
          completeSale('Square Terminal')
        }, 1500)
      } else if (data.status === 'FAILED' || data.status === 'CANCELED') {
        clearInterval(terminalPollTimer!)
        // Brief pause to show the failure state, then auto-fallback
        setTimeout(async () => {
          terminalModalOpen.value = false
          addNotification('Terminal Failed', 'Opening card payment form', 'warning')
          await openCardForm()
        }, 2000)
      }
    } catch (e) {
      console.error('Polling error', e)
    }
  }, 2500)
}

const cancelTerminalPayment = async () => {
  if (terminalPollTimer) clearInterval(terminalPollTimer)
  terminalModalOpen.value = false
  terminalStatus.value = ''
  terminalCheckoutId.value = ''
}

// ── Web Payments SDK (browser card fallback) ──────────────────────────────────
const openCardForm = async () => {
  cardFormError.value = ''
  cardFormOpen.value = true
  cardFormReady.value = false

  await nextTick()

  const appId = runtimeConfig.public.squareApplicationId
  const locationId = runtimeConfig.public.squareLocationId

  if (!appId || !locationId) {
    cardFormError.value = 'Square Application ID or Location ID not configured.'
    return
  }

  try {
    // Load Square Web Payments SDK if not already loaded
    if (!(window as any).Square) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://web.squarecdn.com/v1/square.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Square SDK'))
        document.head.appendChild(script)
      })
    }

    squarePayments = (window as any).Square.payments(appId, locationId)
    squareCard = await squarePayments.card()
    await squareCard.attach('#card-container')
    cardFormReady.value = true
  } catch (err: any) {
    cardFormError.value = err.message || 'Failed to load payment form.'
    console.error('Square SDK error:', err)
  }
}

const submitCardPayment = async () => {
  if (!squareCard) return
  isProcessing.value = true
  cardFormError.value = ''

  try {
    const result = await squareCard.tokenize()
    if (result.status !== 'OK') {
      cardFormError.value = result.errors?.[0]?.message || 'Card tokenization failed'
      isProcessing.value = false
      return
    }

    const amountCents = Math.round(total.value * 100)
    await $fetch('/api/square/payment', {
      method: 'POST',
      body: { sourceId: result.token, amountCents, referenceId: `novaops-${Date.now()}`, note: 'NovaOps POS Sale' }
    })

    cardFormOpen.value = false
    completeSale('Square Card')
  } catch (err: any) {
    cardFormError.value = err.data?.statusMessage || err.message || 'Payment failed. Please try again.'
  } finally {
    isProcessing.value = false
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────
const processPayment = async (method: 'card' | 'cash') => {
  if (!cart.value.length) return

  if (method === 'cash') {
    completeSale('Cash')
    return
  }

  if (!squareEnabled.value) {
    completeSale('Card')
    return
  }

  const hasCredentials = !!(runtimeConfig.public.squareApplicationId && runtimeConfig.public.squareLocationId)

  // Try terminal first if device ID is configured
  if (squareDeviceId.value) {
    await startTerminalPayment()
  } else if (hasCredentials) {
    // Web Payments SDK card form
    await openCardForm()
  } else {
    // Square enabled in settings but credentials not configured — just complete sale
    addNotification('Square Not Configured', 'Add SQUARE_APPLICATION_ID and SQUARE_LOCATION_ID to your Vercel env vars to enable card payments. Recording sale as Card.', 'warning')
    completeSale('Card')
  }
}
</script>
