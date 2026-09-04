export interface ElectronBridge {
  isElectron: true;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridge;
  }
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI?.isElectron;
}
