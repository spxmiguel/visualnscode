# ADR-0007: Run providers in the main process with normalized streaming

- Status: Accepted
- Date: 2026-07-12

## Context

HTTP APIs, local servers, and CLIs have different authentication, stream protocols, cancellation, and
risk. Exposing SDKs, keys, or PTYs to the renderer would break isolation and leak vendor details.

## Decision

Implement `AIProvider` in `packages/providers` and construct adapters in the main process. Normalize
HTTP streaming and individual `node-pty` CLI adapters into serializable `AgentChunk` events. Preload
offers only named operations. Keep non-secret settings in owner-only application data and credentials
in the ADR-0006 vault. Enforce concurrency, timeout, tokens, cancellation, and known cost limits in
`ProviderService`.

## Consequences

- The UI does not know vendor event formats or authentication headers.
- Cancellation and fake-provider tests share one contract.
- Native PTY modules require platform-specific packaging tests.
- Capability declarations remain conservative and prices are not frozen in source.
- A provider-specific feature can justify a native adapter without changing the renderer contract.
