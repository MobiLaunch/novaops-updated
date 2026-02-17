<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Ticket</DialogTitle>
        <p class="text-sm text-muted-foreground">Step {{ currentStep }} of 4</p>
      </DialogHeader>
      
      <div class="py-6">
        <!-- Step 1: Device Type Selection -->
        <div v-if="currentStep === 1" class="space-y-4">
          <Label class="text-base font-medium">Select Device Type</Label>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="type in deviceTypes"
              :key="type.name"
              @click="selectDeviceType(type.name)"
              class="p-4 rounded-lg border-2 transition-all hover:bg-accent"
              :class="selectedDeviceType === type.name ? 'border-primary bg-accent' : 'border-border'"
            >
              <component :is="type.icon" class="w-8 h-8 mx-auto mb-2" :class="selectedDeviceType === type.name ? 'text-primary' : 'text-muted-foreground'" />
              <p class="text-sm font-medium">{{ type.name }}</p>
            </button>
          </div>
        </div>

        <!-- Step 2: Device Model Selection -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="currentStep = 1">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <Label class="text-base font-medium">Select {{ selectedDeviceType }} Model</Label>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="model in currentModels"
              :key="model"
              @click="selectModel(model)"
              class="p-3 rounded-lg border-2 transition-all hover:bg-accent text-left"
              :class="selectedModel === model ? 'border-primary bg-accent' : 'border-border'"
            >
              <p class="text-sm font-medium">{{ model }}</p>
            </button>
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

        <!-- Step 3: Issue Selection -->
        <div v-if="currentStep === 3" class="space-y-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="currentStep = 2">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <Label class="text-base font-medium">Select Issue</Label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="issue in currentIssues"
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

        <!-- Step 4: Details & Signature -->
        <div v-if="currentStep === 4" class="space-y-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="currentStep = 3">
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
                  <span class="font-medium">{{ selectedDeviceType }} {{ selectedModel }}</span>
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
        <Button 
          variant="outline" 
          class="flex-1"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button 
          v-if="currentStep < 4"
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
  Smartphone, 
  Laptop, 
  Tablet, 
  Watch, 
  Gamepad2, 
  Monitor,
  ChevronLeft,
  ChevronRight,
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

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentStep = ref(1)
const selectedDeviceType = ref('')
const selectedModel = ref('')
const customModel = ref('')
const selectedIssue = ref('')
const customIssue = ref('')

const ticketData = ref({
  customerId: null as number | null,
  deviceDescription: '',
  serialNumber: '',
  priority: 'normal',
  signature: ''
})

const deviceTypes = [
  { name: 'iPhone', icon: Smartphone },
  { name: 'Android', icon: Smartphone },
  { name: 'iPad', icon: Tablet },
  { name: 'Laptop', icon: Laptop },
  { name: 'Watch', icon: Watch },
  { name: 'Gaming', icon: Gamepad2 }
]

const modelsByType: Record<string, string[]> = {
  'iPhone': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13', 'iPhone 12', 'iPhone 11'],
  'Android': ['Samsung Galaxy S24', 'Samsung Galaxy S23', 'Google Pixel 8', 'Google Pixel 7', 'OnePlus 12', 'OnePlus 11'],
  'iPad': ['iPad Pro 12.9"', 'iPad Pro 11"', 'iPad Air', 'iPad Mini', 'iPad 10th Gen'],
  'Laptop': ['MacBook Pro 16"', 'MacBook Pro 14"', 'MacBook Air M2', 'Dell XPS 15', 'ThinkPad X1'],
  'Watch': ['Apple Watch Series 9', 'Apple Watch SE', 'Samsung Galaxy Watch 6', 'Fitbit Versa'],
  'Gaming': ['PS5', 'Xbox Series X', 'Nintendo Switch', 'Steam Deck']
}

const issues = [
  { name: 'Cracked Screen', icon: Eye, description: 'Display is cracked or damaged' },
  { name: 'Battery Issues', icon: Battery, description: 'Won\'t charge or drains quickly' },
  { name: 'Water Damage', icon: Droplets, description: 'Exposed to liquid' },
  { name: 'Won\'t Turn On', icon: Zap, description: 'Device is unresponsive' },
  { name: 'Audio Problems', icon: Volume2, description: 'Speaker or microphone issues' },
  { name: 'WiFi/Connectivity', icon: Wifi, description: 'Network connection problems' },
  { name: 'Physical Damage', icon: Wrench, description: 'Dents, bends, or broken parts' },
  { name: 'Other', icon: Wrench, description: 'Other issues' }
]

const currentModels = computed(() => modelsByType[selectedDeviceType.value] || [])
const currentIssues = computed(() => issues)

const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedDeviceType.value
  if (currentStep.value === 2) return !!selectedModel.value || !!customModel.value
  if (currentStep.value === 3) return !!selectedIssue.value || !!customIssue.value
  return false
})

const canCreate = computed(() => {
  return ticketData.value.customerId && ticketData.value.signature
})

const selectDeviceType = (type: string) => {
  selectedDeviceType.value = type
  currentStep.value = 2
}

const selectModel = (model: string) => {
  selectedModel.value = model
  customModel.value = ''
}

const handleCustomModelEnter = () => {
  if (customModel.value) {
    selectModel(customModel.value)
  }
}

const selectIssue = (issue: string) => {
  selectedIssue.value = issue
  customIssue.value = ''
}

const nextStep = () => {
  if (currentStep.value === 2 && customModel.value) {
    selectedModel.value = customModel.value
  }
  if (currentStep.value === 3 && customIssue.value) {
    selectedIssue.value = customIssue.value
  }
  currentStep.value++
}

const handleCancel = () => {
  resetForm()
  isOpen.value = false
}

const createTicket = () => {
  if (!canCreate.value) return

  const ticket = {
    device: selectedDeviceType.value,
    deviceModel: selectedModel.value || customModel.value,
    issue: selectedIssue.value || customIssue.value,
    customerId: ticketData.value.customerId,
    deviceDescription: ticketData.value.deviceDescription,
    serialNumber: ticketData.value.serialNumber,
    priority: ticketData.value.priority,
    signature: ticketData.value.signature
  }

  emit('create', ticket)
  resetForm()
}

const resetForm = () => {
  currentStep.value = 1
  selectedDeviceType.value = ''
  selectedModel.value = ''
  customModel.value = ''
  selectedIssue.value = ''
  customIssue.value = ''
  ticketData.value = {
    customerId: null,
    deviceDescription: '',
    serialNumber: '',
    priority: 'normal',
    signature: ''
  }
}
</script>
