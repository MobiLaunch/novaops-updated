import type { CSSProperties } from "react";
import { Minus, Square, Wrench, X } from "lucide-react";

import { isElectron } from "@/lib/electron";

const dragStyle = { WebkitAppRegion: "drag" } as CSSProperties;
const noDragStyle = { WebkitAppRegion: "no-drag" } as CSSProperties;

// Custom titlebar for the frameless Electron window (electron/main.cjs sets
// frame: false) — a plain web page has no need for this, so it renders
// nothing outside the desktop shell.
export default function ElectronTitlebar() {
  if (!isElectron()) return null;

  return (
    <div
      className="flex h-9 shrink-0 items-center justify-between bg-surface pl-3 text-foreground"
      style={dragStyle}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-muted">
        <Wrench className="size-3.5 text-accent" />
        NovaOps
      </div>
      <div className="flex h-full" style={noDragStyle}>
        <button
          aria-label="Minimize"
          className="flex h-full w-11 items-center justify-center hover:bg-surface-secondary"
          type="button"
          onClick={() => window.electronAPI?.minimize()}
        >
          <Minus className="size-3.5" />
        </button>
        <button
          aria-label="Maximize"
          className="flex h-full w-11 items-center justify-center hover:bg-surface-secondary"
          type="button"
          onClick={() => window.electronAPI?.maximize()}
        >
          <Square className="size-3" />
        </button>
        <button
          aria-label="Close"
          className="flex h-full w-11 items-center justify-center hover:bg-danger hover:text-white"
          type="button"
          onClick={() => window.electronAPI?.close()}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
