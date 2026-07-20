import { SystemCommandRunner, type CommandRunner } from '@visualnscode/integrations';
import { classifyCommand, redactContent } from './secret-scanner';

export interface AgentCommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface AgentCommandRunner {
  run(command: string, workspacePath: string, timeoutMs: number): Promise<AgentCommandResult>;
}

const ALLOWED_EXECUTABLES = new Set([
  'bun',
  'eslint',
  'git',
  'npm',
  'pnpm',
  'prettier',
  'pytest',
  'tsc',
  'vitest',
  'yarn',
]);

const FORBIDDEN_SHELL_SYNTAX = /[\r\n;&|`$<>]/u;
const OUTSIDE_WORKSPACE_ARGUMENT =
  /^(?:~(?:[\\/]|$)|[a-z]:[\\/]|[\\/])|(?:^|[\\/])\.\.(?:[\\/]|$)/iu;
const OUTSIDE_WORKSPACE_FLAGS = new Set([
  '-c',
  '--cwd',
  '--dir',
  '--global',
  '--git-dir',
  '--prefix',
  '--work-tree',
  '-g',
]);

export const parseAgentCommand = (command: string): readonly string[] => {
  if (!command.trim() || FORBIDDEN_SHELL_SYNTAX.test(command)) {
    throw new Error('O comando contém sintaxe de shell não permitida para agentes.');
  }
  const tokens: string[] = [];
  let current = '';
  let quote: 'single' | 'double' | null = null;
  let escaping = false;
  const push = (): void => {
    if (current) tokens.push(current);
    current = '';
  };

  for (const character of command.trim()) {
    if (escaping) {
      current += character;
      escaping = false;
      continue;
    }
    if (character === '\\' && quote !== 'single') {
      escaping = true;
      continue;
    }
    if (character === "'" && quote !== 'double') {
      quote = quote === 'single' ? null : 'single';
      continue;
    }
    if (character === '"' && quote !== 'single') {
      quote = quote === 'double' ? null : 'double';
      continue;
    }
    if (/\s/u.test(character) && quote === null) {
      push();
      continue;
    }
    current += character;
  }
  if (escaping || quote !== null) throw new Error('O comando contém aspas ou escape incompleto.');
  push();
  return tokens;
};

const validateCommand = (tokens: readonly string[]): void => {
  const [executable, ...args] = tokens;
  const normalizedExecutable = executable?.toLowerCase().replace(/\.(?:cmd|exe)$/u, '') ?? '';
  if (!ALLOWED_EXECUTABLES.has(normalizedExecutable)) {
    throw new Error(`Executável não permitido para agentes: ${executable || 'vazio'}.`);
  }
  if (args.some((argument) => OUTSIDE_WORKSPACE_ARGUMENT.test(argument))) {
    throw new Error('Argumento fora do workspace bloqueado.');
  }
  if (args.some((argument) => OUTSIDE_WORKSPACE_FLAGS.has(argument.toLowerCase()))) {
    throw new Error('O comando tenta alterar o diretório de trabalho permitido.');
  }
  if (
    ['npm', 'pnpm', 'yarn', 'bun'].includes(normalizedExecutable) &&
    args.some((argument) => ['dlx', 'exec', 'x'].includes(argument.toLowerCase()))
  ) {
    throw new Error('Execução arbitrária por gerenciador de pacotes bloqueada.');
  }
};

export class SystemAgentCommandRunner implements AgentCommandRunner {
  constructor(private readonly runner: CommandRunner = new SystemCommandRunner()) {}

  async run(
    command: string,
    workspacePath: string,
    timeoutMs: number,
  ): Promise<AgentCommandResult> {
    if (classifyCommand(command) === 'blocked') {
      throw new Error('O comando foi bloqueado pela política global de segurança.');
    }
    const tokens = parseAgentCommand(command);
    validateCommand(tokens);
    const [executable, ...args] = tokens;
    const result = await this.runner.run({
      executable: executable!,
      args,
      cwd: workspacePath,
      permission: 'execute-safe',
      risk: 'write',
      description: 'Comando aprovado de agente',
      timeoutMs: Math.max(1000, Math.min(timeoutMs, 120_000)),
    });
    return {
      exitCode: result.exitCode,
      stdout: redactContent(result.stdout).slice(0, 64_000),
      stderr: redactContent(result.stderr).slice(0, 64_000),
    };
  }
}
