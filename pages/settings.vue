<template>
  <!-- macOS Sequoia System Settings layout -->
  <div class="sequoia-root">

    <!-- ══ Sidebar ═══════════════════════════════════════════════════ -->
    <aside class="sequoia-sidebar">

      <!-- User identity card -->
      <div class="sidebar-identity">
        <div class="identity-avatar">{{ userInitials }}</div>
        <div class="identity-info">
          <p class="identity-name">{{ form.businessName || 'NovaOps' }}</p>
          <p class="identity-sub">{{ userEmail }}</p>
        </div>
      </div>

      <!-- Nav groups -->
      <nav class="sidebar-nav">
        <div v-for="group in sidebarGroups" :key="group.label" class="nav-group">
          <p class="nav-group-label">{{ group.label }}</p>
          <button
            v-for="item in group.items"
            :key="item.id"
            class="nav-item"
            :class="{ 'nav-item-active': activeSection === item.id }"
            @click="activeSection = item.id"
          >
            <div class="nav-item-icon" :style="`background: linear-gradient(135deg, ${item.color}, ${item.colorDark})`">
              <component :is="item.icon" class="nav-item-svg" />
            </div>
            <span class="nav-item-label">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-item-badge" :style="`background: ${item.badgeColor}20; color: ${item.badgeColor}`">{{ item.badge }}</span>
          </button>
        </div>
      </nav>

      <!-- Sign out -->
      <button class="sidebar-signout" @click="handleSignOut">
        <LogOut class="w-3.5 h-3.5" />
        Sign Out
      </button>
    </aside>

    <!-- ══ Content Pane ═══════════════════════════════════════════════ -->
    <div class="sequoia-content">

      <!-- ── BUSINESS ───────────────────────────────────────────────── -->
      <section v-show="activeSection === 'business'" class="pane">
        <div class="pane-header">
          <div class="pane-icon" style="background: linear-gradient(135deg,#5b5ef4,#8b5cf6)"><Building class="pane-icon-svg" /></div>
          <div>
            <h2 class="pane-title">Business</h2>
            <p class="pane-sub">Your shop's public profile and preferences</p>
          </div>
        </div>

        <div class="settings-block">
          <div class="field-group">
            <div class="field-row">
              <div class="field">
                <label class="field-label">Business Name</label>
                <input v-model="form.businessName" placeholder="Mobicare Device Recovery" class="field-input" />
              </div>
              <div class="field">
                <label class="field-label">Phone</label>
                <input v-model="form.phone" placeholder="(618) 555-0100" class="field-input" />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Email</label>
              <input v-model="form.email" type="email" placeholder="contact@yourshop.com" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Address</label>
              <textarea v-model="form.address" rows="2" placeholder="123 Main St, Fairfield, IL 62837" class="field-input resize-none" />
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label">Currency Symbol</label>
                <input v-model="form.currency" placeholder="$" class="field-input" />
              </div>
              <div class="field">
                <label class="field-label">Tax Rate (%)</label>
                <input v-model.number="form.taxRate" type="number" step="0.01" placeholder="0.00" class="field-input" />
              </div>
            </div>
          </div>
        </div>

        <div class="settings-block">
          <div class="block-title">Ticket Workflow</div>
          <div class="field">
            <label class="field-label">Ticket Statuses</label>
            <input v-model="form.statuses" placeholder="Open, In Progress, Waiting for Parts, Completed" class="field-input" />
            <p class="field-hint">Separate each status with a comma</p>
          </div>
          <div class="field" style="margin-top:12px">
            <label class="field-label">Screen Lock PIN</label>
            <input v-model="form.pin" type="password" maxlength="4" placeholder="4-digit PIN" class="field-input font-mono tracking-widest" style="max-width:160px" />
            <p class="field-hint">Locks after 3 minutes of inactivity</p>
          </div>
        </div>

        <div class="pane-footer">
          <button class="btn-primary" :disabled="saving" @click="saveSettings">
            <div v-if="saving" class="btn-spinner" />
            <Save v-else class="w-4 h-4" />
            {{ saving ? 'Saving…' : 'Save Business Settings' }}
          </button>
          <Transition name="save-msg">
            <div v-if="saveMsg" class="save-feedback" :class="saveMsg.ok ? 'feedback-ok' : 'feedback-err'">
              <CheckCircle v-if="saveMsg.ok" class="w-4 h-4" />
              <AlertCircle v-else class="w-4 h-4" />
              {{ saveMsg.text }}
            </div>
          </Transition>
        </div>
      </section>

      <!-- ── SERVICES ───────────────────────────────────────────────── -->
      <section v-show="activeSection === 'services'" class="pane">
        <div class="pane-header">
          <div class="pane-icon" style="background: linear-gradient(135deg,#10b981,#059669)"><Wrench class="pane-icon-svg" /></div>
          <div class="flex-1">
            <h2 class="pane-title">Services</h2>
            <p class="pane-sub">Repair services and pricing catalog</p>
          </div>
          <button class="btn-tonal" style="color:#10b981;background:rgba(16,185,129,0.1)" @click="showServiceForm = !showServiceForm">
            <Plus class="w-4 h-4" /> Add Service
          </button>
        </div>

        <Transition name="slide-down">
          <div v-if="showServiceForm" class="settings-block">
            <div class="block-title">{{ editingServiceId ? 'Edit Service' : 'New Service' }}</div>
            <div class="field-row">
              <div class="field">
                <label class="field-label">Name</label>
                <input v-model="serviceForm.name" placeholder="Screen Replacement" class="field-input" />
              </div>
              <div class="field">
                <label class="field-label">Category</label>
                <input v-model="serviceForm.category" placeholder="Repairs" class="field-input" />
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label">Price</label>
                <input v-model.number="serviceForm.price" type="number" step="0.01" placeholder="0.00" class="field-input" />
              </div>
              <div class="field">
                <label class="field-label">Est. Minutes</label>
                <input v-model.number="serviceForm.estimated_minutes" type="number" placeholder="30" class="field-input" />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Description</label>
              <input v-model="serviceForm.description" placeholder="Brief description" class="field-input" />
            </div>
            <div style="display:flex;gap:8px;margin-top:4px">
              <button class="btn-primary btn-sm" :disabled="!serviceForm.name || savingService" @click="handleSaveService" style="background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 4px 12px rgba(16,185,129,0.3)">
                <div v-if="savingService" class="btn-spinner" /><Save v-else class="w-3.5 h-3.5" />
                {{ editingServiceId ? 'Update' : 'Add' }}
              </button>
              <button class="btn-ghost btn-sm" @click="cancelServiceEdit">Cancel</button>
            </div>
          </div>
        </Transition>

        <div class="settings-block">
          <div v-if="svcList.length === 0 && !showServiceForm" class="empty-state">
            <Wrench class="w-6 h-6 opacity-30" />
            <p>No services yet. Add your first service above.</p>
          </div>
          <div v-else class="list-rows">
            <div v-for="svc in svcList" :key="svc.id" class="list-row">
              <div class="list-row-icon" style="background:rgba(16,185,129,0.12)"><Wrench class="w-4 h-4" style="color:#10b981" /></div>
              <div class="list-row-info">
                <p class="list-row-title">{{ svc.name }}</p>
                <p class="list-row-sub">{{ svc.category || 'Services' }}<span v-if="svc.estimated_minutes"> · {{ svc.estimated_minutes }} min</span></p>
              </div>
              <span class="list-row-value" style="color:#10b981">{{ form.currency }}{{ Number(svc.price||0).toFixed(2) }}</span>
              <div class="list-row-actions">
                <button class="icon-btn-sm" @click="editService(svc)"><Pencil class="w-3.5 h-3.5" /></button>
                <button class="icon-btn-sm icon-btn-danger" @click="handleDeleteService(svc.id)"><Trash2 class="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── EXPENSES ───────────────────────────────────────────────── -->
      <section v-show="activeSection === 'expenses'" class="pane">
        <div class="pane-header">
          <div class="pane-icon" style="background: linear-gradient(135deg,#ef4444,#dc2626)"><DollarSign class="pane-icon-svg" /></div>
          <div class="flex-1">
            <h2 class="pane-title">Expenses</h2>
            <p class="pane-sub">Business overhead and recurring costs</p>
          </div>
          <button class="btn-tonal" style="color:#ef4444;background:rgba(239,68,68,0.1)" @click="showExpenseForm = !showExpenseForm">
            <Plus class="w-4 h-4" /> Add Expense
          </button>
        </div>

        <Transition name="slide-down">
          <div v-if="showExpenseForm" class="settings-block">
            <div class="block-title">New Expense</div>
            <div class="field-row">
              <div class="field"><label class="field-label">Description</label><input v-model="expenseForm.description" placeholder="Rent, Insurance…" class="field-input" /></div>
              <div class="field"><label class="field-label">Amount</label><input v-model.number="expenseForm.amount" type="number" step="0.01" placeholder="0.00" class="field-input" /></div>
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label">Category</label>
                <select v-model="expenseForm.category" class="field-input field-select">
                  <option>Overhead</option><option>Utilities</option><option>Software</option><option>Labor</option><option>Other</option>
                </select>
              </div>
              <div class="field"><label class="field-label">Date</label><input v-model="expenseForm.date" type="date" class="field-input" /></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px">
              <button class="btn-primary btn-sm" :disabled="!expenseForm.description || !expenseForm.amount || savingExpense" @click="handleAddExpense" style="background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 4px 12px rgba(239,68,68,0.25)">
                <div v-if="savingExpense" class="btn-spinner" /><Save v-else class="w-3.5 h-3.5" />Add
              </button>
              <button class="btn-ghost btn-sm" @click="showExpenseForm = false; resetExpenseForm()">Cancel</button>
            </div>
          </div>
        </Transition>

        <div class="settings-block">
          <div v-if="expensesList.length === 0 && !showExpenseForm" class="empty-state">
            <DollarSign class="w-6 h-6 opacity-30" /><p>No expenses logged yet.</p>
          </div>
          <div v-else class="list-rows">
            <div v-for="exp in expensesList" :key="exp.id" class="list-row">
              <div class="list-row-icon" style="background:rgba(239,68,68,0.1)"><DollarSign class="w-4 h-4" style="color:#ef4444" /></div>
              <div class="list-row-info">
                <p class="list-row-title">{{ exp.description }}</p>
                <p class="list-row-sub">{{ exp.category }}<span v-if="exp.date"> · {{ exp.date }}</span></p>
              </div>
              <span class="list-row-value" style="color:#ef4444">{{ form.currency }}{{ Number(exp.amount||0).toFixed(2) }}</span>
              <button class="icon-btn-sm icon-btn-danger" @click="handleDeleteExpense(exp.id)"><Trash2 class="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── NOTIFICATIONS ──────────────────────────────────────────── -->
      <section v-show="activeSection === 'notifications'" class="pane">
        <div class="pane-header">
          <div class="pane-icon" style="background: linear-gradient(135deg,#f59e0b,#d97706)"><Bell class="pane-icon-svg" /></div>
          <div>
            <h2 class="pane-title">Notifications</h2>
            <p class="pane-sub">Choose what alerts you receive</p>
          </div>
        </div>

        <div class="settings-block">
          <div class="toggle-rows">
            <div v-for="(n, key) in notificationSettings" :key="key" class="toggle-row">
              <div class="toggle-row-icon" :style="`background:${n.color}18`"><component :is="n.icon" class="w-4 h-4" :style="`color:${n.color}`" /></div>
              <div class="toggle-row-info">
                <p class="toggle-row-title">{{ n.label }}</p>
                <p class="toggle-row-sub">{{ n.desc }}</p>
              </div>
              <button class="sequoia-toggle" :class="{ active: n.enabled }" @click="toggleNotif(key)" :style="n.enabled ? `background:${n.color}` : ''">
                <span class="toggle-knob" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── DATABASE ───────────────────────────────────────────────── -->
      <section v-show="activeSection === 'database'" class="pane">
        <div class="pane-header">
          <div class="pane-icon" style="background: linear-gradient(135deg,#3ecf8e,#1a9e6a)"><Database class="pane-icon-svg" /></div>
          <div>
            <h2 class="pane-title">Database</h2>
            <p class="pane-sub">Supabase backend connection</p>
          </div>
        </div>

        <!-- Status card -->
        <div class="settings-block">
          <div class="status-card" :class="sbConn.status.connected ? 'status-ok' : sbConn.hasCredentials.value ? 'status-warn' : 'status-err'">
            <div class="status-card-dot" />
            <div class="status-card-info">
              <p class="status-card-title">{{ sbConn.status.connected ? 'Connected to Supabase' : sbConn.hasCredentials.value ? 'Credentials saved — not verified' : 'Not connected' }}</p>
              <p v-if="sbConn.status.connected" class="status-card-sub font-mono text-xs">{{ sbUrl }}</p>
            </div>
            <button v-if="sbConn.status.connected" class="btn-tonal btn-sm" style="color:#1a9e6a;background:rgba(62,207,142,0.12)" @click="showSbModal = true">Change</button>
            <button v-else class="btn-primary btn-sm" style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a);box-shadow:0 4px 12px rgba(62,207,142,0.3)" @click="showSbModal = true">
              <Link class="w-3.5 h-3.5" /> Connect
            </button>
          </div>

          <div v-if="!sbConn.status.connected" class="setup-steps">
            <p class="block-title" style="margin-bottom:10px">How to connect</p>
            <div v-for="(step, i) in supabaseSteps" :key="i" class="setup-step">
              <span class="step-num">{{ i + 1 }}</span>
              <span v-html="step" />
            </div>
            <a href="https://supabase.com/dashboard" target="_blank" class="step-link">
              <ExternalLink class="w-3.5 h-3.5" /> Open Supabase Dashboard
            </a>
          </div>

          <button v-if="sbConn.hasCredentials.value" class="disconnect-link" @click="confirmSbDisconnect = true">
            <X class="w-3 h-3" /> Disconnect Supabase
          </button>
        </div>
      </section>

      <!-- ── PAYMENTS ───────────────────────────────────────────────── -->
      <section v-show="activeSection === 'payments'" class="pane">
        <div class="pane-header">
          <div class="pane-icon" style="background: linear-gradient(135deg,#10b981,#059669)"><CreditCard class="pane-icon-svg" /></div>
          <div class="flex-1">
            <h2 class="pane-title">Payments</h2>
            <p class="pane-sub">Square Terminal integration</p>
          </div>
          <div class="status-pill" :class="squareStatus === 'connected' ? 'pill-ok' : squareStatus === 'checking' ? 'pill-warn' : 'pill-err'">
            <span class="pill-dot" />
            {{ squareStatus === 'connected' ? 'Connected' : squareStatus === 'checking' ? 'Checking…' : 'Disconnected' }}
          </div>
        </div>

        <div class="settings-block">
          <div class="field">
            <label class="field-label">Square Access Token</label>
            <input v-model="form.squareAccessToken" type="password" placeholder="EAAAl…" class="field-input font-mono text-xs" autocomplete="off" @blur="debouncedSquareCheck" />
            <p class="field-hint">Stored securely — never sent to the browser after save</p>
          </div>
          <div class="field" style="margin-top:12px">
            <label class="field-label">Location ID</label>
            <input v-model="form.squareLocationId" placeholder="L1234…" class="field-input font-mono text-xs" @blur="debouncedSquareCheck" />
          </div>
          <div class="toggle-row" style="margin-top:12px;padding:12px 14px;border-radius:12px;background:hsl(var(--muted)/0.4)">
            <div class="toggle-row-info">
              <p class="toggle-row-title">Use Square Sandbox</p>
              <p class="toggle-row-sub">Test mode — use sandbox credentials</p>
            </div>
            <button class="sequoia-toggle" :class="{ active: form.squareSandbox }" @click="form.squareSandbox = !form.squareSandbox; debouncedSquareCheck()" />
          </div>
          <div v-if="squareTestMsg" class="feedback-banner" :class="squareStatus === 'connected' ? 'feedback-banner-ok' : 'feedback-banner-err'" style="margin-top:12px">
            <CheckCircle v-if="squareStatus === 'connected'" class="w-4 h-4 flex-shrink-0" />
            <AlertCircle v-else class="w-4 h-4 flex-shrink-0" />
            {{ squareTestMsg }}
          </div>
        </div>

        <div class="pane-footer">
          <button class="btn-primary" :disabled="savingSquare" @click="saveSquareSettings">
            <div v-if="savingSquare" class="btn-spinner" /><Save v-else class="w-4 h-4" />
            {{ savingSquare ? 'Saving…' : 'Save Credentials' }}
          </button>
          <button class="btn-tonal" :disabled="squareStatus === 'checking'" @click="testSquareConnection" style="color:#10b981;background:rgba(16,185,129,0.1)">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': squareStatus === 'checking' }" />
            Test Connection
          </button>
        </div>
      </section>

      <!-- ── PRINTING ───────────────────────────────────────────────── -->
      <section v-show="activeSection === 'printing'" class="pane">
        <div class="pane-header">
          <div class="pane-icon" style="background: linear-gradient(135deg,#06b6d4,#0891b2)"><Printer class="pane-icon-svg" /></div>
          <div>
            <h2 class="pane-title">Printing</h2>
            <p class="pane-sub">Receipts and barcode label settings</p>
          </div>
        </div>

        <!-- Thermal Printer -->
        <div class="settings-block">
          <div class="block-title">Thermal Receipt Printer</div>
          <div class="printer-card">
            <div class="printer-card-icon"><Receipt class="w-5 h-5" style="color:#06b6d4" /></div>
            <div class="printer-card-info">
              <p class="printer-card-name">{{ pairedThermalPrinter?.productName || 'No printer paired' }}</p>
              <p class="printer-card-sub">{{ pairedThermalPrinter ? `VID: ${pairedThermalPrinter.vendorId?.toString(16).toUpperCase()} · PID: ${pairedThermalPrinter.productId?.toString(16).toUpperCase()}` : 'Connect via USB · WebUSB API' }}</p>
            </div>
            <div style="display:flex;gap:6px">
              <button v-if="pairedThermalPrinter" class="btn-ghost btn-sm" style="color:#ef4444" @click="removeUSBPrinter('thermal')"><X class="w-3.5 h-3.5" />Remove</button>
              <button class="btn-tonal btn-sm" style="color:#06b6d4;background:rgba(6,182,212,0.1)" @click="pairUSBPrinter('thermal')">
                <MonitorSmartphone class="w-3.5 h-3.5" />{{ pairedThermalPrinter ? 'Re-pair' : 'Pair Printer' }}
              </button>
            </div>
          </div>
          <div class="toggle-row" style="margin-top:8px">
            <div class="toggle-row-info"><p class="toggle-row-title">Auto-print receipt after sale</p></div>
            <button class="sequoia-toggle" :class="{ active: printerSettings.autoPrintReceipt }" @click="printerSettings.autoPrintReceipt = !printerSettings.autoPrintReceipt; savePrinterSettings()" />
          </div>
          <button class="btn-ghost btn-sm" style="margin-top:8px" @click="testReceiptPrint"><ScanLine class="w-3.5 h-3.5" />Print Test Receipt</button>
        </div>

        <!-- Label Printer -->
        <div class="settings-block">
          <div class="block-title">Label Printer</div>
          <div class="printer-card">
            <div class="printer-card-icon"><Tablet class="w-5 h-5" style="color:#8b5cf6" /></div>
            <div class="printer-card-info">
              <p class="printer-card-name">{{ pairedLabelPrinter?.productName || 'No printer paired' }}</p>
              <p class="printer-card-sub">{{ pairedLabelPrinter ? `VID: ${pairedLabelPrinter.vendorId?.toString(16).toUpperCase()} · PID: ${pairedLabelPrinter.productId?.toString(16).toUpperCase()}` : 'Intermec, Zebra, Dymo supported' }}</p>
            </div>
            <div style="display:flex;gap:6px">
              <button v-if="pairedLabelPrinter" class="btn-ghost btn-sm" style="color:#ef4444" @click="removeUSBPrinter('label')"><X class="w-3.5 h-3.5" />Remove</button>
              <button class="btn-tonal btn-sm" style="color:#8b5cf6;background:rgba(139,92,246,0.1)" @click="pairUSBPrinter('label')">
                <MonitorSmartphone class="w-3.5 h-3.5" />{{ pairedLabelPrinter ? 'Re-pair' : 'Pair Printer' }}
              </button>
            </div>
          </div>
          <div class="toggle-row" style="margin-top:8px">
            <div class="toggle-row-info"><p class="toggle-row-title">Auto-print label on new ticket</p></div>
            <button class="sequoia-toggle" :class="{ active: printerSettings.autoPrintBarcode }" @click="printerSettings.autoPrintBarcode = !printerSettings.autoPrintBarcode; savePrinterSettings()" />
          </div>
          <button class="btn-ghost btn-sm" style="margin-top:8px" @click="testBarcodePrint"><ScanLine class="w-3.5 h-3.5" />Print Test Label</button>
        </div>

        <div v-if="printerMsg" class="feedback-banner" :class="printerMsg.type === 'success' ? 'feedback-banner-ok' : 'feedback-banner-err'">
          <CheckCircle v-if="printerMsg.type === 'success'" class="w-4 h-4 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 flex-shrink-0" />
          {{ printerMsg.text }}
        </div>
      </section>

      <!-- ── DATA & PRIVACY ─────────────────────────────────────────── -->
      <section v-show="activeSection === 'data'" class="pane">
        <div class="pane-header">
          <div class="pane-icon" style="background: linear-gradient(135deg,#8b5cf6,#7c3aed)"><Download class="pane-icon-svg" /></div>
          <div>
            <h2 class="pane-title">Data & Privacy</h2>
            <p class="pane-sub">Export, backup, and reset your data</p>
          </div>
        </div>

        <div class="settings-block">
          <div class="block-title">Backup & Export</div>
          <div class="action-row" @click="handleExport">
            <div class="action-row-icon" style="background:rgba(139,92,246,0.12)"><Download class="w-4 h-4" style="color:#8b5cf6" /></div>
            <div class="action-row-info">
              <p class="action-row-title">Export All Data</p>
              <p class="action-row-sub">Download a full JSON backup of tickets, customers, inventory, and settings</p>
            </div>
            <ChevronRight class="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        </div>

        <div class="settings-block">
          <div class="block-title">Diagnostics</div>
          <div class="diag-section">
            <button class="btn-tonal" @click="runDiagnostics" :disabled="isRunningDiag">
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isRunningDiag }" />
              {{ isRunningDiag ? 'Running…' : 'Run System Diagnostics' }}
            </button>
            <div v-if="diagResults.length > 0" class="diag-log">
              <div v-for="(r, i) in diagResults" :key="i" class="diag-row" :class="`diag-${r.status}`">
                <span class="diag-dot" />
                <div>
                  <p class="diag-step">{{ r.step }}</p>
                  <p v-if="r.message" class="diag-msg">{{ r.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-block danger-zone">
          <div class="block-title" style="color:#ef4444">Danger Zone</div>
          <div class="action-row danger-row" @click="confirmReset">
            <div class="action-row-icon" style="background:rgba(239,68,68,0.1)"><Trash2 class="w-4 h-4" style="color:#ef4444" /></div>
            <div class="action-row-info">
              <p class="action-row-title" style="color:#ef4444">Reset All Data</p>
              <p class="action-row-sub">Permanently delete all tickets, customers, and settings. Cannot be undone.</p>
            </div>
            <ChevronRight class="w-4 h-4 flex-shrink-0" style="color:#ef4444" />
          </div>
        </div>
      </section>

    </div><!-- /content -->

    <!-- ══ Modals (Teleport) ══════════════════════════════════════════ -->
    <Teleport to="body">
      <!-- Supabase connect modal -->
      <Transition name="overlay">
        <div v-if="showSbModal" class="modal-backdrop" @click.self="showSbModal = false">
          <div class="modal-window">
            <div class="modal-header">
              <div class="modal-header-icon" style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a)"><Database class="w-5 h-5 text-white" /></div>
              <div>
                <h3 class="modal-title">Connect to Supabase</h3>
                <p class="modal-sub">Paste credentials from your project's API settings</p>
              </div>
              <button class="modal-close" @click="showSbModal = false"><X class="w-4 h-4" /></button>
            </div>
            <div class="modal-body">
              <div class="field"><label class="field-label">Project URL</label><input v-model="sbForm.url" type="url" placeholder="https://xxxx.supabase.co" class="field-input font-mono text-xs" /></div>
              <div class="field" style="margin-top:12px"><label class="field-label">Anon / Public Key</label><input v-model="sbForm.key" type="password" placeholder="eyJhbGci…" class="field-input font-mono text-xs" /></div>
              <div v-if="sbConn.status.error" class="feedback-banner feedback-banner-err" style="margin-top:12px"><AlertCircle class="w-4 h-4 flex-shrink-0" />{{ sbConn.status.error }}</div>
              <div style="display:flex;gap:10px;margin-top:16px">
                <button class="btn-primary" :disabled="sbConn.status.checking || !sbForm.url || !sbForm.key" @click="handleSbConnect" style="flex:1">
                  <div v-if="sbConn.status.checking" class="btn-spinner" /><Database v-else class="w-4 h-4" />
                  {{ sbConn.status.checking ? 'Testing…' : 'Connect & Save' }}
                </button>
                <button class="btn-ghost" @click="showSbModal = false">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Supabase disconnect confirm -->
      <Transition name="overlay">
        <div v-if="confirmSbDisconnect" class="modal-backdrop">
          <div class="modal-window" style="max-width:400px">
            <div class="modal-body" style="padding-top:24px">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                <div style="width:40px;height:40px;border-radius:12px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <AlertCircle class="w-5 h-5" style="color:#ef4444" />
                </div>
                <div>
                  <p style="font-size:14px;font-weight:800">Disconnect Supabase?</p>
                  <p style="font-size:12px;color:var(--muted-foreground);margin-top:2px">Your data stays safe. You'll need to reconnect to access it.</p>
                </div>
              </div>
              <div style="display:flex;gap:10px">
                <button class="btn-ghost" style="flex:1" @click="confirmSbDisconnect = false">Cancel</button>
                <button class="btn-primary" style="flex:1;background:#ef4444;box-shadow:0 4px 12px rgba(239,68,68,0.25)" @click="sbConn.disconnect(); confirmSbDisconnect = false">Disconnect</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Generic confirm dialog -->
      <Transition name="overlay">
        <div v-if="confirmDialog.open" class="modal-backdrop">
          <div class="modal-window" style="max-width:400px">
            <div class="modal-body" style="padding-top:24px">
              <p style="font-size:15px;font-weight:800;margin-bottom:6px">{{ confirmDialog.title }}</p>
              <p style="font-size:13px;color:var(--muted-foreground);margin-bottom:20px;line-height:1.5">{{ confirmDialog.message }}</p>
              <div style="display:flex;gap:10px">
                <button class="btn-ghost" style="flex:1" @click="confirmDialog.open = false">Cancel</button>
                <button class="btn-primary" style="flex:1;background:#ef4444;box-shadow:0 4px 12px rgba(239,68,68,0.25)" @click="confirmDialog.onConfirm(); confirmDialog.open = false">{{ confirmDialog.confirmLabel }}</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import {
  Settings as SettingsIcon, Building, CreditCard, Bell, Database,
  AlertTriangle, Trash2, Save, Download, Upload, LogOut, Check, X,
  TicketCheck, ShoppingCart, UserPlus, Calendar, Link, ExternalLink,
  Printer, XCircle, RefreshCw, ScanLine, Receipt, CheckCircle, AlertCircle,
  MonitorSmartphone, Tablet, MessageCircle, ChevronRight,
  Plus, Pencil, Wrench, DollarSign,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

definePageMeta({ middleware: ['auth'] })

// ── Supabase Connect ──────────────────────────────────────────────────
const sbConn = useSupabaseConnect()
const showSbModal = ref(false)
const confirmSbDisconnect = ref(false)
const sbForm = ref({ url: '', key: '' })
const sbUrl = computed(() => sbConn.url.value)
const supabaseSteps = [
  'Go to <strong>supabase.com/dashboard</strong> → your project',
  'Click <strong>Project Settings → API</strong>',
  'Copy <strong>Project URL</strong> and <strong>anon / public</strong> key',
]

watch(showSbModal, (open) => {
  if (open) { sbForm.value = { url: sbConn.url.value, key: '' }; sbConn.status.error = null }
})
const handleSbConnect = async () => { await sbConn.saveAndConnect(sbForm.value.url, sbForm.value.key) }

const appStore = useAppStore()
const router = useRouter()
const { $supabase } = useNuxtApp()
const { settings, notificationPrefs, services: svcList, expenses: expensesList } = storeToRefs(appStore)

// ── User info ─────────────────────────────────────────────────────────
const userEmail = computed(() => settings.value?.email || 'user@novaops.com')
const userInitials = computed(() => {
  const e = userEmail.value
  const p = e.split('@')[0].split('.')
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : e.substring(0, 2).toUpperCase()
})

// ── Form ──────────────────────────────────────────────────────────────
const form = ref({
  businessName: '', phone: '', email: '', address: '',
  currency: '$', taxRate: 0,
  statuses: 'Open, In Progress, Waiting for Parts, Completed, Delivered',
  pin: '', squareAccessToken: '', squareLocationId: '', squareSandbox: false,
})
watch(settings, (s) => { if (s) form.value = { ...form.value, ...s } }, { immediate: true, deep: true })

// ── Active section ────────────────────────────────────────────────────
const activeSection = ref('business')

// ── Sidebar nav ───────────────────────────────────────────────────────
const sidebarGroups = [
  {
    label: 'Shop',
    items: [
      { id: 'business',      label: 'Business',      icon: Building,     color: '#5b5ef4', colorDark: '#8b5cf6' },
      { id: 'services',      label: 'Services',       icon: Wrench,       color: '#10b981', colorDark: '#059669', badge: computed(() => svcList.value?.length || 0), badgeColor: '#10b981' },
      { id: 'expenses',      label: 'Expenses',       icon: DollarSign,   color: '#ef4444', colorDark: '#dc2626', badge: computed(() => expensesList.value?.length || 0), badgeColor: '#ef4444' },
      { id: 'notifications', label: 'Notifications',  icon: Bell,         color: '#f59e0b', colorDark: '#d97706' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { id: 'database', label: 'Database',  icon: Database,    color: '#3ecf8e', colorDark: '#1a9e6a', badge: computed(() => sbConn.status.connected ? '●' : null), badgeColor: '#3ecf8e' },
      { id: 'payments', label: 'Payments',  icon: CreditCard,  color: '#10b981', colorDark: '#059669', badge: computed(() => squareStatus.value === 'connected' ? '●' : null), badgeColor: '#10b981' },
      { id: 'printing', label: 'Printing',  icon: Printer,     color: '#06b6d4', colorDark: '#0891b2' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'data', label: 'Data & Privacy', icon: Download, color: '#8b5cf6', colorDark: '#7c3aed' },
    ],
  },
]

// ── Business save ─────────────────────────────────────────────────────
const saveMsg = ref<{ ok: boolean; text: string } | null>(null)
const saving = ref(false)
let saveMsgTimer: ReturnType<typeof setTimeout> | null = null
const saveSettings = async () => {
  if (saving.value) return
  saving.value = true
  try {
    await appStore.saveSettings({ ...form.value })
    saveMsg.value = { ok: true, text: 'Saved!' }
  } catch (err: any) {
    saveMsg.value = { ok: false, text: err?.message || 'Save failed' }
  } finally { saving.value = false }
  if (saveMsgTimer) clearTimeout(saveMsgTimer)
  saveMsgTimer = setTimeout(() => { saveMsg.value = null }, 3000)
}

// ── Services ──────────────────────────────────────────────────────────
const showServiceForm = ref(false)
const savingService = ref(false)
const editingServiceId = ref<number | null>(null)
const serviceMsg = ref<{ ok: boolean; text: string } | null>(null)
const serviceForm = ref({ name: '', category: 'Services', description: '', price: 0, estimated_minutes: 0 })

function resetServiceForm() { serviceForm.value = { name: '', category: 'Services', description: '', price: 0, estimated_minutes: 0 }; editingServiceId.value = null }
function editService(svc: any) { editingServiceId.value = svc.id; serviceForm.value = { name: svc.name||'', category: svc.category||'Services', description: svc.description||'', price: svc.price||0, estimated_minutes: svc.estimated_minutes||0 }; showServiceForm.value = true }
function cancelServiceEdit() { showServiceForm.value = false; resetServiceForm() }
function showServiceMsg(ok: boolean, text: string) { serviceMsg.value = { ok, text }; setTimeout(() => { serviceMsg.value = null }, 3000) }

async function handleSaveService() {
  savingService.value = true
  try {
    if (editingServiceId.value) { await appStore.updateService(editingServiceId.value, { ...serviceForm.value, duration: serviceForm.value.estimated_minutes }); showServiceMsg(true, 'Service updated') }
    else { await appStore.createService({ ...serviceForm.value }); showServiceMsg(true, 'Service added') }
    cancelServiceEdit()
  } catch (e: any) { showServiceMsg(false, e.message || 'Failed to save') }
  savingService.value = false
}
async function handleDeleteService(id: number) { try { await appStore.deleteService(id); showServiceMsg(true, 'Deleted') } catch (e: any) { showServiceMsg(false, e.message) } }

// ── Expenses ──────────────────────────────────────────────────────────
const showExpenseForm = ref(false)
const savingExpense = ref(false)
const expenseMsg = ref<{ ok: boolean; text: string } | null>(null)
const expenseForm = ref({ description: '', amount: 0, category: 'Overhead', date: new Date().toISOString().split('T')[0] })
function resetExpenseForm() { expenseForm.value = { description: '', amount: 0, category: 'Overhead', date: new Date().toISOString().split('T')[0] } }
function showExpenseMsg(ok: boolean, text: string) { expenseMsg.value = { ok, text }; setTimeout(() => { expenseMsg.value = null }, 3000) }
async function handleAddExpense() {
  savingExpense.value = true
  try { await appStore.createExpense({ ...expenseForm.value }); showExpenseMsg(true, 'Expense added'); resetExpenseForm(); showExpenseForm.value = false }
  catch (e: any) { showExpenseMsg(false, e.message) }
  savingExpense.value = false
}
async function handleDeleteExpense(id: number) { try { await appStore.deleteExpense(id); showExpenseMsg(true, 'Deleted') } catch (e: any) { showExpenseMsg(false, e.message) } }

// ── Notifications ─────────────────────────────────────────────────────
const notificationSettings = computed(() => ({
  newTicket:   { label: 'New Ticket',    desc: 'Alert when a ticket is created',      color: '#f59e0b', icon: TicketCheck,   enabled: notificationPrefs.value.newTicket },
  newSale:     { label: 'New Sale',      desc: 'Alert when POS sale completes',       color: '#10b981', icon: ShoppingCart,  enabled: notificationPrefs.value.newSale },
  newCustomer: { label: 'New Customer',  desc: 'Alert when a customer is added',      color: '#3b82f6', icon: UserPlus,      enabled: notificationPrefs.value.newCustomer },
  appointment: { label: 'Appointments', desc: 'Alert for upcoming appointments',     color: '#8b5cf6', icon: Calendar,      enabled: notificationPrefs.value.appointment },
  newMessage:  { label: 'New Message',   desc: 'Alert when a customer emails you',   color: '#ec4899', icon: MessageCircle, enabled: notificationPrefs.value.newMessage },
}))
function toggleNotif(key: string) {
  const k = key as keyof typeof notificationPrefs.value
  notificationPrefs.value[k] = !notificationPrefs.value[k]
  if (typeof localStorage !== 'undefined') localStorage.setItem('novaops_notif_prefs', JSON.stringify(notificationPrefs.value))
}

// ── Square ────────────────────────────────────────────────────────────
type SquareStatus = 'idle' | 'checking' | 'connected' | 'disconnected'
const squareStatus = ref<SquareStatus>('idle')
const squareTestMsg = ref('')
const savingSquare = ref(false)
const testSquareConnection = async () => {
  if (!form.value.squareAccessToken || !form.value.squareLocationId) { squareStatus.value = 'disconnected'; squareTestMsg.value = 'Enter credentials first.'; return }
  squareStatus.value = 'checking'; squareTestMsg.value = ''
  try {
    const res: any = await $fetch('/api/square/connection-test', { headers: { 'x-square-access-token': form.value.squareAccessToken, 'x-square-location-id': form.value.squareLocationId } })
    squareStatus.value = 'connected'; squareTestMsg.value = `Connected to location: ${res.locationName}`
  } catch (err: any) { squareStatus.value = 'disconnected'; squareTestMsg.value = err.data?.statusMessage || err.message || 'Connection failed' }
}
const saveSquareSettings = async () => { savingSquare.value = true; try { await appStore.saveSquareConfig(); await testSquareConnection() } catch {} finally { savingSquare.value = false } }
let squareCheckTimer: ReturnType<typeof setTimeout> | null = null
const debouncedSquareCheck = () => { if (squareCheckTimer) clearTimeout(squareCheckTimer); squareCheckTimer = setTimeout(testSquareConnection, 800) }

// ── Printing ──────────────────────────────────────────────────────────
import { printReceipt, printBarcodeLabel } from '~/utils/print'
const printerMsg = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const PRINTER_KEY = 'novaops_printer_settings'
const printerSettings = ref({ autoPrintReceipt: true, autoPrintBarcode: true })
const pairedThermalPrinter = ref<any>(null)
const pairedLabelPrinter = ref<any>(null)
onMounted(() => {
  try {
    const saved = localStorage.getItem(PRINTER_KEY); if (saved) printerSettings.value = { ...printerSettings.value, ...JSON.parse(saved) }
    const t = localStorage.getItem('novaops_thermal_printer'); if (t) pairedThermalPrinter.value = JSON.parse(t)
    const l = localStorage.getItem('novaops_label_printer'); if (l) pairedLabelPrinter.value = JSON.parse(l)
  } catch {}
  if (form.value.squareAccessToken && form.value.squareLocationId) testSquareConnection()
  if (sbConn.hasCredentials.value) sbConn.testConnection()
})
function savePrinterSettings() { localStorage.setItem(PRINTER_KEY, JSON.stringify(printerSettings.value)); showPrinterMsg('success', 'Saved') }
function showPrinterMsg(type: 'success' | 'error', text: string) { printerMsg.value = { type, text }; setTimeout(() => { printerMsg.value = null }, 3500) }
async function pairUSBPrinter(type: 'thermal' | 'label') {
  if (!(navigator as any).usb) { showPrinterMsg('error', 'WebUSB not supported'); return }
  try {
    const device = await (navigator as any).usb.requestDevice({ filters: [] })
    if (device) {
      const d = { productName: device.productName || 'USB Printer', serialNumber: device.serialNumber || 'Unknown', vendorId: device.vendorId, productId: device.productId }
      if (type === 'thermal') { pairedThermalPrinter.value = d; localStorage.setItem('novaops_thermal_printer', JSON.stringify(d)) }
      else { pairedLabelPrinter.value = d; localStorage.setItem('novaops_label_printer', JSON.stringify(d)) }
      showPrinterMsg('success', `${type === 'thermal' ? 'Thermal' : 'Label'} printer linked!`)
    }
  } catch (e: any) { if (e.name !== 'NotFoundError' && !e.message?.includes('No device')) showPrinterMsg('error', e.message) }
}
function removeUSBPrinter(type: 'thermal' | 'label') {
  if (type === 'thermal') { pairedThermalPrinter.value = null; localStorage.removeItem('novaops_thermal_printer') }
  else { pairedLabelPrinter.value = null; localStorage.removeItem('novaops_label_printer') }
}
function testReceiptPrint() { printReceipt({ businessName: form.value.businessName||'NovaOps', businessAddress: form.value.address||'', businessPhone: form.value.phone||'', date: new Date().toLocaleString(), items: [{ name: 'Screen Replacement', qty: 1, price: 120 }], subtotal: 120, tax: 12, total: 132, currency: form.value.currency||'$' }) }
function testBarcodePrint() { printBarcodeLabel({ sku: 'TKT-99999', name: 'TEST LABEL', customerName: 'John Doe', price: 0, currency: form.value.currency||'$' }) }

// ── Actions ───────────────────────────────────────────────────────────
const confirmDialog = ref({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => {} })
function showConfirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) { confirmDialog.value = { open: true, title, message, confirmLabel, onConfirm } }
const handleSignOut = () => showConfirm('Sign Out', 'Are you sure you want to sign out?', 'Sign Out', async () => { try { await ($supabase as any).auth.signOut() } catch {}; router.push('/login') })
const handleExport = () => {
  const data = { settings: appStore.settings, tickets: appStore.tickets, customers: appStore.customers, inventory: appStore.inventory }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `novaops-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url)
}
const confirmReset = () => showConfirm('Reset All Data', 'This will permanently delete all tickets, customers, and settings. Cannot be undone.', 'Delete Everything', () => { localStorage.clear(); window.location.reload() })

// ── Diagnostics ───────────────────────────────────────────────────────
const diagResults = ref<any[]>([])
const isRunningDiag = ref(false)
const logDiag = (step: string, status: string, message?: string) => diagResults.value.push({ step, status, message })
const updateDiagLog = (step: string, status: string, message: string) => { const item = diagResults.value.find(r => r.step === step && r.status === 'pending'); if (item) { item.status = status; item.message = message } else logDiag(step, status, message) }
const runDiagnostics = async () => {
  diagResults.value = []; isRunningDiag.value = true
  logDiag('Supabase Client', 'pending')
  if (!$supabase) { updateDiagLog('Supabase Client', 'error', 'Client is null'); isRunningDiag.value = false; return }
  updateDiagLog('Supabase Client', 'success', 'Client initialized')
  logDiag('Auth Session', 'pending')
  try { const { data: { session }, error } = await ($supabase as any).auth.getSession(); if (error) throw error; updateDiagLog('Auth Session', session ? 'success' : 'error', session ? `Logged in: ${session.user.email}` : 'No active session') } catch (e: any) { updateDiagLog('Auth Session', 'error', e.message) }
  logDiag('Database Access', 'pending')
  try { const { data, error } = await ($supabase as any).from('tickets').select('id').limit(1); if (error) throw error; updateDiagLog('Database Access', 'success', `Tickets table OK (${data.length} rows)`) } catch (e: any) { updateDiagLog('Database Access', 'error', e.message) }
  logDiag('Square API', 'pending')
  try { const res = await $fetch('/api/square/connection-test', { headers: { 'x-square-access-token': form.value.squareAccessToken, 'x-square-location-id': form.value.squareLocationId } }); updateDiagLog('Square API', 'success', `OK: ${JSON.stringify(res)}`) } catch (e: any) { updateDiagLog('Square API', 'error', e.message) }
  isRunningDiag.value = false
}
</script>

<style scoped>
/* ══ Sequoia System Settings Layout ══════════════════════════════════ */
.sequoia-root {
  display: flex;
  height: calc(100dvh - 96px - 40px);  /* full height minus dock + top padding */
  min-height: 540px;
  gap: 0;
  border-radius: 18px;
  overflow: hidden;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.7);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 12px 40px rgba(0,0,0,0.06);
}

/* ── Sidebar ─────────────────────────────────────────────────────── */
.sequoia-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: hsl(var(--muted) / 0.45);
  border-right: 1px solid hsl(var(--border) / 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Identity */
.sidebar-identity {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  flex-shrink: 0;
}
.identity-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b5ef4, #8b5cf6);
  box-shadow: 0 3px 10px rgba(91,94,244,0.3);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.identity-name { font-size: 13px; font-weight: 700; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.identity-sub  { font-size: 11px; color: hsl(var(--muted-foreground)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Nav */
.sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 10px 8px; }
.nav-group { margin-bottom: 18px; }
.nav-group-label {
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.12em; color: hsl(var(--muted-foreground));
  padding: 0 8px; margin-bottom: 4px;
}
.nav-item {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 7px 10px; border-radius: 10px;
  font-size: 13px; font-weight: 600; color: hsl(var(--foreground));
  transition: background 0.12s, transform 0.15s; text-align: left;
  margin-bottom: 2px;
}
.nav-item:hover { background: hsl(var(--muted) / 0.7); }
.nav-item-active {
  background: hsl(var(--card));
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06);
  color: hsl(var(--foreground));
}
.nav-item-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.nav-item-svg { width: 14px; height: 14px; color: white; }
.nav-item-label { flex: 1; }
.nav-item-badge {
  font-size: 10px; font-weight: 700;
  padding: 1px 7px; border-radius: 999px;
  flex-shrink: 0;
}

.sidebar-signout {
  display: flex; align-items: center; gap: 7px;
  margin: 10px; padding: 8px 12px; border-radius: 9px;
  font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground));
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
}
.sidebar-signout:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

/* ── Content Pane ─────────────────────────────────────────────────── */
.sequoia-content {
  flex: 1; overflow-y: auto; min-width: 0;
  scrollbar-width: thin;
}

.pane {
  padding: 28px 32px;
  display: flex; flex-direction: column; gap: 16px;
  min-height: 100%;
}

/* Pane header */
.pane-header {
  display: flex; align-items: center; gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  flex-shrink: 0;
}
.pane-icon {
  width: 44px; height: 44px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
}
.pane-icon-svg { width: 20px; height: 20px; color: white; }
.pane-title { font-size: 20px; font-weight: 800; letter-spacing: -0.4px; line-height: 1; }
.pane-sub   { font-size: 12px; color: hsl(var(--muted-foreground)); font-weight: 500; margin-top: 3px; }

/* Settings block */
.settings-block {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.6);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.block-title {
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.1em; color: hsl(var(--muted-foreground));
  margin-bottom: 14px;
}

/* Fields */
.field { display: flex; flex-direction: column; gap: 5px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.field-group { display: flex; flex-direction: column; gap: 12px; }
.field-label {
  font-size: 11px; font-weight: 700; color: hsl(var(--muted-foreground));
  text-transform: uppercase; letter-spacing: 0.09em;
}
.field-input {
  width: 100%; height: 40px; padding: 0 13px;
  border-radius: 10px; font-size: 13px; font-weight: 500;
  font-family: 'Outfit', sans-serif;
  background: hsl(var(--muted) / 0.45);
  border: 1px solid hsl(var(--border) / 0.8);
  color: hsl(var(--foreground)); outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.field-input:focus {
  border-color: #5b5ef4;
  background: hsl(var(--card));
  box-shadow: 0 0 0 3px rgba(91,94,244,0.1);
}
textarea.field-input { height: auto; padding-top: 10px; padding-bottom: 10px; }
select.field-input { cursor: pointer; appearance: none; }
.field-hint { font-size: 11px; color: hsl(var(--muted-foreground)); font-weight: 500; }
.field-select { cursor: pointer; }

/* Footer */
.pane-footer {
  display: flex; align-items: center; gap: 14px;
  padding-top: 4px;
}

/* Buttons */
.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  height: 40px; padding: 0 18px; border-radius: 999px;
  background: linear-gradient(135deg, #5b5ef4, #8b5cf6);
  color: white; font-size: 13px; font-weight: 700;
  font-family: 'Outfit', sans-serif; border: none; cursor: pointer;
  box-shadow: 0 4px 14px rgba(91,94,244,0.28);
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
}
.btn-primary:hover { transform: scale(1.04) translateY(-1px); box-shadow: 0 7px 20px rgba(91,94,244,0.38); }
.btn-primary:active { transform: scale(0.95); }
.btn-primary:disabled { opacity: 0.5; transform: none; }

.btn-sm { height: 34px; padding: 0 14px; font-size: 12px; }

.btn-tonal {
  display: inline-flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 14px; border-radius: 999px;
  font-size: 12px; font-weight: 700; font-family: 'Outfit', sans-serif;
  border: 1px solid currentColor; border-opacity: 0.2; cursor: pointer;
  transition: transform 0.2s, opacity 0.15s;
}
.btn-tonal:hover { opacity: 0.85; transform: scale(1.03); }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 7px;
  height: 34px; padding: 0 14px; border-radius: 999px;
  background: hsl(var(--muted) / 0.6);
  color: hsl(var(--foreground)); font-size: 12px; font-weight: 600;
  font-family: 'Outfit', sans-serif; border: 1px solid hsl(var(--border));
  cursor: pointer; transition: background 0.15s;
}
.btn-ghost:hover { background: hsl(var(--muted)); }

.btn-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid currentColor; border-top-color: transparent;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Save feedback */
.save-feedback {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 700;
}
.feedback-ok  { color: #10b981; }
.feedback-err { color: #ef4444; }

/* Toggle rows */
.toggle-rows { display: flex; flex-direction: column; }
.toggle-row {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid hsl(var(--border) / 0.4);
}
.toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
.toggle-row:first-child { padding-top: 0; }
.toggle-row-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.toggle-row-info { flex: 1; min-width: 0; }
.toggle-row-title { font-size: 13px; font-weight: 600; }
.toggle-row-sub { font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 1px; }

/* macOS-style toggle */
.sequoia-toggle {
  position: relative; width: 44px; height: 26px; border-radius: 999px;
  background: hsl(var(--muted));
  border: 1.5px solid hsl(var(--border));
  transition: background 0.25s cubic-bezier(0.34,1.2,0.64,1), border-color 0.2s;
  flex-shrink: 0; cursor: pointer;
}
.sequoia-toggle.active { background: #5b5ef4; border-color: #5b5ef4; box-shadow: 0 2px 8px rgba(91,94,244,0.3); }
.toggle-knob {
  position: absolute; top: 2px; left: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.25s cubic-bezier(0.34,1.4,0.64,1);
  display: block;
}
.sequoia-toggle.active .toggle-knob { transform: translateX(18px); }

/* Status card */
.status-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
  margin-bottom: 14px; border: 1px solid transparent;
}
.status-ok  { background: rgba(62,207,142,0.08);  border-color: rgba(62,207,142,0.2); }
.status-warn{ background: rgba(245,158,11,0.08);  border-color: rgba(245,158,11,0.2); }
.status-err { background: rgba(239,68,68,0.06);   border-color: rgba(239,68,68,0.15); }
.status-card-dot {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
}
.status-ok  .status-card-dot { background: #3ecf8e; box-shadow: 0 0 6px rgba(62,207,142,0.5); }
.status-warn .status-card-dot { background: #f59e0b; }
.status-err .status-card-dot { background: #ef4444; }
.status-card-info { flex: 1; min-width: 0; }
.status-card-title { font-size: 13px; font-weight: 700; }
.status-card-sub { font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Status pill (small, in header) */
.status-pill { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; flex-shrink: 0; }
.pill-ok   { background: rgba(16,185,129,0.12); color: #10b981; }
.pill-warn { background: rgba(245,158,11,0.12); color: #f59e0b; }
.pill-err  { background: rgba(239,68,68,0.12);  color: #ef4444; }
.pill-dot  { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* Setup steps */
.setup-steps { margin-top: 4px; }
.setup-step { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; font-size: 12px; font-weight: 500; color: hsl(var(--muted-foreground)); border-bottom: 1px solid hsl(var(--border) / 0.4); }
.setup-step:last-of-type { border-bottom: none; }
.step-num { width: 20px; height: 20px; border-radius: 50%; background: rgba(62,207,142,0.15); color: #1a9e6a; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.step-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #3ecf8e; margin-top: 10px; transition: opacity 0.15s; }
.step-link:hover { opacity: 0.8; }
.disconnect-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: hsl(var(--muted-foreground)); margin-top: 12px; transition: color 0.15s; }
.disconnect-link:hover { color: #ef4444; }

/* Feedback banner */
.feedback-banner { display: flex; align-items: center; gap: 9px; padding: 12px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; }
.feedback-banner-ok  { background: rgba(16,185,129,0.08); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
.feedback-banner-err { background: rgba(239,68,68,0.08);  color: #ef4444; border: 1px solid rgba(239,68,68,0.15); }

/* List rows */
.list-rows { display: flex; flex-direction: column; gap: 2px; }
.list-row { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 11px; transition: background 0.12s; }
.list-row:hover { background: hsl(var(--muted) / 0.4); }
.list-row-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.list-row-info { flex: 1; min-width: 0; }
.list-row-title { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.list-row-sub { font-size: 11px; color: hsl(var(--muted-foreground)); }
.list-row-value { font-size: 13px; font-weight: 800; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; }
.list-row-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.icon-btn-sm { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.12s, transform 0.15s; color: hsl(var(--muted-foreground)); }
.icon-btn-sm:hover { background: hsl(var(--muted) / 0.7); transform: scale(1.1); }
.icon-btn-danger:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: hsl(var(--muted-foreground)); font-size: 13px; font-weight: 500; text-align: center; }

/* Printer card */
.printer-card { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 12px; background: hsl(var(--muted)/0.4); border: 1px solid hsl(var(--border)/0.5); margin-bottom: 8px; }
.printer-card-icon { width: 40px; height: 40px; border-radius: 11px; background: rgba(6,182,212,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.printer-card-info { flex: 1; min-width: 0; }
.printer-card-name { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.printer-card-sub { font-size: 11px; color: hsl(var(--muted-foreground)); font-family: 'JetBrains Mono', monospace; }

/* Action rows (Data section) */
.action-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 11px; cursor: pointer; transition: background 0.12s; }
.action-row:hover { background: hsl(var(--muted)/0.5); }
.action-row-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.action-row-info { flex: 1; min-width: 0; }
.action-row-title { font-size: 13px; font-weight: 700; }
.action-row-sub { font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px; line-height: 1.4; }
.danger-zone { border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.03); }
.danger-row:hover { background: rgba(239,68,68,0.06); }

/* Diagnostics */
.diag-section { display: flex; flex-direction: column; gap: 12px; }
.diag-log { border-radius: 11px; overflow: hidden; border: 1px solid hsl(var(--border)/0.5); background: hsl(var(--muted)/0.3); }
.diag-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-bottom: 1px solid hsl(var(--border)/0.4); }
.diag-row:last-child { border-bottom: none; }
.diag-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.diag-pending .diag-dot { background: #f59e0b; animation: pulse 1.5s ease-in-out infinite; }
.diag-success .diag-dot { background: #10b981; }
.diag-error   .diag-dot { background: #ef4444; }
.diag-step { font-size: 12px; font-weight: 700; }
.diag-msg  { font-size: 11px; color: hsl(var(--muted-foreground)); font-family: 'JetBrains Mono', monospace; margin-top: 2px; word-break: break-all; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.45); backdrop-filter: blur(12px); }
.modal-window { width: 100%; max-width: 480px; background: hsl(var(--card)); border-radius: 18px; box-shadow: 0 24px 60px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.1); overflow: hidden; animation: modalIn 0.28s cubic-bezier(0.34,1.3,0.64,1) both; }
@keyframes modalIn { from { opacity:0; transform: scale(0.92) translateY(12px); } to { opacity:1; transform: none; } }
.modal-header { display: flex; align-items: center; gap: 12px; padding: 20px 22px 18px; border-bottom: 1px solid hsl(var(--border)/0.5); }
.modal-header-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal-title { font-size: 15px; font-weight: 800; letter-spacing: -0.3px; }
.modal-sub { font-size: 12px; color: hsl(var(--muted-foreground)); margin-top: 2px; }
.modal-close { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: hsl(var(--muted-foreground)); transition: background 0.12s; margin-left: auto; flex-shrink: 0; }
.modal-close:hover { background: hsl(var(--muted)); }
.modal-body { padding: 20px 22px 22px; }

/* Animations */
.slide-down-enter-active { transition: all 0.25s cubic-bezier(0.34,1.4,0.64,1); }
.slide-down-leave-active { transition: all 0.15s ease-in; }
.slide-down-enter-from  { opacity: 0; transform: translateY(-8px); }
.slide-down-leave-to    { opacity: 0; transform: translateY(-4px); }
.save-msg-enter-active { transition: all 0.2s ease; }
.save-msg-leave-active { transition: all 0.18s ease; }
.save-msg-enter-from, .save-msg-leave-to { opacity: 0; transform: translateY(4px); }
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.18s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 768px) {
  .sequoia-root { flex-direction: column; height: auto; border-radius: 14px; }
  .sequoia-sidebar { width: 100%; border-right: none; border-bottom: 1px solid hsl(var(--border)/0.5); }
  .sidebar-nav { max-height: 220px; }
  .pane { padding: 20px 18px; }
  .field-row { grid-template-columns: 1fr; }
}
</style>
