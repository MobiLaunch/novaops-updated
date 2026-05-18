<template>
  <div class="h-100 d-flex flex-column gap-4">
    <!-- Header/Navigation -->
    <div class="d-flex align-center gap-3 mb-2">
      <v-btn icon="mdi-arrow-left" variant="text" @click="router.back()" />
      <div>
        <v-breadcrumbs :items="breadcrumbs" class="pa-0 text-caption font-weight-bold" color="primary">
          <template #divider>
            <v-icon icon="mdi-chevron-right" size="14"></v-icon>
          </template>
        </v-breadcrumbs>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex flex-column align-center justify-center flex-1-1-100">
      <v-progress-circular indeterminate color="primary" size="64" width="6" class="mb-4" />
      <span class="text-h6 text-medium-emphasis">Loading guide...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="d-flex flex-column align-center justify-center flex-1-1-100">
      <v-icon color="error" size="64" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mb-2">Error loading guide</h2>
      <p class="text-body-1 text-medium-emphasis mb-6">{{ error }}</p>
      <v-btn color="primary" variant="flat" class="text-none px-6" @click="fetchGuide">Try Again</v-btn>
    </div>

    <!-- Guide Content -->
    <template v-else-if="guide">
      <!-- Guide Intro -->
      <v-card class="rounded-xl overflow-hidden border mb-6" elevation="0">
        <v-row no-gutters>
          <v-col cols="12" md="5" lg="4" class="bg-surface-variant d-flex position-relative">
            <v-img
              v-if="guide.image"
              :src="guide.image.standard || guide.image.medium"
              cover
              class="w-100 h-100 min-h-[250px]"
              style="min-height: 250px;"
            ></v-img>
            <div class="position-absolute bottom-0 left-0 pa-4" style="z-index: 1;">
              <v-chip size="small" :color="difficultyColor(guide.difficulty)" variant="flat" class="font-weight-bold">
                {{ guide.difficulty || 'Unknown Difficulty' }}
              </v-chip>
            </div>
            <div class="gradient-overlay position-absolute bottom-0 left-0 right-0 h-50 pointer-events-none"></div>
          </v-col>
          
          <v-col cols="12" md="7" lg="8">
            <div class="pa-6 pa-md-8 d-flex flex-column h-100">
              <div class="d-flex align-center gap-2 mb-2 text-caption text-primary font-weight-bold text-uppercase tracking-widest">
                <span>{{ guide.category }}</span>
                <v-icon size="12">mdi-circle-small</v-icon>
                <span>{{ guide.type }}</span>
              </div>
              
              <h1 class="text-h4 font-weight-black mb-4" style="line-height: 1.2;">{{ guide.title }}</h1>
              
              <div class="d-flex align-center gap-4 mb-6">
                <div v-if="guide.time_required_max" class="d-flex align-center gap-2 text-body-2 font-weight-medium bg-surface-variant px-3 py-1 rounded-pill">
                  <v-icon size="16" color="primary">mdi-clock-outline</v-icon>
                  <span>{{ formatTime(guide.time_required_max) }} estimated</span>
                </div>
                
                <div v-if="guide.steps?.length" class="d-flex align-center gap-2 text-body-2 font-weight-medium bg-surface-variant px-3 py-1 rounded-pill">
                  <v-icon size="16" color="primary">mdi-format-list-numbered</v-icon>
                  <span>{{ guide.steps.length }} steps</span>
                </div>
              </div>
              
              <v-divider class="mb-4" />
              
              <div 
                v-if="guide.introduction_rendered" 
                class="text-body-1 text-medium-emphasis guide-html-content"
                v-html="guide.introduction_rendered"
              ></div>
              <p v-else class="text-body-1 text-medium-emphasis">{{ guide.summary }}</p>
            </div>
          </v-col>
        </v-row>
      </v-card>

      <!-- Steps -->
      <div v-if="guide.steps && guide.steps.length > 0" class="d-flex flex-column gap-6">
        <h2 class="text-h5 font-weight-black px-2 mt-4">Step-by-Step Instructions</h2>
        
        <v-card 
          v-for="(step, index) in guide.steps" 
          :key="step.stepid || index"
          class="rounded-xl border overflow-hidden"
          elevation="1"
          :id="`step-${index + 1}`"
        >
          <div class="d-flex flex-column flex-md-row">
            <!-- Step Images -->
            <div class="step-media bg-surface-variant flex-shrink-0" style="flex-basis: 45%; max-width: 100%;">
              <v-carousel 
                v-if="step.media?.data?.length > 0"
                hide-delimiters
                :show-arrows="step.media.data.length > 1 ? 'hover' : false"
                height="100%"
                class="h-100 min-h-[300px]"
                style="min-height: 300px;"
              >
                <v-carousel-item
                  v-for="(media, mIndex) in step.media.data"
                  :key="media.id || mIndex"
                  :src="media.standard || media.medium"
                  cover
                ></v-carousel-item>
              </v-carousel>
              <div v-else class="h-100 d-flex align-center justify-center min-h-[300px]" style="min-height: 300px;">
                <v-icon size="48" color="medium-emphasis">mdi-image-outline</v-icon>
              </div>
            </div>
            
            <!-- Step Content -->
            <div class="pa-6 pa-md-8 flex-grow-1">
              <div class="d-flex align-center gap-3 mb-4">
                <v-avatar color="primary" size="36" class="font-weight-bold text-white shadow-sm">
                  {{ index + 1 }}
                </v-avatar>
                <h3 class="text-h6 font-weight-bold line-height-tight">{{ step.title || `Step ${index + 1}` }}</h3>
              </div>
              
              <v-divider class="mb-4" />
              
              <div class="d-flex flex-column gap-3">
                <div 
                  v-for="(line, lIndex) in step.lines" 
                  :key="lIndex"
                  class="d-flex gap-3"
                >
                  <div class="pt-1">
                    <v-icon :color="bulletColor(line.bullet)" size="16">{{ bulletIcon(line.bullet) }}</v-icon>
                  </div>
                  <div class="text-body-1 guide-html-content" v-html="line.text_rendered"></div>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </div>
      
      <!-- Done Section -->
      <v-card class="rounded-xl border pa-8 text-center mt-8 bg-primary-lighten-1 text-primary-darken-3" elevation="0">
        <v-icon size="64" class="mb-4 text-primary">mdi-check-circle-outline</v-icon>
        <h2 class="text-h4 font-weight-black mb-2">Repair Complete!</h2>
        <p class="text-body-1 mb-6 max-w-md mx-auto">You've reached the end of this guide. To reassemble your device, follow these instructions in reverse order.</p>
        <v-btn color="primary" variant="flat" size="large" class="rounded-lg text-none px-8 shadow-sm" @click="scrollToTop">
          Back to Top
        </v-btn>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const guideId = route.params.id

const loading = ref(true)
const error = ref('')
const guide = ref<any>(null)

const breadcrumbs = computed(() => {
  const crumbs = [
    { title: 'Library', disabled: false, to: '/library' }
  ]
  if (guide.value) {
    if (guide.value.category) {
      crumbs.push({ title: guide.value.category, disabled: true, to: '' })
    }
    crumbs.push({ title: guide.value.title, disabled: true, to: '' })
  } else {
    crumbs.push({ title: 'Loading...', disabled: true, to: '' })
  }
  return crumbs
})

onMounted(() => {
  if (guideId) {
    fetchGuide()
  } else {
    error.value = 'No guide ID provided.'
    loading.value = false
  }
})

async function fetchGuide() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`https://www.ifixit.com/api/2.0/guides/${guideId}`)
    if (!res.ok) throw new Error(`Failed to load guide (${res.status})`)
    guide.value = await res.json()
  } catch (err: any) {
    console.error('Error fetching guide:', err)
    error.value = err.message || 'An unexpected error occurred while loading the repair guide.'
  } finally {
    loading.value = false
  }
}

function difficultyColor(diff: string) {
  if (!diff) return 'grey'
  const d = diff.toLowerCase()
  if (d.includes('easy')) return 'success'
  if (d.includes('moderate')) return 'warning'
  if (d.includes('difficult')) return 'error'
  return 'grey'
}

function formatTime(seconds: number) {
  if (!seconds || seconds <= 0) return ''
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  if (remainingMins === 0) return `${hours}h`
  return `${hours}h ${remainingMins}m`
}

function bulletIcon(bullet: string) {
  switch (bullet) {
    case 'red': return 'mdi-circle'
    case 'orange': return 'mdi-circle'
    case 'yellow': return 'mdi-circle'
    case 'green': return 'mdi-circle'
    case 'blue': return 'mdi-circle'
    case 'violet': return 'mdi-circle'
    case 'black': return 'mdi-circle'
    case 'icon_caution': return 'mdi-alert'
    case 'icon_note': return 'mdi-information'
    case 'icon_reminder': return 'mdi-lightbulb-on'
    default: return 'mdi-circle-small'
  }
}

function bulletColor(bullet: string) {
  switch (bullet) {
    case 'red': return '#ef4444'
    case 'orange': return '#f97316'
    case 'yellow': return '#eab308'
    case 'green': return '#22c55e'
    case 'blue': return '#3b82f6'
    case 'violet': return '#8b5cf6'
    case 'black': return '#1e293b' // Dark slate instead of pure black for better theme compatibility
    case 'icon_caution': return '#ef4444'
    case 'icon_note': return '#3b82f6'
    case 'icon_reminder': return '#eab308'
    default: return 'medium-emphasis'
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style>
/* Unscoped styles for injected HTML content from iFixit */
.guide-html-content a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-weight: 500;
}
.guide-html-content a:hover {
  text-decoration: underline;
}
.guide-html-content p {
  margin-bottom: 0; /* Let flex gap handle spacing */
}
.guide-html-content strong {
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}
</style>

<style scoped>
.tracking-widest {
  letter-spacing: 0.1em;
}
.line-height-tight {
  line-height: 1.2;
}
.gradient-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
}
.pointer-events-none {
  pointer-events: none;
}
.max-w-md {
  max-width: 600px;
}
</style>
