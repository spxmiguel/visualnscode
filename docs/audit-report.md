# Final audit report — VisualnsCode 0.1.0 alpha

- Audit date: 2026-07-20
- Repository: [spxmiguel/visualnscode](https://github.com/spxmiguel/visualnscode)
- Scope: architecture, security, performance, accessibility, user experience, test coverage,
  documentation, visual consistency, duplication, dependencies, error handling, credentials,
  command execution, and cross-platform behavior
- Method: manual source review, targeted threat analysis, repository and history secret scan,
  measured coverage, clone detection, dependency/license inspection, and the complete verification
  matrix below

## Executive summary

No Critical finding was identified. Six High findings were found and corrected during the audit:
workspace processes no longer inherit credential-bearing environment variables; integration CLIs can
no longer trust a renderer-supplied directory outside the workspace; agent commits exclude unrelated
user changes; remote providers require encrypted transport; destructive command variants and private
key formats are detected more completely; and public packaging metadata no longer contains a personal
email or the wrong maintainer identity. A restrictive desktop Content Security Policy was also added.

The codebase is credible as an alpha source distribution, not as a stable binary release. The largest
remaining risks are unsigned artifacts, missing packaged-desktop E2E and accessibility gates, direct
JSON persistence for credentials and settings, incomplete preview-message validation, and 0% direct
integration coverage in two privileged services. Every open Medium and Low finding has a linked
GitHub issue.

## Finding summary

| Severity    | Found | Fixed now | Open |
| ----------- | ----: | --------: | ---: |
| Critical    |     0 |         0 |    0 |
| High        |     6 |         6 |    0 |
| Medium      |     6 |         1 |    5 |
| Low         |     3 |         0 |    3 |
| Improvement |     4 |         1 |    3 |

## Critical

None identified.

## High — corrected

| ID   | Area                    | Finding                                                                                                      | Resolution                                                                                                |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| H-01 | Process execution       | Runner, scaffold, Git, and deploy processes inherited all of `process.env`, exposing host tokens to scripts. | Central allowlist keeps OS runtime values and removes API, CI, GitHub, and deploy credentials.            |
| H-02 | Workspace isolation     | Firebase, Vercel, and Supabase accepted a renderer-labelled trusted directory outside the active workspace.  | Real paths are checked against the active workspace; external paths require the dedicated permission.     |
| H-03 | Agent version control   | Optional agent commits staged every dirty file, including unrelated work that existed before the task.       | Only paths explicitly attributed to completed agent runs are eligible for staging.                        |
| H-04 | Provider transport      | Remote provider settings accepted plaintext HTTP endpoints outside loopback.                                 | Remote endpoints require HTTPS; HTTP remains available for loopback and explicitly local providers.       |
| H-05 | Destructive commands    | Long or separated recursive-force flags could avoid the blocked class; the history scan missed key variants. | `rm`, Windows `rmdir`, `git clean`, and batch deletion rules were hardened; RSA/EC/OpenSSH/DSA are found. |
| H-06 | Public identity/privacy | Linux package metadata exposed a personal Gmail address and a maintainer name different from `spx miguel`.   | Packaging now uses `spx miguel` and the GitHub-generated noreply address.                                 |

The desktop renderer also gained an explicit Content Security Policy restricting scripts, workers,
frames, connections, forms, and object content. Runtime confirmation checks now require real booleans,
and unknown permission identifiers are rejected.

## Medium — open or partially resolved

| ID   | Area                  | Finding                                                                                                    | Status and issue                                                                                           |
| ---- | --------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| M-01 | Distribution          | macOS and Windows artifacts are unsigned; macOS hardened runtime remains disabled.                         | Open: [#8 — signing and notarization](https://github.com/spxmiguel/visualnscode/issues/8).                 |
| M-02 | Security coverage     | `provider-service` and `secure-storage` have 0% direct integration coverage; agent coverage is now 68.3%.  | Open: [#22 — privileged-service coverage](https://github.com/spxmiguel/visualnscode/issues/22).            |
| M-03 | Credential durability | Credential, settings, memory, and history JSON writes are not uniformly atomic or recoverable.             | Open: [#21 — atomic persistence and recovery](https://github.com/spxmiguel/visualnscode/issues/21).        |
| M-04 | Preview trust         | The iframe source is verified, but bridge payload fields and total sizes are not completely bounded.       | Open: [#24 — preview bridge validation](https://github.com/spxmiguel/visualnscode/issues/24).              |
| M-05 | Platform/a11y         | CI builds desktop targets but does not run packaged Electron or Axe/keyboard checks across supported OSes. | Open: [#25 — packaged E2E and desktop accessibility](https://github.com/spxmiguel/visualnscode/issues/25). |
| M-06 | Desktop web security  | The renderer had no explicit Content Security Policy.                                                      | Fixed in this audit; production and development builds pass with the policy.                               |

The incomplete generic terminal remains a functional alpha limitation tracked by
[#1](https://github.com/spxmiguel/visualnscode/issues/1), not an exposed arbitrary-shell feature.

## Low — open

| ID   | Area              | Finding                                                                                                   | Issue                                                                                                   |
| ---- | ----------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| L-01 | Dependencies      | `pnpm audit` reports one Low esbuild development-server advisory through Vite.                            | [#23 — compatible Vite upgrade](https://github.com/spxmiguel/visualnscode/issues/23).                   |
| L-02 | Local persistence | Checkpoints and histories are owner-only but normal source content is not encrypted and lacks migrations. | [#27 — confidential storage and SQLite](https://github.com/spxmiguel/visualnscode/issues/27).           |
| L-03 | Maintainability   | Five source modules exceed 650 lines; small clones exist in providers, onboarding, environment, and CSS.  | [#26 — split modules and consolidate duplication](https://github.com/spxmiguel/visualnscode/issues/26). |

## Improvements

- Coverage is now measurable with `pnpm test:coverage`; per-boundary thresholds remain to be set in
  [#22](https://github.com/spxmiguel/visualnscode/issues/22).
- Add an SBOM, checksums, artifact attestations, and provenance before a stable release.
- Add an explicit dependency-license policy. Production licenses currently resolve to MIT, ISC,
  BSD-2-Clause, Apache-2.0, MPL-2.0, or their declared combinations.
- Threat-model and approve a plugin host ADR before loading third-party code.

## Architecture and API assessment

The dependency direction remains sound: applications compose pure packages, the renderer has no
Node.js access, preload exposes named operations, and main-process services own privileged effects.
No package cycle or arbitrary IPC channel was found. TypeScript strict checks pass without ignored
errors or application-level `any` escapes.

The principal maintainability pressure is composition size rather than package design. `ipc.ts`
(834 lines), `VersionControlPanel.tsx` (804), `scaffold-service.ts` (750), landing `Sections.tsx`
(671), and `RightWorkspacePanel.tsx` (659) should be divided by domain. Clone detection across 192
files reported seven clones and 156 duplicated lines, or 0.65%; this is low and below the 1% follow-up
ceiling.

## Security assessment

### Implemented controls

- Electron sandbox, context isolation, disabled Node integration, CSP, and denied window creation.
- Named preload capabilities and runtime IPC payload limits.
- Lexical and real-path containment, symlink rejection, atomic workspace writes, sensitive-file
  blocking, bounded deletion, checkpoints, and rollback.
- Remote-context secret scanning and redaction plus sanitized provider and deploy logs.
- OS-backed `safeStorage`; insecure Linux `basic_text` is rejected.
- Fixed executable/argument arrays without a shell, filtered child environments, command risk
  classes, and constrained YOLO behavior.
- HTTPS for remote providers and loopback-only integrated preview origins.
- Confirmation for remote GitHub mutations and all deploys; production deploy confirmation is
  rechecked by the main service.
- Repository scan of tracked files and all Git revisions for known keys and private-key headers.

### Residual security risks

Renderer compromise remains a meaningful trust event until packaged desktop tests and a mature CSP
regression gate exist. JSON persistence needs atomic recovery. Preview content is sandboxed and
source-checked, but payload validation must be completed. Signed binaries and update provenance do
not exist; users must build from source and keep independent backups.

## Performance, accessibility, and UX

- Desktop initial renderer: approximately 316 kB JavaScript, 93 kB gzip. The 191 kB/48 kB gzip
  Advanced workspace and Monaco workers load only after the user opens the IDE.
- Landing production bundle: approximately 229 kB JavaScript, 71 kB gzip.
- Lighthouse CI passes the checked-in performance, accessibility, best-practices, and SEO budgets.
- Landing Playwright runs Axe in desktop and mobile journeys. No automated violation is open.
- Desktop has responsive panel constraints, keyboard shortcuts, labelled icon controls, friendly
  empty/error states, persistent themes, and Simple/Advanced language.
- A complete desktop keyboard and WCAG 2.2 AA audit is still required in issue #25.

Visual tokens and shared controls are consistent across desktop and the UI catalog. The landing uses
the same restrained neutral/accent system and represents the running desktop product. The largest UX
limitation is the non-functional generic terminal surface; provider CLIs
remain functional through constrained PTYs.

## Test coverage

| Suite       | Files | Tests | Statements | Branches | Functions |  Lines |
| ----------- | ----: | ----: | ---------: | -------: | --------: | -----: |
| Unit        |    16 |    57 |     50.09% |   42.28% |    43.94% | 50.00% |
| Integration |    12 |    89 |     63.62% |   52.85% |    68.11% | 66.81% |

Coverage is reported separately because unit tests run in jsdom while main-service integration tests
run in Node. High-value filesystem, edit, secret, runner, scaffold, preview, Git, GitHub, deploy, and
environment boundaries have direct tests. Agent composition, approval, local actions, review-only
edits, persistence, and workspace-scoped memory now have direct tests. Provider composition and the
Electron credential wrapper remain the most important gaps.

## Dependencies and compatibility

- 962 resolved dependencies; audit result: 0 Critical, 0 High, 0 Moderate, 1 Low.
- No direct dependency is flagged as deprecated by `pnpm outdated`.
- Five deprecated transitive utilities remain in packaging/tooling trees; none introduces a separate
  audit advisory.
- macOS arm64/x64, Windows x64, and Linux x64 targets are configured. Linux arm64 AppImage is also
  configured, but packaged execution has not been proven on the full matrix.
- Source and service logic avoid shell parsing and use Node path APIs, `windowsHide`, platform
  executable detection, and portable pnpm commands. Packaging verification remains M-05.

## Verification matrix

The final audit gate is:

```bash
pnpm docs:check
pnpm format:check
pnpm check:structure
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm test:lighthouse
pnpm build
pnpm security:audit
pnpm dependencies:audit
```

All project checks and builds pass. `pnpm audit` exits non-zero only for the documented Low esbuild
advisory. The repository secret audit scanned the complete tracked tree and every Git revision without
finding a known secret.

## Release recommendation

Source distribution may continue as alpha. Do not publish a stable installer until M-01, M-02,
M-03, and M-05 are closed. Any alpha binary should be clearly marked unsigned, include checksums,
and tell users to keep an independent copy of their workspace.
