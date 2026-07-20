import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type RunnerEventType = 'log' | 'error' | 'started' | 'stopped' | 'url';

export interface RunnerEvent {
  readonly type: RunnerEventType;
  readonly processId: string;
  readonly payload: string;
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const URL_RE = /https?:\/\/[^\s"]+/;

export class RunnerService {
  private processes = new Map<string, ChildProcess>();

  async detectProject(workspacePath: string): Promise<{
    manager: string;
    devCommand: string;
    buildCommand: string;
    testCommand: string;
    port: number | null;
  }> {
    const hasPkg = await fs
      .access(path.join(workspacePath, 'package.json'))
      .then(() => true)
      .catch(() => false);
    const hasPyproject = await fs
      .access(path.join(workspacePath, 'pyproject.toml'))
      .then(() => true)
      .catch(() => false);

    if (hasPyproject) {
      return {
        manager: 'python',
        devCommand: 'python -m uvicorn main:app --reload',
        buildCommand: '',
        testCommand: 'pytest',
        port: 8000,
      };
    }

    if (!hasPkg) {
      return { manager: 'none', devCommand: '', buildCommand: '', testCommand: '', port: null };
    }

    const raw = await fs.readFile(path.join(workspacePath, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as PackageJson;
    const scripts = pkg.scripts ?? {};

    const hasPnpmLock = await fs
      .access(path.join(workspacePath, 'pnpm-lock.yaml'))
      .then(() => true)
      .catch(() => false);
    const hasYarnLock = await fs
      .access(path.join(workspacePath, 'yarn.lock'))
      .then(() => true)
      .catch(() => false);
    const hasBunLock = await fs
      .access(path.join(workspacePath, 'bun.lock'))
      .then(() => true)
      .catch(() => false);

    const manager = hasPnpmLock ? 'pnpm' : hasYarnLock ? 'yarn' : hasBunLock ? 'bun' : 'npm';
    const runPrefix = manager === 'npm' ? 'npm run' : `${manager} run`;

    return {
      manager,
      devCommand: scripts['dev']
        ? `${runPrefix} dev`
        : scripts['start']
          ? `${runPrefix} start`
          : '',
      buildCommand: scripts['build'] ? `${runPrefix} build` : '',
      testCommand: scripts['test'] ? `${runPrefix} test` : '',
      port: null,
    };
  }

  start(
    processId: string,
    workspacePath: string,
    command: string,
    onEvent: (event: RunnerEvent) => void,
  ): void {
    this.stop(processId);

    const [cmd, ...args] = command.trim().split(/\s+/u);
    if (!cmd) return;

    const child = spawn(cmd, args, {
      cwd: workspacePath,
      env: { ...process.env, FORCE_COLOR: '1' },
      shell: false,
    });

    this.processes.set(processId, child);
    onEvent({ type: 'started', processId, payload: command });

    const handleOut = (data: Buffer): void => {
      const text = data.toString();
      onEvent({ type: 'log', processId, payload: text });
      const urlMatch = text.match(URL_RE);
      if (urlMatch) {
        onEvent({ type: 'url', processId, payload: urlMatch[0] });
      }
    };

    child.stdout.on('data', handleOut);
    child.stderr.on('data', (data: Buffer) => {
      onEvent({ type: 'error', processId, payload: data.toString() });
    });

    child.on('close', (code) => {
      this.processes.delete(processId);
      onEvent({ type: 'stopped', processId, payload: String(code ?? 0) });
    });
  }

  stop(processId: string): void {
    const child = this.processes.get(processId);
    if (child) {
      child.kill('SIGTERM');
      this.processes.delete(processId);
    }
  }

  stopAll(): void {
    for (const [id] of this.processes) {
      this.stop(id);
    }
  }

  isRunning(processId: string): boolean {
    return this.processes.has(processId);
  }
}
