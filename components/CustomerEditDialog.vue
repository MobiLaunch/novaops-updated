<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :draggable="false"
    class="w-full max-w-[550px] mx-4"
    :show-header="true"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div 
          class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          :class="customer ? 'bg-blue-500/10 text-blue-500' : 'bg-indigo-500/10 text-indigo-500'"
        >
          <i class="mdi mdi-text-lg" :class="customer ? 'mdi-pencil' : 'mdi-account-plus-outline'"></i>
        </div>
        <div>
          <span class="text-sm font-black block">{{ customer ? 'Edit Customer' : 'New Customer' }}</span>
          <span class="text-[10px] text-muted-foreground block mt-0.5">{{ customer ? `Editing ${customer.name}` : 'Add a customer to your shop' }}</span>
        </div>
      </div>
    </template>

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
          <InputText v-model="form.name" placeholder="Jane Smith" class="w-full rounded-xl text-xs py-2" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Phone</label>
            <InputText v-model="form.phone" placeholder="(555) 123-4567" class="w-full rounded-xl text-xs py-2" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Email</label>
            <InputText v-model="form.email" type="email" placeholder="jane@email.com" class="w-full rounded-xl text-xs py-2" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Driver's License</label>
            <InputText v-model="form.driversLicense" placeholder="Optional" class="w-full rounded-xl text-xs py-2" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Address</label>
            <InputText v-model="form.address" placeholder="Street, City, State ZIP" class="w-full rounded-xl text-xs py-2" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Notes</label>
          <Textarea v-model="form.notes" rows="2" autoResize placeholder="Additional information…" class="w-full rounded-xl text-xs py-2" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between mt-2 pt-4 border-t border-border/60">
        <div>
          <Button 
            v-slot="{}"
            v-if="customer" 
            label="Delete" 
            severity="danger" 
            variant="tonal" 
            class="rounded-full text-xs font-bold text-none" 
            @click="deleteConfirmOpen = true" 
          />
        </div>
        <div class="flex items-center gap-2">
          <Button 
            label="Cancel" 
            variant="text" 
            severity="secondary" 
            class="rounded-full text-xs font-bold text-none" 
            @click="close" 
          />
          <Button 
            :label="customer ? 'Save Changes' : 'Add Customer'" 
            severity="primary" 
            class="rounded-full text-xs font-bold text-none text-white px-5" 
            @click="save" 
          />
        </div>
      </div>
    </div>
  </Dialog>

  <!-- Delete confirmation -->
  <Dialog
    v-model:visible="deleteConfirmOpen"
    header="Delete Customer"
    modal
    :draggable="false"
    class="w-full max-w-[400px] mx-4"
  >
    <div class="flex flex-col gap-4">
      <p class="text-xs text-muted-foreground leading-relaxed">
        Are you sure you want to permanently remove <span class="font-bold text-foreground">{{ customer?.name }}</span>? This action cannot be undone.
      </p>
      <div class="flex justify-end gap-2 mt-2">
        <Button 
          label="Cancel" 
          variant="text" 
          severity="secondary" 
          class="rounded-full text-xs font-bold text-none" 
          @click="deleteConfirmOpen = false" 
        />
        <Button 
          label="Delete Customer" 
          severity="danger" 
          class="rounded-full text-xs font-bold text-none text-white" 
          @click="confirmDelete" 
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
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
