<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ───────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #3b82f618">
          <Users class="w-5 h-5" style="color: #3b82f6" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Customers</h1>
          <p class="text-xs text-muted-foreground mt-0.5">{{ (customers || []).length }} total customers</p>
        </div>
      </div>
      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
        style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
        @click="newCustomerOpen = true"
      >
        <Plus class="w-4 h-4" /> Add Customer
      </button>
    </div>

    <!-- ── Search ────────────────────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          v-model="searchQuery"
          placeholder="Search by name, phone, or email…"
          class="w-full h-10 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-blue-500/30 text-foreground"
        />
      </div>
      <span v-if="searchQuery" class="text-xs text-muted-foreground">
        {{ filteredCustomers.length }} result{{ filteredCustomers.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- ── Customers Table ───────────────────────────────────────── -->
    <div class="rounded-3xl overflow-hidden bg-card" style="outline: 1px solid hsl(var(--border))">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent border-b" style="background: hsl(var(--muted)/0.3)">
            <TableHead>Customer</TableHead>
            <TableHead class="hidden sm:table-cell">Phone</TableHead>
            <TableHead class="hidden md:table-cell">Email</TableHead>
            <TableHead class="hidden lg:table-cell text-right">Total Spent</TableHead>
            <TableHead class="text-center">Tickets</TableHead>
            <TableHead class="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="customer in filteredCustomers"
            :key="customer.id"
            class="transition-colors border-b border-border/40 last:border-0 hover:bg-muted/20"
          >
            <TableCell>
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #3b82f618">
                  <span class="text-sm font-bold" style="color: #3b82f6">{{ customer.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-sm truncate">{{ customer.name }}</p>
                  <p class="text-xs text-muted-foreground sm:hidden">{{ customer.phone }}</p>
                </div>
              </div>
            </TableCell>
            <TableCell class="hidden sm:table-cell"><span class="text-sm">{{ customer.phone }}</span></TableCell>
            <TableCell class="hidden md:table-cell"><span class="text-sm text-muted-foreground">{{ customer.email || '—' }}</span></TableCell>
            <TableCell class="hidden lg:table-cell text-right"><span class="text-sm font-medium">{{ getCustomerSpend(customer.id) }}</span></TableCell>
            <TableCell class="text-center">
              <span
                class="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full tabular-nums"
                :style="getCustomerTickets(customer.id) > 0 ? 'background: #3b82f618; color: #3b82f6' : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
              >
                {{ getCustomerTickets(customer.id) }}
              </span>
            </TableCell>
            <TableCell>
              <div class="flex gap-1 justify-end">
                <button class="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110" style="background: #3b82f612" @click="viewCustomer(customer)">
                  <Eye class="w-3.5 h-3.5" style="color: #3b82f6" />
                </button>
                <button class="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110" style="background: #ef444412" @click="deleteCustomer(customer.id)">
                  <Trash2 class="w-3.5 h-3.5" style="color: #ef4444" />
                </button>
              </div>
            </TableCell>
          </TableRow>

          <!-- Empty State -->
          <TableRow v-if="filteredCustomers.length === 0">
            <TableCell colspan="6" class="h-48 text-center">
              <div class="flex flex-col items-center justify-center gap-3">
                <div class="w-14 h-14 rounded-3xl flex items-center justify-center" style="background: #3b82f612">
                  <Users class="w-7 h-7" style="color: #3b82f6" />
                </div>
                <p class="text-sm font-medium">{{ searchQuery ? 'No customers match your search' : 'No customers yet' }}</p>
                <p class="text-xs text-muted-foreground">{{ searchQuery ? 'Try a different name, phone, or email.' : 'Add your first customer to get started.' }}</p>
                <button v-if="!searchQuery" class="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold" style="background: #3b82f618; color: #3b82f6" @click="newCustomerOpen = true">
                  <Plus class="w-3.5 h-3.5" /> Add Customer
                </button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- ── New Customer Dialog ───────────────────────────────────── -->
    <Dialog v-model:open="newCustomerOpen">
      <DialogContent class="rounded-3xl p-0 gap-0">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #3b82f608">
          <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #3b82f620">
            <Users class="w-4 h-4" style="color: #3b82f6" />
          </div>
          <div>
            <h2 class="font-semibold text-base">Add New Customer</h2>
            <p class="text-xs text-muted-foreground mt-0.5">Fill in their contact details</p>
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</label>
            <input v-model="newCustomer.name" placeholder="John Doe" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-blue-500/30 text-foreground" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone *</label>
            <input v-model="newCustomer.phone" placeholder="555-0123" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-blue-500/30 text-foreground" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
            <input v-model="newCustomer.email" type="email" placeholder="john@example.com" class="w-full h-11 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-blue-500/30 text-foreground" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</label>
            <Textarea v-model="newCustomer.notes" :rows="3" placeholder="Any relevant notes…" class="rounded-2xl border-0 bg-muted/50 resize-none" />
          </div>
          <div class="flex gap-3 pt-2">
            <button class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-muted/60" style="outline: 1.5px solid hsl(var(--border))" @click="newCustomerOpen = false">Cancel</button>
            <button
              class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              :disabled="saving"
              @click="createCustomer"
            >
              {{ saving ? 'Saving…' : 'Create Customer' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

import type { Customer } from '~/types'
import { Search, Plus, Eye, Trash2, Users } from 'lucide-vue-next'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/table'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'

definePageMeta({
  middleware: ['auth']
})

const appStore = useAppStore()
const { customers, tickets, settings, isLoaded, user } = storeToRefs(appStore)
const { $supabase } = useNuxtApp()

const searchQuery = ref('')
const newCustomerOpen = ref(false)
const saving = ref(false)
const newCustomer = ref({
  name: '',
  phone: '',
  email: '',
  notes: ''
})

const filteredCustomers = computed(() => {
  return (customers.value || []).filter(customer => {
    const query = searchQuery.value.toLowerCase()
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.email.toLowerCase().includes(query)
    )
  })
})

const getCustomerTickets = (customerId: number) => {
  return (tickets.value || []).filter(t => t.customerId === customerId).length
}

const getCustomerSpend = (customerId: number) => {
  const total = (tickets.value || [])
    .filter(t => t.customerId === customerId)
    .reduce((sum, t) => sum + (t.price || 0), 0)
  const currency = settings.value?.currency || '$'
  return `${currency}${total.toFixed(2)}`
}

const createCustomer = async () => {
  if (!newCustomer.value.name || !newCustomer.value.phone) {
    alert('Name and phone are required')
    return
  }

  saving.value = true
  try {
    console.log('[customers] user:', user.value)
    console.log('[customers] supabase:', $supabase)

    if (!user.value?.id) {
      alert('Not logged in — user is null. Please refresh and try again.')
      return
    }

    const { data, error } = await ($supabase as any)
      .from('customers')
      .insert({
        profile_id: user.value.id,
        name: newCustomer.value.name,
        phone: newCustomer.value.phone,
        email: newCustomer.value.email || '',
        notes: newCustomer.value.notes || '',
        tags: []
      })
      .select()
      .single()

    if (error) throw error

    customers.value.unshift(data)
    newCustomerOpen.value = false
    newCustomer.value = { name: '', phone: '', email: '', notes: '' }
  } catch (err: any) {
    alert('Failed to save customer: ' + (err.message || err))
  } finally {
    saving.value = false
  }
}

const viewCustomer = (customer: Customer) => {
  // For now, just show an alert. You could navigate to a detail page later
  alert(`View customer: ${customer.name}`)
}

const deleteCustomer = async (id: number) => {
  const customer = (customers.value || []).find(c => c.id === id)
  if (!customer) return

  if (confirm(`Delete ${customer.name}? This cannot be undone.`)) {
    try {
      const { error } = await ($supabase as any)
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error

      const index = (customers.value || []).findIndex(c => c.id === id)
      if (index > -1) customers.value.splice(index, 1)
    } catch (err: any) {
      alert('Failed to delete customer: ' + (err.message || err))
    }
  }
}
</script>
