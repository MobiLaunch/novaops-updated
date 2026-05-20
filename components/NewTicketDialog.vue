<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :draggable="false"
    class="w-full max-w-4xl mx-4"
    :show-header="false"
    pt:content:class="!p-0 flex flex-col max-h-[90dvh]"
  >
    <div class="flex items-center gap-3 p-4 border-b border-border shrink-0">
      <div class="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
        <i class="mdi mdi-wrench-outline"></i>
      </div>
      <div class="flex-1">
        <span class="font-black block">New Repair Ticket</span>
        <span class="text-xs text-muted-foreground">Step {{ displayStep }} of {{ totalSteps }}</span>
      </div>
      <Button variant="text" rounded class="!w-9 !h-9" @click="handleCancel">
        <i class="mdi mdi-close"></i>
      </Button>
    </div>

    <ProgressBar :value="(displayStep / totalSteps) * 100" class="h-0.5 shrink-0 rounded-none" />

    <div class="p-6 overflow-y-auto flex-1 min-h-0">
          <div v-show="currentStep === 1">
            <p class="text-[10px] font-black text-muted-foreground uppercase mb-4">Select Brand</p>
            <div v-if="loadingBrands" class="flex justify-center py-10">
              <ProgressSpinner style="width: 32px; height: 32px" stroke-width="4" />
            </div>
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              <button
                v-for="brand in allBrands"
                :key="brand"
                type="button"
                class="m3-step-chip flex items-center gap-2"
                :class="{ 'm3-step-chip--active': selectedBrand === brand }"
                @click="selectBrand(brand)"
              >
                <img v-if="brandLogoUrl(brand)" :src="brandLogoUrl(brand)" :alt="brand" class="w-6 h-6 object-contain" />
                <span class="text-xs font-bold">{{ brand }}</span>
              </button>
              <button type="button" class="m3-step-chip flex items-center gap-2" :class="{ 'm3-step-chip--active': isOtherBrand }" @click="selectOtherBrand">
                <i class="mdi mdi-dots-horizontal-circle-outline"></i>
                <span class="text-xs font-bold">Other</span>
              </button>
            </div>
            <div v-if="isOtherBrand" class="mt-6 pt-6 border-t border-border flex flex-col gap-3">
              <InputText v-model="customBrand" placeholder="e.g. Motorola, OnePlus..." class="w-full rounded-xl" @keyup.enter="confirmOtherBrand" />
              <Button class="w-full font-bold" :disabled="!customBrand" @click="confirmOtherBrand">
                Continue with "{{ customBrand || '...' }}"
              </Button>
            </div>
          </div>

          <div v-show="currentStep === 2">
            <div class="flex items-center gap-2 mb-4">
              <button type="button" class="m3-back-btn" @click="goBackFromStep2"><i class="mdi mdi-arrow-left"></i></button>
              <p class="text-[10px] font-black text-muted-foreground uppercase m-0">{{ selectedBrand }} — Category</p>
            </div>
            <template v-if="isOtherBrand">
              <Message severity="info" :closable="false" class="mb-4 text-sm">Custom device entry for {{ selectedBrand }}</Message>
              <p class="text-[10px] font-black text-muted-foreground uppercase mb-2">Device Category</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                <button
                  v-for="cat in commonCategories"
                  :key="cat.label"
                  type="button"
                  class="m3-step-chip flex items-center gap-2"
                  :class="{ 'm3-step-chip--active': selectedCategory === cat.label }"
                  @click="selectedCategory = cat.label; customCategory = ''"
                >
                  <span class="w-5 h-5 shrink-0 category-icon" v-html="cat.icon"></span>
                  <span class="text-xs font-bold">{{ cat.label }}</span>
                </button>
              </div>
              <InputText v-model="customCategory" placeholder="Or type custom category..." class="w-full rounded-xl mb-3" @focus="selectedCategory = ''" @input="selectedCategory = customCategory" />
              <InputText v-model="customModel" placeholder="Model / Device Name" class="w-full rounded-xl" />
            </template>
            <template v-else>
              <div v-if="loadingCategories" class="flex justify-center py-10"><ProgressSpinner stroke-width="4" /></div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  v-for="cat in categories"
                  :key="cat"
                  type="button"
                  class="m3-step-chip text-left font-bold"
                  :class="{ 'm3-step-chip--active': selectedCategory === cat }"
                  @click="selectCategory(cat)"
                >{{ cat }}</button>
              </div>
            </template>
          </div>

          <div v-show="currentStep === 3">
            <div class="flex items-center gap-2 mb-4">
              <button type="button" class="m3-back-btn" @click="currentStep = 2"><i class="mdi mdi-arrow-left"></i></button>
              <p class="text-[10px] font-black text-muted-foreground uppercase m-0">Select Model</p>
            </div>
            <InputText v-model="modelSearch" placeholder="Search models..." class="w-full rounded-xl mb-4" />
            <div v-if="loadingModels" class="flex justify-center py-10"><ProgressSpinner stroke-width="4" /></div>
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto mb-4">
              <button
                v-for="model in filteredModels"
                :key="model"
                type="button"
                class="m3-step-chip text-xs font-bold"
                :class="{ 'm3-step-chip--active': selectedModel === model }"
                @click="selectModel(model)"
              >{{ model }}</button>
              <p v-if="filteredModels.length === 0" class="col-span-full text-center text-sm text-muted-foreground">No models match "{{ modelSearch }}"</p>
            </div>
            <hr class="border-border my-4" />
            <InputText v-model="customModel" placeholder="Or enter custom model..." class="w-full rounded-xl" @keyup.enter="handleCustomModelEnter" />
          </div>

          <div v-show="currentStep === 4">
            <div class="flex items-center gap-2 mb-4">
              <button type="button" class="m3-back-btn" @click="currentStep = 3"><i class="mdi mdi-arrow-left"></i></button>
              <p class="text-[10px] font-black text-muted-foreground uppercase m-0">Select Issue</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="issue in issues"
                :key="issue.name"
                type="button"
                class="m3-step-chip flex items-start gap-3 text-left"
                :class="{ 'm3-step-chip--active': selectedIssue === issue.name }"
                @click="selectIssue(issue.name)"
              >
                <i class="mdi text-lg shrink-0" :class="issue.icon"></i>
                <div>
                  <div class="text-sm font-bold">{{ issue.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ issue.description }}</div>
                </div>
              </button>
            </div>
            <hr class="border-border my-4" />
            <Textarea v-model="customIssue" rows="3" placeholder="Or describe custom issue..." class="w-full rounded-xl" />
          </div>

          <div v-show="currentStep === 5">
            <div class="flex items-center gap-2 mb-4">
              <button type="button" class="m3-back-btn" @click="currentStep = 4"><i class="mdi mdi-arrow-left"></i></button>
              <p class="text-[10px] font-black text-muted-foreground uppercase m-0">Ticket Details</p>
            </div>
            <Message severity="info" :closable="false" class="mb-5">
              <strong>{{ selectedBrand }} {{ selectedModel || customModel }}</strong> — {{ selectedIssue || customIssue }}
            </Message>
            <div class="mb-4"><CustomerSelect v-model="ticketData.customerId" /></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <InputText v-model="ticketData.serialNumber" placeholder="Serial Number (optional)" class="rounded-xl" />
              <Select v-model="ticketData.priority" :options="priorityOptions" option-label="label" option-value="value" placeholder="Priority" class="w-full" />
            </div>
            <Textarea v-model="ticketData.deviceDescription" rows="2" placeholder="Device condition…" class="w-full rounded-xl mb-4" />
            <p class="text-[10px] font-black text-muted-foreground uppercase mb-2">Photos (optional — up to 6)</p>
            <div
              class="photo-dropzone"
              :class="{ 'photo-dropzone--drag': isDragging, 'photo-dropzone--has-files': photoAttachments.length > 0 }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handlePhotoDrop"
              @click="triggerPhotoInput"
            >
              <input ref="photoInputRef" type="file" accept="image/*" multiple class="hidden" @change="handlePhotoSelect" />
              <div v-if="!photoAttachments.length" class="text-center py-4 text-muted-foreground">
                <i class="mdi mdi-camera-outline text-3xl block mb-2"></i>
                <div class="text-sm font-bold">Drop photos or click to browse</div>
              </div>
              <div v-else class="grid grid-cols-4 sm:grid-cols-6 gap-2 w-full">
                <div v-for="(photo, idx) in photoAttachments" :key="idx" class="photo-thumb">
                  <img :src="photo.preview" alt="" class="w-full aspect-square object-cover" />
                  <button type="button" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs" @click.stop="removePhoto(idx)">×</button>
                </div>
              </div>
            </div>
            <p class="text-[10px] font-black text-muted-foreground uppercase mb-2 mt-6">Customer Signature (optional)</p>
            <SignaturePad v-model="ticketData.signature" :width="550" :height="150" />
          </div>
    </div>

    <div class="flex items-center gap-2 p-4 border-t border-border bg-muted/30 shrink-0">
      <Button label="Devices" variant="outlined" class="text-none text-xs" @click="showDeviceMgr = true">
        <i class="mdi mdi-cog mr-1"></i>
      </Button>
      <div class="flex-1"></div>
      <Button label="Cancel" variant="text" class="text-none" @click="handleCancel" />
      <Button v-if="currentStep < 5" label="Next" class="text-none font-bold" :disabled="!canProceed" @click="nextStep" />
      <Button v-else label="Create Ticket" class="text-none font-bold" :disabled="!canCreate || creating" :loading="creating" @click="createTicket" />
    </div>
  </Dialog>

  <Dialog v-model:visible="showDeviceMgr" modal header="Device Catalog" class="w-full max-w-2xl mx-4">
    <Tabs v-model:value="mgrTab">
      <TabList>
        <Tab value="Brands">Brands</Tab>
        <Tab value="Categories">Categories</Tab>
        <Tab value="Models">Models</Tab>
      </TabList>
      <TabPanels class="pt-4">
        <TabPanel value="Brands">
          <div class="flex flex-wrap gap-2 mb-4 items-end">
            <InputText v-model="newBrandName" placeholder="Brand name" class="flex-1 rounded-xl" @keyup.enter="addBrand" />
            <InputText v-model="newBrandIcon" placeholder="Icon slug" class="w-32 rounded-xl" />
            <Button label="Add" :disabled="!newBrandName.trim()" @click="addBrand" />
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="b in catalogBrands" :key="b.id" class="flex items-center justify-between p-2 border border-border rounded-lg">
              <span class="text-sm font-bold truncate">{{ b.name }}</span>
              <Button variant="text" severity="danger" size="small" class="!w-7 !h-7" @click="deleteBrand(b.id)"><i class="mdi mdi-close"></i></Button>
            </div>
          </div>
        </TabPanel>
        <TabPanel value="Categories">
          <div class="flex gap-2 mb-4">
            <InputText v-model="newCatName" placeholder="Category name" class="flex-1 rounded-xl" @keyup.enter="addCategory" />
            <Button label="Add" :disabled="!newCatName.trim()" @click="addCategory" />
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="c in catalogCategories" :key="c.id" class="flex items-center justify-between p-2 border border-border rounded-lg">
              <span class="text-sm">{{ c.emoji || '📦' }} {{ c.name }}</span>
              <Button variant="text" severity="danger" size="small" @click="deleteCategory(c.id)"><i class="mdi mdi-close"></i></Button>
            </div>
          </div>
        </TabPanel>
        <TabPanel value="Models">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <Select v-model="newModelBrand" :options="allBrandsForMgr" placeholder="Brand" class="w-full" />
            <Select v-model="newModelCategory" :options="allCategoriesForMgr" placeholder="Category" class="w-full" />
            <InputText v-model="newModelName" placeholder="Model name" class="rounded-xl" @keyup.enter="addModel" />
          </div>
          <Button label="Add Model" class="mb-4" :disabled="!newModelName.trim() || !newModelBrand || !newModelCategory" @click="addModel" />
          <ul v-if="catalogModels.length" class="m-0 p-0 list-none border border-border rounded-xl divide-y divide-border">
            <li v-for="m in catalogModels" :key="m.id" class="flex items-center justify-between p-3">
              <div>
                <div class="text-sm font-bold">{{ m.name }}</div>
                <div class="text-xs text-muted-foreground">{{ m.brand }} / {{ m.category }}</div>
              </div>
              <Button variant="text" severity="danger" size="small" @click="deleteModel(m.id)"><i class="mdi mdi-close"></i></Button>
            </li>
          </ul>
        </TabPanel>
      </TabPanels>
    </Tabs>
    <template #footer>
      <Button label="Done" @click="showDeviceMgr = false; fetchBrands()" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import SignaturePad from '~/components/SignaturePad.vue'
import CustomerSelect from '~/components/CustomerSelect.vue'

const props = defineProps<{
  modelValue: boolean
  customers: any[]
}>()

const emit = defineEmits(['update:modelValue', 'create'])

const { $supabase } = useNuxtApp()
const from = (table: string) => ($supabase as unknown as any).from(table)

// ── Known brands & devices (used as fallback / supplement to DB) ──────────
const KNOWN_BRANDS = [
  'Apple', 'Samsung', 'Google', 'Sony', 'LG',
  'Microsoft', 'Dell', 'HP', 'Lenovo', 'ASUS',
  'Acer', 'Huawei', 'OnePlus', 'Motorola', 'Nokia',
  'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Nothing',
]

const commonCategories = [
  { label: 'Smartphone', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1"/></svg>` },
  { label: 'Tablet',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="17" cy="12" r="1"/></svg>` },
  { label: 'Laptop',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M0 20h24"/></svg>` },
  { label: 'Desktop',    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>` },
  { label: 'Smartwatch', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M10 3h4M10 21h4"/></svg>` },
  { label: 'Gaming',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r="1"/><circle cx="17" cy="13" r="1"/><path d="M2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10 10 10 0 0 0-10-10 10 10 0 0 0-10 10z"/></svg>` },
  { label: 'Headphones', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>` },
  { label: 'Camera',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` },
]

// ── Brand logos via Simple Icons CDN ─────────────────────────────
// https://cdn.simpleicons.org/[slug]/[hex-color]
const BRAND_SLUGS: Record<string, string> = {
  Apple:     'apple',
  Samsung:   'samsung',
  Google:    'google',
  Sony:      'sony',
  LG:        'lg',
  Microsoft: 'microsoft',
  Dell:      'dell',
  HP:        'hp',
  Lenovo:    'lenovo',
  ASUS:      'asus',
  Acer:      'acer',
  Huawei:    'huawei',
  OnePlus:   'oneplus',
  Motorola:  'motorola',
  Nokia:     'nokia',
  Xiaomi:    'xiaomi',
  Oppo:      'oppo',
  Vivo:      'vivo',
  Realme:    'realme',
  Nothing:   'nothing',
}

const brandLogoUrl = (brand: string): string => {
  const slug = BRAND_SLUGS[brand]
  if (!slug) return ''
  // Simple Icons CDN: /slug/light-hex/dark-hex
  return `https://cdn.simpleicons.org/${slug}/555555/cccccc`
}

// Merge DB devices table brands + custom catalog brands + known brands (deduped)
const allBrands = computed(() => {
  const fromDevicesTable = brands.value || []
  const fromCatalog = catalogBrandNames.value || []
  const combinedNames = [...fromDevicesTable, ...fromCatalog]
  
  const uniqueMap = new Map<string, string>()
  
  // Add known brands first so they provide a nice fallback casing
  KNOWN_BRANDS.forEach(b => uniqueMap.set(b.toLowerCase(), b))
  
  // Add DB/Catalog brands, overriding if they already exist to use the exact DB casing or keeping them if they don't
  combinedNames.forEach(b => {
    if (!b) return
    const lower = b.toLowerCase()
    // We prefer the case provided in the DB if it is actually used, 
    // or we can just only add if missing to prefer KNOWN_BRANDS casing. Let's prefer KNOWN_BRANDS casing for consistency,
    // so we only set if missing:
    if (!uniqueMap.has(lower)) {
      uniqueMap.set(lower, b)
    }
  })
  
  return Array.from(uniqueMap.values()).sort((a, b) => a.localeCompare(b))
})

// Other / custom brand state
const isOtherBrand = ref(false)
const customBrand = ref('')
const customCategory = ref('')

// Step display — "Other" brand skips step 3, so total = 4
const totalSteps = computed(() => isOtherBrand.value ? 4 : 5)
const displayStep = computed(() => {
  if (!isOtherBrand.value) return currentStep.value
  // Map internal steps: 1→1, 2→2, 4→3, 5→4
  if (currentStep.value <= 2) return currentStep.value
  if (currentStep.value === 4) return 3
  if (currentStep.value === 5) return 4
  return currentStep.value
})

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

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
]

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
  if (data) brands.value = [...new Set(data.map((r: any) => String(r.brand)))] as string[]
  loadingBrands.value = false
}

const fetchCategories = async (brand: string) => {
  loadingCategories.value = true
  const { data } = await from('devices').select('category').eq('brand', brand).order('category')
  if (data) categories.value = [...new Set(data.map((r: any) => String(r.category)))] as string[]
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
  { name: 'Cracked Screen',    icon: 'mdi-eye-outline',      description: 'Display is cracked or damaged' },
  { name: 'Battery Issues',    icon: 'mdi-battery',  description: "Won't charge or drains quickly" },
  { name: 'Water Damage',      icon: 'mdi-water', description: 'Exposed to liquid' },
  { name: "Won't Turn On",     icon: 'mdi-flash-outline',      description: 'Device is unresponsive' },
  { name: 'Audio Problems',    icon: 'mdi-volume-high',  description: 'Speaker or microphone issues' },
  { name: 'WiFi/Connectivity', icon: 'mdi-wifi',     description: 'Network connection problems' },
  { name: 'Physical Damage',   icon: 'mdi-wrench-outline',   description: 'Dents, bends, or broken parts' },
  { name: 'Other',             icon: 'mdi-wrench-outline',   description: 'Other issues' }
]

const selectOtherBrand = () => {
  isOtherBrand.value = true
  selectedBrand.value = ''
  customBrand.value = ''
}

const confirmOtherBrand = () => {
  if (!customBrand.value) return
  selectedBrand.value = customBrand.value
  selectedCategory.value = ''
  selectedModel.value = ''
  customModel.value = ''
  currentStep.value = 2
}

const goBackFromStep2 = () => {
  currentStep.value = 1
  if (isOtherBrand.value) {
    selectedBrand.value = ''
  }
}

const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedBrand.value || (isOtherBrand.value && !!customBrand.value)
  if (currentStep.value === 2) {
    if (isOtherBrand.value) return (!!selectedCategory.value || !!customCategory.value) && !!customModel.value
    return !!selectedCategory.value
  }
  if (currentStep.value === 3) return !!selectedModel.value || !!customModel.value
  if (currentStep.value === 4) return !!selectedIssue.value || !!customIssue.value
  return false
})

const canCreate = computed(() => !!ticketData.value.customerId)

const selectBrand = async (brand: string) => {
  isOtherBrand.value = false
  customBrand.value = ''
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
  if (currentStep.value === 2 && isOtherBrand.value) {
    // For "Other" brand, category+model are collected in step 2, jump straight to issues
    if (customCategory.value) selectedCategory.value = customCategory.value
    currentStep.value = 4
    return
  }
  if (currentStep.value === 3 && customModel.value) selectedModel.value = customModel.value
  if (currentStep.value === 4 && customIssue.value) selectedIssue.value = customIssue.value
  currentStep.value++
}

const handleCancel = () => { resetForm(); isOpen.value = false }

const creating = ref(false)

// ── Photo attachments ─────────────────────────────────────────────────────
interface PhotoAttachment { file: File; preview: string }
const photoAttachments = ref<PhotoAttachment[]>([])
const photoInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const triggerPhotoInput = () => photoInputRef.value?.click()

const addPhotoFiles = (files: FileList | File[]) => {
  const arr = Array.from(files)
  const remaining = 6 - photoAttachments.value.length
  arr.slice(0, remaining).forEach(file => {
    if (!file.type.startsWith('image/')) return
    const preview = URL.createObjectURL(file)
    photoAttachments.value.push({ file, preview })
  })
}

const handlePhotoSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) addPhotoFiles(input.files)
  input.value = ''
}

const handlePhotoDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) addPhotoFiles(e.dataTransfer.files)
}

const removePhoto = (idx: number) => {
  URL.revokeObjectURL(photoAttachments.value[idx].preview)
  photoAttachments.value.splice(idx, 1)
}
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
    signature: ticketData.value.signature,
    photos: photoAttachments.value.map(p => p.file)
  })
  // Parent controls closing via v-model; reset after a tick so data is preserved during the async save
  setTimeout(() => { resetForm(); creating.value = false }, 300)
}

// ── Device Catalog Manager ────────────────────────────────────────
const showDeviceMgr  = ref(false)
const mgrTab         = ref('Brands')
const catalogBrands     = ref<any[]>([])
const catalogCategories = ref<any[]>([])
const catalogModels     = ref<any[]>([])

// Add brand form
const newBrandName = ref('')
const newBrandIcon = ref('')
// Add category form
const newCatName    = ref('')
const newCatEmoji   = ref('')
const showEmojiPicker = ref(false)
// Add model form
const newModelBrand    = ref('')
const newModelCategory = ref('')
const newModelName     = ref('')

const categoryEmojis = ['📱','💻','🖥️','⌚','🎮','🎧','📷','📺','🖨️','⌨️','🖱️','🔋','📡','🎙️','🕹️','📟','📠','🔭','📻']

const loadCatalog = async () => {
  if (!$supabase) return
  const [br, ca, mo] = await Promise.all([
    from('device_brands').select('*').order('name'),
    from('device_categories').select('*').order('name'),
    from('device_models').select('*').order('brand').order('name'),
  ])
  catalogBrands.value     = br.data || []
  catalogCategories.value = ca.data || []
  catalogModels.value     = mo.data || []
}

const addBrand = async () => {
  if (!newBrandName.value.trim() || !$supabase) return
  const iconVal = newBrandIcon.value.trim()
  const icon_url = iconVal
    ? iconVal.startsWith('http') ? iconVal : `https://cdn.simpleicons.org/${iconVal}/555555/cccccc`
    : null
  await from('device_brands').insert({ name: newBrandName.value.trim(), icon_url })
  newBrandName.value = ''; newBrandIcon.value = ''
  await loadCatalog()
}

const deleteBrand = async (id: number) => {
  if (!$supabase) return
  await from('device_brands').delete().eq('id', id)
  await loadCatalog()
}

const addCategory = async () => {
  if (!newCatName.value.trim() || !$supabase) return
  await from('device_categories').insert({ name: newCatName.value.trim(), emoji: newCatEmoji.value || '📦' })
  newCatName.value = ''; newCatEmoji.value = ''; showEmojiPicker.value = false
  await loadCatalog()
}

const deleteCategory = async (id: number) => {
  if (!$supabase) return
  await from('device_categories').delete().eq('id', id)
  await loadCatalog()
}

const addModel = async () => {
  if (!newModelName.value.trim() || !newModelBrand.value || !newModelCategory.value || !$supabase) return
  await from('device_models').insert({
    brand: newModelBrand.value, category: newModelCategory.value, name: newModelName.value.trim()
  })
  newModelName.value = ''
  await loadCatalog()
}

const deleteModel = async (id: number) => {
  if (!$supabase) return
  await from('device_models').delete().eq('id', id)
  await loadCatalog()
}

// Combined brand list for model picker (DB custom + known)
const allBrandsForMgr = computed(() => {
  const custom = catalogBrands.value.map(b => b.name)
  const extra = KNOWN_BRANDS.filter(b => !custom.map(c => c.toLowerCase()).includes(b.toLowerCase()))
  return [...custom, ...extra].sort()
})

// Combined category list for model picker
const allCategoriesForMgr = computed(() => {
  const custom = catalogCategories.value.map(c => c.name)
  const builtin = commonCategories.map(c => c.label)
  const extra = builtin.filter(b => !custom.map(c => c.toLowerCase()).includes(b.toLowerCase()))
  return [...custom, ...extra].sort()
})

watch(showDeviceMgr, (val) => { if (val) loadCatalog() })

// Enrich allBrands with catalog brands
const catalogBrandNames = computed(() => catalogBrands.value.map(b => b.name))

const resetForm = () => {
  currentStep.value = 1
  selectedBrand.value = ''
  selectedCategory.value = ''
  selectedModel.value = ''
  customModel.value = ''
  modelSearch.value = ''
  selectedIssue.value = ''
  customIssue.value = ''
  isOtherBrand.value = false
  customBrand.value = ''
  customCategory.value = ''
  brands.value = []
  categories.value = []
  models.value = []
  ticketData.value = { customerId: null, deviceDescription: '', serialNumber: '', priority: 'normal', signature: '' }
  photoAttachments.value.forEach(p => URL.revokeObjectURL(p.preview))
  photoAttachments.value = []
  isDragging.value = false
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

.photo-dropzone {
  border-radius: 20px;
  border: 2px dashed hsl(var(--border)/0.8);
  background: hsl(var(--muted)/0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 12px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-dropzone:hover,
.photo-dropzone--drag {
  border-color: #6366f1;
  background: #6366f108;
  box-shadow: 0 0 0 3px #6366f115;
}
.photo-dropzone--has-files {
  cursor: default;
  border-style: solid;
  border-color: hsl(var(--border)/0.6);
  background: hsl(var(--muted)/0.2);
  justify-content: flex-start;
  align-items: flex-start;
}
.photo-dropzone--has-files:hover {
  border-color: hsl(var(--border)/0.6);
  background: hsl(var(--muted)/0.2);
  box-shadow: none;
  cursor: default;
}
.photo-thumb {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

/* Ensure v-html injected SVG logos fill their wrapper span */
.category-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* ── Device Catalog Manager ── */
.mgr-input {
  height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  background: hsl(var(--muted)/0.5);
  border: 2px solid hsl(var(--border)/0.7);
  color: hsl(var(--foreground));
  outline: none;
  transition: all 0.2s ease;
  width: 100%;
}
.mgr-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px #8b5cf615;
  background: hsl(var(--background));
}

.mgr-add-btn {
  height: 42px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}
.mgr-add-btn:hover:not(:disabled) { transform: scale(1.04) translateY(-1px); box-shadow: 0 4px 16px #8b5cf640; }
.mgr-add-btn:active:not(:disabled) { transform: scale(0.96); }
.mgr-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>

