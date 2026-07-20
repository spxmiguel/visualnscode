# Contributing to VisualnsCode

Thank you for contributing. Changes should preserve the approachable experience, secure defaults,
and architectural boundaries of the project.

## Set up the repository

1. Install Node.js 20.18 or newer, pnpm 9, and Git.
2. Fork and clone the repository.
3. Run `corepack enable` and `pnpm install --frozen-lockfile`.
4. Create a short-lived branch from `main`.
5. Read [Architecture](./docs/architecture.md) and the [ADRs](./docs/decisions/README.md) before changing a system boundary.

`pnpm install` activates Husky. The pre-commit hook formats and lints staged files, typechecks the
workspace, and runs unit tests. The pre-push hook audits tracked content for secrets and runs the
integration suite.

## Development expectations

- Keep each change small and focused.
- Add or update tests with behavior changes.
- Do not commit credentials, personal data, generated dependencies, local databases, or build output.
- Record durable architectural decisions in an ADR.
- Explain context, approach, risks, screenshots for UI changes, and validation in the pull request.
- Keep the repository runnable after every commit.

Before opening a pull request, run:

```bash
pnpm docs:check
pnpm format:check
pnpm check:structure
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Run `pnpm test:lighthouse` when changing the landing page and `pnpm security:audit` before every
push. See [Testing](./docs/testing.md) for focused commands.

## Commits and Changesets

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(editor): add workspace tab model
fix(preload): validate workspace path payload
docs(adr): record terminal isolation strategy
test(providers): cover capability negotiation
```

Common types are `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, and `chore`.
Messages such as `update`, `fix`, or `changes` are not acceptable on their own.

For a user-visible change, run `pnpm changeset` and commit the generated file. Documentation-only,
test-only, CI-only, and non-user-visible refactors do not require a Changeset.

## Pull requests

Pull requests must:

- use the repository template;
- link the relevant issue when one exists;
- remain limited to one coherent change;
- pass all required GitHub Actions checks;
- call out new IPC channels, commands, credentials, remote requests, or filesystem access;
- avoid drive-by formatting or unrelated dependency updates.

## Security before push

1. Review `git status`, `git diff`, and `git diff --cached`.
2. Run `pnpm security:audit`.
3. Confirm local state, databases, tokens, and credentials are excluded by `.gitignore`.
4. If a secret entered Git history, revoke it first and contact the maintainers privately before rewriting shared history.

Do not open public issues for vulnerabilities. Follow [SECURITY.md](./SECURITY.md). Any new IPC
bridge, command, file access, secret, or external integration requires input validation and an
explicit least-privilege review.
