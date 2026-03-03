<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #f97316, #ea580c)">
          <BarChart3 class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Reports</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Business performance and analytics</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex gap-2">
          <button
            v-for="r in dateRanges"
            :key="r.value"
            class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
            :style="dateRange === r.value
              ? 'background: #f9731624; color: #f97316; outline: 2px solid #f9731650; outline-offset: 0'
              : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
            @click="dateRange = r.value"
          >{{ r.label }}</button>
        </div>
        <button class="m3-btn-tonal flex items-center gap-2 h-11 px-5 rounded-full text-sm font-bold" @click="downloadReport">
          <Download class="w-4 h-4" /> Export
        </button>
      </div>
    </div>

    <!-- ── KPI Cards ─────────────────────────────────────────────── -->
    <div class="grid gap-3 grid-cols-2 md:grid-cols-4">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        class="m3-kpi-card rounded-[28px] p-5 flex flex-col gap-3"
        :style="`background: ${kpi.color}12; outline: 2px solid ${kpi.color}28; outline-offset: 0`"
      >
        <div class="flex items-start justify-between">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" :style="`background: ${kpi.color}24`">
            <component :is="kpi.icon" class="w-5 h-5" :style="`color: ${kpi.color}`" />
          </div>
          <span v-if="kpi.change" class="text-[10px] font-black px-2 py-1 rounded-full" :style="`background: ${kpi.changePositive ? '#10b98120' : '#ef444420'}; color: ${kpi.changePositive ? '#10b981' : '#ef4444'}`">
            {{ kpi.changePositive ? '↑' : '↓' }} {{ kpi.change }}
          </span>
        </div>
        <div>
          <p class="text-xs font-semibold text-muted-foreground">{{ kpi.label }}</p>
          <p class="text-2xl font-black" :style="`color: ${kpi.color}`">{{ kpi.value }}</p>
          <p v-if="kpi.sub" class="text-[10px] text-muted-foreground font-semibold mt-0.5">{{ kpi.sub }}</p>
        </div>
      </div>
    </div>

    <!-- ── Revenue by Status ─────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Status breakdown -->
      <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #f97316 20">
            <PieChart class="w-4.5 h-4.5" style="color: #f97316" />
          </div>
          <h3 class="text-sm font-black">Ticket Status Breakdown</h3>
        </div>
        <div class="space-y-3">
          <div
            v-for="stat in statusBreakdown"
            :key="stat.status"
            class="flex items-center gap-3"
          >
            <div class="w-3 h-3 rounded-full flex-shrink-0" :style="`background: ${stat.color}`" />
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold">{{ stat.status }}</span>
                <span class="text-xs font-black" :style="`color: ${stat.color}`">{{ stat.count }}</span>
              </div>
              <div class="h-2 rounded-full overflow-hidden" style="background: hsl(var(--muted)/0.5)">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="`width: ${stat.pct}%; background: ${stat.color}`"
                />
              </div>
            </div>
            <span class="text-[10px] font-bold text-muted-foreground w-10 text-right">{{ stat.pct.toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <!-- Top customers -->
      <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #3b82f620">
            <Trophy class="w-4.5 h-4.5" style="color: #3b82f6" />
          </div>
          <h3 class="text-sm font-black">Top Customers</h3>
        </div>
        <div class="space-y-3">
          <div
            v-for="(cust, i) in topCustomers"
            :key="cust.id"
            class="flex items-center gap-3 p-3 rounded-[20px] transition-all hover:bg-muted/30"
          >
            <span class="text-xs font-black w-5 text-center text-muted-foreground">#{{ i+1 }}</span>
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center font-black text-xs flex-shrink-0" style="background: linear-gradient(135deg, #3b82f620, #2563eb20); color: #3b82f6">
              {{ cust.name?.substring(0,2).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate">{{ cust.name }}</p>
              <p class="text-[10px] text-muted-foreground font-semibold">{{ cust.ticketCount }} ticket{{ cust.ticketCount !== 1 ? 's' : '' }}</p>
            </div>
            <span class="text-sm font-black" style="color: #10b981">{{ formatCurrency(cust.revenue) }}</span>
          </div>
          <div v-if="topCustomers.length === 0" class="text-center py-6 text-xs text-muted-foreground font-semibold">No data yet</div>
        </div>
      </div>
    </div>

    <!-- ── Revenue Timeline ──────────────────────────────────────── -->
    <div class="rounded-[28px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #10b98120">
          <TrendingUp class="w-4.5 h-4.5" style="color: #10b981" />
        </div>
        <h3 class="text-sm font-black">Revenue Over Time</h3>
      </div>
      <div class="space-y-2">
        <div
          v-for="point in revenueTimeline"
          :key="point.label"
          class="flex items-center gap-3"
        >
          <span class="text-[10px] font-semibold text-muted-foreground w-16 flex-shrink-0">{{ point.label }}</span>
          <div class="flex-1 h-7 rounded-full overflow-hidden" style="background: hsl(var(--muted)/0.3)">
            <div
              class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700"
              :style="`width: ${point.pct}%; background: linear-gradient(90deg, #10b981, #059669); min-width: 40px`"
            >
              <span class="text-[10px] font-black text-white">{{ formatCurrency(point.value) }}</span>
            </div>
          </div>
        </div>
        <div v-if="revenueTimeline.length === 0" class="text-center py-6 text-xs text-muted-foreground font-semibold">No revenue data for this period</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { BarChart3, Download, DollarSign, TrendingUp, TicketCheck, Users, PieChart, Trophy } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const tickets   = computed(() => appStore.tickets ?? [])
const customers = computed(() => appStore.customers ?? [])
const settings  = computed(() => appStore.settings ?? { currency: '$' })

const dateRange = ref('30')
const dateRanges = [
  { label: '7d',  value: '7' },
  { label: '30d', value: '30' },
  { label: '3mo', value: '90' },
  { label: '1yr', value: '365' },
]

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`

const filteredTickets = computed(() => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - parseInt(dateRange.value))
  return tickets.value.filter(t => t.createdAt && new Date(t.createdAt) >= cutoff)
})

const totalRevenue  = computed(() => filteredTickets.value.reduce((a, t) => a + (t.price || 0), 0))
const avgTicket     = computed(() => {
  const done = filteredTickets.value.filter(t => t.status === 'Completed' || t.status === 'Delivered')
  return done.length ? done.reduce((a, t) => a + (t.price || 0), 0) / done.length : 0
})
const completedCount = computed(() => filteredTickets.value.filter(t => t.status === 'Completed' || t.status === 'Delivered').length)

const kpiCards = computed(() => [
  { label: 'Total Revenue',    value: formatCurrency(totalRevenue.value),    color: '#10b981', icon: DollarSign,  change: '+20%',  changePositive: true, sub: `${filteredTickets.value.length} tickets` },
  { label: 'Avg Ticket Value', value: formatCurrency(avgTicket.value),       color: '#3b82f6', icon: TrendingUp,  change: null,    changePositive: true, sub: 'Completed only' },
  { label: 'Completed',        value: completedCount.value,                  color: '#8b5cf6', icon: TicketCheck, change: null,    changePositive: true, sub: `of ${filteredTickets.value.length} total` },
  { label: 'Active Customers', value: customers.value.length,                color: '#f97316', icon: Users,       change: null,    changePositive: true, sub: 'Lifetime' },
])

const statusColors: Record<string, string> = {
  'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316',
  'Completed': '#10b981', 'Delivered': '#64748b', 'Closed': '#6366f1'
}

const statusBreakdown = computed(() => {
  const total = filteredTickets.value.length || 1
  const groups: Record<string, number> = {}
  filteredTickets.value.forEach(t => { groups[t.status] = (groups[t.status] || 0) + 1 })
  return Object.entries(groups).map(([status, count]) => ({
    status, count, pct: (count / total) * 100, color: statusColors[status] || '#64748b'
  })).sort((a, b) => b.count - a.count)
})

const topCustomers = computed(() =>
  customers.value.map(c => ({
    ...c,
    ticketCount: tickets.value.filter(t => t.customerId === c.id).length,
    revenue: tickets.value.filter(t => t.customerId === c.id).reduce((a, t) => a + (t.price || 0), 0)
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
)

const revenueTimeline = computed(() => {
  const days = parseInt(dateRange.value)
  const buckets: Array<{label: string; value: number; pct: number}> = []
  const bucketCount = days <= 7 ? days : days <= 30 ? 7 : days <= 90 ? 6 : 12

  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date()
    end.setDate(end.getDate() - Math.floor(i * (days / bucketCount)))
    const start = new Date()
    start.setDate(start.getDate() - Math.floor((i + 1) * (days / bucketCount)))

    const bucketRevenue = tickets.value
      .filter(t => t.createdAt && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end)
      .reduce((a, t) => a + (t.price || 0), 0)

    buckets.push({
      label: end.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: bucketRevenue,
      pct: 0
    })
  }

  const max = Math.max(...buckets.map(b => b.value), 1)
  return buckets.map(b => ({ ...b, pct: Math.max((b.value / max) * 100, 3) }))
})

const downloadReport = () => {
  const rows = [
    ['Date', 'Ticket ID', 'Customer', 'Device', 'Status', 'Amount'],
    ...filteredTickets.value.map(t => [
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      t.id, customers.value.find(c => c.id === t.customerId)?.name || 'Unknown',
      t.device, t.status, t.price
    ])
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `report-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.m3-kpi-card { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
.m3-kpi-card:hover  { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

.m3-btn-tonal {
  background: hsl(var(--muted)/0.7);
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
}
.m3-btn-tonal:hover  { transform: scale(1.04); }
.m3-btn-tonal:active { transform: scale(0.94); }
</style>
