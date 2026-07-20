# Project execution, preview, and deployment

VisualnsCode detects a project from files in the open workspace. The renderer requests named actions;
it never sends an arbitrary shell command. The Electron main process detects the project again and
maps the action to a fixed executable and argument array.

## Runtime detection

| Project signal                                   | Runtime / manager | Actions detected                             | Default port |
| ------------------------------------------------ | ----------------- | -------------------------------------------- | ------------ |
| `pnpm-lock.yaml`                                 | pnpm              | install, dev/start, build, test from scripts | framework    |
| `yarn.lock`                                      | Yarn              | install, dev/start, build, test from scripts | framework    |
| `bun.lock` or `bun.lockb`                        | Bun               | install, dev/start, build, test from scripts | framework    |
| `package-lock.json`, `package.json`, or npm      | npm               | install, dev/start, build, test from scripts | framework    |
| `pyproject.toml`, Python entrypoint, or manifest | Python            | pip install, server/entrypoint, pytest       | 5000 / 8000  |
| `index.html` without a runtime manifest          | built-in server   | development preview                          | 4173         |

Vite defaults to 5173, Next.js and Create React App to 3000, and Astro to 4321. A port in the
detected script (`--port`, `-p`, or `PORT=`) takes precedence. The process can be started, stopped,
or restarted, while stdout and stderr stream into the runtime log.

## Integrated web preview

The Preview panel provides desktop, tablet, mobile, and custom resolutions. Refresh, external browser,
screenshot, console, and basic `fetch` network events are available from its toolbar.

The displayed page is routed through an ephemeral loopback proxy. It accepts only `localhost`,
`127.0.0.1`, and `::1`, and injects a small browser bridge. The bridge communicates through
`postMessage`; it has no Electron, filesystem, credential, or command API.

To give an agent visual context:

1. Start the project and click **Select element**.
2. Hover the page and click the target.
3. Review the CSS selector shown above the preview.
4. Click **Send to chat**.

The chat draft receives the page URL, selector, tag, text, classes, selected attributes, and bounds.
Files already open in the editor remain the explicit source context. Any resulting edit still follows
the normal proposal → diff → review flow.

## Supported deployment targets

| Service                 | Preview command                         | Production command                             |
| ----------------------- | --------------------------------------- | ---------------------------------------------- |
| Vercel                  | `vercel deploy --yes`                   | `vercel deploy --yes --prod`                   |
| Firebase Hosting        | isolated Hosting preview channel        | Hosting-only deploy                            |
| Supabase Edge Functions | function deploy for a project reference | same command, marked as production             |
| GitHub Pages            | configured Actions workflow             | configured Actions workflow with `environment` |

The corresponding CLI must already be installed and authenticated. Supabase requires a project
reference and function name. GitHub Pages requires an existing Pages workflow filename; VisualnsCode
does not generate or silently alter a repository workflow during deployment.

## Confirmed deployment flow

1. Open **Preview → Publish** and choose a service and environment.
2. Review the exact plan and technical command.
3. VisualnsCode runs the detected build when the target needs one.
4. Select the confirmation checkbox for that specific attempt.
5. Create a preview, inspect its URL, then select production if appropriate.
6. Confirm production separately. A previous preview confirmation is never reused.

Both preview and production are external side effects and require confirmation. Production is also
validated in the main process; renderer state alone cannot bypass the guard.

## History and failure behavior

Results are stored in `.visualnscode/deploy-history.json` with permission `0600`. The directory is
ignored by the VisualnsCode project templates and this repository. At most 100 records are retained.
Each record contains the provider, environment, status, timestamps, summary, and URL when returned.
CLI output is redacted before it reaches the interface; tokens and credentials are not written to
history.

If the build fails, deployment stops. A failed CLI invocation creates a failed history record and the
UI keeps the sanitized log available for review. VisualnsCode never retries a production publish by
itself.

## VisualnsCode landing page

The public website is deployed separately from user projects and from the Electron release pipeline.
Its Vite build, quality gates, canonical-domain checklist, and Vercel project settings are documented
in [`landing.md`](./landing.md).
