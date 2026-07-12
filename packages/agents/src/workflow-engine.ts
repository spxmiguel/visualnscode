import type {
  AgentDefinition,
  AgentExecutionResult,
  AgentExecutor,
  AgentRunRecord,
  AgentStageContext,
  TeamWorkflow,
  WorkflowNode,
  WorkflowRunOptions,
  WorkflowRunResult,
} from './types';

const emptyResult = (): AgentExecutionResult => ({
  output: '',
  filesRead: [],
  filesChanged: [],
  commands: [],
  actions: [],
  errors: [],
  costUsd: 0,
  steps: 0,
  logs: [],
});

const unique = (values: readonly string[]): readonly string[] => [...new Set(values)];

export const workflowStages = (workflow: TeamWorkflow): readonly (readonly WorkflowNode[])[] => {
  const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]));
  if (nodeMap.size !== workflow.nodes.length) throw new Error('O workflow contém nós duplicados.');
  const incoming = new Map(workflow.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(workflow.nodes.map((node) => [node.id, [] as string[]]));
  for (const edge of workflow.edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target))
      throw new Error('O workflow contém uma conexão inválida.');
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  }
  let ready = workflow.nodes.filter((node) => incoming.get(node.id) === 0);
  const stages: WorkflowNode[][] = [];
  let visited = 0;
  while (ready.length > 0) {
    stages.push(ready);
    visited += ready.length;
    const next: WorkflowNode[] = [];
    for (const node of ready) {
      for (const target of outgoing.get(node.id) ?? []) {
        const count = (incoming.get(target) ?? 1) - 1;
        incoming.set(target, count);
        if (count === 0) next.push(nodeMap.get(target)!);
      }
    }
    ready = next;
  }
  if (visited !== workflow.nodes.length) throw new Error('O workflow contém um ciclo.');
  return stages;
};

export class WorkflowEngine {
  private readonly controllers = new Map<string, AbortController>();

  constructor(private readonly executor: AgentExecutor) {}

  cancel(runId: string): void {
    this.controllers.get(runId)?.abort();
  }

  async run(
    workflow: TeamWorkflow,
    agents: readonly AgentDefinition[],
    task: string,
    options: WorkflowRunOptions = {},
  ): Promise<WorkflowRunResult> {
    if (!task.trim()) throw new Error('A tarefa do workflow é obrigatória.');
    if (workflow.nodes.length === 0) throw new Error('Adicione pelo menos um agente ao workflow.');
    const runId = options.runId ?? crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const startedTime = Date.now();
    const controller = new AbortController();
    this.controllers.set(runId, controller);
    const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
    const stages = workflowStages(workflow);
    const records: AgentRunRecord[] = [];
    const logs: string[] = [];
    let costUsd = 0;
    let steps = 0;
    let rolledBack = false;
    let error: string | null = null;
    options.onEvent?.({ type: 'run-started', runId, workflowId: workflow.id });

    try {
      for (const stage of stages) {
        this.assertWithinLimits(workflow, startedTime, costUsd, steps, controller.signal);
        options.onEvent?.({ type: 'stage-started', runId, nodeIds: stage.map(({ id }) => id) });
        const stageRecords = await Promise.all(
          stage.map(async (node) => {
            const agent = agentMap.get(node.agentId);
            if (!agent) throw new Error(`Agente não encontrado: ${node.agentId}`);
            const context = this.buildContext(
              workflow,
              node,
              task,
              records,
              options.relevantContext ?? {},
            );
            return this.executeWithRetry(
              runId,
              node,
              agent,
              context,
              workflow,
              controller,
              options,
            );
          }),
        );
        records.push(...stageRecords);
        costUsd += stageRecords.reduce((total, record) => total + record.costUsd, 0);
        steps += stageRecords.reduce((total, record) => total + record.steps, 0);
        logs.push(...stageRecords.flatMap((record) => record.logs));
        this.assertWithinLimits(workflow, startedTime, costUsd, steps, controller.signal);
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Falha desconhecida no workflow.';
      logs.push(error);
      if (workflow.rollbackOnFailure) {
        const changed = [...unique(records.flatMap((record) => record.filesChanged))].reverse();
        if (changed.length > 0) {
          await this.executor.rollback?.(runId, changed);
          rolledBack = true;
          options.onEvent?.({ type: 'rollback', runId, files: changed });
        }
      }
    } finally {
      this.controllers.delete(runId);
    }

    const status = controller.signal.aborted ? 'cancelled' : error ? 'failed' : 'completed';
    const result: WorkflowRunResult = {
      id: runId,
      workflowId: workflow.id,
      task: task.trim(),
      status,
      startedAt,
      completedAt: new Date().toISOString(),
      costUsd,
      steps,
      rolledBack,
      agentRuns: records,
      logs,
      error,
    };
    options.onEvent?.({ type: 'run-completed', runId, result });
    return result;
  }

  private async executeWithRetry(
    runId: string,
    node: WorkflowNode,
    agent: AgentDefinition,
    context: AgentStageContext,
    workflow: TeamWorkflow,
    controller: AbortController,
    options: WorkflowRunOptions,
  ): Promise<AgentRunRecord> {
    let attempt = 0;
    let lastError: unknown = new Error('Execução não iniciada.');
    while (attempt <= workflow.retries) {
      attempt += 1;
      const startedAt = new Date().toISOString();
      options.onEvent?.({
        type: 'agent-started',
        runId,
        nodeId: node.id,
        agentId: agent.id,
        attempt,
      });
      try {
        const result = await this.withTimeout(
          this.executor.execute({
            runId,
            nodeId: node.id,
            agent,
            context,
            signal: controller.signal,
            attempt,
          }),
          Math.min(agent.timeoutMs, workflow.timeoutMs),
          controller.signal,
        );
        if (result.costUsd > agent.costLimitUsd)
          throw new Error(`${agent.name} ultrapassou o limite de custo.`);
        const record: AgentRunRecord = {
          ...result,
          nodeId: node.id,
          agentId: agent.id,
          status: 'completed',
          attempt,
          startedAt,
          completedAt: new Date().toISOString(),
        };
        options.onEvent?.({ type: 'agent-completed', runId, record });
        return record;
      } catch (cause) {
        lastError = cause;
        const message = cause instanceof Error ? cause.message : 'Falha ao executar agente.';
        options.onEvent?.({
          type: 'agent-failed',
          runId,
          nodeId: node.id,
          agentId: agent.id,
          message,
          attempt,
        });
        if (controller.signal.aborted || attempt > workflow.retries) break;
      }
    }
    throw lastError;
  }

  private buildContext(
    workflow: TeamWorkflow,
    node: WorkflowNode,
    task: string,
    records: readonly AgentRunRecord[],
    relevantContext: Readonly<Record<string, string>>,
  ): AgentStageContext {
    const predecessorNodeIds = workflow.edges
      .filter((edge) => edge.target === node.id)
      .map((edge) => edge.source);
    const previous = records.filter((record) => predecessorNodeIds.includes(record.nodeId));
    return {
      originalTask: task,
      previousResults: previous.map((record) => record.output),
      filesChanged: unique(previous.flatMap((record) => record.filesChanged)),
      errors: previous.flatMap((record) => record.errors),
      relevantContext,
    };
  }

  private assertWithinLimits(
    workflow: TeamWorkflow,
    startedTime: number,
    costUsd: number,
    steps: number,
    signal: AbortSignal,
  ): void {
    if (signal.aborted) throw new Error('Workflow cancelado.');
    if (Date.now() - startedTime > workflow.timeoutMs)
      throw new Error('Tempo limite do workflow atingido.');
    if (costUsd > workflow.maxCostUsd) throw new Error('Limite de custo do workflow atingido.');
    if (steps > workflow.maxSteps) throw new Error('Limite de passos do workflow atingido.');
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal: AbortSignal,
  ): Promise<T> {
    if (signal.aborted) throw new Error('Workflow cancelado.');
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Tempo limite do agente atingido.')),
        timeoutMs,
      );
      const abort = () => reject(new Error('Workflow cancelado.'));
      signal.addEventListener('abort', abort, { once: true });
      void promise.then(resolve, reject).finally(() => {
        clearTimeout(timeout);
        signal.removeEventListener('abort', abort);
      });
    });
  }
}

export { emptyResult };
