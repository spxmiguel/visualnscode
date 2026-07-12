export interface WorkspaceDescriptor {
  readonly id: string;
  readonly name: string;
  readonly rootPath: string;
}

export type ProviderCapability = 'chat' | 'completion' | 'tools';
