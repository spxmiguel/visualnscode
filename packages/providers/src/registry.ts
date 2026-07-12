import type { AIProvider } from './types';

export class ProviderRegistry {
  readonly #providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    if (this.#providers.has(provider.id)) throw new Error(`Provider duplicado: ${provider.id}`);
    this.#providers.set(provider.id, provider);
  }

  get(id: string): AIProvider | undefined {
    return this.#providers.get(id);
  }

  list(): readonly AIProvider[] {
    return [...this.#providers.values()];
  }
}
