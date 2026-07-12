import { GenericToolIntegration } from './generic-integration';
import { getToolDefinition } from './tool-catalog';
import type {
  CommandRunner,
  ToolActionResult,
  ToolDetectionResult,
  ToolIntegration,
} from './types';

export class VercelIntegration implements ToolIntegration {
  readonly id = 'vercel';
  readonly name = 'Vercel CLI';
  private readonly generic: GenericToolIntegration;
  constructor(private readonly runner: CommandRunner) {
    const definition = getToolDefinition(this.id);
    if (!definition) throw new Error('Definição da Vercel ausente.');
    this.generic = new GenericToolIntegration(definition, runner);
  }
  detect(): Promise<ToolDetectionResult> {
    return this.generic.detect();
  }
  install(): Promise<ToolActionResult> {
    return this.generic.install();
  }
  authenticate(): Promise<ToolActionResult> {
    return this.execute(
      ['login'],
      'Login da Vercel concluído.',
      'Não consegui concluir o login da Vercel.',
      'credentials',
      'write',
      300_000,
    );
  }
  test(): Promise<ToolActionResult> {
    return this.execute(
      ['whoami'],
      'Conta da Vercel conectada.',
      'Nenhuma conta da Vercel está conectada.',
      'credentials',
      'read',
    );
  }
  listProjects(): Promise<ToolActionResult> {
    return this.execute(
      ['project', 'ls'],
      'Projetos da Vercel carregados.',
      'Não consegui listar projetos da Vercel.',
      'credentials',
      'read',
    );
  }
  link(name: string, cwd: string): Promise<ToolActionResult> {
    return this.workspaceAction(
      cwd,
      ['link', '--project', name, '--yes'],
      'Pasta vinculada ao projeto Vercel.',
      'Não consegui vincular esta pasta.',
    );
  }
  create(name: string, cwd: string): Promise<ToolActionResult> {
    return this.workspaceAction(
      cwd,
      ['project', 'add', name],
      `Projeto ${name} criado na Vercel.`,
      'Não consegui criar o projeto Vercel.',
    );
  }
  deploy(cwd: string, production: boolean): Promise<ToolActionResult> {
    return this.workspaceAction(
      cwd,
      production ? ['--prod', '--yes'] : ['--yes'],
      production ? 'Deploy de produção concluído.' : 'Deploy de preview concluído.',
      'O deploy não foi concluído.',
      production ? 'destructive' : 'write',
      600_000,
    );
  }
  private async workspaceAction(
    cwd: string,
    args: readonly string[],
    success: string,
    failure: string,
    risk: 'write' | 'destructive' = 'write',
    timeoutMs = 120_000,
  ): Promise<ToolActionResult> {
    if (!cwd)
      return {
        ok: false,
        message: 'Abra um workspace real antes de executar esta ação da Vercel.',
      };
    return this.execute(args, success, failure, 'write', risk, timeoutMs, cwd);
  }
  private async execute(
    args: readonly string[],
    success: string,
    failure: string,
    permission: 'credentials' | 'write',
    risk: 'read' | 'write' | 'destructive',
    timeoutMs = 30_000,
    cwd?: string,
  ): Promise<ToolActionResult> {
    const result = await this.runner.run({
      executable: 'vercel',
      args,
      description: success,
      permission,
      risk,
      timeoutMs,
      ...(cwd ? { cwd } : {}),
    });
    return {
      ok: result.exitCode === 0,
      message: result.exitCode === 0 ? success : failure,
      output: result.stderr || result.stdout,
    };
  }
}
