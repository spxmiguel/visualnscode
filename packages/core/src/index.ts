export type CommandRisk = 'read' | 'write' | 'destructive' | 'privileged';

export interface CommandAssessment {
  readonly requiresConfirmation: boolean;
  readonly risk: CommandRisk;
}

export const assessCommandRisk = (risk: CommandRisk): CommandAssessment => ({
  risk,
  requiresConfirmation: risk !== 'read',
});
