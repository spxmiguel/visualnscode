# ADR-0001: Use Electron for the desktop application

- Status: Accepted
- Date: 2026-07-11

## Context

The application combines a productive web UI with workspace files, terminals, local processes, and
distribution for macOS, Windows, and Linux. The project should share TypeScript contracts between the
UI and local backend and use the Monaco ecosystem.

## Decision

Use Electron with separate main, preload, and renderer contexts. Set `nodeIntegration: false`,
`contextIsolation: true`, and renderer sandboxing. Expose local capabilities through a minimal preload
API and validated, named IPC.

## Consequences

- Web technologies and TypeScript can be shared across platforms.
- The binary and memory footprint are larger than a native or lightweight webview shell.
- Electron/Chromium updates, hardening, and strict IPC review are continuous responsibilities.
- Blocking and privileged work must not run in the renderer and should not block the main event loop.
