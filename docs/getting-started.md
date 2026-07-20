# Getting started

## Prerequisites

| Tool    | Minimum version |
| ------- | --------------- |
| Node.js | 20.18.0         |
| pnpm    | 9.0.0           |
| Git     | 2.40.0          |

## Install

**macOS & Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.ps1 | iex
```

After install, type `spxcode` in any terminal to open the app.

## First launch

1. The onboarding assistant opens automatically.
2. Choose **Simple** or **Advanced** mode.
3. Detected tools (Git, Node.js, package managers, AI CLIs) are listed with their status.
4. Connect at least one AI provider — paste your API key or point to a local Ollama instance.
5. Finish setup.

## Create your first project

1. Click **New project** on the home screen.
2. Select a template (React + Vite, Next.js, Node.js API, etc.).
3. Enter a project name and choose a parent folder.
4. VisualnsCode creates the files, installs dependencies, initialises Git, and opens the workspace.

## Open an existing project

Click **Open folder** on the home screen, or drag a folder onto the window.

## Next steps

- [Architecture overview](./architecture.md)
- [Connecting AI providers](./providers.md)
- [Using agents](./agents.md)
- [Security model](./security-model.md)
