import type { ProviderCapabilities, ProviderDescriptor, ProviderSettings } from './types';

const capabilities = (overrides: Partial<ProviderCapabilities> = {}): ProviderCapabilities => ({
  streaming: true,
  tools: false,
  vision: false,
  fileEditing: false,
  longContext: false,
  ...overrides,
});

export const providerCatalog: readonly ProviderDescriptor[] = [
  {
    id: 'openai',
    name: 'OpenAI API',
    type: 'api',
    execution: 'remote',
    capabilities: capabilities({ tools: true, vision: true, longContext: true }),
    requiresSecret: true,
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: '',
  },
  {
    id: 'anthropic',
    name: 'Anthropic API',
    type: 'api',
    execution: 'remote',
    capabilities: capabilities({ tools: true, vision: true, longContext: true }),
    requiresSecret: true,
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: '',
  },
  {
    id: 'gemini',
    name: 'Google Gemini API',
    type: 'api',
    execution: 'remote',
    capabilities: capabilities({ tools: true, vision: true, longContext: true }),
    requiresSecret: true,
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: '',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'api',
    execution: 'remote',
    capabilities: capabilities({ tools: true, vision: true, longContext: true }),
    requiresSecret: true,
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: '',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    type: 'local',
    execution: 'local',
    capabilities: capabilities({ tools: true, vision: true }),
    requiresSecret: false,
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    defaultModel: '',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    type: 'local',
    execution: 'local',
    capabilities: capabilities(),
    requiresSecret: false,
    defaultBaseUrl: 'http://127.0.0.1:1234/v1',
    defaultModel: '',
  },
  {
    id: 'openai-compatible',
    name: 'Endpoint compatível com OpenAI',
    type: 'api',
    execution: 'remote',
    capabilities: capabilities({ tools: true, vision: true, longContext: true }),
    requiresSecret: false,
    defaultBaseUrl: '',
    defaultModel: '',
  },
  ...(
    [
      ['claude-cli', 'Claude Code CLI'],
      ['codex-cli', 'Codex CLI'],
      ['gemini-cli', 'Gemini CLI'],
      ['aider', 'Aider'],
      ['opencode', 'OpenCode'],
    ] as const
  ).map(([id, name]) => ({
    id,
    name,
    type: 'cli' as const,
    execution: 'local' as const,
    capabilities: capabilities({
      tools: true,
      fileEditing: true,
      longContext: true,
    }),
    requiresSecret: false,
    defaultBaseUrl: '',
    defaultModel: 'default',
  })),
];

export const defaultProviderSettings = (descriptor: ProviderDescriptor): ProviderSettings => ({
  providerId: descriptor.id,
  enabled: false,
  defaultModel: descriptor.defaultModel,
  alias: '',
  baseUrl: descriptor.defaultBaseUrl,
  costLimitUsd: null,
  tokenLimit: 4096,
  timeoutMs: 60_000,
  concurrency: 1,
});

export const getProviderDescriptor = (id: string): ProviderDescriptor | undefined =>
  providerCatalog.find((provider) => provider.id === id);
