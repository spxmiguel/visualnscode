import { BaseProvider } from './base-provider';
import { friendlyHttpError, ensureSafeBaseUrl, streamSse } from './http-utils';
import {
  estimateTokenUsage,
  type AgentChunk,
  type AgentInput,
  type AIModel,
  type ProviderDescriptor,
} from './types';

interface OpenAIProviderOptions {
  readonly descriptor: ProviderDescriptor;
  readonly baseUrl: string;
  readonly apiKey?: string | null;
  readonly extraHeaders?: Readonly<Record<string, string>>;
}

export class OpenAICompatibleProvider extends BaseProvider {
  readonly id: string;
  readonly name: string;
  readonly type;
  readonly capabilities;
  readonly execution;
  private readonly baseUrl: string;
  private readonly apiKey: string | null;
  private readonly extraHeaders: Readonly<Record<string, string>>;

  constructor(options: OpenAIProviderOptions) {
    super();
    this.id = options.descriptor.id;
    this.name = options.descriptor.name;
    this.type = options.descriptor.type;
    this.capabilities = options.descriptor.capabilities;
    this.execution = options.descriptor.execution;
    this.baseUrl = ensureSafeBaseUrl(options.baseUrl, options.descriptor.execution);
    this.apiKey = options.apiKey ?? null;
    this.extraHeaders = options.extraHeaders ?? {};
  }

  async isAvailable(): Promise<boolean> {
    if (this.type === 'api' && !this.apiKey && this.id !== 'openai-compatible') return false;
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<readonly AIModel[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw await friendlyHttpError(response);
    const payload = (await response.json()) as { data?: readonly { id?: string }[] };
    return (payload.data ?? [])
      .filter((model): model is { id: string } => Boolean(model.id))
      .map((model) => this.toModel(model.id));
  }

  async *streamMessage(input: AgentInput): AsyncIterable<AgentChunk> {
    const controller = this.createController(input);
    let output = '';
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { ...this.headers(), 'content-type': 'application/json' },
        body: JSON.stringify({
          model: input.model,
          messages: [
            ...input.messages.map(({ role, content }) => ({ role, content })),
            ...(input.contextFiles?.length
              ? [{ role: 'system', content: this.inputText({ ...input, messages: [] }) }]
              : []),
          ],
          max_tokens: input.maxTokens,
          stream: true,
          stream_options: { include_usage: true },
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw await friendlyHttpError(response);

      for await (const data of streamSse(response)) {
        if (data === '[DONE]') break;
        const event = JSON.parse(data) as {
          choices?: readonly { delta?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        };
        const text = event.choices?.[0]?.delta?.content ?? '';
        if (text) {
          output += text;
          yield { type: 'text', requestId: input.requestId, text };
        }
        if (event.usage) {
          yield {
            type: 'usage',
            requestId: input.requestId,
            usage: {
              inputTokens: event.usage.prompt_tokens ?? 0,
              outputTokens: event.usage.completion_tokens ?? 0,
              totalTokens: event.usage.total_tokens ?? 0,
              estimated: false,
              estimatedCostUsd: null,
            },
          };
        }
      }
      yield {
        type: 'usage',
        requestId: input.requestId,
        usage: estimateTokenUsage(this.inputText(input), output),
      };
      yield { type: 'done', requestId: input.requestId };
    } catch (error) {
      const message = controller.signal.aborted
        ? 'Solicitação cancelada.'
        : error instanceof Error
          ? error.message
          : 'Falha ao consultar o provider.';
      yield { type: 'error', requestId: input.requestId, message };
    } finally {
      this.requests.delete(input.requestId);
    }
  }

  private headers(): Record<string, string> {
    return {
      ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      ...this.extraHeaders,
    };
  }

  private toModel(id: string): AIModel {
    return {
      id,
      name: id,
      providerId: this.id,
      capabilities: this.capabilities,
      execution: this.execution,
      contextWindow: null,
      cost: {
        currency: 'USD',
        inputPerMillionTokens: this.execution === 'local' ? 0 : null,
        outputPerMillionTokens: this.execution === 'local' ? 0 : null,
        note:
          this.execution === 'local'
            ? 'Execução local; custos de infraestrutura não calculados.'
            : 'Consulte a tabela atual do provider.',
      },
    };
  }
}
