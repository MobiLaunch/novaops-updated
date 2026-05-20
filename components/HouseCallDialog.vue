<template>
  <v-dialog v-model="isOpen" max-width="720" scrollable>
    <v-card>
      <v-card-item class="border-b">
        <template #prepend>
          <v-avatar color="success" size="40" rounded="lg">
            <i class="mdi mdi-map-marker"></i>
          </v-avatar>
        </template>
        <v-card-title>{{ isEditing ? 'Edit House Call' : 'Schedule House Call' }}</v-card-title>
        <v-card-subtitle>On-site repair appointment</v-card-subtitle>
        <template #append>
          <v-btn icon="mdi-close" variant="text" @click="isOpen = false" />
        </template>
      </v-card-item>

      <v-card-text class="pa-6">
        <v-row>
          <!-- Left: form fields -->
          <v-col cols="12" md="6">
            <div class="d-flex flex-column gap-4">
              <CustomerSelect v-model="form.customerId" />

              <!-- Address with autocomplete -->
              <div class="position-relative">
                <v-text-field
                  v-model="form.address"
                  label="Address"
                  placeholder="123 Main St, City, State"
                  @input="onAddressInput"
                >
                  <template #append-inner>
                    <v-btn icon="mdi-navigation" size="x-small" variant="text" color="info" @click="openMaps" />
                  </template>
                </v-text-field>
                <v-list v-if="showSuggestions && addressSuggestions.length" class="position-absolute elevation-4 rounded-lg" style="z-index:100;top:100%;left:0;right:0;max-height:180px;overflow-y:auto">
                  <v-list-item
                    v-for="sug in addressSuggestions"
                    :key="sug.place_id"
                    :title="sug.display_name"
                    density="compact"
                    @click="selectSuggestion(sug)"
                  />
                </v-list>
              </div>

              <v-row dense>
                <v-col cols="6">
                  <v-text-field v-model="form.date" label="Date" type="date" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="form.time" label="Time" type="time" />
                </v-col>
              </v-row>

              <v-textarea v-model="form.issue" label="Issue / Description" rows="3" />

              <v-select
                v-if="isEditing"
                v-model="form.status"
                label="Status"
                :items="['Scheduled','In Progress','Completed','Cancelled']"
              />

              <v-card color="success" variant="tonal" rounded="lg" class="pa-3">
                <div class="d-flex align-center justify-space-between">
                  <span class="text-caption font-weight-black text-uppercase">Call Estimate</span>
                  <span class="text-h6 font-weight-black text-success">${{ estimate.toFixed(2) }}</span>
                </div>
              </v-card>
            </div>
          </v-col>

          <!-- Right: map + calculator -->
          <v-col cols="12" md="6">
            <div class="d-flex flex-column gap-4">
              <!-- Map preview -->
              <div>
                <p class="text-caption font-weight-bold text-medium-emphasis mb-2">Location Preview</p>
                <div class="rounded-lg overflow-hidden" style="height:160px">
                  <iframe v-if="mapsUrl" :src="mapsUrl" width="100%" height="100%" style="border:0" />
                  <div v-else class="d-flex align-center justify-center h-100 text-medium-emphasis" style="background:rgba(0,0,0,0.04)">
                    <div class="text-center">
                      <i class="mdi mdi-map"></i>
                      <p class="text-caption mt-1">Enter address to preview</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Calculator -->
              <v-card variant="tonal" rounded="lg" class="pa-4">
                <p class="text-caption font-weight-black text-uppercase mb-3">
                  <i class="mdi mdi-calculator"></i> Job Calculator
                </p>
                <v-row dense>
                  <v-col cols="6">
                    <v-text-field v-model.number="calc.labor"   label="Labor ($)"   type="number" density="compact" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model.number="calc.parts"   label="Parts ($)"   type="number" density="compact" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model.number="calc.travel"  label="Travel ($)"  type="number" density="compact" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model.number="calc.taxRate" label="Tax (%)"     type="number" density="compact" />
                  </v-col>
                </v-row>
                <v-divider class="my-2" />
                <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                  <span>Subtotal</span><span>${{ calcSubtotal.toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                  <span>Tax</span><span>${{ calcTax.toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-space-between text-body-2 font-weight-black text-success mt-1">
                  <span>Total</span><span>${{ calcTotal.toFixed(2) }}</span>
                </div>
                <v-btn color="success" variant="tonal" size="small" block class="mt-3" @click="applyCalcEstimate">
                  Apply as Estimate
                </v-btn>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-btn v-if="isEditing" variant="outlined" prepend-icon="mdi-printer" @click="printCurrentHousecall">
          Print
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Cancel</v-btn>
        <v-btn color="success" :loading="saving" @click="saveHousecall">
          {{ isEditing ? 'Save Changes' : 'Schedule' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import { useToast } from '~/composables/useToast'
import { printHousecall } from '~/utils/print'
import CustomerSelect from '~/components/CustomerSelect.vue'

const props = defineProps<{
  modelValue: boolean
  editingCall?: any | null
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const appStore = useAppStore()
const { customers, settings } = storeToRefs(appStore)
const { toast } = useToast()
const { sendHousecallEmail, sendInternalAlert } = useEmailNotifications()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEditing = computed(() => !!props.editingCall)
const saving = ref(false)

const form = ref({ customerId: null as any, address: '', date: '', time: '', issue: '', status: 'Scheduled' })
const calc = ref({ labor: 0, parts: 0, travel: 0, taxRate: 0 })
const estimate = ref(0)

const addressSuggestions = ref<any[]>([])
const showSuggestions = ref(false)
const mapsUrl = ref('')
const latLonCache = ref<Record<string, any>>({})

onMounted(() => {
  try { latLonCache.value = JSON.parse(localStorage.getItem('osm_cache') || '{}') } catch {}
})

watch(isOpen, (val) => {
  if (val) {
    if (props.editingCall) {
      form.value = { ...props.editingCall }
    } else {
      form.value = { customerId: null, address: '', date: '', time: '', issue: '', status: 'Scheduled' }
    }
    calc.value = { labor: 0, parts: 0, travel: 0, taxRate: 0 }
    estimate.value = 0
    mapsUrl.value = ''
    addressSuggestions.value = []
    showSuggestions.value = false
    if (form.value.address) {
      // try to pre-load map preview if cache exists
      const cached = latLonCache.value[form.value.address]
      if (cached && !cached.notfound) {
        const [lat1, lat2, lon1, lon2] = cached.boundingbox || []
        if (lat1) {
          mapsUrl.value = `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${cached.lat}%2C${cached.lon}`
        }
      }
    }
  }
})

const calcSubtotal = computed(() => (calc.value.labor || 0) + (calc.value.parts || 0) + (calc.value.travel || 0))
const calcTax      = computed(() => calcSubtotal.value * ((calc.value.taxRate || 0) / 100))
const calcTotal    = computed(() => calcSubtotal.value + calcTax.value)
const applyCalcEstimate = () => { estimate.value = calcTotal.value }

let mapsTimer: ReturnType<typeof setTimeout> | null = null
const onAddressInput = () => {
  if (mapsTimer) clearTimeout(mapsTimer)
  mapsTimer = setTimeout(async () => {
    const q = form.value.address?.trim()
    if (!q || q.length < 4) { addressSuggestions.value = []; showSuggestions.value = false; mapsUrl.value = ''; return }
    const cached = latLonCache.value[q]
    if (cached && !cached.notfound) { selectSuggestion(cached, true); return }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=us,ca`)
      const data = await res.json()
      addressSuggestions.value = data
      showSuggestions.value = data.length > 0
    } catch {}
  }, 600)
}

const openMaps = () => {
  const addr = form.value.address?.trim()
  if (addr) window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(addr)}`, '_blank')
}

const selectSuggestion = (pt: any, fromCache = false) => {
  if (!fromCache) form.value.address = pt.display_name
  showSuggestions.value = false
  if (pt.boundingbox) {
    const [lat1, lat2, lon1, lon2] = pt.boundingbox
    mapsUrl.value = `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${pt.lat}%2C${pt.lon}`
    latLonCache.value[form.value.address] = { lat: pt.lat, lon: pt.lon, boundingbox: pt.boundingbox }
    try { localStorage.setItem('osm_cache', JSON.stringify(latLonCache.value)) } catch {}
  }
}

const getCustomerName = (id: number) => customers.value.find((c: any) => c.id === id)?.name || 'Unknown'
const getCustomerPhone = (id: number) => customers.value.find((c: any) => c.id === id)?.phone || ''
const formatDate = (d?: string) => d ? new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const saveHousecall = async () => {
  if (saving.value) return
  saving.value = true
  try {
    const isNew = !isEditing.value
    if (isEditing.value) {
      await appStore.updateHouseCall(props.editingCall.id, { ...form.value })
    } else {
      await appStore.createHouseCall({ ...form.value, status: 'Scheduled' })
    }
    toast.success('Saved', isNew ? 'House call scheduled' : 'House call updated')
    if (isNew) {
      sendHousecallEmail(form.value).catch(() => {})
      sendInternalAlert({
        eventType: 'House Call',
        eventSummary: 'New house call scheduled',
        customerName: getCustomerName(form.value.customerId),
        deviceName: '',
        issueDescription: form.value.issue || ''
      }).catch(() => {})
    }
    emit('saved')
    isOpen.value = false
  } catch (e: any) {
    toast.danger('Error', e.message || 'Failed to save house call')
  } finally {
    saving.value = false
  }
}

const printCurrentHousecall = () => {
  if (!form.value) return
  const customerEmail = customers.value.find((c: any) => c.id === form.value.customerId)?.email || ''
  let displayTime = form.value.time || 'TBD'
  if (displayTime !== 'TBD' && displayTime.includes(':')) {
    const [h, m] = displayTime.split(':')
    const hour = parseInt(h, 10)
    displayTime = `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }
  printHousecall({
    businessName: settings.value?.businessName || 'NovaOps',
    businessAddress: settings.value?.address || '',
    businessPhone: settings.value?.phone || '',
    customerName: getCustomerName(form.value.customerId),
    customerPhone: getCustomerPhone(form.value.customerId),
    customerEmail,
    serviceAddress: form.value.address,
    date: form.value.date ? formatDate(form.value.date) : 'TBD',
    time: displayTime,
    issue: form.value.issue || 'No details provided.',
    status: form.value.status,
    estimate: estimate.value ? `${settings.value?.currency || '$'}${estimate.value.toFixed(2)}` : undefined
  })
}
</script>
