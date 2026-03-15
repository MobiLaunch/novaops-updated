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
          <p class="text-xs text-muted-foreground font-medium mt-0.5">Step {{ displayStep }} of {{ totalSteps }}</p>
        </div>
        <!-- Progress pills -->
        <div class="flex gap-1.5 ml-auto mr-10">
          <div v-for="i in totalSteps" :key="i"
            class="h-1.5 rounded-full transition-all duration-500"
            :class="i <= displayStep ? 'w-6' : 'w-3'"
            :style="i <= displayStep ? 'background: #6366f1' : 'background: hsl(var(--border))'"
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
              v-for="brand in allBrands" :key="brand"
              class="m3-step-chip group"
              :class="selectedBrand === brand ? 'm3-step-chip--active' : ''"
              @click="selectBrand(brand)"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 flex-shrink-0 flex items-center justify-center" v-html="brandLogo(brand)" />
                <span class="text-sm font-bold">{{ brand }}</span>
              </div>
            </button>
            <!-- Other brand button -->
            <button
              class="m3-step-chip group"
              :class="isOtherBrand ? 'm3-step-chip--active' : ''"
              @click="selectOtherBrand"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 flex-shrink-0 flex items-center justify-center opacity-50" v-html="otherBrandIcon" />
                <span class="text-sm font-bold">Other</span>
              </div>
            </button>
          </div>
          <!-- Custom brand input (shown when Other is selected) -->
          <div v-if="isOtherBrand" class="space-y-3 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
            <label class="m3-dialog-label">Enter Brand Name</label>
            <input v-model="customBrand" placeholder="e.g. Motorola, OnePlus, Lenovo…" class="m3-dialog-input" @keyup.enter="confirmOtherBrand" />
            <button
              class="w-full h-11 rounded-full text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              :style="customBrand ? 'background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 16px #6366f140' : 'background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); cursor: not-allowed'"
              :disabled="!customBrand"
              @click="confirmOtherBrand"
            >
              Continue with "{{ customBrand || '…' }}" <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- ── Step 2: Category ───────────────────────────── -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="flex items-center gap-2">
            <button class="m3-back-btn" @click="goBackFromStep2">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="m3-dialog-label mb-0">{{ selectedBrand }} — Category</label>
          </div>
          <!-- Custom brand: show manual category + model entry -->
          <div v-if="isOtherBrand" class="space-y-4">
            <div class="rounded-[20px] p-4 flex items-center gap-3" style="background: #6366f110; outline: 1.5px solid #6366f128; outline-offset: 0">
              <span class="text-2xl">✏️</span>
              <div class="text-sm">
                <p class="font-black">Custom Device Entry</p>
                <p class="text-muted-foreground font-medium text-xs mt-0.5">Fill in the details for {{ selectedBrand }}</p>
              </div>
            </div>
            <div class="space-y-2">
              <label class="m3-dialog-label">Device Category</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="cat in commonCategories" :key="cat.label"
                  class="m3-step-chip"
                  :class="selectedCategory === cat.label ? 'm3-step-chip--active' : ''"
                  @click="selectedCategory = cat.label; customCategory = ''"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 flex-shrink-0" v-html="cat.icon" />
                    <span class="text-sm font-bold">{{ cat.label }}</span>
                  </div>
                </button>
              </div>
              <input v-model="customCategory" placeholder="Or type custom category…" class="m3-dialog-input mt-2"
                @focus="selectedCategory = ''"
                @input="selectedCategory = customCategory" />
            </div>
            <div class="space-y-2">
              <label class="m3-dialog-label">Model / Device Name</label>
              <input v-model="customModel" placeholder="e.g. Edge 40 Pro, Nord CE3, Tab P12…" class="m3-dialog-input" />
            </div>
          </div>
          <!-- Normal brand: category chips from DB -->
          <template v-else>
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
          </template>
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

          <!-- Photo Attachments -->
          <div class="space-y-3">
            <label class="m3-dialog-label">Photos <span class="normal-case font-medium opacity-60">(optional — up to 6)</span></label>

            <!-- Drop zone -->
            <div
              class="photo-dropzone"
              :class="{ 'photo-dropzone--drag': isDragging, 'photo-dropzone--has-files': photoAttachments.length > 0 }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handlePhotoDrop"
              @click="triggerPhotoInput"
            >
              <input
                ref="photoInputRef"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="handlePhotoSelect"
              />
              <div v-if="photoAttachments.length === 0" class="flex flex-col items-center gap-2 py-4">
                <div class="w-10 h-10 rounded-[18px] flex items-center justify-center" style="background: #6366f115">
                  <Camera class="w-5 h-5" style="color: #6366f1" />
                </div>
                <p class="text-sm font-bold text-muted-foreground">Drop photos here or <span style="color: #6366f1">click to browse</span></p>
                <p class="text-xs text-muted-foreground/60 font-medium">JPG, PNG, HEIC up to 10 MB each</p>
              </div>
              <div v-else class="grid grid-cols-3 gap-2 p-1" @click.stop>
                <div
                  v-for="(photo, idx) in photoAttachments" :key="idx"
                  class="photo-thumb group relative"
                >
                  <img :src="photo.preview" :alt="photo.file.name" class="w-full h-20 object-cover rounded-[14px]" />
                  <div class="absolute inset-0 rounded-[14px] bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                  <button
                    class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80"
                    @click.stop="removePhoto(idx)"
                  >
                    <X class="w-3 h-3 text-white" />
                  </button>
                  <div class="absolute bottom-1 left-1 right-1 text-white text-[9px] font-bold truncate opacity-0 group-hover:opacity-100 transition-opacity px-1">
                    {{ photo.file.name }}
                  </div>
                </div>
                <!-- Add more button (if under limit) -->
                <button
                  v-if="photoAttachments.length < 6"
                  class="h-20 rounded-[14px] border-2 border-dashed flex items-center justify-center transition-all hover:scale-[1.02]"
                  style="border-color: #6366f140; background: #6366f108"
                  @click.stop="triggerPhotoInput"
                >
                  <Plus class="w-5 h-5" style="color: #6366f1" />
                </button>
              </div>
            </div>
            <p v-if="photoAttachments.length > 0" class="text-xs text-muted-foreground font-medium text-right">
              {{ photoAttachments.length }}/6 photo{{ photoAttachments.length !== 1 ? 's' : '' }} added
            </p>
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
import { ChevronLeft, ChevronRight, Search, Zap, Droplets, Volume2, Wifi, Battery, Eye, Wrench, Check, Camera, X, Plus } from 'lucide-vue-next'
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

// ── Brand SVG logos (inline, theme-aware) ────────────────────────
const BRAND_LOGOS: Record<string, string> = {
  Apple: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`,
  Samsung: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.732 4.575A11.827 11.827 0 0 0 12.002.001a11.828 11.828 0 0 0-7.73 2.874C1.599 5.37.002 8.51.002 12.001c0 3.491 1.597 6.63 4.27 8.925A11.828 11.828 0 0 0 12.002 24a11.827 11.827 0 0 0 7.73-2.874C22.403 18.632 24 15.492 24 12.001c0-3.491-1.597-6.631-4.268-8.426zM12 21.265c-5.113 0-9.265-4.151-9.265-9.264S6.887 2.737 12 2.737s9.265 4.151 9.265 9.264S17.113 21.265 12 21.265zm4.949-10.691h-1.73c-.174-.738-.738-1.302-1.628-1.302-1.195 0-1.888.933-1.888 2.728s.693 2.728 1.888 2.728c.933 0 1.563-.52 1.714-1.389h-1.887v-1.368h3.531v.868c0 1.93-1.324 3.27-3.358 3.27-2.208 0-3.618-1.519-3.618-4.109s1.41-4.109 3.618-4.109c1.93 0 3.183 1.151 3.358 2.683z"/></svg>`,
  Google: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>`,
  Sony: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.441 7.056l-1.502 1.502a4.408 4.408 0 0 0-3.939-2.43c-2.437 0-4.412 1.977-4.412 4.412 0 2.435 1.975 4.412 4.412 4.412a4.41 4.41 0 0 0 4.137-2.881H12.77v-2.01h4.729v.022a6.56 6.56 0 0 1-5.77 9.443A6.56 6.56 0 0 1 5.17 12.54a6.56 6.56 0 0 1 6.559-6.559 6.556 6.556 0 0 1 5.712 3.075z"/></svg>`,
  LG: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.234 17.01H6.75V6.99h2.016v8.004h3.468v2.016zm5.532 0h-4.5v-2.016h1.236V8.988H13.5V6.99h4.266v2.016H16.77v6.006h.996v2.016-.018z"/></svg>`,
  Microsoft: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/></svg>`,
  Dell: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5c4.136 0 7.5 3.364 7.5 7.5s-3.364 7.5-7.5 7.5S4.5 16.136 4.5 12 7.864 4.5 12 4.5zm0 2.25c-2.9 0-5.25 2.35-5.25 5.25S9.1 17.25 12 17.25 17.25 14.9 17.25 12 14.9 6.75 12 6.75z"/></svg>`,
  HP: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM8.308 16.5H6.75l1.5-9h2.572c1.69 0 2.617.75 2.617 2.108 0 1.876-1.432 2.95-3.5 2.95h-.93l-.7 3.942zm.994-5.25h.628c.938 0 1.566-.45 1.566-1.258 0-.557-.376-.882-1.066-.882h-.566l-.562 2.14zm6.948 5.25h-1.558l1.5-9h2.572c1.69 0 2.617.75 2.617 2.108 0 1.876-1.432 2.95-3.5 2.95h-.93l-.7 3.942zm.994-5.25h.628c.938 0 1.566-.45 1.566-1.258 0-.557-.376-.882-1.066-.882h-.566l-.562 2.14z"/></svg>`,
  Lenovo: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M0 7.8h2.4V16h4.8v2.4H0zm7.2 0h2.388l2.4 5.988V7.8H14.4v10.8h-2.388L9.6 12.612V18.6H7.2zm9.6 0H24v2.4h-4.8v1.8H24v2.4h-4.8v1.8H24v2.4h-7.2z"/></svg>`,
  ASUS: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.816 0H12.047L0 24h2.113l3.17-6.545h8.535L16.6 24h5.216L24 19.686V0zm-1.137 18.566L19.8 21.6h-2.52l-2.56-5.285H7.215l2.56-5.285h7.488l1.977-4.08h2.44z"/></svg>`,
  Acer: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.95 16.243L12 11.29l-4.95 4.953L5.636 14.83 12 8.464l6.364 6.365z"/></svg>`,
  Huawei: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.002 0s-1.314 2.34-.648 4.932c.508 1.983 2.063 3.255 2.063 3.255s1.686-1.467 1.92-3.483C15.607 2.388 12.002 0 12.002 0zM4.627 4.044s-.522 2.622.879 4.896c1.063 1.713 2.838 2.538 2.838 2.538s1.29-1.803.918-3.795c-.453-2.38-4.635-3.639-4.635-3.639zm14.745 0s-4.182 1.26-4.635 3.639c-.372 1.992.918 3.795.918 3.795s1.775-.825 2.838-2.538c1.401-2.274.879-4.896.879-4.896zM2.016 10.395s.12 2.673 2.01 4.494c1.413 1.368 3.348 1.686 3.348 1.686s.648-2.07-.369-3.816c-1.245-2.148-4.989-2.364-4.989-2.364zm19.968 0s-3.744.216-4.989 2.364c-1.017 1.746-.369 3.816-.369 3.816s1.935-.318 3.348-1.686c1.89-1.821 2.01-4.494 2.01-4.494zM6.024 16.47s1.14 2.43 3.375 3.516c1.686.819 3.603.576 3.603.576s-.096-2.16-1.584-3.468c-1.848-1.614-5.394-.624-5.394-.624zm11.952 0s-3.546-.99-5.394.624c-1.488 1.308-1.584 3.468-1.584 3.468s1.917.243 3.603-.576c2.235-1.086 3.375-3.516 3.375-3.516zM12 17.568s-2.274 1.566-2.862 3.996C8.694 23.538 10.002 24 10.002 24h3.996s1.308-.462.864-2.436C14.274 19.134 12 17.568 12 17.568z"/></svg>`,
  OnePlus: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.259 0H6.741C3.019 0 0 3.019 0 6.741v10.518C0 20.981 3.019 24 6.741 24h10.518C20.981 24 24 20.981 24 17.259V6.741C24 3.019 20.981 0 17.259 0zm-2.591 17.25h-2.136v-4.5H9.99V10.8h2.541V7.5h2.136v3.3h2.333v1.95h-2.333v4.5z"/></svg>`,
  Motorola: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6S2.4 17.302 2.4 12 6.698 2.4 12 2.4zm0 2.1a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm-3.6 3.6h2.1l1.5 3.6 1.5-3.6h2.1v7.8h-1.8V12l-1.8 3.3-1.8-3.3v3.9H8.4z"/></svg>`,
  Nokia: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM6.5 7h2.3l4.5 6.3V7H15.5v10h-2.3L8.7 10.7V17H6.5z"/></svg>`,
  Xiaomi: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M15.03 4.5H8.97C6.51 4.5 4.5 6.51 4.5 8.97v6.06c0 2.46 2.01 4.47 4.47 4.47h6.06c2.46 0 4.47-2.01 4.47-4.47V8.97c0-2.46-2.01-4.47-4.47-4.47zm-6.03 9.75V9.75h1.5v1.5H12V9.75h1.5v4.5H12v-1.5h-1.5v1.5H8.97z"/></svg>`,
  Oppo: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.4C6.698 2.4 2.4 6.698 2.4 12S6.698 21.6 12 21.6 21.6 17.302 21.6 12 17.302 2.4 12 2.4zM12 0C18.627 0 24 5.373 24 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm0 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6zm0 2.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z"/></svg>`,
  Vivo: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2.4 7.2h2.1l2.4 6.6 2.4-6.6h2.1L15.3 16.8h-2.4z"/></svg>`,
  Realme: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.8 16.8H7.2V7.2h2.4v7.2h7.2z"/></svg>`,
  Nothing: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.8a7.2 7.2 0 1 1 0 14.4A7.2 7.2 0 0 1 12 4.8zm-3 5.4v1.8h6v-1.8H9zm0 2.4v1.8h6v-1.8H9z"/></svg>`,
}

const otherBrandIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`

const brandLogo = (brand: string): string =>
  BRAND_LOGOS[brand] ?? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1"/></svg>`

// Merge DB brands with known brands (DB wins on duplicates)
const allBrands = computed(() => {
  const dbSet = new Set(brands.value.map(b => b.toLowerCase()))
  const extra = KNOWN_BRANDS.filter(b => !dbSet.has(b.toLowerCase()))
  return [...brands.value, ...extra].sort((a, b) => a.localeCompare(b))
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
  { name: 'Cracked Screen',    icon: Eye,      description: 'Display is cracked or damaged' },
  { name: 'Battery Issues',    icon: Battery,  description: "Won't charge or drains quickly" },
  { name: 'Water Damage',      icon: Droplets, description: 'Exposed to liquid' },
  { name: "Won't Turn On",     icon: Zap,      description: 'Device is unresponsive' },
  { name: 'Audio Problems',    icon: Volume2,  description: 'Speaker or microphone issues' },
  { name: 'WiFi/Connectivity', icon: Wifi,     description: 'Network connection problems' },
  { name: 'Physical Damage',   icon: Wrench,   description: 'Dents, bends, or broken parts' },
  { name: 'Other',             icon: Wrench,   description: 'Other issues' }
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
</style>
