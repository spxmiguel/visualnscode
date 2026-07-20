# ADR-0005: Control local commands by capability and risk

- Status: Accepted
- Date: 2026-07-11

## Context

Terminals, agents, and CLIs can read sensitive data, alter projects, or execute destructive actions. A
generic IPC executor or confirmation based only on display text does not create a reliable boundary.

## Decision

Do not expose `exec`, a shell, or `node-pty` to the renderer. Renderer requests are typed operations.
Main-process policy resolves a fixed executable and argument array, checks workspace, origin,
permission, and risk, then applies confirmation, timeout, cancellation, environment filtering, bounded
output, and sanitized logging. Extreme destructive patterns are always blocked.

## Consequences

- Untrusted content cannot append shell operators to a named operation.
- Simple and Advanced modes can differ in presentation without removing core protections.
- Meaningful effects intentionally add review friction.
- Platform command differences require focused adapters and tests.
- Allowlists complement rather than replace OS sandboxing, confirmation, and diff review.

## Implementation note

Detection, Git/GitHub, scaffolding, project runners, provider CLIs, and deployment use constrained
service boundaries. The complete policy is in [Security model](../security-model.md).
