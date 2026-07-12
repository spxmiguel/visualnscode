import type { AgentExecutionResult, AgentExecutor, AgentExecutorInput } from './types';

export interface FakeExecutorOptions {
  readonly delayMs?: number;
  readonly failAgentId?: string;
  readonly failAttempts?: number;
}

export class FakeAgentExecutor implements AgentExecutor {
  readonly contexts: AgentExecutorInput[] = [];
  readonly rolledBack: string[][] = [];
  maxConcurrent = 0;
  private concurrent = 0;

  constructor(private readonly options: FakeExecutorOptions = {}) {}

  async execute(input: AgentExecutorInput): Promise<AgentExecutionResult> {
    this.contexts.push(input);
    this.concurrent += 1;
    this.maxConcurrent = Math.max(this.maxConcurrent, this.concurrent);
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, this.options.delayMs ?? 0);
        const abort = () => {
          clearTimeout(timeout);
          reject(new Error('Execução falsa cancelada.'));
        };
        input.signal.addEventListener('abort', abort, { once: true });
      });
      if (
        input.agent.id === this.options.failAgentId &&
        input.attempt <= (this.options.failAttempts ?? Number.POSITIVE_INFINITY)
      ) {
        throw new Error(`Falha simulada em ${input.agent.name}.`);
      }
      return {
        output: `${input.agent.name}: resultado para ${input.context.originalTask}`,
        filesRead: Object.keys(input.context.relevantContext),
        filesChanged: input.agent.editPermission === 'none' ? [] : [`src/${input.agent.id}.ts`],
        commands: input.agent.terminalPermission === 'none' ? [] : ['pnpm test'],
        actions: [],
        errors: [],
        costUsd: 0.05,
        steps: 1,
        logs: [`${input.agent.name} concluiu a tentativa ${input.attempt}.`],
      };
    } finally {
      this.concurrent -= 1;
    }
  }

  async rollback(_runId: string, files: readonly string[]): Promise<void> {
    this.rolledBack.push([...files]);
  }
}
