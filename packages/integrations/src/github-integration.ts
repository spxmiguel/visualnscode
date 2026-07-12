import { GenericToolIntegration } from './generic-integration';
import { getToolDefinition } from './tool-catalog';
import type {
  CommandRunner,
  ToolActionResult,
  ToolDetectionResult,
  ToolIntegration,
} from './types';

export class GitHubIntegration implements ToolIntegration {
  readonly id = 'github';
  readonly name = 'GitHub CLI';
  private readonly generic: GenericToolIntegration;

  constructor(private readonly runner: CommandRunner) {
    const definition = getToolDefinition(this.id);
    if (!definition) throw new Error('Definição do GitHub CLI ausente.');
    this.generic = new GenericToolIntegration(definition, runner);
  }

  detect(): Promise<ToolDetectionResult> {
    return this.generic.detect();
  }
  install(): Promise<ToolActionResult> {
    return this.generic.install();
  }
  async authenticate(): Promise<ToolActionResult> {
    const result = await this.runner.run({
      executable: 'gh',
      args: ['auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web'],
      description: 'Entrar no GitHub pelo navegador',
      permission: 'credentials',
      risk: 'write',
      timeoutMs: 300_000,
    });
    return this.fromCommand(
      result.exitCode,
      'Login do GitHub concluído.',
      'Não consegui concluir o login. Finalize a autorização no navegador e tente novamente.',
      result.stderr || result.stdout,
    );
  }
  async test(): Promise<ToolActionResult> {
    const status = await this.runner.run({
      executable: 'gh',
      args: ['auth', 'status', '--hostname', 'github.com'],
      description: 'Verificar login do GitHub',
      permission: 'read',
      risk: 'read',
    });
    if (status.exitCode !== 0)
      return {
        ok: false,
        message: 'O GitHub CLI está instalado, mas nenhuma conta está conectada.',
        output: status.stderr,
      };
    const user = await this.runner.run({
      executable: 'gh',
      args: ['api', 'user', '--jq', '.login'],
      description: 'Ler usuário conectado do GitHub',
      permission: 'credentials',
      risk: 'read',
    });
    return {
      ok: user.exitCode === 0,
      message:
        user.exitCode === 0
          ? `Conectado como @${user.stdout}.`
          : 'A conta está conectada, mas não consegui ler o username.',
      ...(user.exitCode === 0 ? { data: { username: user.stdout } } : {}),
    };
  }
  async logout(): Promise<ToolActionResult> {
    const result = await this.runner.run({
      executable: 'gh',
      args: ['auth', 'logout', '--hostname', 'github.com'],
      description: 'Sair da conta do GitHub',
      permission: 'credentials',
      risk: 'write',
    });
    return this.fromCommand(
      result.exitCode,
      'Conta do GitHub desconectada.',
      'Não consegui desconectar a conta do GitHub.',
      result.stderr,
    );
  }
  async testRepositories(): Promise<ToolActionResult> {
    const result = await this.runner.run({
      executable: 'gh',
      args: ['repo', 'list', '--limit', '1', '--json', 'nameWithOwner'],
      description: 'Testar acesso a repositórios do GitHub',
      permission: 'credentials',
      risk: 'read',
    });
    return this.fromCommand(
      result.exitCode,
      'Acesso a repositórios confirmado.',
      'Não consegui acessar os repositórios desta conta.',
      result.stderr || result.stdout,
    );
  }
  async configureGit(name: string, email: string): Promise<ToolActionResult> {
    if (!name.trim() || !email.includes('@'))
      return { ok: false, message: 'Informe um nome e um email válidos para o Git.' };
    const first = await this.runner.run({
      executable: 'git',
      args: ['config', '--global', 'user.name', name.trim()],
      description: 'Configurar nome global do Git',
      permission: 'outside-workspace',
      risk: 'write',
    });
    if (first.exitCode !== 0)
      return { ok: false, message: 'Não consegui salvar o nome do Git.', output: first.stderr };
    const second = await this.runner.run({
      executable: 'git',
      args: ['config', '--global', 'user.email', email.trim()],
      description: 'Configurar email global do Git',
      permission: 'outside-workspace',
      risk: 'write',
    });
    return this.fromCommand(
      second.exitCode,
      'Nome e email do Git configurados.',
      'O nome foi salvo, mas não consegui salvar o email.',
      second.stderr,
    );
  }
  private fromCommand(
    exitCode: number,
    success: string,
    failure: string,
    output: string,
  ): ToolActionResult {
    return { ok: exitCode === 0, message: exitCode === 0 ? success : failure, output };
  }
}
