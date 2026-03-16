<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style="background: hsl(var(--background))">

    <!-- Background glows -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl" style="background: radial-gradient(circle, #8b5cf6, transparent)" />
      <div class="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 blur-3xl" style="background: radial-gradient(circle, #6366f1, transparent)" />
    </div>

    <div class="relative w-full max-w-2xl flex flex-col gap-6" style="animation: registerEnter 0.5s cubic-bezier(0.34,1.3,0.64,1) both">

      <!-- Logo & Title -->
      <div class="flex flex-col items-center gap-4">
        <div class="w-20 h-20 rounded-[32px] flex items-center justify-center shadow-2xl" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); box-shadow: 0 8px 40px #8b5cf660">
          <Zap class="w-9 h-9 text-white" />
        </div>
        <div class="text-center">
          <h1 class="text-3xl font-black tracking-tight">Set Up NovaOps</h1>
          <p class="text-sm text-muted-foreground mt-1 font-medium">Complete all sections to get your shop fully configured</p>
        </div>
      </div>

      <!-- Progress Tracker -->
      <div class="flex items-end justify-between gap-2 px-1">
        <div v-for="(step, i) in steps" :key="i" class="flex-1 flex flex-col items-center gap-1.5">
          <div class="step-node" :class="{
            'step-done': completedSteps.has(i),
            'step-active': currentStep === i,
            'step-pending': currentStep !== i && !completedSteps.has(i)
          }">
            <Check v-if="completedSteps.has(i)" class="w-3.5 h-3.5" />
            <span v-else class="text-xs font-black">{{ i + 1 }}</span>
          </div>
          <span class="text-[9px] font-bold text-center leading-tight" :style="currentStep === i ? 'color: #8b5cf6' : 'color: hsl(var(--muted-foreground))'">{{ step.shortLabel }}</span>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="globalError" class="flex items-center gap-3 p-4 rounded-[20px]" style="background: #ef444414; outline: 2px solid #ef444428; outline-offset: 0">
        <AlertCircle class="w-5 h-5 flex-shrink-0" style="color: #ef4444" />
        <p class="text-sm font-semibold" style="color: #ef4444">{{ globalError }}</p>
      </div>

      <!-- Step Cards Grid -->
      <div class="flex flex-col gap-3">

        <!-- ── STEP 0: Account Credentials ── -->
        <div class="step-card" :class="{ 'step-card-active': currentStep === 0, 'step-card-done': completedSteps.has(0) }">
          <div class="step-card-header" @click="goToStep(0)">
            <div class="step-card-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
              <UserPlus class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Account Credentials</p>
              <p class="text-xs text-muted-foreground font-medium">Email, password, and business name</p>
            </div>
            <div v-if="completedSteps.has(0)" class="done-badge">✓ Done</div>
            <ChevronDown v-else-if="currentStep !== 0" class="w-4 h-4 text-muted-foreground" />
            <ChevronUp v-else class="w-4 h-4" style="color: #8b5cf6" />
          </div>
          <div v-if="currentStep === 0" class="step-card-body">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2 space-y-1.5">
                <label class="m3-label">Business Name *</label>
                <input v-model="form.businessName" type="text" placeholder="Acme Repair Shop" class="m3-input" :disabled="loading" />
              </div>
              <div class="space-y-1.5">
                <label class="m3-label">Email *</label>
                <input v-model="form.email" type="email" placeholder="you@example.com" class="m3-input" :disabled="loading" />
              </div>
              <div class="space-y-1.5">
                <label class="m3-label">Phone</label>
                <input v-model="form.phone" type="tel" placeholder="(555) 123-4567" class="m3-input" :disabled="loading" />
              </div>
              <div class="space-y-1.5">
                <label class="m3-label">Password *</label>
                <input v-model="form.password" type="password" placeholder="At least 6 characters" class="m3-input" :disabled="loading" />
              </div>
              <div class="space-y-1.5">
                <label class="m3-label">Confirm Password *</label>
                <input v-model="form.confirmPassword" type="password" placeholder="••••••••" class="m3-input" :disabled="loading" />
              </div>
              <div class="sm:col-span-2 space-y-1.5">
                <label class="m3-label">Business Address</label>
                <input v-model="form.address" type="text" placeholder="123 Main St, City, State 12345" class="m3-input" :disabled="loading" />
              </div>
              <div class="sm:col-span-2 space-y-1.5">
                <label class="m3-label">Currency</label>
                <div class="flex gap-2 flex-wrap">
                  <button v-for="c in currencies" :key="c.value" class="currency-btn" :class="{ 'currency-btn-active': form.currency === c.value }" @click="form.currency = c.value">{{ c.label }}</button>
                </div>
              </div>
            </div>
            <button class="next-btn mt-2" @click="completeStep(0)">Continue <ArrowRight class="w-4 h-4" /></button>
          </div>
        </div>

        <!-- ── STEP 1: Supabase ── -->
        <div class="step-card" :class="{ 'step-card-active': currentStep === 1, 'step-card-done': completedSteps.has(1) }">
          <div class="step-card-header" @click="goToStep(1)">
            <div class="step-card-icon" style="background: linear-gradient(135deg, #3ecf8e, #10b981)">
              <Database class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Supabase Database</p>
              <p class="text-xs text-muted-foreground font-medium">Connect your Supabase project for data storage</p>
            </div>
            <div v-if="completedSteps.has(1)" class="done-badge">✓ Done</div>
            <span v-else-if="currentStep !== 1" class="skip-badge">Optional</span>
            <ChevronUp v-else class="w-4 h-4" style="color: #3ecf8e" />
          </div>
          <div v-if="currentStep === 1" class="step-card-body">
            <div class="info-box" style="background: #3ecf8e10; border-color: #3ecf8e30">
              <Info class="w-4 h-4 flex-shrink-0" style="color: #3ecf8e" />
              <p class="text-xs font-medium text-muted-foreground">Find these in your Supabase project under <strong>Settings → API</strong>. NovaOps uses these to store tickets, customers, inventory, and more.</p>
            </div>
            <div class="space-y-1.5">
              <label class="m3-label">Supabase Project URL *</label>
              <input v-model="form.supabaseUrl" type="url" placeholder="https://xyzabc.supabase.co" class="m3-input font-mono text-xs" />
            </div>
            <div class="space-y-1.5">
              <label class="m3-label">Supabase Anon Key *</label>
              <input v-model="form.supabaseAnonKey" type="password" placeholder="eyJhbGciOiJIUzI1NiIsInR5c..." class="m3-input font-mono text-xs" />
            </div>
            <div class="space-y-1.5">
              <label class="m3-label">Service Role Key <span class="normal-case font-normal">(for admin operations)</span></label>
              <input v-model="form.supabaseServiceKey" type="password" placeholder="eyJhbGciOiJIUzI1NiIsInR5c..." class="m3-input font-mono text-xs" />
            </div>
            <div class="flex gap-3 mt-1">
              <button class="skip-btn" @click="skipStep(1)">Skip for now</button>
              <button class="next-btn flex-1" @click="completeStep(1)">Save & Continue <ArrowRight class="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <!-- ── STEP 2: Square POS ── -->
        <div class="step-card" :class="{ 'step-card-active': currentStep === 2, 'step-card-done': completedSteps.has(2) }">
          <div class="step-card-header" @click="goToStep(2)">
            <div class="step-card-icon" style="background: linear-gradient(135deg, #1a1a1a, #404040)">
              <CreditCard class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Square POS Integration</p>
              <p class="text-xs text-muted-foreground font-medium">Connect Square for payments, terminals, and orders</p>
            </div>
            <div v-if="completedSteps.has(2)" class="done-badge">✓ Done</div>
            <span v-else-if="currentStep !== 2" class="skip-badge">Optional</span>
            <ChevronUp v-else class="w-4 h-4 text-muted-foreground" />
          </div>
          <div v-if="currentStep === 2" class="step-card-body">
            <div class="info-box" style="background: hsl(var(--muted)/0.3); border-color: hsl(var(--border)/0.5)">
              <Info class="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <p class="text-xs font-medium text-muted-foreground">Get credentials from <strong>developer.squareup.com → Applications → Credentials</strong>. Use Sandbox for testing.</p>
            </div>
            <div class="space-y-1.5">
              <label class="m3-label">Environment</label>
              <div class="flex gap-2">
                <button v-for="env in ['sandbox', 'production']" :key="env" class="currency-btn capitalize" :class="{ 'currency-btn-active': form.squareEnv === env }" @click="form.squareEnv = env">{{ env }}</button>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2 space-y-1.5">
                <label class="m3-label">Square Access Token</label>
                <input v-model="form.squareToken" type="password" placeholder="EAAAl..." class="m3-input font-mono text-xs" />
              </div>
              <div class="space-y-1.5">
                <label class="m3-label">Application ID</label>
                <input v-model="form.squareAppId" type="text" placeholder="sq0idp-..." class="m3-input font-mono text-xs" />
              </div>
              <div class="space-y-1.5">
                <label class="m3-label">Location ID</label>
                <input v-model="form.squareLocationId" type="text" placeholder="LXXXXXXXXXX" class="m3-input font-mono text-xs" />
              </div>
            </div>
            <div class="flex gap-3 mt-1">
              <button class="skip-btn" @click="skipStep(2)">Skip for now</button>
              <button class="next-btn flex-1" @click="completeStep(2)">Save & Continue <ArrowRight class="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <!-- ── STEP 3: Google Email ── -->
        <div class="step-card" :class="{ 'step-card-active': currentStep === 3, 'step-card-done': completedSteps.has(3) }">
          <div class="step-card-header" @click="goToStep(3)">
            <div class="step-card-icon" style="background: linear-gradient(135deg, #ea4335, #fbbc05)">
              <Mail class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Google Email Support</p>
              <p class="text-xs text-muted-foreground font-medium">Sync Gmail for customer communication</p>
            </div>
            <div v-if="completedSteps.has(3)" class="done-badge">✓ Done</div>
            <span v-else-if="currentStep !== 3" class="skip-badge">Optional</span>
            <ChevronUp v-else class="w-4 h-4" style="color: #ea4335" />
          </div>
          <div v-if="currentStep === 3" class="step-card-body">
            <div class="info-box" style="background: #ea433510; border-color: #ea433530">
              <Info class="w-4 h-4 flex-shrink-0" style="color: #ea4335" />
              <p class="text-xs font-medium text-muted-foreground">Create OAuth 2.0 credentials in <strong>Google Cloud Console → APIs & Services → Credentials</strong>. Enable Gmail API and set your redirect URI.</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="m3-label">Google Client ID</label>
                <input v-model="form.googleClientId" type="text" placeholder="123456789-abc.apps.googleusercontent.com" class="m3-input font-mono text-xs" />
              </div>
              <div class="space-y-1.5">
                <label class="m3-label">Google Client Secret</label>
                <input v-model="form.googleClientSecret" type="password" placeholder="GOCSPX-..." class="m3-input font-mono text-xs" />
              </div>
              <div class="sm:col-span-2 space-y-1.5">
                <label class="m3-label">Support Email Address</label>
                <input v-model="form.supportEmail" type="email" placeholder="support@yourshop.com" class="m3-input" />
              </div>
            </div>
            <div class="flex gap-3 mt-1">
              <button class="skip-btn" @click="skipStep(3)">Skip for now</button>
              <button class="next-btn flex-1" @click="completeStep(3)">Save & Continue <ArrowRight class="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <!-- ── STEP 4: Import Data ── -->
        <div class="step-card" :class="{ 'step-card-active': currentStep === 4, 'step-card-done': completedSteps.has(4) }">
          <div class="step-card-header" @click="goToStep(4)">
            <div class="step-card-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
              <Upload class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Import Existing Data</p>
              <p class="text-xs text-muted-foreground font-medium">Bring in inventory and customer records via CSV</p>
            </div>
            <div v-if="completedSteps.has(4)" class="done-badge">✓ Done</div>
            <span v-else-if="currentStep !== 4" class="skip-badge">Optional</span>
            <ChevronUp v-else class="w-4 h-4" style="color: #f59e0b" />
          </div>
          <div v-if="currentStep === 4" class="step-card-body">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="import-zone" :class="{ 'import-zone-ready': inventoryFile }" @click="triggerInventoryInput" @dragover.prevent @drop.prevent="handleInventoryDrop">
                <input ref="inventoryInput" type="file" accept=".csv,.xlsx" class="hidden" @change="handleInventoryFile" />
                <div class="flex flex-col items-center gap-2 text-center">
                  <div class="w-10 h-10 rounded-2xl flex items-center justify-center" :style="inventoryFile ? 'background: #f59e0b20' : 'background: hsl(var(--muted)/0.5)'">
                    <Package class="w-5 h-5" :style="inventoryFile ? 'color: #f59e0b' : 'color: hsl(var(--muted-foreground))'" />
                  </div>
                  <div>
                    <p class="text-xs font-bold" :style="inventoryFile ? 'color: #f59e0b' : ''">{{ inventoryFile ? inventoryFile.name : 'Inventory CSV' }}</p>
                    <p class="text-[10px] text-muted-foreground">{{ inventoryFile ? 'Ready to import' : 'Drop or click to browse' }}</p>
                  </div>
                </div>
              </div>
              <div class="import-zone" :class="{ 'import-zone-ready': customersFile }" @click="triggerCustomersInput" @dragover.prevent @drop.prevent="handleCustomersDrop">
                <input ref="customersInput" type="file" accept=".csv,.xlsx" class="hidden" @change="handleCustomersFile" />
                <div class="flex flex-col items-center gap-2 text-center">
                  <div class="w-10 h-10 rounded-2xl flex items-center justify-center" :style="customersFile ? 'background: #f59e0b20' : 'background: hsl(var(--muted)/0.5)'">
                    <Users class="w-5 h-5" :style="customersFile ? 'color: #f59e0b' : 'color: hsl(var(--muted-foreground))'" />
                  </div>
                  <div>
                    <p class="text-xs font-bold" :style="customersFile ? 'color: #f59e0b' : ''">{{ customersFile ? customersFile.name : 'Customers CSV' }}</p>
                    <p class="text-[10px] text-muted-foreground">{{ customersFile ? 'Ready to import' : 'Drop or click to browse' }}</p>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-xs text-muted-foreground text-center">Files are processed after account creation. You can also import later via Settings → Import CSV.</p>
            <div class="flex gap-3 mt-1">
              <button class="skip-btn" @click="skipStep(4)">Skip for now</button>
              <button class="next-btn flex-1" @click="completeStep(4)">Continue <ArrowRight class="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <!-- ── STEP 5: Legal Documents ── -->
        <div class="step-card" :class="{ 'step-card-active': currentStep === 5, 'step-card-done': completedSteps.has(5) }">
          <div class="step-card-header" @click="goToStep(5)">
            <div class="step-card-icon" style="background: linear-gradient(135deg, #6366f1, #4f46e5)">
              <FileText class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-black">Legal Documents & Forms</p>
              <p class="text-xs text-muted-foreground font-medium">Waivers, trade-in, warranty, and service terms</p>
            </div>
            <div v-if="completedSteps.has(5)" class="done-badge">✓ Done</div>
            <span v-else-if="currentStep !== 5" class="skip-badge">Optional</span>
            <ChevronUp v-else class="w-4 h-4" style="color: #6366f1" />
          </div>
          <div v-if="currentStep === 5" class="step-card-body">
            <div class="space-y-3">

              <!-- Repair Liability Waiver -->
              <div class="doc-section">
                <div class="doc-section-header">
                  <ShieldAlert class="w-4 h-4" style="color: #6366f1" />
                  <p class="text-xs font-black flex-1">Repair Liability Waiver</p>
                  <span class="doc-badge">Auto-generated</span>
                </div>
                <div class="space-y-1.5">
                  <label class="m3-label">Custom Clauses</label>
                  <textarea v-model="form.liabilityWaiver" class="m3-input resize-none text-xs" rows="2" placeholder="e.g. 'Shop is not responsible for data loss during repair...'"></textarea>
                </div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.requireWaiverSignature" class="checkbox-input" />
                  <span class="text-xs font-semibold">Require customer signature on each ticket</span>
                </label>
              </div>

              <!-- Device Trade-In -->
              <div class="doc-section">
                <div class="doc-section-header">
                  <Smartphone class="w-4 h-4" style="color: #6366f1" />
                  <p class="text-xs font-black flex-1">Device Trade-In Form</p>
                  <span class="doc-badge">Included</span>
                </div>
                <div class="flex gap-4 flex-wrap">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="form.tradeInEnabled" class="checkbox-input" />
                    <span class="text-xs font-semibold">Enable trade-in program</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="form.tradeInRequireId" class="checkbox-input" />
                    <span class="text-xs font-semibold">Require photo ID</span>
                  </label>
                </div>
                <div v-if="form.tradeInEnabled" class="space-y-1.5">
                  <label class="m3-label">Trade-In Policy Notes</label>
                  <textarea v-model="form.tradeInPolicy" class="m3-input resize-none text-xs" rows="2" placeholder="e.g. 'Trade-in value is final. Device must power on...'"></textarea>
                </div>
              </div>

              <!-- Warranty Repair Request -->
              <div class="doc-section">
                <div class="doc-section-header">
                  <BadgeCheck class="w-4 h-4" style="color: #6366f1" />
                  <p class="text-xs font-black flex-1">Warranty Repair Request</p>
                  <span class="doc-badge">Included</span>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <label class="m3-label">Warranty Period (days)</label>
                    <input v-model.number="form.warrantyDays" type="number" placeholder="90" class="m3-input" />
                  </div>
                  <div class="space-y-1.5">
                    <label class="m3-label">Covered Repairs</label>
                    <input v-model="form.warrantyCoverage" type="text" placeholder="Screen, Battery..." class="m3-input" />
                  </div>
                </div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.warrantyExcludeWater" class="checkbox-input" />
                  <span class="text-xs font-semibold">Exclude water/physical damage from warranty</span>
                </label>
              </div>

              <!-- Service Terms -->
              <div class="doc-section">
                <div class="doc-section-header">
                  <ScrollText class="w-4 h-4" style="color: #6366f1" />
                  <p class="text-xs font-black flex-1">Service Terms & Conditions</p>
                  <span class="doc-badge">Auto-generated</span>
                </div>
                <div class="space-y-1.5">
                  <label class="m3-label">Additional Terms</label>
                  <textarea v-model="form.serviceTerms" class="m3-input resize-none text-xs" rows="2" placeholder="e.g. 'Unclaimed devices disposed of after 30 days...'"></textarea>
                </div>
                <div class="space-y-1.5">
                  <label class="m3-label">Payment Terms</label>
                  <input v-model="form.paymentTerms" type="text" placeholder="Full payment due upon device pickup" class="m3-input" />
                </div>
              </div>

            </div>
            <div class="flex gap-3 mt-2">
              <button class="skip-btn" @click="skipStep(5)">Skip for now</button>
              <button class="next-btn flex-1" @click="completeStep(5)">Save & Continue <ArrowRight class="w-4 h-4" /></button>
            </div>
          </div>
        </div>

      </div>

      <!-- Final Submit CTA -->
      <div class="rounded-[28px] p-6 flex flex-col gap-4 shadow-xl" style="background: hsl(var(--card)); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-black">Ready to launch?</p>
            <p class="text-xs text-muted-foreground font-medium mt-0.5">{{ completedSteps.size }} of {{ steps.length }} sections completed</p>
          </div>
          <div class="flex gap-1.5 items-center">
            <div v-for="i in steps.length" :key="i" class="rounded-full transition-all duration-300" :style="completedSteps.has(i-1) ? 'width:8px;height:8px;background:#8b5cf6' : 'width:6px;height:6px;background:hsl(var(--muted))'" />
          </div>
        </div>

        <button
          class="m3-jelly-btn w-full h-14 rounded-full text-sm font-black text-white shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50"
          style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); box-shadow: 0 4px 20px #8b5cf650"
          :disabled="loading || !completedSteps.has(0)"
          @click="handleRegister"
        >
          <div v-if="loading" class="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
          <Rocket v-else class="w-5 h-5" />
          {{ loading ? 'Creating your shop…' : 'Create Account & Launch NovaOps' }}
        </button>

        <p class="text-[10px] text-center text-muted-foreground font-medium">
          By creating an account you agree to our Terms of Service and Privacy Policy. Optional sections can be completed anytime from Settings.
        </p>

        <div class="relative flex items-center gap-3">
          <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
          <span class="text-xs text-muted-foreground font-semibold">Already have an account?</span>
          <div class="flex-1 h-px" style="background: hsl(var(--border)/0.6)" />
        </div>

        <NuxtLink to="/login">
          <button class="m3-tonal-btn w-full h-12 rounded-full text-sm font-bold" style="background: hsl(var(--muted)); color: hsl(var(--foreground))">
            Sign In Instead
          </button>
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  Zap, UserPlus, AlertCircle, Check, ChevronDown, ChevronUp, ArrowRight, Rocket,
  Database, CreditCard, Mail, Upload, FileText, Package, Users, Info,
  ShieldAlert, Smartphone, BadgeCheck, ScrollText
} from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })
const { $supabase } = useNuxtApp()

const currentStep = ref(0)
const completedSteps = ref<Set<number>>(new Set())
const loading = ref(false)
const globalError = ref('')
const inventoryFile = ref<File | null>(null)
const customersFile = ref<File | null>(null)
const inventoryInput = ref<HTMLInputElement | null>(null)
const customersInput = ref<HTMLInputElement | null>(null)

const steps = [
  { shortLabel: 'Account' },
  { shortLabel: 'Supabase' },
  { shortLabel: 'Square' },
  { shortLabel: 'Google' },
  { shortLabel: 'Import' },
  { shortLabel: 'Documents' },
]

const currencies = [
  { label: '$ USD', value: '$' }, { label: '€ EUR', value: '€' },
  { label: '£ GBP', value: '£' }, { label: '¥ JPY', value: '¥' }, { label: '₹ INR', value: '₹' },
]

const form = reactive({
  businessName: '', email: '', phone: '', password: '', confirmPassword: '', address: '', currency: '$',
  supabaseUrl: '', supabaseAnonKey: '', supabaseServiceKey: '',
  squareEnv: 'sandbox', squareToken: '', squareAppId: '', squareLocationId: '',
  googleClientId: '', googleClientSecret: '', supportEmail: '',
  liabilityWaiver: '', requireWaiverSignature: true,
  tradeInEnabled: true, tradeInRequireId: false, tradeInPolicy: '',
  warrantyDays: 90, warrantyCoverage: 'Screen replacement, Battery replacement, Charging port', warrantyExcludeWater: true,
  serviceTerms: '', paymentTerms: 'Full payment due upon device pickup',
})

const goToStep = (i: number) => {
  currentStep.value = i
  globalError.value = ''
}

const completeStep = (step: number) => {
  if (step === 0) {
    if (!form.businessName.trim()) { globalError.value = 'Business name is required'; return }
    if (!form.email.trim()) { globalError.value = 'Email is required'; return }
    if (!form.password) { globalError.value = 'Password is required'; return }
    if (form.password !== form.confirmPassword) { globalError.value = 'Passwords do not match'; return }
    if (form.password.length < 6) { globalError.value = 'Password must be at least 6 characters'; return }
  }
  globalError.value = ''
  completedSteps.value = new Set([...completedSteps.value, step])
  if (step < steps.length - 1) currentStep.value = step + 1
}

const skipStep = (step: number) => {
  if (step < steps.length - 1) currentStep.value = step + 1
}

const triggerInventoryInput = () => inventoryInput.value?.click()
const triggerCustomersInput = () => customersInput.value?.click()
const handleInventoryFile = (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) inventoryFile.value = f }
const handleInventoryDrop = (e: DragEvent) => { const f = e.dataTransfer?.files?.[0]; if (f) inventoryFile.value = f }
const handleCustomersFile = (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) customersFile.value = f }
const handleCustomersDrop = (e: DragEvent) => { const f = e.dataTransfer?.files?.[0]; if (f) customersFile.value = f }

const handleRegister = async () => {
  if (!completedSteps.value.has(0)) { globalError.value = 'Please complete the Account section first.'; currentStep.value = 0; return }
  loading.value = true; globalError.value = ''
  try {
    const { data, error: authError } = await ($supabase as any).auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { businessName: form.businessName, phone: form.phone, address: form.address, currency: form.currency } },
    })
    if (authError) throw authError
    if (data.user) {
      // Write the profile directly so the user lands straight on the dashboard
      // without being sent through the redundant profile-setup page.
      await ($supabase as any).from('profiles').upsert({
        id: data.user.id,
        email: form.email,
        business_name: form.businessName,
        phone: form.phone,
        address: form.address,
        currency: form.currency,
        tax_rate: 0,
        statuses: 'Open, In Progress, Waiting for Parts, Completed, Delivered',
        pin: '1234',
        services: [],
        expenses: [],
      }, { onConflict: 'id' })
      await navigateTo('/dashboard')
    }
  } catch (err: any) {
    globalError.value = err.message || 'Failed to create account.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.m3-label { display:block;font-size:10px;font-weight:800;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.375rem; }
@keyframes registerEnter {
  0%   { transform: scale(0.94) translateY(20px); opacity: 0; }
  65%  { transform: scale(1.02) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}
.m3-input {
  width:100%;height:48px;padding:0 16px;border-radius:16px;font-size:14px;font-weight:500;
  background:hsl(var(--muted)/0.5);border:2px solid hsl(var(--border)/0.7);color:hsl(var(--foreground));
  outline:none;transition:all 0.2s ease;
}
.m3-input:focus { border-color:#8b5cf6;box-shadow:0 0 0 3px #8b5cf618; }
.m3-input.resize-none { height:auto;padding-top:12px;padding-bottom:12px; }
.step-node { width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.3s ease;flex-shrink:0; }
.step-done { background:#8b5cf6;color:white; }
.step-active { background:#8b5cf620;color:#8b5cf6;outline:2px solid #8b5cf6;outline-offset:0; }
.step-pending { background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground)); }
.step-card { border-radius:24px;background:hsl(var(--card));outline:2px solid hsl(var(--border)/0.5);outline-offset:0;overflow:hidden;transition:all 0.3s ease; }
.step-card-active { outline-color:#8b5cf640;box-shadow:0 4px 24px #8b5cf614; }
.step-card-done { outline-color:#8b5cf620; }
.step-card-header { display:flex;align-items:center;gap:12px;padding:16px 20px;cursor:pointer; }
.step-card-header:hover { background:hsl(var(--muted)/0.2); }
.step-card-icon { width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.step-card-body { padding:0 20px 20px;display:flex;flex-direction:column;gap:12px;animation:bodyReveal 0.25s ease; }
@keyframes bodyReveal { from { opacity:0;transform:translateY(-4px); } to { opacity:1;transform:translateY(0); } }
.done-badge { font-size:10px;font-weight:800;letter-spacing:0.08em;color:#8b5cf6;background:#8b5cf620;padding:3px 10px;border-radius:20px;white-space:nowrap; }
.skip-badge { font-size:10px;font-weight:700;letter-spacing:0.06em;color:hsl(var(--muted-foreground));background:hsl(var(--muted)/0.5);padding:3px 10px;border-radius:20px;white-space:nowrap; }
.next-btn { height:44px;border-radius:20px;font-size:13px;font-weight:800;color:white;background:linear-gradient(135deg,#8b5cf6,#7c3aed);display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 3px 12px #8b5cf640; }
.next-btn:hover { transform:scale(1.03) translateY(-1px);box-shadow:0 6px 20px #8b5cf650; }
.next-btn:active { transform:scale(0.97); }
.skip-btn { height:44px;padding:0 20px;border-radius:20px;font-size:12px;font-weight:700;color:hsl(var(--muted-foreground));background:hsl(var(--muted)/0.5);display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;white-space:nowrap; }
.skip-btn:hover { background:hsl(var(--muted)); }
.currency-btn { padding:8px 16px;border-radius:20px;font-size:11px;font-weight:700;background:hsl(var(--muted)/0.5);color:hsl(var(--muted-foreground));transition:all 0.2s ease; }
.currency-btn:hover { transform:scale(1.05); }
.currency-btn-active { background:#8b5cf624;color:#8b5cf6;outline:2px solid #8b5cf650;outline-offset:0; }
.info-box { display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:14px;border:1.5px solid transparent; }
.import-zone { border:2px dashed hsl(var(--border));border-radius:18px;padding:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s ease;background:hsl(var(--muted)/0.3); }
.import-zone:hover { border-color:#f59e0b;background:#f59e0b08; }
.import-zone-ready { border-color:#f59e0b;border-style:solid;background:#f59e0b08; }
.doc-section { padding:14px;border-radius:18px;background:hsl(var(--muted)/0.3);display:flex;flex-direction:column;gap:10px;outline:1.5px solid hsl(var(--border)/0.5);outline-offset:0; }
.doc-section-header { display:flex;align-items:center;gap:8px; }
.doc-badge { font-size:9px;font-weight:800;letter-spacing:0.08em;color:#6366f1;background:#6366f118;padding:2px 8px;border-radius:20px;text-transform:uppercase; }
.checkbox-input { width:16px;height:16px;border-radius:5px;accent-color:#8b5cf6;cursor:pointer; }
.m3-jelly-btn { transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s ease; }
.m3-jelly-btn:hover:not(:disabled) { transform:scale(1.03) translateY(-2px);box-shadow:0 8px 32px #8b5cf660 !important; }
.m3-jelly-btn:active:not(:disabled) { transform:scale(0.92); }
.m3-tonal-btn { transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);width:100%; }
.m3-tonal-btn:hover { transform:scale(1.03); }
.m3-tonal-btn:active { transform:scale(0.95); }
</style>
