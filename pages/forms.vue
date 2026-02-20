<template>
  <div class="flex flex-col gap-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #10b981, #059669)">
          <FileText class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Forms & Invoices</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Generate invoices and customer-facing forms</p>
        </div>
      </div>
    </div>

    <!-- Form Templates -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="template in formTemplates" :key="template.label" class="m3-card rounded-[28px] p-6 flex flex-col gap-4 bg-card cursor-pointer" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0" @click="openForm(template)">
        <div class="w-14 h-14 rounded-[26px] flex items-center justify-center" :style="`background: linear-gradient(135deg, ${template.color}20, ${template.colorDark}20)`">
          <component :is="template.icon" class="w-7 h-7" :style="`color: ${template.color}`" />
        </div>
        <div>
          <h3 class="font-black">{{ template.label }}</h3>
          <p class="text-xs text-muted-foreground font-medium mt-1">{{ template.desc }}</p>
        </div>
        <button class="w-full h-10 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95" :style="`background: linear-gradient(135deg, ${template.color}, ${template.colorDark})`">Generate</button>
      </div>
    </div>

    <!-- Invoice generator -->
    <div v-if="activeForm" class="rounded-[32px] p-7 bg-card" style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-base font-black">{{ activeForm.label }}</h3>
        <button class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90" @click="activeForm = null"><X class="w-4 h-4" /></button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</label>
          <select v-model="invoiceForm.customerId" class="m3-input"><option :value="null">Select customer</option><option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
        <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Ticket / Reference</label>
          <select v-model="invoiceForm.ticketId" class="m3-input"><option :value="null">None</option><option v-for="t in tickets" :key="t.id" :value="t.id">#{{ t.id }} — {{ t.device }}</option></select></div>
        <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Date</label><input v-model="invoiceForm.date" type="date" class="m3-input" /></div>
        <div class="space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Due Date</label><input v-model="invoiceForm.dueDate" type="date" class="m3-input" /></div>
        <div class="md:col-span-2 space-y-2"><label class="text-xs font-black text-muted-foreground uppercase tracking-widest">Notes</label><textarea v-model="invoiceForm.notes" placeholder="Additional notes or terms…" rows="2" class="m3-input resize-none" style="height: auto; padding-top: 12px" /></div>
      </div>
      <button class="flex items-center gap-2.5 h-12 px-7 rounded-full text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140" @click="generateInvoice">
        <Printer class="w-4 h-4" /> Generate & Print
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText, Receipt, ClipboardCheck, X, Printer } from 'lucide-vue-next'
definePageMeta({ middleware: ['auth'] })
const appStore = useAppStore()
const customers = computed(() => appStore.customers ?? [])
const tickets   = computed(() => appStore.tickets ?? [])
const settings  = computed(() => appStore.settings ?? { businessName: 'NovaOps', currency: '$' })

const activeForm = ref<any>(null)
const invoiceForm = ref({ customerId: null as any, ticketId: null as any, date: new Date().toISOString().split('T')[0], dueDate: '', notes: '' })

const formTemplates = [
  { label: 'Invoice',           desc: 'Itemized billing invoice for customer', icon: Receipt, color: '#10b981', colorDark: '#059669' },
  { label: 'Repair Receipt',    desc: 'Print a receipt for completed repairs',   icon: ClipboardCheck, color: '#3b82f6', colorDark: '#2563eb' },
  { label: 'Service Agreement', desc: 'Customer authorization form',              icon: FileText, color: '#8b5cf6', colorDark: '#7c3aed' },
]

const openForm = (template: any) => { activeForm.value = template }

const generateInvoice = () => {
  const customer = customers.value.find((c: any) => c.id === invoiceForm.value.customerId)
  const ticket   = tickets.value.find((t: any) => t.id === invoiceForm.value.ticketId)
  const business = settings.value
  const html = `<!DOCTYPE html><html><head><title>Invoice</title><style>body{font-family:system-ui;padding:40px;max-width:700px;margin:auto}.header{display:flex;justify-content:space-between;margin-bottom:40px}h1{color:#10b981;font-size:32px;font-weight:900}.info{background:#f0fdf4;padding:20px;border-radius:16px;margin-bottom:24px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb}.total{font-weight:900;font-size:20px;color:#10b981}</style></head><body>
    <div class="header"><div><h1>INVOICE</h1><p>${business.businessName || 'NovaOps'}</p><p>${business.phone || ''}</p></div><div style="text-align:right"><p><strong>Date:</strong> ${invoiceForm.value.date}</p>${invoiceForm.value.dueDate ? `<p><strong>Due:</strong> ${invoiceForm.value.dueDate}</p>` : ''}</div></div>
    <div class="info"><strong>Bill To:</strong><br>${customer?.name || 'Walk-in Customer'}<br>${customer?.phone || ''}<br>${customer?.email || ''}</div>
    ${ticket ? `<div class="info"><strong>Ticket #${ticket.id}:</strong> ${ticket.device} — ${ticket.issue}</div>` : ''}
    <div class="row"><span>Service</span><span>${ticket ? `${business.currency || '$'}${ticket.price.toFixed(2)}` : '—'}</span></div>
    <div class="row total"><span>TOTAL</span><span>${business.currency || '$'}${ticket ? ticket.price.toFixed(2) : '0.00'}</span></div>
    ${invoiceForm.value.notes ? `<p style="margin-top:24px;color:#6b7280">${invoiceForm.value.notes}</p>` : ''}
    <script>window.onload=()=>window.print()<\/script></body></html>`
  const w = window.open(''); if (w) { w.document.write(html); w.document.close() }
}
</script>
<style scoped>
.m3-card { transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s ease; }
.m3-card:hover { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-card:active { transform: scale(0.96); }
.m3-input { width: 100%; height: 48px; padding: 0 16px; border-radius: 20px; font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); outline: none; transition: all 0.2s ease; }
.m3-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px #10b98118; }
</style>
