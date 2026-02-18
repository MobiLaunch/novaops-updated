<template>
  <div class="flex flex-col h-[calc(100vh-8rem)] gap-4">
    <div class="flex flex-1 gap-4 overflow-hidden">
      <div class="flex-1 flex flex-col gap-4 overflow-hidden">
        <div class="flex gap-4">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Search products..."
              class="pl-9"
            />
          </div>
          <Select v-model="selectedCategory">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="null">All Categories</SelectItem>
              <SelectItem value="Accessories">Accessories</SelectItem>
              <SelectItem value="Parts">Parts</SelectItem>
              <SelectItem value="Devices">Devices</SelectItem>
              <SelectItem value="Services">Services</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
          <Card
            v-for="item in filteredProducts"
            :key="item.id"
            class="cursor-pointer transition-all hover:bg-accent hover:scale-[1.02] active:scale-[0.98]"
            @click="addToCart(item)"
          >
            <CardContent class="p-4 flex flex-col items-center text-center gap-2">
              <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package class="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 class="font-medium line-clamp-1" :title="item.name">{{ item.name }}</h3>
                <p class="text-sm text-muted-foreground line-clamp-1">{{ item.sku }}</p>
              </div>
              <div class="font-bold text-lg text-primary">
                {{ formatCurrency(item.price) }}
              </div>
              <Badge variant="secondary" class="mt-1">
                Stock: {{ item.stock }}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card class="w-[400px] flex flex-col shadow-lg border-l">
        <CardHeader class="pb-2 border-b">
          <CardTitle class="flex items-center justify-between">
            <span>Current Sale</span>
            <div class="flex gap-2">
              <Button variant="ghost" size="icon" @click="clearCart" :disabled="!cart.length">
                <Trash2 class="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent class="flex-1 overflow-y-auto p-0">
          <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
            <ShoppingCart class="h-12 w-12 mb-4 opacity-20" />
            <p>Cart is empty</p>
          </div>
          
          <div v-else class="divide-y">
            <div v-for="(item, index) in cart" :key="index" class="p-4 flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium truncate">{{ item.name }}</h4>
                <div class="text-sm text-muted-foreground">
                  {{ formatCurrency(item.price) }}
                </div>
              </div>
              
              <div class="flex items-center gap-2 bg-secondary rounded-md p-1">
                <Button variant="ghost" size="icon" class="h-6 w-6" @click="decrementItem(index)">
                  <Minus class="h-3 w-3" />
                </Button>
                <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
                <Button variant="ghost" size="icon" class="h-6 w-6" @click="incrementItem(index)">
                  <Plus class="h-3 w-3" />
                </Button>
              </div>
              
              <div class="text-right font-medium min-w-[80px]">
                {{ formatCurrency(item.price * item.quantity) }}
              </div>
            </div>
          </div>
        </CardContent>

        <div class="p-4 bg-muted/20 border-t space-y-4">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{{ formatCurrency(subtotal) }}</span>
            </div>
            <div v-if="discountPercent > 0" class="flex justify-between text-green-600">
              <span>Discount ({{ discountPercent }}%)</span>
              <span>-{{ formatCurrency(discountAmount) }}</span>
            </div>
            <div class="flex justify-between text-muted-foreground">
              <span>Tax ({{ taxRate }}%)</span>
              <span>{{ formatCurrency(taxAmount) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{{ formatCurrency(total) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-2">
            <Button variant="outline" class="col-span-1" @click="discountDialogOpen = true">
              <Percent class="h-4 w-4" />
            </Button>
            <Button variant="outline" class="col-span-1" @click="warrantyDialogOpen = true">
              <Shield class="h-4 w-4" />
            </Button>
            <Button variant="outline" class="col-span-1" @click="refundDialogOpen = true">
              <RotateCcw class="h-4 w-4" />
            </Button>
            <Button variant="outline" class="col-span-1" @click="customAmountDialogOpen = true" title="Custom Amount">
              <PenLine class="h-4 w-4" />
            </Button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <Button size="lg" variant="outline" class="w-full" :disabled="!cart.length" @click="processPayment('cash')">
              <DollarSign class="h-4 w-4 mr-2" />
              Cash
            </Button>
            
            <Button 
              size="lg" 
              class="w-full transition-colors" 
              :class="squareEnabled ? 'bg-[#006AFF] hover:bg-[#0055CC]' : ''"
              :disabled="!cart.length || isProcessing" 
              @click="processPayment('card')"
            >
              <div v-if="isProcessing" class="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-b-transparent border-white" />
              <MonitorSmartphone v-else-if="squareEnabled && squareDeviceId" class="h-4 w-4 mr-2" />
              <CreditCard v-else class="h-4 w-4 mr-2" />
              {{ payButtonLabel }}
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <Dialog v-model:open="discountDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label>Discount Percentage</Label>
            <div class="flex gap-2">
              <Input type="number" v-model.number="discountPercent" min="0" max="100" />
              <div class="flex items-center justify-center w-10 bg-muted rounded-md">
                <Percent class="h-4 w-4" />
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" @click="discountPercent = 5">5%</Button>
            <Button variant="outline" class="flex-1" @click="discountPercent = 10">10%</Button>
            <Button variant="outline" class="flex-1" @click="discountPercent = 20">20%</Button>
          </div>
          <Button @click="applyDiscount">Apply Discount</Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="warrantyDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Warranty</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <Button variant="outline" class="h-auto py-4 flex flex-col gap-2" @click="addWarranty(30, 29.99)">
              <span class="font-bold text-lg">30 Days</span>
              <span class="text-muted-foreground">$29.99</span>
            </Button>
            <Button variant="outline" class="h-auto py-4 flex flex-col gap-2" @click="addWarranty(90, 59.99)">
              <span class="font-bold text-lg">90 Days</span>
              <span class="text-muted-foreground">$59.99</span>
            </Button>
            <Button variant="outline" class="h-auto py-4 flex flex-col gap-2" @click="addWarranty(180, 89.99)">
              <span class="font-bold text-lg">6 Months</span>
              <span class="text-muted-foreground">$89.99</span>
            </Button>
            <Button variant="outline" class="h-auto py-4 flex flex-col gap-2" @click="addWarranty(365, 149.99)">
              <span class="font-bold text-lg">1 Year</span>
              <span class="text-muted-foreground">$149.99</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="refundDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label>Refund Amount</Label>
            <div class="relative">
              <DollarSign class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="number" v-model.number="refundAmount" class="pl-9" />
            </div>
          </div>
          <div class="grid gap-2">
            <Label>Reason</Label>
            <Textarea v-model="refundReason" placeholder="Reason for refund..." />
          </div>
          <Button variant="destructive" @click="processRefund">Process Refund</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Terminal Payment Status Modal -->
    <Dialog v-model:open="terminalModalOpen">
      <DialogContent class="sm:max-w-[380px]" :show-close="terminalStatus === 'FAILED' || terminalStatus === 'CANCELED'">
        <DialogHeader>
          <DialogTitle>{{ terminalModalTitle }}</DialogTitle>
        </DialogHeader>
        <div class="py-6 flex flex-col items-center gap-4 text-center">
          <!-- Waiting -->
          <div v-if="terminalStatus === 'PENDING' || terminalStatus === 'IN_PROGRESS'" class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MonitorSmartphone class="w-8 h-8 text-blue-500" />
            </div>
            <div class="space-y-1">
              <p class="text-sm text-muted-foreground">Waiting for customer to tap, swipe, or insert card on the terminal.</p>
              <p class="text-xs text-muted-foreground/60">Amount: <span class="font-semibold text-foreground">{{ formatCurrency(total) }}</span></p>
            </div>
            <div class="flex gap-1">
              <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 0ms" />
              <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 150ms" />
              <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 300ms" />
            </div>
            <Button variant="outline" size="sm" @click="cancelTerminalPayment">Cancel</Button>
          </div>

          <!-- Success -->
          <div v-else-if="terminalStatus === 'COMPLETED'" class="flex flex-col items-center gap-3">
            <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle class="w-8 h-8 text-emerald-500" />
            </div>
            <p class="text-sm font-medium text-emerald-600">Payment complete!</p>
          </div>

          <!-- Failed / Canceled -->
          <div v-else-if="terminalStatus === 'FAILED' || terminalStatus === 'CANCELED'" class="flex flex-col items-center gap-3">
            <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle class="w-8 h-8 text-red-500" />
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-red-600">{{ terminalStatus === 'CANCELED' ? 'Payment cancelled' : 'Terminal payment failed' }}</p>
              <p class="text-xs text-muted-foreground">Falling back to browser card payment...</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Web Payments SDK Card Form Modal (fallback) -->
    <Dialog v-model:open="cardFormOpen">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <CreditCard class="w-4 h-4" /> Card Payment
          </DialogTitle>
        </DialogHeader>
        <div class="py-4 space-y-4">
          <div class="flex justify-between text-sm font-semibold">
            <span>Total Due</span>
            <span class="text-primary text-lg">{{ formatCurrency(total) }}</span>
          </div>
          <div id="card-container" class="min-h-[90px]" />
          <p v-if="cardFormError" class="text-xs text-red-500">{{ cardFormError }}</p>
          <Button class="w-full bg-[#006AFF] hover:bg-[#0055CC]" :disabled="isProcessing || !cardFormReady" @click="submitCardPayment">
            <div v-if="isProcessing" class="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-b-transparent border-white" />
            <CreditCard v-else class="h-4 w-4 mr-2" />
            {{ isProcessing ? 'Processing...' : `Pay ${formatCurrency(total)}` }}
          </Button>
          <p class="text-center text-xs text-muted-foreground">Secured by Square</p>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Custom Amount Dialog -->
    <Dialog v-model:open="customAmountDialogOpen">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Custom Amount</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label>Description</Label>
            <Input
              v-model="customAmountName"
              placeholder="e.g. Labor, Diagnostic fee..."
              @keyup.enter="$refs.customAmountInput?.focus()"
            />
          </div>
          <div class="grid gap-2">
            <Label>Amount</Label>
            <div class="relative">
              <DollarSign class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                ref="customAmountInput"
                type="number"
                v-model.number="customAmountValue"
                class="pl-9 text-lg font-semibold"
                placeholder="0.00"
                min="0"
                step="0.01"
                @keyup.enter="addCustomAmount"
              />
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button v-for="preset in customAmountPresets" :key="preset" variant="outline" size="sm"
              @click="customAmountValue = preset">
              {{ formatCurrency(preset) }}
            </Button>
          </div>
          <Button @click="addCustomAmount" :disabled="!customAmountValue || customAmountValue <= 0">
            <PenLine class="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
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
  Search,
  Package,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Percent,
  Shield,
  RotateCcw,
  PenLine,
  MonitorSmartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })

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
