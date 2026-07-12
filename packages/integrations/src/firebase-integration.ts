import { GenericToolIntegration } from './generic-integration';
import { getToolDefinition } from './tool-catalog';
import type {
  CommandRunner,
  ToolActionResult,
  ToolDetectionResult,
  ToolIntegration,
} from './types';

export class FirebaseIntegration implements ToolIntegration {
  readonly id = 'firebase';
  readonly name = 'Firebase CLI';
  private readonly generic: GenericToolIntegration;
  constructor(private readonly runner: CommandRunner) {
    const definition = getToolDefinition(this.id);
    if (!definition) throw new Error('Definição do Firebase ausente.');
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
      'Login do Firebase concluído.',
      'Não consegui concluir o login do Firebase.',
      'credentials',
      'write',
      300_000,
    );
  }
  test(): Promise<ToolActionResult> {
    return this.execute(
      ['login:list', '--json'],
      'Autenticação do Firebase confirmada.',
      'Nenhuma conta do Firebase está conectada.',
      'credentials',
      'read',
    );
  }
  listProjects(): Promise<ToolActionResult> {
    return this.execute(
      ['projects:list', '--json'],
      'Projetos do Firebase carregados.',
      'Não consegui listar os projetos do Firebase.',
      'credentials',
      'read',
    );
  }
  async selectProject(projectId: string, cwd: string): Promise<ToolActionResult> {
    if (!projectId || !cwd)
      return {
        ok: false,
        message: 'Abra um workspace real e informe o projeto antes de vinculá-lo.',
      };
    return this.execute(
      ['use', projectId],
      `Projeto ${projectId} selecionado.`,
      'Não consegui selecionar este projeto Firebase.',
      'write',
      'write',
      30_000,
      cwd,
    );
  }
  async initialize(projectId: string, cwd: string): Promise<ToolActionResult> {
    if (!projectId || !cwd)
      return {
        ok: false,
        message: 'Abra um workspace real antes de inicializar Hosting, Firestore e Authentication.',
      };
    return this.execute(
      ['init', 'hosting,firestore,auth', '--project', projectId],
      'Firebase inicializado com Hosting, Firestore e Authentication.',
      'A inicialização do Firebase não foi concluída.',
      'write',
      'write',
      300_000,
      cwd,
    );
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
      executable: 'firebase',
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
