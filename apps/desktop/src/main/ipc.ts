import { dialog, ipcMain, shell } from 'electron';
import { promises as nodeFs } from 'node:fs';
import path from 'node:path';
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
import { FileEditService } from './services/file-edit-service';
import { FilesystemService } from './services/filesystem-service';
import { GitService } from './services/git-service';
import { GitHubService } from './services/github-service';
import { ProviderService } from './services/provider-service';
import { RunnerService } from './services/runner-service';
import { PreviewService, isLocalUrl } from './services/preview-service';
import { DeploymentService } from './services/deployment-service';
import { ScaffoldService, PROJECT_TEMPLATES, suggestProject } from './services/scaffold-service';
import type { ProjectCreationOptions } from '../shared/project-creation';
import type { DeployRequest } from '../shared/deployment';
import type { RuntimeAction } from '../shared/runtime';
import {
  assessCommand,
  scanForSecrets,
  redactContent,
  classifyCommand,
  prepareRemoteContext,
  type CommandPolicy,
} from './services/secret-scanner';
import { SecureStorage } from './services/secure-storage';

const service = new EnvironmentService();
const secureStorage = new SecureStorage();
const providerService = new ProviderService(secureStorage);
const fsService = new FilesystemService();
const checkpointService = new CheckpointService();
const fileEditService = new FileEditService(fsService, checkpointService);
const gitService = new GitService();
const githubService = new GitHubService();
const agentService = new AgentService(
  providerService,
  fileEditService,
  fsService,
  checkpointService,
  gitService,
  githubService,
);
const runnerService = new RunnerService();
const previewService = new PreviewService();
const deploymentService = new DeploymentService(runnerService);
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

const isValidDeployRequest = (value: unknown): value is DeployRequest => {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<DeployRequest>;
  if (
    !['vercel', 'firebase', 'supabase', 'github-pages'].includes(request.provider ?? '') ||
    !['preview', 'production'].includes(request.environment ?? '') ||
    typeof request.confirmed !== 'boolean' ||
    !request.config ||
    typeof request.config !== 'object'
  )
    return false;
  return Object.values(request.config).every(
    (entry) => entry === undefined || (typeof entry === 'string' && entry.length <= 500),
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
  const versionControl = request.versionControl;
  if (
    versionControl &&
    (typeof versionControl.checkpoint !== 'boolean' ||
      typeof versionControl.commit !== 'boolean' ||
      typeof versionControl.branch !== 'boolean' ||
      typeof versionControl.pullRequest !== 'boolean' ||
      typeof versionControl.pushConfirmed !== 'boolean' ||
      typeof versionControl.pullRequestConfirmed !== 'boolean' ||
      (versionControl.pullRequest &&
        (!versionControl.pushConfirmed || !versionControl.pullRequestConfirmed)))
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

const isValidProjectCreationOptions = (value: unknown): value is ProjectCreationOptions => {
  if (!value || typeof value !== 'object') return false;
  const options = value as Partial<ProjectCreationOptions>;
  return (
    typeof options.description === 'string' &&
    options.description.length <= 2000 &&
    typeof options.templateId === 'string' &&
    PROJECT_TEMPLATES.some(({ id }) => id === options.templateId) &&
    typeof options.parentPath === 'string' &&
    options.parentPath.length > 0 &&
    options.parentPath.length <= 2000 &&
    typeof options.projectName === 'string' &&
    options.projectName.length > 0 &&
    options.projectName.length <= 64 &&
    typeof options.installDependencies === 'boolean' &&
    typeof options.initializeGit === 'boolean' &&
    Boolean(options.github) &&
    typeof options.github?.enabled === 'boolean' &&
    typeof options.github.confirmed === 'boolean' &&
    ['private', 'public'].includes(options.github.visibility ?? '') &&
    ['none', 'firebase', 'supabase', 'vercel'].includes(options.integration ?? '') &&
    typeof options.integrationConfirmed === 'boolean' &&
    typeof options.startAfterCreate === 'boolean'
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
    if (typeof relative !== 'string' || relative.length > 2000)
      throw new Error('Caminho inválido.');
    return fsService.readFile(relative);
  });
  ipcMain.handle('fs:write-file', (_event, relative: string, content: string) => {
    if (typeof relative !== 'string' || relative.length > 2000)
      throw new Error('Caminho inválido.');
    if (typeof content !== 'string' || content.length > 5_000_000)
      throw new Error('Conteúdo inválido.');
    return fsService.writeFile(relative, content);
  });
  ipcMain.handle('fs:create-dir', (_event, relative: string) => {
    if (typeof relative !== 'string' || relative.length > 2000)
      throw new Error('Caminho inválido.');
    return fsService.createDir(relative);
  });
  ipcMain.handle('fs:delete', (_event, relative: string, confirmed: boolean) => {
    if (typeof relative !== 'string' || relative.length > 2000)
      throw new Error('Caminho inválido.');
    return fsService.deleteEntry(relative, confirmed === true);
  });
  ipcMain.handle('fs:rename', (_event, oldPath: string, newPath: string) => {
    if (typeof oldPath !== 'string' || typeof newPath !== 'string')
      throw new Error('Caminho inválido.');
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
  ipcMain.handle('fs:prepare-remote-context', (_event, files: unknown) => {
    if (!Array.isArray(files) || files.length > 20) throw new Error('Contexto inválido.');
    const safeFiles = files.filter(
      (file): file is { path: string; content: string } =>
        Boolean(file) &&
        typeof file.path === 'string' &&
        file.path.length <= 2000 &&
        typeof file.content === 'string' &&
        file.content.length <= 200_000,
    );
    if (safeFiles.length !== files.length) throw new Error('Contexto inválido.');
    return prepareRemoteContext(safeFiles);
  });
  ipcMain.handle('security:assess-command', (_event, command: string, policy: CommandPolicy) => {
    if (
      typeof command !== 'string' ||
      !policy ||
      typeof policy.globallyAllowed !== 'boolean' ||
      typeof policy.yoloEnabled !== 'boolean' ||
      typeof policy.explicitAcknowledgement !== 'boolean'
    ) {
      return assessCommand('', {
        globallyAllowed: false,
        yoloEnabled: false,
        explicitAcknowledgement: false,
      });
    }
    return assessCommand(command, policy);
  });

  // ── AI edit review ───────────────────────────────────────────────────────
  ipcMain.handle('edits:list', () => fileEditService.list());
  ipcMain.handle('edits:propose', (_event, title: string, files: unknown) => {
    if (typeof title !== 'string' || !Array.isArray(files)) throw new Error('Proposta inválida.');
    const valid = files.every(
      (file) =>
        Boolean(file) &&
        typeof file === 'object' &&
        typeof (file as { path?: unknown }).path === 'string' &&
        (file as { path: string }).path.length <= 2000 &&
        ((file as { proposedContent?: unknown }).proposedContent === null ||
          (typeof (file as { proposedContent?: unknown }).proposedContent === 'string' &&
            (file as { proposedContent: string }).proposedContent.length <= 5_000_000)),
    );
    if (!valid) throw new Error('Proposta inválida.');
    return fileEditService.propose(title, files as never);
  });
  ipcMain.handle('edits:apply', (_event, id: string, selections: unknown) => {
    if (typeof id !== 'string' || !Array.isArray(selections)) throw new Error('Revisão inválida.');
    const valid =
      selections.length <= 25 &&
      selections.every(
        (selection) =>
          Boolean(selection) &&
          typeof selection === 'object' &&
          typeof (selection as { path?: unknown }).path === 'string' &&
          typeof (selection as { accepted?: unknown }).accepted === 'boolean' &&
          ((selection as { blockIds?: unknown }).blockIds === undefined ||
            (Array.isArray((selection as { blockIds?: unknown }).blockIds) &&
              (selection as { blockIds: unknown[] }).blockIds.length <= 500 &&
              (selection as { blockIds: unknown[] }).blockIds.every(
                (blockId) => typeof blockId === 'string',
              ))) &&
          ((selection as { editedContent?: unknown }).editedContent === undefined ||
            (typeof (selection as { editedContent?: unknown }).editedContent === 'string' &&
              (selection as { editedContent: string }).editedContent.length <= 5_000_000)),
      );
    if (!valid) throw new Error('Revisão inválida.');
    return fileEditService.apply(id, selections as never);
  });
  ipcMain.handle('edits:reject', (_event, id: string) => {
    if (typeof id !== 'string') throw new Error('Proposta inválida.');
    return fileEditService.reject(id);
  });
  ipcMain.handle('edits:history', () => fileEditService.history());
  ipcMain.handle('edits:rollback', (_event, id: string) => {
    if (typeof id !== 'string') throw new Error('Checkpoint inválido.');
    return fileEditService.rollback(id);
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
    if (typeof id !== 'string') throw new Error('ID inválido.');
    return fileEditService.rollback(id);
  });
  ipcMain.handle('checkpoint:remove', (_event, id: string) => {
    const workspace = fsService.getWorkspace();
    if (typeof id !== 'string' || !workspace) throw new Error('ID inválido.');
    return checkpointService.remove(id, workspace);
  });

  // ── Git ───────────────────────────────────────────────────────────────────
  ipcMain.handle('git:is-repo', () => {
    const w = fsService.getWorkspace();
    return w ? gitService.isRepo(w) : false;
  });
  ipcMain.handle('git:status', () => {
    const w = fsService.getWorkspace();
    if (!w) return { branch: '', tracking: null, ahead: 0, behind: 0, files: [] };
    return gitService
      .status(w)
      .catch(() => ({ branch: '', tracking: null, ahead: 0, behind: 0, files: [] }));
  });
  ipcMain.handle('git:diff', (_event, staged: boolean, filePath?: string) => {
    const w = fsService.getWorkspace();
    if (!w) return '';
    if (filePath !== undefined && typeof filePath !== 'string') throw new Error('Path inválido.');
    return gitService.diff(w, Boolean(staged), filePath).catch(() => '');
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
    if (!w || typeof message !== 'string' || message.length > 1000)
      throw new Error('Mensagem inválida.');
    return gitService.commit(w, message);
  });
  ipcMain.handle('git:suggest-commit', async () => {
    const w = fsService.getWorkspace();
    if (!w) throw new Error('Nenhum workspace aberto.');
    const status = await gitService.status(w);
    return gitService.suggestCommitMessage(status.files.filter(({ staged }) => staged));
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
    if (!w || typeof branch !== 'string' || branch.length > 200)
      throw new Error('Branch inválida.');
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
  ipcMain.handle('git:merge', (_event, branch: string, confirmed: boolean) => {
    const w = fsService.getWorkspace();
    if (!w || typeof branch !== 'string') throw new Error('Branch inválida.');
    return gitService.merge(w, branch, confirmed === true);
  });
  ipcMain.handle('git:tags', () => {
    const w = fsService.getWorkspace();
    return w ? gitService.tags(w) : [];
  });
  ipcMain.handle('git:create-tag', (_event, name: string, message: string) => {
    const w = fsService.getWorkspace();
    if (!w || typeof name !== 'string' || typeof message !== 'string')
      throw new Error('Tag inválida.');
    return gitService.createTag(w, name, message);
  });
  ipcMain.handle(
    'git:reset',
    (_event, reference: string, mode: 'soft' | 'mixed', confirmed: boolean) => {
      const w = fsService.getWorkspace();
      if (!w || typeof reference !== 'string') throw new Error('Referência inválida.');
      return gitService.reset(w, reference, mode, confirmed === true);
    },
  );
  ipcMain.handle('git:revert', (_event, hash: string, confirmed: boolean) => {
    const w = fsService.getWorkspace();
    if (!w || typeof hash !== 'string') throw new Error('Commit inválido.');
    return gitService.revert(w, hash, confirmed === true);
  });
  ipcMain.handle('git:conflicts', () => {
    const w = fsService.getWorkspace();
    return w ? gitService.conflicts(w) : [];
  });
  ipcMain.handle(
    'git:resolve-conflict',
    (_event, filePath: string, resolution: 'ours' | 'theirs' | 'manual') => {
      const w = fsService.getWorkspace();
      if (!w || typeof filePath !== 'string') throw new Error('Arquivo inválido.');
      return gitService.resolveConflict(w, filePath, resolution);
    },
  );
  ipcMain.handle('git:push', (_event, confirmed: boolean) => {
    const w = fsService.getWorkspace();
    if (!w) throw new Error('Nenhum workspace aberto.');
    return gitService.push(w, confirmed === true);
  });
  ipcMain.handle('git:pull', (_event, confirmed: boolean) => {
    const w = fsService.getWorkspace();
    if (!w) throw new Error('Nenhum workspace aberto.');
    return gitService.pull(w, confirmed === true);
  });

  // ── GitHub ───────────────────────────────────────────────────────────────
  ipcMain.handle('github:auth-status', () =>
    githubService.authStatus(fsService.getWorkspace() ?? process.cwd()),
  );
  ipcMain.handle('github:create-repository', (_event, input: unknown) => {
    const w = fsService.getWorkspace();
    if (!w || !input || typeof input !== 'object') throw new Error('Repositório inválido.');
    return githubService.createRepository(w, input as never);
  });
  ipcMain.handle('github:clone', async (_event, repository: string, confirmed: boolean) => {
    if (typeof repository !== 'string') throw new Error('Repositório inválido.');
    const selection = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    const parent = selection.canceled ? null : selection.filePaths[0];
    if (!parent) return null;
    const folder = await githubService.clone(parent, repository, confirmed === true);
    const workspace = path.join(parent, folder);
    fsService.setWorkspace(workspace);
    return workspace;
  });
  ipcMain.handle('github:fork', (_event, confirmed: boolean) => {
    const w = fsService.getWorkspace();
    if (!w) throw new Error('Nenhum workspace aberto.');
    return githubService.fork(w, confirmed === true);
  });
  ipcMain.handle('github:open', async () => {
    const w = fsService.getWorkspace();
    if (!w) throw new Error('Nenhum workspace aberto.');
    const url = await githubService.repositoryUrl(w);
    if (!url.startsWith('https://github.com/')) throw new Error('URL do repositório inválida.');
    await shell.openExternal(url);
    return url;
  });
  ipcMain.handle('github:issues', () => {
    const w = fsService.getWorkspace();
    return w ? githubService.issues(w) : [];
  });
  ipcMain.handle('github:create-issue', (_event, input: unknown) => {
    const w = fsService.getWorkspace();
    if (!w || !input || typeof input !== 'object') throw new Error('Issue inválida.');
    return githubService.createIssue(w, input as never);
  });
  ipcMain.handle('github:pull-requests', () => {
    const w = fsService.getWorkspace();
    return w ? githubService.pullRequests(w) : [];
  });
  ipcMain.handle('github:create-pull-request', (_event, input: unknown) => {
    const w = fsService.getWorkspace();
    if (!w || !input || typeof input !== 'object') throw new Error('Pull request inválido.');
    return githubService.createPullRequest(w, input as never);
  });
  ipcMain.handle('github:workflow-runs', () => {
    const w = fsService.getWorkspace();
    return w ? githubService.workflowRuns(w) : [];
  });
  ipcMain.handle('github:releases', () => {
    const w = fsService.getWorkspace();
    return w ? githubService.releases(w) : [];
  });
  ipcMain.handle('github:create-release', (_event, input: unknown) => {
    const w = fsService.getWorkspace();
    if (!w || !input || typeof input !== 'object') throw new Error('Release inválida.');
    return githubService.createRelease(w, input as never);
  });

  // ── Runner ────────────────────────────────────────────────────────────────
  ipcMain.handle('runner:detect', () => {
    const w = fsService.getWorkspace();
    if (!w) return null;
    return runnerService.detectProject(w).catch(() => null);
  });
  ipcMain.on('runner:start', (event, processId: string, action: RuntimeAction) => {
    const w = fsService.getWorkspace();
    if (
      !w ||
      typeof processId !== 'string' ||
      !['install', 'dev', 'build', 'test'].includes(action)
    )
      return;
    void runnerService.start(processId, w, action, (ev) => event.sender.send('runner:event', ev));
  });
  ipcMain.handle('runner:restart', async (_event, processId: string, action: RuntimeAction) => {
    const w = fsService.getWorkspace();
    if (!w || !['install', 'dev', 'build', 'test'].includes(action)) return false;
    await runnerService.restart(processId, w, action);
    return true;
  });
  ipcMain.handle('runner:stop', async (_event, processId: string) => {
    await runnerService.stop(processId);
    return true;
  });
  ipcMain.handle('runner:is-running', (_event, processId: string) =>
    runnerService.isRunning(processId),
  );

  // ── Preview ───────────────────────────────────────────────────────────────
  ipcMain.handle('preview:connect', (_event, target: string) => previewService.connect(target));
  ipcMain.handle('preview:open-external', async (_event, target: string) => {
    const url = isLocalUrl(target);
    await shell.openExternal(url.toString());
    return true;
  });
  ipcMain.handle(
    'preview:screenshot',
    async (event, rect: { x: number; y: number; width: number; height: number }) => {
      if (
        !rect ||
        [rect.x, rect.y, rect.width, rect.height].some((value) => !Number.isFinite(value)) ||
        rect.width < 1 ||
        rect.height < 1 ||
        rect.width > 10_000 ||
        rect.height > 10_000
      )
        throw new Error('Área de captura inválida.');
      const image = await event.sender.capturePage(rect);
      const choice = await dialog.showSaveDialog({
        defaultPath: `visualnscode-preview-${new Date().toISOString().replaceAll(':', '-').slice(0, 19)}.png`,
        filters: [{ name: 'PNG', extensions: ['png'] }],
      });
      if (choice.canceled || !choice.filePath) return null;
      await nodeFs.writeFile(choice.filePath, image.toPNG());
      return choice.filePath;
    },
  );

  // ── Deploy ────────────────────────────────────────────────────────────────
  ipcMain.handle('deploy:plan', (_event, request: DeployRequest) => {
    if (!isValidDeployRequest(request)) throw new Error('Serviço de deploy inválido.');
    return deploymentService.plan(request);
  });
  ipcMain.handle('deploy:start', async (event, request: DeployRequest) => {
    const w = fsService.getWorkspace();
    if (!w) throw new Error('Abra um projeto antes de publicar.');
    if (!isValidDeployRequest(request)) throw new Error('Configuração de deploy inválida.');
    return deploymentService.deploy(w, request, (deployEvent) =>
      event.sender.send('deploy:event', deployEvent),
    );
  });
  ipcMain.handle('deploy:history', () => {
    const w = fsService.getWorkspace();
    return w ? deploymentService.history(w) : [];
  });

  // ── Scaffold ──────────────────────────────────────────────────────────────
  ipcMain.handle('scaffold:templates', () => PROJECT_TEMPLATES);
  ipcMain.handle('scaffold:suggest', (_event, description: string) => {
    if (
      typeof description !== 'string' ||
      description.trim().length < 3 ||
      description.length > 2000
    ) {
      throw new Error('Descreva o projeto em pelo menos três caracteres.');
    }
    return suggestProject(description);
  });
  ipcMain.handle('scaffold:choose-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  ipcMain.handle('scaffold:create', async (event, options: ProjectCreationOptions) => {
    if (!isValidProjectCreationOptions(options)) {
      throw new Error('Os dados do novo projeto são inválidos.');
    }
    const result = await scaffoldService.create(options, (progress) => {
      event.sender.send('scaffold:progress', progress);
    });
    if (result.success) fsService.setWorkspace(result.path);
    return result;
  });
};
