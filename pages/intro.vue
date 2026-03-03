<template>
  <div class="intro-root" :class="{ 'fade-out': fadingOut }" @vue:mounted="startIntro">

    <!-- ── Ambient background ── -->
    <div class="ambient-bg">
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />
      <div class="noise" />
    </div>

    <!-- ── Main content ── -->
    <div class="intro-layout">

      <!-- LEFT: Animation canvas + label -->
      <div class="anim-side" :class="{ visible: phase >= 0 }">
        <div class="canvas-wrap">
          <canvas ref="canvasEl" width="480" height="380" />
          <!-- Phase labels -->
          <transition name="label-fade">
            <div v-if="phase === 0" class="anim-label chaos">
              <span class="dot red" /><span class="dot yellow" /><span class="dot green" />
              <span>Before NovaOps</span>
            </div>
            <div v-else-if="phase >= 1" class="anim-label order">
              <span class="label-icon">✦</span>
              <span>Beautifully organised</span>
            </div>
          </transition>
        </div>
      </div>

      <!-- RIGHT: Copy + features + CTA -->
      <div class="copy-side">

        <!-- Wordmark -->
        <div class="wordmark" :class="{ visible: phase >= 0 }">
          <div class="logo-mark"><svg class="w-6 h-6 object-contain" viewBox="0 0 709 709" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M531.067 0H177.022C79.2556 0 0 79.2556 0 177.022V531.067C0 628.834 79.2556 708.089 177.022 708.089H531.067C628.834 708.089 708.089 628.834 708.089 531.067V177.022C708.089 79.2556 628.834 0 531.067 0Z" fill="url(#paint0_linear_1260_273)"/>
            <g filter="url(#filter2_d_1260_273)">
            <path d="M452.379 137.68H493.443C523.743 137.68 547.079 164.414 542.985 194.435L491.717 570.401H393.371L452.379 137.68Z" fill="url(#paint1_linear_1260_273)"/>
            </g>
            <g filter="url(#filter3_d_1260_273)">
            <path d="M196.687 137.68H265.247C281.002 137.68 293.137 151.581 291.008 167.193L236.025 570.401H137.68L196.687 137.68Z" fill="url(#paint2_linear_1260_273)"/>
            </g>
            <path d="M196.707 137.68H262.857C282.464 137.68 300.262 149.14 308.375 166.99L491.744 570.401H393.398L196.707 137.68Z" fill="url(#paint3_linear_1260_273)" fill-opacity="0.2"/>
            <defs>
            <filter id="filter2_d_1260_273" x="378.271" y="137.58" width="180.282" height="462.923" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="15"/>
            <feGaussianBlur stdDeviation="7.55"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1260_273"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1260_273" result="shape"/>
            </filter>
            <filter id="filter3_d_1260_273" x="122.58" y="137.58" width="183.77" height="462.923" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="15"/>
            <feGaussianBlur stdDeviation="7.55"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1260_273"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1260_273" result="shape"/>
            </filter>
            <linearGradient id="paint0_linear_1260_273" x1="0" y1="354.045" x2="708.089" y2="354.045" gradientUnits="userSpaceOnUse">
            <stop stop-color="#F9AA32"/>
            <stop offset="0.2" stop-color="#F8774E"/>
            <stop offset="0.410649" stop-color="#FD4372"/>
            <stop offset="0.585" stop-color="#F95DA5"/>
            <stop offset="0.8" stop-color="#F57DE4"/>
            <stop offset="1" stop-color="#43B9FB"/>
            </linearGradient>
            <linearGradient id="paint1_linear_1260_273" x1="472.048" y1="570.401" x2="472.049" y2="137.68" gradientUnits="userSpaceOnUse">
            <stop stop-color="#009DDC"/>
            <stop offset="1" stop-color="#3C9D51"/>
            </linearGradient>
            <linearGradient id="paint2_linear_1260_273" x1="216.356" y1="570.401" x2="216.357" y2="137.68" gradientUnits="userSpaceOnUse">
            <stop stop-color="#009DDC"/>
            <stop offset="1" stop-color="#3C9D51"/>
            </linearGradient>
            <linearGradient id="paint3_linear_1260_273" x1="344.226" y1="570.401" x2="344.226" y2="137.68" gradientUnits="userSpaceOnUse">
            <stop stop-color="#009DDC"/>
            <stop offset="1" stop-color="#3C9D51" stop-opacity="0.85"/>
            </linearGradient>
            </defs>
          </svg></div>
          <div class="logo-text">
            <span class="logo-nova">Nova</span><span class="logo-ops">Ops</span>
          </div>
        </div>

        <!-- Headline -->
        <div class="headline-wrap" :class="{ visible: phase >= 0 }">
          <h1 class="headline">
            <span class="headline-line">Your repair shop,</span>
            <span class="headline-line accent">finally in order.</span>
          </h1>
          <p class="subhead">
            One app to run tickets, customers, inventory,<br>payments, and your team. All synced, always.
          </p>
        </div>

        <!-- Feature pills — staggered in at phase 1 -->
        <div class="features" :class="{ visible: phase >= 1 }">
          <div
            v-for="(f, i) in features"
            :key="f.label"
            class="feature-pill"
            :style="{ transitionDelay: `${i * 80}ms` }"
          >
            <span class="pill-icon" :style="{ background: f.bg, color: f.color }">{{ f.icon }}</span>
            <div>
              <p class="pill-label">{{ f.label }}</p>
              <p class="pill-desc">{{ f.desc }}</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="cta-wrap" :class="{ visible: phase >= 2 }">
          <button class="cta-btn" @click="handleLetsGo">
            <span class="cta-text">Let's do this</span>
            <span class="cta-arrow">→</span>
            <span class="cta-glow" />
          </button>
          <p class="cta-hint">Takes about 60 seconds to set up</p>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const router  = useRouter()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const phase    = ref(-1)   // -1=hidden, 0=chaos, 1=sorted+features, 2=cta
const fadingOut = ref(false)

const features = [
  { icon: '🎫', label: 'Ticket Tracking',   desc: 'Every repair, start to finish',       bg: '#f59e0b18', color: '#f59e0b' },
  { icon: '👥', label: 'Customer CRM',       desc: 'History, notes & contact in one tap', bg: '#6366f118', color: '#6366f1' },
  { icon: '📦', label: 'Inventory Control',  desc: 'Parts, stock levels & auto-alerts',   bg: '#10b98118', color: '#10b981' },
  { icon: '💳', label: 'Square Payments',    desc: 'In-person & terminal checkout',       bg: '#3b82f618', color: '#3b82f6' },
  { icon: '📊', label: 'Reports & Analytics',desc: 'Revenue, trends & performance',       bg: '#ec489918', color: '#ec4899' },
]

// ── Canvas animation ────────────────────────────────────────────────────────

interface FilePaper {
  x: number; y: number
  tx: number; ty: number     // chaos target
  sx: number; sy: number     // sorted target
  sr: number                 // sorted rotation
  w: number; h: number
  rotation: number
  tr: number                 // target rotation
  color: string
  accent: string
  label: string
  labelLine2: string
  stackIndex: number
  settled: boolean
  wobblePhase: number
  vx: number; vy: number; vr: number
}

const STACKS = [
  { label: 'Tickets',   color: '#fef3c7', accent: '#f59e0b', x: 95,  y: 210 },
  { label: 'Customers', color: '#ede9fe', accent: '#6366f1', x: 230, y: 200 },
  { label: 'Inventory', color: '#d1fae5', accent: '#10b981', x: 365, y: 210 },
]

const FILE_LINES = [
  ['Device:', 'iPhone 14 Pro'],
  ['Cust:', 'Maria Garcia'],
  ['Status:', 'In Progress'],
  ['Part:', 'Screen LCD'],
  ['Price:', '$129.00'],
  ['Name:', 'Tom Sullivan'],
  ['Due:', 'Today 3pm'],
  ['Ref:', '#TK-2041'],
  ['Stock:', '12 units'],
  ['Note:', 'Rush repair'],
  ['Email:', 'j@shop.com'],
  ['Model:', 'Samsung S24'],
]

let papers: FilePaper[] = []
let animFrame = 0
let chaosPhase = true  // true=flying around, false=sorting into stacks
let sortStartTime = 0
let raf = 0

function buildPapers(W: number, H: number) {
  papers = []
  const count = 18
  for (let i = 0; i < count; i++) {
    const si = i % 3
    const st = STACKS[si]
    const lines = FILE_LINES[i % FILE_LINES.length]

    // Random chaos position
    const tx = 40 + Math.random() * (W - 80)
    const ty = 30 + Math.random() * (H - 80)
    const tr = (Math.random() - 0.5) * Math.PI * 2

    // Sorted stack position (staggered vertically)
    const stackCount = Math.floor(count / 3)
    const idxInStack = Math.floor(i / 3)
    const sx = st.x + (Math.random() - 0.5) * 6
    const sy = st.y - idxInStack * 3 + (Math.random() - 0.5) * 2
    const sr = (Math.random() - 0.5) * 0.15

    papers.push({
      x: tx, y: ty,
      tx, ty, sx, sy, sr,
      w: 72, h: 90,
      rotation: tr, tr,
      color: st.color,
      accent: st.accent,
      label: lines[0],
      labelLine2: lines[1],
      stackIndex: si,
      settled: false,
      wobblePhase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      vr: (Math.random() - 0.5) * 0.06,
    })
  }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInOut(t: number) { return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2 }

function drawPaper(ctx: CanvasRenderingContext2D, p: FilePaper, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)

  const { w, h } = p
  const r = 6

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4

  // Paper body
  ctx.beginPath()
  ctx.moveTo(-w/2 + r, -h/2)
  ctx.lineTo(w/2 - r, -h/2)
  ctx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r)
  ctx.lineTo(w/2, h/2 - r)
  ctx.quadraticCurveTo(w/2, h/2, w/2 - r, h/2)
  ctx.lineTo(-w/2 + r, h/2)
  ctx.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r)
  ctx.lineTo(-w/2, -h/2 + r)
  ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2)
  ctx.closePath()
  ctx.fillStyle = p.color
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  // Accent top bar
  ctx.beginPath()
  ctx.moveTo(-w/2 + r, -h/2)
  ctx.lineTo(w/2 - r, -h/2)
  ctx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r)
  ctx.lineTo(w/2, -h/2 + 18)
  ctx.lineTo(-w/2, -h/2 + 18)
  ctx.lineTo(-w/2, -h/2 + r)
  ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2)
  ctx.closePath()
  ctx.fillStyle = p.accent
  ctx.fill()

  // Lines of "text" (simulated)
  ctx.fillStyle = p.accent
  ctx.font = 'bold 7px sans-serif'
  ctx.fillText(p.label, -w/2 + 7, -h/2 + 29)

  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.font = '7px sans-serif'
  ctx.fillText(p.labelLine2, -w/2 + 7, -h/2 + 40)

  // Simulated text lines
  for (let i = 0; i < 4; i++) {
    const lw = (Math.random() > 0.4 ? 0.6 : 0.4) * (w - 20)
    ctx.fillStyle = `rgba(0,0,0,${0.12 + i * 0.03})`
    ctx.fillRect(-w/2 + 7, -h/2 + 52 + i * 10, lw, 4)
  }

  ctx.restore()
}

function drawStack(ctx: CanvasRenderingContext2D, st: typeof STACKS[0], progress: number) {
  if (progress <= 0) return
  ctx.save()
  ctx.globalAlpha = Math.min(1, progress * 2)

  // Stack base shadow
  ctx.shadowColor = `${st.accent}40`
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 6
  ctx.fillStyle = st.accent
  const bw = 80, bh = 10
  ctx.beginPath()
  ctx.ellipse(st.x, st.y + 50, bw/2, bh/2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Stack label
  ctx.fillStyle = st.accent
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(st.label, st.x, st.y + 68)

  // Divider line
  ctx.strokeStyle = `${st.accent}60`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(st.x - 35, st.y + 56)
  ctx.lineTo(st.x + 35, st.y + 56)
  ctx.stroke()

  ctx.restore()
}

function tick(now: number) {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)

  animFrame++

  if (chaosPhase) {
    // Papers fly around chaotically, bouncing off walls
    for (const p of papers) {
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vr

      if (p.x < 40 || p.x > W - 40) p.vx *= -1
      if (p.y < 40 || p.y > H - 60) p.vy *= -1

      // Gentle wobble
      p.y += Math.sin(animFrame * 0.02 + p.wobblePhase) * 0.3

      drawPaper(ctx, p)
    }
  } else {
    // Sort papers into stacks over time
    const elapsed = now - sortStartTime
    const totalDuration = 2200  // ms for full sort

    // Sort by stack then arrival order so they layer nicely
    const sortedPapers = [...papers].sort((a, b) =>
      a.stackIndex - b.stackIndex || papers.indexOf(a) - papers.indexOf(b)
    )

    // Draw stack bases first
    for (let si = 0; si < STACKS.length; si++) {
      const stackPapers = sortedPapers.filter(p => p.stackIndex === si)
      const firstSettled = stackPapers.some(p => p.settled)
      drawStack(ctx, STACKS[si], firstSettled ? 1 : 0)
    }

    // Animate each paper to its sorted position with staggered delay
    for (let i = 0; i < sortedPapers.length; i++) {
      const p = sortedPapers[i]
      const delay = i * 90   // stagger
      const dur   = 600
      const t     = Math.max(0, Math.min(1, (elapsed - delay) / dur))
      const et    = easeOut(t)

      if (t <= 0) {
        // Still in chaos — keep drifting
        p.x += p.vx * 0.3
        p.y += p.vy * 0.3
        p.rotation += p.vr * 0.3
      } else {
        p.x        = lerp(p.tx, p.sx, et)
        p.y        = lerp(p.ty, p.sy, et)
        p.rotation = lerp(p.tr, p.sr, et)
        if (t >= 1) p.settled = true
      }

      drawPaper(ctx, p, 0.9)
    }
  }

  raf = requestAnimationFrame(tick)
}

function startIntro() {
  const canvas = canvasEl.value
  if (!canvas) return
  buildPapers(canvas.width, canvas.height)

  // Phase 0: fade in with chaos
  setTimeout(() => { phase.value = 0 }, 100)

  // After chaos plays for 2.5s, start sorting
  setTimeout(() => {
    chaosPhase = false
    sortStartTime = performance.now()
  }, 2500)

  // Phase 1: show features after sorting begins
  setTimeout(() => { phase.value = 1 }, 4200)

  // Phase 2: show CTA
  setTimeout(() => { phase.value = 2 }, 5600)

  // Start render loop
  raf = requestAnimationFrame(tick)
}

function handleLetsGo() {
  fadingOut.value = true
  setTimeout(() => {
    cancelAnimationFrame(raf)
    // If we came here from a new account registration, the URL will have
    // a ?from=register query param. Otherwise treat this as a first-launch
    // intro and send the user to login.
    const route = useRoute()
    const dest = route.query.from === 'register' ? '/profile-setup' : '/login'
    router.push(dest)
  }, 700)
}

onUnmounted(() => cancelAnimationFrame(raf))
</script>

<style scoped>
/* ── Root ── */
.intro-root {
  position: fixed; inset: 0;
  background: #0d0f1a;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.intro-root.fade-out { opacity: 0; pointer-events: none; }

/* ── Ambient bg ── */
.ambient-bg { position: absolute; inset: 0; pointer-events: none; }
.orb {
  position: absolute; border-radius: 50%;
  filter: blur(80px); opacity: 0.22;
}
.orb-1 {
  width: 600px; height: 600px; top: -180px; left: -160px;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  animation: drift1 18s ease-in-out infinite alternate;
}
.orb-2 {
  width: 500px; height: 500px; bottom: -150px; right: -100px;
  background: radial-gradient(circle, #10b981, transparent 70%);
  animation: drift2 22s ease-in-out infinite alternate;
}
.orb-3 {
  width: 300px; height: 300px; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: radial-gradient(circle, #f59e0b, transparent 70%);
  opacity: 0.08;
  animation: drift3 14s ease-in-out infinite alternate;
}
.noise {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  opacity: 0.4;
}
@keyframes drift1 { from { transform: translate(0,0) } to { transform: translate(60px, 40px) } }
@keyframes drift2 { from { transform: translate(0,0) } to { transform: translate(-40px, -60px) } }
@keyframes drift3 { from { transform: translate(-50%,-50%) scale(1) } to { transform: translate(-50%,-50%) scale(1.3) } }

/* ── Layout ── */
.intro-layout {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 64px;
  max-width: 1100px; width: 100%; padding: 40px;
}

/* ── Animation side ── */
.anim-side {
  flex-shrink: 0;
  opacity: 0; transform: translateX(-30px);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.anim-side.visible { opacity: 1; transform: translateX(0); }

.canvas-wrap {
  position: relative;
  background: linear-gradient(145deg, #13172a, #0f1220);
  border-radius: 28px;
  padding: 16px;
  outline: 1.5px solid rgba(255,255,255,0.08);
  box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1);
}
.canvas-wrap canvas { display: block; border-radius: 16px; }

.anim-label {
  position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px;
  padding: 7px 16px; border-radius: 100px;
  font-size: 12px; font-weight: 700; white-space: nowrap;
  backdrop-filter: blur(8px);
}
.anim-label.chaos {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.1);
}
.anim-label.order {
  background: rgba(16,185,129,0.12);
  color: #10b981;
  border: 1px solid rgba(16,185,129,0.25);
}
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.red    { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green  { background: #10b981; }
.label-icon { font-size: 11px; }

.label-fade-enter-active, .label-fade-leave-active { transition: opacity 0.4s, transform 0.4s; }
.label-fade-enter-from { opacity: 0; transform: translateX(-50%) translateY(6px); }
.label-fade-leave-to   { opacity: 0; transform: translateX(-50%) translateY(-6px); }

/* ── Copy side ── */
.copy-side {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 32px;
}

/* Wordmark */
.wordmark {
  display: flex; align-items: center; gap: 12px;
  opacity: 0; transform: translateY(-16px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.wordmark.visible { opacity: 1; transform: translateY(0); }
.logo-mark {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 900; color: white;
  box-shadow: 0 8px 24px rgba(99,102,241,0.4);
}
.logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
.logo-nova { color: white; }
.logo-ops  { color: rgba(255,255,255,0.4); }

/* Headline */
.headline-wrap {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.8s ease 0.15s, transform 0.8s cubic-bezier(0.34, 1.1, 0.64, 1) 0.15s;
}
.headline-wrap.visible { opacity: 1; transform: translateY(0); }
.headline {
  display: flex; flex-direction: column; gap: 2px;
  font-size: clamp(28px, 3.5vw, 42px);
  font-weight: 900; line-height: 1.1; letter-spacing: -1.5px;
  color: white; margin: 0 0 14px;
}
.headline-line { display: block; }
.headline-line.accent {
  background: linear-gradient(90deg, #6366f1, #a78bfa, #10b981);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 4s ease infinite;
  background-size: 200% auto;
}
@keyframes gradientShift {
  0%   { background-position: 0% center; }
  50%  { background-position: 100% center; }
  100% { background-position: 0% center; }
}
.subhead {
  font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.5);
  font-weight: 400; margin: 0;
}

/* Features */
.features {
  display: flex; flex-direction: column; gap: 10px;
  opacity: 0; transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.features.visible { opacity: 1; transform: translateY(0); }

.feature-pill {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px; border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  opacity: 0; transform: translateX(-12px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  cursor: default;
}
.features.visible .feature-pill {
  opacity: 1; transform: translateX(0);
}
.feature-pill:hover {
  background: rgba(255,255,255,0.07);
  border-color: rgba(255,255,255,0.12);
  transform: translateX(4px) !important;
  transition: background 0.2s, border-color 0.2s, transform 0.2s !important;
}
.pill-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.pill-label { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); }
.pill-desc  { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; }

/* CTA */
.cta-wrap {
  display: flex; flex-direction: column; gap: 10px;
  opacity: 0; transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.cta-wrap.visible { opacity: 1; transform: translateY(0); }

.cta-btn {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; gap: 12px;
  padding: 0 36px; height: 60px; border-radius: 100px;
  border: none; cursor: pointer;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%);
  background-size: 200% auto;
  box-shadow: 0 8px 32px rgba(99,102,241,0.5), 0 0 0 0 rgba(99,102,241,0.4);
  transition: transform 0.2s, box-shadow 0.2s, background-position 0.4s;
  animation: ctaPulse 3s ease-in-out infinite;
  width: fit-content;
}
.cta-btn:hover {
  transform: scale(1.04) translateY(-2px);
  box-shadow: 0 16px 48px rgba(99,102,241,0.6), 0 0 0 6px rgba(99,102,241,0.15);
  background-position: right center;
}
.cta-btn:active { transform: scale(0.98); }

.cta-text {
  font-size: 16px; font-weight: 800; color: white; letter-spacing: -0.3px;
  position: relative; z-index: 1;
}
.cta-arrow {
  font-size: 20px; color: rgba(255,255,255,0.8);
  position: relative; z-index: 1;
  transition: transform 0.3s;
}
.cta-btn:hover .cta-arrow { transform: translateX(4px); }

.cta-glow {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: translateX(-100%);
  animation: shimmer 2.5s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  60%  { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
@keyframes ctaPulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(99,102,241,0.5); }
  50%       { box-shadow: 0 8px 48px rgba(99,102,241,0.7), 0 0 0 8px rgba(99,102,241,0.08); }
}

.cta-hint {
  font-size: 12px; color: rgba(255,255,255,0.3);
  margin: 0; padding-left: 4px; font-weight: 500;
}

/* ── Responsive ── */
@media (max-width: 820px) {
  .intro-layout { flex-direction: column; gap: 32px; padding: 24px; }
  .anim-side canvas { width: 340px; height: 270px; }
}
</style>
