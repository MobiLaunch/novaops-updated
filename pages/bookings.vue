<template>
  <div class="bk-root">

    <!-- ── Page Header ──────────────────────────────────────────── -->
    <div class="bk-header">
      <div class="flex items-center gap-4">
        <div class="bk-header-icon">
          <ClipboardList class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="bk-title">Booking Management</h1>
          <p class="bk-subtitle">Tickets, house calls &amp; vendor repairs — all in one place</p>
        </div>
      </div>
      <button
        v-if="activeTab === 'tickets'"
        class="bk-fab" style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 16px #f59e0b40"
        @click="newTicketOpen = true"
      ><Plus class="w-4 h-4" /> New Ticket</button>
      <button
        v-else-if="activeTab === 'housecalls'"
        class="bk-fab" style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140"
        @click="openNewHousecall"
      ><Plus class="w-4 h-4" /> Schedule Call</button>
      <button
        v-else-if="activeTab === 'thirdparty'"
        class="bk-fab" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 16px #8b5cf640"
        @click="openNewVendorRepair"
      ><Plus class="w-4 h-4" /> New Vendor Repair</button>
    </div>

    <!-- ── Tab Bar ──────────────────────────────────────────────── -->
    <div class="bk-tabs">
      <button
        v-for="tab in tabs" :key="tab.id"
        class="bk-tab"
        :class="{ 'bk-tab--active': activeTab === tab.id }"
        :style="activeTab === tab.id ? `background: ${tab.color}; color: white; box-shadow: 0 4px 12px ${tab.color}50` : ''"
        @click="activeTab = tab.id as any"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
        <span v-if="tab.count > 0" class="bk-tab-badge"
          :style="activeTab === tab.id ? 'background: rgba(255,255,255,0.25); color: white' : `background: ${tab.color}22; color: ${tab.color}`"
        >{{ tab.count }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: TICKETS                                              -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'tickets'" class="tab-content">

      <!-- KPI Row -->
      <div class="kpi-grid">
        <div v-for="stat in ticketStats" :key="stat.label" class="kpi-card"
          :style="`background: ${stat.color}12; border-color: ${stat.color}28`">
          <div class="kpi-icon" :style="`background: ${stat.color}22`">
            <component :is="stat.icon" class="w-5 h-5" :style="`color: ${stat.color}`" />
          </div>
          <p class="kpi-label">{{ stat.label }}</p>
          <p class="kpi-value" :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Search + Status Filters -->
      <div class="filters-row">
        <div class="search-wrap">
          <Search class="search-icon" />
          <input v-model="ticketSearch" placeholder="Search tickets…" class="search-input" />
        </div>
        <div class="filter-chips">
          <button
            v-for="s in [null, ...statusList]" :key="s ?? 'all'"
            class="filter-chip"
            :class="{ 'filter-chip--active': ticketFilter === s }"
            @click="ticketFilter = s"
          >{{ s ?? 'All' }}</button>
        </div>
      </div>

      <!-- Ticket List -->
      <div class="ticket-list">
        <div
          v-for="ticket in filteredTickets" :key="ticket.id"
          class="ticket-card"
          @click="openTicket(ticket)"
        >
          <!-- Card header strip -->
          <div class="ticket-card-head" :style="`background: ${ticketStatusColor(ticket.status)}12`">
            <div class="ticket-card-info">
              <div class="ticket-id-row">
                <span class="ticket-id" :style="`color: ${ticketStatusColor(ticket.status)}`">#{{ ticket.id }}</span>
                <span class="priority-chip" :style="`background: ${priorityColor(ticket.priority)}18; color: ${priorityColor(ticket.priority)}`">
                  {{ ticket.priority?.toUpperCase() }}
                </span>
              </div>
              <p class="ticket-customer-name">{{ getCustomerName(ticket.customerId) }}</p>
              <div class="ticket-device-row">
                <Smartphone class="w-3.5 h-3.5 text-muted-foreground" />
                <span class="ticket-device">{{ ticket.device }} {{ ticket.deviceModel || '' }}</span>
              </div>
            </div>
            <!-- Status chip using new component -->
            <div class="ticket-card-right">
              <StatusChip :variant="ticketStatusVariant(ticket.status)" :show-dot="true" size="md">
                {{ ticket.status }}
              </StatusChip>
              <!-- Action dropdown trigger -->
              <div class="relative" @click.stop>
                <button
                  class="ticket-action-btn"
                  @click.stop="toggleTicketMenu(ticket.id)"
                  aria-label="Ticket actions"
                >
                  <MoreVertical class="w-4 h-4" />
                </button>
                <Transition name="dropdown">
                  <div v-if="openMenuId === ticket.id" class="ticket-dropdown" v-click-outside="closeMenu">
                    <div class="dropdown-section-label">Actions</div>
                    <button class="dropdown-item" @click.stop="openTicket(ticket); closeMenu()">
                      <div class="dropdown-item-icon"><Pencil class="w-3.5 h-3.5" /></div>
                      <div class="dropdown-item-body">
                        <span class="dropdown-item-label">Edit Ticket</span>
                        <span class="dropdown-item-desc">Open full details</span>
                      </div>
                      <kbd class="dropdown-kbd">⌘E</kbd>
                    </button>
                    <button class="dropdown-item" @click.stop="copyTicketInfo(ticket); closeMenu()">
                      <div class="dropdown-item-icon"><Copy class="w-3.5 h-3.5" /></div>
                      <div class="dropdown-item-body">
                        <span class="dropdown-item-label">Copy Info</span>
                        <span class="dropdown-item-desc">Copy ticket summary</span>
                      </div>
                    </button>
                    <div class="dropdown-separator" />
                    <div class="dropdown-section-label">Danger zone</div>
                    <button class="dropdown-item dropdown-item--danger" @click.stop="confirmDeleteTicket(ticket); closeMenu()">
                      <div class="dropdown-item-icon dropdown-item-icon--danger"><Trash2 class="w-3.5 h-3.5" /></div>
                      <div class="dropdown-item-body">
                        <span class="dropdown-item-label">Delete Ticket</span>
                        <span class="dropdown-item-desc">Move to trash</span>
                      </div>
                      <kbd class="dropdown-kbd">⌘⇧D</kbd>
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <!-- Tear line -->
          <div class="tear-line" :style="`background: ${ticketStatusColor(ticket.status)}08`">
            <div class="scallop-left" />
            <div class="tear-dashes" :style="`border-color: ${ticketStatusColor(ticket.status)}35`" />
            <div class="scallop-right" />
          </div>

          <!-- Card footer -->
          <div class="ticket-card-foot" :style="`background: ${ticketStatusColor(ticket.status)}06`">
            <p class="ticket-issue">{{ ticket.issue }}</p>
            <div class="ticket-foot-right">
              <span class="ticket-price" :style="`color: ${ticketStatusColor(ticket.status)}`">
                {{ formatCurrency(ticket.price) }}
              </span>
              <span class="ticket-date">{{ formatDate(ticket.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="filteredTickets.length === 0" class="empty-state">
          <div class="empty-icon" style="background: #f59e0b14">
            <Inbox class="w-10 h-10" style="color: #f59e0b; opacity: 0.5" />
          </div>
          <h3 class="empty-title">No tickets found</h3>
          <p class="empty-sub">Get started by creating your first ticket</p>
          <button class="empty-cta" style="background: linear-gradient(135deg, #f59e0b, #d97706)" @click="newTicketOpen = true">
            <Plus class="w-4 h-4" /> Create Ticket
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: HOUSE CALLS                                          -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'housecalls'" class="tab-content">

      <!-- KPI Row -->
      <div class="kpi-grid">
        <div class="kpi-card" style="background: #10b98112; border-color: #10b98128">
          <div class="kpi-icon" style="background: #10b98122"><MapPin class="w-5 h-5" style="color: #10b981" /></div>
          <p class="kpi-label">All Calls</p><p class="kpi-value" style="color: #10b981">{{ housecalls.length }}</p>
        </div>
        <div class="kpi-card" style="background: #3b82f612; border-color: #3b82f628">
          <div class="kpi-icon" style="background: #3b82f622"><Clock class="w-5 h-5" style="color: #3b82f6" /></div>
          <p class="kpi-label">Scheduled</p><p class="kpi-value" style="color: #3b82f6">{{ countHousecallByStatus('Scheduled') }}</p>
        </div>
        <div class="kpi-card" style="background: #f59e0b12; border-color: #f59e0b28">
          <div class="kpi-icon" style="background: #f59e0b22"><Wrench class="w-5 h-5" style="color: #f59e0b" /></div>
          <p class="kpi-label">In Progress</p><p class="kpi-value" style="color: #f59e0b">{{ countHousecallByStatus('In Progress') }}</p>
        </div>
        <div class="kpi-card" style="background: #6366f112; border-color: #6366f128">
          <div class="kpi-icon" style="background: #6366f122"><CheckCircle class="w-5 h-5" style="color: #6366f1" /></div>
          <p class="kpi-label">Completed</p><p class="kpi-value" style="color: #6366f1">{{ countHousecallByStatus('Completed') }}</p>
        </div>
      </div>

      <!-- Filter pills -->
      <div class="filter-chips">
        <button
          v-for="f in housecallFilterOptions" :key="f"
          class="filter-chip"
          :class="{ 'filter-chip--active filter-chip--green': housecallFilter === f }"
          @click="housecallFilter = f"
        >{{ f }}</button>
      </div>

      <!-- House Call Cards -->
      <div class="housecall-grid">
        <div
          v-for="call in filteredHousecalls" :key="call.id"
          class="hc-card"
          @click="viewHousecall(call)"
        >
          <div class="hc-card-top">
            <div class="hc-icon-wrap"><MapPin class="w-5 h-5" style="color: #10b981" /></div>
            <StatusChip :variant="callStatusVariant(call.status)" :show-dot="true" size="sm">{{ call.status }}</StatusChip>
          </div>
          <div>
            <h3 class="hc-customer">{{ getCustomerName(call.customerId) }}</h3>
            <p class="hc-address"><MapPin class="w-3 h-3 flex-shrink-0" />{{ call.address }}</p>
            <p class="hc-time">{{ formatDate(call.date) }} at {{ call.time }}</p>
          </div>
          <div v-if="call.address?.length > 5 && getOsmCardUrl(call.address)" class="hc-map-preview pointer-events-none">
            <iframe :src="getOsmCardUrl(call.address)" class="w-full h-full" style="border:0" />
          </div>
          <p class="hc-issue">{{ call.issue }}</p>
          <div class="hc-actions">
            <button
              v-if="call.status !== 'Completed'"
              class="hc-advance-btn"
              :style="call.status === 'Scheduled' ? 'background: #f59e0b20; color: #f59e0b' : 'background: #10b98120; color: #10b981'"
              @click.stop="advanceHousecallStatus(call)"
            >{{ call.status === 'Scheduled' ? 'Start Call' : 'Complete' }}</button>
            <button class="hc-delete-btn" @click.stop="confirmDeleteHousecall(call)">
              <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div v-if="filteredHousecalls.length === 0" class="col-span-full empty-state">
          <div class="empty-icon" style="background: #10b98114"><MapPin class="w-8 h-8" style="color: #10b981; opacity: 0.5" /></div>
          <h3 class="empty-title">No house calls {{ housecallFilter !== 'All' ? `with status "${housecallFilter}"` : 'scheduled' }}</h3>
          <p class="empty-sub">{{ housecallFilter === 'All' ? 'Schedule your first on-site visit' : 'Try a different filter' }}</p>
          <button class="empty-cta" style="background: linear-gradient(135deg, #10b981, #059669)" @click="openNewHousecall">Schedule Call</button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: VENDOR REPAIRS                                       -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'thirdparty'" class="tab-content">

      <!-- KPI Row -->
      <div class="kpi-grid">
        <div v-for="stat in vendorStats" :key="stat.label" class="kpi-card"
          :style="`background: ${stat.color}12; border-color: ${stat.color}28`">
          <div class="kpi-icon" :style="`background: ${stat.color}22`">
            <component :is="stat.icon" class="w-5 h-5" :style="`color: ${stat.color}`" />
          </div>
          <p class="kpi-label">{{ stat.label }}</p>
          <p class="kpi-value" :style="`color: ${stat.color}`">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Search + Filter -->
      <div class="filters-row">
        <div class="search-wrap">
          <Search class="search-icon" />
          <input v-model="vendorSearch" placeholder="Search vendor repairs…" class="search-input" />
        </div>
        <div class="filter-chips">
          <button
            v-for="s in [null, ...vendorStatusList]" :key="s ?? 'all'"
            class="filter-chip"
            :class="{ 'filter-chip--active filter-chip--purple': vendorFilter === s }"
            @click="vendorFilter = s"
          >{{ s ?? 'All' }}</button>
        </div>
      </div>

      <!-- Vendor Cards -->
      <div class="vendor-list">
        <div
          v-for="repair in filteredVendorRepairs" :key="repair.id"
          class="vendor-card"
          @click="openVendorRepair(repair)"
        >
          <div class="vendor-card-head" :style="`background: ${vendorStatusColor(repair.status)}10`">
            <div class="flex items-start gap-4">
              <div class="vendor-icon"><Building2 class="w-5 h-5" style="color: #8b5cf6" /></div>
              <div class="flex-1 min-w-0">
                <div class="vendor-name-row">
                  <span class="vendor-name">{{ repair.vendor }}</span>
                  <span v-if="repair.ticketRef" class="ticket-ref-chip">Ticket #{{ repair.ticketRef }}</span>
                </div>
                <p class="vendor-device">{{ repair.device }} — {{ repair.issue }}</p>
                <p class="vendor-customer">{{ getCustomerName(repair.customerId) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 ml-4">
              <StatusChip :variant="vendorStatusVariant(repair.status)" :show-dot="true" size="sm">{{ repair.status }}</StatusChip>
              <span v-if="isOverdue(repair)" class="overdue-chip">OVERDUE</span>
            </div>
          </div>
          <div class="vendor-card-foot" :style="`background: ${vendorStatusColor(repair.status)}06`">
            <div class="vendor-detail">
              <Truck class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p class="vendor-detail-label">Tracking</p>
                <p class="vendor-detail-val">{{ repair.trackingNumber || 'Not provided' }}</p>
              </div>
            </div>
            <div class="vendor-detail">
              <CalendarIcon class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p class="vendor-detail-label">Sent</p>
                <p class="vendor-detail-val">{{ repair.sentDate ? formatDate(repair.sentDate) : '—' }}</p>
              </div>
            </div>
            <div class="vendor-detail">
              <RotateCcw class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p class="vendor-detail-label">Est. Return</p>
                <p class="vendor-detail-val" :class="isOverdue(repair) ? 'text-red-500' : ''">
                  {{ repair.estReturn ? formatDate(repair.estReturn) : '—' }}
                </p>
              </div>
            </div>
            <div v-if="repair.notes" class="flex-1 min-w-0 ml-auto">
              <p class="text-xs text-muted-foreground font-medium line-clamp-1">📝 {{ repair.notes }}</p>
            </div>
          </div>
        </div>

        <div v-if="filteredVendorRepairs.length === 0" class="empty-state">
          <div class="empty-icon" style="background: #8b5cf614"><Building2 class="w-10 h-10" style="color: #8b5cf6; opacity: 0.5" /></div>
          <h3 class="empty-title">No vendor repairs</h3>
          <p class="empty-sub">Send your first device out for third-party repair</p>
          <button class="empty-cta" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)" @click="openNewVendorRepair">
            <Plus class="w-4 h-4" /> New Vendor Repair
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- DIALOGS                                                   -->
    <!-- ══════════════════════════════════════════════════════════ -->

    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />
    <TicketDetailDialog v-if="selectedTicket" v-model="ticketDetailOpen" :ticket="selectedTicket" @save="handleSaveTicket" @delete="handleDeleteTicket" />

    <!-- House Call Form Dialog -->
    <Dialog v-model:open="housecallFormOpen">
      <DialogContent class="w-full max-w-[96vw] sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div class="flex items-center gap-3 px-4 sm:px-7 pt-4 sm:pt-7 pb-4 flex-shrink-0 border-b border-border/40">
          <div class="w-10 h-10 rounded-[20px] flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #10b981, #059669)">
            <MapPin class="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 class="text-base font-black">{{ editingHousecall ? 'Edit House Call' : 'Schedule House Call' }}</h2>
            <p class="text-xs text-muted-foreground font-medium">On-site repair appointment</p>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto px-4 sm:px-7 py-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex flex-col gap-4">
              <div class="space-y-2"><label class="m3-label">Customer</label><CustomerSelect v-model="housecallForm.customerId" /></div>
              <div class="space-y-2">
                <label class="m3-label">Address</label>
                <div class="relative">
                  <input ref="addressInputRef" v-model="housecallForm.address" placeholder="123 Main St, City, State" class="m3-input pr-12" @input="onAddressInput" @focus="showSuggestions = addressSuggestions.length > 0" />
                  <button class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all" style="background: #3b82f620" title="Open in Maps" @click="openMaps">
                    <Navigation class="w-4 h-4" style="color: #3b82f6" />
                  </button>
                  <div v-if="showSuggestions && addressSuggestions.length > 0" class="absolute z-50 left-0 right-0 top-full mt-1 bg-card border-2 border-border/60 rounded-[16px] shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    <div v-for="sug in addressSuggestions" :key="sug.place_id" class="px-4 py-3 hover:bg-muted/50 cursor-pointer border-b border-border/20 last:border-0 text-xs font-medium transition-colors" @click="selectSuggestion(sug)">{{ sug.display_name }}</div>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-2">
                  <label class="m3-label">Date</label>
                  <div class="relative">
                    <button
                      type="button"
                      class="m3-input text-left flex items-center gap-2"
                      @click="showCalendarPicker = !showCalendarPicker"
                    >
                      <CalendarDays class="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span :class="housecallForm.date ? 'text-foreground' : 'text-muted-foreground'">
                        {{ housecallForm.date ? new Date(housecallForm.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick a date…' }}
                      </span>
                    </button>
                    <Transition name="cal-pop">
                      <div v-if="showCalendarPicker" class="absolute left-0 top-full mt-2 z-50 shadow-2xl" v-click-outside="() => showCalendarPicker = false">
                        <AppCalendar
                          :model-value="housecallForm.date"
                          :min-date="new Date().toISOString().split('T')[0]"
                          @select="d => { housecallForm.date = d; showCalendarPicker = false }"
                        />
                      </div>
                    </Transition>
                  </div>
                </div>
                <div class="space-y-2"><label class="m3-label">Time</label><input v-model="housecallForm.time" type="time" class="m3-input" /></div>
              </div>
              <div class="space-y-2"><label class="m3-label">Issue / Description</label><textarea v-model="housecallForm.issue" placeholder="Describe the repair needed…" rows="3" class="m3-input resize-none" style="height: auto; padding-top: 12px" /></div>
              <div v-if="editingHousecall" class="space-y-2">
                <label class="m3-label">Status</label>
                <select v-model="housecallForm.status" class="m3-input"><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select>
              </div>
              <div class="rounded-[18px] p-4 flex items-center justify-between" style="background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0">
                <span class="text-xs font-black text-muted-foreground uppercase tracking-widest">Call Estimate</span>
                <span class="text-lg font-black" style="color: #10b981">${{ housecallEstimate.toFixed(2) }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-4">
              <div class="space-y-2">
                <label class="m3-label flex items-center gap-1.5"><Navigation class="w-3 h-3" style="color: #3b82f6" /> Location Preview</label>
                <div class="rounded-[20px] overflow-hidden" style="height: 180px; outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
                  <iframe v-if="mapsUrl" :src="mapsUrl" width="100%" height="100%" style="border:0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2" style="background: hsl(var(--muted)/0.3)">
                    <MapPin class="w-8 h-8 text-muted-foreground opacity-40" />
                    <p class="text-xs text-muted-foreground font-medium">Enter address to preview map</p>
                  </div>
                </div>
              </div>
              <div class="rounded-[20px] p-4 flex flex-col gap-3" style="background: hsl(var(--muted)/0.3); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
                <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Calculator class="w-3 h-3" /> Job Calculator</p>
                <div class="grid grid-cols-2 gap-2">
                  <div><label class="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Labor ($)</label><input v-model.number="calc.labor" type="number" min="0" step="0.01" placeholder="0.00" class="w-full h-9 px-3 rounded-[12px] text-xs font-bold bg-background border-2 border-border/60 outline-none focus:border-emerald-400/50 transition-all" /></div>
                  <div><label class="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Parts ($)</label><input v-model.number="calc.parts" type="number" min="0" step="0.01" placeholder="0.00" class="w-full h-9 px-3 rounded-[12px] text-xs font-bold bg-background border-2 border-border/60 outline-none focus:border-emerald-400/50 transition-all" /></div>
                  <div><label class="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Travel ($)</label><input v-model.number="calc.travel" type="number" min="0" step="0.01" placeholder="0.00" class="w-full h-9 px-3 rounded-[12px] text-xs font-bold bg-background border-2 border-border/60 outline-none focus:border-emerald-400/50 transition-all" /></div>
                  <div><label class="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Tax (%)</label><input v-model.number="calc.taxRate" type="number" min="0" max="100" step="0.1" placeholder="0" class="w-full h-9 px-3 rounded-[12px] text-xs font-bold bg-background border-2 border-border/60 outline-none focus:border-emerald-400/50 transition-all" /></div>
                </div>
                <div class="border-t border-border/60 pt-2 space-y-1">
                  <div class="flex justify-between text-xs font-semibold text-muted-foreground"><span>Subtotal</span><span>${{ calcSubtotal.toFixed(2) }}</span></div>
                  <div class="flex justify-between text-xs font-semibold text-muted-foreground"><span>Tax ({{ calc.taxRate || 0 }}%)</span><span>${{ calcTax.toFixed(2) }}</span></div>
                  <div class="flex justify-between text-sm font-black" style="color: #10b981"><span>Total</span><span>${{ calcTotal.toFixed(2) }}</span></div>
                </div>
                <button class="w-full h-8 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #10b981, #059669)" @click="applyCalcEstimate">Apply as Estimate</button>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-3 px-4 sm:px-7 py-4 flex-shrink-0 border-t border-border/40 flex-wrap">
          <button v-if="editingHousecall" class="flex items-center justify-center gap-2 h-12 px-5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="printCurrentHousecall"><Printer class="w-4 h-4" /> Print Details</button>
          <div class="flex-1 flex gap-3 min-w-[200px]">
            <button class="flex-1 h-12 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="housecallFormOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #10b981, #059669)" @click="saveHousecall">{{ editingHousecall ? 'Save Changes' : 'Schedule' }}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Vendor Repair Form Dialog -->
    <Dialog v-model:open="vendorFormOpen">
      <DialogContent class="w-full max-w-[96vw] sm:max-w-lg">
        <div class="flex flex-col gap-5 p-4 sm:p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)"><Building2 class="w-5 h-5 text-white" /></div>
            <div><h2 class="text-base font-black">{{ editingVendorRepair ? 'Edit Vendor Repair' : 'New Vendor Repair' }}</h2><p class="text-xs text-muted-foreground font-medium">Third-party repair sent out to vendor</p></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-2 sm:col-span-2"><label class="m3-label">Customer</label><CustomerSelect v-model="vendorForm.customerId" /></div>
            <div class="space-y-2"><label class="m3-label">Device</label><input v-model="vendorForm.device" placeholder="e.g. iPhone 15 Pro" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Issue</label><input v-model="vendorForm.issue" placeholder="e.g. Cracked screen" class="m3-input" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2"><label class="m3-label">Vendor / Repair Center</label><input v-model="vendorForm.vendor" placeholder="e.g. iFixit Pro" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Associated Ticket #</label><input v-model="vendorForm.ticketRef" placeholder="Optional ticket ID" class="m3-input" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2"><label class="m3-label">Tracking Number</label><input v-model="vendorForm.trackingNumber" placeholder="e.g. 1Z999AA1…" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Status</label><select v-model="vendorForm.status" class="m3-input"><option>Preparing to Ship</option><option>Shipped to Vendor</option><option>In Repair</option><option>Shipped Back</option><option>Received</option><option>Returned to Customer</option><option>Cancelled</option></select></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2"><label class="m3-label">Date Sent</label><input v-model="vendorForm.sentDate" type="date" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Est. Return Date</label><input v-model="vendorForm.estReturn" type="date" class="m3-input" /></div>
          </div>
          <div class="space-y-2"><label class="m3-label">Notes</label><textarea v-model="vendorForm.notes" placeholder="Special instructions, warranty info, etc." rows="3" class="m3-input resize-none" style="height: auto; padding-top: 12px" /></div>
          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="vendorFormOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)" @click="saveVendorRepair">{{ editingVendorRepair ? 'Save Changes' : 'Create' }}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog
      :open="!!pendingDelete"
      heading="Delete permanently?"
      :body="pendingDelete ? `This will permanently delete Ticket #${pendingDelete.id} for ${getCustomerName(pendingDelete.customerId)}. This action cannot be undone.` : ''"
      status="danger"
      confirm-label="Delete Ticket"
      @update:open="v => { if (!v) pendingDelete = null }"
      @confirm="executePendingDelete"
    />

    <!-- House Call Delete Confirmation -->
    <AlertDialog
      :open="!!pendingDeleteHousecall"
      heading="Delete house call?"
      :body="pendingDeleteHousecall ? `Delete the house call for ${getCustomerName(pendingDeleteHousecall.customerId)}?` : ''"
      status="danger"
      confirm-label="Delete"
      @update:open="v => { if (!v) pendingDeleteHousecall = null }"
      @confirm="executeDeleteHousecall"
    />

    <!-- Toast Stack -->
    <ToastStack />
  </div>
</template>

<script setup lang="ts">
import {
  ClipboardList, TicketCheck, MapPin, Building2, Plus, Search, Smartphone, Inbox,
  Clock, Wrench, CheckCircle, BarChart3, Trash2, Truck, RotateCcw,
  Calendar as CalendarIcon, CalendarDays, Package, AlertCircle, Navigation, Calculator, Printer,
  MoreVertical, Pencil, Copy
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import type { Ticket } from '~/types'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import TicketDetailDialog from '~/components/TicketDetailDialog.vue'
import StatusChip from '~/components/ui/StatusChip.vue'
import AlertDialog from '~/components/ui/AlertDialog.vue'
import ToastStack from '~/components/ui/ToastStack.vue'
import AppCalendar from '~/components/ui/AppCalendar.vue'
import { useToast } from '~/composables/useToast'
import { printHousecall } from '~/utils/print'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { tickets, customers, settings, houseCalls: housecalls, vendorRepairs } = storeToRefs(appStore)
const { addNotification } = useNotifications()
const { sendTicketEmail, sendHousecallEmail, sendVendorRepairEmail, sendInternalAlert } = useEmailNotifications()
const { toast } = useToast()

// Click-outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el._clickOutside = (e: MouseEvent) => { if (!el.contains(e.target as Node)) binding.value() }
    document.addEventListener('click', el._clickOutside, true)
  },
  unmounted(el: HTMLElement) { document.removeEventListener('click', el._clickOutside, true) },
}

// ── Active Tab ────────────────────────────────────────────────────
const activeTab = ref<'tickets' | 'housecalls' | 'thirdparty'>('tickets')

const tabs = computed(() => [
  { id: 'tickets',    label: 'Tickets',       icon: TicketCheck, color: '#f59e0b', count: (tickets.value ?? []).filter(t => t.status === 'Open' || t.status === 'In Progress').length },
  { id: 'housecalls', label: 'House Calls',   icon: MapPin,      color: '#10b981', count: housecalls.value.filter((c: any) => c.status !== 'Completed' && c.status !== 'Cancelled').length },
  { id: 'thirdparty', label: 'Vendor Repairs',icon: Building2,   color: '#8b5cf6', count: vendorRepairs.value.filter((r: any) => r.status !== 'Returned to Customer' && r.status !== 'Cancelled').length },
])

// ── Dropdown Menu ────────────────────────────────────────────────
const openMenuId = ref<number | null>(null)
function toggleTicketMenu(id: number) { openMenuId.value = openMenuId.value === id ? null : id }
function closeMenu() { openMenuId.value = null }

// ── Tickets ──────────────────────────────────────────────────────
const ticketSearch     = ref('')
const ticketFilter     = ref<string | null>(null)
const newTicketOpen    = ref(false)
const selectedTicket   = ref<Ticket | null>(null)
const ticketDetailOpen = ref(false)
const pendingDelete    = ref<Ticket | null>(null)

const statusList = computed(() => {
  const custom = (settings.value?.statuses || 'Open,In Progress,Completed').split(',').map((s: string) => s.trim())
  const live = [...new Set((tickets.value ?? []).map(t => t.status))].filter(Boolean)
  return [...new Set([...custom, ...live])]
})

const filteredTickets = computed(() =>
  (tickets.value ?? []).filter(ticket => {
    const q = ticketSearch.value.toLowerCase()
    const matchSearch = !q || ticket.device?.toLowerCase().includes(q) || ticket.issue?.toLowerCase().includes(q) || ticket.id?.toString().includes(q) || getCustomerName(ticket.customerId).toLowerCase().includes(q)
    const matchStatus = !ticketFilter.value || ticket.status === ticketFilter.value
    return matchSearch && matchStatus
  }).sort((a, b) => (b.id || 0) - (a.id || 0))
)

const ticketStats = computed(() => [
  { label: 'Open',        value: (tickets.value ?? []).filter(t => t.status === 'Open').length,        color: '#3b82f6', icon: Inbox },
  { label: 'In Progress', value: (tickets.value ?? []).filter(t => t.status === 'In Progress').length, color: '#f59e0b', icon: Clock },
  { label: 'Completed',   value: (tickets.value ?? []).filter(t => t.status === 'Completed').length,   color: '#10b981', icon: CheckCircle },
  { label: 'Total',       value: (tickets.value ?? []).length,                                         color: '#8b5cf6', icon: BarChart3 },
])

const formatCurrency    = (amount: number) => `${settings.value?.currency || '$'}${(amount || 0).toFixed(2)}`
const formatDate        = (date?: string) => date ? new Date(date.includes('T') ? date : date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const getCustomerName   = (id: number) => (customers.value ?? []).find((c: any) => c.id === id)?.name || 'Unknown'
const getCustomerPhone  = (id: number) => (customers.value ?? []).find((c: any) => c.id === id)?.phone || ''
const ticketStatusColor = (status: string) => ({ 'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316', 'Completed': '#10b981', 'Delivered': '#64748b' }[status] || '#64748b')
const ticketStatusVariant = (status: string) => ({ 'Open': 'info', 'In Progress': 'warning', 'Waiting for Parts': 'danger', 'Completed': 'success', 'Delivered': 'muted' }[status] || 'muted') as any
const priorityColor     = (p: string) => ({ low: '#64748b', normal: '#3b82f6', high: '#ef4444' }[p] || '#64748b')

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
  toast.success('Ticket Deleted', `Ticket #${ticket.id} deleted`)
}
function confirmDeleteTicket(ticket: Ticket) { pendingDelete.value = ticket }
async function executePendingDelete() {
  if (!pendingDelete.value) return
  try {
    await appStore.deleteTicket(pendingDelete.value.id)
    toast.success('Ticket Deleted', `Ticket #${pendingDelete.value.id} has been deleted`)
  } catch (e: any) { toast.danger('Error', e.message) }
  pendingDelete.value = null
}
function copyTicketInfo(ticket: Ticket) {
  const name = getCustomerName(ticket.customerId)
  const text = `Ticket #${ticket.id} | ${name} | ${ticket.device} | ${ticket.status} | ${formatCurrency(ticket.price)}`
  navigator.clipboard.writeText(text).then(() => toast.success('Copied', 'Ticket info copied to clipboard'))
}

async function handleCreateTicket(ticketData: any) {
  const id = toast.loading('Creating ticket…')
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) { const nc = await appStore.createCustomer(ticketData.newCustomer); customerId = nc.id }
    const ticket = await appStore.createTicket({ ...ticketData, customerId, status: 'Open', price: 0, services: [], parts: [], payments: [], notes: [], timeLog: [] })
    toast.dismiss(id)
    toast.success('Ticket Created', `Ticket #${ticket.id} created successfully`)
    newTicketOpen.value = false
    sendTicketEmail({ ...ticket, customerId }).catch(() => {})
    sendInternalAlert({ eventType: 'New Ticket', eventSummary: `Ticket #${ticket.id} created`, customerName: getCustomerName(customerId), customerPhone: getCustomerPhone(customerId), deviceName: ticketData.device || '', issueDescription: ticketData.issue || '', ticketNumber: String(ticket.id) }).catch(() => {})
  } catch (err: any) { toast.dismiss(id); toast.danger('Error', err.message || 'Failed to create ticket') }
}

// ── House Calls ──────────────────────────────────────────────────
const addressInputRef      = ref<HTMLInputElement | null>(null)
const addressSuggestions   = ref<any[]>([])
const showSuggestions      = ref(false)
const housecallFilter      = ref('All')
const housecallFilterOptions = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled']
const housecallFormOpen    = ref(false)
const editingHousecall     = ref<any>(null)
const housecallForm        = ref({ customerId: null as any, address: '', date: '', time: '', issue: '', status: 'Scheduled' })
const showCalendarPicker   = ref(false)
const pendingDeleteHousecall = ref<any>(null)
const mapsUrl              = ref('')
const latLonCache          = ref<Record<string, any>>({})
const calc                 = ref({ labor: 0, parts: 0, travel: 0, taxRate: 0 })
const housecallEstimate    = ref(0)

onMounted(() => {
  try { latLonCache.value = JSON.parse(localStorage.getItem('osm_cache') || '{}') } catch { latLonCache.value = {} }
  document.addEventListener('click', (e) => {
    if (addressInputRef.value && !addressInputRef.value.contains(e.target as Node)) showSuggestions.value = false
  })
})

const calcSubtotal = computed(() => (calc.value.labor || 0) + (calc.value.parts || 0) + (calc.value.travel || 0))
const calcTax      = computed(() => calcSubtotal.value * ((calc.value.taxRate || 0) / 100))
const calcTotal    = computed(() => calcSubtotal.value + calcTax.value)
const applyCalcEstimate = () => { housecallEstimate.value = calcTotal.value }

const countHousecallByStatus = (s: string) => housecalls.value.filter((c: any) => c.status === s).length
const filteredHousecalls     = computed(() => housecallFilter.value === 'All' ? housecalls.value : housecalls.value.filter((c: any) => c.status === housecallFilter.value))
const callStatusVariant      = (s: string) => ({ 'Scheduled': 'info', 'In Progress': 'warning', 'Completed': 'success', 'Cancelled': 'danger' }[s] || 'muted') as any

function openNewHousecall() { editingHousecall.value = null; housecallForm.value = { customerId: null, address: '', date: '', time: '', issue: '', status: 'Scheduled' }; housecallFormOpen.value = true }
function viewHousecall(call: any) { editingHousecall.value = call; housecallForm.value = { ...call }; housecallFormOpen.value = true }
function confirmDeleteHousecall(call: any) { pendingDeleteHousecall.value = call }
async function executeDeleteHousecall() {
  if (!pendingDeleteHousecall.value) return
  try { await appStore.deleteHouseCall(pendingDeleteHousecall.value.id); toast.success('Deleted', 'House call removed') }
  catch (e: any) { toast.danger('Error', 'Failed to delete house call') }
  pendingDeleteHousecall.value = null
}
async function saveHousecall() {
  try {
    const isNew = !editingHousecall.value
    if (editingHousecall.value) { await appStore.updateHouseCall(editingHousecall.value.id, { ...housecallForm.value }) }
    else { await appStore.createHouseCall({ ...housecallForm.value, status: 'Scheduled' }) }
    housecallFormOpen.value = false; editingHousecall.value = null
    toast.success('Saved', isNew ? 'House call scheduled' : 'House call updated')
    if (isNew) { sendHousecallEmail(housecallForm.value).catch(() => {}); sendInternalAlert({ eventType: 'House Call', eventSummary: 'New house call scheduled', customerName: getCustomerName(housecallForm.value.customerId), deviceName: '', issueDescription: housecallForm.value.issue || '' }).catch(() => {}) }
  } catch (e: any) { toast.danger('Error', e.message || 'Failed to save house call') }
}
async function advanceHousecallStatus(call: any) {
  try { await appStore.updateHouseCall(call.id, { status: call.status === 'Scheduled' ? 'In Progress' : 'Completed' }) }
  catch (e: any) { toast.danger('Error', 'Failed to update status') }
}

const printCurrentHousecall = () => {
  if (!housecallForm.value) return
  const customerEmail = customers.value.find((c: any) => c.id === housecallForm.value.customerId)?.email || ''
  let displayTime = housecallForm.value.time || 'TBD'
  if (displayTime !== 'TBD' && displayTime.includes(':')) {
    const [h, m] = displayTime.split(':'); const hour = parseInt(h, 10); const ampm = hour >= 12 ? 'PM' : 'AM'; const hour12 = hour % 12 || 12; displayTime = `${hour12}:${m} ${ampm}`
  }
  printHousecall({ businessName: settings.value?.businessName || 'NovaOps', businessAddress: settings.value?.address || '', businessPhone: settings.value?.phone || '', customerName: getCustomerName(housecallForm.value.customerId), customerPhone: getCustomerPhone(housecallForm.value.customerId), customerEmail, serviceAddress: housecallForm.value.address, date: housecallForm.value.date ? formatDate(housecallForm.value.date) : 'TBD', time: displayTime, issue: housecallForm.value.issue || 'No details provided.', status: housecallForm.value.status, estimate: housecallEstimate.value ? `${settings.value?.currency || '$'}${housecallEstimate.value.toFixed(2)}` : undefined })
}

watch(housecallFormOpen, (open) => {
  if (open) { calc.value = { labor: 0, parts: 0, travel: 0, taxRate: 0 }; housecallEstimate.value = 0; if (!housecallForm.value.address) { mapsUrl.value = ''; addressSuggestions.value = [] } else { onAddressInput() } }
})

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

const osmQueue = ref<string[]>([])
let processingOsm = false
const processOsmQueue = async () => {
  if (processingOsm || osmQueue.value.length === 0) return
  processingOsm = true
  while (osmQueue.value.length > 0) {
    const addr = osmQueue.value.shift()
    if (addr && !latLonCache.value[addr]) {
      try { const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`); const data = await res.json(); latLonCache.value[addr] = (data && data[0]) ? data[0] : { notfound: true }; localStorage.setItem('osm_cache', JSON.stringify(latLonCache.value)) } catch {}
      await new Promise(r => setTimeout(r, 1200))
    }
  }
  processingOsm = false
}
const getOsmCardUrl = (address: string) => {
  if (!address || address.length < 5) return ''
  const cached = latLonCache.value[address]
  if (cached) {
    if (cached.notfound) return ''
    const [lat1, lat2, lon1, lon2] = cached.boundingbox || [parseFloat(cached.lat) - 0.005, parseFloat(cached.lat) + 0.005, parseFloat(cached.lon) - 0.005, parseFloat(cached.lon) + 0.005]
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${cached.lat}%2C${cached.lon}`
  }
  if (!osmQueue.value.includes(address)) { osmQueue.value.push(address); processOsmQueue() }
  return ''
}

// ── Vendor Repairs ───────────────────────────────────────────────
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
  { label: 'Total Sent',  value: vendorRepairs.value.length,                                                                                color: '#8b5cf6', icon: Package },
  { label: 'In Transit',  value: vendorRepairs.value.filter((r: any) => r.status === 'Shipped to Vendor' || r.status === 'Shipped Back').length, color: '#3b82f6', icon: Truck },
  { label: 'In Repair',   value: vendorRepairs.value.filter((r: any) => r.status === 'In Repair').length,                                   color: '#f59e0b', icon: Wrench },
  { label: 'Overdue',     value: vendorRepairs.value.filter((r: any) => isOverdue(r)).length,                                               color: '#ef4444', icon: AlertCircle },
])

const vendorStatusColor = (status: string) => ({ 'Preparing to Ship': '#64748b', 'Shipped to Vendor': '#3b82f6', 'In Repair': '#f59e0b', 'Shipped Back': '#06b6d4', 'Received': '#10b981', 'Returned to Customer': '#6366f1', 'Cancelled': '#ef4444' }[status] || '#64748b')
const vendorStatusVariant = (status: string) => ({ 'Preparing to Ship': 'muted', 'Shipped to Vendor': 'info', 'In Repair': 'warning', 'Shipped Back': 'accent', 'Received': 'success', 'Returned to Customer': 'accent', 'Cancelled': 'danger' }[status] || 'muted') as any
const isOverdue = (repair: any) => { if (!repair.estReturn || repair.status === 'Returned to Customer' || repair.status === 'Cancelled') return false; return new Date(repair.estReturn) < new Date() }

function openNewVendorRepair() { editingVendorRepair.value = null; vendorForm.value = defaultVendorForm(); vendorFormOpen.value = true }
function openVendorRepair(repair: any) { editingVendorRepair.value = repair; vendorForm.value = { ...repair }; vendorFormOpen.value = true }
async function saveVendorRepair() {
  try {
    const isNew = !editingVendorRepair.value
    if (editingVendorRepair.value) { await appStore.updateVendorRepair(editingVendorRepair.value.id, { ...vendorForm.value }) }
    else { await appStore.createVendorRepair({ ...vendorForm.value }) }
    vendorFormOpen.value = false; editingVendorRepair.value = null
    toast.success('Saved', isNew ? 'Vendor repair created' : 'Vendor repair updated')
    if (isNew) { sendVendorRepairEmail(vendorForm.value).catch(() => {}); sendInternalAlert({ eventType: 'Vendor Repair', eventSummary: 'New vendor repair dispatched', customerName: getCustomerName(vendorForm.value.customerId), deviceName: vendorForm.value.device || '', issueDescription: vendorForm.value.issue || '', ticketNumber: vendorForm.value.ticketRef || '' }).catch(() => {}) }
  } catch (e: any) { toast.danger('Error', e.message || 'Failed to save vendor repair') }
}
</script>

<style scoped>
.bk-root { display: flex; flex-direction: column; gap: 20px; }

/* ── Header ────────────────────────────────────────────────────── */
.bk-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.bk-header-icon {
  width: 48px; height: 48px; border-radius: 18px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  box-shadow: 0 4px 20px #6366f150;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.bk-title    { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; line-height: 1; }
.bk-subtitle { font-size: 13px; color: hsl(var(--muted-foreground)); font-weight: 500; margin-top: 3px; }
.bk-fab {
  display: flex; align-items: center; gap: 8px;
  height: 44px; padding: 0 20px; border-radius: 99px;
  font-size: 13px; font-weight: 900; color: white;
  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
}
.bk-fab:hover  { transform: scale(1.05) translateY(-2px); }
.bk-fab:active { transform: scale(0.92); }

/* ── Tabs ──────────────────────────────────────────────────────── */
.bk-tabs { display: flex; gap: 6px; padding: 6px; border-radius: 20px; background: hsl(var(--muted)/0.6); align-self: flex-start; }
.bk-tab {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 18px; border-radius: 15px;
  font-size: 13px; font-weight: 700;
  color: hsl(var(--muted-foreground));
  transition: all 0.25s cubic-bezier(0.34,1.2,0.64,1);
}
.bk-tab:hover:not(.bk-tab--active) { background: hsl(var(--muted)/0.5); color: hsl(var(--foreground)); }
.bk-tab-badge {
  font-size: 10px; font-weight: 900; padding: 2px 6px;
  border-radius: 99px; min-width: 18px; text-align: center;
}

/* ── Tab Content ───────────────────────────────────────────────── */
.tab-content { display: flex; flex-direction: column; gap: 16px; }

/* ── KPI Cards ─────────────────────────────────────────────────── */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
.kpi-card {
  border-radius: 22px; border: 1.5px solid transparent;
  padding: 18px 20px; display: flex; flex-direction: column; gap: 10px;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
}
.kpi-card:hover { transform: scale(1.03) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.kpi-icon { width: 44px; height: 44px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.kpi-label { font-size: 11px; font-weight: 600; color: hsl(var(--muted-foreground)); }
.kpi-value { font-size: 26px; font-weight: 900; line-height: 1; }

/* ── Filters ───────────────────────────────────────────────────── */
.filters-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 160px; max-width: 340px; }
.search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: hsl(var(--muted-foreground)); pointer-events: none; }
.search-input { width: 100%; height: 44px; padding-left: 44px; padding-right: 16px; border-radius: 99px; font-size: 13px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 1.5px solid hsl(var(--border)/0.7); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
.search-input:focus { border-color: #f59e0b80; box-shadow: 0 0 0 3px #f59e0b15; }

.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-chip {
  padding: 7px 14px; border-radius: 99px; font-size: 11px; font-weight: 700;
  background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground));
  transition: all 0.2s; white-space: nowrap;
}
.filter-chip:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); transform: scale(1.03); }
.filter-chip--active { background: #f59e0b22; color: #d97706; outline: 1.5px solid #f59e0b45; outline-offset: 0; }
.filter-chip--active.filter-chip--green  { background: #10b98122; color: #059669; outline-color: #10b98145; }
.filter-chip--active.filter-chip--purple { background: #8b5cf622; color: #7c3aed; outline-color: #8b5cf645; }

/* ── Ticket Cards ──────────────────────────────────────────────── */
.ticket-list { display: flex; flex-direction: column; gap: 14px; }
.ticket-card {
  border-radius: 22px; overflow: hidden;
  border: 1.5px solid hsl(var(--border)/0.6);
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.3s;
}
.ticket-card:hover  { transform: scale(1.01) translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.ticket-card:active { transform: scale(0.98); }

.ticket-card-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 20px 14px; }
.ticket-card-info { display: flex; flex-direction: column; gap: 5px; }
.ticket-id-row    { display: flex; align-items: center; gap: 8px; }
.ticket-id        { font-size: 18px; font-weight: 900; }
.priority-chip    { font-size: 9px; font-weight: 900; padding: 2px 7px; border-radius: 99px; }
.ticket-customer-name { font-size: 13px; font-weight: 800; color: hsl(var(--foreground)); }
.ticket-device-row { display: flex; align-items: center; gap: 6px; }
.ticket-device    { font-size: 13px; font-weight: 600; color: hsl(var(--foreground)); }

.ticket-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; margin-left: 16px; }

/* Action dropdown */
.ticket-action-btn {
  width: 30px; height: 30px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: hsl(var(--muted-foreground));
  transition: background 0.15s, color 0.15s, transform 0.2s;
}
.ticket-action-btn:hover { background: hsl(var(--muted)/0.7); color: hsl(var(--foreground)); transform: scale(1.1); }
.ticket-action-btn:active { transform: scale(0.9); }

.ticket-dropdown {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 100;
  min-width: 220px;
  background: hsl(var(--popover));
  border: 1.5px solid hsl(var(--border));
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  padding: 6px;
}
.dropdown-section-label {
  font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
  color: hsl(var(--muted-foreground)); padding: 6px 10px 4px;
}
.dropdown-item {
  width: 100%; display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 10px; border-radius: 12px;
  transition: background 0.12s; text-align: left;
}
.dropdown-item:hover { background: hsl(var(--muted)/0.5); }
.dropdown-item--danger:hover { background: #ef444410; }
.dropdown-item-icon {
  width: 30px; height: 30px; border-radius: 9px;
  background: hsl(var(--muted)/0.5);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  color: hsl(var(--muted-foreground)); margin-top: 1px;
}
.dropdown-item-icon--danger { background: #ef444415; color: #dc2626; }
.dropdown-item--danger .dropdown-item-label { color: #dc2626; }
.dropdown-item-body { flex: 1; min-width: 0; }
.dropdown-item-label { display: block; font-size: 12px; font-weight: 700; color: hsl(var(--foreground)); line-height: 1.2; }
.dropdown-item-desc  { display: block; font-size: 10px; color: hsl(var(--muted-foreground)); margin-top: 1px; }
.dropdown-kbd { font-size: 9px; font-weight: 700; font-family: monospace; padding: 2px 6px; border-radius: 6px; background: hsl(var(--muted)/0.6); color: hsl(var(--muted-foreground)); flex-shrink: 0; align-self: center; }
.dropdown-separator { height: 1px; background: hsl(var(--border)/0.6); margin: 4px 4px; }

/* Tear line */
.tear-line { display: flex; align-items: center; padding: 0 14px; position: relative; }
.scallop-left, .scallop-right { width: 18px; height: 18px; border-radius: 50%; background: hsl(var(--background)); flex-shrink: 0; }
.scallop-left  { transform: translateX(-7px); }
.scallop-right { transform: translateX(7px); }
.tear-dashes   { flex: 1; border-top: 2px dashed; margin: 0 8px; }

.ticket-card-foot { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px 16px; }
.ticket-issue { font-size: 12px; color: hsl(var(--muted-foreground)); font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ticket-foot-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; margin-left: 12px; }
.ticket-price { font-size: 14px; font-weight: 900; }
.ticket-date  { font-size: 10px; color: hsl(var(--muted-foreground)); font-weight: 600; }

/* ── House Calls ───────────────────────────────────────────────── */
.housecall-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 1100px) { .housecall-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px)  { .housecall-grid { grid-template-columns: 1fr; } }

.hc-card {
  border-radius: 22px; padding: 18px; background: hsl(var(--card));
  border: 1.5px solid hsl(var(--border)/0.6);
  display: flex; flex-direction: column; gap: 10px; cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.3s;
}
.hc-card:hover  { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.hc-card:active { transform: scale(0.96); }
.hc-card-top   { display: flex; align-items: center; justify-content: space-between; }
.hc-icon-wrap  { width: 42px; height: 42px; border-radius: 16px; background: #10b98120; display: flex; align-items: center; justify-content: center; }
.hc-customer   { font-size: 14px; font-weight: 900; }
.hc-address    { font-size: 11px; color: hsl(var(--muted-foreground)); font-weight: 500; display: flex; align-items: flex-start; gap: 4px; margin-top: 4px; }
.hc-time       { font-size: 11px; font-weight: 700; color: #10b981; margin-top: 6px; }
.hc-map-preview { width: 100%; height: 96px; border-radius: 12px; overflow: hidden; background: hsl(var(--muted)/0.3); border: 1px solid hsl(var(--border)/0.5); }
.hc-issue      { font-size: 11px; color: hsl(var(--muted-foreground)); font-weight: 500; border-top: 1px solid hsl(var(--border)/0.5); padding-top: 8px; }
.hc-actions    { display: flex; align-items: center; gap: 8px; }
.hc-advance-btn { flex: 1; height: 32px; border-radius: 99px; font-size: 11px; font-weight: 700; transition: all 0.2s; }
.hc-advance-btn:hover { opacity: 0.85; transform: scale(1.02); }
.hc-delete-btn { width: 32px; height: 32px; border-radius: 99px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.hc-delete-btn:hover { background: #ef444415; transform: scale(1.1); }
.hc-delete-btn:active { transform: scale(0.9); }

/* ── Vendor Repairs ────────────────────────────────────────────── */
.vendor-list { display: flex; flex-direction: column; gap: 12px; }
.vendor-card {
  border-radius: 20px; overflow: hidden;
  border: 1.5px solid hsl(var(--border)/0.6);
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.3s;
}
.vendor-card:hover  { transform: scale(1.01) translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.09); }
.vendor-card:active { transform: scale(0.98); }
.vendor-card-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 16px 20px; }
.vendor-icon { width: 42px; height: 42px; border-radius: 16px; background: #8b5cf622; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vendor-name-row  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.vendor-name      { font-size: 15px; font-weight: 900; }
.ticket-ref-chip  { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: #f59e0b20; color: #d97706; }
.vendor-device    { font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground)); }
.vendor-customer  { font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px; }
.overdue-chip     { font-size: 9px; font-weight: 900; padding: 2px 7px; border-radius: 99px; background: #ef444418; color: #dc2626; }
.vendor-card-foot { display: flex; align-items: center; gap: 20px; padding: 12px 20px; flex-wrap: wrap; }
.vendor-detail    { display: flex; align-items: center; gap: 8px; }
.vendor-detail-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: hsl(var(--muted-foreground)); }
.vendor-detail-val   { font-size: 12px; font-weight: 700; }

/* ── Empty State ───────────────────────────────────────────────── */
.empty-state { border-radius: 28px; padding: 64px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; background: hsl(var(--card)); border: 1.5px solid hsl(var(--border)/0.6); text-align: center; }
.empty-icon  { width: 80px; height: 80px; border-radius: 28px; display: flex; align-items: center; justify-content: center; }
.empty-title { font-size: 17px; font-weight: 900; }
.empty-sub   { font-size: 13px; color: hsl(var(--muted-foreground)); font-weight: 500; }
.empty-cta   { display: flex; align-items: center; gap: 7px; padding: 10px 22px; border-radius: 99px; font-size: 13px; font-weight: 900; color: white; transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1); margin-top: 4px; }
.empty-cta:hover { transform: scale(1.04) translateY(-2px); }
.empty-cta:active { transform: scale(0.95); }

/* ── Dropdown Transition ───────────────────────────────────────── */
.dropdown-enter-active { transition: all 0.2s cubic-bezier(0.34,1.3,0.64,1); }
.dropdown-leave-active { transition: all 0.12s ease; }
.dropdown-enter-from   { opacity: 0; transform: scale(0.92) translateY(-6px); transform-origin: top right; }
.dropdown-leave-to     { opacity: 0; transform: scale(0.95); transform-origin: top right; }

/* ── Calendar picker popover ───────────────────────────────────── */
.cal-pop-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.3, 0.64, 1); }
.cal-pop-leave-active { transition: all 0.15s ease; }
.cal-pop-enter-from   { opacity: 0; transform: scale(0.94) translateY(-6px); transform-origin: top left; }
.cal-pop-leave-to     { opacity: 0; transform: scale(0.96); }

/* ── Legacy m3 helpers used by dialogs ────────────────────────── */
.m3-label { font-size: 11px; font-weight: 700; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.06em; }
.m3-input { width: 100%; height: 44px; padding: 0 14px; border-radius: 14px; font-size: 13px; font-weight: 600; background: hsl(var(--muted)/0.3); border: 1.5px solid hsl(var(--border)/0.7); outline: none; transition: border-color 0.2s, box-shadow 0.2s; color: hsl(var(--foreground)); }
.m3-input:focus { border-color: #10b98180; box-shadow: 0 0 0 3px #10b98115; }
</style>
