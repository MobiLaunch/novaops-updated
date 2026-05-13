<template>
  <div ref="dropdownContainer">
    <!-- Selected State -->
    <v-card
      v-if="selectedValue && !isNewCustomer"
      variant="tonal"
      color="success"
      rounded="xl"
      class="pa-3"
    >
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-avatar size="24" color="success" variant="tonal">
            <v-icon icon="mdi-check" size="14" />
          </v-avatar>
          <span class="text-body-2 font-weight-bold">{{ selectedCustomerName }}</span>
        </div>
        <v-btn
          variant="text"
          size="x-small"
          class="text-10 font-weight-black text-medium-emphasis"
          @click.prevent="clearSelection"
        >
          CHANGE
        </v-btn>
      </div>
    </v-card>

    <!-- Search / Selecting State -->
    <div v-else-if="!isNewCustomer" class="position-relative">
      <v-text-field
        v-model="searchText"
        class="customer-select-search"
        placeholder="Search customers..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        single-line
        rounded="xl"
        @focus="showDropdown = true"
      >
        <template #append-inner>
          <v-btn
            size="x-small"
            variant="tonal"
            class="font-weight-black text-10"
            @click.stop.prevent="openNewCustomer"
          >
            + NEW
          </v-btn>
        </template>
      </v-text-field>

      <v-card
        v-if="showDropdown && filteredCustomers.length > 0"
        variant="outlined"
        rounded="lg"
        elevation="4"
        class="position-absolute w-100 mt-1 overflow-y-auto"
        style="z-index: 12; max-height: 12rem"
      >
        <v-list density="compact" class="pa-0">
          <v-list-item
            v-for="c in filteredCustomers"
            :key="c.id"
            :title="c.name"
            :subtitle="c.email || c.phone || undefined"
            @click.prevent="selectCustomer(c)"
          />
        </v-list>
      </v-card>

      <v-card
        v-if="showDropdown && filteredCustomers.length === 0"
        variant="outlined"
        rounded="lg"
        elevation="4"
        class="position-absolute w-100 mt-1 pa-4 text-center"
        style="z-index: 12"
      >
        <p class="text-body-2 font-weight-medium text-medium-emphasis">
          No customers match "{{ searchText }}"
        </p>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          class="font-weight-black mt-2"
          @click.prevent="openNewCustomer"
        >
          + Add as New Customer
        </v-btn>
      </v-card>
    </div>

    <!-- New Customer Form -->
    <v-card
      v-if="isNewCustomer"
      variant="outlined"
      rounded="xl"
      class="mt-2 pa-4"
    >
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-caption font-black text-uppercase text-primary" style="letter-spacing: 0.08em">
          Create New Customer
        </span>
        <v-btn
          variant="tonal"
          size="x-small"
          class="text-10 font-weight-black text-medium-emphasis"
          @click.prevent="cancelNewCustomer"
        >
          CANCEL
        </v-btn>
      </div>
      <div class="d-flex flex-column gap-3">
        <v-text-field
          v-model="newCustomerForm.name"
          placeholder="Full Name *"
          variant="outlined"
          density="comfortable"
          hide-details
          rounded="lg"
        />
        <v-text-field
          v-model="newCustomerForm.email"
          placeholder="Email Address"
          type="email"
          variant="outlined"
          density="comfortable"
          hide-details
          rounded="lg"
        />
        <v-text-field
          v-model="newCustomerForm.phone"
          placeholder="Phone Number"
          type="tel"
          variant="outlined"
          density="comfortable"
          hide-details
          rounded="lg"
        />
        <v-btn
          variant="flat"
          size="large"
          rounded="lg"
          class="font-weight-black mt-1 text-white"
          style="background: linear-gradient(135deg, #6366f1, #8b5cf6)"
          :disabled="!newCustomerForm.name || isSaving"
          @click.prevent="saveNewCustomer"
        >
          <v-progress-circular v-if="isSaving" indeterminate size="18" width="2" class="mr-2" color="white" />
          <v-icon v-else icon="mdi-check" start />
          {{ isSaving ? 'Saving...' : 'Save & Select' }}
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'

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
