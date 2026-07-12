import { BaseProvider } from './base-provider';
import { ensureSafeBaseUrl, friendlyHttpError, streamSse } from './http-utils';
import {
  estimateTokenUsage,
  type AgentChunk,
  type AgentInput,
  type AIModel,
  type ProviderDescriptor,
} from './types';

export class GeminiProvider extends BaseProvider {
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
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw await friendlyHttpError(response);
    const body = (await response.json()) as {
      models?: readonly { name: string; displayName?: string; inputTokenLimit?: number }[];
    };
    return (body.models ?? []).map((model) => ({
      id: model.name.replace(/^models\//, ''),
      name: model.displayName ?? model.name,
      providerId: this.id,
      capabilities: this.capabilities,
      execution: this.execution,
      contextWindow: model.inputTokenLimit ?? null,
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
      const response = await fetch(
        `${this.baseUrl}/models/${encodeURIComponent(input.model)}:streamGenerateContent?alt=sse`,
        {
          method: 'POST',
          headers: { ...this.headers(), 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: input.messages
              .filter((message) => message.role !== 'system')
              .map(({ role, content }) => ({
                role: role === 'assistant' ? 'model' : 'user',
                parts: [{ text: content }],
              })),
            systemInstruction: {
              parts: [
                {
                  text: [
                    ...input.messages
                      .filter((message) => message.role === 'system')
                      .map((message) => message.content),
                    this.inputText({ ...input, messages: [] }),
                  ]
                    .filter(Boolean)
                    .join('\n'),
                },
              ],
            },
            generationConfig: { maxOutputTokens: input.maxTokens ?? 4096 },
          }),
          signal: controller.signal,
        },
      );
      if (!response.ok) throw await friendlyHttpError(response);
      for await (const data of streamSse(response)) {
        const event = JSON.parse(data) as {
          candidates?: readonly { content?: { parts?: readonly { text?: string }[] } }[];
        };
        const text =
          event.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
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
            : 'Falha ao consultar o Gemini.',
      };
    } finally {
      this.requests.delete(input.requestId);
    }
  }

  private headers(): Record<string, string> {
    return { 'x-goog-api-key': this.apiKey };
  }
}
