# Installation and local packaging

## Current availability

No public binary release has been published yet. The supported installation path for the current alpha
is a source checkout. Do not treat untagged CI artifacts or files shared by third parties as official
VisualnsCode installers.

## Run from source

```bash
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Node.js 20.18 or newer, pnpm 9, and Git are required. `pnpm install` also activates the versioned
Husky hooks for this clone.

## Build without an installer

```bash
pnpm --filter @visualnscode/desktop build
```

This creates renderer and Electron process bundles inside `apps/desktop`. It does not create an
operating-system installer.

## Package locally

Run the command matching the host platform:

```bash
pnpm --filter @visualnscode/desktop release:mac
pnpm --filter @visualnscode/desktop release:linux
pnpm --filter @visualnscode/desktop release:win
```

Artifacts are written to `release/`. The configuration produces macOS PKG and DMG files for arm64 and
x64, Windows MSI and NSIS installers for x64, and Linux AppImage for x64/arm64 plus DEB and RPM for
x64. Cross-platform packaging is performed by the manual GitHub Actions release matrix, not expected
from a single local machine.

Local artifacts are unsigned. macOS notarization, Windows signing, and an update channel are planned.
Operating-system warnings are therefore expected during alpha testing; do not advise users to disable
security controls globally.

## Installer scripts after the first release

The repository contains `scripts/install.sh` and `scripts/install.ps1`. They resolve the latest GitHub
release and cannot work before one exists. After an approved release, verify its checksums and use the
instructions attached to that release rather than copying a command from another source.

The executable name is `spxcode`. Packaging details and the confirmation-gated release process are in
[Releases](./releases.md).
