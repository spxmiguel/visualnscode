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
    secretStatus: (providerId: string) =>
      ipcRenderer.invoke('environment:secret-status', providerId),
    storeSecret: (providerId: string, secret: string) =>
      ipcRenderer.invoke('environment:store-secret', providerId, secret),
    removeSecret: (providerId: string) =>
      ipcRenderer.invoke('environment:remove-secret', providerId),
  },
  providers: {
    list: () => ipcRenderer.invoke('providers:list'),
    update: (settings: unknown) => ipcRenderer.invoke('providers:update', settings),
    test: (providerId: string) => ipcRenderer.invoke('providers:test', providerId),
    models: (providerId: string) => ipcRenderer.invoke('providers:models', providerId),
  },
  chat: {
    start: (payload: unknown) => ipcRenderer.send('chat:start', payload),
    cancel: (requestId: string) => ipcRenderer.invoke('chat:cancel', requestId),
    onChunk: (listener: (chunk: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, chunk: unknown) => listener(chunk);
      ipcRenderer.on('chat:chunk', handler);
      return () => ipcRenderer.removeListener('chat:chunk', handler);
    },
  },
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
});
