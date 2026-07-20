# Changesets

User-visible changes require a Changeset unless the pull request changes only documentation, tests,
CI, or internal refactoring with no release impact.

Run `pnpm changeset`, select the affected workspace packages, choose the SemVer bump, and describe the
change from the user's point of view. Commit the generated Markdown file with the implementation.

Maintainers run `pnpm version-packages` on a release branch. This consumes pending Changesets, updates
package versions and changelogs, and prepares the commit reviewed before the manual release workflow.
