// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useChatStore } from './chat-store';
import { ChatPanel } from './components/chat/ChatPanel';
import { useWorkspaceStore } from './workspace-store';

beforeEach(() => {
  window.localStorage.clear();
  useChatStore.setState({
    activeRequestId: null,
    messages: [],
    selectedModel: '',
    selectedProviderId: '',
  });
  useWorkspaceStore.setState({ activeFileId: 'app', openTabs: ['app'] });
});

afterEach(() => cleanup());

describe('chat do workspace', () => {
  it('faz streaming, mostra contexto e salva o histórico', async () => {
    const user = userEvent.setup();
    render(<ChatPanel />);

    expect(screen.getByText('App.tsx')).not.toBeNull();
    const input = await screen.findByRole('textbox', { name: 'Mensagem para o chat' });
    await waitFor(() => expect((input as HTMLTextAreaElement).disabled).toBe(false));
    expect(document.querySelector('[data-provider-icon="ollama"]')).not.toBeNull();
    await user.type(input, 'Explique este arquivo');
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    await waitFor(() =>
      expect(screen.queryByText(/Conexão simulada: configure um provider/)).not.toBeNull(),
    );
    expect(screen.queryByText('ollama · modelo-local')).not.toBeNull();
    expect(window.localStorage.getItem('visualnscode-chat-history')).toContain(
      'Explique este arquivo',
    );
  });

  it('permite limpar a conversa', async () => {
    const user = userEvent.setup();
    useChatStore.getState().begin({
      content: 'Mensagem temporária',
      providerId: 'fake',
      model: 'fake-model',
      contextFiles: [],
    });
    render(<ChatPanel />);

    await user.click(screen.getByRole('button', { name: 'Limpar conversa' }));
    expect(screen.queryByText('Mensagem temporária')).toBeNull();
    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});
