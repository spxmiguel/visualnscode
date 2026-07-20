import { AnthropicProvider } from './anthropic-provider';
import { AiderProvider } from './cli/aider-provider';
import { ClaudeCodeProvider } from './cli/claude-code-provider';
import { CodexCliProvider } from './cli/codex-cli-provider';
import { GeminiCliProvider } from './cli/gemini-cli-provider';
import { OpenCodeProvider } from './cli/opencode-provider';
import { GeminiProvider } from './gemini-provider';
import { OpenAICompatibleProvider } from './openai-compatible-provider';
import type { AIProvider, ProviderDescriptor, ProviderSettings } from './types';

export interface ProviderRuntimeOptions {
  readonly workingDirectory?: string;
}

export const createProvider = (
  descriptor: ProviderDescriptor,
  settings: ProviderSettings,
  secret: string | null,
  options: ProviderRuntimeOptions = {},
): AIProvider => {
  if (descriptor.id === 'anthropic') {
    return new AnthropicProvider(descriptor, secret ?? '', settings.baseUrl);
  }
  if (descriptor.id === 'gemini') {
    return new GeminiProvider(descriptor, secret ?? '', settings.baseUrl);
  }
  if (descriptor.id === 'claude-cli') return new ClaudeCodeProvider(descriptor, options);
  if (descriptor.id === 'codex-cli') return new CodexCliProvider(descriptor, options);
  if (descriptor.id === 'gemini-cli') return new GeminiCliProvider(descriptor, options);
  if (descriptor.id === 'aider') return new AiderProvider(descriptor, options);
  if (descriptor.id === 'opencode') return new OpenCodeProvider(descriptor, options);

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
