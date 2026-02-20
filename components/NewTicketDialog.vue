<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0">

      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-border" style="background: #f59e0b08">
        <div class="w-9 h-9 rounded-2xl flex items-center justify-center" style="background: #f59e0b20">
          <TicketPlus class="w-4 h-4" style="color: #f59e0b" />
        </div>
        <div class="flex-1">
          <h2 class="font-semibold text-base">Create New Ticket</h2>
          <div class="flex items-center gap-1.5 mt-1">
            <div
              v-for="n in 4"
              :key="n"
              class="h-1 rounded-full transition-all duration-300"
              :style="`width: ${currentStep >= n ? '24px' : '8px'}; background: ${currentStep >= n ? '#f59e0b' : 'hsl(var(--muted))'}`"
            />
          </div>
        </div>
        <span class="text-xs text-muted-foreground font-medium">Step {{ currentStep }} of 4</span>
      </div>

      <div class="p-6">

        <!-- ── Step 1: Brand & Category ──────────────────────────────── -->
        <div v-if="currentStep === 1" class="space-y-5">
          <div>
            <p class="text-sm font-semibold mb-3">Select Brand</p>
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                v-for="brand in brands"
                :key="brand"
                class="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:bg-accent text-center"
                :style="selectedBrand === brand
                  ? 'border-color: #f59e0b; background: #f59e0b12'
                  : 'border-color: hsl(var(--border)); background: transparent'"
                @click="selectBrand(brand)"
              >
                <span class="text-xl">{{ brandEmoji(brand) }}</span>
                <span class="text-xs font-semibold leading-tight">{{ brand }}</span>
              </button>
            </div>
          </div>

          <div v-if="selectedBrand && selectedBrand !== 'Other'">
            <p class="text-sm font-semibold mb-3">Select Category</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="cat in categoriesForBrand"
                :key="cat"
                class="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all hover:bg-accent text-left"
                :style="selectedCategory === cat
                  ? 'border-color: #f59e0b; background: #f59e0b12'
                  : 'border-color: hsl(var(--border))'"
                @click="selectCategory(cat)"
              >
                <component :is="categoryIcon(cat)" class="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <span class="text-sm font-medium">{{ cat }}</span>
              </button>
            </div>
          </div>

          <!-- Other -->
          <button
            class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed transition-all hover:bg-accent text-left"
            :style="selectedBrand === 'Other' ? 'border-color: #f59e0b; background: #f59e0b12' : 'border-color: hsl(var(--border))'"
            @click="selectBrand('Other'); selectCategory('Other')"
          >
            <HelpCircle class="w-4 h-4 text-muted-foreground" />
            <span class="text-sm font-medium text-muted-foreground">Other / Not listed</span>
          </button>
        </div>

        <!-- ── Step 2: Model Search ───────────────────────────────────── -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors" @click="currentStep = 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <div>
              <p class="text-sm font-semibold">{{ selectedBrand === 'Other' ? 'Enter Device' : `${selectedBrand} › ${selectedCategory}` }}</p>
              <p v-if="selectedBrand !== 'Other'" class="text-xs text-muted-foreground">{{ modelsForCategory.length }} models available</p>
            </div>
          </div>

          <!-- Search bar (only when not Other) -->
          <div v-if="selectedBrand !== 'Other'" class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              v-model="modelSearch"
              placeholder="Search models…"
              class="w-full h-10 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30"
              autofocus
            />
          </div>

          <!-- Model grid -->
          <div v-if="selectedBrand !== 'Other'" class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            <button
              v-for="model in filteredModels"
              :key="model"
              class="px-4 py-2.5 rounded-2xl border-2 transition-all hover:bg-accent text-left text-sm font-medium"
              :style="selectedModel === model
                ? 'border-color: #f59e0b; background: #f59e0b12'
                : 'border-color: hsl(var(--border))'"
              @click="selectModel(model)"
            >
              {{ model }}
            </button>
            <div v-if="filteredModels.length === 0" class="col-span-2 text-center py-6 text-sm text-muted-foreground">
              No models match "{{ modelSearch }}"
            </div>
          </div>

          <!-- Custom / manual input -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {{ selectedBrand === 'Other' ? 'Device Name *' : 'Or enter custom model' }}
            </label>
            <input
              v-model="customModel"
              :placeholder="selectedBrand === 'Other' ? 'e.g. Google Pixel 9, Surface Pro 10…' : 'Enter model name…'"
              class="w-full h-10 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30"
              @input="if (customModel) selectedModel = ''"
              @keyup.enter="customModel && nextStep()"
            />
          </div>
        </div>

        <!-- ── Step 3: Issue ──────────────────────────────────────────── -->
        <div v-if="currentStep === 3" class="space-y-4">
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors" @click="currentStep = 2">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <p class="text-sm font-semibold">Select Issue</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              v-for="issue in issues"
              :key="issue.name"
              class="p-4 rounded-2xl border-2 transition-all hover:bg-accent text-left"
              :style="selectedIssue === issue.name
                ? 'border-color: #f59e0b; background: #f59e0b12'
                : 'border-color: hsl(var(--border))'"
              @click="selectIssue(issue.name)"
            >
              <div class="flex items-start gap-3">
                <component :is="issue.icon" class="w-5 h-5 flex-shrink-0 mt-0.5" :style="selectedIssue === issue.name ? 'color: #f59e0b' : 'color: hsl(var(--muted-foreground))'" />
                <div>
                  <p class="text-sm font-semibold">{{ issue.name }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ issue.description }}</p>
                </div>
              </div>
            </button>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Or describe custom issue</label>
            <textarea
              v-model="customIssue"
              placeholder="Describe the problem in detail…"
              rows="3"
              class="w-full px-3 py-2.5 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
              @input="if (customIssue) selectedIssue = ''"
            />
          </div>
        </div>

        <!-- ── Step 4: Details ────────────────────────────────────────── -->
        <div v-if="currentStep === 4" class="space-y-5">
          <div class="flex items-center gap-2">
            <button class="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors" @click="currentStep = 3">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <p class="text-sm font-semibold">Ticket Details</p>
          </div>

          <!-- Summary pills -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1 rounded-full text-xs font-semibold" style="background: #f59e0b18; color: #f59e0b">
              {{ selectedBrand }}{{ selectedCategory !== 'Other' ? ' › ' + selectedCategory : '' }}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{{ selectedModel || customModel }}</span>
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{{ selectedIssue || customIssue }}</span>
          </div>

          <!-- Customer -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer *</label>
              <button
                class="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                style="color: #f59e0b"
                @click="showNewCustomer = !showNewCustomer; ticketData.customerId = null"
              >
                <component :is="showNewCustomer ? Users : UserPlus" class="w-3.5 h-3.5" />
                {{ showNewCustomer ? 'Use existing customer' : 'Add new customer' }}
              </button>
            </div>

            <!-- Existing customer search -->
            <div v-if="!showNewCustomer" class="space-y-2">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  v-model="customerSearch"
                  placeholder="Search by name, email or phone…"
                  class="w-full h-10 pl-9 pr-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div class="max-h-48 overflow-y-auto space-y-1 pr-1">
                <button
                  v-for="customer in filteredCustomers"
                  :key="customer.id"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border-2 transition-all hover:bg-accent text-left"
                  :style="ticketData.customerId === customer.id
                    ? 'border-color: #f59e0b; background: #f59e0b12'
                    : 'border-color: hsl(var(--border))'"
                  @click="ticketData.customerId = customer.id"
                >
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style="background: #f59e0b18">
                    <span class="text-xs font-bold" style="color: #f59e0b">{{ customer.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold truncate">{{ customer.name }}</p>
                    <p v-if="customer.email || customer.phone" class="text-xs text-muted-foreground truncate">{{ customer.email || customer.phone }}</p>
                  </div>
                  <CheckCircle v-if="ticketData.customerId === customer.id" class="w-4 h-4 flex-shrink-0" style="color: #f59e0b" />
                </button>
                <div v-if="filteredCustomers.length === 0" class="text-center py-6 text-sm text-muted-foreground">
                  No customers match "{{ customerSearch }}"
                </div>
              </div>
            </div>

            <!-- New customer inline form -->
            <div v-else class="rounded-2xl border border-border p-4 space-y-3" style="background: hsl(var(--muted)/0.3)">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-muted-foreground">Name *</label>
                  <input v-model="newCustomer.name" placeholder="Full name" class="w-full h-9 px-3 rounded-xl text-sm bg-background border border-border outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-muted-foreground">Phone</label>
                  <input v-model="newCustomer.phone" placeholder="(555) 000-0000" class="w-full h-9 px-3 rounded-xl text-sm bg-background border border-border outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-muted-foreground">Email</label>
                  <input v-model="newCustomer.email" placeholder="email@example.com" class="w-full h-9 px-3 rounded-xl text-sm bg-background border border-border outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-muted-foreground">Address</label>
                  <input v-model="newCustomer.address" placeholder="Street address" class="w-full h-9 px-3 rounded-xl text-sm bg-background border border-border outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
              </div>
              <p class="text-xs text-muted-foreground">This customer will be created when the ticket is saved.</p>
            </div>
          </div>

          <!-- Device condition -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Device Condition</label>
            <textarea
              v-model="ticketData.deviceDescription"
              placeholder="Color, visible damage, scratches, accessories included…"
              rows="2"
              class="w-full px-3 py-2.5 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serial Number</label>
              <input v-model="ticketData.serialNumber" placeholder="Optional" class="w-full h-10 px-3 rounded-2xl text-sm bg-muted/50 border-0 outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</label>
              <div class="flex gap-1.5 h-10">
                <button
                  v-for="p in ['low','normal','high']"
                  :key="p"
                  class="flex-1 rounded-xl text-xs font-semibold capitalize transition-all"
                  :style="ticketData.priority === p
                    ? `background: ${priorityColor(p)}22; color: ${priorityColor(p)}; outline: 1.5px solid ${priorityColor(p)}50`
                    : 'background: hsl(var(--muted)/0.5); color: hsl(var(--muted-foreground))'"
                  @click="ticketData.priority = p"
                >{{ p }}</button>
              </div>
            </div>
          </div>

          <!-- Signature -->
          <SignaturePad
            v-model="ticketData.signature"
            label="Customer Signature *"
            :width="550"
            :height="150"
          />
        </div>

      </div>

      <!-- Footer -->
      <div class="flex gap-3 px-6 py-4 border-t border-border">
        <button
          class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-muted/60"
          style="outline: 1.5px solid hsl(var(--border))"
          @click="handleCancel"
        >Cancel</button>

        <button
          v-if="currentStep < 4"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          :disabled="!canProceed"
          @click="nextStep"
        >
          Next <ChevronRight class="w-4 h-4" />
        </button>

        <button
          v-else
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          :disabled="!canCreate"
          @click="createTicket"
        >
          <TicketPlus class="w-4 h-4" /> Create Ticket
        </button>
      </div>

    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronLeft, ChevronRight, Search, CheckCircle,
  Smartphone, Laptop, Tablet, Watch, Gamepad2, Monitor,
  Headphones, HelpCircle, UserPlus, Users, TicketPlus, Tv,
  Zap, Droplets, Volume2, Wifi, Battery, Eye, Wrench
} from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import SignaturePad from '~/components/SignaturePad.vue'

const props = defineProps<{
  modelValue: boolean
  customers: any[]
}>()

const emit = defineEmits(['update:modelValue', 'create'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// ── Step state ────────────────────────────────────────────────────
const currentStep = ref(1)
const selectedBrand = ref('')
const selectedCategory = ref('')
const selectedModel = ref('')
const customModel = ref('')
const modelSearch = ref('')
const selectedIssue = ref('')
const customIssue = ref('')
const customerSearch = ref('')
const showNewCustomer = ref(false)
const newCustomer = ref({ name: '', phone: '', email: '', address: '' })

const ticketData = ref({
  customerId: null as number | null,
  deviceDescription: '',
  serialNumber: '',
  priority: 'normal',
  signature: ''
})

// ── Full device database (from devices_2019_2025.csv) ─────────────
const deviceDB: Record<string, Record<string, string[]>> = {"Dell":{"Laptop - XPS":["XPS 13 (9380)","XPS 15 (9580)","XPS 13 2-in-1 (7390)","XPS 13 (9300)","XPS 15 (9500)","XPS 17 (9700)","XPS 13 (9310)","XPS 13 2-in-1 (9310)","XPS 15 (9510)","XPS 17 (9710)","XPS 13 (9315)","XPS 13 Plus (9320)","XPS 15 (9520)","XPS 17 (9720)","XPS 13 (9340)","XPS 13 Plus (9320 refresh)","XPS 15 (9530)","XPS 17 (9730)","XPS 13 (9345 - Snapdragon X Elite)","XPS 14 (9440)","XPS 15 (9530 refresh)","XPS 16 (9640)","Dell 14 Premium (XPS rebranded)","Dell 16 Premium (XPS rebranded)"],"Laptop - Inspiron":["Inspiron 13 5000","Inspiron 14 5000","Inspiron 15 3000","Inspiron 15 5000","Inspiron 15 7000","Inspiron 17 5000","Inspiron 13 7000 2-in-1","Inspiron 14 7000","Inspiron 14 5000","Inspiron 15 5000","Inspiron 16 5000","Inspiron 14 Plus (7420)","Inspiron 16 Plus (7620)","Inspiron 14 (5430)","Inspiron 16 (5630)","Inspiron 14 (5445 - Snapdragon)","Inspiron 16 (5640)","Dell 14 Plus (Inspiron rebranded)","Dell 16 Plus (Inspiron rebranded)"],"Laptop - Vostro":["Vostro 13 5000","Vostro 15 7000","Vostro 14 5000","Vostro 15 5000","Vostro 14 5000 (annual refresh)","Vostro 15 5000 (annual refresh)","Vostro 14 5000 (annual refresh)","Vostro 16 5000","Dell Pro (Vostro rebranded)"],"Laptop - Latitude":["Latitude 7400","Latitude 5400","Latitude 3400","Latitude 9510","Latitude 7410","Latitude 5410","Latitude 3410","Latitude 9420","Latitude 7420","Latitude 5420","Latitude 3420","Latitude 9330","Latitude 7330","Latitude 5330","Latitude 3330","Latitude 9440","Latitude 7440","Latitude 5440","Latitude 3440","Latitude 9450","Latitude 7350","Latitude 5450","Dell Pro 13 (Latitude rebranded)","Dell Pro 14 (Latitude rebranded)","Dell Pro 16 (Latitude rebranded)"],"Laptop - Precision (Mobile Workstation)":["Precision 3540","Precision 3541","Precision 5540","Precision 7540","Precision 7740","Precision 3551","Precision 5550","Precision 7550","Precision 7750","Precision 3561","Precision 5560","Precision 7560","Precision 7760","Precision 3571","Precision 5570","Precision 7670","Precision 7770","Precision 3581","Precision 5580","Precision 7680","Precision 7780","Precision 3591","Precision 5590","Precision 7690","Dell Pro Max 14","Dell Pro Max 16"],"Laptop - Alienware (Gaming)":["Alienware m15 R1","Alienware m17 R1","Alienware m15 R2","Alienware m17 R2","Alienware m15 R3","Alienware m17 R3","Alienware m15 R4","Alienware m17 R4","Alienware x14","Alienware x15 R2","Alienware x17 R2","Alienware m15 R7","Alienware m17 R5","Alienware m18","Alienware m16","Alienware x16","Alienware m16 R2","Alienware m18 R2"],"Laptop - Dell G Series (Budget Gaming)":["Dell G3 15","Dell G5 15","Dell G7 15","Dell G7 17","Dell G3 15 (refresh)","Dell G5 15 (refresh)","Dell G7 15 (refresh)","Dell G7 17 (refresh)","Dell G15 5510","Dell G15 5511","Dell G15 5515 (AMD)","Dell G15 5520","Dell G16 7620","Dell G15 5530","Dell G16 7630","Dell G15 5540","Dell G16 7640"],"Desktop - OptiPlex (Business)":["OptiPlex 3070","OptiPlex 5070","OptiPlex 7070","OptiPlex 7070 Ultra","OptiPlex 3080","OptiPlex 5080","OptiPlex 7080","OptiPlex 3090 Ultra","OptiPlex 5090","OptiPlex 7090 Ultra","OptiPlex 3000","OptiPlex 5000","OptiPlex 7000","OptiPlex 3010","OptiPlex 5010","OptiPlex 7010","Dell Pro Desktop (rebranded)"],"Desktop - Consumer":["Inspiron Desktop 3670","Inspiron Desktop 3880","XPS Desktop 8940","XPS Desktop 8950","Inspiron Desktop 3020","XPS Desktop 8960","Dell Desktop (2025 rebrand)"],"Desktop - Alienware (Gaming)":["Alienware Aurora R8","Alienware Aurora R9","Alienware Aurora R10 (AMD)","Alienware Aurora R11","Alienware Aurora R12","Alienware Aurora R13","Alienware Aurora R14 (AMD)","Alienware Aurora R15","Alienware Aurora R16","Alienware Area-51"],"Desktop - Precision Workstation":["Precision 3430 Tower","Precision 3630 Tower","Precision 5820 Tower","Precision 7820 Tower","Precision 7920 Tower","Precision 3440 Tower","Precision 3640 Tower","Precision 3450 Tower","Precision 3650 Tower","Precision 7865 Tower","Precision 3680 Tower"],"Monitor":["Dell UltraSharp U2419H","Dell UltraSharp U3219Q 32\" 4K","Dell UltraSharp U2720Q","Dell 27 Gaming Monitor S2721DGF","Dell UltraSharp 40 Curved Thunderbolt Hub U4021QW","Alienware 25 Gaming Monitor AW2521H","Alienware 27 Gaming Monitor AW2721D","Alienware 34 Curved Gaming Monitor AW3421DW","Dell UltraSharp 27 4K Thunderbolt Hub U2722D","Dell UltraSharp 27 OLED U2723QE","Dell UltraSharp 32 OLED U3224KB","Dell UltraSharp 32 4K Thunderbolt Hub"]},"HP":{"Laptop - Spectre":["Spectre x360 13","Spectre x360 15","Spectre x360 13 (gem cut design)","Spectre x360 14","Spectre x360 16","Spectre x360 13.5","Spectre x360 14 (refresh)","Spectre x360 14","Spectre x360 14 (Intel Meteor Lake)","Spectre x360 14"],"Laptop - Envy":["Envy 13","Envy 15","Envy 17","Envy x360 13","Envy x360 15","Envy 13","Envy 14","Envy 15","Envy 17","Envy 14","Envy 15","Envy 17","Envy x360 13 (refresh)","Envy x360 15 (refresh)","Envy 16","Envy x360 13 (refresh)","Envy x360 15 (refresh)","Envy Move All-in-One","Envy x360 13 (refresh)","Envy x360 15 (refresh)","Envy 14","Envy 16","Envy x360 14 (refresh)","Envy x360 15 (refresh)"],"Laptop - Pavilion":["Pavilion 14","Pavilion 15","Pavilion 17","Pavilion x360 14","Pavilion 14 (annual refresh)","Pavilion 15 (annual refresh)","Pavilion 17 (annual refresh)","Pavilion x360 14 (refresh)","Pavilion 14 (annual refresh)","Pavilion 15 (annual refresh)","Pavilion 17 (annual refresh)","Pavilion Plus 14","Pavilion 14 (annual refresh)","Pavilion 15 (annual refresh)","Pavilion Plus 14 (refresh)","Pavilion Plus 16","Pavilion 14 (annual refresh)","Pavilion Plus 14 (refresh)","Pavilion Plus 16 (refresh)"],"Laptop - EliteBook (Enterprise)":["EliteBook 830 G6","EliteBook 840 G6","EliteBook 850 G6","EliteBook 1040 G6","EliteBook 830 G7","EliteBook 840 G7","EliteBook 850 G7","EliteBook 1040 G7","EliteBook 830 G8","EliteBook 840 G8","EliteBook 840 Aero G8","EliteBook 850 G8","EliteBook 1040 G8","EliteBook 830 G9","EliteBook 840 G9","EliteBook 850 G9","EliteBook 1040 G9","EliteBook 840 G10","EliteBook 835 G10 (AMD)","EliteBook 845 G10 (AMD)","EliteBook 865 G10 (AMD)","EliteBook 1040 G10","EliteBook 840 G11","EliteBook 1040 G11","EliteBook Ultra G1i"],"Laptop - ProBook (Business)":["ProBook 430 G6","ProBook 440 G6","ProBook 450 G6","ProBook 470 G6","ProBook 430 G7","ProBook 440 G7","ProBook 450 G7","ProBook 430 G8","ProBook 440 G8","ProBook 450 G8","ProBook 430 G9","ProBook 440 G9","ProBook 450 G9","ProBook 440 G10","ProBook 450 G10","ProBook 440 G11","ProBook 450 G11"],"Laptop - OMEN (Gaming)":["OMEN 15","OMEN 17","OMEN 15 (redesign)","OMEN 15","OMEN 17","OMEN 16","OMEN 17","OMEN 16","OMEN 17","OMEN Transcend 14","OMEN Transcend 16","OMEN 16","OMEN 17","OMEN Max 16"],"Laptop - Victus (Budget Gaming)":["Victus 16","Victus 15","Victus 16 (refresh)","Victus 15 (refresh)","Victus 16 (refresh)","Victus 15 (refresh)","Victus 16 (refresh)"],"Laptop - Dragonfly (Ultra-Premium Business)":["HP Dragonfly","HP Dragonfly G2","HP Dragonfly G3","HP Dragonfly Folio G3","HP Dragonfly G4","HP Dragonfly Folio G4","HP Dragonfly Pro","HP Dragonfly G5"],"Desktop - OMEN (Gaming)":["OMEN 875","OMEN 880","OMEN GT09","OMEN 45L","OMEN 25L","OMEN 45L (refresh)","OMEN 25L (refresh)","OMEN 45L GT22","OMEN 25L GT15","OMEN 45L (refresh)","OMEN 25L (refresh)"],"Desktop - Consumer":["Pavilion TG01","Pavilion TP01","Envy TE01","Envy Desktop (refresh)","Envy Desktop (refresh)","Envy Desktop (refresh)","Envy Desktop (refresh)"],"Desktop - Business":["EliteDesk 800 G5","ProDesk 600 G5","EliteDesk 800 G6","ProDesk 600 G6","EliteDesk 800 G8","ProDesk 600 G8","HP Elite 800 Desktop","HP Pro 400 Desktop","HP Elite 800 Desktop (refresh)","HP Pro 400 Desktop (refresh)"],"Tablet":["HP Pro x2 612 G2","HP Elite x2 G4","HP Elite x2 G8"],"Monitor":["HP Z27k G3 4K USB-C","OMEN 27i Gaming Monitor","OMEN 25i Gaming Monitor","OMEN 27qs QD OLED","OMEN 27k 4K 240Hz"]},"Microsoft":{"Laptop - Surface Laptop":["Surface Laptop 3 13.5\"","Surface Laptop 3 15\"","Surface Laptop 4 13.5\"","Surface Laptop 4 15\"","Surface Laptop 5 13.5\"","Surface Laptop 5 15\"","Surface Laptop 6 for Business 13.5\"","Surface Laptop 6 for Business 15\"","Surface Laptop 7th Edition 13.8\" (Intel)","Surface Laptop 7th Edition 15\" (Intel)","Surface Laptop 7th Edition 13.8\" (Snapdragon X Elite)","Surface Laptop 7th Edition 15\" (Snapdragon X Elite)"],"Laptop - Surface Laptop Studio":["Surface Laptop Studio","Surface Laptop Studio 2"],"Tablet - Surface Pro":["Surface Pro 7","Surface Pro X (ARM)","Surface Pro 7+","Surface Pro 8","Surface Pro X (2nd gen)","Surface Pro 9 (Intel)","Surface Pro 9 5G (SQ3)","Surface Pro 10 for Business","Surface Pro 11th Edition (Snapdragon X Plus)","Surface Pro 11th Edition (Snapdragon X Elite)"],"Tablet - Surface Go":["Surface Go 2","Surface Go 3","Surface Go 4"],"Laptop - Surface Book":["Surface Book 3 13.5\"","Surface Book 3 15\""],"Desktop - Surface Studio (All-in-One)":["Surface Studio 2+"],"Enterprise Display - Surface Hub":["Surface Hub 2S","Surface Hub 3"],"Gaming Console - Xbox":["Xbox One S All-Digital Edition","Xbox Series X","Xbox Series S","Xbox Series S 1TB Carbon Black","Xbox Series X 2TB Galaxy Black","Xbox Series X Digital Edition"],"AR Headset":["HoloLens 2"],"Accessory":["Surface Slim Pen","Surface Earbuds","Surface Headphones 2","Surface Slim Pen 2","Xbox Elite Wireless Controller Series 2","Xbox Wireless Controller (Series S/X edition)"]},"Apple":{"Smartphone":["iPhone 11","iPhone 11 Pro","iPhone 11 Pro Max","iPhone SE (2nd gen)","iPhone 12","iPhone 12 Mini","iPhone 12 Pro","iPhone 12 Pro Max","iPhone 13","iPhone 13 Mini","iPhone 13 Pro","iPhone 13 Pro Max","iPhone SE (3rd gen)","iPhone 14","iPhone 14 Plus","iPhone 14 Pro","iPhone 14 Pro Max","iPhone 15","iPhone 15 Plus","iPhone 15 Pro","iPhone 15 Pro Max","iPhone 16","iPhone 16 Plus","iPhone 16 Pro","iPhone 16 Pro Max","iPhone 16e"],"Tablet - iPad":["iPad mini (5th gen)","iPad Air (3rd gen)","iPad (7th gen)","iPad Pro 11\" (2nd gen)","iPad Pro 12.9\" (4th gen)","iPad (8th gen)","iPad Air (4th gen)","iPad Pro 11\" (3rd gen)","iPad Pro 12.9\" (5th gen - mini-LED)","iPad mini (6th gen)","iPad (9th gen)","iPad Air (5th gen - M1)","iPad (10th gen)","iPad Pro 11\" (4th gen - M2)","iPad Pro 12.9\" (6th gen - M2)","iPad Air 11\" (M2)","iPad Air 13\" (M2)","iPad Pro 11\" (M4 - OLED)","iPad Pro 13\" (M4 - OLED)","iPad mini (7th gen - A17 Pro)"],"Laptop - MacBook Air":["MacBook Air (Intel - 2019)","MacBook Air (Intel - 2020)","MacBook Air (M1)","MacBook Air 13\" (M2)","MacBook Air 15\" (M2)","MacBook Air 13\" (M3)","MacBook Air 15\" (M3)"],"Laptop - MacBook Pro":["MacBook Pro 13\" (Intel - 2019)","MacBook Pro 15\" (Intel - 2019)","MacBook Pro 13\" (Intel - 2020)","MacBook Pro 13\" (M1)","MacBook Pro 14\" (M1 Pro)","MacBook Pro 14\" (M1 Max)","MacBook Pro 16\" (M1 Pro)","MacBook Pro 16\" (M1 Max)","MacBook Pro 13\" (M2)","MacBook Pro 14\" (M2 Pro)","MacBook Pro 14\" (M2 Max)","MacBook Pro 16\" (M2 Pro)","MacBook Pro 16\" (M2 Max)","MacBook Pro 14\" (M3)","MacBook Pro 14\" (M3 Pro)","MacBook Pro 14\" (M3 Max)","MacBook Pro 16\" (M3 Pro)","MacBook Pro 16\" (M3 Max)","MacBook Pro 14\" (M4)","MacBook Pro 14\" (M4 Pro)","MacBook Pro 16\" (M4 Pro)","MacBook Pro 16\" (M4 Max)","MacBook Pro 14\" (M4 Max)"],"Desktop - Mac":["Mac Pro (Intel - modular tower)","Mac mini (Intel - 2020)","Mac mini (M1)","iMac 27\" (Intel - 2020)","iMac 24\" (M1)","Mac Studio (M1 Max)","Mac Studio (M1 Ultra)","Mac mini (M2)","Mac mini (M2 Pro)","Mac Studio (M2 Max)","Mac Studio (M2 Ultra)","Mac Pro (M2 Ultra)","iMac 24\" (M3)","Mac mini (M4)","Mac mini (M4 Pro)","iMac 24\" (M4)","Mac Studio (M4 Max)","Mac Studio (M4 Ultra)"],"Smartwatch":["Apple Watch Series 5","Apple Watch SE (1st gen)","Apple Watch Series 6","Apple Watch Series 7","Apple Watch Series 8","Apple Watch SE (2nd gen)","Apple Watch Ultra","Apple Watch Series 9","Apple Watch Ultra 2","Apple Watch Series 10","Apple Watch Ultra 2 (Black)"],"Earbuds / Headphones":["AirPods (2nd gen)","AirPods Pro (1st gen)","AirPods Max","AirPods (3rd gen)","AirPods Pro (2nd gen)","AirPods Max (USB-C)","AirPods 4","AirPods 4 (with ANC)"],"Streaming / Smart Home":["Apple TV 4K (2nd gen)","HomePod mini","Apple TV 4K (3rd gen)","HomePod (2nd gen)"],"Spatial Computing":["Apple Vision Pro"]},"Samsung":{"Smartphone - Galaxy S":["Galaxy S10e","Galaxy S10","Galaxy S10+","Galaxy S10 5G","Galaxy S20","Galaxy S20+","Galaxy S20 Ultra","Galaxy S20 FE","Galaxy S21","Galaxy S21+","Galaxy S21 Ultra","Galaxy S21 FE","Galaxy S22","Galaxy S22+","Galaxy S22 Ultra","Galaxy S23","Galaxy S23+","Galaxy S23 Ultra","Galaxy S23 FE","Galaxy S24","Galaxy S24+","Galaxy S24 Ultra","Galaxy S24 FE","Galaxy S25","Galaxy S25+","Galaxy S25 Ultra","Galaxy S25 Edge"],"Smartphone - Galaxy Z (Foldable)":["Galaxy Fold (1st gen)","Galaxy Z Flip","Galaxy Z Fold 2","Galaxy Z Fold 3","Galaxy Z Flip 3","Galaxy Z Fold 4","Galaxy Z Flip 4","Galaxy Z Fold 5","Galaxy Z Flip 5","Galaxy Z Fold 6","Galaxy Z Flip 6","Galaxy Z Fold Special Edition"],"Smartphone - Galaxy A (Mid-Range)":["Galaxy A50","Galaxy A30","Galaxy A20","Galaxy A10","Galaxy A51","Galaxy A71","Galaxy A52","Galaxy A72","Galaxy A32","Galaxy A52s 5G","Galaxy A32 5G","Galaxy A53","Galaxy A33","Galaxy A13","Galaxy A54","Galaxy A34","Galaxy A14","Galaxy A55","Galaxy A35","Galaxy A15","Galaxy A56"],"Tablet - Galaxy Tab":["Galaxy Tab S5e","Galaxy Tab S6","Galaxy Tab S6 Lite","Galaxy Tab S7","Galaxy Tab S7+","Galaxy Tab A7","Galaxy Tab S7 FE","Galaxy Tab A7 Lite","Galaxy Tab S8","Galaxy Tab S8+","Galaxy Tab S8 Ultra","Galaxy Tab A8","Galaxy Tab S9","Galaxy Tab S9+","Galaxy Tab S9 Ultra","Galaxy Tab S9 FE","Galaxy Tab S9 FE+","Galaxy Tab S10","Galaxy Tab S10+","Galaxy Tab S10 Ultra","Galaxy Tab S10 FE"],"Smartwatch - Galaxy Watch":["Galaxy Watch Active","Galaxy Watch Active 2","Galaxy Watch 3","Galaxy Watch 4","Galaxy Watch 4 Classic","Galaxy Watch 5","Galaxy Watch 5 Pro","Galaxy Watch 6","Galaxy Watch 6 Classic","Galaxy Watch 7","Galaxy Watch FE","Galaxy Watch Ultra"],"Earbuds - Galaxy Buds":["Galaxy Buds","Galaxy Buds+","Galaxy Buds Live","Galaxy Buds Pro","Galaxy Buds 2","Galaxy Buds 2 Pro","Galaxy Buds FE","Galaxy Buds 3","Galaxy Buds 3 Pro"],"Laptop - Galaxy Book":["Galaxy Book Ion","Galaxy Book Flex","Galaxy Book S (ARM)","Galaxy Book Pro","Galaxy Book Pro 360","Galaxy Book 2","Galaxy Book 2 Pro","Galaxy Book 2 Pro 360","Galaxy Book 2 Business","Galaxy Book 3","Galaxy Book 3 Pro","Galaxy Book 3 Pro 360","Galaxy Book 3 Ultra","Galaxy Book 3 360","Galaxy Book 4","Galaxy Book 4 Pro","Galaxy Book 4 Pro 360","Galaxy Book 4 Ultra","Galaxy Book 4 Edge","Galaxy Book 5 Pro","Galaxy Book 5 360"],"Monitor - Odyssey (Gaming)":["Odyssey G7","Odyssey G9 49\" Super Ultrawide","Odyssey G9 Neo (Mini LED)","Odyssey Ark 55\"","Odyssey OLED G8","Odyssey OLED G9 57\"","Odyssey OLED G6"],"Monitor - Creator":["ViewFinity S9 5K"]},"Steam":{"Handheld Gaming PC":["Steam Deck","Steam Deck OLED"],"VR Headset":["Valve Index"],"VR Accessory":["Valve Index Controllers"]},"Nintendo":{"Gaming Console / Handheld":["Nintendo Switch (revised - longer battery)","Nintendo Switch Lite","Nintendo Switch (OLED Model)","Nintendo Switch 2"],"Accessory":["Ring-Con & Leg Strap (Ring Fit Adventure)","Nintendo 64 Controller (NSO)","SEGA Genesis Controller (NSO)","Nintendo Alarmo","Nintendo Switch 2 Joy-Con","Nintendo Switch 2 Pro Controller","Nintendo Switch 2 Camera"]}}

// ── Issues ────────────────────────────────────────────────────────
const issues = [
  { name: 'Cracked Screen',    icon: Eye,      description: 'Display is cracked or damaged' },
  { name: 'Battery Issues',    icon: Battery,  description: "Won't charge or drains quickly" },
  { name: 'Water Damage',      icon: Droplets, description: 'Exposed to liquid' },
  { name: "Won't Turn On",     icon: Zap,      description: 'Device is unresponsive' },
  { name: 'Audio Problems',    icon: Volume2,  description: 'Speaker or microphone issues' },
  { name: 'WiFi/Connectivity', icon: Wifi,     description: 'Network connection problems' },
  { name: 'Physical Damage',   icon: Wrench,   description: 'Dents, bends, or broken parts' },
  { name: 'Other',             icon: Wrench,   description: 'Something else' },
]

// ── Computed ──────────────────────────────────────────────────────
const brands = computed(() => Object.keys(deviceDB))

const categoriesForBrand = computed(() =>
  selectedBrand.value && deviceDB[selectedBrand.value]
    ? Object.keys(deviceDB[selectedBrand.value])
    : []
)

const modelsForCategory = computed(() =>
  deviceDB[selectedBrand.value]?.[selectedCategory.value] ?? []
)

const filteredModels = computed(() => {
  const q = modelSearch.value.toLowerCase()
  return q ? modelsForCategory.value.filter(m => m.toLowerCase().includes(q)) : modelsForCategory.value
})

const filteredCustomers = computed(() => {
  const q = customerSearch.value.toLowerCase()
  if (!q) return props.customers
  return props.customers.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.phone?.toLowerCase().includes(q)
  )
})

const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedCategory.value
  if (currentStep.value === 2) return !!selectedModel.value || !!customModel.value
  if (currentStep.value === 3) return !!selectedIssue.value || !!customIssue.value
  return false
})

const canCreate = computed(() => {
  const hasCustomer = showNewCustomer.value
    ? !!newCustomer.value.name.trim()
    : !!ticketData.value.customerId
  return hasCustomer && !!ticketData.value.signature
})

// ── Helpers ───────────────────────────────────────────────────────
const brandEmoji = (brand: string) => ({ Apple: '🍎', Samsung: '📱', Dell: '💻', HP: '🖥️', Microsoft: '🪟', Nintendo: '🎮', Steam: '🎯' }[brand] || '📦')

const categoryIcon = (cat: string) => {
  const c = cat.toLowerCase()
  if (c.includes('laptop') || c.includes('macbook') || c.includes('surface laptop') || c.includes('surface book')) return Laptop
  if (c.includes('tablet') || c.includes('ipad') || c.includes('surface pro') || c.includes('surface go')) return Tablet
  if (c.includes('smartphone') || c.includes('iphone')) return Smartphone
  if (c.includes('watch')) return Watch
  if (c.includes('gaming') || c.includes('xbox') || c.includes('nintendo') || c.includes('steam') || c.includes('handheld') || c.includes('vr')) return Gamepad2
  if (c.includes('monitor') || c.includes('display') || c.includes('hub')) return Monitor
  if (c.includes('earbuds') || c.includes('headphones') || c.includes('airpods') || c.includes('buds')) return Headphones
  if (c.includes('desktop') || c.includes('mac')) return Tv
  return HelpCircle
}

const priorityColor = (p: string) => ({ low: '#64748b', normal: '#3b82f6', high: '#ef4444' }[p] || '#64748b')

// ── Actions ───────────────────────────────────────────────────────
const selectBrand = (brand: string) => {
  selectedBrand.value = brand
  selectedCategory.value = ''
  selectedModel.value = ''
  customModel.value = ''
  modelSearch.value = ''
}

const selectCategory = (cat: string) => {
  selectedCategory.value = cat
  selectedModel.value = ''
  customModel.value = ''
  modelSearch.value = ''
  if (cat === 'Other') currentStep.value = 2
}

const selectModel = (model: string) => {
  selectedModel.value = model
  customModel.value = ''
}

const selectIssue = (issue: string) => {
  selectedIssue.value = issue
  customIssue.value = ''
}

const nextStep = () => {
  if (currentStep.value === 2 && customModel.value) selectedModel.value = customModel.value
  if (currentStep.value === 3 && customIssue.value) selectedIssue.value = customIssue.value
  currentStep.value++
}

const handleCancel = () => { resetForm(); isOpen.value = false }

const createTicket = () => {
  if (!canCreate.value) return
  const ticket: any = {
    device: selectedBrand.value,
    deviceModel: selectedModel.value || customModel.value,
    deviceCategory: selectedCategory.value,
    issue: selectedIssue.value || customIssue.value,
    customerId: ticketData.value.customerId,
    deviceDescription: ticketData.value.deviceDescription,
    serialNumber: ticketData.value.serialNumber,
    priority: ticketData.value.priority,
    signature: ticketData.value.signature,
  }
  if (showNewCustomer.value) {
    ticket.newCustomer = { ...newCustomer.value }
    ticket.customerId = null
  }
  emit('create', ticket)
  resetForm()
}

const resetForm = () => {
  currentStep.value = 1
  selectedBrand.value = ''
  selectedCategory.value = ''
  selectedModel.value = ''
  customModel.value = ''
  modelSearch.value = ''
  selectedIssue.value = ''
  customIssue.value = ''
  customerSearch.value = ''
  showNewCustomer.value = false
  newCustomer.value = { name: '', phone: '', email: '', address: '' }
  ticketData.value = { customerId: null, deviceDescription: '', serialNumber: '', priority: 'normal', signature: '' }
}
</script>

