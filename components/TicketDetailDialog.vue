<template>
  <v-dialog
    v-model="isOpen"
    max-width="900"
  >
    <v-card class="rounded-2xl max-h-[90dvh] flex flex-col">
      <v-card-item class="border-b border-border shrink-0 py-3 px-4">
        <div class="flex items-center gap-3 w-full flex-wrap">
          <div
            class="w-11 h-11 rounded-lg flex items-center justify-center text-white shrink-0"
            :style="{ backgroundColor: ticketStatusColor(ticket?.status) }"
          >
            <i class="mdi mdi-ticket-confirmation-outline text-lg"></i>
          </div>
          <div class="flex-1 min-w-0">
            <span class="font-black block text-sm">Ticket #{{ ticket?.id }}</span>
            <span class="text-xs text-muted-foreground truncate block mt-0.5">
              {{ ticket?.device }} {{ ticket?.deviceModel }} · {{ getCustomerName(ticket?.customerId) }}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <v-select
              v-model="localStatus"
              :items="statusList"
              hide-details
              density="compact"
              class="w-40"
              @update:model-value="saveStatus"
            />
            <v-chip
              :color="ticket?.priority === 'high' ? 'error' : ticket?.priority === 'low' ? 'secondary' : 'info'"
              variant="tonal"
              class="font-bold text-xs capitalize shrink-0"
            >
              {{ ticket?.priority }}
            </v-chip>
            <v-btn icon="mdi-close" variant="text" color="secondary" class="!w-9 !h-9 shrink-0" @click="isOpen = false" />
          </div>
        </div>
      </v-card-item>

      <v-tabs v-model="activeTab" color="primary" class="px-4 border-b border-border shrink-0">
        <v-tab v-for="tab in tabs" :key="tab.id" :value="tab.id" class="text-none font-bold text-xs">
          {{ tab.label }}
          <v-chip v-if="tab.count" size="x-small" class="ml-2 font-bold" color="primary" variant="flat">
            {{ tab.count }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <v-card-text class="flex-1 overflow-y-auto p-4 min-h-0 bg-background">
        <v-window v-model="activeTab">
          <v-window-item value="info">
            <div class="flex flex-col gap-4 py-2">
              <div v-if="ticketCustomer" class="border border-border rounded-xl overflow-hidden bg-surface">
                <div class="flex items-center gap-3 p-4">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    :style="{ backgroundColor: avatarColor(ticketCustomer.name) }"
                  >{{ initials(ticketCustomer.name) }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm text-foreground">{{ ticketCustomer.name }}</div>
                    <div class="text-xs text-muted-foreground">Customer</div>
                  </div>
                  <div class="flex gap-1">
                    <a v-if="ticketCustomer.phone" :href="`tel:${ticketCustomer.phone}`" class="inline-flex w-9 h-9 items-center justify-center rounded-full hover:bg-muted text-foreground"><i class="mdi mdi-phone"></i></a>
                    <v-btn v-if="ticketCustomer.email" icon="mdi-email-outline" variant="text" color="secondary" class="rounded-full !w-9 !h-9" @click="emailCustomer" />
                  </div>
                </div>
                <ul class="m-0 p-2 list-none border-t border-border text-sm">
                  <li v-if="ticketCustomer.phone" class="flex items-center gap-2 px-2 py-1.5"><i class="mdi mdi-phone-outline text-muted-foreground"></i><a :href="`tel:${ticketCustomer.phone}`" class="text-primary font-medium">{{ ticketCustomer.phone }}</a></li>
                  <li v-if="ticketCustomer.email" class="flex items-center gap-2 px-2 py-1.5"><i class="mdi mdi-email-outline text-muted-foreground"></i><button type="button" class="text-left text-primary font-medium" @click="emailCustomer">{{ ticketCustomer.email }}</button></li>
                  <li v-if="ticketCustomer.address" class="flex items-center gap-2 px-2 py-1.5 text-foreground"><i class="mdi mdi-map-marker-outline text-muted-foreground"></i>{{ ticketCustomer.address }}</li>
                  <li v-if="!ticketCustomer.phone && !ticketCustomer.email && !ticketCustomer.address" class="px-2 py-1.5 text-xs text-muted-foreground italic">No contact details on file</li>
                </ul>
              </div>

              <div class="flex items-center justify-between">
                <p class="text-[10px] font-black text-muted-foreground uppercase m-0 tracking-wider">Device & Repair Details</p>
                <v-btn :variant="editingInfo ? 'flat' : 'outlined'" :color="editingInfo ? 'primary' : 'secondary'" class="text-none rounded-xl" @click="editingInfo = !editingInfo">
                  <i class="mdi mr-1" :class="editingInfo ? 'mdi-check' : 'mdi-pencil'"></i>
                  {{ editingInfo ? 'Done Editing' : 'Edit' }}
                </v-btn>
              </div>

              <div v-if="!editingInfo" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="border border-border rounded-xl p-4 bg-surface">
                  <p class="text-[10px] font-black text-muted-foreground uppercase mb-3 tracking-wider">Device</p>
                  <dl class="m-0 text-sm space-y-1 text-foreground">
                    <div class="flex justify-between"><dt class="text-muted-foreground">Brand</dt><dd class="font-medium m-0">{{ ticket?.device }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Model</dt><dd class="font-medium m-0">{{ ticket?.deviceModel || '—' }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Serial</dt><dd class="font-mono text-xs m-0">{{ ticket?.serialNumber || '—' }}</dd></div>
                    <div class="flex justify-between items-center"><dt class="text-muted-foreground">Priority</dt><dd class="m-0"><v-chip size="x-small" :color="ticket?.priority === 'high' ? 'error' : ticket?.priority === 'low' ? 'secondary' : 'info'" variant="tonal" class="font-bold capitalize">{{ ticket?.priority }}</v-chip></dd></div>
                  </dl>
                  <p v-if="ticket?.deviceDescription" class="text-xs text-muted-foreground mt-2 mb-0">{{ ticket?.deviceDescription }}</p>
                </div>
                <div class="border border-border rounded-xl p-4 bg-surface">
                  <p class="text-[10px] font-black text-muted-foreground uppercase mb-3 tracking-wider">Financials</p>
                  <dl class="m-0 text-sm space-y-1 text-foreground">
                    <div class="flex justify-between"><dt class="text-muted-foreground">Labor</dt><dd class="text-sky-600 font-medium m-0">{{ formatCurrency(laborTotal) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Parts</dt><dd class="font-medium m-0 text-violet-600">{{ formatCurrency(partsTotal) }}</dd></div>
                    <div class="flex justify-between font-bold border-t border-border pt-1 mt-1"><dt>Total</dt><dd class="m-0">{{ formatCurrency(laborTotal + partsTotal) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Paid</dt><dd class="text-emerald-600 font-medium m-0">{{ formatCurrency(paymentsTotal) }}</dd></div>
                    <div class="flex justify-between"><dt class="text-muted-foreground">Balance</dt><dd class="font-bold m-0" :class="balance > 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatCurrency(balance) }}</dd></div>
                  </dl>
                </div>
              </div>
              
              <div v-if="!editingInfo" class="border border-border rounded-xl p-4 bg-surface text-foreground">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-wider">Issue Reported</p>
                <p class="text-sm m-0">{{ ticket?.issue }}</p>
              </div>

              <div v-if="editingInfo" class="border border-border rounded-xl p-4 flex flex-col gap-3 bg-surface">
                <p class="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Edit Device Details</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <v-text-field v-model="localDevice" placeholder="Brand / Manufacturer" hide-details class="rounded-xl" />
                  <v-text-field v-model="localDeviceModel" placeholder="Model" hide-details class="rounded-xl" />
                  <v-text-field v-model="localSerialNumber" placeholder="Serial Number" hide-details class="rounded-xl font-mono" />
                  <v-select v-model="localPriority" :items="priorityOptions" item-title="label" item-value="value" placeholder="Priority" hide-details class="w-full" />
                </div>
                <v-textarea v-model="localIssue" rows="3" placeholder="Issue / problem description…" hide-details class="w-full rounded-xl" />
                <v-textarea v-model="localDeviceDescription" rows="2" placeholder="Device condition notes…" hide-details class="w-full rounded-xl" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <v-text-field v-model.number="localWarrantyDays" type="number" min="0" placeholder="Warranty days" hide-details class="rounded-xl" @update:model-value="saveField('warranty_days', localWarrantyDays)" />
                <v-text-field v-model="localTracking" placeholder="Tracking number" hide-details class="rounded-xl" @update:model-value="saveField('tracking', localTracking)" />
              </div>

              <div v-if="editingInfo" class="border border-border rounded-xl p-4 text-sm bg-surface text-foreground">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-wider">Financials</p>
                <div class="flex justify-between"><span class="text-muted-foreground">Balance</span>
                  <span class="font-bold" :class="balance > 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatCurrency(balance) }}</span>
                </div>
              </div>

              <div v-if="ticket?.signature" class="text-foreground">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-wider">Customer Signature</p>
                <div class="border border-border rounded-lg p-3 bg-muted/30">
                  <img :src="ticket.signature" alt="Signature" class="max-h-24 w-auto" />
                </div>
              </div>

              <div class="flex gap-4 text-xs text-muted-foreground">
                <span>Created: {{ formatDate(ticket?.createdAt) }}</span>
                <span>Updated: {{ formatDate(ticket?.updatedAt) }}</span>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="services">
            <div class="flex flex-col gap-4 py-2">
              <div class="border border-border rounded-xl p-4 bg-surface text-foreground">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-3 tracking-wider">Add Service</p>
                <div class="flex gap-2 mb-3">
                  <v-text-field v-model="serviceSearch" placeholder="Search catalog…" hide-details class="flex-1" />
                  <v-btn variant="outlined" color="secondary" class="text-none h-[48px] rounded-xl" @click="showCustomService = !showCustomService">
                    <i class="mdi mdi-plus mr-1"></i> Custom
                  </v-btn>
                </div>
                <div v-if="serviceSearch" class="border border-border rounded-lg max-h-40 overflow-y-auto mb-3 divide-y divide-border bg-surface text-foreground">
                  <button
                    v-for="svc in filteredCatalog"
                    :key="svc.id"
                    type="button"
                    class="w-full text-left px-3 py-2 hover:bg-muted flex justify-between gap-2"
                    @click="addCatalogService(svc)"
                  >
                    <div>
                      <div class="text-sm font-medium text-foreground">{{ svc.name }}</div>
                      <div class="text-xs text-muted-foreground mt-0.5">{{ formatMinutes(svc.estimated_minutes) }} · {{ svc.category }}</div>
                    </div>
                    <span class="text-sm font-bold text-emerald-600 shrink-0">{{ formatCurrency(svc.price) }}</span>
                  </button>
                  <p v-if="!filteredCatalog.length" class="text-center text-xs text-muted-foreground py-3">No services match</p>
                </div>
                <div v-if="showCustomService" class="border-t border-border pt-3 grid grid-cols-2 gap-2">
                  <v-text-field v-model="customService.name" placeholder="Service name" hide-details class="col-span-2" />
                  <v-text-field v-model.number="customService.rate" type="number" placeholder="Rate $" hide-details />
                  <v-text-field v-model.number="customService.minutes" type="number" placeholder="Minutes" hide-details />
                  <v-btn color="primary" class="col-span-2 rounded-xl text-none font-bold" :disabled="!customService.name" @click="addCustomService">Add</v-btn>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="(svc, idx) in localServices" :key="idx" class="border border-border rounded-xl p-3 flex items-center gap-3 bg-surface text-foreground">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium m-0 text-foreground">{{ svc.name }}</p>
                    <p class="text-xs text-muted-foreground m-0 mt-0.5">{{ formatMinutes(svc.minutes) }}</p>
                  </div>
                  <v-btn size="small" :variant="svc.useTime ? 'flat' : 'outlined'" :color="svc.useTime ? 'primary' : 'secondary'" class="text-none text-xs rounded-xl" @click="toggleTimeOverride(idx)">
                    <i class="mdi mdi-clock-outline mr-1"></i> {{ svc.useTime ? 'Time' : 'Flat' }}
                  </v-btn>
                  <v-text-field v-if="svc.useTime" v-model.number="svc.actualMinutes" type="number" min="0" hide-details class="w-20" density="compact" @update:model-value="saveServices" />
                  <span class="text-sm font-bold text-emerald-600 shrink-0">{{ formatCurrency(svc.useTime ? timeRate(svc.actualMinutes || svc.minutes, svc.hourlyRate) : svc.rate) }}</span>
                  <v-btn variant="text" color="error" icon="mdi-close" density="compact" @click="removeService(idx)" />
                </div>
                <p v-if="!localServices.length" class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">No services added yet</p>
              </div>
              <div v-if="localServices.length" class="flex justify-between font-bold p-3 rounded-xl bg-muted/40 text-sm text-foreground">
                <span>Labor Total</span><span class="text-emerald-600">{{ formatCurrency(laborTotal) }}</span>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="parts">
            <div class="flex flex-col gap-4 py-2">
              <div class="border border-border rounded-xl p-4 bg-surface text-foreground">
                <p class="text-[10px] font-black text-muted-foreground uppercase mb-3 tracking-wider">Add Part</p>
                <v-text-field v-model="partSearch" placeholder="Search inventory…" hide-details class="w-full mb-3" />
                <div v-if="partSearch" class="border border-border rounded-lg max-h-40 overflow-y-auto mb-3 divide-y divide-border bg-surface text-foreground">
                  <button
                    v-for="item in filteredInventory"
                    :key="item.id"
                    type="button"
                    class="w-full text-left px-3 py-2 hover:bg-muted flex justify-between align-center"
                    @click="addPart(item)"
                  >
                    <div>
                      <div class="text-sm font-medium text-foreground">{{ item.name }}</div>
                      <div class="text-xs text-muted-foreground mt-0.5">SKU: {{ item.sku }} · {{ item.stock }} in stock</div>
                    </div>
                    <span class="text-sm font-bold text-emerald-600 shrink-0">{{ formatCurrency(item.price) }}</span>
                  </button>
                </div>
                <hr class="border-border my-3" />
                <div class="grid grid-cols-3 gap-2">
                  <v-text-field v-model="manualPart.name" placeholder="Part name" hide-details class="col-span-2" />
                  <v-text-field v-model.number="manualPart.price" type="number" placeholder="Price" hide-details />
                  <v-btn variant="outlined" color="secondary" class="col-span-3 text-none rounded-xl" :disabled="!manualPart.name" @click="addManualPart"><i class="mdi mdi-plus mr-1"></i> Add Manual Part</v-btn>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="(part, idx) in localParts" :key="idx" class="border border-border rounded-xl p-3 flex items-center gap-3 bg-surface text-foreground">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium m-0 text-foreground">{{ part.name }}</p>
                    <p class="text-xs text-muted-foreground m-0 mt-0.5">{{ part.sku || 'Manual entry' }}</p>
                  </div>
                  <span class="text-xs text-muted-foreground shrink-0">Qty</span>
                  <v-text-field v-model.number="part.qty" type="number" min="1" hide-details class="w-16" density="compact" @update:model-value="saveParts" />
                  <span class="text-sm font-bold text-violet-600 shrink-0">{{ formatCurrency((part.price || 0) * (part.qty || 1)) }}</span>
                  <v-btn variant="text" color="error" icon="mdi-close" density="compact" @click="removePart(idx)" />
                </div>
                <p v-if="!localParts.length" class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">No parts added yet</p>
              </div>
              <div v-if="localParts.length" class="flex justify-between font-bold p-3 rounded-xl bg-muted/40 text-sm text-foreground">
                <span>Parts Total</span><span class="text-violet-600">{{ formatCurrency(partsTotal) }}</span>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="payments">
            <div class="flex flex-col gap-4 py-2">
              <div class="grid grid-cols-3 gap-2">
                <div class="border border-border rounded-xl p-3 text-center bg-surface text-foreground">
                  <p class="text-xs text-muted-foreground m-0 mb-1">Invoice</p>
                  <p class="text-lg font-bold m-0">{{ formatCurrency(laborTotal + partsTotal) }}</p>
                </div>
                <div class="border border-border rounded-xl p-3 text-center bg-surface text-foreground">
                  <p class="text-xs text-muted-foreground m-0 mb-1">Paid</p>
                  <p class="text-lg font-bold text-emerald-600 m-0">{{ formatCurrency(paymentsTotal) }}</p>
                </div>
                <div class="border border-border rounded-xl p-3 text-center bg-surface text-foreground">
                  <p class="text-xs text-muted-foreground m-0 mb-1">Balance</p>
                  <p class="text-lg font-bold m-0" :class="balance > 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatCurrency(balance) }}</p>
                </div>
              </div>
              <div class="border border-border rounded-xl p-4 flex flex-col gap-3 bg-surface text-foreground">
                <p class="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Record Payment</p>
                <div class="grid grid-cols-2 gap-3">
                  <v-text-field v-model.number="newPayment.amount" type="number" min="0" step="0.01" placeholder="Amount" hide-details />
                  <v-select v-model="newPayment.method" :items="paymentMethods" placeholder="Method" hide-details class="w-full" />
                </div>
                <v-text-field v-model="newPayment.note" placeholder="Note (optional)" hide-details />
                <v-btn color="success" class="w-full font-bold text-none rounded-xl" :disabled="!newPayment.amount || !newPayment.method" @click="addPayment">
                  <i class="mdi mdi-currency-usd mr-1"></i> Record Payment
                </v-btn>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="(payment, idx) in localPayments" :key="idx" class="border border-border rounded-xl p-3 flex items-center gap-3 bg-surface text-foreground">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <i class="mdi mdi-currency-usd"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium capitalize m-0 text-foreground">{{ payment.method }}</p>
                    <p class="text-xs text-muted-foreground m-0 mt-0.5">{{ formatDate(payment.date) }}{{ payment.note ? ` · ${payment.note}` : '' }}</p>
                  </div>
                  <span class="text-sm font-bold text-emerald-600 shrink-0">{{ formatCurrency(payment.amount) }}</span>
                  <v-btn variant="text" color="error" icon="mdi-close" density="compact" @click="removePayment(idx)" />
                </div>
                <p v-if="!localPayments.length" class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">No payments recorded yet</p>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="notes">
            <div class="flex flex-col gap-4 py-2">
              <div class="flex gap-2">
                <v-textarea v-model="newNote" rows="2" placeholder="Add a note…" hide-details class="flex-1" />
                <v-btn variant="outlined" color="secondary" class="shrink-0 h-[64px] rounded-xl" :disabled="!newNote.trim()" @click="addNote"><i class="mdi mdi-plus"></i></v-btn>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="(note, idx) in localNotes" :key="idx" class="border border-border rounded-xl p-3 bg-surface text-foreground">
                  <div class="flex justify-between gap-2">
                    <p class="text-sm flex-1 m-0 text-foreground">{{ note.text }}</p>
                    <v-btn variant="text" color="error" icon="mdi-close" density="compact" @click="removeNote(idx)" />
                  </div>
                  <p class="text-xs text-muted-foreground mt-1.5 m-0">{{ formatDate(note.date) }}</p>
                </div>
                <p v-if="!localNotes.length" class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">No notes yet</p>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="guides">
            <div class="flex flex-col gap-4 py-2">
              <div v-if="loadingGuides" class="border border-border rounded-xl p-6 text-center bg-surface">
                <v-progress-circular indeterminate color="primary" size="32" width="4" />
                <p class="text-sm text-muted-foreground mt-2">Fetching repair guides for {{ ticket?.deviceModel }}…</p>
              </div>
              <div v-else-if="guides.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NuxtLink
                  v-for="guide in guides"
                  :key="guide.guideid"
                  :to="'/library/' + guide.guideid"
                  class="border border-border rounded-xl p-3 hover:bg-muted flex flex-col h-full no-underline text-foreground bg-surface"
                  @click="isOpen = false"
                >
                  <div class="flex gap-3 mb-2">
                    <img v-if="guide.image?.thumbnail" :src="guide.image.thumbnail" width="64" height="64" class="rounded-lg object-cover shrink-0" alt="" />
                    <div v-else class="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 text-foreground"><i class="mdi mdi-wrench"></i></div>
                    <div>
                      <div class="text-sm font-bold text-foreground leading-tight">{{ guide.title }}</div>
                      <v-chip size="x-small" :color="guide.difficulty === 'Easy' ? 'success' : guide.difficulty === 'Moderate' ? 'warning' : 'error'" variant="tonal" class="font-bold mt-1.5">
                        {{ guide.difficulty || 'Unknown' }}
                      </v-chip>
                    </div>
                  </div>
                  <p class="text-xs text-muted-foreground truncate mt-auto m-0">{{ guide.summary }}</p>
                </NuxtLink>
              </div>
              <p v-else class="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">
                No repair guides found for "{{ ticket?.deviceModel }}" on iFixit.
              </p>
              <p v-if="!loadingGuides && guides.length" class="text-xs text-center text-muted-foreground">
                Guides provided by <a href="https://www.ifixit.com" target="_blank" rel="noopener" class="text-primary">iFixit</a>
              </p>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions class="flex flex-wrap items-center gap-2 p-4 border-t border-border shrink-0 justify-end bg-muted/20">
        <v-btn variant="outlined" color="error" class="text-none rounded-xl" @click="$emit('delete', ticket)">
          <i class="mdi mdi-delete-outline mr-1"></i> Delete
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="ticket?.status === 'Completed' || balance > 0"
          color="primary"
          class="text-none rounded-xl"
          @click="collectPayment"
        >
          <i class="mdi mdi-credit-card-outline mr-1"></i> Collect Payment
        </v-btn>
        <v-btn variant="outlined" color="secondary" class="text-none rounded-xl" :disabled="!ticketCustomer?.email" @click="emailCustomer">Email</v-btn>
        <v-btn variant="outlined" color="secondary" class="text-none rounded-xl" @click="printIntakeLabel">Print Label</v-btn>
        <v-btn variant="text" color="secondary" class="text-none" @click="isOpen = false">Close</v-btn>
        <v-btn color="primary" class="text-none font-bold rounded-xl" :loading="saving" @click="saveAll">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import confetti from 'canvas-confetti'
import { printBarcodeLabel } from '~/utils/print'
import { openMailto } from '~/utils/contact'
import { useToast } from '~/composables/useToast'
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '~/stores/app'
import { useNotifications } from '~/composables/useNotifications'

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
