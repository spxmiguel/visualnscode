// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { VersionControlCommandRunner } from './git-service';
import { GitHubService } from './github-service';

class FakeRunner implements VersionControlCommandRunner {
  readonly calls: Array<{ executable: 'git' | 'gh'; args: readonly string[] }> = [];

  async run(executable: 'git' | 'gh', args: readonly string[]): Promise<string> {
    this.calls.push({ executable, args });
    if (args[0] === 'api') return 'spxmiguel';
    if (args[0] === 'issue' && args[1] === 'list') {
      return JSON.stringify([
        {
          number: 7,
          title: 'Bug',
          state: 'OPEN',
          url: 'https://github.com/spxmiguel/repo/issues/7',
          author: { login: 'spxmiguel' },
        },
      ]);
    }
    return 'https://github.com/spxmiguel/repo';
  }
}

describe('GitHubService', () => {
  it('reads authentication and issue data through gh JSON output', async () => {
    const service = new GitHubService(new FakeRunner());

    await expect(service.authStatus('/workspace')).resolves.toEqual({
      authenticated: true,
      username: 'spxmiguel',
    });
    await expect(service.issues('/workspace')).resolves.toEqual([
      {
        number: 7,
        title: 'Bug',
        state: 'OPEN',
        url: 'https://github.com/spxmiguel/repo/issues/7',
        author: 'spxmiguel',
      },
    ]);
  });

  it('blocks every tested remote mutation without confirmation', async () => {
    const runner = new FakeRunner();
    const service = new GitHubService(runner);

    await expect(
      service.createIssue('/workspace', { title: 'Bug', body: 'Details', confirmed: false }),
    ).rejects.toThrow(/confirme/i);
    await expect(service.fork('/workspace', false)).rejects.toThrow(/confirme/i);
    await expect(service.clone('/workspace', 'spxmiguel/repo', false)).rejects.toThrow(/confirme/i);
    expect(runner.calls).toHaveLength(0);
  });

  it('creates a repository without pushing code automatically', async () => {
    const runner = new FakeRunner();
    const service = new GitHubService(runner);

    await service.createRepository('/workspace', {
      name: 'visualnscode',
      description: 'Desktop IDE',
      visibility: 'public',
      confirmed: true,
    });

    expect(runner.calls).toHaveLength(1);
    expect(runner.calls[0]?.executable).toBe('gh');
    expect(runner.calls[0]?.args).toContain('--public');
    expect(runner.calls[0]?.args).not.toContain('--push');
  });

  it('builds pull request and release commands from validated fields', async () => {
    const runner = new FakeRunner();
    const service = new GitHubService(runner);

    await service.createPullRequest('/workspace', {
      title: 'feat: add git panel',
      body: 'Summary',
      base: 'main',
      head: 'feature/git',
      draft: true,
      confirmed: true,
    });
    await service.createRelease('/workspace', {
      tag: 'v0.2.0',
      title: 'v0.2.0',
      notes: 'Release notes',
      prerelease: true,
      confirmed: true,
    });

    expect(runner.calls[0]?.args).toEqual([
      'pr',
      'create',
      '--title',
      'feat: add git panel',
      '--body',
      'Summary',
      '--base',
      'main',
      '--head',
      'feature/git',
      '--draft',
    ]);
    expect(runner.calls[1]?.args).toContain('--prerelease');
  });

  it('rejects malformed repository and ref input before calling gh', async () => {
    const runner = new FakeRunner();
    const service = new GitHubService(runner);

    await expect(service.clone('/workspace', '--dangerous', true)).rejects.toThrow(
      /owner\/repository/i,
    );
    await expect(
      service.createRelease('/workspace', {
        tag: '../bad',
        title: 'bad',
        notes: 'bad',
        prerelease: false,
        confirmed: true,
      }),
    ).rejects.toThrow(/referência/i);
    expect(runner.calls).toHaveLength(0);
  });
});
