const { contextBridge, ipcRenderer } = require("electron");

/**
 * P.E.O Preload Script
 * Define as APIs seguras que o frontend pode acessar.
 */
contextBridge.exposeInMainWorld("peoAPI", {
  getMode: () => process.env.PEO_MODE,
  getVersion: () => "1.0.0",
  onBackendReady: (callback) => ipcRenderer.on("backend-ready", callback),
});
