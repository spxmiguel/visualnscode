import { mkdtemp, mkdir, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type {
  CommandResult,
  CommandRunner,
  CommandSpec,
  ToolActionRequest,
} from '@visualnscode/integrations';
import { EnvironmentService } from './environment-service';

class FakeRunner implements CommandRunner {
  readonly commands: CommandSpec[] = [];

  findExecutable(): Promise<string | null> {
    return Promise.resolve('/usr/bin/tool');
  }

  run(command: CommandSpec): Promise<CommandResult> {
    this.commands.push(command);
    return Promise.resolve({ exitCode: 0, stderr: '', stdout: '' });
  }
}

const temporaryDirectories: string[] = [];

const temporaryDirectory = async (name: string): Promise<string> => {
  const root = await mkdtemp(path.join(os.tmpdir(), `visualnscode-${name}-`));
  temporaryDirectories.push(root);
  return root;
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((entry) => rm(entry, { recursive: true })));
});

const firebaseSelect = (cwd: string): ToolActionRequest => ({
  toolId: 'firebase',
  action: 'configure',
  confirmed: true,
  parameters: { operation: 'select', projectId: 'demo-project', trustedWorkspacePath: cwd },
});

describe('EnvironmentService workspace boundary', () => {
  it('runs workspace integrations inside the active project', async () => {
    const workspace = await temporaryDirectory('workspace');
    const nested = path.join(workspace, 'app');
    await mkdir(nested);
    const runner = new FakeRunner();
    const service = new EnvironmentService(() => workspace, runner);
    service.setPermission('credentials', true);
    service.setPermission('write', true);

    await expect(service.perform(firebaseSelect(nested))).resolves.toMatchObject({ ok: true });
    expect(runner.commands[0]?.cwd).toBe(await realpath(nested));
  });

  it('blocks a caller-supplied directory outside the active project', async () => {
    const workspace = await temporaryDirectory('workspace');
    const outside = await temporaryDirectory('outside');
    const runner = new FakeRunner();
    const service = new EnvironmentService(() => workspace, runner);
    service.setPermission('credentials', true);
    service.setPermission('write', true);

    await expect(service.perform(firebaseSelect(outside))).rejects.toThrow(
      'Acesso fora do workspace bloqueado',
    );
    expect(runner.commands).toHaveLength(0);
  });

  it('requires the dedicated permission before using an external directory', async () => {
    const workspace = await temporaryDirectory('workspace');
    const outside = await temporaryDirectory('outside');
    const runner = new FakeRunner();
    const service = new EnvironmentService(() => workspace, runner);
    service.setPermission('credentials', true);
    service.setPermission('write', true);
    service.setPermission('outside-workspace', true);

    await expect(service.perform(firebaseSelect(outside))).resolves.toMatchObject({ ok: true });
    expect(runner.commands[0]?.cwd).toBe(await realpath(outside));
  });

  it('does not accept a truthy non-boolean confirmation', async () => {
    const runner = new FakeRunner();
    const service = new EnvironmentService(() => null, runner);
    service.setPermission('install-dependencies', true);
    const malformed = {
      toolId: 'pnpm',
      action: 'install',
      confirmed: 'yes',
    } as unknown as ToolActionRequest;

    await expect(service.perform(malformed)).resolves.toMatchObject({ ok: false });
    expect(runner.commands).toHaveLength(0);
  });
});
