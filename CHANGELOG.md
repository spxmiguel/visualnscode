# Changelog

All notable changes are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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

- Release automation is manual and requires an exact typed confirmation before publishing anything.
- Unit and integration tests now have separate Vitest configurations and CI checks.
- Desktop packaging targets macOS arm64/x64, Windows x64, and Linux x64, with additional Linux arm64
  AppImage configuration; local artifacts remain unsigned by default.
- Electron Builder and its Windows packaging dependency were upgraded to address high-severity
  transitive vulnerabilities.
- Vulnerable transitive DOMPurify and UUID versions are overridden with patched releases; the
  remaining audit finding is a low-severity development-server advisory.
- The runtime runner accepts only detected actions and starts processes without a shell.
- Provider context is redacted in the main process before remote transmission.

### Security

- Repository audit and pre-push checks reject known credential filenames and secret patterns.
- Filesystem writes are atomic and reject traversal, unsafe symlinks, sensitive files, mass deletion,
  and paths outside the trusted workspace.
- Git push, pull request creation, remote project creation, and production deployment remain opt-in.

No stable release has been published yet.
