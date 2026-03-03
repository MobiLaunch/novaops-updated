<template>
  <div
    v-if="isElectron"
    class="electron-titlebar"
    :class="{ 'is-maximized': isMaximized, 'is-fullscreen': isFullscreen }"
    style="-webkit-app-region: drag"
  >
    <!-- Left: identity -->
    <div class="tb-identity" style="-webkit-app-region: no-drag">
      <div class="tb-logo">
        <svg class="w-4 h-4 object-contain" viewBox="0 0 709 709" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </svg>
      </div>
      <span class="tb-title">NovaOps</span>
    </div>

    <!-- Center: current route pill -->
    <div class="tb-breadcrumb">
      <div v-if="currentNav" class="tb-route-pill">
        <div class="tb-route-icon" :style="`background:${currentNav.color}22`">
          <!-- Inline SVG icons — avoids <component :is> which triggers renderer$1 hoisting bug in Vite -->
          <svg v-if="currentNav.key === 'dashboard'" width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <svg v-else-if="currentNav.key === 'tickets'" width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="m9 12 2 2 4-4"/></svg>
          <svg v-else-if="currentNav.key === 'customers'" width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <svg v-else-if="currentNav.key === 'inventory'" width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/><path d="M3 6v12l9 5 9-5V6l-9-5Z"/></svg>
          <svg v-else-if="currentNav.key === 'calendar'" width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <svg v-else-if="currentNav.key === 'pos'" width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <svg v-else-if="currentNav.key === 'analytics'" width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <svg v-else-if="currentNav.key === 'settings'" width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <!-- Default fallback dot -->
          <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" :stroke="currentNav.color" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>
        </div>
        <span class="tb-route-name">{{ currentNav.name }}</span>
      </div>
    </div>

    <!-- Right: window controls -->
    <div class="tb-controls" style="-webkit-app-region: no-drag">

      <!-- Fullscreen toggle -->
      <button class="tb-btn tb-btn--ghost" :title="isFullscreen ? 'Exit Full Screen' : 'Full Screen'" @click="toggleFullscreen">
        <svg v-if="!isFullscreen" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 4V1h3M6 1h3v3M9 6v3H6M4 9H1V6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M3.5 1v2.5H1M9 3.5H6.5V1M1 6.5h2.5V9M6.5 9V6.5H9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Minimize -->
      <button class="tb-btn tb-btn--minimize" title="Minimize" @click="minimize">
        <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
          <path d="M1 1h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Maximize / Restore -->
      <button class="tb-btn tb-btn--maximize" :title="isMaximized ? 'Restore' : 'Maximize'" @click="maximizeToggle">
        <svg v-if="!isMaximized" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1" y="1" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.4"/>
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="3" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M1 3v5.5A1.5 1.5 0 0 0 2.5 10H7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Close -->
      <button class="tb-btn tb-btn--close" title="Close" @click="closeWindow">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const isElectron  = ref(false)
const isMaximized = ref(false)
const isFullscreen = ref(false)

onMounted(async () => {
  const api = (window as any).electronAPI
  if (!api) return
  isElectron.value  = true
  isMaximized.value  = await api.isMaximized()
  isFullscreen.value = await api.isFullscreen()
  api.onMaximizedChange((v: boolean)  => { isMaximized.value  = v })
  api.onFullscreenChange((v: boolean) => { isFullscreen.value = v })
})

onUnmounted(() => {
  const api = (window as any).electronAPI
  if (api) {
    api.removeAllListeners('window:maximized-change')
    api.removeAllListeners('window:fullscreen-change')
  }
})

const minimize        = () => (window as any).electronAPI?.minimize()
const maximizeToggle  = () => (window as any).electronAPI?.maximizeToggle()
const closeWindow     = () => (window as any).electronAPI?.close()
const toggleFullscreen = () => (window as any).electronAPI?.toggleFullscreen()

// Route → nav metadata
// Using a plain string key instead of a component ref to avoid
// the Vite ESM hoisting bug (renderer$1 before initialization)
const navMap: Record<string, { key: string; name: string; color: string }> = {
  '/dashboard':        { key: 'dashboard',  name: 'Dashboard',     color: '#6366f1' },
  '/bookings':         { key: 'tickets',    name: 'Bookings',      color: '#f59e0b' },
  '/customers':        { key: 'customers',  name: 'Customers',     color: '#3b82f6' },
  '/inventory':        { key: 'inventory',  name: 'Inventory',     color: '#f59e0b' },
  '/calendar':         { key: 'calendar',   name: 'Calendar',      color: '#06b6d4' },
  '/pos':              { key: 'pos',        name: 'Point of Sale', color: '#ec4899' },
  '/forms':            { key: 'dot',        name: 'Forms',         color: '#10b981' },
  '/services':         { key: 'dot',        name: 'Services',   color: '#22d3ee' },
  '/analytics':        { key: 'analytics',  name: 'Analytics',     color: '#10b981' },
  '/messages':         { key: 'dot',        name: 'Messages',      color: '#ec4899' },
  '/display':          { key: 'dot',        name: 'Customer Display', color: '#06b6d4' },
  '/barcodes':         { key: 'dot',        name: 'Barcodes',      color: '#06b6d4' },
  '/import':           { key: 'dot',        name: 'Import',        color: '#8b5cf6' },
  
  
  '/website-settings': { key: 'dot',        name: 'Brand Manager', color: '#3b82f6' },
  '/settings':         { key: 'settings',   name: 'Settings',      color: '#64748b' },
}

const currentNav = computed(() => navMap[route.path] ?? null)
</script>

<style scoped>
.electron-titlebar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 9999;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 6px 0 16px;
  background: hsl(var(--card) / 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 0 hsl(var(--border) / 0.4);
  user-select: none;
  transition: transform 0.25s ease;
}

.tb-identity {
  display: flex; align-items: center; gap: 7px; flex-shrink: 0;
}
.tb-logo {
  width: 22px; height: 22px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 2px 8px #6366f140; flex-shrink: 0;
}
.tb-title {
  font-size: 11.5px; font-weight: 800; letter-spacing: 0.01em;
  color: hsl(var(--foreground)); opacity: 0.85;
}

.tb-breadcrumb {
  flex: 1; display: flex; justify-content: center; align-items: center;
  pointer-events: none;
}
.tb-route-pill {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 10px 3px 5px; border-radius: 20px;
  background: hsl(var(--muted) / 0.6);
  border: 1px solid hsl(var(--border) / 0.5);
  animation: pillSlideIn 0.25s cubic-bezier(0.34,1.3,0.64,1) both;
}
@keyframes pillSlideIn {
  from { transform: scale(0.88) translateY(-3px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}
.tb-route-icon {
  width: 18px; height: 18px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tb-route-name {
  font-size: 11px; font-weight: 700;
  color: hsl(var(--foreground)); opacity: 0.8; white-space: nowrap;
}

.tb-controls {
  display: flex; align-items: center; gap: 2px; flex-shrink: 0;
}
.tb-btn {
  width: 28px; height: 24px; border-radius: 10px; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: hsl(var(--muted-foreground)); background: transparent;
  transition: background 0.18s ease, color 0.18s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  outline: none; flex-shrink: 0;
}
.tb-btn:hover  { transform: scale(1.12); }
.tb-btn:active { transform: scale(0.88); }
.tb-btn--ghost:hover    { background: hsl(var(--muted) / 0.7); color: hsl(var(--foreground)); }
.tb-btn--minimize:hover { background: #6366f118; color: #6366f1; }
.tb-btn--maximize:hover { background: #06b6d418; color: #06b6d4; }
.tb-btn--close:hover    { background: #ef4444; color: white; box-shadow: 0 2px 8px #ef444430; }

.electron-titlebar.is-fullscreen { transform: translateY(-100%); }
.electron-titlebar.is-fullscreen:hover { transform: translateY(0); }

:global(.dark) .electron-titlebar {
  background: hsl(var(--card) / 0.85);
}
</style>
