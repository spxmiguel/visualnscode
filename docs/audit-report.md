# Audit Report — VisualnsCode 0.1.0-dev

**Date:** 2026-07-12  
**Auditor:** Automated (Claude Sonnet 4.6) + Manual review  
**Scope:** Full codebase — architecture, security, performance, accessibility, test coverage, documentation

---

## Executive summary

The project has a solid foundation: proper monorepo structure, contextIsolation/sandbox Electron security, secret storage via `safeStorage`, and input validation on all IPC channels. The main risks are related to features that are still stubs (terminal, real file editing in the UI, full deploy flow) and to the absence of code-signing for released binaries.

---

## Findings

### Critical

None identified.

---

### High

| #   | File                                                   | Finding                                                                                                                   | Status                                                                                                   |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| H1  | `apps/desktop/src/main/services/filesystem-service.ts` | Lexical path checks did not resolve symlink destinations, allowing a link inside the workspace to target an external file | Fixed — real workspace root, `realpath` containment, direct-symlink rejection and safe parent resolution |
| H2  | `apps/desktop/src/main/ipc.ts`                         | `fs:delete` previously accepted deletion without an explicit confirmation flag                                            | Fixed — confirmation is required, workspace-root deletion is blocked, and directory size is limited      |
| H3  | `apps/desktop/src/main/services/secret-scanner.ts`     | High-entropy base64 regex had backtracking risk                                                                           | Fixed — removed unbounded lookahead                                                                      |
| H4  | `apps/desktop/src/main/services/provider-service.ts`   | Remote provider context was accepted without an enforced main-process redaction pass                                      | Fixed — messages and context are redacted immediately before remote streaming                            |

---

### Medium

| #   | Area          | Finding                                                                                               | Resolution                                                                              |
| --- | ------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| M1  | Git IPC       | `git:commit` accepts arbitrary message; no Conventional Commits enforcement                           | Low-priority — UI can suggest format but enforcement is user's choice                   |
| M2  | Runner        | Dev server stdout is streamed to renderer unescaped — XSS risk in future HTML terminal                | Issue #14 created                                                                       |
| M3  | Preload       | `scaffold:create` is fire-and-forget (`send`); errors are reported via events but no timeout          | Issue #15 created                                                                       |
| M4  | Tests         | Filesystem, secret, command, diff, checkpoint, and edit-application paths lacked direct service tests | Fixed — dedicated Node suites cover the security boundaries                             |
| M5  | Accessibility | Diff review controls lacked explicit names and pressed states                                         | Fixed — block, file, view, edit, and action controls expose accessible labels and state |

---

### Low

| #   | Area              | Finding                                                                                |
| --- | ----------------- | -------------------------------------------------------------------------------------- |
| L1  | Dependencies      | `@monaco-editor/react` bundles Monaco (~4 MB); lazy-load candidate                     |
| L2  | ExplorerPanel     | Hidden files other than `.gitignore` and `.env.example` not shown; `.gitkeep` excluded |
| L3  | CheckpointService | JSON format for checkpoints; large workspaces may produce large files                  |
| L4  | RunnerService     | No child process kill timeout before SIGKILL                                           |
| L5  | BottomPanel       | Git panel does not handle concurrent fetch clicks (race condition)                     |

---

### Improvements

| #   | Area          | Suggestion                                                                                                                     |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| I1  | DiffViewer    | Completed — file and block selection, unified/side-by-side views, and edit-before-apply are connected to the safe edit service |
| I2  | GitPanel      | Show branch list inline; allow checkout from UI                                                                                |
| I3  | Templates     | Cache `pnpm create` results to speed up repeated scaffolding                                                                   |
| I4  | RunnerService | Detect port from stdout automatically and auto-open preview                                                                    |
| I5  | Preview       | Add element picker for sending clicked component to chat                                                                       |

---

## Security checklist

| Check                               | Result                                                |
| ----------------------------------- | ----------------------------------------------------- |
| Electron contextIsolation           | ✅ Enabled                                            |
| Electron sandbox                    | ✅ Enabled                                            |
| `nodeIntegration` disabled          | ✅                                                    |
| All IPC inputs validated            | ✅                                                    |
| Credentials via `safeStorage`       | ✅                                                    |
| Logs sanitised                      | ✅                                                    |
| Secret scanner on file context      | ✅                                                    |
| Path traversal blocked              | ✅                                                    |
| Command classification              | ✅                                                    |
| No `.env` committed                 | ✅                                                    |
| No hardcoded secrets                | ✅                                                    |
| Binary code-signing                 | ⏳ Planned (requires Apple Dev cert, Windows EV cert) |
| Content Security Policy in renderer | ⚠️ Default CSP — tighten before 1.0                   |

---

## Test coverage summary

| Package / app                                        | Tests                  | Coverage (est.)                                                      |
| ---------------------------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `@visualnscode/integrations`                         | 11                     | ~65%                                                                 |
| `@visualnscode/providers`                            | 8                      | ~60%                                                                 |
| `@visualnscode/agents`                               | 6                      | ~55%                                                                 |
| `@visualnscode/desktop` (renderer)                   | 12                     | ~40%                                                                 |
| `@visualnscode/desktop` (security and edit services) | 35+ focused assertions | Paths, symlinks, secrets, commands, diffs, checkpoints, and rollback |
| `@visualnscode/ui`                                   | 4                      | ~50%                                                                 |
| `apps/landing`                                       | 0                      | —                                                                    |

---

## Build status

| Target           | Status               |
| ---------------- | -------------------- |
| Lint             | ✅ 0 warnings        |
| TypeScript       | ✅ No errors         |
| Unit tests       | ✅ Pass              |
| Desktop build    | ✅ (dev mode)        |
| Landing build    | ✅                   |
| E2E (Playwright) | ✅ Smoke test passes |

---

## Known risks

1. **No code signing** — macOS Gatekeeper will block the `.pkg` until the app is signed and notarised. Linux and Windows are unaffected.
2. **No auto-update** — users must manually download new versions until `electron-updater` is integrated.
3. **Terminal is a stub** — the terminal panel shows static text; `node-pty` integration is planned.
4. **Checkpoint confidentiality** — checkpoints use owner-only file permissions but are not encrypted; normal source files can be present in local snapshot JSON.

---

## Issues created from this audit

- [#14] Runner: sanitise stdout before renderer display
- [#15] Scaffold: add timeout and error propagation to fire-and-forget create flow
- [#16] Add unit tests for filesystem, git, runner, and scaffold services
- [#17] Accessibility: aria-labels on DiffViewer and GitPanel interactive elements

---

## Next steps

1. Add node-pty terminal execution through the command policy.
2. Add platform CI coverage for filesystem path behavior on Windows and Linux.
3. Sign and notarise macOS builds with Apple Developer Program credentials.
4. Consider encrypted checkpoint storage for high-confidentiality workspaces.
