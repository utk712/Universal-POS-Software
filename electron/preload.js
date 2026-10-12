const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  silentPrint: (options) => ipcRenderer.invoke("silent-print", options)
});

