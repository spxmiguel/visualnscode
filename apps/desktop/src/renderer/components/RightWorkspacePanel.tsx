import { Bot, Eye } from 'lucide-react';
import { EmptyState } from '@visualnscode/ui';
import { useWorkspaceStore } from '../workspace-store';
import { ChatPanel } from './chat/ChatPanel';

export function RightWorkspacePanel() {
  const rightPanel = useWorkspaceStore((state) => state.rightPanel);
  const setRightPanel = useWorkspaceStore((state) => state.setRightPanel);
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
        <ChatPanel />
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
