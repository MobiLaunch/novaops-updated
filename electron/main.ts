/**
 * electron/main.ts — NovaOps Electron Main Process
 *
 * Responsibilities:
 *   - Create and manage BrowserWindow
 *   - Load the Nuxt production build (.output/public)
 *   - Register all IPC handlers (via ipc.ts)
 *   - Handle auto-updates (electron-updater)
 */

import { app, BrowserWindow, ipcMain, shell, session } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerIPCHandlers } from './ipc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Constants ─────────────────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged
const NUXT_DEV_URL = process.env.NUXT_DEV_URL || 'http://localhost:3000'

// Path to the built Nuxt SSR-less output (ssr: false → static)
const STATIC_OUTPUT = path.join(__dirname, '../../.output/public')

// ── Window ────────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, '../../public/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // required for preload IPC bridge
      webSecurity: true,
    },
  })

  // Load URL
  if (IS_DEV) {
    mainWindow.loadURL(NUXT_DEV_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Load the static index.html from the Nuxt build output
    mainWindow.loadFile(path.join(STATIC_OUTPUT, 'index.html'))
  }

  // Open external links in the OS browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // Allow loading local resources from the output dir
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;"
        ],
      },
    })
  })

  // Register all IPC handlers before the window is created
  registerIPCHandlers(ipcMain)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
