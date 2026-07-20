# Getting started

VisualnsCode is currently distributed from source. Public installer scripts become usable after the
first approved GitHub release; the [Releases page](https://github.com/spxmiguel/visualnscode/releases)
is the source of truth.

## Prerequisites

| Tool    | Minimum                |
| ------- | ---------------------- |
| Node.js | 20.18.0                |
| pnpm    | 9.0.0                  |
| Git     | Any maintained version |

## Clone and run

```bash
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode
pnpm install --frozen-lockfile
pnpm dev
```

## First launch

1. Read the welcome and security summary.
2. Choose Simple or Advanced mode; it can be changed later.
3. Review detected development tools and ignore any you do not need.
4. Grant permissions only when a named action needs them.
5. Optionally connect one provider with an encrypted API key or a local Ollama/LM Studio server.
6. Review the final summary and enter the application.

Provider setup is optional. You can edit files, inspect Git, run a detected project, and explore the
interface without connecting a remote model.

## Create a project

1. Describe the idea on the home screen.
2. Review the suggested name, stack, structure, database, authentication, deploy target, and agent.
3. Keep the recommendation or select one of the 13 versioned templates.
4. Choose an empty destination and the optional install, Git, first commit, run, and preview steps.
5. Confirm GitHub, Firebase, Supabase, or Vercel actions separately if selected.
6. Follow the plain-language progress and expand technical details when needed.

The project is never pushed or deployed automatically. See [Project templates](./project-templates.md).

## Open a project

Select **Open folder** on the home screen and choose a trusted workspace. VisualnsCode validates the
real path before reading or writing it. Open files from the Explorer; manual saves use Command+S on
macOS or Control+S on Windows and Linux. AI-generated changes remain proposals until reviewed in Diff.

## Next reading

- [Environment onboarding](./onboarding.md)
- [AI providers](./providers.md)
- [Agents and workflows](./agents.md)
- [Security model](./security-model.md)
- [Troubleshooting](./troubleshooting.md)
