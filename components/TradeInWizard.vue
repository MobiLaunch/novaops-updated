<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :draggable="false"
    class="w-full max-w-[800px] mx-4"
    :show-header="false"
    pt:content:class="!p-0 !rounded-2xl overflow-hidden"
  >
    <div class="flex flex-col bg-surface text-foreground" style="max-height: 90dvh">

      <!-- Header -->
      <div class="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border/50 bg-surface">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-[22px] flex items-center justify-center shadow-md flex-shrink-0"
            style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 16px #f59e0b40">
            <i class="mdi mdi-swap-horizontal-text-xl-text-white"></i>
          </div>
          <div class="flex-grow min-w-0">
            <h2 class="text-sm font-black truncate">Device Trade-In Evaluator</h2>
            <p class="text-[11px] text-muted-foreground font-medium mt-0.5">
              Step {{ currentStep }} of {{ TOTAL_STEPS }} — {{ stepTitles[currentStep - 1] }}
            </p>
          </div>
          <!-- Progress bar -->
          <div class="flex gap-1 mr-4 shrink-0">
            <div v-for="i in TOTAL_STEPS" :key="i"
              class="h-1.5 rounded-full transition-all duration-500"
              :class="i <= currentStep ? 'w-6' : 'w-2.5'"
              :style="i <= currentStep ? 'background: #f59e0b' : 'background: hsl(var(--border))'" />
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="flex-grow overflow-y-auto px-6 py-5">

        <!-- ── Step 1: Device Identity ── -->
        <div v-if="currentStep === 1" class="space-y-4">
          <p class="step-hint">What device is the customer bringing in?</p>

          <!-- Customer picker -->
          <div class="space-y-1.5">
            <label class="wi-label">Customer <span class="text-muted-foreground font-normal normal-case">(optional)</span></label>
            <CustomerSelect v-model="form.customerId" />
          </div>

          <div class="grid grid-cols-2 gap-3">
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

          <!-- IMEI / Model Number -->
          <div class="rounded-[16px] p-4 space-y-3 bg-muted/40 border border-border/60">
            <div class="flex items-center gap-2">
              <i class="mdi mdi-fingerprint-text-muted-foreground-text-sm"></i>
              <p class="text-xs font-black">Device Identifiers <span class="font-normal text-muted-foreground">(improves lookup accuracy)</span></p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="wi-label">IMEI / Serial</label>
                <input
                  v-model="form.imei"
                  placeholder="15-digit IMEI…"
                  class="wi-input font-mono text-xs"
                  maxlength="17"
                  @input="imeiValidState = null"
                />
                <p v-if="form.imei && imeiValidState === false" class="text-[10px] text-destructive font-medium">Invalid IMEI (check digits)</p>
                <p v-else class="text-[10px] text-muted-foreground">Dial *#06# to find IMEI</p>
              </div>
              <div class="space-y-1.5">
                <label class="wi-label">Model Number</label>
                <input
                  v-model="form.model_number"
                  placeholder="MQ3D3LL/A, SM-G998B…"
                  class="wi-input font-mono text-xs"
                />
                <p class="text-[10px] text-muted-foreground">Found in Settings → About</p>
              </div>
            </div>
          </div>

          <!-- Resolved device banner (shown when IMEI/model# resolved the device) -->
          <div v-if="resolvedDevice" class="flex items-center gap-3 p-3 rounded-[14px] bg-emerald-500/10 border border-emerald-500/20">
            <i class="mdi mdi-check-circle-outline-text-base-text-emerald-500-shrink-0"></i>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-black text-emerald-600 dark:text-emerald-400">Device identified via {{ resolvedDevice.method }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ resolvedDevice.brand }} {{ resolvedDevice.model }}{{ resolvedDevice.storage ? ' · ' + resolvedDevice.storage : '' }}</p>
            </div>
            <button class="text-[10px] text-muted-foreground hover:text-foreground underline" @click="resolvedDevice = null">Clear</button>
          </div>

          <!-- Market price fetch -->
          <div class="rounded-[18px] p-4 space-y-3 bg-amber-500/5 border border-amber-500/10">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="mdi mdi-trending-up-text-base-text-amber-500"></i>
                <p class="text-xs font-black">Live Market Price</p>
              </div>
              <button
                class="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500 text-white"
                :disabled="(!form.brand && !form.model && !form.imei && !form.model_number) || fetchingPrice"
                @click="fetchMarketPrice"
              >
                <div v-if="fetchingPrice" class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <i class="mdi mdi-magnify-text-xs" v-else></i>
                {{ fetchingPrice ? fetchingStage : 'Look Up' }}
              </button>
            </div>

            <!-- Results -->
            <div v-if="marketPriceResult" class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground">eBay avg (sold listings)</span>
                <span class="font-black text-sm text-amber-600 dark:text-amber-400">{{ currency }}{{ marketPriceResult.ebay_avg.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground">Swappa avg</span>
                <span class="font-black text-sm text-amber-600 dark:text-amber-400">{{ currency }}{{ marketPriceResult.swappa_avg.toFixed(2) }}</span>
              </div>
              <hr class="border-t border-border/40 my-1" />
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold">Used Market Median</span>
                <span class="font-black text-base text-amber-600 dark:text-amber-400">{{ currency }}{{ marketPriceResult.median.toFixed(2) }}</span>
              </div>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600">
                  via {{ marketPriceResult.lookup_method === 'imei' ? 'IMEI' : marketPriceResult.lookup_method === 'model_number' ? 'Model #' : 'Name search' }}
                </span>
                <p class="text-[10px] text-muted-foreground">{{ marketPriceResult.source_note }}</p>
              </div>
            </div>
            <div v-else-if="priceError" class="space-y-1">
              <p class="text-xs text-red-500 font-medium">{{ priceError }}</p>
              <p class="text-[10px] text-muted-foreground">Try adding an IMEI or model number above for a more precise lookup.</p>
            </div>
            <div v-else class="text-xs text-muted-foreground">
              Enter device details above then tap Look Up. IMEI or model number gives the most accurate results.
            </div>

            <!-- Manual override -->
            <div class="space-y-1.5 pt-2 border-t border-border/30">
              <label class="wi-label">Manual Market Price Override</label>
              <input v-model.number="form.market_price" type="number" min="0" step="0.01" placeholder="0.00" class="wi-input font-mono" />
              <p class="text-[10px] text-muted-foreground">Enter the current market value manually if the lookup doesn't find a result.</p>
            </div>
          </div>
        </div>

        <!-- ── Step 2: Condition ── -->
        <div v-if="currentStep === 2" class="space-y-5">
          <p class="step-hint">Assess the device's overall condition.</p>

          <div class="space-y-2">
            <label class="wi-label">Overall Grade</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button v-for="g in conditionGrades" :key="g.value"
                class="grade-chip"
                :class="form.condition_grade === g.value ? 'grade-chip--active' : ''"
                :style="form.condition_grade === g.value ? `background: ${g.color}15; border-color: ${g.color}50; color: ${g.color}` : ''"
                @click="form.condition_grade = g.value">
                <span class="text-xl">{{ g.emoji }}</span>
                <span class="text-xs font-black mt-1">{{ g.label }}</span>
                <span class="text-[10px] text-muted-foreground font-medium leading-tight text-center">{{ g.desc }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="wi-label">Screen Condition</label>
              <div class="space-y-1.5">
                <button v-for="s in screenConditions" :key="s.value"
                  class="w-full flex items-center gap-3 p-3 rounded-[14px] text-left transition-all border"
                  :style="form.screen_condition === s.value
                    ? `background: ${s.color}15; border-color: ${s.color}40; color: ${s.color}`
                    : 'background: hsl(var(--muted)/0.3); border-color: border;'"
                  @click="form.screen_condition = s.value">
                  <span class="text-base">{{ s.emoji }}</span>
                  <div>
                    <p class="text-xs font-bold">{{ s.label }}</p>
                    <p class="text-[10px] text-muted-foreground">{{ s.desc }}</p>
                  </div>
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="wi-label mb-0">Battery Health</label>
                  <span class="text-sm font-black"
                    :style="{ color: form.battery_health >= 80 ? '#10b981' : form.battery_health >= 60 ? '#f59e0b' : '#ef4444' }">
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
                    class="py-2 px-1 rounded-[12px] text-[11px] font-bold transition-all text-center border"
                    :style="form.age_years === a.value
                      ? 'background: #6366f115; color: #6366f1; border-color: #6366f130;'
                      : 'background: hsl(var(--muted)/0.3); color: hsl(var(--muted-foreground)); border-color: transparent;'"
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
          <p class="step-hint">Select all issues present and what's included.</p>

          <div class="space-y-3">
            <label class="wi-label">Functional Issues <span class="text-muted-foreground font-normal normal-case">(select all that apply)</span></label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button v-for="issue in functionalIssues" :key="issue.value"
                class="flex items-center gap-2 p-3 rounded-[14px] text-left transition-all text-xs font-bold border"
                :style="form.functional_issues.includes(issue.value)
                  ? 'background: #ef444415; border-color: #ef444430; color: #ef4444;'
                  : 'background: hsl(var(--muted)/0.3); border-color: transparent; color: hsl(var(--foreground));'"
                @click="toggleIssue('functional', issue.value)">
                <span class="text-base flex-shrink-0">{{ issue.emoji }}</span>
                {{ issue.label }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <label class="wi-label">Cosmetic Issues <span class="text-muted-foreground font-normal normal-case">(select all that apply)</span></label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button v-for="issue in cosmeticIssues" :key="issue.value"
                class="flex items-center gap-2 p-3 rounded-[14px] text-left transition-all text-xs font-bold border"
                :style="form.cosmetic_issues.includes(issue.value)
                  ? 'background: #f59e0b15; border-color: #f59e0b30; color: #d97706;'
                  : 'background: hsl(var(--muted)/0.3); border-color: transparent; color: hsl(var(--foreground));'"
                @click="toggleIssue('cosmetic', issue.value)">
                <span class="text-base flex-shrink-0">{{ issue.emoji }}</span>
                {{ issue.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <label class="wi-label">Accessories Included</label>
              <div class="space-y-1.5">
                <button v-for="acc in accessoryOptions" :key="acc.value"
                  class="w-full flex items-center gap-2.5 p-2.5 rounded-[12px] text-xs font-bold transition-all border"
                  :style="form.accessories.includes(acc.value)
                    ? 'background: #10b98115; border-color: #10b98130; color: #10b981;'
                    : 'background: hsl(var(--muted)/0.3); border-color: transparent;'"
                  @click="toggleAccessory(acc.value)">
                  <span class="text-base">{{ acc.emoji }}</span>
                  {{ acc.label }}
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <label class="wi-label">Lock Status</label>
              <div class="space-y-2">
                <div class="p-3 rounded-[14px] bg-muted/40 border">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" v-model="form.icloud_locked" class="wi-check mt-0.5" />
                    <div>
                      <p class="text-xs font-black">iCloud / Activation Lock</p>
                      <p class="text-[10px] text-muted-foreground mt-0.5">Device is locked to an Apple ID</p>
                    </div>
                  </label>
                </div>
                <div class="p-3 rounded-[14px] bg-muted/40 border">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" v-model="form.frp_locked" class="wi-check mt-0.5" />
                    <div>
                      <p class="text-xs font-black">Google FRP Lock</p>
                      <p class="text-[10px] text-muted-foreground mt-0.5">Factory Reset Protection active</p>
                    </div>
                  </label>
                </div>
              </div>

              <div class="space-y-1.5 mt-2">
                <label class="wi-label">Repair Cost Estimate</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{{ currency }}</span>
                  <input v-model.number="form.repair_cost_est" type="number" min="0" step="0.01" placeholder="0.00" class="wi-input pl-7 font-mono" />
                </div>
                <p class="text-[10px] text-muted-foreground">Cost to repair/refurbish before resale</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Step 4: Offer & Summary ── -->
        <div v-if="currentStep === 4" class="space-y-5">
          <p class="step-hint">Review the calculated offer and adjust before presenting to the customer.</p>

          <!-- Pricing breakdown card -->
          <div class="rounded-[22px] overflow-hidden border border-border/80">
            <div class="px-5 py-4" style="background: linear-gradient(135deg, #f59e0b0a, #d9770608)">
              <p class="text-xs font-black uppercase tracking-widest text-amber-500">Valuation Summary</p>
              <p class="text-sm text-muted-foreground mt-0.5 font-medium">{{ form.brand }} {{ form.model }} {{ form.storage }}</p>
            </div>
            <div class="divide-y divide-border/50">
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-xs font-semibold">Market Value (used)</p>
                  <p class="text-[10px] text-muted-foreground">Based on sold listings / lookup</p>
                </div>
                <span class="font-black text-sm">{{ currency }}{{ effectiveMarketPrice.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-xs font-semibold text-orange-500">Condition Deductions</p>
                  <p class="text-[10px] text-muted-foreground">Grade, screen, battery, issues, locks</p>
                </div>
                <span class="font-black text-sm text-orange-500">− {{ currency }}{{ deductions.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-xs font-semibold text-purple-500">Repair / Refurb Cost</p>
                  <p class="text-[10px] text-muted-foreground">Estimated to restore to sellable condition</p>
                </div>
                <span class="font-black text-sm text-purple-500">− {{ currency }}{{ (form.repair_cost_est || 0).toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-5 py-3">
                <div>
                  <p class="text-xs font-semibold text-emerald-500">Accessory Bonus</p>
                  <p class="text-[10px] text-muted-foreground">Box, charger, earphones included</p>
                </div>
                <span class="font-black text-sm text-emerald-500">+ {{ currency }}{{ accessoryBonus.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-5 py-4 bg-amber-500/5">
                <div>
                  <p class="text-sm font-black">Calculated Offer Price</p>
                  <p class="text-[10px] text-muted-foreground">What you pay the customer</p>
                </div>
                <span class="text-2xl font-black text-amber-500">{{ currency }}{{ calculatedOffer.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Adjustable offer -->
          <div class="space-y-1.5">
            <label class="wi-label">Final Offer Price <span class="text-muted-foreground font-normal normal-case">(adjust as needed)</span></label>
            <div class="flex items-center gap-3">
              <div class="relative flex-grow">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">{{ currency }}</span>
                <input v-model.number="form.offer_price" type="number" min="0" step="0.50" class="wi-input pl-7 font-mono text-base font-black border-amber-500 focus:ring-amber-500/20" />
              </div>
              <button class="h-11 px-4 rounded-[14px] text-xs font-bold transition-all border bg-muted/40"
                @click="form.offer_price = calculatedOffer">Reset</button>
            </div>
          </div>

          <!-- Estimated resale & profit -->
          <div class="grid grid-cols-3 gap-3">
            <div class="p-4 rounded-[18px] text-center bg-indigo-500/5 border border-indigo-500/10">
              <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Est. Resale</p>
              <p class="text-base font-black text-indigo-500">{{ currency }}{{ estimatedResale.toFixed(2) }}</p>
            </div>
            <div class="p-4 rounded-[18px] text-center border" 
              :class="[estimatedProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10']">
              <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Est. Profit</p>
              <p class="text-base font-black" :style="{ color: estimatedProfit >= 0 ? '#10b981' : '#ef4444' }">
                {{ estimatedProfit >= 0 ? '' : '−' }}{{ currency }}{{ Math.abs(estimatedProfit).toFixed(2) }}
              </p>
            </div>
            <div class="p-4 rounded-[18px] text-center border" 
              :class="[profitMargin >= 20 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10']">
              <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Margin</p>
              <p class="text-base font-black" :style="{ color: profitMargin >= 20 ? '#10b981' : '#f59e0b' }">{{ profitMargin.toFixed(0) }}%</p>
            </div>
          </div>

          <!-- Warning banners -->
          <div v-if="form.icloud_locked || form.frp_locked" class="flex items-start gap-3 p-3 rounded-[14px] bg-red-500/10 border border-red-500/20">
            <i class="mdi mdi-alert-outline text-base text-red-500 shrink-0 mt-0.5"></i>
            <p class="text-xs font-semibold text-red-600 dark:text-red-400">
              This device has {{ [form.icloud_locked && 'iCloud Lock', form.frp_locked && 'FRP Lock'].filter(Boolean).join(' + ') }}.
              Ensure the customer can provide proof of ownership and removal before completing the trade-in.
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="wi-label">Internal Notes</label>
            <textarea v-model="form.notes" class="wi-input resize-none" rows="2" placeholder="Any additional observations…" />
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="flex-shrink-0 flex gap-3 px-6 pb-6 pt-4 border-t border-border/50 bg-surface">
        <button v-if="currentStep > 1"
          class="h-11 px-5 rounded-full text-xs font-bold transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-1.5 border"
          @click="currentStep--">
          <i class="mdi mdi-chevron-left-text-base"></i> Back
        </button>
        <button class="h-11 px-5 rounded-full text-xs font-bold transition-all hover:scale-[1.03] active:scale-95 border"
          @click="handleClose">Cancel</button>

        <div class="flex-grow" />

        <button v-if="currentStep < TOTAL_STEPS"
          class="h-11 px-6 rounded-full text-xs font-black text-white flex items-center gap-2 transition-all hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95"
          :class="[
            canProceed
              ? 'bg-amber-500 hover:shadow-lg active:shadow-sm'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
          ]"
          :disabled="!canProceed"
          @click="nextStep">
          Next <i class="mdi mdi-chevron-right-text-base"></i>
        </button>

        <button v-else
          class="h-11 px-6 rounded-full text-xs font-black text-white flex items-center gap-2 transition-all hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 bg-emerald-500"
          :disabled="saving"
          @click="saveTradeIn">
          <div v-if="saving" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <i class="mdi mdi-check-circle-outline-text-base" v-else></i>
          {{ saving ? 'Saving…' : 'Save Trade-In' }}
        </button>
      </div>

    </div>
  </Dialog>
</template>

<script setup lang="ts">
import CustomerSelect from '~/components/CustomerSelect.vue'
import Dialog from 'primevue/dialog'
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'
import { ref, computed, watch, reactive } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'saved'])

const { $supabase } = useNuxtApp()
const appStore = useAppStore()
const { settings } = storeToRefs(appStore)
const currency = computed(() => settings.value?.currency || '$')

const isOpen = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

// ── Constants ─────────────────────────────────────────────────────
const TOTAL_STEPS = 4
const stepTitles = ['Device Identity', 'Condition Assessment', 'Issues & Accessories', 'Offer & Summary']

const knownBrands = ['Apple', 'Samsung', 'Google', 'Sony', 'LG', 'Microsoft', 'Dell', 'HP',
  'Lenovo', 'ASUS', 'Acer', 'Huawei', 'OnePlus', 'Motorola', 'Nokia', 'Xiaomi', 'Oppo']

const storageOptions = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']

const conditionGrades = [
  { value: 'Excellent', label: 'Excellent', emoji: '⭐', desc: 'Like new, minimal use', color: '#10b981' },
  { value: 'Good',      label: 'Good',      emoji: '✅', desc: 'Normal wear, fully functional', color: '#6366f1' },
  { value: 'Fair',      label: 'Fair',      emoji: '🔶', desc: 'Visible wear, works fine', color: '#f59e0b' },
  { value: 'Poor',      label: 'Poor',      emoji: '🔴', desc: 'Heavy damage or issues', color: '#ef4444' },
]

const screenConditions = [
  { value: 'Perfect',         label: 'Perfect',          emoji: '✨', desc: 'No scratches or damage', color: '#10b981' },
  { value: 'Minor Scratches', label: 'Minor Scratches',  emoji: '🔍', desc: 'Light marks, visible in light', color: '#6366f1' },
  { value: 'Cracked',         label: 'Cracked',          emoji: '💔', desc: 'Cracked but touchscreen works', color: '#f59e0b' },
  { value: 'Shattered',       label: 'Shattered',        emoji: '💥', desc: 'Severely broken, touch issues', color: '#ef4444' },
]

const ageOptions = [
  { value: 0.5, label: '< 1 yr' }, { value: 1, label: '1 yr' }, { value: 2, label: '2 yrs' },
  { value: 3, label: '3 yrs' },    { value: 4, label: '4 yrs' }, { value: 5, label: '5+ yrs' },
]

const functionalIssues = [
  { value: 'wont_turn_on',    label: "Won't Turn On",   emoji: '🔌' },
  { value: 'charging_port',   label: 'Charging Port',   emoji: '🔋' },
  { value: 'battery_dead',    label: 'Battery Dead',    emoji: '⚡' },
  { value: 'camera',          label: 'Camera Issues',   emoji: '📷' },
  { value: 'speaker',         label: 'Speaker/Mic',     emoji: '🔊' },
  { value: 'wifi_bt',         label: 'WiFi/Bluetooth',  emoji: '📶' },
  { value: 'face_id',         label: 'Face/Touch ID',   emoji: '🔐' },
  { value: 'water_damage',    label: 'Water Damage',    emoji: '💧' },
  { value: 'buttons',         label: 'Buttons Broken',  emoji: '🔘' },
]

const cosmeticIssues = [
  { value: 'back_cracked',  label: 'Back Glass Cracked', emoji: '📱' },
  { value: 'dents',         label: 'Dents / Bends',       emoji: '🔨' },
  { value: 'scratches',     label: 'Deep Scratches',      emoji: '✏️' },
  { value: 'camera_lens',   label: 'Camera Lens Crack',   emoji: '🔭' },
  { value: 'missing_parts', label: 'Missing Parts',       emoji: '🔩' },
]

const accessoryOptions = [
  { value: 'original_box',  label: 'Original Box',   emoji: '📦' },
  { value: 'charger',       label: 'Charger/Cable',  emoji: '🔌' },
  { value: 'earphones',     label: 'Earphones',      emoji: '🎧' },
  { value: 'case',          label: 'Case',           emoji: '🛡️' },
]

// ── Deduction weights (% of market price) ─────────────────────────
const GRADE_DEDUCTIONS: Record<string, number> = {
  Excellent: 0.05, Good: 0.15, Fair: 0.30, Poor: 0.50
}
const SCREEN_DEDUCTIONS: Record<string, number> = {
  Perfect: 0, 'Minor Scratches': 0.05, Cracked: 0.15, Shattered: 0.28
}
const FUNCTIONAL_ISSUE_COST = 25  // flat $ per issue
const COSMETIC_ISSUE_COST   = 10
const LOCK_PENALTY          = 0.40  // 40% of market if locked
const AGE_DEDUCTION_PER_YR  = 0.06  // 6% per year
const ACCESSORY_VALUES: Record<string, number> = {
  original_box: 8, charger: 6, earphones: 5, case: 3
}

// ── Form state ────────────────────────────────────────────────────
const defaultForm = () => ({
  customerId:          null as number | null,
  brand:               '',
  model:               '',
  model_number:        '',
  imei:                '',
  storage:             '',
  color:               '',
  market_price:        null as number | null,
  condition_grade:     'Good',
  age_years:           1,
  screen_condition:    'Perfect',
  battery_health:      80,
  functional_issues:   [] as string[],
  cosmetic_issues:     [] as string[],
  accessories:         [] as string[],
  icloud_locked:       false,
  frp_locked:          false,
  repair_cost_est:     0,
  offer_price:         0,
  notes:               '',
})

const form = reactive(defaultForm())
const currentStep   = ref(1)
const saving        = ref(false)
const fetchingPrice = ref(false)
const fetchingStage = ref('Searching…')
const priceError    = ref('')
const imeiValidState = ref<boolean | null>(null)
const resolvedDevice = ref<{ brand: string; model: string; storage?: string; method: string } | null>(null)
const marketPriceResult = ref<{
  ebay_avg: number
  swappa_avg: number
  median: number
  source_note: string
  lookup_method: string
} | null>(null)

// ── Computed pricing ──────────────────────────────────────────────
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
  form.accessories.reduce((sum, a) => sum + (ACCESSORY_VALUES[a] || 0), 0)
)

const calculatedOffer = computed(() => {
  const raw = effectiveMarketPrice.value - deductions.value - (form.repair_cost_est || 0) + accessoryBonus.value
  return Math.max(Math.round(raw * 2) / 2, 0)
})

const estimatedResale = computed(() =>
  Math.max(effectiveMarketPrice.value - deductions.value * 0.3, calculatedOffer.value + 20)
)

const estimatedProfit = computed(() =>
  estimatedResale.value - (form.offer_price || calculatedOffer.value) - (form.repair_cost_est || 0)
)

const profitMargin = computed(() => {
  const resale = estimatedResale.value
  if (!resale) return 0
  return (estimatedProfit.value / resale) * 100
})

// Auto-set offer price when it changes
watch(calculatedOffer, (val) => {
  if (!form.offer_price) form.offer_price = val
}, { immediate: true })

// ── Navigation ────────────────────────────────────────────────────
const canProceed = computed(() => {
  if (currentStep.value === 1) return !!form.brand && !!form.model
  if (currentStep.value === 2) return !!form.condition_grade && !!form.screen_condition
  return true
})

const nextStep = () => {
  if (!canProceed.value) return
  if (currentStep.value === 3) form.offer_price = calculatedOffer.value
  currentStep.value++
}

// ── Market price lookup ───────────────────────────────────────────
const fetchMarketPrice = async () => {
  const hasIdentifier = form.brand || form.model || form.imei || form.model_number
  if (!hasIdentifier || fetchingPrice.value) return

  fetchingPrice.value = true
  priceError.value = ''
  marketPriceResult.value = null
  resolvedDevice.value = null

  // Validate IMEI client-side first
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
        brand:        form.brand || undefined,
        model:        form.model || undefined,
        storage:      form.storage || undefined,
        imei:         form.imei || undefined,
        model_number: form.model_number || undefined,
      },
    }) as any

    if (!result.ok) {
      priceError.value = result.error || 'Lookup failed. Enter market price manually.'
      return
    }

    if (result.resolved_brand || result.resolved_model) {
      const methodLabel = result.lookup_method === 'imei' ? 'IMEI lookup'
        : result.lookup_method === 'model_number' ? 'model number' : 'name search'

      if (result.resolved_brand && !form.brand) form.brand = result.resolved_brand
      if (result.resolved_model && !form.model) form.model = result.resolved_model
      if (result.resolved_storage && !form.storage) form.storage = result.resolved_storage

      if (result.lookup_method !== 'name') {
        resolvedDevice.value = {
          brand:   result.resolved_brand || form.brand,
          model:   result.resolved_model || form.model,
          storage: result.resolved_storage || form.storage || undefined,
          method:  methodLabel,
        }
      }
    }

    marketPriceResult.value = {
      ebay_avg:      result.ebay_avg,
      swappa_avg:    result.swappa_avg,
      median:        result.median,
      source_note:   result.source_note,
      lookup_method: result.lookup_method,
    }

    if (!form.market_price) form.market_price = result.median

  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Lookup failed'
    priceError.value = `${msg} — enter market price manually.`
  } finally {
    fetchingPrice.value = false
    fetchingStage.value = 'Searching…'
  }
}

// ── Issue toggles ─────────────────────────────────────────────────
const toggleIssue = (type: 'functional' | 'cosmetic', value: string) => {
  const arr = type === 'functional' ? form.functional_issues : form.cosmetic_issues
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
}

const toggleAccessory = (value: string) => {
  const idx = form.accessories.indexOf(value)
  if (idx >= 0) form.accessories.splice(idx, 1)
  else form.accessories.push(value)
}

// ── Save ──────────────────────────────────────────────────────────
const saveTradeIn = async () => {
  if (!$supabase) return
  saving.value = true
  try {
    const { data: { user } } = await ($supabase as any).auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const resaleVal = estimatedResale.value
    const profitVal = estimatedProfit.value

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
      estimated_resale:  resaleVal,
      estimated_profit:  profitVal,
      status:            'Pending',
      notes:             form.notes,
    })
    if (error) throw error

    emit('saved')
    handleClose()
  } catch (err: any) {
    console.error('[TradeIn save error]', err)
  } finally {
    saving.value = false
  }
}

// ── Reset ─────────────────────────────────────────────────────────
const handleClose = () => {
  Object.assign(form, defaultForm())
  currentStep.value = 1
  marketPriceResult.value = null
  priceError.value = ''
  resolvedDevice.value = null
  imeiValidState.value = null
  isOpen.value = false
}

watch(isOpen, (v) => { if (!v) handleClose() })
</script>

<style scoped>
.step-hint {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

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

.wi-range {
  width: 100%;
  accent-color: #f59e0b;
  cursor: pointer;
}

.wi-check {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  accent-color: #f59e0b;
  cursor: pointer;
  flex-shrink: 0;
}

.grade-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px;
  border-radius: 18px;
  background: hsl(var(--muted)/0.4);
  border: 1.5px solid border;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  gap: 4px;
}
.grade-chip:hover { transform: scale(1.04) translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
.grade-chip:active { transform: scale(0.97); }
.grade-chip--active { border-width: 2px; }
</style>
