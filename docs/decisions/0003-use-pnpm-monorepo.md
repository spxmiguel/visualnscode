# ADR-0003: Use a pnpm workspace monorepo

- Status: Accepted
- Date: 2026-07-11

## Context

Desktop, landing, shared UI, providers, agents, and integrations evolve at different rates but share
contracts and tooling. Separate repositories would increase coordination and permit incompatible
versions during early development.

## Decision

Keep applications and packages in one repository managed by pnpm workspaces. Root configuration owns
the common TypeScript, lint, formatting, test, Changesets, and CI policy; each workspace keeps its own
runtime dependencies and scripts.

## Consequences

- One change can update a contract, implementation, consumers, tests, and documentation atomically.
- A single lockfile improves reproducibility and dependency review.
- Boundaries require enforcement to avoid an accidental distributed monolith.
- Changesets record version impact across private application packages.
