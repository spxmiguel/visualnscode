export type ProjectCategory = 'frontend' | 'backend' | 'fullstack' | 'other';
export type PackageManager = 'pnpm' | 'npm' | 'none';
export type ProjectIntegration = 'none' | 'firebase' | 'supabase' | 'vercel';
export type ProjectStepStatus = 'running' | 'success' | 'warning' | 'error' | 'skipped';

export interface ProjectCommand {
  readonly executable: string;
  readonly args: readonly string[];
}

export interface ProjectTemplate {
  readonly id: string;
  readonly version: string;
  readonly schemaVersion: 1;
  readonly name: string;
  readonly description: string;
  readonly category: ProjectCategory;
  readonly tags: readonly string[];
  readonly stack: string;
  readonly database: string;
  readonly authentication: string;
  readonly deployment: string;
  readonly recommendedAgent: string;
  readonly manager: PackageManager;
}

export interface ProjectSuggestion {
  readonly name: string;
  readonly templateId: string;
  readonly stack: string;
  readonly structure: readonly string[];
  readonly database: string;
  readonly authentication: string;
  readonly deployment: string;
  readonly recommendedAgent: string;
  readonly reasons: readonly string[];
}

export interface ProjectCreationOptions {
  readonly description: string;
  readonly templateId: string;
  readonly parentPath: string;
  readonly projectName: string;
  readonly installDependencies: boolean;
  readonly initializeGit: boolean;
  readonly github: {
    readonly enabled: boolean;
    readonly confirmed: boolean;
    readonly visibility: 'private' | 'public';
  };
  readonly integration: ProjectIntegration;
  readonly integrationConfirmed: boolean;
  readonly startAfterCreate: boolean;
}

export interface ProjectProgressEvent {
  readonly step: string;
  readonly status: ProjectStepStatus;
  readonly message: string;
  readonly technicalDetails?: string;
  readonly timestamp: string;
}

export interface ProjectCreationResult {
  readonly success: boolean;
  readonly path: string;
  readonly events: readonly ProjectProgressEvent[];
  readonly gitInitialized: boolean;
  readonly githubUrl?: string;
  readonly runCommand?: string;
  readonly previewRequested: boolean;
  readonly error?: string;
}
