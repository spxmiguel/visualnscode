import { Bot, Eye, Send, Sparkles } from 'lucide-react';
import { Button, EmptyState } from '@visualnscode/ui';
import { useState, type FormEvent } from 'react';
import { useWorkspaceStore } from '../workspace-store';

export function RightWorkspacePanel() {
  const rightPanel = useWorkspaceStore((state) => state.rightPanel);
  const setRightPanel = useWorkspaceStore((state) => state.setRightPanel);
  const [draft, setDraft] = useState('');
  const [question, setQuestion] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setQuestion(draft.trim());
    setDraft('');
  };

  return (
    <aside className="flex h-full min-w-0 flex-col border-l border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <div className="flex h-9 shrink-0 border-b border-[rgb(var(--border))] p-1">
        <button
          aria-pressed={rightPanel === 'chat'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md text-xs ${rightPanel === 'chat' ? 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text))] shadow-sm' : 'text-[rgb(var(--text-muted))]'}`}
          onClick={() => setRightPanel('chat')}
          type="button"
        >
          <Bot className="size-3.5" /> Chat
        </button>
        <button
          aria-pressed={rightPanel === 'preview'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md text-xs ${rightPanel === 'preview' ? 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text))] shadow-sm' : 'text-[rgb(var(--text-muted))]'}`}
          onClick={() => setRightPanel('preview')}
          type="button"
        >
          <Eye className="size-3.5" /> Preview
        </button>
      </div>
      {rightPanel === 'chat' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="mb-4 flex gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]">
                <Sparkles className="size-3.5" />
              </span>
              <div className="rounded-xl rounded-tl-sm bg-[rgb(var(--surface-raised))] p-3 text-xs leading-5 text-[rgb(var(--text-muted))]">
                Posso explicar o código e sugerir próximos passos. Nesta fase, respondo apenas
                localmente.
              </div>
            </div>
            {question ? (
              <>
                <div className="ml-8 rounded-xl rounded-tr-sm bg-[rgb(var(--accent))] p-3 text-xs leading-5 text-white">
                  {question}
                </div>
                <div className="mt-4 flex gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]">
                    <Bot className="size-3.5" />
                  </span>
                  <div className="rounded-xl rounded-tl-sm bg-[rgb(var(--surface-raised))] p-3 text-xs leading-5 text-[rgb(var(--text-muted))]">
                    Este é um retorno demonstrativo. Nenhuma mensagem saiu do seu computador.
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <form className="border-t border-[rgb(var(--border))] p-3" onSubmit={submit}>
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-2 focus-within:border-[rgb(var(--accent))]">
              <textarea
                aria-label="Mensagem para o chat"
                className="h-16 w-full resize-none bg-transparent px-1 text-xs outline-none placeholder:text-[rgb(var(--text-subtle))]"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Pergunte sobre seu projeto…"
                value={draft}
              />
              <div className="flex justify-between">
                <span className="px-1 text-[10px] text-[rgb(var(--text-subtle))]">
                  Assistente local
                </span>
                <Button aria-label="Enviar mensagem" className="size-7 p-0" size="sm">
                  <Send className="size-3" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="h-full p-3">
          <div className="flex h-full min-h-56 flex-col overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white">
            <div className="flex h-7 items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-2">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
            </div>
            <div className="min-h-0 flex-1 bg-gradient-to-br from-violet-50 to-white">
              <EmptyState
                description="Clique em Executar para atualizar esta visualização."
                icon={<Eye className="size-5" />}
                title="Seu app aparecerá aqui"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
