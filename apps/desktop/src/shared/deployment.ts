export type DeployProvider = 'vercel' | 'firebase' | 'supabase' | 'github-pages';
export type DeployEnvironment = 'preview' | 'production';
export type DeployStatus = 'running' | 'succeeded' | 'failed';

export interface DeployConfig {
  readonly projectRef?: string;
  readonly functionName?: string;
  readonly pagesWorkflow?: string;
}

export interface DeployPlan {
  readonly provider: DeployProvider;
  readonly environment: DeployEnvironment;
  readonly title: string;
  readonly explanation: string;
  readonly command: string;
  readonly requiresBuild: boolean;
  readonly requiresConfirmation: true;
  readonly requiredFields: readonly (keyof DeployConfig)[];
}

export interface DeployRequest {
  readonly provider: DeployProvider;
  readonly environment: DeployEnvironment;
  readonly confirmed: boolean;
  readonly config: DeployConfig;
}

export interface DeployRecord {
  readonly id: string;
  readonly provider: DeployProvider;
  readonly environment: DeployEnvironment;
  readonly status: DeployStatus;
  readonly url: string | null;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly summary: string;
}

export interface DeployEvent {
  readonly deploymentId: string;
  readonly type: 'status' | 'log' | 'error' | 'complete';
  readonly payload: string;
}
