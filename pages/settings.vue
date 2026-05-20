<template>
  <div class="page-shell">

    <!-- ── Page Header ── -->
    <div class="flex items-center gap-4 mb-6">
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
        style="background:linear-gradient(135deg,#64748b,#475569)"
      >
        <i class="mdi mdi-cog-outline text-2xl"></i>
      </div>
      <div>
        <h1 class="text-xl font-black m-0">Settings</h1>
        <p class="text-sm text-muted-foreground m-0">Configure your business, integrations, and account</p>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-4">

      <!-- ── LEFT: Business + Integrations ── -->
      <div class="col-span-12 lg:col-span-8">

        <!-- Business Info -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-border" style="background:#6366f108">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
            >
              <i class="mdi mdi-office-building-outline"></i>
            </div>
            <div>
              <h2 class="text-sm font-black m-0">Business Information</h2>
              <p class="text-xs text-muted-foreground m-0">Your shop's public details and preferences</p>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Business Name</label>
                <InputText v-model="form.businessName" placeholder="Your Repair Shop" class="w-full rounded-xl" />
              </div>
              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Phone</label>
                <InputText v-model="form.phone" placeholder="(555) 123-4567" class="w-full rounded-xl" />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Email</label>
                <InputText v-model="form.email" type="email" placeholder="contact@yourshop.com" class="w-full rounded-xl" />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Address</label>
                <Textarea v-model="form.address" :rows="2" placeholder="123 Main St, City, State ZIP" class="w-full rounded-xl" />
              </div>
              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Currency Symbol</label>
                <InputText v-model="form.currency" placeholder="$" class="w-full rounded-xl" />
              </div>
              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Tax Rate (%)</label>
                <InputText v-model.number="form.taxRate" type="number" step="0.01" placeholder="0.00" class="w-full rounded-xl" />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Ticket Statuses</label>
                <InputText v-model="form.statuses" placeholder="Open, In Progress, Waiting for Parts, Completed, Delivered" class="w-full rounded-xl" />
                <p class="text-[10px] text-muted-foreground m-0">Separate each status with a comma</p>
              </div>
              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Screen Lock PIN</label>
                <InputText v-model="form.pin" type="password" maxlength="4" placeholder="4-digit PIN" class="w-full rounded-xl" style="font-family:monospace;letter-spacing:.25em" />
                <p class="text-[10px] text-muted-foreground m-0">Screen locks after 3 minutes of inactivity</p>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-wrap mt-4 pt-4 border-t border-border">
              <Button label="Save Business Settings" class="text-none" :loading="saving" @click="saveSettings">
                <i class="mdi mdi-content-save mr-1"></i>
              </Button>
              <Message
                v-if="saveMsg"
                :severity="saveMsg.ok ? 'success' : 'error'"
                :closable="true"
                class="mt-2 w-full"
                @close="saveMsg = null"
              >
                <template v-if="saveMsg.ok"><strong>Settings saved</strong></template>
                <template v-else><strong>Save failed</strong><span v-if="saveMsg.text"> — {{ saveMsg.text }}</span></template>
              </Message>
            </div>
          </div>
        </div>



        <!-- Supabase Connection -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-border flex-wrap" style="background:#3ecf8e08">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a)"
            >
              <i class="mdi mdi-database-outline"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-sm font-black m-0">Supabase Database</h2>
              <p class="text-xs text-muted-foreground m-0">Your live data backend — tickets, customers, inventory</p>
            </div>
            <Tag
              :value="sbConn.status.connected ? `Connected · ${sbConn.projectRef.value}` : sbConn.hasCredentials.value ? 'Credentials saved' : 'Not connected'"
              :severity="sbConn.status.connected ? 'success' : sbConn.hasCredentials.value ? 'warn' : 'danger'"
              class="text-xs shrink-0"
            />
          </div>
          <div class="p-6">
            <Message v-if="sbConn.status.connected" severity="success" :closable="false" class="mb-4">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <span class="text-xs font-bold">Connected to Supabase — <code class="text-xs">{{ sbUrl }}</code></span>
                <Button label="Change" variant="text" size="small" severity="success" class="text-none" @click="showSbModal = true" />
              </div>
            </Message>
            <div v-else>
              <Message severity="info" :closable="false" class="mb-4">
                <span class="text-xs font-medium">
                  NovaOps stores all your repair shop data in your own private Supabase database.
                  Create a free project at <strong>supabase.com</strong> then paste your credentials here.
                </span>
              </Message>
              <div class="flex gap-3 flex-wrap">
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" class="inline-block">
                  <Button label="Open Supabase" severity="success" class="text-none">
                    <i class="mdi mdi-open-in-new mr-1"></i>
                  </Button>
                </a>
                <Button label="Enter Credentials" severity="success" variant="outlined" class="text-none" @click="showSbModal = true">
                  <i class="mdi mdi-link mr-1"></i>
                </Button>
              </div>
            </div>
            <div v-if="sbConn.hasCredentials.value" class="mt-3">
              <Button label="Disconnect Supabase" variant="text" size="small" severity="danger" class="text-none" @click="confirmSbDisconnect = true">
                <i class="mdi mdi-link-off mr-1"></i>
              </Button>
            </div>
          </div>
        </div>

        <!-- Square Integration -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-border flex-wrap" style="background:#10b98108">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#10b981,#059669)"
            >
              <i class="mdi mdi-credit-card-outline"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-sm font-black m-0">Square Terminal Integration</h2>
              <p class="text-xs text-muted-foreground m-0">Connect your Square account and pair a physical terminal</p>
            </div>
            <Tag
              :value="squareStatus === 'connected' ? 'Connected' : squareStatus === 'checking' ? 'Checking…' : 'Disconnected'"
              :severity="squareStatus === 'connected' ? 'success' : squareStatus === 'checking' ? 'warn' : 'danger'"
              class="text-xs shrink-0"
            />
          </div>
          <div class="p-6">
            <div class="grid grid-cols-12 gap-3 mb-3">
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Square Access Token</label>
                <InputText
                  v-model="form.squareAccessToken"
                  type="password"
                  placeholder="EAAAl…"
                  class="w-full rounded-xl"
                  style="font-family:monospace"
                  autocomplete="off"
                  @blur="debouncedSquareCheck"
                />
                <p class="text-[10px] text-muted-foreground m-0">Stored securely — never sent to the browser after save</p>
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Location ID</label>
                <InputText
                  v-model="form.squareLocationId"
                  placeholder="L1234…"
                  class="w-full rounded-xl"
                  style="font-family:monospace"
                  @blur="debouncedSquareCheck"
                />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted-foreground uppercase">Application ID (required for card form in POS)</label>
                <InputText
                  v-model="form.squareApplicationId"
                  placeholder="sandbox-sq0idb… or sq0idb…"
                  class="w-full rounded-xl"
                  style="font-family:monospace"
                  autocomplete="off"
                />
                <p class="text-[10px] text-muted-foreground m-0">Square Developer Dashboard → Your application → Application ID (public, not the access token)</p>
              </div>
            </div>
            <div class="bg-muted rounded-xl p-4 mb-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="text-sm font-bold">Use Square Sandbox</div>
                  <div class="text-xs text-muted-foreground">Test mode — use sandbox credentials</div>
                </div>
                <ToggleSwitch v-model="form.squareSandbox" @update:model-value="debouncedSquareCheck" />
              </div>
            </div>
            <Message
              v-if="squareTestMsg"
              :severity="squareStatus === 'connected' ? 'success' : 'error'"
              :closable="false"
              class="mb-4"
            >
              {{ squareTestMsg }}
            </Message>
            <div class="flex gap-3 flex-wrap">
              <Button label="Save Credentials" variant="outlined" class="text-none" :loading="savingSquare" @click="saveSquareSettings">
                <i class="mdi mdi-content-save mr-1"></i>
              </Button>
              <Button label="Test Connection" severity="success" variant="outlined" class="text-none" :loading="squareStatus === 'checking'" @click="testSquareConnection">
                <i class="mdi mdi-refresh mr-1"></i>
              </Button>
            </div>
          </div>
        </div>

        <!-- Printing & Barcodes -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-border" style="background:#06b6d408">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#06b6d4,#0891b2)"
            >
              <i class="mdi mdi-printer"></i>
            </div>
            <div>
              <h2 class="text-sm font-black m-0">Printing &amp; Barcodes</h2>
              <p class="text-xs text-muted-foreground m-0">Receipt and barcode label settings</p>
            </div>
          </div>
          <div class="p-6">
            <Message severity="info" :closable="false" class="mb-5">
              <div class="text-xs font-bold mb-1">Windows USB Setup (Zadig)</div>
              <div class="text-xs">Windows blocks direct USB printer access. Download <a href="https://zadig.akeo.ie" target="_blank" rel="noopener noreferrer" class="font-bold">zadig.akeo.ie</a>, select your printer, and install the <strong>WinUSB</strong> driver once to enable WebUSB printing.</div>
            </Message>

            <!-- Thermal Printer -->
            <div class="bg-muted rounded-xl p-4 mb-4">
              <div class="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background:#10b98118">
                    <i class="mdi mdi-receipt-text-outline"></i>
                  </div>
                  <div>
                    <div class="text-sm font-bold">Default Thermal Printer</div>
                    <div v-if="!pairedThermalPrinter" class="text-xs text-muted-foreground">No device linked</div>
                  </div>
                </div>
                <Button v-if="!pairedThermalPrinter" label="Pair a Device" size="small" severity="info" variant="outlined" class="text-none" @click="pairUSBPrinter('thermal')" />
              </div>
              <div v-if="pairedThermalPrinter" class="flex items-center justify-between gap-3 p-3 rounded-lg" style="background:rgba(0,0,0,0.05)">
                <div>
                  <div class="text-sm font-bold">{{ pairedThermalPrinter.productName || 'USB Printer' }}</div>
                  <div class="text-xs font-mono text-muted-foreground">S/N: {{ pairedThermalPrinter.serialNumber || 'Unknown' }}</div>
                </div>
                <div class="flex gap-2">
                  <Button label="Relink" size="small" variant="outlined" class="text-none" @click="pairUSBPrinter('thermal')" />
                  <Button label="Remove" size="small" variant="text" severity="danger" class="text-none" @click="removeUSBPrinter('thermal')" />
                </div>
              </div>
            </div>

            <!-- Label Printer -->
            <div class="bg-muted rounded-xl p-4 mb-4">
              <div class="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background:#06b6d418">
                    <i class="mdi mdi-barcode-scan"></i>
                  </div>
                  <div>
                    <div class="text-sm font-bold">Default Label Printer</div>
                    <div v-if="!pairedLabelPrinter" class="text-xs text-muted-foreground">No device linked</div>
                  </div>
                </div>
                <Button v-if="!pairedLabelPrinter" label="Pair a Device" size="small" severity="info" variant="outlined" class="text-none" @click="pairUSBPrinter('label')" />
              </div>
              <div v-if="pairedLabelPrinter" class="flex items-center justify-between gap-3 p-3 rounded-lg" style="background:rgba(0,0,0,0.05)">
                <div>
                  <div class="text-sm font-bold">{{ pairedLabelPrinter.productName || 'USB Printer' }}</div>
                  <div class="text-xs font-mono text-muted-foreground">S/N: {{ pairedLabelPrinter.serialNumber || 'Unknown' }}</div>
                </div>
                <div class="flex gap-2">
                  <Button label="Relink" size="small" variant="outlined" class="text-none" @click="pairUSBPrinter('label')" />
                  <Button label="Remove" size="small" variant="text" severity="danger" class="text-none" @click="removeUSBPrinter('label')" />
                </div>
              </div>
            </div>

            <!-- Auto-print toggles -->
            <div class="bg-muted rounded-xl p-4">
              <div class="flex items-center justify-between mb-4 gap-3">
                <div>
                  <div class="text-sm font-bold">Auto-Print Receipts</div>
                  <div class="text-xs text-muted-foreground">Prompt to print receipt after POS checkout</div>
                </div>
                <ToggleSwitch v-model="printerSettings.autoPrintReceipt" @update:model-value="savePrinterSettings" />
              </div>
              <Button label="Test Receipt Print" size="small" variant="outlined" class="text-none mb-4" @click="testReceiptPrint">
                <i class="mdi mdi-printer mr-1"></i>
              </Button>
              <hr class="border-border mb-4" />
              <div class="flex items-center justify-between mb-4 gap-3">
                <div>
                  <div class="text-sm font-bold">Auto-Print Barcode Labels</div>
                  <div class="text-xs text-muted-foreground">Prompt to print barcode label when a ticket is created</div>
                </div>
                <ToggleSwitch v-model="printerSettings.autoPrintBarcode" @update:model-value="savePrinterSettings" />
              </div>
              <Button label="Test Label Print" size="small" variant="outlined" class="text-none" @click="testBarcodePrint">
                <i class="mdi mdi-barcode mr-1"></i>
              </Button>
            </div>

            <Message
              v-if="printerMsg"
              :severity="printerMsg.type"
              :closable="true"
              class="mt-4"
              @close="printerMsg = null"
            >
              <strong>{{ printerMsg.text }}</strong>
            </Message>
          </div>
        </div>

        <!-- Notifications -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-border" style="background:#f59e0b08">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#f59e0b,#d97706)"
            >
              <i class="mdi mdi-bell-outline"></i>
            </div>
            <div>
              <h2 class="text-sm font-black m-0">Notifications</h2>
              <p class="text-xs text-muted-foreground m-0">Alert preferences for your shop</p>
            </div>
          </div>
          <div class="p-2 flex flex-col gap-1">
            <div
              v-for="(notif, key) in notificationSettings"
              :key="key"
              class="flex items-center gap-3 p-3 rounded-lg mx-1"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                :style="`background:${notif.color}18`"
              >
                <i class="mdi text-base" :class="notif.icon"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold">{{ notif.label }}</div>
                <div class="text-xs text-muted-foreground">{{ notif.desc }}</div>
              </div>
              <ToggleSwitch :model-value="notif.enabled" @update:model-value="toggleNotif(key)" />
            </div>
          </div>
        </div>

      </div>

      <!-- ── RIGHT: Account & Danger Zone ── -->
      <div class="col-span-12 lg:col-span-4">

        <!-- Account -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-border" style="background:#8b5cf608">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)"
            >
              <i class="mdi mdi-account-outline"></i>
            </div>
            <div>
              <h2 class="text-sm font-black m-0">Account</h2>
              <p class="text-xs text-muted-foreground m-0">Your profile and auth</p>
            </div>
          </div>
          <div class="p-6">
            <div class="bg-muted rounded-xl p-4 mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                  style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                >
                  {{ userInitials }}
                </div>
                <div class="min-w-0">
                  <div class="text-sm font-bold truncate">{{ userEmail }}</div>
                  <div class="text-xs text-muted-foreground truncate">{{ form.businessName || 'NovaOps' }}</div>
                </div>
              </div>
            </div>
            <Button label="Sign Out" severity="danger" variant="outlined" class="w-full text-none" @click="handleSignOut">
              <i class="mdi mdi-logout mr-1"></i>
            </Button>
          </div>
        </div>

        <!-- Data Management -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-border" style="background:#06b6d408">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#06b6d4,#0891b2)"
            >
              <i class="mdi mdi-database-outline"></i>
            </div>
            <div>
              <h2 class="text-sm font-black m-0">Data Management</h2>
              <p class="text-xs text-muted-foreground m-0">Backup and restore your data</p>
            </div>
          </div>
          <div class="p-6 flex flex-col gap-3">
            <Button label="Export All Data" severity="info" variant="outlined" class="w-full text-none" @click="handleExport">
              <i class="mdi mdi-download mr-1"></i>
            </Button>
            <Button label="Import Data" variant="outlined" class="w-full text-none" @click="router.push('/tools')">
              <i class="mdi mdi-upload mr-1"></i>
            </Button>
          </div>
        </div>

        <!-- System Diagnostics -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden">
          <div class="flex items-center gap-3 p-4 border-b border-border" style="background:#3ecf8e08">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a)"
            >
              <i class="mdi mdi-stethoscope"></i>
            </div>
            <div>
              <h2 class="text-sm font-black m-0">System Diagnostics</h2>
              <p class="text-xs text-muted-foreground m-0">Integration health check</p>
            </div>
          </div>
          <div class="p-6">
            <Button label="Run Diagnostics" severity="success" class="w-full text-none mb-4" :loading="isRunningDiag" @click="runDiagnostics">
              <i class="mdi mdi-play-circle-outline mr-1"></i>
            </Button>
            <div v-if="diagResults.length" class="flex flex-col gap-2" style="max-height:300px;overflow-y:auto">
              <Message
                v-for="(res, idx) in diagResults"
                :key="idx"
                :severity="res.status === 'success' ? 'success' : res.status === 'error' ? 'error' : 'info'"
                :closable="false"
              >
                <strong>{{ res.step }}</strong>
                <span v-if="res.message" class="block text-xs mt-0.5">{{ res.message }}</span>
              </Message>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-surface border border-border rounded-xl mb-4 overflow-hidden" style="outline:2px solid #ef444430;outline-offset:0">
          <div class="flex items-center gap-3 p-4 border-b border-border" style="background:#ef444408">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style="background:linear-gradient(135deg,#ef4444,#dc2626)"
            >
              <i class="mdi mdi-alert-outline"></i>
            </div>
            <div>
              <h2 class="text-sm font-black m-0" style="color:#ef4444">Danger Zone</h2>
              <p class="text-xs text-muted-foreground m-0">Irreversible actions</p>
            </div>
          </div>
          <div class="p-6">
            <Button label="Reset All Data" severity="danger" class="w-full text-none" @click="confirmReset">
              <i class="mdi mdi-delete-sweep mr-1"></i>
            </Button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Supabase Connect Dialog ── -->
    <Dialog v-model:visible="showSbModal" modal :draggable="false" class="w-full max-w-[560px] mx-4">
      <template #header>
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
            style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a);box-shadow:0 4px 16px #3ecf8e30"
          >
            <i class="mdi mdi-database-outline"></i>
          </div>
          <div class="flex-1 min-w-0">
            <span class="font-black block">Connect to Supabase</span>
            <span class="text-xs text-muted-foreground">Paste your project URL and anon key from the dashboard</span>
          </div>
          <Button variant="text" size="small" class="text-none shrink-0" @click="showSbModal = false">
            <i class="mdi mdi-close"></i>
          </Button>
        </div>
      </template>
      <Message severity="info" :closable="false" class="mb-5">
        <div class="text-xs">
          <strong>1.</strong> Go to <strong>supabase.com/dashboard</strong> → your project<br>
          <strong>2.</strong> Click <strong>Project Settings → API</strong><br>
          <strong>3.</strong> Copy <strong>Project URL</strong> and <strong>anon / public</strong> key below
        </div>
      </Message>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-muted-foreground uppercase">Project URL</label>
          <InputText
            v-model="sbForm.url"
            type="url"
            placeholder="https://xxxxxxxxxxxx.supabase.co"
            class="w-full rounded-xl"
            style="font-family:monospace"
            autocomplete="off"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-muted-foreground uppercase">Anon / Public Key</label>
          <InputText
            v-model="sbForm.key"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
            class="w-full rounded-xl"
            style="font-family:monospace"
            autocomplete="off"
          />
          <p class="text-[10px] text-muted-foreground m-0">Use the anon key — not the service_role key.</p>
        </div>
        <Message v-if="sbConn.status.error" severity="error" :closable="false">{{ sbConn.status.error }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="showSbModal = false" />
        <Button
          label="Connect &amp; Save"
          severity="success"
          class="text-none"
          :loading="sbConn.status.checking"
          :disabled="!sbForm.url || !sbForm.key"
          @click="handleSbConnect"
        >
          <i class="mdi mdi-database-check mr-1"></i>
        </Button>
      </template>
    </Dialog>

    <!-- ── Supabase Disconnect Confirm ── -->
    <Dialog v-model:visible="confirmSbDisconnect" modal header="Disconnect Supabase?" class="w-full max-w-sm mx-4">
      <div class="flex items-start gap-3 mb-2">
        <div class="w-11 h-11 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
          <i class="mdi mdi-alert-circle-outline text-xl"></i>
        </div>
        <p class="text-sm text-muted-foreground m-0">Your data stays safe in Supabase. You'll need to reconnect to access it again.</p>
      </div>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="confirmSbDisconnect = false" />
        <Button label="Disconnect" severity="danger" variant="outlined" class="text-none" @click="sbConn.disconnect(); confirmSbDisconnect = false" />
      </template>
    </Dialog>

    <!-- ── General Confirm Dialog ── -->
    <Dialog v-model:visible="confirmDialog.open" modal :header="confirmDialog.title" class="w-full max-w-[420px] mx-4">
      <p class="text-sm m-0">{{ confirmDialog.message }}</p>
      <template #footer>
        <Button label="Cancel" variant="text" class="text-none" @click="confirmDialog.open = false" />
        <Button :label="confirmDialog.confirmLabel" severity="danger" class="text-none" @click="confirmDialog.onConfirm()" />
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { definePageMeta, useNuxtApp } from '#imports'
import { storeToRefs } from 'pinia'
import { useAppStore } from '~/stores/app'
import { useSupabaseConnect } from '~/composables/useSupabaseConnect'
import { useToast } from '~/composables/useToast'

// ── Toast ─────────────────────────────────────────────────────────────
const { toast } = useToast()

// ── Supabase Connect ──────────────────────────────────────────────────
const sbConn = useSupabaseConnect()
const showSbModal       = ref(false)
const confirmSbDisconnect = ref(false)
const sbForm = ref({ url: '', key: '' })
const sbUrl  = computed(() => sbConn.url.value)

watch(showSbModal, (open: boolean) => {
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
const route     = useRoute()
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
  pin: '', squareAccessToken: '', squareLocationId: '', squareApplicationId: '', squareSandbox: false,
})

watch(settings, (s: any) => { if (s) form.value = { ...form.value, ...s } }, { immediate: true, deep: true })

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
        'x-square-application-id': form.value.squareApplicationId || '',
        'x-square-sandbox': form.value.squareSandbox ? 'true' : 'false',
      },
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
    Object.assign(settings.value, {
      squareAccessToken: form.value.squareAccessToken,
      squareLocationId: form.value.squareLocationId,
      squareApplicationId: form.value.squareApplicationId,
      squareSandbox: form.value.squareSandbox,
    })
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
  newMessage:  { label: 'Customer email', desc: 'Alert when a customer emails you', color: '#ec4899', icon: 'mdi-email-outline', enabled: notificationPrefs.value.newMessage },
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
  } catch (e) {
    console.warn('[settings] Could not restore printer settings from storage:', e)
  }

  if (route.query.section === 'services') {
    nextTick(() => {
      document.getElementById('settings-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
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
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const safari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg/i.test(ua)
    showPrinterMsg(
      'error',
      safari
        ? 'WebUSB is not available in Safari. Use Chrome or Edge to pair a USB printer, or use Print from receipts/labels (macOS print dialog).'
        : 'WebUSB is not supported in this browser.',
    )
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
  const item = diagResults.value.find((r: any) => r.step === step && r.status === 'pending')
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
      'x-square-location-id': form.value.squareLocationId,
      'x-square-application-id': form.value.squareApplicationId || '',
      'x-square-sandbox': form.value.squareSandbox ? 'true' : 'false',
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
      'x-square-location-id': form.value.squareLocationId,
      'x-square-application-id': form.value.squareApplicationId || '',
      'x-square-sandbox': form.value.squareSandbox ? 'true' : 'false',
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