<template>
  <div class="flex flex-col gap-6">

    <!-- Header -->
    <div class="flex align-center justify-between flex-wrap gap-4 mb-2">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
          <i class="mdi mdi-file-document-outline text-2xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-black">Forms</h1>
          <p class="text-sm text-muted-foreground mt-1">Invoices, receipts, and customer agreements</p>
        </div>
      </div>
    </div>

    <!-- Template picker (shown when no form is active) -->
    <div v-if="!activeForm" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="template in formTemplates" 
        :key="template.label" 
        class="bg-surface border border-border rounded-xl p-6 flex flex-col cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
        @click="openForm(template)"
      >
        <div class="flex items-center gap-3 mb-4">
          <div 
            class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            :style="{ backgroundColor: `${template.color}15`, color: template.color }"
          >
            <i class="mdi text-xl" :class="template.icon"></i>
          </div>
        </div>
        <div>
          <h3 class="text-sm font-black">{{ template.label }}</h3>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">{{ template.desc }}</p>
        </div>
        <div class="mt-auto pt-6">
          <p class="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Includes</p>
          <div class="flex flex-wrap gap-1.5 mb-4">
            <span 
              v-for="tag in template.tags" 
              :key="tag" 
              class="text-[9px] font-bold px-2 py-0.5 rounded-full"
              :style="{ backgroundColor: `${template.color}15`, color: template.color }"
            >
              {{ tag }}
            </span>
          </div>
          <v-btn
            :color="template.color === '#10b981' ? 'success' : template.color === '#3b82f6' ? 'info' : template.color === '#8b5cf6' ? 'primary' : 'warning'"
            class="w-full rounded-full text-xs font-bold text-none mt-2"
          >
            Use Template
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Builder + Live Preview (side by side) -->
    <div v-if="activeForm" class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- Left: Form Builder -->
      <div class="flex flex-col">
        <div class="bg-surface border border-border rounded-xl p-6 flex flex-col h-full">
          <div class="flex items-center gap-3 mb-6 shrink-0">
            <v-btn icon="mdi-chevron-left" variant="text" color="secondary" class="rounded-full !w-8 !h-8" @click="activeForm = null" />
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              :style="{ backgroundColor: `${activeForm.color}15`, color: activeForm.color }"
            >
              <i class="mdi text-lg" :class="activeForm.icon"></i>
            </div>
            <h3 class="text-sm font-black">{{ activeForm.label }}</h3>
          </div>

          <div class="flex flex-col gap-5">
            <!-- Business info (auto-filled from settings) -->
            <div class="rounded-xl p-4 flex items-center gap-3 bg-muted/50 border">
              <i class="mdi mdi-office-building-outline text-lg text-muted-foreground"></i>
              <div>
                <p class="font-bold text-xs">{{ settings.businessName || 'Your Business' }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">{{ [settings.phone, settings.email].filter(Boolean).join(' · ') || 'Set phone & email in Settings' }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Customer</label>
                <CustomerSelect v-model="form.customerId" @update:modelValue="onCustomerChange" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Linked Ticket</label>
                <v-select
                  v-model="form.ticketId"
                  :items="[{id: null, label: 'None'}, ...tickets.map((t: any) => ({id: t.id, label: `#${t.id} — ${t.device}`}))]"
                  item-title="label"
                  item-value="id"
                  placeholder="Select a ticket"
                  hide-details
                  class="w-full text-xs"
                  @update:modelValue="onTicketChange"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Date</label>
                <input 
                  v-model="form.date" 
                  type="date" 
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" 
                />
              </div>
              <div v-if="activeForm.label !== 'Service Agreement'" class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Due Date</label>
                <input 
                  v-model="form.dueDate" 
                  type="date" 
                  class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground" 
                />
              </div>
            </div>

            <!-- Line Items (not for Service Agreement) -->
            <div v-if="activeForm.label !== 'Service Agreement'">
              <div class="flex items-center justify-between mb-3">
                <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Line Items</label>
                <v-btn 
                  prepend-icon="mdi-plus" 
                  color="success" 
                  variant="tonal" 
                  class="rounded-full text-[10px] font-bold px-3 py-1 text-none" 
                  @click="addLineItem" 
                >
                  Add Item
                </v-btn>
              </div>
              
              <div class="flex flex-col gap-2">
                <div v-for="(item, i) in form.lineItems" :key="i" class="flex align-center items-center gap-2">
                  <v-text-field v-model="item.description" placeholder="Description" hide-details class="flex-grow text-xs" />
                  <v-text-field v-model.number="item.qty" type="number" min="1" placeholder="Qty" hide-details class="w-16 text-xs text-center" />
                  <v-text-field v-model.number="item.price" type="number" min="0" step="0.01" placeholder="Price" hide-details class="w-24 text-xs text-right" />
                  <v-btn icon="mdi-delete-outline" variant="text" color="error" class="rounded-full !w-8 !h-8 shrink-0" @click="removeLineItem(i)" />
                </div>
                <div v-if="!form.lineItems.length" class="text-xs text-muted-foreground italic py-2">
                  No line items — linked ticket price will be used automatically.
                </div>
              </div>
              
              <div v-if="form.lineItems.length > 0" class="mt-3 flex justify-end">
                <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">Total: {{ formatCurrency(lineItemsTotal) }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Notes / Terms</label>
              <v-textarea 
                v-model="form.notes" 
                placeholder="Additional notes, payment terms, warranty info…" 
                rows="2" 
                auto-grow 
                hide-details
                class="w-full text-xs" 
              />
            </div>

            <div v-if="activeForm.label === 'Service Agreement'" class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Authorization Statement</label>
              <v-textarea 
                v-model="form.authStatement" 
                rows="3" 
                auto-grow 
                hide-details
                class="w-full text-xs"
                placeholder="I authorize the above repair shop to perform diagnostics and repairs on my device. I understand that..." 
              />
            </div>

            <v-btn
              prepend-icon="mdi-printer"
              color="success"
              class="rounded-full text-xs font-bold mt-2 py-2.5 text-none w-full"
              @click="generateAndPrint"
            >
              Generate & Print
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Right: Live Preview -->
      <div class="flex flex-col">
        <div class="bg-surface border border-border rounded-xl overflow-hidden flex flex-col h-full">
          <div class="px-5 py-3 border-b flex items-center justify-between bg-muted/30 shrink-0">
            <div class="flex items-center gap-2">
              <i class="mdi mdi-eye-outline text-muted"></i>
              <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live Preview</span>
            </div>
            <span class="text-[10px] text-muted-foreground">Updates as you type</span>
          </div>
          
          <div class="overflow-y-auto p-8 bg-surface flex-grow" style="max-height: 800px; font-family: sans-serif;">
            <div class="flex justify-between items-start mb-8">
              <div>
                <h2 class="text-lg font-black mb-1" :style="{ color: activeForm.color }">{{ activeForm.label.toUpperCase() }}</h2>
                <p class="text-xs font-bold text-foreground">{{ settings.businessName || 'Your Business Name' }}</p>
                <p class="text-[10px] text-muted-foreground">{{ settings.phone || '' }}</p>
                <p class="text-[10px] text-muted-foreground">{{ settings.email || '' }}</p>
                <p class="text-[10px] text-muted-foreground">{{ settings.address || '' }}</p>
                <span 
                  class="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full"
                  :style="{ backgroundColor: `${activeForm.color}15`, color: activeForm.color }"
                >
                  #{{ docNumber }}
                </span>
              </div>
              <div class="text-right text-[10px] text-muted-foreground">
                <p class="mb-1"><span class="font-bold text-foreground">Date:</span> {{ form.date || today }}</p>
                <p v-if="form.dueDate" class="mb-0"><span class="font-bold text-foreground">Due:</span> {{ form.dueDate }}</p>
              </div>
            </div>

            <div 
              class="rounded-xl p-4 mb-6 border font-medium text-foreground" 
              :style="{ backgroundColor: `${activeForm.color}08`, borderColor: `${activeForm.color}20` }"
            >
              <p class="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Bill To</p>
              <p class="text-xs font-bold text-foreground">{{ previewCustomer?.name || 'Walk-in Customer' }}</p>
              <p v-if="previewCustomer?.phone" class="text-[10px] text-muted-foreground">{{ previewCustomer.phone }}</p>
              <p v-if="previewCustomer?.email" class="text-[10px] text-muted-foreground">{{ previewCustomer.email }}</p>
            </div>

            <div 
              v-if="previewTicket" 
              class="rounded-xl p-4 mb-6 border" 
              :style="{ backgroundColor: `${activeForm.color}06`, borderColor: `${activeForm.color}14` }"
            >
              <p class="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Ticket #{{ previewTicket.id }}</p>
              <p class="text-xs font-medium text-foreground">{{ previewTicket.device }} {{ previewTicket.deviceModel }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">{{ previewTicket.issue }}</p>
            </div>

            <div v-if="activeForm.label !== 'Service Agreement'" class="mb-6">
              <table class="w-full text-left text-xs mb-4 text-foreground">
                <thead>
                  <tr class="border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
                    <th class="py-2 text-[10px]">Description</th>
                    <th class="py-2 text-center text-[10px]">Qty</th>
                    <th class="py-2 text-right text-[10px]">Price</th>
                    <th class="py-2 text-right text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr v-for="(li, i) in previewLineItems" :key="i">
                    <td class="py-2 font-medium">{{ li.description || '—' }}</td>
                    <td class="py-2 text-center text-muted-foreground">{{ li.qty }}</td>
                    <td class="py-2 text-right text-muted-foreground">{{ formatCurrency(li.price) }}</td>
                    <td class="py-2 text-right font-bold text-foreground">{{ formatCurrency(li.qty * li.price) }}</td>
                  </tr>
                  <tr v-if="!previewLineItems.length">
                    <td colspan="4" class="py-4 text-center text-muted-foreground italic text-[11px]">Line items will appear here…</td>
                  </tr>
                </tbody>
              </table>
              <hr class="border-t border-border my-2" />
              <div class="flex justify-between items-center pt-2">
                <span class="text-xs font-black" :style="{ color: activeForm.color }">TOTAL</span>
                <span class="text-sm font-black" :style="{ color: activeForm.color }">{{ formatCurrency(previewTotal) }}</span>
              </div>
            </div>

            <div v-if="form.notes" class="rounded-xl p-3 mb-4 text-[11px] text-muted-foreground bg-muted border">
              {{ form.notes }}
            </div>

            <div 
              v-if="activeForm.label === 'Service Agreement'" 
              class="rounded-xl p-4 mt-4 border bg-transparent"
            >
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Authorization</p>
              <p class="text-[10px] text-muted-foreground leading-relaxed">{{ form.authStatement || 'Customer authorization statement will appear here…' }}</p>
              <div class="flex gap-6 mt-8">
                <div>
                  <div class="w-36 border-b border-border h-8 mb-1"></div>
                  <p class="text-[9px] font-bold text-muted-foreground">Customer Signature</p>
                </div>
                <div>
                  <div class="w-24 border-b border-border h-8 mb-1"></div>
                  <p class="text-[9px] font-bold text-muted-foreground">Date</p>
                </div>
              </div>
            </div>

            <div class="mt-8 pt-4 border-t text-center text-[9px] text-muted-foreground">
              Thank you for your business! — Generated by {{ settings.businessName || 'NovaOps' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invoice History -->
    <div v-if="invoiceHistory.length > 0" class="bg-surface border border-border rounded-xl p-6 mt-2">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <i class="mdi mdi-clock-outline text-lg"></i>
          </div>
          <h3 class="text-base font-black">Recent Documents</h3>
        </div>
        <v-btn 
          variant="text" 
          color="secondary" 
          class="text-xs text-none font-bold" 
          @click="invoiceHistory = []" 
        >
          Clear
        </v-btn>
      </div>
      
      <div class="flex flex-col gap-2">
        <div
          v-for="inv in invoiceHistory"
          :key="inv.id"
          class="flex items-center justify-between p-3 border border-border rounded-xl"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <i class="mdi mdi-receipt-text-outline text-lg"></i>
            </div>
            <div class="min-w-0">
              <div class="text-xs font-bold truncate leading-tight">{{ inv.type }} — {{ inv.customerName }}</div>
              <div class="text-[10px] text-muted-foreground mt-0.5">{{ inv.date }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs font-black text-emerald-600 dark:text-emerald-400">{{ formatCurrency(inv.total) }}</span>
            <v-btn 
              icon="mdi-printer" 
              variant="text" 
              color="secondary" 
              class="rounded-full !w-8 !h-8" 
              @click="reprintInvoice(inv)" 
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Trade-In Wizard -->
    <TradeInWizard v-model="tradeInOpen" @saved="tradeInOpen = false" />
  </div>
</template>

<script setup lang="ts">
import TradeInWizard from '~/components/TradeInWizard.vue'
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'

const appStore   = useAppStore()
const customers  = computed(() => appStore.customers ?? [])
const tickets    = computed(() => appStore.tickets ?? [])
const settings   = computed(() => appStore.settings ?? { businessName: 'NovaOps', currency: '$' })
const today      = new Date().toISOString().split('T')[0]
const docNumber  = ref(Math.floor(1000 + Math.random() * 9000))

const activeForm     = ref<any>(null)
const invoiceHistory = ref<any[]>([])
const tradeInOpen    = ref(false)

const form = ref({
  customerId: null as any,
  ticketId: null as any,
  date: today,
  dueDate: '',
  notes: '',
  authStatement: 'I authorize the above repair shop to perform diagnostics and repairs on my device as described. I understand that additional costs may be incurred if further damage is discovered. I accept responsibility for the device until it is retrieved.',
  lineItems: [] as { description: string; qty: number; price: number }[],
})

const formTemplates = [
  {
    label: 'Invoice', desc: 'Itemized billing invoice for parts and labor',
    icon: 'mdi-receipt-text-outline', color: '#10b981', colorDark: '#059669',
    tags: ['Line items', 'Tax', 'Logo', 'Due date'],
  },
  {
    label: 'Repair Receipt', desc: 'Print a professional receipt for completed repairs',
    icon: 'mdi-clipboard-check-outline', color: '#3b82f6', colorDark: '#2563eb',
    tags: ['Ticket ref', 'Parts list', 'Warranty', 'Signature'],
  },
  {
    label: 'Service Agreement', desc: 'Customer authorization and consent form',
    icon: 'mdi-shield-check-outline', color: '#8b5cf6', colorDark: '#7c3aed',
    tags: ['Authorization', 'Liability waiver', 'Signature line'],
  },
  {
    label: 'Trade-In Evaluator', desc: 'Multi-step device trade-in wizard with live market pricing',
    icon: 'mdi-swap-horizontal', color: '#f59e0b', colorDark: '#d97706',
    tags: ['Market price', 'Condition grading', 'Profit calc', 'Customer offer'],
    isTradeIn: true,
  },
]

const openForm = (template: any) => {
  if (template.isTradeIn) { tradeInOpen.value = true; return }
  activeForm.value = template
  docNumber.value = Math.floor(1000 + Math.random() * 9000)
  form.value = {
    customerId: null, ticketId: null,
    date: today, dueDate: '', notes: '',
    authStatement: 'I authorize the above repair shop to perform diagnostics and repairs on my device as described. I understand that additional costs may be incurred if further damage is discovered. I accept responsibility for the device until it is retrieved.',
    lineItems: [],
  }
}

// Auto-populate line items from ticket
const onTicketChange = () => {
  const t = (tickets.value as any[]).find((t: any) => t.id === form.value.ticketId)
  if (t && t.price && form.value.lineItems.length === 0) {
    form.value.lineItems = [{ description: `Repair — ${t.device} ${t.deviceModel || ''}`.trim(), qty: 1, price: t.price }]
  }
}

const onCustomerChange = () => {
  // If there's a ticket for this customer, auto-select it
  const t = (tickets.value as any[]).find((t: any) => t.customerId === form.value.customerId && t.status !== 'Completed')
  if (t && !form.value.ticketId) { form.value.ticketId = t.id; onTicketChange() }
}

const addLineItem    = () => form.value.lineItems.push({ description: '', qty: 1, price: 0 })
const removeLineItem = (i: number) => form.value.lineItems.splice(i, 1)

const lineItemsTotal = computed(() => form.value.lineItems.reduce((a, i) => a + i.qty * i.price, 0))

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`

// ── Preview computed values ───────────────────────────────────────────────────
const previewCustomer   = computed(() => (customers.value as any[]).find((c: any) => c.id === form.value.customerId) ?? null)
const previewTicket     = computed(() => (tickets.value as any[]).find((t: any) => t.id === form.value.ticketId) ?? null)
const previewLineItems  = computed(() => {
  if (form.value.lineItems.length > 0) return form.value.lineItems
  if (previewTicket.value) return [{ description: `Repair — ${previewTicket.value.device}`, qty: 1, price: previewTicket.value.price || 0 }]
  return []
})
const previewTotal      = computed(() => previewLineItems.value.reduce((a, i) => a + i.qty * i.price, 0))

// ── HTML generation ───────────────────────────────────────────────────────────
function buildHtml(data: any) {
  const { customer, ticket, business, f, total, type, color, docNum, authStatement } = data
  const lineRows = data.lineItems.length > 0
    ? data.lineItems.map((li: any) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${li.description}</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280">${li.qty}</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#6b7280">${business.currency || '$'}${li.price.toFixed(2)}</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700">${business.currency || '$'}${(li.qty * li.price).toFixed(2)}</td></tr>`).join('')
    : ticket ? `<tr><td style="padding:8px 0">Repair — ${ticket.device}</td><td style="text-align:center">1</td><td style="text-align:right">${business.currency || '$'}${(ticket.price || 0).toFixed(2)}</td><td style="text-align:right;font-weight:700">${business.currency || '$'}${(ticket.price || 0).toFixed(2)}</td></tr>` : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${type}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;padding:48px;max-width:760px;margin:auto;color:#1a1a1a;font-size:13px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
    h1{color:${color};font-size:28px;font-weight:900;margin-bottom:4px}
    .badge{background:${color}18;color:${color};padding:3px 12px;border-radius:99px;font-size:11px;font-weight:800;display:inline-block;margin-top:8px}
    .info-box{background:${color}08;border:1px solid ${color}20;padding:16px;border-radius:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;padding:8px 0;border-bottom:2px solid #e5e7eb}
    .total-row td{font-weight:900;font-size:18px;color:${color};padding-top:16px}
    .sig-box{border:1.5px solid #e5e7eb;border-radius:12px;padding:20px;margin-top:24px}
    .sig-line{border-bottom:1px solid #9ca3af;width:160px;margin-bottom:4px;height:40px}
    footer{color:#9ca3af;font-size:11px;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center}
    @media print{body{padding:24px}}
  </style></head><body>
  <div class="header">
    <div>
      <h1>${type.toUpperCase()}</h1>
      <p style="font-weight:700;font-size:15px;margin-top:4px">${business.businessName || 'NovaOps'}</p>
      ${business.phone ? `<p style="color:#6b7280">${business.phone}</p>` : ''}
      ${business.email ? `<p style="color:#6b7280">${business.email}</p>` : ''}
      ${business.address ? `<p style="color:#6b7280">${business.address}</p>` : ''}
      <span class="badge">#${docNum}</span>
    </div>
    <div style="text-align:right;color:#6b7280;font-size:12px">
      <p><strong style="color:#374151">Date:</strong> ${f.date}</p>
      ${f.dueDate ? `<p><strong style="color:#374151">Due:</strong> ${f.dueDate}</p>` : ''}
    </div>
  </div>
  <div class="info-box">
    <strong>Bill To</strong><br>
    <span style="font-weight:700">${customer?.name || 'Walk-in Customer'}</span><br>
    ${customer?.phone ? `${customer.phone}<br>` : ''}
    ${customer?.email ? `${customer.email}` : ''}
  </div>
  ${ticket ? `<div class="info-box"><strong>Ticket #${ticket.id}</strong> — ${ticket.device} ${ticket.deviceModel || ''}<br><span style="color:#6b7280">${ticket.issue}</span></div>` : ''}
  ${type !== 'Service Agreement' ? `<table>
    <thead><tr>
      <th>Description</th>
      <th style="text-align:center">Qty</th>
      <th style="text-align:right">Unit Price</th>
      <th style="text-align:right">Amount</th>
    </tr></thead>
    <tbody>${lineRows}</tbody>
    <tfoot><tr class="total-row">
      <td colspan="3">TOTAL</td>
      <td style="text-align:right">${business.currency || '$'}${total.toFixed(2)}</td>
    </tr></tfoot>
  </table>` : ''}
  ${f.notes ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;color:#4b5563;font-size:12px;margin-bottom:16px">${f.notes}</div>` : ''}
  ${type === 'Service Agreement' ? `<div class="sig-box">
    <p style="font-weight:800;margin-bottom:12px">Authorization</p>
    <p style="color:#4b5563;line-height:1.6;margin-bottom:24px">${authStatement}</p>
    <div style="display:flex;gap:60px">
      <div><div class="sig-line"></div><p style="font-size:10px;color:#6b7280;font-weight:700">Customer Signature</p></div>
      <div><div class="sig-line" style="width:100px"></div><p style="font-size:10px;color:#6b7280;font-weight:700">Date</p></div>
    </div>
  </div>` : ''}
  <footer>Thank you for your business! — Generated by ${business.businessName || 'NovaOps'}</footer>
  <script>window.onload=()=>window.print()<\/script>
  </body></html>`
}

const generateAndPrint = () => {
  const customer   = (customers.value as any[]).find((c: any) => c.id === form.value.customerId) ?? null
  const ticket     = (tickets.value as any[]).find((t: any) => t.id === form.value.ticketId) ?? null
  const isAgreement = activeForm.value.label === 'Service Agreement'
  const lineItems  = isAgreement ? [] : (form.value.lineItems.length > 0 ? form.value.lineItems : (ticket ? [{ description: `Repair — ${ticket.device}`, qty: 1, price: ticket.price || 0 }] : []))
  const total      = lineItems.reduce((a, i) => a + i.qty * i.price, 0)
  const html = buildHtml({
    customer, ticket, business: settings.value,
    f: form.value, total, type: activeForm.value.label,
    color: activeForm.value.color, docNum: docNumber.value,
    lineItems, authStatement: form.value.authStatement,
  })
  const w = window.open(''); if (w) { w.document.write(html); w.document.close() }
  invoiceHistory.value.unshift({
    id: Date.now(), type: activeForm.value.label,
    customerName: customer?.name || 'Walk-in', date: form.value.date, total,
    html,
  })
}

const reprintInvoice = (inv: any) => {
  const w = window.open(''); if (w) { w.document.write(inv.html); w.document.close() }
}
</script>
