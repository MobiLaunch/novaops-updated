<template>
  <div class="flex flex-col gap-8">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg"
          style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); box-shadow: 0 4px 20px #6366f150"
        >
          <ClipboardList class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Booking Management</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Tickets, house calls, and third-party repairs — all in one place</p>
        </div>
      </div>

      <!-- Dynamic action button per tab -->
      <button
        v-if="activeTab === 'tickets'"
        class="m3-fab flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white"
        style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 16px #f59e0b40"
        @click="newTicketOpen = true"
      >
        <Plus class="w-4 h-4" /> New Ticket
      </button>
      <button
        v-else-if="activeTab === 'housecalls'"
        class="m3-fab flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white"
        style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 16px #10b98140"
        @click="openNewHousecall"
      >
        <Plus class="w-4 h-4" /> Schedule Call
      </button>
      <button
        v-else-if="activeTab === 'thirdparty'"
        class="m3-fab flex items-center gap-2 h-11 px-5 rounded-full text-sm font-black text-white"
        style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 16px #8b5cf640"
        @click="openNewVendorRepair"
      >
        <Plus class="w-4 h-4" /> New Vendor Repair
      </button>
    </div>

    <!-- ── Tab Bar ─────────────────────────────────────────────── -->
    <div class="flex gap-1.5 p-1.5 rounded-[20px] self-start" style="background: hsl(var(--muted)/0.6)">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex items-center gap-2 px-5 py-2.5 rounded-[16px] text-sm font-bold transition-all"
        :style="activeTab === tab.id
          ? `background: ${tab.color}; color: white; box-shadow: 0 4px 12px ${tab.color}50`
          : 'color: hsl(var(--muted-foreground))'"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
          :style="activeTab === tab.id ? 'background: rgba(255,255,255,0.25); color: white' : `background: ${tab.color}22; color: ${tab.color}`"
        >{{ tab.count }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: TICKETS                                              -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'tickets'" class="flex flex-col gap-6">

      <!-- KPI Row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="stat in ticketStats" :key="stat.label" class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3"
          :style="`background: ${stat.color}14; outline: 2px solid ${stat.color}28; outline-offset: 0`">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" :style="`background: ${stat.color}24`">
              <component :is="stat.icon" class="w-5 h-5" :style="`color: ${stat.color}`" />
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-muted-foreground">{{ stat.label }}</p>
            <p class="text-2xl font-black" :style="`color: ${stat.color}`">{{ stat.value }}</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="relative flex-1 min-w-[160px] max-w-sm">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input v-model="ticketSearch" placeholder="Search tickets…"
            class="w-full h-12 pl-11 pr-4 rounded-full text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all font-medium" />
        </div>
        <div class="flex gap-2 flex-wrap">
          <button v-for="s in [null, ...statusList]" :key="s ?? 'all'"
            class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            :style="ticketFilter === s
              ? 'background: #f59e0b24; color: #f59e0b; outline: 2px solid #f59e0b50; outline-offset: 0'
              : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
            @click="ticketFilter = s">{{ s ?? 'All Statuses' }}</button>
        </div>
      </div>

      <!-- Ticket List -->
      <div class="space-y-4">
        <div v-for="ticket in filteredTickets" :key="ticket.id" class="m3-ticket-card cursor-pointer" @click="openTicket(ticket)">
          <div class="px-6 pt-5 pb-4 rounded-t-[24px] flex items-start justify-between" :style="`background: ${ticketStatusColor(ticket.status)}14`">
            <div class="space-y-1">
              <div class="flex items-center gap-2.5">
                <span class="text-lg font-black" :style="`color: ${ticketStatusColor(ticket.status)}`">#{{ ticket.id }}</span>
                <span class="text-[10px] font-black px-2.5 py-1 rounded-full" :style="`background: ${priorityColor(ticket.priority)}20; color: ${priorityColor(ticket.priority)}`">{{ ticket.priority?.toUpperCase() }}</span>
              </div>
              <p class="text-sm font-bold text-foreground">{{ getCustomerName(ticket.customerId) }}</p>
              <div class="flex items-center gap-2 text-sm">
                <Smartphone class="h-3.5 w-3.5 text-muted-foreground" />
                <span class="font-semibold text-foreground">{{ ticket.device }} {{ ticket.deviceModel || '' }}</span>
              </div>
            </div>
            <span class="text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0 ml-4" :style="`background: ${ticketStatusColor(ticket.status)}24; color: ${ticketStatusColor(ticket.status)}`">{{ ticket.status }}</span>
          </div>
          <div class="m3-tear-line relative flex items-center px-4 py-0" :style="`background: ${ticketStatusColor(ticket.status)}08`">
            <div class="m3-scallop-left" style="background: hsl(var(--background))" />
            <div class="flex-1 border-t-2 border-dashed mx-6" :style="`border-color: ${ticketStatusColor(ticket.status)}40`" />
            <div class="m3-scallop-right" style="background: hsl(var(--background))" />
          </div>
          <div class="px-6 py-4 rounded-b-[24px] flex items-center justify-between" :style="`background: ${ticketStatusColor(ticket.status)}08`">
            <p class="text-sm text-muted-foreground font-medium line-clamp-1 flex-1">{{ ticket.issue }}</p>
            <div class="flex items-center gap-4 flex-shrink-0 ml-4">
              <span class="text-base font-black" :style="`color: ${ticketStatusColor(ticket.status)}`">{{ formatCurrency(ticket.price) }}</span>
              <span class="text-[10px] text-muted-foreground font-semibold">{{ formatDate(ticket.createdAt) }}</span>
            </div>
          </div>
        </div>
        <div v-if="filteredTickets.length === 0" class="rounded-[32px] py-20 flex flex-col items-center gap-4 bg-card" style="outline: 2px solid hsl(var(--border)/0.6)">
          <div class="w-20 h-20 rounded-[32px] flex items-center justify-center" style="background: #f59e0b14">
            <Inbox class="w-10 h-10" style="color: #f59e0b; opacity: 0.5" />
          </div>
          <div class="text-center">
            <h3 class="text-lg font-black mb-1">No tickets found</h3>
            <p class="text-sm text-muted-foreground font-medium">Get started by creating your first ticket</p>
          </div>
          <button class="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black text-white" style="background: linear-gradient(135deg, #f59e0b, #d97706)" @click="newTicketOpen = true">
            <Plus class="w-4 h-4" /> Create Ticket
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: HOUSE CALLS                                          -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'housecalls'" class="flex flex-col gap-6">

      <!-- KPI Row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #10b98124"><MapPin class="w-5 h-5" style="color: #10b981" /></div>
            <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #10b98120; color: #10b981">TOTAL</span>
          </div>
          <div><p class="text-xs font-semibold text-muted-foreground">All Calls</p><p class="text-2xl font-black" style="color: #10b981">{{ housecalls.length }}</p></div>
        </div>
        <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #3b82f614; outline: 2px solid #3b82f628; outline-offset: 0">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #3b82f624"><Clock class="w-5 h-5" style="color: #3b82f6" /></div>
            <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #3b82f620; color: #3b82f6">SCHED</span>
          </div>
          <div><p class="text-xs font-semibold text-muted-foreground">Scheduled</p><p class="text-2xl font-black" style="color: #3b82f6">{{ countHousecallByStatus('Scheduled') }}</p></div>
        </div>
        <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #f59e0b14; outline: 2px solid #f59e0b28; outline-offset: 0">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #f59e0b24"><Wrench class="w-5 h-5" style="color: #f59e0b" /></div>
            <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #f59e0b20; color: #f59e0b">ACTIVE</span>
          </div>
          <div><p class="text-xs font-semibold text-muted-foreground">In Progress</p><p class="text-2xl font-black" style="color: #f59e0b">{{ countHousecallByStatus('In Progress') }}</p></div>
        </div>
        <div class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3" style="background: #6366f114; outline: 2px solid #6366f128; outline-offset: 0">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #6366f124"><CheckCircle class="w-5 h-5" style="color: #6366f1" /></div>
            <span class="text-[10px] font-black px-2 py-1 rounded-full" style="background: #6366f120; color: #6366f1">DONE</span>
          </div>
          <div><p class="text-xs font-semibold text-muted-foreground">Completed</p><p class="text-2xl font-black" style="color: #6366f1">{{ countHousecallByStatus('Completed') }}</p></div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-1.5 rounded-full p-1 self-start" style="background: hsl(var(--muted)/0.5)">
        <button v-for="f in housecallFilterOptions" :key="f"
          class="px-4 py-2 rounded-full text-xs font-black transition-all"
          :style="housecallFilter === f ? 'background: white; color: #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.1)' : 'color: hsl(var(--muted-foreground))'"
          @click="housecallFilter = f">{{ f }}</button>
      </div>

      <!-- House Call Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="call in filteredHousecalls" :key="call.id"
          class="m3-card rounded-[28px] p-5 flex flex-col gap-3 bg-card cursor-pointer"
          style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
          @click="viewHousecall(call)">
          <div class="flex items-start justify-between">
            <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" style="background: #10b98120"><MapPin class="w-5 h-5" style="color: #10b981" /></div>
            <span class="text-[10px] font-black px-2.5 py-1 rounded-full" :style="callStatusStyle(call.status)">{{ call.status }}</span>
          </div>
          <div>
            <h3 class="font-black text-sm">{{ call.customerName }}</h3>
            <p class="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1.5"><MapPin class="w-3 h-3 flex-shrink-0" />{{ call.address }}</p>
            <p class="text-xs font-semibold mt-2" style="color: #10b981">{{ formatDate(call.date) }} at {{ call.time }}</p>
          </div>
          <div v-if="call.address && call.address.length > 5 && getOsmCardUrl(call.address)" class="w-full h-24 rounded-xl overflow-hidden bg-muted mt-1 pointer-events-none" style="outline: 1px solid hsl(var(--border)/0.5); outline-offset: 0; background: hsl(var(--muted)/0.3)">
            <iframe :src="getOsmCardUrl(call.address)" class="w-full h-full" style="border:0" />
          </div>
          <p class="text-xs text-muted-foreground font-medium line-clamp-2 border-t border-border/60 pt-2 mt-2">{{ call.issue }}</p>
          <div class="flex items-center gap-2 pt-1">
            <button v-if="call.status !== 'Completed'"
              class="flex-1 h-8 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
              :style="call.status === 'Scheduled' ? 'background: #f59e0b20; color: #f59e0b' : 'background: #10b98120; color: #10b981'"
              @click.stop="advanceHousecallStatus(call)">{{ call.status === 'Scheduled' ? 'Start Call' : 'Complete' }}</button>
            <button class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 transition-all hover:scale-110 active:scale-90" @click.stop="deleteHousecall(call)">
              <Trash2 class="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div v-if="filteredHousecalls.length === 0" class="col-span-full rounded-[32px] py-16 flex flex-col items-center gap-4 bg-card" style="outline: 2px solid hsl(var(--border)/0.6)">
          <div class="w-16 h-16 rounded-[28px] flex items-center justify-center" style="background: #10b98114"><MapPin class="w-8 h-8" style="color: #10b981; opacity: 0.5" /></div>
          <div class="text-center">
            <p class="font-black">No house calls {{ housecallFilter !== 'All' ? `with status "${housecallFilter}"` : 'scheduled' }}</p>
            <p class="text-xs text-muted-foreground font-medium mt-1">{{ housecallFilter === 'All' ? 'Schedule your first on-site visit' : 'Try a different filter' }}</p>
          </div>
          <button class="px-5 py-2.5 rounded-full text-sm font-bold text-white" style="background: linear-gradient(135deg, #10b981, #059669)" @click="openNewHousecall">Schedule Call</button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB: THIRD-PARTY / VENDOR REPAIRS                         -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'thirdparty'" class="flex flex-col gap-6">

      <!-- KPI Row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="stat in vendorStats" :key="stat.label" class="m3-kpi rounded-[28px] p-5 flex flex-col gap-3"
          :style="`background: ${stat.color}14; outline: 2px solid ${stat.color}28; outline-offset: 0`">
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-[22px] flex items-center justify-center" :style="`background: ${stat.color}24`">
              <component :is="stat.icon" class="w-5 h-5" :style="`color: ${stat.color}`" />
            </div>
          </div>
          <div><p class="text-xs font-semibold text-muted-foreground">{{ stat.label }}</p><p class="text-2xl font-black" :style="`color: ${stat.color}`">{{ stat.value }}</p></div>
        </div>
      </div>

      <!-- Search + Filter -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="relative flex-1 min-w-[160px] max-w-sm">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input v-model="vendorSearch" placeholder="Search vendor repairs…"
            class="w-full h-12 pl-11 pr-4 rounded-full text-sm bg-muted/50 border-2 border-border/60 focus:outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 transition-all font-medium" />
        </div>
        <div class="flex gap-2 flex-wrap">
          <button v-for="s in [null, ...vendorStatusList]" :key="s ?? 'all'"
            class="px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            :style="vendorFilter === s
              ? 'background: #8b5cf624; color: #8b5cf6; outline: 2px solid #8b5cf650; outline-offset: 0'
              : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
            @click="vendorFilter = s">{{ s ?? 'All Statuses' }}</button>
        </div>
      </div>

      <!-- Vendor Repair Cards -->
      <div class="space-y-4">
        <div v-for="repair in filteredVendorRepairs" :key="repair.id"
          class="m3-vendor-card rounded-[24px] overflow-hidden cursor-pointer"
          style="outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0"
          @click="openVendorRepair(repair)">
          <!-- Header strip -->
          <div class="px-6 pt-5 pb-4 flex items-start justify-between" :style="`background: ${vendorStatusColor(repair.status)}12`">
            <div class="flex items-start gap-4">
              <!-- Vendor icon -->
              <div class="w-11 h-11 rounded-[20px] flex items-center justify-center flex-shrink-0" style="background: #8b5cf624">
                <Building2 class="w-5 h-5" style="color: #8b5cf6" />
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-black text-base">{{ repair.vendor }}</span>
                  <span v-if="repair.ticketRef" class="text-xs font-bold px-2 py-0.5 rounded-full" style="background: #f59e0b20; color: #f59e0b">Ticket #{{ repair.ticketRef }}</span>
                </div>
                <p class="text-sm font-semibold text-muted-foreground">{{ repair.device }} — {{ repair.issue }}</p>
                <p class="text-xs font-medium text-muted-foreground">Customer: {{ repair.customerName }}</p>
              </div>
            </div>
            <!-- Status badge -->
            <span class="text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0 ml-4 whitespace-nowrap"
              :style="`background: ${vendorStatusColor(repair.status)}24; color: ${vendorStatusColor(repair.status)}`">{{ repair.status }}</span>
          </div>

          <!-- Details row -->
          <div class="px-6 py-4 flex items-center gap-6 flex-wrap" :style="`background: ${vendorStatusColor(repair.status)}06`">
            <!-- Tracking -->
            <div class="flex items-center gap-2">
              <Truck class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tracking</p>
                <p class="text-xs font-bold" :class="repair.trackingNumber ? 'text-foreground' : 'text-muted-foreground'">
                  {{ repair.trackingNumber || 'Not provided' }}
                </p>
              </div>
            </div>
            <!-- Sent date -->
            <div class="flex items-center gap-2">
              <CalendarIcon class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sent</p>
                <p class="text-xs font-bold">{{ repair.sentDate ? formatDate(repair.sentDate) : '—' }}</p>
              </div>
            </div>
            <!-- Est. return -->
            <div class="flex items-center gap-2">
              <RotateCcw class="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p class="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Est. Return</p>
                <p class="text-xs font-bold" :class="isOverdue(repair) ? 'text-red-500' : ''">
                  {{ repair.estReturn ? formatDate(repair.estReturn) : '—' }}
                  <span v-if="isOverdue(repair)" class="ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full" style="background: #ef444420; color: #ef4444">OVERDUE</span>
                </p>
              </div>
            </div>
            <!-- Notes preview -->
            <div v-if="repair.notes" class="flex-1 min-w-0 ml-auto">
              <p class="text-xs text-muted-foreground font-medium line-clamp-1">📝 {{ repair.notes }}</p>
            </div>
          </div>
        </div>

        <div v-if="filteredVendorRepairs.length === 0" class="rounded-[32px] py-20 flex flex-col items-center gap-4 bg-card" style="outline: 2px solid hsl(var(--border)/0.6)">
          <div class="w-20 h-20 rounded-[32px] flex items-center justify-center" style="background: #8b5cf614">
            <Building2 class="w-10 h-10" style="color: #8b5cf6; opacity: 0.5" />
          </div>
          <div class="text-center">
            <h3 class="text-lg font-black mb-1">No vendor repairs</h3>
            <p class="text-sm text-muted-foreground font-medium">Send your first device out for third-party repair</p>
          </div>
          <button class="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black text-white" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)" @click="openNewVendorRepair">
            <Plus class="w-4 h-4" /> New Vendor Repair
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- DIALOGS                                                   -->
    <!-- ══════════════════════════════════════════════════════════ -->

    <!-- Ticket Dialogs -->
    <NewTicketDialog v-model="newTicketOpen" :customers="customers" @create="handleCreateTicket" />
    <TicketDetailDialog v-if="selectedTicket" v-model="ticketDetailOpen" :ticket="selectedTicket" @save="handleSaveTicket" @delete="handleDeleteTicket" />

    <!-- House Call Dialog -->
    <Dialog v-model:open="housecallFormOpen">
      <DialogContent class="w-full max-w-[96vw] sm:max-w-2xl">
        <div class="flex flex-col gap-5 p-4 sm:p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #10b981, #059669)">
              <MapPin class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">{{ editingHousecall ? 'Edit House Call' : 'Schedule House Call' }}</h2>
              <p class="text-xs text-muted-foreground font-medium">On-site repair appointment</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- LEFT: Form -->
            <div class="flex flex-col gap-4">
              <div class="space-y-2"><label class="m3-label">Customer</label><CustomerSelect v-model="housecallForm.customerId" /></div>
              <div class="space-y-2 relative">
                <label class="m3-label">Address</label>
                <div class="relative">
                  <input ref="addressInputRef" v-model="housecallForm.address" placeholder="123 Main St, City, State" class="m3-input pr-12" @input="onAddressInput" @focus="showSuggestions = addressSuggestions.length > 0" />
                  <button class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
                    style="background: #3b82f620" title="Open in Maps" @click="openMaps">
                    <Navigation class="w-4 h-4" style="color: #3b82f6" />
                  </button>
                </div>
                <!-- Autocomplete Dropdown -->
                <div v-if="showSuggestions && addressSuggestions.length > 0" class="absolute z-50 left-0 right-0 top-full mt-2 bg-card border-2 border-border/60 rounded-[16px] shadow-xl overflow-hidden max-h-60 overflow-y-auto" style="outline: 2px solid hsl(var(--border)/0.4)">
                  <div v-for="sug in addressSuggestions" :key="sug.place_id" class="px-4 py-3 hover:bg-muted/50 cursor-pointer border-b border-border/20 last:border-0 text-xs font-medium transition-colors" @click="selectSuggestion(sug)">
                    {{ sug.display_name }}
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-2"><label class="m3-label">Date</label><input v-model="housecallForm.date" type="date" class="m3-input" /></div>
                <div class="space-y-2"><label class="m3-label">Time</label><input v-model="housecallForm.time" type="time" class="m3-input" /></div>
              </div>
              <div class="space-y-2"><label class="m3-label">Issue / Description</label><textarea v-model="housecallForm.issue" placeholder="Describe the repair needed…" rows="3" class="m3-input resize-none" style="height: auto; padding-top: 12px" /></div>
              <div v-if="editingHousecall" class="space-y-2">
                <label class="m3-label">Status</label>
                <select v-model="housecallForm.status" class="m3-input">
                  <option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                </select>
              </div>
              <div class="rounded-[18px] p-4 flex items-center justify-between" style="background: #10b98114; outline: 2px solid #10b98128; outline-offset: 0">
                <span class="text-xs font-black text-muted-foreground uppercase tracking-widest">Call Estimate</span>
                <span class="text-lg font-black" style="color: #10b981">${{ housecallEstimate.toFixed(2) }}</span>
              </div>
            </div>

            <!-- RIGHT: Map + Calculator -->
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
                <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Calculator class="w-3 h-3" /> Job Calculator
                </p>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Labor ($)</label>
                    <input v-model.number="calc.labor" type="number" min="0" step="0.01" placeholder="0.00"
                      class="w-full h-9 px-3 rounded-[12px] text-xs font-bold bg-background border-2 border-border/60 outline-none focus:border-emerald-400/50 transition-all" />
                  </div>
                  <div>
                    <label class="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Parts ($)</label>
                    <input v-model.number="calc.parts" type="number" min="0" step="0.01" placeholder="0.00"
                      class="w-full h-9 px-3 rounded-[12px] text-xs font-bold bg-background border-2 border-border/60 outline-none focus:border-emerald-400/50 transition-all" />
                  </div>
                  <div>
                    <label class="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Travel ($)</label>
                    <input v-model.number="calc.travel" type="number" min="0" step="0.01" placeholder="0.00"
                      class="w-full h-9 px-3 rounded-[12px] text-xs font-bold bg-background border-2 border-border/60 outline-none focus:border-emerald-400/50 transition-all" />
                  </div>
                  <div>
                    <label class="text-[9px] font-black text-muted-foreground uppercase tracking-wider block mb-1">Tax (%)</label>
                    <input v-model.number="calc.taxRate" type="number" min="0" max="100" step="0.1" placeholder="0"
                      class="w-full h-9 px-3 rounded-[12px] text-xs font-bold bg-background border-2 border-border/60 outline-none focus:border-emerald-400/50 transition-all" />
                  </div>
                </div>
                <div class="border-t border-border/60 pt-2 space-y-1">
                  <div class="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>Subtotal</span><span>${{ calcSubtotal.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>Tax ({{ calc.taxRate || 0 }}%)</span><span>${{ calcTax.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between text-sm font-black" style="color: #10b981">
                    <span>Total</span><span>${{ calcTotal.toFixed(2) }}</span>
                  </div>
                </div>
                <button class="w-full h-8 rounded-full text-xs font-black text-white transition-all hover:scale-[1.02] active:scale-95"
                  style="background: linear-gradient(135deg, #10b981, #059669)"
                  @click="applyCalcEstimate">Apply as Estimate</button>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="housecallFormOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #10b981, #059669)" @click="saveHousecall">
              {{ editingHousecall ? 'Save Changes' : 'Schedule' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Vendor Repair Dialog -->
    <Dialog v-model:open="vendorFormOpen">
      <DialogContent class="w-full max-w-[96vw] sm:max-w-lg">
        <div class="flex flex-col gap-5 p-4 sm:p-7">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-[20px] flex items-center justify-center" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
              <Building2 class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-base font-black">{{ editingVendorRepair ? 'Edit Vendor Repair' : 'New Vendor Repair' }}</h2>
              <p class="text-xs text-muted-foreground font-medium">Third-party repair sent out to vendor</p>
            </div>
          </div>

          <!-- Customer + Device -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-2 sm:col-span-2"><label class="m3-label">Customer</label><CustomerSelect v-model="vendorForm.customerId" /></div>
            <div class="space-y-2"><label class="m3-label">Device</label><input v-model="vendorForm.device" placeholder="e.g. iPhone 15 Pro" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Issue</label><input v-model="vendorForm.issue" placeholder="e.g. Cracked screen" class="m3-input" /></div>
          </div>

          <!-- Vendor + Ticket ref -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="m3-label">Vendor / Repair Center</label>
              <input v-model="vendorForm.vendor" placeholder="e.g. iFixit Pro, uBreakiFix" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="m3-label">Associated Ticket #</label>
              <input v-model="vendorForm.ticketRef" placeholder="Optional ticket ID" class="m3-input" />
            </div>
          </div>

          <!-- Tracking + Status -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="m3-label">Tracking Number</label>
              <input v-model="vendorForm.trackingNumber" placeholder="e.g. 1Z999AA1…" class="m3-input" />
            </div>
            <div class="space-y-2">
              <label class="m3-label">Status</label>
              <select v-model="vendorForm.status" class="m3-input">
                <option>Preparing to Ship</option>
                <option>Shipped to Vendor</option>
                <option>In Repair</option>
                <option>Shipped Back</option>
                <option>Received</option>
                <option>Returned to Customer</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2"><label class="m3-label">Date Sent</label><input v-model="vendorForm.sentDate" type="date" class="m3-input" /></div>
            <div class="space-y-2"><label class="m3-label">Est. Return Date</label><input v-model="vendorForm.estReturn" type="date" class="m3-input" /></div>
          </div>

          <!-- Notes -->
          <div class="space-y-2">
            <label class="m3-label">Notes</label>
            <textarea v-model="vendorForm.notes" placeholder="Special instructions, warranty info, etc." rows="3" class="m3-input resize-none" style="height: auto; padding-top: 12px" />
          </div>

          <div class="flex gap-3">
            <button class="flex-1 h-12 rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-95" style="outline: 2px solid hsl(var(--border)); outline-offset: 0" @click="vendorFormOpen = false">Cancel</button>
            <button class="flex-1 h-12 rounded-full font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)" @click="saveVendorRepair">
              {{ editingVendorRepair ? 'Save Changes' : 'Create' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import {
  ClipboardList, TicketCheck, MapPin, Building2, Plus, Search, Smartphone, Inbox,
  Clock, Wrench, CheckCircle, BarChart3, Trash2, Truck, RotateCcw,
  Calendar as CalendarIcon, Package, AlertCircle, Navigation, Calculator
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import type { Ticket } from '~/types'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import NewTicketDialog from '~/components/NewTicketDialog.vue'
import TicketDetailDialog from '~/components/TicketDetailDialog.vue'

definePageMeta({ middleware: ['auth'] })

const appStore = useAppStore()
const { tickets, customers, settings } = storeToRefs(appStore)
const { addNotification } = useNotifications()

// ── Active Tab ────────────────────────────────────────────────────────────────
const activeTab = ref<'tickets' | 'housecalls' | 'thirdparty'>('tickets')

// ── Tab Definitions ───────────────────────────────────────────────────────────
const housecalls = ref<any[]>([])
const vendorRepairs = ref<any[]>([])

const tabs = computed(() => [
  { id: 'tickets',    label: 'Tickets',         icon: TicketCheck, color: '#f59e0b', count: (tickets.value ?? []).filter(t => t.status === 'Open' || t.status === 'In Progress').length },
  { id: 'housecalls', label: 'House Calls',      icon: MapPin,      color: '#10b981', count: housecalls.value.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled').length },
  { id: 'thirdparty', label: 'Vendor Repairs',   icon: Building2,   color: '#8b5cf6', count: vendorRepairs.value.filter(r => r.status !== 'Returned to Customer' && r.status !== 'Cancelled').length },
])

// ────────────────────────────────────────────────────────────────────────────
// TICKETS
// ────────────────────────────────────────────────────────────────────────────
const ticketSearch  = ref('')
const ticketFilter  = ref<string | null>(null)
const newTicketOpen = ref(false)
const selectedTicket = ref<Ticket | null>(null)
const ticketDetailOpen = ref(false)

const statusList = computed(() => {
  const custom = (settings.value?.statuses || 'Open,In Progress,Completed').split(',').map((s: string) => s.trim())
  const ticketStatuses = [...new Set((tickets.value ?? []).map(t => t.status))].filter(Boolean)
  return [...new Set([...custom, ...ticketStatuses])]
})

const filteredTickets = computed(() =>
  (tickets.value ?? []).filter(ticket => {
    const matchesSearch = !ticketSearch.value ||
      ticket.device?.toLowerCase().includes(ticketSearch.value.toLowerCase()) ||
      ticket.issue?.toLowerCase().includes(ticketSearch.value.toLowerCase()) ||
      ticket.id?.toString().includes(ticketSearch.value) ||
      getCustomerName(ticket.customerId).toLowerCase().includes(ticketSearch.value.toLowerCase())
    const matchesStatus = !ticketFilter.value || ticket.status === ticketFilter.value
    return matchesSearch && matchesStatus
  }).sort((a, b) => (b.id || 0) - (a.id || 0))
)

const ticketStats = computed(() => [
  { label: 'Open',        value: (tickets.value ?? []).filter(t => t.status === 'Open').length,        color: '#3b82f6', icon: Inbox },
  { label: 'In Progress', value: (tickets.value ?? []).filter(t => t.status === 'In Progress').length, color: '#f59e0b', icon: Clock },
  { label: 'Completed',   value: (tickets.value ?? []).filter(t => t.status === 'Completed').length,   color: '#10b981', icon: CheckCircle },
  { label: 'Total',       value: (tickets.value ?? []).length,                                         color: '#8b5cf6', icon: BarChart3 },
])

const formatCurrency = (amount: number) => `${settings.value?.currency || '$'}${(amount || 0).toFixed(2)}`
const formatDate = (date?: string) => date ? new Date(date.includes('T') ? date : date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const getCustomerName = (customerId: number) => (customers.value ?? []).find((c: any) => c.id === customerId)?.name || 'Unknown'
const ticketStatusColor = (status: string) => ({ 'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316', 'Completed': '#10b981', 'Delivered': '#64748b' }[status] || '#64748b')
const priorityColor = (p: string) => ({ low: '#64748b', normal: '#3b82f6', high: '#ef4444' }[p] || '#64748b')

const openTicket = (ticket: Ticket) => { selectedTicket.value = { ...ticket }; ticketDetailOpen.value = true }

const handleSaveTicket = () => {
  if (selectedTicket.value) {
    const fresh = tickets.value.find(t => t.id === selectedTicket.value!.id)
    if (fresh) selectedTicket.value = { ...fresh }
  }
}

const handleDeleteTicket = async (ticket: Ticket) => {
  await appStore.deleteTicket(ticket.id)
  ticketDetailOpen.value = false
  selectedTicket.value = null
  addNotification('Ticket Deleted', `Ticket #${ticket.id} deleted`, 'success')
}

const handleCreateTicket = async (ticketData: any) => {
  try {
    let customerId = ticketData.customerId
    if (ticketData.newCustomer?.name) {
      const newCust = await appStore.createCustomer(ticketData.newCustomer)
      customerId = newCust.id
    }
    const ticket = await appStore.createTicket({ ...ticketData, customerId, status: 'Open', price: 0, services: [], parts: [], payments: [], notes: [], timeLog: [] })
    addNotification('Ticket Created', `Ticket #${ticket.id} created successfully`, 'success')
    newTicketOpen.value = false
  } catch (err: any) {
    addNotification('Error', err.message || 'Failed to create ticket', 'error')
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HOUSE CALLS & MAPS AUTOCOMPLETE
// ────────────────────────────────────────────────────────────────────────────

const addressInputRef = ref<HTMLInputElement | null>(null)
const addressSuggestions = ref<any[]>([])
const showSuggestions = ref(false)

// Close suggestions when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (addressInputRef.value && !addressInputRef.value.contains(e.target as Node)) {
      showSuggestions.value = false
    }
  })
})

const selectSuggestion = (pt: any, fromCache = false) => {
  if (!fromCache) housecallForm.value.address = pt.display_name
  showSuggestions.value = false
  
  if (pt.boundingbox) {
     const [lat1, lat2, lon1, lon2] = pt.boundingbox
     mapsUrl.value = `https://www.openstreetmap.org/export/embed.html?bbox=${lon1}%2C${lat1}%2C${lon2}%2C${lat2}&layer=mapnik&marker=${pt.lat}%2C${pt.lon}`
     latLonCache.value[housecallForm.value.address] = { lat: pt.lat, lon: pt.lon, boundingbox: pt.boundingbox }
     try { localStorage.setItem('osm_cache', JSON.stringify(latLonCache.value)) } catch (e) {}
  }
}

const housecallFilter = ref('All')
const housecallFilterOptions = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled']
const housecallFormOpen = ref(false)
const editingHousecall = ref<any>(null)
const housecallForm = ref({ customerId: null as any, address: '', date: '', time: '', issue: '', status: 'Scheduled' })

const countHousecallByStatus = (s: string) => housecalls.value.filter(c => c.status === s).length
const filteredHousecalls = computed(() => housecallFilter.value === 'All' ? housecalls.value : housecalls.value.filter(c => c.status === housecallFilter.value))
const callStatusStyle = (s: string) => ({ 'Scheduled': 'background: #3b82f620; color: #3b82f6', 'In Progress': 'background: #f59e0b20; color: #f59e0b', 'Completed': 'background: #10b98120; color: #10b981', 'Cancelled': 'background: #ef444420; color: #ef4444' }[s] || 'background: hsl(var(--muted)/0.5)')

const openNewHousecall = () => { editingHousecall.value = null; housecallForm.value = { customerId: null, address: '', date: '', time: '', issue: '', status: 'Scheduled' }; housecallFormOpen.value = true }
const viewHousecall = (call: any) => { editingHousecall.value = call; housecallForm.value = { ...call }; housecallFormOpen.value = true }
const saveHousecall = () => {
  const customer = (customers.value ?? []).find((c: any) => c.id === housecallForm.value.customerId)
  const customerName = (customer as any)?.name || 'Unknown Customer'
  if (editingHousecall.value) {
    const idx = housecalls.value.findIndex(c => c.id === editingHousecall.value.id)
    if (idx > -1) housecalls.value[idx] = { ...editingHousecall.value, ...housecallForm.value, customerName }
  } else {
    housecalls.value.unshift({ ...housecallForm.value, id: Date.now(), status: 'Scheduled', customerName })
  }
  housecallFormOpen.value = false; editingHousecall.value = null
}
const advanceHousecallStatus = (call: any) => {
  const idx = housecalls.value.findIndex(c => c.id === call.id)
  if (idx > -1) housecalls.value[idx].status = call.status === 'Scheduled' ? 'In Progress' : 'Completed'
}
const deleteHousecall = (call: any) => { if (confirm(`Delete house call for ${call.customerName}?`)) housecalls.value = housecalls.value.filter(c => c.id !== call.id) }

// ── House Call: Maps + Calculator ────────────────────────────────────────────
const calc = ref({ labor: 0, parts: 0, travel: 0, taxRate: 0 })
const housecallEstimate = ref(0)

const calcSubtotal = computed(() => (calc.value.labor || 0) + (calc.value.parts || 0) + (calc.value.travel || 0))
const calcTax = computed(() => calcSubtotal.value * ((calc.value.taxRate || 0) / 100))
const calcTotal = computed(() => calcSubtotal.value + calcTax.value)

const applyCalcEstimate = () => { housecallEstimate.value = calcTotal.value }

// Reset calculator when dialog opens
watch(housecallFormOpen, (open) => {
  if (open) { 
    calc.value = { labor: 0, parts: 0, travel: 0, taxRate: 0 }; housecallEstimate.value = 0 
    if (!housecallForm.value.address) { mapsUrl.value = ''; addressSuggestions.value = [] }
    else { onAddressInput() }
  }
})

// OSM Autocomplete & Maps embed URL
const mapsUrl = ref('')
let mapsTimer: ReturnType<typeof setTimeout> | null = null

const onAddressInput = () => {
  if (mapsTimer) clearTimeout(mapsTimer)
  mapsTimer = setTimeout(async () => {
    const q = housecallForm.value.address?.trim()
    if (!q || q.length < 4) {
      addressSuggestions.value = []; showSuggestions.value = false; mapsUrl.value = ''; return
    }
    const cached = latLonCache.value[q]
    if (cached && !cached.notfound) {
       selectSuggestion(cached, true); return
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=us,ca`)
      const data = await res.json()
      addressSuggestions.value = data
      showSuggestions.value = data.length > 0
    } catch(e) {}
  }, 600)
}

const openMaps = () => {
  const addr = housecallForm.value.address?.trim()
  if (addr) window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(addr)}`, '_blank')
}

// Map Card Cache & Queue System
const latLonCache = ref<Record<string, any>>({})
onMounted(() => { try { latLonCache.value = JSON.parse(localStorage.getItem('osm_cache') || '{}') } catch(e) { latLonCache.value = {} } })

const osmQueue = ref<string[]>([])
let processingOsm = false
const processOsmQueue = async () => {
  if(processingOsm || osmQueue.value.length === 0) return
  processingOsm = true
  while(osmQueue.value.length > 0) {
    const addr = osmQueue.value.shift()
    if (addr && !latLonCache.value[addr]) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`)
        const data = await res.json()
        latLonCache.value[addr] = (data && data[0]) ? data[0] : { notfound: true }
        localStorage.setItem('osm_cache', JSON.stringify(latLonCache.value))
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1200)) // nominatim rate limit
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

// ────────────────────────────────────────────────────────────────────────────
// VENDOR REPAIRS
// ────────────────────────────────────────────────────────────────────────────
const vendorSearch   = ref('')
const vendorFilter   = ref<string | null>(null)
const vendorFormOpen = ref(false)
const editingVendorRepair = ref<any>(null)

const defaultVendorForm = () => ({
  customerId: null as any,
  device: '', issue: '', vendor: '', ticketRef: '',
  trackingNumber: '', status: 'Preparing to Ship',
  sentDate: '', estReturn: '', notes: ''
})
const vendorForm = ref(defaultVendorForm())

const vendorStatusList = ['Preparing to Ship', 'Shipped to Vendor', 'In Repair', 'Shipped Back', 'Received', 'Returned to Customer', 'Cancelled']

const filteredVendorRepairs = computed(() =>
  vendorRepairs.value.filter(r => {
    const q = vendorSearch.value.toLowerCase()
    const matchSearch = !q || r.vendor?.toLowerCase().includes(q) || r.device?.toLowerCase().includes(q) || r.issue?.toLowerCase().includes(q) || r.trackingNumber?.toLowerCase().includes(q) || r.customerName?.toLowerCase().includes(q)
    const matchStatus = !vendorFilter.value || r.status === vendorFilter.value
    return matchSearch && matchStatus
  }).sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
)

const vendorStats = computed(() => [
  { label: 'Total Sent',      value: vendorRepairs.value.length,                                                      color: '#8b5cf6', icon: Package },
  { label: 'In Transit',      value: vendorRepairs.value.filter(r => r.status === 'Shipped to Vendor' || r.status === 'Shipped Back').length, color: '#3b82f6', icon: Truck },
  { label: 'In Repair',       value: vendorRepairs.value.filter(r => r.status === 'In Repair').length,                color: '#f59e0b', icon: Wrench },
  { label: 'Overdue',         value: vendorRepairs.value.filter(r => isOverdue(r)).length,                            color: '#ef4444', icon: AlertCircle },
])

const vendorStatusColor = (status: string) => ({
  'Preparing to Ship':      '#64748b',
  'Shipped to Vendor':      '#3b82f6',
  'In Repair':              '#f59e0b',
  'Shipped Back':           '#06b6d4',
  'Received':               '#10b981',
  'Returned to Customer':   '#6366f1',
  'Cancelled':              '#ef4444',
}[status] || '#64748b')

const isOverdue = (repair: any) => {
  if (!repair.estReturn || repair.status === 'Returned to Customer' || repair.status === 'Cancelled') return false
  return new Date(repair.estReturn) < new Date()
}

const openNewVendorRepair = () => { editingVendorRepair.value = null; vendorForm.value = defaultVendorForm(); vendorFormOpen.value = true }
const openVendorRepair = (repair: any) => { editingVendorRepair.value = repair; vendorForm.value = { ...repair }; vendorFormOpen.value = true }
const saveVendorRepair = () => {
  const customer = (customers.value ?? []).find((c: any) => c.id === vendorForm.value.customerId)
  const customerName = (customer as any)?.name || 'Unknown Customer'
  if (editingVendorRepair.value) {
    const idx = vendorRepairs.value.findIndex(r => r.id === editingVendorRepair.value.id)
    if (idx > -1) vendorRepairs.value[idx] = { ...editingVendorRepair.value, ...vendorForm.value, customerName }
  } else {
    vendorRepairs.value.unshift({ ...vendorForm.value, id: Date.now(), customerName })
  }
  vendorFormOpen.value = false; editingVendorRepair.value = null
  addNotification('Saved', editingVendorRepair.value ? 'Vendor repair updated' : 'Vendor repair created', 'success')
}
</script>

<style scoped>
.m3-fab {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-fab:hover  { transform: scale(1.05) translateY(-2px); }
.m3-fab:active { transform: scale(0.92); }

.m3-kpi {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.m3-kpi:hover  { transform: scale(1.04) translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
.m3-kpi:active { transform: scale(0.96); }

.m3-card {
  transition: transform 0.4s cubic-bezier(0.34, 1.5, 0.64, 1), box-shadow 0.3s ease;
}
.m3-card:hover  { transform: scale(1.03) translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-card:active { transform: scale(0.96); }

.m3-ticket-card {
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease;
  border-radius: 24px;
  overflow: hidden;
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
}
.m3-ticket-card:hover  { transform: scale(1.01) translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-ticket-card:active { transform: scale(0.98); }

.m3-vendor-card {
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.3s ease;
}
.m3-vendor-card:hover  { transform: scale(1.01) translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.m3-vendor-card:active { transform: scale(0.98); }

.m3-tear-line {
  height: 20px;
  position: relative;
  overflow: visible;
}
.m3-scallop-left,
.m3-scallop-right {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}
.m3-scallop-left  { left: -12px; }
.m3-scallop-right { right: -12px; }

.m3-label { display: block; font-size: 10px; font-weight: 800; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
.m3-input { width: 100%; height: 48px; padding: 0 20px; border-radius: 20px; font-size: 14px; font-weight: 500; background: hsl(var(--muted)/0.5); border: 2px solid hsl(var(--border)/0.7); color: hsl(var(--foreground)); outline: none; transition: all 0.2s ease; }
.m3-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px #8b5cf618; }
</style>
