import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { FileCode2, RotateCw, Send, Square, Trash2, Upload } from 'lucide-react';
import type { ProviderSummary } from '@visualnscode/providers/browser';
import { Button } from '@visualnscode/ui';
import { useChatStore } from '../../chat-store';
import { providerApi } from '../../provider-api';
import { useWorkspaceStore } from '../../workspace-store';

export function ChatPanel({ simple = false }: { readonly simple?: boolean }) {
  const [providers, setProviders] = useState<readonly ProviderSummary[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = useChatStore((state) => state.messages);
  const activeRequestId = useChatStore((state) => state.activeRequestId);
  const selectedProviderId = useChatStore((state) => state.selectedProviderId);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const draft = useChatStore((state) => state.draft);
  const setDraft = useChatStore((state) => state.setDraft);
  const files = useWorkspaceStore((state) => state.files);
  const openTabs = useWorkspaceStore((state) => state.openTabs);
  const contextFiles = useMemo(
    () => openTabs.flatMap((id) => files.find((file) => file.id === id) ?? []),
    [files, openTabs],
  );
  const enabledProviders = providers.filter(({ settings }) => settings.enabled);
  const selected =
    enabledProviders.find(({ id }) => id === selectedProviderId) ?? enabledProviders[0];

  useEffect(() => {
    void providerApi.providers.list().then((result) => {
      setProviders(result);
      const enabled = result.filter(({ settings }) => settings.enabled);
      const current = enabled.find(({ id }) => id === useChatStore.getState().selectedProviderId);
      const first = current ?? enabled[0];
      if (first) {
        useChatStore
          .getState()
          .setSelection(
            first.id,
            useChatStore.getState().selectedModel || first.settings.defaultModel,
          );
      }
    });
  }, []);

  useEffect(
    () =>
      providerApi.chat.onChunk((chunk) => {
        const store = useChatStore.getState();
        if (chunk.type === 'text') store.append(chunk.requestId, chunk.text);
        if (chunk.type === 'usage') store.setUsage(chunk.requestId, chunk.usage);
        if (chunk.type === 'done') store.finish(chunk.requestId);
        if (chunk.type === 'error') store.fail(chunk.requestId, chunk.message);
      }),
    [],
  );

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const send = (content: string) => {
    const prompt = content.trim();
    if (!prompt || activeRequestId || !selected || !selectedModel) return;
    const context = contextFiles.map(({ path, content: fileContent }) => ({
      path,
      content: fileContent,
    }));
    const requestId = useChatStore.getState().begin({
      content: prompt,
      providerId: selected.id,
      model: selectedModel,
      contextFiles: context.map(({ path }) => path),
    });
    providerApi.chat.start({
      providerId: selected.id,
      input: {
        requestId,
        model: selectedModel,
        messages: [
          ...useChatStore
            .getState()
            .messages.filter((message) => message.status === 'complete')
            .slice(-20)
            .map((message) => ({ id: message.id, role: message.role, content: message.content })),
        ],
        contextFiles: context,
        maxTokens: selected.settings.tokenLimit,
        timeoutMs: selected.settings.timeoutMs,
      },
    });
    setDraft('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };

  const cancel = async () => {
    if (!activeRequestId) return;
    await providerApi.chat.cancel(activeRequestId);
    useChatStore.getState().cancel(activeRequestId);
  };

  const resend = () => {
    const last = [...messages].reverse().find(({ role }) => role === 'user');
    if (last) send(last.content);
  };

  const exportConversation = () => {
    const markdown = messages
      .map(
        (message) =>
          `## ${message.role === 'user' ? 'Você' : `${message.providerId} · ${message.model}`}\n\n${message.content}`,
      )
      .join('\n\n');
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `visualnscode-conversa-${new Date().toISOString().slice(0, 10)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5 border-b border-[rgb(var(--border))] px-2 py-1.5">
        {simple ? (
          <div className="min-w-0 flex-1 px-1 py-1">
            <p className="truncate text-[11px] font-medium text-[rgb(var(--text))]">
              Assistente do projeto
            </p>
            <p className="truncate text-[9px] text-[rgb(var(--text-subtle))]">
              {selected
                ? `${selected.settings.alias || selected.name} · ${selectedModel}`
                : 'Configure um provider para conversar'}
            </p>
          </div>
        ) : (
          <>
            <select
              aria-label="Provider do chat"
              className="min-w-0 flex-1 rounded-md bg-[rgb(var(--surface-sunken))] px-2 py-1 text-[10px] outline-none"
              onChange={(event) => {
                const next = enabledProviders.find(({ id }) => id === event.target.value);
                if (next) useChatStore.getState().setSelection(next.id, next.settings.defaultModel);
              }}
              value={selected?.id ?? ''}
            >
              {enabledProviders.length === 0 ? (
                <option value="">Configure um provider</option>
              ) : null}
              {enabledProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.settings.alias || provider.name}
                </option>
              ))}
            </select>
            <input
              aria-label="Modelo do chat"
              className="min-w-0 flex-1 rounded-md bg-[rgb(var(--surface-sunken))] px-2 py-1 text-[10px] outline-none"
              onChange={(event) =>
                selected && useChatStore.getState().setSelection(selected.id, event.target.value)
              }
              placeholder="Modelo"
              value={selectedModel}
            />
          </>
        )}
        <button
          aria-label="Reenviar última mensagem"
          className="rounded-md p-1.5 hover:bg-[rgb(var(--surface-hover))]"
          disabled={Boolean(activeRequestId)}
          onClick={resend}
          type="button"
        >
          <RotateCw className="size-3.5" />
        </button>
        <button
          aria-label="Exportar conversa"
          className="rounded-md p-1.5 hover:bg-[rgb(var(--surface-hover))]"
          disabled={messages.length === 0}
          onClick={exportConversation}
          type="button"
        >
          <Upload className="size-3.5" />
        </button>
        <button
          aria-label="Limpar conversa"
          className="rounded-md p-1.5 hover:bg-[rgb(var(--surface-hover))]"
          disabled={messages.length === 0}
          onClick={() => useChatStore.getState().clear()}
          type="button"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="border-l border-[rgb(var(--border-strong))] pl-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[rgb(var(--text-subtle))]">
              {simple ? 'O que vamos mudar?' : 'Assistente / novo contexto'}
            </p>
            <p className="mt-2 max-w-[28rem] text-xs leading-5 text-[rgb(var(--text-muted))]">
              {simple
                ? 'Descreva o resultado em linguagem normal. Toda alteração em arquivo será mostrada para sua revisão antes de ser aplicada.'
                : 'Abra os arquivos relevantes, escolha um provider e descreva a tarefa.'}
            </p>
          </div>
        ) : null}
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              className={`border-l pl-3 ${message.role === 'user' ? 'ml-8 border-[rgb(var(--border-strong))]' : 'border-[rgb(var(--accent))]'}`}
              key={message.id}
            >
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[rgb(var(--text-subtle))]">
                {message.role === 'user' ? 'Você' : 'Assistente'}
              </p>
              <div className="min-w-0 text-xs leading-5 text-[rgb(var(--text-muted))]">
                <p className="whitespace-pre-wrap break-words">{message.content || 'Pensando…'}</p>
                {message.role === 'assistant' ? (
                  <div className="mt-2 flex flex-wrap gap-x-2 text-[9px] text-[rgb(var(--text-subtle))]">
                    <span>
                      {message.providerId} · {message.model}
                    </span>
                    {message.usage ? (
                      <span>
                        {message.usage.totalTokens} tokens{' '}
                        {message.usage.estimated ? 'estimados' : ''} · custo{' '}
                        {message.usage.estimatedCostUsd === null
                          ? 'não calculado'
                          : `$${message.usage.estimatedCostUsd.toFixed(4)}`}
                      </span>
                    ) : null}
                    {message.status === 'error' ? (
                      <span className="text-red-400">Erro amigável</span>
                    ) : null}
                    {message.status === 'cancelled' ? <span>Cancelada</span> : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      <form className="border-t border-[rgb(var(--border))] p-3" onSubmit={submit}>
        <div className="mb-2 flex flex-wrap gap-1">
          {contextFiles.map((file) => (
            <span
              className="flex items-center gap-1 rounded-md bg-[rgb(var(--surface-sunken))] px-2 py-1 text-[9px] text-[rgb(var(--text-muted))]"
              key={file.id}
            >
              <FileCode2 className="size-3" /> {file.name}
            </span>
          ))}
        </div>
        <div className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-2 focus-within:border-[rgb(var(--accent))]">
          <textarea
            aria-label="Mensagem para o chat"
            className="h-16 w-full resize-none bg-transparent px-1 text-xs outline-none placeholder:text-[rgb(var(--text-subtle))]"
            disabled={!selected}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              selected
                ? simple
                  ? 'Ex.: deixe a página inicial mais clara e organizada…'
                  : 'Pergunte sobre seu projeto…'
                : 'Ative um provider nas configurações'
            }
            value={draft}
          />
          <div className="flex items-center justify-between">
            <span className="px-1 text-[10px] text-[rgb(var(--text-subtle))]">
              {simple
                ? 'Contexto do projeto protegido'
                : `${contextFiles.length} arquivo(s) no contexto`}
            </span>
            {activeRequestId ? (
              <Button
                aria-label="Cancelar resposta"
                className="size-7 p-0"
                onClick={() => void cancel()}
                size="sm"
                type="button"
                variant="secondary"
              >
                <Square className="size-3 fill-current" />
              </Button>
            ) : (
              <Button
                aria-label="Enviar mensagem"
                className="size-7 p-0"
                disabled={!draft.trim() || !selected || !selectedModel}
                size="sm"
                type="submit"
              >
                <Send className="size-3" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
