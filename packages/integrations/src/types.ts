import type { CommandRisk } from '@visualnscode/core';

export type PermissionId =
  | 'read'
  | 'write'
  | 'execute-safe'
  | 'install-dependencies'
  | 'outside-workspace'
  | 'credentials'
  | 'administrative';

export type ToolCategory = 'core' | 'package-manager' | 'deploy' | 'agent' | 'runtime';
export type ToolStatus = 'installed' | 'missing' | 'error' | 'checking';
export type ToolAction = 'install' | 'authenticate' | 'test' | 'logout' | 'configure';

export interface ToolDetectionResult {
  readonly id: string;
  readonly status: ToolStatus;
  readonly installed: boolean;
  readonly version: string | null;
  readonly path: string | null;
  readonly message: string;
}

export interface ToolActionResult {
  readonly ok: boolean;
  readonly message: string;
  readonly output?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface CommandSpec {
  readonly executable: string;
  readonly args: readonly string[];
  readonly description: string;
  readonly permission: PermissionId;
  readonly risk: CommandRisk;
  readonly timeoutMs?: number;
  readonly cwd?: string;
}

export interface CommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface CommandRunner {
  findExecutable(command: string): Promise<string | null>;
  run(command: CommandSpec): Promise<CommandResult>;
}

export interface ToolDefinition {
  readonly id: string;
  readonly name: string;
  readonly command: string;
  readonly alternateCommands?: readonly string[];
  readonly category: ToolCategory;
  readonly documentationUrl: string;
  readonly versionArgs: readonly string[];
  readonly install?: CommandSpec;
  readonly testArgs?: readonly string[];
}

export interface ToolIntegration {
  readonly id: string;
  readonly name: string;
  detect(): Promise<ToolDetectionResult>;
  install(): Promise<ToolActionResult>;
  authenticate(): Promise<ToolActionResult>;
  test(): Promise<ToolActionResult>;
}

export interface PermissionState {
  readonly id: PermissionId;
  readonly name: string;
  readonly description: string;
  readonly granted: boolean;
  readonly sensitive: boolean;
}

export interface ToolActionRequest {
  readonly toolId: string;
  readonly action: ToolAction;
  readonly confirmed: boolean;
  readonly parameters?: Readonly<Record<string, string | boolean>>;
}
