import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(execFile);

const run = async (cwd: string, args: string[]): Promise<string> => {
  const { stdout } = await execAsync('git', args, { cwd, env: process.env });
  return stdout.trim();
};

export interface GitFileStatus {
  readonly path: string;
  readonly staged: boolean;
  readonly status: string;
}

export interface GitLogEntry {
  readonly hash: string;
  readonly shortHash: string;
  readonly subject: string;
  readonly author: string;
  readonly date: string;
}

export interface GitBranch {
  readonly name: string;
  readonly current: boolean;
  readonly remote: boolean;
}

export class GitService {
  async isRepo(workspacePath: string): Promise<boolean> {
    try {
      await run(workspacePath, ['rev-parse', '--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  async status(workspacePath: string): Promise<{ branch: string; files: GitFileStatus[] }> {
    const [branchOut, statusOut] = await Promise.all([
      run(workspacePath, ['branch', '--show-current']).catch(() => 'HEAD'),
      run(workspacePath, ['status', '--porcelain']).catch(() => ''),
    ]);
    const files: GitFileStatus[] = statusOut
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const staged = line[0] !== ' ' && line[0] !== '?';
        return {
          path: line.slice(3),
          staged,
          status: line.slice(0, 2).trim(),
        };
      });
    return { branch: branchOut || 'main', files };
  }

  async diff(workspacePath: string, staged = false): Promise<string> {
    const args = staged ? ['diff', '--cached'] : ['diff'];
    return run(workspacePath, args).catch(() => '');
  }

  async stage(workspacePath: string, paths: string[]): Promise<void> {
    await run(workspacePath, ['add', '--', ...paths]);
  }

  async unstage(workspacePath: string, paths: string[]): Promise<void> {
    await run(workspacePath, ['restore', '--staged', '--', ...paths]);
  }

  async commit(workspacePath: string, message: string): Promise<string> {
    const cleanMessage = message.slice(0, 72 * 10);
    await run(workspacePath, ['commit', '-m', cleanMessage]);
    return run(workspacePath, ['rev-parse', '--short', 'HEAD']);
  }

  async log(workspacePath: string, limit = 30): Promise<GitLogEntry[]> {
    const format = '%H\x1f%h\x1f%s\x1f%an\x1f%ar';
    const out = await run(workspacePath, ['log', `--max-count=${limit}`, `--pretty=format:${format}`]).catch(() => '');
    return out
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, shortHash, subject, author, date] = line.split('\x1f');
        return { hash: hash ?? '', shortHash: shortHash ?? '', subject: subject ?? '', author: author ?? '', date: date ?? '' };
      });
  }

  async branches(workspacePath: string): Promise<GitBranch[]> {
    const out = await run(workspacePath, ['branch', '-a', '--format=%(refname:short) %(HEAD)']).catch(() => '');
    return out
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.trim().split(' ');
        const current = parts[parts.length - 1] === '*';
        const name = current ? parts.slice(0, -1).join(' ') : parts.join(' ');
        return { name: name.replace(/^origin\//, ''), current, remote: name.startsWith('remotes/') };
      });
  }

  async checkout(workspacePath: string, branch: string): Promise<void> {
    await run(workspacePath, ['checkout', branch]);
  }

  async createBranch(workspacePath: string, name: string): Promise<void> {
    const safe = name.replace(/[^a-zA-Z0-9/_.-]/g, '-').slice(0, 100);
    await run(workspacePath, ['checkout', '-b', safe]);
  }

  async stash(workspacePath: string, message?: string): Promise<void> {
    const args = message ? ['stash', 'push', '-m', message] : ['stash', 'push'];
    await run(workspacePath, args);
  }

  async stashPop(workspacePath: string): Promise<void> {
    await run(workspacePath, ['stash', 'pop']);
  }

  async revert(workspacePath: string, hash: string): Promise<void> {
    if (!/^[a-f0-9]{4,40}$/.test(hash)) throw new Error('Hash de commit inválido.');
    await run(workspacePath, ['revert', '--no-commit', hash]);
  }

  async init(workspacePath: string): Promise<void> {
    await run(workspacePath, ['init']);
    await run(workspacePath, ['checkout', '-b', 'main']).catch(() => undefined);
  }
}
