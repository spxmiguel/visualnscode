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
import type { ProviderService } from './provider-service';

export interface AgentRunRequest {
  readonly runId: string;
  readonly workflow: TeamWorkflow;
  readonly agents: readonly AgentDefinition[];
  readonly task: string;
  readonly relevantContext: Readonly<Record<string, string>>;
}

interface PendingApproval {
  readonly runId: string;
  readonly resolve: (approved: boolean) => void;
}

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
            content: `${input.agent.systemPrompt}\n\nVocê opera sob estas restrições: autonomia=${input.agent.autonomy}; ferramentas=${input.agent.allowedTools.join(',')}; pastas=${input.agent.allowedFolders.join(',')}; terminal=${input.agent.terminalPermission}; edição=${input.agent.editPermission}.\nNão execute ações diretamente. Ao final, liste ações desejadas em JSON dentro de <visualnscode-actions>...</visualnscode-actions>. Cada item deve ter type, description, risk e, quando aplicável, path, command ou tool.`,
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
          ...action,
          status: 'denied',
          requiresApproval: false,
          decisionReason: decision.reason,
        });
        errors.push(`${action.description}: ${decision.reason}`);
        continue;
      }
      if (decision.requiresApproval) {
        const approved = await this.approval(input, action, decision);
        actions.push({
          ...action,
          status: approved ? 'approved' : 'denied',
          requiresApproval: true,
          decisionReason: decision.reason,
        });
        if (!approved) errors.push(`${action.description}: não aprovada.`);
        continue;
      }
      actions.push({
        ...action,
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
  private readonly engines = new Map<string, WorkflowEngine>();
  private readonly approvals = new Map<string, PendingApproval>();
  private readonly memories = new Map<string, string[]>();

  constructor(private readonly providers: ProviderService) {}

  async start(
    request: AgentRunRequest,
    onEvent: (event: WorkflowEvent) => void,
  ): Promise<WorkflowRunResult> {
    const executor = new ProviderAgentExecutor(
      this.providers,
      (input, action, decision) => this.requestApproval(input, action, decision, onEvent),
      (agent) => this.memories.get(agent.id) ?? [],
      (agent, output) => this.remember(agent, output),
    );
    const engine = new WorkflowEngine(executor);
    this.engines.set(request.runId, engine);
    try {
      const result = await engine.run(request.workflow, request.agents, request.task, {
        runId: request.runId,
        relevantContext: request.relevantContext,
        onEvent,
      });
      await this.saveHistory(result);
      return result;
    } finally {
      this.engines.delete(request.runId);
      this.resolveRunApprovals(request.runId, false);
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

  private remember(agent: AgentDefinition, output: string): void {
    if (!agent.memory.enabled || !output) return;
    const current = this.memories.get(agent.id) ?? [];
    this.memories.set(agent.id, [...current, output].slice(-agent.memory.maxEntries));
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
