# Troubleshooting

## App doesn't start

- Ensure Node.js ≥ 20.18 and pnpm ≥ 9 are installed.
- Run `pnpm install --frozen-lockfile` from the repository root.
- Run `pnpm dev` and check the terminal for errors.

## `spxcode` command not found after install

No public installer exists yet. The following checks apply only to a locally packaged build or a
future artifact downloaded from the official Releases page.

**macOS:**

```bash
ls -la /usr/local/bin/spxcode
# If missing, create manually:
sudo ln -sf "/Applications/VisualnsCode.app/Contents/MacOS/spxcode" /usr/local/bin/spxcode
```

**Linux:**

```bash
which spxcode || echo "~/.local/bin/spxcode"
# Ensure ~/.local/bin is in PATH:
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Windows:**
Use the NSIS `.exe` installer when command-line registration is required; its install script adds the
application directory to the system `PATH`. The MSI creates application shortcuts but does not claim
to register `spxcode` in `PATH`.

## AI provider returns errors

1. Open **Settings → Providers**.
2. Click **Test connection** next to the provider.
3. If the test fails, regenerate the API key and paste it again.
4. For Ollama: ensure the service is running (`ollama serve`).

## Preview panel is blank

- Click **Run** and open the runtime log from the preview controls.
- For Node projects, verify `dev` or `start` exists in `package.json`; for Python, verify an entrypoint
  or supported framework manifest exists.
- VisualnsCode opens only loopback URLs. Confirm the server reports `localhost`, `127.0.0.1`, or `::1`.
- If console events appear but the page is blank, reload after the server reports its final URL.
- Hot-module reload WebSocket messages are not shown in the basic network log; the project remains
  responsible for its own HMR configuration.

## Deployment did not start

- Every preview and production attempt needs its own checked confirmation.
- Run the integration test in onboarding and authenticate the selected CLI.
- Supabase needs both project reference and function name.
- GitHub Pages needs an existing workflow file, such as `deploy-pages.yml`.
- Open the deploy log: a build error stops publication before any provider command is run.

## Git panel shows no status

- The panel only works inside a Git repository.
- Initialise Git by running `git init` in an external terminal opened at the workspace root.
- Or create the project using a template — Git is initialised automatically.

The generic interactive terminal inside VisualnsCode is not complete in the current alpha; do not
depend on it for repository setup.

## File changes not saved

- Manual editor changes are saved with Command+S on macOS or Control+S on Windows and Linux.
- AI changes are different: **Accept** in Diff applies only the selected files and hunks after creating
  a checkpoint. Closing or rejecting a proposal writes nothing.
- There is no automatic save. Confirm the workspace is trusted and the active tab is a real file.

## Checkpoints are not rolling back correctly

Checkpoints store file content and whether each file existed. Restore uses the safe writer, which can
re-create required parent directories. A checkpoint belongs to one real workspace path and cannot be
applied to another workspace.

## Diagnostics

Development-process and deploy output appears in the relevant VisualnsCode panel after sanitization.
When running from source, Electron/Vite startup errors appear in the terminal that launched
`pnpm dev`. The alpha does not claim a separate persistent application log directory.

## Reporting a bug

Open an issue at [github.com/spxmiguel/visualnscode/issues](https://github.com/spxmiguel/visualnscode/issues) with:

1. OS and version
2. Desktop package version from `apps/desktop/package.json`
3. Steps to reproduce
4. Relevant log output
