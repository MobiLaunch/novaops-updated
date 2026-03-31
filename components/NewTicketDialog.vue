<template>
  <v-dialog v-model="isOpen" max-width="900" scrollable>
    <v-card class="d-flex flex-column" style="max-height: 90dvh">
      <!-- Header -->
      <v-card-item class="border-b">
        <template #prepend>
          <v-avatar color="primary" rounded="lg">
            <v-icon icon="mdi-wrench-outline" size="20" color="white" />
          </v-avatar>
        </template>
        <v-card-title class="text-h6 font-weight-black">New Repair Ticket</v-card-title>
        <v-card-subtitle>Step {{ displayStep }} of {{ totalSteps }}</v-card-subtitle>
        <template #append>
          <v-btn icon="mdi-close" variant="text" size="small" @click="handleCancel" />
        </template>
      </v-card-item>

      <v-progress-linear :model-value="(displayStep / totalSteps) * 100" color="primary" height="2" />

      <v-card-text class="pa-6" style="overflow-y: auto;">
        <!-- Step 1: Brand -->
        <v-window v-model="currentStep" disabled touchless>
          <v-window-item :value="1">
            <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-4">Select Brand</p>
            <div v-if="loadingBrands" class="d-flex justify-center py-10">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <v-row v-else dense>
              <v-col v-for="brand in allBrands" :key="brand" cols="6" sm="4" md="3">
                <v-card hover :color="selectedBrand === brand ? 'primary' : undefined" :variant="selectedBrand === brand ? 'tonal' : 'outlined'" class="pa-3 d-flex align-center gap-2 h-100" @click="selectBrand(brand)">
                  <img :src="brandLogoUrl(brand)" :alt="brand" class="w-6 h-6 object-contain" :style="selectedBrand === brand ? 'filter: brightness(0) invert(1)' : ''" />
                  <span class="text-button font-weight-bold" style="line-height: 1.2">{{ brand }}</span>
                </v-card>
              </v-col>
              <v-col cols="6" sm="4" md="3">
                <v-card hover :color="isOtherBrand ? 'primary' : undefined" :variant="isOtherBrand ? 'tonal' : 'outlined'" class="pa-3 d-flex align-center gap-2 h-100" @click="selectOtherBrand">
                  <span class="w-6 h-6 d-flex align-center justify-center opacity-70" v-html="otherBrandIcon"></span>
                  <span class="text-button font-weight-bold">Other</span>
                </v-card>
              </v-col>
            </v-row>
            <v-slide-y-transition>
              <div v-if="isOtherBrand" class="mt-6 pt-6 border-t">
                <v-text-field v-model="customBrand" label="Enter Brand Name" placeholder="e.g. Motorola, OnePlus..." variant="outlined" density="comfortable" @keyup.enter="confirmOtherBrand" />
                <v-btn block color="primary" size="large" :disabled="!customBrand" @click="confirmOtherBrand">
                  Continue with "{{ customBrand || '...' }}"
                </v-btn>
              </div>
            </v-slide-y-transition>
          </v-window-item>

          <!-- Step 2: Category -->
          <v-window-item :value="2">
            <div class="d-flex align-center gap-2 mb-4">
              <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="goBackFromStep2" />
              <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-0">{{ selectedBrand }} — Category</p>
            </div>
            <template v-if="isOtherBrand">
              <v-alert type="info" variant="tonal" class="mb-4" icon="mdi-pencil">
                <div class="text-subtitle-2 font-weight-bold">Custom Device Entry</div>
                <div class="text-caption">Fill in the details for {{ selectedBrand }}</div>
              </v-alert>
              <v-row dense>
                <v-col cols="12">
                  <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2 mt-2">Device Category</p>
                  <v-row dense>
                    <v-col v-for="cat in commonCategories" :key="cat.label" cols="6" sm="4">
                      <v-card hover :color="selectedCategory === cat.label ? 'primary' : undefined" :variant="selectedCategory === cat.label ? 'tonal' : 'outlined'" class="pa-2 d-flex align-center gap-2" @click="selectedCategory = cat.label; customCategory = ''">
                        <span class="w-5 h-5 flex-shrink-0" v-html="cat.icon"></span>
                        <span class="text-button font-weight-bold">{{ cat.label }}</span>
                      </v-card>
                    </v-col>
                  </v-row>
                  <v-text-field v-model="customCategory" label="Or type custom category..." variant="outlined" density="comfortable" class="mt-4" @focus="selectedCategory = ''" @input="selectedCategory = customCategory" />
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="customModel" label="Model / Device Name" placeholder="e.g. Edge 40 Pro..." variant="outlined" density="comfortable" hide-details />
                </v-col>
              </v-row>
            </template>
            <template v-else>
              <div v-if="loadingCategories" class="d-flex justify-center py-10">
                <v-progress-circular indeterminate color="primary" />
              </div>
              <v-row v-else dense>
                <v-col v-for="cat in categories" :key="cat" cols="12" sm="6">
                  <v-card hover :color="selectedCategory === cat ? 'primary' : undefined" :variant="selectedCategory === cat ? 'tonal' : 'outlined'" class="pa-4 text-start" @click="selectCategory(cat)">
                    <span class="text-button font-weight-bold">{{ cat }}</span>
                  </v-card>
                </v-col>
              </v-row>
            </template>
          </v-window-item>

          <!-- Step 3: Model -->
          <v-window-item :value="3">
            <div class="d-flex align-center gap-2 mb-4">
              <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="currentStep = 2" />
              <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-0">Select Model</p>
            </div>
            <v-text-field v-model="modelSearch" prepend-inner-icon="mdi-magnify" label="Search models..." variant="outlined" density="comfortable" class="mb-4" hide-details />
            
            <div v-if="loadingModels" class="d-flex justify-center py-10">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <v-row v-else dense style="max-height: 240px; overflow-y: auto; overflow-x: hidden;">
              <v-col v-for="model in filteredModels" :key="model" cols="6" sm="4">
                <v-card hover :color="selectedModel === model ? 'primary' : undefined" :variant="selectedModel === model ? 'tonal' : 'outlined'" class="pa-2 h-100 d-flex align-center" @click="selectModel(model)">
                  <span class="text-caption font-weight-bold d-block text-truncate" style="white-space: normal;">{{ model }}</span>
                </v-card>
              </v-col>
              <v-col cols="12" v-if="filteredModels.length === 0">
                <div class="text-center py-4 text-medium-emphasis">No models match "{{ modelSearch }}"</div>
              </v-col>
            </v-row>
            <v-divider class="my-4" />
            <v-text-field v-model="customModel" label="Or enter custom model..." variant="outlined" density="comfortable" hide-details @keyup.enter="handleCustomModelEnter" />
          </v-window-item>

          <!-- Step 4: Issue -->
          <v-window-item :value="4">
            <div class="d-flex align-center gap-2 mb-4">
              <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="currentStep = 3" />
              <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-0">Select Issue</p>
            </div>
            <v-row dense>
              <v-col v-for="issue in issues" :key="issue.name" cols="12" sm="6">
                <v-card hover :color="selectedIssue === issue.name ? 'primary' : undefined" :variant="selectedIssue === issue.name ? 'tonal' : 'outlined'" class="pa-3 d-flex align-start gap-3 h-100" @click="selectIssue(issue.name)">
                  <v-avatar :color="selectedIssue === issue.name ? 'primary' : 'grey-lighten-2'" size="32" rounded="lg">
                    <v-icon :icon="issue.icon" size="16" :class="selectedIssue === issue.name ? 'text-white' : 'text-body-1'" />
                  </v-avatar>
                  <div>
                    <div class="text-button font-weight-bold" style="line-height:1.2">{{ issue.name }}</div>
                    <div class="text-caption text-medium-emphasis mt-1" style="line-height:1.2">{{ issue.description }}</div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
            <v-divider class="my-4" />
            <v-textarea v-model="customIssue" label="Or describe custom issue..." rows="3" variant="outlined" density="comfortable" hide-details />
          </v-window-item>

          <!-- Step 5: Details -->
          <v-window-item :value="5">
            <div class="d-flex align-center gap-2 mb-4">
              <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="currentStep = 4" />
              <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-0">Ticket Details</p>
            </div>
            
            <v-alert type="info" variant="tonal" icon="mdi-wrench" class="mb-5">
              <div class="font-weight-black text-subtitle-2">{{ selectedBrand }} {{ selectedModel || customModel }}</div>
              <div class="text-caption">{{ selectedIssue || customIssue }}</div>
            </v-alert>

            <v-row dense>
              <v-col cols="12">
                <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-1">Customer *</p>
                <div class="mb-4">
                  <CustomerSelect v-model="ticketData.customerId" />
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="ticketData.serialNumber" label="Serial Number (Optional)" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select v-model="ticketData.priority" :items="['low','normal','high']" label="Priority" variant="outlined" density="comfortable" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="ticketData.deviceDescription" label="Device Condition" rows="2" placeholder="Color, visible damage..." variant="outlined" density="comfortable" hide-details />
              </v-col>
            </v-row>

            <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2 mt-4">Photos (Optional — up to 6)</p>
            <!-- Dropzone -->
            <v-card variant="outlined" class="pa-4" :class="isDragging ? 'border-primary' : 'border-dashed'" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handlePhotoDrop" @click="triggerPhotoInput" hover>
              <input ref="photoInputRef" type="file" accept="image/*" multiple class="d-none" @change="handlePhotoSelect" />
              <div v-if="photoAttachments.length === 0" class="text-center py-4 text-medium-emphasis">
                <v-icon size="36" class="mb-2">mdi-camera-outline</v-icon>
                <div class="text-button font-weight-bold text-none">Drop photos here or click to browse</div>
                <div class="text-caption mt-1">JPG, PNG, HEIC up to 10 MB each</div>
              </div>
              <v-row v-else dense>
                <v-col v-for="(photo, idx) in photoAttachments" :key="idx" cols="4" sm="3" md="2">
                  <v-img :src="photo.preview" aspect-ratio="1" cover class="rounded-lg position-relative">
                    <v-btn icon="mdi-close" size="x-small" color="black" class="position-absolute" style="top:4px; right:4px; opacity:0.8" @click.stop="removePhoto(idx)" />
                  </v-img>
                </v-col>
                <v-col cols="12">
                   <p class="text-caption text-right text-medium-emphasis mb-0 mt-2">{{ photoAttachments.length }}/6 photo{{ photoAttachments.length !== 1 ? 's' : '' }} added</p>
                </v-col>
              </v-row>
            </v-card>

            <div class="mt-6 mb-2">
              <p class="text-caption font-weight-black text-medium-emphasis text-uppercase mb-2">Customer Signature (Optional)</p>
              <SignaturePad v-model="ticketData.signature" :width="Math.min(550, typeof window !== 'undefined' ? window.innerWidth - 80 : 550)" :height="150" />
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />
      
      <!-- Footer actions -->
      <v-card-actions class="pa-4 bg-muted/10">
        <v-btn variant="tonal" color="secondary" @click="showDeviceMgr = true">
          <v-icon start>mdi-cog</v-icon> Devices
        </v-btn>
        <v-spacer />
        <v-btn variant="text" color="secondary" class="mr-3" @click="handleCancel">Cancel</v-btn>
        
        <v-btn v-if="currentStep < 5" color="primary" variant="flat" :disabled="!canProceed" @click="nextStep" min-width="100">
          Next <v-icon end>mdi-chevron-right</v-icon>
        </v-btn>
        <v-btn v-else color="primary" variant="flat" :disabled="!canCreate || creating" :loading="creating" @click="createTicket" min-width="120">
          Create Ticket
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Device Catalog Dialog -->
  <v-dialog v-model="showDeviceMgr" max-width="800" scrollable>
    <v-card class="d-flex flex-column" style="max-height:90dvh">
      <v-card-item class="border-b">
        <template #prepend><v-avatar color="primary" rounded="lg"><v-icon icon="mdi-chip" size="20" color="white" /></v-avatar></template>
        <v-card-title class="text-h6 font-weight-black">Device Catalog</v-card-title>
        <v-card-subtitle>Manage brands, categories, models</v-card-subtitle>
        <template #append>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showDeviceMgr = false; fetchBrands()" />
        </template>
      </v-card-item>
      
      <v-tabs v-model="mgrTab" density="compact" class="px-4 border-b">
        <v-tab value="Brands">Brands</v-tab>
        <v-tab value="Categories">Categories</v-tab>
        <v-tab value="Models">Models</v-tab>
      </v-tabs>
      
      <v-card-text class="pa-6" style="overflow-y: auto;">
        <v-tabs-window v-model="mgrTab">
          <v-tabs-window-item value="Brands">
            <v-row dense class="align-center mb-4">
              <v-col cols="6"><v-text-field v-model="newBrandName" label="Brand name" variant="outlined" density="compact" hide-details @keyup.enter="addBrand" /></v-col>
              <v-col cols="4"><v-text-field v-model="newBrandIcon" label="Icon URL or Emoji" variant="outlined" density="compact" hide-details /></v-col>
              <v-col cols="2"><v-btn block color="primary" :disabled="!newBrandName.trim()" @click="addBrand">Add</v-btn></v-col>
            </v-row>
            <v-alert type="info" variant="text" density="compact" class="mb-4">Tip: Paste any Simple Icons slug like <code>fairphone</code></v-alert>
            <v-row dense>
              <v-col v-for="b in catalogBrands" :key="b.id" cols="12" sm="4">
                <v-card variant="outlined" class="pa-2 d-flex align-center justify-space-between">
                  <div class="d-flex align-center gap-2 text-truncate">
                    <span class="text-caption">{{ b.icon_url || b.name[0] }}</span>
                    <span class="text-subtitle-2 text-truncate">{{ b.name }}</span>
                  </div>
                  <v-btn icon="mdi-close" variant="text" color="error" size="x-small" @click="deleteBrand(b.id)" />
                </v-card>
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <v-tabs-window-item value="Categories">
             <v-row dense class="align-center mb-4">
               <v-col cols="8"><v-text-field v-model="newCatName" label="Category name" variant="outlined" density="compact" hide-details @keyup.enter="addCategory" /></v-col>
               <v-col cols="4"><v-btn block color="primary" :disabled="!newCatName.trim()" @click="addCategory">Add</v-btn></v-col>
             </v-row>
             <v-row dense>
              <v-col v-for="c in catalogCategories" :key="c.id" cols="12" sm="4">
                <v-card variant="outlined" class="pa-2 d-flex align-center justify-space-between">
                  <div class="d-flex align-center gap-2 text-truncate">
                    <span class="text-caption">{{ c.emoji || '📦' }}</span>
                    <span class="text-subtitle-2 text-truncate">{{ c.name }}</span>
                  </div>
                  <v-btn icon="mdi-close" variant="text" color="error" size="x-small" @click="deleteCategory(c.id)" />
                </v-card>
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <v-tabs-window-item value="Models">
             <v-row dense class="align-center mb-4">
               <v-col cols="12" sm="4"><v-select v-model="newModelBrand" :items="allBrandsForMgr" label="Brand" variant="outlined" density="compact" hide-details /></v-col>
               <v-col cols="12" sm="4"><v-select v-model="newModelCategory" :items="allCategoriesForMgr" label="Category" variant="outlined" density="compact" hide-details /></v-col>
               <v-col cols="12" sm="4"><v-text-field v-model="newModelName" label="Model name" variant="outlined" density="compact" hide-details @keyup.enter="addModel" /></v-col>
               <v-col cols="12" class="mt-2"><v-btn block color="primary" :disabled="!newModelName.trim() || !newModelBrand || !newModelCategory" @click="addModel">Add Model</v-btn></v-col>
             </v-row>
             <v-list density="compact" class="border rounded-lg" v-if="catalogModels.length > 0">
               <v-list-item v-for="m in catalogModels" :key="m.id" class="border-b" lines="two">
                 <v-list-item-title class="font-weight-bold">{{ m.name }}</v-list-item-title>
                 <v-list-item-subtitle>{{ m.brand }} / {{ m.category }}</v-list-item-subtitle>
                 <template #append>
                   <v-btn icon="mdi-close" variant="text" color="error" size="small" @click="deleteModel(m.id)" />
                 </template>
               </v-list-item>
             </v-list>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
      
      <v-divider />
      <v-card-actions class="pa-4 bg-muted/10">
        <v-spacer />
        <v-btn variant="flat" color="secondary" @click="showDeviceMgr = false; fetchBrands()">Done</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
  const fromDevicesTable = brands.value
  const fromCatalog = catalogBrandNames.value
  const combined = [...new Set([...fromDevicesTable, ...fromCatalog].map(b => b))]
  const dbSet = new Set(combined.map(b => b.toLowerCase()))
  const extra = KNOWN_BRANDS.filter(b => !dbSet.has(b.toLowerCase()))
  return [...combined, ...extra].sort((a, b) => a.localeCompare(b))
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

