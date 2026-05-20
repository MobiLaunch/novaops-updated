<template>
  <div ref="dropdownContainer" class="relative">
    <!-- Selected State -->
    <div
      v-if="selectedValue && !isNewCustomer"
      class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-300 rounded-xl flex items-center justify-between"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
          <i class="mdi mdi-check text-xs"></i>
        </div>
        <span class="text-xs font-bold truncate">{{ selectedCustomerName }}</span>
      </div>
      <Button
        label="CHANGE"
        variant="text"
        severity="secondary"
        class="text-[10px] font-bold text-none shrink-0"
        @click.prevent="clearSelection"
      />
    </div>

    <!-- Search / Selecting State -->
    <div v-else-if="!isNewCustomer" class="relative w-full">
      <div class="relative flex items-center w-full">
        <i class="mdi mdi-magnify absolute left-3.5 text-muted-foreground text-base"></i>
        <InputText
          v-model="searchText"
          placeholder="Search customers..."
          class="w-full pl-9 pr-16 rounded-xl text-xs py-2.5"
          @focus="showDropdown = true"
        />
        <Button
          label="+ NEW"
          severity="secondary"
          class="absolute right-2 text-[10px] font-bold px-2 py-0.5 h-7 text-none"
          @click.stop.prevent="openNewCustomer"
        />
      </div>

      <div
        v-if="showDropdown && filteredCustomers.length > 0"
        class="absolute left-0 right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-xl overflow-y-auto max-h-48 z-50 divide-y divide-border/50"
      >
        <button
          v-for="c in filteredCustomers"
          :key="c.id"
          class="w-full text-left px-4 py-2.5 hover:bg-muted/70 transition-colors flex flex-col gap-0.5"
          @click.prevent="selectCustomer(c)"
        >
          <span class="text-xs font-bold text-foreground leading-tight">{{ c.name }}</span>
          <span v-if="c.email || c.phone" class="text-[10px] text-muted-foreground font-medium mt-0.5">
            {{ c.email || c.phone }}
          </span>
        </button>
      </div>

      <div
        v-if="showDropdown && filteredCustomers.length === 0"
        class="absolute left-0 right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-xl p-4 text-center z-50 flex flex-col items-center gap-2"
      >
        <p class="text-xs text-muted-foreground font-medium">
          No customers match "{{ searchText }}"
        </p>
        <Button
          label="+ Add as New Customer"
          variant="text"
          severity="primary"
          class="text-xs text-none font-bold mt-1"
          @click.prevent="openNewCustomer"
        />
      </div>
    </div>

    <!-- New Customer Form -->
    <div
      v-if="isNewCustomer"
      class="mt-2 p-4 bg-surface border border-border rounded-xl flex flex-col gap-3"
    >
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] font-black text-primary uppercase tracking-wider">
          Create New Customer
        </span>
        <Button
          label="CANCEL"
          variant="text"
          severity="secondary"
          class="text-[10px] font-bold text-none"
          @click.prevent="cancelNewCustomer"
        />
      </div>
      <div class="flex flex-col gap-3">
        <InputText
          v-model="newCustomerForm.name"
          placeholder="Full Name *"
          class="w-full rounded-xl text-xs py-2"
        />
        <InputText
          v-model="newCustomerForm.email"
          placeholder="Email Address"
          type="email"
          class="w-full rounded-xl text-xs py-2"
        />
        <InputText
          v-model="newCustomerForm.phone"
          placeholder="Phone Number"
          type="tel"
          class="w-full rounded-xl text-xs py-2"
          @input="newCustomerForm.phone = formatPhone(newCustomerForm.phone)"
        />
        <Button
          severity="primary"
          class="w-full rounded-xl text-xs font-bold py-2.5 text-none text-white flex items-center justify-center gap-2"
          style="background: linear-gradient(135deg, #6366f1, #8b5cf6)"
          :disabled="!newCustomerForm.name || isSaving"
          @click.prevent="saveNewCustomer"
        >
          <i v-if="isSaving" class="mdi mdi-loading animate-spin text-sm"></i>
          <i v-else class="mdi mdi-check text-sm"></i>
          {{ isSaving ? 'Saving...' : 'Save & Select' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import { formatPhoneNumber as formatPhone } from '~/utils/phone'

const props = defineProps<{
  modelValue: number | null
}>()

const emit = defineEmits(['update:modelValue'])

const appStore = useAppStore()
const { toast } = useToast()

const dropdownContainer = ref<HTMLElement | null>(null)
const searchText = ref('')

const showDropdown = ref(false)
const isNewCustomer = ref(false)
const isSaving = ref(false)

const newCustomerForm = ref({ name: '', email: '', phone: '' })

onClickOutside(dropdownContainer, () => {
  showDropdown.value = false
})

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const customers = computed(() => appStore.customers || [])

const selectedCustomerName = computed(() => {
  if (!selectedValue.value) return ''
  return customers.value.find((c: any) => c.id === selectedValue.value)?.name || 'Unknown Customer'
})

const filteredCustomers = computed(() => {
  const q = searchText.value.toLowerCase().trim()
  if (!q) return customers.value.slice(0, 8)
  return customers.value
    .filter(
      (c: any) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    )
    .slice(0, 15)
})

const selectCustomer = (customer: any) => {
  selectedValue.value = customer.id
  showDropdown.value = false
  searchText.value = ''
  isNewCustomer.value = false
}

const clearSelection = () => {
  selectedValue.value = null
  searchText.value = ''
  showDropdown.value = false
}

const openNewCustomer = () => {
  isNewCustomer.value = true
  showDropdown.value = false
  if (searchText.value) {
    if (searchText.value.includes('@')) {
      newCustomerForm.value.email = searchText.value
    } else if (/^[\d.-]+$/.test(searchText.value.replace(/\s/g, ''))) {
      newCustomerForm.value.phone = searchText.value
    } else {
      newCustomerForm.value.name = searchText.value
    }
  } else {
    newCustomerForm.value = { name: '', email: '', phone: '' }
  }
}

const cancelNewCustomer = () => {
  isNewCustomer.value = false
  newCustomerForm.value = { name: '', email: '', phone: '' }
}

const saveNewCustomer = async () => {
  if (!newCustomerForm.value.name) return

  isSaving.value = true
  try {
    const newCust = await appStore.createCustomer({ ...newCustomerForm.value })
    toast.success('Customer Created', `${newCust.name} has been added.`)
    selectCustomer(newCust)
  } catch (err: any) {
    toast.danger('Error', err.message || 'Failed to create customer')
  } finally {
    isSaving.value = false
  }
}
</script>
