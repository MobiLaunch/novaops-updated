/**
 * NovaOps Electron Preload
 *
 * Exposes three bridges to the renderer via contextBridge:
 *   window.electronAPI  — window controls, platform info
 *   window.nexus        — device diagnostics (USB/ADB/libimobiledevice IPC)
 *   window.posElectron  — POS-specific helpers (backwards compat)
 *
 * FIX: The previous preload exposed only openDiagWindow/closeDiagWindow on
 * window.nexus. The useNexusDiag composable and services.vue call many more
 * methods (getDevices, scanDevice, getCPU, getMemory, etc.) that were simply
 * missing — so device detection never worked. All required methods are now
 * wired to matching ipcRenderer.invoke() calls whose handlers live in main.cjs.
 */

const { contextBridge, ipcRenderer } = require('electron')

// ── electronAPI ──────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximizeToggle: () => ipcRenderer.invoke('window:maximize-toggle'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),

  // Main → renderer events
  onMaximizedChange: (cb) => ipcRenderer.on('window:maximized-change', (_, v) => cb(v)),
  onFullscreenChange: (cb) => ipcRenderer.on('window:fullscreen-change', (_, v) => cb(v)),

  // App info
  platform: () => ipcRenderer.invoke('app:platform'),
  version: () => ipcRenderer.invoke('app:version'),

  // Elevation
  isAdmin: () => ipcRenderer.invoke('app:is-admin'),
  relaunchAsAdmin: () => ipcRenderer.invoke('app:relaunch-as-admin'),

  isElectron: true,

  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

  // Raw HTTP fetch via Main Process (bypassing CORS)
  proxyFetch: (url, options) => ipcRenderer.invoke('app:proxy-fetch', url, options),

  // OAuth loopback flow (Electron-only)
  startGoogleOAuth: (supabaseUrl, supabaseKey) =>
    ipcRenderer.invoke('auth:start-google-oauth', supabaseUrl, supabaseKey),
  exchangeOAuthCode: (supabaseUrl, supabaseKey, code, redirectUri) =>
    ipcRenderer.invoke('auth:exchange-code', supabaseUrl, supabaseKey, code, redirectUri),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})


// ── posElectron — backwards compatibility alias ───────────────────────────────
contextBridge.exposeInMainWorld('posElectron', {
  isElectron: true,
  openDiagWindow: () => ipcRenderer.invoke('diag:open'),
  closeDiagWindow: () => ipcRenderer.invoke('diag:close'),
  onDiagWindowClosed: (cb) => ipcRenderer.on('diag:closed', () => cb()),
})

// ── posShell — printer bridge used by settings.vue ───────────────────────────
// settings.vue detects Electron via: !!(window.posShell)
// and calls getPrinters / printReceipt / printBarcodeLabel through this bridge.
contextBridge.exposeInMainWorld('posShell', {
  getPrinters: () =>
    ipcRenderer.invoke('printer:get-printers'),
  printReceipt: (html, printerName, opts) =>
    ipcRenderer.invoke('printer:print-receipt', html, printerName, opts),
  printBarcodeLabel: (html, printerName, opts) =>
    ipcRenderer.invoke('printer:print-barcode-label', html, printerName, opts),
})
