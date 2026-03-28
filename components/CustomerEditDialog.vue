<template>
  <v-dialog v-model="isOpen" max-width="800" scrollable>
    <v-card rounded="xl" style="max-height:90vh;overflow-y:auto">

      <!-- Header -->
      <v-card-item class="border-b">
        <template #prepend>
          <v-avatar :color="customer ? 'info' : 'primary'" size="44" rounded="lg">
            <component :is="customer ? Pencil : UserPlus" :size="20" color="white" />
          </v-avatar>
        </template>
        <v-card-title class="text-h6 font-weight-black">{{ customer ? 'Edit Customer' : 'New Customer' }}</v-card-title>
        <v-card-subtitle>{{ customer ? `Editing ${customer.name}` : 'Add a customer to your shop' }}</v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <!-- Validation alert -->
        <v-alert
          v-if="validationMsg"
          type="warning"
          :text="validationMsg"
          closable
          class="mb-4"
          @click:close="validationMsg = ''"
        />

        <v-row dense>
          <v-col cols="12">
            <v-text-field v-model="form.name" label="Full Name *" placeholder="Jane Smith" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.phone" label="Phone" placeholder="(555) 123-4567" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.email" label="Email" type="email" placeholder="jane@email.com" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.driversLicense" label="Driver's License" placeholder="Optional" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.address" label="Address" placeholder="Street, City, State ZIP" />
          </v-col>
          <v-col cols="12">
            <v-textarea v-model="form.notes" label="Notes" rows="2" placeholder="Additional information…" />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4 flex-wrap gap-2">
        <v-btn v-if="customer" color="error" variant="tonal" @click="deleteConfirmOpen = true">Delete</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save">{{ customer ? 'Save Changes' : 'Add Customer' }}</v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>

  <!-- Delete confirmation -->
  <v-dialog v-model="deleteConfirmOpen" max-width="400">
    <v-card rounded="xl">
      <v-card-title class="text-h6">Delete {{ customer?.name }}?</v-card-title>
      <v-card-text>This will permanently remove the customer and cannot be undone.</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteConfirmOpen = false">Cancel</v-btn>
        <v-btn color="error" @click="confirmDelete">Delete Customer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, UserPlus } from 'lucide-vue-next'
import type { Customer } from '~/types'

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

const form = ref({ name: '', phone: '', email: '', driversLicense: '', address: '', notes: '' })
const deleteConfirmOpen = ref(false)
const validationMsg = ref('')

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
    form.value = { name: '', phone: '', email: '', driversLicense: '', address: '', notes: '' }
  }
}, { immediate: true })

const save = () => {
  if (!form.value.name.trim()) {
    validationMsg.value = 'Please enter a customer name'
    return
  }
  emit('save', { ...form.value })
  close()
}

const confirmDelete = () => {
  if (props.customer) {
    emit('delete', props.customer.id)
    close()
  }
}

const close = () => emit('update:open', false)
</script>
