# Security Model

VisualnsCode is designed around the principle that **AI should never act silently on your files**.

## Core principles

1. **Propose, then apply** — every AI-generated file change goes through a diff review before being written.
2. **Workspace isolation** — all filesystem operations are locked to the open project folder. Path traversal is blocked at the IPC layer.
3. **Secret detection** — before any content is sent to a remote AI provider, it is scanned for API keys, tokens, private keys, and database connection strings.
4. **Command classification** — every shell command is classified before execution: `safe`, `confirm`, `dangerous`, or `blocked`.
5. **Credentials in the OS keychain** — API keys are stored via Electron `safeStorage` (AES-256 backed by the OS credential store). Keys are never written to disk in plain text.
6. **Sanitized logs** — all log output is passed through a redaction filter before being displayed or persisted.

## Edit flow

```
AI proposes change
    ↓
Secret scan on proposed content
    ↓
Diff viewer (side-by-side Monaco diff editor)
    ↓
User accepts / rejects / edits
    ↓
Checkpoint created (rollback point)
    ↓
File written to disk
```

## Command classification

| Class | Examples | Behavior |
|---|---|---|
| `safe` | `ls`, `echo`, `cat` | Executed immediately |
| `confirm` | `npm install`, `git push`, `rm` | Requires explicit user confirmation |
| `dangerous` | `sudo`, `git push --force`, `npm publish` | Shown with warning, requires typed confirmation |
| `blocked` | `rm -rf`, `dd if=`, `diskpart`, `format` | Rejected outright, never executed |

## YOLO mode

YOLO mode reduces confirmation dialogs for `safe` and `confirm` commands. It:

- Must be explicitly enabled in Settings → Permissions.
- Shows a persistent banner while active.
- Cannot override `dangerous` or `blocked` classifications.
- Can be disabled globally from any screen.

## Secret detection

The scanner checks for:

- OpenAI API keys (`sk-…`)
- Anthropic API keys (`sk-ant-…`)
- AWS access keys (`AKIA…`)
- GitHub tokens (`ghp_…`)
- Bearer tokens in `Authorization` headers
- PEM private keys
- Database connection strings with embedded credentials

**Sensitive file names** (`.env`, `.env.local`, `credentials.json`, `.netrc`, `id_rsa`, `*.pem`, `*.key`) are fully redacted before being passed to any AI context.

## Path security

The `FilesystemService` resolves every relative path against the workspace root and verifies the resolved path still begins with the workspace root. Paths that escape the workspace (`../../../etc/passwd`) are rejected with an error at the service layer, before any IPC response is sent.

## Symlink handling

The filesystem service uses `fs.stat()` (which follows symlinks) and then checks the resolved path. Symlinks pointing outside the workspace are rejected by the path check.

## Credential storage

```
User enters API key
    ↓
IPC: environment:store-secret
    ↓
Main process: SecureStorage.set()
    ↓
Electron safeStorage.encryptString()
    ↓
Encrypted bytes written to user-data directory
```

Keys are retrieved in the main process only, decrypted in memory, and passed to the provider adapter. They are never sent to the renderer process.

## Network

Remote AI providers are contacted only when:

1. A provider is configured and enabled.
2. The user initiates a chat or agent task.
3. The content has been secret-scanned and redacted.

No telemetry or analytics requests are made.
