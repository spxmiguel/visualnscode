import type { TokenUsage } from '../types';

type JsonObject = Record<string, unknown>;

const objectValue = (value: unknown): JsonObject | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;

const stringValue = (value: unknown): string => (typeof value === 'string' ? value : '');

const numberValue = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const contentText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return '';
  return value
    .map((entry) => {
      const item = objectValue(entry);
      return item?.type === 'text' ? stringValue(item.text) : '';
    })
    .join('');
};

const usageFromCounts = (inputTokens: number, outputTokens: number): TokenUsage | null => {
  if (inputTokens <= 0 && outputTokens <= 0) return null;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimated: false,
    estimatedCostUsd: null,
  };
};

export class CliOutputDecoder {
  private buffer = '';
  private sawIncrementalText = false;
  private measuredUsage: TokenUsage | null = null;
  private failure: string | null = null;

  constructor(private readonly providerId: string) {}

  push(data: string): readonly string[] {
    this.buffer += data.replace(/\r/g, '');
    if (this.providerId === 'gemini-cli') return [];
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';
    return lines.flatMap((line) => this.decodeLine(line));
  }

  flush(): readonly string[] {
    const remainder = this.buffer.trim();
    this.buffer = '';
    if (!remainder) return [];
    if (this.providerId === 'gemini-cli') return this.decodeJsonDocument(remainder);
    return this.decodeLine(remainder);
  }

  usage(): TokenUsage | null {
    return this.measuredUsage;
  }

  error(): string | null {
    return this.failure;
  }

  private decodeLine(line: string): readonly string[] {
    if (!line.trim()) return [];
    if (!['claude-cli', 'codex-cli', 'opencode'].includes(this.providerId)) return [line + '\n'];
    try {
      return this.decodeEvent(JSON.parse(line) as unknown);
    } catch {
      return [line + '\n'];
    }
  }

  private decodeJsonDocument(document: string): readonly string[] {
    try {
      return this.decodeEvent(JSON.parse(document) as unknown);
    } catch {
      return [document];
    }
  }

  private decodeEvent(value: unknown): readonly string[] {
    const event = objectValue(value);
    if (!event) return [];
    if (this.providerId === 'claude-cli') return this.decodeClaude(event);
    if (this.providerId === 'codex-cli') return this.decodeCodex(event);
    if (this.providerId === 'gemini-cli') return this.decodeGemini(event);
    if (this.providerId === 'opencode') return this.decodeOpenCode(event);
    return [];
  }

  private decodeClaude(event: JsonObject): readonly string[] {
    if (event.type === 'stream_event') {
      const streamEvent = objectValue(event.event);
      const delta = objectValue(streamEvent?.delta);
      const text = stringValue(delta?.text);
      if (text) this.sawIncrementalText = true;
      return text ? [text] : [];
    }
    if (event.type === 'assistant' && !this.sawIncrementalText) {
      const message = objectValue(event.message);
      const text = contentText(message?.content);
      if (text) this.sawIncrementalText = true;
      return text ? [text] : [];
    }
    if (event.type === 'result') {
      const usage = objectValue(event.usage);
      this.measuredUsage = usageFromCounts(
        numberValue(usage?.input_tokens),
        numberValue(usage?.output_tokens),
      );
      if (event.is_error === true)
        this.failure = stringValue(event.result) || 'Claude Code falhou.';
      const result = stringValue(event.result);
      return !this.sawIncrementalText && result ? [result] : [];
    }
    return [];
  }

  private decodeCodex(event: JsonObject): readonly string[] {
    if (event.type === 'item.completed') {
      const item = objectValue(event.item);
      const text = item?.type === 'agent_message' ? stringValue(item.text) : '';
      return text ? [text] : [];
    }
    if (event.type === 'turn.completed') {
      const usage = objectValue(event.usage);
      this.measuredUsage = usageFromCounts(
        numberValue(usage?.input_tokens),
        numberValue(usage?.output_tokens),
      );
    }
    if (event.type === 'turn.failed' || event.type === 'error') {
      const nested = objectValue(event.error);
      this.failure =
        stringValue(event.message) || stringValue(nested?.message) || 'O Codex CLI falhou.';
    }
    return [];
  }

  private decodeGemini(event: JsonObject): readonly string[] {
    const error = objectValue(event.error);
    if (error) this.failure = stringValue(error.message) || 'O Gemini CLI falhou.';
    const models = objectValue(objectValue(event.stats)?.models);
    let inputTokens = 0;
    let outputTokens = 0;
    for (const model of Object.values(models ?? {})) {
      const tokens = objectValue(objectValue(model)?.tokens);
      inputTokens += numberValue(tokens?.prompt);
      outputTokens += numberValue(tokens?.candidates);
    }
    this.measuredUsage = usageFromCounts(inputTokens, outputTokens);
    const response = stringValue(event.response);
    return response ? [response] : [];
  }

  private decodeOpenCode(event: JsonObject): readonly string[] {
    const part = objectValue(event.part);
    const text = part?.type === 'text' ? stringValue(part.text) : '';
    if (text) return [text];
    if (event.type === 'error') {
      const nested = objectValue(event.error);
      this.failure =
        stringValue(event.message) || stringValue(nested?.message) || 'OpenCode falhou.';
    }
    return [];
  }
}
