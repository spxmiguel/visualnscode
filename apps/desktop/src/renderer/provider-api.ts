import {
  defaultProviderSettings,
  providerCatalog,
  type AgentChunk,
  type AgentInput,
  type ProviderSettings,
  type ProviderSummary,
} from '@visualnscode/providers/browser';

const listeners = new Set<(chunk: AgentChunk) => void>();
const settings = new Map<string, ProviderSettings>();

const fallbackList = (): readonly ProviderSummary[] =>
  providerCatalog.map((descriptor) => ({
    ...descriptor,
    available: descriptor.id === 'ollama',
    configured: descriptor.id === 'ollama',
    settings:
      settings.get(descriptor.id) ??
      (descriptor.id === 'ollama'
        ? { ...defaultProviderSettings(descriptor), enabled: true, defaultModel: 'modelo-local' }
        : defaultProviderSettings(descriptor)),
  }));

const fallback = {
  providers: {
    list: async () => fallbackList(),
    update: async (value: ProviderSettings) => {
      settings.set(value.providerId, value);
      return value;
    },
    test: async (providerId: string) => ({
      ok: providerId === 'ollama',
      message:
        providerId === 'ollama'
          ? 'Conexão simulada disponível no preview.'
          : 'O teste real funciona no aplicativo Electron.',
      models:
        providerId === 'ollama'
          ? [
              {
                id: 'modelo-local',
                name: 'Modelo local',
                providerId,
                capabilities: providerCatalog.find(({ id }) => id === providerId)!.capabilities,
                execution: 'local' as const,
                contextWindow: null,
                cost: {
                  currency: 'USD' as const,
                  inputPerMillionTokens: 0,
                  outputPerMillionTokens: 0,
                  note: 'Preview local.',
                },
              },
            ]
          : [],
    }),
    models: async () => [],
  },
  chat: {
    start: ({ input }: { providerId: string; input: AgentInput }) => {
      const words = 'Conexão simulada: configure um provider para usar respostas reais.'.split(
        /(?<=\s)/,
      );
      words.forEach((text, index) =>
        setTimeout(() => {
          for (const listener of listeners)
            listener({ type: 'text', requestId: input.requestId, text });
          if (index === words.length - 1) {
            for (const listener of listeners)
              listener({ type: 'done', requestId: input.requestId });
          }
        }, index * 20),
      );
    },
    cancel: async () => undefined,
    onChunk: (listener: (chunk: AgentChunk) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  },
};

export const providerApi = window.visualnscode
  ? { providers: window.visualnscode.providers, chat: window.visualnscode.chat }
  : fallback;
