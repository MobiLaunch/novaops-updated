<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Customers</h1>
        <p class="text-sm text-muted-foreground mt-0.5">{{ (customers || []).length }} total customers</p>
      </div>
      <Button size="sm" @click="newCustomerOpen = true">
        <Plus class="w-4 h-4 mr-2" />
        Add Customer
      </Button>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search by name, phone, or email..."
          class="pl-9 h-9"
        />
      </div>
      <span v-if="searchQuery" class="text-xs text-muted-foreground">
        {{ filteredCustomers.length }} result{{ filteredCustomers.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Customers Table -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
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
              class="hover:bg-muted/30 transition-colors"
            >
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-semibold text-primary">
                      {{ customer.name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-sm truncate">{{ customer.name }}</p>
                    <!-- Phone shown inline on small screens -->
                    <p class="text-xs text-muted-foreground sm:hidden">{{ customer.phone }}</p>
                  </div>
                </div>
              </TableCell>

              <TableCell class="hidden sm:table-cell">
                <span class="text-sm">{{ customer.phone }}</span>
              </TableCell>

              <TableCell class="hidden md:table-cell">
                <span class="text-sm text-muted-foreground">{{ customer.email || '—' }}</span>
              </TableCell>

              <TableCell class="hidden lg:table-cell text-right">
                <span class="text-sm font-medium">{{ getCustomerSpend(customer.id) }}</span>
              </TableCell>

              <TableCell class="text-center">
                <Badge
                  variant="secondary"
                  class="font-medium tabular-nums"
                  :class="getCustomerTickets(customer.id) > 0 ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''"
                >
                  {{ getCustomerTickets(customer.id) }}
                </Badge>
              </TableCell>

              <TableCell>
                <div class="flex gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="viewCustomer(customer)"
                  >
                    <Eye class="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-destructive"
                    @click="deleteCustomer(customer.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <!-- Empty State -->
            <TableRow v-if="filteredCustomers.length === 0">
              <TableCell colspan="6" class="h-48 text-center">
                <div class="flex flex-col items-center justify-center">
                  <Users class="w-10 h-10 text-muted-foreground opacity-40 mb-3" />
                  <p class="text-sm font-medium mb-1">
                    {{ searchQuery ? 'No customers match your search' : 'No customers yet' }}
                  </p>
                  <p class="text-xs text-muted-foreground mb-4">
                    {{ searchQuery ? 'Try a different name, phone, or email.' : 'Add your first customer to get started.' }}
                  </p>
                  <Button v-if="!searchQuery" size="sm" variant="outline" @click="newCustomerOpen = true">
                    <Plus class="w-3.5 h-3.5 mr-1.5" />Add Customer
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- New Customer Dialog -->
    <Dialog v-model:open="newCustomerOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="name">Name *</Label>
            <Input
              id="name"
              v-model="newCustomer.name"
              placeholder="John Doe"
            />
          </div>

          <div class="space-y-2">
            <Label for="phone">Phone *</Label>
            <Input
              id="phone"
              v-model="newCustomer.phone"
              placeholder="555-0123"
            />
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="newCustomer.email"
              type="email"
              placeholder="john@example.com"
            />
          </div>

          <div class="space-y-2">
            <Label for="notes">Notes</Label>
            <Textarea
              id="notes"
              v-model="newCustomer.notes"
              :rows="3"
              placeholder="Any relevant notes..."
            />
          </div>

          <div class="flex gap-3 pt-2">
            <Button
              variant="outline"
              class="flex-1"
              @click="newCustomerOpen = false"
            >
              Cancel
            </Button>
            <Button
              class="flex-1"
              :disabled="saving"
              @click="createCustomer"
            >
              {{ saving ? 'Saving...' : 'Create Customer' }}
            </Button>
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
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'

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
