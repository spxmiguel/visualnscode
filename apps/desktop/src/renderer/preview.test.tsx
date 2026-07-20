// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectRuntime } from '../shared/runtime';
import { PreviewPanel } from './components/RightWorkspacePanel';
import { useWorkspaceStore } from './workspace-store';

const runtime: ProjectRuntime = {
  kind: 'node',
  manager: 'pnpm',
  framework: 'Vite',
  port: 5173,
  commands: {
    dev: { action: 'dev', label: 'Iniciar projeto', display: 'pnpm run dev' },
  },
  installCommand: 'pnpm install',
  devCommand: 'pnpm run dev',
  buildCommand: '',
  testCommand: '',
};

describe('automatic project preview', () => {
  const start = vi.fn();
  const onEvent = vi.fn(() => () => undefined);

  beforeEach(() => {
    start.mockReset();
    onEvent.mockClear();
    useWorkspaceStore.setState({ autoStartPreview: true });
    Object.defineProperty(window, 'visualnscode', {
      configurable: true,
      value: {
        runner: {
          detect: async () => runtime,
          isRunning: async () => false,
          start,
          onEvent,
        },
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('registers the event listener before consuming the start request', async () => {
    render(<PreviewPanel />);

    await waitFor(() => expect(start).toHaveBeenCalledWith('workspace-dev-server', 'dev'));
    expect(onEvent).toHaveBeenCalledOnce();
    expect(useWorkspaceStore.getState().autoStartPreview).toBe(false);
  });
});
