# NovaOps — Electron Desktop Wrapper

> **⚠️ IMPORTANT: Before building the .exe**
>
> 1. **Rename** the `itunes files/` folder (with a space) to `itunes-files/` (hyphen).
>    Paths with spaces break node-gyp's native module compilation during `electron-builder`.
>    The `package.json` and `electron/main.cjs` have already been updated to reference `itunes-files`.
>
> 2. **White screen fix**: Always build with `npm run electron:build` (not `nuxt generate && electron-builder` directly).
>    The build script sets `ELECTRON_BUILD=1` which tells Nuxt to use `baseURL: './'` so all asset paths
>    are relative. Without this, Electron loads the app via `file://` and absolute `/assets/...` paths 404,
>    producing a blank white screen.

Wraps the Nuxt 3 app in a frameless Electron shell with a custom **M3 Expressive titlebar** that replaces the OS window chrome entirely.

---

## What's included

| File | Purpose |
|------|---------|
| `electron/main.js` | Main process — frameless window, IPC handlers, Nexus-diag child window |
| `electron/preload.js` | Context bridge — exposes `window.electronAPI`, `window.nexus`, `window.posElectron` |
| `components/ElectronTitlebar.vue` | Custom M3 titlebar component — window controls, route breadcrumb, app identity |
| `app.vue` | Mounts `ElectronTitlebar` globally; adds 40px top-padding in Electron |

---

## Custom Titlebar Design

The titlebar is **completely custom** — no OS window frame, no standard Windows/macOS title bar. It renders a 40px pill-style bar that:

- **Left**: NovaOps logo + name (draggable)
- **Center**: Current page pill with M3 icon + name (non-draggable, updates on route change)
- **Right**: Window controls — fullscreen toggle, minimize, maximize/restore, close
  - Each button has a distinct M3 color on hover: indigo (minimize), cyan (maximize), red (close)
  - All buttons spring-scale on hover/active with `cubic-bezier(0.34,1.56,0.64,1)`
- **Fullscreen**: Bar slides off-screen but reappears on hover at the top edge

---

## Quick Start

```bash
# 1. Install all dependencies (Electron + Nuxt)
npm install

# 2. Start in dev mode (Nuxt dev server + Electron, hot reload works)
npm run electron:dev
```

---

## Production Build

```bash
# Windows (.exe installer)
npm run electron:build

# macOS (.dmg)
npm run electron:build:mac

# Linux (.AppImage)
npm run electron:build:linux
```

The build runs `nuxt generate` first (SSG into `.output/public/`), then packages with `electron-builder`.

---

## APIs in the renderer

### `window.electronAPI`

```ts
window.electronAPI.minimize()          // Minimize window
window.electronAPI.maximizeToggle()    // Maximize or restore
window.electronAPI.close()             // Close (quits on Win/Linux)
window.electronAPI.toggleFullscreen()  // Toggle fullscreen
window.electronAPI.isMaximized()       // → Promise<boolean>
window.electronAPI.isFullscreen()      // → Promise<boolean>
window.electronAPI.platform()          // → Promise<'win32'|'darwin'|'linux'>
window.electronAPI.version()           // → Promise<string>  (app version)
window.electronAPI.isElectron          // true — use to gate Electron-only features

// React to main process events
window.electronAPI.onMaximizedChange(cb: (isMax: boolean) => void)
window.electronAPI.onFullscreenChange(cb: (isFull: boolean) => void)
window.electronAPI.removeAllListeners(channel: string)
```

### `window.nexus` / `window.posElectron`

```ts
window.nexus.openDiagWindow()     // Open Nexus-diag child window
window.nexus.closeDiagWindow()    // Close it
window.nexus.onDiagClosed(cb)     // Callback when user closes diag window
window.nexus.onDiagUnavailable(cb) // Callback if nexus-diag isn't installed

// Backwards-compat alias
window.posElectron.isElectron     // true
window.posElectron.openDiagWindow()
```

---

## Detecting Electron in Vue components

```ts
const isElectron = computed(() => !!(window as any).electronAPI?.isElectron)

// Or check in onMounted (safe for SSR/browser):
onMounted(() => {
  if ((window as any).electronAPI?.isElectron) {
    // Electron-specific code
  }
})
```

---

## Nexus-Diag Integration (optional)

If a `nexus-diag/` folder exists as a sibling of the project root, it gets bundled as an extra resource and can be opened as a child window via `window.nexus.openDiagWindow()`. The diag window uses its own preload (`nexus-diag/preload.js`).

If nexus-diag is not present, the IPC call is a no-op and `window.nexus.onDiagUnavailable` fires.

---

## macOS notes

- Traffic light buttons (close/minimize/zoom) are rendered by Electron at `{ x: 16, y: 14 }` — positioned to align with our custom rail
- The custom controls in `ElectronTitlebar.vue` are hidden on macOS (use `platform === 'darwin'` check if you need to differentiate)
- Currently the component shows all controls on all platforms — you can conditionally hide them based on `platform.value === 'darwin'` if preferred

---

## Troubleshooting

**Window appears then immediately closes** — make sure `electron/main.js` is the `main` entry in `package.json`.

**Titlebar is black on load** — set `backgroundColor: '#0f172a'` in `BrowserWindow` (already done). This matches the dark CSS variable.

**"Cannot find module electron"** — run `npm install` after adding electron to devDependencies.

**Nuxt `window is not defined`** — ensure `ssr: false` in `nuxt.config.ts` (already set).
