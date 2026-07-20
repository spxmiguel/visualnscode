export type AutonomyLevel = 'ask' | 'guided' | 'autonomous';
export type TerminalPermission = 'none' | 'safe' | 'allowlisted';
export type EditPermission = 'none' | 'propose' | 'workspace';
export type WorkflowRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type AgentRunStatus =
  'queued' | 'running' | 'waiting-approval' | 'completed' | 'failed' | 'cancelled';

export type AgentTool =
  | 'read-files'
  | 'search'
  | 'edit-files'
  | 'terminal'
  | 'git'
  | 'tests'
  | 'preview'
  | 'deploy'
  | 'web';

export interface AgentMemoryConfig {
  readonly enabled: boolean;
  readonly scope: 'run' | 'project';
  readonly maxEntries: number;
}

export interface AgentDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly providerId: string;
  readonly model: string;
  readonly systemPrompt: string;
  readonly allowedTools: readonly AgentTool[];
  readonly allowedFolders: readonly string[];
  readonly costLimitUsd: number;
  readonly timeoutMs: number;
  readonly memory: AgentMemoryConfig;
  readonly autonomy: AutonomyLevel;
  readonly terminalPermission: TerminalPermission;
  readonly editPermission: EditPermission;
  readonly builtIn: boolean;
}

export interface WorkflowNode {
  readonly id: string;
  readonly agentId: string;
  readonly position: { readonly x: number; readonly y: number };
}

export interface WorkflowEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
}

export interface TeamWorkflow {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly nodes: readonly WorkflowNode[];
  readonly edges: readonly WorkflowEdge[];
  readonly maxCostUsd: number;
  readonly timeoutMs: number;
  readonly maxSteps: number;
  readonly retries: number;
  readonly rollbackOnFailure: boolean;
  readonly builtIn: boolean;
}

export interface AgentStageContext {
  readonly originalTask: string;
  readonly previousResults: readonly string[];
  readonly filesChanged: readonly string[];
  readonly errors: readonly string[];
  readonly relevantContext: Readonly<Record<string, string>>;
}

export interface AgentAction {
  readonly id: string;
  readonly type: 'read' | 'edit' | 'command' | 'tool';
  readonly description: string;
  readonly path?: string;
  readonly content?: string | null;
  readonly command?: string;
  readonly tool?: AgentTool;
  readonly risk: 'safe' | 'important' | 'destructive';
  readonly status?: 'requested' | 'approved' | 'denied' | 'executed';
  readonly requiresApproval?: boolean;
  readonly decisionReason?: string;
}

export interface ActionDecision {
  readonly allowed: boolean;
  readonly requiresApproval: boolean;
  readonly reason: string;
}

export interface AgentExecutionResult {
  readonly output: string;
  readonly filesRead: readonly string[];
  readonly filesChanged: readonly string[];
  readonly commands: readonly string[];
  readonly actions: readonly AgentAction[];
  readonly errors: readonly string[];
  readonly costUsd: number;
  readonly steps: number;
  readonly logs: readonly string[];
}

export interface AgentExecutorInput {
  readonly runId: string;
  readonly nodeId: string;
  readonly agent: AgentDefinition;
  readonly context: AgentStageContext;
  readonly signal: AbortSignal;
  readonly attempt: number;
}

export interface AgentExecutor {
  execute(input: AgentExecutorInput): Promise<AgentExecutionResult>;
  rollback?(runId: string, files: readonly string[]): Promise<void>;
}

export interface AgentRunRecord extends AgentExecutionResult {
  readonly nodeId: string;
  readonly agentId: string;
  readonly status: AgentRunStatus;
  readonly attempt: number;
  readonly startedAt: string;
  readonly completedAt: string;
}

export interface WorkflowRunResult {
  readonly id: string;
  readonly workflowId: string;
  readonly task: string;
  readonly status: WorkflowRunStatus;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly costUsd: number;
  readonly steps: number;
  readonly rolledBack: boolean;
  readonly agentRuns: readonly AgentRunRecord[];
  readonly logs: readonly string[];
  readonly error: string | null;
}

export type WorkflowEvent =
  | { readonly type: 'run-started'; readonly runId: string; readonly workflowId: string }
  | { readonly type: 'stage-started'; readonly runId: string; readonly nodeIds: readonly string[] }
  | {
      readonly type: 'agent-started';
      readonly runId: string;
      readonly nodeId: string;
      readonly agentId: string;
      readonly attempt: number;
    }
  | { readonly type: 'agent-completed'; readonly runId: string; readonly record: AgentRunRecord }
  | {
      readonly type: 'agent-failed';
      readonly runId: string;
      readonly nodeId: string;
      readonly agentId: string;
      readonly message: string;
      readonly attempt: number;
    }
  | {
      readonly type: 'action-requested';
      readonly runId: string;
      readonly nodeId: string;
      readonly agentId: string;
      readonly action: AgentAction;
    }
  | {
      readonly type: 'log';
      readonly runId: string;
      readonly nodeId?: string;
      readonly message: string;
    }
  | { readonly type: 'rollback'; readonly runId: string; readonly files: readonly string[] }
  | { readonly type: 'run-completed'; readonly runId: string; readonly result: WorkflowRunResult };

export interface WorkflowRunOptions {
  readonly runId?: string;
  readonly relevantContext?: Readonly<Record<string, string>>;
  readonly onEvent?: (event: WorkflowEvent) => void;
}
