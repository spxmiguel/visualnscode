# Product requirements

## Product vision

VisualnsCode centralizes editing, AI, agents, CLIs, source control, preview, and deployment without
showing the full complexity of a traditional IDE on first contact. The same domain capabilities power
a guided, result-oriented Simple mode without IDE chrome and a detailed Advanced IDE.

## Functional requirements

1. Open, inspect, edit, save, diff, checkpoint, and restore files in a trusted local workspace.
2. Detect and run supported project actions through a risk-aware command boundary.
3. Configure multiple interchangeable remote, local, and CLI AI providers.
4. Orchestrate agents with explicit scope, tools, budgets, autonomy, visibility, and cancellation.
5. Integrate Git, GitHub, developer CLIs, preview, and deploy without coupling them to renderer code.
6. Keep non-secret preferences and bounded histories locally; encrypt credentials with the OS facility.
7. Explain important actions in plain language while keeping technical details available.
8. Require review for AI file changes and fresh confirmation for remote or dangerous effects.

## Non-functional requirements

- **Security:** no direct Node.js renderer access; named and validated IPC; least privilege; secret
  redaction; safe real-path handling; destructive-command invariants.
- **Reliability:** lint, typecheck, unit/integration/E2E tests, builds, dependency review, CodeQL, and
  documentation validation in CI.
- **Maintainability:** stable contracts, provider/integration adapters, directed package dependencies,
  Conventional Commits, Changesets, and ADRs.
- **Performance:** lazy heavy resources, bounded output/history, cancellable work, and no blocking
  long-running operation in renderer code.
- **Portability:** macOS arm64/x64, Windows x64, and Linux x64 packaging with platform-aware commands.
- **Accessibility:** keyboard operation, semantics, focus visibility, reduced motion, and contrast are
  acceptance criteria.
- **Privacy:** explicit minimal context, local-first history, sanitized logs, and no workspace telemetry
  by default.

## Current alpha scope

The repository implements the major product flows above and a separate public landing page. The alpha
is intended for source-based development and evaluation, not as a signed production distribution.

## Explicit limitations

- No public binary release, signing, notarization, or automatic update channel.
- No stable third-party plugin loader or SDK.
- SQLite migration and the complete interactive terminal UI remain planned.
- Packaged Electron E2E and operating-system coverage are incomplete.
- Provider behavior and pricing can change upstream; tests use fakes rather than live credentials.
