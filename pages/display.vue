<template>
  <!-- ══════════════════════════════════════════════════════════════
       CUSTOMER DISPLAY PAGE — Full-screen TV/Projector view
       Receives realtime updates via Supabase channel
       URL: /display?shop=<profile_id>
  ═══════════════════════════════════════════════════════════════════ -->
  <div class="display-root" :style="bgStyle">

    <!-- Pairing / Waiting screen -->
    <Transition name="pair-fade">
    <div v-if="!connected || !slides.length" class="pair-screen">
      <div class="pair-orb">
        <div class="pair-orb-ring" />
        <div class="pair-orb-ring pair-orb-ring--2" />
        <Tv class="pair-icon" />
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

      <!-- ── Slide renderer ─────────────────────────────── -->
      <TransitionGroup name="slide-trans" tag="div" class="slide-container">
        <div
          v-for="(slide, i) in slides"
          :key="slide.id"
          v-show="i === currentSlide"
          class="slide"
          :style="slideBackground(slide)"
        >

          <!-- MODULE: Ticket Board -->
          <div v-if="slide.type === 'tickets'" class="module-tickets">
            <div class="module-header">
              <div class="module-badge">
                <Wrench class="w-5 h-5" />
                <span>Active Repairs</span>
              </div>
              <div class="module-time">{{ currentTime }}</div>
            </div>
            <div class="ticket-grid">
              <div
                v-for="ticket in activeTickets.slice(0, slide.config?.maxTickets || 6)"
                :key="ticket.id"
                class="ticket-card"
                :style="`--status-color: ${statusColor(ticket.status)}`"
              >
                <div class="ticket-card-status-bar" />
                <div class="ticket-card-body">
                  <p class="ticket-device">{{ ticket.device }} {{ ticket.deviceModel }}</p>
                  <p class="ticket-customer">{{ ticket.customerName }}</p>
                  <div class="ticket-status-chip" :style="`background:${statusColor(ticket.status)}18;color:${statusColor(ticket.status)}`">
                    {{ ticket.status }}
                  </div>
                </div>
              </div>
              <div v-if="activeTickets.length === 0" class="ticket-empty">
                <CheckCircle class="w-16 h-16 opacity-30" />
                <p>No active repairs right now</p>
              </div>
            </div>
          </div>

          <!-- MODULE: Price Menu -->
          <div v-else-if="slide.type === 'menu'" class="module-menu">
            <div class="menu-header">
              <div class="menu-title-wrap">
                <h2 class="menu-title">{{ slide.config?.title || 'Repair Services' }}</h2>
                <p class="menu-sub">{{ slide.config?.subtitle || 'Professional Same-Day Service' }}</p>
              </div>
              <div class="module-time menu-time">{{ currentTime }}</div>
            </div>
            <div class="menu-grid">
              <div v-for="(group, gi) in menuGroups(slide)" :key="gi" class="menu-group">
                <div class="menu-group-header">{{ group.category }}</div>
                <div v-for="svc in group.items" :key="svc.id" class="menu-item">
                  <span class="menu-item-name">{{ svc.name }}</span>
                  <span class="menu-item-dots" />
                  <span class="menu-item-price">{{ formatCurrency(svc.flat_rate || svc.price || 0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- MODULE: Promo / Ad Slide -->
          <div v-else-if="slide.type === 'promo'" class="module-promo">
            <div class="promo-content" :style="`text-align:${slide.config?.align || 'center'}`">
              <div v-if="slide.config?.badge" class="promo-badge">{{ slide.config.badge }}</div>
              <h1 class="promo-headline" :style="`font-size:${slide.config?.headlineSize || 96}px;color:${slide.config?.headlineColor || '#ffffff'}`">
                {{ slide.config?.headline || 'SAME-DAY REPAIRS' }}
              </h1>
              <p class="promo-body" :style="`color:${slide.config?.bodyColor || 'rgba(255,255,255,0.75)'}`">
                {{ slide.config?.body || 'iPhone · Android · Tablet · Laptop' }}
              </p>
              <div v-if="slide.config?.cta" class="promo-cta">{{ slide.config.cta }}</div>
            </div>
          </div>

          <!-- MODULE: Welcome / Branding -->
          <div v-else-if="slide.type === 'welcome'" class="module-welcome">
            <div v-if="slide.config?.logo" class="welcome-logo">
              <img :src="slide.config.logo" alt="Logo" />
            </div>
            <div v-else class="welcome-logo-placeholder">
              <Wrench class="w-14 h-14" style="opacity:0.4" />
            </div>
            <h1 class="welcome-shop-name">{{ slide.config?.shopName || 'Welcome' }}</h1>
            <p class="welcome-tagline">{{ slide.config?.tagline || 'Expert device repairs, fast.' }}</p>
            <div class="welcome-strips">
              <div v-for="strip in slide.config?.strips || ['iPhone & Android', 'Tablets', 'Laptops', 'Game Consoles']" :key="strip" class="welcome-strip">
                {{ strip }}
              </div>
            </div>
          </div>

          <!-- MODULE: Queue / Wait time -->
          <div v-else-if="slide.type === 'queue'" class="module-queue">
            <div class="queue-number">{{ pendingCount }}</div>
            <div class="queue-label">Repairs in Queue</div>
            <div class="queue-sub">Est. wait time: {{ estimatedWait }}</div>
            <div class="queue-status-row">
              <div v-for="s in queueStatuses" :key="s.label" class="queue-status-item">
                <div class="queue-status-count" :style="`color:${s.color}`">{{ s.count }}</div>
                <div class="queue-status-label">{{ s.label }}</div>
              </div>
            </div>
          </div>

        </div>
      </TransitionGroup>

      <!-- Progress bar -->
      <div class="progress-bar-wrap">
        <div
          class="progress-bar-fill"
          :style="`width:${progressPct}%;background:${currentSlideObj?.config?.accentColor || '#6366f1'}`"
        />
      </div>

      <!-- Slide dots -->
      <div class="slide-dots" v-if="slides.length > 1">
        <div
          v-for="(_, i) in slides"
          :key="i"
          class="slide-dot"
          :class="{ active: i === currentSlide }"
          @click.stop="currentSlide = i; resetTimer()"
        />
      </div>

      <!-- Shop footer -->
      <div class="display-footer" v-if="displayConfig.showFooter !== false">
        <div class="footer-shop">
          <Wrench class="w-4 h-4 opacity-50" />
          <span>{{ displayConfig.shopName || 'NovaOps Repair' }}</span>
        </div>
        <div class="footer-live">
          <span class="footer-live-dot" />
          LIVE
        </div>
        <div class="footer-time">{{ currentTime }}</div>
      </div>

    </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { Wrench, Tv, CheckCircle } from 'lucide-vue-next'

// This page has no auth requirement — it's public-facing
definePageMeta({ layout: false, auth: false })

const route = useRoute()
const { $supabase } = useNuxtApp()

// ── Shop ID from query param or hash ─────────────────────────────
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

// ── Clock ─────────────────────────────────────────────────────────
function updateClock() {
  currentTime.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Computed helpers ──────────────────────────────────────────────
const currentSlideObj = computed(() => slides.value[currentSlide.value])

const bgStyle = computed(() => {
  if (!slides.value.length) return 'background: #0f0f13'
  const s = currentSlideObj.value
  if (!s) return 'background: #0f0f13'
  return `background: ${s.config?.bg || '#0f0f13'}`
})

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
  { label: 'Waiting',    count: activeTickets.value.filter(t => t.status === 'Open').length,                  color: '#3b82f6' },
  { label: 'In Progress',count: activeTickets.value.filter(t => t.status === 'In Progress').length,           color: '#f59e0b' },
  { label: 'Ready',      count: activeTickets.value.filter(t => t.status === 'Completed').length,             color: '#10b981' },
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
  const items = allServices.value.filter(s =>
    !cats.length || cats.includes(s.category)
  )
  const grouped = items.reduce((acc: any, svc: any) => {
    const cat = svc.category || 'Services'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(svc)
    return acc
  }, {})
  return Object.entries(grouped).map(([category, items]) => ({ category, items }))
}

function slideBackground(slide: any) {
  const bg = slide.config?.bg || '#0f0f13'
  const accent = slide.config?.accentColor || '#6366f1'
  if (slide.config?.bgType === 'gradient') {
    return `background: linear-gradient(135deg, ${bg}, ${accent})`
  }
  if (slide.config?.bgType === 'mesh') {
    return `background: radial-gradient(ellipse at 20% 50%, ${accent}30 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, ${bg}80 0%, transparent 50%), ${bg}`
  }
  return `background: ${bg}`
}

// ── Slide timer ───────────────────────────────────────────────────
function resetTimer() {
  if (slideTimer) clearInterval(slideTimer)
  if (progressTimer) clearInterval(progressTimer)
  progressPct.value = 0

  const duration = currentSlideObj.value?.duration || 8000
  const step = 100 / (duration / 100)

  progressTimer = setInterval(() => {
    progressPct.value = Math.min(progressPct.value + step, 100)
  }, 100)

  slideTimer = setInterval(() => {
    nextSlide()
  }, duration)
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
    // Load profile/settings/slides
    const { data: profiles } = await ($supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', shopId.value)
      .single()

    if (profiles) {
      const p = profiles
      displayConfig.value = p.display_config || {}
      slides.value = p.display_slides || []
      allSettings.value = p.settings || {}
      allServices.value = p.services || []
    }

    // Load active tickets
    const { data: tickets } = await ($supabase as any)
      .from('tickets')
      .select('*')
      .eq('profile_id', shopId.value)
      .not('status', 'in', '("Delivered","Closed")')
      .order('created_at', { ascending: false })
      .limit(12)

    if (tickets) {
      // Enrich with customer names
      const custIds = [...new Set(tickets.map((t: any) => t.customer_id).filter(Boolean))]
      let custMap: Record<number, string> = {}
      if (custIds.length) {
        const { data: custs } = await ($supabase as any)
          .from('customers')
          .select('id,name')
          .in('id', custIds)
        if (custs) custs.forEach((c: any) => { custMap[c.id] = c.name })
      }
      activeTickets.value = tickets.map((t: any) => ({
        id: t.id,
        device: t.device || '',
        deviceModel: t.device_model || '',
        status: t.status || 'Open',
        customerName: custMap[t.customer_id]?.split(' ')[0] || 'Customer',
      }))
    }

    connected.value = true
    if (slides.value.length) resetTimer()
  } catch (e) {
    console.error('Display load error:', e)
    connected.value = true // show waiting state at least
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
    }, () => {
      // Reload tickets on any change
      loadDisplayData()
    })
    .subscribe()
}

// ── Lifecycle ─────────────────────────────────────────────────────
onMounted(async () => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)

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
  if (realtimeChannel) ($supabase as any).removeChannel(realtimeChannel)
})
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────── */
.display-root {
  position: fixed; inset: 0;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  overflow: hidden;
  transition: background 1s ease;
  color: white;
}

/* ── Pairing screen ───────────────────────────────────────────── */
.pair-screen {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 24px;
  background: radial-gradient(ellipse at 50% 50%, #1a1a2e 0%, #0f0f13 100%);
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
.pair-orb-ring--2 {
  inset: -16px;
  border-color: rgba(99,102,241,0.15);
  animation-delay: 1.5s;
}
.pair-icon { width: 48px; height: 48px; color: #6366f1; }

.pair-title {
  font-size: 36px; font-weight: 900; letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff, #6366f1);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.pair-sub { font-size: 16px; color: rgba(255,255,255,0.5); font-weight: 500; }

.pair-code-wrap {
  padding: 16px 32px; border-radius: 20px;
  background: rgba(99,102,241,0.12);
  border: 2px solid rgba(99,102,241,0.3);
  text-align: center;
}
.pair-code-label { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; color: #6366f1; margin-bottom: 4px; }
.pair-code { font-size: 32px; font-weight: 900; font-family: monospace; letter-spacing: 0.1em; }

.pair-status {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 600;
}
.pair-dot { width: 8px; height: 8px; border-radius: 50%; }
.pair-dot--live { background: #4ade80; box-shadow: 0 0 10px #4ade80; animation: pairPulse 2s infinite; }
.pair-dot--wait { background: #f59e0b; animation: pairPulse 2s infinite; }

@keyframes pairPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.15); }
}

/* ── Stage ────────────────────────────────────────────────────── */
.display-stage { position: absolute; inset: 0; }
.slide-container { position: absolute; inset: 0; }
.slide {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  transition: background 0.8s ease;
}

/* ── Progress bar ─────────────────────────────────────────────── */
.progress-bar-wrap {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: rgba(255,255,255,0.1); z-index: 10;
}
.progress-bar-fill { height: 100%; transition: width 0.1s linear; }

/* ── Footer ───────────────────────────────────────────────────── */
.display-footer {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 48px; padding: 0 32px;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(0,0,0,0.3); backdrop-filter: blur(10px);
  font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.5);
  z-index: 10;
}
.footer-shop { display: flex; align-items: center; gap: 8px; }
.footer-live { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.15em; color: #4ade80; }
.footer-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: pairPulse 2s infinite; }

/* ── Slide dots ───────────────────────────────────────────────── */
.slide-dots {
  position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; z-index: 10;
}
.slide-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.3);
  cursor: pointer; transition: all 0.3s ease;
}
.slide-dot.active { width: 24px; border-radius: 4px; background: white; }

/* ══ MODULE: TICKETS ══════════════════════════════════════════════ */
.module-tickets {
  flex: 1; display: flex; flex-direction: column;
  padding: 48px 56px 72px;
}
.module-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 32px;
}
.module-badge {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.15);
  padding: 10px 20px; border-radius: 99px;
  font-size: 15px; font-weight: 800;
}
.module-time {
  font-size: 32px; font-weight: 900; opacity: 0.4; font-variant-numeric: tabular-nums;
}

.ticket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px; flex: 1;
}
.ticket-card {
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
  display: flex;
  backdrop-filter: blur(10px);
  animation: slideUp 0.5s ease both;
}
@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.ticket-card-status-bar {
  width: 5px; flex-shrink: 0;
  background: var(--status-color);
  box-shadow: 0 0 12px var(--status-color);
}
.ticket-card-body { padding: 18px 18px 18px 16px; flex: 1; }
.ticket-device { font-size: 17px; font-weight: 900; margin-bottom: 4px; }
.ticket-customer { font-size: 13px; font-weight: 600; opacity: 0.6; margin-bottom: 12px; }
.ticket-status-chip {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 800;
  padding: 4px 12px; border-radius: 99px;
}
.ticket-empty {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; padding: 64px;
  font-size: 20px; font-weight: 700; opacity: 0.3;
}

/* ══ MODULE: MENU ═════════════════════════════════════════════════ */
.module-menu {
  flex: 1; display: flex; flex-direction: column;
  padding: 48px 56px 72px;
}
.menu-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 36px;
}
.menu-title { font-size: 52px; font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
.menu-sub { font-size: 18px; font-weight: 600; opacity: 0.5; margin-top: 8px; }
.menu-time { font-size: 28px; font-weight: 900; opacity: 0.35; }

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 32px; flex: 1; align-content: start;
}
.menu-group-header {
  font-size: 11px; font-weight: 900; letter-spacing: 0.18em;
  text-transform: uppercase; opacity: 0.5; margin-bottom: 12px;
}
.menu-item {
  display: flex; align-items: baseline; gap: 8px;
  padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.07);
}
.menu-item-name { font-size: 18px; font-weight: 700; }
.menu-item-dots { flex: 1; border-bottom: 2px dotted rgba(255,255,255,0.2); margin-bottom: 4px; }
.menu-item-price { font-size: 20px; font-weight: 900; flex-shrink: 0; }

/* ══ MODULE: PROMO ════════════════════════════════════════════════ */
.module-promo {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 60px;
}
.promo-content { max-width: 900px; }
.promo-badge {
  display: inline-block;
  font-size: 12px; font-weight: 900; letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 8px 20px; border-radius: 99px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
  margin-bottom: 24px;
}
.promo-headline {
  line-height: 0.9; font-weight: 900; letter-spacing: -0.03em;
  text-transform: uppercase; margin-bottom: 24px;
}
.promo-body { font-size: 28px; font-weight: 600; margin-bottom: 32px; }
.promo-cta {
  display: inline-flex; align-items: center;
  font-size: 18px; font-weight: 900;
  padding: 16px 36px; border-radius: 99px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
  border: 2px solid rgba(255,255,255,0.3);
}

/* ══ MODULE: WELCOME ══════════════════════════════════════════════ */
.module-welcome {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 20px; padding: 60px;
}
.welcome-logo img { max-height: 100px; object-fit: contain; }
.welcome-logo-placeholder { margin-bottom: 8px; }
.welcome-shop-name { font-size: 72px; font-weight: 900; letter-spacing: -0.03em; text-align: center; }
.welcome-tagline { font-size: 22px; font-weight: 600; opacity: 0.55; text-align: center; }
.welcome-strips {
  display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 12px;
}
.welcome-strip {
  padding: 10px 24px; border-radius: 99px;
  background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.15);
  font-size: 15px; font-weight: 700;
}

/* ══ MODULE: QUEUE ════════════════════════════════════════════════ */
.module-queue {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; padding: 60px;
}
.queue-number {
  font-size: 160px; font-weight: 900; line-height: 1;
  background: linear-gradient(135deg, #ffffff, rgba(255,255,255,0.4));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.queue-label { font-size: 28px; font-weight: 800; opacity: 0.7; }
.queue-sub { font-size: 18px; font-weight: 600; opacity: 0.45; }
.queue-status-row {
  display: flex; gap: 40px; margin-top: 20px;
  padding: 24px 40px; border-radius: 24px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
}
.queue-status-item { text-align: center; }
.queue-status-count { font-size: 40px; font-weight: 900; }
.queue-status-label { font-size: 12px; font-weight: 700; opacity: 0.5; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em; }

/* ── Transitions ──────────────────────────────────────────────── */
.pair-fade-enter-active, .pair-fade-leave-active { transition: opacity 0.6s ease; }
.pair-fade-enter-from, .pair-fade-leave-to { opacity: 0; }
.display-fade-enter-active, .display-fade-leave-active { transition: opacity 0.6s ease; }
.display-fade-enter-from, .display-fade-leave-to { opacity: 0; }
.slide-trans-enter-active { transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-trans-leave-active { transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-trans-enter-from { opacity: 0; transform: scale(1.02); }
.slide-trans-leave-to { opacity: 0; transform: scale(0.98); }
</style>
