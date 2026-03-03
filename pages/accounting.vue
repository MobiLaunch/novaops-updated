<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 6px 28px #10b98150"
        >
          <Calculator class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Accounting</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Financial overview & profit/loss for your POS</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <!-- Date range selector -->
        <div class="flex gap-1.5 rounded-full p-1" style="background: hsl(var(--muted)/0.5)">
          <button
            v-for="r in dateRanges"
            :key="r.value"
            class="px-4 py-2 rounded-full text-xs font-black transition-all"
            :style="dateRange === r.value
              ? 'background: white; color: #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.1)'
              : 'color: hsl(var(--muted-foreground))'"
            @click="dateRange = r.value"
          >{{ r.label }}</button>
        </div>
        <button class="m3-btn-primary flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140" @click="exportReport">
          <Download class="w-4 h-4" /> Export
        </button>
      </div>
    </div>

    <!-- ── Profit/Loss Banner ─────────────────────────────────────── -->
    <div
      class="m3-pl-banner rounded-[32px] p-8 flex items-center justify-between overflow-hidden relative"
      :style="netProfit >= 0
        ? 'background: linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)'
        : 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)'"
    >
      <!-- Background glow -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px]">
        <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl bg-white" />
        <div class="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-15 blur-2xl bg-white" />
      </div>
      <div class="relative">
        <p class="text-sm font-black text-white/70 uppercase tracking-widest mb-1">
          {{ netProfit >= 0 ? '🎉 Net Profit' : '📉 Net Loss' }} — {{ periodLabel }}
        </p>
        <p class="text-5xl font-black text-white">{{ formatCurrency(Math.abs(netProfit)) }}</p>
        <p class="text-sm font-bold text-white/70 mt-2">
          Revenue {{ formatCurrency(totalRevenue) }} — Expenses {{ formatCurrency(totalExpenses) }}
        </p>
      </div>
      <div class="relative flex flex-col items-end gap-3">
        <div class="flex flex-col items-end gap-1">
          <span class="text-white/70 text-xs font-black uppercase tracking-wide">Margin</span>
          <span class="text-3xl font-black text-white">{{ totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0' }}%</span>
        </div>
        <div
          class="flex items-center gap-2 px-4 py-2 rounded-full"
          style="background: rgba(255,255,255,0.2)"
        >
          <TrendingUp v-if="netProfit >= 0" class="w-4 h-4 text-white" />
          <TrendingDown v-else class="w-4 h-4 text-white" />
          <span class="text-sm font-bold text-white">{{ ticketCount }} transactions</span>
        </div>
      </div>
    </div>

    <!-- ── KPI Row ─────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #10b98124">
            <DollarSign class="w-5.5 h-5.5" style="color: #10b981" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #10b98120; color: #10b981">REVENUE</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Revenue</p>
          <p class="text-2xl font-black" style="color: #10b981">{{ formatCurrency(totalRevenue) }}</p>
          <p class="text-[10px] text-muted-foreground font-semibold mt-0.5">{{ completedCount }} paid tickets</p>
        </div>
      </div>

      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #ef444424">
            <TrendingDown class="w-5.5 h-5.5" style="color: #ef4444" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #ef444420; color: #ef4444">COSTS</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Total Costs</p>
          <p class="text-2xl font-black" style="color: #ef4444">{{ formatCurrency(totalExpenses) }}</p>
          <p class="text-[10px] text-muted-foreground font-semibold mt-0.5">Parts + overhead</p>
        </div>
      </div>

      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #f59e0b14; outline: 2px solid #f59e0b28; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #f59e0b24">
            <Receipt class="w-5.5 h-5.5" style="color: #f59e0b" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #f59e0b20; color: #f59e0b">TAX</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Tax Collected</p>
          <p class="text-2xl font-black" style="color: #f59e0b">{{ formatCurrency(totalTax) }}</p>
          <p class="text-[10px] text-muted-foreground font-semibold mt-0.5">{{ taxRate }}% rate applied</p>
        </div>
      </div>

      <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #6366f114; outline: 2px solid #6366f128; outline-offset: 0">
        <div class="flex items-center justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #6366f124">
            <Target class="w-5.5 h-5.5" style="color: #6366f1" />
          </div>
          <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #6366f120; color: #6366f1">AVG</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">Avg Ticket Value</p>
          <p class="text-2xl font-black" style="color: #6366f1">{{ formatCurrency(avgTicketValue) }}</p>
          <p class="text-[10px] text-muted-foreground font-semibold mt-0.5">Per completed job</p>
        </div>
      </div>

    </div>

    <!-- ── Main Content Grid ─────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- ── Revenue Breakdown ──────────────────────────────────── -->
      <div class="lg:col-span-2 rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #10b98120">
              <BarChart3 class="w-4.5 h-4.5" style="color: #10b981" />
            </div>
            <h3 class="text-sm font-black">Revenue Breakdown</h3>
          </div>
        </div>

        <!-- Revenue by source bars -->
        <div class="space-y-3 mb-6">
          <div v-for="source in revenueSources" :key="source.label" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-[16px] flex items-center justify-center flex-shrink-0" :style="`background: ${source.color}20`">
              <component :is="source.icon" class="w-4 h-4" :style="`color: ${source.color}`" />
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold">{{ source.label }}</span>
                <span class="text-xs font-black" :style="`color: ${source.color}`">{{ formatCurrency(source.value) }}</span>
              </div>
              <div class="h-3 rounded-full overflow-hidden" style="background: hsl(var(--muted)/0.4)">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="`width: ${source.pct}%; background: linear-gradient(90deg, ${source.color}, ${source.colorDark})`"
                />
              </div>
            </div>
            <span class="text-[10px] font-bold text-muted-foreground w-12 text-right">{{ source.pct.toFixed(0) }}%</span>
          </div>
        </div>

        <!-- Monthly timeline -->
        <div class="border-t border-border/60 pt-5">
          <p class="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Monthly Revenue</p>
          <div class="flex items-end gap-2 h-24">
            <div
              v-for="month in monthlyRevenue"
              :key="month.label"
              class="flex-1 flex flex-col items-center gap-1"
            >
              <div
                class="w-full rounded-t-[8px] transition-all duration-700 hover:opacity-80 cursor-pointer m3-bar"
                :style="`height: ${month.pct}%; min-height: 4px; background: linear-gradient(180deg, #10b981, #059669)`"
                :title="formatCurrency(month.value)"
              />
              <span class="text-[9px] font-semibold text-muted-foreground">{{ month.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── P&L Summary Card ───────────────────────────────────── -->
      <div class="space-y-4">

        <!-- Expense breakdown -->
        <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #ef444420">
              <CreditCard class="w-4.5 h-4.5" style="color: #ef4444" />
            </div>
            <h3 class="text-sm font-black">Cost Breakdown</h3>
          </div>
          <div class="space-y-3">
            <div v-for="exp in expenseItems" :key="exp.label" class="flex items-center justify-between py-2.5 px-3 rounded-[16px]" style="background: hsl(var(--muted)/0.2)">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-[12px] flex items-center justify-center" :style="`background: ${exp.color}20`">
                  <component :is="exp.icon" class="w-3.5 h-3.5" :style="`color: ${exp.color}`" />
                </div>
                <span class="text-xs font-bold">{{ exp.label }}</span>
              </div>
              <span class="text-xs font-black" :style="`color: ${exp.color}`">{{ formatCurrency(exp.value) }}</span>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
            <span class="text-sm font-black">Total Costs</span>
            <span class="text-sm font-black" style="color: #ef4444">{{ formatCurrency(totalExpenses) }}</span>
          </div>
        </div>

        <!-- Tax summary -->
        <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #f59e0b20">
              <Receipt class="w-4.5 h-4.5" style="color: #f59e0b" />
            </div>
            <h3 class="text-sm font-black">Tax Summary</h3>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-border/40">
              <span class="text-xs text-muted-foreground font-semibold">Pre-tax Revenue</span>
              <span class="text-xs font-bold">{{ formatCurrency(totalRevenue - totalTax) }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-border/40">
              <span class="text-xs text-muted-foreground font-semibold">Tax Rate</span>
              <span class="text-xs font-bold">{{ taxRate }}%</span>
            </div>
            <div class="flex justify-between py-2 border-b border-border/40">
              <span class="text-xs text-muted-foreground font-semibold">Tax Collected</span>
              <span class="text-xs font-black" style="color: #f59e0b">{{ formatCurrency(totalTax) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-xs font-black">Taxable Transactions</span>
              <span class="text-xs font-black">{{ completedCount }}</span>
            </div>
          </div>
          <div class="mt-4 p-3 rounded-[16px] text-center" style="background: #f59e0b14; outline: 1.5px solid #f59e0b28; outline-offset: 0">
            <p class="text-[10px] font-bold text-muted-foreground mb-1">ESTIMATED TAX LIABILITY</p>
            <p class="text-xl font-black" style="color: #f59e0b">{{ formatCurrency(totalTax) }}</p>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Expense Logger ─────────────────────────────────────────── -->
    <div class="rounded-[28px] bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center justify-between px-6 py-5 border-b border-border/60">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #8b5cf620">
            <ClipboardList class="w-4.5 h-4.5" style="color: #8b5cf6" />
          </div>
          <h3 class="text-sm font-black">Expense Log</h3>
        </div>
        <button
          class="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black text-white"
          style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 3px 12px #8b5cf640"
          @click="addExpenseOpen = true"
        >
          <Plus class="w-3.5 h-3.5" /> Log Expense
        </button>
      </div>
      <div class="p-4">
        <div v-if="expenses.length === 0" class="py-12 flex flex-col items-center gap-3 text-muted-foreground">
          <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background: #8b5cf614">
            <ClipboardList class="w-8 h-8" style="color: #8b5cf6; opacity: 0.5" />
          </div>
          <p class="text-sm font-bold">No expenses logged yet</p>
          <p class="text-xs font-medium">Track your overhead, rent, utilities, and more</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="exp in expenses"
            :key="exp.id"
            class="flex items-center gap-3 px-4 py-3 rounded-[20px] hover:bg-muted/20 transition-all group"
          >
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center flex-shrink-0" :style="`background: ${expenseCategoryColor(exp.category)}18`">
              <component :is="expenseCategoryIcon(exp.category)" class="w-5 h-5" :style="`color: ${expenseCategoryColor(exp.category)}`" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate">{{ exp.description }}</p>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :style="`background: ${expenseCategoryColor(exp.category)}18; color: ${expenseCategoryColor(exp.category)}`">{{ exp.category }}</span>
                <span class="text-[10px] text-muted-foreground font-semibold">{{ formatDate(exp.date) }}</span>
              </div>
            </div>
            <span class="text-sm font-black" style="color: #ef4444">{{ formatCurrency(exp.amount) }}</span>
            <button class="w-8 h-8 rounded-[14px] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all hover:scale-110 active:scale-90" @click="deleteExpense(exp.id)">
              <Trash2 class="w-3.5 h-3.5" style="color: #ef4444" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Add Expense Dialog ─────────────────────────────────────── -->
    <Dialog v-model:open="addExpenseOpen">
      <DialogContent class="rounded-[32px] max-w-md">
        <div class="flex flex-col gap-5 p-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
              <Plus class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">Log Expense</h2>
              <p class="text-xs text-muted-foreground font-medium">Track overhead and business costs</p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Description</label>
            <input v-model="expenseForm.description" placeholder="Monthly rent, supplies, utilities…" class="m3-input" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Amount</label>
              <input v-model.number="expenseForm.amount" type="number" step="0.01" placeholder="0.00" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Date</label>
              <input v-model="expenseForm.date" type="date" class="m3-input" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Category</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="cat in expenseCategories"
                :key="cat.label"
                class="px-3 py-2 rounded-[16px] text-xs font-bold text-center transition-all hover:scale-105 active:scale-95"
                :style="expenseForm.category === cat.label
                  ? `background: ${cat.color}24; color: ${cat.color}; outline: 2px solid ${cat.color}50; outline-offset: 0`
                  : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                @click="expenseForm.category = cat.label"
              >{{ cat.label }}</button>
            </div>
          </div>

          <div class="flex gap-3 pt-1">
            <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="addExpenseOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-105 active:scale-95" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 16px #8b5cf640" @click="logExpense">Log Expense</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import {
  Calculator, DollarSign, TrendingUp, TrendingDown, BarChart3, Receipt,
  Target, CreditCard, Download, Plus, Trash2, ClipboardList,
  Wrench, ShoppingCart, Home, Zap, Wifi, Package, Truck, Users
} from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const tickets   = computed(() => appStore.tickets ?? [])
const inventory = computed(() => appStore.inventory ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$', taxRate: 0 })

// ── Date filtering ─────────────────────────────────────────────
const dateRange = ref('30')
const dateRanges = [
  { label: '7d',   value: '7' },
  { label: '30d',  value: '30' },
  { label: '3mo',  value: '90' },
  { label: 'Year', value: '365' },
]

const periodLabel = computed(() => ({
  '7': 'Last 7 Days', '30': 'Last 30 Days', '90': 'Last 3 Months', '365': 'Last Year'
}[dateRange.value] || 'Period'))

const cutoffDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - parseInt(dateRange.value))
  return d
})

const filteredTickets = computed(() =>
  tickets.value.filter(t => t.createdAt && new Date(t.createdAt) >= cutoffDate.value)
)

// ── Core financials ────────────────────────────────────────────
const taxRate = computed(() => parseFloat(settings.value?.taxRate as any) || 0)

const totalRevenue = computed(() =>
  filteredTickets.value.reduce((a, t) => a + (t.price || 0), 0)
)

const totalTax = computed(() =>
  totalRevenue.value * (taxRate.value / 100)
)

const partsCost = computed(() =>
  filteredTickets.value.reduce((a, t) => {
    const parts = (t.parts || []) as any[]
    return a + parts.reduce((pa: number, p: any) => pa + ((p.cost || 0) * (p.quantity || 1)), 0)
  }, 0)
)

const totalExpenses = computed(() =>
  partsCost.value + expenses.value.reduce((a, e) => a + e.amount, 0)
)

const netProfit = computed(() => totalRevenue.value - totalExpenses.value)

const completedCount = computed(() =>
  filteredTickets.value.filter(t => t.status === 'Completed' || t.status === 'Delivered').length
)

const ticketCount = computed(() => filteredTickets.value.length)

const avgTicketValue = computed(() => {
  const done = filteredTickets.value.filter(t => t.price > 0)
  return done.length ? done.reduce((a, t) => a + t.price, 0) / done.length : 0
})

// ── Revenue sources ─────────────────────────────────────────────
const repairRevenue = computed(() =>
  filteredTickets.value.filter(t => !t.posOrder).reduce((a, t) => a + (t.price || 0), 0)
)
const posRevenue = computed(() =>
  filteredTickets.value.filter(t => t.posOrder).reduce((a, t) => a + (t.price || 0), 0)
)

const revenueSources = computed(() => {
  const max = Math.max(totalRevenue.value, 1)
  return [
    { label: 'Repair Tickets',  value: repairRevenue.value, pct: (repairRevenue.value / max) * 100, color: '#6366f1', colorDark: '#4f46e5', icon: Wrench },
    { label: 'POS / Retail',    value: posRevenue.value,    pct: (posRevenue.value / max) * 100,    color: '#ec4899', colorDark: '#db2777', icon: ShoppingCart },
    { label: 'Parts & Addons',  value: partsCost.value,     pct: (partsCost.value / max) * 100,     color: '#f97316', colorDark: '#ea580c', icon: Package },
  ].filter(s => s.value > 0)
})

// ── Expense items ──────────────────────────────────────────────
const expenseItems = computed(() => [
  { label: 'Parts Cost',     value: partsCost.value,                           color: '#ef4444', icon: Package },
  { label: 'Overhead',       value: expenses.value.filter(e => e.category === 'Overhead').reduce((a, e) => a + e.amount, 0),  color: '#f97316', icon: Home },
  { label: 'Utilities',      value: expenses.value.filter(e => e.category === 'Utilities').reduce((a, e) => a + e.amount, 0), color: '#f59e0b', icon: Zap },
  { label: 'Software/Tools', value: expenses.value.filter(e => e.category === 'Software').reduce((a, e) => a + e.amount, 0),  color: '#8b5cf6', icon: Wifi },
  { label: 'Other',          value: expenses.value.filter(e => !['Overhead','Utilities','Software'].includes(e.category)).reduce((a, e) => a + e.amount, 0), color: '#64748b', icon: ClipboardList },
].filter(e => e.value > 0))

// ── Monthly revenue chart ──────────────────────────────────────
const monthlyRevenue = computed(() => {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleDateString([], { month: 'short' })
    months[key] = 0
  }
  tickets.value.forEach(t => {
    if (!t.createdAt) return
    const d = new Date(t.createdAt)
    const key = d.toLocaleDateString([], { month: 'short' })
    if (key in months) months[key] += (t.price || 0)
  })
  const max = Math.max(...Object.values(months), 1)
  return Object.entries(months).map(([label, value]) => ({ label, value, pct: Math.max((value / max) * 100, 3) }))
})

// ── Expense logger ──────────────────────────────────────────────
const expenses = ref<Array<{id: number; description: string; amount: number; category: string; date: string}>>([])
const addExpenseOpen = ref(false)
const expenseForm = ref({ description: '', amount: 0, category: 'Overhead', date: new Date().toISOString().split('T')[0] })

const expenseCategories = [
  { label: 'Overhead', color: '#f97316' },
  { label: 'Utilities', color: '#f59e0b' },
  { label: 'Software', color: '#8b5cf6' },
  { label: 'Supplies', color: '#10b981' },
  { label: 'Payroll', color: '#3b82f6' },
  { label: 'Other', color: '#64748b' },
]

const expenseCategoryColor = (cat: string) => expenseCategories.find(c => c.label === cat)?.color || '#64748b'
const expenseCategoryIcon  = (cat: string) => {
  const map: Record<string, any> = {
    Overhead: Home, Utilities: Zap, Software: Wifi,
    Supplies: Package, Payroll: Users, Other: ClipboardList
  }
  return map[cat] || ClipboardList
}

const logExpense = () => {
  if (!expenseForm.value.description || !expenseForm.value.amount) return
  expenses.value.push({ ...expenseForm.value, id: Date.now() })
  addExpenseOpen.value = false
  expenseForm.value = { description: '', amount: 0, category: 'Overhead', date: new Date().toISOString().split('T')[0] }
}

const deleteExpense = (id: number) => {
  expenses.value = expenses.value.filter(e => e.id !== id)
}

// ── Utilities ──────────────────────────────────────────────────
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const exportReport = () => {
  const rows = [
    ['NovaOps Accounting Report', '', '', ''],
    ['Period', periodLabel.value, '', ''],
    ['', '', '', ''],
    ['INCOME', '', '', ''],
    ['Total Revenue', formatCurrency(totalRevenue.value), '', ''],
    ['Tax Collected', formatCurrency(totalTax.value), '', ''],
    ['Net Revenue (pre-tax)', formatCurrency(totalRevenue.value - totalTax.value), '', ''],
    ['', '', '', ''],
    ['EXPENSES', '', '', ''],
    ['Parts Cost', formatCurrency(partsCost.value), '', ''],
    ...expenses.value.map(e => [e.description, formatCurrency(e.amount), e.category, formatDate(e.date)]),
    ['Total Expenses', formatCurrency(totalExpenses.value), '', ''],
    ['', '', '', ''],
    ['NET PROFIT / LOSS', formatCurrency(netProfit.value), '', ''],
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `novaops-accounting-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* P&L banner spring */
.m3-pl-banner {
  transition: transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.m3-pl-banner:hover { transform: scale(1.005); }

/* KPI cards spring */
.m3-kpi {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-kpi:hover  { transform: scale(1.04) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.m3-kpi:active { transform: scale(0.96); }

/* Revenue bar hover */
.m3-bar {
  transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.m3-bar:hover { opacity: 0.85; transform: scaleY(1.04); transform-origin: bottom; }

/* Primary button */
.m3-btn-primary {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-btn-primary:hover  { transform: scale(1.05) translateY(-2px); }
.m3-btn-primary:active { transform: scale(0.92); }

/* Input fields */
.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px #8b5cf618; }
</style>
