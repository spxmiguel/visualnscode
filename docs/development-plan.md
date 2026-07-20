# Development plan

Each phase ends with documentation, lint, typecheck, tests, and build passing. Features should land as
small vertical slices that leave the repository runnable.

## Phase 0 — Foundation (complete)

pnpm monorepo, separate desktop and landing apps, shared packages, TypeScript, ESLint, Prettier,
Tailwind, Vitest, Playwright, CI, governance files, and initial ADRs.

## Phase 1 — Desktop workspace (complete in alpha)

Home, recent projects, settings, themes, result-oriented Simple mode, full Advanced IDE, Monaco, file
tabs, native folder open, safe file read/write, resizable panels, UI states, shortcuts, and shared
component catalog.

Remaining stabilization: workspace text search and complete keyboard-only navigation.

## Phase 2 — Local capabilities and security (partially complete)

Command classification, permission model, path and symlink controls, secret detection/redaction,
review-first edits, checkpoints, Git, process runner, preview, and bounded histories are implemented.

Remaining: finish the interactive terminal surface, isolate long-lived PTY work more strongly, and
migrate metadata to versioned SQLite.

## Phase 3 — Universal providers (complete in alpha)

Canonical streaming contract, remote/local/CLI adapters, encrypted credentials, redacted remote
context, provider settings, cancellation, chat history/export, and fake-provider tests.

Remaining: maintained pricing metadata, cumulative session budgets, and packaged native-module tests.

## Phase 4 — Agents and reviewable work (complete in alpha)

Built-in/custom definitions, autonomy policy, visual teams, DAG execution, parallel stages, approval,
shell-free local actions, active timeout cancellation, retry, budgets, step limits, scoped memory,
sanitized history, rollback hooks, and opt-in version-control output.

Remaining: expand interrupted-persistence recovery tests and packaged provider/PTY coverage.

## Phase 5 — Projects, source control, preview, and deploy (complete in alpha)

Thirteen versioned executable templates, guided no-publish creation tests, Git/GitHub operations,
runtime detection, process controls, loopback preview, element context, and confirmed
Vercel/Firebase/Supabase/GitHub Pages plans.

Remaining: signed remote template catalog and broader deploy failure recovery.

## Phase 6 — Distribution and maturity (in progress)

Separate quality workflows, Changesets, alpha/beta/stable policy, and cross-platform packaging are
configured. Before stable: packaged-app E2E, signing, notarization, update rollback, SBOM/provenance,
WCAG audit, supported migrations, and plugin isolation.

Detailed priorities are maintained in [ROADMAP.md](../ROADMAP.md).
