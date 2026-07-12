import {
  toolCatalog,
  type PermissionState,
  type ToolActionRequest,
  type ToolActionResult,
  type ToolDetectionResult,
} from '@visualnscode/integrations';

const unavailable = (toolId: string): ToolDetectionResult => {
  return {
    id: toolId,
    installed: false,
    message: 'A detecção real funciona no aplicativo Electron.',
    path: null,
    status: 'missing',
    version: null,
  };
};

const fallbackPermissions: readonly PermissionState[] = [
  {
    id: 'read',
    name: 'Leitura',
    description: 'Verificar versões e arquivos do projeto.',
    granted: true,
    sensitive: false,
  },
  {
    id: 'write',
    name: 'Escrita',
    description: 'Alterar arquivos dentro do projeto.',
    granted: false,
    sensitive: false,
  },
  {
    id: 'execute-safe',
    name: 'Comandos seguros',
    description: 'Executar verificações sem efeitos destrutivos.',
    granted: true,
    sensitive: false,
  },
  {
    id: 'install-dependencies',
    name: 'Instalação',
    description: 'Instalar após confirmação individual.',
    granted: false,
    sensitive: true,
  },
  {
    id: 'outside-workspace',
    name: 'Fora do projeto',
    description: 'Acessar caminhos externos.',
    granted: false,
    sensitive: true,
  },
  {
    id: 'credentials',
    name: 'Credenciais',
    description: 'Usar login e cofre do sistema.',
    granted: false,
    sensitive: true,
  },
  {
    id: 'administrative',
    name: 'Administrador',
    description: 'Usar privilégios elevados.',
    granted: false,
    sensitive: true,
  },
];

export const environmentApi = window.visualnscode?.environment ?? {
  detectAll: async () => toolCatalog.map(({ id }) => unavailable(id)),
  detect: async (toolId: string) => unavailable(toolId),
  perform: async (_request: ToolActionRequest): Promise<ToolActionResult> => ({
    ok: false,
    message: 'Ações locais só estão disponíveis no aplicativo Electron.',
  }),
  permissions: async () => fallbackPermissions,
  setPermission: async () => fallbackPermissions,
  openDocumentation: async () => false,
};
