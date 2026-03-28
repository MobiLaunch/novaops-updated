<template>
  <v-dialog v-model="isOpen" max-width="900" scrollable>
    <v-card rounded="xl" class="d-flex flex-column" style="max-height:90dvh">

      <!-- Header -->
      <v-card-item class="border-b">
        <template #prepend>
          <v-avatar :color="ticketStatusColor(ticket?.status)" size="44" rounded="lg">
            <TicketCheck :size="20" color="white" />
          </v-avatar>
        </template>
        <v-card-title class="text-h6 font-weight-black">Ticket #{{ ticket?.id }}</v-card-title>
        <v-card-subtitle>{{ ticket?.device }} {{ ticket?.deviceModel }} · {{ getCustomerName(ticket?.customerId) }}</v-card-subtitle>
        <template #append>
          <div class="d-flex align-center gap-2">
            <v-select
              v-model="localStatus"
              :items="statusList"
              density="compact"
              hide-details
              style="max-width:165px"
              @update:model-value="saveStatus"
            />
            <v-chip
              :color="ticket?.priority === 'high' ? 'error' : ticket?.priority === 'low' ? 'secondary' : 'info'"
              size="small"
              variant="tonal"
            >{{ ticket?.priority }}</v-chip>
            <v-btn icon="mdi-close" variant="text" size="small" @click="isOpen = false" />
          </div>
        </template>
      </v-card-item>

      <!-- Tabs -->
      <v-tabs v-model="activeTab" density="compact" class="px-4">
        <v-tab v-for="tab in tabs" :key="tab.id" :value="tab.id" size="small">
          {{ tab.label }}
          <v-chip
            v-if="tab.count !== undefined && tab.count > 0"
            size="x-small"
            color="primary"
            variant="tonal"
            class="ms-2"
          >{{ tab.count }}</v-chip>
        </v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-card-text class="flex-grow-1 overflow-y-auto">
        <v-tabs-window v-model="activeTab">

          <!-- ── Info Tab ──────────────────────────────────────────── -->
          <v-tabs-window-item value="info">
            <div class="d-flex flex-column gap-4 py-2">

              <!-- Customer Contact Card -->
              <v-card v-if="ticketCustomer" rounded="xl" variant="outlined">
                <v-card-item>
                  <template #prepend>
                    <v-avatar :color="avatarColor(ticketCustomer.name)" size="40" class="text-body-2 font-weight-bold text-white">
                      {{ initials(ticketCustomer.name) }}
                    </v-avatar>
                  </template>
                  <v-card-title class="text-body-1 font-weight-bold">{{ ticketCustomer.name }}</v-card-title>
                  <v-card-subtitle>Customer</v-card-subtitle>
                  <template #append>
                    <div class="d-flex gap-1">
                      <v-btn v-if="ticketCustomer.phone" icon="mdi-phone" size="small" variant="text" :href="`tel:${ticketCustomer.phone}`" />
                      <v-btn v-if="ticketCustomer.email" icon="mdi-email-outline" size="small" variant="text" @click="emailCustomer" />
                    </div>
                  </template>
                </v-card-item>
                <v-divider />
                <v-list density="compact" class="pa-2">
                  <v-list-item v-if="ticketCustomer.phone" prepend-icon="mdi-phone-outline" :title="ticketCustomer.phone" :href="`tel:${ticketCustomer.phone}`" />
                  <v-list-item v-if="ticketCustomer.email" prepend-icon="mdi-email-outline" :title="ticketCustomer.email" @click="emailCustomer" />
                  <v-list-item v-if="ticketCustomer.address" prepend-icon="mdi-map-marker-outline" :title="ticketCustomer.address" />
                  <v-list-item v-if="!ticketCustomer.phone && !ticketCustomer.email && !ticketCustomer.address" class="text-medium-emphasis text-caption font-italic">
                    No contact details on file
                  </v-list-item>
                </v-list>
              </v-card>

              <!-- Edit / View toggle -->
              <div class="d-flex align-center justify-space-between">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-0">Device & Repair Details</p>
                <v-btn
                  size="small"
                  variant="tonal"
                  :color="editingInfo ? 'primary' : undefined"
                  :prepend-icon="editingInfo ? 'mdi-check' : 'mdi-pencil'"
                  @click="editingInfo = !editingInfo"
                >{{ editingInfo ? 'Done Editing' : 'Edit' }}</v-btn>
              </div>

              <!-- VIEW MODE -->
              <v-row v-if="!editingInfo" dense>
                <v-col cols="12" sm="6">
                  <v-card rounded="xl" class="pa-4">
                    <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3">Device</p>
                    <div class="d-flex flex-column gap-1 text-body-2">
                      <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Brand</span><span class="font-weight-medium">{{ ticket?.device }}</span></div>
                      <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Model</span><span class="font-weight-medium">{{ ticket?.deviceModel || '—' }}</span></div>
                      <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Serial</span><span class="font-weight-medium text-caption" style="font-family:monospace">{{ ticket?.serialNumber || '—' }}</span></div>
                      <div class="d-flex justify-space-between align-center text-capitalize"><span class="text-medium-emphasis">Priority</span>
                        <v-chip :color="ticket?.priority === 'high' ? 'error' : ticket?.priority === 'low' ? 'secondary' : 'info'" size="x-small" variant="tonal">{{ ticket?.priority }}</v-chip>
                      </div>
                      <div v-if="ticket?.deviceDescription" class="pt-1"><span class="text-medium-emphasis d-block text-caption">Condition</span><p class="text-caption mt-1 mb-0">{{ ticket?.deviceDescription }}</p></div>
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-card rounded="xl" class="pa-4">
                    <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3">Financials</p>
                    <div class="d-flex flex-column gap-1 text-body-2">
                      <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Labor</span><span class="font-weight-medium text-info">{{ formatCurrency(laborTotal) }}</span></div>
                      <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Parts</span><span class="font-weight-medium" style="color:#8b5cf6">{{ formatCurrency(partsTotal) }}</span></div>
                      <v-divider class="my-1" />
                      <div class="d-flex justify-space-between"><span class="font-weight-bold">Total</span><span class="font-weight-bold">{{ formatCurrency(laborTotal + partsTotal) }}</span></div>
                      <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Paid</span><span class="font-weight-medium text-success">{{ formatCurrency(paymentsTotal) }}</span></div>
                      <div class="d-flex justify-space-between"><span class="text-medium-emphasis">Balance</span>
                        <span class="font-weight-bold" :class="balance > 0 ? 'text-error' : 'text-success'">{{ formatCurrency(balance) }}</span>
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
              <v-card v-if="!editingInfo" rounded="xl" class="pa-4">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2">Issue Reported</p>
                <p class="text-body-2 mb-0">{{ ticket?.issue }}</p>
              </v-card>

              <!-- EDIT MODE -->
              <v-card v-if="editingInfo" rounded="xl" class="pa-4">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3">Edit Device Details</p>
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="localDevice" label="Brand / Manufacturer" placeholder="Apple, Samsung…" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="localDeviceModel" label="Model" placeholder="iPhone 15 Pro…" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="localSerialNumber" label="Serial Number" placeholder="Optional" style="font-family:monospace" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select v-model="localPriority" label="Priority" :items="['low','normal','high']" />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea v-model="localIssue" label="Issue / Problem Description" rows="3" placeholder="Describe the issue…" />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea v-model="localDeviceDescription" label="Device Condition Notes" rows="2" placeholder="Color, visible damage, accessories included…" />
                  </v-col>
                </v-row>
              </v-card>

              <!-- Always-editable fields -->
              <v-row dense>
                <v-col cols="6">
                  <v-text-field v-model.number="localWarrantyDays" type="number" min="0" label="Warranty Days" placeholder="0" @change="saveField('warranty_days', localWarrantyDays)" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="localTracking" label="Tracking Number" placeholder="Optional" @change="saveField('tracking', localTracking)" />
                </v-col>
              </v-row>

              <!-- Financials summary (editing mode) -->
              <v-card v-if="editingInfo" rounded="xl" class="pa-4">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2">Financials</p>
                <v-row dense class="text-body-2">
                  <v-col cols="6"><div class="d-flex justify-space-between"><span class="text-medium-emphasis">Labor</span><span class="text-info font-weight-medium">{{ formatCurrency(laborTotal) }}</span></div></v-col>
                  <v-col cols="6"><div class="d-flex justify-space-between"><span class="text-medium-emphasis">Parts</span><span class="font-weight-medium" style="color:#8b5cf6">{{ formatCurrency(partsTotal) }}</span></div></v-col>
                  <v-col cols="12"><v-divider class="my-1" /><div class="d-flex justify-space-between"><span class="font-weight-bold">Balance</span>
                    <span class="font-weight-bold" :class="balance > 0 ? 'text-error' : 'text-success'">{{ formatCurrency(balance) }}</span>
                  </div></v-col>
                </v-row>
              </v-card>

              <!-- Signature -->
              <div v-if="ticket?.signature">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2">Customer Signature</p>
                <div class="border rounded-lg pa-3" style="background:rgba(0,0,0,0.02)">
                  <img :src="ticket.signature" alt="Signature" style="max-height:96px;width:auto" />
                </div>
              </div>

              <!-- Dates -->
              <div class="d-flex gap-4 text-caption text-medium-emphasis">
                <span>Created: {{ formatDate(ticket?.createdAt) }}</span>
                <span>Updated: {{ formatDate(ticket?.updatedAt) }}</span>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- ── Services / Labor Tab ──────────────────────────────── -->
          <v-tabs-window-item value="services">
            <div class="d-flex flex-column gap-4 py-2">

              <!-- Add service -->
              <v-card rounded="xl" class="pa-4">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3">Add Service</p>
                <div class="d-flex gap-2 mb-3">
                  <v-text-field
                    v-model="serviceSearch"
                    placeholder="Search catalog..."
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                    density="compact"
                    class="flex-grow-1"
                  />
                  <v-btn variant="outlined" size="small" @click="showCustomService = !showCustomService">
                    <v-icon start size="14">mdi-plus</v-icon> Custom
                  </v-btn>
                </div>

                <!-- Catalog results -->
                <v-list v-if="serviceSearch" density="compact" max-height="160" class="border rounded-lg overflow-y-auto mb-3">
                  <v-list-item
                    v-for="svc in filteredCatalog"
                    :key="svc.id"
                    :subtitle="`${formatMinutes(svc.estimated_minutes)} · ${svc.category}`"
                    rounded="lg"
                    @click="addCatalogService(svc)"
                  >
                    <template #title><span class="text-body-2 font-weight-medium">{{ svc.name }}</span></template>
                    <template #append><span class="text-body-2 font-weight-bold text-success ms-4">{{ formatCurrency(svc.flat_rate) }}</span></template>
                  </v-list-item>
                  <v-list-item v-if="filteredCatalog.length === 0" class="text-center text-caption text-medium-emphasis">No services match</v-list-item>
                </v-list>

                <!-- Custom service form -->
                <div v-if="showCustomService" class="border-t pt-3">
                  <v-row dense>
                    <v-col cols="8"><v-text-field v-model="customService.name" placeholder="Service name" density="compact" hide-details /></v-col>
                    <v-col cols="4"><v-text-field v-model.number="customService.rate" type="number" placeholder="Rate $" density="compact" hide-details /></v-col>
                    <v-col cols="6"><v-text-field v-model.number="customService.minutes" type="number" placeholder="Minutes" density="compact" hide-details /></v-col>
                    <v-col cols="6"><span class="text-caption text-medium-emphasis">= {{ formatCurrency(timeRate(customService.minutes)) }} @ hourly</span></v-col>
                    <v-col cols="12"><v-btn size="small" block @click="addCustomService" :disabled="!customService.name">Add</v-btn></v-col>
                  </v-row>
                </div>
              </v-card>

              <!-- Services list -->
              <div class="d-flex flex-column gap-2">
                <v-card
                  v-for="(svc, idx) in localServices"
                  :key="idx"
                  rounded="xl"
                  variant="outlined"
                  class="pa-3"
                >
                  <div class="d-flex align-center gap-3">
                    <div class="flex-grow-1" style="min-width:0">
                      <p class="text-body-2 font-weight-medium mb-0">{{ svc.name }}</p>
                      <p class="text-caption text-medium-emphasis mb-0">{{ formatMinutes(svc.minutes) }}</p>
                    </div>
                    <div class="d-flex align-center gap-2">
                      <v-btn
                        size="x-small"
                        :variant="svc.useTime ? 'tonal' : 'outlined'"
                        :color="svc.useTime ? 'info' : undefined"
                        @click="toggleTimeOverride(idx)"
                      >
                        <v-icon start size="12">mdi-clock-outline</v-icon>{{ svc.useTime ? 'Time' : 'Flat' }}
                      </v-btn>
                      <v-text-field
                        v-if="svc.useTime"
                        v-model.number="svc.actualMinutes"
                        type="number"
                        min="0"
                        density="compact"
                        hide-details
                        style="max-width:64px"
                        @change="saveServices"
                      />
                      <span v-if="svc.useTime" class="text-caption text-medium-emphasis">min</span>
                      <span class="text-body-2 font-weight-bold text-success" style="min-width:64px;text-align:right">
                        {{ formatCurrency(svc.useTime ? timeRate(svc.actualMinutes || svc.minutes, svc.hourlyRate) : svc.rate) }}
                      </span>
                    </div>
                    <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removeService(idx)" />
                  </div>
                </v-card>
                <v-card v-if="localServices.length === 0" rounded="xl" variant="outlined" class="pa-6 text-center text-body-2 text-medium-emphasis" style="border-style:dashed">
                  No services added yet — search the catalog above
                </v-card>
              </div>

              <!-- Labor total -->
              <div v-if="localServices.length > 0" class="d-flex justify-space-between align-center pa-3 rounded-xl text-body-2 font-weight-bold" style="background:rgba(0,0,0,0.04)">
                <span>Labor Total</span>
                <span class="text-success">{{ formatCurrency(laborTotal) }}</span>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- ── Parts Tab ──────────────────────────────────────────── -->
          <v-tabs-window-item value="parts">
            <div class="d-flex flex-column gap-4 py-2">
              <v-card rounded="xl" class="pa-4">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3">Add Part</p>
                <v-text-field
                  v-model="partSearch"
                  placeholder="Search inventory..."
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  density="compact"
                  class="mb-3"
                />
                <v-list v-if="partSearch" density="compact" max-height="160" class="border rounded-lg overflow-y-auto mb-3">
                  <v-list-item
                    v-for="item in filteredInventory"
                    :key="item.id"
                    :subtitle="`SKU: ${item.sku} · ${item.stock} in stock`"
                    rounded="lg"
                    @click="addPart(item)"
                  >
                    <template #title><span class="text-body-2 font-weight-medium">{{ item.name }}</span></template>
                    <template #append><span class="text-body-2 font-weight-bold text-success ms-4">{{ formatCurrency(item.price) }}</span></template>
                  </v-list-item>
                  <v-list-item v-if="filteredInventory.length === 0" class="text-center text-caption text-medium-emphasis">No items match</v-list-item>
                </v-list>
                <!-- Manual part entry -->
                <v-divider class="mb-3" />
                <v-row dense>
                  <v-col cols="8"><v-text-field v-model="manualPart.name" placeholder="Part name" density="compact" hide-details /></v-col>
                  <v-col cols="4"><v-text-field v-model.number="manualPart.price" type="number" placeholder="Price $" density="compact" hide-details /></v-col>
                  <v-col cols="12">
                    <v-btn variant="outlined" size="small" block @click="addManualPart" :disabled="!manualPart.name">
                      <v-icon start size="14">mdi-plus</v-icon> Add Manual Part
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>

              <!-- Parts list -->
              <div class="d-flex flex-column gap-2">
                <v-card
                  v-for="(part, idx) in localParts"
                  :key="idx"
                  rounded="xl"
                  variant="outlined"
                  class="pa-3"
                >
                  <div class="d-flex align-center gap-3">
                    <div class="flex-grow-1" style="min-width:0">
                      <p class="text-body-2 font-weight-medium mb-0">{{ part.name }}</p>
                      <p class="text-caption text-medium-emphasis mb-0">{{ part.sku || 'Manual entry' }}</p>
                    </div>
                    <div class="d-flex align-center gap-2">
                      <span class="text-caption text-medium-emphasis">Qty</span>
                      <v-text-field
                        v-model.number="part.qty"
                        type="number"
                        min="1"
                        density="compact"
                        hide-details
                        style="max-width:56px"
                        @change="saveParts"
                      />
                      <span class="text-body-2 font-weight-bold" style="color:#8b5cf6;min-width:64px;text-align:right">
                        {{ formatCurrency((part.price || 0) * (part.qty || 1)) }}
                      </span>
                    </div>
                    <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removePart(idx)" />
                  </div>
                </v-card>
                <v-card v-if="localParts.length === 0" rounded="xl" variant="outlined" class="pa-6 text-center text-body-2 text-medium-emphasis" style="border-style:dashed">
                  No parts added yet
                </v-card>
              </div>

              <div v-if="localParts.length > 0" class="d-flex justify-space-between align-center pa-3 rounded-xl text-body-2 font-weight-bold" style="background:rgba(0,0,0,0.04)">
                <span>Parts Total</span>
                <span style="color:#8b5cf6">{{ formatCurrency(partsTotal) }}</span>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- ── Payments Tab ───────────────────────────────────────── -->
          <v-tabs-window-item value="payments">
            <div class="d-flex flex-column gap-4 py-2">
              <!-- Balance summary -->
              <v-row dense>
                <v-col cols="4">
                  <v-card rounded="xl" class="pa-3 text-center">
                    <p class="text-caption text-medium-emphasis mb-1">Invoice</p>
                    <p class="text-h6 font-weight-bold mb-0">{{ formatCurrency(laborTotal + partsTotal) }}</p>
                  </v-card>
                </v-col>
                <v-col cols="4">
                  <v-card rounded="xl" class="pa-3 text-center">
                    <p class="text-caption text-medium-emphasis mb-1">Paid</p>
                    <p class="text-h6 font-weight-bold text-success mb-0">{{ formatCurrency(paymentsTotal) }}</p>
                  </v-card>
                </v-col>
                <v-col cols="4">
                  <v-card rounded="xl" class="pa-3 text-center">
                    <p class="text-caption text-medium-emphasis mb-1">Balance</p>
                    <p class="text-h6 font-weight-bold mb-0" :class="balance > 0 ? 'text-error' : 'text-success'">{{ formatCurrency(balance) }}</p>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Add payment -->
              <v-card rounded="xl" class="pa-4">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3">Record Payment</p>
                <v-row dense>
                  <v-col cols="6">
                    <v-text-field v-model.number="newPayment.amount" type="number" min="0" step="0.01" label="Amount" placeholder="0.00" />
                  </v-col>
                  <v-col cols="6">
                    <v-select v-model="newPayment.method" label="Method" :items="['cash','card','zelle','venmo','check','other']" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="newPayment.note" label="Note (optional)" placeholder="Deposit, partial payment, etc." />
                  </v-col>
                </v-row>
                <v-btn block color="success" :disabled="!newPayment.amount || !newPayment.method" @click="addPayment">
                  <v-icon start>mdi-currency-usd</v-icon> Record Payment
                </v-btn>
              </v-card>

              <!-- Payment history -->
              <div class="d-flex flex-column gap-2">
                <v-card
                  v-for="(payment, idx) in localPayments"
                  :key="idx"
                  rounded="xl"
                  variant="outlined"
                  class="pa-3"
                >
                  <div class="d-flex align-center gap-3">
                    <v-avatar color="success" size="32" rounded="lg" variant="tonal">
                      <v-icon size="16">mdi-currency-usd</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1" style="min-width:0">
                      <p class="text-body-2 font-weight-medium text-capitalize mb-0">{{ payment.method }}</p>
                      <p class="text-caption text-medium-emphasis mb-0">{{ formatDate(payment.date) }}{{ payment.note ? ` · ${payment.note}` : '' }}</p>
                    </div>
                    <span class="text-body-2 font-weight-bold text-success">{{ formatCurrency(payment.amount) }}</span>
                    <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removePayment(idx)" />
                  </div>
                </v-card>
                <v-card v-if="localPayments.length === 0" rounded="xl" variant="outlined" class="pa-6 text-center text-body-2 text-medium-emphasis" style="border-style:dashed">
                  No payments recorded yet
                </v-card>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- ── Notes Tab ─────────────────────────────────────────── -->
          <v-tabs-window-item value="notes">
            <div class="d-flex flex-column gap-4 py-2">
              <div class="d-flex gap-2">
                <v-textarea v-model="newNote" placeholder="Add a note..." rows="2" auto-grow class="flex-grow-1" />
                <v-btn icon="mdi-plus" size="small" class="align-self-start" :disabled="!newNote.trim()" @click="addNote" />
              </div>
              <div class="d-flex flex-column gap-2">
                <v-card
                  v-for="(note, idx) in localNotes"
                  :key="idx"
                  rounded="xl"
                  variant="outlined"
                  class="pa-3"
                >
                  <div class="d-flex align-start justify-space-between gap-2">
                    <p class="text-body-2 flex-grow-1 mb-0">{{ note.text }}</p>
                    <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removeNote(idx)" />
                  </div>
                  <p class="text-caption text-medium-emphasis mt-1 mb-0">{{ formatDate(note.date) }}</p>
                </v-card>
                <v-card v-if="localNotes.length === 0" rounded="xl" variant="outlined" class="pa-6 text-center text-body-2 text-medium-emphasis" style="border-style:dashed">
                  No notes yet
                </v-card>
              </div>
            </div>
          </v-tabs-window-item>

        </v-tabs-window>
      </v-card-text>

      <!-- Footer -->
      <v-divider />
      <v-card-actions class="pa-4 flex-wrap gap-2">
        <v-btn color="error" variant="tonal" prepend-icon="mdi-delete-outline" @click="$emit('delete', ticket)">Delete</v-btn>
        <v-spacer />
        <v-btn variant="outlined" prepend-icon="mdi-email-outline" :disabled="!ticketCustomer?.email" @click="emailCustomer">Email</v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-printer" @click="printIntakeLabel">Print Label</v-btn>
        <v-btn variant="text" @click="isOpen = false">Close</v-btn>
        <v-btn color="primary" :loading="saving" prepend-icon="mdi-content-save" @click="saveAll">Save</v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { X, Plus, Search, Clock, DollarSign, Save, Trash2, Loader2, Mail, TicketCheck, Printer, Phone, MapPin, Pencil, Check } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { printBarcodeLabel } from '~/utils/print'
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
])

const statusList = computed(() =>
  (settings.value?.statuses || 'Open,In Progress,Completed').split(',').map((s: string) => s.trim())
)

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
  toast.success('Status Updated', `Ticket #${props.ticket.id} → ${status}`)
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

const router = useRouter()

const ticketCustomer = computed(() =>
  customers.value?.find((c: any) => c.id === props.ticket?.customerId)
)

function emailCustomer() {
  if (!ticketCustomer.value?.email) return
  isOpen.value = false
  router.push({
    path: '/messages',
    query: {
      compose: '1',
      ticketId: String(props.ticket.id),
      customerId: String(props.ticket.customerId),
    }
  })
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
