import type {
  AgentDefinition,
  AgentRunRecord,
  TeamWorkflow,
  WorkflowEvent,
  WorkflowRunResult,
} from '@visualnscode/agents/browser';

const listeners = new Set<(event: WorkflowEvent) => void>();
const history: WorkflowRunResult[] = [];
const cancelled = new Set<string>();

interface StartPayload {
  readonly runId: string;
  readonly workflow: TeamWorkflow;
  readonly agents: readonly AgentDefinition[];
  readonly task: string;
  readonly relevantContext: Readonly<Record<string, string>>;
}

const emit = (event: WorkflowEvent): void => {
  for (const listener of listeners) listener(event);
};

const fallback = {
  history: async () => history,
  start: (payload: StartPayload) => {
    void (async () => {
      const startedAt = new Date().toISOString();
      emit({ type: 'run-started', runId: payload.runId, workflowId: payload.workflow.id });
      const records: AgentRunRecord[] = [];
      for (const node of payload.workflow.nodes) {
        if (cancelled.has(payload.runId)) break;
        const agent = payload.agents.find(({ id }) => id === node.agentId);
        if (!agent) continue;
        emit({ type: 'stage-started', runId: payload.runId, nodeIds: [node.id] });
        emit({
          type: 'agent-started',
          runId: payload.runId,
          nodeId: node.id,
          agentId: agent.id,
          attempt: 1,
        });
        await new Promise((resolve) => setTimeout(resolve, 120));
        const record: AgentRunRecord = {
          nodeId: node.id,
          agentId: agent.id,
          status: 'completed',
          attempt: 1,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          output: `${agent.name} concluiu sua etapa para “${payload.task}”.`,
          filesRead: Object.keys(payload.relevantContext),
          filesChanged: agent.editPermission === 'none' ? [] : [`src/${agent.id}.ts`],
          commands: agent.terminalPermission === 'none' ? [] : ['pnpm test'],
          actions: [],
          errors: [],
          costUsd: 0.02,
          steps: 1,
          logs: [`${agent.name} analisou o contexto e concluiu a etapa.`],
        };
        records.push(record);
        emit({ type: 'agent-completed', runId: payload.runId, record });
      }
      const wasCancelled = cancelled.delete(payload.runId);
      const result: WorkflowRunResult = {
        id: payload.runId,
        workflowId: payload.workflow.id,
        task: payload.task,
        status: wasCancelled ? 'cancelled' : 'completed',
        startedAt,
        completedAt: new Date().toISOString(),
        costUsd: records.reduce((total, record) => total + record.costUsd, 0),
        steps: records.length,
        rolledBack: false,
        agentRuns: records,
        logs: records.flatMap(({ logs }) => logs),
        error: null,
      };
      history.unshift(result);
      emit({ type: 'run-completed', runId: payload.runId, result });
    })();
  },
  cancel: async (runId: string) => {
    cancelled.add(runId);
    return true;
  },
  approve: async () => true,
  onEvent: (listener: (event: WorkflowEvent) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const agentApi = window.visualnscode?.agents ?? fallback;
