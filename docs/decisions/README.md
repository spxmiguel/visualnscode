# Architecture Decision Records

ADRs preserve a durable decision, its context, and consequences. Valid statuses are Proposed,
Accepted, Superseded, and Rejected. Do not rewrite an accepted ADR to erase history; create a new ADR
that links to the previous decision when the architecture changes. Translation and factual
implementation notes may be added without changing the original decision.

| ADR                                              | Decision                                               | Status   |
| ------------------------------------------------ | ------------------------------------------------------ | -------- |
| [0001](./0001-use-electron.md)                   | Electron for the desktop application                   | Accepted |
| [0002](./0002-use-monaco-editor.md)              | Monaco as the code editor                              | Accepted |
| [0003](./0003-use-pnpm-monorepo.md)              | pnpm workspace monorepo                                | Accepted |
| [0004](./0004-ai-provider-architecture.md)       | Ports and adapters for AI providers                    | Accepted |
| [0005](./0005-local-command-security.md)         | Capability and risk policy for local commands          | Accepted |
| [0006](./0006-system-credential-vault.md)        | Operating-system-backed credential vault               | Accepted |
| [0007](./0007-provider-runtime-and-streaming.md) | Main-process provider runtime and normalized streaming | Accepted |

Use the next four-digit sequence. Include Status, Date, Context, Decision, and Consequences. Link
security-sensitive changes from [the security model](../security-model.md).
