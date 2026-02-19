<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h2 class="text-2xl font-bold">Invoices & Forms</h2>
        <p class="text-sm text-muted-foreground mt-1">Create invoices, customer intake forms, repair estimates, and custom documents.</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <Button variant="outline" @click="activeView = 'list'" class="shadow-sm">
          <FileText class="w-4 h-4 mr-2" />
          View All
        </Button>
        <Button @click="startNew('invoice')" class="shadow-sm">
          <Plus class="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>
    </div>

    <!-- ── LIST VIEW ── -->
    <div v-if="activeView === 'list'" class="space-y-4">
      <!-- Quick create cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="template in formTemplates"
          :key="template.id"
          class="group cursor-pointer rounded-xl border-0 ring-1 ring-border p-5 hover:ring-primary/40 hover:bg-gradient-to-br hover:shadow-md transition-all hover:-translate-y-0.5"
          :style="''"
          @click="startNew(template.id)"
        >
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" :style="`background: ${template.color}18`">
            <component :is="template.icon" class="w-5 h-5" :style="`color: ${template.color}`" />
          </div>
          <p class="font-semibold text-sm">{{ template.name }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ template.desc }}</p>
        </div>
      </div>

      <!-- Saved documents -->
      <Card class="border-0 ring-1 ring-border shadow-sm overflow-hidden">
        <CardHeader class="border-b border-border/50 bg-muted/20">
          <div class="flex items-center justify-between">
            <CardTitle>Saved Documents</CardTitle>
            <Input v-model="docSearch" placeholder="Search docs…" class="w-48 h-8 text-sm" />
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="filteredDocs.length === 0" class="text-center py-12 text-muted-foreground">
            <FileText class="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p class="text-sm">No documents yet. Create your first above.</p>
          </div>
          <table v-else class="w-full text-sm">
            <thead class="bg-muted/30">
              <tr>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Document</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Customer</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Amount</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                <th class="px-4 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="doc in filteredDocs" :key="doc.id" class="hover:bg-muted/20 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-medium">#{{ doc.number }}</p>
                  <p class="text-xs text-muted-foreground truncate max-w-40">{{ doc.title }}</p>
                </td>
                <td class="px-4 py-3">
                  <Badge variant="outline" class="text-xs capitalize">{{ doc.type }}</Badge>
                </td>
                <td class="px-4 py-3 text-muted-foreground">{{ doc.customerName || '—' }}</td>
                <td class="px-4 py-3 font-medium">{{ doc.total ? formatCurrency(doc.total) : '—' }}</td>
                <td class="px-4 py-3">
                  <Badge :class="{
                    'bg-emerald-500/10 text-emerald-600': doc.status === 'paid',
                    'bg-amber-500/10 text-amber-600': doc.status === 'pending',
                    'bg-blue-500/10 text-blue-600': doc.status === 'draft',
                    'bg-red-500/10 text-red-600': doc.status === 'overdue',
                  }" class="text-xs capitalize">{{ doc.status }}</Badge>
                </td>
                <td class="px-4 py-3 text-muted-foreground text-xs">{{ formatDate(doc.createdAt) }}</td>
                <td class="px-4 py-3">
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" class="h-7 w-7" @click="editDoc(doc)">
                      <Pencil class="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" class="h-7 w-7" @click="printDoc(doc)">
                      <Printer class="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" class="h-7 w-7 text-destructive" @click="deleteDoc(doc.id)">
                      <Trash2 class="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>

    <!-- ── BUILDER VIEW ── -->
    <div v-if="activeView === 'builder'" class="space-y-4">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 flex-wrap bg-muted/30 rounded-xl px-3 py-2 border border-border/50">
        <Button variant="ghost" size="sm" @click="activeView = 'list'" class="h-8">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
        <div class="h-5 w-px bg-border" />
        <Select v-model="doc.type">
          <SelectTrigger class="w-40 h-8 text-sm border-0 bg-background shadow-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="estimate">Estimate</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="intake">Intake Form</SelectItem>
            <SelectItem value="custom">Custom Form</SelectItem>
          </SelectContent>
        </Select>
        <Badge :class="{
          'bg-emerald-500/10 text-emerald-600 border-emerald-500/25': doc.status === 'paid',
          'bg-amber-500/10 text-amber-600 border-amber-500/25': doc.status === 'pending',
          'bg-blue-500/10 text-blue-600 border-blue-500/25': doc.status === 'draft',
          'bg-red-500/10 text-red-600 border-red-500/25': doc.status === 'overdue',
        }" class="border capitalize">{{ doc.status }}</Badge>
        <div class="ml-auto flex gap-2">
          <Button variant="outline" size="sm" @click="saveDoc" class="shadow-sm">
            <Save class="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" size="sm" @click="printDoc(doc)" class="shadow-sm">
            <Printer class="w-4 h-4 mr-2" />
            Print / PDF
          </Button>
          <Button size="sm" @click="markAsSent" class="shadow-sm">
            <Send class="w-4 h-4 mr-2" />
            Mark Sent
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <!-- ── Left: Form Fields ── -->
        <div class="xl:col-span-2 space-y-4">

          <!-- Header info -->
          <Card class="border-0 ring-1 ring-border shadow-sm">
            <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center" :style="`background: ${currentTemplate.color}18`">
                  <component :is="currentTemplate.icon" class="w-4 h-4" :style="`color: ${currentTemplate.color}`" />
                </div>
                <CardTitle class="text-sm">Document Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent class="space-y-3 pt-4">
              <div class="space-y-1.5">
                <Label>Title / Description</Label>
                <Input v-model="doc.title" :placeholder="currentTemplate.titlePlaceholder" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <Label>Doc Number</Label>
                  <Input v-model="doc.number" class="font-mono" />
                </div>
                <div class="space-y-1.5">
                  <Label>Date</Label>
                  <Input v-model="doc.date" type="date" />
                </div>
              </div>
              <!-- Due date only for invoice/estimate -->
              <div v-if="doc.type === 'invoice' || doc.type === 'estimate'" class="space-y-1.5">
                <Label>Due Date</Label>
                <Input v-model="doc.dueDate" type="date" />
              </div>
              <div class="space-y-1.5">
                <Label>Status</Label>
                <Select v-model="doc.status">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem v-if="doc.type === 'invoice' || doc.type === 'receipt'" value="pending">Pending</SelectItem>
                    <SelectItem v-if="doc.type === 'invoice' || doc.type === 'receipt'" value="paid">Paid</SelectItem>
                    <SelectItem v-if="doc.type === 'invoice'" value="overdue">Overdue</SelectItem>
                    <SelectItem v-if="doc.type === 'estimate'" value="pending">Sent</SelectItem>
                    <SelectItem v-if="doc.type === 'estimate'" value="paid">Accepted</SelectItem>
                    <SelectItem v-if="doc.type === 'intake'" value="pending">In Progress</SelectItem>
                    <SelectItem v-if="doc.type === 'intake'" value="paid">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <!-- Customer -->
          <Card class="border-0 ring-1 ring-border shadow-sm">
            <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle class="text-sm">Customer</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 pt-4">
              <div class="space-y-1.5">
                <Label>Search or select customer</Label>
                <Select v-model="selectedCustomerId" @update:modelValue="fillCustomer">
                  <SelectTrigger><SelectValue placeholder="Select a customer…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in customers" :key="c.id" :value="String(c.id)">
                      {{ c.name }} — {{ c.phone }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1.5">
                <Label>Name</Label>
                <Input v-model="doc.customerName" placeholder="Full Name" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <Label>Phone</Label>
                  <Input v-model="doc.customerPhone" placeholder="555-0000" />
                </div>
                <div class="space-y-1.5">
                  <Label>Email</Label>
                  <Input v-model="doc.customerEmail" type="email" placeholder="email@…" />
                </div>
              </div>
              <div class="space-y-1.5">
                <Label>Address</Label>
                <Textarea v-model="doc.customerAddress" :rows="2" placeholder="Street, City, State" />
              </div>
            </CardContent>
          </Card>

          <!-- Device / Ticket — shown for invoice, estimate, intake, receipt (repair-related) but NOT custom -->
          <Card v-if="doc.type !== 'custom'" class="border-0 ring-1 ring-border shadow-sm">
            <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle class="text-sm">{{ doc.type === 'intake' ? 'Device Drop-Off' : 'Device / Ticket' }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 pt-4">
              <div class="space-y-1.5">
                <Label>Link to Ticket</Label>
                <Select v-model="selectedTicketId" @update:modelValue="fillTicket">
                  <SelectTrigger><SelectValue placeholder="Optional — select a ticket" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="t in tickets" :key="t.id" :value="String(t.id)">
                      #{{ t.id }} — {{ t.device }} {{ t.deviceModel }} ({{ t.status }})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <Label>Device</Label>
                  <Input v-model="doc.device" placeholder="iPhone 15 Pro" />
                </div>
                <div class="space-y-1.5">
                  <Label>Serial / IMEI</Label>
                  <Input v-model="doc.serialNumber" placeholder="IMEI or Serial" class="font-mono text-sm" />
                </div>
              </div>
              <div class="space-y-1.5">
                <Label>{{ doc.type === 'intake' ? 'Reported Issue' : 'Issue / Description' }}</Label>
                <Textarea v-model="doc.issue" :rows="2" placeholder="Cracked screen, water damage…" />
              </div>

              <!-- Intake-specific: condition, accessories, PIN -->
              <template v-if="doc.type === 'intake'">
                <div class="space-y-1.5">
                  <Label>Device Condition</Label>
                  <Select v-model="doc.deviceCondition">
                    <SelectTrigger><SelectValue placeholder="Select condition…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent — no visible damage</SelectItem>
                      <SelectItem value="good">Good — minor scratches</SelectItem>
                      <SelectItem value="fair">Fair — visible wear</SelectItem>
                      <SelectItem value="poor">Poor — heavy damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <Label>Passcode / PIN</Label>
                    <Input v-model="doc.devicePin" placeholder="Leave blank if none" class="font-mono" />
                  </div>
                  <div class="space-y-1.5">
                    <Label>Accessories</Label>
                    <Input v-model="doc.accessories" placeholder="Charger, case…" />
                  </div>
                </div>
                <div class="space-y-1.5">
                  <Label>Estimated Completion</Label>
                  <Input v-model="doc.dueDate" type="date" />
                </div>
                <div class="space-y-1.5">
                  <Label>Repair Estimate</Label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-muted-foreground text-sm">{{ settings?.currency || '$' }}</span>
                    <Input v-model.number="doc.estimatedCost" type="number" min="0" step="0.01" class="pl-7" placeholder="0.00" />
                  </div>
                </div>
              </template>
            </CardContent>
          </Card>

          <!-- Notes & Terms -->
          <Card class="border-0 ring-1 ring-border shadow-sm">
            <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle class="text-sm">{{ doc.type === 'intake' ? 'Authorization & Terms' : 'Notes & Terms' }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 pt-4">
              <div class="space-y-1.5">
                <Label>{{ doc.type === 'intake' ? 'Tech Notes' : 'Notes to Customer' }}</Label>
                <Textarea v-model="doc.notes" :rows="3" placeholder="Thank you for choosing us…" />
              </div>
              <div class="space-y-1.5">
                <Label>Terms & Conditions</Label>
                <Textarea v-model="doc.terms" :rows="3" placeholder="Payment due within 30 days…" />
              </div>
              <div class="space-y-1.5">
                <Label>Signature Line</Label>
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="sig" v-model="doc.requireSignature" class="w-4 h-4 rounded accent-primary" />
                  <Label for="sig" class="cursor-pointer font-normal">Include customer signature line</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- ── Right: Line Items (invoice/estimate/receipt/custom) or Intake summary + Preview ── -->
        <div class="xl:col-span-3 space-y-4">

          <!-- Line Items — only for invoice, estimate, receipt, custom -->
          <Card v-if="doc.type !== 'intake'" class="border-0 ring-1 ring-border shadow-sm">
            <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
              <div class="flex items-center justify-between">
                <CardTitle class="text-sm">Line Items</CardTitle>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" @click="addLineFromInventory">
                    <Package class="w-3 h-3 mr-1" />
                    From Inventory
                  </Button>
                  <Button size="sm" variant="outline" @click="addBlankLine">
                    <Plus class="w-3 h-3 mr-1" />
                    Add Line
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-2">
              <div
                v-for="(line, idx) in doc.lineItems"
                :key="idx"
                class="grid gap-2 p-3 rounded-lg border bg-muted/20"
                style="grid-template-columns: 1fr 70px 90px 90px 32px"
              >
                <Input v-model="line.description" placeholder="Service / Part description" class="text-sm h-8" />
                <Input v-model.number="line.qty" type="number" min="0" step="0.01" placeholder="Qty" class="text-sm h-8 text-center" />
                <Input v-model.number="line.unitPrice" type="number" min="0" step="0.01" placeholder="Unit $" class="text-sm h-8" />
                <div class="flex items-center justify-end text-sm font-semibold pr-1">
                  {{ formatCurrency(line.qty * line.unitPrice) }}
                </div>
                <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-destructive" @click="doc.lineItems.splice(idx, 1)">
                  <X class="w-3 h-3" />
                </Button>
              </div>
              <div v-if="doc.lineItems.length === 0" class="text-center py-6 text-muted-foreground text-sm">
                No line items yet. Add a service, part, or labor charge above.
              </div>

              <!-- Totals -->
              <div class="space-y-1.5 pt-3 border-t">
                <div class="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{{ formatCurrency(subtotal) }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <span class="flex-1">Discount</span>
                  <Input v-model.number="doc.discountPercent" type="number" min="0" max="100" class="w-20 h-7 text-sm text-right" />
                  <span class="text-xs">%</span>
                  <span class="min-w-16 text-right">-{{ formatCurrency(discountAmount) }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <span class="flex-1">Tax</span>
                  <Input v-model.number="doc.taxPercent" type="number" min="0" class="w-20 h-7 text-sm text-right" />
                  <span class="text-xs">%</span>
                  <span class="min-w-16 text-right">{{ formatCurrency(taxAmount) }}</span>
                </div>
                <div class="flex justify-between text-base font-bold border-t pt-2">
                  <span>Total</span>
                  <span class="text-primary">{{ formatCurrency(docTotal) }}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Intake checklist summary — only for intake forms -->
          <Card v-if="doc.type === 'intake'" class="border-0 ring-1 ring-border shadow-sm">
            <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle class="text-sm">Intake Checklist</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 pt-4">
              <p class="text-xs text-muted-foreground">Check items present / verified at drop-off</p>
              <div class="grid grid-cols-2 gap-2">
                <label v-for="item in intakeChecklist" :key="item.key" class="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <input type="checkbox" v-model="doc.checklist[item.key]" class="w-4 h-4 rounded accent-primary flex-shrink-0" />
                  {{ item.label }}
                </label>
              </div>
              <!-- Estimated cost summary -->
              <div v-if="doc.estimatedCost > 0" class="flex justify-between items-center pt-3 border-t border-border/60">
                <span class="text-sm font-medium">Repair Estimate</span>
                <span class="text-sm font-bold text-primary">{{ formatCurrency(doc.estimatedCost) }}</span>
              </div>
            </CardContent>
          </Card>

          <!-- Custom Fields -->
          <Card class="border-0 ring-1 ring-border shadow-sm">
            <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
              <div class="flex items-center justify-between">
                <CardTitle class="text-sm">Custom Fields</CardTitle>
                <Button size="sm" variant="ghost" @click="addCustomField">
                  <Plus class="w-3 h-3 mr-1" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent class="space-y-2">
              <p v-if="doc.customFields.length === 0" class="text-xs text-muted-foreground">Add any extra fields you need — passwords, PINs, special instructions, warranty details, etc.</p>
              <div
                v-for="(field, idx) in doc.customFields"
                :key="idx"
                class="flex gap-2 items-center"
              >
                <Input v-model="field.label" placeholder="Field name" class="w-36 text-sm h-8 flex-shrink-0" />
                <Input v-model="field.value" :placeholder="field.label || 'Value'" class="text-sm h-8 flex-1" />
                <Button variant="ghost" size="icon" class="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive" @click="doc.customFields.splice(idx, 1)">
                  <X class="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <!-- Print Preview -->
          <Card class="border-0 ring-1 ring-border shadow-sm overflow-hidden">
            <CardHeader class="pb-3 border-b border-border/50 bg-muted/20">
              <div class="flex items-center justify-between">
                <CardTitle class="text-sm flex items-center gap-2">
                  <Eye class="w-4 h-4 text-cyan-500" />
                  Document Preview
                </CardTitle>
                <Button variant="outline" size="sm" @click="printDoc(doc)">
                  <Printer class="w-4 h-4 mr-2" />
                  Print / Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent class="p-0">
              <!-- INVOICE / ESTIMATE / RECEIPT / CUSTOM preview -->
              <div v-if="doc.type !== 'intake'" class="bg-white text-black p-8 text-xs font-sans" style="min-height:500px">
                <!-- Header -->
                <div class="flex justify-between items-start mb-6">
                  <div>
                    <h1 class="text-xl font-bold text-gray-900">{{ settings?.businessName || 'NovaOps Repair' }}</h1>
                    <p v-if="settings?.phone" class="text-gray-500 text-xs mt-0.5">{{ settings.phone }}</p>
                    <p v-if="settings?.address" class="text-gray-500 text-xs">{{ settings.address }}</p>
                  </div>
                  <div class="text-right">
                    <h2 class="text-lg font-bold uppercase tracking-wider text-gray-700">{{ doc.type }}</h2>
                    <p class="text-gray-500">#{{ doc.number }}</p>
                    <p class="text-gray-500">Date: {{ doc.date }}</p>
                    <p v-if="doc.dueDate" class="text-gray-500">Due: {{ doc.dueDate }}</p>
                    <span class="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide"
                      :style="doc.status === 'paid' ? 'background:#dcfce7;color:#166534' : doc.status === 'pending' ? 'background:#fef3c7;color:#92400e' : 'background:#e0e7ff;color:#3730a3'"
                    >{{ doc.status }}</span>
                  </div>
                </div>
                <!-- Bill To / Device -->
                <div class="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p class="font-bold text-gray-400 uppercase text-xs tracking-wider mb-1">Bill To</p>
                    <p class="font-semibold">{{ doc.customerName || '—' }}</p>
                    <p class="text-gray-500">{{ doc.customerPhone }}</p>
                    <p class="text-gray-500">{{ doc.customerEmail }}</p>
                    <p class="text-gray-500">{{ doc.customerAddress }}</p>
                  </div>
                  <div v-if="doc.device || doc.serialNumber">
                    <p class="font-bold text-gray-400 uppercase text-xs tracking-wider mb-1">Device</p>
                    <p class="font-semibold">{{ doc.device }}</p>
                    <p class="text-gray-500 font-mono text-xs">{{ doc.serialNumber }}</p>
                    <p class="text-gray-500 mt-0.5">{{ doc.issue }}</p>
                  </div>
                </div>
                <!-- Line Items -->
                <table class="w-full mb-4 border-collapse">
                  <thead>
                    <tr class="border-b-2 border-gray-200">
                      <th class="text-left py-1.5 text-gray-500 font-semibold text-xs uppercase tracking-wider">Description</th>
                      <th class="text-center py-1.5 text-gray-500 font-semibold text-xs uppercase tracking-wider w-16">Qty</th>
                      <th class="text-right py-1.5 text-gray-500 font-semibold text-xs uppercase tracking-wider w-24">Unit Price</th>
                      <th class="text-right py-1.5 text-gray-500 font-semibold text-xs uppercase tracking-wider w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, i) in doc.lineItems" :key="i" class="border-b border-gray-100">
                      <td class="py-1.5">{{ line.description }}</td>
                      <td class="py-1.5 text-center">{{ line.qty }}</td>
                      <td class="py-1.5 text-right">{{ formatCurrency(line.unitPrice) }}</td>
                      <td class="py-1.5 text-right font-medium">{{ formatCurrency(line.qty * line.unitPrice) }}</td>
                    </tr>
                    <tr v-if="doc.lineItems.length === 0">
                      <td colspan="4" class="py-4 text-center text-gray-400">No line items</td>
                    </tr>
                  </tbody>
                </table>
                <!-- Totals -->
                <div class="flex justify-end mb-4">
                  <div class="w-48 space-y-1">
                    <div class="flex justify-between text-gray-500"><span>Subtotal</span><span>{{ formatCurrency(subtotal) }}</span></div>
                    <div v-if="doc.discountPercent > 0" class="flex justify-between text-gray-500"><span>Discount ({{ doc.discountPercent }}%)</span><span>-{{ formatCurrency(discountAmount) }}</span></div>
                    <div v-if="doc.taxPercent > 0" class="flex justify-between text-gray-500"><span>Tax ({{ doc.taxPercent }}%)</span><span>{{ formatCurrency(taxAmount) }}</span></div>
                    <div class="flex justify-between font-bold text-base border-t border-gray-300 pt-1"><span>Total</span><span>{{ formatCurrency(docTotal) }}</span></div>
                  </div>
                </div>
                <!-- Custom fields -->
                <div v-if="doc.customFields.length > 0" class="mb-4 grid grid-cols-2 gap-2">
                  <div v-for="f in doc.customFields" :key="f.label" class="bg-gray-50 rounded p-2">
                    <p class="text-gray-400 text-xs uppercase tracking-wider">{{ f.label }}</p>
                    <p class="font-medium">{{ f.value }}</p>
                  </div>
                </div>
                <!-- Notes / Terms -->
                <div v-if="doc.notes || doc.terms" class="border-t border-gray-200 pt-3 grid grid-cols-2 gap-4">
                  <div v-if="doc.notes">
                    <p class="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">Notes</p>
                    <p class="text-gray-600">{{ doc.notes }}</p>
                  </div>
                  <div v-if="doc.terms">
                    <p class="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">Terms</p>
                    <p class="text-gray-600">{{ doc.terms }}</p>
                  </div>
                </div>
                <!-- Signature -->
                <div v-if="doc.requireSignature" class="mt-6 border-t border-gray-200 pt-4 flex gap-8">
                  <div class="flex-1">
                    <div class="h-10 border-b border-gray-400 mb-1"></div>
                    <p class="text-xs text-gray-400">Customer Signature</p>
                  </div>
                  <div class="flex-1">
                    <div class="h-10 border-b border-gray-400 mb-1"></div>
                    <p class="text-xs text-gray-400">Date</p>
                  </div>
                </div>
              </div>

              <!-- INTAKE FORM preview -->
              <div v-else class="bg-white text-black p-8 text-xs font-sans" style="min-height:500px">
                <!-- Header -->
                <div class="flex justify-between items-start mb-5 pb-4 border-b-2 border-gray-800">
                  <div>
                    <h1 class="text-xl font-bold text-gray-900">{{ settings?.businessName || 'NovaOps Repair' }}</h1>
                    <p v-if="settings?.phone" class="text-gray-500 text-xs mt-0.5">{{ settings.phone }}</p>
                  </div>
                  <div class="text-right">
                    <h2 class="text-base font-bold uppercase tracking-wider text-gray-700">Device Intake Form</h2>
                    <p class="text-gray-500">#{{ doc.number }}</p>
                    <p class="text-gray-500">Date: {{ doc.date }}</p>
                  </div>
                </div>
                <!-- Customer + Device side by side -->
                <div class="grid grid-cols-2 gap-6 mb-5">
                  <div>
                    <p class="font-bold text-gray-400 uppercase text-xs tracking-wider mb-2">Customer</p>
                    <div class="space-y-1">
                      <div class="flex gap-2"><span class="text-gray-400 w-12">Name</span><span class="font-semibold">{{ doc.customerName || '—' }}</span></div>
                      <div class="flex gap-2"><span class="text-gray-400 w-12">Phone</span><span>{{ doc.customerPhone || '—' }}</span></div>
                      <div class="flex gap-2"><span class="text-gray-400 w-12">Email</span><span>{{ doc.customerEmail || '—' }}</span></div>
                    </div>
                  </div>
                  <div>
                    <p class="font-bold text-gray-400 uppercase text-xs tracking-wider mb-2">Device</p>
                    <div class="space-y-1">
                      <div class="flex gap-2"><span class="text-gray-400 w-16">Model</span><span class="font-semibold">{{ doc.device || '—' }}</span></div>
                      <div class="flex gap-2"><span class="text-gray-400 w-16">Serial</span><span class="font-mono">{{ doc.serialNumber || '—' }}</span></div>
                      <div class="flex gap-2"><span class="text-gray-400 w-16">Condition</span><span class="capitalize">{{ doc.deviceCondition || '—' }}</span></div>
                      <div class="flex gap-2"><span class="text-gray-400 w-16">Passcode</span><span class="font-mono">{{ doc.devicePin || '—' }}</span></div>
                    </div>
                  </div>
                </div>
                <!-- Issue -->
                <div class="mb-4 p-3 bg-gray-50 rounded">
                  <p class="font-bold text-gray-400 uppercase text-xs tracking-wider mb-1">Reported Issue</p>
                  <p class="font-medium">{{ doc.issue || '—' }}</p>
                </div>
                <!-- Accessories + estimate -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p class="font-bold text-gray-400 uppercase text-xs tracking-wider mb-1">Accessories Received</p>
                    <p>{{ doc.accessories || 'None' }}</p>
                  </div>
                  <div>
                    <p class="font-bold text-gray-400 uppercase text-xs tracking-wider mb-1">Repair Estimate</p>
                    <p class="font-bold text-base">{{ doc.estimatedCost > 0 ? formatCurrency(doc.estimatedCost) : 'TBD' }}</p>
                    <p v-if="doc.dueDate" class="text-gray-500">Est. completion: {{ doc.dueDate }}</p>
                  </div>
                </div>
                <!-- Custom fields -->
                <div v-if="doc.customFields.length > 0" class="mb-4 grid grid-cols-2 gap-2">
                  <div v-for="f in doc.customFields" :key="f.label" class="bg-gray-50 rounded p-2">
                    <p class="text-gray-400 text-xs uppercase tracking-wider">{{ f.label }}</p>
                    <p class="font-medium">{{ f.value }}</p>
                  </div>
                </div>
                <!-- Notes / Terms -->
                <div v-if="doc.notes || doc.terms" class="border-t border-gray-200 pt-3 mb-4 grid grid-cols-2 gap-4">
                  <div v-if="doc.notes"><p class="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">Tech Notes</p><p class="text-gray-600">{{ doc.notes }}</p></div>
                  <div v-if="doc.terms"><p class="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">Terms</p><p class="text-gray-600">{{ doc.terms }}</p></div>
                </div>
                <!-- Signature line always on intake -->
                <div class="border-t border-gray-200 pt-4 flex gap-8">
                  <div class="flex-1">
                    <div class="h-10 border-b border-gray-400 mb-1"></div>
                    <p class="text-xs text-gray-400">Customer Signature — I authorize the above repair</p>
                  </div>
                  <div class="w-32">
                    <div class="h-10 border-b border-gray-400 mb-1"></div>
                    <p class="text-xs text-gray-400">Date</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Inventory picker dialog for adding line items -->
    <Dialog v-model:open="inventoryPickerOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add from Inventory</DialogTitle>
        </DialogHeader>
        <div class="space-y-3 py-2">
          <Input v-model="invPickerSearch" placeholder="Search inventory…" autofocus />
          <div class="max-h-72 overflow-y-auto space-y-1">
            <div
              v-for="item in filteredInvPicker"
              :key="item.id"
              class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
              @click="addInventoryLine(item)"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ item.name }}</p>
                <p class="text-xs text-muted-foreground font-mono">{{ item.sku }}</p>
              </div>
              <span class="text-sm font-semibold flex-shrink-0">{{ formatCurrency(item.price) }}</span>
              <Badge variant="outline" class="text-xs flex-shrink-0">{{ item.stock }} left</Badge>
            </div>
            <p v-if="filteredInvPicker.length === 0" class="text-center text-sm text-muted-foreground py-6">No items match.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import {
  FileText, Plus, Pencil, Printer, Trash2, ArrowLeft, Save, Send,
  Package, Eye, X, Receipt, ClipboardList, FileSignature, FilePlus
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Badge } from '~/components/ui/badge'
import type { InventoryItem, Ticket, Customer } from '~/types'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { inventory, customers, tickets, settings } = storeToRefs(appStore)
const { saveAll } = appStore

// ── Form templates for quick create ───────────────
const formTemplates = [
  { id: 'invoice',  name: 'Invoice',         desc: 'Bill a customer for completed work',      icon: Receipt,       color: '#10b981', titlePlaceholder: 'e.g. Repair Invoice – iPhone 15 Pro' },
  { id: 'estimate', name: 'Repair Estimate', desc: 'Send a quote before starting repairs',    icon: ClipboardList, color: '#6366f1', titlePlaceholder: 'e.g. Screen Repair Estimate' },
  { id: 'intake',   name: 'Intake Form',     desc: 'Document device drop-off details',        icon: FileSignature, color: '#f59e0b', titlePlaceholder: 'e.g. iPhone 15 Pro Drop-Off' },
  { id: 'custom',   name: 'Custom Form',     desc: 'Build any document from scratch',         icon: FilePlus,      color: '#ec4899', titlePlaceholder: 'e.g. Warranty Certificate' },
]

const currentTemplate = computed(() =>
  formTemplates.find(t => t.id === doc.value.type) || formTemplates[0]
)

const intakeChecklist = [
  { key: 'powerOn',      label: 'Powers on' },
  { key: 'screenOk',     label: 'Screen intact' },
  { key: 'chargerIncl',  label: 'Charger included' },
  { key: 'caseIncl',     label: 'Case included' },
  { key: 'dataBackup',   label: 'Customer backed up' },
  { key: 'findMyOff',    label: 'Find My disabled' },
]

// ── Views ──────────────────────────────────────────
const activeView = ref<'list' | 'builder'>('list')
const docSearch  = ref('')

// ── Saved docs (localStorage-backed) ──────────────
interface SavedDoc {
  id: string
  number: string
  type: string
  title: string
  customerName: string
  total: number
  status: string
  createdAt: string
  [key: string]: any
}

const savedDocs = ref<SavedDoc[]>(loadDocs())

function loadDocs(): SavedDoc[] {
  try { return JSON.parse(localStorage.getItem('novaops_docs') || '[]') } catch { return [] }
}

function persistDocs() {
  localStorage.setItem('novaops_docs', JSON.stringify(savedDocs.value))
}

const filteredDocs = computed(() =>
  savedDocs.value.filter(d =>
    !docSearch.value ||
    d.number?.includes(docSearch.value) ||
    d.customerName?.toLowerCase().includes(docSearch.value.toLowerCase()) ||
    d.title?.toLowerCase().includes(docSearch.value.toLowerCase())
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
)

// ── Current doc state ─────────────────────────────
interface LineItem { description: string; qty: number; unitPrice: number }
interface CustomField { label: string; value: string }

const blankDoc = () => ({
  id:               '',
  number:           `DOC-${Date.now().toString().slice(-6)}`,
  type:             'invoice',
  title:            '',
  status:           'draft',
  date:             new Date().toISOString().split('T')[0],
  dueDate:          '',
  customerName:     '',
  customerPhone:    '',
  customerEmail:    '',
  customerAddress:  '',
  device:           '',
  serialNumber:     '',
  issue:            '',
  notes:            '',
  terms:            settings.value?.terms || '90-day warranty on all parts and labor. Payment due upon pickup.',
  requireSignature: false,
  discountPercent:  0,
  taxPercent:       settings.value?.taxRate ?? 0,
  lineItems:        [] as LineItem[],
  customFields:     [] as CustomField[],
  createdAt:        new Date().toISOString(),
  // Intake-specific
  deviceCondition:  '',
  devicePin:        '',
  accessories:      '',
  estimatedCost:    0,
  checklist:        {} as Record<string, boolean>,
})

const doc = ref(blankDoc())
const selectedCustomerId = ref('')
const selectedTicketId   = ref('')

// ── Computed totals ────────────────────────────────
const subtotal      = computed(() => doc.value.lineItems.reduce((s, l) => s + l.qty * l.unitPrice, 0))
const discountAmount = computed(() => subtotal.value * (doc.value.discountPercent / 100))
const taxAmount      = computed(() => (subtotal.value - discountAmount.value) * (doc.value.taxPercent / 100))
const docTotal       = computed(() => subtotal.value - discountAmount.value + taxAmount.value)

const formatCurrency = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const formatDate     = (s: string) => s ? new Date(s).toLocaleDateString() : '—'

// ── Start new doc ─────────────────────────────────
function startNew(type: string) {
  doc.value = blankDoc()
  doc.value.type = type
  selectedCustomerId.value = ''
  selectedTicketId.value   = ''
  activeView.value = 'builder'
}

// ── Fill from customer ────────────────────────────
function fillCustomer(id: string) {
  const c = (customers.value || []).find(cu => String(cu.id) === id)
  if (!c) return
  doc.value.customerName    = c.name
  doc.value.customerPhone   = c.phone
  doc.value.customerEmail   = c.email || ''
  doc.value.customerAddress = (c as any).address || ''
}

// ── Fill from ticket ──────────────────────────────
function fillTicket(id: string) {
  const t = (tickets.value || []).find(tk => String(tk.id) === id)
  if (!t) return
  doc.value.device       = `${t.device} ${t.deviceModel || ''}`.trim()
  doc.value.serialNumber = t.serialNumber || ''
  doc.value.issue        = t.issue || ''
  if (!doc.value.customerName) {
    const c = (customers.value || []).find(cu => cu.id === t.customerId)
    if (c) {
      selectedCustomerId.value = String(c.id)
      fillCustomer(String(c.id))
    }
  }
  // Pre-fill labor line from ticket price
  if (t.price > 0) {
    doc.value.lineItems.push({ description: `Repair Labor – ${t.issue}`, qty: 1, unitPrice: t.price })
  }
}

// ── Line items ────────────────────────────────────
function addBlankLine() {
  doc.value.lineItems.push({ description: '', qty: 1, unitPrice: 0 })
}

const inventoryPickerOpen = ref(false)
const invPickerSearch     = ref('')
const filteredInvPicker   = computed(() =>
  (inventory.value || []).filter(i =>
    !invPickerSearch.value ||
    i.name.toLowerCase().includes(invPickerSearch.value.toLowerCase()) ||
    (i.sku || '').toLowerCase().includes(invPickerSearch.value.toLowerCase())
  ).slice(0, 50)
)

function addLineFromInventory() {
  invPickerSearch.value = ''
  inventoryPickerOpen.value = true
}

function addInventoryLine(item: InventoryItem) {
  doc.value.lineItems.push({ description: item.name, qty: 1, unitPrice: item.price })
  inventoryPickerOpen.value = false
}

function addCustomField() {
  doc.value.customFields.push({ label: 'Field', value: '' })
}

// ── Save / Edit / Delete ──────────────────────────
function saveDoc() {
  const savedDoc: SavedDoc = {
    ...doc.value,
    id:           doc.value.id || Date.now().toString(),
    total:        docTotal.value,
    customerName: doc.value.customerName,
    createdAt:    doc.value.createdAt || new Date().toISOString(),
  }
  doc.value.id = savedDoc.id
  const idx = savedDocs.value.findIndex(d => d.id === savedDoc.id)
  if (idx > -1) savedDocs.value[idx] = savedDoc
  else savedDocs.value.unshift(savedDoc)
  persistDocs()
  alert('Document saved!')
}

function editDoc(saved: SavedDoc) {
  doc.value = { ...blankDoc(), ...saved }
  selectedCustomerId.value = ''
  selectedTicketId.value   = ''
  activeView.value = 'builder'
}

function deleteDoc(id: string) {
  if (!confirm('Delete this document?')) return
  savedDocs.value = savedDocs.value.filter(d => d.id !== id)
  persistDocs()
}

function markAsSent() {
  doc.value.status = 'pending'
  saveDoc()
}

// ── Print ─────────────────────────────────────────
function printDoc(d: any) {
  const currency = settings.value?.currency || '$'
  const bizName  = settings.value?.businessName || 'NovaOps Repair'
  const phone    = settings.value?.phone || ''
  const address  = settings.value?.address || ''

  const lines = (d.lineItems || []).map((l: LineItem) => `
    <tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:6px 0">${l.description}</td>
      <td style="padding:6px 0;text-align:center">${l.qty}</td>
      <td style="padding:6px 0;text-align:right">${currency}${l.unitPrice.toFixed(2)}</td>
      <td style="padding:6px 0;text-align:right;font-weight:600">${currency}${(l.qty * l.unitPrice).toFixed(2)}</td>
    </tr>
  `).join('')

  const sub    = (d.lineItems || []).reduce((s: number, l: LineItem) => s + l.qty * l.unitPrice, 0)
  const disc   = sub * ((d.discountPercent || 0) / 100)
  const tax    = (sub - disc) * ((d.taxPercent || 0) / 100)
  const total  = sub - disc + tax

  const customFields = (d.customFields || []).map((f: CustomField) => `
    <div style="background:#f9fafb;border-radius:6px;padding:8px 12px">
      <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 2px">${f.label}</p>
      <p style="font-weight:600;margin:0">${f.value}</p>
    </div>
  `).join('')

  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>${d.type} #${d.number}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111827; background: white; padding: 48px; max-width: 800px; margin: 0 auto; }
      @media print { body { padding: 24px; } }
      h1 { font-size: 22px; font-weight: 800; }
      table { width: 100%; border-collapse: collapse; }
    </style>
  </head><body onload="window.print()">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
      <div>
        <h1>${bizName}</h1>
        ${phone ? `<p style="color:#6b7280;margin-top:4px">${phone}</p>` : ''}
        ${address ? `<p style="color:#6b7280">${address}</p>` : ''}
      </div>
      <div style="text-align:right">
        <h2 style="font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#374151">${d.type}</h2>
        <p style="color:#6b7280">#${d.number}</p>
        <p style="color:#6b7280">Date: ${d.date}</p>
        ${d.dueDate ? `<p style="color:#6b7280">Due: ${d.dueDate}</p>` : ''}
        <span style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;${d.status==='paid'?'background:#dcfce7;color:#166534':d.status==='pending'?'background:#fef3c7;color:#92400e':'background:#e0e7ff;color:#3730a3'}">${d.status}</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
      <div>
        <p style="font-weight:700;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Bill To</p>
        <p style="font-weight:600">${d.customerName || '—'}</p>
        ${d.customerPhone ? `<p style="color:#6b7280">${d.customerPhone}</p>` : ''}
        ${d.customerEmail ? `<p style="color:#6b7280">${d.customerEmail}</p>` : ''}
        ${d.customerAddress ? `<p style="color:#6b7280">${d.customerAddress}</p>` : ''}
      </div>
      ${d.device ? `<div>
        <p style="font-weight:700;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Device</p>
        <p style="font-weight:600">${d.device}</p>
        ${d.serialNumber ? `<p style="color:#6b7280;font-family:monospace;font-size:12px">${d.serialNumber}</p>` : ''}
        ${d.issue ? `<p style="color:#6b7280;margin-top:4px">${d.issue}</p>` : ''}
      </div>` : ''}
    </div>

    <table style="margin-bottom:24px">
      <thead>
        <tr style="border-bottom:2px solid #e5e7eb">
          <th style="text-align:left;padding:8px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Description</th>
          <th style="text-align:center;padding:8px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:60px">Qty</th>
          <th style="text-align:right;padding:8px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:100px">Unit Price</th>
          <th style="text-align:right;padding:8px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:100px">Amount</th>
        </tr>
      </thead>
      <tbody>${lines}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
      <div style="width:200px">
        <div style="display:flex;justify-content:space-between;color:#6b7280;margin-bottom:4px"><span>Subtotal</span><span>${currency}${sub.toFixed(2)}</span></div>
        ${disc > 0 ? `<div style="display:flex;justify-content:space-between;color:#6b7280;margin-bottom:4px"><span>Discount (${d.discountPercent}%)</span><span>-${currency}${disc.toFixed(2)}</span></div>` : ''}
        ${tax > 0 ? `<div style="display:flex;justify-content:space-between;color:#6b7280;margin-bottom:4px"><span>Tax (${d.taxPercent}%)</span><span>${currency}${tax.toFixed(2)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:16px;border-top:2px solid #e5e7eb;padding-top:8px;margin-top:4px"><span>Total</span><span>${currency}${total.toFixed(2)}</span></div>
      </div>
    </div>

    ${customFields ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px">${customFields}</div>` : ''}

    ${d.notes || d.terms ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;border-top:1px solid #e5e7eb;padding-top:16px;margin-bottom:24px">
      ${d.notes ? `<div><p style="font-weight:700;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Notes</p><p style="color:#4b5563">${d.notes}</p></div>` : ''}
      ${d.terms ? `<div><p style="font-weight:700;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Terms</p><p style="color:#4b5563">${d.terms}</p></div>` : ''}
    </div>` : ''}

    ${d.requireSignature ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;border-top:1px solid #e5e7eb;padding-top:24px;margin-top:8px">
      <div><div style="height:48px;border-bottom:1px solid #374151;margin-bottom:4px"></div><p style="color:#9ca3af;font-size:11px">Customer Signature</p></div>
      <div><div style="height:48px;border-bottom:1px solid #374151;margin-bottom:4px"></div><p style="color:#9ca3af;font-size:11px">Date</p></div>
    </div>` : ''}
  </body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) { win.document.write(html); win.document.close() }
}
</script>
