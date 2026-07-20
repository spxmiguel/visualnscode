# ADR-0002: Use Monaco Editor

- Status: Accepted
- Date: 2026-07-11

## Context

VisualnsCode needs familiar, accessible, extensible editing with strong TypeScript support and mature
keyboard behavior. Building a code editor would divert effort from guided workflows and orchestration.

## Decision

Use Monaco in the renderer behind VisualnsCode-owned components. Keep domain document state independent
from Monaco types and load editor resources only when needed.

## Consequences

- The product gains mature editing and language foundations quickly.
- Monaco adds significant bundle weight and requires worker/lazy-loading care.
- Vendor-specific APIs stay inside the visual adapter so domain tests do not require Monaco.
- VisualnsCode must maintain its own identity and interaction model instead of inheriting VS Code's layout.
