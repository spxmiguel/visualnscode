import { Check, History, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { Button, EmptyState } from '@visualnscode/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EditProposal } from '../../shared/edit-model';
import type { CheckpointSummary } from '../electron.d';
import { DiffViewer } from './DiffViewer';

export function EditReviewPanel() {
  const [proposals, setProposals] = useState<readonly EditProposal[]>([]);
  const [history, setHistory] = useState<readonly CheckpointSummary[]>([]);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<ReadonlySet<string>>(new Set());
  const [selectedBlocks, setSelectedBlocks] = useState<
    Readonly<Record<string, ReadonlySet<string>>>
  >({});
  const [editedContent, setEditedContent] = useState<Readonly<Record<string, string>>>({});
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.visualnscode?.edits) return;
    const [nextProposals, nextHistory] = await Promise.all([
      window.visualnscode.edits.list(),
      window.visualnscode.edits.history(),
    ]);
    setProposals(nextProposals);
    setHistory(nextHistory);
    const pending = nextProposals.find(({ status }) => status === 'pending');
    setActiveProposalId((current) =>
      current && nextProposals.some(({ id, status }) => id === current && status === 'pending')
        ? current
        : (pending?.id ?? null),
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const proposal = useMemo(
    () => proposals.find(({ id }) => id === activeProposalId) ?? null,
    [activeProposalId, proposals],
  );
  const file =
    proposal?.files.find(({ path }) => path === activePath) ?? proposal?.files[0] ?? null;

  useEffect(() => {
    if (!proposal) return;
    setActivePath((current) =>
      current && proposal.files.some(({ path }) => path === current)
        ? current
        : (proposal.files[0]?.path ?? null),
    );
    setSelectedFiles(new Set(proposal.files.map(({ path }) => path)));
    setSelectedBlocks(
      Object.fromEntries(
        proposal.files.map((candidate) => [
          candidate.path,
          new Set(candidate.blocks.map(({ id }) => id)),
        ]),
      ),
    );
    setEditedContent(
      Object.fromEntries(proposal.files.map((candidate) => [candidate.path, candidate.modified])),
    );
    setEditing(false);
  }, [proposal?.id]);

  const toggleFile = (path: string): void => {
    setSelectedFiles((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleBlock = (path: string, blockId: string): void => {
    setSelectedBlocks((current) => {
      const nextForFile = new Set(current[path] ?? []);
      if (nextForFile.has(blockId)) nextForFile.delete(blockId);
      else nextForFile.add(blockId);
      return { ...current, [path]: nextForFile };
    });
  };

  const apply = async (): Promise<void> => {
    if (!proposal || !window.visualnscode?.edits) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await window.visualnscode.edits.apply(
        proposal.id,
        proposal.files.map((candidate) => ({
          path: candidate.path,
          accepted: selectedFiles.has(candidate.path),
          blockIds: [...(selectedBlocks[candidate.path] ?? [])],
          ...(editing && candidate.path === file?.path
            ? { editedContent: editedContent[candidate.path] ?? candidate.modified }
            : {}),
        })),
      );
      setMessage(
        `${result.appliedFiles.length} arquivo(s) aplicado(s). Checkpoint ${result.checkpointId} criado.`,
      );
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível aplicar a proposta.');
    } finally {
      setBusy(false);
    }
  };

  const reject = async (): Promise<void> => {
    if (!proposal || !window.visualnscode?.edits) return;
    setBusy(true);
    try {
      await window.visualnscode.edits.reject(proposal.id);
      setMessage('Proposta rejeitada sem alterar arquivos.');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (checkpointId: string): Promise<void> => {
    if (!window.visualnscode?.edits) return;
    const confirmed = window.confirm(
      'Desfazer este checkpoint? Um novo snapshot será criado antes do rollback.',
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      const result = await window.visualnscode.edits.rollback(checkpointId);
      setMessage(`${result.restored.length} arquivo(s) restaurado(s).`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível desfazer.');
    } finally {
      setBusy(false);
    }
  };

  if (!window.visualnscode?.edits) {
    return (
      <EmptyState
        description="O fluxo seguro de edição está disponível no aplicativo desktop."
        icon={<ShieldAlert className="size-5" />}
        title="Revisão protegida"
      />
    );
  }

  if (!proposal || !file) {
    return (
      <div className="grid h-full min-h-0 grid-cols-[1fr_280px]">
        <EmptyState
          description="Quando uma IA propuser alterações, os arquivos e blocos aparecerão aqui antes de qualquer gravação."
          icon={<Check className="size-5" />}
          title="Nenhuma alteração aguardando revisão"
        />
        <HistoryPanel busy={busy} history={history} onRollback={rollback} />
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[220px_minmax(0,1fr)_250px]">
      <aside className="min-h-0 overflow-auto border-r border-[rgb(var(--border))] p-2">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
          {proposal.title}
        </p>
        {proposal.files.map((candidate) => (
          <div
            className={`mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 ${candidate.path === file.path ? 'bg-[rgb(var(--accent-soft))]' : ''}`}
            key={candidate.path}
          >
            <input
              aria-label={`Aceitar arquivo ${candidate.path}`}
              checked={selectedFiles.has(candidate.path)}
              className="accent-[rgb(var(--accent))]"
              onChange={() => toggleFile(candidate.path)}
              type="checkbox"
            />
            <button
              className="min-w-0 flex-1 truncate text-left text-[11px]"
              onClick={() => {
                setActivePath(candidate.path);
                setEditing(false);
              }}
              type="button"
            >
              {candidate.path}
            </button>
            <span className="text-[9px] uppercase text-[rgb(var(--text-subtle))]">
              {candidate.kind}
            </span>
          </div>
        ))}
        <div className="mt-3 flex flex-col gap-1.5 border-t border-[rgb(var(--border))] pt-3">
          <Button
            disabled={busy || selectedFiles.size === 0}
            onClick={() => void apply()}
            size="sm"
          >
            <Check className="size-3" /> Aceitar selecionados
          </Button>
          <Button disabled={busy} onClick={() => void reject()} size="sm" variant="secondary">
            <X className="size-3" /> Rejeitar tudo
          </Button>
        </div>
        {message ? (
          <p className="mt-3 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{message}</p>
        ) : null}
      </aside>

      <DiffViewer
        editedContent={editedContent[file.path] ?? file.modified}
        editing={editing}
        file={file}
        onEditedContentChange={(content) =>
          setEditedContent((current) => ({ ...current, [file.path]: content }))
        }
        onEditingChange={setEditing}
        onToggleBlock={(blockId) => toggleBlock(file.path, blockId)}
        onViewChange={setView}
        selectedBlockIds={selectedBlocks[file.path] ?? new Set()}
        view={view}
      />

      <HistoryPanel busy={busy} history={history} onRollback={rollback} />
    </div>
  );
}

function HistoryPanel({
  busy,
  history,
  onRollback,
}: {
  readonly busy: boolean;
  readonly history: readonly CheckpointSummary[];
  readonly onRollback: (checkpointId: string) => Promise<void>;
}) {
  return (
    <aside className="min-h-0 overflow-auto border-l border-[rgb(var(--border))] p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
        <History className="size-3" /> Histórico
      </p>
      {history.map((checkpoint) => (
        <div className="mb-2 rounded-md border border-[rgb(var(--border))] p-2" key={checkpoint.id}>
          <p className="truncate text-[11px] text-[rgb(var(--text))]">{checkpoint.label}</p>
          <p className="mt-1 text-[9px] text-[rgb(var(--text-subtle))]">
            {checkpoint.fileCount} arquivo(s) · {new Date(checkpoint.createdAt).toLocaleString()}
          </p>
          <button
            className="mt-2 flex items-center gap-1 text-[10px] text-[rgb(var(--accent))] disabled:opacity-40"
            disabled={busy}
            onClick={() => void onRollback(checkpoint.id)}
            type="button"
          >
            <RotateCcw className="size-3" /> Desfazer para este ponto
          </button>
        </div>
      ))}
      {history.length === 0 ? (
        <p className="text-[10px] leading-4 text-[rgb(var(--text-subtle))]">
          Nenhum checkpoint criado.
        </p>
      ) : null}
    </aside>
  );
}
