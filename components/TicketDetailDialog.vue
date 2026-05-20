<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :draggable="false"
    class="w-full max-w-4xl mx-4"
    :show-header="false"
    pt:content:class="!p-0 flex flex-col max-h-[90dvh]"
  >
    <div class="flex items-center gap-3 p-4 border-b border-border shrink-0 flex-wrap">
      <div
        class="w-11 h-11 rounded-lg flex items-center justify-center text-white shrink-0"
        :style="{ backgroundColor: ticketStatusColor(ticket?.status) }"
      >
        <i class="mdi mdi-ticket-confirmation-outline"></i>
      </div>
      <div class="flex-1 min-w-0">
        <span class="font-black block">Ticket #{{ ticket?.id }}</span>
        <span class="text-xs text-muted-foreground truncate block">
          {{ ticket?.device }} {{ ticket?.deviceModel }} · {{ getCustomerName(ticket?.customerId) }}
        </span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Select
          v-model="localStatus"
          :options="statusList"
          class="w-40"
          @update:model-value="saveStatus"
        />
        <Tag
          :value="ticket?.priority"
          :severity="ticket?.priority === 'high' ? 'danger' : ticket?.priority === 'low' ? 'secondary' : 'info'"
        />
        <Button variant="text" rounded class="!w-9 !h-9" @click="isOpen = false">
          <i class="mdi mdi-close"></i>
        </Button>
      </div>
    </div>

    <Tabs v-model:value="activeTab" class="px-4 border-b border-border shrink-0">
      <TabList>
        <Tab v-for="tab in tabs" :key="tab.id" :value="tab.id">
          {{ tab.label }}
          <Tag v-if="tab.count" :value="String(tab.count)" class="ml-2" />
        </Tab>
      </TabList>
    </Tabs>

    <div class="flex-1 overflow-y-auto p-4 min-h-0">
      <TabPanels v-model:value="activeTab" class="!p-0">
        <TabPanel value="info">
          <div class="flex flex-col gap-4 py-2">
              <div v-if="ticketCustomer" class="border border-border rounded-xl overflow-hidden">
                <div class="flex items-center gap-3 p-4">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    :style="{ backgroundColor: avatarColor(ticketCustomer.name) }"
                  >{{ initials(ticketCustomer.name) }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="font-bold">{{ ticketCustomer.name }}</div>
                    <div class="text-xs text-muted-foreground">Customer</div>
                  </div>
                  <div class="flex gap-1">
                    <a v-if="ticketCustomer.phone" :href="`tel:${ticketCustomer.phone}`" class="inline-flex w-9 h-9 items-center justify-center rounded-full hover:bg-muted"><i class="mdi mdi-phone"></i></a>
                    <Button v-if="ticketCustomer.email" variant="text" size="small" @click="emailCustomer"><i class="mdi mdi-email-outline"></i></Button>
                  </div>
                </div>
                <ul class="m-0 p-2 list-none border-t border-border text-sm">
                  <li v-if="ticketCustomer.phone" class="flex items-center gap-2 px-2 py-1.5"><i class="mdi mdi-phone-outline text-muted-foreground"></i><a :href="`tel:${ticketCustomer.phone}`">{{ ticketCustomer.phone }}</a></li>
                  <li v-if="ticketCustomer.email" class="flex items-center gap-2 px-2 py-1.5"><i class="mdi mdi-email-outline text-muted-foreground"></i><button type="button" class="text-left" @click="emailCustomer">{{ ticketCustomer.email }}</button></li>
                  <li v-if="ticketCustomer.address" class="flex items-center gap-2 px-2 py-1.5"><i class="mdi mdi-map-marker-outline text-muted-foreground"></i>{{ ticketCustomer.address }}</li>
                  <li v-if="!ticketCustomer.phone && !ticketCustomer.email && !ticketCustomer.address" class="px-2 py-1.5 text-xs text-muted-foreground italic">No contact details on file</li>
                </ul>
              </div>

              <div class="flex items-center justify-between">
                <p class="text-[10px] font-black text-muted-foreground uppercase m-0">Device & Repair Details</p>
                <Button size="small" :variant="editingInfo ? 'primary' : 'outlined'" class="text-none" @click="editingInfo = !editingInfo">
                  <i class="mdi mr-1" :class="editingInfo ? 'mdi-check' : 'mdi-pencil'"></i>
                  {{ editingInfo ? 'Done Editing' : 'Edit' }}
                </Button>
              </div>

              <div v-if="!editingInfo" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="border border-border rounded-xl p-4">
                  <p class="text-[10px] font-black text-muted-foreground uppercase mb-3">Device</p>
                  <dl class="m-0 text-sm space-y-1">
                    <div class="flex justify-between"><dt class="text-muted-foreground">Brand</dt><dd class="font-medium m-0">{{ ticket?.device }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Model</dt><dd class="font-medium m-0">{{ ticket?.deviceModel || '—' }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Serial</dt><dd class="font-mono text-xs m-0">{{ ticket?.serialNumber || '—' }}</dd></div>
                    <div class="flex justify-between items-center"><dt class="text-muted-foreground">Priority</dt><dd class="m-0"><Tag :value="ticket?.priority" /></dd></div>
                  </dl>
                  <p v-if="ticket?.deviceDescription" class="text-xs text-muted-foreground mt-2 mb-0">{{ ticket?.deviceDescription }}</p>
                </div>
                <div class="border border-border rounded-xl p-4">
                  <p class="text-[10px] font-black text-muted-foreground uppercase mb-3">Financials</p>
                  <dl class="m-0 text-sm space-y-1">
                    <div class="flex justify-between"><dt class="text-muted-foreground">Labor</dt><dd class="text-sky-600 font-medium m-0">{{ formatCurrency(laborTotal) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Parts</dt><dd class="font-medium m-0 text-violet-600">{{ formatCurrency(partsTotal) }}</dd></div>
                    <div class="flex justify-between font-bold border-t border-border pt-1 mt-1"><dt>Total</dt><dd class="m-0">{{ formatCurrency(laborTotal + partsTotal) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Paid</dt><dd class="text-emerald-600 font-medium m-0">{{ formatCurrency(paymentsTotal) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Balance</dt><dd class="font-bold m-0" :class="balance > 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatCurrency(balance) }}</dd></div>
                  </dl>
                </div>
              </div>
              <div v-if="!editingInfo" class="border border-border rounded-xl p-4">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-2">Issue Reported</p>
                <p class="text-sm m-0">{{ ticket?.issue }}</p>
              </div>

              <div v-if="editingInfo" class="border border-border rounded-xl p-4 flex flex-col gap-3">
                <p class="text-[10px] font-black text-muted-foreground uppercase">Edit Device Details</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputText v-model="localDevice" placeholder="Brand / Manufacturer" class="rounded-xl" />
                  <InputText v-model="localDeviceModel" placeholder="Model" class="rounded-xl" />
                  <InputText v-model="localSerialNumber" placeholder="Serial Number" class="rounded-xl font-mono" />
                  <Select v-model="localPriority" :options="priorityOptions" option-label="label" option-value="value" placeholder="Priority" class="w-full" />
                </div>
                <Textarea v-model="localIssue" rows="3" placeholder="Issue / problem description…" class="w-full rounded-xl" />
                <Textarea v-model="localDeviceDescription" rows="2" placeholder="Device condition notes…" class="w-full rounded-xl" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <InputText v-model.number="localWarrantyDays" type="number" min="0" placeholder="Warranty days" class="rounded-xl" @change="saveField('warranty_days', localWarrantyDays)" />
                <InputText v-model="localTracking" placeholder="Tracking number" class="rounded-xl" @change="saveField('tracking', localTracking)" />
              </div>

              <div v-if="editingInfo" class="border border-border rounded-xl p-4 text-sm">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-2">Financials</p>
                <div class="flex justify-between"><span class="text-muted-foreground">Balance</span>
                  <span class="font-bold" :class="balance > 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatCurrency(balance) }}</span>
                </div>
              </div>

              <div v-if="ticket?.signature">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-2">Customer Signature</p>
                <div class="border border-border rounded-lg p-3 bg-muted/30">
                  <img :src="ticket.signature" alt="Signature" class="max-h-24 w-auto" />
                </div>
              </div>

              <div class="flex gap-4 text-xs text-muted-foreground">
                <span>Created: {{ formatDate(ticket?.createdAt) }}</span>
                <span>Updated: {{ formatDate(ticket?.updatedAt) }}</span>
              </div>
          </div>
        </TabPanel>

        <TabPanel value="services">
          <div class="flex flex-col gap-4 py-2">
              <div class="border border-border rounded-xl p-4">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-3">Add Service</p>
                <div class="flex gap-2 mb-3">
                  <InputText v-model="serviceSearch" placeholder="Search catalog…" class="flex-1 rounded-xl" />
                  <Button variant="outlined" size="small" class="text-none" @click="showCustomService = !showCustomService"><i class="mdi mdi-plus"></i> Custom</Button>
                </div>
                <div v-if="serviceSearch" class="border border-border rounded-lg max-h-40 overflow-y-auto mb-3 divide-y divide-border">
                  <button
                    v-for="svc in filteredCatalog"
                    :key="svc.id"
                    type="button"
                    class="w-full text-left px-3 py-2 hover:bg-muted flex justify-between gap-2"
                    @click="addCatalogService(svc)"
                  >
                    <div>
                      <div class="text-sm font-medium">{{ svc.name }}</div>
                      <div class="text-xs text-muted-foreground">{{ formatMinutes(svc.estimated_minutes) }} · {{ svc.category }}</div>
                    </div>
                    <span class="text-sm font-bold text-emerald-600 shrink-0">{{ formatCurrency(svc.price) }}</span>
                  </button>
                  <p v-if="!filteredCatalog.length" class="text-center text-xs text-muted-foreground py-3">No services match</p>
                </div>
                <div v-if="showCustomService" class="border-t border-border pt-3 grid grid-cols-2 gap-2">
                  <InputText v-model="customService.name" placeholder="Service name" class="col-span-2 rounded-xl" />
                  <InputText v-model.number="customService.rate" type="number" placeholder="Rate $" class="rounded-xl" />
                  <InputText v-model.number="customService.minutes" type="number" placeholder="Minutes" class="rounded-xl" />
                  <Button class="col-span-2" :disabled="!customService.name" @click="addCustomService">Add</Button>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="(svc, idx) in localServices" :key="idx" class="border border-border rounded-xl p-3 flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium m-0">{{ svc.name }}</p>
                    <p class="text-xs text-muted-foreground m-0">{{ formatMinutes(svc.minutes) }}</p>
                  </div>
                  <Button size="small" :variant="svc.useTime ? 'primary' : 'outlined'" class="text-none text-xs" @click="toggleTimeOverride(idx)">
                    <i class="mdi mdi-clock-outline"></i> {{ svc.useTime ? 'Time' : 'Flat' }}
                  </Button>
                  <InputText v-if="svc.useTime" v-model.number="svc.actualMinutes" type="number" min="0" class="w-16 rounded-lg text-sm" @change="saveServices" />
                  <span class="text-sm font-bold text-emerald-600 shrink-0">{{ formatCurrency(svc.useTime ? timeRate(svc.actualMinutes || svc.minutes, svc.hourlyRate) : svc.rate) }}</span>
                  <Button variant="text" severity="danger" size="small" @click="removeService(idx)"><i class="mdi mdi-close"></i></Button>
                </div>
                <p v-if="!localServices.length" class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">No services added yet</p>
              </div>
              <div v-if="localServices.length" class="flex justify-between font-bold p-3 rounded-xl bg-muted/40 text-sm">
                <span>Labor Total</span><span class="text-emerald-600">{{ formatCurrency(laborTotal) }}</span>
              </div>
          </div>
        </TabPanel>

        <TabPanel value="parts">
          <div class="flex flex-col gap-4 py-2">
              <div class="border border-border rounded-xl p-4">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-3">Add Part</p>
                <InputText v-model="partSearch" placeholder="Search inventory…" class="w-full rounded-xl mb-3" />
                <div v-if="partSearch" class="border border-border rounded-lg max-h-40 overflow-y-auto mb-3 divide-y divide-border">
                  <button
                    v-for="item in filteredInventory"
                    :key="item.id"
                    type="button"
                    class="w-full text-left px-3 py-2 hover:bg-muted flex justify-between"
                    @click="addPart(item)"
                  >
                    <div>
                      <div class="text-sm font-medium">{{ item.name }}</div>
                      <div class="text-xs text-muted-foreground">SKU: {{ item.sku }} · {{ item.stock }} in stock</div>
                    </div>
                    <span class="text-sm font-bold text-emerald-600">{{ formatCurrency(item.price) }}</span>
                  </button>
                </div>
                <hr class="border-border my-3" />
                <div class="grid grid-cols-3 gap-2">
                  <InputText v-model="manualPart.name" placeholder="Part name" class="col-span-2 rounded-xl" />
                  <InputText v-model.number="manualPart.price" type="number" placeholder="Price" class="rounded-xl" />
                  <Button variant="outlined" class="col-span-3 text-none" :disabled="!manualPart.name" @click="addManualPart"><i class="mdi mdi-plus mr-1"></i> Add Manual Part</Button>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="(part, idx) in localParts" :key="idx" class="border border-border rounded-xl p-3 flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium m-0">{{ part.name }}</p>
                    <p class="text-xs text-muted-foreground m-0">{{ part.sku || 'Manual entry' }}</p>
                  </div>
                  <span class="text-xs text-muted-foreground">Qty</span>
                  <InputText v-model.number="part.qty" type="number" min="1" class="w-14 rounded-lg text-sm" @change="saveParts" />
                  <span class="text-sm font-bold text-violet-600">{{ formatCurrency((part.price || 0) * (part.qty || 1)) }}</span>
                  <Button variant="text" severity="danger" size="small" @click="removePart(idx)"><i class="mdi mdi-close"></i></Button>
                </div>
                <p v-if="!localParts.length" class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">No parts added yet</p>
              </div>
              <div v-if="localParts.length" class="flex justify-between font-bold p-3 rounded-xl bg-muted/40 text-sm">
                <span>Parts Total</span><span class="text-violet-600">{{ formatCurrency(partsTotal) }}</span>
              </div>
          </div>
        </TabPanel>

        <TabPanel value="payments">
          <div class="flex flex-col gap-4 py-2">
              <div class="grid grid-cols-3 gap-2">
                <div class="border border-border rounded-xl p-3 text-center">
                  <p class="text-xs text-muted-foreground m-0 mb-1">Invoice</p>
                  <p class="text-lg font-bold m-0">{{ formatCurrency(laborTotal + partsTotal) }}</p>
                </div>
                <div class="border border-border rounded-xl p-3 text-center">
                  <p class="text-xs text-muted-foreground m-0 mb-1">Paid</p>
                  <p class="text-lg font-bold text-emerald-600 m-0">{{ formatCurrency(paymentsTotal) }}</p>
                </div>
                <div class="border border-border rounded-xl p-3 text-center">
                  <p class="text-xs text-muted-foreground m-0 mb-1">Balance</p>
                  <p class="text-lg font-bold m-0" :class="balance > 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatCurrency(balance) }}</p>
                </div>
              </div>
              <div class="border border-border rounded-xl p-4 flex flex-col gap-3">
                <p class="text-[10px] font-black text-muted-foreground uppercase">Record Payment</p>
                <div class="grid grid-cols-2 gap-3">
                  <InputText v-model.number="newPayment.amount" type="number" min="0" step="0.01" placeholder="Amount" class="rounded-xl" />
                  <Select v-model="newPayment.method" :options="paymentMethods" placeholder="Method" class="w-full" />
                </div>
                <InputText v-model="newPayment.note" placeholder="Note (optional)" class="rounded-xl" />
                <Button severity="success" class="w-full font-bold text-none" :disabled="!newPayment.amount || !newPayment.method" @click="addPayment">
                  <i class="mdi mdi-currency-usd mr-1"></i> Record Payment
                </Button>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="(payment, idx) in localPayments" :key="idx" class="border border-border rounded-xl p-3 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <i class="mdi mdi-currency-usd"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium capitalize m-0">{{ payment.method }}</p>
                    <p class="text-xs text-muted-foreground m-0">{{ formatDate(payment.date) }}{{ payment.note ? ` · ${payment.note}` : '' }}</p>
                  </div>
                  <span class="text-sm font-bold text-emerald-600">{{ formatCurrency(payment.amount) }}</span>
                  <Button variant="text" severity="danger" size="small" @click="removePayment(idx)"><i class="mdi mdi-close"></i></Button>
                </div>
                <p v-if="!localPayments.length" class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">No payments recorded yet</p>
              </div>
          </div>
        </TabPanel>

        <TabPanel value="notes">
          <div class="flex flex-col gap-4 py-2">
              <div class="flex gap-2">
                <Textarea v-model="newNote" rows="2" placeholder="Add a note…" class="flex-1 rounded-xl" />
                <Button variant="outlined" class="shrink-0" :disabled="!newNote.trim()" @click="addNote"><i class="mdi mdi-plus"></i></Button>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="(note, idx) in localNotes" :key="idx" class="border border-border rounded-xl p-3">
                  <div class="flex justify-between gap-2">
                    <p class="text-sm flex-1 m-0">{{ note.text }}</p>
                    <Button variant="text" severity="danger" size="small" @click="removeNote(idx)"><i class="mdi mdi-close"></i></Button>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1 m-0">{{ formatDate(note.date) }}</p>
                </div>
                <p v-if="!localNotes.length" class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">No notes yet</p>
              </div>
          </div>
        </TabPanel>

        <TabPanel value="guides">
          <div class="flex flex-col gap-4 py-2">
              <div v-if="loadingGuides" class="border border-border rounded-xl p-6 text-center">
                <ProgressSpinner stroke-width="4" />
                <p class="text-sm text-muted-foreground mt-2">Fetching repair guides for {{ ticket?.deviceModel }}…</p>
              </div>
              <div v-else-if="guides.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NuxtLink
                  v-for="guide in guides"
                  :key="guide.guideid"
                  :to="'/library/' + guide.guideid"
                  class="border border-border rounded-xl p-3 hover:bg-muted flex flex-col h-full no-underline text-foreground"
                  @click="isOpen = false"
                >
                  <div class="flex gap-3 mb-2">
                    <img v-if="guide.image?.thumbnail" :src="guide.image.thumbnail" width="64" height="64" class="rounded-lg object-cover shrink-0" alt="" />
                    <div v-else class="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0"><i class="mdi mdi-wrench"></i></div>
                    <div>
                      <p class="text-sm font-bold mb-1 leading-tight">{{ guide.title }}</p>
                      <Tag :value="guide.difficulty || 'Unknown'" :severity="guide.difficulty === 'Easy' ? 'success' : guide.difficulty === 'Moderate' ? 'warn' : 'danger'" />
                    </div>
                  </div>
                  <p class="text-xs text-muted-foreground truncate mt-auto m-0">{{ guide.summary }}</p>
                </NuxtLink>
              </div>
              <p v-else class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">
                No repair guides found for "{{ ticket?.deviceModel }}" on iFixit.
              </p>
              <p v-if="!loadingGuides && guides.length" class="text-xs text-center text-muted-foreground">
                Guides provided by <a href="https://www.ifixit.com" target="_blank" rel="noopener">iFixit</a>
              </p>
          </div>
        </TabPanel>
      </TabPanels>
    </div>

    <div class="flex flex-wrap items-center gap-2 p-4 border-t border-border shrink-0">
      <Button label="Delete" severity="danger" variant="outlined" class="text-none" @click="$emit('delete', ticket)">
        <i class="mdi mdi-delete-outline mr-1"></i>
      </Button>
      <div class="flex-1"></div>
      <Button
        v-if="ticket?.status === 'Completed' || balance > 0"
        label="Collect Payment"
        class="text-none"
        @click="collectPayment"
      >
        <i class="mdi mdi-credit-card-outline mr-1"></i>
      </Button>
      <Button label="Email" variant="outlined" class="text-none" :disabled="!ticketCustomer?.email" @click="emailCustomer" />
      <Button label="Print Label" variant="outlined" class="text-none" @click="printIntakeLabel" />
      <Button label="Close" variant="text" class="text-none" @click="isOpen = false" />
      <Button label="Save" class="text-none font-bold" :loading="saving" @click="saveAll" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import confetti from 'canvas-confetti'
import { printBarcodeLabel } from '~/utils/print'
import { openMailto } from '~/utils/contact'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  ticket: any
}>()

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const appStore = useAppStore()
const { customers, inventory, settings } = storeToRefs(appStore)
const { $supabase } = useNuxtApp()
const from = (table: string) => ($supabase as any).from(table)
const { addNotification } = useNotifications()
const { toast } = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// ── Derived customer record ───────────────────────────────────────
const ticketCustomer = computed(() =>
  (customers.value || []).find((c: any) => c.id === props.ticket?.customerId) ?? null
)

// Helper used in footer actions and print label
function getCustomerName(id: number) {
  return (customers.value || []).find((c: any) => c.id === id)?.name || 'Unknown'
}

// ── Local editable copies ─────────────────────────────────────────
const localStatus      = ref('')
const localWarrantyDays = ref(0)
const localTracking    = ref('')
const localServices    = ref<any[]>([])
const localParts       = ref<any[]>([])
const localPayments    = ref<any[]>([])
const localNotes       = ref<any[]>([])
const saving           = ref(false)

// ── Editable info fields ──────────────────────────────────────────
const editingInfo         = ref(false)
const localDevice         = ref('')
const localDeviceModel    = ref('')
const localIssue          = ref('')
const localDeviceDescription = ref('')
const localSerialNumber   = ref('')
const localPriority       = ref('normal')

// ── Catalog ───────────────────────────────────────────────────────
const serviceCatalog   = ref<any[]>([])
const activeTab        = ref('info')
const serviceSearch    = ref('')
const showCustomService = ref(false)
const customService    = ref({ name: '', rate: 0, minutes: 0, hourlyRate: 75 })
const partSearch       = ref('')
const manualPart       = ref({ name: '', price: 0 })
const newNote          = ref('')
const newPayment       = ref({ amount: 0, method: '', note: '' })

const HOURLY_RATE = computed(() => 75) // fallback — first service hourly rate or 75

const tabs = computed(() => [
  { id: 'info',     label: 'Info' },
  { id: 'services', label: 'Services', count: localServices.value.length },
  { id: 'parts',    label: 'Parts',    count: localParts.value.length },
  { id: 'payments', label: 'Payments', count: localPayments.value.length },
  { id: 'notes',    label: 'Notes',    count: localNotes.value.length },
  { id: 'guides',   label: 'Repair Guides' },
])

const statusList = computed(() =>
  (settings.value?.statuses || 'Open,In Progress,Completed').split(',').map((s: string) => s.trim())
)

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
]

const paymentMethods = ['cash', 'card', 'zelle', 'venmo', 'check', 'other']

// ── Repair Guides ──────────────────────────────────────────────────
const guides = ref<any[]>([])
const loadingGuides = ref(false)

const fetchGuides = async (deviceModel: string) => {
  if (!deviceModel) {
    guides.value = []
    return
  }
  loadingGuides.value = true
  guides.value = []
  try {
    const modelStr = deviceModel.trim().replace(/\s+/g, '_')
    const res = await fetch(`https://www.ifixit.com/api/2.0/wikis/CATEGORY/${modelStr}`)
    if (res.ok) {
      const data = await res.json()
      if (data && data.guides && Array.isArray(data.guides)) {
        guides.value = data.guides
      }
    }
  } catch (err) {
    console.error('Failed to fetch iFixit guides', err)
  } finally {
    loadingGuides.value = false
  }
}

// ── Watch ticket prop ─────────────────────────────────────────────
watch(() => props.ticket, (t) => {
  if (!t) return
  localStatus.value            = t.status || 'Open'
  localWarrantyDays.value      = t.warrantyDays || 0
  localTracking.value          = t.tracking || ''
  localServices.value          = JSON.parse(JSON.stringify(t.services || []))
  localParts.value             = JSON.parse(JSON.stringify(t.parts || []))
  localPayments.value          = JSON.parse(JSON.stringify(t.payments || []))
  localNotes.value             = JSON.parse(JSON.stringify(t.notes || []))
  localDevice.value            = t.device || ''
  localDeviceModel.value       = t.deviceModel || ''
  localIssue.value             = t.issue || ''
  localDeviceDescription.value = t.deviceDescription || ''
  localSerialNumber.value      = t.serialNumber || ''
  localPriority.value          = t.priority || 'normal'
  editingInfo.value            = false
  activeTab.value              = 'info'
  serviceSearch.value          = ''
  partSearch.value             = ''
  
  fetchGuides(t.deviceModel)
}, { immediate: true })

// Fetch service catalog once
onMounted(async () => {
  const { data } = await from('services').select('*').eq('active', true).order('category').order('name')
  if (data) serviceCatalog.value = data
})

// ── Computed totals ───────────────────────────────────────────────
const laborTotal = computed(() =>
  localServices.value.reduce((sum, s) => {
    const val = s.useTime ? timeRate(s.actualMinutes || s.minutes, s.hourlyRate) : (s.rate || 0)
    return sum + val
  }, 0)
)

const partsTotal = computed(() =>
  localParts.value.reduce((sum, p) => sum + (p.price || 0) * (p.qty || 1), 0)
)

const paymentsTotal = computed(() =>
  localPayments.value.reduce((sum, p) => sum + (p.amount || 0), 0)
)

const balance = computed(() => (laborTotal.value + partsTotal.value) - paymentsTotal.value)

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${Number(n || 0).toFixed(2)}`
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '—'
const formatMinutes = (m: number) => {
  if (!m) return '—'
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`
}
const timeRate = (minutes: number, hourly = HOURLY_RATE.value) =>
  Math.round(((minutes || 0) / 60) * hourly * 100) / 100


const ticketStatusColor = (status?: string) => ({
  'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316',
  'Completed': '#10b981', 'Delivered': '#64748b', 'Closed': '#6366f1'
}[status || ''] || '#64748b')

// ── Customer avatar helpers ───────────────────────────────────────
const initials = (name: string) =>
  (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

const avatarColor = (name: string) => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']
  let hash = 0
  for (const c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ── Filtered lists ────────────────────────────────────────────────
const filteredCatalog = computed(() => {
  const q = serviceSearch.value.toLowerCase()
  return serviceCatalog.value.filter(s =>
    s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  )
})

const filteredInventory = computed(() => {
  const q = partSearch.value.toLowerCase()
  return (inventory.value || []).filter((i: any) =>
    i.name.toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q)
  )
})

// ── Services ──────────────────────────────────────────────────────
const addCatalogService = (svc: any) => {
  localServices.value.push({
    name: svc.name,
    rate: svc.price || svc.flat_rate || 0,
    hourlyRate: svc.hourly_rate || HOURLY_RATE.value,
    minutes: svc.estimated_minutes || svc.duration || 0,
    actualMinutes: svc.estimated_minutes || svc.duration || 0,
    useTime: false,
    catalogId: svc.id,
  })
  serviceSearch.value = ''
  saveServices()
}

const addCustomService = () => {
  if (!customService.value.name) return
  localServices.value.push({
    name: customService.value.name,
    rate: customService.value.rate || 0,
    hourlyRate: HOURLY_RATE.value,
    minutes: customService.value.minutes || 0,
    actualMinutes: customService.value.minutes || 0,
    useTime: false,
  })
  customService.value = { name: '', rate: 0, minutes: 0, hourlyRate: 75 }
  showCustomService.value = false
  saveServices()
}

const removeService = (idx: number) => {
  localServices.value.splice(idx, 1)
  saveServices()
}

const toggleTimeOverride = (idx: number) => {
  localServices.value[idx].useTime = !localServices.value[idx].useTime
  saveServices()
}

const saveServices = () => saveField('services', localServices.value)

// ── Parts ─────────────────────────────────────────────────────────
const addPart = (item: any) => {
  const existing = localParts.value.find(p => p.inventoryId === item.id)
  if (existing) { existing.qty = (existing.qty || 1) + 1 }
  else {
    localParts.value.push({ name: item.name, sku: item.sku, price: item.price, qty: 1, inventoryId: item.id })
  }
  partSearch.value = ''
  saveParts()
}

const addManualPart = () => {
  if (!manualPart.value.name) return
  localParts.value.push({ name: manualPart.value.name, price: manualPart.value.price || 0, qty: 1 })
  manualPart.value = { name: '', price: 0 }
  saveParts()
}

const removePart = (idx: number) => {
  localParts.value.splice(idx, 1)
  saveParts()
}

const saveParts = () => saveField('parts', localParts.value)

// ── Payments ──────────────────────────────────────────────────────
const addPayment = () => {
  if (!newPayment.value.amount || !newPayment.value.method) return
  localPayments.value.push({
    amount: newPayment.value.amount,
    method: newPayment.value.method,
    note: newPayment.value.note,
    date: new Date().toISOString(),
  })
  newPayment.value = { amount: 0, method: '', note: '' }
  saveField('payments', localPayments.value)
}

const removePayment = (idx: number) => {
  localPayments.value.splice(idx, 1)
  saveField('payments', localPayments.value)
}

// ── Notes ─────────────────────────────────────────────────────────
const addNote = () => {
  if (!newNote.value.trim()) return
  localNotes.value.unshift({ text: newNote.value.trim(), date: new Date().toISOString() })
  newNote.value = ''
  saveField('notes', localNotes.value)
}

const removeNote = (idx: number) => {
  localNotes.value.splice(idx, 1)
  saveField('notes', localNotes.value)
}

// ── Save helpers ──────────────────────────────────────────────────
const saveStatus = async (status: string) => {
  await appStore.updateTicket(props.ticket.id, { status })
  toast.success('Status Updated', `Ticket #${props.ticket.id} → ${status}`)
  if (status === 'Completed') {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6', '#8b5cf6'] })
  }
}

const saveField = async (field: string, value: any) => {
  const snakeMap: Record<string, string> = {
    warranty_days: 'warranty_days',
    tracking: 'tracking',
    services: 'services',
    parts: 'parts',
    payments: 'payments',
    notes: 'notes',
  }
  const key = snakeMap[field] || field
  const total = laborTotal.value + partsTotal.value
  await appStore.updateTicket(props.ticket.id, { [key]: value, price: total })
}

function emailCustomer() {
  if (!ticketCustomer.value?.email) return
  isOpen.value = false
  const t = props.ticket
  openMailto(
    ticketCustomer.value.email,
    `Ticket #${t.id} — ${t.device || 'Repair'}`,
    `Hello,\n\nRegarding service for ticket #${t.id}:\n\n`,
  )
}

function collectPayment() {
  isOpen.value = false
  navigateTo(`/pos?ticket=${props.ticket.id}`)
}

function printIntakeLabel() {
  if (!props.ticket) return
  printBarcodeLabel({
    sku: `TKT-${props.ticket.id}`,
    name: `Ticket #${props.ticket.id} - ${props.ticket.device}`,
    price: laborTotal.value + partsTotal.value,
    customerName: getCustomerName(props.ticket.customerId),
    format: 'CODE128'
  })
}

const saveAll = async () => {
  saving.value = true
  try {
    await appStore.updateTicket(props.ticket.id, {
      status:             localStatus.value,
      warranty_days:      localWarrantyDays.value,
      tracking:           localTracking.value,
      services:           localServices.value,
      parts:              localParts.value,
      payments:           localPayments.value,
      notes:              localNotes.value,
      price:              laborTotal.value + partsTotal.value,
      device:             localDevice.value,
      device_model:       localDeviceModel.value,
      issue:              localIssue.value,
      device_description: localDeviceDescription.value,
      serial_number:      localSerialNumber.value,
      priority:           localPriority.value,
    })
    editingInfo.value = false
    emit('save')
    toast.success('Ticket Saved', `Ticket #${props.ticket.id} updated`)
  } finally {
    saving.value = false
  }
}
</script>
