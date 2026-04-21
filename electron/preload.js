const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('accredicore', {
  runtime: 'electron',
  getPlatform: () => ipcRenderer.invoke('accredicore:get-platform'),
  getHomeInfo: () => ipcRenderer.invoke('accredicore:get-home-info'),
  getDownloadPreference: () => ipcRenderer.invoke('accredicore:get-download-preference'),
  requestOnlineActivation: (payload) => ipcRenderer.invoke('accredicore:request-online-activation', payload),
  runAction: (payload) => ipcRenderer.invoke('accredicore:run-action', payload),
  openPath: (targetPath) => ipcRenderer.invoke('accredicore:open-path', targetPath),
  openExternal: (url) => ipcRenderer.invoke('accredicore:open-external', url),
  selectFile: () => ipcRenderer.invoke('accredicore:select-file'),
  selectFolder: () => ipcRenderer.invoke('accredicore:select-folder')
});
