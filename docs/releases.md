# Releases

## Release types

| Type | Tag pattern | Description |
|---|---|---|
| Alpha | `v0.x.y-alpha.N` | Early feature preview, may break |
| Beta | `v0.x.y-beta.N` | Feature complete, stabilising |
| RC | `v0.x.y-rc.N` | Release candidate |
| Stable | `v0.x.y` | Production ready |

## Release process

1. Merge all PRs for the milestone into `main`.
2. Update `CHANGELOG.md` under `[Unreleased]` with the new version header.
3. Bump the version in root `package.json` and in `apps/desktop/package.json`.
4. Commit: `chore(release): bump version to 0.x.y`.
5. Tag: `git tag v0.x.y`.
6. Push the tag: `git push origin v0.x.y`.
7. GitHub Actions runs the release workflow, builds artifacts for macOS, Linux, Windows, and creates the GitHub Release.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for version tracking.

```bash
# After a feature or fix
pnpm changeset

# When releasing
pnpm changeset version  # bumps versions
pnpm changeset publish  # publishes
```

## Artifacts per release

| File | Platform |
|---|---|
| `VisualnsCode-{version}-arm64.pkg` | macOS Apple Silicon |
| `VisualnsCode-{version}-x64.pkg` | macOS Intel |
| `VisualnsCode-{version}-x86_64.AppImage` | Linux |
| `VisualnsCode-{version}-amd64.deb` | Debian/Ubuntu |
| `VisualnsCode-{version}.rpm` | Fedora/RHEL |
| `VisualnsCode-{version}.msi` | Windows |
| `VisualnsCode-{version}-Setup.exe` | Windows (NSIS) |

## Auto-update (planned)

`electron-updater` integration is planned for the 0.3 release. It will check for updates on launch and show a banner. The update download and install will require user confirmation.

## Emergency patch process

For critical security fixes:

1. Create a `hotfix/` branch from the last release tag.
2. Apply the fix.
3. Tag as `v0.x.z` (patch increment).
4. The release workflow builds and publishes as a patch release.
