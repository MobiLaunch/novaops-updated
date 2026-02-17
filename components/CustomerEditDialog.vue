<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ customer ? 'Edit Customer' : 'New Customer' }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="cust-name">Full Name *</Label>
            <Input id="cust-name" v-model="form.name" placeholder="John Doe" />
          </div>

          <div class="space-y-2">
            <Label for="cust-phone">Phone *</Label>
            <Input id="cust-phone" v-model="form.phone" placeholder="(555) 123-4567" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="cust-email">Email</Label>
          <Input id="cust-email" v-model="form.email" type="email" placeholder="john@example.com" />
        </div>

        <div class="space-y-2">
          <Label for="cust-dl">Driver's License Number</Label>
          <Input id="cust-dl" v-model="form.driversLicense" placeholder="Optional" />
        </div>

        <div class="space-y-2">
          <Label for="cust-address">Address</Label>
          <Textarea id="cust-address" v-model="form.address" :rows="2" placeholder="Street, City, State ZIP" />
        </div>

        <div class="space-y-2">
          <Label for="cust-notes">Notes</Label>
          <Textarea id="cust-notes" v-model="form.notes" :rows="3" placeholder="Additional information..." />
        </div>

        <div class="flex gap-3 pt-4">
          <Button 
            v-if="customer"
            variant="destructive"
            class="flex-1"
            @click="deleteCustomer"
          >
            Delete
          </Button>
          <Button variant="outline" class="flex-1" @click="close">
            Cancel
          </Button>
          <Button class="flex-1" @click="save">
            {{ customer ? 'Update' : 'Create' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Customer } from '~/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

const props = defineProps<{
  customer?: Customer | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [customer: Partial<Customer>]
  'delete': [id: number]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const form = ref({
  name: '',
  phone: '',
  email: '',
  driversLicense: '',
  address: '',
  notes: ''
})

watch(() => props.customer, (customer) => {
  if (customer) {
    form.value = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      driversLicense: customer.driversLicense || '',
      address: customer.address || '',
      notes: customer.notes
    }
  } else {
    form.value = {
      name: '',
      phone: '',
      email: '',
      driversLicense: '',
      address: '',
      notes: ''
    }
  }
}, { immediate: true })

const save = () => {
  if (!form.value.name || !form.value.phone) {
    alert('Name and phone are required')
    return
  }
  
  emit('save', { ...form.value })
  close()
}

const deleteCustomer = () => {
  if (props.customer && confirm(`Delete ${props.customer.name}?`)) {
    emit('delete', props.customer.id)
    close()
  }
}

const close = () => {
  emit('update:open', false)
}
</script>
