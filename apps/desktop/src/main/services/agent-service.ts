import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
import type { CheckpointService } from './checkpoint-service';
import type { FileEditService } from './file-edit-service';
import type { FilesystemService } from './filesystem-service';
import type { GitService } from './git-service';
import type { GitHubService } from './github-service';
import type { ProviderService } from './provider-service';

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
    private readonly proposeEdit: (agent: AgentDefinition, action: AgentAction) => Promise<void>,
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
    );

    const parsed = parseAgentOutput(output);
    const actions: AgentAction[] = [];
    const errors: string[] = [];
    for (const original of parsed.actions) {
      const action = { ...original, id: `${input.nodeId}:${original.id}` };
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
      if (decision.requiresApproval) {
        const approved = await this.approval(input, action, decision);
        if (approved && action.type === 'edit') {
          await this.proposeEdit(input.agent, action);
        }
        actions.push({
          ...withoutActionContent(action),
          status: approved ? 'approved' : 'denied',
          requiresApproval: true,
          decisionReason: decision.reason,
        });
        if (!approved) errors.push(`${action.description}: não aprovada.`);
        continue;
      }
      if (action.type === 'edit') {
        await this.proposeEdit(input.agent, action);
      }
      actions.push({
        ...withoutActionContent(action),
        status: 'executed',
        requiresApproval: false,
        decisionReason: decision.reason,
      });
    }
    this.remember(input.agent, parsed.output);
    const measuredUsage = usage as TokenUsage | null;
    return {
      output: parsed.output,
      filesRead: [
        ...Object.keys(input.context.relevantContext),
        ...actions.flatMap((action) =>
          action.type === 'read' && action.path ? [action.path] : [],
        ),
      ],
      filesChanged: [],
      commands: actions.flatMap((action) => (action.command ? [action.command] : [])),
      actions,
      errors,
      costUsd: measuredUsage?.estimatedCostUsd ?? 0,
      steps: Math.max(1, actions.length + 1),
      logs: [
        `${input.agent.name} recebeu ${input.context.previousResults.length} resultado(s) anterior(es).`,
        `${actions.length} ação(ões) analisada(s) pela política.`,
      ],
    };
  }

  async rollback(): Promise<void> {
    // A aplicação de patches será conectada ao workspace real; o engine já preserva o contrato.
  }
}

export class AgentService {
  private readonly historyPath = join(app.getPath('userData'), 'agent-history.json');
  private readonly memoryPath = join(app.getPath('userData'), 'agent-memory.json');
  private readonly engines = new Map<string, WorkflowEngine>();
  private readonly approvals = new Map<string, PendingApproval>();
  private readonly memories = new Map<string, string[]>();
  private memoriesLoaded = false;

  constructor(
    private readonly providers: ProviderService,
    private readonly fileEdits?: FileEditService,
    private readonly filesystem?: FilesystemService,
    private readonly checkpoints?: CheckpointService,
    private readonly git?: GitService,
    private readonly github?: GitHubService,
  ) {}

  async start(
    request: AgentRunRequest,
    onEvent: (event: WorkflowEvent) => void,
  ): Promise<WorkflowRunResult> {
    await this.loadMemories();
    const executor = new ProviderAgentExecutor(
      this.providers,
      (input, action, decision) => this.requestApproval(input, action, decision, onEvent),
      (agent) => this.memories.get(this.memoryKey(request.runId, agent)) ?? [],
      (agent, output) => this.remember(request.runId, agent, output),
      (agent, action) => this.proposeEdit(agent, action),
    );
    const engine = new WorkflowEngine(executor);
    this.engines.set(request.runId, engine);
    try {
      const workspace = this.filesystem?.getWorkspace();
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
          ? await this.completeVersionControl(request, workspace)
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
    onEvent({
      type: 'action-requested',
      runId: input.runId,
      nodeId: input.nodeId,
      agentId: input.agent.id,
      action: enriched,
    });
    return new Promise<boolean>((resolve) => {
      this.approvals.set(`${input.runId}:${action.id}`, { runId: input.runId, resolve });
    });
  }

  private resolveRunApprovals(runId: string, approved: boolean): void {
    for (const [key, pending] of this.approvals) {
      if (pending.runId !== runId) continue;
      this.approvals.delete(key);
      pending.resolve(approved);
    }
  }

  private remember(runId: string, agent: AgentDefinition, output: string): void {
    if (!agent.memory.enabled || !output) return;
    const key = this.memoryKey(runId, agent);
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
  ): Promise<string[]> {
    const options = request.versionControl;
    if (!options || !this.git) return [];
    const logs: string[] = [];
    if (options.commit) {
      const status = await this.git.status(workspace);
      if (status.files.length) {
        await this.git.stage(
          workspace,
          status.files.map(({ path }) => path),
        );
        await this.git.commit(
          workspace,
          `chore(agents): ${request.task.trim().replace(/\s+/g, ' ').slice(0, 180)}`,
        );
        logs.push('Commit local criado após a tarefa.');
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

  private memoryKey(runId: string, agent: AgentDefinition): string {
    return agent.memory.scope === 'project' ? `project:${agent.id}` : `run:${runId}:${agent.id}`;
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
        if (!key.startsWith('project:') || !Array.isArray(entries)) continue;
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
    await mkdir(dirname(this.memoryPath), { recursive: true });
    await writeFile(this.memoryPath, JSON.stringify(projectMemories, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
  }

  private async saveHistory(result: WorkflowRunResult): Promise<void> {
    const history = await this.history();
    await mkdir(dirname(this.historyPath), { recursive: true });
    await writeFile(this.historyPath, JSON.stringify([result, ...history].slice(0, 50), null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
  }
}
