# VisualnsCode

One desktop workspace for AI providers, coding agents, local tools, project execution, Git, and
deployment workflows.

VisualnsCode is built for people who want to make software without spending the first hour wiring
tools together. It keeps the beginner path simple, while an advanced mode exposes the editor,
terminal-related controls, Git, diffs, logs, models, agents, tasks, and permissions.

The project is open source and currently under active development.

## Features

- Desktop workspace with a file explorer, Monaco Editor, tabs, AI chat, preview, tasks, and status.
- Simple Mode for the main files, editor, chat, preview, run, and undo actions.
- Advanced Mode for Git, diffs, logs, tasks, providers, agents, settings, and permissions.
- Light and dark themes with persisted preferences and resizable panels.
- Streaming chat with cancellation, retry, conversation history, export, model selection, and file
  context.
- Provider adapters for OpenAI, Anthropic, Gemini, OpenRouter, Ollama, LM Studio, OpenAI-compatible
  endpoints, Claude Code, Codex CLI, Gemini CLI, Aider, and OpenCode.
- Agent definitions with autonomy, tool, folder, time, step, and cost limits.
- Sequential and parallel agent workflows with retry, cancellation, history, approvals, and
  rollback signals.
- Safe file editing through reviewable diffs, checkpoints, snapshots, and rollback.
- Workspace path validation, secret detection, context redaction, and command classification.
- Environment onboarding for Git, Node.js, package managers, deploy CLIs, local models, and coding
  agents.
- Real local Git status, staging, commits, branches, history, checkout, and stash operations.
- Project scaffolding from versioned React, Next.js, Electron, Node.js, Firebase, Supabase, landing,
  dashboard, portfolio, static, and empty templates.
- Local project execution with package-manager detection, process logs, stop/restart controls, and
  an integrated responsive web preview.

## Workspace

VisualnsCode has two interfaces over the same project.

Simple Mode keeps the workspace focused on the current file, the conversation, the running app,
and the actions needed to move forward. Advanced Mode exposes the underlying development tools and
the technical detail behind each action.

The desktop app uses Electron's isolated main and preload processes. File access, credentials,
commands, Git operations, providers, agent runs, and project processes cross a typed IPC boundary
instead of running directly in the renderer.

## AI Providers

Remote APIs, local servers, and installed CLIs implement the same provider contract. Each adapter
reports its models and capabilities, including streaming, tools, vision, file editing, context
size, estimated cost, and whether execution is local or remote.

API keys are stored through the operating system's secure storage. Logs are sanitized before they
are persisted, and tests use fake providers instead of real credentials.

## Agents

VisualnsCode includes Architect, Frontend Developer, Backend Developer, Debugger, Reviewer, Tester,
Documentation Writer, Security Auditor, DevOps, and Project Manager agents.

Agents can run alone or as a team. A workflow passes the original task, previous result, changed
files, errors, and relevant context to the next step. Ask, Guided, and Autonomous modes control how
much an agent can do without approval, while explicit permissions still define its limits.

## File Safety

AI-generated edits follow this flow:

```text
proposal -> diff -> review -> accept or reject -> checkpoint -> write -> undo when needed
```

The local services reject path traversal, access outside the workspace, and unsafe symlink targets.
Sensitive files and common secret formats are detected before remote context is prepared. Commands
are classified as safe, confirmation required, dangerous, or blocked.

## Project Creation

The creation flow can scaffold a project, install its dependencies, initialize Git, create the
first commit, start the development process, and open the preview. Technical commands remain
available, but the default progress messages explain each operation in plain language.

Publishing, production deployment, privileged commands, and other consequential actions require
explicit confirmation.

## Current Status

The desktop workspace, onboarding, provider layer, streaming chat, agent workflow foundation, safe
file services, Git panel, project templates, project runner, preview, landing page, tests, and
cross-platform packaging configuration are in the repository.

The remaining work includes complete terminal emulation, GitHub pull/push and pull-request flows,
merge conflict handling, preview element selection, deploy history, code signing, auto-update, and
broader cross-platform testing. See [ROADMAP.md](./ROADMAP.md) for the detailed status.

No signed public installer has been released yet. Until the first release, run the app from source.

## Tech Stack

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- Monaco Editor
- Zustand
- Node.js
- pnpm workspaces
- Vitest
- Playwright
- electron-builder

## Local Development

Requirements:

- Node.js 20.18 or newer
- pnpm 9 or newer
- Git

```bash
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode
pnpm install
pnpm dev
```

The landing page and component catalog can be started separately:

```bash
pnpm dev:landing
pnpm dev:ui
```

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm security:audit
```

## Packaging

Build an unpacked desktop application for the current operating system:

```bash
pnpm --filter @visualnscode/desktop pack
```

Create an installer for the current operating system:

```bash
pnpm --filter @visualnscode/desktop release
```

macOS, Windows, and Linux targets are configured, but release artifacts must still be tested and
signed on their respective platforms before public distribution.

## Repository

```text
visualnscode/
├── apps/
│   ├── desktop/
│   ├── landing/
│   └── ui-docs/
├── packages/
│   ├── agents/
│   ├── config/
│   ├── core/
│   ├── integrations/
│   ├── providers/
│   ├── types/
│   └── ui/
├── docs/
├── e2e/
├── scripts/
└── .github/
```

## Documentation

- [Getting started](./docs/getting-started.md)
- [Architecture](./docs/architecture.md)
- [Providers](./docs/providers.md)
- [Agents](./docs/agents.md)
- [Integrations](./docs/integrations.md)
- [Security model](./docs/security-model.md)
- [Project templates](./docs/project-templates.md)
- [Deployment](./docs/deployment.md)
- [Development](./docs/development.md)
- [Testing](./docs/testing.md)
- [Portuguese README](./docs/README.pt-BR.md)

## Contributing

Bug reports, feature proposals, documentation, and code contributions are welcome. Read
[CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. Commits use Conventional
Commits, and every change should keep lint, typecheck, tests, and builds passing.

Security reports should follow [SECURITY.md](./SECURITY.md) instead of being posted in a public
issue.

## License

VisualnsCode is available under the [MIT License](./LICENSE).

Created by [spx miguel](https://github.com/spxmiguel).
