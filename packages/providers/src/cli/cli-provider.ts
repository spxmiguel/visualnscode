import * as pty from 'node-pty';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { BaseProvider } from '../base-provider';
import {
  estimateTokenUsage,
  type AgentChunk,
  type AgentInput,
  type AIModel,
  type ProviderDescriptor,
} from '../types';
import { CliOutputDecoder } from './cli-output';
import { cliEnvironment, resolveCliExecutable } from './cli-runtime';

const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
const stripAnsi = (value: string): string => value.replace(ansiPattern, '');
const execFileAsync = promisify(execFile);

export interface CliProviderOptions {
  readonly workingDirectory?: string;
}

export abstract class CliProvider extends BaseProvider {
  readonly id: string;
  readonly name: string;
  readonly type;
  readonly capabilities;
  readonly execution;
  private readonly terminals = new Map<string, { terminal: pty.IPty; cancelled: boolean }>();

  constructor(
    descriptor: ProviderDescriptor,
    protected readonly command: string,
    private readonly options: CliProviderOptions = {},
  ) {
    super();
    this.id = descriptor.id;
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.capabilities = descriptor.capabilities;
    this.execution = descriptor.execution;
  }

  async isAvailable(): Promise<boolean> {
    const executable = resolveCliExecutable(this.command);
    if (!executable) return false;
    try {
      await execFileAsync(executable, ['--version'], {
        cwd: this.options.workingDirectory ?? process.cwd(),
        env: cliEnvironment(executable),
        timeout: 4000,
        windowsHide: true,
      });
      return true;
    } catch {
      return false;
    }
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
    const executable = resolveCliExecutable(this.command);
    if (!executable) {
      yield {
        type: 'error',
        requestId: input.requestId,
        message: `${this.name} não está instalado ou não foi encontrado nos locais conhecidos.`,
      };
      return;
    }
    const queue: AgentChunk[] = [];
    let finished = false;
    let wake: (() => void) | null = null;
    let output = '';
    let timedOut = false;
    const decoder = new CliOutputDecoder(this.id);
    const push = (chunk: AgentChunk): void => {
      queue.push(chunk);
      wake?.();
      wake = null;
    };

    try {
      const terminal = pty.spawn(executable, [...this.buildArguments(prompt, input)], {
        cols: 120,
        rows: 40,
        cwd: this.options.workingDirectory ?? process.cwd(),
        env: cliEnvironment(executable),
      });
      const session = { terminal, cancelled: false };
      this.terminals.set(input.requestId, session);
      const timeout = setTimeout(() => {
        timedOut = true;
        terminal.kill();
      }, input.timeoutMs ?? 60_000);
      terminal.onData((data) => {
        const clean = stripAnsi(data);
        for (const text of decoder.push(clean)) {
          output += text;
          push({ type: 'text', requestId: input.requestId, text });
        }
      });
      terminal.onExit(({ exitCode }) => {
        clearTimeout(timeout);
        for (const text of decoder.flush()) {
          output += text;
          push({ type: 'text', requestId: input.requestId, text });
        }
        const cliError = decoder.error();
        if (timedOut) {
          push({
            type: 'error',
            requestId: input.requestId,
            message: `${this.name} ultrapassou o tempo limite configurado.`,
          });
        } else if (cliError) {
          push({ type: 'error', requestId: input.requestId, message: cliError });
        } else if (exitCode !== 0 && !session.cancelled) {
          push({
            type: 'error',
            requestId: input.requestId,
            message: `${this.name} encerrou com código ${exitCode}. Confira o login e a configuração da CLI.`,
          });
        } else if (!session.cancelled) {
          push({
            type: 'usage',
            requestId: input.requestId,
            usage: decoder.usage() ?? estimateTokenUsage(prompt, output),
          });
          push({ type: 'done', requestId: input.requestId });
        }
        finished = true;
        wake?.();
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'erro nativo desconhecido';
      yield {
        type: 'error',
        requestId: input.requestId,
        message: `${this.name} foi encontrado em ${executable}, mas não pôde ser iniciado (${detail}). Reinstale as dependências do VisualnsCode para reparar o terminal integrado.`,
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
    const session = this.terminals.get(requestId);
    if (session) {
      session.cancelled = true;
      session.terminal.kill();
    }
    this.terminals.delete(requestId);
  }

  protected abstract buildArguments(prompt: string, input: AgentInput): readonly string[];
}
