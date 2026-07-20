import { app } from 'electron';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  WorkflowEngine,
  decideAgentAction,
  parseAgentOutput,
  type ActionDecision,
  type AgentAction,
  type AgentDefinition,
  type AgentExecutionResult,
  type AgentExecutor,
  type AgentExecutorInput,
  type TeamWorkflow,
  type WorkflowEvent,
  type WorkflowRunResult,
} from '@visualnscode/agents';
import type { AgentChunk, TokenUsage } from '@visualnscode/providers';
import type { AgentVersionControlOptions } from '../../shared/version-control';
import { changedFilesFromAgentRun } from '../../shared/agent-version-control';
import type { CheckpointService } from './checkpoint-service';
import type { FileEditService } from './file-edit-service';
import type { FilesystemService } from './filesystem-service';
import type { GitService } from './git-service';
import type { GitHubService } from './github-service';
import type { ProviderService } from './provider-service';
import { SystemAgentCommandRunner, type AgentCommandRunner } from './agent-command-runner';
import { classifyCommand, redactContent } from './secret-scanner';

export interface AgentRunRequest {
  readonly runId: string;
  readonly workflow: TeamWorkflow;
  readonly agents: readonly AgentDefinition[];
  readonly task: string;
  readonly relevantContext: Readonly<Record<string, string>>;
  readonly versionControl?: AgentVersionControlOptions;
}

interface PendingApproval {
  readonly runId: string;
  readonly resolve: (approved: boolean) => void;
}

interface ActionExecution {
  readonly executed: boolean;
  readonly filesRead: readonly string[];
  readonly commands: readonly string[];
  readonly errors: readonly string[];
  readonly logs: readonly string[];
}

export interface AgentServiceOptions {
  readonly commandRunner?: AgentCommandRunner;
  readonly dataDirectory?: string;
}

const withoutActionContent = (action: AgentAction): AgentAction => {
  const { content, ...safeAction } = action;
  void content;
  return safeAction;
};

class ProviderAgentExecutor implements AgentExecutor {
  constructor(
    private readonly providers: ProviderService,
    private readonly approval: (
      input: AgentExecutorInput,
      action: AgentAction,
      decision: ActionDecision,
    ) => Promise<boolean>,
    private readonly getMemory: (agent: AgentDefinition) => readonly string[],
    private readonly remember: (agent: AgentDefinition, output: string) => void,
    private readonly executeAction: (
      agent: AgentDefinition,
      action: AgentAction,
    ) => Promise<ActionExecution>,
    private readonly workingDirectory?: string,
  ) {}

  async execute(input: AgentExecutorInput): Promise<AgentExecutionResult> {
    let output = '';
    let usage: TokenUsage | null = null;
    const requestId = `${input.runId}-${input.nodeId}-${input.attempt}`.slice(0, 100);
    const memory = this.getMemory(input.agent);
    const userContent = JSON.stringify({
      task: input.context.originalTask,
      previousResults: input.context.previousResults,
      filesChanged: input.context.filesChanged,
      previousErrors: input.context.errors,
      relevantFiles: Object.keys(input.context.relevantContext),
      memory,
    });
    const cancelProvider = () => void this.providers.cancel(requestId);
    input.signal.addEventListener('abort', cancelProvider, { once: true });
    try {
      if (input.signal.aborted) throw new Error('Execução do agente cancelada.');
      await this.providers.stream(
        input.agent.providerId,
        {
          requestId,
          model: input.agent.model,
          messages: [
            {
              id: `${requestId}-system`,
              role: 'system',
              content: `${input.agent.systemPrompt}\n\nVocê opera sob estas restrições: autonomia=${input.agent.autonomy}; ferramentas=${input.agent.allowedTools.join(',')}; pastas=${input.agent.allowedFolders.join(',')}; terminal=${input.agent.terminalPermission}; edição=${input.agent.editPermission}.\nNão execute ações diretamente. Ao final, liste ações desejadas em JSON dentro de <visualnscode-actions>...</visualnscode-actions>. Cada item deve ter type, description, risk e, quando aplicável, path, command ou tool. Ações edit devem incluir content com o conteúdo completo proposto, ou null para solicitar exclusão. Toda edição ainda passará pela revisão visual do usuário.`,
            },
            { id: `${requestId}-user`, role: 'user', content: userContent },
          ],
          contextFiles: Object.entries(input.context.relevantContext).map(([path, content]) => ({
            path,
            content,
          })),
          maxTokens: 8192,
          timeoutMs: input.agent.timeoutMs,
        },
        (chunk: AgentChunk) => {
          if (chunk.type === 'text') output += chunk.text;
          if (chunk.type === 'usage') usage = chunk.usage;
          if (chunk.type === 'error') throw new Error(chunk.message);
        },
        this.workingDirectory ? { workingDirectory: this.workingDirectory } : {},
      );
    } finally {
      input.signal.removeEventListener('abort', cancelProvider);
    }

    const parsed = parseAgentOutput(output);
    const actions: AgentAction[] = [];
    const errors: string[] = [];
    const filesRead: string[] = [...Object.keys(input.context.relevantContext)];
    const commands: string[] = [];
    const logs: string[] = [];
    for (const original of parsed.actions) {
      const commandClassification = original.command ? classifyCommand(original.command) : null;
      const action: AgentAction = {
        ...original,
        id: `${input.nodeId}:${original.id}`,
        ...(commandClassification
          ? {
              risk:
                commandClassification === 'safe'
                  ? ('safe' as const)
                  : commandClassification === 'confirm'
                    ? ('important' as const)
                    : ('destructive' as const),
            }
          : {}),
      };
      if (commandClassification === 'blocked') {
        const reason = 'Comando bloqueado pela política global de segurança.';
        actions.push({
          ...withoutActionContent(action),
          status: 'denied',
          requiresApproval: false,
          decisionReason: reason,
        });
        errors.push(`${action.description}: ${reason}`);
        continue;
      }
      const decision = decideAgentAction(input.agent, action);
      if (!decision.allowed) {
        actions.push({
          ...withoutActionContent(action),
          status: 'denied',
          requiresApproval: false,
          decisionReason: decision.reason,
        });
        errors.push(`${action.description}: ${decision.reason}`);
        continue;
      }
      let approved = true;
      if (decision.requiresApproval) {
        approved = await this.approval(input, action, decision);
      }
      if (!approved) {
        actions.push({
          ...withoutActionContent(action),
          status: 'denied',
          requiresApproval: decision.requiresApproval,
          decisionReason: decision.reason,
        });
        errors.push(`${action.description}: não aprovada.`);
        continue;
      }
      try {
        const execution = await this.executeAction(input.agent, action);
        filesRead.push(...execution.filesRead);
        commands.push(...execution.commands);
        errors.push(...execution.errors);
        logs.push(...execution.logs);
        actions.push({
          ...withoutActionContent(action),
          status: execution.executed ? 'executed' : 'approved',
          requiresApproval: decision.requiresApproval,
          decisionReason: decision.reason,
        });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'A ação não pôde ser executada.';
        actions.push({
          ...withoutActionContent(action),
          status: 'denied',
          requiresApproval: decision.requiresApproval,
          decisionReason: message,
        });
        errors.push(`${action.description}: ${message}`);
      }
    }
    const safeOutput = redactContent(parsed.output);
    this.remember(input.agent, safeOutput);
    const measuredUsage = usage as TokenUsage | null;
    return {
      output: safeOutput,
      filesRead: [...new Set(filesRead)],
      filesChanged: [],
      commands,
      actions,
      errors,
      costUsd: measuredUsage?.estimatedCostUsd ?? 0,
      steps: Math.max(1, actions.length + 1),
      logs: [
        `${input.agent.name} recebeu ${input.context.previousResults.length} resultado(s) anterior(es).`,
        `${actions.length} ação(ões) analisada(s) pela política.`,
        ...logs,
      ],
    };
  }

  async rollback(): Promise<void> {
    // A aplicação de patches será conectada ao workspace real; o engine já preserva o contrato.
  }
}

export class AgentService {
  private readonly historyPath: string;
  private readonly memoryPath: string;
  private readonly commandRunner: AgentCommandRunner;
  private readonly engines = new Map<string, WorkflowEngine>();
  private readonly approvals = new Map<string, PendingApproval>();
  private readonly memories = new Map<string, string[]>();
  private memoriesLoaded = false;
  private persistenceQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly providers: ProviderService,
    private readonly fileEdits?: FileEditService,
    private readonly filesystem?: FilesystemService,
    private readonly checkpoints?: CheckpointService,
    private readonly git?: GitService,
    private readonly github?: GitHubService,
    options: AgentServiceOptions = {},
  ) {
    const dataDirectory = options.dataDirectory ?? app.getPath('userData');
    this.historyPath = join(dataDirectory, 'agent-history.json');
    this.memoryPath = join(dataDirectory, 'agent-memory.json');
    this.commandRunner = options.commandRunner ?? new SystemAgentCommandRunner();
  }

  async start(
    request: AgentRunRequest,
    onEvent: (event: WorkflowEvent) => void,
  ): Promise<WorkflowRunResult> {
    await this.loadMemories();
    const workspace = this.filesystem?.getWorkspace() ?? null;
    const executor = new ProviderAgentExecutor(
      this.providers,
      (input, action, decision) => this.requestApproval(input, action, decision, onEvent),
      (agent) => this.memories.get(this.memoryKey(request.runId, agent, workspace)) ?? [],
      (agent, output) => this.remember(request.runId, agent, output, workspace),
      (agent, action) => this.executeAction(agent, action, workspace),
      workspace ?? undefined,
    );
    const engine = new WorkflowEngine(executor);
    this.engines.set(request.runId, engine);
    try {
      const automationLogs = workspace ? await this.prepareVersionControl(request, workspace) : [];
      const result = await engine.run(request.workflow, request.agents, request.task, {
        runId: request.runId,
        relevantContext: request.relevantContext,
        onEvent: (event) => {
          if (event.type !== 'run-completed') onEvent(event);
        },
      });
      const completedLogs =
        result.status === 'completed' && workspace
          ? await this.completeVersionControl(request, workspace, result)
          : [];
      const finalResult = {
        ...result,
        logs: [...result.logs, ...automationLogs, ...completedLogs],
      };
      onEvent({ type: 'run-completed', runId: request.runId, result: finalResult });
      await this.saveHistory(finalResult);
      await this.saveMemories();
      return finalResult;
    } finally {
      this.engines.delete(request.runId);
      this.resolveRunApprovals(request.runId, false);
      for (const key of this.memories.keys()) {
        if (key.startsWith(`run:${request.runId}:`)) this.memories.delete(key);
      }
    }
  }

  cancel(runId: string): void {
    this.engines.get(runId)?.cancel(runId);
    this.resolveRunApprovals(runId, false);
  }

  approve(runId: string, actionId: string, approved: boolean): boolean {
    const key = `${runId}:${actionId}`;
    const pending = this.approvals.get(key);
    if (!pending) return false;
    this.approvals.delete(key);
    pending.resolve(approved);
    return true;
  }

  async history(): Promise<readonly WorkflowRunResult[]> {
    try {
      const entries = JSON.parse(await readFile(this.historyPath, 'utf8')) as WorkflowRunResult[];
      return entries.slice(0, 50);
    } catch {
      return [];
    }
  }

  private requestApproval(
    input: AgentExecutorInput,
    action: AgentAction,
    decision: ActionDecision,
    onEvent: (event: WorkflowEvent) => void,
  ): Promise<boolean> {
    const enriched: AgentAction = {
      ...action,
      status: 'requested',
      requiresApproval: true,
      decisionReason: decision.reason,
    };
    return new Promise<boolean>((resolve) => {
      this.approvals.set(`${input.runId}:${action.id}`, { runId: input.runId, resolve });
      onEvent({
        type: 'action-requested',
        runId: input.runId,
        nodeId: input.nodeId,
        agentId: input.agent.id,
        action: withoutActionContent(enriched),
      });
    });
  }

  private resolveRunApprovals(runId: string, approved: boolean): void {
    for (const [key, pending] of this.approvals) {
      if (pending.runId !== runId) continue;
      this.approvals.delete(key);
      pending.resolve(approved);
    }
  }

  private remember(
    runId: string,
    agent: AgentDefinition,
    output: string,
    workspace: string | null,
  ): void {
    if (!agent.memory.enabled || !output) return;
    const key = this.memoryKey(runId, agent, workspace);
    const current = this.memories.get(key) ?? [];
    this.memories.set(key, [...current, output].slice(-agent.memory.maxEntries));
  }

  private async proposeEdit(agent: AgentDefinition, action: AgentAction): Promise<void> {
    if (!this.fileEdits) throw new Error('O workspace seguro de edição não está disponível.');
    if (!action.path || action.content === undefined) {
      throw new Error('A ação de edição precisa informar caminho e conteúdo completo.');
    }
    await this.fileEdits.propose(`${agent.name}: ${action.description}`, [
      { path: action.path, proposedContent: action.content },
    ]);
  }

  private async executeAction(
    agent: AgentDefinition,
    action: AgentAction,
    workspace: string | null,
  ): Promise<ActionExecution> {
    if (action.type === 'edit') {
      await this.proposeEdit(agent, action);
      return {
        executed: true,
        filesRead: [],
        commands: [],
        errors: [],
        logs: [`Alteração proposta para revisão: ${action.path}.`],
      };
    }
    if (action.type === 'read') {
      if (!this.filesystem || !action.path)
        throw new Error('O caminho de leitura não foi informado.');
      const content = await this.filesystem.readFile(action.path);
      return {
        executed: true,
        filesRead: [action.path],
        commands: [],
        errors: [],
        logs: [`Arquivo lido: ${action.path} (${content.length} caracteres).`],
      };
    }
    if (action.type === 'command') {
      if (!workspace || !action.command)
        throw new Error('O comando precisa de um workspace aberto.');
      const result = await this.commandRunner.run(action.command, workspace, agent.timeoutMs);
      const failed = result.exitCode !== 0;
      return {
        executed: true,
        filesRead: [],
        commands: [action.command],
        errors: failed
          ? [`${action.command} terminou com código ${result.exitCode}: ${result.stderr}`]
          : [],
        logs: [
          `$ ${action.command}`,
          ...(result.stdout ? [result.stdout] : []),
          ...(result.stderr ? [result.stderr] : []),
        ],
      };
    }
    return {
      executed: false,
      filesRead: [],
      commands: [],
      errors: [],
      logs: [`Ferramenta ${action.tool ?? 'desconhecida'} autorizada para integração dedicada.`],
    };
  }

  private async prepareVersionControl(
    request: AgentRunRequest,
    workspace: string,
  ): Promise<string[]> {
    const options = request.versionControl;
    if (!options) return [];
    const logs: string[] = [];
    if (options.checkpoint && this.checkpoints) {
      const files = Object.entries(request.relevantContext).map(([relativePath, content]) => ({
        relativePath,
        content,
        existed: true,
      }));
      if (files.length) {
        await this.checkpoints.create(workspace, files, `Before agent task: ${request.task}`);
        logs.push('Checkpoint local criado antes da tarefa.');
      }
    }
    if (options.branch && this.git) {
      const taskSlug = request.task
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 36);
      await this.git.createBranch(workspace, `agent/${taskSlug || request.runId.slice(0, 8)}`);
      logs.push('Branch isolada criada para a tarefa.');
    }
    return logs;
  }

  private async completeVersionControl(
    request: AgentRunRequest,
    workspace: string,
    result: WorkflowRunResult,
  ): Promise<string[]> {
    const options = request.versionControl;
    if (!options || !this.git) return [];
    const logs: string[] = [];
    if (options.commit) {
      const status = await this.git.status(workspace);
      const changedByAgents = new Set(changedFilesFromAgentRun(result));
      const taskFiles = status.files.filter(({ path: filePath }) => changedByAgents.has(filePath));
      if (taskFiles.length) {
        await this.git.stage(
          workspace,
          taskFiles.map(({ path }) => path),
        );
        await this.git.commit(
          workspace,
          `chore(agents): ${request.task.trim().replace(/\s+/g, ' ').slice(0, 180)}`,
        );
        logs.push('Commit local criado após a tarefa.');
      } else if (status.files.length) {
        logs.push('Alterações anteriores do workspace foram preservadas fora do commit do agente.');
      }
    }
    if (options.pullRequest) {
      if (!options.pushConfirmed || !options.pullRequestConfirmed || !this.github) {
        throw new Error('Push e pull request de agentes exigem confirmações explícitas.');
      }
      await this.git.push(workspace, true);
      const { branch } = await this.git.status(workspace);
      await this.github.createPullRequest(workspace, {
        title: request.task.trim().slice(0, 200),
        body: 'Generated from an explicitly approved VisualnsCode agent task.',
        base: 'main',
        head: branch,
        draft: true,
        confirmed: true,
      });
      logs.push('Branch enviada e pull request draft criado após confirmação.');
    }
    return logs;
  }

  private memoryKey(runId: string, agent: AgentDefinition, workspace: string | null): string {
    if (agent.memory.scope === 'run') return `run:${runId}:${agent.id}`;
    const projectId = createHash('sha256')
      .update(workspace ?? 'no-workspace')
      .digest('hex')
      .slice(0, 16);
    return `project:${projectId}:${agent.id}`;
  }

  private async loadMemories(): Promise<void> {
    if (this.memoriesLoaded) return;
    this.memoriesLoaded = true;
    try {
      const stored = JSON.parse(await readFile(this.memoryPath, 'utf8')) as Record<
        string,
        string[]
      >;
      for (const [key, entries] of Object.entries(stored)) {
        if (!/^project:[a-f0-9]{16}:[a-z0-9-]{1,100}$/u.test(key) || !Array.isArray(entries))
          continue;
        this.memories.set(key, entries.filter((entry) => typeof entry === 'string').slice(-100));
      }
    } catch {
      // A primeira execução ainda não possui memória persistida.
    }
  }

  private async saveMemories(): Promise<void> {
    const projectMemories = Object.fromEntries(
      [...this.memories].filter(([key]) => key.startsWith('project:')),
    );
    await this.enqueuePersistence(() => this.writePrivateJson(this.memoryPath, projectMemories));
  }

  private async saveHistory(result: WorkflowRunResult): Promise<void> {
    await this.enqueuePersistence(async () => {
      const history = await this.history();
      await this.writePrivateJson(this.historyPath, [result, ...history].slice(0, 50));
    });
  }

  private async enqueuePersistence(operation: () => Promise<void>): Promise<void> {
    const next = this.persistenceQueue.then(operation, operation);
    this.persistenceQueue = next.catch(() => undefined);
    await next;
  }

  private async writePrivateJson(filePath: string, value: unknown): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
    const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(value, null, 2), {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
    await rename(temporary, filePath);
  }
}
