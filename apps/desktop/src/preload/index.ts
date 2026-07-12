import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('visualnscode', {
  platform: process.platform,
  environment: {
    detectAll: () => ipcRenderer.invoke('environment:detect-all'),
    detect: (toolId: string) => ipcRenderer.invoke('environment:detect', toolId),
    perform: (request: unknown) => ipcRenderer.invoke('environment:perform', request),
    permissions: () => ipcRenderer.invoke('environment:permissions'),
    setPermission: (id: string, granted: boolean) =>
      ipcRenderer.invoke('environment:set-permission', id, granted),
    openDocumentation: (toolId: string) => ipcRenderer.invoke('environment:open-docs', toolId),
  },
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
});
