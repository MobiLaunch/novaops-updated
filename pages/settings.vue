<template>
  <div>

    <!-- ── Page Header ── -->
    <div class="d-flex align-center gap-4 mb-6">
      <v-avatar size="48" rounded="xl" style="background:linear-gradient(135deg,#64748b,#475569)">
        <v-icon icon="mdi-cog-outline" size="22" color="white" />
      </v-avatar>
      <div>
        <h1 class="text-h5 font-weight-black">Settings</h1>
        <p class="text-body-2 text-medium-emphasis">Configure your business, integrations, and account</p>
      </div>
    </div>

    <v-row>

      <!-- ── LEFT: Business + Integrations ── -->
      <v-col cols="12" lg="8">

        <!-- Business Info -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#6366f108">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
                <v-icon icon="mdi-office-building-outline" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Business Information</v-card-title>
            <v-card-subtitle>Your shop's public details and preferences</v-card-subtitle>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.businessName" label="Business Name" placeholder="Your Repair Shop" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.phone" label="Phone" placeholder="(555) 123-4567" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.email" label="Email" type="email" placeholder="contact@yourshop.com" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="form.address" label="Address" :rows="2" placeholder="123 Main St, City, State ZIP" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.currency" label="Currency Symbol" placeholder="$" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="form.taxRate" type="number" step="0.01" label="Tax Rate (%)" placeholder="0.00" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.statuses" label="Ticket Statuses" placeholder="Open, In Progress, Waiting for Parts, Completed, Delivered" variant="outlined" density="comfortable" hint="Separate each status with a comma" persistent-hint />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.pin" type="password" maxlength="4" label="Screen Lock PIN" placeholder="4-digit PIN" variant="outlined" density="comfortable" hint="Screen locks after 3 minutes of inactivity" persistent-hint style="font-family:monospace;letter-spacing:.25em" />
              </v-col>
            </v-row>
            <div class="d-flex align-center gap-3 flex-wrap mt-4 pt-4 border-t">
              <v-btn color="primary" :loading="saving" prepend-icon="mdi-content-save" @click="saveSettings">
                Save Business Settings
              </v-btn>
              <v-alert v-if="saveMsg" :type="saveMsg.ok ? 'success' : 'error'" :title="saveMsg.ok ? 'Settings saved' : 'Save failed'" :text="saveMsg.ok ? undefined : saveMsg.text" density="compact" closable class="mt-2 w-100" @click:close="saveMsg = null" />
            </div>
          </v-card-text>
        </v-card>

        <!-- Services Management -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#10b98108">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#10b981,#059669)">
                <v-icon icon="mdi-wrench-outline" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Services</v-card-title>
            <v-card-subtitle>Manage your repair services and pricing</v-card-subtitle>
            <template #append>
              <v-btn size="small" color="success" variant="tonal" prepend-icon="mdi-plus" @click="showServiceForm = !showServiceForm">Add Service</v-btn>
            </template>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-expand-transition>
              <v-card v-if="showServiceForm" variant="tonal" color="surface-variant" rounded="lg" class="pa-4 mb-4">
                <div class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3" style="letter-spacing:.1em">{{ editingServiceId ? 'Edit Service' : 'New Service' }}</div>
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="serviceForm.name" label="Name" placeholder="Screen Replacement" variant="outlined" density="compact" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="serviceForm.category" label="Category" placeholder="Repairs" variant="outlined" density="compact" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model.number="serviceForm.price" type="number" step="0.01" label="Price" placeholder="0.00" variant="outlined" density="compact" prefix="$" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model.number="serviceForm.estimated_minutes" type="number" label="Est. Minutes" placeholder="30" variant="outlined" density="compact" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="serviceForm.description" label="Description" placeholder="Brief description" variant="outlined" density="compact" />
                  </v-col>
                </v-row>
                <div class="d-flex gap-2 mt-2">
                  <v-btn color="success" size="small" :loading="savingService" :disabled="!serviceForm.name" prepend-icon="mdi-content-save" @click="handleSaveService">
                    {{ editingServiceId ? 'Update' : 'Add' }}
                  </v-btn>
                  <v-btn variant="text" size="small" @click="cancelServiceEdit">Cancel</v-btn>
                </div>
              </v-card>
            </v-expand-transition>

            <div v-if="svcList.length === 0 && !showServiceForm" class="d-flex flex-column align-center gap-2 py-6 text-medium-emphasis">
              <v-icon icon="mdi-wrench-outline" size="24" style="opacity:.4" />
              <div class="text-body-2 font-weight-bold">No services yet</div>
              <div class="text-caption">Add your first service above</div>
            </div>
            <v-list v-else density="compact" class="pa-0" style="max-height:320px;overflow-y:auto">
              <v-list-item v-for="svc in svcList" :key="svc.id" rounded="xl" class="mb-1" style="background:rgba(0,0,0,0.03)">
                <template #prepend>
                  <v-avatar size="36" rounded="lg" style="background:#10b98114">
                    <v-icon icon="mdi-wrench-outline" size="16" color="#10b981" />
                  </v-avatar>
                </template>
                <template #title><span class="text-body-2 font-weight-bold">{{ svc.name }}</span></template>
                <template #subtitle>
                  <span class="text-caption">{{ svc.category || 'Services' }}{{ svc.estimated_minutes ? ` · ${svc.estimated_minutes} min` : '' }}</span>
                </template>
                <template #append>
                  <span class="text-body-2 font-weight-black mr-3" style="color:#10b981">{{ form.currency }}{{ Number(svc.price || 0).toFixed(2) }}</span>
                  <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click="editService(svc)" />
                  <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="handleDeleteService(svc.id)" />
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-if="serviceMsg" :type="serviceMsg.ok ? 'success' : 'error'" :title="serviceMsg.text" closable density="compact" class="mt-3" @click:close="serviceMsg = null" />
          </v-card-text>
        </v-card>

        <!-- Expenses Management -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#ef444408">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#ef4444,#dc2626)">
                <v-icon icon="mdi-currency-usd" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Expenses</v-card-title>
            <v-card-subtitle>Track business overhead and recurring costs</v-card-subtitle>
            <template #append>
              <v-btn size="small" color="error" variant="tonal" prepend-icon="mdi-plus" @click="showExpenseForm = !showExpenseForm">Add Expense</v-btn>
            </template>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-expand-transition>
              <v-card v-if="showExpenseForm" variant="tonal" color="surface-variant" rounded="lg" class="pa-4 mb-4">
                <div class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-3" style="letter-spacing:.1em">New Expense</div>
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="expenseForm.description" label="Description" placeholder="Rent, Insurance, etc." variant="outlined" density="compact" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model.number="expenseForm.amount" type="number" step="0.01" label="Amount" placeholder="0.00" variant="outlined" density="compact" prefix="$" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select v-model="expenseForm.category" :items="['Overhead','Utilities','Software','Labor','Other']" label="Category" variant="outlined" density="compact" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="expenseForm.date" type="date" label="Date" variant="outlined" density="compact" />
                  </v-col>
                </v-row>
                <div class="d-flex gap-2 mt-2">
                  <v-btn color="error" size="small" :loading="savingExpense" :disabled="!expenseForm.description || !expenseForm.amount" prepend-icon="mdi-content-save" @click="handleAddExpense">Add Expense</v-btn>
                  <v-btn variant="text" size="small" @click="showExpenseForm = false; resetExpenseForm()">Cancel</v-btn>
                </div>
              </v-card>
            </v-expand-transition>

            <div v-if="expensesList.length === 0 && !showExpenseForm" class="d-flex flex-column align-center gap-2 py-6 text-medium-emphasis">
              <v-icon icon="mdi-currency-usd" size="24" style="opacity:.4" />
              <div class="text-body-2 font-weight-bold">No expenses logged</div>
              <div class="text-caption">Track your business costs here</div>
            </div>
            <v-list v-else density="compact" class="pa-0" style="max-height:280px;overflow-y:auto">
              <v-list-item v-for="exp in expensesList" :key="exp.id" rounded="xl" class="mb-1" style="background:rgba(0,0,0,0.03)">
                <template #prepend>
                  <v-avatar size="36" rounded="lg" style="background:#ef444414">
                    <v-icon icon="mdi-currency-usd" size="16" color="#ef4444" />
                  </v-avatar>
                </template>
                <template #title><span class="text-body-2 font-weight-bold">{{ exp.description }}</span></template>
                <template #subtitle><span class="text-caption">{{ exp.category }}{{ exp.date ? ` · ${exp.date}` : '' }}</span></template>
                <template #append>
                  <span class="text-body-2 font-weight-black mr-2" style="color:#ef4444">{{ form.currency }}{{ Number(exp.amount || 0).toFixed(2) }}</span>
                  <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="handleDeleteExpense(exp.id)" />
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-if="expenseMsg" :type="expenseMsg.ok ? 'success' : 'error'" :title="expenseMsg.text" closable density="compact" class="mt-3" @click:close="expenseMsg = null" />
          </v-card-text>
        </v-card>

        <!-- Supabase Connection -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#3ecf8e08">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a)">
                <v-icon icon="mdi-database-outline" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Supabase Database</v-card-title>
            <v-card-subtitle>Your live data backend — tickets, customers, inventory</v-card-subtitle>
            <template #append>
              <v-chip
                size="small"
                :color="sbConn.status.connected ? 'success' : sbConn.hasCredentials.value ? 'warning' : 'error'"
                variant="tonal"
              >
                <v-icon start size="10">mdi-circle</v-icon>
                {{ sbConn.status.connected ? `Connected · ${sbConn.projectRef.value}` : sbConn.hasCredentials.value ? 'Credentials saved' : 'Not connected' }}
              </v-chip>
            </template>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-alert v-if="sbConn.status.connected" type="success" variant="tonal" density="compact" rounded="lg" class="mb-4">
              <div class="d-flex align-center justify-space-between">
                <span class="text-caption font-weight-bold">Connected to Supabase — <code class="text-caption">{{ sbUrl }}</code></span>
                <v-btn size="x-small" variant="text" color="success" @click="showSbModal = true">Change</v-btn>
              </div>
            </v-alert>
            <div v-else>
              <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-4">
                <div class="text-caption font-weight-medium">
                  NovaOps stores all your repair shop data in your own private Supabase database.
                  Create a free project at <strong>supabase.com</strong> then paste your credentials here.
                </div>
              </v-alert>
              <div class="d-flex gap-3 flex-wrap">
                <v-btn color="success" :href="'https://supabase.com/dashboard'" target="_blank" prepend-icon="mdi-open-in-new">Open Supabase</v-btn>
                <v-btn color="success" variant="tonal" prepend-icon="mdi-link" @click="showSbModal = true">Enter Credentials</v-btn>
              </div>
            </div>
            <div v-if="sbConn.hasCredentials.value" class="mt-3">
              <v-btn size="small" variant="text" color="error" prepend-icon="mdi-link-off" @click="confirmSbDisconnect = true">Disconnect Supabase</v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Square Integration -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#10b98108">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#10b981,#059669)">
                <v-icon icon="mdi-credit-card-outline" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Square Terminal Integration</v-card-title>
            <v-card-subtitle>Connect your Square account and pair a physical terminal</v-card-subtitle>
            <template #append>
              <v-chip
                size="small"
                :color="squareStatus === 'connected' ? 'success' : squareStatus === 'checking' ? 'warning' : 'error'"
                variant="tonal"
              >
                <v-icon start size="10">mdi-circle</v-icon>
                {{ squareStatus === 'connected' ? 'Connected' : squareStatus === 'checking' ? 'Checking…' : 'Disconnected' }}
              </v-chip>
            </template>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-row dense class="mb-3">
              <v-col cols="12">
                <v-text-field
                  v-model="form.squareAccessToken"
                  type="password"
                  label="Square Access Token"
                  placeholder="EAAAl…"
                  variant="outlined"
                  density="comfortable"
                  hint="Stored securely — never sent to the browser after save"
                  persistent-hint
                  style="font-family:monospace"
                  autocomplete="off"
                  @blur="debouncedSquareCheck"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.squareLocationId"
                  label="Location ID"
                  placeholder="L1234…"
                  variant="outlined"
                  density="comfortable"
                  style="font-family:monospace"
                  @blur="debouncedSquareCheck"
                />
              </v-col>
            </v-row>
            <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-4 mb-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-body-2 font-weight-bold">Use Square Sandbox</div>
                  <div class="text-caption text-medium-emphasis">Test mode — use sandbox credentials</div>
                </div>
                <v-switch v-model="form.squareSandbox" hide-details density="compact" color="success" @update:model-value="debouncedSquareCheck" />
              </div>
            </v-card>
            <v-alert
              v-if="squareTestMsg"
              :type="squareStatus === 'connected' ? 'success' : 'error'"
              :text="squareTestMsg"
              density="compact"
              rounded="lg"
              class="mb-4"
            />
            <div class="d-flex gap-3 flex-wrap">
              <v-btn variant="tonal" :loading="savingSquare" prepend-icon="mdi-content-save" @click="saveSquareSettings">Save Credentials</v-btn>
              <v-btn color="success" variant="tonal" :loading="squareStatus === 'checking'" prepend-icon="mdi-refresh" @click="testSquareConnection">Test Connection</v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Printing & Barcodes -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#06b6d408">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">
                <v-icon icon="mdi-printer" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Printing &amp; Barcodes</v-card-title>
            <v-card-subtitle>Receipt and barcode label settings</v-card-subtitle>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-5">
              <div class="text-caption font-weight-bold mb-1">Windows USB Setup (Zadig)</div>
              <div class="text-caption">Windows blocks direct USB printer access. Download <a href="https://zadig.akeo.ie" target="_blank" class="font-weight-bold">zadig.akeo.ie</a>, select your printer, and install the <strong>WinUSB</strong> driver once to enable WebUSB printing.</div>
            </v-alert>

            <!-- Thermal Printer -->
            <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-4 mb-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center gap-3">
                  <v-avatar size="32" rounded="lg" style="background:#10b98118"><v-icon icon="mdi-receipt-text-outline" size="16" color="#10b981" /></v-avatar>
                  <div>
                    <div class="text-body-2 font-weight-bold">Default Thermal Printer</div>
                    <div v-if="!pairedThermalPrinter" class="text-caption text-medium-emphasis">No device linked</div>
                  </div>
                </div>
                <v-btn v-if="!pairedThermalPrinter" size="small" color="info" variant="tonal" @click="pairUSBPrinter('thermal')">Pair a Device</v-btn>
              </div>
              <div v-if="pairedThermalPrinter" class="d-flex align-center justify-space-between pa-3 rounded-lg" style="background:rgba(0,0,0,0.05)">
                <div>
                  <div class="text-body-2 font-weight-bold">{{ pairedThermalPrinter.productName || 'USB Printer' }}</div>
                  <div class="text-caption font-mono text-medium-emphasis">S/N: {{ pairedThermalPrinter.serialNumber || 'Unknown' }}</div>
                </div>
                <div class="d-flex gap-2">
                  <v-btn size="x-small" variant="tonal" @click="pairUSBPrinter('thermal')">Relink</v-btn>
                  <v-btn size="x-small" variant="text" color="error" @click="removeUSBPrinter('thermal')">Remove</v-btn>
                </div>
              </div>
            </v-card>

            <!-- Label Printer -->
            <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-4 mb-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center gap-3">
                  <v-avatar size="32" rounded="lg" style="background:#06b6d418"><v-icon icon="mdi-barcode-scan" size="16" color="#06b6d4" /></v-avatar>
                  <div>
                    <div class="text-body-2 font-weight-bold">Default Label Printer</div>
                    <div v-if="!pairedLabelPrinter" class="text-caption text-medium-emphasis">No device linked</div>
                  </div>
                </div>
                <v-btn v-if="!pairedLabelPrinter" size="small" color="info" variant="tonal" @click="pairUSBPrinter('label')">Pair a Device</v-btn>
              </div>
              <div v-if="pairedLabelPrinter" class="d-flex align-center justify-space-between pa-3 rounded-lg" style="background:rgba(0,0,0,0.05)">
                <div>
                  <div class="text-body-2 font-weight-bold">{{ pairedLabelPrinter.productName || 'USB Printer' }}</div>
                  <div class="text-caption font-mono text-medium-emphasis">S/N: {{ pairedLabelPrinter.serialNumber || 'Unknown' }}</div>
                </div>
                <div class="d-flex gap-2">
                  <v-btn size="x-small" variant="tonal" @click="pairUSBPrinter('label')">Relink</v-btn>
                  <v-btn size="x-small" variant="text" color="error" @click="removeUSBPrinter('label')">Remove</v-btn>
                </div>
              </div>
            </v-card>

            <!-- Auto-print toggles -->
            <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-4">
              <div class="d-flex align-center justify-space-between mb-4">
                <div>
                  <div class="text-body-2 font-weight-bold">Auto-Print Receipts</div>
                  <div class="text-caption text-medium-emphasis">Prompt to print receipt after POS checkout</div>
                </div>
                <v-switch v-model="printerSettings.autoPrintReceipt" hide-details density="compact" color="success" @update:model-value="savePrinterSettings" />
              </div>
              <v-btn size="small" variant="tonal" prepend-icon="mdi-printer" class="mb-4" @click="testReceiptPrint">Test Receipt Print</v-btn>
              <v-divider class="mb-4" />
              <div class="d-flex align-center justify-space-between mb-4">
                <div>
                  <div class="text-body-2 font-weight-bold">Auto-Print Barcode Labels</div>
                  <div class="text-caption text-medium-emphasis">Prompt to print barcode label when a ticket is created</div>
                </div>
                <v-switch v-model="printerSettings.autoPrintBarcode" hide-details density="compact" color="info" @update:model-value="savePrinterSettings" />
              </div>
              <v-btn size="small" variant="tonal" prepend-icon="mdi-barcode" @click="testBarcodePrint">Test Label Print</v-btn>
            </v-card>

            <v-alert v-if="printerMsg" :type="printerMsg.type" :title="printerMsg.text" closable density="compact" class="mt-4" @click:close="printerMsg = null" />
          </v-card-text>
        </v-card>

        <!-- Notifications -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#f59e0b08">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
                <v-icon icon="mdi-bell-outline" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Notifications</v-card-title>
            <v-card-subtitle>Alert preferences for your shop</v-card-subtitle>
          </v-card-item>
          <v-list density="compact">
            <v-list-item v-for="(notif, key) in notificationSettings" :key="key" rounded="lg" class="mx-2 my-1">
              <template #prepend>
                <v-avatar size="32" rounded="lg" :style="`background:${notif.color}18`">
                  <v-icon :icon="notif.icon" size="16" :style="`color:${notif.color}`" />
                </v-avatar>
              </template>
              <template #title><span class="text-body-2 font-weight-bold">{{ notif.label }}</span></template>
              <template #subtitle><span class="text-caption">{{ notif.desc }}</span></template>
              <template #append>
                <v-switch :model-value="notif.enabled" hide-details density="compact" @update:model-value="toggleNotif(key)" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>

      </v-col>

      <!-- ── RIGHT: Account & Danger Zone ── -->
      <v-col cols="12" lg="4">

        <!-- Account -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#8b5cf608">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">
                <v-icon icon="mdi-account-outline" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Account</v-card-title>
            <v-card-subtitle>Your profile and auth</v-card-subtitle>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-4 mb-4">
              <div class="d-flex align-center gap-3">
                <v-avatar size="48" color="primary" class="text-body-1 font-weight-black text-white" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
                  {{ userInitials }}
                </v-avatar>
                <div class="min-w-0">
                  <div class="text-body-2 font-weight-bold text-truncate">{{ userEmail }}</div>
                  <div class="text-caption text-medium-emphasis text-truncate">{{ form.businessName || 'NovaOps' }}</div>
                </div>
              </div>
            </v-card>
            <v-btn block color="error" variant="tonal" prepend-icon="mdi-logout" @click="handleSignOut">Sign Out</v-btn>
          </v-card-text>
        </v-card>

        <!-- Data Management -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#06b6d408">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">
                <v-icon icon="mdi-database-outline" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">Data Management</v-card-title>
            <v-card-subtitle>Backup and restore your data</v-card-subtitle>
          </v-card-item>
          <v-card-text class="pa-6 d-flex flex-column gap-3">
            <v-btn block color="info" variant="tonal" prepend-icon="mdi-download" @click="handleExport">Export All Data</v-btn>
            <v-btn block variant="tonal" prepend-icon="mdi-upload" @click="router.push('/import')">Import Data</v-btn>
          </v-card-text>
        </v-card>

        <!-- System Diagnostics -->
        <v-card class="mb-4">
          <v-card-item class="border-b" style="background:#3ecf8e08">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a)">
                <v-icon color="white">mdi-stethoscope</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black">System Diagnostics</v-card-title>
            <v-card-subtitle>Integration health check</v-card-subtitle>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-btn block color="success" :loading="isRunningDiag" prepend-icon="mdi-play-circle-outline" class="mb-4" @click="runDiagnostics">Run Diagnostics</v-btn>
            <div v-if="diagResults.length" class="d-flex flex-column gap-2" style="max-height:300px;overflow-y:auto">
              <v-alert
                v-for="(res, idx) in diagResults"
                :key="idx"
                :type="res.status === 'success' ? 'success' : res.status === 'error' ? 'error' : 'info'"
                :title="res.step"
                :text="res.message"
                density="compact"
                rounded="lg"
                variant="tonal"
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- Danger Zone -->
        <v-card class="mb-4" style="outline:2px solid #ef444430;outline-offset:0">
          <v-card-item class="border-b" style="background:#ef444408">
            <template #prepend>
              <v-avatar size="40" rounded="xl" style="background:linear-gradient(135deg,#ef4444,#dc2626)">
                <v-icon icon="mdi-alert-outline" size="18" color="white" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1 font-weight-black" style="color:#ef4444">Danger Zone</v-card-title>
            <v-card-subtitle>Irreversible actions</v-card-subtitle>
          </v-card-item>
          <v-card-text class="pa-6">
            <v-btn block color="error" prepend-icon="mdi-delete-sweep" @click="confirmReset">Reset All Data</v-btn>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>

    <!-- ── Supabase Connect Dialog ── -->
    <v-dialog v-model="showSbModal" max-width="560">
      <v-card>
        <v-card-item class="border-b" style="background:#3ecf8e06">
          <template #prepend>
            <v-avatar size="44" rounded="xl" style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a);box-shadow:0 4px 16px #3ecf8e30">
              <v-icon icon="mdi-database-outline" size="20" color="white" />
            </v-avatar>
          </template>
          <v-card-title>Connect to Supabase</v-card-title>
          <v-card-subtitle>Paste your project URL and anon key from the dashboard</v-card-subtitle>
          <template #append>
            <v-btn icon="mdi-close" variant="text" size="small" @click="showSbModal = false" />
          </template>
        </v-card-item>
        <v-card-text class="pa-6">
          <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-5">
            <div class="text-caption">
              <strong>1.</strong> Go to <strong>supabase.com/dashboard</strong> → your project<br>
              <strong>2.</strong> Click <strong>Project Settings → API</strong><br>
              <strong>3.</strong> Copy <strong>Project URL</strong> and <strong>anon / public</strong> key below
            </div>
          </v-alert>
          <v-text-field
            v-model="sbForm.url"
            type="url"
            label="Project URL"
            placeholder="https://xxxxxxxxxxxx.supabase.co"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            style="font-family:monospace"
            autocomplete="off"
          />
          <v-text-field
            v-model="sbForm.key"
            type="password"
            label="Anon / Public Key"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
            variant="outlined"
            density="comfortable"
            hint="Use the anon key — not the service_role key."
            persistent-hint
            style="font-family:monospace"
            autocomplete="off"
          />
          <v-alert v-if="sbConn.status.error" type="error" :text="sbConn.status.error" density="compact" rounded="lg" class="mt-4" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="showSbModal = false">Cancel</v-btn>
          <v-spacer />
          <v-btn color="success" :loading="sbConn.status.checking" :disabled="!sbForm.url || !sbForm.key" prepend-icon="mdi-database-check" @click="handleSbConnect">
            Connect &amp; Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Supabase Disconnect Confirm ── -->
    <v-dialog v-model="confirmSbDisconnect" max-width="400">
      <v-card>
        <v-card-item>
          <template #prepend>
            <v-avatar size="44" rounded="lg" color="error" variant="tonal">
              <v-icon color="error">mdi-alert-circle-outline</v-icon>
            </v-avatar>
          </template>
          <v-card-title>Disconnect Supabase?</v-card-title>
          <v-card-subtitle>Your data stays safe in Supabase. You'll need to reconnect to access it again.</v-card-subtitle>
        </v-card-item>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmSbDisconnect = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="sbConn.disconnect(); confirmSbDisconnect = false">Disconnect</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── General Confirm Dialog ── -->
    <v-dialog v-model="confirmDialog.open" max-width="420">
      <v-card>
        <v-card-title class="text-h6">{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog.open = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDialog.onConfirm()">{{ confirmDialog.confirmLabel }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToast } from '~/composables/useToast'

// ── Toast ─────────────────────────────────────────────────────────────
const { toast } = useToast()

// ── Supabase Connect ──────────────────────────────────────────────────
const sbConn = useSupabaseConnect()
const showSbModal       = ref(false)
const confirmSbDisconnect = ref(false)
const sbForm = ref({ url: '', key: '' })
const sbUrl  = computed(() => sbConn.url.value)

watch(showSbModal, (open) => {
  if (open) {
    sbForm.value = { url: sbConn.url.value, key: '' }
    sbConn.status.error = null
  }
})

const handleSbConnect = async () => {
  await sbConn.saveAndConnect(sbForm.value.url, sbForm.value.key)
  // saveAndConnect does a window.location.reload on success — no need to close modal
}

definePageMeta({ middleware: ['auth'] })

const appStore  = useAppStore()
const router    = useRouter()
const { $supabase } = useNuxtApp()
const { settings, notificationPrefs, services: svcList, expenses: expensesList } = storeToRefs(appStore)

// ── User info ────────────────────────────────────────────────────────
const userEmail = computed(() => settings.value?.email || 'user@novaops.com')
const userInitials = computed(() => {
  const e = userEmail.value
  const parts = e.split('@')[0].split('.')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : e.substring(0, 2).toUpperCase()
})

// ── Form ─────────────────────────────────────────────────────────────
const form = ref({
  businessName: '', phone: '', email: '', address: '',
  currency: '$', taxRate: 0, statuses: 'Open, In Progress, Waiting for Parts, Completed, Delivered',
  pin: '', squareAccessToken: '', squareLocationId: '', squareSandbox: false,
})

watch(settings, (s) => { if (s) form.value = { ...form.value, ...s } }, { immediate: true, deep: true })

// ── Business save ─────────────────────────────────────────────────────
const saveMsg = ref<{ ok: boolean; text: string } | null>(null)
const saving = ref(false)
let saveMsgTimer: ReturnType<typeof setTimeout> | null = null

const saveSettings = async () => {
  if (saving.value) return
  saving.value = true
  try {
    await appStore.saveSettings({ ...form.value })
    saveMsg.value = { ok: true, text: 'Settings saved successfully' }
    toast.success('Settings Saved', 'Your business settings have been updated')
  } catch (err: any) {
    const msg = err?.message || err?.data?.message || JSON.stringify(err) || 'Save failed'
    console.error('[Settings] Save failed:', err)
    saveMsg.value = { ok: false, text: msg }
    toast.danger('Save Failed', msg)
  } finally {
    saving.value = false
  }
  if (saveMsgTimer) clearTimeout(saveMsgTimer)
  saveMsgTimer = setTimeout(() => { saveMsg.value = null }, 4000)
}

// ── Services CRUD ─────────────────────────────────────────────────────
const showServiceForm = ref(false)
const savingService = ref(false)
const editingServiceId = ref<number | null>(null)
const serviceMsg = ref<{ ok: boolean; text: string } | null>(null)
let serviceMsgTimer: ReturnType<typeof setTimeout> | null = null
const serviceForm = ref({ name: '', category: 'Services', description: '', price: 0, estimated_minutes: 0 })

function resetServiceForm() {
  serviceForm.value = { name: '', category: 'Services', description: '', price: 0, estimated_minutes: 0 }
  editingServiceId.value = null
}

function editService(svc: any) {
  editingServiceId.value = svc.id
  serviceForm.value = {
    name: svc.name || '',
    category: svc.category || 'Services',
    description: svc.description || '',
    price: svc.price || 0,
    estimated_minutes: svc.estimated_minutes || svc.duration || 0,
  }
  showServiceForm.value = true
}

function cancelServiceEdit() {
  showServiceForm.value = false
  resetServiceForm()
}

function showServiceMsg(ok: boolean, text: string) {
  serviceMsg.value = { ok, text }
  if (serviceMsgTimer) clearTimeout(serviceMsgTimer)
  serviceMsgTimer = setTimeout(() => { serviceMsg.value = null }, 3000)
}

async function handleSaveService() {
  savingService.value = true
  try {
    if (editingServiceId.value) {
      await appStore.updateService(editingServiceId.value, {
        name: serviceForm.value.name,
        category: serviceForm.value.category,
        description: serviceForm.value.description,
        price: serviceForm.value.price,
        estimated_minutes: serviceForm.value.estimated_minutes,
        duration: serviceForm.value.estimated_minutes,
      })
      showServiceMsg(true, 'Service updated')
      toast.success('Service Updated', serviceForm.value.name)
    } else {
      await appStore.createService({ ...serviceForm.value })
      showServiceMsg(true, 'Service added')
      toast.success('Service Added', serviceForm.value.name)
    }
    cancelServiceEdit()
  } catch (e: any) {
    showServiceMsg(false, e.message || 'Failed to save service')
    toast.danger('Error', e.message || 'Failed to save service')
  }
  savingService.value = false
}

async function handleDeleteService(id: number) {
  try {
    await appStore.deleteService(id)
    showServiceMsg(true, 'Service deleted')
    toast.success('Deleted', 'Service removed')
  } catch (e: any) {
    showServiceMsg(false, e.message || 'Failed to delete')
    toast.danger('Error', e.message || 'Failed to delete')
  }
}

// ── Expenses CRUD ─────────────────────────────────────────────────────
const showExpenseForm = ref(false)
const savingExpense = ref(false)
const expenseMsg = ref<{ ok: boolean; text: string } | null>(null)
let expenseMsgTimer: ReturnType<typeof setTimeout> | null = null
const expenseForm = ref({ description: '', amount: 0, category: 'Overhead', date: new Date().toISOString().split('T')[0] })

function resetExpenseForm() {
  expenseForm.value = { description: '', amount: 0, category: 'Overhead', date: new Date().toISOString().split('T')[0] }
}

function showExpenseMsg(ok: boolean, text: string) {
  expenseMsg.value = { ok, text }
  if (expenseMsgTimer) clearTimeout(expenseMsgTimer)
  expenseMsgTimer = setTimeout(() => { expenseMsg.value = null }, 3000)
}

async function handleAddExpense() {
  savingExpense.value = true
  try {
    await appStore.createExpense({ ...expenseForm.value })
    showExpenseMsg(true, 'Expense added')
    toast.success('Expense Added', expenseForm.value.description)
    resetExpenseForm()
    showExpenseForm.value = false
  } catch (e: any) {
    showExpenseMsg(false, e.message || 'Failed to save expense')
    toast.danger('Error', e.message || 'Failed to save expense')
  }
  savingExpense.value = false
}

async function handleDeleteExpense(id: number) {
  try {
    await appStore.deleteExpense(id)
    showExpenseMsg(true, 'Expense deleted')
    toast.success('Deleted', 'Expense removed')
  } catch (e: any) {
    showExpenseMsg(false, e.message || 'Failed to delete')
    toast.danger('Error', e.message || 'Failed to delete')
  }
}

// ── Square connection test ────────────────────────────────────────────
type SquareStatus = 'idle' | 'checking' | 'connected' | 'disconnected'
const squareStatus   = ref<SquareStatus>('idle')
const squareTestMsg  = ref('')
const savingSquare   = ref(false)

const testSquareConnection = async () => {
  if (!form.value.squareAccessToken || !form.value.squareLocationId) {
    squareStatus.value  = 'disconnected'
    squareTestMsg.value = 'Enter your Access Token and Location ID first.'
    return
  }
  squareStatus.value  = 'checking'
  squareTestMsg.value = ''
  try {
    const res: any = await $fetch('/api/square/connection-test', {
      headers: {
        'x-square-access-token': form.value.squareAccessToken,
        'x-square-location-id': form.value.squareLocationId,
      }
    })
    
    squareStatus.value  = 'connected'
    squareTestMsg.value = `Connected to location: ${res.locationName}`
  } catch (err: any) {
    squareStatus.value  = 'disconnected'
    squareTestMsg.value = err.data?.statusMessage || err.message || 'Connection failed'
  }
}

// Save Square credentials to the store/Supabase, then re-test
const saveSquareSettings = async () => {
  savingSquare.value = true
  try {
    await appStore.saveSquareConfig()
    await testSquareConnection()
  } catch (e: any) {
    console.error('[Settings] Square save failed:', e)
  } finally {
    savingSquare.value = false
  }
}

// Debounced auto-check when the user finishes typing credentials
let squareCheckTimer: ReturnType<typeof setTimeout> | null = null
const debouncedSquareCheck = () => {
  if (squareCheckTimer) clearTimeout(squareCheckTimer)
  squareCheckTimer = setTimeout(testSquareConnection, 800)
}

// Terminal pairing logic removed

// ── Notifications ─────────────────────────────────────────────────────
// notificationSettings is a computed display object that reads enabled state
// from the globally persisted notificationPrefs in the app store.
const notificationSettings = computed(() => ({
  newTicket:   { label: 'New Ticket',    desc: 'Alert when a ticket is created',  color: '#f59e0b', icon: 'mdi-ticket-confirmation-outline',  enabled: notificationPrefs.value.newTicket },
  newSale:     { label: 'New Sale',      desc: 'Alert when POS sale completes',   color: '#10b981', icon: 'mdi-cart-outline', enabled: notificationPrefs.value.newSale },
  newCustomer: { label: 'New Customer',  desc: 'Alert when customer is added',    color: '#3b82f6', icon: 'mdi-account-plus-outline',     enabled: notificationPrefs.value.newCustomer },
  appointment: { label: 'Appointments', desc: 'Alert for upcoming appointments', color: '#8b5cf6', icon: 'mdi-calendar',     enabled: notificationPrefs.value.appointment },
  newMessage:  { label: 'New Message',   desc: 'Alert when a customer emails you', color: '#ec4899', icon: 'mdi-message-outline', enabled: notificationPrefs.value.newMessage },
}))

function toggleNotif(key: string) {
  const k = key as keyof typeof notificationPrefs.value
  notificationPrefs.value[k] = !notificationPrefs.value[k]
  // Persist to localStorage immediately
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('novaops_notif_prefs', JSON.stringify(notificationPrefs.value))
  }
}

// ── Confirm dialog ───────────────────────────────────────────────────
const confirmDialog = ref({ open: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => {} })
function showConfirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  confirmDialog.value = { open: true, title, message, confirmLabel, onConfirm }
}

// ── Printer Settings (Web) ────────────────────────────────────────────────
import { printReceipt, printBarcodeLabel } from '~/utils/print'

const printerMsg      = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const PRINTER_KEY     = 'novaops_printer_settings'
const printerSettings = ref({ autoPrintReceipt: true, autoPrintBarcode: true })

const pairedThermalPrinter = ref<{ productName?: string; serialNumber?: string; vendorId?: number; productId?: number } | null>(null)
const pairedLabelPrinter = ref<{ productName?: string; serialNumber?: string; vendorId?: number; productId?: number } | null>(null)

onMounted(() => {
  try {
    const saved = localStorage.getItem(PRINTER_KEY)
    if (saved) printerSettings.value = { ...printerSettings.value, ...JSON.parse(saved) }
    
    const savedThermal = localStorage.getItem('novaops_thermal_printer')
    if (savedThermal) pairedThermalPrinter.value = JSON.parse(savedThermal)
    
    const savedLabel = localStorage.getItem('novaops_label_printer')
    if (savedLabel) pairedLabelPrinter.value = JSON.parse(savedLabel)
  } catch (e) {}
})

function savePrinterSettings() {
  localStorage.setItem(PRINTER_KEY, JSON.stringify(printerSettings.value))
  showPrinterMsg('success', 'Printer settings saved')
}

function showPrinterMsg(type: 'success' | 'error', text: string) {
  printerMsg.value = { type, text }
  setTimeout(() => { printerMsg.value = null }, 3500)
}

async function pairUSBPrinter(type: 'thermal' | 'label') {
  if (!(navigator as any).usb) {
    showPrinterMsg('error', 'WebUSB is not supported in this browser.')
    return
  }
  try {
    const device = await (navigator as any).usb.requestDevice({ filters: [] })
    if (device) {
      const printerData = {
        productName: device.productName || 'USB Printer',
        serialNumber: device.serialNumber || 'Unknown',
        vendorId: device.vendorId,
        productId: device.productId
      }
      if (type === 'thermal') {
        pairedThermalPrinter.value = printerData
        localStorage.setItem('novaops_thermal_printer', JSON.stringify(printerData))
      } else {
        pairedLabelPrinter.value = printerData
        localStorage.setItem('novaops_label_printer', JSON.stringify(printerData))
      }
      showPrinterMsg('success', `${type === 'thermal' ? 'Thermal' : 'Label'} printer linked!`)
    }
  } catch (e: any) {
    if (e.name !== 'NotFoundError' && !e.message?.includes('No device selected')) {
      showPrinterMsg('error', e.message || 'Failed to link printer')
    }
  }
}

function removeUSBPrinter(type: 'thermal' | 'label') {
  if (type === 'thermal') {
    pairedThermalPrinter.value = null
    localStorage.removeItem('novaops_thermal_printer')
  } else {
    pairedLabelPrinter.value = null
    localStorage.removeItem('novaops_label_printer')
  }
}

function testReceiptPrint() {
  printReceipt({
    businessName: form.value.businessName || 'NovaOps Demo',
    businessAddress: form.value.address || '123 Tech Lane',
    businessPhone: form.value.phone || '555-0123',
    date: new Date().toLocaleString(),
    items: [
      { name: 'Hardware Diagnostic', qty: 1, price: 49.00 },
      { name: 'Screen Replacement', qty: 1, price: 120.00 }
    ],
    subtotal: 169.00,
    tax: 16.90,
    total: 185.90,
    currency: form.value.currency || '$'
  })
}

function testBarcodePrint() {
  printBarcodeLabel({
    sku: 'TKT-99999',
    name: 'TEST LABEL',
    customerName: 'John Doe',
    price: 0.00,
    currency: form.value.currency || '$'
  })
}

// ── Actions ───────────────────────────────────────────────────────────
const handleSignOut = () => {
  showConfirm('Sign Out', 'Are you sure you want to sign out?', 'Sign Out', async () => {
    try { await ($supabase as any).auth.signOut() } catch {}
    router.push('/login')
  })
}

const handleExport = () => {
  const data = { settings: appStore.settings, tickets: appStore.tickets, customers: appStore.customers, inventory: appStore.inventory }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `novaops-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const confirmReset = () => {
  showConfirm('Reset All Data', 'This will permanently delete all tickets, customers, and settings. This cannot be undone.', 'Delete Everything', () => {
    localStorage.clear()
    window.location.reload()
  })
}

// ── System Diagnostics ──────────────────────────────────────────────────
const diagResults = ref<any[]>([])
const isRunningDiag = ref(false)

const logDiag = (step: string, status: 'pending' | 'success' | 'error', message?: string) => {
  diagResults.value.push({ step, status, message, timestamp: new Date().toISOString() })
}

const updateDiagLog = (step: string, status: 'success' | 'error', message: string) => {
  const item = diagResults.value.find(r => r.step === step && r.status === 'pending')
  if (item) {
    item.status = status
    item.message = message
  } else {
    logDiag(step, status, message)
  }
}

const runDiagnostics = async () => {
  diagResults.value = []
  isRunningDiag.value = true
  
  // 1. Supabase Client Check
  logDiag('Supabase Client Instance', 'pending')
  if (!$supabase) {
    updateDiagLog('Supabase Client Instance', 'error', 'Supabase client is null.')
    isRunningDiag.value = false
    return
  }
  updateDiagLog('Supabase Client Instance', 'success', 'Supabase client is initialized.')

  // 2. Supabase Auth Check
  logDiag('Supabase Session', 'pending')
  try {
    const { data: { session }, error } = await ($supabase as any).auth.getSession()
    if (error) throw error
    if (!session) {
      updateDiagLog('Supabase Session', 'error', 'No active session found. User is not logged in.')
    } else {
      updateDiagLog('Supabase Session', 'success', `User logged in: ${session.user.email}`)
    }
  } catch (e: any) {
    updateDiagLog('Supabase Session', 'error', e.message)
  }

  // 3. Supabase Database Ping
  logDiag('Supabase Database Access', 'pending')
  try {
    const { data, error } = await ($supabase as any).from('tickets').select('id').limit(1)
    if (error) throw error
    updateDiagLog('Supabase Database Access', 'success', `Queried tickets table. (Found ${data.length} records)`)
  } catch (e: any) {
    updateDiagLog('Supabase Database Access', 'error', `Query failed. RLS or connectivity issue: ${e.message}`)
  }

  // 4. Square Backend API
  logDiag('Square Backend API', 'pending')
  try {
    // Send square credentials in headers to ensure it works even if not yet saved in DB
    const headers = {
      'x-square-access-token': form.value.squareAccessToken,
      'x-square-location-id': form.value.squareLocationId
    }
    const res = await $fetch('/api/square/connection-test', { headers })
    updateDiagLog('Square Backend API', 'success', `Square responded: ${JSON.stringify(res)}`)
  } catch (e: any) {
    updateDiagLog('Square Backend API', 'error', `API error: ${e.message}`)
  }

  // 5. Square Payment Readiness (real end-to-end check — no fake errors)
  logDiag('Square Payment Readiness', 'pending')
  try {
    const headers = {
      'x-square-access-token': form.value.squareAccessToken,
      'x-square-location-id': form.value.squareLocationId
    }
    const res: any = await $fetch('/api/square/payment-readiness', { headers })
    if (res.ok) {
      const mode = res.sandbox ? '🧪 Sandbox' : '🟢 Production'
      const summary = res.checks.map((c: any) => `${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`).join(' | ')
      updateDiagLog('Square Payment Readiness', 'success', `${mode} — ${summary}`)
    } else {
      const failed = res.checks.filter((c: any) => !c.ok).map((c: any) => `${c.name}: ${c.detail}`).join('; ')
      updateDiagLog('Square Payment Readiness', 'error', `Check failed — ${failed}`)
    }
  } catch (e: any) {
    const msg = (e as any).data?.message || (e as any).message || 'Unknown error'
    updateDiagLog('Square Payment Readiness', 'error', `Readiness check failed: ${msg}`)
  }
  
  isRunningDiag.value = false
}

// Lifecycle hooks
onMounted(() => {
  // Check Square status on load if credentials exist
  if (form.value.squareAccessToken && form.value.squareLocationId) {
    testSquareConnection()
  }
  // Auto-probe Supabase connection status if credentials are already saved
  if (sbConn.hasCredentials.value) {
    sbConn.testConnection()
  }
})

onUnmounted(() => { })
</script>

<style scoped>
/* Transition for service/expense add forms */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.25s ease;
}
</style>