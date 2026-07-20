import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createSafeProcessEnvironment } from './process-environment';
import type { CommandResult, CommandRunner, CommandSpec } from './types';

const execFileAsync = promisify(execFile);

export class SystemCommandRunner implements CommandRunner {
  async findExecutable(command: string): Promise<string | null> {
    try {
      const locator = process.platform === 'win32' ? 'where' : 'which';
      const { stdout } = await execFileAsync(locator, [command], {
        encoding: 'utf8',
        env: createSafeProcessEnvironment(),
        timeout: 5_000,
      });
      return (
        stdout
          .split(/\r?\n/u)
          .map((line) => line.trim())
          .find(Boolean) ?? null
      );
    } catch {
      return null;
    }
  }

  async run(command: CommandSpec): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execFileAsync(command.executable, [...command.args], {
        cwd: command.cwd,
        encoding: 'utf8',
        env: createSafeProcessEnvironment(),
        maxBuffer: 64 * 1024,
        timeout: command.timeoutMs ?? 15_000,
        windowsHide: true,
      });
      return { exitCode: 0, stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error) {
      const failure = error as {
        code?: number | string;
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      return {
        exitCode: typeof failure.code === 'number' ? failure.code : 1,
        stdout: failure.stdout?.trim() ?? '',
        stderr: failure.stderr?.trim() || failure.message || 'O comando não pôde ser concluído.',
      };
    }
  }
}
