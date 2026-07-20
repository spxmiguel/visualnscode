# AI providers

`packages/providers` gives remote APIs, local servers, and command-line agents one canonical contract.
The package does not know React or the concrete credential vault; `ProviderService` composes both in
the Electron main process.

## Supported adapters

| Kind         | Providers                                                                | Execution  |
| ------------ | ------------------------------------------------------------------------ | ---------- |
| Remote API   | OpenAI, Anthropic, Google Gemini, OpenRouter, OpenAI-compatible endpoint | Remote     |
| Local server | Ollama, LM Studio                                                        | Local HTTP |
| CLI          | Claude Code, Codex, Gemini CLI, Aider, OpenCode                          | Local PTY  |

OpenAI, OpenRouter, Ollama, LM Studio, and configurable compatible endpoints share the
OpenAI-compatible protocol adapter. Anthropic and Gemini use dedicated adapters. Each CLI has a
separate class built on the constrained `CliProvider` base.

## Canonical contract

```typescript
interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly type: 'api' | 'local' | 'cli';
  readonly capabilities: ProviderCapabilities;
  readonly execution: 'local' | 'remote';
  isAvailable(): Promise<boolean>;
  listModels(): Promise<readonly AIModel[]>;
  sendMessage(input: AgentInput): Promise<AgentResponse>;
  streamMessage(input: AgentInput): AsyncIterable<AgentChunk>;
  cancel(requestId: string): Promise<void>;
}
```

Capabilities report streaming, tools, vision, file editing, and long context. A model also reports its
execution location, context window when known, and input/output cost. Unknown prices remain `null`;
the interface does not invent a cost.

Streams normalize provider output into `text`, `usage`, `done`, and sanitized `error` chunks. Every
request has a caller-generated ID used for cancellation and concurrent request tracking.

## Configuration and credentials

The model settings screen controls enabled state, default model, local alias, base URL, cost limit,
token limit, timeout, and concurrency. Non-secret settings are persisted in
`provider-settings.json`. API keys are encrypted with Electron `safeStorage`; only a configured/not
configured flag returns to the renderer.

Local base URLs must resolve to an allowed local endpoint. Remote context passes through the secret
scanner. CLI adapters receive a filtered environment and structured arguments. Executable discovery
combines the Electron PATH with standard Homebrew, npm, pnpm, Bun, Volta, asdf, and NVM locations so
a CLI launched successfully in the user's terminal is also visible to the packaged app. The current
workspace is selected by the main process; the renderer cannot supply an arbitrary working directory.

Claude Code and Codex use their JSONL protocols, Gemini uses its documented JSON response, and
OpenCode uses JSON events. The decoder exposes only assistant text and measured usage when available,
instead of showing protocol records in chat. Codex runs in a read-only ephemeral sandbox, Claude has
its direct tools disabled for chat, and Aider starts in dry-run mode. AI-requested edits therefore go
through VisualnsCode's diff review rather than a CLI writing silently.

## Chat behavior

The workspace chat supports streaming, cancellation, retry, provider/model labels, explicit context
files, estimated usage, local history, Markdown export, and clear. Open tabs are the only automatic
file context. Interrupted streams are marked cancelled after hydration rather than resumed silently.

The provider picker keeps every catalog entry visible, even before configuration. Each entry shows
its provider icon and a concrete next action: add an API key, start a local server, configure a CLI,
or activate an already detected provider. Sending stays disabled until the selected provider is
enabled, configured, and available.

## Adding a provider

1. Add a conservative `ProviderDescriptor` to
   `packages/providers/src/catalog.ts`. Do not claim a capability the adapter cannot prove.
2. Implement the protocol in `packages/providers/src/`. Extend `BaseProvider` for HTTP or
   `CliProvider` for a CLI. Keep vendor behavior out of the renderer.
3. Normalize errors and chunks. Implement real cancellation and observe the input timeout.
4. Register construction in `packages/providers/src/factory.ts`.
5. Export any public type or adapter from `packages/providers/src/index.ts`.
6. Add deterministic tests beside the adapter using mocked Fetch, a fake PTY, or `FakeProvider`.
   Tests must not read environment credentials or contact a real service.
7. Add the provider to onboarding only if it has a corresponding local tool definition or secret field.
8. Update this document. Add an ADR if the provider requires a new privilege or protocol boundary.

For HTTP adapters, validate the base URL and never log headers or authenticated bodies. For CLI
adapters, keep the executable and arguments fixed by the adapter, preserve the filtered environment,
select read-only or dry-run flags when available, and add protocol fixtures for text, usage, and error
events. `pnpm install` repairs the native `node-pty` spawn helper permission on Unix-like systems.

Relevant implementation files:

- `packages/providers/src/types.ts`
- `packages/providers/src/catalog.ts`
- `packages/providers/src/factory.ts`
- `packages/providers/src/fake-provider.ts`
- `apps/desktop/src/main/services/provider-service.ts`
