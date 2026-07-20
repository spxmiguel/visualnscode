# ADR-0006: Use an operating-system-backed credential vault

- Status: Accepted
- Date: 2026-07-12

## Context

Remote providers require secrets. Local storage, Zustand, unencrypted SQLite, and renderer
configuration files can leak through logs, backups, exports, or compromised web content.

## Decision

Use Electron `safeStorage` in the main process. Store only base64-encoded ciphertext in an owner-only
file. Return only `configured: boolean` to the renderer, allowlist credential IDs, and reject Linux's
`basic_text` backend. CLIs remain responsible for their own authentication stores; VisualnsCode does
not copy their tokens.

## Consequences

- Provider secrets do not enter persisted UI state or read IPC.
- Save and removal require credential permission and explicit user action.
- Systems without a secure keyring must configure one before VisualnsCode can persist a key.
- Rotation, migration, and expiry need explicit future UX.
- Tests inject a fake vault and never use real credentials.
