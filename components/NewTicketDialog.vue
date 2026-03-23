<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="w-full max-w-[96vw] sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
      <!-- M3 Dialog Header -->
      <div class="flex items-center gap-4 px-7 pt-7 pb-5 border-b border-border/50">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
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
          <label class="hui-dialog-label">Select Brand</label>
          <div v-if="loadingBrands" class="flex items-center justify-center py-10">
            <div class="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="brand in allBrands" :key="brand"
              class="hui-step-chip group"
              :class="selectedBrand === brand ? 'm3-step-chip--active' : ''"
              @click="selectBrand(brand)"
            >
              <div class="flex items-center gap-2.5">
                <img :src="brandLogoUrl(brand)" :alt="brand" class="brand-logo w-6 h-6 flex-shrink-0 object-contain" />
                <span class="text-sm font-bold">{{ brand }}</span>
              </div>
            </button>
            <!-- Other brand button -->
            <button
              class="hui-step-chip group"
              :class="isOtherBrand ? 'm3-step-chip--active' : ''"
              @click="selectOtherBrand"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 flex-shrink-0 flex items-center justify-center opacity-40" v-html="otherBrandIcon"></span>
                <span class="text-sm font-bold">Other</span>
              </div>
            </button>
          </div>
          <!-- Custom brand input (shown when Other is selected) -->
          <div v-if="isOtherBrand" class="space-y-3 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
            <label class="hui-dialog-label">Enter Brand Name</label>
            <input v-model="customBrand" placeholder="e.g. Motorola, OnePlus, Lenovo…" class="hui-dialog-input" @keyup.enter="confirmOtherBrand" />
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
            <button class="hui-back-btn" @click="goBackFromStep2">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="hui-dialog-label mb-0">{{ selectedBrand }} — Category</label>
          </div>
          <!-- Custom brand: show manual category + model entry -->
          <div v-if="isOtherBrand" class="space-y-4">
            <div class="rounded-xl p-4 flex items-center gap-3" style="background: #6366f110; outline: 1.5px solid #6366f128; outline-offset: 0">
              <span class="text-2xl">✏️</span>
              <div class="text-sm">
                <p class="font-black">Custom Device Entry</p>
                <p class="text-muted-foreground font-medium text-xs mt-0.5">Fill in the details for {{ selectedBrand }}</p>
              </div>
            </div>
            <div class="space-y-2">
              <label class="hui-dialog-label">Device Category</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="cat in commonCategories" :key="cat.label"
                  class="hui-step-chip"
                  :class="selectedCategory === cat.label ? 'm3-step-chip--active' : ''"
                  @click="selectedCategory = cat.label; customCategory = ''"
                >
                  <div class="flex items-center gap-2">
                    <span class="category-icon w-5 h-5 flex-shrink-0" v-html="cat.icon"></span>
                    <span class="text-sm font-bold">{{ cat.label }}</span>
                  </div>
                </button>
              </div>
              <input v-model="customCategory" placeholder="Or type custom category…" class="hui-dialog-input mt-2"
                @focus="selectedCategory = ''"
                @input="selectedCategory = customCategory" />
            </div>
            <div class="space-y-2">
              <label class="hui-dialog-label">Model / Device Name</label>
              <input v-model="customModel" placeholder="e.g. Edge 40 Pro, Nord CE3, Tab P12…" class="hui-dialog-input" />
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
                class="hui-step-chip"
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
            <button class="hui-back-btn" @click="currentStep = 2">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="hui-dialog-label mb-0">Select Model</label>
          </div>
          <div class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input v-model="modelSearch" placeholder="Search models…" class="hui-dialog-input pl-11" />
          </div>
          <div v-if="loadingModels" class="flex items-center justify-center py-10">
            <div class="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
            <button
              v-for="model in filteredModels" :key="model"
              class="hui-step-chip"
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
            <label class="hui-dialog-label">Or enter custom model</label>
            <input v-model="customModel" placeholder="Enter model name…" class="hui-dialog-input" @keyup.enter="handleCustomModelEnter" />
          </div>
        </div>

        <!-- ── Step 4: Issue ─────────────────────────────── -->
        <div v-if="currentStep === 4" class="space-y-4">
          <div class="flex items-center gap-2">
            <button class="hui-back-btn" @click="currentStep = 3">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="hui-dialog-label mb-0">Select Issue</label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="issue in issues" :key="issue.name"
              class="hui-step-chip text-left"
              :class="selectedIssue === issue.name ? 'm3-step-chip--active' : ''"
              @click="selectIssue(issue.name)"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
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
            <label class="hui-dialog-label">Or describe custom issue</label>
            <textarea v-model="customIssue" rows="3" placeholder="Describe the problem…" class="hui-dialog-textarea" />
          </div>
        </div>

        <!-- ── Step 5: Details ───────────────────────────── -->
        <div v-if="currentStep === 5" class="space-y-5">
          <div class="flex items-center gap-2">
            <button class="hui-back-btn" @click="currentStep = 4">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <label class="hui-dialog-label mb-0">Ticket Details</label>
          </div>

          <!-- Summary pill -->
          <div class="rounded-xl p-4 flex items-center gap-3" style="background: #6366f110; outline: 1.5px solid #6366f128; outline-offset: 0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: #6366f120">
              <Wrench class="w-5 h-5" style="color: #6366f1" />
            </div>
            <div class="text-sm">
              <p class="font-black">{{ selectedBrand }} {{ selectedModel || customModel }}</p>
              <p class="text-muted-foreground font-medium text-xs mt-0.5">{{ selectedIssue || customIssue }}</p>
            </div>
          </div>

          <!-- Customer -->
          <div class="space-y-2">
            <label class="hui-dialog-label">Customer *</label>
            <CustomerSelect v-model="ticketData.customerId" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="hui-dialog-label">Serial Number</label>
              <input v-model="ticketData.serialNumber" placeholder="Optional" class="hui-dialog-input" />
            </div>
            <div class="space-y-2">
              <label class="hui-dialog-label">Priority</label>
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
            <label class="hui-dialog-label">Device Condition</label>
            <textarea v-model="ticketData.deviceDescription" rows="2" placeholder="Color, visible damage, accessories included…" class="hui-dialog-textarea" />
          </div>

          <!-- Photo Attachments -->
          <div class="space-y-3">
            <label class="hui-dialog-label">Photos <span class="normal-case font-medium opacity-60">(optional — up to 6)</span></label>

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
                <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #6366f115">
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
                  <img :src="photo.preview" :alt="photo.file.name" class="w-full h-20 object-cover rounded-xl" />
                  <div class="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
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
                  class="h-20 rounded-xl border-2 border-dashed flex items-center justify-center transition-all hover:scale-[1.02]"
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
        <button
          class="h-12 px-4 rounded-full text-xs font-bold transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-1.5"
          style="outline: 2px solid hsl(var(--border)); outline-offset: 0; color: hsl(var(--muted-foreground))"
          title="Manage brands, categories & models"
          @click="showDeviceMgr = true"
        >
          <Settings class="w-3.5 h-3.5" /> Devices
        </button>
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

  <!-- ══ Device Catalog Manager ══════════════════════════════════════ -->
  <Dialog v-model:open="showDeviceMgr">
    <DialogContent class="w-full max-w-[96vw] sm:max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border/50 flex-shrink-0">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
          <Cpu class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1">
          <h2 class="text-base font-black">Device Catalog</h2>
          <p class="text-xs text-muted-foreground font-medium">Manage brands, categories, models and icons</p>
        </div>
        <!-- Tab pills -->
        <div class="flex gap-1 p-1 rounded-full" style="background: hsl(var(--muted)/0.5)">
          <button v-for="t in ['Brands','Categories','Models']" :key="t"
            class="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            :style="mgrTab === t ? 'background: white; color: hsl(var(--foreground)); box-shadow: 0 2px 6px rgba(0,0,0,0.08)' : 'color: hsl(var(--muted-foreground))'"
            @click="mgrTab = t">{{ t }}</button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-4">

        <!-- ── BRANDS tab ── -->
        <div v-if="mgrTab === 'Brands'" class="space-y-4">
          <div class="flex gap-2">
            <input v-model="newBrandName" placeholder="Brand name (e.g. Fairphone)" class="mgr-input flex-1" @keyup.enter="addBrand" />
            <input v-model="newBrandIcon" placeholder="Icon URL or emoji 📱" class="mgr-input w-40" title="Paste an image URL, or type an emoji" />
            <button class="mgr-add-btn" :disabled="!newBrandName.trim()" @click="addBrand">
              <Plus class="w-4 h-4" /> Add
            </button>
          </div>
          <p class="text-xs text-muted-foreground">Tip: paste any image URL or a Simple Icons slug like <code class="text-xs bg-muted px-1 py-0.5 rounded">fairphone</code> for the icon, or just leave it blank.</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="b in catalogBrands" :key="b.id"
              class="flex items-center gap-2.5 p-3 rounded-xl group"
              style="background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.5); outline-offset: 0">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-muted/60">
                <img v-if="b.icon_url && b.icon_url.startsWith('http')" :src="b.icon_url" class="w-5 h-5 object-contain" />
                <span v-else-if="b.icon_url" class="text-base leading-none">{{ b.icon_url }}</span>
                <span v-else class="text-xs text-muted-foreground font-bold">{{ b.name[0] }}</span>
              </div>
              <span class="text-sm font-bold flex-1 truncate">{{ b.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:bg-destructive/20 hover:text-destructive" @click="deleteBrand(b.id)">
                <X class="w-3 h-3" />
              </button>
            </div>
            <div v-if="catalogBrands.length === 0" class="col-span-3 text-center py-8 text-sm text-muted-foreground">
              No custom brands yet. Add one above.
            </div>
          </div>
        </div>

        <!-- ── CATEGORIES tab ── -->
        <div v-if="mgrTab === 'Categories'" class="space-y-4">
          <div class="flex gap-2">
            <input v-model="newCatName" placeholder="Category name (e.g. E-Reader)" class="mgr-input flex-1" @keyup.enter="addCategory" />
            <div class="flex items-center gap-1 mgr-input w-20 px-2 cursor-pointer" @click="showEmojiPicker = !showEmojiPicker">
              <span class="text-lg">{{ newCatEmoji || '📦' }}</span>
              <span class="text-xs text-muted-foreground">Icon</span>
            </div>
            <button class="mgr-add-btn" :disabled="!newCatName.trim()" @click="addCategory">
              <Plus class="w-4 h-4" /> Add
            </button>
          </div>
          <div v-if="showEmojiPicker" class="flex flex-wrap gap-1 p-3 rounded-2xl border border-divider bg-muted/30">
            <button v-for="e in categoryEmojis" :key="e" class="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center text-xl transition-all hover:scale-110"
              :class="newCatEmoji === e ? 'bg-purple-100 outline outline-2 outline-purple-400' : ''"
              @click="newCatEmoji = e; showEmojiPicker = false">{{ e }}</button>
          </div>
          <div class="space-y-2">
            <div v-for="c in catalogCategories" :key="c.id"
              class="flex items-center gap-3 p-3 rounded-xl group"
              style="background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.5); outline-offset: 0">
              <span class="text-xl w-7 text-center flex-shrink-0">{{ c.emoji || '📦' }}</span>
              <span class="text-sm font-bold flex-1">{{ c.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:bg-destructive/20 hover:text-destructive" @click="deleteCategory(c.id)">
                <X class="w-3 h-3" />
              </button>
            </div>
            <div v-if="catalogCategories.length === 0" class="text-center py-8 text-sm text-muted-foreground">
              No custom categories yet. Add one above.
            </div>
          </div>
        </div>

        <!-- ── MODELS tab ── -->
        <div v-if="mgrTab === 'Models'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select v-model="newModelBrand" class="mgr-input">
              <option value="">Select brand…</option>
              <option v-for="b in allBrandsForMgr" :key="b" :value="b">{{ b }}</option>
            </select>
            <select v-model="newModelCategory" class="mgr-input">
              <option value="">Select category…</option>
              <option v-for="c in allCategoriesForMgr" :key="c" :value="c">{{ c }}</option>
            </select>
            <input v-model="newModelName" placeholder="Model name" class="mgr-input" @keyup.enter="addModel" />
          </div>
          <button class="mgr-add-btn w-full" :disabled="!newModelName.trim() || !newModelBrand || !newModelCategory" @click="addModel">
            <Plus class="w-4 h-4" /> Add Model
          </button>
          <div class="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            <div v-for="m in catalogModels" :key="m.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl group text-sm"
              style="background: hsl(var(--muted)/0.4); outline: 1.5px solid hsl(var(--border)/0.5); outline-offset: 0">
              <span class="text-muted-foreground text-xs w-20 flex-shrink-0 truncate">{{ m.brand }}</span>
              <span class="text-muted-foreground text-xs w-20 flex-shrink-0 truncate">{{ m.category }}</span>
              <span class="font-bold flex-1 truncate">{{ m.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:bg-destructive/20 hover:text-destructive flex-shrink-0" @click="deleteModel(m.id)">
                <X class="w-3 h-3" />
              </button>
            </div>
            <div v-if="catalogModels.length === 0" class="text-center py-8 text-sm text-muted-foreground">
              No custom models yet. Add one above.
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 pb-6 pt-3 border-t border-border/50 flex-shrink-0">
        <button class="w-full h-11 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style="background: hsl(var(--muted)); color: hsl(var(--foreground))"
          @click="showDeviceMgr = false; fetchBrands()">Done</button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Search, Zap, Droplets, Volume2, Wifi, Battery, Eye, Wrench, Check, Camera, X, Plus, Settings, Cpu } from 'lucide-vue-next'
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
.hui-label {
  display: block;
  font-size: 10px;
  font-weight: 800;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.5rem;
}

.hui-input {
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
.hui-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px #6366f118;
  background: hsl(var(--background));
}

.hui-input {
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
.hui-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px #6366f118;
  background: hsl(var(--background));
}

.hui-step-chip {
  padding: 14px 16px;
  border-radius: 20px;
  background: hsl(var(--muted)/0.4);
  outline: 2px solid hsl(var(--border)/0.6);
  outline-offset: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}
.hui-step-chip:hover {
  transform: scale(1.02) translateY(-2px);
  background: hsl(var(--muted)/0.7);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.hui-step-chip:active { transform: scale(0.97); }

.hui-step-chip--active {
  background: #6366f114 !important;
  outline: 2px solid #6366f150 !important;
  color: #6366f1;
}
.hui-step-chip--active:hover {
  background: #6366f120 !important;
}

.hui-back-btn {
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
.hui-back-btn:hover { transform: scale(1.1); background: hsl(var(--muted)); }
.hui-back-btn:active { transform: scale(0.9); }

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

