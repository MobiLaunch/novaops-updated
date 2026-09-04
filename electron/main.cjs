// NovaOps desktop shell — a thin Electron wrapper around the deployed web
// app, NOT a bundled offline server. Square access tokens and the Supabase
// service-role key must never ship inside a distributed desktop binary
// (anyone can unpack an .exe/.dmg and read its files), so this shell talks
// to the same hosted app + serverless API everything else uses, over HTTPS,
// exactly like a browser tab would — it just adds native window chrome
// (custom titlebar, app icon, menu, tray) around it.
//
// NOVAOPS_APP_URL controls what loads:
//   - unset (dev):  http://localhost:5173 (the Vite dev server)
//   - production:   your deployed URL, e.g. https://your-shop.vercel.app
// Set it via env var, or edit DEFAULT_PROD_URL below before building.

const { app, BrowserWindow, Menu, Tray, ipcMain, shell } = require("electron");
const path = require("node:path");

const DEFAULT_PROD_URL = "https://your-novaops-deployment.vercel.app";
const isDev = !app.isPackaged;
const appUrl = process.env.NOVAOPS_APP_URL || (isDev ? "http://localhost:5173" : DEFAULT_PROD_URL);

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0E0B17",
    // Frameless with a custom in-app titlebar (src/components/ElectronTitlebar.tsx)
    // so the desktop shell visually matches the rest of NovaOps instead of
    // the OS's default chrome.
    frame: false,
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "../public/icon-512.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(appUrl);

  // Open non-app links (e.g. "Live Store", receipt URLs) in the OS browser
  // instead of inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);

    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, "../public/icon-192.png"));
  tray.setToolTip("NovaOps");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open NovaOps", click: () => mainWindow?.show() },
      { type: "separator" },
      { label: "Quit", role: "quit" },
    ]),
  );
  tray.on("click", () => mainWindow?.show());
}

ipcMain.on("window:minimize", () => mainWindow?.minimize());
ipcMain.on("window:maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on("window:close", () => mainWindow?.close());

app.whenReady().then(() => {
  createWindow();
  createTray();

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "NovaOps",
        submenu: [
          { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.reload() },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      {
        label: "Edit",
        submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
      },
    ]),
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
