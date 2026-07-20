# Project templates

VisualnsCode ships with 12 built-in templates and supports custom templates.

## Built-in templates

| ID             | Name          | Description                              | Manager |
| -------------- | ------------- | ---------------------------------------- | ------- |
| `react-vite`   | React + Vite  | SPA with React 19, TypeScript, Vite      | pnpm    |
| `nextjs`       | Next.js       | SSR app with App Router and Tailwind     | pnpm    |
| `node-api`     | Node.js API   | REST API with Express and TypeScript     | pnpm    |
| `fastify`      | Fastify       | High-performance API with Fastify        | pnpm    |
| `landing-page` | Landing Page  | React + Vite + Tailwind starter          | pnpm    |
| `supabase-app` | Supabase App  | React + Supabase auth and database       | pnpm    |
| `firebase-app` | Firebase App  | React + Firebase auth, Firestore         | pnpm    |
| `electron`     | Electron      | Desktop app with Electron                | pnpm    |
| `portfolio`    | Portfolio     | Personal site with customisable sections | pnpm    |
| `dashboard`    | Dashboard     | Admin panel with tables and charts       | pnpm    |
| `static-site`  | Static site   | HTML + CSS + JS, no framework            | none    |
| `empty`        | Empty project | Folder + README only                     | none    |

## Creation flow

1. User picks a template.
2. User enters a project name and chooses a parent folder.
3. Scaffold service runs:
   - Creates the folder.
   - Runs `create` command (e.g. `pnpm create vite .`) or writes static files.
   - Installs dependencies.
   - Runs `git init` and creates the first commit.
4. Workspace opens automatically.

## Adding a template

Templates are defined in `apps/desktop/src/main/services/scaffold-service.ts`.

Add an entry to `PROJECT_TEMPLATES`:

```typescript
{
  id: 'my-template',
  name: 'My Template',
  description: 'Short description shown in the UI.',
  category: 'backend',         // frontend | backend | fullstack | other
  tags: ['tag1', 'tag2'],
  manager: 'pnpm',             // pnpm | npm | none
  createCommand: null,         // shell command OR null to use files[]
  files: [
    { path: 'src/index.ts', content: '// start here\n' },
    { path: 'package.json', content: JSON.stringify({ name: '{{name}}' }, null, 2) },
  ],
}
```

Use `{{name}}` as a placeholder for the project name — it's replaced at scaffold time.

If `createCommand` is set, `files` is ignored and the command runs in the new folder instead.
