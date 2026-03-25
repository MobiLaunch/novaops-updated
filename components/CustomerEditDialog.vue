<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">

      <!-- Header -->
      <div class="flex items-center gap-4 px-7 pt-7 pb-5 border-b border-border/50">
        <div class="w-11 h-11 rounded-[22px] flex items-center justify-center flex-shrink-0 shadow-md"
          style="background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 16px #3b82f640">
          <component :is="customer ? Pencil : UserPlus" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 class="text-base font-black">{{ customer ? 'Edit Customer' : 'New Customer' }}</h2>
          <p class="text-xs text-muted-foreground font-medium mt-0.5">
            {{ customer ? `Editing ${customer.name}` : 'Add a customer to your shop' }}
          </p>
        </div>
      </div>

      <div class="p-7 space-y-5">

        <!-- Validation alert -->
        <AppAlert
          v-if="validationMsg"
          status="warning"
          :title="validationMsg"
          :inline="true"
          :dismissible="true"
          @dismiss="validationMsg = ''"
        />

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 space-y-2">
            <label class="m3-label">Full Name *</label>
            <input v-model="form.name" placeholder="Jane Smith" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Phone</label>
            <input v-model="form.phone" placeholder="(555) 123-4567" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Email</label>
            <input v-model="form.email" type="email" placeholder="jane@email.com" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Driver's License</label>
            <input v-model="form.driversLicense" placeholder="Optional" class="m3-input" />
          </div>
          <div class="space-y-2">
            <label class="m3-label">Address</label>
            <input v-model="form.address" placeholder="Street, City, State ZIP" class="m3-input" />
          </div>
          <div class="col-span-2 space-y-2">
            <label class="m3-label">Notes</label>
            <textarea v-model="form.notes" rows="2" placeholder="Additional information…" class="m3-textarea" />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button v-if="customer"
            class="h-12 px-5 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95"
            style="background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 14px #ef444430"
            @click="deleteConfirmOpen = true">
            Delete
          </button>
          <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:bg-muted/60 hover:scale-[1.03] active:scale-95"
            style="outline: 2px solid hsl(var(--border)); outline-offset: 0"
            @click="close">Cancel</button>
          <button class="flex-1 h-12 rounded-full text-sm font-black text-white transition-all hover:scale-[1.04] hover:-translate-y-0.5 active:scale-95"
            style="background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 16px #3b82f640"
            @click="save">{{ customer ? 'Save Changes' : 'Add Customer' }}</button>
        </div>

      </div>
    </DialogContent>
  </Dialog>

  <!-- Delete confirmation -->
  <AlertDialog
    :open="deleteConfirmOpen"
    :heading="`Delete ${customer?.name}?`"
    body="This will permanently remove the customer and cannot be undone."
    status="danger"
    confirm-label="Delete Customer"
    @update:open="v => { if (!v) deleteConfirmOpen = false }"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, UserPlus } from 'lucide-vue-next'
import type { Customer } from '~/types'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import AlertDialog from '~/components/ui/AlertDialog.vue'
import AppAlert from '~/components/ui/AppAlert.vue'

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

<style scoped>
.m3-label {
  display: block;
  font-size: 10px;
  font-weight: 800;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
}
.m3-input {
  width: 100%;
  height: 48px;
  padding: 0 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.7);
  color: hsl(var(--foreground));
  outline: none;
  transition: all 0.2s ease;
}
.m3-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px #3b82f618; background: hsl(var(--background)); }
.m3-textarea {
  width: 100%;
  padding: 14px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.7);
  color: hsl(var(--foreground));
  outline: none;
  resize: none;
  transition: all 0.2s ease;
  height: auto;
}
.m3-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px #3b82f618; background: hsl(var(--background)); }
</style>
