# Roadmap

This roadmap describes outcomes, not promised dates. Priorities may change after user research,
security review, and packaged-app testing.

## Implemented in the alpha codebase

- [x] pnpm monorepo with separate desktop, landing, and shared packages.
- [x] Electron security boundary, React workspace, Monaco editor, themes, tabs, and resizable panels.
- [x] Simple and Advanced modes with onboarding and 19-tool environment detection.
- [x] Remote API, local server, and CLI provider adapters with streaming chat and secure credentials.
- [x] Built-in and custom agents, workflow graph, parallel stages, retries, budgets, timeout, and rollback hooks.
- [x] Review-first AI editing, diffs, hunk selection, checkpoints, snapshots, rollback, and secret redaction.
- [x] Safe workspace filesystem, command classification, permission gates, and constrained YOLO mode.
- [x] Guided project creation with 13 versioned templates.
- [x] Git and GitHub operations in Simple and Advanced language.
- [x] Project runtime detection, process control, preview bridge, responsive sizes, and element picker.
- [x] Confirmed deploy plans for Vercel, Firebase Hosting, Supabase, and GitHub Pages.
- [x] Responsive landing page, accessibility tests, metadata, and Lighthouse CI.
- [x] Cross-platform packaging configuration and manually confirmed release workflow.

## Stabilization for alpha releases

- [ ] Test packaged desktop artifacts on macOS arm64/x64, Windows x64, and Linux x64.
- [ ] Complete the interactive terminal surface backed by the existing constrained process boundary.
- [ ] Add workspace-wide text search and complete keyboard-only navigation.
- [ ] Add failure recovery tests for interrupted writes, process crashes, and partial deploys.
- [ ] Measure coverage by security boundary and close high-risk gaps.
- [ ] Publish the first explicitly approved alpha release.

## Beta readiness

- [ ] Migrate persistent metadata and bounded histories to versioned SQLite migrations.
- [ ] Add code signing and notarization for macOS and code signing for Windows.
- [ ] Add a signed update channel with rollback and alpha/beta/stable selection.
- [ ] Run packaged Electron E2E tests on all supported operating systems.
- [ ] Add configurable pricing metadata and cumulative session budgets.
- [ ] Add a signed, opt-in remote template catalog.

## Stable and ecosystem

- [ ] Complete accessibility audit against WCAG 2.2 AA for desktop and landing.
- [ ] Define a stable plugin SDK, signed manifest format, capability permissions, and revocation model.
- [ ] Add plugin isolation and a reviewed distribution process before third-party execution is enabled.
- [ ] Establish supported-version and migration policies for stable releases.

Implementation milestones and acceptance criteria are documented in
[docs/development-plan.md](./docs/development-plan.md).
