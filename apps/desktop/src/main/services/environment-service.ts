import {
  GenericToolIntegration,
  GitHubIntegration,
  PermissionManager,
  SystemCommandRunner,
  getToolDefinition,
  toolCatalog,
  type PermissionId,
  type ToolActionRequest,
  type ToolActionResult,
  type ToolDetectionResult,
} from '@visualnscode/integrations';

export class EnvironmentService {
  readonly permissions = new PermissionManager();
  private readonly runner = new SystemCommandRunner();

  async detectAll(): Promise<readonly ToolDetectionResult[]> {
    return Promise.all(
      toolCatalog.map((definition) => new GenericToolIntegration(definition, this.runner).detect()),
    );
  }

  async detect(toolId: string): Promise<ToolDetectionResult> {
    const definition = getToolDefinition(toolId);
    if (!definition)
      return {
        id: toolId,
        installed: false,
        message: 'Essa ferramenta não faz parte do catálogo seguro.',
        path: null,
        status: 'error',
        version: null,
      };
    return new GenericToolIntegration(definition, this.runner).detect();
  }

  async perform(request: ToolActionRequest): Promise<ToolActionResult> {
    const definition = getToolDefinition(request.toolId);
    if (!definition)
      return { ok: false, message: 'A ferramenta solicitada não faz parte do catálogo seguro.' };
    const integration = new GenericToolIntegration(definition, this.runner);
    if (request.toolId === 'github') return this.performGitHub(request);
    if (request.action === 'test') return integration.test();
    if (!request.confirmed) return { ok: false, message: 'Confirme a ação antes de continuar.' };
    if (request.action === 'install') {
      if (!this.permissions.has('install-dependencies'))
        return { ok: false, message: 'Autorize a permissão de instalação antes de continuar.' };
      return integration.install();
    }
    return { ok: false, message: 'Essa ação ainda não está disponível para esta ferramenta.' };
  }

  setPermission(id: PermissionId, granted: boolean): void {
    this.permissions.set(id, granted);
  }

  private async performGitHub(request: ToolActionRequest): Promise<ToolActionResult> {
    const integration = new GitHubIntegration(this.runner);
    if (request.action === 'test') return integration.test();
    if (!request.confirmed) return { ok: false, message: 'Confirme a ação antes de continuar.' };
    if (request.action === 'install') {
      if (!this.permissions.has('install-dependencies'))
        return { ok: false, message: 'Autorize instalações antes de continuar.' };
      return integration.install();
    }
    if (!this.permissions.has('credentials'))
      return { ok: false, message: 'Autorize o acesso a credenciais antes de continuar.' };
    if (request.action === 'authenticate') return integration.authenticate();
    if (request.action === 'logout') return integration.logout();
    if (request.action === 'configure' && request.parameters?.operation === 'repositories')
      return integration.testRepositories();
    if (request.action === 'configure' && request.parameters?.operation === 'git-profile') {
      if (!this.permissions.has('outside-workspace'))
        return {
          ok: false,
          message: 'Autorize alterações fora do projeto para configurar o Git global.',
        };
      return integration.configureGit(
        String(request.parameters.name ?? ''),
        String(request.parameters.email ?? ''),
      );
    }
    return { ok: false, message: 'Ação do GitHub não reconhecida.' };
  }
}
