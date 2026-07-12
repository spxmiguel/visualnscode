import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  builtInAgents,
  teamTemplates,
  type AgentAction,
  type AgentDefinition,
  type AgentRunRecord,
  type TeamWorkflow,
  type WorkflowEvent,
  type WorkflowRunResult,
} from '@visualnscode/agents/browser';

export interface PendingAgentAction {
  readonly runId: string;
  readonly nodeId: string;
  readonly agentId: string;
  readonly action: AgentAction;
}

interface AgentWorkspaceState {
  readonly currentWorkflow: TeamWorkflow;
  readonly customAgents: readonly AgentDefinition[];
  readonly overrides: Readonly<Record<string, AgentDefinition>>;
  readonly activeRunId: string | null;
  readonly currentResult: WorkflowRunResult | null;
  readonly nodeRuns: Readonly<Record<string, AgentRunRecord | 'running' | 'queued'>>;
  readonly pendingActions: readonly PendingAgentAction[];
  readonly logs: readonly string[];
  readonly history: readonly WorkflowRunResult[];
  readonly selectedAgentId: string | null;
  readonly connectFrom: string | null;
  readonly addCustomAgent: (agent: AgentDefinition) => void;
  readonly applyTemplate: (templateId: string) => void;
  readonly addNode: (agentId: string, x: number, y: number) => void;
  readonly connect: (source: string, target: string) => void;
  readonly handleEvent: (event: WorkflowEvent) => void;
  readonly moveNode: (nodeId: string, x: number, y: number) => void;
  readonly removeNode: (nodeId: string) => void;
  readonly resolveAction: (actionId: string) => void;
  readonly setConnectFrom: (nodeId: string | null) => void;
  readonly setHistory: (history: readonly WorkflowRunResult[]) => void;
  readonly setSelectedAgent: (agentId: string | null) => void;
  readonly startRun: (runId: string) => void;
  readonly updateAgent: (agent: AgentDefinition) => void;
  readonly updateWorkflow: (workflow: TeamWorkflow) => void;
}

const cloneTemplate = (templateId: string): TeamWorkflow => {
  const template = teamTemplates.find(({ id }) => id === templateId) ?? teamTemplates[0]!;
  return {
    ...template,
    nodes: template.nodes.map((node) => ({ ...node, position: { ...node.position } })),
    edges: template.edges.map((edge) => ({ ...edge })),
  };
};

export const useAgentStore = create<AgentWorkspaceState>()(
  persist(
    (set) => ({
      currentWorkflow: cloneTemplate('full-stack-app'),
      customAgents: [],
      overrides: {},
      activeRunId: null,
      currentResult: null,
      nodeRuns: {},
      pendingActions: [],
      logs: [],
      history: [],
      selectedAgentId: null,
      connectFrom: null,
      addCustomAgent: (agent) =>
        set((state) => ({
          customAgents: [...state.customAgents.filter(({ id }) => id !== agent.id), agent],
        })),
      applyTemplate: (templateId) =>
        set({ currentWorkflow: cloneTemplate(templateId), nodeRuns: {}, currentResult: null }),
      addNode: (agentId, x, y) =>
        set((state) => {
          const id = `${agentId}-${Date.now()}`;
          return {
            currentWorkflow: {
              ...state.currentWorkflow,
              nodes: [...state.currentWorkflow.nodes, { id, agentId, position: { x, y } }],
            },
          };
        }),
      connect: (source, target) =>
        set((state) => {
          if (
            source === target ||
            state.currentWorkflow.edges.some(
              (edge) => edge.source === source && edge.target === target,
            )
          )
            return { connectFrom: null };
          return {
            currentWorkflow: {
              ...state.currentWorkflow,
              edges: [...state.currentWorkflow.edges, { id: `edge-${Date.now()}`, source, target }],
            },
            connectFrom: null,
          };
        }),
      handleEvent: (event) =>
        set((state) => {
          if (event.type === 'run-started')
            return {
              activeRunId: event.runId,
              currentResult: null,
              nodeRuns: {},
              logs: [`Equipe ${event.workflowId} iniciada.`],
            };
          if (event.type === 'agent-started')
            return {
              nodeRuns: { ...state.nodeRuns, [event.nodeId]: 'running' as const },
              logs: [...state.logs, `${event.agentId} iniciou a tentativa ${event.attempt}.`],
            };
          if (event.type === 'agent-completed')
            return {
              nodeRuns: { ...state.nodeRuns, [event.record.nodeId]: event.record },
              logs: [...state.logs, ...event.record.logs],
            };
          if (event.type === 'agent-failed')
            return { logs: [...state.logs, `${event.agentId}: ${event.message}`] };
          if (event.type === 'action-requested')
            return {
              pendingActions: [
                ...state.pendingActions,
                {
                  runId: event.runId,
                  nodeId: event.nodeId,
                  agentId: event.agentId,
                  action: event.action,
                },
              ],
              logs: [...state.logs, `${event.agentId} pediu: ${event.action.description}`],
            };
          if (event.type === 'rollback')
            return { logs: [...state.logs, `Rollback: ${event.files.join(', ')}`] };
          if (event.type === 'log') return { logs: [...state.logs, event.message] };
          if (event.type === 'run-completed')
            return {
              activeRunId: null,
              currentResult: event.result,
              history: [
                event.result,
                ...state.history.filter(({ id }) => id !== event.result.id),
              ].slice(0, 50),
              logs: [
                ...state.logs,
                event.result.status === 'completed'
                  ? 'Workflow concluído.'
                  : `Workflow ${event.result.status}.`,
              ],
            };
          return {};
        }),
      moveNode: (nodeId, x, y) =>
        set((state) => ({
          currentWorkflow: {
            ...state.currentWorkflow,
            nodes: state.currentWorkflow.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, position: { x: Math.max(0, x), y: Math.max(0, y) } }
                : node,
            ),
          },
        })),
      removeNode: (nodeId) =>
        set((state) => ({
          currentWorkflow: {
            ...state.currentWorkflow,
            nodes: state.currentWorkflow.nodes.filter(({ id }) => id !== nodeId),
            edges: state.currentWorkflow.edges.filter(
              ({ source, target }) => source !== nodeId && target !== nodeId,
            ),
          },
        })),
      resolveAction: (actionId) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter(({ action }) => action.id !== actionId),
        })),
      setConnectFrom: (connectFrom) => set({ connectFrom }),
      setHistory: (history) => set({ history }),
      setSelectedAgent: (selectedAgentId) => set({ selectedAgentId }),
      startRun: (activeRunId) =>
        set({ activeRunId, currentResult: null, pendingActions: [], nodeRuns: {}, logs: [] }),
      updateAgent: (agent) =>
        set((state) =>
          agent.builtIn
            ? { overrides: { ...state.overrides, [agent.id]: agent } }
            : { customAgents: [...state.customAgents.filter(({ id }) => id !== agent.id), agent] },
        ),
      updateWorkflow: (currentWorkflow) => set({ currentWorkflow }),
    }),
    {
      name: 'visualnscode-agent-workspace',
      partialize: ({ currentWorkflow, customAgents, overrides }) => ({
        currentWorkflow,
        customAgents,
        overrides,
      }),
      storage: createJSONStorage(() => window.localStorage),
      version: 1,
    },
  ),
);

export const resolvedAgents = (
  state: Pick<AgentWorkspaceState, 'customAgents' | 'overrides'>,
): readonly AgentDefinition[] => [
  ...builtInAgents.map((agent) => state.overrides[agent.id] ?? agent),
  ...state.customAgents,
];
