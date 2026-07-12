import { GenericToolIntegration } from './generic-integration';
import { getToolDefinition } from './tool-catalog';
import type {
  CommandRunner,
  ToolActionResult,
  ToolDetectionResult,
  ToolIntegration,
} from './types';

export class SupabaseIntegration implements ToolIntegration {
  readonly id = 'supabase';
  readonly name = 'Supabase CLI';
  private readonly generic: GenericToolIntegration;
  constructor(private readonly runner: CommandRunner) {
    const definition = getToolDefinition(this.id);
    if (!definition) throw new Error('Definição do Supabase ausente.');
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
      'Login do Supabase concluído.',
      'Não consegui concluir o login do Supabase.',
      'credentials',
      'write',
      300_000,
    );
  }
  test(): Promise<ToolActionResult> {
    return this.execute(
      ['projects', 'list', '--output', 'json'],
      'Conta Supabase conectada.',
      'Nenhuma conta Supabase está conectada.',
      'credentials',
      'read',
    );
  }
  listProjects(): Promise<ToolActionResult> {
    return this.test();
  }
  link(projectRef: string, cwd: string): Promise<ToolActionResult> {
    if (!projectRef)
      return Promise.resolve({ ok: false, message: 'Informe a referência do projeto Supabase.' });
    return this.workspaceAction(
      cwd,
      ['link', '--project-ref', projectRef],
      'Projeto Supabase vinculado.',
      'Não consegui vincular o projeto.',
      'write',
      120_000,
    );
  }
  start(cwd: string): Promise<ToolActionResult> {
    return this.workspaceAction(
      cwd,
      ['start'],
      'Ambiente local do Supabase iniciado.',
      'Não consegui iniciar o ambiente local. Verifique se o Docker está ativo.',
      'write',
      600_000,
    );
  }
  migrate(cwd: string): Promise<ToolActionResult> {
    return this.workspaceAction(
      cwd,
      ['migration', 'up'],
      'Migrations executadas.',
      'Não consegui executar as migrations.',
      'write',
      300_000,
    );
  }
  generateTypes(cwd: string): Promise<ToolActionResult> {
    return this.workspaceAction(
      cwd,
      ['gen', 'types', 'typescript', '--local'],
      'Tipos TypeScript gerados. O conteúdo está pronto para ser salvo no workspace.',
      'Não consegui gerar os tipos TypeScript.',
      'write',
      120_000,
    );
  }
  private async workspaceAction(
    cwd: string,
    args: readonly string[],
    success: string,
    failure: string,
    risk: 'write',
    timeoutMs: number,
  ): Promise<ToolActionResult> {
    if (!cwd)
      return {
        ok: false,
        message: 'Abra um workspace real antes de executar esta ação do Supabase.',
      };
    return this.execute(args, success, failure, 'write', risk, timeoutMs, cwd);
  }
  private async execute(
    args: readonly string[],
    success: string,
    failure: string,
    permission: 'credentials' | 'write',
    risk: 'read' | 'write',
    timeoutMs = 30_000,
    cwd?: string,
  ): Promise<ToolActionResult> {
    const result = await this.runner.run({
      executable: 'supabase',
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
