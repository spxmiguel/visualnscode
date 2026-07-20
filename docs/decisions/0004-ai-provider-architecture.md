# ADR-0004: Use ports and adapters for AI providers

- Status: Accepted
- Date: 2026-07-11

## Context

Providers differ in authentication, streaming, model discovery, tools, limits, pricing, and errors.
Coupling UI or domain logic to one SDK would spread vendor conditions throughout the product.

## Decision

Define a capability-based canonical port in `packages/providers`. Implement each protocol or CLI as a
separate adapter and compose it in the privileged Electron process. Domain and renderer code consume
normalized models, chunks, responses, and errors rather than vendor SDK types.

## Consequences

- Providers are replaceable, mockable, and independently testable.
- Capabilities represent real differences instead of pretending all vendors are equivalent.
- Normalization requires adapter work and may temporarily omit provider-specific features.
- Secrets, rate limits, cancellation, and logs stay outside the renderer.

## Implementation note

The catalog now includes remote APIs, local servers, five CLI adapters, and a mandatory fake provider
for deterministic tests. See [Providers](../providers.md).
