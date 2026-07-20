# Development guide

## Setup

```bash
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode
pnpm install --frozen-lockfile
```

## Commands

| Command                             | Purpose                                                        |
| ----------------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                          | Electron desktop development mode                              |
| `pnpm dev:landing`                  | Landing Vite server                                            |
| `pnpm dev:ui`                       | Shared component catalog                                       |
| `pnpm docs:check`                   | Required docs, local links, README sections, and Mermaid flows |
| `pnpm check:structure`              | Required monorepo packages and apps                            |
| `pnpm format` / `pnpm format:check` | Write or verify Prettier formatting                            |
| `pnpm lint`                         | ESLint with zero warnings                                      |
| `pnpm typecheck`                    | Root and workspace TypeScript checks                           |
| `pnpm test:unit`                    | Pure package and renderer tests                                |
| `pnpm test:integration`             | Main-process service tests with fakes                          |
| `pnpm test`                         | Unit followed by integration tests                             |
| `pnpm test:coverage`                | Separate unit and integration V8 coverage reports              |
| `pnpm test:e2e`                     | Playwright landing journeys and accessibility                  |
| `pnpm test:lighthouse`              | Production landing build and Lighthouse CI                     |
| `pnpm build`                        | Build all workspaces with a build script                       |
| `pnpm security:audit`               | Scan tracked files and Git history for secret patterns         |
| `pnpm dependencies:audit`           | Check the resolved dependency graph for known advisories       |
| `pnpm changeset`                    | Describe a release-relevant package change                     |
| `pnpm version-packages`             | Consume Changesets and update package versions/changelogs      |

## Repository layout

The desktop renderer, preload, and main process live in `apps/desktop`. The landing app is completely
separate in `apps/landing`. `apps/ui-docs` documents shared components. Stable contracts and reusable
logic live in `packages`; product composition stays in `apps`.

## Electron IPC conventions

Channels use `namespace:action`, for example `fs:read-file` or `chat:send`. Add a capability in this order:

1. Define or reuse a serializable request/result type.
2. Add validation and a handler in the main-process IPC composition.
3. Expose one named preload method.
4. Add the renderer type declaration.
5. Test a valid request, invalid payload, denied permission, and sanitized error.

Never expose raw `ipcRenderer`, Node.js APIs, a general filesystem function, or arbitrary command
execution through preload.

## Extension paths

- [Add an AI provider](./providers.md#adding-a-provider)
- [Add a tool integration](./integrations.md#adding-an-integration)
- [Add a project template](./project-templates.md#adding-a-template)
- [Add an agent](./agents.md#adding-an-agent-programmatically)
- [Design against the future plugin contract](./plugins.md)

Use a new ADR when a change adds a privilege, alters package dependency direction, changes storage,
or creates a new process or trust boundary.

## Git workflow

Husky runs lint-staged, typecheck, and unit tests before commit. Pre-push runs the repository security
audit and integration tests. Use Conventional Commits and add a Changeset for user-visible behavior.
The full policy is in [CONTRIBUTING.md](../CONTRIBUTING.md).
