# Project creation and templates

VisualnsCode turns a plain-language project idea into an editable recommendation. The recommendation
engine runs locally: it does not send the description to an AI provider and does not need credentials.

## Guided flow

1. Describe the product in everyday language.
2. Review the suggested name, stack, folder structure, database, authentication, deployment target,
   and agent.
3. Keep the recommendation or choose a template manually.
4. Select a parent directory and creation options.
5. Review every external action and confirm it explicitly.
6. Follow plain-language progress; expand **Technical details** to see the underlying command.
7. Open the workspace and, when selected, start its detected development script and preview.

Simple mode opens the created project as a result-oriented workspace: integrated preview and a
plain-language project assistant, without Explorer, Monaco, terminal, or Git terminology. Switching
to Advanced reveals the complete IDE without changing the project or restarting its process.

The destination must be empty. VisualnsCode never overwrites an existing project and never pushes the
initial commit. Creating a GitHub repository is optional, defaults to private, and has a separate
confirmation checkbox.

## Built-in catalog

Every built-in template uses schema version `1` and template version `1.0.0`.

| ID             | Stack                          | Default deployment |
| -------------- | ------------------------------ | ------------------ |
| `react-vite`   | React + Vite + TypeScript      | Vercel             |
| `nextjs`       | Next.js + React + TypeScript   | Vercel             |
| `electron`     | Electron + JavaScript          | Desktop installer  |
| `node-api`     | Node.js HTTP + TypeScript      | Vercel             |
| `express`      | Express + Node.js + TypeScript | Vercel             |
| `fastify`      | Fastify + Node.js + TypeScript | Vercel             |
| `firebase-app` | React + Vite + Firebase        | Firebase Hosting   |
| `supabase-app` | React + Vite + Supabase        | Vercel             |
| `landing-page` | React + Vite + TypeScript      | Vercel             |
| `portfolio`    | React + Vite + TypeScript      | Vercel             |
| `dashboard`    | React + Vite + TypeScript      | Vercel             |
| `static-site`  | HTML + CSS + JavaScript        | GitHub Pages       |
| `empty`        | No predefined stack            | None               |

Generated projects contain `.visualnscode/template.json`:

```json
{
  "id": "react-vite",
  "version": "1.0.0",
  "schemaVersion": 1
}
```

This file makes migrations and reproducible template updates possible without silently modifying a
project. VisualnsCode currently ships templates with the application; it does not download executable
template definitions from a remote source.

Landing Page, Portfolio, and Dashboard include distinct responsive React starters rather than the
generic Vite screen. Every recommended agent name is validated against the built-in agent catalog.

## Pipeline behavior

- Commands use an executable plus a fixed argument array and run without a shell.
- Renderer input can select a catalog ID but cannot supply an arbitrary command.
- Dependency installation can be disabled.
- Git initialization and the first Conventional Commit can be disabled.
- Next.js scaffolding always uses `--skip-install` and `--disable-git`; VisualnsCode performs those
  steps later only when their individual options are enabled.
- A Git failure is reported as a warning and never disguised as success.
- GitHub, Supabase, and Vercel actions require explicit confirmation.
- `gh repo create` creates the remote and configures `origin`, but does not use `--push`.
- Firebase setup writes local configuration only; production deploy is outside this flow.
- Static HTML projects use the built-in loopback server and can open their preview without a package
  manager. Automatic preview starts only after the preview panel has registered its process listener,
  so the initial URL and logs are not lost.
- Tests inject a fake command runner, so they never install packages, authenticate, or publish.

## Adding a template

Definitions live in
`apps/desktop/src/main/services/scaffold-service.ts`. Add a `TemplateDefinition` with immutable version
metadata, user-facing recommendation fields, and safe command arguments:

```ts
{
  id: 'my-template',
  version: '1.0.0',
  schemaVersion: 1,
  name: 'My Template',
  description: 'What this creates.',
  category: 'backend',
  tags: ['node', 'typescript'],
  stack: 'Node.js + TypeScript',
  database: 'None',
  authentication: 'None',
  deployment: 'Vercel',
  recommendedAgent: 'Backend Developer',
  manager: 'pnpm',
  create: { executable: 'pnpm', args: ['create', 'example', '.'] },
  files: [
    versionFile('my-template'),
    { path: 'README.md', content: '# {{name}}\n' },
  ],
  runCommand: 'pnpm run dev',
}
```

Rules for contributions:

1. Use a unique lowercase ID and a semantic `version`.
2. Keep `schemaVersion: 1` until the template metadata contract changes.
3. Use `{{name}}` only in file contents; paths must be static and relative.
4. Never invoke a shell or accept command arguments from the renderer.
5. Include `.visualnscode/template.json` through `versionFile`.
6. Add the template ID to the catalog test and add a creation test when behavior is specialized.
7. Use the exact name of an existing built-in agent in `recommendedAgent`.
8. Run `pnpm lint && pnpm typecheck && pnpm test`.

When changing generated output, increment the template version using semantic versioning: patch for a
compatible fix, minor for additive files or features, and major for breaking project structure.
