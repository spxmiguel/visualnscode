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
  agents: {
    history: () => ipcRenderer.invoke('agents:history'),
    start: (payload: unknown) => ipcRenderer.send('agents:start', payload),
    cancel: (runId: string) => ipcRenderer.invoke('agents:cancel', runId),
    approve: (runId: string, actionId: string, approved: boolean) =>
      ipcRenderer.invoke('agents:approve', runId, actionId, approved),
    onEvent: (listener: (event: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, workflowEvent: unknown) =>
        listener(workflowEvent);
      ipcRenderer.on('agents:event', handler);
      return () => ipcRenderer.removeListener('agents:event', handler);
    },
  },
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
  fs: {
    openFolder: () => ipcRenderer.invoke('fs:open-folder'),
    setWorkspace: (p: string) => ipcRenderer.invoke('fs:set-workspace', p),
    getWorkspace: () => ipcRenderer.invoke('fs:get-workspace'),
    listDir: (relative: string) => ipcRenderer.invoke('fs:list-dir', relative),
    readFile: (relative: string) => ipcRenderer.invoke('fs:read-file', relative),
    writeFile: (relative: string, content: string) =>
      ipcRenderer.invoke('fs:write-file', relative, content),
    createDir: (relative: string) => ipcRenderer.invoke('fs:create-dir', relative),
    delete: (relative: string, confirmed: boolean) =>
      ipcRenderer.invoke('fs:delete', relative, confirmed),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    scanSecrets: (filename: string, content: string) =>
      ipcRenderer.invoke('fs:scan-secrets', filename, content),
    redact: (content: string) => ipcRenderer.invoke('fs:redact', content),
    classifyCommand: (command: string) => ipcRenderer.invoke('fs:classify-command', command),
    prepareRemoteContext: (files: unknown) =>
      ipcRenderer.invoke('fs:prepare-remote-context', files),
  },
  security: {
    assessCommand: (command: string, policy: unknown) =>
      ipcRenderer.invoke('security:assess-command', command, policy),
  },
  edits: {
    list: () => ipcRenderer.invoke('edits:list'),
    propose: (title: string, files: unknown) => ipcRenderer.invoke('edits:propose', title, files),
    apply: (id: string, selections: unknown) => ipcRenderer.invoke('edits:apply', id, selections),
    reject: (id: string) => ipcRenderer.invoke('edits:reject', id),
    history: () => ipcRenderer.invoke('edits:history'),
    rollback: (id: string) => ipcRenderer.invoke('edits:rollback', id),
  },
  checkpoint: {
    create: (label: string, files: unknown) =>
      ipcRenderer.invoke('checkpoint:create', label, files),
    list: () => ipcRenderer.invoke('checkpoint:list'),
    restore: (id: string) => ipcRenderer.invoke('checkpoint:restore', id),
    remove: (id: string) => ipcRenderer.invoke('checkpoint:remove', id),
  },
  git: {
    isRepo: () => ipcRenderer.invoke('git:is-repo'),
    status: () => ipcRenderer.invoke('git:status'),
    diff: (staged: boolean, path?: string) => ipcRenderer.invoke('git:diff', staged, path),
    stage: (paths: string[]) => ipcRenderer.invoke('git:stage', paths),
    unstage: (paths: string[]) => ipcRenderer.invoke('git:unstage', paths),
    commit: (message: string) => ipcRenderer.invoke('git:commit', message),
    suggestCommit: () => ipcRenderer.invoke('git:suggest-commit'),
    log: (limit?: number) => ipcRenderer.invoke('git:log', limit),
    branches: () => ipcRenderer.invoke('git:branches'),
    checkout: (branch: string) => ipcRenderer.invoke('git:checkout', branch),
    createBranch: (name: string) => ipcRenderer.invoke('git:create-branch', name),
    merge: (branch: string, confirmed: boolean) =>
      ipcRenderer.invoke('git:merge', branch, confirmed),
    stash: (message?: string) => ipcRenderer.invoke('git:stash', message),
    stashPop: () => ipcRenderer.invoke('git:stash-pop'),
    tags: () => ipcRenderer.invoke('git:tags'),
    createTag: (name: string, message: string) =>
      ipcRenderer.invoke('git:create-tag', name, message),
    reset: (reference: string, mode: 'soft' | 'mixed', confirmed: boolean) =>
      ipcRenderer.invoke('git:reset', reference, mode, confirmed),
    revert: (hash: string, confirmed: boolean) => ipcRenderer.invoke('git:revert', hash, confirmed),
    conflicts: () => ipcRenderer.invoke('git:conflicts'),
    resolveConflict: (path: string, resolution: 'ours' | 'theirs' | 'manual') =>
      ipcRenderer.invoke('git:resolve-conflict', path, resolution),
    push: (confirmed: boolean) => ipcRenderer.invoke('git:push', confirmed),
    pull: (confirmed: boolean) => ipcRenderer.invoke('git:pull', confirmed),
  },
  github: {
    authStatus: () => ipcRenderer.invoke('github:auth-status'),
    createRepository: (input: unknown) => ipcRenderer.invoke('github:create-repository', input),
    clone: (repository: string, confirmed: boolean) =>
      ipcRenderer.invoke('github:clone', repository, confirmed),
    fork: (confirmed: boolean) => ipcRenderer.invoke('github:fork', confirmed),
    open: () => ipcRenderer.invoke('github:open'),
    issues: () => ipcRenderer.invoke('github:issues'),
    createIssue: (input: unknown) => ipcRenderer.invoke('github:create-issue', input),
    pullRequests: () => ipcRenderer.invoke('github:pull-requests'),
    createPullRequest: (input: unknown) => ipcRenderer.invoke('github:create-pull-request', input),
    workflowRuns: () => ipcRenderer.invoke('github:workflow-runs'),
    releases: () => ipcRenderer.invoke('github:releases'),
    createRelease: (input: unknown) => ipcRenderer.invoke('github:create-release', input),
  },
  runner: {
    detect: () => ipcRenderer.invoke('runner:detect'),
    start: (processId: string, command: string) =>
      ipcRenderer.send('runner:start', processId, command),
    stop: (processId: string) => ipcRenderer.invoke('runner:stop', processId),
    isRunning: (processId: string) => ipcRenderer.invoke('runner:is-running', processId),
    onEvent: (listener: (event: unknown) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, ev: unknown) => listener(ev);
      ipcRenderer.on('runner:event', handler);
      return () => ipcRenderer.removeListener('runner:event', handler);
    },
  },
  scaffold: {
    templates: () => ipcRenderer.invoke('scaffold:templates'),
    suggest: (description: string) => ipcRenderer.invoke('scaffold:suggest', description),
    chooseDir: () => ipcRenderer.invoke('scaffold:choose-dir'),
    create: (options: unknown) => ipcRenderer.invoke('scaffold:create', options),
    onProgress: (listener: (progress: unknown) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, progress: unknown) => listener(progress);
      ipcRenderer.on('scaffold:progress', handler);
      return () => ipcRenderer.removeListener('scaffold:progress', handler);
    },
  },
});
