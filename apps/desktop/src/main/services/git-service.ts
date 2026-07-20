import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { createSafeProcessEnvironment } from '@visualnscode/integrations';
import type {
  GitBranch,
  GitConflict,
  GitFileStatus,
  GitLogEntry,
  GitStatus,
  GitTag,
} from '../../shared/version-control';

const execAsync = promisify(execFile);
const HASH_OR_REF = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,199}$/u;
const CONVENTIONAL_COMMIT =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9._/-]+\))?!?: .{1,200}$/u;
const CONFLICT_CODES = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);

export interface VersionControlCommandRunner {
  run(executable: 'git' | 'gh', args: readonly string[], cwd: string): Promise<string>;
}

export class SystemVersionControlRunner implements VersionControlCommandRunner {
  async run(executable: 'git' | 'gh', args: readonly string[], cwd: string): Promise<string> {
    const { stdout } = await execAsync(executable, [...args], {
      cwd,
      encoding: 'utf8',
      env: createSafeProcessEnvironment(),
      maxBuffer: 4_000_000,
      timeout: 120_000,
      windowsHide: true,
    });
    return stdout.trim();
  }
}

export class GitService {
  constructor(
    private readonly runner: VersionControlCommandRunner = new SystemVersionControlRunner(),
  ) {}

  async isRepo(workspacePath: string): Promise<boolean> {
    try {
      return (await this.run(workspacePath, ['rev-parse', '--is-inside-work-tree'])) === 'true';
    } catch {
      return false;
    }
  }

  async status(workspacePath: string): Promise<GitStatus> {
    const output = await this.run(workspacePath, ['status', '--porcelain=v1', '--branch']);
    const lines = output.split(/\r?\n/u).filter(Boolean);
    const header = lines[0]?.startsWith('## ') ? lines.shift()!.slice(3) : 'HEAD';
    const [branchPart = 'HEAD', trackingPart = ''] = header.split('...');
    const branch = branchPart.replace(/^No commits yet on /u, '').trim();
    const tracking = trackingPart.replace(/\s+\[.*\]$/u, '').trim() || null;
    const ahead = Number(trackingPart.match(/ahead (\d+)/u)?.[1] ?? 0);
    const behind = Number(trackingPart.match(/behind (\d+)/u)?.[1] ?? 0);
    const files = lines.map((line): GitFileStatus => {
      const status = line.slice(0, 2);
      const rawPath = line.slice(3);
      const filePath = rawPath.includes(' -> ') ? rawPath.split(' -> ').at(-1)! : rawPath;
      return {
        path: filePath,
        staged: status[0] !== ' ' && status[0] !== '?',
        status: status.trim() || '?',
        conflict: CONFLICT_CODES.has(status),
      };
    });
    return { branch: branch || 'HEAD', tracking, ahead, behind, files };
  }

  async diff(workspacePath: string, staged = false, filePath?: string): Promise<string> {
    const args = ['diff', '--no-ext-diff', '--no-color'];
    if (staged) args.push('--cached');
    if (filePath) {
      this.assertPaths([filePath]);
      args.push('--', filePath);
    }
    return this.run(workspacePath, args);
  }

  async stage(workspacePath: string, paths: readonly string[]): Promise<void> {
    this.assertPaths(paths);
    await this.run(workspacePath, ['add', '--', ...paths]);
  }

  async unstage(workspacePath: string, paths: readonly string[]): Promise<void> {
    this.assertPaths(paths);
    await this.run(workspacePath, ['restore', '--staged', '--', ...paths]);
  }

  async commit(workspacePath: string, message: string): Promise<string> {
    const cleanMessage = message.trim();
    if (!CONVENTIONAL_COMMIT.test(cleanMessage)) {
      throw new Error('Use Conventional Commits, por exemplo: feat(editor): add file tabs');
    }
    await this.run(workspacePath, ['commit', '-m', cleanMessage]);
    return this.run(workspacePath, ['rev-parse', '--short', 'HEAD']);
  }

  suggestCommitMessage(files: readonly GitFileStatus[]): string {
    const paths = files.map(({ path: filePath }) => filePath.toLowerCase());
    const type = paths.every((filePath) => filePath.endsWith('.md'))
      ? 'docs'
      : paths.some((filePath) => /(^|\/)(test|tests|e2e)(\/|\.|$)/u.test(filePath))
        ? 'test'
        : paths.some((filePath) => filePath.includes('package') || filePath.includes('lock'))
          ? 'chore'
          : 'feat';
    const scope = paths.some(
      (filePath) => filePath.includes('github') || filePath.includes('.github'),
    )
      ? 'github'
      : paths.some((filePath) => filePath.includes('git'))
        ? 'git'
        : 'project';
    return `${type}(${scope}): update ${files.length === 1 ? 'project file' : 'project files'}`;
  }

  async log(workspacePath: string, limit = 30): Promise<GitLogEntry[]> {
    const format = '%H\x1f%h\x1f%s\x1f%an\x1f%ar\x1f%D';
    const output = await this.run(workspacePath, [
      'log',
      `--max-count=${Math.min(Math.max(limit, 1), 100)}`,
      `--pretty=format:${format}`,
    ]).catch(() => '');
    return output
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => {
        const [hash = '', shortHash = '', subject = '', author = '', date = '', refs = ''] =
          line.split('\x1f');
        return {
          hash,
          shortHash,
          subject,
          author,
          date,
          refs: refs
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        };
      });
  }

  async branches(workspacePath: string): Promise<GitBranch[]> {
    const output = await this.run(workspacePath, [
      'branch',
      '-a',
      '--format=%(refname:short)\x1f%(HEAD)\x1f%(refname)',
    ]).catch(() => '');
    return output
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => {
        const [rawName = '', head = '', refType = ''] = line.split('\x1f');
        const remote = refType.startsWith('refs/remotes/');
        return {
          name: remote ? rawName.replace(/^origin\//u, '') : rawName,
          current: head === '*',
          remote,
        };
      });
  }

  async checkout(workspacePath: string, branch: string): Promise<void> {
    this.assertRef(branch);
    await this.run(workspacePath, ['switch', branch]);
  }

  async createBranch(workspacePath: string, name: string): Promise<void> {
    this.assertRef(name);
    await this.run(workspacePath, ['switch', '-c', name]);
  }

  async merge(workspacePath: string, branch: string, confirmed: boolean): Promise<void> {
    if (!confirmed) throw new Error('Confirme o merge antes de continuar.');
    this.assertRef(branch);
    await this.run(workspacePath, ['merge', '--no-edit', branch]);
  }

  async stash(workspacePath: string, message?: string): Promise<void> {
    const cleanMessage = message?.trim().slice(0, 200);
    await this.run(
      workspacePath,
      cleanMessage
        ? ['stash', 'push', '--include-untracked', '-m', cleanMessage]
        : ['stash', 'push', '--include-untracked'],
    );
  }

  async stashPop(workspacePath: string): Promise<void> {
    await this.run(workspacePath, ['stash', 'pop']);
  }

  async tags(workspacePath: string): Promise<GitTag[]> {
    const format = '%(refname:short)\x1f%(contents:subject)\x1f%(creatordate:relative)';
    const output = await this.run(workspacePath, ['tag', '--list', `--format=${format}`]);
    return output
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => {
        const [name = '', subject = '', date = ''] = line.split('\x1f');
        return { name, subject, date };
      });
  }

  async createTag(workspacePath: string, name: string, message: string): Promise<void> {
    this.assertRef(name);
    if (!message.trim()) throw new Error('Informe uma descrição para a tag.');
    await this.run(workspacePath, ['tag', '-a', name, '-m', message.trim().slice(0, 500)]);
  }

  async reset(
    workspacePath: string,
    reference: string,
    mode: 'soft' | 'mixed',
    confirmed: boolean,
  ): Promise<void> {
    if (!confirmed) throw new Error('Confirme o reset antes de continuar.');
    this.assertRef(reference);
    if (!['soft', 'mixed'].includes(mode)) throw new Error('Reset destrutivo bloqueado.');
    await this.run(workspacePath, ['reset', `--${mode}`, reference]);
  }

  async revert(workspacePath: string, hash: string, confirmed: boolean): Promise<void> {
    if (!confirmed) throw new Error('Confirme o revert antes de continuar.');
    if (!/^[a-f0-9]{4,40}$/u.test(hash)) throw new Error('Hash de commit inválido.');
    await this.run(workspacePath, ['revert', '--no-edit', hash]);
  }

  async conflicts(workspacePath: string): Promise<GitConflict[]> {
    const status = await this.status(workspacePath);
    return status.files
      .filter(({ conflict }) => conflict)
      .map(({ path: filePath, status: code }) => ({
        path: filePath,
        ours: ['AU', 'AA', 'UU'].includes(code),
        theirs: ['UA', 'AA', 'UU'].includes(code),
        status: code,
      }));
  }

  async resolveConflict(
    workspacePath: string,
    filePath: string,
    resolution: 'ours' | 'theirs' | 'manual',
  ): Promise<void> {
    this.assertPaths([filePath]);
    if (resolution !== 'manual') {
      await this.run(workspacePath, ['checkout', `--${resolution}`, '--', filePath]);
    }
    await this.stage(workspacePath, [filePath]);
  }

  async remoteUrl(workspacePath: string): Promise<string | null> {
    return this.run(workspacePath, ['remote', 'get-url', 'origin']).catch(() => null);
  }

  async push(workspacePath: string, confirmed: boolean): Promise<void> {
    if (!confirmed) throw new Error('O envio ao GitHub exige confirmação explícita.');
    const { branch, tracking } = await this.status(workspacePath);
    this.assertRef(branch);
    await this.run(
      workspacePath,
      tracking ? ['push'] : ['push', '--set-upstream', 'origin', branch],
    );
  }

  async pull(workspacePath: string, confirmed: boolean): Promise<void> {
    if (!confirmed) throw new Error('Confirme antes de baixar e integrar alterações.');
    await this.run(workspacePath, ['pull', '--ff-only']);
  }

  async init(workspacePath: string): Promise<void> {
    await this.run(workspacePath, ['init', '--initial-branch', 'main']);
  }

  private run(workspacePath: string, args: readonly string[]): Promise<string> {
    return this.runner.run('git', args, workspacePath);
  }

  private assertRef(reference: string): void {
    if (!HASH_OR_REF.test(reference) || reference.includes('..') || reference.endsWith('.lock')) {
      throw new Error('Referência Git inválida.');
    }
  }

  private assertPaths(paths: readonly string[]): void {
    if (!paths.length || paths.length > 500) throw new Error('Seleção de arquivos inválida.');
    for (const filePath of paths) {
      const normalized = path.normalize(filePath);
      if (
        !filePath ||
        filePath.includes('\0') ||
        path.isAbsolute(filePath) ||
        normalized === '..' ||
        normalized.startsWith(`..${path.sep}`)
      ) {
        throw new Error('Caminho Git inválido.');
      }
    }
  }
}
