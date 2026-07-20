import type {
  PermissionId,
  PermissionState,
  ToolActionRequest,
  ToolActionResult,
  ToolDetectionResult,
} from '@visualnscode/integrations/browser';
import type {
  AgentChunk,
  AgentInput,
  AIModel,
  ProviderConnectionResult,
  ProviderSettings,
  ProviderSummary,
} from '@visualnscode/providers/browser';
import type {
  AgentDefinition,
  TeamWorkflow,
  WorkflowEvent,
  WorkflowRunResult,
} from '@visualnscode/agents/browser';
import type {
  ApplyProposalResult,
  EditProposal,
  FileReviewSelection,
  ProposedFileInput,
} from '../shared/edit-model';
import type {
  ProjectCreationOptions,
  ProjectCreationResult,
  ProjectProgressEvent,
  ProjectSuggestion,
  ProjectTemplate,
} from '../shared/project-creation';
import type {
  GitBranch,
  GitConflict,
  GitHubAuthStatus,
  GitHubCreateIssueInput,
  GitHubCreatePullRequestInput,
  GitHubCreateReleaseInput,
  GitHubCreateRepositoryInput,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRelease,
  GitHubWorkflowRun,
  GitLogEntry,
  GitStatus,
  GitTag,
  AgentVersionControlOptions,
} from '../shared/version-control';
import type { DeployEvent, DeployPlan, DeployRecord, DeployRequest } from '../shared/deployment';
import type { ProjectRuntime, RuntimeAction } from '../shared/runtime';

export interface FileEntry {
  readonly name: string;
  readonly path: string;
  readonly type: 'file' | 'dir';
  readonly size?: number;
  readonly modified?: string;
}

export interface SecretMatch {
  readonly type: string;
  readonly line: number;
  readonly redacted: string;
}

export type CommandClassification = 'safe' | 'confirm' | 'dangerous' | 'blocked';

export interface CommandPolicy {
  readonly globallyAllowed: boolean;
  readonly yoloEnabled: boolean;
  readonly explicitAcknowledgement: boolean;
}

export interface CommandAssessment {
  readonly classification: CommandClassification;
  readonly allowed: boolean;
  readonly requiresConfirmation: boolean;
  readonly reason: string;
}

export interface CheckpointSummary {
  readonly id: string;
  readonly workspacePath: string;
  readonly createdAt: string;
  readonly label: string;
  readonly fileCount: number;
}

export interface RunnerEvent {
  readonly type: 'log' | 'error' | 'started' | 'stopped' | 'url';
  readonly processId: string;
  readonly payload: string;
}

declare global {
  interface Window {
    readonly visualnscode?: {
      readonly platform: string;
      readonly versions: Readonly<Record<'chrome' | 'electron' | 'node', string>>;
      readonly environment: {
        detectAll(): Promise<readonly ToolDetectionResult[]>;
        detect(toolId: string): Promise<ToolDetectionResult>;
        perform(request: ToolActionRequest): Promise<ToolActionResult>;
        permissions(): Promise<readonly PermissionState[]>;
        setPermission(id: PermissionId, granted: boolean): Promise<readonly PermissionState[]>;
        openDocumentation(toolId: string): Promise<boolean>;
        secretStatus(providerId: string): Promise<{ available: boolean; configured: boolean }>;
        storeSecret(providerId: string, secret: string): Promise<boolean>;
        removeSecret(providerId: string): Promise<boolean>;
      };
      readonly providers: {
        list(): Promise<readonly ProviderSummary[]>;
        update(settings: ProviderSettings): Promise<ProviderSettings>;
        test(providerId: string): Promise<ProviderConnectionResult>;
        models(providerId: string): Promise<readonly AIModel[]>;
      };
      readonly chat: {
        start(payload: { providerId: string; input: AgentInput }): void;
        cancel(requestId: string): Promise<void>;
        onChunk(listener: (chunk: AgentChunk) => void): () => void;
      };
      readonly agents: {
        history(): Promise<readonly WorkflowRunResult[]>;
        start(payload: {
          runId: string;
          workflow: TeamWorkflow;
          agents: readonly AgentDefinition[];
          task: string;
          relevantContext: Readonly<Record<string, string>>;
          versionControl?: AgentVersionControlOptions;
        }): void;
        cancel(runId: string): Promise<boolean>;
        approve(runId: string, actionId: string, approved: boolean): Promise<boolean>;
        onEvent(listener: (event: WorkflowEvent) => void): () => void;
      };
      readonly fs: {
        openFolder(): Promise<string | null>;
        setWorkspace(p: string): Promise<boolean>;
        getWorkspace(): Promise<string | null>;
        listDir(relative: string): Promise<readonly FileEntry[]>;
        readFile(relative: string): Promise<string>;
        writeFile(relative: string, content: string): Promise<void>;
        createDir(relative: string): Promise<void>;
        delete(relative: string, confirmed: boolean): Promise<void>;
        rename(oldPath: string, newPath: string): Promise<void>;
        scanSecrets(filename: string, content: string): Promise<readonly SecretMatch[]>;
        redact(content: string): Promise<string>;
        classifyCommand(command: string): Promise<CommandClassification>;
        prepareRemoteContext(files: readonly { path: string; content: string }[]): Promise<
          readonly {
            path: string;
            content: string;
            findings: readonly SecretMatch[];
            omitted: boolean;
          }[]
        >;
      };
      readonly security: {
        assessCommand(command: string, policy: CommandPolicy): Promise<CommandAssessment>;
      };
      readonly edits: {
        list(): Promise<readonly EditProposal[]>;
        propose(title: string, files: readonly ProposedFileInput[]): Promise<EditProposal>;
        apply(id: string, selections: readonly FileReviewSelection[]): Promise<ApplyProposalResult>;
        reject(id: string): Promise<EditProposal>;
        history(): Promise<readonly CheckpointSummary[]>;
        rollback(id: string): Promise<{ restored: readonly string[]; redoCheckpointId: string }>;
      };
      readonly checkpoint: {
        create(label: string, files: unknown): Promise<string>;
        list(): Promise<readonly CheckpointSummary[]>;
        restore(id: string): Promise<unknown>;
        remove(id: string): Promise<void>;
      };
      readonly git: {
        isRepo(): Promise<boolean>;
        status(): Promise<GitStatus>;
        diff(staged: boolean, path?: string): Promise<string>;
        stage(paths: string[]): Promise<void>;
        unstage(paths: string[]): Promise<void>;
        commit(message: string): Promise<string>;
        suggestCommit(): Promise<string>;
        log(limit?: number): Promise<readonly GitLogEntry[]>;
        branches(): Promise<readonly GitBranch[]>;
        checkout(branch: string): Promise<void>;
        createBranch(name: string): Promise<void>;
        merge(branch: string, confirmed: boolean): Promise<void>;
        stash(message?: string): Promise<void>;
        stashPop(): Promise<void>;
        tags(): Promise<readonly GitTag[]>;
        createTag(name: string, message: string): Promise<void>;
        reset(reference: string, mode: 'soft' | 'mixed', confirmed: boolean): Promise<void>;
        revert(hash: string, confirmed: boolean): Promise<void>;
        conflicts(): Promise<readonly GitConflict[]>;
        resolveConflict(path: string, resolution: 'ours' | 'theirs' | 'manual'): Promise<void>;
        push(confirmed: boolean): Promise<void>;
        pull(confirmed: boolean): Promise<void>;
      };
      readonly github: {
        authStatus(): Promise<GitHubAuthStatus>;
        createRepository(input: GitHubCreateRepositoryInput): Promise<string>;
        clone(repository: string, confirmed: boolean): Promise<string | null>;
        fork(confirmed: boolean): Promise<string>;
        open(): Promise<string>;
        issues(): Promise<readonly GitHubIssue[]>;
        createIssue(input: GitHubCreateIssueInput): Promise<string>;
        pullRequests(): Promise<readonly GitHubPullRequest[]>;
        createPullRequest(input: GitHubCreatePullRequestInput): Promise<string>;
        workflowRuns(): Promise<readonly GitHubWorkflowRun[]>;
        releases(): Promise<readonly GitHubRelease[]>;
        createRelease(input: GitHubCreateReleaseInput): Promise<string>;
      };
      readonly runner: {
        detect(): Promise<ProjectRuntime | null>;
        start(processId: string, action: RuntimeAction): void;
        restart(processId: string, action: RuntimeAction): Promise<boolean>;
        stop(processId: string): Promise<boolean>;
        isRunning(processId: string): Promise<boolean>;
        onEvent(listener: (event: RunnerEvent) => void): () => void;
      };
      readonly preview: {
        connect(target: string): Promise<string>;
        openExternal(target: string): Promise<boolean>;
        screenshot(rect: {
          x: number;
          y: number;
          width: number;
          height: number;
        }): Promise<string | null>;
      };
      readonly deploy: {
        plan(request: DeployRequest): Promise<DeployPlan>;
        start(request: DeployRequest): Promise<DeployRecord>;
        history(): Promise<readonly DeployRecord[]>;
        onEvent(listener: (event: DeployEvent) => void): () => void;
      };
      readonly scaffold: {
        templates(): Promise<readonly ProjectTemplate[]>;
        suggest(description: string): Promise<ProjectSuggestion>;
        chooseDir(): Promise<string | null>;
        create(options: ProjectCreationOptions): Promise<ProjectCreationResult>;
        onProgress(listener: (progress: ProjectProgressEvent) => void): () => void;
      };
    };
  }
}

export {};
