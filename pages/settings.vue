<template>
  <div class="space-y-8 max-w-6xl">

    <!-- ── Page Header ── -->
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #64748b, #475569)">
        <SettingsIcon class="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 class="text-3xl font-black tracking-tight">Settings</h1>
        <p class="text-sm text-muted-foreground font-medium mt-0.5">Configure your business, integrations, and account</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- ── LEFT: Business + Integrations ── -->
      <div class="lg:col-span-2 space-y-5">

        <!-- Business Info -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #6366f108">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
              <Building class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Business Information</p>
              <p class="text-xs text-muted-foreground font-medium">Your shop's public details and preferences</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="hui-label">Business Name</label>
                <input v-model="form.businessName" placeholder="Your Repair Shop" class="hui-input" />
              </div>
              <div class="space-y-2">
                <label class="hui-label">Phone</label>
                <input v-model="form.phone" placeholder="(555) 123-4567" class="hui-input" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="hui-label">Email</label>
              <input v-model="form.email" type="email" placeholder="contact@yourshop.com" class="hui-input" />
            </div>
            <div class="space-y-2">
              <label class="hui-label">Address</label>
              <textarea v-model="form.address" :rows="2" placeholder="123 Main St, City, State ZIP" class="hui-input resize-none" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="hui-label">Currency Symbol</label>
                <input v-model="form.currency" placeholder="$" class="hui-input" />
              </div>
              <div class="space-y-2">
                <label class="hui-label">Tax Rate (%)</label>
                <input v-model.number="form.taxRate" type="number" step="0.01" placeholder="0.00" class="hui-input" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="hui-label">Ticket Statuses</label>
              <input v-model="form.statuses" placeholder="Open, In Progress, Waiting for Parts, Completed, Delivered" class="hui-input" />
              <p class="text-xs text-muted-foreground font-medium">Separate each status with a comma</p>
            </div>
            <div class="space-y-2">
              <label class="hui-label">Screen Lock PIN</label>
              <input v-model="form.pin" type="password" maxlength="4" placeholder="4-digit PIN" class="hui-input w-[160px] font-mono tracking-widest" />
              <p class="text-xs text-muted-foreground font-medium">Screen locks after 3 minutes of inactivity</p>
            </div>
            <div class="pt-4 border-t border-divider flex items-center gap-4">
              <button @click="saveSettings" :disabled="saving" class="hui-btn hui-btn-solid-primary hui-btn-md flex items-center gap-2.5 h-12 px-7 rounded-full text-sm font-black text-white disabled:opacity-50">
                <div v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <Save v-else class="w-4 h-4" />
                {{ saving ? 'Saving…' : 'Save Business Settings' }}
              </button>
              <Transition name="save-msg">
                <div v-if="saveMsg" class="flex items-center gap-2 text-sm font-bold" :style="saveMsg.ok ? 'color:#10b981' : 'color:#ef4444'">
                  <CheckCircle v-if="saveMsg.ok" class="w-4 h-4" />
                  <AlertCircle v-else class="w-4 h-4" />
                  {{ saveMsg.text }}
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- ── Services Management ── -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #10b98108">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #10b981, #059669)">
              <Wrench class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Services</p>
              <p class="text-xs text-muted-foreground font-medium">Manage your repair services and pricing</p>
            </div>
            <button @click="showServiceForm = !showServiceForm"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
              style="background: #10b98118; color: #10b981">
              <Plus class="w-3 h-3" />
              Add Service
            </button>
          </div>
          <div class="p-6 space-y-4">
            <!-- Add / Edit Form -->
            <Transition name="save-msg">
              <div v-if="showServiceForm" class="rounded-xl p-5 space-y-4" style="background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.6); outline-offset: 0">
                <p class="text-xs font-black text-muted-foreground uppercase tracking-widest">{{ editingServiceId ? 'Edit Service' : 'New Service' }}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <label class="hui-label">Name</label>
                    <input v-model="serviceForm.name" placeholder="Screen Replacement" class="hui-input" style="height:40px;font-size:13px" />
                  </div>
                  <div class="space-y-1.5">
                    <label class="hui-label">Category</label>
                    <input v-model="serviceForm.category" placeholder="Repairs" class="hui-input" style="height:40px;font-size:13px" />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <label class="hui-label">Price</label>
                    <input v-model.number="serviceForm.price" type="number" step="0.01" placeholder="0.00" class="hui-input" style="height:40px;font-size:13px" />
                  </div>
                  <div class="space-y-1.5">
                    <label class="hui-label">Est. Minutes</label>
                    <input v-model.number="serviceForm.estimated_minutes" type="number" placeholder="30" class="hui-input" style="height:40px;font-size:13px" />
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="hui-label">Description</label>
                  <input v-model="serviceForm.description" placeholder="Brief description" class="hui-input" style="height:40px;font-size:13px" />
                </div>
                <div class="flex items-center gap-3">
                  <button @click="handleSaveService" :disabled="!serviceForm.name || savingService"
                    class="flex items-center gap-2 h-10 px-5 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    style="background: linear-gradient(135deg, #10b981, #059669)">
                    <div v-if="savingService" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <Save v-else class="w-3.5 h-3.5" />
                    {{ editingServiceId ? 'Update' : 'Add' }}
                  </button>
                  <button @click="cancelServiceEdit" class="h-10 px-4 rounded-full text-sm font-bold transition-all hover:scale-[1.02]" style="background: hsl(var(--muted)/0.6)">Cancel</button>
                </div>
              </div>
            </Transition>

            <!-- Services List -->
            <div v-if="svcList.length === 0 && !showServiceForm" class="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <Wrench class="w-6 h-6 opacity-40" />
              <p class="text-sm font-bold">No services yet</p>
              <p class="text-xs">Add your first service above</p>
            </div>
            <div v-else class="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              <div v-for="svc in svcList" :key="svc.id"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-muted/30"
                style="background: hsl(var(--muted)/0.2)">
                <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #10b98114">
                  <Wrench class="w-4 h-4" style="color: #10b981" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold truncate">{{ svc.name }}</p>
                  <p class="text-[11px] text-muted-foreground font-medium">
                    {{ svc.category || 'Services' }}
                    <span v-if="svc.estimated_minutes" class="ml-1">· {{ svc.estimated_minutes }} min</span>
                  </p>
                </div>
                <span class="text-sm font-black flex-shrink-0" style="color: #10b981">{{ form.currency }}{{ Number(svc.price || 0).toFixed(2) }}</span>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button @click="editService(svc)" class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90">
                    <Pencil class="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button @click="handleDeleteService(svc.id)" class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/10 transition-all hover:scale-110 active:scale-90">
                    <Trash2 class="w-3 h-3 text-red-500/70" />
                  </button>
                </div>
              </div>
            </div>

            <Transition name="save-msg">
              <div v-if="serviceMsg" class="flex items-center gap-2 text-sm font-bold" :style="serviceMsg.ok ? 'color:#10b981' : 'color:#ef4444'">
                <CheckCircle v-if="serviceMsg.ok" class="w-4 h-4" />
                <AlertCircle v-else class="w-4 h-4" />
                {{ serviceMsg.text }}
              </div>
            </Transition>
          </div>
        </div>

        <!-- ── Expenses Management ── -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #ef444408">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #ef4444, #dc2626)">
              <DollarSign class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Expenses</p>
              <p class="text-xs text-muted-foreground font-medium">Track business overhead and recurring costs</p>
            </div>
            <button @click="showExpenseForm = !showExpenseForm"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
              style="background: #ef444418; color: #ef4444">
              <Plus class="w-3 h-3" />
              Add Expense
            </button>
          </div>
          <div class="p-6 space-y-4">
            <!-- Add Form -->
            <Transition name="save-msg">
              <div v-if="showExpenseForm" class="rounded-xl p-5 space-y-4" style="background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.6); outline-offset: 0">
                <p class="text-xs font-black text-muted-foreground uppercase tracking-widest">New Expense</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <label class="hui-label">Description</label>
                    <input v-model="expenseForm.description" placeholder="Rent, Insurance, etc." class="hui-input" style="height:40px;font-size:13px" />
                  </div>
                  <div class="space-y-1.5">
                    <label class="hui-label">Amount</label>
                    <input v-model.number="expenseForm.amount" type="number" step="0.01" placeholder="0.00" class="hui-input" style="height:40px;font-size:13px" />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <label class="hui-label">Category</label>
                    <select v-model="expenseForm.category" class="hui-input" style="height:40px;font-size:13px">
                      <option value="Overhead">Overhead</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Software">Software</option>
                      <option value="Labor">Labor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div class="space-y-1.5">
                    <label class="hui-label">Date</label>
                    <input v-model="expenseForm.date" type="date" class="hui-input" style="height:40px;font-size:13px" />
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <button @click="handleAddExpense" :disabled="!expenseForm.description || !expenseForm.amount || savingExpense"
                    class="flex items-center gap-2 h-10 px-5 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    style="background: linear-gradient(135deg, #ef4444, #dc2626)">
                    <div v-if="savingExpense" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <Save v-else class="w-3.5 h-3.5" />
                    Add Expense
                  </button>
                  <button @click="showExpenseForm = false; resetExpenseForm()" class="h-10 px-4 rounded-full text-sm font-bold transition-all hover:scale-[1.02]" style="background: hsl(var(--muted)/0.6)">Cancel</button>
                </div>
              </div>
            </Transition>

            <!-- Expenses List -->
            <div v-if="expensesList.length === 0 && !showExpenseForm" class="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <DollarSign class="w-6 h-6 opacity-40" />
              <p class="text-sm font-bold">No expenses logged</p>
              <p class="text-xs">Track your business costs here</p>
            </div>
            <div v-else class="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              <div v-for="exp in expensesList" :key="exp.id"
                class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-muted/30"
                style="background: hsl(var(--muted)/0.2)">
                <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: #ef444414">
                  <DollarSign class="w-4 h-4" style="color: #ef4444" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold truncate">{{ exp.description }}</p>
                  <p class="text-[11px] text-muted-foreground font-medium">
                    {{ exp.category }}
                    <span v-if="exp.date" class="ml-1">· {{ exp.date }}</span>
                  </p>
                </div>
                <span class="text-sm font-black flex-shrink-0" style="color: #ef4444">{{ form.currency }}{{ Number(exp.amount || 0).toFixed(2) }}</span>
                <button @click="handleDeleteExpense(exp.id)" class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/10 transition-all hover:scale-110 active:scale-90 flex-shrink-0">
                  <Trash2 class="w-3 h-3 text-red-500/70" />
                </button>
              </div>
            </div>

            <Transition name="save-msg">
              <div v-if="expenseMsg" class="flex items-center gap-2 text-sm font-bold" :style="expenseMsg.ok ? 'color:#10b981' : 'color:#ef4444'">
                <CheckCircle v-if="expenseMsg.ok" class="w-4 h-4" />
                <AlertCircle v-else class="w-4 h-4" />
                {{ expenseMsg.text }}
              </div>
            </Transition>
          </div>
        </div>


        <!-- ── Supabase Connection ── -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #3ecf8e08">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #3ecf8e, #1a9e6a)">
              <Database class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Supabase Database</p>
              <p class="text-xs text-muted-foreground font-medium">Your live data backend — tickets, customers, inventory</p>
            </div>
            <!-- Status pill -->
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              :style="sbConn.status.connected
                ? 'background:#3ecf8e18;color:#1a9e6a;outline:1.5px solid #3ecf8e28;outline-offset:0'
                : sbConn.hasCredentials.value
                  ? 'background:#f59e0b18;color:#d97706;outline:1.5px solid #f59e0b28;outline-offset:0'
                  : 'background:#ef444418;color:#ef4444;outline:1.5px solid #ef444428;outline-offset:0'"
            >
              <div class="w-1.5 h-1.5 rounded-full"
                :style="sbConn.status.connected ? 'background:#3ecf8e' : sbConn.hasCredentials.value ? 'background:#f59e0b;animation:ping 1s cubic-bezier(0,0,0.2,1) infinite' : 'background:#ef4444'" />
              {{ sbConn.status.connected ? `Connected · ${sbConn.projectRef.value}` : sbConn.hasCredentials.value ? 'Credentials saved' : 'Not connected' }}
            </div>
          </div>

          <div class="p-6 space-y-5">

            <!-- Connected state -->
            <div v-if="sbConn.status.connected" class="flex items-center gap-4 p-4 rounded-xl" style="background:#3ecf8e10;outline:1.5px solid #3ecf8e28;outline-offset:0">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#3ecf8e20">
                <CheckCircle class="w-5 h-5" style="color:#3ecf8e" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-black" style="color:#1a9e6a">Connected to Supabase</p>
                <p class="text-xs text-muted-foreground font-mono truncate">{{ sbUrl }}</p>
              </div>
              <button @click="showSbModal = true"
                class="h-9 px-4 rounded-full text-xs font-bold transition-all hover:scale-[1.03] active:scale-95"
                style="background:#3ecf8e14;color:#1a9e6a;outline:1.5px solid #3ecf8e28;outline-offset:0">
                Change
              </button>
            </div>

            <!-- Not connected / setup prompt -->
            <div v-else>
              <div class="rounded-xl p-5 flex flex-col gap-4" style="background:hsl(var(--muted)/0.4);outline:1.5px solid hsl(var(--border)/0.6);outline-offset:0">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5" style="background:#3ecf8e20">
                    <Database class="w-4 h-4" style="color:#3ecf8e" />
                  </div>
                  <div>
                    <p class="text-sm font-black">Connect your Supabase project</p>
                    <p class="text-xs text-muted-foreground font-medium mt-0.5 leading-relaxed">
                      NovaOps stores all your repair shop data in your own private Supabase database.
                      Create a free project at <span class="font-bold" style="color:#3ecf8e">supabase.com</span> then paste your credentials here.
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
                    class="flex items-center gap-2 h-10 px-5 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-95"
                    style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a);box-shadow:0 4px 16px #3ecf8e30">
                    <ExternalLink class="w-4 h-4" />
                    Open Supabase
                  </a>
                  <button @click="showSbModal = true"
                    class="flex items-center gap-2 h-10 px-5 rounded-full text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
                    style="background:#3ecf8e14;color:#1a9e6a;outline:1.5px solid #3ecf8e28;outline-offset:0">
                    <Link class="w-4 h-4" />
                    Enter Credentials
                  </button>
                </div>
              </div>
            </div>

            <!-- Disconnect link -->
            <div v-if="sbConn.hasCredentials.value" class="flex items-center gap-2 pt-1">
              <button @click="confirmSbDisconnect = true"
                class="text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1.5">
                <X class="w-3 h-3" /> Disconnect Supabase
              </button>
            </div>
          </div>
        </div>

        <!-- ── Supabase Connect Modal ── -->
        <Teleport to="body">
          <!-- Disconnect confirm -->
          <Transition name="overlay">
            <div v-if="confirmSbDisconnect" class="fixed inset-0 z-[100] flex items-center justify-center p-4" style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px)">
              <div class="w-full max-w-sm rounded-2xl bg-content1 p-7 flex flex-col gap-5 shadow-2xl" style="outline:2px solid hsl(var(--border)/0.6);outline-offset:0;animation:sbModalEnter 0.3s cubic-bezier(0.34,1.3,0.64,1) both">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#ef444420">
                    <AlertCircle class="w-5 h-5" style="color:#ef4444" />
                  </div>
                  <div>
                    <p class="text-sm font-black">Disconnect Supabase?</p>
                    <p class="text-xs text-muted-foreground font-medium mt-0.5">Your data stays safe in Supabase. You'll need to reconnect to access it again.</p>
                  </div>
                </div>
                <div class="flex gap-3">
                  <button @click="confirmSbDisconnect = false" class="flex-1 h-11 rounded-full text-sm font-bold border-2" style="border-color:hsl(var(--border))">Cancel</button>
                  <button @click="sbConn.disconnect(); confirmSbDisconnect = false"
                    class="flex-1 h-11 rounded-full text-sm font-bold text-white" style="background:#ef4444">
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Connect modal -->
          <Transition name="overlay">
            <div v-if="showSbModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" style="background:rgba(0,0,0,0.55);backdrop-filter:blur(10px)" @click.self="showSbModal = false">
              <div class="w-full max-w-lg rounded-3xl bg-content1 flex flex-col shadow-2xl overflow-hidden" style="outline:2px solid hsl(var(--border)/0.6);outline-offset:0;animation:sbModalEnter 0.35s cubic-bezier(0.34,1.3,0.64,1) both">

                <!-- Header -->
                <div class="flex items-center gap-4 px-7 pt-7 pb-5 border-b border-border/50" style="background:#3ecf8e06">
                  <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a);box-shadow:0 4px 16px #3ecf8e30">
                    <Database class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex-1">
                    <h2 class="text-base font-black">Connect to Supabase</h2>
                    <p class="text-xs text-muted-foreground font-medium mt-0.5">Paste your project URL and anon key from the Supabase dashboard</p>
                  </div>
                  <button class="w-8 h-8 rounded-2xl flex items-center justify-center hover:bg-muted/60 transition-all hover:scale-110 active:scale-90 text-muted-foreground" @click="showSbModal = false">
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <div class="p-7 space-y-5">

                  <!-- Step guide -->
                  <div class="rounded-xl p-4 space-y-2.5" style="background:hsl(var(--muted)/0.4)">
                    <p class="text-xs font-black text-muted-foreground uppercase tracking-widest">Where to find these</p>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                        <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style="background:#3ecf8e20;color:#1a9e6a">1</span>
                        Go to <span class="font-bold text-foreground">supabase.com/dashboard</span> → your project
                      </div>
                      <div class="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                        <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style="background:#3ecf8e20;color:#1a9e6a">2</span>
                        Click <span class="font-bold text-foreground">Project Settings → API</span>
                      </div>
                      <div class="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                        <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style="background:#3ecf8e20;color:#1a9e6a">3</span>
                        Copy <span class="font-bold text-foreground">Project URL</span> and <span class="font-bold text-foreground">anon / public</span> key below
                      </div>
                    </div>
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-xs font-bold mt-1 transition-colors" style="color:#3ecf8e">
                      <ExternalLink class="w-3 h-3" /> Open Supabase Dashboard
                    </a>
                  </div>

                  <!-- URL field -->
                  <div class="space-y-2">
                    <label class="hui-label">Project URL</label>
                    <input v-model="sbForm.url" type="url" placeholder="https://xxxxxxxxxxxx.supabase.co" class="hui-input font-mono text-xs"
                      autocomplete="off" spellcheck="false" />
                  </div>

                  <!-- Key field -->
                  <div class="space-y-2">
                    <label class="hui-label">Anon / Public Key</label>
                    <input v-model="sbForm.key" type="password" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" class="hui-input font-mono text-xs"
                      autocomplete="off" spellcheck="false" />
                    <p class="text-[11px] text-muted-foreground font-medium">Use the <strong>anon</strong> key — not the service_role key.</p>
                  </div>

                  <!-- Error -->
                  <div v-if="sbConn.status.error" class="flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-semibold"
                    style="background:#ef444412;color:#ef4444;outline:1.5px solid #ef444428;outline-offset:0">
                    <AlertCircle class="w-4 h-4 flex-shrink-0" />
                    {{ sbConn.status.error }}
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-3 pt-1">
                    <button @click="handleSbConnect" :disabled="sbConn.status.checking || !sbForm.url || !sbForm.key"
                      class="flex-1 h-12 rounded-full text-sm font-black text-white flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-98"
                      style="background:linear-gradient(135deg,#3ecf8e,#1a9e6a);box-shadow:0 4px 16px #3ecf8e30">
                      <div v-if="sbConn.status.checking" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <Database v-else class="w-4 h-4" />
                      {{ sbConn.status.checking ? 'Testing connection…' : 'Connect & Save' }}
                    </button>
                    <button @click="showSbModal = false" class="h-12 px-5 rounded-full text-sm font-bold border-2 transition-all hover:scale-[1.02]" style="border-color:hsl(var(--border))">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>

        <!-- ── Square Integration ── -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #10b98108">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #10b981, #059669)">
              <CreditCard class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Square Terminal Integration</p>
              <p class="text-xs text-muted-foreground font-medium">Connect your Square account and pair a physical terminal</p>
            </div>
            <!-- Live connection status pill -->
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              :style="squareStatus === 'connected'
                ? 'background:#10b98118;color:#10b981;outline:1.5px solid #10b98128;outline-offset:0'
                : squareStatus === 'checking'
                ? 'background:#f59e0b18;color:#f59e0b;outline:1.5px solid #f59e0b28;outline-offset:0'
                : 'background:#ef444418;color:#ef4444;outline:1.5px solid #ef444428;outline-offset:0'"
            >
              <div class="w-1.5 h-1.5 rounded-full animate-pulse"
                :style="squareStatus === 'connected' ? 'background:#10b981'
                  : squareStatus === 'checking' ? 'background:#f59e0b'
                  : 'background:#ef4444'" />
              {{ squareStatus === 'connected' ? 'Connected' : squareStatus === 'checking' ? 'Checking…' : 'Disconnected' }}
            </div>
          </div>

          <div class="p-6 space-y-5">

            <!-- Credentials (server-side only — user enters for persistence) -->
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="hui-label">Square Access Token</label>
                <input v-model="form.squareAccessToken" type="password" placeholder="EAAAl…" class="hui-input font-mono text-xs"
                  autocomplete="off" @blur="debouncedSquareCheck" />
                <p class="text-xs text-muted-foreground font-medium">Stored securely — never sent to the browser after save</p>
              </div>
              <div class="space-y-2">
                <label class="hui-label">Location ID</label>
                <input v-model="form.squareLocationId" placeholder="L1234…" class="hui-input font-mono text-xs"
                  @blur="debouncedSquareCheck" />
              </div>
              <div class="flex items-center justify-between p-4 rounded-xl" style="background: hsl(var(--muted)/0.3)">
                <div>
                  <p class="text-sm font-bold">Use Square Sandbox</p>
                  <p class="text-xs text-muted-foreground font-medium">Test mode — use sandbox credentials</p>
                </div>
                <button class="hui-toggle" :class="{ 'active': form.squareSandbox }" @click="form.squareSandbox = !form.squareSandbox; debouncedSquareCheck()">
                  <span class="hui-toggle-thumb">
                    <component :is="form.squareSandbox ? Check : X" class="w-3 h-3" />
                  </span>
                </button>
              </div>

              <!-- Connection test result -->
              <div v-if="squareTestMsg" class="flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-semibold"
                :style="squareStatus === 'connected'
                  ? 'background:#10b98112;color:#10b981;outline:1.5px solid #10b98128;outline-offset:0'
                  : 'background:#ef444412;color:#ef4444;outline:1.5px solid #ef444428;outline-offset:0'">
                <CheckCircle v-if="squareStatus === 'connected'" class="w-4 h-4 flex-shrink-0" />
                <AlertCircle v-else class="w-4 h-4 flex-shrink-0" />
                {{ squareTestMsg }}
              </div>

              <div class="flex items-center gap-3">
                <button @click="saveSquareSettings" :disabled="savingSquare"
                  class="hui-btn hui-btn-light hui-btn-md flex items-center gap-2 h-11 px-6 rounded-full text-sm font-bold">
                  <div v-if="savingSquare" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <Save v-else class="w-4 h-4" />
                  {{ savingSquare ? 'Saving…' : 'Save Credentials' }}
                </button>
                <button @click="testSquareConnection" :disabled="squareStatus === 'checking'"
                  class="flex items-center gap-2 h-11 px-5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
                  style="background: #10b98114; color: #10b981; outline: 1.5px solid #10b98128; outline-offset:0">
                  <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': squareStatus === 'checking' }" />
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Web Printing Preferences -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #06b6d408">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #06b6d4, #0891b2)">
              <Printer class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Printing & Barcodes</p>
              <p class="text-xs text-muted-foreground font-medium">Receipt and barcode label settings</p>
            </div>
          </div>
          <div class="p-6 space-y-6">

            <!-- Zadig Setup Instructions -->
            <div class="rounded-xl p-5 space-y-3" style="background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.6); outline-offset: 0">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5" style="background: #06b6d420">
                  <Printer class="w-4 h-4" style="color: #06b6d4" />
                </div>
                <div>
                  <p class="text-sm font-black">Windows USB Setup Instructions</p>
                  <p class="text-xs text-muted-foreground font-medium mt-0.5 leading-relaxed">
                    By default, Windows blocks apps from talking directly to USB printers. Follow these steps once to fix it:
                  </p>
                </div>
              </div>
              <div class="space-y-3 mt-2 text-xs font-medium text-muted-foreground pl-11">
                <div class="space-y-0.5">
                  <p class="text-foreground font-bold">1. Download Zadig</p>
                  <p>Go to the official site <a href="https://zadig.akeo.ie" target="_blank" class="text-blue-500 hover:underline">zadig.akeo.ie</a> and download the latest version (portable, no install needed).</p>
                </div>
                <div class="space-y-0.5">
                  <p class="text-foreground font-bold">2. Connect Your Printer</p>
                  <p>Plug your USB thermal printer into your computer. Make sure it's powered on and detected by Windows.</p>
                </div>
                <div class="space-y-0.5">
                  <p class="text-foreground font-bold">3. Run Zadig</p>
                  <p>Launch Zadig.exe as Administrator (right-click -> Run as administrator). From the Options menu, select "List All Devices". Find your printer in the dropdown.</p>
                </div>
                <div class="space-y-0.5">
                  <p class="text-foreground font-bold">4. Replace the Driver</p>
                  <p>With the printer selected, choose <strong>WinUSB</strong> on the right side and click "Replace Driver" or "Install Driver". Wait for the success message.</p>
                  <div class="mt-2 p-3 rounded-xl flex items-start gap-2 text-[11px]" style="background: #f59e0b18; color: #d97706">
                    <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <p><strong>Important:</strong> This detaches the standard Windows printer driver and replaces it with WinUSB. After this, the printer will no longer work with standard Windows printing — it will only work via WebUSB from your app.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Default Thermal Printer Setup -->
            <div class="flex flex-col gap-3 p-4 rounded-2xl" style="background: hsl(var(--muted)/0.3); outline: 1.5px solid hsl(var(--border)/0.5)">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: #10b98118">
                    <Receipt class="w-4 h-4" style="color: #10b981" />
                  </div>
                  <div>
                    <p class="text-sm font-bold">Default Thermal Printer</p>
                    <p class="text-xs text-muted-foreground font-medium mt-0.5" v-if="!pairedThermalPrinter">No device linked</p>
                  </div>
                </div>
                <button v-if="!pairedThermalPrinter" @click="pairUSBPrinter('thermal')" class="hui-btn hui-btn-solid-primary hui-btn-md h-8 px-4 rounded-full text-xs font-bold text-white transition-all hover:scale-105">Pair a Device</button>
              </div>
              
              <div v-if="pairedThermalPrinter" class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl" style="background: hsl(var(--background)); outline: 1px solid hsl(var(--border)/0.5)">
                <div class="flex items-start gap-3">
                  <p class="text-xs font-bold mt-0.5">1.</p>
                  <div>
                    <p class="text-sm font-bold">{{ pairedThermalPrinter.productName || 'USB Printer' }}</p>
                    <p class="text-[11px] text-muted-foreground mt-0.5 font-mono">Serial Number: {{ pairedThermalPrinter.serialNumber || 'Unknown' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 align-self-end">
                  <button @click="pairUSBPrinter('thermal')" class="hui-btn hui-btn-light hui-btn-md h-8 px-4 rounded-full text-[11px] font-bold">Link Printer</button>
                  <button @click="removeUSBPrinter('thermal')" class="text-[11px] font-bold text-red-500 hover:underline">Remove device</button>
                </div>
              </div>
            </div>

            <!-- Default Label Printer Setup -->
            <div class="flex flex-col gap-3 p-4 rounded-2xl" style="background: hsl(var(--muted)/0.3); outline: 1.5px solid hsl(var(--border)/0.5)">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center" style="background: #06b6d418">
                    <ScanLine class="w-4 h-4" style="color: #06b6d4" />
                  </div>
                  <div>
                    <p class="text-sm font-bold">Default Label Printer</p>
                    <p class="text-xs text-muted-foreground font-medium mt-0.5" v-if="!pairedLabelPrinter">No device linked</p>
                  </div>
                </div>
                <button v-if="!pairedLabelPrinter" @click="pairUSBPrinter('label')" class="hui-btn hui-btn-solid-primary hui-btn-md h-8 px-4 rounded-full text-xs font-bold text-white transition-all hover:scale-105">Pair a Device</button>
              </div>
              
              <div v-if="pairedLabelPrinter" class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl" style="background: hsl(var(--background)); outline: 1px solid hsl(var(--border)/0.5)">
                <div class="flex items-start gap-3">
                  <p class="text-xs font-bold mt-0.5">1.</p>
                  <div>
                    <p class="text-sm font-bold">{{ pairedLabelPrinter.productName || 'USB Printer' }}</p>
                    <p class="text-[11px] text-muted-foreground mt-0.5 font-mono">Serial Number: {{ pairedLabelPrinter.serialNumber || 'Unknown' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 align-self-end">
                  <button @click="pairUSBPrinter('label')" class="hui-btn hui-btn-light hui-btn-md h-8 px-4 rounded-full text-[11px] font-bold">Link Printer</button>
                  <button @click="removeUSBPrinter('label')" class="text-[11px] font-bold text-red-500 hover:underline">Remove device</button>
                </div>
              </div>
            </div>

            <!-- Receipt & Barcode Options -->
            <div class="pt-4 border-t border-divider space-y-4">
              <div class="flex items-center justify-between mt-2">
                <div>
                  <p class="text-sm font-bold">Auto-Print Receipts</p>
                  <p class="text-xs text-muted-foreground font-medium mt-0.5">Prompt to print receipt after POS checkout</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="printerSettings.autoPrintReceipt" class="sr-only peer" @change="savePrinterSettings" />
                  <div class="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <button class="hui-btn hui-btn-light hui-btn-md h-10 px-5 rounded-full text-xs font-bold w-full max-w-[200px]" @click="testReceiptPrint">Test Receipt Print</button>

              <div class="flex items-center justify-between pt-4 border-t border-divider text-foreground">
                <div>
                  <p class="text-sm font-bold">Auto-Print Barcode Labels</p>
                  <p class="text-xs text-muted-foreground font-medium mt-0.5">Prompt to print barcode label when a ticket is created</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="printerSettings.autoPrintBarcode" class="sr-only peer" @change="savePrinterSettings" />
                  <div class="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
              <button class="hui-btn hui-btn-light hui-btn-md h-10 px-5 rounded-full text-xs font-bold w-full max-w-[200px]" @click="testBarcodePrint">Test Label Print</button>
            </div>
            
            <div v-if="printerMsg" class="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold mt-4"
              :style="printerMsg.type === 'success' ? 'background:#10b98114;color:#10b981' : 'background:#ef444414;color:#ef4444'">
              <CheckCircle v-if="printerMsg.type === 'success'" class="w-3.5 h-3.5" />
              <AlertCircle v-else class="w-3.5 h-3.5" />
              {{ printerMsg.text }}
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #f59e0b08">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
              <Bell class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Notifications</p>
              <p class="text-xs text-muted-foreground font-medium">Alert preferences for your shop</p>
            </div>
          </div>
          <div class="p-3">
            <div v-for="(notif, key) in notificationSettings" :key="key" class="flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-muted/20 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0" :style="`background: ${notif.color}18`">
                  <component :is="notif.icon" class="w-4 h-4" :style="`color: ${notif.color}`" />
                </div>
                <div>
                  <p class="text-sm font-bold">{{ notif.label }}</p>
                  <p class="text-xs text-muted-foreground font-medium">{{ notif.desc }}</p>
                </div>
              </div>
              <button class="hui-toggle" :class="{ 'active': notif.enabled }" @click="toggleNotif(key)">
                <span class="hui-toggle-thumb">
                  <component :is="notif.enabled ? Check : X" class="w-3 h-3" />
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- ── RIGHT: Account & danger zone ── -->
      <div class="space-y-5">

        <!-- Account info -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #8b5cf608">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
              <User class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Account</p>
              <p class="text-xs text-muted-foreground font-medium">Your profile and auth</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3 p-4 rounded-xl" style="background: hsl(var(--muted)/0.3)">
              <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
                {{ userInitials }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold truncate">{{ userEmail }}</p>
                <p class="text-xs text-muted-foreground font-medium truncate">{{ form.businessName || 'NovaOps' }}</p>
              </div>
            </div>
            <button @click="handleSignOut" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style="background: #ef444414; color: #ef4444; outline: 2px solid #ef444428; outline-offset: 0">
              <LogOut class="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <!-- Data Management -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #06b6d408">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #06b6d4, #0891b2)">
              <Database class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black">Data Management</p>
              <p class="text-xs text-muted-foreground font-medium">Backup and restore your data</p>
            </div>
          </div>
          <div class="p-6 space-y-3">
            <button @click="handleExport" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style="background: #06b6d414; color: #06b6d4; outline: 2px solid #06b6d428; outline-offset: 0">
              <Download class="w-4 h-4" /> Export All Data
            </button>
            <button @click="router.push('/import')" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style="background: hsl(var(--muted)/0.5); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
              <Upload class="w-4 h-4" /> Import Data
            </button>
          </div>
        </div>

        <!-- System Diagnostics -->
        <div class="hui-card">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #3ecf8e08">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #3ecf8e, #1a9e6a)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v8"/><path d="M16 2v0"/><path d="m16 2 4 4"/><path d="m20 2-4 4"/><path d="M18 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/></svg>
            </div>
            <div>
              <p class="text-sm font-black">System Diagnostics</p>
              <p class="text-xs text-muted-foreground font-medium">Integration health check</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <button @click="runDiagnostics" :disabled="isRunningDiag" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 text-white disabled:opacity-50" style="background: linear-gradient(135deg, #3ecf8e, #1a9e6a); box-shadow: 0 4px 16px #3ecf8e40">
              <svg v-if="isRunningDiag" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ isRunningDiag ? 'Running Tests...' : 'Run Diagnostics' }}
            </button>
            <div v-if="diagResults.length > 0" class="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
              <div v-for="(res, idx) in diagResults" :key="idx" class="p-3 rounded-2xl text-xs" :style="res.status === 'success' ? 'background:#10b98110; border: 1px solid #10b98120' : res.status === 'error' ? 'background:#ef444410; border: 1px solid #ef444420' : 'background:hsl(var(--muted)/0.5)'">
                <div class="flex items-start gap-2">
                  <span class="mt-0.5">
                    <svg v-if="res.status === 'pending'" class="animate-spin w-3 h-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <CheckCircle v-else-if="res.status === 'success'" class="w-3 h-3 text-green-500" />
                    <AlertCircle v-else class="w-3 h-3 text-red-500" />
                  </span>
                  <div class="flex-1">
                    <p class="font-bold mb-0.5" :class="{'text-green-500': res.status==='success', 'text-red-500': res.status==='error', 'text-blue-400': res.status==='pending'}">{{ res.step }}</p>
                    <p v-if="res.message" class="text-muted-foreground leading-snug">{{ res.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="hui-card" style="outline-color: #ef444430 !important">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-divider" style="background: #ef444408">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, #ef4444, #dc2626)">
              <AlertTriangle class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-black" style="color: #ef4444">Danger Zone</p>
              <p class="text-xs text-muted-foreground font-medium">Irreversible actions</p>
            </div>
          </div>
          <div class="p-6">
            <button @click="confirmReset" class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 text-white" style="background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 16px #ef444440">
              <Trash2 class="w-4 h-4" /> Reset All Data
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Confirm Dialog ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmDialog.open" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(6px)" @click.self="confirmDialog.open = false">
          <div class="rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl" style="background: hsl(var(--card)); outline: 2px solid #ef444430; outline-offset: 0">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style="background: linear-gradient(135deg, #ef4444, #dc2626)">
              <AlertTriangle class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-lg font-black text-center mb-2">{{ confirmDialog.title }}</h3>
            <p class="text-sm text-muted-foreground text-center font-medium mb-7">{{ confirmDialog.message }}</p>
            <div class="flex gap-3">
              <button class="flex-1 h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02] active:scale-95" style="background: hsl(var(--muted)/0.6); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0" @click="confirmDialog.open = false">Cancel</button>
              <button class="flex-1 h-11 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95" style="background: linear-gradient(135deg, #ef4444, #dc2626)" @click="confirmDialog.onConfirm(); confirmDialog.open = false">{{ confirmDialog.confirmLabel }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import {
  Settings as SettingsIcon, Building, CreditCard, Bell, User, Database,
  AlertTriangle, Trash2, Save, Download, Upload, LogOut, Check, X,
  TicketCheck, ShoppingCart, UserPlus, Calendar, Link, ExternalLink,
  Printer, XCircle, RefreshCw, ScanLine, Receipt, CheckCircle, AlertCircle,
  MonitorSmartphone, Tablet, MessageCircle,
  Plus, Pencil, Wrench, DollarSign,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

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
    saveMsg.value = { ok: true, text: 'Saved!' }
  } catch (err: any) {
    const msg = err?.message || err?.data?.message || JSON.stringify(err) || 'Save failed'
    console.error('[Settings] Save failed:', err)
    saveMsg.value = { ok: false, text: msg }
  } finally {
    saving.value = false
  }
  if (saveMsgTimer) clearTimeout(saveMsgTimer)
  saveMsgTimer = setTimeout(() => { saveMsg.value = null }, 3000)
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
    } else {
      await appStore.createService({ ...serviceForm.value })
      showServiceMsg(true, 'Service added')
    }
    cancelServiceEdit()
  } catch (e: any) {
    showServiceMsg(false, e.message || 'Failed to save service')
  }
  savingService.value = false
}

async function handleDeleteService(id: number) {
  try {
    await appStore.deleteService(id)
    showServiceMsg(true, 'Service deleted')
  } catch (e: any) {
    showServiceMsg(false, e.message || 'Failed to delete')
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
    resetExpenseForm()
    showExpenseForm.value = false
  } catch (e: any) {
    showExpenseMsg(false, e.message || 'Failed to save expense')
  }
  savingExpense.value = false
}

async function handleDeleteExpense(id: number) {
  try {
    await appStore.deleteExpense(id)
    showExpenseMsg(true, 'Expense deleted')
  } catch (e: any) {
    showExpenseMsg(false, e.message || 'Failed to delete')
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
  newTicket:   { label: 'New Ticket',    desc: 'Alert when a ticket is created',  color: '#f59e0b', icon: TicketCheck,  enabled: notificationPrefs.value.newTicket },
  newSale:     { label: 'New Sale',      desc: 'Alert when POS sale completes',   color: '#10b981', icon: ShoppingCart, enabled: notificationPrefs.value.newSale },
  newCustomer: { label: 'New Customer',  desc: 'Alert when customer is added',    color: '#3b82f6', icon: UserPlus,     enabled: notificationPrefs.value.newCustomer },
  appointment: { label: 'Appointments', desc: 'Alert for upcoming appointments', color: '#8b5cf6', icon: Calendar,     enabled: notificationPrefs.value.appointment },
  newMessage:  { label: 'New Message',   desc: 'Alert when a customer emails you', color: '#ec4899', icon: MessageCircle, enabled: notificationPrefs.value.newMessage },
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
.hui-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.5rem; }
.hui-card {
  border-radius: 32px;
  overflow: hidden;
  background: hsl(var(--card));
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
}
.hui-input { width:100%;height:48px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:500;background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));outline:none;transition:all 0.2s ease; }
.hui-input:focus { border-color: hsl(var(--primary)/0.5); box-shadow: 0 0 0 3px hsl(var(--primary)/0.12); }
.hui-input.resize-none { height: auto; padding-top: 12px; padding-bottom: 12px; }
.hui-btn hui-btn-solid-primary hui-btn-md {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 20px #6366f140;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.hui-btn hui-btn-solid-primary hui-btn-md:hover  { transform: scale(1.05) translateY(-2px); box-shadow: 0 8px 28px #6366f160; }
.hui-btn hui-btn-solid-primary hui-btn-md:active { transform: scale(0.92); }
.hui-btn hui-btn-light hui-btn-md {
  background: hsl(var(--muted)/0.7);
  outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hui-btn hui-btn-light hui-btn-md:hover  { transform: scale(1.04); }
.hui-btn hui-btn-light hui-btn-md:active { transform: scale(0.94); }
.hui-toggle {
  position: relative; width: 56px; height: 32px; border-radius: 999px;
  background: hsl(var(--muted)); border: 2px solid hsl(var(--border)/0.8);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0; cursor: pointer;
}
.hui-toggle.active { background: #6366f1; border-color: #6366f1; box-shadow: 0 2px 12px #6366f140; }
.hui-toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 22px; height: 22px; border-radius: 50%;
  background: white; display: flex; align-items: center; justify-content: center;
  color: hsl(var(--muted-foreground));
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.hui-toggle.active .hui-toggle-thumb { left: calc(100% - 25px); color: #6366f1; }
.modal-enter-active { animation: modal-in 0.3s cubic-bezier(0.34, 1.3, 0.64, 1); }
.modal-leave-active { animation: modal-out 0.18s ease forwards; }
@keyframes modal-in  { from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes modal-out { to   { opacity: 0; transform: scale(0.96) translateY(6px); } }
.save-msg-enter-active { transition: all 0.25s ease; }
.save-msg-leave-active { transition: all 0.2s ease; }
.save-msg-enter-from  { opacity: 0; transform: translateY(4px); }
.save-msg-leave-to    { opacity: 0; transform: translateY(-4px); }
@keyframes sbModalEnter {
  0%   { opacity: 0; transform: scale(0.9) translateY(16px); }
  65%  { opacity: 1; transform: scale(1.02) translateY(-3px); }
  100% { transform: scale(1) translateY(0); }
}
.overlay-enter-active { transition: opacity 0.2s ease; }
.overlay-leave-active { transition: opacity 0.18s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
</style>
