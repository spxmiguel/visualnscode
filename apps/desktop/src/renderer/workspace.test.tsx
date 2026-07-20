// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { WorkspaceScreen } from './components/WorkspaceScreen';
import { demoProjects, useAppStore } from './store';
import { useWorkspaceStore } from './workspace-store';

vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value }: { onChange?: (value: string) => void; value?: string }) => (
    <textarea
      aria-label="Mock Monaco editor"
      onChange={(event) => onChange?.(event.target.value)}
      value={value ?? ''}
    />
  ),
  loader: { config: vi.fn() },
}));
vi.mock('monaco-editor', () => ({}));

beforeEach(() => {
  window.localStorage.clear();
  useAppStore.setState({
    activeProject: demoProjects[0] ?? null,
    error: null,
    mode: 'simple',
    onboardingCompleted: true,
    screen: 'workspace',
    theme: 'dark',
  });
  useWorkspaceStore.setState({
    activeFileId: 'app',
    activeTool: 'files',
    bottomPanel: 'terminal',
    isBottomOpen: true,
    isExplorerOpen: true,
    isRightOpen: true,
    openTabs: ['app'],
    rightPanel: 'chat',
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('workspace', () => {
  it('abre e fecha os painéis principais', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ mode: 'advanced' });
    render(<WorkspaceScreen />);

    expect(await screen.findByText('Meu projeto', undefined, { timeout: 5_000 })).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Alternar explorador (⌘B)' }));
    expect(screen.queryByText('Meu projeto')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Alternar explorador (⌘B)' }));
    expect(screen.queryByText('Meu projeto')).not.toBeNull();

    expect(screen.queryByText('Terminal via node-pty chegará na próxima fase.')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Alternar painel inferior (⌘J)' }));
    expect(screen.queryByText('Terminal via node-pty chegará na próxima fase.')).toBeNull();
  });

  it('alterna entre os modos simples e avançado', async () => {
    const user = userEvent.setup();
    render(<WorkspaceScreen />);

    expect(screen.queryByRole('navigation', { name: 'Ferramentas avançadas' })).toBeNull();
    expect(screen.queryByLabelText('Mock Monaco editor')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Resultado do projeto' })).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Avançado' }));
    expect(await screen.findByRole('navigation', { name: 'Ferramentas avançadas' })).not.toBeNull();
    expect(useAppStore.getState().mode).toBe('advanced');
  });

  it('abre um arquivo pelo explorador', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ mode: 'advanced' });
    render(<WorkspaceScreen />);

    await user.click(await screen.findByRole('button', { name: 'styles.css' }));
    expect(useWorkspaceStore.getState().activeFileId).toBe('styles');
    expect(screen.queryByRole('tab', { name: 'styles.css' })).not.toBeNull();
  });

  it('cria e fecha abas de arquivo', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ mode: 'advanced' });
    render(<WorkspaceScreen />);

    await user.click(await screen.findByRole('button', { name: 'README.md' }));
    expect(useWorkspaceStore.getState().openTabs).toEqual(['app', 'readme']);
    await user.click(screen.getByRole('button', { name: 'Fechar README.md' }));
    expect(useWorkspaceStore.getState().openTabs).toEqual(['app']);
    expect(screen.queryByRole('tab', { name: 'README.md' })).toBeNull();
  });
});

describe('tema', () => {
  it('acompanha mudanças do tema do computador no modo Sistema', async () => {
    let dark = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: dark,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      })),
    );
    useAppStore.setState({ screen: 'home', theme: 'system' });
    render(<App />);

    expect(document.documentElement.dataset.theme).toBe('light');
    act(() => {
      dark = true;
      listeners.forEach((listener) => listener());
    });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(useAppStore.getState().theme).toBe('system');
  });

  it('troca o tema e persiste a preferência', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ screen: 'home', theme: 'dark' });
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Usar tema claro' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(useAppStore.getState().theme).toBe('light');
    expect(window.localStorage.getItem('visualnscode-preferences')).toContain('light');
  });

  it('mantém a troca de tema disponível nos dois modos do workspace', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Usar tema claro' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(useAppStore.getState().theme).toBe('light');
    expect(screen.getByRole('button', { name: 'Usar tema escuro' })).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Avançado' }));
    await user.click(await screen.findByRole('button', { name: 'Usar tema escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
