# Agents

## Built-in agents

| Agent | Role | Default autonomy |
|---|---|---|
| Architect | Designs system structure and ADRs | Ask |
| Frontend Developer | Implements UI components | Guided |
| Backend Developer | Implements APIs and services | Guided |
| Debugger | Finds and fixes bugs | Ask |
| Reviewer | Reviews code quality | Ask |
| Tester | Generates and runs tests | Guided |
| Documentation Writer | Writes and updates docs | Guided |
| Security Auditor | Audits code for vulnerabilities | Ask |
| DevOps | Configures CI/CD and infra | Ask |
| Project Manager | Tracks tasks and coordinates | Guided |

## Autonomy levels

- **Ask** — the agent proposes every action and waits for explicit approval before executing.
- **Guided** — safe actions (reads, searches, writes within the workspace) run automatically; destructive or irreversible actions require approval.
- **Autonomous** — runs within its declared permissions without pausing. Restricted to non-destructive actions by default.

## Creating a custom agent

1. Open the **Agents** panel in the workspace sidebar.
2. Click **New agent**.
3. Fill in:
   - Name and description
   - Provider and model
   - System prompt (plain language instructions)
   - Allowed tools (filesystem, shell, web, etc.)
   - Allowed folders (defaults to workspace root)
   - Cost limit (USD per run)
   - Timeout (seconds)
   - Autonomy level
4. Save.

## Agent workflows

Chain multiple agents into a workflow. Each step receives:

- The original task description
- The previous agent's output
- A list of files that were changed
- Any errors from the previous step

### Example — Full Stack feature

```
Architect → designs components and API contracts
  ↓
Frontend Developer → implements UI
  ↓
Backend Developer → implements API endpoints
  ↓
Reviewer → checks both
  ↓
Tester → generates tests
  ↓
Documentation Writer → updates README and docs
```

## Adding an agent programmatically

Add to `packages/agents/src/default-agents.ts`:

```typescript
export const MY_AGENT: AgentDefinition = {
  id: 'my-agent',
  name: 'My Agent',
  description: 'Does X.',
  providerId: 'anthropic',
  model: 'claude-opus-4-8',
  systemPrompt: '...',
  allowedTools: ['filesystem'],
  allowedFolders: ['.'],
  costLimitUsd: 1,
  timeoutMs: 120_000,
  autonomy: 'ask',
  terminalPermission: 'none',
  editPermission: 'propose',
};
```

Register it in the default catalog array.
