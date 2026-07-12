import { BaseProvider } from './base-provider';
import {
  estimateTokenUsage,
  type AgentChunk,
  type AgentInput,
  type AIModel,
  type ProviderCapabilities,
} from './types';

export class FakeProvider extends BaseProvider {
  readonly id = 'fake';
  readonly name = 'Provider falso';
  readonly type = 'local' as const;
  readonly execution = 'local' as const;
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    tools: true,
    vision: false,
    fileEditing: false,
    longContext: true,
  };

  constructor(private readonly response = 'Resposta simulada do VisualnsCode.') {
    super();
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async listModels(): Promise<readonly AIModel[]> {
    return [
      {
        id: 'fake-model',
        name: 'Fake Model',
        providerId: this.id,
        capabilities: this.capabilities,
        execution: this.execution,
        contextWindow: 8192,
        cost: {
          currency: 'USD',
          inputPerMillionTokens: 0,
          outputPerMillionTokens: 0,
          note: 'Somente testes.',
        },
      },
    ];
  }

  async *streamMessage(input: AgentInput): AsyncIterable<AgentChunk> {
    const controller = this.createController(input);
    const pieces = this.response.split(/(?<=\s)/);
    let output = '';
    for (const text of pieces) {
      if (controller.signal.aborted) {
        yield { type: 'error', requestId: input.requestId, message: 'Solicitação cancelada.' };
        return;
      }
      output += text;
      yield { type: 'text', requestId: input.requestId, text };
      await Promise.resolve();
    }
    yield {
      type: 'usage',
      requestId: input.requestId,
      usage: estimateTokenUsage(this.inputText(input), output),
    };
    yield { type: 'done', requestId: input.requestId };
    this.requests.delete(input.requestId);
  }
}
