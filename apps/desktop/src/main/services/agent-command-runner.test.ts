// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { CommandResult, CommandRunner, CommandSpec } from '@visualnscode/integrations';
import { SystemAgentCommandRunner, parseAgentCommand } from './agent-command-runner';

class FakeCommandRunner implements CommandRunner {
  readonly calls: CommandSpec[] = [];

  async findExecutable(command: string): Promise<string> {
    return command;
  }

  async run(command: CommandSpec): Promise<CommandResult> {
    this.calls.push(command);
    const fakeToken = ['ghp', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('_');
    return { exitCode: 0, stdout: `ok ${fakeToken}`, stderr: '' };
  }
}

describe('SystemAgentCommandRunner', () => {
  it('analisa argumentos sem invocar um shell', () => {
    expect(parseAgentCommand('pnpm test -- --runInBand "agent suite"')).toEqual([
      'pnpm',
      'test',
      '--',
      '--runInBand',
      'agent suite',
    ]);
    expect(() => parseAgentCommand('pnpm test && rm -rf .')).toThrow(/sintaxe de shell/i);
  });

  it('executa apenas ferramentas permitidas no workspace e sanitiza a saída', async () => {
    const commands = new FakeCommandRunner();
    const runner = new SystemAgentCommandRunner(commands);
    const result = await runner.run('pnpm test', '/tmp/workspace', 30_000);

    expect(commands.calls[0]).toMatchObject({
      executable: 'pnpm',
      args: ['test'],
      cwd: '/tmp/workspace',
    });
    expect(result.stdout).toContain('[REDACTED]');
  });

  it('bloqueia executáveis arbitrários e argumentos fora do workspace', async () => {
    const runner = new SystemAgentCommandRunner(new FakeCommandRunner());

    await expect(runner.run('sh script.sh', '/tmp/workspace', 30_000)).rejects.toThrow(
      /Executável não permitido/i,
    );
    await expect(runner.run('eslint ../outside.ts', '/tmp/workspace', 30_000)).rejects.toThrow(
      /fora do workspace/i,
    );
    await expect(runner.run('pnpm exec custom-tool', '/tmp/workspace', 30_000)).rejects.toThrow(
      /arbitrária/i,
    );
  });
});
