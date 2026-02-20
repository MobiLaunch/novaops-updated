<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Ticket</DialogTitle>
        <p class="text-sm text-muted-foreground">Step {{ currentStep }} of 4</p>
      </DialogHeader>

      <div class="py-6">

        <!-- Step 1: Brand Selection -->
        <div v-if="currentStep === 1" class="space-y-4">
          <Label class="text-base font-medium">Select Brand</Label>
          <div v-if="loadingBrands" class="flex items-center justify-center py-8">
            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="brand in brands"
              :key="brand"
              @click="selectBrand(brand)"
              class="p-4 rounded-lg border-2 transition-all hover:bg-accent"
              :class="selectedBrand === brand ? 'border-primary bg-accent' : 'border-border'"
            >
              <p class="text-sm font-medium">{{ brand }}</p>
            </button>
          </div>
        </div>

        <!-- Step 2: Category Selection -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="currentStep = 1">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <Label class="text-base font-medium">{{ selectedBrand }} — Select Category</Label>
          </div>
          <div v-if="loadingCategories" class="flex items-center justify-center py-8">
            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="cat in categories"
              :key="cat"
              @click="selectCategory(cat)"
              class="p-3 rounded-lg border-2 transition-all hover:bg-accent text-left"
              :class="selectedCategory === cat ? 'border-primary bg-accent' : 'border-border'"
            >
              <p class="text-sm font-medium">{{ cat }}</p>
            </button>
          </div>
        </div>

        <!-- Step 3: Model Selection -->
        <div v-if="currentStep === 3" class="space-y-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="currentStep = 2">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <Label class="text-base font-medium">Select Model</Label>
          </div>
          <!-- Search -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              v-model="modelSearch"
              placeholder="Search models..."
              class="pl-9"
            />
          </div>
          <div v-if="loadingModels" class="flex items-center justify-center py-8">
            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
            <button
              v-for="model in filteredModels"
              :key="model"
              @click="selectModel(model)"
              class="p-3 rounded-lg border-2 transition-all hover:bg-accent text-left"
              :class="selectedModel === model ? 'border-primary bg-accent' : 'border-border'"
            >
              <p class="text-sm font-medium">{{ model }}</p>
            </button>
            <div v-if="filteredModels.length === 0" class="col-span-3 text-center py-6 text-sm text-muted-foreground">
              No models match "{{ modelSearch }}"
            </div>
          </div>
          <div class="space-y-2">
            <Label for="custom-model" class="text-sm">Or enter custom model</Label>
            <Input
              id="custom-model"
              v-model="customModel"
              placeholder="Enter model name..."
              @keyup.enter="handleCustomModelEnter"
            />
          </div>
        </div>

        <!-- Step 4: Issue Selection -->
        <div v-if="currentStep === 4" class="space-y-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="currentStep = 3">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <Label class="text-base font-medium">Select Issue</Label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="issue in issues"
              :key="issue.name"
              @click="selectIssue(issue.name)"
              class="p-4 rounded-lg border-2 transition-all hover:bg-accent text-left"
              :class="selectedIssue === issue.name ? 'border-primary bg-accent' : 'border-border'"
            >
              <div class="flex items-start gap-3">
                <component :is="issue.icon" class="w-5 h-5 flex-shrink-0" :class="selectedIssue === issue.name ? 'text-primary' : 'text-muted-foreground'" />
                <div>
                  <p class="text-sm font-medium">{{ issue.name }}</p>
                  <p class="text-xs text-muted-foreground mt-1">{{ issue.description }}</p>
                </div>
              </div>
            </button>
          </div>
          <div class="space-y-2">
            <Label for="custom-issue" class="text-sm">Or describe custom issue</Label>
            <Textarea
              id="custom-issue"
              v-model="customIssue"
              placeholder="Describe the problem..."
              :rows="3"
            />
          </div>
        </div>

        <!-- Step 5: Details & Signature -->
        <div v-if="currentStep === 5" class="space-y-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="currentStep = 4">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <Label class="text-base font-medium">Ticket Details</Label>
          </div>

          <!-- Summary -->
          <Card>
            <CardContent class="p-4">
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Device:</span>
                  <span class="font-medium">{{ selectedBrand }} {{ selectedModel || customModel }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Issue:</span>
                  <span class="font-medium">{{ selectedIssue || customIssue }}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Customer Selection -->
          <div class="space-y-2">
            <Label for="customer">Customer *</Label>
            <Select v-model="ticketData.customerId">
              <SelectTrigger id="customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="customer in customers"
                  :key="customer.id"
                  :value="customer.id"
                >
                  {{ customer.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Additional Details -->
          <div class="space-y-2">
            <Label for="device-desc">Device Condition</Label>
            <Textarea
              id="device-desc"
              v-model="ticketData.deviceDescription"
              placeholder="Color, visible damage, scratches, accessories included..."
              :rows="2"
            />
          </div>

          <div class="space-y-2">
            <Label for="serial">Serial Number</Label>
            <Input
              id="serial"
              v-model="ticketData.serialNumber"
              placeholder="Optional"
            />
          </div>

          <div class="space-y-2">
            <Label for="priority">Priority</Label>
            <Select v-model="ticketData.priority">
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Customer Signature -->
          <SignaturePad
            v-model="ticketData.signature"
            label="Customer Signature *"
            :width="550"
            :height="150"
          />
        </div>

      </div>

      <!-- Footer Actions -->
      <div class="flex gap-3 pt-4 border-t">
        <Button variant="outline" class="flex-1" @click="handleCancel">
          Cancel
        </Button>
        <Button
          v-if="currentStep < 5"
          class="flex-1"
          @click="nextStep"
          :disabled="!canProceed"
        >
          Next
          <ChevronRight class="w-4 h-4 ml-2" />
        </Button>
        <Button
          v-else
          class="flex-1"
          @click="createTicket"
          :disabled="!canCreate"
        >
          Create Ticket
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
  Droplets,
  Volume2,
  Wifi,
  Battery,
  Eye,
  Wrench
} from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/components/ui/select'
import SignaturePad from '~/components/SignaturePad.vue'

const props = defineProps<{
  modelValue: boolean
  customers: any[]
}>()

const emit = defineEmits(['update:modelValue', 'create'])

const { from } = useSupabase()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// ── State ─────────────────────────────────────────────────────────
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

// ── Supabase device data ───────────────────────────────────────────
const brands = ref<string[]>([])
const categories = ref<string[]>([])
const models = ref<string[]>([])
const loadingBrands = ref(false)
const loadingCategories = ref(false)
const loadingModels = ref(false)

const fetchBrands = async () => {
  loadingBrands.value = true
  const { data } = await from('devices').select('brand').order('brand')
  if (data) {
    brands.value = [...new Set(data.map((r: any) => r.brand))]
  }
  loadingBrands.value = false
}

const fetchCategories = async (brand: string) => {
  loadingCategories.value = true
  const { data } = await from('devices')
    .select('category')
    .eq('brand', brand)
    .order('category')
  if (data) {
    categories.value = [...new Set(data.map((r: any) => r.category))]
  }
  loadingCategories.value = false
}

const fetchModels = async (brand: string, category: string) => {
  loadingModels.value = true
  const { data } = await from('devices')
    .select('name')
    .eq('brand', brand)
    .eq('category', category)
    .order('name')
  if (data) {
    models.value = data.map((r: any) => r.name)
  }
  loadingModels.value = false
}

// Fetch brands when dialog opens
watch(isOpen, (val) => { if (val) fetchBrands() })

const filteredModels = computed(() => {
  const q = modelSearch.value.toLowerCase()
  return q ? models.value.filter(m => m.toLowerCase().includes(q)) : models.value
})

// ── Issues (static) ───────────────────────────────────────────────
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

// ── Navigation logic ──────────────────────────────────────────────
const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedBrand.value
  if (currentStep.value === 2) return !!selectedCategory.value
  if (currentStep.value === 3) return !!selectedModel.value || !!customModel.value
  if (currentStep.value === 4) return !!selectedIssue.value || !!customIssue.value
  return false
})

const canCreate = computed(() => {
  return !!ticketData.value.customerId && !!ticketData.value.signature
})

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

const handleCustomModelEnter = () => {
  if (customModel.value) selectModel(customModel.value)
}

const selectIssue = (issue: string) => {
  selectedIssue.value = issue
  customIssue.value = ''
}

const nextStep = () => {
  if (currentStep.value === 3 && customModel.value) selectedModel.value = customModel.value
  if (currentStep.value === 4 && customIssue.value) selectedIssue.value = customIssue.value
  currentStep.value++
}

const handleCancel = () => {
  resetForm()
  isOpen.value = false
}

const createTicket = () => {
  if (!canCreate.value) return
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
  brands.value = []
  categories.value = []
  models.value = []
  ticketData.value = {
    customerId: null,
    deviceDescription: '',
    serialNumber: '',
    priority: 'normal',
    signature: ''
  }
}
</script>