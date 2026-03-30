/**
 * types/electron.d.ts
 * Renderer-side type declarations for window.electronAPI.
 * Mirrors the contextBridge in electron/preload.ts.
 */

interface ElectronPrinterAPI {
  printReceipt(html: string, options?: { silent?: boolean; printerName?: string }): Promise<{ success: boolean; error?: string }>
  printLabel(zpl: string, printerName?: string): Promise<{ success: boolean; error?: string }>
  listPrinters(): Promise<Array<{ name: string; displayName: string; isDefault: boolean; status: number }>>
}

interface ElectronDriversAPI {
  install(driverName: string): Promise<{ success: boolean; error?: string; message?: string }>
  fetchLocalDevices(): Promise<Array<{ deviceId: string; name: string }>>
  diagnostics(): Promise<{
    platform: string; arch: string; hostname: string;
    totalMemMB: number; freeMemMB: number; cpus: number; uptime: number;
  }>
}

interface ElectronSquareTerminalAPI {
  pairDevice(deviceCode: string): Promise<{ success: boolean; deviceId?: string; error?: string }>
  deviceStatus(deviceId: string): Promise<{ success: boolean; status?: string; error?: string }>
}

interface ElectronAppInfoAPI {
  get(): Promise<{ version: string; platform: string; arch: string; isDev: boolean }>
  openPath(filePath: string): Promise<{ success: boolean; error?: string }>
}

interface ElectronAPI {
  isElectron: true
  printer: ElectronPrinterAPI
  drivers: ElectronDriversAPI
  squareTerminal: ElectronSquareTerminalAPI
  appInfo: ElectronAppInfoAPI
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
