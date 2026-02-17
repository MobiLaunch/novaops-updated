<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Reports</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Business performance and analytics
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <Select v-model="dateRange">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 3 Months</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Download class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Total Revenue
          </CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatCurrency(totalRevenue) }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            +20.1% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Avg. Ticket Value
          </CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatCurrency(avgTicketValue) }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            Based on completed tickets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Active Tickets
          </CardTitle>
          <TicketIcon class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ activeTicketsCount }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            Currently in progress
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            Low Stock Alerts
          </CardTitle>
          <AlertTriangle class="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-destructive">{{ lowStockItems.length }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            Items below minimum level
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      
      <Card class="lg:col-span-4">
        <CardHeader>
          <CardTitle>Ticket Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="status in ticketStatusBreakdown" :key="status.name" class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div :class="`w-2 h-2 rounded-full ${status.color}`" />
                  <span class="font-medium">{{ status.name }}</span>
                </div>
                <span class="text-muted-foreground">{{ status.count }} tickets ({{ status.percentage }}%)</span>
              </div>
              <div class="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all" 
                  :class="status.color"
                  :style="{ width: `${status.percentage}%` }" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="(device, index) in topDevices" :key="index" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  <Smartphone class="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p class="text-sm font-medium">{{ device.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ device.count }} repairs</p>
                </div>
              </div>
              <div class="font-medium">
                {{ formatCurrency(device.revenue) }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 text-amber-500" />
            Low Stock Warnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead class="text-right">Stock</TableHead>
                <TableHead class="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in lowStockItems" :key="item.id">
                <TableCell class="font-medium">{{ item.name }}</TableCell>
                <TableCell class="text-right">{{ item.stock }}</TableCell>
                <TableCell class="text-right">
                  <Badge variant="destructive" class="text-xs">Reorder</Badge>
                </TableCell>
              </TableRow>
              <TableRow v-if="lowStockItems.length === 0">
                <TableCell colspan="3" class="text-center text-muted-foreground py-4">
                  All inventory levels are healthy
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Receipt class="h-4 w-4" />
            Recent Quick Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead class="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="sale in recentActivity" :key="sale.id">
                <TableCell>{{ formatDate(sale.date) }}</TableCell>
                <TableCell class="text-muted-foreground text-sm">
                  {{ sale.items?.length || 0 }} items
                </TableCell>
                <TableCell class="text-right font-medium">
                  {{ formatCurrency(sale.amount) }}
                </TableCell>
              </TableRow>
              <TableRow v-if="recentActivity.length === 0">
                <TableCell colspan="3" class="text-center text-muted-foreground py-4">
                  No recent sales found
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import type { Ticket, InventoryItem, QuickSale } from '~/types/models'

import { 
  Download, 
  TrendingUp, 
  DollarSign, 
  Ticket as TicketIcon,
  Receipt,
  Users,
  BarChart3,
  PieChart,
  Smartphone,
  AlertTriangle,
  CheckCircle
} from 'lucide-vue-next'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/table'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { tickets, customers, inventory, quickSales, settings } = storeToRefs(appStore)
const { initializeData } = appStore

onMounted(() => {
  initializeData()
})

const dateRange = ref('30')

const totalRevenue = computed<number>(() => {
  const ticketRev = (tickets.value || []).reduce((sum, ticket) => sum + (ticket.price ?? 0), 0)
  const salesRev = (quickSales.value || []).reduce((sum, sale) => sum + sale.amount, 0)
  return ticketRev + salesRev
})

const activeTicketsCount = computed(() => {
  return (tickets.value || []).filter(t => t.status !== 'Completed' && t.status !== 'Delivered').length
})

const avgTicketValue = computed<number>(() => {
  const closedTickets = (tickets.value || []).filter(t => t.price && t.price > 0)
  if (closedTickets.length === 0) return 0
  const total = closedTickets.reduce((sum, t) => sum + (t.price || 0), 0)
  return total / closedTickets.length
})

const ticketStatusBreakdown = computed(() => {
  const statuses = ['Open', 'In Progress', 'Waiting for Parts', 'Completed', 'Delivered']
  const colors = [
    'bg-blue-500',   // Open
    'bg-yellow-500', // In Progress
    'bg-orange-500', // Waiting
    'bg-emerald-500',// Completed
    'bg-slate-500'   // Delivered
  ]
  
  const total = (tickets.value || []).length
  
  return statuses.map((status, idx) => {
    const count = (tickets.value || []).filter(t => t.status === status).length
    const percentage = total ? Math.round((count / total) * 100) : 0
    return { name: status, count, percentage, color: colors[idx] || 'bg-gray-500' }
  })
})

const topDevices = computed(() => {
  const deviceMap = new Map<string, { count: number; revenue: number }>()
  
  ;(tickets.value || []).forEach(ticket => {
    if (ticket.device) {
      const existing = deviceMap.get(ticket.device) ?? { count: 0, revenue: 0 }
      deviceMap.set(ticket.device, {
        count: existing.count + 1,
        revenue: existing.revenue + (ticket.price ?? 0)
      })
    }
  })
  
  return Array.from(deviceMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const lowStockItems = computed<InventoryItem[]>(() => {
  return (inventory.value || [])
    .filter(item => item.stock <= (item.minStock || 5))
    .slice(0, 5)
})

const recentActivity = computed<QuickSale[]>(() => {
  return [...(quickSales.value || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

const formatCurrency = (amount: number) => {
  return `${settings.value?.currency || '$'}${(amount ?? 0).toFixed(2)}`
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}
</script>