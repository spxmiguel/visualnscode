import type {
  GitHubAuthStatus,
  GitHubCreateIssueInput,
  GitHubCreatePullRequestInput,
  GitHubCreateReleaseInput,
  GitHubCreateRepositoryInput,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRelease,
  GitHubWorkflowRun,
} from '../../shared/version-control';
import { SystemVersionControlRunner, type VersionControlCommandRunner } from './git-service';

const REPOSITORY = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/u;
const SAFE_NAME = /^[a-zA-Z0-9_.-]{1,100}$/u;
const SAFE_REF = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,199}$/u;

export class GitHubService {
  constructor(
    private readonly runner: VersionControlCommandRunner = new SystemVersionControlRunner(),
  ) {}

  async authStatus(cwd: string): Promise<GitHubAuthStatus> {
    try {
      await this.run(cwd, ['auth', 'status', '--hostname', 'github.com']);
      const username = await this.run(cwd, ['api', 'user', '--jq', '.login']);
      return { authenticated: true, username: username || null };
    } catch {
      return { authenticated: false, username: null };
    }
  }

  async createRepository(cwd: string, input: GitHubCreateRepositoryInput): Promise<string> {
    this.requireConfirmation(input.confirmed, 'criação do repositório');
    if (!SAFE_NAME.test(input.name)) throw new Error('Nome de repositório inválido.');
    if (input.description.length > 350) throw new Error('Descrição muito longa.');
    return this.run(cwd, [
      'repo',
      'create',
      input.name,
      `--${input.visibility}`,
      '--source',
      '.',
      '--remote',
      'origin',
      '--description',
      input.description,
    ]);
  }

  async clone(cwd: string, repository: string, confirmed: boolean): Promise<string> {
    this.requireConfirmation(confirmed, 'clone do repositório');
    this.assertRepository(repository);
    await this.run(cwd, ['repo', 'clone', repository]);
    return repository.split('/')[1]!;
  }

  async fork(cwd: string, confirmed: boolean): Promise<string> {
    this.requireConfirmation(confirmed, 'fork do repositório');
    return this.run(cwd, ['repo', 'fork', '--remote=true', '--clone=false']);
  }

  async repositoryUrl(cwd: string): Promise<string> {
    return this.run(cwd, ['repo', 'view', '--json', 'url', '--jq', '.url']);
  }

  async issues(cwd: string): Promise<GitHubIssue[]> {
    const output = await this.run(cwd, [
      'issue',
      'list',
      '--limit',
      '50',
      '--state',
      'all',
      '--json',
      'number,title,state,url,author',
    ]);
    return this.parseArray<{
      number: number;
      title: string;
      state: string;
      url: string;
      author?: { login?: string };
    }>(output).map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.url,
      author: issue.author?.login ?? '',
    }));
  }

  async createIssue(cwd: string, input: GitHubCreateIssueInput): Promise<string> {
    this.requireConfirmation(input.confirmed, 'criação da issue');
    this.assertText(input.title, 200, 'título');
    this.assertText(input.body, 20_000, 'descrição');
    return this.run(cwd, ['issue', 'create', '--title', input.title, '--body', input.body]);
  }

  async pullRequests(cwd: string): Promise<GitHubPullRequest[]> {
    const output = await this.run(cwd, [
      'pr',
      'list',
      '--limit',
      '50',
      '--state',
      'all',
      '--json',
      'number,title,state,url,author,headRefName,baseRefName,isDraft',
    ]);
    return this.parseArray<{
      number: number;
      title: string;
      state: string;
      url: string;
      author?: { login?: string };
      headRefName: string;
      baseRefName: string;
      isDraft: boolean;
    }>(output).map((pullRequest) => ({
      number: pullRequest.number,
      title: pullRequest.title,
      state: pullRequest.state,
      url: pullRequest.url,
      author: pullRequest.author?.login ?? '',
      head: pullRequest.headRefName,
      base: pullRequest.baseRefName,
      draft: pullRequest.isDraft,
    }));
  }

  async createPullRequest(cwd: string, input: GitHubCreatePullRequestInput): Promise<string> {
    this.requireConfirmation(input.confirmed, 'criação do pull request');
    this.assertText(input.title, 200, 'título');
    this.assertText(input.body, 40_000, 'descrição');
    this.assertRef(input.base);
    this.assertRef(input.head);
    return this.run(cwd, [
      'pr',
      'create',
      '--title',
      input.title,
      '--body',
      input.body,
      '--base',
      input.base,
      '--head',
      input.head,
      ...(input.draft ? ['--draft'] : []),
    ]);
  }

  async workflowRuns(cwd: string): Promise<GitHubWorkflowRun[]> {
    const output = await this.run(cwd, [
      'run',
      'list',
      '--limit',
      '30',
      '--json',
      'databaseId,name,status,conclusion,headBranch,url',
    ]);
    return this.parseArray<{
      databaseId: number;
      name: string;
      status: string;
      conclusion: string | null;
      headBranch: string;
      url: string;
    }>(output).map((run) => ({
      id: run.databaseId,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.headBranch,
      url: run.url,
    }));
  }

  async releases(cwd: string): Promise<GitHubRelease[]> {
    const output = await this.run(cwd, [
      'release',
      'list',
      '--limit',
      '30',
      '--json',
      'name,tagName,isDraft,isPrerelease,publishedAt,url',
    ]);
    return this.parseArray<{
      name: string;
      tagName: string;
      isDraft: boolean;
      isPrerelease: boolean;
      publishedAt: string | null;
      url: string;
    }>(output).map((release) => ({
      name: release.name,
      tagName: release.tagName,
      draft: release.isDraft,
      prerelease: release.isPrerelease,
      publishedAt: release.publishedAt,
      url: release.url,
    }));
  }

  async createRelease(cwd: string, input: GitHubCreateReleaseInput): Promise<string> {
    this.requireConfirmation(input.confirmed, 'criação da release');
    this.assertRef(input.tag);
    this.assertText(input.title, 200, 'título');
    this.assertText(input.notes, 40_000, 'notas');
    return this.run(cwd, [
      'release',
      'create',
      input.tag,
      '--title',
      input.title,
      '--notes',
      input.notes,
      ...(input.prerelease ? ['--prerelease'] : []),
    ]);
  }

  private run(cwd: string, args: readonly string[]): Promise<string> {
    return this.runner.run('gh', args, cwd);
  }

  private requireConfirmation(confirmed: boolean, action: string): void {
    if (!confirmed) throw new Error(`Confirme a ${action} antes de continuar.`);
  }

  private assertRepository(repository: string): void {
    if (!REPOSITORY.test(repository)) throw new Error('Use o formato owner/repository.');
  }

  private assertRef(reference: string): void {
    if (!SAFE_REF.test(reference) || reference.includes('..')) {
      throw new Error('Referência Git inválida.');
    }
  }

  private assertText(value: string, maxLength: number, field: string): void {
    if (!value.trim() || value.length > maxLength) throw new Error(`O ${field} é inválido.`);
  }

  private parseArray<T>(value: string): T[] {
    const parsed: unknown = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) throw new Error('Resposta inesperada do GitHub CLI.');
    return parsed as T[];
  }
}
