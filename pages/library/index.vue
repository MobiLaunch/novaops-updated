<template>
  <div class="page-shell h-full">

    <header class="flex flex-col gap-2 mb-2">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <i class="mdi mdi-bookshelf text-xl"></i>
        </div>
        <h1 class="text-2xl font-black text-primary m-0">Repair Library</h1>
      </div>
      <p class="text-sm text-muted-foreground ml-13 m-0">Search for devices to find step-by-step repair guides.</p>
    </header>

    <div class="relative search-field mb-4">
      <i class="mdi mdi-magnify absolute left-4 text-muted-foreground" style="top: 50%; transform: translateY(-50%);"></i>
      <v-text-field
        v-model="searchQuery"
        placeholder="Search for a device (e.g., iPhone 13, Galaxy S21)..."
        class="w-full"
        hide-details
        prepend-inner-icon="mdi-magnify"
        @keyup.enter="performSearch"
      />
    </div>

    <div v-if="loading" class="flex justify-center items-center my-12 py-12 flex-1">
      <v-progress-circular indeterminate size="64" width="4" color="primary" />
    </div>

    <div v-else-if="results.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <NuxtLink
        v-for="guide in results"
        :key="guide.guideid"
        :to="`/library/${guide.guideid}`"
        class="bg-surface border border-border rounded-xl overflow-hidden flex flex-col guide-card transition-all hover:-translate-y-1 hover:shadow-lg"
      >
        <div class="relative">
          <img
            v-if="guide.image"
            :src="guide.image.medium"
            alt=""
            class="w-full h-[220px] object-cover bg-muted"
          >
          <div v-else class="h-[220px] bg-muted flex items-center justify-center">
            <i class="mdi mdi-image-off-outline text-4xl text-muted-foreground"></i>
          </div>
          <div class="gradient-overlay absolute bottom-0 left-0 right-0 h-20"></div>
          <v-chip
            :color="difficultySeverity(guide.difficulty)"
            size="small"
            class="absolute font-bold text-[10px]"
            style="bottom: 12px; left: 12px; z-index: 2"
          >{{ guide.difficulty || 'Unknown' }}</v-chip>
        </div>
        <div class="p-4 flex flex-col flex-1">
          <div class="text-[10px] font-black text-primary uppercase tracking-wider mb-1">{{ guide.category }}</div>
          <div class="text-sm font-bold line-clamp-2 mb-2">{{ guide.title }}</div>
          <p class="text-xs text-muted-foreground line-clamp-3 flex-1 mt-2 m-0">
            {{ guide.summary || 'No summary available for this guide.' }}
          </p>
          <hr class="border-border my-4" />
          <div class="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span class="flex items-center gap-1 capitalize">
              <i class="mdi mdi-wrench-outline"></i>{{ guide.type }}
            </span>
            <span v-if="guide.time_required_max" class="flex items-center gap-1">
              <i class="mdi mdi-clock-outline"></i>{{ formatTime(guide.time_required_max) }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else-if="hasSearched && !loading" class="flex flex-col items-center justify-center my-12 py-12 flex-1">
      <div class="w-28 h-28 rounded-full bg-muted flex items-center justify-center mb-6">
        <i class="mdi mdi-book-search-outline text-5xl text-muted-foreground"></i>
      </div>
      <h3 class="text-xl font-black mb-2 m-0">No guides found</h3>
      <p class="text-sm text-muted-foreground m-0">Try adjusting your search terms.</p>
      <v-btn color="primary" class="mt-6 font-bold text-none" @click="searchQuery = ''; hasSearched = false">Clear Search</v-btn>
    </div>

    <div v-else class="flex flex-col items-center justify-center my-12 py-12 flex-1">
      <div class="w-28 h-28 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 opacity-80">
        <i class="mdi mdi-bookshelf text-5xl"></i>
      </div>
      <h2 class="text-2xl font-black mb-3 m-0">Start your search</h2>
      <p class="text-sm text-center text-muted-foreground max-w-md m-0 leading-relaxed">
        Enter a device model above to find official iFixit repair guides, teardowns, and techniques directly within NovaOps.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const searchQuery = ref(route.query.q ? String(route.query.q) : '')
const loading = ref(false)
const hasSearched = ref(false)
const results = ref<any[]>([])

onMounted(() => {
  if (searchQuery.value) performSearch()
})

async function performSearch() {
  if (!searchQuery.value.trim()) return
  router.replace({ query: { q: searchQuery.value } })
  loading.value = true
  hasSearched.value = true
  results.value = []
  try {
    const res = await fetch(`https://www.ifixit.com/api/2.0/search/${encodeURIComponent(searchQuery.value)}?filter=guide`)
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    results.value = data.results || []
  } catch (err) {
    console.error('Failed to search guides:', err)
  } finally {
    loading.value = false
  }
}

function difficultySeverity(diff: string) {
  if (!diff) return 'secondary'
  const d = diff.toLowerCase()
  if (d.includes('easy')) return 'success'
  if (d.includes('moderate')) return 'warn'
  if (d.includes('difficult')) return 'danger'
  return 'secondary'
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
.search-field {
  box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.08);
}
.search-field:focus-within {
  box-shadow: 0 8px 24px -6px rgba(99, 102, 241, 0.2);
}
.guide-card:hover {
  border-color: rgba(99, 102, 241, 0.5) !important;
}
.gradient-overlay {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}
</style>
