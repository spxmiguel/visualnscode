# Installation

## Installers

Download the latest release from [GitHub Releases](https://github.com/spxmiguel/visualnscode/releases).

| Platform | File | Notes |
|---|---|---|
| macOS (Apple Silicon) | `VisualnsCode-*-arm64.pkg` | Signed + notarized (planned) |
| macOS (Intel) | `VisualnsCode-*-x64.pkg` | |
| Linux (any distro) | `VisualnsCode-*.AppImage` | Mark as executable before running |
| Linux (Debian/Ubuntu) | `VisualnsCode-*.deb` | |
| Linux (Fedora/RHEL) | `VisualnsCode-*.rpm` | |
| Windows | `VisualnsCode-*.msi` | Adds `spxcode` to PATH automatically |

### macOS

```bash
# After downloading the .pkg installer:
sudo installer -pkg VisualnsCode-*.pkg -target /
# spxcode symlink is created at /usr/local/bin/spxcode
spxcode
```

### Linux

```bash
chmod +x VisualnsCode-*.AppImage
./VisualnsCode-*.AppImage
# Or move to PATH:
mv VisualnsCode-*.AppImage ~/.local/bin/spxcode
spxcode
```

### Windows

Double-click the `.msi` installer. The installer adds the install directory to `PATH`. Open a new terminal and type `spxcode`.

## One-line scripts

```bash
# macOS & Linux
curl -fsSL https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.sh | bash

# Windows PowerShell
irm https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.ps1 | iex
```

The scripts detect your OS and architecture, download the correct artifact, and create the `spxcode` command.

## Build from source

```bash
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode
pnpm install
pnpm dev        # dev mode (hot-reload)
pnpm build      # production build
pnpm --filter @visualnscode/desktop release:mac   # package macOS
pnpm --filter @visualnscode/desktop release:linux  # package Linux
pnpm --filter @visualnscode/desktop release:win    # package Windows
```

Artifacts are output to `release/`.
