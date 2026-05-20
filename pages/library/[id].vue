<template>
  <div class="page-shell h-full flex flex-col gap-4">

    <div class="flex items-center gap-3 mb-2">
      <Button variant="text" rounded class="!w-10 !h-10" @click="router.back()">
        <i class="mdi mdi-arrow-left"></i>
      </Button>
      <nav class="flex items-center gap-1 text-xs font-bold text-primary flex-wrap">
        <NuxtLink to="/library" class="hover:underline">Library</NuxtLink>
        <i class="mdi mdi-chevron-right text-muted-foreground"></i>
        <span v-if="guide?.category" class="text-muted-foreground">{{ guide.category }}</span>
        <i v-if="guide?.category" class="mdi mdi-chevron-right text-muted-foreground"></i>
        <span class="truncate max-w-xs">{{ guide?.title || 'Loading…' }}</span>
      </nav>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center flex-1 py-20">
      <ProgressSpinner style="width: 64px; height: 64px" stroke-width="4" class="mb-4" />
      <span class="text-lg text-muted-foreground">Loading guide…</span>
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center flex-1 py-20 text-center">
      <i class="mdi mdi-alert-circle-outline text-5xl text-red-500 mb-4"></i>
      <h2 class="text-xl font-bold m-0 mb-2">Error loading guide</h2>
      <p class="text-sm text-muted-foreground mb-6 m-0">{{ error }}</p>
      <Button label="Try Again" @click="fetchGuide" />
    </div>

    <template v-else-if="guide">
      <div class="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <div class="grid grid-cols-1 md:grid-cols-12">
          <div class="md:col-span-5 relative bg-muted min-h-[250px]">
            <img
              v-if="guide.image"
              :src="guide.image.standard || guide.image.medium"
              alt=""
              class="w-full h-full object-cover max-h-[350px]"
            >
            <div class="absolute bottom-4 left-4 z-10">
              <Tag :value="guide.difficulty || 'Unknown'" :severity="difficultySeverity(guide.difficulty)" />
            </div>
            <div class="gradient-overlay absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"></div>
          </div>
          <div class="md:col-span-7 p-6 md:p-8 flex flex-col">
            <div class="flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider mb-2">
              <span>{{ guide.category }}</span>
              <i class="mdi mdi-circle-small"></i>
              <span>{{ guide.type }}</span>
            </div>
            <h1 class="text-2xl font-black mb-4 m-0 leading-tight">{{ guide.title }}</h1>
            <div class="flex items-center gap-4 mb-6 flex-wrap">
              <span v-if="guide.time_required_max" class="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded-full">
                <i class="mdi mdi-clock-outline"></i>{{ formatTime(guide.time_required_max) }} estimated
              </span>
              <span v-if="guide.steps?.length" class="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded-full">
                <i class="mdi mdi-format-list-numbered"></i>{{ guide.steps.length }} steps
              </span>
            </div>
            <hr class="border-border mb-4" />
            <div v-if="guide.introduction_rendered" class="text-sm text-muted-foreground guide-html-content" v-html="guide.introduction_rendered"></div>
            <p v-else class="text-sm text-muted-foreground m-0">{{ guide.summary }}</p>
          </div>
        </div>
      </div>

      <div v-if="guide.steps?.length" class="flex flex-col gap-6">
        <h2 class="text-xl font-black px-2 m-0">Step-by-Step Instructions</h2>
        <div
          v-for="(step, index) in guide.steps"
          :key="step.stepid || index"
          :id="`step-${index + 1}`"
          class="bg-surface border border-border rounded-xl overflow-hidden shadow-sm"
        >
          <div class="flex flex-col md:flex-row">
            <div class="step-media bg-muted shrink-0">
              <template v-if="step.media?.data?.length">
                <img
                  :src="(step.media.data[stepImageIndex[index] || 0] || step.media.data[0]).standard || step.media.data[0].medium"
                  alt=""
                  class="w-full h-[350px] object-cover"
                >
                <div v-if="step.media.data.length > 1" class="flex justify-center gap-2 p-2">
                  <Button
                    v-for="(_, mIndex) in step.media.data"
                    :key="mIndex"
                    size="small"
                    :severity="(stepImageIndex[index] || 0) === mIndex ? 'primary' : 'secondary'"
                    class="!w-8 !h-8 !p-0"
                    @click="stepImageIndex[index] = mIndex"
                  >{{ mIndex + 1 }}</Button>
                </div>
              </template>
              <div v-else class="flex items-center justify-center h-[200px]">
                <i class="mdi mdi-image-outline text-4xl text-muted-foreground"></i>
              </div>
            </div>
            <div class="p-6 md:p-8 flex-1">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{{ index + 1 }}</div>
                <h3 class="text-lg font-bold m-0">{{ step.title || `Step ${index + 1}` }}</h3>
              </div>
              <hr class="border-border mb-4" />
              <div class="flex flex-col gap-3">
                <div v-for="(line, lIndex) in step.lines" :key="lIndex" class="flex gap-3">
                  <i class="mdi pt-1 shrink-0" :class="bulletIcon(line.bullet)" :style="{ color: bulletColor(line.bullet) }"></i>
                  <div class="text-sm guide-html-content" v-html="line.text_rendered"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center mt-8">
        <i class="mdi mdi-check-circle-outline text-5xl text-primary mb-4 block"></i>
        <h2 class="text-2xl font-black mb-2 m-0">Repair Complete!</h2>
        <p class="text-sm mb-6 max-w-md mx-auto m-0 text-muted-foreground">
          You've reached the end of this guide. To reassemble your device, follow these instructions in reverse order.
        </p>
        <Button label="Back to Top" size="large" class="font-bold text-none" @click="scrollToTop" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const guideId = route.params.id

const loading = ref(true)
const error = ref('')
const guide = ref<any>(null)
const stepImageIndex = ref<Record<number, number>>({})

onMounted(() => {
  if (guideId) fetchGuide()
  else {
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
    error.value = err.message || 'An unexpected error occurred while loading the repair guide.'
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

function bulletIcon(bullet: string) {
  switch (bullet) {
    case 'icon_caution': return 'mdi-alert'
    case 'icon_note': return 'mdi-information'
    case 'icon_reminder': return 'mdi-lightbulb-on'
    default: return 'mdi-circle-small'
  }
}

function bulletColor(bullet: string) {
  const map: Record<string, string> = {
    red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e',
    blue: '#3b82f6', violet: '#8b5cf6', black: '#1e293b',
    icon_caution: '#ef4444', icon_note: '#3b82f6', icon_reminder: '#eab308',
  }
  return map[bullet] || '#64748b'
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style>
.guide-html-content a { color: var(--p-primary-500, #6366f1); text-decoration: none; font-weight: 500; }
.guide-html-content a:hover { text-decoration: underline; }
.guide-html-content p { margin-bottom: 0; }
.guide-html-content strong { font-weight: 700; }
</style>

<style scoped>
.gradient-overlay { background: linear-gradient(to top, rgba(0,0,0,0.6), transparent); }
.pointer-events-none { pointer-events: none; }
.max-w-md { max-width: 600px; }
.step-media { flex-basis: 40%; max-width: 100%; }
@media (min-width: 960px) {
  .step-media { max-width: 450px; }
  .md\:col-span-5 { grid-column: span 5 / span 5; }
  .md\:col-span-7 { grid-column: span 7 / span 7; }
  .md\:grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
}
</style>
