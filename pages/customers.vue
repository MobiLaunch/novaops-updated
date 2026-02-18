<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row gap-4 justify-between">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search customers..."
          class="pl-10 h-11"
        />
      </div>
      <Button size="lg" @click="newCustomerOpen = true">
        <Plus class="w-4 h-4 mr-2" />
        Add Customer
      </Button>
    </div>

    <!-- Customers Table -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead class="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="customer in filteredCustomers"
              :key="customer.id"
            >
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="text-sm font-semibold text-primary">
                      {{ customer.name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium">{{ customer.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ customer.email }}</p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <span>{{ customer.phone }}</span>
              </TableCell>

              <TableCell>
                <Badge variant="secondary">
                  {{ getCustomerTickets(customer.id) }}
                </Badge>
              </TableCell>

              <TableCell>
                <div class="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="viewCustomer(customer)"
                  >
                    <Eye class="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="deleteCustomer(customer.id)"
                  >
                    <Trash2 class="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <!-- Empty State -->
            <TableRow v-if="filteredCustomers.length === 0">
              <TableCell colspan="4" class="h-24 text-center">
                <div class="flex flex-col items-center justify-center py-8">
                  <Users class="w-12 h-12 text-muted-foreground opacity-50 mb-2" />
                  <p class="text-muted-foreground">No customers found</p>
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
            />
          </div>
          
          <div class="flex gap-3 pt-4">
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
const { customers, tickets, isLoaded, user } = storeToRefs(appStore)
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

const createCustomer = async () => {
  if (!newCustomer.value.name || !newCustomer.value.phone) {
    alert('Name and phone are required')
    return
  }

  saving.value = true
  try {
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
