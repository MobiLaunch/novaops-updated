<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="w-full max-w-[96vw] sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
      <!-- M3 Dialog Header -->
      <div class="flex items-center gap-4 px-7 pt-7 pb-5 border-b border-border/50">
        <div class="w-11 h-11 rounded-[22px] flex items-center justify-center flex-shrink-0 shadow-md"
          style="background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 16px #6366f140">
          <Wrench class="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 class="text-base font-black">New Repair Ticket</h2>
          <p class="text-xs text-muted-foreground font-medium mt-0.5">Step {{ currentStep }} of 5</p>
        </div>
        <!-- Progress pills -->
        <div class="flex gap-1.5 ml-auto mr-10">
          <div v-for="i in 5" :key="i"
            class="h-1.5 rounded-full transition-all duration-500"
            :class="i <= currentStep ? 'w-6' : 'w-3'"
            :style="i <= currentStep ? 'background: #6366f1' : 'background: hsl(var(--border))'"
          />
        </div>
      </div>

      <div class="p-7 space-y-5">

        <!-- ── Step 1: Brand ─────────────────────────────── -->
        <div v-if="currentStep === 1" class="space-y-4">
          <label class="m3-dialog-label">Select Brand</label>
          <div v-if="loadingBrands" class="flex items-center justify-center py-10">
            <div class="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="brand in brands" :key="brand"
              class="m3-step-chip group"
              :class="selectedBrand === brand ? 'm3-step-chip--active' : ''"
              @click="selectBrand(brand)"
            >
              <span class="text-sm font-bold">{{ brand }}</span>
            </button>
          </div>
        </div>

        <!-- ── Step 2: Category ───────────────────────────── -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="flex items-center gap-2">
            <button class="m3-back-btn" @click="currentStep = 1">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="m3-dialog-label mb-0">{{ selectedBrand }} — Category</label>
          </div>
          <div v-if="loadingCategories" class="flex items-center justify-center py-10">
            <div class="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="cat in categories" :key="cat"
              class="m3-step-chip"
              :class="selectedCategory === cat ? 'm3-step-chip--active' : ''"
              @click="selectCategory(cat)"
            >
              <span class="text-sm font-bold text-left">{{ cat }}</span>
            </button>
          </div>
        </div>

        <!-- ── Step 3: Model ─────────────────────────────── -->
        <div v-if="currentStep === 3" class="space-y-4">
          <div class="flex items-center gap-2">
            <button class="m3-back-btn" @click="currentStep = 2">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="m3-dialog-label mb-0">Select Model</label>
          </div>
          <div class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input v-model="modelSearch" placeholder="Search models…" class="m3-dialog-input pl-11" />
          </div>
          <div v-if="loadingModels" class="flex items-center justify-center py-10">
            <div class="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
            <button
              v-for="model in filteredModels" :key="model"
              class="m3-step-chip"
              :class="selectedModel === model ? 'm3-step-chip--active' : ''"
              @click="selectModel(model)"
            >
              <span class="text-xs font-bold text-left">{{ model }}</span>
            </button>
            <div v-if="filteredModels.length === 0" class="col-span-3 text-center py-8 text-sm font-medium text-muted-foreground">
              No models match "{{ modelSearch }}"
            </div>
          </div>
          <div class="space-y-2 pt-2 border-t border-border/50">
            <label class="m3-dialog-label">Or enter custom model</label>
            <input v-model="customModel" placeholder="Enter model name…" class="m3-dialog-input" @keyup.enter="handleCustomModelEnter" />
          </div>
        </div>

        <!-- ── Step 4: Issue ─────────────────────────────── -->
        <div v-if="currentStep === 4" class="space-y-4">
          <div class="flex items-center gap-2">
            <button class="m3-back-btn" @click="currentStep = 3">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="m3-dialog-label mb-0">Select Issue</label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="issue in issues" :key="issue.name"
              class="m3-step-chip text-left"
              :class="selectedIssue === issue.name ? 'm3-step-chip--active' : ''"
              @click="selectIssue(issue.name)"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-[16px] flex items-center justify-center flex-shrink-0 mt-0.5"
                  :style="selectedIssue === issue.name ? 'background: #6366f120; color: #6366f1' : 'background: hsl(var(--muted)); color: hsl(var(--muted-foreground))'">
                  <component :is="issue.icon" class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-sm font-bold">{{ issue.name }}</p>
                  <p class="text-xs text-muted-foreground font-medium mt-0.5">{{ issue.description }}</p>
                </div>
              </div>
            </button>
          </div>
          <div class="space-y-2 pt-2 border-t border-border/50">
            <label class="m3-dialog-label">Or describe custom issue</label>
            <textarea v-model="customIssue" rows="3" placeholder="Describe the problem…" class="m3-dialog-textarea" />
          </div>
        </div>

        <!-- ── Step 5: Details ───────────────────────────── -->
        <div v-if="currentStep === 5" class="space-y-5">
          <div class="flex items-center gap-2">
            <button class="m3-back-btn" @click="currentStep = 4">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="m3-dialog-label mb-0">Ticket Details</label>
          </div>

          <!-- Summary pill -->
          <div class="rounded-[20px] p-4 flex items-center gap-3" style="background: #6366f110; outline: 1.5px solid #6366f128; outline-offset: 0">
            <div class="w-10 h-10 rounded-[18px] flex items-center justify-center flex-shrink-0" style="background: #6366f120">
              <Wrench class="w-5 h-5" style="color: #6366f1" />
            </div>
            <div class="text-sm">
              <p class="font-black">{{ selectedBrand }} {{ selectedModel || customModel }}</p>
              <p class="text-muted-foreground font-medium text-xs mt-0.5">{{ selectedIssue || customIssue }}</p>
            </div>
          </div>

          <!-- Customer -->
          <div class="space-y-2">
            <label class="m3-dialog-label">Customer *</label>
            <CustomerSelect v-model="ticketData.customerId" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="m3-dialog-label">Serial Number</label>
              <input v-model="ticketData.serialNumber" placeholder="Optional" class="m3-dialog-input" />
            </div>
            <div class="space-y-2">
              <label class="m3-dialog-label">Priority</label>
              <Select v-model="ticketData.priority">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="m3-dialog-label">Device Condition</label>
            <textarea v-model="ticketData.deviceDescription" rows="2" placeholder="Color, visible damage, accessories included…" class="m3-dialog-textarea" />
          </div>

          <SignaturePad v-model="ticketData.signature" label="Customer Signature (optional)" :width="Math.min(550, typeof window !== 'undefined' ? window.innerWidth - 80 : 550)" :height="150" />
        </div>

      </div>

      <!-- Footer -->
      <div class="flex gap-3 px-7 pb-7">
        <button class="flex-1 h-12 rounded-full text-sm font-bold transition-all hover:scale-[1.03] hover:bg-muted/60 active:scale-95"
          style="outline: 2px solid hsl(var(--border)); outline-offset: 0"
          @click="handleCancel">Cancel</button>
        <button v-if="currentStep < 5"
          class="flex-1 h-12 rounded-full text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.04] hover:-translate-y-0.5 active:scale-95"
          style="background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 16px #6366f140"
          :disabled="!canProceed"
          :style="!canProceed ? 'opacity: 0.5; cursor: not-allowed' : 'background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 16px #6366f140'"
          @click="nextStep">
          Next <ChevronRight class="w-4 h-4" />
        </button>
        <button v-else
          class="flex-1 h-12 rounded-full text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.04] hover:-translate-y-0.5 active:scale-95"
          :style="canCreate ? 'background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 16px #6366f140' : 'background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); cursor: not-allowed'"
          :disabled="!canCreate || creating"
          @click="createTicket">
          {{ creating ? 'Saving…' : 'Create Ticket' }}
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Search, Zap, Droplets, Volume2, Wifi, Battery, Eye, Wrench, Check } from 'lucide-vue-next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import SignaturePad from '~/components/SignaturePad.vue'
import CustomerSelect from '~/components/CustomerSelect.vue'

const props = defineProps<{
  modelValue: boolean
  customers: any[]
}>()

const emit = defineEmits(['update:modelValue', 'create'])

const { $supabase } = useNuxtApp()
const from = (table: string) => ($supabase as unknown as any).from(table)

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentStep = ref(1)
const selectedBrand = ref('')
const selectedCategory = ref('')
const selectedModel = ref('')
const customModel = ref('')
const modelSearch = ref('')
const selectedIssue = ref('')
const customIssue = ref('')

const ticketData = ref({
  customerId: null as number | null,
  deviceDescription: '',
  serialNumber: '',
  priority: 'normal',
  signature: ''
})

const brands = ref<string[]>([])
const categories = ref<string[]>([])
const models = ref<string[]>([])
const loadingBrands = ref(false)
const loadingCategories = ref(false)
const loadingModels = ref(false)

const fetchBrands = async () => {
  loadingBrands.value = true
  const { data } = await from('devices').select('brand').order('brand')
  if (data) brands.value = [...new Set(data.map((r: any) => String(r.brand)))]
  loadingBrands.value = false
}

const fetchCategories = async (brand: string) => {
  loadingCategories.value = true
  const { data } = await from('devices').select('category').eq('brand', brand).order('category')
  if (data) categories.value = [...new Set(data.map((r: any) => String(r.category)))]
  loadingCategories.value = false
}

const fetchModels = async (brand: string, category: string) => {
  loadingModels.value = true
  const { data } = await from('devices').select('name').eq('brand', brand).eq('category', category).order('name')
  if (data) models.value = data.map((r: any) => r.name)
  loadingModels.value = false
}

watch(isOpen, (val) => { if (val) fetchBrands() })

const filteredModels = computed(() => {
  const q = modelSearch.value.toLowerCase()
  return q ? models.value.filter(m => m.toLowerCase().includes(q)) : models.value
})

const issues = [
  { name: 'Cracked Screen',    icon: Eye,      description: 'Display is cracked or damaged' },
  { name: 'Battery Issues',    icon: Battery,  description: "Won't charge or drains quickly" },
  { name: 'Water Damage',      icon: Droplets, description: 'Exposed to liquid' },
  { name: "Won't Turn On",     icon: Zap,      description: 'Device is unresponsive' },
  { name: 'Audio Problems',    icon: Volume2,  description: 'Speaker or microphone issues' },
  { name: 'WiFi/Connectivity', icon: Wifi,     description: 'Network connection problems' },
  { name: 'Physical Damage',   icon: Wrench,   description: 'Dents, bends, or broken parts' },
  { name: 'Other',             icon: Wrench,   description: 'Other issues' }
]

const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedBrand.value
  if (currentStep.value === 2) return !!selectedCategory.value
  if (currentStep.value === 3) return !!selectedModel.value || !!customModel.value
  if (currentStep.value === 4) return !!selectedIssue.value || !!customIssue.value
  return false
})

const canCreate = computed(() => !!ticketData.value.customerId)

const selectBrand = async (brand: string) => {
  selectedBrand.value = brand
  selectedCategory.value = ''
  selectedModel.value = ''
  models.value = []
  modelSearch.value = ''
  await fetchCategories(brand)
  currentStep.value = 2
}

const selectCategory = async (cat: string) => {
  selectedCategory.value = cat
  selectedModel.value = ''
  modelSearch.value = ''
  await fetchModels(selectedBrand.value, cat)
  currentStep.value = 3
}

const selectModel = (model: string) => {
  selectedModel.value = model
  customModel.value = ''
}

const handleCustomModelEnter = () => { if (customModel.value) selectModel(customModel.value) }
const selectIssue = (issue: string) => { selectedIssue.value = issue; customIssue.value = '' }

const nextStep = () => {
  if (currentStep.value === 3 && customModel.value) selectedModel.value = customModel.value
  if (currentStep.value === 4 && customIssue.value) selectedIssue.value = customIssue.value
  currentStep.value++
}

const handleCancel = () => { resetForm(); isOpen.value = false }

const creating = ref(false)
const createTicket = () => {
  if (!canCreate.value || creating.value) return
  creating.value = true
  emit('create', {
    device: selectedBrand.value,
    deviceModel: selectedModel.value || customModel.value,
    deviceCategory: selectedCategory.value,
    issue: selectedIssue.value || customIssue.value,
    customerId: ticketData.value.customerId,
    deviceDescription: ticketData.value.deviceDescription,
    serialNumber: ticketData.value.serialNumber,
    priority: ticketData.value.priority,
    signature: ticketData.value.signature
  })
  // Parent controls closing via v-model; reset after a tick so data is preserved during the async save
  setTimeout(() => { resetForm(); creating.value = false }, 300)
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
  brands.value = []
  categories.value = []
  models.value = []
  ticketData.value = { customerId: null, deviceDescription: '', serialNumber: '', priority: 'normal', signature: '' }

}
</script>

<style scoped>
.m3-dialog-label {
  display: block;
  font-size: 10px;
  font-weight: 800;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
}

.m3-dialog-input {
  width: 100%;
  height: 48px;
  padding: 0 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.7);
  color: hsl(var(--foreground));
  outline: none;
  transition: all 0.2s ease;
}
.m3-dialog-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px #6366f118;
  background: hsl(var(--background));
}

.m3-dialog-textarea {
  width: 100%;
  padding: 14px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.7);
  color: hsl(var(--foreground));
  outline: none;
  resize: none;
  transition: all 0.2s ease;
}
.m3-dialog-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px #6366f118;
  background: hsl(var(--background));
}

.m3-step-chip {
  padding: 14px 16px;
  border-radius: 20px;
  background: hsl(var(--muted)/0.4);
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}
.m3-step-chip:hover {
  transform: scale(1.02) translateY(-2px);
  background: hsl(var(--muted)/0.7);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.m3-step-chip:active { transform: scale(0.97); }

.m3-step-chip--active {
  background: #6366f114 !important;
  outline: 2px solid #6366f150 !important;
  color: #6366f1;
}
.m3-step-chip--active:hover {
  background: #6366f120 !important;
}

.m3-back-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--muted)/0.6);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}
.m3-back-btn:hover { transform: scale(1.1); background: hsl(var(--muted)); }
.m3-back-btn:active { transform: scale(0.9); }
</style>
