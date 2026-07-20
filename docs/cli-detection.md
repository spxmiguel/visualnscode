# CLI detection

Environment detection checks known executables and their version output. It is read-only and never
installs, authenticates, or changes configuration.

## Definition and result

Definitions live in `packages/integrations/src/tool-catalog.ts`:

```typescript
const git: ToolDefinition = {
  id: 'git',
  name: 'Git',
  command: 'git',
  category: 'core',
  documentationUrl: 'https://git-scm.com/downloads',
  versionArgs: ['--version'],
  install: {
    executable: 'brew',
    args: ['install', 'git'],
    description: 'Install Git with Homebrew',
    permission: 'install-dependencies',
    risk: 'write',
    timeoutMs: 180_000,
  },
};
```

The result has `id`, `status`, `installed`, `version`, `path`, and a plain-language `message`.
`findExecutable` resolves only the catalog command and declared alternatives. The version check runs
through the command runner without a shell.

## Detected tools

| ID          | Tool         | Command                                      |
| ----------- | ------------ | -------------------------------------------- |
| `git`       | Git          | `git --version`                              |
| `github`    | GitHub CLI   | `gh --version`                               |
| `node`      | Node.js      | `node --version`                             |
| `npm`       | npm          | `npm --version`                              |
| `pnpm`      | pnpm         | `pnpm --version`                             |
| `yarn`      | Yarn         | `yarn --version`                             |
| `bun`       | Bun          | `bun --version`                              |
| `firebase`  | Firebase CLI | `firebase --version`                         |
| `vercel`    | Vercel CLI   | `vercel --version`                           |
| `supabase`  | Supabase CLI | `supabase --version`                         |
| `docker`    | Docker       | `docker --version`                           |
| `python`    | Python       | `python3 --version`, then `python --version` |
| `claude`    | Claude Code  | `claude --version`                           |
| `codex`     | Codex CLI    | `codex --version`                            |
| `gemini`    | Gemini CLI   | `gemini --version`                           |
| `aider`     | Aider        | `aider --version`                            |
| `opencode`  | OpenCode     | `opencode --version`                         |
| `ollama`    | Ollama       | `ollama --version`                           |
| `lm-studio` | LM Studio    | `lms --version`                              |

## Adding a detected tool

Add one immutable definition to `toolCatalog`, including the official documentation URL. Add a fixed
installer only when the repository supports that operating-system path safely; otherwise the UI can
open the documentation. Then cover installed, missing, alternate-command, version-output, and command
failure cases in `packages/integrations/src/integrations.test.ts`.

Catalog entries appear in `detectAll`, but service-specific authentication and configuration do not.
Those operations require the explicit integration routing described in [Integrations](./integrations.md).
