import {
  Braces,
  ChevronDown,
  FileCode2,
  FileText,
  Folder,
  GitBranch,
  ListChecks,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { EmptyState } from '@visualnscode/ui';
import { useAppStore } from '../store';
import { useWorkspaceStore } from '../workspace-store';

const toolCopy = {
  git: ['Git', 'Branch main · nenhuma alteração pendente', GitBranch],
  logs: ['Logs', 'A execução ainda não gerou logs.', ScrollText],
  diffs: ['Alterações', 'Edite um arquivo para visualizar o diff.', Braces],
  tasks: ['Tarefas', '2 tarefas locais prontas para executar.', ListChecks],
  permissions: ['Permissões', 'O workspace não solicitou acesso adicional.', ShieldCheck],
} as const;

export function ExplorerPanel() {
  const mode = useAppStore((state) => state.mode);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const files = useWorkspaceStore((state) => state.files);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);

  if (activeTool !== 'files') {
    const [title, description, Icon] = toolCopy[activeTool];
    return (
      <EmptyState description={description} icon={<Icon className="size-5" />} title={title} />
    );
  }

  const visibleFiles = mode === 'simple' ? files.filter(({ important }) => important) : files;
  return (
    <div className="h-full overflow-auto bg-[rgb(var(--surface))] p-2">
      <div className="mb-2 flex items-center gap-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
        <ChevronDown className="size-3" /> Meu projeto
      </div>
      <div className="mb-1 flex items-center gap-2 px-2 py-1.5 text-xs text-[rgb(var(--text-muted))]">
        <Folder className="size-4 fill-violet-500/15 text-violet-500" /> src
      </div>
      {visibleFiles.map((file) => (
        <button
          className={`flex w-full items-center gap-2 rounded-md py-1.5 pl-7 pr-2 text-left text-xs transition ${activeFileId === file.id ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text))]'}`}
          key={file.id}
          onClick={() => openFile(file.id)}
          type="button"
        >
          {file.language === 'markdown' ? (
            <FileText className="size-3.5 text-sky-500" />
          ) : (
            <FileCode2 className="size-3.5 text-amber-500" />
          )}
          <span className="truncate">{file.name}</span>
        </button>
      ))}
      {mode === 'simple' ? (
        <p className="mt-4 px-2 text-[10px] leading-4 text-[rgb(var(--text-subtle))]">
          Mostrando apenas arquivos importantes.
        </p>
      ) : null}
    </div>
  );
}
