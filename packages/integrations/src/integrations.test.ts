import { describe, expect, it } from 'vitest';
import { FirebaseIntegration } from './firebase-integration';
import { GenericToolIntegration } from './generic-integration';
import { GitHubIntegration } from './github-integration';
import { PermissionManager } from './permissions';
import { SupabaseIntegration } from './supabase-integration';
import { getToolDefinition, toolCatalog } from './tool-catalog';
import type { CommandResult, CommandRunner, CommandSpec } from './types';
import { VercelIntegration } from './vercel-integration';

class MockCommandRunner implements CommandRunner {
  readonly commands: CommandSpec[] = [];
  readonly paths = new Map<string, string>();
  readonly responses: CommandResult[] = [];
  async findExecutable(command: string): Promise<string | null> {
    return this.paths.get(command) ?? null;
  }
  async run(command: CommandSpec): Promise<CommandResult> {
    this.commands.push(command);
    return this.responses.shift() ?? { exitCode: 0, stderr: '', stdout: '' };
  }
}

describe('catálogo e detecção', () => {
  it('mantém as 19 ferramentas solicitadas no catálogo', () => {
    expect(toolCatalog).toHaveLength(19);
  });
  it('detecta caminho e versão sem executar shell', async () => {
    const runner = new MockCommandRunner();
    runner.paths.set('git', '/usr/bin/git');
    runner.responses.push({ exitCode: 0, stderr: '', stdout: 'git version 2.50.1' });
    const definition = getToolDefinition('git');
    if (!definition) throw new Error('fixture ausente');
    await expect(new GenericToolIntegration(definition, runner).detect()).resolves.toMatchObject({
      installed: true,
      path: '/usr/bin/git',
      version: 'git version 2.50.1',
    });
    expect(runner.commands[0]?.executable).toBe('/usr/bin/git');
  });
  it('explica quando uma ferramenta não está instalada', async () => {
    const definition = getToolDefinition('bun');
    if (!definition) throw new Error('fixture ausente');
    await expect(
      new GenericToolIntegration(definition, new MockCommandRunner()).detect(),
    ).resolves.toMatchObject({ installed: false, status: 'missing' });
  });
});

describe('integrações sem autenticação real', () => {
  it('normaliza o username retornado pelo GitHub CLI', async () => {
    const runner = new MockCommandRunner();
    runner.responses.push(
      { exitCode: 0, stderr: '', stdout: 'github.com ok' },
      { exitCode: 0, stderr: '', stdout: 'visual-user' },
    );
    await expect(new GitHubIntegration(runner).test()).resolves.toMatchObject({
      ok: true,
      data: { username: 'visual-user' },
    });
  });
  it('lista projetos Firebase usando saída JSON', async () => {
    const runner = new MockCommandRunner();
    runner.responses.push({ exitCode: 0, stderr: '', stdout: '{"results":[]}' });
    await expect(new FirebaseIntegration(runner).listProjects()).resolves.toMatchObject({
      ok: true,
    });
    expect(runner.commands[0]?.args).toEqual(['projects:list', '--json']);
  });
  it('classifica deploy Vercel de produção como destrutivo', async () => {
    const runner = new MockCommandRunner();
    runner.responses.push({ exitCode: 0, stderr: '', stdout: 'https://example.vercel.app' });
    await new VercelIntegration(runner).deploy('/workspace', true);
    expect(runner.commands[0]).toMatchObject({
      args: ['--prod', '--yes'],
      cwd: '/workspace',
      risk: 'destructive',
    });
  });
  it('bloqueia Supabase local sem workspace confiável', async () => {
    const runner = new MockCommandRunner();
    await expect(new SupabaseIntegration(runner).start('')).resolves.toMatchObject({ ok: false });
    expect(runner.commands).toHaveLength(0);
  });
});

describe('permissões', () => {
  it('concede apenas leitura e comandos seguros por padrão', () => {
    const manager = new PermissionManager();
    expect(manager.has('read')).toBe(true);
    expect(manager.has('execute-safe')).toBe(true);
    expect(manager.has('install-dependencies')).toBe(false);
    expect(manager.has('administrative')).toBe(false);
    manager.set('install-dependencies', true);
    expect(manager.has('install-dependencies')).toBe(true);
    manager.set('install-dependencies', false);
    expect(manager.has('install-dependencies')).toBe(false);
    expect(() => manager.set('unknown' as never, true)).toThrow('Permissão desconhecida');
  });
});
