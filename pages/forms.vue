<template>
  <div class="flex flex-col gap-8">

    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg"
          style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 6px 28px #10b98150">
          <FileText class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Forms</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Invoices, receipts, and customer agreements</p>
        </div>
      </div>
    </div>

    <!-- Template picker (shown when no form is active) -->
    <div v-if="!activeForm" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div v-for="template in formTemplates" :key="template.label"
        class="m3-card rounded-[28px] p-6 flex flex-col gap-4 bg-card cursor-pointer"
        style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
        @click="openForm(template)">
        <div class="w-14 h-14 rounded-[26px] flex items-center justify-center" :style="`background: ${template.color}18`">
          <component :is="template.icon" class="w-7 h-7" :style="`color: ${template.color}`" />
        </div>
        <div>
          <h3 class="font-black">{{ template.label }}</h3>
          <p class="text-xs text-muted-foreground font-medium mt-1">{{ template.desc }}</p>
        </div>
        <div class="mt-auto space-y-1">
          <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Includes</p>
          <div class="flex flex-wrap gap-1">
            <span v-for="tag in template.tags" :key="tag" class="px-2 py-0.5 rounded-full text-[10px] font-bold" :style="`background: ${template.color}14; color: ${template.color}`">{{ tag }}</span>
          </div>
        </div>
        <button class="w-full h-10 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95"
          :style="`background: linear-gradient(135deg, ${template.color}, ${template.colorDark})`">
          Use Template
        </button>
      </div>
    </div>

    <!-- Builder + Live Preview (side by side) -->
    <div v-if="activeForm" class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- Left: Form Builder -->
      <div class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <button class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all" @click="activeForm = null">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" :style="`background: ${activeForm.color}20`">
              <component :is="activeForm.icon" class="w-4 h-4" :style="`color: ${activeForm.color}`" />
            </div>
            <h3 class="text-base font-black">{{ activeForm.label }}</h3>
          </div>
        </div>

        <div class="space-y-5">
          <!-- Business info (auto-filled from settings) -->
          <div class="rounded-[20px] px-4 py-3 flex items-center gap-3 text-xs" style="background: hsl(var(--muted)/0.4)">
            <Building class="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div class="min-w-0">
              <p class="font-black truncate">{{ settings.businessName || 'Your Business' }}</p>
              <p class="text-muted-foreground truncate">{{ [settings.phone, settings.email].filter(Boolean).join(' · ') || 'Set phone & email in Settings' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="m3-label">Customer</label>
              <CustomerSelect v-model="form.customerId" @update:modelValue="onCustomerChange" />
            </div>
            <div class="space-y-2">
              <label class="m3-label">Linked Ticket</label>
              <select v-model="form.ticketId" class="m3-input" @change="onTicketChange">
                <option :value="null">None</option>
                <option v-for="t in tickets" :key="t.id" :value="t.id">#{{ t.id }} — {{ t.device }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="m3-label">Date</label>
              <input v-model="form.date" type="date" class="m3-input" />
            </div>
            <div v-if="activeForm.label !== 'Service Agreement'" class="space-y-2">
              <label class="m3-label">Due Date</label>
              <input v-model="form.dueDate" type="date" class="m3-input" />
            </div>
          </div>

          <!-- Line Items (not for Service Agreement) -->
          <div v-if="activeForm.label !== 'Service Agreement'">
            <div class="flex items-center justify-between mb-3">
              <label class="m3-label">Line Items</label>
              <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105" style="background: #10b98118; color: #10b981" @click="addLineItem">
                <Plus class="w-3 h-3" /> Add Item
              </button>
            </div>
            <div class="space-y-2">
              <div v-for="(item, i) in form.lineItems" :key="i" class="flex items-center gap-2">
                <input v-model="item.description" placeholder="Description" class="m3-input flex-1" />
                <input v-model.number="item.qty" type="number" min="1" placeholder="Qty" class="m3-input" style="width:68px" />
                <input v-model.number="item.price" type="number" min="0" step="0.01" placeholder="Price" class="m3-input" style="width:96px" />
                <button class="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 transition-all" @click="removeLineItem(i)">
                  <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <div v-if="!form.lineItems.length" class="text-xs text-muted-foreground font-semibold py-2 px-1">
                No line items — linked ticket price will be used automatically.
              </div>
            </div>
            <div v-if="form.lineItems.length > 0" class="mt-3 flex justify-end">
              <span class="text-sm font-black" style="color: #10b981">Total: {{ formatCurrency(lineItemsTotal) }}</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="m3-label">Notes / Terms</label>
            <textarea v-model="form.notes" placeholder="Additional notes, payment terms, warranty info…" rows="2" class="m3-input resize-none" style="height:auto;padding-top:12px;padding-bottom:12px" />
          </div>

          <div v-if="activeForm.label === 'Service Agreement'" class="space-y-2">
            <label class="m3-label">Authorization Statement</label>
            <textarea v-model="form.authStatement" rows="3" class="m3-input resize-none" style="height:auto;padding-top:12px;padding-bottom:12px"
              placeholder="I authorize the above repair shop to perform diagnostics and repairs on my device. I understand that..." />
          </div>

          <button
            class="flex items-center gap-2.5 h-12 px-7 rounded-full text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95"
            style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140"
            @click="generateAndPrint"
          >
            <Printer class="w-4 h-4" /> Generate & Print
          </button>
        </div>
      </div>

      <!-- Right: Live Preview -->
      <div class="rounded-[32px] overflow-hidden bg-white dark:bg-zinc-900" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="px-5 py-3 border-b border-border/40 flex items-center gap-2" style="background: hsl(var(--muted)/0.3)">
          <Eye class="w-4 h-4 text-muted-foreground" />
          <span class="text-xs font-black text-muted-foreground uppercase tracking-widest">Live Preview</span>
          <span class="ml-auto text-xs text-muted-foreground font-medium">Updates as you type</span>
        </div>
        <div class="overflow-auto" style="max-height: 680px">
          <div class="p-8 min-h-[600px] font-sans text-gray-900" style="background: white; font-size: 13px">
            <!-- Preview content -->
            <div class="flex justify-between items-start mb-8">
              <div>
                <div class="text-2xl font-black mb-1" :style="`color: ${activeForm.color}`">{{ activeForm.label.toUpperCase() }}</div>
                <p class="font-bold text-sm">{{ settings.businessName || 'Your Business Name' }}</p>
                <p class="text-gray-500 text-xs">{{ settings.phone || '' }}</p>
                <p class="text-gray-500 text-xs">{{ settings.email || '' }}</p>
                <p class="text-gray-500 text-xs">{{ settings.address || '' }}</p>
                <span class="inline-block mt-2 text-xs font-black px-3 py-0.5 rounded-full" :style="`background: ${activeForm.color}18; color: ${activeForm.color}`">#{{ docNumber }}</span>
              </div>
              <div class="text-right text-xs text-gray-500 space-y-1">
                <p><span class="font-black text-gray-700">Date:</span> {{ form.date || today }}</p>
                <p v-if="form.dueDate"><span class="font-black text-gray-700">Due:</span> {{ form.dueDate }}</p>
              </div>
            </div>

            <div class="rounded-xl p-4 mb-6 text-xs" :style="`background: ${activeForm.color}08; border: 1px solid ${activeForm.color}20`">
              <p class="font-black text-gray-700 mb-1">Bill To</p>
              <p class="font-bold">{{ previewCustomer?.name || 'Walk-in Customer' }}</p>
              <p v-if="previewCustomer?.phone" class="text-gray-500">{{ previewCustomer.phone }}</p>
              <p v-if="previewCustomer?.email" class="text-gray-500">{{ previewCustomer.email }}</p>
            </div>

            <div v-if="previewTicket" class="rounded-xl p-4 mb-6 text-xs" :style="`background: ${activeForm.color}06; border: 1px solid ${activeForm.color}14`">
              <p class="font-black text-gray-700 mb-1">Ticket #{{ previewTicket.id }}</p>
              <p class="font-medium">{{ previewTicket.device }} {{ previewTicket.deviceModel }}</p>
              <p class="text-gray-500">{{ previewTicket.issue }}</p>
            </div>

            <table v-if="activeForm.label !== 'Service Agreement'" class="w-full mb-6 text-xs">
              <thead>
                <tr>
                  <th class="text-left py-2 border-b-2 border-gray-200 font-black text-gray-500 uppercase tracking-wider text-[10px]">Description</th>
                  <th class="text-center py-2 border-b-2 border-gray-200 font-black text-gray-500 uppercase tracking-wider text-[10px]">Qty</th>
                  <th class="text-right py-2 border-b-2 border-gray-200 font-black text-gray-500 uppercase tracking-wider text-[10px]">Price</th>
                  <th class="text-right py-2 border-b-2 border-gray-200 font-black text-gray-500 uppercase tracking-wider text-[10px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(li, i) in previewLineItems" :key="i" class="border-b border-gray-100">
                  <td class="py-2.5 font-medium">{{ li.description || '—' }}</td>
                  <td class="py-2.5 text-center text-gray-500">{{ li.qty }}</td>
                  <td class="py-2.5 text-right text-gray-500">{{ formatCurrency(li.price) }}</td>
                  <td class="py-2.5 text-right font-bold">{{ formatCurrency(li.qty * li.price) }}</td>
                </tr>
                <tr v-if="!previewLineItems.length">
                  <td colspan="4" class="py-3 text-gray-400 italic">Line items will appear here…</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="pt-4 font-black text-base" :style="`color: ${activeForm.color}`">TOTAL</td>
                  <td class="pt-4 text-right font-black text-base" :style="`color: ${activeForm.color}`">{{ formatCurrency(previewTotal) }}</td>
                </tr>
              </tfoot>
            </table>

            <div v-if="form.notes" class="rounded-xl p-3 mb-4 text-xs text-gray-600" style="background: #f9fafb; border: 1px solid #e5e7eb">
              {{ form.notes }}
            </div>

            <div v-if="activeForm.label === 'Service Agreement'" class="rounded-xl p-4 mt-4 text-xs" style="border: 1.5px solid #e5e7eb">
              <p class="font-black text-gray-700 mb-2">Authorization</p>
              <p class="text-gray-600 leading-relaxed mb-4">{{ form.authStatement || 'Customer authorization statement will appear here…' }}</p>
              <div class="mt-6 flex gap-16">
                <div>
                  <div class="border-b border-gray-400 w-36 mb-1" />
                  <p class="text-[10px] text-gray-500 font-bold">Customer Signature</p>
                </div>
                <div>
                  <div class="border-b border-gray-400 w-24 mb-1" />
                  <p class="text-[10px] text-gray-500 font-bold">Date</p>
                </div>
              </div>
            </div>

            <div class="mt-8 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center">
              Thank you for your business! — Generated by {{ settings.businessName || 'NovaOps' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invoice History -->
    <div v-if="invoiceHistory.length > 0" class="rounded-[32px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #10b98120">
            <Clock class="w-4 h-4" style="color: #10b981" />
          </div>
          <h3 class="text-sm font-black">Recent Documents</h3>
        </div>
        <button class="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors" @click="invoiceHistory = []">Clear</button>
      </div>
      <div class="space-y-2">
        <div v-for="inv in invoiceHistory" :key="inv.id"
          class="flex items-center gap-3 px-4 py-3 rounded-[20px] hover:bg-muted/20 transition-all"
          style="outline: 1.5px solid hsl(var(--border)/0.4); outline-offset: 0">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center flex-shrink-0" style="background: #10b98118">
            <Receipt class="w-4 h-4" style="color: #10b981" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate">{{ inv.type }} — {{ inv.customerName }}</p>
            <p class="text-xs text-muted-foreground font-medium">{{ inv.date }}</p>
          </div>
          <span class="text-sm font-black" style="color: #10b981">{{ formatCurrency(inv.total) }}</span>
          <button class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110" @click="reprintInvoice(inv)">
            <Printer class="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText, Receipt, ClipboardCheck, ShieldCheck, ChevronLeft, Printer, Plus, Trash2, Clock, Building, Eye } from 'lucide-vue-next'
definePageMeta({ middleware: ['auth'] })

const appStore   = useAppStore()
const customers  = computed(() => appStore.customers ?? [])
const tickets    = computed(() => appStore.tickets ?? [])
const settings   = computed(() => appStore.settings ?? { businessName: 'NovaOps', currency: '$' })
const today      = new Date().toISOString().split('T')[0]
const docNumber  = ref(Math.floor(1000 + Math.random() * 9000))

const activeForm     = ref<any>(null)
const invoiceHistory = ref<any[]>([])

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
    icon: Receipt, color: '#10b981', colorDark: '#059669',
    tags: ['Line items', 'Tax', 'Logo', 'Due date'],
  },
  {
    label: 'Repair Receipt', desc: 'Print a professional receipt for completed repairs',
    icon: ClipboardCheck, color: '#3b82f6', colorDark: '#2563eb',
    tags: ['Ticket ref', 'Parts list', 'Warranty', 'Signature'],
  },
  {
    label: 'Service Agreement', desc: 'Customer authorization and consent form',
    icon: ShieldCheck, color: '#8b5cf6', colorDark: '#7c3aed',
    tags: ['Authorization', 'Liability waiver', 'Signature line'],
  },
]

const openForm = (template: any) => {
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
