<template>
  <!-- ══════════════════════════════════════════════════════════════
       CUSTOMER DISPLAY PAGE — Premium M3 Ambient Display
       Full-screen TV/Projector view with weather, news & slides
       URL: /display?shop=<profile_id>
  ═══════════════════════════════════════════════════════════════════ -->
  <div class="display-root">

    <!-- Animated mesh background -->
    <div class="mesh-bg" />

    <!-- Pairing / Waiting screen -->
    <Transition name="pair-fade">
    <div v-if="!connected || !slides.length" class="pair-screen">
      <div class="pair-orb">
        <div class="pair-orb-ring" />
        <div class="pair-orb-ring pair-orb-ring--2" />
        <v-icon icon="mdi-television" class="pair-icon" />
      </div>
      <h1 class="pair-title">Customer Display</h1>
      <p class="pair-sub">Waiting for content from your NovaOps dashboard…</p>
      <div class="pair-code-wrap" v-if="shopId">
        <p class="pair-code-label">DISPLAY CODE</p>
        <p class="pair-code">{{ shopId.slice(0, 8).toUpperCase() }}</p>
      </div>
      <div class="pair-status">
        <span class="pair-dot" :class="connected ? 'pair-dot--live' : 'pair-dot--wait'" />
        <span>{{ connected ? 'Connected — waiting for slides' : 'Connecting…' }}</span>
      </div>
    </div>
    </Transition>

    <!-- Active display -->
    <Transition name="display-fade">
    <div v-if="connected && slides.length" class="display-stage" @click="nextSlide">

      <!-- ── Top Bar ────────────────────────────────────── -->
      <div class="top-bar">
        <div class="top-bar-left">
          <div class="top-bar-logo">
            <v-icon icon="mdi-wrench-outline" size="16" />
          </div>
          <span class="top-bar-name">{{ displayConfig.shopName || 'NovaOps Repair' }}</span>
        </div>
        <div class="top-bar-center">
          <span class="top-bar-live"><span class="live-dot" /> LIVE</span>
        </div>
        <div class="top-bar-right">
          <template v-if="weatherData.loaded">
            <v-icon :icon="weatherIconComponent" size="16" style="opacity:0.7" />
            <span class="top-bar-temp">{{ weatherData.temp }}°F</span>
          </template>
          <span class="top-bar-clock">{{ currentTime }}</span>
        </div>
      </div>

      <!-- ── Main Content Area ──────────────────────────── -->
      <div class="display-body">

        <!-- Left: Slide content -->
        <div class="slide-area">
          <TransitionGroup name="slide-trans" tag="div" class="slide-container">
            <div
              v-for="(slide, i) in slides"
              :key="slide.id"
              v-show="i === currentSlide"
              class="slide"
            >

              <!-- MODULE: Ticket Board -->
              <div v-if="slide.type === 'tickets'" class="mod mod-tickets">
                <div class="mod-head">
                  <div class="mod-badge"><v-icon icon="mdi-wrench-outline" size="16" /> Active Repairs</div>
                </div>
                <div class="ticket-grid">
                  <div
                    v-for="ticket in activeTickets.slice(0, slide.config?.maxTickets || 8)"
                    :key="ticket.id"
                    class="t-card"
                    :style="`--sc: ${statusColor(ticket.status)}`"
                  >
                    <div class="t-bar" />
                    <div class="t-body">
                      <p class="t-device">{{ ticket.device }} {{ ticket.deviceModel }}</p>
                      <p class="t-name">{{ ticket.customerName }}</p>
                      <div class="t-chip">{{ ticket.status }}</div>
                    </div>
                  </div>
                  <div v-if="activeTickets.length === 0" class="t-empty">
                    <v-icon icon="mdi-check-circle-outline" size="48" class="opacity-20" />
                    <p>No active repairs right now</p>
                  </div>
                </div>
              </div>

              <!-- MODULE: Price Menu -->
              <div v-else-if="slide.type === 'menu'" class="mod mod-menu">
                <div class="mod-head">
                  <div>
                    <h2 class="menu-title">{{ slide.config?.title || 'Repair Services' }}</h2>
                    <p class="menu-sub">{{ slide.config?.subtitle || 'Professional Same-Day Service' }}</p>
                  </div>
                </div>
                <div class="menu-grid">
                  <div v-for="(group, gi) in menuGroups(slide)" :key="gi" class="menu-group">
                    <div class="menu-cat">{{ group.category }}</div>
                    <div v-for="svc in group.items" :key="svc.id" class="menu-row">
                      <span class="menu-svc">{{ svc.name }}</span>
                      <span class="menu-dots" />
                      <span class="menu-price">{{ formatCurrency(svc.flat_rate || svc.price || 0) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- MODULE: Promo / Ad -->
              <div v-else-if="slide.type === 'promo'" class="mod mod-promo">
                <div class="promo-inner" :style="`text-align:${slide.config?.align || 'center'}`">
                  <div v-if="slide.config?.badge" class="promo-badge">{{ slide.config.badge }}</div>
                  <h1 class="promo-headline" :style="`font-size:${slide.config?.headlineSize || 80}px;color:${slide.config?.headlineColor || '#ffffff'}`">
                    {{ slide.config?.headline || 'SAME-DAY REPAIRS' }}
                  </h1>
                  <p class="promo-body" :style="`color:${slide.config?.bodyColor || 'rgba(255,255,255,0.65)'}`">
                    {{ slide.config?.body || 'iPhone · Android · Tablet · Laptop' }}
                  </p>
                  <div v-if="slide.config?.cta" class="promo-cta">{{ slide.config.cta }}</div>
                </div>
              </div>

              <!-- MODULE: Welcome -->
              <div v-else-if="slide.type === 'welcome'" class="mod mod-welcome">
                <div v-if="slide.config?.logo" class="welcome-logo">
                  <img :src="slide.config.logo" alt="Logo" />
                </div>
                <h1 class="welcome-name">{{ slide.config?.shopName || 'Welcome' }}</h1>
                <p class="welcome-tag">{{ slide.config?.tagline || 'Expert device repairs, fast.' }}</p>
                <div class="welcome-chips">
                  <div v-for="strip in slide.config?.strips || ['iPhone & Android', 'Tablets', 'Laptops', 'Game Consoles']" :key="strip" class="welcome-chip">
                    {{ strip }}
                  </div>
                </div>
              </div>

              <!-- MODULE: Queue -->
              <div v-else-if="slide.type === 'queue'" class="mod mod-queue">
                <div class="queue-glow" />
                <div class="queue-num">{{ pendingCount }}</div>
                <div class="queue-lbl">Repairs in Queue</div>
                <div class="queue-wait">Est. wait: {{ estimatedWait }}</div>
                <div class="queue-row">
                  <div v-for="s in queueStatuses" :key="s.label" class="queue-item">
                    <div class="queue-ct" :style="`color:${s.color}`">{{ s.count }}</div>
                    <div class="queue-il">{{ s.label }}</div>
                  </div>
                </div>
              </div>

            </div>
          </TransitionGroup>
        </div>

        <!-- Right: Sidebar (Weather + News) -->
        <div class="sidebar">

          <!-- Weather Card -->
          <div class="sb-card weather-card" v-if="weatherData.loaded">
            <div class="wx-current">
              <div class="wx-icon-wrap">
                <v-icon :icon="weatherIconComponent" size="40" />
              </div>
              <div class="wx-info">
                <p class="wx-temp">{{ weatherData.temp }}°</p>
                <p class="wx-desc">{{ weatherData.description }}</p>
                <p class="wx-loc">{{ weatherData.location }}</p>
              </div>
            </div>
            <div class="wx-feels">Feels like {{ weatherData.feelsLike }}°F</div>
            <div class="wx-forecast" v-if="weatherData.forecast.length">
              <div v-for="fc in weatherData.forecast" :key="fc.day" class="wx-fc-day">
                <span class="wx-fc-name">{{ fc.day }}</span>
                <v-icon :icon="forecastIcon(fc.icon)" size="16" class="wx-fc-icon" />
                <span class="wx-fc-hi">{{ fc.high }}°</span>
                <span class="wx-fc-lo">{{ fc.low }}°</span>
              </div>
            </div>
          </div>
          <div class="sb-card weather-card wx-loading" v-else>
            <div class="wx-icon-wrap"><v-icon icon="mdi-weather-cloudy" size="40" class="opacity-30" /></div>
            <p class="wx-loading-text">Loading weather…</p>
          </div>

          <!-- News Feed -->
          <div class="sb-card news-card">
            <div class="news-header">
              <Newspaper class="w-4 h-4" style="opacity:0.5" />
              <span>Trending in Tech</span>
            </div>
            <div class="news-list" v-if="newsList.length">
              <TransitionGroup name="news-fade" tag="div">
                <div
                  v-for="item in visibleNews"
                  :key="item.id"
                  class="news-item"
                >
                  <div class="news-pts">▲ {{ item.points }}</div>
                  <div class="news-body">
                    <p class="news-title">{{ item.title }}</p>
                    <p class="news-meta">{{ item.domain }} · {{ item.timeAgo }}</p>
                  </div>
                </div>
              </TransitionGroup>
            </div>
            <div v-else class="news-empty">
              <p>Loading headlines…</p>
            </div>
          </div>

        </div>
      </div>

      <!-- ── Bottom Bar ─────────────────────────────────── -->
      <div class="bottom-bar">
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="`width:${progressPct}%;background:${currentSlideObj?.config?.accentColor || '#6366f1'}`"
          />
        </div>
        <div class="bottom-inner">
          <div class="slide-dots" v-if="slides.length > 1">
            <div
              v-for="(_, i) in slides"
              :key="i"
              class="dot"
              :class="{ active: i === currentSlide }"
              @click.stop="currentSlide = i; resetTimer()"
            />
          </div>
          <div class="bottom-date">{{ todayLabel }}</div>
        </div>
      </div>

    </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useWeather, wmoIconKey } from '~/composables/useWeather'
import { useNews } from '~/composables/useNews'

// This page has no auth requirement — it's public-facing
definePageMeta({ layout: false, auth: false })

const route = useRoute()
const { $supabase } = useNuxtApp()

// ── Shop ID from query param ─────────────────────────────────────
const shopId = computed(() => route.query.shop as string || route.query.s as string || '')

// ── State ─────────────────────────────────────────────────────────
const connected = ref(false)
const slides = ref<any[]>([])
const displayConfig = ref<any>({})
const currentSlide = ref(0)
const progressPct = ref(0)
const currentTime = ref('')
const activeTickets = ref<any[]>([])
const allServices = ref<any[]>([])
const allSettings = ref<any>({})

let slideTimer: ReturnType<typeof setInterval> | null = null
let progressTimer: ReturnType<typeof setInterval> | null = null
let clockTimer: ReturnType<typeof setInterval> | null = null
let realtimeChannel: any = null

// ── Weather & News ────────────────────────────────────────────────
const { weather: weatherData, fetchWeather } = useWeather()
const { news: newsList, fetchNews, startAutoRefresh, stopAutoRefresh } = useNews()

const newsPage = ref(0)
let newsScrollTimer: ReturnType<typeof setInterval> | null = null

const visibleNews = computed(() => {
  const all = newsList.value || []
  if (!all.length) return []
  const perPage = 5
  const start = (newsPage.value * perPage) % all.length
  return all.slice(start, start + perPage)
})

// Weather icon resolver
const iconMap: Record<string, any> = {
  'sun': 'mdi-weather-sunny', 'cloud-sun': CloudSun, 'cloud': 'mdi-weather-cloudy',
  'cloud-rain': 'mdi-weather-rainy', 'snowflake': 'mdi-snowflake',
  'cloud-drizzle': 'mdi-weather-rainy', 'cloud-snow': 'mdi-weather-snowy',
  'cloud-lightning': 'mdi-weather-lightning',
}
const weatherIconComponent = computed(() => iconMap[weatherData.value.icon] || Cloud)
const forecastIcon = (key: string) => iconMap[key] || Cloud

// ── Clock ─────────────────────────────────────────────────────────
function updateClock() {
  currentTime.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
)

// ── Computed helpers ──────────────────────────────────────────────
const currentSlideObj = computed(() => slides.value[currentSlide.value])

const pendingCount = computed(() =>
  activeTickets.value.filter(t => !['Completed', 'Delivered', 'Closed'].includes(t.status)).length
)

const estimatedWait = computed(() => {
  const count = pendingCount.value
  if (count <= 1) return '< 30 min'
  if (count <= 3) return '30–60 min'
  if (count <= 6) return '1–2 hours'
  return '2+ hours'
})

const queueStatuses = computed(() => [
  { label: 'Waiting',     count: activeTickets.value.filter(t => t.status === 'Open').length,        color: '#3b82f6' },
  { label: 'In Progress', count: activeTickets.value.filter(t => t.status === 'In Progress').length, color: '#f59e0b' },
  { label: 'Ready',       count: activeTickets.value.filter(t => t.status === 'Completed').length,   color: '#10b981' },
])

function statusColor(s: string) {
  return { 'Open': '#3b82f6', 'In Progress': '#f59e0b', 'Waiting for Parts': '#f97316',
           'Completed': '#10b981', 'Delivered': '#64748b' }[s] || '#6366f1'
}

function formatCurrency(n: number) {
  return (allSettings.value.currency || '$') + n.toFixed(2)
}

function menuGroups(slide: any) {
  const cats = slide.config?.categories || []
  const items = allServices.value.filter(s => !cats.length || cats.includes(s.category))
  const grouped = items.reduce((acc: any, svc: any) => {
    const cat = svc.category || 'Services'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(svc)
    return acc
  }, {})
  return Object.entries(grouped).map(([category, items]) => ({ category, items }))
}

// ── Slide timer ───────────────────────────────────────────────────
function resetTimer() {
  if (slideTimer) clearInterval(slideTimer)
  if (progressTimer) clearInterval(progressTimer)
  progressPct.value = 0
  const duration = currentSlideObj.value?.duration || 10000
  const step = 100 / (duration / 100)
  progressTimer = setInterval(() => { progressPct.value = Math.min(progressPct.value + step, 100) }, 100)
  slideTimer = setInterval(() => { nextSlide() }, duration)
}

function nextSlide() {
  if (!slides.value.length) return
  currentSlide.value = (currentSlide.value + 1) % slides.value.length
  resetTimer()
}

// ── Load display data ─────────────────────────────────────────────
async function loadDisplayData() {
  if (!shopId.value) return
  try {
    const { data: profiles } = await ($supabase as any)
      .from('profiles').select('*').eq('id', shopId.value).single()

    if (profiles) {
      displayConfig.value = profiles.display_config || {}
      slides.value = profiles.display_slides || []
      allSettings.value = profiles.settings || {}
      allServices.value = profiles.services || []
    }

    const { data: tickets } = await ($supabase as any)
      .from('tickets').select('*').eq('profile_id', shopId.value)
      .not('status', 'in', '("Delivered","Closed")')
      .order('created_at', { ascending: false }).limit(12)

    if (tickets) {
      const custIds = [...new Set(tickets.map((t: any) => t.customer_id).filter(Boolean))]
      let custMap: Record<number, string> = {}
      if (custIds.length) {
        const { data: custs } = await ($supabase as any)
          .from('customers').select('id,name').in('id', custIds)
        if (custs) custs.forEach((c: any) => { custMap[c.id] = c.name })
      }
      activeTickets.value = tickets.map((t: any) => ({
        id: t.id, device: t.device || '', deviceModel: t.device_model || '',
        status: t.status || 'Open',
        customerName: custMap[t.customer_id]?.split(' ')[0] || 'Customer',
      }))
    }

    connected.value = true
    if (slides.value.length) resetTimer()
  } catch (e) {
    console.error('Display load error:', e)
    connected.value = true
  }
}

// ── Realtime subscription ─────────────────────────────────────────
function subscribeRealtime() {
  if (!shopId.value) return
  realtimeChannel = ($supabase as any)
    .channel(`display:${shopId.value}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'profiles',
      filter: `id=eq.${shopId.value}`
    }, (payload: any) => {
      const p = payload.new
      if (p) {
        displayConfig.value = p.display_config || {}
        const newSlides = p.display_slides || []
        if (JSON.stringify(newSlides) !== JSON.stringify(slides.value)) {
          slides.value = newSlides
          currentSlide.value = 0
          if (slides.value.length) resetTimer()
        }
        allSettings.value = p.settings || {}
        allServices.value = p.services || []
      }
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'tickets',
      filter: `profile_id=eq.${shopId.value}`
    }, () => { loadDisplayData() })
    .subscribe()
}

// ── Lifecycle ─────────────────────────────────────────────────────
onMounted(async () => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)

  // Weather
  fetchWeather().catch(() => {})

  // News
  fetchNews().catch(() => {})
  startAutoRefresh()
  newsScrollTimer = setInterval(() => { newsPage.value++ }, 8000)

  if (shopId.value) {
    await loadDisplayData()
    subscribeRealtime()
  } else {
    connected.value = true
  }
})

onUnmounted(() => {
  if (slideTimer) clearInterval(slideTimer)
  if (progressTimer) clearInterval(progressTimer)
  if (clockTimer) clearInterval(clockTimer)
  if (newsScrollTimer) clearInterval(newsScrollTimer)
  stopAutoRefresh()
  if (realtimeChannel) ($supabase as any).removeChannel(realtimeChannel)
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════
   M3 CUSTOMER DISPLAY — Premium Ambient Theme
   ══════════════════════════════════════════════════════════════════ */

/* ── Root ──────────────────────────────────────────────────────── */
.display-root {
  position: fixed; inset: 0;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  overflow: hidden;
  background: #0a0a12;
  color: #fff;
}

.mesh-bg {
  position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse at 15% 80%, rgba(99,102,241,0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 20%, rgba(16,185,129,0.08) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%),
    linear-gradient(180deg, #0a0a12 0%, #10102a 100%);
  animation: meshShift 30s ease-in-out infinite alternate;
}

@keyframes meshShift {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(25deg); }
}

/* ── Pairing Screen ────────────────────────────────────────────── */
.pair-screen {
  position: absolute; inset: 0; z-index: 50;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 24px;
  background: radial-gradient(ellipse at 50% 50%, #1a1a2e 0%, #0a0a12 100%);
}
.pair-orb {
  width: 120px; height: 120px; position: relative;
  display: flex; align-items: center; justify-content: center;
}
.pair-orb-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid rgba(99,102,241,0.3);
  animation: pairPulse 3s ease-in-out infinite;
}
.pair-orb-ring--2 { inset: -16px; border-color: rgba(99,102,241,0.15); animation-delay: 1.5s; }
.pair-icon { width: 48px; height: 48px; color: #6366f1; }
.pair-title {
  font-size: 36px; font-weight: 900; letter-spacing: -0.02em;
  background: linear-gradient(135deg, #fff, #6366f1);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.pair-sub { font-size: 16px; color: rgba(255,255,255,0.45); font-weight: 500; }
.pair-code-wrap {
  padding: 16px 32px; border-radius: 20px;
  background: rgba(99,102,241,0.12); border: 2px solid rgba(99,102,241,0.3);
  text-align: center;
}
.pair-code-label { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; color: #6366f1; margin-bottom: 4px; }
.pair-code { font-size: 32px; font-weight: 900; font-family: monospace; letter-spacing: 0.1em; }
.pair-status {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: rgba(255,255,255,0.35); font-weight: 600;
}
.pair-dot { width: 8px; height: 8px; border-radius: 50%; }
.pair-dot--live { background: #4ade80; box-shadow: 0 0 10px #4ade80; animation: pairPulse 2s infinite; }
.pair-dot--wait { background: #f59e0b; animation: pairPulse 2s infinite; }

@keyframes pairPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.15); }
}

/* ── Stage ─────────────────────────────────────────────────────── */
.display-stage {
  position: absolute; inset: 0; z-index: 1;
  display: flex; flex-direction: column;
}

/* ── Top Bar ───────────────────────────────────────────────────── */
.top-bar {
  height: 56px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
  background: rgba(10,10,18,0.5);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  z-index: 10;
}
.top-bar-left { display: flex; align-items: center; gap: 10px; }
.top-bar-logo {
  width: 32px; height: 32px; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
}
.top-bar-name { font-size: 14px; font-weight: 800; letter-spacing: -0.01em; }

.top-bar-center { display: flex; align-items: center; }
.top-bar-live {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 900; letter-spacing: 0.15em;
  color: #4ade80;
  padding: 4px 14px; border-radius: 99px;
  background: rgba(74,222,128,0.1);
  border: 1px solid rgba(74,222,128,0.2);
}
.live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4ade80; box-shadow: 0 0 8px #4ade80;
  animation: pairPulse 2s infinite;
}

.top-bar-right { display: flex; align-items: center; gap: 14px; }
.top-bar-temp { font-size: 13px; font-weight: 800; opacity: 0.7; }
.top-bar-clock {
  font-size: 15px; font-weight: 900; font-variant-numeric: tabular-nums;
  opacity: 0.5;
}

/* ── Body Layout ───────────────────────────────────────────────── */
.display-body {
  flex: 1; display: flex; gap: 20px;
  padding: 20px 28px;
  min-height: 0;
}

.slide-area { flex: 1; position: relative; min-width: 0; }
.slide-container { position: absolute; inset: 0; }
.slide {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
}

.sidebar {
  width: 320px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 16px;
  min-height: 0;
}

/* ── Sidebar Cards (Glass) ─────────────────────────────────────── */
.sb-card {
  border-radius: 24px;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 20px;
  transition: background 0.3s;
}

/* ── Weather Card ──────────────────────────────────────────────── */
.weather-card { flex-shrink: 0; }
.wx-current { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.wx-icon-wrap {
  width: 64px; height: 64px; border-radius: 20px;
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.wx-info { min-width: 0; }
.wx-temp { font-size: 42px; font-weight: 900; line-height: 1; letter-spacing: -2px; }
.wx-desc { font-size: 14px; font-weight: 700; opacity: 0.6; margin-top: 2px; }
.wx-loc { font-size: 12px; font-weight: 600; opacity: 0.4; margin-top: 1px; }
.wx-feels {
  font-size: 11px; font-weight: 700; opacity: 0.4;
  padding: 8px 0; margin-bottom: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.wx-forecast { display: flex; flex-direction: column; gap: 6px; }
.wx-fc-day {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0;
}
.wx-fc-name { width: 36px; font-size: 13px; font-weight: 800; opacity: 0.5; }
.wx-fc-icon { opacity: 0.5; flex-shrink: 0; }
.wx-fc-hi { font-size: 14px; font-weight: 900; flex: 1; text-align: right; }
.wx-fc-lo { font-size: 14px; font-weight: 700; opacity: 0.35; width: 36px; text-align: right; }

.wx-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 20px; }
.wx-loading-text { font-size: 13px; font-weight: 600; opacity: 0.3; }

/* ── News Card ─────────────────────────────────────────────────── */
.news-card { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
.news-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.12em; opacity: 0.5;
  margin-bottom: 12px; flex-shrink: 0;
}
.news-list { flex: 1; overflow: hidden; }
.news-item {
  display: flex; gap: 10px; padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  animation: newsIn 0.4s ease both;
}
@keyframes newsIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.news-pts {
  width: 48px; height: 28px; border-radius: 8px;
  background: rgba(245,158,11,0.12);
  color: #f59e0b;
  font-size: 11px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.news-body { min-width: 0; }
.news-title {
  font-size: 13px; font-weight: 700; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-meta { font-size: 10px; font-weight: 600; opacity: 0.3; margin-top: 3px; }
.news-empty { display: flex; align-items: center; justify-content: center; flex: 1; font-size: 13px; opacity: 0.3; }

/* ── Bottom Bar ────────────────────────────────────────────────── */
.bottom-bar { flex-shrink: 0; z-index: 10; }
.progress-track { height: 3px; background: rgba(255,255,255,0.06); }
.progress-fill { height: 100%; transition: width 0.1s linear; border-radius: 0 2px 2px 0; }
.bottom-inner {
  display: flex; align-items: center; justify-content: center;
  gap: 20px; height: 44px;
  background: rgba(10,10,18,0.4); backdrop-filter: blur(16px);
}
.slide-dots { display: flex; gap: 6px; }
.dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  cursor: pointer; transition: all 0.3s ease;
}
.dot.active { width: 24px; border-radius: 4px; background: rgba(255,255,255,0.7); }
.bottom-date { font-size: 12px; font-weight: 600; opacity: 0.3; }

/* ══ MODULES ═══════════════════════════════════════════════════════ */
.mod {
  flex: 1; display: flex; flex-direction: column;
  background: rgba(255,255,255,0.03);
  border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(12px);
  overflow: hidden;
}
.mod-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 28px 16px;
}
.mod-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 8px 18px; border-radius: 99px;
  font-size: 13px; font-weight: 800;
}

/* ─ Tickets Module ─ */
.mod-tickets { padding-bottom: 20px; }
.ticket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px; padding: 0 28px; flex: 1; align-content: start;
}
.t-card {
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; overflow: hidden;
  animation: slideUp 0.5s ease both;
}
@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

.t-bar {
  width: 4px; flex-shrink: 0;
  background: var(--sc);
  box-shadow: 0 0 10px var(--sc);
}
.t-body { padding: 14px 16px; flex: 1; }
.t-device { font-size: 15px; font-weight: 900; margin-bottom: 3px; }
.t-name { font-size: 12px; font-weight: 600; opacity: 0.5; margin-bottom: 10px; }
.t-chip {
  display: inline-flex; font-size: 10px; font-weight: 800;
  padding: 3px 10px; border-radius: 99px;
  background: color-mix(in srgb, var(--sc) 15%, transparent);
  color: var(--sc);
}
.t-empty {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 48px; font-size: 16px; font-weight: 700; opacity: 0.25;
}

/* ─ Menu Module ─ */
.mod-menu { padding: 0 28px 24px; }
.menu-title { font-size: 36px; font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
.menu-sub { font-size: 15px; font-weight: 600; opacity: 0.4; margin-top: 6px; }
.menu-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px; flex: 1; align-content: start; margin-top: 4px;
}
.menu-cat {
  font-size: 10px; font-weight: 900; letter-spacing: 0.18em;
  text-transform: uppercase; opacity: 0.4; margin-bottom: 10px;
}
.menu-row {
  display: flex; align-items: baseline; gap: 8px;
  padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.menu-svc { font-size: 16px; font-weight: 700; }
.menu-dots { flex: 1; border-bottom: 2px dotted rgba(255,255,255,0.15); margin-bottom: 4px; }
.menu-price { font-size: 18px; font-weight: 900; color: #10b981; flex-shrink: 0; }

/* ─ Promo Module ─ */
.mod-promo { align-items: center; justify-content: center; padding: 48px; }
.promo-inner { max-width: 800px; }
.promo-badge {
  display: inline-block; font-size: 11px; font-weight: 900;
  letter-spacing: 0.2em; text-transform: uppercase;
  padding: 8px 20px; border-radius: 99px;
  background: rgba(255,255,255,0.1); margin-bottom: 20px;
}
.promo-headline {
  line-height: 0.9; font-weight: 900; letter-spacing: -0.03em;
  text-transform: uppercase; margin-bottom: 20px;
}
.promo-body { font-size: 24px; font-weight: 600; margin-bottom: 28px; }
.promo-cta {
  display: inline-flex; font-size: 16px; font-weight: 900;
  padding: 14px 32px; border-radius: 99px;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(255,255,255,0.2);
}

/* ─ Welcome Module ─ */
.mod-welcome { align-items: center; justify-content: center; gap: 16px; padding: 48px; }
.welcome-logo img { max-height: 80px; object-fit: contain; }
.welcome-name {
  font-size: 56px; font-weight: 900; letter-spacing: -0.03em;
  text-align: center;
  background: linear-gradient(135deg, #fff  0%, rgba(255,255,255,0.6) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.welcome-tag { font-size: 20px; font-weight: 600; opacity: 0.45; text-align: center; }
.welcome-chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 8px; }
.welcome-chip {
  padding: 8px 20px; border-radius: 99px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  font-size: 14px; font-weight: 700;
}

/* ─ Queue Module ─ */
.mod-queue { align-items: center; justify-content: center; gap: 12px; padding: 48px; position: relative; }
.queue-glow {
  position: absolute; width: 300px; height: 300px; border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
  animation: qGlow 4s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes qGlow { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.3); opacity: 1; } }

.queue-num {
  font-size: 140px; font-weight: 900; line-height: 1; position: relative;
  background: linear-gradient(135deg, #fff, rgba(255,255,255,0.35));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.queue-lbl { font-size: 24px; font-weight: 800; opacity: 0.6; }
.queue-wait { font-size: 16px; font-weight: 600; opacity: 0.35; }
.queue-row {
  display: flex; gap: 32px; margin-top: 16px;
  padding: 20px 36px; border-radius: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
}
.queue-item { text-align: center; }
.queue-ct { font-size: 36px; font-weight: 900; }
.queue-il { font-size: 11px; font-weight: 700; opacity: 0.4; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em; }

/* ── Transitions ───────────────────────────────────────────────── */
.pair-fade-enter-active, .pair-fade-leave-active { transition: opacity 0.6s ease; }
.pair-fade-enter-from, .pair-fade-leave-to { opacity: 0; }
.display-fade-enter-active, .display-fade-leave-active { transition: opacity 0.6s ease; }
.display-fade-enter-from, .display-fade-leave-to { opacity: 0; }
.slide-trans-enter-active { transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-trans-leave-active { transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-trans-enter-from { opacity: 0; transform: scale(1.02); }
.slide-trans-leave-to { opacity: 0; transform: scale(0.98); }
.news-fade-enter-active { transition: all 0.4s ease; }
.news-fade-leave-active { transition: all 0.3s ease; }
.news-fade-enter-from { opacity: 0; transform: translateY(8px); }
.news-fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
