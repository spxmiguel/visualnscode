# Troubleshooting

## App doesn't start

- Ensure Node.js ≥ 20.18 and pnpm ≥ 9 are installed.
- Run `pnpm install` from the repository root.
- Run `pnpm dev` and check the terminal for errors.

## `spxcode` command not found after install

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
Reinstall using the `.msi` — it registers PATH automatically.

## AI provider returns errors

1. Open **Settings → Providers**.
2. Click **Test connection** next to the provider.
3. If the test fails, regenerate the API key and paste it again.
4. For Ollama: ensure the service is running (`ollama serve`).

## Preview panel is blank

- Click **Run** and open the runtime log from the terminal icon.
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
- Initialise Git: open the terminal and run `git init`.
- Or create the project using a template — Git is initialised automatically.

## File changes not saved

- VisualnsCode saves files when you click **Accept** in the diff viewer.
- The Monaco editor does NOT auto-save to disk — changes in the editor are staged until accepted.
- Use Cmd/Ctrl+S to save the active file directly.

## Checkpoints are not rolling back correctly

Checkpoints store file content at the time they are created. If you delete files after the checkpoint, restore restores their content but does not re-create deleted directories automatically.

## Logs

Application logs are written to:

- **macOS:** `~/Library/Logs/VisualnsCode/`
- **Linux:** `~/.config/VisualnsCode/logs/`
- **Windows:** `%APPDATA%\VisualnsCode\logs\`

## Reporting a bug

Open an issue at [github.com/spxmiguel/visualnscode/issues](https://github.com/spxmiguel/visualnscode/issues) with:

1. OS and version
2. App version (`spxcode --version`)
3. Steps to reproduce
4. Relevant log output
