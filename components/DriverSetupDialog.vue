<template>
  <Teleport to="body">
    <Transition name="dsd-fade">
      <div v-if="modelValue" class="dsd-overlay" @click.self="close">
        <div class="dsd-panel">

          <!-- ── Header ─────────────────────────────────────────────── -->
          <div class="dsd-header">
            <div class="dsd-header-icon">
              <HardDrive class="w-5 h-5" style="color:#4ade80" />
            </div>
            <div style="flex:1">
              <h2 class="dsd-title">Driver &amp; Tool Setup</h2>
              <p class="dsd-subtitle">Install required tools for USB device detection</p>
            </div>
            <button class="dsd-close-btn" @click="close">✕</button>
          </div>

          <!-- ── OS tabs ────────────────────────────────────────────── -->
          <div class="dsd-os-tabs">
            <button
              v-for="os in osList" :key="os.id"
              class="dsd-os-tab" :class="{ active: activeOS === os.id }"
              @click="switchOS(os.id)"
            >
              <component :is="os.icon" class="w-3.5 h-3.5" />
              {{ os.label }}
            </button>
          </div>

          <!-- ── UAC / Admin banner ──────────────────────────────── -->
          <Transition name="dsd-bar">
            <div v-if="needsAdmin && activeOS === 'windows'" class="dsd-uac-banner">
              <div class="dsd-uac-icon">
                <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                  <circle cx="10" cy="10" r="9" fill="#f59e0b18" stroke="#f59e0b" stroke-width="1.5"/>
                  <path d="M10 6v5M10 13v.5" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <div style="flex:1;min-width:0">
                <p class="dsd-uac-title">Administrator privileges required</p>
                <p class="dsd-uac-body">
                  <code>winget</code> needs admin rights to install system-wide tools.
                  Click <strong>Relaunch as Admin</strong> — Windows will show a UAC prompt, then the app restarts elevated and you can install normally.
                </p>
              </div>
              <button class="dsd-uac-btn" :disabled="relaunching" @click="relaunchAsAdmin">
                <svg v-if="relaunching" class="dsd-spin" viewBox="0 0 20 20" fill="none" width="14" height="14">
                  <circle cx="10" cy="10" r="8" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="32 20" stroke-linecap="round"/>
                </svg>
                <svg v-else viewBox="0 0 20 20" fill="none" width="14" height="14">
                  <path d="M10 3l3 3-3 3M13 6H7a4 4 0 000 8h6" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ relaunching ? 'Relaunching…' : 'Relaunch as Admin' }}
              </button>
            </div>
          </Transition>

          <!-- ── Tool rows ──────────────────────────────────────────── -->
          <div class="dsd-tool-list">
            <div
              v-for="tool in visibleTools" :key="tool.id"
              class="dsd-tool-row" :class="tool.status"
            >
              <!-- Status icon -->
              <div class="dsd-status-wrap">
                <svg v-if="tool.status === 'installed'" viewBox="0 0 20 20" fill="none" width="20" height="20">
                  <circle cx="10" cy="10" r="9" fill="#10b98120" stroke="#10b981" stroke-width="1.5"/>
                  <path d="M6 10l2.8 2.8L14 7.5" stroke="#10b981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="tool.status === 'checking' || tool.status === 'installing'" class="dsd-spin" viewBox="0 0 20 20" fill="none" width="20" height="20">
                  <circle cx="10" cy="10" r="8" :stroke="tool.status === 'installing' ? '#f59e0b' : '#5b5ef4'" stroke-width="2.5" stroke-dasharray="32 20" stroke-linecap="round"/>
                </svg>
                <svg v-else-if="tool.status === 'failed'" viewBox="0 0 20 20" fill="none" width="20" height="20">
                  <circle cx="10" cy="10" r="9" fill="#ef444418" stroke="#ef4444" stroke-width="1.5"/>
                  <path d="M7 7l6 6M13 7l-6 6" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                <svg v-else viewBox="0 0 20 20" fill="none" width="20" height="20">
                  <circle cx="10" cy="10" r="9" stroke="#334155" stroke-width="1.5"/>
                  <path d="M10 7v4M10 13v.5" stroke="#475569" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>

              <!-- Info -->
              <div class="dsd-tool-info">
                <div class="dsd-name-row">
                  <span class="dsd-tool-name">{{ tool.name }}</span>
                  <span class="dsd-badge" :class="`badge-${tool.status}`">{{ badgeLabel(tool.status) }}</span>
                </div>
                <p class="dsd-tool-desc">{{ tool.desc }}</p>
                <p v-if="tool.status === 'failed' && tool.error" class="dsd-tool-error">⚠ {{ tool.error }}</p>

                <!-- Manual install hint (auto-install unavailable or failed) -->
                <div v-if="tool.status === 'failed' || (tool.status === 'missing' && !tool.autoInstall)" class="dsd-manual">
                  <span class="dsd-manual-label">Manual:</span>
                  <a class="dsd-manual-link" @click.prevent="openUrl(tool.url)">{{ tool.url }}</a>
                  <span v-if="tool.cmd" class="dsd-cmd-row">
                    <code class="dsd-cmd">{{ tool.cmd }}</code>
                    <button class="dsd-copy-btn" :class="{ copied: copiedCmd === tool.cmd }" @click="copyCmd(tool.cmd)" title="Copy">
                      <span v-if="copiedCmd === tool.cmd" style="font-size:10px">✓</span>
                      <svg v-else viewBox="0 0 14 14" fill="none" width="10" height="10">
                        <rect x="1" y="4" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
                        <path d="M4 4V2.5A1.5 1.5 0 015.5 1h6A1.5 1.5 0 0113 2.5v6A1.5 1.5 0 0111.5 10H10" stroke="currentColor" stroke-width="1.3"/>
                      </svg>
                    </button>
                  </span>
                </div>
                <!-- Local drop-in hint — always shown for tools that support it -->
                <div v-if="tool.status === 'failed' || tool.status === 'missing'" class="dsd-local-hint">
                  <svg viewBox="0 0 14 14" fill="none" width="11" height="11" style="flex-shrink:0;color:#4ade80">
                    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Or drop the binary into <code class="dsd-cmd" style="font-size:9.5px">drivers/{{ activeOS }}/</code> — see <a class="dsd-manual-link" @click.prevent="openUrl('https://github.com/novaops')">drivers/README.md</a></span>
                </div>
              </div>

              <!-- Per-row action -->
              <div class="dsd-row-action">
                <button v-if="tool.status === 'missing' && tool.autoInstall"   class="dsd-act-btn install" @click="installOne(tool)"><Download class="w-3 h-3"/> Install</button>
                <button v-else-if="tool.status === 'missing' && !tool.autoInstall" class="dsd-act-btn guide"   @click="openUrl(tool.url)"><ExternalLink class="w-3 h-3"/> Guide</button>
                <button v-else-if="tool.status === 'failed'"                    class="dsd-act-btn retry"   @click="installOne(tool)"><RefreshCw class="w-3 h-3"/> Retry</button>
              </div>
            </div>

            <!-- Empty state if no tools for this OS -->
            <div v-if="visibleTools.length === 0" class="dsd-empty">
              No tools required for this OS/platform combination.
            </div>
          </div>

          <!-- ── Progress bar ───────────────────────────────────────── -->
          <Transition name="dsd-bar">
            <div v-if="globalProgress > 0" class="dsd-progress-wrap">
              <div class="dsd-progress-track">
                <div class="dsd-progress-fill" :style="{ width: globalProgress + '%' }" />
              </div>
              <p class="dsd-progress-label">{{ progressMsg }}</p>
            </div>
          </Transition>

          <!-- ── Footer ─────────────────────────────────────────────── -->
          <div class="dsd-footer">
            <div class="dsd-footer-left">
              <span v-if="allDone"     class="dsd-status-good"><CheckCircle class="w-3.5 h-3.5"/> All tools ready</span>
              <span v-else-if="missingCount" class="dsd-status-warn">{{ missingCount }} tool{{ missingCount > 1 ? 's' : '' }} missing</span>
            </div>
            <div class="dsd-footer-right">
              <button v-if="canInstallAll" class="dsd-btn primary"    :disabled="isBusy" @click="installAll"><Download class="w-3.5 h-3.5"/> Install All</button>
              <button                       class="dsd-btn secondary"  :disabled="isBusy" @click="checkAll"><RefreshCw class="w-3.5 h-3.5"/> Re-check</button>
              <button v-if="allDone"        class="dsd-btn done"                          @click="close(); $emit('done')">Done</button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { HardDrive, Download, RefreshCw, ExternalLink, CheckCircle, Monitor, Laptop, Smartphone } from 'lucide-vue-next'

type ToolStatus = 'idle' | 'checking' | 'installed' | 'missing' | 'installing' | 'failed'
type OSId = 'windows' | 'macos' | 'linux'

interface ToolDef {
  id:          string
  name:        string
  desc:        string
  url:         string
  cmd?:        string
  autoInstall: boolean
  os:          OSId[]
  status:      ToolStatus
  error?:      string
}

const props = defineProps<{ modelValue: boolean }>()
const emit  = defineEmits(['update:modelValue', 'done'])

// ── OS list ────────────────────────────────────────────────────────────────
const osList = [
  { id: 'windows' as OSId, label: 'Windows', icon: Monitor   },
  { id: 'macos'   as OSId, label: 'macOS',   icon: Laptop    },
  { id: 'linux'   as OSId, label: 'Linux',   icon: Smartphone },
]
const activeOS = ref<OSId>('windows')

async function detectHostOS() {
  try {
    const p: string = await (window as any).electronAPI?.platform?.() ?? navigator.platform ?? ''
    if      (p.startsWith('darwin')) activeOS.value = 'macos'
    else if (p.startsWith('linux'))  activeOS.value = 'linux'
    else                             activeOS.value = 'windows'
  } catch { activeOS.value = 'windows' }
}

function switchOS(id: OSId) { activeOS.value = id; checkAdminStatus(); checkAll() }

// ── Tool definitions ───────────────────────────────────────────────────────
const tools = ref<ToolDef[]>([
  // Android / Chromebook
  {
    id: 'adb', name: 'Android Debug Bridge (ADB)',
    desc: 'Required for Android and Chromebook USB detection, diagnostics, backups, and software updates.',
    url: 'https://developer.android.com/studio/releases/platform-tools',
    cmd: 'winget install Google.PlatformTools',
    autoInstall: true,
    os: ['windows', 'macos', 'linux'],
    status: 'idle',
  },
  {
    id: 'android-usb-driver', name: 'Android OEM USB Driver (Windows)',
    desc: "Windows needs a manufacturer USB driver to see Android devices in ADB. Each phone brand has its own. Visit your device maker's support page or use the Android Device Manager.",
    url: 'https://developer.android.com/studio/run/oem-usb',
    autoInstall: false,
    os: ['windows'],
    status: 'idle',
  },
  // iOS — Windows
  {
    id: 'libimobiledevice-win', name: 'libimobiledevice (Windows)',
    desc: 'Enables iOS/iPadOS USB detection, idevice_id, ideviceinfo, and idevicebackup2 on Windows.',
    url: 'https://github.com/libimobiledevice-win32/imobiledevice-net',
    cmd: 'winget install libimobiledevice.libimobiledevice',
    autoInstall: true,
    os: ['windows'],
    status: 'idle',
  },
  {
    id: 'itunes-drivers', name: 'Apple Mobile Device Support (iTunes)',
    desc: 'Installs the Apple USB driver on Windows so iOS devices are recognized. Install iTunes from the Microsoft Store to get these drivers.',
    url: 'https://apps.microsoft.com/detail/9pb2mz1zmb8c',
    cmd: 'winget install Apple.iTunes',
    autoInstall: true,
    os: ['windows'],
    status: 'idle',
  },
  // iOS — macOS
  {
    id: 'libimobiledevice', name: 'libimobiledevice',
    desc: 'Open-source library for communicating with iOS/iPadOS devices. Provides idevice_id, ideviceinfo, and idevicebackup2.',
    url: 'https://libimobiledevice.org',
    cmd: 'brew install libimobiledevice',
    autoInstall: true,
    os: ['macos'],
    status: 'idle',
  },
  {
    id: 'usbmuxd-mac', name: 'usbmuxd',
    desc: 'USB multiplexer daemon that manages iOS USB connections on macOS.',
    url: 'https://libimobiledevice.org',
    cmd: 'brew install usbmuxd',
    autoInstall: true,
    os: ['macos'],
    status: 'idle',
  },
  // iOS — Linux
  {
    id: 'libimobiledevice-linux', name: 'libimobiledevice-utils',
    desc: 'Provides idevice_id and related iOS tools. Install via your package manager.',
    url: 'https://libimobiledevice.org',
    cmd: 'sudo apt install libimobiledevice-utils usbmuxd',
    autoInstall: true,
    os: ['linux'],
    status: 'idle',
  },
])

const visibleTools = computed(() => tools.value.filter(t => t.os.includes(activeOS.value)))
const allDone       = computed(() => visibleTools.value.length > 0 && visibleTools.value.every(t => t.status === 'installed' || (!t.autoInstall && t.status !== 'failed')))
const missingCount  = computed(() => visibleTools.value.filter(t => t.status === 'missing' || t.status === 'failed').length)
const canInstallAll = computed(() => visibleTools.value.some(t => (t.status === 'missing' || t.status === 'failed') && t.autoInstall))
const isBusy        = computed(() => visibleTools.value.some(t => t.status === 'checking' || t.status === 'installing'))

// ── Progress ───────────────────────────────────────────────────────────────
const globalProgress = ref(0)
const progressMsg    = ref('')
let   clearTimer: ReturnType<typeof setTimeout> | null = null

function setProgress(pct: number, msg: string) {
  if (clearTimer) { clearTimeout(clearTimer); clearTimer = null }
  globalProgress.value = pct
  progressMsg.value    = msg
}
function doneProgress(msg: string) {
  setProgress(100, msg)
  clearTimer = setTimeout(() => { globalProgress.value = 0; progressMsg.value = '' }, 2200)
}

// ── Badge label ────────────────────────────────────────────────────────────
function badgeLabel(s: ToolStatus) {
  return ({ idle: 'Not checked', checking: 'Checking…', installed: 'Installed',
            missing: 'Not found', installing: 'Installing…', failed: 'Failed' } as any)[s] ?? s
}

// ── IPC ────────────────────────────────────────────────────────────────────
async function ipcCheckTool(id: string): Promise<boolean> {
  try { return (await Promise.resolve(false)) === true } catch { return false }
}
async function ipcInstallTool(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await Promise.resolve({ ok: false })
    return r ?? { ok: false, error: 'No response from installer' }
  } catch (e: any) { return { ok: false, error: e?.message ?? 'Installation failed' } }
}

// ── Admin / UAC elevation ──────────────────────────────────────────────────
const needsAdmin  = ref(false)   // true when on Windows and not elevated
const relaunching = ref(false)

async function checkAdminStatus() {
  if (activeOS.value !== 'windows') { needsAdmin.value = false; return }
  try {
    const isAdmin: boolean = await (window as any).electronAPI?.isAdmin?.() ?? true
    needsAdmin.value = !isAdmin
  } catch {
    needsAdmin.value = false // if IPC fails, assume fine and let winget surface its own error
  }
}

async function relaunchAsAdmin() {
  relaunching.value = true
  try {
    const result = await (window as any).electronAPI?.relaunchAsAdmin?.()
    if (!result?.ok) {
      // UAC was cancelled or failed — stay open, show error in progress bar
      relaunching.value = false
      setProgress(0, result?.error?.includes('cancel') || result?.error?.includes('Cancel')
        ? 'UAC cancelled — click Relaunch as Admin and choose Yes to continue'
        : `Relaunch failed: ${result?.error ?? 'unknown error'}`)
      setTimeout(() => { globalProgress.value = 0; progressMsg.value = '' }, 4000)
    }
    // On success the main process calls app.quit() — no need to reset anything
  } catch {
    relaunching.value = false
    setProgress(0, 'Relaunch failed — try running the app as administrator manually')
    setTimeout(() => { globalProgress.value = 0; progressMsg.value = '' }, 4000)
  }
}

// ── Actions ────────────────────────────────────────────────────────────────
async function checkAll() {
  const list = visibleTools.value
  if (!list.length) return
  setProgress(5, 'Checking installed tools…')
  for (let i = 0; i < list.length; i++) {
    const t = tools.value.find(x => x.id === list[i].id)!
    t.status = 'checking'
    setProgress(Math.round(((i + 0.4) / list.length) * 90) + 5, `Checking ${t.name}…`)
    const ok = await ipcCheckTool(t.id)
    t.status = ok ? 'installed' : 'missing'
  }
  doneProgress(allDone.value ? 'All tools ready!' : `${missingCount.value} tool(s) missing`)
}

async function installOne(toolDef: ToolDef) {
  const t = tools.value.find(x => x.id === toolDef.id)!
  if (!t.autoInstall) { openUrl(t.url); return }
  t.status = 'installing'; t.error = undefined
  setProgress(15, `Installing ${t.name}…`)
  const result = await ipcInstallTool(t.id)
  if (result.ok) {
    t.status = 'installed'
    // Distinguish local drop-in vs package-manager install in the progress label
    const src = (result as any).source === 'local' ? 'found in drivers/ folder' : 'installed'
    doneProgress(`${t.name} ${src}!`)
  } else {
    t.status = 'failed'
    if ((result as any).needsAdmin) {
      needsAdmin.value = true
      t.error = 'Administrator required — use "Relaunch as Admin" above'
    } else {
      t.error = result.error
    }
    doneProgress(`Failed: ${t.error}`)
  }
}

async function installAll() {
  const list = visibleTools.value.filter(t => (t.status === 'missing' || t.status === 'failed') && t.autoInstall)
  for (let i = 0; i < list.length; i++) {
    setProgress(Math.round((i / list.length) * 100), `Installing ${i + 1} of ${list.length}…`)
    await installOne(list[i])
  }
  doneProgress('Done!')
}

// ── Utilities ──────────────────────────────────────────────────────────────
function openUrl(url: string) {
  ;(window as any).electronAPI?.openExternal?.(url) ?? window.open(url, '_blank', 'noopener')
}
const copiedCmd = ref('')
async function copyCmd(cmd: string) {
  try { await navigator.clipboard.writeText(cmd); copiedCmd.value = cmd; setTimeout(() => { copiedCmd.value = '' }, 1800) } catch {}
}
function close() { emit('update:modelValue', false) }

// ── Lifecycle ──────────────────────────────────────────────────────────────
watch(() => props.modelValue, async (open) => {
  if (!open) return
  await detectHostOS()
  await checkAdminStatus()   // show UAC banner before user tries to install
  await checkAll()
})
</script>

<style scoped>
.dsd-uac-banner {
  display: flex; align-items: flex-start; gap: 12px;
  margin: 0 14px 2px; padding: 12px 14px;
  background: #f59e0b0d; border: 1px solid #f59e0b30; border-radius: 14px;
  flex-shrink: 0;
}
.dsd-uac-icon { flex-shrink: 0; margin-top: 1px; }
.dsd-uac-title { font-size: 12px; font-weight: 800; color: #fbbf24; margin: 0 0 4px; }
.dsd-uac-body {
  font-size: 11px; color: #78909c; margin: 0; line-height: 1.5;
}
.dsd-uac-body code {
  background: #0d1522; padding: 1px 5px; border-radius: 5px;
  font-family: 'SF Mono', 'Fira Code', monospace; font-size: 10.5px; color: #4ade80;
}
.dsd-uac-body strong { color: #94a3b8; font-weight: 700; }
.dsd-uac-btn {
  flex-shrink: 0; display: flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 10px; border: 1px solid #f59e0b50;
  background: #f59e0b14; color: #f59e0b; font-size: 11.5px; font-weight: 700;
  cursor: pointer; white-space: nowrap; font-family: inherit; transition: all 0.15s;
}
.dsd-uac-btn:hover:not(:disabled) { background: #f59e0b22; border-color: #f59e0b80; }
.dsd-uac-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.dsd-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.72); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.dsd-panel {
  width: min(580px, 100%); max-height: 88vh;
  background: #090e1a; border: 1px solid #1e3049; border-radius: 20px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,0.75), 0 0 0 1px #4ade8010;
}
.dsd-header {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 22px 16px; border-bottom: 1px solid #111c2c; background: #0d1522; flex-shrink: 0;
}
.dsd-header-icon {
  width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0;
  background: linear-gradient(135deg,#052e1a,#064e3b); border: 1px solid #4ade8022;
  display: flex; align-items: center; justify-content: center;
}
.dsd-title    { font-size: 14.5px; font-weight: 800; color: #ecfdf5; margin: 0; }
.dsd-subtitle { font-size: 11px; color: #475569; margin: 2px 0 0; }
.dsd-close-btn {
  width: 28px; height: 28px; border-radius: 9px; background: #1a2640; border: none;
  color: #4b6280; font-size: 11px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all 0.15s; flex-shrink: 0;
}
.dsd-close-btn:hover { background: #243450; color: #7a9cbf; }
.dsd-os-tabs {
  display: flex; gap: 6px; padding: 12px 22px 10px;
  border-bottom: 1px solid #111c2c; flex-shrink: 0;
}
.dsd-os-tab {
  display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 700; background: #111c2c; border: 1.5px solid #1e3049;
  color: #4b6280; cursor: pointer; transition: all 0.18s;
}
.dsd-os-tab:hover  { color: #7a9cbf; border-color: #243450; }
.dsd-os-tab.active { background: #052e1a; border-color: #4ade8045; color: #4ade80; }
.dsd-tool-list { overflow-y: auto; flex: 1; padding: 10px 14px; }
/* Scrollbar handled globally in main.css */
.dsd-local-hint {
  display: flex; align-items: flex-start; gap: 6px; flex-wrap: wrap;
  margin-top: 6px; padding: 6px 10px;
  background: #052e1a; border-radius: 10px; border: 1px solid #4ade8020;
  font-size: 10.5px; color: #3d9966; line-height: 1.4;
}
.dsd-local-hint code { color: #4ade80; }
.dsd-tool-row {
  display: flex; align-items: flex-start; gap: 12px; padding: 13px 12px;
  border-radius: 16px; margin-bottom: 7px; background: #0d1421; border: 1.5px solid #18243a;
  transition: border-color 0.2s;
}
.dsd-tool-row.installed  { border-color: #10b98122; }
.dsd-tool-row.failed     { border-color: #ef444422; }
.dsd-tool-row.installing { border-color: #f59e0b22; }
.dsd-status-wrap { flex-shrink: 0; padding-top: 1px; }
.dsd-spin { animation: dsd-spin 0.85s linear infinite; transform-origin: center; }
@keyframes dsd-spin { to { transform: rotate(360deg); } }
.dsd-tool-info { flex: 1; min-width: 0; }
.dsd-name-row  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px; }
.dsd-tool-name { font-size: 13px; font-weight: 700; color: #d1dff0; }
.dsd-tool-desc  { font-size: 11.5px; color: #3d5472; line-height: 1.5; margin: 0; }
.dsd-tool-error { font-size: 11px; color: #f87171; margin: 5px 0 0; }
.dsd-badge {
  font-size: 9px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 99px; flex-shrink: 0;
}
.badge-installed  { background: #10b98118; color: #4ade80; }
.badge-missing    { background: #f59e0b15; color: #fbbf24; }
.badge-checking   { background: #5b5ef415; color: #818cf8; }
.badge-installing { background: #f59e0b15; color: #fbbf24; }
.badge-failed     { background: #ef444418; color: #f87171; }
.badge-idle       { background: #1e293b;   color: #475569; }
.dsd-manual {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  margin-top: 7px; padding: 7px 10px;
  background: #0b1220; border-radius: 10px; border: 1px solid #18243a;
}
.dsd-manual-label { font-size: 10px; font-weight: 700; color: #3d5472; white-space: nowrap; }
.dsd-manual-link  {
  font-size: 10.5px; color: #38bdf8; font-weight: 600; cursor: pointer;
  word-break: break-all; text-decoration: underline; text-underline-offset: 2px; transition: color 0.15s;
}
.dsd-manual-link:hover { color: #7dd3fc; }
.dsd-cmd-row { display: flex; align-items: center; gap: 5px; }
.dsd-cmd {
  font-size: 10px; font-family: 'Consolas','Fira Code',monospace;
  background: #111c2c; color: #7a9cbf; padding: 3px 8px;
  border-radius: 6px; border: 1px solid #1e3049;
}
.dsd-copy-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 4px 6px; border-radius: 6px; border: none;
  background: #18243a; color: #4b6280; cursor: pointer; transition: all 0.15s;
}
.dsd-copy-btn:hover  { background: #243450; color: #7a9cbf; }
.dsd-copy-btn.copied { background: #052e1a; color: #4ade80; }
.dsd-row-action { flex-shrink: 0; }
.dsd-act-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px; border-radius: 11px; border: none;
  font-size: 11.5px; font-weight: 800; cursor: pointer; white-space: nowrap; transition: all 0.18s;
}
.dsd-act-btn.install { background: #052e1a; color: #4ade80; border: 1px solid #4ade8028; }
.dsd-act-btn.install:hover { background: #064e3b; transform: scale(1.05); }
.dsd-act-btn.retry   { background: #2d0a0a; color: #f87171; border: 1px solid #ef444428; }
.dsd-act-btn.retry:hover   { background: #3d0f0f; transform: scale(1.05); }
.dsd-act-btn.guide   { background: #111c2c; color: #7a9cbf; border: 1px solid #1e3049; }
.dsd-act-btn.guide:hover   { background: #18243a; transform: scale(1.05); }
.dsd-empty { padding: 32px; text-align: center; font-size: 13px; color: #3d5472; }
.dsd-progress-wrap { padding: 4px 22px 6px; flex-shrink: 0; }
.dsd-progress-track { height: 5px; border-radius: 99px; background: #111c2c; overflow: hidden; }
.dsd-progress-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg,#4ade80,#22d3ee);
  transition: width 0.45s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow: 0 0 8px #4ade8050;
}
.dsd-progress-label { font-size: 10.5px; color: #3d5472; text-align: center; margin: 4px 0 0; }
.dsd-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  padding: 12px 22px 16px; border-top: 1px solid #111c2c; background: #0d1421; flex-shrink: 0;
}
.dsd-footer-left  { flex: 1; font-size: 12px; font-weight: 700; }
.dsd-footer-right { display: flex; gap: 8px; }
.dsd-status-good { display: flex; align-items: center; gap: 5px; color: #4ade80; }
.dsd-status-warn { color: #f59e0b; }
.dsd-btn {
  display: flex; align-items: center; gap: 5px; padding: 9px 16px; border-radius: 13px; border: none;
  font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s;
}
.dsd-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.dsd-btn.primary   { background: #052e1a; color: #4ade80; border: 1px solid #4ade8030; }
.dsd-btn.primary:hover:not(:disabled) { background: #064e3b; transform: scale(1.04); }
.dsd-btn.secondary { background: #111c2c; color: #4b6280; border: 1px solid #1e3049; }
.dsd-btn.secondary:hover:not(:disabled) { background: #18243a; color: #7a9cbf; }
.dsd-btn.done { background: linear-gradient(135deg,#10b981,#059669); color: #fff; box-shadow: 0 4px 14px #10b98130; }
.dsd-btn.done:hover { transform: scale(1.04); }
.dsd-fade-enter-active { animation: dsd-in 0.28s cubic-bezier(0.34,1.56,0.64,1); }
.dsd-fade-leave-active { animation: dsd-out 0.18s ease forwards; }
@keyframes dsd-in  { from { opacity:0; transform:scale(0.9) translateY(20px); } to { opacity:1; transform:scale(1); } }
@keyframes dsd-out { to   { opacity:0; transform:scale(0.94); } }
.dsd-bar-enter-active { transition: all 0.25s ease; }
.dsd-bar-leave-active { transition: all 0.25s ease; }
.dsd-bar-enter-from, .dsd-bar-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
