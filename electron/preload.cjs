// Minimal, safe bridge to the renderer — window controls only. No
// filesystem, network, or Node API is exposed to the web content, since the
// renderer just loads the same hosted app a browser would.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  platform: process.platform,
});
