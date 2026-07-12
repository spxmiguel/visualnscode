# CLI detection

VisualnsCode detects installed tools by running version commands and parsing their output. Detection is read-only and never installs anything without confirmation.

## How detection works

Each tool definition in `packages/integrations/src/tools/` includes:

```typescript
{
  id: 'git',
  name: 'Git',
  versionCommand: ['git', '--version'],
  versionPattern: /git version (\S+)/,
  installUrl: 'https://git-scm.com',
}
```

The environment service runs `versionCommand` using `execFile` (no shell injection), parses the output with `versionPattern`, and returns:

```typescript
{
  id: 'git',
  installed: true,
  version: '2.47.0',
  path: '/usr/bin/git',
  error: null,
}
```

## Detected tools

| ID | Tool | Version flag |
|---|---|---|
| `git` | Git | `git --version` |
| `gh` | GitHub CLI | `gh --version` |
| `node` | Node.js | `node --version` |
| `npm` | npm | `npm --version` |
| `pnpm` | pnpm | `pnpm --version` |
| `yarn` | Yarn | `yarn --version` |
| `bun` | Bun | `bun --version` |
| `firebase` | Firebase CLI | `firebase --version` |
| `vercel` | Vercel CLI | `vercel --version` |
| `supabase` | Supabase CLI | `supabase --version` |
| `docker` | Docker | `docker --version` |
| `python` | Python | `python3 --version` |
| `claude` | Claude Code | `claude --version` |
| `codex` | Codex CLI | `codex --version` |
| `gemini` | Gemini CLI | `gemini --version` |
| `aider` | Aider | `aider --version` |
| `opencode` | OpenCode | `opencode --version` |
| `ollama` | Ollama | `ollama --version` |
| `lmstudio` | LM Studio | `lms --version` |

## Adding a new tool

1. Create `packages/integrations/src/tools/my-tool.ts`.
2. Export a `ToolDefinition` object.
3. Register it in `packages/integrations/src/tool-registry.ts`.

The onboarding assistant and environment detection will pick it up automatically.

## Security

- Detection uses `execFile` (not `exec`) to prevent shell injection from tool IDs.
- Tool IDs are validated against a known allow-list before any command is run.
- Installation commands always require user confirmation before execution.
