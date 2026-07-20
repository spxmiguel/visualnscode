// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VersionControlPanel } from './components/VersionControlPanel';
import { useAppStore } from './store';

const git = {
  status: vi.fn().mockResolvedValue({
    branch: 'main',
    tracking: 'origin/main',
    ahead: 1,
    behind: 0,
    files: [{ path: 'src/app.ts', staged: false, status: 'M', conflict: false }],
  }),
  log: vi.fn().mockResolvedValue([
    {
      hash: 'a1b2c3d4',
      shortHash: 'a1b2c3d',
      subject: 'feat(app): add dashboard',
      author: 'spx miguel',
      date: 'agora',
      refs: ['HEAD -> main'],
    },
  ]),
  branches: vi.fn().mockResolvedValue([{ name: 'main', current: true, remote: false }]),
  tags: vi.fn().mockResolvedValue([]),
  conflicts: vi.fn().mockResolvedValue([]),
  stage: vi.fn().mockResolvedValue(undefined),
  unstage: vi.fn().mockResolvedValue(undefined),
  suggestCommit: vi.fn().mockResolvedValue('feat(project): update project file'),
  commit: vi.fn().mockResolvedValue('a1b2c3d'),
  stash: vi.fn().mockResolvedValue(undefined),
  stashPop: vi.fn().mockResolvedValue(undefined),
  checkout: vi.fn().mockResolvedValue(undefined),
  merge: vi.fn().mockResolvedValue(undefined),
  push: vi.fn().mockResolvedValue(undefined),
  pull: vi.fn().mockResolvedValue(undefined),
  revert: vi.fn().mockResolvedValue(undefined),
  resolveConflict: vi.fn().mockResolvedValue(undefined),
};

const github = {
  authStatus: vi.fn().mockResolvedValue({ authenticated: true, username: 'spxmiguel' }),
  issues: vi.fn().mockResolvedValue([]),
  pullRequests: vi.fn().mockResolvedValue([]),
  workflowRuns: vi.fn().mockResolvedValue([]),
  releases: vi.fn().mockResolvedValue([]),
  open: vi.fn().mockResolvedValue('https://github.com/spxmiguel/visualnscode'),
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'visualnscode', {
    configurable: true,
    value: { git, github },
  });
});

afterEach(() => cleanup());

describe('VersionControlPanel', () => {
  it('uses beginner-friendly actions and keeps an AI suggestion editable', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ mode: 'simple' });
    render(<VersionControlPanel />);

    expect(await screen.findByText('Salvar versão')).not.toBeNull();
    expect(screen.getByText('Enviar para GitHub')).not.toBeNull();
    expect(screen.getByText('Baixar alterações')).not.toBeNull();
    expect(screen.getByText('Criar cópia de segurança')).not.toBeNull();
    expect(await screen.findByText('feat(app): add dashboard')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Sugerir mensagem' }));
    await waitFor(() =>
      expect(
        (screen.getByPlaceholderText('Explique o que mudou…') as HTMLTextAreaElement).value,
      ).toBe('feat(project): update project file'),
    );
    expect(git.commit).not.toHaveBeenCalled();
  });

  it('shows real Git and GitHub concepts in advanced mode', async () => {
    useAppStore.setState({ mode: 'advanced' });
    render(<VersionControlPanel />);

    expect(await screen.findByText('Branches e merge')).not.toBeNull();
    expect(await screen.findByText('Conectado como @spxmiguel')).not.toBeNull();
    expect(screen.getByText('Histórico visual')).not.toBeNull();
    expect(github.issues).toHaveBeenCalledOnce();
  });
});
