# Audit report — VisualnsCode 0.1.0 alpha

- Review date: 2026-07-20
- Scope: architecture, security boundaries, accessibility, tests, documentation, dependencies,
  packaging, and GitHub automation
- Method: static source review plus the commands listed under Verification

## Executive summary

No open Critical or High source finding was identified in this review. Earlier path, deletion,
redaction, and secret-scanner findings are covered by dedicated service tests. The remaining release
risks are material but expected for an alpha: unsigned binaries, incomplete packaged-app testing,
no complete interactive terminal surface, no SQLite migration, and no stable plugin sandbox.

The repository must continue to be treated as source-first until an explicitly approved release is
published.

## Findings

### Critical

None identified.

### High

None open. The following previously high-risk boundaries have implemented mitigations:

| Boundary          | Mitigation                                                                      |
| ----------------- | ------------------------------------------------------------------------------- |
| Workspace paths   | Lexical and real-path containment, unsafe-symlink rejection, atomic writes      |
| Deletion          | Explicit confirmation, workspace-root block, directory-size and proposal limits |
| Remote AI context | Main-process sensitive-file omission and value redaction                        |
| Secret scanning   | Bounded patterns covered by focused tests                                       |

### Medium

| Area                 | Finding                                                                                                  | Current control                                                         | Required follow-up                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Distribution         | macOS and Windows artifacts are unsigned; macOS hardened runtime is disabled                             | No public release and manual publish confirmation                       | Signing, hardened runtime, notarization, checksums, and provenance before stable |
| Desktop web security | A strict production Content Security Policy is not explicitly documented in the renderer entry point     | Renderer sandbox, context isolation, no Node integration, named preload | Add and test a restrictive CSP before stable                                     |
| Platform coverage    | Main-process services are not exercised as packaged apps on every target OS                              | Linux CI builds and mocked cross-platform service tests                 | Add packaged Electron E2E on macOS, Windows, and Linux                           |
| Terminal             | The bottom-panel terminal is an explicit non-functional surface while provider CLIs use constrained PTYs | No generic renderer shell; command services remain named                | Complete an isolated interactive terminal and its approval UX                    |

### Low

| Area          | Finding                                                                        | Follow-up                                          |
| ------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| Checkpoints   | Owner-only JSON snapshots can contain normal source code and are not encrypted | Offer encrypted high-confidentiality workspaces    |
| Monaco        | Editor resources are a large part of the renderer bundle                       | Measure startup and lazy-load further where useful |
| Persistence   | Several bounded histories use JSON rather than migrations                      | Move authoritative metadata to versioned SQLite    |
| Issue tracker | Some open feature issues describe capabilities already implemented             | Close or rewrite them after maintainer review      |
| Dependencies  | One low-severity esbuild development-server advisory remains                   | Upgrade when Vite supports the patched esbuild     |

### Improvements

- Add coverage instrumentation and thresholds by security boundary.
- Add an SBOM, artifact attestations, and documented checksum verification.
- Add a dependency-license policy alongside Dependabot and dependency review.
- Complete a manual WCAG 2.2 AA audit for both desktop and landing.

## Security posture

| Control                                                 | Status                                       |
| ------------------------------------------------------- | -------------------------------------------- |
| `contextIsolation` and renderer sandbox                 | Enabled                                      |
| `nodeIntegration`                                       | Disabled                                     |
| Named preload surface and validated IPC                 | Implemented                                  |
| OS-backed provider credential encryption                | Implemented; insecure Linux backend rejected |
| Secret scanning and remote-context redaction            | Implemented                                  |
| Traversal and unsafe-symlink rejection                  | Implemented                                  |
| Command risk classes and constrained YOLO mode          | Implemented                                  |
| Confirmation for remote mutations and production deploy | Implemented                                  |
| Repository secret audit before push                     | Implemented through Husky                    |
| Binary signing and notarization                         | Not implemented                              |

## Test organization

- Unit suite: packages, renderer behavior, and shared edit model.
- Integration suite: filesystem, edits, secrets, Git/GitHub, scaffold, runner, preview, and deployment
  services using temporary directories and fake executors.
- E2E suite: landing behavior and automated Axe checks in Chromium.
- Lighthouse: built landing page against checked-in budgets.

The project does not claim a percentage coverage figure because the coverage provider and enforced
threshold are not configured.

The dependency audit has no Critical, High, or Moderate finding after applying patched transitive
DOMPurify and UUID overrides. One Low development-server advisory remains.

## Verification

The documented release gate is:

```bash
pnpm docs:check
pnpm format:check
pnpm check:structure
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:lighthouse
pnpm security:audit
```

Run results belong in the pull request or release record; this report does not treat a historical pass
as proof for a later commit.

## Next security milestones

1. Add a strict production CSP and packaged-app security test.
2. Enable hardened runtime, signing, notarization, checksums, and provenance.
3. Exercise packaged artifacts on every supported architecture.
4. Complete terminal isolation and SQLite migrations.
5. Threat-model and approve the plugin host in a new ADR before loading third-party code.
