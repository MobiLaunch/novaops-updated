/**
 * electron/ipc.ts — All Desktop IPC Handlers
 *
 * Handlers registered here are callable from the renderer via window.electronAPI.*
 * All handlers use explicit try/catch — no unhandled promise rejections.
 */

import { app, shell } from 'electron'
import type { IpcMain, WebContents } from 'electron'
import os from 'os'

// ── Handler registration ────────────────────────────────────────────────────

export function registerIPCHandlers(ipcMain: IpcMain) {
  registerPrinterHandlers(ipcMain)
  registerDriverHandlers(ipcMain)
  registerSquareTerminalHandlers(ipcMain)
  registerAppInfoHandlers(ipcMain)
}

// ── Printer Handlers ──────────────────────────────────────────────────────────

function registerPrinterHandlers(ipcMain: IpcMain) {
  /**
   * printer:printReceipt
   * Creates a hidden BrowserWindow, loads HTML, triggers print, then destroys window.
   */
  ipcMain.handle('printer:printReceipt', async (event, html: string, options: any = {}) => {
    try {
      const { BrowserWindow } = await import('electron')
      const win = new BrowserWindow({
        show: false,
        webPreferences: { contextIsolation: true },
      })

      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

      await win.webContents.print({
        silent: options.silent ?? true,
        deviceName: options.printerName ?? '',
        printBackground: true,
        margins: { marginType: 'none' },
      }, (success, errorType) => {
        win.destroy()
        if (!success) console.error('[Printer] Receipt print failed:', errorType)
      })

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  /**
   * printer:printLabel
   * For ZPL printers: writes the ZPL string directly to the printer via OS raw print.
   * Requires printer to be shared or accessible via network by name.
   */
  ipcMain.handle('printer:printLabel', async (_event, zpl: string, printerName?: string) => {
    try {
      // On Windows, raw printing to a named printer can go through cmd /c copy
      if (process.platform === 'win32') {
        const { exec } = await import('child_process')
        const target = printerName ? `"\\\\.\\${printerName}"` : 'prn'
        const cmd = `echo ${zpl.replace(/\n/g, ' ')} > ${target}`
        await new Promise<void>((resolve, reject) =>
          exec(cmd, err => err ? reject(err) : resolve())
        )
        return { success: true }
      }
      // macOS / Linux: use lp command
      const { exec } = await import('child_process')
      const args = printerName ? `-d ${printerName}` : ''
      await new Promise<void>((resolve, reject) =>
        exec(`echo '${zpl}' | lp ${args}`, err => err ? reject(err) : resolve())
      )
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  /**
   * printer:listPrinters
   * Returns array of printer descriptors from webContents.getPrinters().
   */
  ipcMain.handle('printer:listPrinters', async (event) => {
    try {
      const wc = event.sender
      const printers = await wc.getPrintersAsync()
      return printers.map((p: any) => ({
        name: p.name,
        displayName: p.displayName ?? p.name,
        isDefault: p.isDefault,
        status: p.status,
      }))
    } catch (err: any) {
      return []
    }
  })
}

// ── Driver Handlers ───────────────────────────────────────────────────────────

function registerDriverHandlers(ipcMain: IpcMain) {
  /**
   * drivers:install
   * Maps driver names to install commands. Currently Windows-only stubs—
   * extend with actual installers per device type.
   */
  ipcMain.handle('drivers:install', async (_event, driverName: string) => {
    try {
      const commands: Record<string, string> = {
        'receipt-printer': 'winget install --id EpsonAmerica.ReceiptPrinterDriver --silent',
        'label-printer':   'winget install --id ZebraTechnologies.ZDesigner --silent',
        'barcode-scanner': '', // HID device; usually plug-and-play, no driver needed
      }

      const cmd = commands[driverName]
      if (!cmd) return { success: false, error: `No installer registered for driver: ${driverName}` }
      if (!cmd) return { success: true, message: 'Plug-and-play device, no driver required' }

      const { exec } = await import('child_process')
      await new Promise<void>((resolve, reject) =>
        exec(cmd, err => err ? reject(err) : resolve())
      )
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  /**
   * drivers:fetchLocalDevices
   * Returns USB/HID devices visible to the OS.
   */
  ipcMain.handle('drivers:fetchLocalDevices', async () => {
    try {
      // Basic OS-level enumeration using wmic on Windows
      if (process.platform === 'win32') {
        const { exec } = await import('child_process')
        const stdout = await new Promise<string>((resolve, reject) =>
          exec('wmic path Win32_PnPEntity get Name,DeviceID /format:csv', (err, out) =>
            err ? reject(err) : resolve(out)
          )
        )
        const lines = stdout.trim().split('\n').slice(2).map(l => l.trim()).filter(Boolean)
        return lines.map(l => {
          const [, deviceId, name] = l.split(',')
          return { deviceId, name }
        })
      }
      // macOS / Linux
      const { exec } = await import('child_process')
      const out = await new Promise<string>((resolve, reject) =>
        exec('ls /dev/usb* 2>/dev/null || echo ""', (err, stdout) =>
          err ? resolve('') : resolve(stdout)
        )
      )
      return out.trim().split('\n').filter(Boolean).map(d => ({ deviceId: d, name: d }))
    } catch (err: any) {
      return []
    }
  })

  /**
   * drivers:diagnostics
   * Runs hardware status checks and returns a diagnostics report.
   */
  ipcMain.handle('drivers:diagnostics', async () => {
    try {
      return {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMemMB: Math.round(os.freemem() / 1024 / 1024),
        cpus: os.cpus().length,
        uptime: os.uptime(),
      }
    } catch (err: any) {
      return { error: err.message }
    }
  })
}

// ── Square Terminal Handlers ──────────────────────────────────────────────────

function registerSquareTerminalHandlers(ipcMain: IpcMain) {
  /**
   * squareTerminal:pairDevice
   * Calls the Nuxt server-side /api/square/pair-device route.
   * The Electron app hits localhost (dev) or the bundled Nitro server.
   */
  ipcMain.handle('squareTerminal:pairDevice', async (_event, deviceCode: string) => {
    try {
      const res = await fetch('http://localhost:3000/api/square/pair-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceCode }),
      })
      const data = await res.json()
      return data
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  /**
   * squareTerminal:deviceStatus
   */
  ipcMain.handle('squareTerminal:deviceStatus', async (_event, deviceId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/square/device-status?deviceId=${deviceId}`)
      const data = await res.json()
      return data
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}

// ── App Info Handlers ──────────────────────────────────────────────────────────

function registerAppInfoHandlers(ipcMain: IpcMain) {
  ipcMain.handle('appInfo:get', () => ({
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    isDev: !app.isPackaged,
  }))

  ipcMain.handle('appInfo:openPath', async (_event, filePath: string) => {
    try {
      await shell.openPath(filePath)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
