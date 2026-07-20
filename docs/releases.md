# Releases

No public release exists yet. Release publishing is a maintainer-only, manually triggered operation;
pushes and tags do not publish an installer automatically.

## Channels

| Channel | Version example | Purpose                                                        |
| ------- | --------------- | -------------------------------------------------------------- |
| Alpha   | `0.2.0-alpha.1` | Early validation; behavior and data formats may change         |
| Beta    | `0.2.0-beta.1`  | Feature-complete candidate focused on stabilization            |
| Stable  | `0.2.0`         | Supported release after platform, security, and upgrade checks |

## Prepare a version

1. Ensure each user-visible pull request includes a Changeset created by `pnpm changeset`.
2. Create a release branch from an up-to-date `main`.
3. Run `pnpm version-packages` and review every package version and generated changelog entry.
4. Make the desktop package version match the intended workflow version exactly.
5. Run the complete verification sequence from [Testing](./testing.md).
6. Commit with `chore(release): prepare VERSION`, open a pull request, and merge after review.

Packages are private application workspaces, so this process versions source and installers; it does
not publish packages to npm.

## Build or publish

Open **Actions → Release → Run workflow** and provide:

- a version without `v` that matches `apps/desktop/package.json`;
- the matching alpha, beta, or stable channel;
- whether to publish or only build retained workflow artifacts;
- for publication, the exact phrase `publish vVERSION`.

The workflow rejects a version that does not match the chosen channel or desktop package. A dry run
builds all platforms and uploads short-lived Actions artifacts but creates no tag or GitHub release.
Only an explicitly confirmed publish job receives `contents: write`.

## Build matrix

| Runner  | Configured artifacts | Architectures                           |
| ------- | -------------------- | --------------------------------------- |
| macOS   | PKG and DMG          | arm64 and x64                           |
| Windows | MSI and NSIS EXE     | x64                                     |
| Linux   | AppImage, DEB, RPM   | x64; AppImage also configured for arm64 |

The workflow gathers artifacts and creates the `vVERSION` GitHub release. GitHub-generated release
notes summarize commits since the previous tag; reviewed Changeset output remains in package changelogs.
Alpha and beta releases are marked prerelease, while only stable can become latest.

## Signing and updates

Current artifacts are unsigned. macOS hardened runtime/notarization, Windows signing, artifact
checksums, provenance, and automatic updates are release blockers tracked in [ROADMAP.md](../ROADMAP.md).
Never ask users to disable operating-system security globally to run an alpha artifact.

## Security patch

Coordinate embargoed fixes through a private security advisory. Prepare a patch version from the last
supported release, run the same matrix and checks, and publish only after the maintainer repeats the
manual confirmation. Do not bypass the release workflow with a local upload.
