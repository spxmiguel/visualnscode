<div align="center">

```
  ██╗   ██╗███╗   ██╗███████╗ ██████╗ ██████╗ ██████╗ ███████╗
  ██║   ██║████╗  ██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ██║   ██║██╔██╗ ██║███████╗██║     ██║   ██║██║  ██║█████╗
  ╚██╗ ██╔╝██║╚██╗██║╚════██║██║     ██║   ██║██║  ██║██╔══╝
   ╚████╔╝ ██║ ╚████║███████║╚██████╗╚██████╔╝██████╔╝███████╗
    ╚═══╝  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
```

**Build with every AI. Manage everything from one place.**

[![CI](https://github.com/spxmiguel/visualnscode/actions/workflows/ci.yml/badge.svg)](https://github.com/spxmiguel/visualnscode/actions/workflows/ci.yml)
[![Lighthouse](https://github.com/spxmiguel/visualnscode/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/spxmiguel/visualnscode/actions/workflows/lighthouse.yml)
[![Release](https://github.com/spxmiguel/visualnscode/actions/workflows/release.yml/badge.svg)](https://github.com/spxmiguel/visualnscode/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![Version](https://img.shields.io/github/v/release/spxmiguel/visualnscode?color=7C5CFC&label=version)](https://github.com/spxmiguel/visualnscode/releases)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)](https://github.com/spxmiguel/visualnscode/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

</div>

---

VisualnsCode is an open-source desktop IDE that puts Claude, GPT, Gemini, Ollama and your favorite
dev tools in one focused workspace. Simple mode for beginners. Full power for pros.

## Install

**macOS & Linux — one line:**

```bash
curl -fsSL https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.sh | bash
```

**Windows — PowerShell or cmd:**

```powershell
irm https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.ps1 | iex
```

After install, type **`spxcode`** in any terminal to open the app.

> Download installers manually from [Releases](https://github.com/spxmiguel/visualnscode/releases):
> `.pkg` (macOS), `.AppImage` / `.deb` (Linux), `.msi` (Windows).

---

## What it does

|                             |                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 🤖 **Multi-provider AI**    | Switch between Claude, GPT-4o, Gemini, Ollama, OpenRouter and any OpenAI-compatible endpoint without touching a line of code. |
| 🛠 **Agent teams**           | Build workflows with specialized agents — Architect, Frontend Dev, Reviewer, Tester — running in sequence or parallel.        |
| 🎛 **Two modes**             | Simple mode shows only what matters. Advanced mode reveals terminal, Git, diffs, logs, permissions, and agent controls.       |
| 🔒 **Safe by default**      | AI never edits files silently. Every change goes through diff → approve → checkpoint → apply.                                 |
| 🚀 **Integrated deploy**    | Vercel, Firebase, Supabase, GitHub Pages — from build to production URL with explicit confirmation.                           |
| 🛠 **Auto-onboarding**       | Detects Git, Node, pnpm, CLIs, and AI providers already installed. Guides through setup in plain language.                    |
| 🧱 **Guided projects**      | Describe an idea, review the suggested stack, then create from 13 versioned templates with explicit external-action consent.  |
| 🌿 **Git without friction** | Save versions simply or use branches, tags, merges, conflicts, GitHub issues, PRs, Actions, and releases.                     |

## Screenshots

> _Screenshots coming with the first stable release._
> Try it locally: `git clone https://github.com/spxmiguel/visualnscode && cd visualnscode && pnpm install && pnpm dev`

## Tech stack

| Layer         | Tech                                           |
| ------------- | ---------------------------------------------- |
| Desktop shell | Electron 43, contextIsolation, sandbox         |
| Frontend      | React 19, TypeScript, Vite, Tailwind CSS       |
| Editor        | Monaco Editor                                  |
| State         | Zustand                                        |
| Monorepo      | pnpm workspaces                                |
| Packaging     | electron-builder (.pkg, .AppImage, .deb, .msi) |
| Testing       | Vitest, Playwright                             |
| CI            | GitHub Actions                                 |

## Project structure

```
visualnscode/
├── apps/
│   ├── desktop/          # Electron app (main, preload, renderer)
│   └── landing/          # Marketing site (Vite + React)
├── packages/
│   ├── ui/               # Shared component library
│   ├── core/             # Pure domain logic
│   ├── agents/           # Agent contracts and orchestration
│   ├── providers/        # AI provider adapters
│   ├── integrations/     # CLI, deploy, and VCS integrations
│   ├── config/           # Shared constants
│   └── types/            # Shared TypeScript contracts
├── scripts/
│   ├── install.sh        # macOS/Linux curl installer
│   └── install.ps1       # Windows PowerShell installer
├── docs/decisions/       # Architecture Decision Records
└── .github/workflows/    # CI + release pipeline
```

## Development

**Prerequisites:** Node.js ≥ 20.18, pnpm ≥ 9, Git.

```bash
# clone
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode

# install all workspace dependencies
pnpm install

# run Electron app in dev mode
pnpm dev

# run landing page only
pnpm dev:landing

# checks
pnpm lint && pnpm typecheck && pnpm test
pnpm test:e2e && pnpm test:lighthouse

# build everything
pnpm build
```

## Packaging

```bash
# inside apps/desktop — builds for the current platform
pnpm --filter @visualnscode/desktop release

# per platform
pnpm --filter @visualnscode/desktop release:mac
pnpm --filter @visualnscode/desktop release:linux
pnpm --filter @visualnscode/desktop release:win
```

Artifacts land in `release/`. Cross-platform builds run automatically via GitHub Actions on every
tagged release.

## Roadmap

| Phase                                           | Status     |
| ----------------------------------------------- | ---------- |
| Monorepo, toolchain, CI                         | ✅ Done    |
| Workspace UI, themes, modes                     | ✅ Done    |
| Onboarding & environment setup                  | ✅ Done    |
| AI providers & streaming chat                   | ✅ Done    |
| Agent system & workflows                        | ✅ Done    |
| File system, secure runner, complete Git/GitHub | ✅ Done    |
| Diff viewer, checkpoints, rollback              | 🔜 Next    |
| Guided creation and 13 versioned templates      | ✅ Done    |
| Confirmed deploy integrations                   | ✅ Done    |
| Runtime detection, preview, element picker      | ✅ Done    |
| Cross-platform release pipeline                 | 📋 Planned |

See [ROADMAP.md](./ROADMAP.md) for full details.

Landing architecture and Vercel deployment: [docs/landing.md](./docs/landing.md).

## Contributing

All contributions are welcome — bug reports, feature requests, docs, code.

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Open an issue or pick one from the [issue tracker](https://github.com/spxmiguel/visualnscode/issues)
3. Fork → branch → commit (Conventional Commits) → PR

## Security

Credentials are stored in the OS keychain via Electron `safeStorage`, never in plain text.
AI never sends secrets to remote providers. See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — built by [@spxmiguel](https://github.com/spxmiguel)
