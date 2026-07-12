# Development

## Setup

```bash
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode
pnpm install
```

## Dev commands

| Command | What it does |
|---|---|
| `pnpm dev` | Electron app with hot-reload |
| `pnpm dev:landing` | Landing page (Vite dev server) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm test:e2e` | End-to-end tests (Playwright) |
| `pnpm lint` | ESLint (zero warnings) |
| `pnpm typecheck` | TypeScript `tsc --noEmit` across all packages |
| `pnpm format` | Prettier |
| `pnpm build` | Production build |

## Repository structure

```
visualnscode/
├── apps/
│   ├── desktop/          # Electron main + preload + renderer (React)
│   └── landing/          # Marketing site (Vite + React)
├── packages/
│   ├── agents/           # Agent contracts, workflow engine, default agents
│   ├── config/           # Shared constants (tool IDs, permissions)
│   ├── core/             # Pure domain logic (command classifier, templates)
│   ├── integrations/     # CLI integrations (GitHub, Firebase, Vercel, Supabase)
│   ├── providers/        # AI provider adapters
│   ├── types/            # Shared TypeScript types
│   └── ui/               # Shared React components
├── docs/                 # All documentation
├── scripts/              # Install scripts, CI helpers
└── .github/              # Workflows, issue templates, PR template
```

## Adding a package

```bash
pnpm --filter @visualnscode/your-package add some-dep
```

Add the package to `pnpm-workspace.yaml` if creating a new one.

## IPC conventions

All Electron IPC channels follow the pattern `namespace:action`:

- `fs:read-file` — handle (invoke/handle)
- `runner:start` — fire-and-forget (send/on)
- `chat:chunk` — pushed to renderer (send from main)

Never expose raw filesystem paths or Node.js APIs directly in the preload — only typed IPC calls.

## Adding an IPC channel

1. Add the handler to `apps/desktop/src/main/ipc.ts`.
2. Expose it in `apps/desktop/src/preload/index.ts`.
3. Add the type signature to `apps/desktop/src/renderer/electron.d.ts`.

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(desktop): add diff viewer component
fix(git): handle detached HEAD state
docs: add deployment guide
test(fs): cover path traversal cases
chore: bump electron to 43.2.0
```

## Architecture decisions

All significant decisions are documented as ADRs in `docs/decisions/`. Read them before making architectural changes.
