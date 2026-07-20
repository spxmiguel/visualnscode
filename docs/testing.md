# Testing

## Test layers

| Layer         | Command                 | Scope                                                                         |
| ------------- | ----------------------- | ----------------------------------------------------------------------------- |
| Unit          | `pnpm test:unit`        | Pure packages, shared edit model, and renderer behavior                       |
| Integration   | `pnpm test:integration` | Main-process services with fake command, provider, Git, and deploy boundaries |
| Combined      | `pnpm test`             | Unit then integration                                                         |
| Coverage      | `pnpm test:coverage`    | Separate V8 reports for unit and main-service integration suites              |
| End to end    | `pnpm test:e2e`         | Landing navigation, interactions, responsive behavior, and Axe checks         |
| Quality audit | `pnpm test:lighthouse`  | Built landing performance, accessibility, practices, and SEO budgets          |

Vitest files remain beside source as `*.test.ts` or `*.test.tsx`. Playwright specifications live in
`e2e/`. `vitest.unit.config.ts` and `vitest.integration.config.ts` make the CI split explicit.

## Determinism and safety

- Provider tests use `FakeProvider`, mocked Fetch, or fake PTY behavior; they never need an API key.
- Integration tests inject fake command executors and do not authenticate, install, push, or deploy.
- Agent service tests use fake providers, command runners, filesystems, and edit services. They cover
  approval ordering, constrained command execution, review-only edits, sanitized persistence, and
  workspace-isolated memory without a real model or command.
- Project creation tests use a fake runner and fake renderer bridge. They create only temporary local
  files and prove that GitHub remains disabled unless separately confirmed.
- Filesystem tests use temporary directories and cover traversal, real paths, symlinks, sensitive
  files, atomic writes, checkpoints, and rollback.
- Renderer tests stub the typed `window.visualnscode` bridge rather than starting privileged services.
- E2E tests start only the local landing Vite server defined in `playwright.config.ts`.

## Writing tests

Test observable contracts and failure paths. A new privileged capability needs at least:

1. a successful request with the smallest valid payload;
2. malformed input rejection;
3. missing permission or confirmation rejection;
4. sanitized command/provider failure;
5. cancellation or timeout behavior when applicable.

Use the existing fake implementations instead of monkey-patching process globals. Keep fixtures free of
realistic secrets that could trigger the repository audit unless the test explicitly builds a secret
from separated strings.

## Local verification

```bash
pnpm docs:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm test:e2e
pnpm test:lighthouse
pnpm security:audit
```

Install Playwright's browser once on a new machine with
`pnpm exec playwright install chromium`. CI uses `--with-deps` on Ubuntu.

Coverage reports are written to `coverage/unit` and `coverage/integration`. The 2026-07-20 audit
baseline is 50.00% unit lines and 66.81% integration lines. No global threshold is claimed yet because
the next step is to add direct coverage for `provider-service` and `secure-storage`, then introduce
per-boundary thresholds without rewarding tests of low-risk generated or composition code. See
[audit issue #22](https://github.com/spxmiguel/visualnscode/issues/22).
