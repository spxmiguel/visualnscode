// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { GitService, type VersionControlCommandRunner } from './git-service';

class FakeRunner implements VersionControlCommandRunner {
  readonly calls: Array<{ executable: 'git' | 'gh'; args: readonly string[]; cwd: string }> = [];

  constructor(private readonly response: (args: readonly string[]) => string = () => '') {}

  async run(executable: 'git' | 'gh', args: readonly string[], cwd: string): Promise<string> {
    this.calls.push({ executable, args, cwd });
    return this.response(args);
  }
}

describe('GitService', () => {
  it('parses branch sync, staged, unstaged and conflict status', async () => {
    const runner = new FakeRunner(() =>
      [
        '## feature/ui...origin/feature/ui [ahead 2, behind 1]',
        'M  staged.ts',
        ' M unstaged.ts',
        'UU conflict.ts',
        '?? new.ts',
      ].join('\n'),
    );

    const status = await new GitService(runner).status('/workspace');

    expect(status).toMatchObject({
      branch: 'feature/ui',
      tracking: 'origin/feature/ui',
      ahead: 2,
      behind: 1,
    });
    expect(status.files).toEqual([
      { path: 'staged.ts', staged: true, status: 'M', conflict: false },
      { path: 'unstaged.ts', staged: false, status: 'M', conflict: false },
      { path: 'conflict.ts', staged: true, status: 'UU', conflict: true },
      { path: 'new.ts', staged: false, status: '??', conflict: false },
    ]);
  });

  it('requires Conventional Commits before invoking Git', async () => {
    const runner = new FakeRunner();
    const service = new GitService(runner);

    await expect(service.commit('/workspace', 'updated stuff')).rejects.toThrow(
      /Conventional Commits/i,
    );
    expect(runner.calls).toHaveLength(0);
  });

  it('blocks traversal paths and destructive reset modes', async () => {
    const runner = new FakeRunner();
    const service = new GitService(runner);

    await expect(service.stage('/workspace', ['../secret'])).rejects.toThrow(/caminho/i);
    await expect(service.reset('/workspace', 'HEAD', 'hard' as 'soft', true)).rejects.toThrow(
      /bloqueado/i,
    );
    expect(runner.calls).toHaveLength(0);
  });

  it('never pushes without explicit confirmation', async () => {
    const runner = new FakeRunner((args) =>
      args[0] === 'status' ? '## main...origin/main [ahead 1]\n' : '',
    );
    const service = new GitService(runner);

    await expect(service.push('/workspace', false)).rejects.toThrow(/confirmação/i);
    expect(runner.calls).toHaveLength(0);
    await service.push('/workspace', true);
    expect(runner.calls.at(-1)?.args).toEqual(['push']);
  });

  it('uses argument arrays for merge, tags, revert and conflict resolution', async () => {
    const runner = new FakeRunner();
    const service = new GitService(runner);

    await service.merge('/workspace', 'feature/safe', true);
    await service.createTag('/workspace', 'v1.0.0', 'First stable');
    await service.revert('/workspace', 'a1b2c3d', true);
    await service.resolveConflict('/workspace', 'src/app.ts', 'theirs');

    expect(runner.calls.map(({ args }) => args)).toEqual([
      ['merge', '--no-edit', 'feature/safe'],
      ['tag', '-a', 'v1.0.0', '-m', 'First stable'],
      ['revert', '--no-edit', 'a1b2c3d'],
      ['checkout', '--theirs', '--', 'src/app.ts'],
      ['add', '--', 'src/app.ts'],
    ]);
  });

  it('suggests a reviewable Conventional Commit message', () => {
    const message = new GitService(new FakeRunner()).suggestCommitMessage([
      { path: 'docs/git.md', staged: true, status: 'M', conflict: false },
    ]);
    expect(message).toBe('docs(git): update project file');
  });
});
