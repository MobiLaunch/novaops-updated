<template>
  <div class="h-100 d-flex flex-column gap-6">
    <!-- Header -->
    <div class="d-flex flex-column gap-2 mb-2">
      <div class="d-flex align-center gap-3">
        <v-avatar color="primary" variant="tonal" rounded="lg">
          <v-icon color="primary">mdi-bookshelf</v-icon>
        </v-avatar>
        <h1 class="text-h4 font-weight-black text-primary">Repair Library</h1>
      </div>
      <p class="text-body-1 text-medium-emphasis ml-14">Search for devices to find step-by-step repair guides.</p>
    </div>

    <!-- Search -->
    <v-card class="rounded-xl pa-3 elevation-2 border mb-4">
      <div class="d-flex align-center gap-3">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search for a device (e.g., iPhone 13, Galaxy S21)..."
          variant="solo"
          flat
          hide-details
          clearable
          density="comfortable"
          class="flex-grow-1"
          @keyup.enter="performSearch"
        />
        <v-btn
          color="primary"
          variant="flat"
          class="rounded-lg text-none px-6 flex-shrink-0"
          size="large"
          height="48"
          :loading="loading"
          @click="performSearch"
        >
          <v-icon start>mdi-magnify</v-icon>
          Search
        </v-btn>
      </div>
    </v-card>

    <!-- Results -->
    <div v-if="loading" class="d-flex justify-center align-center my-12 py-12 flex-1-1-100">
      <v-progress-circular indeterminate color="primary" size="64" width="6" />
    </div>
    
    <div v-else-if="results.length > 0">
      <v-row>
        <v-col
          v-for="guide in results"
          :key="guide.guideid"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            hover
            class="h-100 rounded-xl d-flex flex-column border overflow-hidden guide-card transition-swing"
            :to="`/library/${guide.guideid}`"
            elevation="0"
          >
            <div class="image-wrapper position-relative">
              <v-img
                v-if="guide.image"
                :src="guide.image.medium"
                height="220"
                cover
                class="bg-surface-variant"
              ></v-img>
              <div v-else class="bg-surface-variant h-100 d-flex align-center justify-center" style="height: 220px">
                <v-icon size="48" color="medium-emphasis">mdi-image-off-outline</v-icon>
              </div>
              <div class="gradient-overlay position-absolute bottom-0 left-0 right-0" style="height: 80px;"></div>
              
              <v-chip
                size="small"
                :color="difficultyColor(guide.difficulty)"
                variant="flat"
                class="position-absolute font-weight-bold"
                style="bottom: 12px; left: 12px; z-index: 2"
              >
                {{ guide.difficulty || 'Unknown' }}
              </v-chip>
            </div>
            
            <v-card-text class="d-flex flex-column flex-1-1-100 pa-4">
              <div class="text-caption font-weight-black text-primary mb-1 text-uppercase tracking-widest">{{ guide.category }}</div>
              <div class="text-subtitle-1 font-weight-bold mb-2 line-clamp-2 text-high-emphasis" style="line-height: 1.3">{{ guide.title }}</div>
              
              <v-spacer />
              
              <div class="text-body-2 text-medium-emphasis line-clamp-3 mt-2">
                {{ guide.summary || 'No summary available for this guide.' }}
              </div>
              
              <v-divider class="my-4" />
              
              <div class="d-flex align-center justify-space-between text-caption text-medium-emphasis font-weight-medium">
                <div class="d-flex align-center gap-1">
                  <v-icon size="14">mdi-wrench-outline</v-icon>
                  <span class="text-capitalize">{{ guide.type }}</span>
                </div>
                <div v-if="guide.time_required_max" class="d-flex align-center gap-1">
                  <v-icon size="14">mdi-clock-outline</v-icon>
                  <span>{{ formatTime(guide.time_required_max) }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
    
    <div v-else-if="hasSearched && !loading" class="d-flex flex-column align-center justify-center my-12 py-12 flex-1-1-100">
      <v-avatar color="surface-variant" size="120" class="mb-6">
        <v-icon size="64" color="medium-emphasis">mdi-book-search-outline</v-icon>
      </v-avatar>
      <h3 class="text-h5 font-weight-black mb-2">No guides found</h3>
      <p class="text-body-1 text-medium-emphasis">Try adjusting your search terms or checking for spelling errors.</p>
      <v-btn color="primary" variant="tonal" class="mt-6 rounded-lg text-none" @click="searchQuery = ''; hasSearched = false">
        Clear Search
      </v-btn>
    </div>
    
    <div v-else class="d-flex flex-column align-center justify-center my-12 py-12 flex-1-1-100">
      <v-avatar color="primary" variant="tonal" size="120" class="mb-6 opacity-80">
        <v-icon size="64" color="primary">mdi-bookshelf</v-icon>
      </v-avatar>
      <h2 class="text-h4 font-weight-black mb-3">Start your search</h2>
      <p class="text-body-1 text-center text-medium-emphasis" style="max-width: 450px; line-height: 1.6;">
        Enter a device model above to find official iFixit repair guides, teardowns, and techniques directly within NovaOps.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const searchQuery = ref(route.query.q ? String(route.query.q) : '')
const loading = ref(false)
const hasSearched = ref(false)
const results = ref<any[]>([])

onMounted(() => {
  if (searchQuery.value) {
    performSearch()
  }
})

async function performSearch() {
  if (!searchQuery.value.trim()) return
  
  // Update URL to make it shareable
  router.replace({ query: { q: searchQuery.value } })
  
  loading.value = true
  hasSearched.value = true
  results.value = []
  
  try {
    const res = await fetch(`https://www.ifixit.com/api/2.0/search/${encodeURIComponent(searchQuery.value)}?filter=guide`)
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    // Sort results by relevance/quality if possible, for now just use results
    results.value = data.results || []
  } catch (err) {
    console.error('Failed to search guides:', err)
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
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tracking-widest {
  letter-spacing: 0.1em;
}
.guide-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0,0,0,0.15) !important;
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
}
.gradient-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
}
</style>
