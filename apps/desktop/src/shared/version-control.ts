export interface GitFileStatus {
  readonly path: string;
  readonly staged: boolean;
  readonly status: string;
  readonly conflict: boolean;
}

export interface GitStatus {
  readonly branch: string;
  readonly tracking: string | null;
  readonly ahead: number;
  readonly behind: number;
  readonly files: readonly GitFileStatus[];
}

export interface GitLogEntry {
  readonly hash: string;
  readonly shortHash: string;
  readonly subject: string;
  readonly author: string;
  readonly date: string;
  readonly refs: readonly string[];
}

export interface GitBranch {
  readonly name: string;
  readonly current: boolean;
  readonly remote: boolean;
}

export interface GitTag {
  readonly name: string;
  readonly subject: string;
  readonly date: string;
}

export interface GitConflict {
  readonly path: string;
  readonly ours: boolean;
  readonly theirs: boolean;
  readonly status: string;
}

export interface GitHubAuthStatus {
  readonly authenticated: boolean;
  readonly username: string | null;
}

export interface GitHubIssue {
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly url: string;
  readonly author: string;
}

export interface GitHubPullRequest extends GitHubIssue {
  readonly head: string;
  readonly base: string;
  readonly draft: boolean;
}

export interface GitHubWorkflowRun {
  readonly id: number;
  readonly name: string;
  readonly status: string;
  readonly conclusion: string | null;
  readonly branch: string;
  readonly url: string;
}

export interface GitHubRelease {
  readonly name: string;
  readonly tagName: string;
  readonly draft: boolean;
  readonly prerelease: boolean;
  readonly publishedAt: string | null;
  readonly url: string;
}

export interface GitHubCreateRepositoryInput {
  readonly name: string;
  readonly description: string;
  readonly visibility: 'private' | 'public';
  readonly confirmed: boolean;
}

export interface GitHubCreateIssueInput {
  readonly title: string;
  readonly body: string;
  readonly confirmed: boolean;
}

export interface GitHubCreatePullRequestInput {
  readonly title: string;
  readonly body: string;
  readonly base: string;
  readonly head: string;
  readonly draft: boolean;
  readonly confirmed: boolean;
}

export interface GitHubCreateReleaseInput {
  readonly tag: string;
  readonly title: string;
  readonly notes: string;
  readonly prerelease: boolean;
  readonly confirmed: boolean;
}

export interface AgentVersionControlOptions {
  readonly checkpoint: boolean;
  readonly commit: boolean;
  readonly branch: boolean;
  readonly pullRequest: boolean;
  readonly pushConfirmed: boolean;
  readonly pullRequestConfirmed: boolean;
}
