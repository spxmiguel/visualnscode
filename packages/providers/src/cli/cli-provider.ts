import * as pty from 'node-pty';
import { BaseProvider } from '../base-provider';
import {
  estimateTokenUsage,
  type AgentChunk,
  type AgentInput,
  type AIModel,
  type ProviderDescriptor,
} from '../types';

const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
const stripAnsi = (value: string): string => value.replace(ansiPattern, '');

const safeEnvironment = (): Record<string, string> =>
  Object.fromEntries(
    ['HOME', 'LANG', 'LC_ALL', 'PATH', 'SHELL', 'TERM', 'TMPDIR', 'USER']
      .map((key) => [key, process.env[key]])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

export abstract class CliProvider extends BaseProvider {
  readonly id: string;
  readonly name: string;
  readonly type;
  readonly capabilities;
  readonly execution;
  private readonly terminals = new Map<string, pty.IPty>();

  constructor(
    descriptor: ProviderDescriptor,
    protected readonly command: string,
  ) {
    super();
    this.id = descriptor.id;
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.capabilities = descriptor.capabilities;
    this.execution = descriptor.execution;
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      let terminal: pty.IPty;
      try {
        terminal = pty.spawn(this.command, ['--version'], {
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
          env: safeEnvironment(),
        });
      } catch {
        resolve(false);
        return;
      }
      const timeout = setTimeout(() => {
        terminal.kill();
        resolve(false);
      }, 2500);
      terminal.onExit(({ exitCode }) => {
        clearTimeout(timeout);
        resolve(exitCode === 0);
      });
    });
  }

  async listModels(): Promise<readonly AIModel[]> {
    return [
      {
        id: 'default',
        name: 'Modelo configurado na CLI',
        providerId: this.id,
        capabilities: this.capabilities,
        execution: 'local',
        contextWindow: null,
        cost: {
          currency: 'USD',
          inputPerMillionTokens: null,
          outputPerMillionTokens: null,
          note: 'Custo administrado pela própria CLI.',
        },
      },
    ];
  }

  async *streamMessage(input: AgentInput): AsyncIterable<AgentChunk> {
    const prompt = this.inputText(input);
    const queue: AgentChunk[] = [];
    let finished = false;
    let wake: (() => void) | null = null;
    let output = '';
    const push = (chunk: AgentChunk): void => {
      queue.push(chunk);
      wake?.();
      wake = null;
    };

    try {
      const terminal = pty.spawn(this.command, [...this.buildArguments(prompt, input)], {
        cols: 120,
        rows: 40,
        cwd: process.cwd(),
        env: safeEnvironment(),
      });
      this.terminals.set(input.requestId, terminal);
      const timeout = setTimeout(() => terminal.kill(), input.timeoutMs ?? 60_000);
      terminal.onData((data) => {
        const text = stripAnsi(data).replace(/\r/g, '');
        if (!text) return;
        output += text;
        push({ type: 'text', requestId: input.requestId, text });
      });
      terminal.onExit(({ exitCode }) => {
        clearTimeout(timeout);
        if (exitCode !== 0 && output.trim().length === 0) {
          push({
            type: 'error',
            requestId: input.requestId,
            message: `${this.name} encerrou com código ${exitCode}. Verifique a autenticação da CLI.`,
          });
        } else {
          push({
            type: 'usage',
            requestId: input.requestId,
            usage: estimateTokenUsage(prompt, output),
          });
          push({ type: 'done', requestId: input.requestId });
        }
        finished = true;
        wake?.();
      });
    } catch {
      yield {
        type: 'error',
        requestId: input.requestId,
        message: `${this.name} não foi encontrado no PATH.`,
      };
      return;
    }

    while (!finished || queue.length > 0) {
      if (queue.length === 0) await new Promise<void>((resolve) => (wake = resolve));
      const chunk = queue.shift();
      if (chunk) yield chunk;
    }
    this.terminals.delete(input.requestId);
  }

  override async cancel(requestId: string): Promise<void> {
    this.terminals.get(requestId)?.kill();
    this.terminals.delete(requestId);
  }

  protected abstract buildArguments(prompt: string, input: AgentInput): readonly string[];
}
