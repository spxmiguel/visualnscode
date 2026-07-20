# Integrations

VisualnsCode integrates with the services most used in modern web development. All integrations require explicit permission and use secure credential storage.

## GitHub

- Detected via: `gh auth status`
- Auth: `gh auth login` (browser-based OAuth)
- Read features: authentication status, username, issues, pull requests, Actions, and releases
- Write features: create repo, clone, fork, issue, pull request, and release, each explicitly confirmed
- Source control: status, diffs, commits, branches, merge, stash, tags, safe reset, revert, conflicts,
  push, and pull

See [Git and GitHub](./git-and-github.md) for UI modes, safety guarantees, and agent automation.

## Firebase

- Detected via: `firebase --version`
- Auth: `firebase login`
- Features: project selection, Hosting deploy, Firestore rules, Authentication setup

## Vercel

- Detected via: `vercel --version`
- Auth: `vercel login`
- Features: project link, preview deploy, production deploy, domain management

## Supabase

- Detected via: `supabase --version`
- Auth: `supabase login`
- Features: project link, local start, migrations, TypeScript types generation

## Adding a new integration

Integrations live in `packages/integrations/src/tools/`.

1. Create a file named `my-tool.ts` implementing `ToolIntegration`:

```typescript
import type { ToolIntegration } from '../types';

export const myTool: ToolIntegration = {
  id: 'my-tool',
  name: 'My Tool',
  detect: async () => {
    /* shell detection */
  },
  install: async () => {
    /* install instructions */
  },
  authenticate: async () => {
    /* auth flow */
  },
  test: async () => {
    /* connection test */
  },
};
```

2. Register it in `packages/integrations/src/index.ts`.
3. The onboarding assistant will pick it up automatically.

## Permission model

Each integration action maps to a permission level:

| Action             | Required permission |
| ------------------ | ------------------- |
| Read project info  | `read`              |
| Write files        | `write`             |
| Run safe commands  | `commands-safe`     |
| Install packages   | `install`           |
| Access credentials | `credentials`       |
| Admin operations   | `admin`             |
