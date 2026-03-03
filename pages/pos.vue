<template>
  <div class="flex flex-col h-[calc(100vh-8rem)] gap-4">
    <div class="flex flex-1 gap-4 overflow-hidden">

      <!-- Product Grid -->
      <div class="flex-1 flex flex-col gap-4 overflow-hidden">
        <div class="flex gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input v-model="searchQuery" placeholder="Search products…" class="w-full h-12 pl-11 pr-4 rounded-full text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/20 transition-all font-medium" />
          </div>
          <div class="flex gap-2">
            <button v-for="cat in [null, 'Accessories', 'Parts', 'Devices', 'Services']" :key="cat ?? 'all'"
              class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              :style="selectedCategory === cat ? 'background: #ec489924; color: #ec4899; outline: 2px solid #ec489950; outline-offset: 0' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
              @click="selectedCategory = cat">{{ cat ?? 'All' }}</button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pr-1">
          <div v-for="item in filteredProducts" :key="item.id"
            class="m3-product rounded-[28px] cursor-pointer bg-card flex flex-col items-center text-center gap-2 p-5"
            style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
            @click="addToCart(item)">
            <div class="w-14 h-14 rounded-[26px] flex items-center justify-center" style="background: linear-gradient(135deg, #ec489920, #db277720)">
              <Package class="h-7 w-7" style="color: #ec4899" />
            </div>
            <div>
              <h3 class="font-black text-sm line-clamp-1">{{ item.name }}</h3>
              <p class="text-xs text-muted-foreground font-medium line-clamp-1">{{ item.sku }}</p>
            </div>
            <p class="text-xl font-black" style="color: #ec4899">{{ formatCurrency(item.price) }}</p>
            <span class="text-[10px] font-bold px-2.5 py-1 rounded-full" style="background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))">Stock: {{ item.stock }}</span>
          </div>
        </div>
      </div>

      <!-- Cart Sidebar -->
      <div class="w-[400px] flex flex-col rounded-[32px] overflow-hidden bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border/60" style="background: #ec489908">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #ec4899, #db2777)">
              <ShoppingCart class="w-5 h-5 text-white" />
            </div>
            <span class="font-black text-sm">Current Sale</span>
          </div>
          <button class="w-9 h-9 rounded-[18px] flex items-center justify-center transition-all hover:scale-110 active:scale-90 disabled:opacity-30" style="background: #ef444414" :disabled="!cart.length" @click="clearCart">
            <Trash2 class="h-4 w-4" style="color: #ef4444" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
            <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background: #ec489914">
              <ShoppingCart class="h-8 w-8" style="color: #ec4899; opacity: 0.4" />
            </div>
            <p class="text-sm font-bold">Cart is empty</p>
            <p class="text-xs font-medium text-muted-foreground">Add products to begin</p>
          </div>
          <div v-else class="divide-y divide-border/40">
            <div v-for="(item, index) in cart" :key="index" class="px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-sm truncate">{{ item.name }}</h4>
                <p class="text-xs text-muted-foreground font-medium">{{ formatCurrency(item.price) }} each</p>
              </div>
              <div class="flex items-center gap-1 rounded-full p-1" style="background: hsl(var(--muted)/0.6)">
                <button class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-background transition-all hover:scale-110 active:scale-90" @click="decrementItem(index)"><Minus class="h-3.5 w-3.5" /></button>
                <span class="w-8 text-center text-sm font-black">{{ item.quantity }}</span>
                <button class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-background transition-all hover:scale-110 active:scale-90" @click="incrementItem(index)"><Plus class="h-3.5 w-3.5" /></button>
              </div>
              <div class="text-right font-black text-sm min-w-[64px]" style="color: #ec4899">{{ formatCurrency(item.price * item.quantity) }}</div>
            </div>
          </div>
        </div>

        <div class="p-5 border-t border-border/60 space-y-4" style="background: #ec489904">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between font-semibold text-muted-foreground"><span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span></div>
            <div v-if="taxRate" class="flex justify-between font-semibold text-muted-foreground"><span>Tax ({{ taxRate }}%)</span><span>{{ formatCurrency(taxAmount) }}</span></div>
            <div class="flex justify-between font-black text-base pt-2 border-t border-border/60"><span>Total</span><span style="color: #ec4899">{{ formatCurrency(total) }}</span></div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer (optional)</label>
            <select v-model="selectedCustomerId" class="w-full h-11 px-4 rounded-[20px] text-sm font-medium bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-pink-400/40 transition-all">
              <option :value="null">Walk-in customer</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Payment Method</label>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="method in ['Cash','Card','Other']" :key="method"
                class="py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
                :style="paymentMethod === method ? 'background: #ec489924; color: #ec4899; outline: 2px solid #ec489950; outline-offset: 0' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                @click="paymentMethod = method">{{ method }}</button>
            </div>
          </div>

          <button :disabled="!cart.length" @click="completeSale"
            class="m3-checkout w-full h-14 rounded-full text-sm font-black text-white shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style="background: linear-gradient(135deg, #ec4899, #db2777); box-shadow: 0 4px 20px #ec489950">
            <CheckCircle class="w-5 h-5" />
            Complete Sale — {{ formatCurrency(total) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Search, Package, ShoppingCart, ShoppingBag, Trash2, Plus, Minus, X,
  CheckCircle, CreditCard, TicketCheck, ShieldCheck, Wrench,
  Banknote, Wallet, Users, Lock, AlertCircle,
} from 'lucide-vue-next'

import { computed, ref, watchEffect, nextTick } from 'vue'
import { useAppStore } from '@/stores/app' // ✅ REQUIRED

definePageMeta({ middleware: ['auth'] })

/* --------------------------------------------------
   STORE SAFETY
-------------------------------------------------- */

const appStore = useAppStore()

// Prevent undefined crashes during hydration
const inventory = computed(() => Array.isArray(appStore?.inventory) ? appStore.inventory : [])
const customers = computed(() => Array.isArray(appStore?.customers) ? appStore.customers : [])
const settings  = computed(() => appStore?.settings ?? { currency: '$', taxRate: 0 })

/* --------------------------------------------------
   STATE
-------------------------------------------------- */

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const cart = ref<any[]>([])
const selectedCustomerId = ref<number | null>(null)
const paymentMethod = ref<'Cash' | 'Card' | 'Other'>('Cash')

/* --------------------------------------------------
   SAFE COMPUTED VALUES
-------------------------------------------------- */

const taxRate = computed(() => {
  const raw = settings.value?.taxRate
  const parsed = parseFloat(String(raw ?? 0))
  return isNaN(parsed) ? 0 : parsed
})

const formatCurrency = (n: number) => {
  const currency = settings.value?.currency || '$'
  const value = typeof n === 'number' && !isNaN(n) ? n : 0
  return `${currency}${value.toFixed(2)}`
}

/* --------------------------------------------------
   FILTERED PRODUCTS
-------------------------------------------------- */

const filteredProducts = computed(() => {
  return inventory.value.filter((item: any) => {
    if (!item) return false

    const name = (item.name ?? '').toLowerCase()
    const matchSearch =
      !searchQuery.value ||
      name.includes(searchQuery.value.toLowerCase())

    const matchCat =
      !selectedCategory.value ||
      item.category === selectedCategory.value

    return matchSearch && matchCat && Number(item.stock) > 0
  })
})

/* --------------------------------------------------
   TOTALS
-------------------------------------------------- */

const subtotal = computed(() =>
  cart.value.reduce((a, i) => {
    const price = Number(i.price) || 0
    const qty = Number(i.quantity) || 0
    return a + price * qty
  }, 0)
)

const taxAmount = computed(() =>
  subtotal.value * (taxRate.value / 100)
)

const total = computed(() =>
  subtotal.value + taxAmount.value
)

/* --------------------------------------------------
   CART METHODS (SAFE)
-------------------------------------------------- */

const addToCart = (item: any) => {
  if (!item || !item.id) return

  const existing = cart.value.find(i => i.id === item.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      ...item,
      quantity: 1
    })
  }
}

const incrementItem = (i: number) => {
  if (!cart.value[i]) return
  cart.value[i].quantity++
}

const decrementItem = (i: number) => {
  if (!cart.value[i]) return
  if (cart.value[i].quantity > 1) {
    cart.value[i].quantity--
  } else {
    cart.value.splice(i, 1)
  }
}

const clearCart = () => {
  cart.value = []
  selectedCustomerId.value = null
}

/* --------------------------------------------------
   COMPLETE SALE (STABLE)
-------------------------------------------------- */

const completeSale = async () => {
  if (!cart.value.length) return

  try {
    await appStore.createTicket({
      customerId: selectedCustomerId.value,
      device: 'POS Sale',
      issue: cart.value.map(i => `${i.quantity}x ${i.name}`).join(', '),
      status: 'Completed',
      price: total.value,
      posOrder: true,
      paymentMethod: paymentMethod.value,
    } as any)

    // Safe inventory update
    cart.value.forEach((item: any) => {
      const inv = inventory.value.find((i: any) => i.id === item.id)
      if (inv) {
        inv.stock = Math.max(0, Number(inv.stock) - Number(item.quantity))
      }
    })

    if (typeof appStore.saveAll === 'function') {
      await appStore.saveAll()
    }

    const finalTotal = total.value
    clearCart()

    await nextTick()
    alert(`Sale completed! Total: ${formatCurrency(finalTotal)}`)

  } catch (err) {
    console.error('POS Sale Error:', err)
    alert('Sale failed. Check console.')
  }
}

/* --------------------------------------------------
   DEV SAFETY (prevents white screen)
-------------------------------------------------- */

// Prevent full crash if store not ready
watchEffect(() => {
  if (!appStore) {
    console.warn('App store not initialized.')
  }
})
</script>

<style scoped>
.m3-product { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-product:hover { transform: scale(1.04) translateY(-4px); box-shadow: 0 12px 32px rgba(236,72,153,0.2); }
.m3-product:active { transform: scale(0.92); }
.m3-checkout { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-checkout:hover:not(:disabled) { transform: scale(1.03) translateY(-2px); box-shadow: 0 8px 28px rgba(236,72,153,0.5) !important; }
.m3-checkout:active:not(:disabled) { transform: scale(0.93); }
</style>
