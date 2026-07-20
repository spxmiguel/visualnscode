# Changelog

All notable changes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- System theme mode that follows the operating-system light/dark preference and reacts to changes
  while the desktop app is open.
- Complete provider picker in the workspace chat, including provider-specific icons and setup
  guidance for API keys, local servers, and CLIs that are not ready yet.
- First-run Ollama fallback that activates the local endpoint and selects a detected model when no
  other AI provider is ready.
- Provider-aware brand icons for Ollama, Claude, Codex, Gemini, OpenAI, OpenRouter, LM Studio, and
  OpenCode across chat and model settings, with a lightweight CLI fallback.
- Complete agent orchestration with ten built-in roles, custom definitions, visual team DAGs,
  sequential/parallel stages, approvals, live cost/step/file/command telemetry, retries, active
  timeout cancellation, scoped memory, sanitized history, cancellation, and rollback hooks.
- Guided project creation now validates recommended agent roles and gives Landing Page, Portfolio,
  and Dashboard templates distinct responsive starters, with a renderer journey test that never
  publishes or authenticates.

- Final alpha audit with severity-ranked findings, measured coverage and duplication, dependency and
  compatibility results, release recommendation, and linked follow-up issues.
- Separate V8 coverage reports for unit and main-service integration suites.
- Complete English documentation set, verified local links, current application screenshots, six
  Mermaid system flows, extension guides, and an initial Brazilian Portuguese README.
- Separate GitHub Actions workflows for lint, typecheck, unit tests, integration tests, desktop build,
  landing build, Playwright, Lighthouse, dependency review, CodeQL, and confirmed releases.
- Changesets workflow for alpha, beta, and stable version preparation.
- Husky hooks with lint-staged, typecheck, fast tests, repository security audit, and integration tests.
- Functional desktop workspace with onboarding, themes, simple and advanced modes, Monaco, panels,
  preview, Git controls, agent teams, and provider configuration.
- Universal AI provider layer for remote APIs, local servers, and Claude Code, Codex, Gemini, Aider,
  and OpenCode CLIs, including streaming, cancellation, sanitized logs, and fake-provider tests.
- Review-first AI editing with per-file and per-hunk selection, unified and side-by-side diffs,
  checkpoints, snapshots, rollback, path safety, secret scanning, redaction, and constrained YOLO mode.
- Guided project creation with 13 versioned templates and explicitly confirmed external actions.
- Git and GitHub workflows, runtime detection, integrated preview, element selection, and confirmed
  deploy plans for Vercel, Firebase Hosting, Supabase, and GitHub Pages.
- Responsive landing page with 14 product sections, light and dark themes, metadata, accessibility
  tests, and Lighthouse CI.

### Changed

- Local AI CLI adapters now resolve executables from desktop-safe Homebrew and user tool locations,
  decode vendor JSON/JSONL into chat text and measured usage, run in the active workspace, and report
  native PTY failures separately from a missing executable.
- Unix installs repair the executable bit on the native `node-pty` spawn helper, preventing a valid
  Claude Code, Codex, or OpenCode installation from being reported as unavailable.
- Failed or cancelled agent workflows now restore a real pre-run checkpoint made from readable
  workspace context, including failures that happen before a changed-file record is returned.
- Next.js project creation keeps dependency installation and Git initialization under separate user
  choices, static projects can auto-start the built-in preview, and preview startup waits for its
  event listener before launching the process.
- Local project and integration processes now discover tools in standard Homebrew, pnpm, npm, Bun,
  Volta, asdf, and NVM locations while continuing to exclude credentials from the child environment.
- Electron is now a desktop build dependency rather than a packaged runtime dependency. A local
  macOS arm64 directory package includes the rebuilt `node-pty` module and passes a packaged Claude
  Code PTY smoke test.
- Light and dark theme controls are now directly available from both workspace modes, not only Home
  and Settings.
- Documentation now matches the result-oriented Simple mode, current terminal limitation, measured
  coverage, and installer-specific `PATH` behavior.
- Documentation validation now checks local anchors, required README sections, all six Mermaid flows,
  and the provider, integration, template, agent, and future plugin extension guides.
- Simple mode is now a result-oriented preview and project-assistant experience without IDE chrome;
  Monaco, Explorer, terminal, Git internals, diffs, agents, and technical panels live in Advanced.
- Approved agent commands are independently classified, parsed without a shell, workspace-bound,
  executable-allowlisted, and sanitized; approved edits still become review proposals.
- The Advanced workspace and Monaco integration now load on demand, reducing the Simple-mode initial
  renderer to about 316 kB JavaScript (93 kB gzip).

- Desktop and landing now share a restrained `V/` identity, warm neutral surfaces, a copper signal
  color, denser layouts, flatter controls, and role-specific icons instead of decorative AI motifs.
- Workspace, scaffold, Git, and deploy processes now inherit only an allowlisted, credential-free
  environment.
- Automatic agent commits now stage only files attributed to the completed agent run and preserve
  unrelated workspace changes.
- Remote provider endpoints require HTTPS outside loopback; explicitly local providers may still use
  private-network HTTP.
- Packaging metadata now uses the public `spx miguel` identity and GitHub noreply address.
- Release automation is manual and requires an exact typed confirmation before publishing anything.
- Unit and integration tests now have separate Vitest configurations and CI checks.
- Desktop packaging targets macOS arm64/x64, Windows x64, and Linux x64, with additional Linux arm64
  AppImage configuration; local artifacts remain unsigned by default.
- Electron Builder and its Windows packaging dependency were upgraded to address high-severity
  transitive vulnerabilities.
- Vulnerable transitive DOMPurify, UUID, and esbuild versions are overridden with patched releases;
  the resolved dependency graph has no known audit advisory.
- The runtime runner accepts only detected actions and starts processes without a shell.
- Provider context is redacted in the main process before remote transmission.
- Desktop development and packaging use a dedicated tsup runtime configuration that bundles internal
  workspace packages instead of asking Electron to load their TypeScript sources.

### Security

- Desktop CSP, real-path enforcement for integration working directories, strict confirmation types,
  and runtime permission ID validation were added.
- Destructive command matching now covers separated and long recursive-force flags, Windows recursive
  removal, `git clean`, and batch deletion; repository history scanning covers common private-key
  headers.
- Repository audit and pre-push checks reject known credential filenames and secret patterns.
- Filesystem writes are atomic and reject traversal, unsafe symlinks, sensitive files, mass deletion,
  and paths outside the trusted workspace.
- Git push, pull request creation, remote project creation, and production deployment remain opt-in.

No stable release has been published yet.
