<template>
  <v-dialog
    v-model="isOpen"
    max-width="550"
  >
    <v-card class="rounded-xl">
      <v-card-item class="pb-3 border-b">
        <div class="flex items-center gap-3">
          <div 
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :class="customer ? 'bg-blue-500/10 text-blue-500' : 'bg-indigo-500/10 text-indigo-500'"
          >
            <i class="mdi text-lg" :class="customer ? 'mdi-pencil' : 'mdi-account-plus-outline'"></i>
          </div>
          <div>
            <div class="text-sm font-black text-foreground">{{ customer ? 'Edit Customer' : 'New Customer' }}</div>
            <div class="text-[10px] text-muted-foreground mt-0.5">{{ customer ? `Editing ${customer.name}` : 'Add a customer to your shop' }}</div>
          </div>
        </div>
      </v-card-item>

      <v-card-text class="pt-4 pb-4">
        <div class="flex flex-col gap-4">
          <!-- Validation alert -->
          <div 
            v-if="validationMsg" 
            class="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-xs flex justify-between items-center"
          >
            <span>{{ validationMsg }}</span>
            <button @click="validationMsg = ''"><i class="mdi mdi-close"></i></button>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Full Name *</label>
              <v-text-field v-model="form.name" placeholder="Jane Smith" hide-details class="w-full rounded-xl text-xs" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Phone</label>
                <v-text-field v-model="form.phone" placeholder="(555) 123-4567" hide-details class="w-full rounded-xl text-xs" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Email</label>
                <v-text-field v-model="form.email" type="email" placeholder="jane@email.com" hide-details class="w-full rounded-xl text-xs" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Driver's License</label>
                <v-text-field v-model="form.driversLicense" placeholder="Optional" hide-details class="w-full rounded-xl text-xs" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Address</label>
                <v-text-field v-model="form.address" placeholder="Street, City, State ZIP" hide-details class="w-full rounded-xl text-xs" />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Notes</label>
              <v-textarea v-model="form.notes" rows="2" auto-grow placeholder="Additional information…" hide-details class="w-full rounded-xl text-xs" />
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 py-4 border-t border-border/60 justify-space-between">
        <div>
          <v-btn 
            v-if="customer" 
            color="error" 
            variant="tonal" 
            class="rounded-full text-xs font-bold text-none" 
            @click="deleteConfirmOpen = true" 
          >
            Delete
          </v-btn>
        </div>
        <div class="flex items-center gap-2">
          <v-btn 
            variant="text" 
            color="secondary" 
            class="rounded-full text-xs font-bold text-none" 
            @click="close" 
          >
            Cancel
          </v-btn>
          <v-btn 
            color="primary" 
            class="rounded-full text-xs font-bold text-none text-white px-5" 
            @click="save" 
          >
            {{ customer ? 'Save Changes' : 'Add Customer' }}
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete confirmation -->
  <v-dialog
    v-model="deleteConfirmOpen"
    max-width="400"
  >
    <v-card class="rounded-xl">
      <v-card-title class="text-sm font-black pt-4 px-6">Delete Customer</v-card-title>
      <v-card-text class="py-2 px-6">
        <p class="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to permanently remove <span class="font-bold text-foreground">{{ customer?.name }}</span>? This action cannot be undone.
        </p>
      </v-card-text>
      <v-card-actions class="px-6 pb-4 pt-2 justify-end">
        <v-btn 
          variant="text" 
          color="secondary" 
          class="rounded-full text-xs font-bold text-none" 
          @click="deleteConfirmOpen = false" 
        >
          Cancel
        </v-btn>
        <v-btn 
          color="error" 
          class="rounded-full text-xs font-bold text-none text-white" 
          @click="confirmDelete" 
        >
          Delete Customer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
