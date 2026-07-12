import {
  estimateTokenUsage,
  type AgentChunk,
  type AgentInput,
  type AgentResponse,
  type AIModel,
  type AIProvider,
  type ProviderCapabilities,
  type ProviderType,
  type ExecutionLocation,
} from './types';

export abstract class BaseProvider implements AIProvider {
  protected readonly requests = new Map<string, AbortController>();

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: ProviderType;
  abstract readonly capabilities: ProviderCapabilities;
  abstract readonly execution: ExecutionLocation;
  abstract isAvailable(): Promise<boolean>;
  abstract listModels(): Promise<readonly AIModel[]>;
  abstract streamMessage(input: AgentInput): AsyncIterable<AgentChunk>;

  async sendMessage(input: AgentInput): Promise<AgentResponse> {
    let content = '';
    let usage = estimateTokenUsage(this.inputText(input), '');
    for await (const chunk of this.streamMessage(input)) {
      if (chunk.type === 'text') content += chunk.text;
      if (chunk.type === 'usage') usage = chunk.usage;
      if (chunk.type === 'error') throw new Error(chunk.message);
    }
    if (usage.outputTokens <= 1) usage = estimateTokenUsage(this.inputText(input), content);
    return { requestId: input.requestId, content, usage };
  }

  async cancel(requestId: string): Promise<void> {
    this.requests.get(requestId)?.abort();
    this.requests.delete(requestId);
  }

  protected createController(input: AgentInput): AbortController {
    const controller = new AbortController();
    this.requests.set(input.requestId, controller);
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 60_000);
    controller.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });
    return controller;
  }

  protected inputText(input: AgentInput): string {
    const files = (input.contextFiles ?? [])
      .map((file) => `\nArquivo: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``)
      .join('\n');
    return `${input.messages.map((message) => `${message.role}: ${message.content}`).join('\n')}${files}`;
  }
}
