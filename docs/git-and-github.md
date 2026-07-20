# Git and GitHub

VisualnsCode exposes source control in the Advanced workspace. Simple mode intentionally has no IDE
or Git panel: it stays focused on the running result, preview, and project assistant. Guided project
creation can still explain optional Git steps in plain language, but opening status, history, and
remote operations requires switching to Advanced. Every action calls the same validated main-process
services.

## Advanced source control

The panel uses the actual Git and GitHub terms. Descriptions and confirmation dialogs explain the
effect before it runs, so technical accuracy does not depend on hiding the operation behind a second
vocabulary.

The commit-message suggestion is local and deterministic. It uses changed filenames to propose a
Conventional Commit. The text remains editable and is never committed until the user confirms the
commit.

### Git operations

The source-control service supports:

- repository status, upstream tracking, ahead/behind counts, and conflicts;
- stage, unstage, per-file and staged diff;
- Conventional Commits and a visual log with refs;
- local and remote branches, switch, create, and confirmed merge;
- stash and stash pop, including untracked files;
- annotated tag listing and creation;
- safe `soft` and `mixed` reset only;
- confirmed revert;
- conflict listing and `ours`, `theirs`, or manually edited resolution;
- confirmed push and fast-forward-only pull.

`reset --hard`, force push, arbitrary Git arguments, absolute paths, and path traversal are not
available through IPC.

### GitHub operations

GitHub uses the authenticated GitHub CLI (`gh`) credential store. VisualnsCode does not read or store
the OAuth token.

- check authentication and show the connected username;
- create a repository without automatically pushing code;
- clone and fork;
- open the current repository in the browser;
- list and create issues and pull requests;
- list Actions workflow runs;
- list and create releases.

Repository creation, clone, fork, issue creation, pull-request creation, and release creation require
a `confirmed: true` intent validated again in the main process. User-controlled strings are passed as
individual `execFile` arguments; no shell command is assembled.

## Agent task versioning

Before starting a team, the user can opt into any combination of:

1. a local checkpoint of the files provided to the agents;
2. an isolated `agent/*` branch;
3. a local Conventional Commit when the run completes;
4. a draft pull request.

Draft pull requests imply a branch and commit. They stay disabled until the user separately allows
the push and the draft pull request. The authorization applies only to that task payload. There is no
global or implicit agent push setting.

## Tests without remote side effects

`GitService` and `GitHubService` accept an injected command runner. Tests record executable and
argument arrays and return fixture output. They verify parsing, validation, confirmation gates, and
the absence of `--push` without invoking GitHub, changing authentication, or publishing anything.

```bash
pnpm test:integration git-service.test.ts github-service.test.ts
```
