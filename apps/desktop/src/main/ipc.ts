import { dialog, ipcMain, shell } from 'electron';
import {
  getToolDefinition,
  type PermissionId,
  type ToolActionRequest,
} from '@visualnscode/integrations';
import {
  getProviderDescriptor,
  providerCatalog,
  type AgentInput,
  type ProviderSettings,
} from '@visualnscode/providers';
import type { AgentDefinition, TeamWorkflow } from '@visualnscode/agents';
import { AgentService, type AgentRunRequest } from './services/agent-service';
import { CheckpointService } from './services/checkpoint-service';
import { EnvironmentService } from './services/environment-service';
import { FilesystemService } from './services/filesystem-service';
import { GitService } from './services/git-service';
import { ProviderService } from './services/provider-service';
import { RunnerService } from './services/runner-service';
import { ScaffoldService, PROJECT_TEMPLATES } from './services/scaffold-service';
import { scanForSecrets, redactContent, classifyCommand } from './services/secret-scanner';
import { SecureStorage } from './services/secure-storage';

const service = new EnvironmentService();
const secureStorage = new SecureStorage();
const providerService = new ProviderService(secureStorage);
const agentService = new AgentService(providerService);
const fsService = new FilesystemService();
const checkpointService = new CheckpointService();
const gitService = new GitService();
const runnerService = new RunnerService();
const scaffoldService = new ScaffoldService();
const providerIds = new Set(
  providerCatalog.filter(({ type }) => type === 'api').map(({ id }) => id),
);

const isValidAgentInput = (value: unknown): value is AgentInput => {
  if (!value || typeof value !== 'object') return false;
  const input = value as Partial<AgentInput>;
  if (!Array.isArray(input.messages) || !Array.isArray(input.contextFiles ?? [])) return false;
  const contextLength = (input.contextFiles ?? []).reduce(
    (total, file) => total + (typeof file.content === 'string' ? file.content.length : 0),
    0,
  );
  return (
    typeof input.requestId === 'string' &&
    input.requestId.length >= 8 &&
    input.requestId.length <= 100 &&
    typeof input.model === 'string' &&
    input.model.length <= 200 &&
    input.messages.length > 0 &&
    input.messages.length <= 100 &&
    input.messages.every(
      (message) =>
        Boolean(message) &&
        typeof message.id === 'string' &&
        ['system', 'user', 'assistant'].includes(message.role) &&
        typeof message.content === 'string' &&
        message.content.length <= 200_000,
    ) &&
    (input.contextFiles ?? []).every(
      (file) => Boolean(file) && typeof file.path === 'string' && typeof file.content === 'string',
    ) &&
    (input.contextFiles?.length ?? 0) <= 20 &&
    contextLength <= 1_000_000
  );
};

const isValidAgentDefinition = (value: unknown): value is AgentDefinition => {
  if (!value || typeof value !== 'object') return false;
  const agent = value as Partial<AgentDefinition>;
  return (
    typeof agent.id === 'string' &&
    agent.id.length > 0 &&
    agent.id.length <= 100 &&
    typeof agent.name === 'string' &&
    agent.name.length <= 100 &&
    typeof agent.description === 'string' &&
    agent.description.length <= 1000 &&
    typeof agent.providerId === 'string' &&
    Boolean(getProviderDescriptor(agent.providerId)) &&
    typeof agent.model === 'string' &&
    agent.model.length <= 200 &&
    typeof agent.systemPrompt === 'string' &&
    agent.systemPrompt.length <= 20_000 &&
    Array.isArray(agent.allowedTools) &&
    agent.allowedTools.length <= 20 &&
    Array.isArray(agent.allowedFolders) &&
    agent.allowedFolders.length <= 20 &&
    agent.allowedFolders.every((folder) => typeof folder === 'string' && folder.length <= 1000) &&
    typeof agent.costLimitUsd === 'number' &&
    agent.costLimitUsd >= 0 &&
    agent.costLimitUsd <= 10_000 &&
    typeof agent.timeoutMs === 'number' &&
    agent.timeoutMs >= 1000 &&
    agent.timeoutMs <= 3_600_000 &&
    ['ask', 'guided', 'autonomous'].includes(agent.autonomy ?? '') &&
    ['none', 'safe', 'allowlisted'].includes(agent.terminalPermission ?? '') &&
    ['none', 'propose', 'workspace'].includes(agent.editPermission ?? '')
  );
};

const isValidWorkflow = (value: unknown): value is TeamWorkflow => {
  if (!value || typeof value !== 'object') return false;
  const workflow = value as Partial<TeamWorkflow>;
  return (
    typeof workflow.id === 'string' &&
    workflow.id.length <= 100 &&
    typeof workflow.name === 'string' &&
    workflow.name.length <= 100 &&
    typeof workflow.description === 'string' &&
    workflow.description.length <= 1000 &&
    Array.isArray(workflow.nodes) &&
    workflow.nodes.length > 0 &&
    workflow.nodes.length <= 50 &&
    workflow.nodes.every(
      (node) =>
        typeof node.id === 'string' &&
        typeof node.agentId === 'string' &&
        Number.isFinite(node.position?.x) &&
        Number.isFinite(node.position?.y),
    ) &&
    Array.isArray(workflow.edges) &&
    workflow.edges.length <= 100 &&
    workflow.edges.every(
      (edge) =>
        typeof edge.id === 'string' &&
        typeof edge.source === 'string' &&
        typeof edge.target === 'string',
    ) &&
    typeof workflow.maxCostUsd === 'number' &&
    workflow.maxCostUsd >= 0 &&
    workflow.maxCostUsd <= 100_000 &&
    typeof workflow.timeoutMs === 'number' &&
    workflow.timeoutMs >= 1000 &&
    workflow.timeoutMs <= 86_400_000 &&
    typeof workflow.maxSteps === 'number' &&
    workflow.maxSteps >= 1 &&
    workflow.maxSteps <= 1000 &&
    typeof workflow.retries === 'number' &&
    workflow.retries >= 0 &&
    workflow.retries <= 5
  );
};

const isValidAgentRunRequest = (value: unknown): value is AgentRunRequest => {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<AgentRunRequest>;
  if (
    typeof request.runId !== 'string' ||
    request.runId.length < 8 ||
    request.runId.length > 100 ||
    typeof request.task !== 'string' ||
    request.task.length === 0 ||
    request.task.length > 20_000 ||
    !isValidWorkflow(request.workflow) ||
    !Array.isArray(request.agents) ||
    request.agents.length === 0 ||
    request.agents.length > 50 ||
    !request.agents.every(isValidAgentDefinition) ||
    !request.relevantContext ||
    typeof request.relevantContext !== 'object'
  ) {
    return false;
  }
  const entries = Object.entries(request.relevantContext);
  return (
    entries.length <= 20 &&
    entries.every(([path, content]) => path.length <= 1000 && content.length <= 200_000) &&
    entries.reduce((total, [, content]) => total + content.length, 0) <= 1_000_000
  );
};

export const registerEnvironmentIpc = (): void => {
  ipcMain.handle('environment:detect-all', () => service.detectAll());
  ipcMain.handle('environment:detect', (_event, toolId: string) => service.detect(toolId));
  ipcMain.handle('environment:perform', (_event, request: ToolActionRequest) =>
    service.perform(request),
  );
  ipcMain.handle('environment:permissions', () => service.permissions.list());
  ipcMain.handle('environment:set-permission', (_event, id: PermissionId, granted: boolean) => {
    service.setPermission(id, granted);
    return service.permissions.list();
  });
  ipcMain.handle('environment:open-docs', async (_event, toolId: string) => {
    const definition = getToolDefinition(toolId);
    if (!definition) return false;
    await shell.openExternal(definition.documentationUrl);
    return true;
  });
  ipcMain.handle('environment:secret-status', async (_event, providerId: string) => ({
    available: secureStorage.isSecureAvailable(),
    configured:
      providerIds.has(providerId) && Boolean(await secureStorage.get(`provider:${providerId}`)),
  }));
  ipcMain.handle('environment:store-secret', async (_event, providerId: string, secret: string) => {
    if (!providerIds.has(providerId) || !service.permissions.has('credentials')) return false;
    if (secret.length < 8 || secret.length > 4096) return false;
    await secureStorage.set(`provider:${providerId}`, secret);
    return true;
  });
  ipcMain.handle('environment:remove-secret', async (_event, providerId: string) => {
    if (!providerIds.has(providerId) || !service.permissions.has('credentials')) return false;
    await secureStorage.remove(`provider:${providerId}`);
    return true;
  });

  ipcMain.handle('providers:list', () => providerService.list());
  ipcMain.handle('providers:update', (_event, settings: ProviderSettings) =>
    providerService.update(settings),
  );
  ipcMain.handle('providers:test', (_event, providerId: string) =>
    getProviderDescriptor(providerId)
      ? providerService.test(providerId)
      : { ok: false, message: 'Provider desconhecido.', models: [] },
  );
  ipcMain.handle('providers:models', (_event, providerId: string) =>
    getProviderDescriptor(providerId) ? providerService.models(providerId) : [],
  );
  ipcMain.on('chat:start', (event, payload: unknown) => {
    const send = (chunk: unknown): void => event.sender.send('chat:chunk', chunk);
    const candidate = payload as { providerId?: unknown; input?: unknown } | null;
    if (
      !candidate ||
      typeof candidate.providerId !== 'string' ||
      !getProviderDescriptor(candidate.providerId) ||
      !isValidAgentInput(candidate.input)
    ) {
      send({
        type: 'error',
        requestId:
          candidate?.input &&
          typeof candidate.input === 'object' &&
          'requestId' in candidate.input &&
          typeof candidate.input.requestId === 'string'
            ? candidate.input.requestId
            : 'invalid-request',
        message: 'A solicitação do chat é inválida.',
      });
      return;
    }
    const input = candidate.input;
    const providerId = candidate.providerId;
    void providerService.stream(providerId, input, send).catch((error: unknown) =>
      send({
        type: 'error',
        requestId: input.requestId,
        message: error instanceof Error ? error.message : 'Falha ao iniciar o chat.',
      }),
    );
  });
  ipcMain.handle('chat:cancel', (_event, requestId: string) => providerService.cancel(requestId));

  ipcMain.handle('agents:history', () => agentService.history());
  ipcMain.on('agents:start', (event, payload: unknown) => {
    const send = (workflowEvent: unknown): void => event.sender.send('agents:event', workflowEvent);
    if (!isValidAgentRunRequest(payload)) {
      send({
        type: 'run-completed',
        runId: 'invalid-run',
        result: { status: 'failed', error: 'A configuração da equipe é inválida.' },
      });
      return;
    }
    void agentService.start(payload, send).catch((error: unknown) =>
      send({
        type: 'run-completed',
        runId: payload.runId,
        result: {
          id: payload.runId,
          workflowId: payload.workflow.id,
          task: payload.task,
          status: 'failed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          costUsd: 0,
          steps: 0,
          rolledBack: false,
          agentRuns: [],
          logs: [],
          error: error instanceof Error ? error.message : 'Falha ao iniciar a equipe.',
        },
      }),
    );
  });
  ipcMain.handle('agents:cancel', (_event, runId: string) => {
    if (runId.length > 100) return false;
    agentService.cancel(runId);
    return true;
  });
  ipcMain.handle('agents:approve', (_event, runId: string, actionId: string, approved: boolean) => {
    if (runId.length > 100 || actionId.length > 200) return false;
    return agentService.approve(runId, actionId, Boolean(approved));
  });

  // ── Filesystem ────────────────────────────────────────────────────────────
  ipcMain.handle('fs:open-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths[0]) return null;
    fsService.setWorkspace(result.filePaths[0]);
    return result.filePaths[0];
  });
  ipcMain.handle('fs:set-workspace', (_event, p: string) => {
    if (typeof p !== 'string' || p.length > 2000) return false;
    fsService.setWorkspace(p);
    return true;
  });
  ipcMain.handle('fs:get-workspace', () => fsService.getWorkspace());
  ipcMain.handle('fs:list-dir', (_event, relative: string) => {
    if (typeof relative !== 'string') return [];
    return fsService.listDir(relative).catch(() => []);
  });
  ipcMain.handle('fs:read-file', (_event, relative: string) => {
    if (typeof relative !== 'string' || relative.length > 2000) throw new Error('Caminho inválido.');
    return fsService.readFile(relative);
  });
  ipcMain.handle('fs:write-file', (_event, relative: string, content: string) => {
    if (typeof relative !== 'string' || relative.length > 2000) throw new Error('Caminho inválido.');
    if (typeof content !== 'string' || content.length > 5_000_000) throw new Error('Conteúdo inválido.');
    return fsService.writeFile(relative, content);
  });
  ipcMain.handle('fs:create-dir', (_event, relative: string) => {
    if (typeof relative !== 'string' || relative.length > 2000) throw new Error('Caminho inválido.');
    return fsService.createDir(relative);
  });
  ipcMain.handle('fs:delete', (_event, relative: string) => {
    if (typeof relative !== 'string' || relative.length > 2000) throw new Error('Caminho inválido.');
    return fsService.deleteEntry(relative);
  });
  ipcMain.handle('fs:rename', (_event, oldPath: string, newPath: string) => {
    if (typeof oldPath !== 'string' || typeof newPath !== 'string') throw new Error('Caminho inválido.');
    return fsService.rename(oldPath, newPath);
  });
  ipcMain.handle('fs:scan-secrets', (_event, filename: string, content: string) => {
    if (typeof filename !== 'string' || typeof content !== 'string') return [];
    return scanForSecrets(filename, content);
  });
  ipcMain.handle('fs:redact', (_event, content: string) => {
    if (typeof content !== 'string') return '';
    return redactContent(content);
  });
  ipcMain.handle('fs:classify-command', (_event, command: string) => {
    if (typeof command !== 'string' || command.length > 4000) return 'blocked';
    return classifyCommand(command);
  });

  // ── Checkpoints ───────────────────────────────────────────────────────────
  ipcMain.handle('checkpoint:create', (_event, label: string, files: unknown) => {
    const workspace = fsService.getWorkspace();
    if (!workspace) throw new Error('Nenhum workspace aberto.');
    if (typeof label !== 'string' || label.length > 200) throw new Error('Label inválida.');
    if (!Array.isArray(files)) throw new Error('Files inválidos.');
    return checkpointService.create(workspace, files as never, label);
  });
  ipcMain.handle('checkpoint:list', () => {
    const workspace = fsService.getWorkspace();
    if (!workspace) return [];
    return checkpointService.list(workspace);
  });
  ipcMain.handle('checkpoint:restore', async (_event, id: string) => {
    if (typeof id !== 'string' || !/^cp-/.test(id)) throw new Error('ID inválido.');
    const entry = await checkpointService.restore(id);
    for (const file of entry.files) {
      await fsService.writeFile(file.relativePath, file.content).catch(() => undefined);
    }
    return entry;
  });
  ipcMain.handle('checkpoint:remove', (_event, id: string) => {
    if (typeof id !== 'string' || !/^cp-/.test(id)) throw new Error('ID inválido.');
    return checkpointService.remove(id);
  });

  // ── Git ───────────────────────────────────────────────────────────────────
  ipcMain.handle('git:is-repo', () => {
    const w = fsService.getWorkspace();
    return w ? gitService.isRepo(w) : false;
  });
  ipcMain.handle('git:status', () => {
    const w = fsService.getWorkspace();
    if (!w) return { branch: '', files: [] };
    return gitService.status(w).catch(() => ({ branch: '', files: [] }));
  });
  ipcMain.handle('git:diff', (_event, staged: boolean) => {
    const w = fsService.getWorkspace();
    if (!w) return '';
    return gitService.diff(w, Boolean(staged)).catch(() => '');
  });
  ipcMain.handle('git:stage', (_event, paths: string[]) => {
    const w = fsService.getWorkspace();
    if (!w || !Array.isArray(paths)) return;
    return gitService.stage(w, paths).catch(() => undefined);
  });
  ipcMain.handle('git:unstage', (_event, paths: string[]) => {
    const w = fsService.getWorkspace();
    if (!w || !Array.isArray(paths)) return;
    return gitService.unstage(w, paths).catch(() => undefined);
  });
  ipcMain.handle('git:commit', (_event, message: string) => {
    const w = fsService.getWorkspace();
    if (!w || typeof message !== 'string' || message.length > 1000) throw new Error('Mensagem inválida.');
    return gitService.commit(w, message);
  });
  ipcMain.handle('git:log', (_event, limit: number) => {
    const w = fsService.getWorkspace();
    if (!w) return [];
    const n = typeof limit === 'number' ? Math.min(Math.max(limit, 1), 100) : 30;
    return gitService.log(w, n).catch(() => []);
  });
  ipcMain.handle('git:branches', () => {
    const w = fsService.getWorkspace();
    if (!w) return [];
    return gitService.branches(w).catch(() => []);
  });
  ipcMain.handle('git:checkout', (_event, branch: string) => {
    const w = fsService.getWorkspace();
    if (!w || typeof branch !== 'string' || branch.length > 200) throw new Error('Branch inválida.');
    return gitService.checkout(w, branch);
  });
  ipcMain.handle('git:create-branch', (_event, name: string) => {
    const w = fsService.getWorkspace();
    if (!w || typeof name !== 'string' || name.length > 200) throw new Error('Nome inválido.');
    return gitService.createBranch(w, name);
  });
  ipcMain.handle('git:stash', (_event, message?: string) => {
    const w = fsService.getWorkspace();
    if (!w) return;
    return gitService.stash(w, message).catch(() => undefined);
  });
  ipcMain.handle('git:stash-pop', () => {
    const w = fsService.getWorkspace();
    if (!w) return;
    return gitService.stashPop(w).catch(() => undefined);
  });

  // ── Runner ────────────────────────────────────────────────────────────────
  ipcMain.handle('runner:detect', () => {
    const w = fsService.getWorkspace();
    if (!w) return null;
    return runnerService.detectProject(w).catch(() => null);
  });
  ipcMain.on('runner:start', (event, processId: string, command: string) => {
    const w = fsService.getWorkspace();
    if (!w || typeof processId !== 'string' || typeof command !== 'string') return;
    runnerService.start(processId, w, command, (ev) => event.sender.send('runner:event', ev));
  });
  ipcMain.handle('runner:stop', (_event, processId: string) => {
    runnerService.stop(processId);
    return true;
  });
  ipcMain.handle('runner:is-running', (_event, processId: string) => runnerService.isRunning(processId));

  // ── Scaffold ──────────────────────────────────────────────────────────────
  ipcMain.handle('scaffold:templates', () => PROJECT_TEMPLATES);
  ipcMain.handle('scaffold:choose-dir', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  ipcMain.on('scaffold:create', (event, templateId: string, projectPath: string, projectName: string) => {
    if (
      typeof templateId !== 'string' ||
      typeof projectPath !== 'string' ||
      typeof projectName !== 'string' ||
      projectName.length > 100 ||
      projectPath.length > 2000
    ) {
      event.sender.send('scaffold:log', 'Parâmetros inválidos.');
      return;
    }
    void scaffoldService.scaffold(templateId, projectPath, projectName, (msg) => {
      event.sender.send('scaffold:log', msg);
    }).then((result) => {
      event.sender.send('scaffold:done', result);
      if (result.success) {
        fsService.setWorkspace(result.path);
      }
    });
  });
};
