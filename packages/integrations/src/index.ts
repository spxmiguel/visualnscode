export interface IntegrationDescriptor {
  readonly id: string;
  readonly name: string;
  readonly kind: 'cli' | 'deploy' | 'source-control';
}

export const availableIntegrations: readonly IntegrationDescriptor[] = [];
