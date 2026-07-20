export type RuntimeKind = 'node' | 'python' | 'static' | 'unknown';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'python' | 'none';
export type RuntimeAction = 'install' | 'dev' | 'build' | 'test';

export interface RuntimeCommand {
  readonly action: RuntimeAction;
  readonly label: string;
  readonly display: string;
}

export interface ProjectRuntime {
  readonly kind: RuntimeKind;
  readonly manager: PackageManager;
  readonly commands: Partial<Record<RuntimeAction, RuntimeCommand>>;
  readonly port: number | null;
  readonly framework: string | null;
  readonly devCommand: string;
  readonly buildCommand: string;
  readonly testCommand: string;
  readonly installCommand: string;
}

export type RunnerEventType = 'log' | 'error' | 'started' | 'stopped' | 'url';

export interface RunnerEvent {
  readonly type: RunnerEventType;
  readonly processId: string;
  readonly payload: string;
}

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile' | 'custom';

export interface PreviewElementContext {
  readonly selector: string;
  readonly tag: string;
  readonly id: string | null;
  readonly classes: readonly string[];
  readonly text: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly bounds: Readonly<{ x: number; y: number; width: number; height: number }>;
  readonly url: string;
}

export interface PreviewLogEntry {
  readonly kind: 'console' | 'network';
  readonly level: string;
  readonly message: string;
  readonly timestamp: string;
}
