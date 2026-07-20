# Integrations

VisualnsCode integrates with local developer tools through typed adapters. Detection is read-only;
install, authentication, workspace writes, migrations, remote creation, and deployment require both
the relevant permission and confirmation for the specific action.

## Included integrations

| Service  | Detection and authentication                      | Implemented operations                                                                  |
| -------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| GitHub   | `gh --version`, `gh auth status`, `gh auth login` | Account, repositories, clone, fork, issues, pull requests, Actions, releases, push/pull |
| Firebase | `firebase --version`, `firebase login`            | Projects, project selection, initialization, Hosting deployment                         |
| Vercel   | `vercel --version`, `vercel login`                | Projects, local link, project creation, preview and production deploy                   |
| Supabase | `supabase --version`, `supabase login`            | Projects, link, local start, migrations, TypeScript type generation, function deploy    |

Git itself is exposed by a separate main-process service for status, staging, commits, branches,
merge, diff, stash, tags, safe reset, revert, and conflict handling. See
[Git and GitHub](./git-and-github.md).

## Contract

```typescript
interface ToolIntegration {
  readonly id: string;
  readonly name: string;
  detect(): Promise<ToolDetectionResult>;
  install(): Promise<ToolActionResult>;
  authenticate(): Promise<ToolActionResult>;
  test(): Promise<ToolActionResult>;
}
```

`GenericToolIntegration` implements detection, catalog-defined install, and a fixed test action.
GitHub, Firebase, Vercel, and Supabase extend that behavior with service-specific named methods.

## Permission map

| Permission ID          | Purpose                                         | Default |
| ---------------------- | ----------------------------------------------- | ------- |
| `read`                 | Project and tool information                    | Granted |
| `write`                | Workspace files and service configuration       | Denied  |
| `execute-safe`         | Read-only detection and tests                   | Granted |
| `install-dependencies` | Catalog-defined installers                      | Denied  |
| `outside-workspace`    | Global Git configuration or other external path | Denied  |
| `credentials`          | Authentication and account checks               | Denied  |
| `administrative`       | Reserved privileged operations                  | Denied  |

Permission is necessary but not sufficient. `EnvironmentService` also checks tool ID, action,
confirmation, operation name, and trusted workspace path.

## Adding an integration

1. Add a `ToolDefinition` to `packages/integrations/src/tool-catalog.ts` with a stable ID,
   executable, version arguments, official documentation URL, and optional fixed install command.
2. Use `GenericToolIntegration` when detection/install/test are enough. For service operations, create
   a focused adapter beside `github-integration.ts`, `firebase-integration.ts`, and the other existing
   adapters. Run only `CommandSpec` objects with fixed executables and structured arguments.
3. Export a public adapter from `packages/integrations/src/index.ts`.
4. Add explicit action routing and permission checks in
   `apps/desktop/src/main/services/environment-service.ts`. Catalog registration alone does not expose
   write or authentication methods automatically.
5. Add the renderer control only through a named preload method and validated IPC request.
6. Test detection, missing executable, failed command, denied permission, missing confirmation,
   sanitized output, and each operation with a fake `CommandRunner`.
7. Update [CLI detection](./cli-detection.md), onboarding copy, and this document.

Never accept a shell fragment, arbitrary environment, or free-form executable from the renderer. A
new administrative or remote-write capability also requires a security review and usually an ADR.
