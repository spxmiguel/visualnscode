// @vitest-environment node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DeploymentService, type DeploymentCommandRunner } from './deployment-service';
import { RunnerService } from './runner-service';

class FakeDeployRunner implements DeploymentCommandRunner {
  readonly calls: Array<{ executable: string; args: readonly string[]; cwd: string }> = [];
  async run(executable: string, args: readonly string[], cwd: string) {
    this.calls.push({ executable, args, cwd });
    return { code: 0, output: executable === 'vercel' ? 'https://preview.example.test' : '' };
  }
}

describe('DeploymentService', () => {
  let root: string;
  let commands: FakeDeployRunner;
  let service: DeploymentService;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-deploy-'));
    await fs.writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ scripts: { build: 'vite build' } }),
    );
    commands = new FakeDeployRunner();
    service = new DeploymentService(new RunnerService(), commands);
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('does not run preview or production deployments without confirmation', async () => {
    await expect(
      service.deploy(
        root,
        { provider: 'vercel', environment: 'production', confirmed: false, config: {} },
        () => undefined,
      ),
    ).rejects.toThrow(/confirme/i);
    expect(commands.calls).toHaveLength(0);
  });

  it('tests the build, deploys preview and stores its URL in local history', async () => {
    const events: string[] = [];
    const record = await service.deploy(
      root,
      { provider: 'vercel', environment: 'preview', confirmed: true, config: {} },
      (event) => events.push(event.payload),
    );

    expect(record).toMatchObject({ status: 'succeeded', url: 'https://preview.example.test/' });
    expect(commands.calls.map(({ executable, args }) => [executable, ...args])).toEqual([
      ['npm', 'run', 'build'],
      ['vercel', 'deploy', '--yes'],
    ]);
    expect(events).toContain('Gerando uma versão otimizada do projeto…');
    expect(await service.history(root)).toHaveLength(1);
  });

  it('requires Supabase fields and uses argument arrays for production', async () => {
    await expect(
      service.deploy(
        root,
        { provider: 'supabase', environment: 'production', confirmed: true, config: {} },
        () => undefined,
      ),
    ).rejects.toThrow(/projectRef/i);
    const record = await service.deploy(
      root,
      {
        provider: 'supabase',
        environment: 'production',
        confirmed: true,
        config: { projectRef: 'abc', functionName: 'hello' },
      },
      () => undefined,
    );
    expect(record.url).toBe('https://abc.supabase.co/functions/v1/hello');
    expect(commands.calls[0]).toMatchObject({
      executable: 'supabase',
      args: ['functions', 'deploy', 'hello', '--project-ref', 'abc'],
    });
  });
});
