import {
  CheckCircle2,
  GitBranch,
  GitCommit,
  ListChecks,
  Loader2,
  ScrollText,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';
import { Button } from '@visualnscode/ui';
import { useCallback, useEffect, useState } from 'react';
import type { GitFileStatus, GitLogEntry } from '../electron.d';
import { useWorkspaceStore, type BottomPanel as BottomPanelName } from '../workspace-store';
import { EditReviewPanel } from './EditReviewPanel';

const tabs: readonly [BottomPanelName, string, typeof TerminalSquare][] = [
  ['terminal', 'Terminal', TerminalSquare],
  ['tasks', 'Tarefas', ListChecks],
  ['logs', 'Logs', ScrollText],
  ['git', 'Git', GitBranch],
  ['diffs', 'Diffs', CheckCircle2],
  ['permissions', 'Permissões', ShieldCheck],
];

function GitPanel() {
  const [branch, setBranch] = useState('');
  const [files, setFiles] = useState<GitFileStatus[]>([]);
  const [log, setLog] = useState<GitLogEntry[]>([]);
  const [commitMsg, setCommitMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.visualnscode?.git) return;
    const [status, history] = await Promise.all([
      window.visualnscode.git.status().catch(() => ({ branch: '', files: [] })),
      window.visualnscode.git.log(10).catch(() => []),
    ]);
    setBranch(status.branch);
    setFiles([...status.files]);
    setLog([...history]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const stage = async (path: string) => {
    await window.visualnscode?.git.stage([path]);
    void refresh();
  };

  const unstage = async (path: string) => {
    await window.visualnscode?.git.unstage([path]);
    void refresh();
  };

  const commit = async () => {
    if (!commitMsg.trim()) return;
    setLoading(true);
    try {
      await window.visualnscode?.git.commit(commitMsg);
      setCommitMsg('');
      void refresh();
    } finally {
      setLoading(false);
    }
  };

  const unstaged = files.filter((f) => !f.staged);
  const staged = files.filter((f) => f.staged);

  return (
    <div className="flex h-full min-h-0 gap-0">
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3 font-mono text-xs">
        <div className="mb-3 flex items-center gap-2 text-[rgb(var(--text))]">
          <GitBranch className="size-3.5 text-[rgb(var(--accent))]" />
          <span className="font-semibold">{branch || '—'}</span>
        </div>

        {staged.length > 0 ? (
          <div className="mb-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
              Staged ({staged.length})
            </p>
            {staged.map((f) => (
              <div className="flex items-center gap-2 py-0.5" key={f.path}>
                <span className="text-emerald-400">{f.status}</span>
                <span className="truncate text-[rgb(var(--text-muted))]">{f.path}</span>
                <button
                  className="ml-auto text-[rgb(var(--text-subtle))] hover:text-[rgb(var(--text))]"
                  onClick={() => void unstage(f.path)}
                  type="button"
                >
                  −
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {unstaged.length > 0 ? (
          <div className="mb-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500">
              Alterações ({unstaged.length})
            </p>
            {unstaged.map((f) => (
              <div className="flex items-center gap-2 py-0.5" key={f.path}>
                <span className="text-amber-400">{f.status}</span>
                <span className="truncate text-[rgb(var(--text-muted))]">{f.path}</span>
                <button
                  className="ml-auto text-[rgb(var(--text-subtle))] hover:text-[rgb(var(--text))]"
                  onClick={() => void stage(f.path)}
                  type="button"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {files.length === 0 ? (
          <p className="text-[rgb(var(--text-subtle))]">Árvore de trabalho limpa.</p>
        ) : null}
      </div>

      <div className="flex w-56 shrink-0 flex-col border-l border-[rgb(var(--border))] p-3">
        <div className="mb-2 flex flex-col gap-1.5">
          <textarea
            className="w-full resize-none rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-2 text-xs text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-subtle))] focus:border-[rgb(var(--accent))]"
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="feat: mensagem de commit…"
            rows={3}
            value={commitMsg}
          />
          <Button
            disabled={!commitMsg.trim() || staged.length === 0 || loading}
            onClick={() => void commit()}
            size="sm"
          >
            {loading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <GitCommit className="size-3" />
            )}
            Commit
          </Button>
        </div>

        <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
          Histórico
        </p>
        <div className="min-h-0 overflow-auto font-mono text-[10px]">
          {log.map((entry) => (
            <div className="mb-1.5" key={entry.hash}>
              <span className="text-violet-400">{entry.shortHash}</span>
              <span className="ml-2 text-[rgb(var(--text-muted))]">{entry.subject}</span>
              <p className="mt-0.5 text-[rgb(var(--text-subtle))]">{entry.date}</p>
            </div>
          ))}
          {log.length === 0 ? (
            <p className="text-[rgb(var(--text-subtle))]">Sem commits ainda.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function BottomPanel() {
  const bottomPanel = useWorkspaceStore((state) => state.bottomPanel);
  const setBottomPanel = useWorkspaceStore((state) => state.setBottomPanel);
  return (
    <section className="flex h-full min-h-0 flex-col border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))]">
      <div className="flex h-8 shrink-0 gap-1 border-b border-[rgb(var(--border))] px-2">
        {tabs.map(([tab, label, Icon]) => (
          <button
            className={`flex items-center gap-1.5 border-b-2 px-2 text-[11px] ${bottomPanel === tab ? 'border-[rgb(var(--accent))] text-[rgb(var(--text))]' : 'border-transparent text-[rgb(var(--text-muted))]'}`}
            key={tab}
            onClick={() => setBottomPanel(tab)}
            type="button"
          >
            <Icon className="size-3" />
            {label}
          </button>
        ))}
      </div>
      <div
        className={`min-h-0 flex-1 overflow-auto text-xs text-[rgb(var(--text-muted))] ${
          bottomPanel === 'diffs' ? '' : 'p-3 font-mono'
        }`}
      >
        {bottomPanel === 'terminal' ? (
          <>
            <p>
              <span className="text-emerald-500">visualnscode</span>{' '}
              <span className="text-violet-400">main</span> $ pnpm dev
            </p>
            <p className="mt-2 text-[rgb(var(--text-subtle))]">
              Terminal via node-pty chegará na próxima fase.
            </p>
          </>
        ) : null}
        {bottomPanel === 'tasks' ? (
          <div className="space-y-2">
            <p>○ Iniciar servidor de desenvolvimento</p>
            <p>○ Verificar tipos</p>
            <p>✓ Preparar workspace</p>
          </div>
        ) : null}
        {bottomPanel === 'logs' ? <p>[info] Workspace aberto com segurança.</p> : null}
        {bottomPanel === 'git' ? <GitPanel /> : null}
        {bottomPanel === 'diffs' ? <EditReviewPanel /> : null}
        {bottomPanel === 'permissions' ? (
          <p>Filesystem: somente workspace · Rede: bloqueada · Shell: bloqueado.</p>
        ) : null}
      </div>
    </section>
  );
}
