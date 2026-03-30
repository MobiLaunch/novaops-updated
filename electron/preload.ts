/**
 * electron/preload.ts — Secure IPC Bridge
 *
 * Exposes a sandboxed `window.electronAPI` object to the renderer process.
 * All communication goes through contextBridge — no direct Node access from renderer.
 *
 * Exposed namespaces:
 *   - printer       Print receipts and labels
 *   - drivers       Install/check hardware drivers
 *   - squareTerminal  Manage Square Terminal pairing
 *   - appInfo       App version and environment info
 */

import { contextBridge, ipcRenderer } from 'electron'

// ── Type declarations (mirrored in types/electron.d.ts for IDE support) ────────

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // ── Printer ────────────────────────────────────────────────────────────────
  printer: {
    /**
     * Print a plain-text or HTML receipt to the default receipt printer.
     * @param html  HTML string to render and print
     * @param options  { silent?: boolean, printerName?: string }
     */
    printReceipt: (html: string, options?: { silent?: boolean; printerName?: string }) =>
      ipcRenderer.invoke('printer:printReceipt', html, options),

    /**
     * Print a ZPL barcode label string to a label printer.
     */
    printLabel: (zpl: string, printerName?: string) =>
      ipcRenderer.invoke('printer:printLabel', zpl, printerName),

    /**
     * List available printers on the local system.
     */
    listPrinters: () => ipcRenderer.invoke('printer:listPrinters'),
  },

  // ── Drivers ───────────────────────────────────────────────────────────────
  drivers: {
    /**
     * Attempt to install a device driver by name (e.g. 'receipt-printer', 'label-printer').
     */
    install: (driverName: string) =>
      ipcRenderer.invoke('drivers:install', driverName),

    /**
     * Return the list of locally detected devices and their driver status.
     */
    fetchLocalDevices: () => ipcRenderer.invoke('drivers:fetchLocalDevices'),

    /**
     * Run hardware diagnostic checks and return results.
     */
    diagnostics: () => ipcRenderer.invoke('drivers:diagnostics'),
  },

  // ── Square Terminal ────────────────────────────────────────────────────────
  squareTerminal: {
    /**
     * Pair a Square Terminal device to the current location.
     * @param deviceCode  Code displayed on the terminal screen
     */
    pairDevice: (deviceCode: string) =>
      ipcRenderer.invoke('squareTerminal:pairDevice', deviceCode),

    /**
     * Fetch the current status of a paired terminal device.
     */
    deviceStatus: (deviceId: string) =>
      ipcRenderer.invoke('squareTerminal:deviceStatus', deviceId),
  },

  // ── App Info ───────────────────────────────────────────────────────────────
  appInfo: {
    /** Returns { version, platform, arch, isDev } */
    get: () => ipcRenderer.invoke('appInfo:get'),

    /** Open the system's default file manager to the given path */
    openPath: (filePath: string) => ipcRenderer.invoke('appInfo:openPath', filePath),
  },
})
