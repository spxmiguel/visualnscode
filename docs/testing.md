# Testing

## Test stack

| Tool            | Purpose                    |
| --------------- | -------------------------- |
| Vitest          | Unit and integration tests |
| Testing Library | React component tests      |
| Playwright      | End-to-end tests           |

## Run tests

```bash
pnpm test           # all unit tests, pass with no tests
pnpm test:watch     # watch mode
pnpm test:e2e       # Playwright E2E (requires built app)
```

## Test locations

- Unit tests live alongside source files: `*.test.ts`, `*.test.tsx`.
- E2E tests live in `e2e/`.
- Test helpers and mocks in `vitest.setup.ts`.

## Writing unit tests

```typescript
import { describe, it, expect } from 'vitest';
import { classifyCommand } from '../services/secret-scanner';

describe('classifyCommand', () => {
  it('blocks rm -rf', () => {
    expect(classifyCommand('rm -rf /')).toBe('blocked');
  });

  it('confirms npm install', () => {
    expect(classifyCommand('npm install')).toBe('confirm');
  });
});
```

## Writing component tests

```typescript
import { render, screen } from '@testing-library/react';
import { DiffViewer } from '../components/DiffViewer';

it('shows accept and reject buttons', () => {
  render(<DiffViewer original="a" modified="b" originalPath="foo.ts" onAccept={() => {}} onReject={() => {}} />);
  expect(screen.getByText('Aceitar')).toBeInTheDocument();
  expect(screen.getByText('Rejeitar')).toBeInTheDocument();
});
```

## Using the fake provider

Tests that exercise the chat or agent system use `FakeProvider` — a provider that returns scripted responses without hitting any API:

```typescript
import { FakeProvider } from '@visualnscode/providers/testing';

const provider = new FakeProvider([
  { content: 'Hello', usage: { inputTokens: 5, outputTokens: 3, costUsd: 0 } },
]);
```

## Mocking IPC in renderer tests

The renderer accesses `window.visualnscode`. In tests, stub the object:

```typescript
vi.stubGlobal('visualnscode', {
  fs: {
    listDir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(''),
  },
  git: {
    status: vi.fn().mockResolvedValue({ branch: 'main', files: [] }),
  },
});
```

## Coverage

Run `pnpm test -- --coverage` (requires `@vitest/coverage-v8`). Coverage is reported in `coverage/`. The CI workflow uploads coverage to Codecov when configured.
