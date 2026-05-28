<template>
  <v-dialog
    v-model="isOpen"
    max-width="800"
  >
    <v-card class="rounded-xl">
      <v-card-item class="pb-3 border-b">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-505 text-white flex items-center justify-center bg-emerald-500">
            <i class="mdi mdi-map-marker text-lg"></i>
          </div>
          <div>
            <div class="text-sm font-bold text-foreground">{{ isEditing ? 'Edit House Call' : 'Schedule House Call' }}</div>
            <div class="text-xs text-muted-foreground mt-0.5">On-site repair appointment</div>
          </div>
        </div>
      </v-card-item>

      <v-card-text class="pt-6 pb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-4">
            <CustomerSelect v-model="form.customerId" />

            <div class="relative">
              <label class="text-[10px] font-bold text-muted-foreground uppercase">Address</label>
              <div class="flex gap-2 mt-1">
                <v-text-field
                  v-model="form.address"
                  placeholder="123 Main St, City, State"
                  hide-details
                  class="flex-1"
                  @input="onAddressInput"
                />
                <v-btn variant="outlined" color="secondary" class="shrink-0" style="height: 48px;" @click="openMaps">
                  <i class="mdi mdi-navigation"></i>
                </v-btn>
              </div>
              <div
                v-if="showSuggestions && addressSuggestions.length"
                class="absolute left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 max-h-44 overflow-y-auto"
              >
                <button
                  v-for="sug in addressSuggestions"
                  :key="sug.place_id"
                  type="button"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-muted border-b border-border last:border-0 text-foreground"
                  @click="selectSuggestion(sug)"
                >
                  {{ sug.display_name }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Date</label>
                <v-text-field v-model="form.date" type="date" hide-details class="w-full" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Time</label>
                <v-text-field v-model="form.time" type="time" hide-details class="w-full" />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-muted-foreground uppercase">Issue / Description</label>
              <v-textarea v-model="form.issue" rows="3" hide-details class="w-full" />
            </div>

            <div v-if="isEditing" class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
              <v-select
                v-model="form.status"
                :items="statusOptions"
                hide-details
                class="w-full"
              />
            </div>

            <div class="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 flex justify-between items-center">
              <span class="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Call Estimate</span>
              <span class="text-xl font-black text-emerald-600 dark:text-emerald-400">${{ estimate.toFixed(2) }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div>
              <p class="text-xs font-bold text-muted-foreground mb-2">Location Preview</p>
              <div class="rounded-xl overflow-hidden border border-border" style="height: 160px">
                <iframe v-if="mapsUrl" :src="mapsUrl" width="100%" height="100%" style="border: 0" />
                <div v-else class="flex items-center justify-center h-full bg-muted text-muted-foreground text-center">
                  <div>
                    <i class="mdi mdi-map text-3xl block mb-1"></i>
                    <p class="text-xs m-0">Enter address to preview</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-muted/50 border border-border rounded-xl p-4">
              <p class="text-[10px] font-black uppercase mb-3 flex items-center gap-1">
                <i class="mdi mdi-calculator"></i> Job Calculator
              </p>
              <div class="grid grid-cols-2 gap-2">
                <v-text-field v-model.number="calc.labor" type="number" placeholder="Labor ($)" hide-details class="text-sm" />
                <v-text-field v-model.number="calc.parts" type="number" placeholder="Parts ($)" hide-details class="text-sm" />
                <v-text-field v-model.number="calc.travel" type="number" placeholder="Travel ($)" hide-details class="text-sm" />
                <v-text-field v-model.number="calc.taxRate" type="number" placeholder="Tax (%)" hide-details class="text-sm" />
              </div>
              <hr class="border-border my-2" />
              <div class="flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span>${{ calcSubtotal.toFixed(2) }}</span></div>
              <div class="flex justify-between text-xs text-muted-foreground"><span>Tax</span><span>${{ calcTax.toFixed(2) }}</span></div>
              <div class="flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-450 mt-1"><span>Total</span><span>${{ calcTotal.toFixed(2) }}</span></div>
              <v-btn color="success" variant="outlined" class="w-full mt-3 text-none text-xs rounded-xl" @click="applyCalcEstimate">Apply as Estimate</v-btn>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 py-4 border-t border-border/60 justify-end">
        <v-btn v-if="isEditing" variant="outlined" color="secondary" class="text-none" @click="printCurrentHousecall">
          <i class="mdi mdi-printer mr-2"></i> Print
        </v-btn>
        <v-spacer />
        <v-btn variant="text" color="secondary" class="text-none" @click="isOpen = false">Cancel</v-btn>
        <v-btn
          color="success"
          class="text-none font-bold"
          :loading="saving"
          @click="saveHousecall"
        >
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
import { useEmailNotifications } from '~/composables/useEmailNotifications'

const props = defineProps<{
  modelValue: boolean
  editingCall?: any | null
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const appStore = useAppStore()
const { customers, settings } = storeToRefs(appStore)
const { toast } = useToast()
const { sendHousecallEmail, sendInternalAlert } = useEmailNotifications()

const statusOptions = ['Scheduled', 'In Progress', 'Completed', 'Cancelled']

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
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
  try {
    latLonCache.value = JSON.parse(localStorage.getItem('osm_cache') || '{}')
  } catch {}
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
const calcTax = computed(() => calcSubtotal.value * ((calc.value.taxRate || 0) / 100))
const calcTotal = computed(() => calcSubtotal.value + calcTax.value)
const applyCalcEstimate = () => {
  estimate.value = calcTotal.value
}

let mapsTimer: ReturnType<typeof setTimeout> | null = null
const onAddressInput = () => {
  if (mapsTimer) clearTimeout(mapsTimer)
  mapsTimer = setTimeout(async () => {
    const q = form.value.address?.trim()
    if (!q || q.length < 4) {
      addressSuggestions.value = []
      showSuggestions.value = false
      mapsUrl.value = ''
      return
    }
    const cached = latLonCache.value[q]
    if (cached && !cached.notfound) {
      selectSuggestion(cached, true)
      return
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=us,ca`,
      )
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
    try {
      localStorage.setItem('osm_cache', JSON.stringify(latLonCache.value))
    } catch {}
  }
}

const getCustomerName = (id: number) => customers.value.find((c: any) => c.id === id)?.name || 'Unknown'
const getCustomerPhone = (id: number) => customers.value.find((c: any) => c.id === id)?.phone || ''
const formatDate = (d?: string) =>
  d ? new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

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
        issueDescription: form.value.issue || '',
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
    estimate: estimate.value ? `${settings.value?.currency || '$'}${estimate.value.toFixed(2)}` : undefined,
  })
}
</script>
