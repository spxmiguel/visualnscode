import {
  FirebaseIntegration,
  GenericToolIntegration,
  GitHubIntegration,
  PermissionManager,
  SystemCommandRunner,
  SupabaseIntegration,
  VercelIntegration,
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
    if (request.toolId === 'firebase') return this.performFirebase(request);
    if (request.toolId === 'vercel') return this.performVercel(request);
    if (request.toolId === 'supabase') return this.performSupabase(request);
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
    if (request.action === 'test') {
      if (!this.permissions.has('credentials'))
        return { ok: false, message: 'Autorize o acesso a credenciais antes de testar a conta.' };
      return integration.test();
    }
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

  private async performFirebase(request: ToolActionRequest): Promise<ToolActionResult> {
    const integration = new FirebaseIntegration(this.runner);
    if (request.action === 'test') {
      if (!this.permissions.has('credentials'))
        return { ok: false, message: 'Autorize o acesso a credenciais antes de testar a conta.' };
      return integration.test();
    }
    if (!request.confirmed) return { ok: false, message: 'Confirme a ação antes de continuar.' };
    if (request.action === 'install') {
      if (!this.permissions.has('install-dependencies'))
        return { ok: false, message: 'Autorize instalações antes de continuar.' };
      return integration.install();
    }
    if (!this.permissions.has('credentials'))
      return { ok: false, message: 'Autorize o acesso a credenciais antes de continuar.' };
    if (request.action === 'authenticate') return integration.authenticate();
    if (request.action !== 'configure')
      return { ok: false, message: 'Ação Firebase não reconhecida.' };
    const operation = request.parameters?.operation;
    if (operation === 'projects') return integration.listProjects();
    if (!this.permissions.has('write'))
      return { ok: false, message: 'Autorize escrita no projeto antes de continuar.' };
    const projectId = String(request.parameters?.projectId ?? '');
    const cwd = String(request.parameters?.trustedWorkspacePath ?? '');
    if (operation === 'select') return integration.selectProject(projectId, cwd);
    if (operation === 'initialize') return integration.initialize(projectId, cwd);
    return { ok: false, message: 'Operação Firebase não reconhecida.' };
  }

  private async performVercel(request: ToolActionRequest): Promise<ToolActionResult> {
    const integration = new VercelIntegration(this.runner);
    if (request.action === 'test') {
      if (!this.permissions.has('credentials'))
        return { ok: false, message: 'Autorize o acesso a credenciais antes de testar a conta.' };
      return integration.test();
    }
    if (!request.confirmed) return { ok: false, message: 'Confirme a ação antes de continuar.' };
    if (request.action === 'install') {
      if (!this.permissions.has('install-dependencies'))
        return { ok: false, message: 'Autorize instalações antes de continuar.' };
      return integration.install();
    }
    if (!this.permissions.has('credentials'))
      return { ok: false, message: 'Autorize o acesso a credenciais antes de continuar.' };
    if (request.action === 'authenticate') return integration.authenticate();
    if (request.action !== 'configure')
      return { ok: false, message: 'Ação Vercel não reconhecida.' };
    const operation = request.parameters?.operation;
    if (operation === 'projects') return integration.listProjects();
    if (!this.permissions.has('write'))
      return { ok: false, message: 'Autorize escrita no projeto antes de continuar.' };
    const cwd = String(request.parameters?.trustedWorkspacePath ?? '');
    const name = String(request.parameters?.projectName ?? '');
    if (operation === 'link') return integration.link(name, cwd);
    if (operation === 'create') return integration.create(name, cwd);
    if (operation === 'preview') return integration.deploy(cwd, false);
    if (operation === 'production') return integration.deploy(cwd, true);
    return { ok: false, message: 'Operação Vercel não reconhecida.' };
  }

  private async performSupabase(request: ToolActionRequest): Promise<ToolActionResult> {
    const integration = new SupabaseIntegration(this.runner);
    if (request.action === 'test') {
      if (!this.permissions.has('credentials'))
        return { ok: false, message: 'Autorize o acesso a credenciais antes de testar a conta.' };
      return integration.test();
    }
    if (!request.confirmed) return { ok: false, message: 'Confirme a ação antes de continuar.' };
    if (request.action === 'install') {
      if (!this.permissions.has('install-dependencies'))
        return { ok: false, message: 'Autorize instalações antes de continuar.' };
      return integration.install();
    }
    if (!this.permissions.has('credentials'))
      return { ok: false, message: 'Autorize o acesso a credenciais antes de continuar.' };
    if (request.action === 'authenticate') return integration.authenticate();
    if (request.action !== 'configure')
      return { ok: false, message: 'Ação Supabase não reconhecida.' };
    const operation = request.parameters?.operation;
    if (operation === 'projects') return integration.listProjects();
    if (!this.permissions.has('write'))
      return { ok: false, message: 'Autorize escrita no projeto antes de continuar.' };
    const cwd = String(request.parameters?.trustedWorkspacePath ?? '');
    const projectRef = String(request.parameters?.projectRef ?? '');
    if (operation === 'link') return integration.link(projectRef, cwd);
    if (operation === 'start') return integration.start(cwd);
    if (operation === 'migrate') return integration.migrate(cwd);
    if (operation === 'types') return integration.generateTypes(cwd);
    return { ok: false, message: 'Operação Supabase não reconhecida.' };
  }
}
