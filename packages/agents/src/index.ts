export interface AgentDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

// Execution orchestration will be introduced only after the security model is validated.
export const builtInAgents: readonly AgentDefinition[] = [];
