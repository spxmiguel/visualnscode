import type {
  ProviderConnectionResult,
  ProviderSettings,
  ProviderSummary,
} from '@visualnscode/providers/browser';
import { providerApi } from './provider-api';

interface ProviderSetupApi {
  list(): Promise<readonly ProviderSummary[]>;
  test(providerId: string): Promise<ProviderConnectionResult>;
  update(settings: ProviderSettings): Promise<ProviderSettings>;
}

export interface OllamaFallbackResult {
  readonly configured: boolean;
  readonly message: string;
}

const isReady = (provider: ProviderSummary): boolean =>
  provider.settings.enabled && provider.configured && provider.available;

export async function ensureOllamaFallback(
  api: ProviderSetupApi = providerApi.providers,
): Promise<OllamaFallbackResult> {
  const providers = await api.list();
  const readyAlternative = providers.some(
    (provider) => provider.id !== 'ollama' && isReady(provider),
  );
  if (readyAlternative) {
    return { configured: false, message: 'O provider escolhido pelo usuário foi mantido.' };
  }

  const ollama = providers.find(({ id }) => id === 'ollama');
  if (!ollama) {
    return { configured: false, message: 'Ollama não está disponível neste catálogo.' };
  }

  const connection = await api.test(ollama.id);
  const defaultModel =
    ollama.settings.defaultModel || connection.models[0]?.id || ollama.defaultModel;
  await api.update({
    ...ollama.settings,
    enabled: true,
    defaultModel,
  });

  return {
    configured: connection.ok,
    message: connection.ok
      ? `Ollama configurado automaticamente com ${defaultModel || 'o modelo local disponível'}.`
      : 'Ollama foi definido como provider local padrão. Inicie o serviço e instale um modelo para conversar.',
  };
}
