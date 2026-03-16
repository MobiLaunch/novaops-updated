<template>
  <div class="flex flex-col gap-6 max-w-6xl">

    <!-- ── Page Header ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-[24px] flex items-center justify-center shadow-lg"
          style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 6px 28px #f59e0b40">
          <ArrowLeftRight class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight">Trade-In Evaluator</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">Assess, price, and record device trade-ins</p>
        </div>
      </div>
      <!-- Step progress pills -->
      <div class="flex items-center gap-2">
        <div v-for="(title, i) in stepTitles" :key="i"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          :style="currentStep === i + 1
            ? 'background: #f59e0b22; color: #d97706; outline: 1.5px solid #f59e0b40; outline-offset: 0'
            : currentStep > i + 1
              ? 'background: #10b98114; color: #10b981; outline: 1.5px solid #10b98130; outline-offset: 0'
              : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'">
          <Check v-if="currentStep > i + 1" class="w-3 h-3" />
          <span v-else class="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black"
            :style="currentStep === i + 1 ? 'background: #f59e0b; color: white' : 'background: hsl(var(--border))'">
            {{ i + 1 }}
          </span>
          <span class="hidden sm:inline">{{ title }}</span>
        </div>
      </div>
    </div>

    <!-- ── Main Layout: Sidebar + Content ─────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">

      <!-- Sidebar: step nav + summary -->
      <div class="flex flex-col gap-4">
        <!-- Step list -->
        <div class="rounded-[24px] overflow-hidden" style="background: hsl(var(--card)); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
          <div class="p-4 border-b border-border/50">
            <p class="text-xs font-black uppercase tracking-widest text-muted-foreground">Steps</p>
          </div>
          <div class="p-2 space-y-0.5">
            <button v-for="(title, i) in stepTitles" :key="i"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-[16px] text-sm text-left transition-all"
              :class="currentStep === i + 1 ? 'font-black' : 'font-medium hover:bg-muted/50'"
              :style="currentStep === i + 1 ? 'background: #f59e0b18; color: #d97706' : ''"
              :disabled="i + 1 > currentStep && !canNavigateTo(i + 1)"
              @click="canNavigateTo(i + 1) && (currentStep = i + 1)">
              <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black transition-all"
                :style="currentStep > i + 1
                  ? 'background: #10b981; color: white'
                  : currentStep === i + 1
                    ? 'background: #f59e0b; color: white'
                    : 'background: hsl(var(--muted)); color: hsl(var(--muted-foreground))'">
                <Check v-if="currentStep > i + 1" class="w-3 h-3" />
                <span v-else>{{ i + 1 }}</span>
              </div>
              {{ title }}
            </button>
          </div>
        </div>

        <!-- Live summary card (visible after step 1 is filled) -->
        <div v-if="form.brand || form.model" class="rounded-[24px] p-4 space-y-3"
          style="background: hsl(var(--card)); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">
          <p class="text-xs font-black uppercase tracking-widest text-muted-foreground">Device</p>
          <div class="space-y-1.5">
            <p class="text-sm font-black">{{ form.brand }} {{ form.model }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-if="form.storage" class="pill pill-neutral">{{ form.storage }}</span>
              <span v-if="form.color" class="pill pill-neutral">{{ form.color }}</span>
              <span v-if="form.condition_grade" class="pill" :style="gradePillStyle(form.condition_grade)">{{ form.condition_grade }}</span>
            </div>
          </div>
          <div v-if="effectiveMarketPrice > 0" class="pt-2 border-t border-border/50 space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Market value</span>
              <span class="font-bold">{{ currency }}{{ effectiveMarketPrice.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Offer price</span>
              <span class="font-black" style="color: #f59e0b">{{ currency }}{{ (form.offer_price || calculatedOffer).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Est. profit</span>
              <span class="font-black" :style="estimatedProfit >= 0 ? 'color: #10b981' : 'color: #ef4444'">
                {{ estimatedProfit >= 0 ? '+' : '−' }}{{ currency }}{{ Math.abs(estimatedProfit).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Step Content ─────────────────────────────────────── -->
      <div class="rounded-[28px] p-6 space-y-5"
        style="background: hsl(var(--card)); outline: 2px solid hsl(var(--border)/0.6); outline-offset: 0">

        <!-- Step header -->
        <div class="flex items-center gap-3 pb-4 border-b border-border/50">
          <div class="w-9 h-9 rounded-[18px] flex items-center justify-center flex-shrink-0"
            style="background: #f59e0b20">
            <component :is="stepIcons[currentStep - 1]" class="w-4 h-4" style="color: #f59e0b" />
          </div>
          <div>
            <p class="text-base font-black">{{ stepTitles[currentStep - 1] }}</p>
            <p class="text-xs text-muted-foreground font-medium">Step {{ currentStep }} of {{ TOTAL_STEPS }}</p>
          </div>
        </div>

        <!-- ── Step 1: Device Identity ── -->
        <div v-if="currentStep === 1" class="space-y-5">

          <div class="space-y-1.5">
            <label class="wi-label">Customer <span class="font-normal text-muted-foreground normal-case">(optional)</span></label>
            <CustomerSelect v-model="form.customerId" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="wi-label">Brand *</label>
              <input v-model="form.brand" list="ti-brands" placeholder="Apple, Samsung…" class="wi-input" />
              <datalist id="ti-brands">
                <option v-for="b in knownBrands" :key="b" :value="b" />
              </datalist>
            </div>
            <div class="space-y-1.5">
              <label class="wi-label">Model *</label>
              <input v-model="form.model" placeholder="iPhone 14, Galaxy S23…" class="wi-input" />
            </div>
            <div class="space-y-1.5">
              <label class="wi-label">Storage</label>
              <select v-model="form.storage" class="wi-input">
                <option value="">Select…</option>
                <option v-for="s in storageOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="wi-label">Color</label>
              <input v-model="form.color" placeholder="Space Black, Silver…" class="wi-input" />
            </div>
          </div>

          <!-- Identifiers -->
          <div class="rounded-[18px] p-4 space-y-3"
            style="background: hsl(var(--muted)/0.3); outline: 1.5px solid hsl(var(--border)/0.5); outline-offset: 0">
            <div class="flex items-center gap-2">
              <Fingerprint class="w-4 h-4 text-muted-foreground" />
              <p class="text-xs font-black">Device Identifiers</p>
              <span class="pill pill-neutral ml-1">Improves lookup accuracy</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="wi-label">IMEI / Serial</label>
                <input v-model="form.imei" placeholder="15-digit IMEI…" class="wi-input font-mono text-xs" maxlength="17" @input="imeiValidState = null" />
                <p v-if="form.imei && imeiValidState === false" class="text-[10px] text-destructive font-semibold">Invalid IMEI — check digits</p>
                <p v-else class="text-[10px] text-muted-foreground">Dial *#06# to find IMEI</p>
              </div>
              <div class="space-y-1.5">
                <label class="wi-label">Model Number</label>
                <input v-model="form.model_number" placeholder="MQ3D3LL/A, SM-G998B…" class="wi-input font-mono text-xs" />
                <p class="text-[10px] text-muted-foreground">Settings → About → Model</p>
              </div>
            </div>
          </div>

          <!-- Resolved device banner -->
          <div v-if="resolvedDevice" class="flex items-center gap-3 p-3 rounded-[14px]"
            style="background: #10b98110; outline: 1.5px solid #10b98130; outline-offset: 0">
            <CheckCircle2 class="w-4 h-4 flex-shrink-0" style="color: #10b981" />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <p class="text-xs font-black" style="color: #10b981">Device identified</p>
                <span class="pill" style="background: #10b98118; color: #10b981">via {{ resolvedDevice.method }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">{{ resolvedDevice.brand }} {{ resolvedDevice.model }}{{ resolvedDevice.storage ? ' · ' + resolvedDevice.storage : '' }}</p>
            </div>
            <button class="text-[10px] text-muted-foreground hover:text-foreground underline" @click="resolvedDevice = null">Clear</button>
          </div>

          <!-- Market price lookup -->
          <div class="rounded-[18px] p-4 space-y-4"
            style="background: #f59e0b08; outline: 1.5px solid #f59e0b28; outline-offset: 0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <TrendingUp class="w-4 h-4" style="color: #f59e0b" />
                <p class="text-sm font-black">Live Market Price</p>
              </div>
              <button
                class="flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style="background: #f59e0b; color: white; box-shadow: 0 3px 10px #f59e0b40"
                :disabled="(!form.brand && !form.model && !form.imei && !form.model_number) || fetchingPrice"
                @click="fetchMarketPrice">
                <div v-if="fetchingPrice" class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <Search v-else class="w-3 h-3" />
                {{ fetchingPrice ? fetchingStage : 'Look Up' }}
              </button>
            </div>

            <div v-if="marketPriceResult" class="space-y-2">
              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-[14px] p-3 text-center" style="background: hsl(var(--muted)/0.4)">
                  <p class="text-[10px] text-muted-foreground font-semibold mb-1">eBay Sold Avg</p>
                  <p class="text-sm font-black" style="color: #f59e0b">{{ currency }}{{ marketPriceResult.ebay_avg.toFixed(2) }}</p>
                </div>
                <div class="rounded-[14px] p-3 text-center" style="background: hsl(var(--muted)/0.4)">
                  <p class="text-[10px] text-muted-foreground font-semibold mb-1">Swappa Avg</p>
                  <p class="text-sm font-black" style="color: #f59e0b">{{ currency }}{{ marketPriceResult.swappa_avg.toFixed(2) }}</p>
                </div>
                <div class="rounded-[14px] p-3 text-center" style="background: #f59e0b14; outline: 1px solid #f59e0b30; outline-offset: 0">
                  <p class="text-[10px] text-muted-foreground font-semibold mb-1">Median</p>
                  <p class="text-base font-black" style="color: #f59e0b">{{ currency }}{{ marketPriceResult.median.toFixed(2) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="pill" style="background: #f59e0b18; color: #d97706">
                  via {{ marketPriceResult.lookup_method === 'imei' ? 'IMEI' : marketPriceResult.lookup_method === 'model_number' ? 'Model #' : 'Name search' }}
                </span>
                <p class="text-[10px] text-muted-foreground">{{ marketPriceResult.source_note }}</p>
              </div>
            </div>
            <div v-else-if="priceError" class="flex items-start gap-2.5 p-3 rounded-[12px]"
              style="background: #ef444410; outline: 1px solid #ef444430; outline-offset: 0">
              <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: #ef4444" />
              <div>
                <p class="text-xs font-semibold" style="color: #ef4444">{{ priceError }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">Try adding an IMEI or model number for a more precise lookup.</p>
              </div>
            </div>
            <div v-else class="text-xs text-muted-foreground">
              Enter device details above then tap Look Up. IMEI or model number gives the most accurate results.
            </div>

            <div class="space-y-1.5 pt-1 border-t border-border/30">
              <label class="wi-label">Manual Override <span class="font-normal text-muted-foreground normal-case">(if lookup fails)</span></label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">{{ currency }}</span>
                <input v-model.number="form.market_price" type="number" min="0" step="0.01" placeholder="0.00" class="wi-input pl-7 font-mono" />
              </div>
            </div>
          </div>
        </div>

        <!-- ── Step 2: Condition ── -->
        <div v-if="currentStep === 2" class="space-y-5">

          <div class="space-y-2">
            <label class="wi-label">Overall Grade</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button v-for="g in conditionGrades" :key="g.value"
                class="grade-chip"
                :class="form.condition_grade === g.value ? 'grade-chip--active' : ''"
                :style="form.condition_grade === g.value ? `background: ${g.color}18; outline-color: ${g.color}60; color: ${g.color}` : ''"
                @click="form.condition_grade = g.value">
                <component :is="g.icon" class="w-5 h-5 flex-shrink-0" :style="form.condition_grade === g.value ? `color: ${g.color}` : 'color: hsl(var(--muted-foreground))'" />
                <span class="text-xs font-black mt-1">{{ g.label }}</span>
                <span class="text-[10px] leading-tight text-center" :style="form.condition_grade === g.value ? '' : 'color: hsl(var(--muted-foreground))'">{{ g.desc }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="space-y-2">
              <label class="wi-label">Screen Condition</label>
              <div class="space-y-1.5">
                <button v-for="s in screenConditions" :key="s.value"
                  class="w-full flex items-center gap-3 p-3 rounded-[14px] text-left transition-all hover:scale-[1.01]"
                  :style="form.screen_condition === s.value
                    ? `background: ${s.color}18; outline: 1.5px solid ${s.color}50; outline-offset: 0`
                    : 'background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.4); outline-offset: 0'"
                  @click="form.screen_condition = s.value">
                  <component :is="s.icon" class="w-4 h-4 flex-shrink-0" :style="form.screen_condition === s.value ? `color: ${s.color}` : 'color: hsl(var(--muted-foreground))'" />
                  <div>
                    <p class="text-xs font-bold">{{ s.label }}</p>
                    <p class="text-[10px] text-muted-foreground">{{ s.desc }}</p>
                  </div>
                  <span v-if="form.screen_condition === s.value" class="ml-auto pill" :style="`background: ${s.color}20; color: ${s.color}`">Selected</span>
                </button>
              </div>
            </div>

            <div class="space-y-5">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="wi-label mb-0">Battery Health</label>
                  <span class="pill font-black"
                    :style="form.battery_health >= 80 ? 'background: #10b98118; color: #10b981' : form.battery_health >= 60 ? 'background: #f59e0b18; color: #f59e0b' : 'background: #ef444418; color: #ef4444'">
                    {{ form.battery_health }}%
                  </span>
                </div>
                <input type="range" v-model.number="form.battery_health" min="0" max="100" step="5" class="wi-range" />
                <div class="flex justify-between text-[10px] text-muted-foreground">
                  <span>Dead</span><span>Good (80%)</span><span>New</span>
                </div>
              </div>

              <div class="space-y-2">
                <label class="wi-label">Device Age</label>
                <div class="grid grid-cols-3 gap-1.5">
                  <button v-for="a in ageOptions" :key="a.value"
                    class="py-2 px-1 rounded-[12px] text-[11px] font-bold transition-all text-center"
                    :style="form.age_years === a.value
                      ? 'background: #6366f120; color: #6366f1; outline: 1.5px solid #6366f150; outline-offset: 0'
                      : 'background: hsl(var(--muted)/0.4); color: hsl(var(--muted-foreground))'"
                    @click="form.age_years = a.value">
                    {{ a.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Step 3: Issues & Accessories ── -->
        <div v-if="currentStep === 3" class="space-y-5">

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="wi-label mb-0">Functional Issues</label>
              <span v-if="form.functional_issues.length" class="pill" style="background: #ef444418; color: #ef4444">
                {{ form.functional_issues.length }} selected
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button v-for="issue in functionalIssues" :key="issue.value"
                class="flex items-center gap-2.5 p-3 rounded-[14px] text-left transition-all text-xs font-bold"
                :style="form.functional_issues.includes(issue.value)
                  ? 'background: #ef444418; outline: 1.5px solid #ef444440; color: #ef4444; outline-offset: 0'
                  : 'background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.4); outline-offset: 0'"
                @click="toggleIssue('functional', issue.value)">
                <component :is="issue.icon" class="w-4 h-4 flex-shrink-0"
                  :style="form.functional_issues.includes(issue.value) ? 'color: #ef4444' : 'color: hsl(var(--muted-foreground))'" />
                {{ issue.label }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="wi-label mb-0">Cosmetic Issues</label>
              <span v-if="form.cosmetic_issues.length" class="pill" style="background: #f59e0b18; color: #d97706">
                {{ form.cosmetic_issues.length }} selected
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button v-for="issue in cosmeticIssues" :key="issue.value"
                class="flex items-center gap-2.5 p-3 rounded-[14px] text-left transition-all text-xs font-bold"
                :style="form.cosmetic_issues.includes(issue.value)
                  ? 'background: #f59e0b18; outline: 1.5px solid #f59e0b40; color: #d97706; outline-offset: 0'
                  : 'background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.4); outline-offset: 0'"
                @click="toggleIssue('cosmetic', issue.value)">
                <component :is="issue.icon" class="w-4 h-4 flex-shrink-0"
                  :style="form.cosmetic_issues.includes(issue.value) ? 'color: #d97706' : 'color: hsl(var(--muted-foreground))'" />
                {{ issue.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="wi-label mb-0">Accessories Included</label>
                <span v-if="form.accessories.length" class="pill" style="background: #10b98118; color: #10b981">
                  {{ form.accessories.length }} included
                </span>
              </div>
              <div class="space-y-1.5">
                <button v-for="acc in accessoryOptions" :key="acc.value"
                  class="w-full flex items-center gap-3 p-3 rounded-[14px] text-xs font-bold transition-all"
                  :style="form.accessories.includes(acc.value)
                    ? 'background: #10b98118; outline: 1.5px solid #10b98140; color: #10b981; outline-offset: 0'
                    : 'background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.4); outline-offset: 0'"
                  @click="toggleAccessory(acc.value)">
                  <component :is="acc.icon" class="w-4 h-4 flex-shrink-0"
                    :style="form.accessories.includes(acc.value) ? 'color: #10b981' : 'color: hsl(var(--muted-foreground))'" />
                  <span class="flex-1">{{ acc.label }}</span>
                  <span class="pill" style="background: #10b98114; color: #10b981">+{{ currency }}{{ accessoryValueMap[acc.value] }}</span>
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <div class="space-y-2">
                <label class="wi-label">Lock Status</label>
                <div class="space-y-2">
                  <label class="flex items-start gap-3 p-3 rounded-[14px] cursor-pointer transition-all"
                    :style="form.icloud_locked ? 'background: #ef444410; outline: 1.5px solid #ef444430; outline-offset: 0' : 'background: hsl(var(--muted)/0.3); outline: 1.5px solid hsl(var(--border)/0.4); outline-offset: 0'">
                    <input type="checkbox" v-model="form.icloud_locked" class="wi-check mt-0.5" />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <p class="text-xs font-black">iCloud / Activation Lock</p>
                        <span v-if="form.icloud_locked" class="pill" style="background: #ef444418; color: #ef4444">−40%</span>
                      </div>
                      <p class="text-[10px] text-muted-foreground mt-0.5">Device is locked to an Apple ID</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 p-3 rounded-[14px] cursor-pointer transition-all"
                    :style="form.frp_locked ? 'background: #ef444410; outline: 1.5px solid #ef444430; outline-offset: 0' : 'background: hsl(var(--muted)/0.3); outline: 1.5px solid hsl(var(--border)/0.4); outline-offset: 0'">
                    <input type="checkbox" v-model="form.frp_locked" class="wi-check mt-0.5" />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <p class="text-xs font-black">Google FRP Lock</p>
                        <span v-if="form.frp_locked" class="pill" style="background: #ef444418; color: #ef4444">−40%</span>
                      </div>
                      <p class="text-[10px] text-muted-foreground mt-0.5">Factory Reset Protection active</p>
                    </div>
                  </label>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="wi-label">Repair / Refurb Cost Estimate</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">{{ currency }}</span>
                  <input v-model.number="form.repair_cost_est" type="number" min="0" step="0.01" placeholder="0.00" class="wi-input pl-7 font-mono" />
                </div>
                <p class="text-[10px] text-muted-foreground">Cost to restore device to resale condition</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Step 4: Offer & Summary ── -->
        <div v-if="currentStep === 4" class="space-y-5">

          <!-- Pricing breakdown -->
          <div class="rounded-[20px] overflow-hidden" style="outline: 1.5px solid hsl(var(--border)/0.6); outline-offset: 0">
            <div class="px-5 py-3 border-b border-border/50" style="background: #f59e0b08">
              <div class="flex items-center justify-between">
                <p class="text-xs font-black uppercase tracking-widest" style="color: #f59e0b">Valuation Breakdown</p>
                <span class="pill" style="background: #f59e0b18; color: #d97706">{{ form.brand }} {{ form.model }}{{ form.storage ? ' · ' + form.storage : '' }}</span>
              </div>
            </div>
            <div class="divide-y divide-border/40">
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-xs font-semibold">Market Value (used)</p>
                  <p class="text-[10px] text-muted-foreground">Based on eBay sold / Swappa listings</p>
                </div>
                <span class="font-black text-sm">{{ currency }}{{ effectiveMarketPrice.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-xs font-semibold">Condition Deductions</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span class="pill pill-neutral">{{ form.condition_grade }}</span>
                    <span class="pill pill-neutral">Screen: {{ form.screen_condition }}</span>
                    <span class="pill pill-neutral">Battery: {{ form.battery_health }}%</span>
                    <span v-if="form.functional_issues.length" class="pill" style="background: #ef444414; color: #ef4444">{{ form.functional_issues.length }} functional</span>
                    <span v-if="form.cosmetic_issues.length" class="pill" style="background: #f59e0b14; color: #d97706">{{ form.cosmetic_issues.length }} cosmetic</span>
                    <span v-if="form.icloud_locked || form.frp_locked" class="pill" style="background: #ef444414; color: #ef4444">Locked</span>
                  </div>
                </div>
                <span class="font-black text-sm text-orange-500 flex-shrink-0 ml-3">− {{ currency }}{{ deductions.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-xs font-semibold">Repair / Refurb Cost</p>
                  <p class="text-[10px] text-muted-foreground">To restore to sellable condition</p>
                </div>
                <span class="font-black text-sm text-purple-500">− {{ currency }}{{ (form.repair_cost_est || 0).toFixed(2) }}</span>
              </div>
              <div v-if="accessoryBonus > 0" class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-xs font-semibold">Accessory Bonus</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span v-for="a in form.accessories" :key="a" class="pill" style="background: #10b98114; color: #10b981">{{ accessoryOptions.find(o => o.value === a)?.label }}</span>
                  </div>
                </div>
                <span class="font-black text-sm text-emerald-500">+ {{ currency }}{{ accessoryBonus.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-5 py-4" style="background: #f59e0b08">
                <div>
                  <p class="text-sm font-black">Calculated Offer Price</p>
                  <p class="text-[10px] text-muted-foreground">What you pay the customer</p>
                </div>
                <span class="text-2xl font-black" style="color: #f59e0b">{{ currency }}{{ calculatedOffer.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Adjustable final offer -->
          <div class="space-y-1.5">
            <label class="wi-label">Final Offer Price <span class="font-normal text-muted-foreground normal-case">(adjust as needed)</span></label>
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">{{ currency }}</span>
                <input v-model.number="form.offer_price" type="number" min="0" step="0.50"
                  class="wi-input pl-7 font-mono text-lg font-black"
                  style="border-color: #f59e0b; box-shadow: 0 0 0 3px #f59e0b18" />
              </div>
              <button class="h-11 px-4 rounded-[14px] text-xs font-bold transition-all hover:scale-105"
                style="background: hsl(var(--muted)/0.5); outline: 1.5px solid hsl(var(--border)); outline-offset: 0"
                @click="form.offer_price = calculatedOffer">
                Reset
              </button>
            </div>
          </div>

          <!-- Profit metrics -->
          <div class="grid grid-cols-3 gap-3">
            <div class="p-4 rounded-[18px] text-center" style="background: #6366f10c; outline: 1.5px solid #6366f128; outline-offset: 0">
              <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Est. Resale</p>
              <p class="text-lg font-black" style="color: #6366f1">{{ currency }}{{ estimatedResale.toFixed(2) }}</p>
            </div>
            <div class="p-4 rounded-[18px] text-center"
              :style="estimatedProfit >= 0 ? 'background: #10b9810c; outline: 1.5px solid #10b98128; outline-offset: 0' : 'background: #ef44440c; outline: 1.5px solid #ef444428; outline-offset: 0'">
              <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Est. Profit</p>
              <p class="text-lg font-black" :style="estimatedProfit >= 0 ? 'color: #10b981' : 'color: #ef4444'">
                {{ estimatedProfit >= 0 ? '+' : '−' }}{{ currency }}{{ Math.abs(estimatedProfit).toFixed(2) }}
              </p>
            </div>
            <div class="p-4 rounded-[18px] text-center"
              :style="profitMargin >= 20 ? 'background: #10b9810c; outline: 1.5px solid #10b98128; outline-offset: 0' : 'background: #f59e0b0c; outline: 1.5px solid #f59e0b28; outline-offset: 0'">
              <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Margin</p>
              <p class="text-lg font-black" :style="profitMargin >= 20 ? 'color: #10b981' : 'color: #f59e0b'">{{ profitMargin.toFixed(0) }}%</p>
            </div>
          </div>

          <!-- Lock warning -->
          <div v-if="form.icloud_locked || form.frp_locked"
            class="flex items-start gap-3 p-4 rounded-[16px]"
            style="background: #ef444410; outline: 1.5px solid #ef444430; outline-offset: 0">
            <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: #ef4444" />
            <div>
              <div class="flex items-center gap-2 mb-1">
                <p class="text-xs font-black" style="color: #ef4444">Device Lock Warning</p>
                <span v-if="form.icloud_locked" class="pill" style="background: #ef444418; color: #ef4444">iCloud Lock</span>
                <span v-if="form.frp_locked" class="pill" style="background: #ef444418; color: #ef4444">FRP Lock</span>
              </div>
              <p class="text-xs text-muted-foreground">Ensure the customer can provide proof of ownership and remove all locks before completing the trade-in.</p>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="wi-label">Internal Notes</label>
            <textarea v-model="form.notes" class="wi-input resize-none" rows="3" placeholder="Any additional observations, condition details, or instructions…" />
          </div>
        </div>

        <!-- ── Step navigation ── -->
        <div class="flex items-center gap-3 pt-4 border-t border-border/50">
          <button v-if="currentStep > 1"
            class="flex items-center gap-1.5 h-11 px-4 rounded-full text-sm font-bold transition-all hover:scale-[1.03] active:scale-95"
            style="outline: 2px solid hsl(var(--border)); outline-offset: 0"
            @click="currentStep--">
            <ChevronLeft class="w-4 h-4" /> Back
          </button>

          <div class="flex-1" />

          <button v-if="currentStep < TOTAL_STEPS"
            class="flex items-center gap-2 h-11 px-6 rounded-full text-sm font-black text-white transition-all hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95"
            :style="canProceed
              ? 'background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 14px #f59e0b40'
              : 'background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); cursor: not-allowed'"
            :disabled="!canProceed"
            @click="nextStep">
            Continue <ChevronRight class="w-4 h-4" />
          </button>

          <button v-else
            class="flex items-center gap-2 h-11 px-6 rounded-full text-sm font-black text-white transition-all hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 14px #10b98140"
            :disabled="saving"
            @click="saveTradeIn">
            <div v-if="saving" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <CheckCircle v-else class="w-4 h-4" />
            {{ saving ? 'Saving…' : 'Save Trade-In' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftRight, ChevronLeft, ChevronRight, Search, TrendingUp,
  AlertTriangle, AlertCircle, CheckCircle, CheckCircle2, Fingerprint, Check,
  Smartphone, Star, ThumbsUp, Triangle, XCircle,
  MonitorSmartphone, ScanLine, Waves, Zap, Camera, Volume2, Wifi,
  ShieldOff, Droplets, ToggleLeft, Wrench, GlassWater, Hammer, Slash,
  Telescope, SlidersHorizontal,
  Package, Plug, Headphones, Shield,
  Cpu, ClipboardList, ListChecks, BarChart2,
} from 'lucide-vue-next'
import CustomerSelect from '~/components/CustomerSelect.vue'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

definePageMeta({ middleware: ['auth'] })

const { $supabase } = useNuxtApp()
const appStore = useAppStore()
const { settings } = storeToRefs(appStore)
const currency = computed(() => settings.value?.currency || '$')

// ── Constants ──────────────────────────────────────────────────────
const TOTAL_STEPS = 4
const stepTitles = ['Device Identity', 'Condition', 'Issues & Accessories', 'Offer & Summary']
const stepIcons  = [Smartphone, MonitorSmartphone, ListChecks, BarChart2]

const knownBrands = ['Apple', 'Samsung', 'Google', 'Sony', 'LG', 'Microsoft', 'Dell', 'HP',
  'Lenovo', 'ASUS', 'Acer', 'Huawei', 'OnePlus', 'Motorola', 'Nokia', 'Xiaomi', 'Oppo']

const storageOptions = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']

const conditionGrades = [
  { value: 'Excellent', label: 'Excellent', icon: Star,       desc: 'Like new, minimal use',         color: '#10b981' },
  { value: 'Good',      label: 'Good',      icon: ThumbsUp,   desc: 'Normal wear, fully functional', color: '#6366f1' },
  { value: 'Fair',      label: 'Fair',      icon: Triangle,   desc: 'Visible wear, works fine',       color: '#f59e0b' },
  { value: 'Poor',      label: 'Poor',      icon: XCircle,    desc: 'Heavy damage or issues',         color: '#ef4444' },
]

const screenConditions = [
  { value: 'Perfect',         label: 'Perfect',         icon: MonitorSmartphone, desc: 'No scratches or damage',           color: '#10b981' },
  { value: 'Minor Scratches', label: 'Minor Scratches', icon: ScanLine,          desc: 'Light marks, visible in light',    color: '#6366f1' },
  { value: 'Cracked',         label: 'Cracked',         icon: Slash,             desc: 'Cracked, touchscreen still works', color: '#f59e0b' },
  { value: 'Shattered',       label: 'Shattered',       icon: XCircle,           desc: 'Severely broken, touch issues',   color: '#ef4444' },
]

const ageOptions = [
  { value: 0.5, label: '< 1 yr' }, { value: 1, label: '1 yr'  }, { value: 2, label: '2 yrs' },
  { value: 3,   label: '3 yrs'  }, { value: 4, label: '4 yrs' }, { value: 5, label: '5+ yrs' },
]

const functionalIssues = [
  { value: 'wont_turn_on',  label: "Won't Turn On",  icon: Zap       },
  { value: 'charging_port', label: 'Charging Port',  icon: Plug      },
  { value: 'battery_dead',  label: 'Battery Dead',   icon: AlertCircle },
  { value: 'camera',        label: 'Camera Issues',  icon: Camera    },
  { value: 'speaker',       label: 'Speaker / Mic',  icon: Volume2   },
  { value: 'wifi_bt',       label: 'WiFi / BT',      icon: Wifi      },
  { value: 'face_id',       label: 'Face / Touch ID',icon: ShieldOff },
  { value: 'water_damage',  label: 'Water Damage',   icon: Droplets  },
  { value: 'buttons',       label: 'Buttons Broken', icon: ToggleLeft},
]

const cosmeticIssues = [
  { value: 'back_cracked',  label: 'Back Glass Cracked', icon: Smartphone   },
  { value: 'dents',         label: 'Dents / Bends',       icon: Hammer       },
  { value: 'scratches',     label: 'Deep Scratches',      icon: Slash        },
  { value: 'camera_lens',   label: 'Camera Lens Crack',   icon: Camera       },
  { value: 'missing_parts', label: 'Missing Parts',        icon: SlidersHorizontal },
]

const accessoryOptions = [
  { value: 'original_box', label: 'Original Box',  icon: Package   },
  { value: 'charger',      label: 'Charger / Cable', icon: Plug    },
  { value: 'earphones',    label: 'Earphones',      icon: Headphones},
  { value: 'case',         label: 'Case',           icon: Shield    },
]

const accessoryValueMap: Record<string, number> = {
  original_box: 8, charger: 6, earphones: 5, case: 3,
}

// ── Deduction weights ─────────────────────────────────────────────
const GRADE_DEDUCTIONS: Record<string, number> = {
  Excellent: 0.05, Good: 0.15, Fair: 0.30, Poor: 0.50,
}
const SCREEN_DEDUCTIONS: Record<string, number> = {
  Perfect: 0, 'Minor Scratches': 0.05, Cracked: 0.15, Shattered: 0.28,
}
const FUNCTIONAL_ISSUE_COST = 25
const COSMETIC_ISSUE_COST   = 10
const LOCK_PENALTY          = 0.40
const AGE_DEDUCTION_PER_YR  = 0.06
const ACCESSORY_VALUES: Record<string, number> = {
  original_box: 8, charger: 6, earphones: 5, case: 3,
}

// ── Form state ────────────────────────────────────────────────────
const defaultForm = () => ({
  customerId:         null as number | null,
  brand:              '', model: '', model_number: '', imei: '',
  storage:            '', color: '',
  market_price:       null as number | null,
  condition_grade:    'Good',
  age_years:          1,
  screen_condition:   'Perfect',
  battery_health:     80,
  functional_issues:  [] as string[],
  cosmetic_issues:    [] as string[],
  accessories:        [] as string[],
  icloud_locked:      false,
  frp_locked:         false,
  repair_cost_est:    0,
  offer_price:        0,
  notes:              '',
})

const form            = reactive(defaultForm())
const currentStep     = ref(1)
const saving          = ref(false)
const fetchingPrice   = ref(false)
const fetchingStage   = ref('Searching…')
const priceError      = ref('')
const imeiValidState  = ref<boolean | null>(null)
const resolvedDevice  = ref<{ brand: string; model: string; storage?: string; method: string } | null>(null)
const marketPriceResult = ref<{
  ebay_avg: number; swappa_avg: number; median: number
  source_note: string; lookup_method: string
} | null>(null)

// ── Computed ──────────────────────────────────────────────────────
const effectiveMarketPrice = computed(() =>
  form.market_price ?? marketPriceResult.value?.median ?? 0
)

const deductions = computed(() => {
  const mp = effectiveMarketPrice.value
  if (!mp) return 0
  let d = 0
  d += mp * (GRADE_DEDUCTIONS[form.condition_grade] || 0)
  d += mp * (SCREEN_DEDUCTIONS[form.screen_condition] || 0)
  d += mp * Math.min(form.age_years * AGE_DEDUCTION_PER_YR, 0.4)
  d += (100 - form.battery_health) / 100 * mp * 0.15
  d += form.functional_issues.length * FUNCTIONAL_ISSUE_COST
  d += form.cosmetic_issues.length * COSMETIC_ISSUE_COST
  if (form.icloud_locked || form.frp_locked) d += mp * LOCK_PENALTY
  return Math.min(d, mp * 0.92)
})

const accessoryBonus = computed(() =>
  form.accessories.reduce((s, a) => s + (ACCESSORY_VALUES[a] || 0), 0)
)

const calculatedOffer = computed(() =>
  Math.max(Math.round((effectiveMarketPrice.value - deductions.value - (form.repair_cost_est || 0) + accessoryBonus.value) * 2) / 2, 0)
)

const estimatedResale = computed(() =>
  Math.max(effectiveMarketPrice.value - deductions.value * 0.3, calculatedOffer.value + 20)
)

const estimatedProfit = computed(() =>
  estimatedResale.value - (form.offer_price || calculatedOffer.value) - (form.repair_cost_est || 0)
)

const profitMargin = computed(() => {
  const r = estimatedResale.value
  return r ? (estimatedProfit.value / r) * 100 : 0
})

watch(calculatedOffer, val => { if (!form.offer_price) form.offer_price = val }, { immediate: true })

// ── Navigation ────────────────────────────────────────────────────
const canProceed = computed(() => {
  if (currentStep.value === 1) return !!form.brand && !!form.model
  if (currentStep.value === 2) return !!form.condition_grade && !!form.screen_condition
  return true
})

function canNavigateTo(step: number) {
  if (step <= currentStep.value) return true
  if (step === 2) return !!form.brand && !!form.model
  if (step === 3) return !!form.condition_grade && !!form.screen_condition
  return false
}

const nextStep = () => {
  if (!canProceed.value) return
  if (currentStep.value === 3) form.offer_price = calculatedOffer.value
  currentStep.value++
}

// ── Pill style helper ─────────────────────────────────────────────
function gradePillStyle(grade: string) {
  const colors: Record<string, string> = {
    Excellent: 'background: #10b98118; color: #10b981',
    Good:      'background: #6366f118; color: #6366f1',
    Fair:      'background: #f59e0b18; color: #d97706',
    Poor:      'background: #ef444418; color: #ef4444',
  }
  return colors[grade] || ''
}

// ── Issue toggles ─────────────────────────────────────────────────
const toggleIssue = (type: 'functional' | 'cosmetic', value: string) => {
  const arr = type === 'functional' ? form.functional_issues : form.cosmetic_issues
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1); else arr.push(value)
}

const toggleAccessory = (value: string) => {
  const idx = form.accessories.indexOf(value)
  if (idx >= 0) form.accessories.splice(idx, 1); else form.accessories.push(value)
}

// ── Market price lookup ───────────────────────────────────────────
const fetchMarketPrice = async () => {
  const hasIdentifier = form.brand || form.model || form.imei || form.model_number
  if (!hasIdentifier || fetchingPrice.value) return

  fetchingPrice.value = true
  priceError.value = ''
  marketPriceResult.value = null
  resolvedDevice.value = null

  if (form.imei) {
    const digits = form.imei.replace(/\D/g, '')
    if (digits.length === 15) {
      let sum = 0
      for (let i = 0; i < 15; i++) {
        let d = parseInt(digits[i])
        if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
        sum += d
      }
      imeiValidState.value = sum % 10 === 0
      if (!imeiValidState.value) {
        priceError.value = 'IMEI check digit is invalid — double-check the number.'
        fetchingPrice.value = false
        return
      }
    }
  }

  try {
    if (form.imei) fetchingStage.value = 'Looking up IMEI…'
    else if (form.model_number) fetchingStage.value = 'Resolving model #…'
    else fetchingStage.value = 'Searching prices…'

    const result = await $fetch('/api/trade-in/lookup', {
      method: 'POST',
      body: {
        brand:        form.brand        || undefined,
        model:        form.model        || undefined,
        storage:      form.storage      || undefined,
        imei:         form.imei         || undefined,
        model_number: form.model_number || undefined,
      },
    }) as any

    if (!result.ok) { priceError.value = result.error || 'Lookup failed. Enter market price manually.'; return }

    if (result.resolved_brand || result.resolved_model) {
      const methodLabel = result.lookup_method === 'imei' ? 'IMEI lookup'
        : result.lookup_method === 'model_number' ? 'model number' : 'name search'
      if (result.resolved_brand && !form.brand) form.brand = result.resolved_brand
      if (result.resolved_model && !form.model) form.model = result.resolved_model
      if (result.resolved_storage && !form.storage) form.storage = result.resolved_storage
      if (result.lookup_method !== 'name') {
        resolvedDevice.value = {
          brand: result.resolved_brand || form.brand, model: result.resolved_model || form.model,
          storage: result.resolved_storage || form.storage || undefined, method: methodLabel,
        }
      }
    }

    marketPriceResult.value = {
      ebay_avg: result.ebay_avg, swappa_avg: result.swappa_avg,
      median: result.median, source_note: result.source_note, lookup_method: result.lookup_method,
    }
    if (!form.market_price) form.market_price = result.median
  } catch (err: any) {
    priceError.value = `${err?.data?.message || err?.message || 'Lookup failed'} — enter market price manually.`
  } finally {
    fetchingPrice.value = false
    fetchingStage.value = 'Searching…'
  }
}

// ── Save ──────────────────────────────────────────────────────────
const saveTradeIn = async () => {
  if (!$supabase) return
  saving.value = true
  try {
    const { data: { user } } = await ($supabase as any).auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await ($supabase as any).from('trade_ins').insert({
      profile_id:        user.id,
      customer_id:       form.customerId || null,
      brand:             form.brand,
      model:             form.model,
      model_number:      form.model_number || '',
      imei:              form.imei || '',
      storage:           form.storage,
      color:             form.color,
      condition_grade:   form.condition_grade,
      age_years:         form.age_years,
      screen_condition:  form.screen_condition,
      battery_health:    form.battery_health,
      functional_issues: form.functional_issues,
      cosmetic_issues:   form.cosmetic_issues,
      accessories:       form.accessories,
      icloud_locked:     form.icloud_locked,
      frp_locked:        form.frp_locked,
      market_price:      effectiveMarketPrice.value || null,
      repair_cost_est:   form.repair_cost_est || 0,
      offer_price:       form.offer_price,
      estimated_resale:  estimatedResale.value,
      estimated_profit:  estimatedProfit.value,
      status:            'Pending',
      notes:             form.notes,
    })
    if (error) throw error

    // Reset form after save
    Object.assign(form, defaultForm())
    currentStep.value = 1
    marketPriceResult.value = null
    priceError.value = ''
    resolvedDevice.value = null
    imeiValidState.value = null

    await navigateTo('/dashboard')
  } catch (err: any) {
    console.error('[TradeIn save error]', err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.wi-label {
  display: block;
  font-size: 10px;
  font-weight: 800;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.375rem;
}

.wi-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.7);
  color: hsl(var(--foreground));
  outline: none;
  transition: all 0.2s ease;
}
.wi-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px #f59e0b18; background: hsl(var(--background)); }
.wi-input.resize-none { height: auto; padding-top: 10px; padding-bottom: 10px; }

.wi-range { width: 100%; accent-color: #f59e0b; cursor: pointer; }

.wi-check {
  width: 16px; height: 16px; border-radius: 5px;
  accent-color: #f59e0b; cursor: pointer; flex-shrink: 0;
}

/* Pills / badges */
.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.pill-neutral {
  background: hsl(var(--muted)/0.6);
  color: hsl(var(--muted-foreground));
}

.grade-chip {
  display: flex; flex-direction: column; align-items: center;
  padding: 14px 10px; border-radius: 18px; gap: 4px;
  background: hsl(var(--muted)/0.4);
  outline: 1.5px solid hsl(var(--border)/0.5); outline-offset: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}
.grade-chip:hover { transform: scale(1.04) translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
.grade-chip:active { transform: scale(0.97); }
.grade-chip--active { outline-width: 2px; }
</style>
