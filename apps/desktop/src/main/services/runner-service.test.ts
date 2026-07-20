// @vitest-environment node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RunnerService } from './runner-service';

describe('RunnerService', () => {
  let root: string;
  let service: RunnerService;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-runner-'));
    service = new RunnerService();
  });

  afterEach(async () => {
    await service.stopAll();
    await fs.rm(root, { recursive: true, force: true });
  });

  it.each([
    ['pnpm-lock.yaml', 'pnpm'],
    ['package-lock.json', 'npm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
  ] as const)('detects %s and all available package scripts', async (lock, manager) => {
    await fs.writeFile(
      lock === 'package-lock.json' ? path.join(root, lock) : path.join(root, lock),
      '',
    );
    await fs.writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        scripts: { dev: 'vite --port 4444', build: 'vite build', test: 'vitest' },
        devDependencies: { vite: '1.0.0' },
      }),
    );

    const runtime = await service.detectProject(root);

    expect(runtime).toMatchObject({ kind: 'node', manager, framework: 'Vite', port: 4444 });
    expect(Object.keys(runtime.commands)).toEqual(['install', 'dev', 'build', 'test']);
    expect(runtime.commands.dev?.display).toBe(
      `${manager === 'npm' ? 'npm run' : `${manager} run`} dev`,
    );
  });

  it('detects FastAPI and static projects with useful commands', async () => {
    await fs.writeFile(
      path.join(root, 'pyproject.toml'),
      '[project]\ndependencies=["fastapi", "uvicorn"]',
    );
    expect(await service.detectProject(root)).toMatchObject({
      kind: 'python',
      framework: 'FastAPI',
      manager: 'python',
      port: 8000,
    });

    await fs.rm(path.join(root, 'pyproject.toml'));
    await fs.writeFile(path.join(root, 'index.html'), '<h1>Hello</h1>');
    const staticRuntime = await service.detectProject(root);
    expect(staticRuntime).toMatchObject({ kind: 'static', framework: 'Static HTML', port: 4173 });
    expect(staticRuntime.commands.dev).toBeDefined();
  });

  it('starts and stops the internal static server without a shell command', async () => {
    await fs.writeFile(path.join(root, 'index.html'), '<h1>Hello</h1>');
    const events: string[] = [];
    await service.start('static-test', root, 'dev', (event) =>
      events.push(`${event.type}:${event.payload}`),
    );
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(service.isRunning('static-test')).toBe(true);
    expect(events.some((event) => event.startsWith('url:http://127.0.0.1:4173'))).toBe(true);
    await service.stop('static-test');
    expect(service.isRunning('static-test')).toBe(false);
  });
});
