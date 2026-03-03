<template>
  <div class="space-y-2 relative" ref="dropdownContainer">
    <!-- Selected State -->
    <div v-if="selectedValue && !isNewCustomer" class="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check class="w-3 h-3 text-green-500" />
        </div>
        <span class="text-sm font-bold text-green-600 dark:text-green-400">{{ selectedCustomerName }}</span>
      </div>
      <button type="button" class="text-[10px] font-bold text-muted-foreground hover:text-foreground" @click.prevent="clearSelection">CHANGE</button>
    </div>
    
    <!-- Search / Selecting State -->
    <div v-else-if="!isNewCustomer" class="relative">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input 
        v-model="searchText" 
        @focus="showDropdown = true" 
        placeholder="Search customers..." 
        class="w-full h-11 pl-11 pr-20 rounded-[20px] text-sm font-medium bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-indigo-400/50 transition-all" 
      />
      <button 
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-muted text-foreground px-3 py-1.5 rounded-full transition-all hover:bg-muted-foreground/30 shadow-sm" 
        @click.prevent="openNewCustomer"
      >
        + NEW
      </button>

      <!-- Dropdown Results -->
      <div v-if="showDropdown && filteredCustomers.length > 0" class="absolute z-50 w-full mt-1 bg-background border border-border/50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
        <button 
          v-for="c in filteredCustomers" :key="c.id" 
          type="button"
          class="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0" 
          @click.prevent="selectCustomer(c)"
        >
          {{ c.name }} <span class="text-[10px] text-muted-foreground ml-2">{{ c.email || c.phone }}</span>
        </button>
      </div>

      <!-- No Results -->
      <div v-if="showDropdown && filteredCustomers.length === 0" class="absolute z-50 w-full mt-1 bg-background border border-border/50 rounded-xl shadow-xl p-4 text-center">
        <p class="text-sm font-medium text-muted-foreground">No customers match "{{ searchText }}"</p>
        <button type="button" class="mt-2 text-xs font-bold text-indigo-500 hover:text-indigo-400" @click.prevent="openNewCustomer">+ Add as New Customer</button>
      </div>
    </div>

    <!-- New Customer Form -->
    <div v-if="isNewCustomer" class="mt-2 p-5 rounded-[20px] bg-muted/20 border-2 border-border/50 space-y-3 relative group transition-all">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-black uppercase tracking-widest text-indigo-500">Create New Customer</span>
        <button type="button" class="text-[10px] font-bold text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded-md" @click.prevent="cancelNewCustomer">CANCEL</button>
      </div>
      <input v-model="newCustomerForm.name" placeholder="Full Name *" class="w-full h-11 px-4 rounded-[16px] text-sm font-medium bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-indigo-400/50 transition-all" />
      <input v-model="newCustomerForm.email" placeholder="Email Address" type="email" class="w-full h-11 px-4 rounded-[16px] text-sm font-medium bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-indigo-400/50 transition-all" />
      <input v-model="newCustomerForm.phone" placeholder="Phone Number" type="tel" class="w-full h-11 px-4 rounded-[16px] text-sm font-medium bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-indigo-400/50 transition-all" />
      
      <button 
        type="button"
        class="w-full h-11 mt-2 rounded-[16px] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style="background: linear-gradient(135deg, #6366f1, #8b5cf6);"
        :disabled="!newCustomerForm.name || isSaving"
        @click.prevent="saveNewCustomer"
      >
        <div v-if="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <Check v-else class="w-4 h-4" />
        {{ isSaving ? 'Saving...' : 'Save & Select' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Search, Check } from 'lucide-vue-next'
import { useAppStore } from '~/stores/app'
import { useNotifications } from '~/composables/useNotifications'

const props = defineProps<{
  modelValue: number | null
}>()

const emit = defineEmits(['update:modelValue'])

const appStore = useAppStore()
const { addNotification } = useNotifications()

const dropdownContainer = ref(null)
const searchText = ref('')
const showDropdown = ref(false)
const isNewCustomer = ref(false)
const isSaving = ref(false)

const newCustomerForm = ref({ name: '', email: '', phone: '' })

// Automatically close dropdown when clicking outside
onClickOutside(dropdownContainer, () => {
  showDropdown.value = false
})

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const customers = computed(() => appStore.customers || [])

const selectedCustomerName = computed(() => {
  if (!selectedValue.value) return ''
  return customers.value.find((c: any) => c.id === selectedValue.value)?.name || 'Unknown Customer'
})

const filteredCustomers = computed(() => {
  const q = searchText.value.toLowerCase().trim()
  if (!q) return customers.value.slice(0, 8)
  return customers.value.filter((c: any) => 
    c.name?.toLowerCase().includes(q) || 
    c.email?.toLowerCase().includes(q) || 
    c.phone?.includes(q)
  ).slice(0, 15) // Limit results for performance
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
  // Pre-fill name if user already typed something
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
    addNotification('Customer Created', `${newCust.name} has been added.`, 'success')
    selectCustomer(newCust) // Select it automatically
  } catch (err: any) {
    addNotification('Error', err.message || 'Failed to create customer', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>
