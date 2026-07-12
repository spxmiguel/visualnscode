export type ProviderType = 'api' | 'local' | 'cli';
export type ExecutionLocation = 'local' | 'remote';

export interface ProviderCapabilities {
  readonly streaming: boolean;
  readonly tools: boolean;
  readonly vision: boolean;
  readonly fileEditing: boolean;
  readonly longContext: boolean;
}

export interface ModelCostEstimate {
  readonly currency: 'USD';
  readonly inputPerMillionTokens: number | null;
  readonly outputPerMillionTokens: number | null;
  readonly note: string;
}

export interface AIModel {
  readonly id: string;
  readonly name: string;
  readonly providerId: string;
  readonly capabilities: ProviderCapabilities;
  readonly cost: ModelCostEstimate;
  readonly execution: ExecutionLocation;
  readonly contextWindow: number | null;
}

export interface AgentMessage {
  readonly id: string;
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface AgentContextFile {
  readonly path: string;
  readonly content: string;
}

export interface AgentInput {
  readonly requestId: string;
  readonly model: string;
  readonly messages: readonly AgentMessage[];
  readonly contextFiles?: readonly AgentContextFile[];
  readonly maxTokens?: number;
  readonly timeoutMs?: number;
}

export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  readonly estimated: boolean;
  readonly estimatedCostUsd: number | null;
}

export type AgentChunk =
  | { readonly type: 'text'; readonly requestId: string; readonly text: string }
  | { readonly type: 'usage'; readonly requestId: string; readonly usage: TokenUsage }
  | { readonly type: 'done'; readonly requestId: string }
  | { readonly type: 'error'; readonly requestId: string; readonly message: string };

export interface AgentResponse {
  readonly requestId: string;
  readonly content: string;
  readonly usage: TokenUsage;
}

export interface ProviderSettings {
  readonly providerId: string;
  readonly enabled: boolean;
  readonly defaultModel: string;
  readonly alias: string;
  readonly baseUrl: string;
  readonly costLimitUsd: number | null;
  readonly tokenLimit: number;
  readonly timeoutMs: number;
  readonly concurrency: number;
}

export interface ProviderDescriptor {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;
  readonly execution: ExecutionLocation;
  readonly capabilities: ProviderCapabilities;
  readonly requiresSecret: boolean;
  readonly defaultBaseUrl: string;
  readonly defaultModel: string;
}

export interface ProviderSummary extends ProviderDescriptor {
  readonly available: boolean;
  readonly configured: boolean;
  readonly settings: ProviderSettings;
}

export interface ProviderConnectionResult {
  readonly ok: boolean;
  readonly message: string;
  readonly models: readonly AIModel[];
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;
  readonly capabilities: ProviderCapabilities;
  readonly execution: ExecutionLocation;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<readonly AIModel[]>;
  sendMessage(input: AgentInput): Promise<AgentResponse>;
  streamMessage(input: AgentInput): AsyncIterable<AgentChunk>;
  cancel(requestId: string): Promise<void>;
}

export const estimateTokenUsage = (input: string, output: string): TokenUsage => {
  const inputTokens = Math.max(1, Math.ceil(input.length / 4));
  const outputTokens = Math.max(1, Math.ceil(output.length / 4));
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimated: true,
    estimatedCostUsd: null,
  };
};
