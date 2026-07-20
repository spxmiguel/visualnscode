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

1. Describe what you want to build on the home screen.
2. Review the suggested name, stack, structure, database, authentication, deployment target, and agent.
3. Keep the recommendation or select one of the 13 versioned templates manually.
4. Choose a parent folder and decide whether to install dependencies, initialise Git, and run preview.
5. Explicitly confirm any optional GitHub, Firebase, Supabase, or Vercel setup.
6. Follow the plain-language progress, expanding technical details only when you need them.
7. Open the generated workspace.

The destination must be empty. GitHub repositories are not created without confirmation, and the
project is never pushed automatically. See [Project creation and templates](./project-templates.md).

## Open an existing project

Click **Open folder** on the home screen, or drag a folder onto the window.

## Next steps

- [Architecture overview](./architecture.md)
- [Connecting AI providers](./providers.md)
- [Using agents](./agents.md)
- [Security model](./security-model.md)
