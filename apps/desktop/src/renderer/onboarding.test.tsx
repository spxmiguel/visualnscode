// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { useAppStore } from './store';

vi.mock('@monaco-editor/react', () => ({ default: () => <div>Editor mock</div> }));

beforeEach(() => {
  window.localStorage.clear();
  useAppStore.setState({
    mode: 'simple',
    onboardingCompleted: false,
    screen: 'home',
    theme: 'dark',
  });
});
afterEach(() => cleanup());

describe('assistente inicial', () => {
  it('aparece na primeira abertura e permite escolher o modo', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.queryByRole('heading', { name: 'Seu ambiente, sem complicação.' }),
    ).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Avançado' }));
    expect(useAppStore.getState().mode).toBe('advanced');
  });
  it('mostra as sete permissões e não concede instalação por padrão', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Permissões' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(7);
    const installation = screen.getByRole('checkbox', {
      name: 'InstalaçãoInstalar após confirmação individual.',
    });
    expect((installation as HTMLInputElement).checked).toBe(false);
  });
  it('só conclui quando o usuário confirma o resumo final', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '12Tudo pronto' }));
    await user.click(screen.getByRole('button', { name: 'Entrar no VisualnsCode' }));
    expect(useAppStore.getState().onboardingCompleted).toBe(true);
    expect(screen.queryByRole('heading', { name: 'O que vamos criar hoje?' })).not.toBeNull();
  });
});
