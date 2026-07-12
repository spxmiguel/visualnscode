import { Circle, X } from 'lucide-react';
import { useWorkspaceStore } from '../workspace-store';

export function FileTabs() {
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const closeTab = useWorkspaceStore((state) => state.closeTab);
  const files = useWorkspaceStore((state) => state.files);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const openTabs = useWorkspaceStore((state) => state.openTabs);

  return (
    <div
      aria-label="Abas abertas"
      className="flex h-9 overflow-x-auto border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
      role="tablist"
    >
      {openTabs.map((fileId) => {
        const file = files.find(({ id }) => id === fileId);
        if (!file) return null;
        const isDirty = file.content !== file.initialContent;
        const isActive = activeFileId === fileId;
        return (
          <div
            className={`group flex min-w-32 max-w-52 items-center border-r border-[rgb(var(--border))] ${isActive ? 'bg-[rgb(var(--background))] text-[rgb(var(--text))]' : 'text-[rgb(var(--text-muted))]'}`}
            key={file.id}
          >
            <button
              aria-selected={isActive}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 text-xs"
              onClick={() => openFile(file.id)}
              role="tab"
              type="button"
            >
              {isDirty ? <Circle className="size-2 fill-current" /> : null}
              <span className="truncate">{file.name}</span>
            </button>
            <button
              aria-label={`Fechar ${file.name}`}
              className="mr-1 rounded p-1 opacity-0 hover:bg-[rgb(var(--surface-hover))] group-hover:opacity-100 focus:opacity-100"
              onClick={() => closeTab(file.id)}
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
