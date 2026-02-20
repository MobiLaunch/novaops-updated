<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-14 h-14 rounded-[28px] flex items-center justify-center shadow-xl"
          style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 6px 28px #10b98150"
        >
          <FileText class="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Forms & Invoices</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Generate invoices and customer-facing documents</p>
        </div>
      </div>
    </div>

    <!-- ── Form Templates ─────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="template in formTemplates"
        :key="template.label"
        class="m3-card rounded-[28px] p-6 flex flex-col gap-4 bg-card cursor-pointer"
        style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
        @click="openForm(template)"
      >
        <div class="w-14 h-14 rounded-[26px] flex items-center justify-center" :style="`background: ${template.color}20`">
          <component :is="template.icon" class="w-7 h-7" :style="`color: ${template.color}`" />
        </div>
        <div>
          <h3 class="font-black">{{ template.label }}</h3>
          <p class="text-xs text-muted-foreground font-medium mt-1">{{ template.desc }}</p>
        </div>
        <button
          class="w-full h-10 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95"
          :style="`background: linear-gradient(135deg, ${template.color}, ${template.colorDark})`"
        >Generate</button>
      </div>
    </div>

    <!-- ── Invoice Builder ────────────────────────────────────── -->
    <div v-if="activeForm" class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" :style="`background: ${activeForm.color}20`">
            <component :is="activeForm.icon" class="w-4 h-4" :style="`color: ${activeForm.color}`" />
          </div>
          <h3 class="text-base font-black">{{ activeForm.label }}</h3>
        </div>
        <button class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="activeForm = null">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</label>
          <select v-model="invoiceForm.customerId" class="m3-input">
            <option :value="null">Walk-in Customer</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Ticket / Reference</label>
          <select v-model="invoiceForm.ticketId" class="m3-input">
            <option :value="null">None</option>
            <option v-for="t in tickets" :key="t.id" :value="t.id">#{{ t.id }} — {{ t.device }}</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Invoice Date</label>
          <input v-model="invoiceForm.date" type="date" class="m3-input" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Due Date</label>
          <input v-model="invoiceForm.dueDate" type="date" class="m3-input" />
        </div>
      </div>

      <!-- Line Items -->
      <div class="mb-5">
        <div class="flex items-center justify-between mb-3">
          <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Line Items</label>
          <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95" style="background: #10b98118; color: #10b981" @click="addLineItem">
            <Plus class="w-3 h-3" /> Add Item
          </button>
        </div>
        <div class="space-y-2">
          <div v-for="(item, i) in invoiceForm.lineItems" :key="i" class="flex items-center gap-2">
            <input v-model="item.description" placeholder="Item description" class="m3-input flex-1" />
            <input v-model.number="item.qty" type="number" min="1" placeholder="Qty" class="m3-input" style="width: 70px" />
            <input v-model.number="item.price" type="number" min="0" placeholder="Price" class="m3-input" style="width: 100px" />
            <button class="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-110" @click="removeLineItem(i)">
              <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div v-if="invoiceForm.lineItems.length === 0" class="text-xs text-muted-foreground font-semibold py-2 px-1">
            No line items — click "Add Item" or a ticket will be used automatically.
          </div>
        </div>
        <div v-if="invoiceForm.lineItems.length > 0" class="mt-3 flex items-center justify-end gap-3">
          <span class="text-sm text-muted-foreground font-semibold">Total:</span>
          <span class="text-lg font-black" style="color: #10b981">{{ formatCurrency(lineItemsTotal) }}</span>
        </div>
      </div>

      <div class="space-y-2 mb-6">
        <label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Notes / Terms</label>
        <textarea v-model="invoiceForm.notes" placeholder="Additional notes or payment terms…" rows="2" class="m3-input resize-none" style="height: auto; padding-top: 12px" />
      </div>

      <button
        class="m3-btn flex items-center gap-2.5 h-12 px-7 rounded-full text-sm font-black text-white"
        style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140"
        @click="generateInvoice"
      >
        <Printer class="w-4 h-4" /> Generate & Print
      </button>
    </div>

    <!-- ── Invoice History ─────────────────────────────────────── -->
    <div v-if="invoiceHistory.length > 0" class="rounded-[32px] p-6 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-9 h-9 rounded-[18px] flex items-center justify-center" style="background: #10b98120">
          <Clock class="w-4 h-4" style="color: #10b981" />
        </div>
        <h3 class="text-sm font-black">Recent Documents</h3>
      </div>
      <div class="space-y-2">
        <div
          v-for="inv in invoiceHistory"
          :key="inv.id"
          class="flex items-center gap-3 px-4 py-3 rounded-[20px] hover:bg-muted/20 transition-all"
          style="outline: 1.5px solid hsl(var(--border)/0.4); outline-offset: 0"
        >
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
import { FileText, Receipt, ClipboardCheck, X, Printer, Plus, Trash2, Clock } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const customers = computed(() => appStore.customers ?? [])
const tickets   = computed(() => appStore.tickets ?? [])
const settings  = computed(() => appStore.settings ?? { businessName: 'NovaOps', currency: '$' })

const activeForm = ref<any>(null)
const invoiceHistory = ref<any[]>([])

const invoiceForm = ref({
  customerId: null as any,
  ticketId: null as any,
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  notes: '',
  lineItems: [] as { description: string; qty: number; price: number }[],
})

const formTemplates = [
  { label: 'Invoice',           desc: 'Itemized billing invoice for customer', icon: Receipt, color: '#10b981', colorDark: '#059669' },
  { label: 'Repair Receipt',    desc: 'Print a receipt for completed repairs',   icon: ClipboardCheck, color: '#3b82f6', colorDark: '#2563eb' },
  { label: 'Service Agreement', desc: 'Customer authorization & consent form',    icon: FileText, color: '#8b5cf6', colorDark: '#7c3aed' },
]

const openForm = (template: any) => {
  activeForm.value = template
  invoiceForm.value = {
    customerId: null, ticketId: null,
    date: new Date().toISOString().split('T')[0], dueDate: '', notes: '', lineItems: [],
  }
}

const addLineItem = () => {
  invoiceForm.value.lineItems.push({ description: '', qty: 1, price: 0 })
}
const removeLineItem = (i: number) => {
  invoiceForm.value.lineItems.splice(i, 1)
}

const lineItemsTotal = computed(() =>
  invoiceForm.value.lineItems.reduce((a, i) => a + (i.qty * i.price), 0)
)

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`

const buildInvoiceHTML = (data: any) => {
  const { customer, ticket, business, form, total, type } = data
  return `<!DOCTYPE html><html><head><title>${type}</title><style>
    body{font-family:system-ui,sans-serif;padding:40px;max-width:700px;margin:auto;color:#1a1a1a}
    .header{display:flex;justify-content:space-between;margin-bottom:40px}
    h1{color:#10b981;font-size:32px;font-weight:900;margin:0}
    .badge{background:#10b98118;color:#10b981;padding:4px 14px;border-radius:99px;font-size:12px;font-weight:800;display:inline-block;margin-top:6px}
    .info{background:#f0fdf4;padding:20px;border-radius:16px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{text-align:left;font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;padding:8px 0;border-bottom:2px solid #e5e7eb}
    td{padding:10px 0;border-bottom:1px solid #f3f4f6}
    .total-row td{font-weight:900;font-size:18px;color:#10b981;border:none;padding-top:16px}
    footer{color:#9ca3af;font-size:12px;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb}
  </style></head><body>
  <div class="header">
    <div>
      <h1>${type.toUpperCase()}</h1>
      <p style="margin:4px 0 0;font-weight:700">${business.businessName || 'NovaOps'}</p>
      <p style="margin:2px 0;color:#6b7280">${business.phone || ''}</p>
      <span class="badge">#INV-${Date.now().toString().slice(-6)}</span>
    </div>
    <div style="text-align:right">
      <p><strong>Date:</strong> ${form.date}</p>
      ${form.dueDate ? `<p><strong>Due:</strong> ${form.dueDate}</p>` : ''}
    </div>
  </div>
  <div class="info">
    <strong>Bill To:</strong><br>
    ${customer?.name || 'Walk-in Customer'}<br>
    ${customer?.phone ? `📞 ${customer.phone}<br>` : ''}
    ${customer?.email ? `✉️ ${customer.email}` : ''}
  </div>
  ${ticket ? `<div class="info"><strong>Ticket #${ticket.id}:</strong> ${ticket.device} — ${ticket.issue}</div>` : ''}
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      ${form.lineItems.length > 0
        ? form.lineItems.map((li: any) => `<tr><td>${li.description}</td><td>${li.qty}</td><td style="text-align:right">${business.currency || '$'}${li.price.toFixed(2)}</td><td style="text-align:right">${business.currency || '$'}${(li.qty * li.price).toFixed(2)}</td></tr>`).join('')
        : ticket ? `<tr><td>Repair Service — ${ticket.device}</td><td>1</td><td style="text-align:right">${business.currency || '$'}${(ticket.price || 0).toFixed(2)}</td><td style="text-align:right">${business.currency || '$'}${(ticket.price || 0).toFixed(2)}</td></tr>` : ''
      }
    </tbody>
    <tfoot><tr class="total-row"><td colspan="3">TOTAL</td><td style="text-align:right">${business.currency || '$'}${total.toFixed(2)}</td></tr></tfoot>
  </table>
  ${form.notes ? `<p style="color:#6b7280;padding:16px;background:#f9fafb;border-radius:12px">${form.notes}</p>` : ''}
  <footer>Thank you for your business! — Generated by NovaOps</footer>
  <script>window.onload=()=>window.print()<\/script>
  </body></html>`
}

const generateInvoice = () => {
  const customer = customers.value.find((c: any) => c.id === invoiceForm.value.customerId)
  const ticket   = tickets.value.find((t: any) => t.id === invoiceForm.value.ticketId)
  const business = settings.value
  const total = invoiceForm.value.lineItems.length > 0
    ? lineItemsTotal.value
    : (ticket?.price || 0)
  const data = { customer, ticket, business, form: invoiceForm.value, total, type: activeForm.value?.label || 'Invoice' }
  const html = buildInvoiceHTML(data)
  const w = window.open(''); if (w) { w.document.write(html); w.document.close() }
  invoiceHistory.value.unshift({
    id: Date.now(), type: activeForm.value?.label || 'Invoice',
    customerName: customer?.name || 'Walk-in', date: invoiceForm.value.date, total,
    data,
  })
}

const reprintInvoice = (inv: any) => {
  const html = buildInvoiceHTML(inv.data)
  const w = window.open(''); if (w) { w.document.write(html); w.document.close() }
}
</script>

<style scoped>
.m3-btn {
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
}
.m3-btn:hover  { transform: scale(1.05) translateY(-2px); }
.m3-btn:active { transform: scale(0.92); }

.m3-card {
  transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease;
}
.m3-card:hover  { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-card:active { transform: scale(0.96); }

.m3-input {
  width: 100%; height: 48px; padding: 0 16px; border-radius: 20px;
  font-size: 14px; font-weight: 500;
  background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7);
  outline: none; transition: all 0.2s ease;
}
.m3-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px #10b98118; }
</style>
