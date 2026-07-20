import type { PermissionId, PermissionState } from './types';

const definitions: readonly Omit<PermissionState, 'granted'>[] = [
  {
    id: 'read',
    name: 'Leitura',
    description: 'Verificar versões e ler arquivos do projeto.',
    sensitive: false,
  },
  {
    id: 'write',
    name: 'Escrita',
    description: 'Alterar arquivos dentro do projeto.',
    sensitive: false,
  },
  {
    id: 'execute-safe',
    name: 'Comandos seguros',
    description: 'Executar verificações sem efeitos destrutivos.',
    sensitive: false,
  },
  {
    id: 'install-dependencies',
    name: 'Instalação',
    description: 'Instalar ferramentas após confirmação individual.',
    sensitive: true,
  },
  {
    id: 'outside-workspace',
    name: 'Fora do projeto',
    description: 'Acessar caminhos fora da pasta do projeto.',
    sensitive: true,
  },
  {
    id: 'credentials',
    name: 'Credenciais',
    description: 'Iniciar login e usar o cofre seguro do sistema.',
    sensitive: true,
  },
  {
    id: 'administrative',
    name: 'Administrador',
    description: 'Executar comandos com privilégios elevados.',
    sensitive: true,
  },
];

const permissionIds = new Set<PermissionId>(definitions.map(({ id }) => id));

export class PermissionManager {
  private readonly granted = new Set<PermissionId>(['read', 'execute-safe']);
  list(): readonly PermissionState[] {
    return definitions.map((item) => ({ ...item, granted: this.granted.has(item.id) }));
  }
  set(id: PermissionId, granted: boolean): void {
    if (!permissionIds.has(id)) throw new Error('Permissão desconhecida.');
    if (granted) this.granted.add(id);
    else this.granted.delete(id);
  }
  has(id: PermissionId): boolean {
    return this.granted.has(id);
  }
}
