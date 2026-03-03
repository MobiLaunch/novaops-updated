/**
 * NovaOps Electron Main Process
 *
 * FIX: Renamed from main.js → main.cjs so Node treats this file as CommonJS
 * even though package.json has "type":"module". The .cjs extension explicitly
 * opts out of ESM mode, allowing require() calls to work correctly.
 * preload.js was also renamed → preload.cjs for the same reason.
 *
 * Windows compatibility notes:
 * - Uses titleBarStyle:'hidden' WITHOUT frame:false
 *   frame:false on Windows strips resize handles, window shadow, and snap zones.
 *   titleBarStyle:'hidden' hides the OS title bar text/buttons but keeps the
 *   native frame border so resize/snap/shadow all work correctly.
 * - backgroundColor is resolved from nativeTheme so there's no dark/light flash.
 * - No requireAdministrator — not needed for the POS app.
 * - Dev script uses concurrently's --kill-others flag instead of shell && chaining
 *   because cmd.exe doesn't support && inside npm script strings on Windows.
 */

const { app, BrowserWindow, ipcMain, shell, screen, nativeTheme, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
// url module replaced by WHATWG URL API (url.parse is deprecated)

const isDev = !app.isPackaged

// ── Single-instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) { app.quit(); process.exit(0) }

// ── Paths ─────────────────────────────────────────────────────────────────────

// ── Single flat drivers/ folder ───────────────────────────────────────────────
// ALL tool binaries live directly in drivers/ (no OS subfolders).
// Dev:        <project>/drivers/
// Production: <resourcesPath>/drivers/
//
// Drop any .exe / .dll here and it will be found automatically.
const DRIVERS_DIR = isDev
  ? path.join(__dirname, '../drivers')
  : path.join(process.resourcesPath, 'drivers')

// DLL folder — MobileDevice.dll / CoreFoundation.dll live in itunes-files/
const ITUNES_TOOLS_DIR = isDev
  ? path.join(__dirname, '../itunes-files', 'itunesFlashDll')
  : path.join(process.resourcesPath, 'itunes-tools', 'itunesFlashDll')

// Fallback: also check the root of itunes-tools (for flat-packed builds)
const ITUNES_TOOLS_ROOT = isDev
  ? path.join(__dirname, '../itunes-files')
  : path.join(process.resourcesPath, 'itunes-tools')

/**
 * Look up a binary by filename stem.
 * Resolution order:
 *  1. drivers/<stem>.exe
 *  2. drivers/android/<stem>.exe
 *  3. drivers/ios/<stem>.exe
 *  4. System PATH
 *
 * @param {string} stem        - binary name without extension, e.g. 'adb'
 * @param {string} fallbackCmd - fallback command (usually same as stem)
 * @returns {string}
 */
function resolveBin(stem, fallbackCmd) {
  const ext = process.platform === 'win32' ? '.exe' : ''
  const base = stem.replace(/\.exe$/i, '')
  const candidates = [
    path.join(DRIVERS_DIR, base + ext),
    path.join(DRIVERS_DIR, 'android', base + ext),
    path.join(DRIVERS_DIR, 'ios', base + ext),
  ]
  const found = candidates.find(p => fs.existsSync(p))
  return found ?? (fallbackCmd ?? stem)
}


const NUXT_URL = process.env.NUXT_URL || 'http://localhost:3000'
const PROD_HTML = path.join(__dirname, '../.output/public/index.html')

let mainWindow = null

function safeSend(win, channel, ...args) {
  try { if (win && !win.isDestroyed()) win.webContents.send(channel, ...args) } catch { }
}

// Match the app's light/dark background before the renderer loads
// so there's no flash of the wrong colour on startup.
function getBgColor() {
  return nativeTheme.shouldUseDarkColors ? '#0d1117' : '#f5f7fa'
}

// ── Create main window ────────────────────────────────────────────────────────
function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: Math.min(1440, width),
    height: Math.min(900, height),
    minWidth: 900,
    minHeight: 600,

    // IMPORTANT FOR WINDOWS:
    // Do NOT use frame:false here. On Windows that removes resize handles,
    // the drop shadow, and Snap Assist. Use titleBarStyle:'hidden' instead —
    // it hides the OS title bar content while keeping the native frame intact.
    // On macOS this also keeps the traffic-light buttons in the right place.
    titleBarStyle: 'hidden',

    // macOS traffic lights — aligned with our 40px bar
    trafficLightPosition: { x: 16, y: 12 },

    // Theme-aware background prevents a coloured flash before the app renders
    backgroundColor: getBgColor(),
    show: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },

    icon: path.join(__dirname, '../public/icon-512.png'),
  })

  if (isDev) {
    mainWindow.loadURL(NUXT_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(PROD_HTML)
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // Send initial window state to the renderer
    safeSend(mainWindow, 'window:maximized-change', mainWindow.isMaximized())
    safeSend(mainWindow, 'window:fullscreen-change', mainWindow.isFullScreen())
    // Probe for missing USB/diagnostic drivers on Windows
    scheduleStartupDriverCheck()

    // On very first launch after fresh install: silently auto-install
    // ADB + libimobiledevice via winget (Windows only)
    runFirstRunDriverInstall().catch(() => { /* non-fatal */ })
  })

  mainWindow.on('maximize', () => safeSend(mainWindow, 'window:maximized-change', true))
  mainWindow.on('unmaximize', () => safeSend(mainWindow, 'window:maximized-change', false))
  mainWindow.on('enter-full-screen', () => safeSend(mainWindow, 'window:fullscreen-change', true))
  mainWindow.on('leave-full-screen', () => safeSend(mainWindow, 'window:fullscreen-change', false))

  // Keep background colour in sync when user switches Windows dark/light mode
  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBackgroundColor(getBgColor())
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') && !url.startsWith(NUXT_URL)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── Window control IPC ────────────────────────────────────────────────────────
ipcMain.removeHandler('window:minimize')
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.removeHandler('window:close')
ipcMain.handle('window:close', () => mainWindow?.close())
ipcMain.removeHandler('window:is-maximized')
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
ipcMain.removeHandler('window:is-fullscreen')
ipcMain.handle('window:is-fullscreen', () => mainWindow?.isFullScreen() ?? false)
ipcMain.removeHandler('window:toggle-fullscreen')
ipcMain.handle('window:toggle-fullscreen', () => {
  if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen())
})
ipcMain.removeHandler('window:maximize-toggle')
ipcMain.handle('window:maximize-toggle', () => {
  if (!mainWindow) return
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})

ipcMain.removeHandler('app:platform')

ipcMain.handle('app:platform', () => process.platform)
ipcMain.removeHandler('app:version')
ipcMain.handle('app:version', () => app.getVersion())

// ── Elevation helpers ─────────────────────────────────────────────────────────
// Check whether the current process is running with administrator / root rights.
ipcMain.removeHandler('app:is-admin')
ipcMain.handle('app:is-admin', async () => {
  try {
    if (process.platform === 'win32') {
      // net session is a reliable elevation probe on Windows — exits 0 if admin
      const { execFile } = require('child_process')
      const { promisify } = require('util')
      await promisify(execFile)('net', ['session'], { timeout: 3000 })
      return true
    } else {
      // On macOS / Linux, check if effective UID is 0
      return process.getuid?.() === 0
    }
  } catch {
    return false
  }
})

// Re-launch the app with elevated privileges.
// On Windows: uses PowerShell Start-Process -Verb RunAs which triggers the UAC
// dialog. We wait for the spawned PowerShell to exit to know if the user
// approved (exit 0) or cancelled (non-zero / error) before quitting.
// On macOS: re-opens via osascript admin prompt.
ipcMain.removeHandler('app:relaunch-as-admin')
ipcMain.handle('app:relaunch-as-admin', async () => {
  try {
    if (process.platform === 'win32') {
      const { spawn } = require('child_process')

      if (!app.isPackaged) {
        return { ok: false, error: 'In development mode, please restart your terminal as Administrator and run the dev script again.' }
      }

      const filePath = process.execPath
      const fileArgs = []

      // Escape single-quotes for PowerShell string
      const psEscape = (s) => s.replace(/'/g, "''")
      const argsPs = fileArgs.length
        ? `-ArgumentList @(${fileArgs.map(a => `'${psEscape(a)}'`).join(',')})`
        : ''
      // NOTE: Do NOT use -Wait here. -Wait makes PowerShell block until the NEW elevated
      // process exits, meaning the old non-elevated instance stays alive the entire session.
      // Without -Wait, PowerShell returns exit 0 immediately after UAC is approved and
      // the new process launches (and non-zero if UAC is cancelled), which is what we want.
      const psCmd = `Start-Process -FilePath '${psEscape(filePath)}' ${argsPs} -Verb RunAs`

      return await new Promise((resolve) => {
        const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', psCmd], {
          windowsHide: true,
        })

        ps.on('close', (code) => {
          if (code === 0) {
            // UAC was approved and the new process started — quit this instance
            setTimeout(() => app.quit(), 300)
            resolve({ ok: true })
          } else {
            // User cancelled UAC or PowerShell failed — do NOT quit
            resolve({ ok: false, error: 'UAC prompt was cancelled or failed (exit ' + code + ')' })
          }
        })

        ps.on('error', (err) => {
          resolve({ ok: false, error: err.message })
        })
      })

    } else if (process.platform === 'darwin') {
      const { spawn } = require('child_process')
      const launchPath = app.isPackaged
        ? process.execPath
        : `"${process.execPath}" "${app.getAppPath()}"`
      const escaped = launchPath.replace(/"/g, '\\"')

      return await new Promise((resolve) => {
        const osa = spawn('osascript', [
          '-e', `do shell script "${escaped}" with administrator privileges`,
        ])
        osa.on('close', (code) => {
          if (code === 0) { setTimeout(() => app.quit(), 300); resolve({ ok: true }) }
          else resolve({ ok: false, error: 'Admin prompt cancelled' })
        })
        osa.on('error', (err) => resolve({ ok: false, error: err.message }))
      })

    } else {
      // Linux — pkexec
      const { spawn } = require('child_process')
      const launchArgs = app.isPackaged ? [] : [app.getAppPath()]
      return await new Promise((resolve) => {
        const pk = spawn('pkexec', [process.execPath, ...launchArgs], { detached: true })
        pk.on('close', (code) => {
          if (code === 0) { setTimeout(() => app.quit(), 300); resolve({ ok: true }) }
          else resolve({ ok: false, error: 'pkexec cancelled or unavailable' })
        })
        pk.on('error', (err) => resolve({ ok: false, error: err.message }))
      })
    }
  } catch (err) {
    return { ok: false, error: err?.message ?? 'Failed to relaunch as administrator' }
  }
})

// ── Second-instance / deep link ───────────────────────────────────────────────
app.on('second-instance', (_e, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
  const url = argv.find(a => a.startsWith('novaops://'))
  if (url) safeSend(mainWindow, 'deep-link', url)
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})

app.whenReady().then(createMainWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

