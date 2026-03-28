<template>
  <div>

    <!-- ── Page header ─────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div>
        <p class="text-caption text-medium-emphasis mb-0">Repair Shop</p>
        <h1 class="text-h5 font-weight-black">Booking Management</h1>
        <p class="text-body-2 text-medium-emphasis">Tickets, house calls &amp; vendor repairs</p>
      </div>
      <v-btn
        v-if="activeTab === 'tickets'"
        color="warning"
        prepend-icon="mdi-plus"
        @click="newTicketOpen = true"
      >New Ticket</v-btn>
      <v-btn
        v-else-if="activeTab === 'housecalls'"
        color="success"
        prepend-icon="mdi-plus"
        @click="openNewHousecall"
      >Schedule Call</v-btn>
      <v-btn
        v-else-if="activeTab === 'thirdparty'"
        color="secondary"
        prepend-icon="mdi-plus"
        @click="openNewVendorRepair"
      >New Vendor Repair</v-btn>
    </div>

    <!-- ── Tabs ─────────────────────────────────────────────────── -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="tickets">
        <v-icon start>mdi-ticket-outline</v-icon>
        Tickets
        <v-chip v-if="openTicketCount > 0" size="x-small" class="ms-2" color="warning" variant="tonal">
          {{ openTicketCount }}
        </v-chip>
      </v-tab>
      <v-tab value="housecalls">
        <v-icon start>mdi-map-marker-outline</v-icon>
        House Calls
        <v-chip v-if="activeHousecallCount > 0" size="x-small" class="ms-2" color="success" variant="tonal">
          {{ activeHousecallCount }}
        </v-chip>
      </v-tab>
      <v-tab value="thirdparty">
        <v-icon start>mdi-domain</v-icon>
        Vendor Repairs
        <v-chip v-if="activeVendorCount > 0" size="x-small" class="ms-2" color="secondary" variant="tonal">
          {{ activeVendorCount }}
        </v-chip>
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TAB: TICKETS                                              -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <v-tabs-window-item value="tickets">

        <!-- KPI row -->
        <v-row dense class="mb-4">
          <v-col v-for="stat in ticketStats" :key="stat.label" cols="6" sm="3">
            <v-card rounded="xl" class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <v-avatar :color="stat.color" size="36" rounded="lg" variant="tonal">
                  <v-icon :color="stat.color" size="18">{{ stat.icon }}</v-icon>
                </v-avatar>
                <span class="text-h5 font-weight-black" :style="`color: ${stat.color}`">{{ stat.value }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Search + filter -->
        <v-card rounded="xl" class="mb-4 pa-4">
          <div class="d-flex align-center gap-3 flex-wrap">
            <v-text-field
              v-model="ticketSearch"
              placeholder="Search tickets…"
              prepend-inner-icon="mdi-magnify"
              hide-details
              density="compact"
              rounded="pill"
              style="max-width:320px;min-width:200px"
            />
            <div class="d-flex gap-2 flex-wrap">
              <v-chip
                v-for="s in [null, ...statusList]"
                :key="s ?? 'all'"
                :color="ticketFilter === s ? 'warning' : undefined"
                :variant="ticketFilter === s ? 'tonal' : 'outlined'"
                size="small"
                clickable
                @click="ticketFilter = s"
              >{{ s ?? 'All' }}</v-chip>
            </div>
          </div>
        </v-card>

        <!-- Tickets table -->
        <v-card rounded="xl">
          <v-data-table
            :headers="ticketHeaders"
            :items="filteredTickets"
            :items-per-page="15"
            :search="ticketSearch"
            density="comfortable"
            hover
            @click:row="(_, { item }) => openTicket(item)"
          >
            <template #item.id="{ item }">
              <span class="text-caption font-weight-bold text-warning">#{{ item.id }}</span>
            </template>

            <template #item.customerId="{ item }">
              <span class="text-body-2 font-weight-medium">{{ getCustomerName(item.customerId) }}</span>
            </template>

            <template #item.device="{ item }">
              <div>
                <div class="text-body-2 font-weight-medium">{{ item.device }} {{ item.deviceModel || '' }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.issue }}</div>
              </div>
            </template>

            <template #item.priority="{ item }">
              <v-chip
                :color="priorityChipColor(item.priority)"
                size="x-small"
                variant="tonal"
              >{{ item.priority || 'normal' }}</v-chip>
            </template>

            <template #item.status="{ item }">
              <v-chip
                :color="ticketStatusColor(item.status)"
                size="small"
                variant="tonal"
                rounded="pill"
              >
                <v-icon start size="8">mdi-circle</v-icon>
                {{ item.status }}
              </v-chip>
            </template>

            <template #item.price="{ item }">
              <span class="text-body-2 font-weight-bold" :style="`color: var(--v-theme-${ticketStatusColor(item.status)})`">
                {{ formatCurrency(item.price) }}
              </span>
            </template>

            <template #item.createdAt="{ item }">
              <span class="text-caption text-medium-emphasis">{{ formatDate(item.createdAt) }}</span>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex gap-1" @click.stop>
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click.stop="openTicket(item)" />
                <v-btn icon="mdi-content-copy" size="x-small" variant="text" @click.stop="copyTicketInfo(item)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click.stop="pendingDelete = item" />
              </div>
            </template>

            <template #no-data>
              <div class="text-center py-10 text-medium-emphasis">
                <v-icon size="48" class="mb-2 opacity-30">mdi-ticket-outline</v-icon>
                <p class="text-body-2 font-weight-medium">No tickets found</p>
                <v-btn color="warning" variant="tonal" size="small" class="mt-3" @click="newTicketOpen = true">
                  Create First Ticket
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-tabs-window-item>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TAB: HOUSE CALLS                                         -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <v-tabs-window-item value="housecalls">

        <!-- KPI row -->
        <v-row dense class="mb-4">
          <v-col cols="6" sm="3">
            <v-card rounded="xl" class="pa-4">
              <v-avatar color="success" size="36" rounded="lg" variant="tonal" class="mb-2">
                <v-icon color="success" size="18">mdi-map-marker</v-icon>
              </v-avatar>
              <div class="text-h5 font-weight-black text-success">{{ housecalls.length }}</div>
              <div class="text-caption text-medium-emphasis">All Calls</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card rounded="xl" class="pa-4">
              <v-avatar color="info" size="36" rounded="lg" variant="tonal" class="mb-2">
                <v-icon color="info" size="18">mdi-clock-outline</v-icon>
              </v-avatar>
              <div class="text-h5 font-weight-black text-info">{{ countHousecallByStatus('Scheduled') }}</div>
              <div class="text-caption text-medium-emphasis">Scheduled</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card rounded="xl" class="pa-4">
              <v-avatar color="warning" size="36" rounded="lg" variant="tonal" class="mb-2">
                <v-icon color="warning" size="18">mdi-wrench</v-icon>
              </v-avatar>
              <div class="text-h5 font-weight-black text-warning">{{ countHousecallByStatus('In Progress') }}</div>
              <div class="text-caption text-medium-emphasis">In Progress</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card rounded="xl" class="pa-4">
              <v-avatar color="primary" size="36" rounded="lg" variant="tonal" class="mb-2">
                <v-icon color="primary" size="18">mdi-check-circle-outline</v-icon>
              </v-avatar>
              <div class="text-h5 font-weight-black text-primary">{{ countHousecallByStatus('Completed') }}</div>
              <div class="text-caption text-medium-emphasis">Completed</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Filter chips -->
        <div class="d-flex gap-2 flex-wrap mb-4">
          <v-chip
            v-for="f in housecallFilterOptions"
            :key="f"
            :color="housecallFilter === f ? 'success' : undefined"
            :variant="housecallFilter === f ? 'tonal' : 'outlined'"
            size="small"
            clickable
            @click="housecallFilter = f"
          >{{ f }}</v-chip>
        </div>

        <!-- House call cards grid -->
        <v-row v-if="filteredHousecalls.length">
          <v-col
            v-for="call in filteredHousecalls"
            :key="call.id"
            cols="12"
            sm="6"
            lg="4"
          >
            <v-card rounded="xl" hover class="cursor-pointer" @click="viewHousecall(call)">
              <v-card-item>
                <template #prepend>
                  <v-avatar color="success" size="40" rounded="lg" variant="tonal">
                    <v-icon color="success">mdi-map-marker</v-icon>
                  </v-avatar>
                </template>
                <v-card-title class="text-body-1 font-weight-bold">{{ getCustomerName(call.customerId) }}</v-card-title>
                <v-card-subtitle>
                  <v-icon size="12" class="me-1">mdi-map-marker-outline</v-icon>{{ call.address }}
                </v-card-subtitle>
                <template #append>
                  <v-chip :color="callStatusVuetifyColor(call.status)" size="x-small" variant="tonal">{{ call.status }}</v-chip>
                </template>
              </v-card-item>

              <v-card-text class="pt-0">
                <p class="text-caption text-success font-weight-bold mb-2">
                  <v-icon size="12">mdi-calendar</v-icon> {{ formatDate(call.date) }} at {{ call.time }}
                </p>
                <!-- OSM map preview -->
                <div v-if="getOsmCardUrl(call.address)" class="rounded-lg overflow-hidden mb-2" style="height:80px;pointer-events:none">
                  <iframe :src="getOsmCardUrl(call.address)" class="w-100 h-100" style="border:0" />
                </div>
                <p class="text-caption text-medium-emphasis">{{ call.issue }}</p>
              </v-card-text>

              <v-card-actions @click.stop>
                <v-btn
                  v-if="call.status !== 'Completed'"
                  :color="call.status === 'Scheduled' ? 'warning' : 'success'"
                  variant="tonal"
                  size="small"
                  density="compact"
                  @click.stop="advanceHousecallStatus(call)"
                >{{ call.status === 'Scheduled' ? 'Start Call' : 'Complete' }}</v-btn>
                <v-spacer />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click.stop="pendingDeleteHousecall = call" />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Empty -->
        <v-card v-else rounded="xl" class="pa-10 text-center">
          <v-icon size="48" color="success" class="opacity-30 mb-3">mdi-map-marker</v-icon>
          <p class="text-body-1 font-weight-bold mb-1">No house calls {{ housecallFilter !== 'All' ? `with status "${housecallFilter}"` : 'scheduled' }}</p>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ housecallFilter === 'All' ? 'Schedule your first on-site visit' : 'Try a different filter' }}</p>
          <v-btn color="success" variant="tonal" @click="openNewHousecall">Schedule Call</v-btn>
        </v-card>
      </v-tabs-window-item>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TAB: VENDOR REPAIRS                                      -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <v-tabs-window-item value="thirdparty">

        <!-- KPI row -->
        <v-row dense class="mb-4">
          <v-col v-for="stat in vendorStats" :key="stat.label" cols="6" sm="3">
            <v-card rounded="xl" class="pa-4">
              <v-avatar :color="stat.color" size="36" rounded="lg" variant="tonal" class="mb-2">
                <v-icon :color="stat.color" size="18">{{ stat.icon }}</v-icon>
              </v-avatar>
              <div class="text-h5 font-weight-black" :style="`color: ${stat.color}`">{{ stat.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Search + filter -->
        <div class="d-flex align-center gap-3 flex-wrap mb-4">
          <v-text-field
            v-model="vendorSearch"
            placeholder="Search vendor repairs…"
            prepend-inner-icon="mdi-magnify"
            hide-details
            density="compact"
            rounded="pill"
            style="max-width:320px;min-width:200px"
          />
          <div class="d-flex gap-2 flex-wrap">
            <v-chip
              v-for="s in [null, ...vendorStatusList]"
              :key="s ?? 'all'"
              :color="vendorFilter === s ? 'secondary' : undefined"
              :variant="vendorFilter === s ? 'tonal' : 'outlined'"
              size="small"
              clickable
              @click="vendorFilter = s"
            >{{ s ?? 'All' }}</v-chip>
          </div>
        </div>

        <!-- Vendor repair cards -->
        <div v-if="filteredVendorRepairs.length" class="d-flex flex-column gap-3">
          <v-card
            v-for="repair in filteredVendorRepairs"
            :key="repair.id"
            rounded="xl"
            hover
            class="cursor-pointer"
            @click="openVendorRepair(repair)"
          >
            <v-card-item>
              <template #prepend>
                <v-avatar color="secondary" size="40" rounded="lg" variant="tonal">
                  <v-icon color="secondary">mdi-domain</v-icon>
                </v-avatar>
              </template>
              <v-card-title>
                {{ repair.vendor }}
                <v-chip v-if="repair.ticketRef" size="x-small" color="warning" variant="tonal" class="ms-2">
                  Ticket #{{ repair.ticketRef }}
                </v-chip>
              </v-card-title>
              <v-card-subtitle>{{ repair.device }} — {{ repair.issue }} · {{ getCustomerName(repair.customerId) }}</v-card-subtitle>
              <template #append>
                <div class="d-flex align-center gap-2">
                  <v-chip v-if="isOverdue(repair)" color="error" size="x-small" variant="tonal">OVERDUE</v-chip>
                  <v-chip :color="vendorStatusVuetifyColor(repair.status)" size="small" variant="tonal">{{ repair.status }}</v-chip>
                </div>
              </template>
            </v-card-item>

            <v-divider />

            <v-card-text class="d-flex gap-6 flex-wrap py-3">
              <div>
                <p class="text-caption text-medium-emphasis font-weight-black text-uppercase mb-0">Tracking</p>
                <p class="text-body-2 font-weight-medium">{{ repair.trackingNumber || 'Not provided' }}</p>
              </div>
              <div>
                <p class="text-caption text-medium-emphasis font-weight-black text-uppercase mb-0">Sent</p>
                <p class="text-body-2 font-weight-medium">{{ repair.sentDate ? formatDate(repair.sentDate) : '—' }}</p>
              </div>
              <div>
                <p class="text-caption text-medium-emphasis font-weight-black text-uppercase mb-0">Est. Return</p>
                <p class="text-body-2 font-weight-medium" :class="isOverdue(repair) ? 'text-error' : ''">
                  {{ repair.estReturn ? formatDate(repair.estReturn) : '—' }}
                </p>
              </div>
              <div v-if="repair.notes" class="flex-grow-1">
                <p class="text-caption text-medium-emphasis">📝 {{ repair.notes }}</p>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Empty -->
        <v-card v-else rounded="xl" class="pa-10 text-center">
          <v-icon size="48" color="secondary" class="opacity-30 mb-3">mdi-domain</v-icon>
          <p class="text-body-1 font-weight-bold mb-1">No vendor repairs</p>
          <p class="text-body-2 text-medium-emphasis mb-4">Send your first device out for third-party repair</p>
          <v-btn color="secondary" variant="tonal" @click="openNewVendorRepair">New Vendor Repair</v-btn>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- DIALOGS                                                   -->
    <!-- ══════════════════════════════════════════════════════════ -->

    <!-- New Ticket -->
    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />

    <!-- Ticket Detail -->
    <TicketDetailDialog
      v-if="selectedTicket"
      v-model="ticketDetailOpen"
      :ticket="selectedTicket"
      @save="handleSaveTicket"
      @delete="handleDeleteTicket"
    />

    <!-- Delete Ticket confirm -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card rounded="xl">
        <v-card-item>
          <template #prepend>
            <v-avatar color="error" size="44" rounded="lg" variant="tonal">
              <v-icon color="error">mdi-delete-outline</v-icon>
            </v-avatar>
          </template>
          <v-card-title>Delete ticket permanently?</v-card-title>
          <v-card-subtitle v-if="pendingDelete">
            Ticket #{{ pendingDelete.id }} for {{ getCustomerName(pendingDelete.customerId) }}
          </v-card-subtitle>
        </v-card-item>
        <v-card-text>This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="pendingDelete = null">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="executePendingDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- House Call Form -->
    <v-dialog v-model="housecallFormOpen" max-width="720" scrollable>
      <v-card rounded="xl">
        <v-card-item class="border-b">
          <template #prepend>
            <v-avatar color="success" size="40" rounded="lg">
              <v-icon color="white">mdi-map-marker</v-icon>
            </v-avatar>
          </template>
          <v-card-title>{{ editingHousecall ? 'Edit House Call' : 'Schedule House Call' }}</v-card-title>
          <v-card-subtitle>On-site repair appointment</v-card-subtitle>
          <template #append>
            <v-btn icon="mdi-close" variant="text" @click="housecallFormOpen = false" />
          </template>
        </v-card-item>

        <v-card-text class="pa-6">
          <v-row>
            <!-- Left: form fields -->
            <v-col cols="12" md="6">
              <div class="d-flex flex-column gap-4">
                <CustomerSelect v-model="housecallForm.customerId" />

                <!-- Address with autocomplete -->
                <div class="position-relative">
                  <v-text-field
                    v-model="housecallForm.address"
                    label="Address"
                    placeholder="123 Main St, City, State"
                    @input="onAddressInput"
                  >
                    <template #append-inner>
                      <v-btn icon="mdi-navigation" size="x-small" variant="text" color="info" @click="openMaps" />
                    </template>
                  </v-text-field>
                  <v-list v-if="showSuggestions && addressSuggestions.length" class="position-absolute elevation-4 rounded-lg" style="z-index:100;top:100%;left:0;right:0;max-height:180px;overflow-y:auto">
                    <v-list-item
                      v-for="sug in addressSuggestions"
                      :key="sug.place_id"
                      :title="sug.display_name"
                      density="compact"
                      @click="selectSuggestion(sug)"
                    />
                  </v-list>
                </div>

                <v-row dense>
                  <v-col cols="6">
                    <v-text-field v-model="housecallForm.date" label="Date" type="date" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model="housecallForm.time" label="Time" type="time" />
                  </v-col>
                </v-row>

                <v-textarea v-model="housecallForm.issue" label="Issue / Description" rows="3" />

                <v-select
                  v-if="editingHousecall"
                  v-model="housecallForm.status"
                  label="Status"
                  :items="['Scheduled','In Progress','Completed','Cancelled']"
                />

                <v-card color="success" variant="tonal" rounded="lg" class="pa-3">
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-caption font-weight-black text-uppercase">Call Estimate</span>
                    <span class="text-h6 font-weight-black text-success">${{ housecallEstimate.toFixed(2) }}</span>
                  </div>
                </v-card>
              </div>
            </v-col>

            <!-- Right: map + calculator -->
            <v-col cols="12" md="6">
              <div class="d-flex flex-column gap-4">
                <!-- Map preview -->
                <div>
                  <p class="text-caption font-weight-bold text-medium-emphasis mb-2">Location Preview</p>
                  <div class="rounded-lg overflow-hidden" style="height:160px">
                    <iframe v-if="mapsUrl" :src="mapsUrl" width="100%" height="100%" style="border:0" />
                    <div v-else class="d-flex align-center justify-center h-100 text-medium-emphasis" style="background:rgba(0,0,0,0.04)">
                      <div class="text-center">
                        <v-icon size="32" class="opacity-40">mdi-map</v-icon>
                        <p class="text-caption mt-1">Enter address to preview</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Calculator -->
                <v-card variant="tonal" rounded="lg" class="pa-4">
                  <p class="text-caption font-weight-black text-uppercase mb-3">
                    <v-icon size="14" class="me-1">mdi-calculator</v-icon> Job Calculator
                  </p>
                  <v-row dense>
                    <v-col cols="6">
                      <v-text-field v-model.number="calc.labor"   label="Labor ($)"   type="number" density="compact" />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model.number="calc.parts"   label="Parts ($)"   type="number" density="compact" />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model.number="calc.travel"  label="Travel ($)"  type="number" density="compact" />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model.number="calc.taxRate" label="Tax (%)"     type="number" density="compact" />
                    </v-col>
                  </v-row>
                  <v-divider class="my-2" />
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Subtotal</span><span>${{ calcSubtotal.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Tax</span><span>${{ calcTax.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-body-2 font-weight-black text-success mt-1">
                    <span>Total</span><span>${{ calcTotal.toFixed(2) }}</span>
                  </div>
                  <v-btn color="success" variant="tonal" size="small" block class="mt-3" @click="applyCalcEstimate">
                    Apply as Estimate
                  </v-btn>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn v-if="editingHousecall" variant="outlined" prepend-icon="mdi-printer" @click="printCurrentHousecall">
            Print
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="housecallFormOpen = false">Cancel</v-btn>
          <v-btn color="success" @click="saveHousecall">
            {{ editingHousecall ? 'Save Changes' : 'Schedule' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete House Call confirm -->
    <v-dialog v-model="deleteHousecallDialogOpen" max-width="400">
      <v-card rounded="xl">
        <v-card-item>
          <template #prepend>
            <v-avatar color="error" size="44" rounded="lg" variant="tonal">
              <v-icon color="error">mdi-delete-outline</v-icon>
            </v-avatar>
          </template>
          <v-card-title>Delete house call?</v-card-title>
          <v-card-subtitle v-if="pendingDeleteHousecall">
            For {{ getCustomerName(pendingDeleteHousecall.customerId) }}
          </v-card-subtitle>
        </v-card-item>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="pendingDeleteHousecall = null">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="executeDeleteHousecall">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Vendor Repair Form -->
    <v-dialog v-model="vendorFormOpen" max-width="560" scrollable>
      <v-card rounded="xl">
        <v-card-item class="border-b">
          <template #prepend>
            <v-avatar color="secondary" size="40" rounded="lg">
              <v-icon color="white">mdi-domain</v-icon>
            </v-avatar>
          </template>
          <v-card-title>{{ editingVendorRepair ? 'Edit Vendor Repair' : 'New Vendor Repair' }}</v-card-title>
          <v-card-subtitle>Third-party repair sent out to vendor</v-card-subtitle>
          <template #append>
            <v-btn icon="mdi-close" variant="text" @click="vendorFormOpen = false" />
          </template>
        </v-card-item>
        <v-card-text class="pa-6">
          <div class="d-flex flex-column gap-4">
            <CustomerSelect v-model="vendorForm.customerId" />
            <v-row dense>
              <v-col cols="6"><v-text-field v-model="vendorForm.device" label="Device" placeholder="e.g. iPhone 15 Pro" /></v-col>
              <v-col cols="6"><v-text-field v-model="vendorForm.issue" label="Issue" placeholder="e.g. Cracked screen" /></v-col>
              <v-col cols="6"><v-text-field v-model="vendorForm.vendor" label="Vendor / Repair Center" placeholder="e.g. iFixit Pro" /></v-col>
              <v-col cols="6"><v-text-field v-model="vendorForm.ticketRef" label="Associated Ticket #" placeholder="Optional" /></v-col>
              <v-col cols="6"><v-text-field v-model="vendorForm.trackingNumber" label="Tracking Number" /></v-col>
              <v-col cols="6">
                <v-select v-model="vendorForm.status" label="Status" :items="vendorStatusList" />
              </v-col>
              <v-col cols="6"><v-text-field v-model="vendorForm.sentDate" label="Date Sent" type="date" /></v-col>
              <v-col cols="6"><v-text-field v-model="vendorForm.estReturn" label="Est. Return" type="date" /></v-col>
            </v-row>
            <v-textarea v-model="vendorForm.notes" label="Notes" rows="3" />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="vendorFormOpen = false">Cancel</v-btn>
          <v-btn color="secondary" @click="saveVendorRepair">
            {{ editingVendorRepair ? 'Save Changes' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Ticket } from '~/types'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import TicketDetailDialog from '~/components/TicketDetailDialog.vue'
import CustomerSelect from '~/components/CustomerSelect.vue'
import { useToast } from '~/composables/useToast'
import { printHousecall } from '~/utils/print'
import { Package, Truck } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { tickets, customers, settings, houseCalls: housecalls, vendorRepairs } = storeToRefs(appStore)
const { sendTicketEmail, sendHousecallEmail, sendVendorRepairEmail, sendInternalAlert } = useEmailNotifications()
const { toast } = useToast()

// ── Tabs ──────────────────────────────────────────────────────────
const activeTab = ref<'tickets' | 'housecalls' | 'thirdparty'>('tickets')

const openTicketCount    = computed(() => (tickets.value ?? []).filter(t => t.status === 'Open' || t.status === 'In Progress').length)
const activeHousecallCount = computed(() => housecalls.value.filter((c: any) => c.status !== 'Completed' && c.status !== 'Cancelled').length)
const activeVendorCount  = computed(() => vendorRepairs.value.filter((r: any) => r.status !== 'Returned to Customer' && r.status !== 'Cancelled').length)

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency  = (n: number) => `${settings.value?.currency || '$'}${(n || 0).toFixed(2)}`
const formatDate      = (d?: string) => d ? new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const getCustomerName = (id: number) => (customers.value ?? []).find((c: any) => c.id === id)?.name || 'Unknown'
const getCustomerPhone = (id: number) => (customers.value ?? []).find((c: any) => c.id === id)?.phone || ''

const ticketStatusColor = (s: string) => ({ Open: 'info', 'In Progress': 'warning', 'Waiting for Parts': 'error', Completed: 'success', Delivered: 'secondary' }[s] || 'secondary')
const priorityChipColor = (p: string) => ({ low: 'secondary', normal: 'info', high: 'error' }[p] || 'info')
const callStatusVuetifyColor = (s: string) => ({ Scheduled: 'info', 'In Progress': 'warning', Completed: 'success', Cancelled: 'error' }[s] || 'secondary')
const vendorStatusVuetifyColor = (s: string) => ({ 'Preparing to Ship': 'secondary', 'Shipped to Vendor': 'info', 'In Repair': 'warning', 'Shipped Back': 'primary', Received: 'success', 'Returned to Customer': 'primary', Cancelled: 'error' }[s] || 'secondary')

// ── TICKETS ───────────────────────────────────────────────────────
const ticketSearch  = ref('')
const ticketFilter  = ref<string | null>(null)
const newTicketOpen = ref(false)
const selectedTicket   = ref<Ticket | null>(null)
const ticketDetailOpen = ref(false)
const pendingDelete    = ref<Ticket | null>(null)
const deleteDialogOpen = computed({ get: () => !!pendingDelete.value, set: v => { if (!v) pendingDelete.value = null } })

const statusList = computed(() => {
  const custom = (settings.value?.statuses || 'Open,In Progress,Completed').split(',').map((s: string) => s.trim())
  const live = [...new Set((tickets.value ?? []).map(t => t.status))].filter(Boolean)
  return [...new Set([...custom, ...live])]
})

const filteredTickets = computed(() =>
  (tickets.value ?? []).filter(t => {
    const q = ticketSearch.value.toLowerCase()
    const matchSearch = !q || t.device?.toLowerCase().includes(q) || t.issue?.toLowerCase().includes(q) || t.id?.toString().includes(q) || getCustomerName(t.customerId).toLowerCase().includes(q)
    const matchStatus = !ticketFilter.value || t.status === ticketFilter.value
    return matchSearch && matchStatus
  }).sort((a, b) => (b.id || 0) - (a.id || 0))
)

const ticketStats = computed(() => [
  { label: 'Open',        value: (tickets.value ?? []).filter(t => t.status === 'Open').length,        color: '#3b82f6', icon: 'mdi-inbox' },
  { label: 'In Progress', value: (tickets.value ?? []).filter(t => t.status === 'In Progress').length, color: '#f59e0b', icon: 'mdi-clock-outline' },
  { label: 'Completed',   value: (tickets.value ?? []).filter(t => t.status === 'Completed').length,   color: '#10b981', icon: 'mdi-check-circle-outline' },
  { label: 'Total',       value: (tickets.value ?? []).length,                                         color: '#8b5cf6', icon: 'mdi-chart-bar' },
])

const ticketHeaders = [
  { title: '#',         key: 'id',         width: 70 },
  { title: 'Customer',  key: 'customerId', minWidth: 140 },
  { title: 'Device',    key: 'device',     minWidth: 180 },
  { title: 'Priority',  key: 'priority',   width: 100 },
  { title: 'Status',    key: 'status',     width: 160 },
  { title: 'Price',     key: 'price',      width: 100, align: 'end' as const },
  { title: 'Date',      key: 'createdAt',  width: 120 },
  { title: '',          key: 'actions',    width: 100, sortable: false },
]

function openTicket(ticket: Ticket) { selectedTicket.value = { ...ticket }; ticketDetailOpen.value = true }
function handleSaveTicket() {
  if (selectedTicket.value) {
    const fresh = tickets.value.find(t => t.id === selectedTicket.value!.id)
    if (fresh) selectedTicket.value = { ...fresh }
  }
}
function handleDeleteTicket(ticket: Ticket) {
  appStore.deleteTicket(ticket.id)
  ticketDetailOpen.value = false
  selectedTicket.value = null
  toast.success('Deleted', `Ticket #${ticket.id} deleted`)
}
async function executePendingDelete() {
  if (!pendingDelete.value) return
  try { await appStore.deleteTicket(pendingDelete.value.id); toast.success('Deleted', `Ticket #${pendingDelete.value.id} deleted`) }
  catch (e: any) { toast.danger('Error', e.message) }
  pendingDelete.value = null
}
function copyTicketInfo(ticket: Ticket) {
  const text = `Ticket #${ticket.id} | ${getCustomerName(ticket.customerId)} | ${ticket.device} | ${ticket.status} | ${formatCurrency(ticket.price)}`
  navigator.clipboard.writeText(text).then(() => toast.success('Copied', 'Ticket info copied'))
}
async function handleCreateTicket(ticketData: any) {
  const id = toast.loading('Creating ticket…')
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) { const nc = await appStore.createCustomer(ticketData.newCustomer); customerId = nc.id }
    const ticket = await appStore.createTicket({ ...ticketData, customerId, status: 'Open', price: 0, services: [], parts: [], payments: [], notes: [], timeLog: [] })
    toast.dismiss(id); toast.success('Ticket Created', `Ticket #${ticket.id} created`)
    newTicketOpen.value = false
    sendTicketEmail({ ...ticket, customerId }).catch(() => {})
    sendInternalAlert({ eventType: 'New Ticket', eventSummary: `Ticket #${ticket.id} created`, customerName: getCustomerName(customerId), customerPhone: getCustomerPhone(customerId), deviceName: ticketData.device || '', issueDescription: ticketData.issue || '', ticketNumber: String(ticket.id) }).catch(() => {})
  } catch (err: any) { toast.dismiss(id); toast.danger('Error', err.message || 'Failed to create ticket') }
}

// ── HOUSE CALLS ───────────────────────────────────────────────────
const addressSuggestions   = ref<any[]>([])
const showSuggestions      = ref(false)
const housecallFilter      = ref('All')
const housecallFilterOptions = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled']
const housecallFormOpen    = ref(false)
const editingHousecall     = ref<any>(null)
const housecallForm        = ref({ customerId: null as any, address: '', date: '', time: '', issue: '', status: 'Scheduled' })
const pendingDeleteHousecall = ref<any>(null)
const deleteHousecallDialogOpen = computed({ get: () => !!pendingDeleteHousecall.value, set: v => { if (!v) pendingDeleteHousecall.value = null } })
const mapsUrl   = ref('')
const latLonCache = ref<Record<string, any>>({})
const calc      = ref({ labor: 0, parts: 0, travel: 0, taxRate: 0 })
const housecallEstimate = ref(0)

onMounted(() => {
  try { latLonCache.value = JSON.parse(localStorage.getItem('osm_cache') || '{}') } catch {}
})

const calcSubtotal = computed(() => (calc.value.labor || 0) + (calc.value.parts || 0) + (calc.value.travel || 0))
const calcTax      = computed(() => calcSubtotal.value * ((calc.value.taxRate || 0) / 100))
const calcTotal    = computed(() => calcSubtotal.value + calcTax.value)
const applyCalcEstimate = () => { housecallEstimate.value = calcTotal.value }

const countHousecallByStatus = (s: string) => housecalls.value.filter((c: any) => c.status === s).length
const filteredHousecalls = computed(() => housecallFilter.value === 'All' ? housecalls.value : housecalls.value.filter((c: any) => c.status === housecallFilter.value))

function openNewHousecall() { editingHousecall.value = null; housecallForm.value = { customerId: null, address: '', date: '', time: '', issue: '', status: 'Scheduled' }; calc.value = { labor: 0, parts: 0, travel: 0, taxRate: 0 }; housecallEstimate.value = 0; mapsUrl.value = ''; housecallFormOpen.value = true }
function viewHousecall(call: any) { editingHousecall.value = call; housecallForm.value = { ...call }; housecallFormOpen.value = true }

async function executeDeleteHousecall() {
  if (!pendingDeleteHousecall.value) return
  try { await appStore.deleteHouseCall(pendingDeleteHousecall.value.id); toast.success('Deleted', 'House call removed') }
  catch { toast.danger('Error', 'Failed to delete house call') }
  pendingDeleteHousecall.value = null
}
async function saveHousecall() {
  try {
    const isNew = !editingHousecall.value
    if (editingHousecall.value) await appStore.updateHouseCall(editingHousecall.value.id, { ...housecallForm.value })
    else await appStore.createHouseCall({ ...housecallForm.value, status: 'Scheduled' })
    housecallFormOpen.value = false; editingHousecall.value = null
    toast.success('Saved', isNew ? 'House call scheduled' : 'House call updated')
    if (isNew) { sendHousecallEmail(housecallForm.value).catch(() => {}); sendInternalAlert({ eventType: 'House Call', eventSummary: 'New house call scheduled', customerName: getCustomerName(housecallForm.value.customerId), deviceName: '', issueDescription: housecallForm.value.issue || '' }).catch(() => {}) }
  } catch (e: any) { toast.danger('Error', e.message || 'Failed to save house call') }
}
async function advanceHousecallStatus(call: any) {
  try { await appStore.updateHouseCall(call.id, { status: call.status === 'Scheduled' ? 'In Progress' : 'Completed' }) }
  catch { toast.danger('Error', 'Failed to update status') }
}

const printCurrentHousecall = () => {
  if (!housecallForm.value) return
  const customerEmail = customers.value.find((c: any) => c.id === housecallForm.value.customerId)?.email || ''
  let displayTime = housecallForm.value.time || 'TBD'
  if (displayTime !== 'TBD' && displayTime.includes(':')) {
    const [h, m] = displayTime.split(':'); const hour = parseInt(h, 10); displayTime = `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }
  printHousecall({ businessName: settings.value?.businessName || 'NovaOps', businessAddress: settings.value?.address || '', businessPhone: settings.value?.phone || '', customerName: getCustomerName(housecallForm.value.customerId), customerPhone: getCustomerPhone(housecallForm.value.customerId), customerEmail, serviceAddress: housecallForm.value.address, date: housecallForm.value.date ? formatDate(housecallForm.value.date) : 'TBD', time: displayTime, issue: housecallForm.value.issue || 'No details provided.', status: housecallForm.value.status, estimate: housecallEstimate.value ? `${settings.value?.currency || '$'}${housecallEstimate.value.toFixed(2)}` : undefined })
}

const selectSuggestion = (pt: any, fromCache = false) => {
  if (!fromCache) housecallForm.value.address = pt.display_name
  showSuggestions.value = false
  if (pt.boundingbox) {
    const [lat1, lat2, lon1, lon2] = pt.boundingbox
    mapsUrl.value = `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${pt.lat}%2C${pt.lon}`
    latLonCache.value[housecallForm.value.address] = { lat: pt.lat, lon: pt.lon, boundingbox: pt.boundingbox }
    try { localStorage.setItem('osm_cache', JSON.stringify(latLonCache.value)) } catch {}
  }
}

let mapsTimer: ReturnType<typeof setTimeout> | null = null
const onAddressInput = () => {
  if (mapsTimer) clearTimeout(mapsTimer)
  mapsTimer = setTimeout(async () => {
    const q = housecallForm.value.address?.trim()
    if (!q || q.length < 4) { addressSuggestions.value = []; showSuggestions.value = false; mapsUrl.value = ''; return }
    const cached = latLonCache.value[q]; if (cached && !cached.notfound) { selectSuggestion(cached, true); return }
    try { const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=us,ca`); const data = await res.json(); addressSuggestions.value = data; showSuggestions.value = data.length > 0 } catch {}
  }, 600)
}
const openMaps = () => { const addr = housecallForm.value.address?.trim(); if (addr) window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(addr)}`, '_blank') }

const osmQueue = ref<string[]>([]); let processingOsm = false
const processOsmQueue = async () => {
  if (processingOsm || !osmQueue.value.length) return; processingOsm = true
  while (osmQueue.value.length) { const addr = osmQueue.value.shift(); if (addr && !latLonCache.value[addr]) { try { const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`); const data = await res.json(); latLonCache.value[addr] = (data && data[0]) ? data[0] : { notfound: true }; localStorage.setItem('osm_cache', JSON.stringify(latLonCache.value)) } catch {} await new Promise(r => setTimeout(r, 1200)) } }
  processingOsm = false
}
const getOsmCardUrl = (address: string) => {
  if (!address || address.length < 5) return ''
  const cached = latLonCache.value[address]
  if (cached) { if (cached.notfound) return ''; const [lat1, lat2, lon1, lon2] = cached.boundingbox || [parseFloat(cached.lat) - 0.005, parseFloat(cached.lat) + 0.005, parseFloat(cached.lon) - 0.005, parseFloat(cached.lon) + 0.005]; return `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${cached.lat}%2C${cached.lon}` }
  if (!osmQueue.value.includes(address)) { osmQueue.value.push(address); processOsmQueue() }
  return ''
}

// ── VENDOR REPAIRS ────────────────────────────────────────────────
const vendorSearch   = ref('')
const vendorFilter   = ref<string | null>(null)
const vendorFormOpen = ref(false)
const editingVendorRepair = ref<any>(null)
const defaultVendorForm = () => ({ customerId: null as any, device: '', issue: '', vendor: '', ticketRef: '', trackingNumber: '', status: 'Preparing to Ship', sentDate: '', estReturn: '', notes: '' })
const vendorForm = ref(defaultVendorForm())
const vendorStatusList = ['Preparing to Ship', 'Shipped to Vendor', 'In Repair', 'Shipped Back', 'Received', 'Returned to Customer', 'Cancelled']

const filteredVendorRepairs = computed(() =>
  vendorRepairs.value.filter((r: any) => {
    const q = vendorSearch.value.toLowerCase()
    return (!q || r.vendor?.toLowerCase().includes(q) || r.device?.toLowerCase().includes(q) || r.issue?.toLowerCase().includes(q) || r.trackingNumber?.toLowerCase().includes(q) || getCustomerName(r.customerId).toLowerCase().includes(q))
      && (!vendorFilter.value || r.status === vendorFilter.value)
  }).sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
)

const vendorStats = computed(() => [
  { label: 'Total Sent',  value: vendorRepairs.value.length,                                                                                   color: '#8b5cf6', icon: 'mdi-package-variant' },
  { label: 'In Transit',  value: vendorRepairs.value.filter((r: any) => r.status === 'Shipped to Vendor' || r.status === 'Shipped Back').length, color: '#3b82f6', icon: 'mdi-truck' },
  { label: 'In Repair',   value: vendorRepairs.value.filter((r: any) => r.status === 'In Repair').length,                                       color: '#f59e0b', icon: 'mdi-wrench' },
  { label: 'Overdue',     value: vendorRepairs.value.filter((r: any) => isOverdue(r)).length,                                                   color: '#ef4444', icon: 'mdi-alert-circle' },
])

const isOverdue = (r: any) => { if (!r.estReturn || r.status === 'Returned to Customer' || r.status === 'Cancelled') return false; return new Date(r.estReturn) < new Date() }

function openNewVendorRepair() { editingVendorRepair.value = null; vendorForm.value = defaultVendorForm(); vendorFormOpen.value = true }
function openVendorRepair(repair: any) { editingVendorRepair.value = repair; vendorForm.value = { ...repair }; vendorFormOpen.value = true }
async function saveVendorRepair() {
  try {
    const isNew = !editingVendorRepair.value
    if (editingVendorRepair.value) await appStore.updateVendorRepair(editingVendorRepair.value.id, { ...vendorForm.value })
    else await appStore.createVendorRepair({ ...vendorForm.value })
    vendorFormOpen.value = false; editingVendorRepair.value = null
    toast.success('Saved', isNew ? 'Vendor repair created' : 'Vendor repair updated')
    if (isNew) { sendVendorRepairEmail(vendorForm.value).catch(() => {}); sendInternalAlert({ eventType: 'Vendor Repair', eventSummary: 'New vendor repair dispatched', customerName: getCustomerName(vendorForm.value.customerId), deviceName: vendorForm.value.device || '', issueDescription: vendorForm.value.issue || '', ticketNumber: vendorForm.value.ticketRef || '' }).catch(() => {}) }
  } catch (e: any) { toast.danger('Error', e.message || 'Failed to save vendor repair') }
}
</script>
