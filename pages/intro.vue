<template>
  <div class="intro-root" :class="{ 'fade-out': fadingOut }" @vue:mounted="startIntro">

    <!-- ── Ambient background ── -->
    <div class="ambient-bg">
      <div class="blob blob-1" />
      <div class="blob blob-2" />
      <div class="blob blob-3" />
      <div class="blob blob-4" />
      <div class="grid-lines" />
    </div>

    <!-- ── Main content ── -->
    <div class="intro-layout">

      <!-- LEFT: Animation canvas -->
      <div class="anim-side" :class="{ visible: phase >= 0 }">
        <div class="canvas-wrap">
          <!-- Floating badge top -->
          <div class="canvas-badge" :class="{ visible: phase >= 0 }">
            <span class="badge-dot" />
            <span>Live preview</span>
          </div>
          <canvas ref="canvasEl" width="500" height="400" />
          <!-- Phase label -->
          <transition name="label-pop">
            <div v-if="phase === 0" class="anim-label chaos">
              <span class="label-dot red" /><span class="label-dot amber" /><span class="label-dot green" />
              <span>Before NovaOps</span>
            </div>
            <div v-else-if="phase >= 1" class="anim-label order">
              <span class="label-sparkle">✦</span>
              <span>Everything in its place</span>
            </div>
          </transition>
        </div>
      </div>

      <!-- RIGHT: Copy + features + CTA -->
      <div class="copy-side">

        <!-- Wordmark -->
        <div class="wordmark" :class="{ visible: phase >= 0 }">
          <div class="logo-mark" style="filter: drop-shadow(0 6px 20px rgba(253,67,114,0.35))">
            <svg class="logo-svg" viewBox="0 0 709 709" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="15"/><feGaussianBlur stdDeviation="7.55"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1260_273"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1260_273" result="shape"/>
                </filter>
                <filter id="filter3_d_1260_273" x="122.58" y="137.58" width="183.77" height="462.923" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="15"/><feGaussianBlur stdDeviation="7.55"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1260_273"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1260_273" result="shape"/>
                </filter>
                <linearGradient id="paint0_linear_1260_273" x1="0" y1="354.045" x2="708.089" y2="354.045" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#F9AA32"/><stop offset="0.2" stop-color="#F8774E"/><stop offset="0.410649" stop-color="#FD4372"/><stop offset="0.585" stop-color="#F95DA5"/><stop offset="0.8" stop-color="#F57DE4"/><stop offset="1" stop-color="#43B9FB"/>
                </linearGradient>
                <linearGradient id="paint1_linear_1260_273" x1="472.048" y1="570.401" x2="472.049" y2="137.68" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#009DDC"/><stop offset="1" stop-color="#3C9D51"/>
                </linearGradient>
                <linearGradient id="paint2_linear_1260_273" x1="216.356" y1="570.401" x2="216.357" y2="137.68" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#009DDC"/><stop offset="1" stop-color="#3C9D51"/>
                </linearGradient>
                <linearGradient id="paint3_linear_1260_273" x1="344.226" y1="570.401" x2="344.226" y2="137.68" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#009DDC"/><stop offset="1" stop-color="#3C9D51" stop-opacity="0.85"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-nova">Nova</span><span class="logo-ops">Ops</span>
          </div>
          <div class="logo-badge">Beta</div>
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

        <!-- Feature pills — 2 column grid, staggered in at phase 1 -->
        <div class="features" :class="{ visible: phase >= 1 }">
          <div
            v-for="(f, i) in features"
            :key="f.label"
            class="feature-pill"
            :style="{ transitionDelay: `${i * 70}ms` }"
          >
            <span class="pill-icon" :style="{ background: f.bg }">{{ f.icon }}</span>
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
            <span class="cta-shimmer" />
          </button>
          <p class="cta-hint">⚡ Takes about 60 seconds to set up</p>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const router   = useRouter()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const phase    = ref(-1)
const fadingOut = ref(false)

const features = [
  { icon: '🎫', label: 'Repair Tickets',      desc: 'Track every job start to finish',        bg: '#fef9c3' },
  { icon: '👥', label: 'Customer CRM',         desc: 'History, notes & contact in one tap',    bg: '#ede9fe' },
  { icon: '📦', label: 'Inventory & Services', desc: 'Parts, stock alerts & service catalog',  bg: '#dcfce7' },
  { icon: '💳', label: 'Square Payments',      desc: 'In-person & terminal checkout',           bg: '#dbeafe' },
  { icon: '📅', label: 'Calendar & Bookings',  desc: 'Appointments, house calls & scheduling', bg: '#fce7f3' },
  { icon: '📊', label: 'Analytics',            desc: 'Revenue, trends & performance',           bg: '#ffedd5' },
  { icon: '🔧', label: 'Vendor Repairs',       desc: 'Track send-outs & return dates',         bg: '#cffafe' },
  { icon: '📤', label: 'Import & Export',      desc: 'Bulk import from any POS system',        bg: '#f0fdf4' },
]

// ── Canvas ───────────────────────────────────────────────────────────────────

interface FilePaper {
  x: number; y: number
  tx: number; ty: number
  sx: number; sy: number; sr: number
  w: number; h: number
  rotation: number; tr: number
  color: string; accent: string; accentLight: string
  label: string; labelLine2: string
  stackIndex: number; settled: boolean
  wobblePhase: number
  vx: number; vy: number; vr: number
}

const STACKS = [
  { label: 'Tickets',   color: '#fffbeb', accent: '#f59e0b', accentLight: '#fef3c7', x: 105, y: 195 },
  { label: 'Customers', color: '#f5f3ff', accent: '#5b5ef4', accentLight: '#ede9fe', x: 250, y: 185 },
  { label: 'Inventory', color: '#f0fdf4', accent: '#10b981', accentLight: '#d1fae5', x: 395, y: 195 },
]

const FILE_LINES = [
  ['Device:', 'iPhone 14 Pro'], ['Cust:', 'Maria G.'], ['Status:', 'In Progress'],
  ['Part:', 'Screen LCD'],      ['Price:', '$129.00'],  ['Name:', 'Tom S.'],
  ['Due:', 'Today 3pm'],        ['Ref:', '#TK-2041'],   ['Stock:', '12 units'],
  ['Note:', 'Rush repair'],     ['Email:', 'j@shop.com'],['Model:', 'Galaxy S24'],
]

let papers: FilePaper[] = []
let animFrame = 0
let chaosPhase = true
let sortStartTime = 0
let raf = 0

function buildPapers(W: number, H: number) {
  papers = []
  const count = 18
  // Padding so papers never spawn outside canvas
  const pad = 50
  for (let i = 0; i < count; i++) {
    const si  = i % 3
    const st  = STACKS[si]
    const lines = FILE_LINES[i % FILE_LINES.length]

    const tx = pad + Math.random() * (W - pad * 2)
    const ty = pad + Math.random() * (H - pad * 2)
    const tr = (Math.random() - 0.5) * Math.PI * 1.5

    const idxInStack = Math.floor(i / 3)
    const sx = st.x + (Math.random() - 0.5) * 5
    const sy = st.y - idxInStack * 4
    const sr = (Math.random() - 0.5) * 0.12

    papers.push({
      x: tx, y: ty, tx, ty, sx, sy, sr,
      w: 76, h: 94,
      rotation: tr, tr,
      color: st.color, accent: st.accent, accentLight: st.accentLight,
      label: lines[0], labelLine2: lines[1],
      stackIndex: si, settled: false,
      wobblePhase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 2.2,
      vr: (Math.random() - 0.5) * 0.055,
    })
  }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3) }
function spring(t: number) {
  // Overshoot spring — lands with a small bounce
  const c4 = (2 * Math.PI) / 3
  if (t === 0) return 0
  if (t === 1) return 1
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function drawPaper(ctx: CanvasRenderingContext2D, p: FilePaper, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)

  const { w, h } = p
  const r = 8

  // Soft shadow
  ctx.shadowColor = `${p.accent}30`
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 5

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

  // Thin border
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
  ctx.strokeStyle = `${p.accent}25`
  ctx.lineWidth = 1
  ctx.stroke()

  // Accent top bar
  ctx.beginPath()
  ctx.moveTo(-w/2 + r, -h/2)
  ctx.lineTo(w/2 - r, -h/2)
  ctx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r)
  ctx.lineTo(w/2, -h/2 + 20)
  ctx.lineTo(-w/2, -h/2 + 20)
  ctx.lineTo(-w/2, -h/2 + r)
  ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2)
  ctx.closePath()
  ctx.fillStyle = p.accentLight
  ctx.fill()

  // Label line 1 (bold key)
  ctx.fillStyle = p.accent
  ctx.font = 'bold 7.5px system-ui, sans-serif'
  ctx.fillText(p.label, -w/2 + 8, -h/2 + 32)

  // Label line 2 (value)
  ctx.fillStyle = 'rgba(30,30,30,0.65)'
  ctx.font = '7px system-ui, sans-serif'
  ctx.fillText(p.labelLine2, -w/2 + 8, -h/2 + 43)

  // Simulated text lines
  const lineColors = [`${p.accent}30`, `${p.accent}22`, `${p.accent}18`, `${p.accent}14`]
  for (let i = 0; i < 4; i++) {
    const lw = (0.45 + Math.random() * 0.3) * (w - 18)
    ctx.fillStyle = lineColors[i]
    ctx.beginPath()
    ctx.roundRect(-w/2 + 8, -h/2 + 54 + i * 10, lw, 4.5, 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawStackBase(ctx: CanvasRenderingContext2D, st: typeof STACKS[0], show: boolean) {
  if (!show) return
  ctx.save()

  // Glow shadow under stack
  ctx.shadowColor = `${st.accent}40`
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 4
  ctx.fillStyle = `${st.accent}20`
  ctx.beginPath()
  ctx.ellipse(st.x, st.y + 52, 42, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

  // Label pill
  const lw = 72
  ctx.fillStyle = `${st.accent}18`
  ctx.strokeStyle = `${st.accent}40`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(st.x - lw/2, st.y + 60, lw, 20, 10)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = st.accent
  ctx.font = 'bold 9px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(st.label, st.x, st.y + 74)

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
    for (const p of papers) {
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vr

      // Bounce off walls with margin so papers never clip
      const mx = p.w / 2 + 8, my = p.h / 2 + 8
      if (p.x < mx)     { p.x = mx;     p.vx = Math.abs(p.vx) }
      if (p.x > W - mx) { p.x = W - mx; p.vx = -Math.abs(p.vx) }
      if (p.y < my)     { p.y = my;     p.vy = Math.abs(p.vy) }
      if (p.y > H - my) { p.y = H - my; p.vy = -Math.abs(p.vy) }

      p.y += Math.sin(animFrame * 0.018 + p.wobblePhase) * 0.25
      drawPaper(ctx, p)
    }
  } else {
    const elapsed = now - sortStartTime
    const sortedPapers = [...papers].sort(
      (a, b) => a.stackIndex - b.stackIndex || papers.indexOf(a) - papers.indexOf(b)
    )

    // Draw stack bases once first paper in each stack has started moving
    for (let si = 0; si < STACKS.length; si++) {
      const stackPapers = sortedPapers.filter(p => p.stackIndex === si)
      const delay = sortedPapers.indexOf(stackPapers[0]) * 110
      drawStackBase(ctx, STACKS[si], elapsed > delay + 300)
    }

    for (let i = 0; i < sortedPapers.length; i++) {
      const p = sortedPapers[i]
      const delay = i * 110
      const dur   = 650
      const t     = Math.max(0, Math.min(1, (elapsed - delay) / dur))
      const et    = spring(t)

      if (t <= 0) {
        // Still drifting — keep moving but slow down
        p.x += p.vx * 0.2
        p.y += p.vy * 0.2
        p.rotation += p.vr * 0.2
        // Stay in bounds
        const mx = p.w / 2 + 8, my = p.h / 2 + 8
        p.x = Math.max(mx, Math.min(W - mx, p.x))
        p.y = Math.max(my, Math.min(H - my, p.y))
      } else {
        p.x        = lerp(p.tx, p.sx, et)
        p.y        = lerp(p.ty, p.sy, et)
        p.rotation = lerp(p.tr, p.sr, et)
        if (t >= 1) p.settled = true
      }

      drawPaper(ctx, p, t <= 0 ? 0.85 : 0.95)
    }
  }

  raf = requestAnimationFrame(tick)
}

function startIntro() {
  const canvas = canvasEl.value
  if (!canvas) return
  buildPapers(canvas.width, canvas.height)
  setTimeout(() => { phase.value = 0 }, 100)
  setTimeout(() => { chaosPhase = false; sortStartTime = performance.now() }, 2600)
  setTimeout(() => { phase.value = 1 }, 4400)
  setTimeout(() => { phase.value = 2 }, 5800)
  raf = requestAnimationFrame(tick)
}

function handleLetsGo() {
  fadingOut.value = true
  setTimeout(() => {
    cancelAnimationFrame(raf)
    const route = useRoute()
    const dest = route.query.from === 'register' ? '/profile-setup' : '/login'
    router.push(dest)
  }, 600)
}

onUnmounted(() => cancelAnimationFrame(raf))
</script>

<style scoped>
/* ── Root ── */
.intro-root {
  position: fixed; inset: 0;
  background: #f8f7ff;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.intro-root.fade-out { opacity: 0; pointer-events: none; }

/* ── Ambient background ── */
.ambient-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

.blob {
  position: absolute; border-radius: 50%;
  filter: blur(90px);
}
.blob-1 {
  width: 560px; height: 560px; top: -180px; left: -140px;
  background: radial-gradient(circle, #c7d2fe 0%, transparent 70%);
  opacity: 0.7;
  animation: blobDrift1 20s ease-in-out infinite alternate;
}
.blob-2 {
  width: 480px; height: 480px; bottom: -160px; right: -120px;
  background: radial-gradient(circle, #a7f3d0 0%, transparent 70%);
  opacity: 0.6;
  animation: blobDrift2 24s ease-in-out infinite alternate;
}
.blob-3 {
  width: 360px; height: 360px; top: 40%; left: 35%;
  background: radial-gradient(circle, #fde68a 0%, transparent 70%);
  opacity: 0.45;
  animation: blobDrift3 16s ease-in-out infinite alternate;
}
.blob-4 {
  width: 280px; height: 280px; top: 10%; right: 20%;
  background: radial-gradient(circle, #fbcfe8 0%, transparent 70%);
  opacity: 0.5;
  animation: blobDrift4 18s ease-in-out infinite alternate;
}

@keyframes blobDrift1 { from { transform: translate(0,0) scale(1) } to { transform: translate(50px, 40px) scale(1.08) } }
@keyframes blobDrift2 { from { transform: translate(0,0) scale(1) } to { transform: translate(-40px,-50px) scale(1.06) } }
@keyframes blobDrift3 { from { transform: translate(0,0) scale(1) } to { transform: translate(30px, -30px) scale(1.1) } }
@keyframes blobDrift4 { from { transform: translate(0,0) scale(1) } to { transform: translate(-20px, 25px) scale(0.95) } }

.grid-lines {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ── Layout ── */
.intro-layout {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 56px;
  max-width: 1080px; width: 100%; padding: 40px;
}

/* ── Animation side ── */
.anim-side {
  flex-shrink: 0;
  opacity: 0; transform: translateX(-28px) scale(0.97);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.anim-side.visible { opacity: 1; transform: translateX(0) scale(1); }

.canvas-wrap {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 18px 18px 22px;
  box-shadow:
    0 2px 0 rgba(99,102,241,0.08),
    0 8px 24px rgba(99,102,241,0.1),
    0 32px 80px rgba(99,102,241,0.12),
    inset 0 1px 0 rgba(255,255,255,0.9);
  outline: 1.5px solid rgba(99,102,241,0.12);
}

.canvas-wrap canvas {
  display: block;
  border-radius: 20px;
  background: #fafafa;
  outline: 1px solid rgba(0,0,0,0.04);
}

/* Floating badge */
.canvas-badge {
  position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 100px;
  background: white;
  box-shadow: 0 2px 12px rgba(99,102,241,0.15);
  outline: 1px solid rgba(99,102,241,0.15);
  font-size: 11px; font-weight: 700; color: #5b5ef4;
  white-space: nowrap;
  opacity: 0; transform: translateX(-50%) translateY(6px);
  transition: opacity 0.5s ease 0.3s, transform 0.5s cubic-bezier(0.34,1.4,0.64,1) 0.3s;
}
.canvas-badge.visible { opacity: 1; transform: translateX(-50%) translateY(0); }

.badge-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px #d1fae5;
  animation: pulseDot 2s ease-in-out infinite;
}
@keyframes pulseDot {
  0%, 100% { box-shadow: 0 0 0 2px #d1fae5; }
  50%       { box-shadow: 0 0 0 4px #a7f3d0; }
}

/* Phase label */
.anim-label {
  position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 7px;
  padding: 6px 16px; border-radius: 100px;
  font-size: 11.5px; font-weight: 700; white-space: nowrap;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.anim-label.chaos {
  background: #fef9c3;
  color: #92400e;
  outline: 1px solid #fde68a;
}
.anim-label.order {
  background: #d1fae5;
  color: #065f46;
  outline: 1px solid #6ee7b7;
}
.label-dot { width: 7px; height: 7px; border-radius: 50%; }
.label-dot.red    { background: #f87171; }
.label-dot.amber  { background: #fbbf24; }
.label-dot.green  { background: #34d399; }
.label-sparkle { font-size: 11px; }

/* Label transition — pop up from below, no clipping */
.label-pop-enter-active { transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.5,0.64,1); }
.label-pop-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.label-pop-enter-from   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.92); }
.label-pop-leave-to     { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.95); }

/* ── Copy side ── */
.copy-side {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 28px;
}

/* Wordmark */
.wordmark {
  display: flex; align-items: center; gap: 11px;
  opacity: 0; transform: translateY(-14px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.3,0.64,1);
}
.wordmark.visible { opacity: 1; transform: translateY(0); }

.logo-mark {
  width: 46px; height: 46px;
  display: flex; align-items: center; justify-content: center;
}
.logo-svg { width: 46px; height: 46px; }

.logo-text { font-size: 21px; font-weight: 900; letter-spacing: -0.6px; }
.logo-nova { color: #1e1b4b; }
.logo-ops  { color: #a5b4fc; }

.logo-badge {
  padding: 2px 8px; border-radius: 100px;
  font-size: 9px; font-weight: 800; letter-spacing: 0.06em;
  background: #ede9fe; color: #5b5ef4;
  text-transform: uppercase;
  outline: 1px solid #c7d2fe;
}

/* Headline */
.headline-wrap {
  opacity: 0; transform: translateY(18px);
  transition: opacity 0.7s ease 0.12s, transform 0.7s cubic-bezier(0.34,1.1,0.64,1) 0.12s;
}
.headline-wrap.visible { opacity: 1; transform: translateY(0); }

.headline {
  display: flex; flex-direction: column; gap: 2px;
  font-size: clamp(26px, 3.2vw, 40px);
  font-weight: 900; line-height: 1.1; letter-spacing: -1.2px;
  color: #1e1b4b; margin: 0 0 12px;
}
.headline-line { display: block; }
.headline-line.accent {
  background: linear-gradient(90deg, #5b5ef4, #8b5cf6, #06b6d4);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% auto;
  animation: gradientFlow 5s ease infinite;
}
@keyframes gradientFlow {
  0%   { background-position: 0% center; }
  50%  { background-position: 100% center; }
  100% { background-position: 0% center; }
}

.subhead {
  font-size: 14.5px; line-height: 1.65; color: #6b7280;
  font-weight: 450; margin: 0;
}

/* Features grid */
.features {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px;
  opacity: 0; transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.features.visible { opacity: 1; transform: translateY(0); }

.feature-pill {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 13px; border-radius: 16px;
  background: white;
  outline: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  opacity: 0; transform: translateY(10px) scale(0.97);
  transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.34,1.4,0.64,1);
  cursor: default;
}
.features.visible .feature-pill {
  opacity: 1; transform: translateY(0) scale(1);
}
.feature-pill:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 4px 16px rgba(99,102,241,0.1) !important;
  transition: transform 0.25s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.25s ease !important;
}

.pill-icon {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
}
.pill-label { font-size: 12px; font-weight: 700; color: #1e1b4b; line-height: 1.2; }
.pill-desc  { font-size: 10.5px; color: #9ca3af; margin-top: 1px; line-height: 1.3; }

/* CTA */
.cta-wrap {
  display: flex; flex-direction: column; gap: 9px;
  opacity: 0; transform: translateY(14px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.3,0.64,1);
}
.cta-wrap.visible { opacity: 1; transform: translateY(0); }

.cta-btn {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; gap: 10px;
  padding: 0 34px; height: 58px; border-radius: 100px;
  border: none; cursor: pointer;
  background: linear-gradient(135deg, #5b5ef4 0%, #8b5cf6 50%, #06b6d4 100%);
  background-size: 200% auto;
  box-shadow: 0 6px 24px rgba(99,102,241,0.35), 0 2px 0 rgba(255,255,255,0.2) inset;
  transition: transform 0.25s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.25s ease, background-position 0.5s ease;
  animation: ctaFloat 3.5s ease-in-out infinite;
  width: fit-content;
}
.cta-btn:hover {
  transform: scale(1.05) translateY(-3px);
  box-shadow: 0 14px 40px rgba(99,102,241,0.45), 0 0 0 5px rgba(99,102,241,0.12);
  background-position: right center;
}
.cta-btn:active { transform: scale(0.97); transition-duration: 0.1s; }

@keyframes ctaFloat {
  0%, 100% { box-shadow: 0 6px 24px rgba(99,102,241,0.35); }
  50%       { box-shadow: 0 10px 36px rgba(99,102,241,0.5), 0 0 0 6px rgba(99,102,241,0.08); }
}

.cta-text {
  font-size: 15.5px; font-weight: 800; color: white; letter-spacing: -0.2px;
  position: relative; z-index: 1;
}
.cta-arrow {
  font-size: 19px; color: rgba(255,255,255,0.85);
  position: relative; z-index: 1;
  transition: transform 0.3s cubic-bezier(0.34,1.5,0.64,1);
}
.cta-btn:hover .cta-arrow { transform: translateX(5px); }

.cta-shimmer {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
  transform: translateX(-100%);
  animation: shimmer 2.8s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  55%  { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}

.cta-hint {
  font-size: 12px; color: #9ca3af;
  margin: 0; padding-left: 4px; font-weight: 500;
}

/* ── Responsive ── */
@media (max-width: 840px) {
  .intro-root {
    position: fixed; inset: 0;
    overflow-y: auto; overflow-x: hidden;
    align-items: flex-start;
  }
  .intro-layout {
    flex-direction: column;
    gap: 24px; padding: 28px 20px 48px;
    align-items: stretch;
    min-height: 100%;
  }
  .anim-side { width: 100%; order: 2; }
  .copy-side { order: 1; }
  .canvas-wrap { padding: 14px 14px 20px; }
  .canvas-wrap canvas { width: 100%; height: auto; max-height: 280px; object-fit: contain; }
  .features { grid-template-columns: 1fr; gap: 6px; }
  .headline { font-size: clamp(24px, 6vw, 32px); }
  .cta-btn { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .intro-layout { padding: 20px 16px 40px; gap: 20px; }
  .canvas-badge { font-size: 10px; }
  .wordmark { gap: 9px; }
  .logo-nova, .logo-ops { font-size: 18px; }
}
</style>
