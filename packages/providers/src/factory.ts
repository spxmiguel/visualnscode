import { AnthropicProvider } from './anthropic-provider';
import { AiderProvider } from './cli/aider-provider';
import { ClaudeCodeProvider } from './cli/claude-code-provider';
import { CodexCliProvider } from './cli/codex-cli-provider';
import { GeminiCliProvider } from './cli/gemini-cli-provider';
import { OpenCodeProvider } from './cli/opencode-provider';
import { GeminiProvider } from './gemini-provider';
import { OpenAICompatibleProvider } from './openai-compatible-provider';
import type { AIProvider, ProviderDescriptor, ProviderSettings } from './types';

export const createProvider = (
  descriptor: ProviderDescriptor,
  settings: ProviderSettings,
  secret: string | null,
): AIProvider => {
  if (descriptor.id === 'anthropic') {
    return new AnthropicProvider(descriptor, secret ?? '', settings.baseUrl);
  }
  if (descriptor.id === 'gemini') {
    return new GeminiProvider(descriptor, secret ?? '', settings.baseUrl);
  }
  if (descriptor.id === 'claude-cli') return new ClaudeCodeProvider(descriptor);
  if (descriptor.id === 'codex-cli') return new CodexCliProvider(descriptor);
  if (descriptor.id === 'gemini-cli') return new GeminiCliProvider(descriptor);
  if (descriptor.id === 'aider') return new AiderProvider(descriptor);
  if (descriptor.id === 'opencode') return new OpenCodeProvider(descriptor);

  return new OpenAICompatibleProvider({
    descriptor,
    baseUrl: settings.baseUrl,
    apiKey: secret,
    ...(descriptor.id === 'openrouter'
      ? {
          extraHeaders: {
            'HTTP-Referer': 'https://github.com/spxmiguel/visualnscode',
            'X-Title': 'VisualnsCode',
          },
        }
      : {}),
  });
};
