import type { ProviderCapability } from '@visualnscode/types';

export interface AiProviderDescriptor {
  readonly capabilities: readonly ProviderCapability[];
  readonly id: string;
  readonly name: string;
}

export class ProviderRegistry {
  readonly #providers = new Map<string, AiProviderDescriptor>();

  register(provider: AiProviderDescriptor): void {
    if (this.#providers.has(provider.id)) throw new Error(`Provider duplicado: ${provider.id}`);
    this.#providers.set(provider.id, provider);
  }

  list(): readonly AiProviderDescriptor[] {
    return [...this.#providers.values()];
  }
}
