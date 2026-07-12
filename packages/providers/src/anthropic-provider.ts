import { BaseProvider } from './base-provider';
import { ensureSafeBaseUrl, friendlyHttpError, streamSse } from './http-utils';
import {
  estimateTokenUsage,
  type AgentChunk,
  type AgentInput,
  type AIModel,
  type ProviderDescriptor,
} from './types';

export class AnthropicProvider extends BaseProvider {
  readonly id: string;
  readonly name: string;
  readonly type;
  readonly capabilities;
  readonly execution;
  private readonly baseUrl: string;

  constructor(
    descriptor: ProviderDescriptor,
    private readonly apiKey: string,
    baseUrl: string,
  ) {
    super();
    this.id = descriptor.id;
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.capabilities = descriptor.capabilities;
    this.execution = descriptor.execution;
    this.baseUrl = ensureSafeBaseUrl(baseUrl);
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<readonly AIModel[]> {
    const response = await fetch(`${this.baseUrl}/v1/models`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw await friendlyHttpError(response);
    const body = (await response.json()) as {
      data?: readonly { id: string; display_name?: string }[];
    };
    return (body.data ?? []).map((model) => ({
      id: model.id,
      name: model.display_name ?? model.id,
      providerId: this.id,
      capabilities: this.capabilities,
      execution: this.execution,
      contextWindow: null,
      cost: {
        currency: 'USD',
        inputPerMillionTokens: null,
        outputPerMillionTokens: null,
        note: 'Consulte a tabela atual do provider.',
      },
    }));
  }

  async *streamMessage(input: AgentInput): AsyncIterable<AgentChunk> {
    const controller = this.createController(input);
    let output = '';
    try {
      const system = input.messages
        .filter((message) => message.role === 'system')
        .map((message) => message.content)
        .join('\n');
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: { ...this.headers(), 'content-type': 'application/json' },
        body: JSON.stringify({
          model: input.model,
          max_tokens: input.maxTokens ?? 4096,
          stream: true,
          system: [system, this.inputText({ ...input, messages: [] })].filter(Boolean).join('\n'),
          messages: input.messages
            .filter((message) => message.role !== 'system')
            .map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw await friendlyHttpError(response);
      for await (const data of streamSse(response)) {
        const event = JSON.parse(data) as {
          type?: string;
          delta?: { type?: string; text?: string };
          usage?: { input_tokens?: number; output_tokens?: number };
        };
        const text = event.type === 'content_block_delta' ? (event.delta?.text ?? '') : '';
        if (text) {
          output += text;
          yield { type: 'text', requestId: input.requestId, text };
        }
      }
      yield {
        type: 'usage',
        requestId: input.requestId,
        usage: estimateTokenUsage(this.inputText(input), output),
      };
      yield { type: 'done', requestId: input.requestId };
    } catch (error) {
      yield {
        type: 'error',
        requestId: input.requestId,
        message: controller.signal.aborted
          ? 'Solicitação cancelada.'
          : error instanceof Error
            ? error.message
            : 'Falha ao consultar a Anthropic.',
      };
    } finally {
      this.requests.delete(input.requestId);
    }
  }

  private headers(): Record<string, string> {
    return { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' };
  }
}
