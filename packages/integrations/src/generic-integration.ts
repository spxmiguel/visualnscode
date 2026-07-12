import type {
  CommandRunner,
  ToolActionResult,
  ToolDefinition,
  ToolDetectionResult,
  ToolIntegration,
} from './types';

export class GenericToolIntegration implements ToolIntegration {
  readonly id: string;
  readonly name: string;

  constructor(
    private readonly definition: ToolDefinition,
    private readonly runner: CommandRunner,
  ) {
    this.id = definition.id;
    this.name = definition.name;
  }

  async detect(): Promise<ToolDetectionResult> {
    const candidates = [this.definition.command, ...(this.definition.alternateCommands ?? [])];
    for (const command of candidates) {
      const path = await this.runner.findExecutable(command);
      if (!path) continue;
      const result = await this.runner.run({
        executable: path,
        args: this.definition.versionArgs,
        description: `Verificar versão de ${this.name}`,
        permission: 'read',
        risk: 'read',
      });
      if (result.exitCode !== 0)
        return {
          id: this.id,
          installed: true,
          message: `Encontrei ${this.name}, mas não consegui ler sua versão.`,
          path,
          status: 'error',
          version: null,
        };
      return {
        id: this.id,
        installed: true,
        message: `${this.name} está pronto para uso.`,
        path,
        status: 'installed',
        version: result.stdout.split(/\r?\n/u)[0] ?? 'versão desconhecida',
      };
    }
    return {
      id: this.id,
      installed: false,
      message: `${this.name} ainda não está instalado. Posso orientar a instalação.`,
      path: null,
      status: 'missing',
      version: null,
    };
  }

  async install(): Promise<ToolActionResult> {
    const command = this.definition.install;
    if (!command)
      return {
        ok: false,
        message: `A instalação automática de ${this.name} não está disponível neste sistema.`,
      };
    const result = await this.runner.run(command);
    return {
      ok: result.exitCode === 0,
      message:
        result.exitCode === 0
          ? `${this.name} foi instalado. Faça um novo teste.`
          : `Não consegui instalar ${this.name}. Nada foi alterado além da tentativa informada.`,
      output: result.stderr || result.stdout,
    };
  }

  async authenticate(): Promise<ToolActionResult> {
    return {
      ok: false,
      message: `${this.name} não possui autenticação configurada neste adapter.`,
    };
  }

  async test(): Promise<ToolActionResult> {
    const detection = await this.detect();
    return {
      ok: detection.installed && detection.status === 'installed',
      message: detection.message,
      data: { path: detection.path, version: detection.version },
    };
  }
}
