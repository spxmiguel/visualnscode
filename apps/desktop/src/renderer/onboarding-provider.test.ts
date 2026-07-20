import {
  defaultProviderSettings,
  providerCatalog,
  type AIModel,
  type ProviderSettings,
  type ProviderSummary,
} from '@visualnscode/providers/browser';
import { describe, expect, it, vi } from 'vitest';
import { ensureOllamaFallback } from './onboarding-provider';

const summary = (
  id: string,
  overrides: Partial<Pick<ProviderSummary, 'available' | 'configured'>> = {},
  settings: Partial<ProviderSettings> = {},
): ProviderSummary => {
  const descriptor = providerCatalog.find((provider) => provider.id === id);
  if (!descriptor) throw new Error(`Provider ausente no teste: ${id}`);
  return {
    ...descriptor,
    available: false,
    configured: false,
    ...overrides,
    settings: { ...defaultProviderSettings(descriptor), ...settings },
  };
};

const ollamaModel: AIModel = {
  id: 'qwen3:8b',
  name: 'Qwen 3 8B',
  providerId: 'ollama',
  capabilities: providerCatalog.find(({ id }) => id === 'ollama')!.capabilities,
  cost: {
    currency: 'USD',
    inputPerMillionTokens: 0,
    outputPerMillionTokens: 0,
    note: 'Local',
  },
  execution: 'local',
  contextWindow: null,
};

describe('provider padrão do onboarding', () => {
  it('ativa Ollama e escolhe o primeiro modelo quando nenhuma outra IA está pronta', async () => {
    const update = vi.fn(async (settings: ProviderSettings) => settings);
    const result = await ensureOllamaFallback({
      list: vi.fn(async () => [
        summary('openai'),
        summary('ollama', { available: true, configured: true }),
      ]),
      test: vi.fn(async () => ({ ok: true, message: 'ok', models: [ollamaModel] })),
      update,
    });

    expect(result.configured).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'ollama', enabled: true, defaultModel: 'qwen3:8b' }),
    );
  });

  it('preserva o provider escolhido quando outra IA já está pronta', async () => {
    const test = vi.fn();
    const update = vi.fn();
    const result = await ensureOllamaFallback({
      list: vi.fn(async () => [
        summary('openai', { available: true, configured: true }, { enabled: true }),
        summary('ollama'),
      ]),
      test,
      update,
    });

    expect(result.configured).toBe(false);
    expect(test).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
