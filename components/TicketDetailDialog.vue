<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

      <!-- Header -->
      <DialogHeader class="flex-shrink-0">
        <div class="flex items-start justify-between gap-4">
          <div>
            <DialogTitle class="text-xl">Ticket #{{ ticket?.id }}</DialogTitle>
            <p class="text-sm text-muted-foreground mt-0.5">
              {{ ticket?.device }} {{ ticket?.deviceModel }} · {{ getCustomerName(ticket?.customerId) }}
            </p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <Select v-model="localStatus" @update:modelValue="saveStatus">
              <SelectTrigger class="w-[150px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in statusList" :key="s" :value="s">{{ s }}</SelectItem>
              </SelectContent>
            </Select>
            <Badge :class="priorityClass(ticket?.priority)">{{ ticket?.priority }}</Badge>
          </div>
        </div>
      </DialogHeader>

      <!-- Tabs -->
      <div class="flex border-b border-border flex-shrink-0 gap-1 mt-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.id
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'"
        >
          {{ tab.label }}
          <span
            v-if="tab.count !== undefined && tab.count > 0"
            class="ml-1.5 text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0.5"
          >{{ tab.count }}</span>
          <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto py-4 space-y-4">

        <!-- ── Info Tab ──────────────────────────────────────────── -->
        <div v-if="activeTab === 'info'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <Card>
              <CardContent class="p-4 space-y-3">
                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Device</p>
                <div class="space-y-1.5 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Brand</span>
                    <span class="font-medium">{{ ticket?.device }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Model</span>
                    <span class="font-medium">{{ ticket?.deviceModel || '—' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Serial</span>
                    <span class="font-medium font-mono text-xs">{{ ticket?.serialNumber || '—' }}</span>
                  </div>
                  <div v-if="ticket?.deviceDescription" class="pt-1">
                    <span class="text-muted-foreground">Condition</span>
                    <p class="text-xs mt-0.5">{{ ticket?.deviceDescription }}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="p-4 space-y-3">
                <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Financials</p>
                <div class="space-y-1.5 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Labor</span>
                    <span class="font-medium text-blue-500">{{ formatCurrency(laborTotal) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Parts</span>
                    <span class="font-medium text-purple-500">{{ formatCurrency(partsTotal) }}</span>
                  </div>
                  <div class="flex justify-between border-t border-border pt-1.5">
                    <span class="font-semibold">Total</span>
                    <span class="font-bold">{{ formatCurrency(laborTotal + partsTotal) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Paid</span>
                    <span class="font-medium text-emerald-500">{{ formatCurrency(paymentsTotal) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Balance</span>
                    <span class="font-bold" :class="balance > 0 ? 'text-destructive' : 'text-emerald-500'">
                      {{ formatCurrency(balance) }}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Issue -->
          <Card>
            <CardContent class="p-4">
              <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Issue</p>
              <p class="text-sm">{{ ticket?.issue }}</p>
            </CardContent>
          </Card>

          <!-- Editable fields -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label class="text-xs">Warranty Days</Label>
              <Input v-model.number="localWarrantyDays" type="number" min="0" placeholder="0" @change="saveField('warranty_days', localWarrantyDays)" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs">Tracking Number</Label>
              <Input v-model="localTracking" placeholder="Optional" @change="saveField('tracking', localTracking)" />
            </div>
          </div>

          <!-- Signature -->
          <div v-if="ticket?.signature">
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Customer Signature</p>
            <div class="border rounded-lg p-2 bg-muted/20">
              <img :src="ticket.signature" alt="Signature" class="max-h-24 w-auto" />
            </div>
          </div>

          <!-- Dates -->
          <div class="flex gap-6 text-xs text-muted-foreground">
            <span>Created: {{ formatDate(ticket?.createdAt) }}</span>
            <span>Updated: {{ formatDate(ticket?.updatedAt) }}</span>
          </div>
        </div>

        <!-- ── Services / Labor Tab ──────────────────────────────── -->
        <div v-if="activeTab === 'services'" class="space-y-4">

          <!-- Add service -->
          <Card>
            <CardContent class="p-4 space-y-3">
              <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Service</p>
              <div class="flex gap-2">
                <div class="flex-1 relative">
                  <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input v-model="serviceSearch" placeholder="Search catalog..." class="pl-8 text-sm" />
                </div>
                <Button variant="outline" size="sm" @click="showCustomService = !showCustomService">
                  <Plus class="w-3.5 h-3.5 mr-1" /> Custom
                </Button>
              </div>

              <!-- Catalog results -->
              <div v-if="serviceSearch" class="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-1">
                <button
                  v-for="svc in filteredCatalog"
                  :key="svc.id"
                  class="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-sm text-left transition-colors"
                  @click="addCatalogService(svc)"
                >
                  <div>
                    <p class="font-medium">{{ svc.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ formatMinutes(svc.estimated_minutes) }} · {{ svc.category }}</p>
                  </div>
                  <span class="font-semibold text-emerald-600 ml-4">{{ formatCurrency(svc.flat_rate) }}</span>
                </button>
                <p v-if="filteredCatalog.length === 0" class="text-center py-3 text-xs text-muted-foreground">No services match</p>
              </div>

              <!-- Custom service form -->
              <div v-if="showCustomService" class="grid grid-cols-3 gap-2 pt-1 border-t border-border">
                <Input v-model="customService.name" placeholder="Service name" class="col-span-2 text-sm" />
                <Input v-model.number="customService.rate" type="number" placeholder="Rate $" class="text-sm" />
                <div class="col-span-2 flex items-center gap-2">
                  <Input v-model.number="customService.minutes" type="number" placeholder="Minutes" class="text-sm" />
                  <span class="text-xs text-muted-foreground whitespace-nowrap">= {{ formatCurrency(timeRate(customService.minutes)) }} @ hourly</span>
                </div>
                <Button size="sm" @click="addCustomService" :disabled="!customService.name">Add</Button>
              </div>
            </CardContent>
          </Card>

          <!-- Services list -->
          <div class="space-y-2">
            <div
              v-for="(svc, idx) in localServices"
              :key="idx"
              class="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">{{ svc.name }}</p>
                <p class="text-xs text-muted-foreground">{{ formatMinutes(svc.minutes) }}</p>
              </div>

              <!-- Time override toggle -->
              <div class="flex items-center gap-2">
                <button
                  class="text-xs px-2 py-1 rounded-md border transition-colors"
                  :class="svc.useTime ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' : 'text-muted-foreground border-border'"
                  @click="toggleTimeOverride(idx)"
                  title="Toggle time-based pricing"
                >
                  <Clock class="w-3 h-3 inline mr-1" />{{ svc.useTime ? 'Time' : 'Flat' }}
                </button>
                <div v-if="svc.useTime" class="flex items-center gap-1">
                  <Input
                    v-model.number="svc.actualMinutes"
                    type="number"
                    min="0"
                    class="w-16 h-7 text-xs text-center"
                    @change="saveServices"
                  />
                  <span class="text-xs text-muted-foreground">min</span>
                </div>
                <span class="text-sm font-bold text-emerald-600 w-16 text-right">
                  {{ formatCurrency(svc.useTime ? timeRate(svc.actualMinutes || svc.minutes, svc.hourlyRate) : svc.rate) }}
                </span>
              </div>
              <button class="text-muted-foreground hover:text-destructive transition-colors ml-1" @click="removeService(idx)">
                <X class="w-4 h-4" />
              </button>
            </div>

            <div v-if="localServices.length === 0" class="text-center py-8 text-sm text-muted-foreground border rounded-lg">
              No services added yet — search the catalog above
            </div>
          </div>

          <!-- Labor total -->
          <div v-if="localServices.length > 0" class="flex justify-between items-center px-3 py-2 rounded-lg bg-muted/40 text-sm font-semibold">
            <span>Labor Total</span>
            <span class="text-emerald-600">{{ formatCurrency(laborTotal) }}</span>
          </div>
        </div>

        <!-- ── Parts Tab ──────────────────────────────────────────── -->
        <div v-if="activeTab === 'parts'" class="space-y-4">
          <Card>
            <CardContent class="p-4 space-y-3">
              <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Part</p>
              <div class="flex gap-2">
                <div class="flex-1 relative">
                  <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input v-model="partSearch" placeholder="Search inventory..." class="pl-8 text-sm" />
                </div>
              </div>
              <div v-if="partSearch" class="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-1">
                <button
                  v-for="item in filteredInventory"
                  :key="item.id"
                  class="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-sm text-left transition-colors"
                  @click="addPart(item)"
                >
                  <div>
                    <p class="font-medium">{{ item.name }}</p>
                    <p class="text-xs text-muted-foreground">SKU: {{ item.sku }} · {{ item.stock }} in stock</p>
                  </div>
                  <span class="font-semibold text-emerald-600 ml-4">{{ formatCurrency(item.price) }}</span>
                </button>
                <p v-if="filteredInventory.length === 0" class="text-center py-3 text-xs text-muted-foreground">No items match</p>
              </div>
              <!-- Manual part entry -->
              <div class="grid grid-cols-3 gap-2 border-t border-border pt-3">
                <Input v-model="manualPart.name" placeholder="Part name" class="col-span-2 text-sm" />
                <Input v-model.number="manualPart.price" type="number" placeholder="Price $" class="text-sm" />
                <Button size="sm" class="col-span-3" variant="outline" @click="addManualPart" :disabled="!manualPart.name">
                  <Plus class="w-3.5 h-3.5 mr-1" /> Add Manual Part
                </Button>
              </div>
            </CardContent>
          </Card>

          <!-- Parts list -->
          <div class="space-y-2">
            <div
              v-for="(part, idx) in localParts"
              :key="idx"
              class="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">{{ part.name }}</p>
                <p class="text-xs text-muted-foreground">{{ part.sku || 'Manual entry' }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">Qty</span>
                <Input
                  v-model.number="part.qty"
                  type="number"
                  min="1"
                  class="w-14 h-7 text-xs text-center"
                  @change="saveParts"
                />
                <span class="text-sm font-bold text-purple-600 w-16 text-right">
                  {{ formatCurrency((part.price || 0) * (part.qty || 1)) }}
                </span>
              </div>
              <button class="text-muted-foreground hover:text-destructive transition-colors ml-1" @click="removePart(idx)">
                <X class="w-4 h-4" />
              </button>
            </div>
            <div v-if="localParts.length === 0" class="text-center py-8 text-sm text-muted-foreground border rounded-lg">
              No parts added yet
            </div>
          </div>

          <div v-if="localParts.length > 0" class="flex justify-between items-center px-3 py-2 rounded-lg bg-muted/40 text-sm font-semibold">
            <span>Parts Total</span>
            <span class="text-purple-600">{{ formatCurrency(partsTotal) }}</span>
          </div>
        </div>

        <!-- ── Payments Tab ───────────────────────────────────────── -->
        <div v-if="activeTab === 'payments'" class="space-y-4">

          <!-- Balance summary -->
          <div class="grid grid-cols-3 gap-3">
            <Card>
              <CardContent class="p-3 text-center">
                <p class="text-xs text-muted-foreground">Invoice</p>
                <p class="text-lg font-bold">{{ formatCurrency(laborTotal + partsTotal) }}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-3 text-center">
                <p class="text-xs text-muted-foreground">Paid</p>
                <p class="text-lg font-bold text-emerald-500">{{ formatCurrency(paymentsTotal) }}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-3 text-center">
                <p class="text-xs text-muted-foreground">Balance</p>
                <p class="text-lg font-bold" :class="balance > 0 ? 'text-destructive' : 'text-emerald-500'">
                  {{ formatCurrency(balance) }}
                </p>
              </CardContent>
            </Card>
          </div>

          <!-- Add payment -->
          <Card>
            <CardContent class="p-4 space-y-3">
              <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Record Payment</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <Label class="text-xs">Amount</Label>
                  <Input v-model.number="newPayment.amount" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
                <div class="space-y-1.5">
                  <Label class="text-xs">Method</Label>
                  <Select v-model="newPayment.method">
                    <SelectTrigger class="h-9 text-sm">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-1.5 col-span-2">
                  <Label class="text-xs">Note (optional)</Label>
                  <Input v-model="newPayment.note" placeholder="Deposit, partial payment, etc." />
                </div>
              </div>
              <Button class="w-full" size="sm" :disabled="!newPayment.amount || !newPayment.method" @click="addPayment">
                <DollarSign class="w-3.5 h-3.5 mr-1.5" /> Record Payment
              </Button>
            </CardContent>
          </Card>

          <!-- Payment history -->
          <div class="space-y-2">
            <div
              v-for="(payment, idx) in localPayments"
              :key="idx"
              class="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background: #10b98118">
                <DollarSign class="w-4 h-4 text-emerald-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium capitalize">{{ payment.method }}</p>
                <p class="text-xs text-muted-foreground">{{ formatDate(payment.date) }}{{ payment.note ? ` · ${payment.note}` : '' }}</p>
              </div>
              <span class="text-sm font-bold text-emerald-600">{{ formatCurrency(payment.amount) }}</span>
              <button class="text-muted-foreground hover:text-destructive transition-colors ml-1" @click="removePayment(idx)">
                <X class="w-4 h-4" />
              </button>
            </div>
            <div v-if="localPayments.length === 0" class="text-center py-8 text-sm text-muted-foreground border rounded-lg">
              No payments recorded yet
            </div>
          </div>
        </div>

        <!-- ── Notes Tab ─────────────────────────────────────────── -->
        <div v-if="activeTab === 'notes'" class="space-y-4">
          <div class="flex gap-2">
            <Textarea v-model="newNote" placeholder="Add a note..." :rows="2" class="flex-1 text-sm resize-none" />
            <Button size="sm" class="self-start" :disabled="!newNote.trim()" @click="addNote">
              <Plus class="w-3.5 h-3.5" />
            </Button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(note, idx) in localNotes"
              :key="idx"
              class="p-3 rounded-lg border bg-card text-sm"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="flex-1">{{ note.text }}</p>
                <button class="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0" @click="removeNote(idx)">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ formatDate(note.date) }}</p>
            </div>
            <div v-if="localNotes.length === 0" class="text-center py-8 text-sm text-muted-foreground border rounded-lg">
              No notes yet
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="flex gap-3 pt-4 border-t flex-shrink-0">
        <Button variant="destructive" size="sm" class="mr-auto" @click="$emit('delete', ticket)">
          <Trash2 class="w-3.5 h-3.5 mr-1.5" /> Delete
        </Button>
        <Button variant="outline" @click="isOpen = false">Close</Button>
        <Button @click="saveAll" :disabled="saving">
          <Loader2 v-if="saving" class="w-3.5 h-3.5 mr-1.5 animate-spin" />
          <Save v-else class="w-3.5 h-3.5 mr-1.5" />
          Save
        </Button>
      </div>

    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { X, Plus, Search, Clock, DollarSign, Save, Trash2, Loader2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'

const props = defineProps<{
  modelValue: boolean
  ticket: any
}>()

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const appStore = useAppStore()
const { customers, inventory, settings } = appStore
const { from } = useSupabase()
const { addNotification } = useNotifications()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// ── Local editable copies ─────────────────────────────────────────
const localStatus      = ref('')
const localWarrantyDays = ref(0)
const localTracking    = ref('')
const localServices    = ref<any[]>([])
const localParts       = ref<any[]>([])
const localPayments    = ref<any[]>([])
const localNotes       = ref<any[]>([])
const saving           = ref(false)

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
])

const statusList = computed(() =>
  (settings.value?.statuses || 'Open,In Progress,Completed').split(',').map((s: string) => s.trim())
)

// ── Watch ticket prop ─────────────────────────────────────────────
watch(() => props.ticket, (t) => {
  if (!t) return
  localStatus.value       = t.status || 'Open'
  localWarrantyDays.value = t.warrantyDays || 0
  localTracking.value     = t.tracking || ''
  localServices.value     = JSON.parse(JSON.stringify(t.services || []))
  localParts.value        = JSON.parse(JSON.stringify(t.parts || []))
  localPayments.value     = JSON.parse(JSON.stringify(t.payments || []))
  localNotes.value        = JSON.parse(JSON.stringify(t.notes || []))
  activeTab.value         = 'info'
  serviceSearch.value     = ''
  partSearch.value        = ''
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

const getCustomerName = (id: number) =>
  customers.value?.find((c: any) => c.id === id)?.name || 'Unknown'

const priorityClass = (p?: string) => {
  const map: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    normal: 'bg-muted text-muted-foreground',
    low: 'bg-muted/50 text-muted-foreground',
  }
  return map[p || 'normal']
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
    rate: svc.flat_rate,
    hourlyRate: svc.hourly_rate || HOURLY_RATE.value,
    minutes: svc.estimated_minutes || 0,
    actualMinutes: svc.estimated_minutes || 0,
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
  addNotification('Status Updated', `Ticket #${props.ticket.id} → ${status}`, 'success')
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

const saveAll = async () => {
  saving.value = true
  try {
    await appStore.updateTicket(props.ticket.id, {
      status: localStatus.value,
      warranty_days: localWarrantyDays.value,
      tracking: localTracking.value,
      services: localServices.value,
      parts: localParts.value,
      payments: localPayments.value,
      notes: localNotes.value,
      price: laborTotal.value + partsTotal.value,
    })
    emit('save')
    addNotification('Ticket Saved', `Ticket #${props.ticket.id} updated`, 'success')
  } finally {
    saving.value = false
  }
}
</script>

