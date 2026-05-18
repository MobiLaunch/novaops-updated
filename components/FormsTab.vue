<template>
  <div class="d-flex flex-column gap-6">

    <!-- Header -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-2">
      <div class="d-flex align-center gap-4">
        <v-avatar size="56" color="success" variant="tonal" class="rounded-xl">
          <v-icon icon="mdi-file-document-outline" size="28" color="success" />
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-black">Forms</h1>
          <p class="text-body-2 text-medium-emphasis mb-0 mt-1">Invoices, receipts, and customer agreements</p>
        </div>
      </div>
    </div>

    <!-- Template picker (shown when no form is active) -->
    <v-row v-if="!activeForm">
      <v-col v-for="template in formTemplates" :key="template.label" cols="12" sm="6" md="4">
        <v-card class="rounded-xl border pa-6 h-100 d-flex flex-column" elevation="0" hover @click="openForm(template)">
          <div class="d-flex align-center gap-3 mb-4">
            <v-avatar size="48" :color="template.color" variant="tonal" class="rounded-lg">
              <v-icon :icon="template.icon" size="24" :color="template.color" />
            </v-avatar>
          </div>
          <div>
            <h3 class="text-subtitle-1 font-weight-black">{{ template.label }}</h3>
            <p class="text-caption text-medium-emphasis font-weight-medium mt-1">{{ template.desc }}</p>
          </div>
          <div class="mt-auto pt-4">
            <p class="text-overline text-medium-emphasis mb-1">Includes</p>
            <div class="d-flex flex-wrap gap-1 mb-4">
              <v-chip v-for="tag in template.tags" :key="tag" size="small" :color="template.color" variant="tonal" class="font-weight-bold text-caption">
                {{ tag }}
              </v-chip>
            </div>
            <v-btn
              :color="template.color"
              variant="flat"
              class="w-100 rounded-pill text-none font-weight-bold"
            >
              Use Template
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Builder + Live Preview (side by side) -->
    <v-row v-if="activeForm">

      <!-- Left: Form Builder -->
      <v-col cols="12" xl="6">
        <v-card class="rounded-xl border pa-6 h-100" elevation="0">
          <div class="d-flex align-center gap-3 mb-6">
            <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="activeForm = null" />
            <v-avatar size="40" :color="activeForm.color" variant="tonal" class="rounded-lg">
              <v-icon :icon="activeForm.icon" size="20" :color="activeForm.color" />
            </v-avatar>
            <h3 class="text-subtitle-1 font-weight-black mb-0">{{ activeForm.label }}</h3>
          </div>

          <div class="d-flex flex-column gap-5">
            <!-- Business info (auto-filled from settings) -->
            <v-card class="rounded-lg pa-3 d-flex align-center gap-3 bg-surface-variant" elevation="0">
              <v-icon icon="mdi-office-building-outline" color="medium-emphasis" />
              <div>
                <p class="font-weight-black text-body-2 mb-0">{{ settings.businessName || 'Your Business' }}</p>
                <p class="text-caption text-medium-emphasis mb-0">{{ [settings.phone, settings.email].filter(Boolean).join(' · ') || 'Set phone & email in Settings' }}</p>
              </div>
            </v-card>

            <v-row dense>
              <v-col cols="12" sm="6">
                <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-1">Customer</p>
                <CustomerSelect v-model="form.customerId" @update:modelValue="onCustomerChange" />
              </v-col>
              <v-col cols="12" sm="6">
                <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-1">Linked Ticket</p>
                <v-select
                  v-model="form.ticketId"
                  :items="[{id: null, label: 'None'}, ...tickets.map((t: any) => ({id: t.id, label: `#${t.id} — ${t.device}`}))]"
                  item-title="label"
                  item-value="id"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:modelValue="onTicketChange"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-1">Date</p>
                <v-text-field v-model="form.date" type="date" variant="outlined" density="comfortable" hide-details />
              </v-col>
              <v-col v-if="activeForm.label !== 'Service Agreement'" cols="12" sm="6">
                <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-1">Due Date</p>
                <v-text-field v-model="form.dueDate" type="date" variant="outlined" density="comfortable" hide-details />
              </v-col>
            </v-row>

            <!-- Line Items (not for Service Agreement) -->
            <div v-if="activeForm.label !== 'Service Agreement'">
              <div class="d-flex align-center justify-space-between mb-3">
                <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-0">Line Items</p>
                <v-btn color="success" variant="tonal" size="small" class="rounded-pill text-none font-weight-bold" @click="addLineItem">
                  <v-icon start>mdi-plus</v-icon> Add Item
                </v-btn>
              </div>
              
              <div class="d-flex flex-column gap-2">
                <div v-for="(item, i) in form.lineItems" :key="i" class="d-flex align-center gap-2">
                  <v-text-field v-model="item.description" placeholder="Description" variant="outlined" density="compact" hide-details class="flex-grow-1" />
                  <v-text-field v-model.number="item.qty" type="number" min="1" placeholder="Qty" variant="outlined" density="compact" hide-details style="max-width: 80px" />
                  <v-text-field v-model.number="item.price" type="number" min="0" step="0.01" placeholder="Price" variant="outlined" density="compact" hide-details style="max-width: 100px" />
                  <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="removeLineItem(i)" />
                </div>
                <div v-if="!form.lineItems.length" class="text-caption font-weight-medium text-medium-emphasis py-2">
                  No line items — linked ticket price will be used automatically.
                </div>
              </div>
              <div v-if="form.lineItems.length > 0" class="mt-3 d-flex justify-end">
                <span class="text-subtitle-1 font-weight-black text-success">Total: {{ formatCurrency(lineItemsTotal) }}</span>
              </div>
            </div>

            <div>
              <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-1">Notes / Terms</p>
              <v-textarea v-model="form.notes" placeholder="Additional notes, payment terms, warranty info…" rows="2" auto-grow variant="outlined" hide-details />
            </div>

            <div v-if="activeForm.label === 'Service Agreement'">
              <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-1">Authorization Statement</p>
              <v-textarea v-model="form.authStatement" rows="3" auto-grow variant="outlined" hide-details
                placeholder="I authorize the above repair shop to perform diagnostics and repairs on my device. I understand that..." />
            </div>

            <v-btn
              color="success"
              variant="flat"
              class="rounded-pill text-none px-6 font-weight-bold mt-2"
              size="large"
              @click="generateAndPrint"
            >
              <v-icon start>mdi-printer</v-icon> Generate & Print
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- Right: Live Preview -->
      <v-col cols="12" xl="6">
        <v-card class="rounded-xl border bg-surface overflow-hidden d-flex flex-column h-100" elevation="0">
          <div class="px-5 py-3 border-b d-flex align-center gap-2 bg-surface-variant">
            <v-icon icon="mdi-eye-outline" size="16" color="medium-emphasis" />
            <span class="text-caption font-weight-black text-medium-emphasis text-uppercase">Live Preview</span>
            <v-spacer />
            <span class="text-caption font-weight-medium text-medium-emphasis">Updates as you type</span>
          </div>
          
          <div class="overflow-y-auto pa-8 bg-surface flex-grow-1" style="max-height: 800px; font-family: sans-serif;">
            <div class="d-flex justify-space-between align-start mb-8">
              <div>
                <h2 class="text-h5 font-weight-black mb-1" :style="`color: ${activeForm.color}`">{{ activeForm.label.toUpperCase() }}</h2>
                <p class="text-subtitle-2 font-weight-bold mb-0">{{ settings.businessName || 'Your Business Name' }}</p>
                <p class="text-caption text-medium-emphasis mb-0">{{ settings.phone || '' }}</p>
                <p class="text-caption text-medium-emphasis mb-0">{{ settings.email || '' }}</p>
                <p class="text-caption text-medium-emphasis mb-0">{{ settings.address || '' }}</p>
                <v-chip size="x-small" :color="activeForm.color" variant="tonal" class="mt-2 font-weight-bold">
                  #{{ docNumber }}
                </v-chip>
              </div>
              <div class="text-right text-caption text-medium-emphasis">
                <p class="mb-1"><span class="font-weight-black text-high-emphasis">Date:</span> {{ form.date || today }}</p>
                <p v-if="form.dueDate" class="mb-0"><span class="font-weight-black text-high-emphasis">Due:</span> {{ form.dueDate }}</p>
              </div>
            </div>

            <v-card class="rounded-xl pa-4 mb-6" :style="`background-color: ${activeForm.color}08; border: 1px solid ${activeForm.color}20`" elevation="0">
              <p class="text-caption font-weight-black text-high-emphasis mb-1">Bill To</p>
              <p class="text-body-2 font-weight-bold mb-0">{{ previewCustomer?.name || 'Walk-in Customer' }}</p>
              <p v-if="previewCustomer?.phone" class="text-caption text-medium-emphasis mb-0">{{ previewCustomer.phone }}</p>
              <p v-if="previewCustomer?.email" class="text-caption text-medium-emphasis mb-0">{{ previewCustomer.email }}</p>
            </v-card>

            <v-card v-if="previewTicket" class="rounded-xl pa-4 mb-6" :style="`background-color: ${activeForm.color}06; border: 1px solid ${activeForm.color}14`" elevation="0">
              <p class="text-caption font-weight-black text-high-emphasis mb-1">Ticket #{{ previewTicket.id }}</p>
              <p class="text-body-2 font-weight-medium mb-0">{{ previewTicket.device }} {{ previewTicket.deviceModel }}</p>
              <p class="text-caption text-medium-emphasis mb-0">{{ previewTicket.issue }}</p>
            </v-card>

            <v-table v-if="activeForm.label !== 'Service Agreement'" class="mb-6 bg-transparent" density="compact">
              <thead>
                <tr>
                  <th class="text-left text-uppercase text-caption font-weight-black text-medium-emphasis">Description</th>
                  <th class="text-center text-uppercase text-caption font-weight-black text-medium-emphasis">Qty</th>
                  <th class="text-right text-uppercase text-caption font-weight-black text-medium-emphasis">Price</th>
                  <th class="text-right text-uppercase text-caption font-weight-black text-medium-emphasis">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(li, i) in previewLineItems" :key="i">
                  <td class="text-body-2 font-weight-medium">{{ li.description || '—' }}</td>
                  <td class="text-center text-body-2 text-medium-emphasis">{{ li.qty }}</td>
                  <td class="text-right text-body-2 text-medium-emphasis">{{ formatCurrency(li.price) }}</td>
                  <td class="text-right text-body-2 font-weight-bold">{{ formatCurrency(li.qty * li.price) }}</td>
                </tr>
                <tr v-if="!previewLineItems.length">
                  <td colspan="4" class="text-caption text-medium-emphasis font-italic py-3">Line items will appear here…</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="pt-4 text-subtitle-1 font-weight-black" :style="`color: ${activeForm.color}`">TOTAL</td>
                  <td class="pt-4 text-right text-subtitle-1 font-weight-black" :style="`color: ${activeForm.color}`">{{ formatCurrency(previewTotal) }}</td>
                </tr>
              </tfoot>
            </v-table>

            <v-card v-if="form.notes" class="rounded-xl pa-3 mb-4 text-caption text-medium-emphasis bg-surface-variant" elevation="0">
              {{ form.notes }}
            </v-card>

            <v-card v-if="activeForm.label === 'Service Agreement'" class="rounded-xl pa-4 mt-4 border bg-transparent" elevation="0">
              <p class="text-caption font-weight-black text-high-emphasis mb-2">Authorization</p>
              <p class="text-caption text-medium-emphasis mb-4">{{ form.authStatement || 'Customer authorization statement will appear here…' }}</p>
              <div class="d-flex gap-6 mt-6">
                <div>
                  <v-divider class="mb-1" style="width: 144px; border-color: rgba(var(--v-theme-on-surface), 0.5);" />
                  <p class="text-caption font-weight-bold text-medium-emphasis" style="font-size: 10px !important">Customer Signature</p>
                </div>
                <div>
                  <v-divider class="mb-1" style="width: 96px; border-color: rgba(var(--v-theme-on-surface), 0.5);" />
                  <p class="text-caption font-weight-bold text-medium-emphasis" style="font-size: 10px !important">Date</p>
                </div>
              </div>
            </v-card>

            <div class="mt-8 pt-4 border-t text-center text-caption text-medium-emphasis" style="font-size: 10px !important">
              Thank you for your business! — Generated by {{ settings.businessName || 'NovaOps' }}
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Invoice History -->
    <v-card v-if="invoiceHistory.length > 0" class="rounded-xl border pa-6 mt-2" elevation="0">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center gap-3">
          <v-avatar size="36" color="success" variant="tonal" class="rounded-lg">
            <v-icon icon="mdi-clock-outline" size="20" color="success" />
          </v-avatar>
          <h3 class="text-subtitle-1 font-weight-black mb-0">Recent Documents</h3>
        </div>
        <v-btn variant="text" size="small" color="medium-emphasis" class="font-weight-bold text-none" @click="invoiceHistory = []">
          Clear
        </v-btn>
      </div>
      
      <v-list lines="two" bg-color="transparent" class="pa-0">
        <v-list-item
          v-for="inv in invoiceHistory"
          :key="inv.id"
          class="rounded-xl mb-2 border"
        >
          <template #prepend>
            <v-avatar size="40" color="success" variant="tonal" class="rounded-lg">
              <v-icon icon="mdi-receipt-text-outline" size="20" />
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-bold text-body-2">{{ inv.type }} — {{ inv.customerName }}</v-list-item-title>
          <v-list-item-subtitle class="font-weight-medium text-caption">{{ inv.date }}</v-list-item-subtitle>
          <template #append>
            <div class="d-flex align-center gap-4">
              <span class="text-subtitle-2 font-weight-black text-success">{{ formatCurrency(inv.total) }}</span>
              <v-btn icon="mdi-printer" variant="text" color="medium-emphasis" size="small" @click="reprintInvoice(inv)" />
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Trade-In Wizard -->
    <TradeInWizard v-model="tradeInOpen" @saved="tradeInOpen = false" />
  </div>
</template>

<script setup lang="ts">
import TradeInWizard from '~/components/TradeInWizard.vue'

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
.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
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

<style scoped>
.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.m3-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px #10b98118; }
textarea.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
select.m3-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.m3-card { transition: transform 0.35s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease; }
.m3-card:hover  { transform: scale(1.025) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
.m3-card:active { transform: scale(0.97); }
</style>
