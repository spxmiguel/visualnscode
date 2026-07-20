import {
  Archive,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitMerge,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { Button } from '@visualnscode/ui';
import { useCallback, useEffect, useState } from 'react';
import type {
  GitBranch as GitBranchInfo,
  GitConflict,
  GitFileStatus,
  GitHubAuthStatus,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRelease,
  GitHubWorkflowRun,
  GitLogEntry,
  GitStatus,
  GitTag,
} from '../../shared/version-control';
import { useAppStore } from '../store';

const EMPTY_STATUS: GitStatus = {
  branch: '',
  tracking: null,
  ahead: 0,
  behind: 0,
  files: [],
};

const inputClass =
  'w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-2 py-1.5 text-xs text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--accent))]';

export function VersionControlPanel() {
  const mode = useAppStore((state) => state.mode);
  const [status, setStatus] = useState<GitStatus>(EMPTY_STATUS);
  const [history, setHistory] = useState<readonly GitLogEntry[]>([]);
  const [branches, setBranches] = useState<readonly GitBranchInfo[]>([]);
  const [tags, setTags] = useState<readonly GitTag[]>([]);
  const [conflicts, setConflicts] = useState<readonly GitConflict[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiff, setSelectedDiff] = useState<{ path: string; content: string } | null>(null);
  const [githubAuth, setGithubAuth] = useState<GitHubAuthStatus | null>(null);
  const [issues, setIssues] = useState<readonly GitHubIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<readonly GitHubPullRequest[]>([]);
  const [runs, setRuns] = useState<readonly GitHubWorkflowRun[]>([]);
  const [releases, setReleases] = useState<readonly GitHubRelease[]>([]);
  const [githubSection, setGithubSection] = useState<'issues' | 'prs' | 'actions' | 'releases'>(
    'issues',
  );

  const refresh = useCallback(async () => {
    if (!window.visualnscode) return;
    const [nextStatus, nextHistory, nextBranches, nextTags, nextConflicts] = await Promise.all([
      window.visualnscode.git.status().catch(() => EMPTY_STATUS),
      window.visualnscode.git.log(50).catch(() => []),
      window.visualnscode.git.branches().catch(() => []),
      window.visualnscode.git.tags().catch(() => []),
      window.visualnscode.git.conflicts().catch(() => []),
    ]);
    setStatus(nextStatus);
    setHistory(nextHistory);
    setBranches(nextBranches);
    setTags(nextTags);
    setConflicts(nextConflicts);
    setSelectedBranch(
      (current) => current || nextBranches.find(({ current }) => !current)?.name || '',
    );
  }, []);

  const refreshGitHub = useCallback(async () => {
    if (!window.visualnscode) return;
    const auth = await window.visualnscode.github.authStatus();
    setGithubAuth(auth);
    if (!auth.authenticated) return;
    const [nextIssues, nextPullRequests, nextRuns, nextReleases] = await Promise.all([
      window.visualnscode.github.issues().catch(() => []),
      window.visualnscode.github.pullRequests().catch(() => []),
      window.visualnscode.github.workflowRuns().catch(() => []),
      window.visualnscode.github.releases().catch(() => []),
    ]);
    setIssues(nextIssues);
    setPullRequests(nextPullRequests);
    setRuns(nextRuns);
    setReleases(nextReleases);
  }, []);

  useEffect(() => {
    void refresh();
    if (mode === 'advanced') void refreshGitHub();
  }, [mode, refresh, refreshGitHub]);

  const perform = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'A operação não pôde ser concluída.');
    } finally {
      setBusy(false);
    }
  };

  const saveVersion = async () => {
    const paths = status.files.map(({ path }) => path);
    if (paths.length && !status.files.some(({ staged }) => staged)) {
      await window.visualnscode?.git.stage(paths);
    }
    await window.visualnscode?.git.commit(commitMessage);
    setCommitMessage('');
  };

  const suggestMessage = async () => {
    const paths = status.files.map(({ path }) => path);
    if (paths.length && !status.files.some(({ staged }) => staged)) {
      await window.visualnscode?.git.stage(paths);
      await refresh();
    }
    const suggestion = await window.visualnscode?.git.suggestCommit();
    if (suggestion) setCommitMessage(suggestion);
  };

  const confirmRemote = (message: string) => window.confirm(message);
  const createRepository = async () => {
    const name = window.prompt('Nome do novo repositório:');
    if (!name) return;
    const description = window.prompt('Descrição curta do repositório:') ?? '';
    const isPublic = window.confirm(
      'Criar como público? Cancele para criar como privado. Uma confirmação final será exibida.',
    );
    if (
      !window.confirm(
        `Confirmar a criação do repositório ${isPublic ? 'público' : 'privado'} ${name}?`,
      )
    )
      return;
    await perform(async () => {
      await window.visualnscode!.github.createRepository({
        name,
        description,
        visibility: isPublic ? 'public' : 'private',
        confirmed: true,
      });
      await refreshGitHub();
    }, 'Repositório criado. Nenhum push foi feito automaticamente.');
  };
  const staged = status.files.filter((file) => file.staged);
  const unstaged = status.files.filter((file) => !file.staged);
  const viewDiff = async (file: GitFileStatus) => {
    const content = await window.visualnscode?.git.diff(file.staged, file.path);
    setSelectedDiff({ path: file.path, content: content ?? '' });
  };

  if (mode === 'simple') {
    return (
      <div className="grid h-full min-h-0 gap-4 overflow-auto p-3 lg:grid-cols-[minmax(280px,0.8fr)_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm font-semibold text-[rgb(var(--text))]">
                Versões do projeto
              </p>
              <p className="font-sans text-xs text-[rgb(var(--text-subtle))]">
                {status.files.length} alteração(ões) · {status.branch || 'sem branch'}
              </p>
            </div>
            <Button onClick={() => void refresh()} size="sm" variant="ghost">
              <RefreshCw className="size-3.5" /> Atualizar
            </Button>
          </div>
          <textarea
            className={`${inputClass} resize-none`}
            onChange={(event) => setCommitMessage(event.target.value)}
            placeholder="Explique o que mudou…"
            rows={3}
            value={commitMessage}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || status.files.length === 0 || !commitMessage}
              onClick={() => void perform(saveVersion, 'Versão salva localmente.')}
              size="sm"
            >
              <GitCommit className="size-3.5" /> Salvar versão
            </Button>
            <Button
              disabled={busy || status.files.length === 0}
              onClick={() => void suggestMessage()}
              size="sm"
              variant="secondary"
            >
              <MessageSquareText className="size-3.5" /> Sugerir mensagem
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              disabled={busy}
              onClick={() => {
                if (confirmRemote('Enviar os commits desta branch para o GitHub?'))
                  void perform(
                    () => window.visualnscode!.git.push(true),
                    'Alterações enviadas ao GitHub.',
                  );
              }}
              size="sm"
              variant="secondary"
            >
              <ArrowUp className="size-3.5" /> Enviar para GitHub
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                if (
                  confirmRemote(
                    'Baixar e integrar alterações do GitHub usando apenas fast-forward?',
                  )
                )
                  void perform(() => window.visualnscode!.git.pull(true), 'Alterações baixadas.');
              }}
              size="sm"
              variant="secondary"
            >
              <ArrowDown className="size-3.5" /> Baixar alterações
            </Button>
            <Button
              disabled={busy || status.files.length === 0}
              onClick={() =>
                void perform(
                  () => window.visualnscode!.git.stash('Cópia de segurança do VisualnsCode'),
                  'Cópia de segurança criada.',
                )
              }
              size="sm"
              variant="secondary"
            >
              <Archive className="size-3.5" /> Criar cópia de segurança
            </Button>
            <Button disabled={busy} onClick={() => void refresh()} size="sm" variant="secondary">
              <GitCommit className="size-3.5" /> Ver histórico
            </Button>
          </div>
          <Feedback error={error} notice={notice} />
        </section>
        <History entries={history} />
      </div>
    );
  }

  return (
    <div className="relative grid h-full min-h-0 min-w-[880px] grid-cols-[minmax(300px,0.95fr)_minmax(240px,0.7fr)_minmax(300px,1fr)] overflow-hidden">
      <div className="min-h-0 overflow-auto border-r border-[rgb(var(--border))] p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text))]">
            <GitBranch className="size-4 text-[rgb(var(--accent))]" /> {status.branch || '—'}
          </span>
          <span className="text-[10px] text-[rgb(var(--text-subtle))]">
            ↑{status.ahead} ↓{status.behind}
          </span>
        </div>
        <FileGroup
          files={staged}
          label="Staged"
          onAction={(path) =>
            void perform(
              () => window.visualnscode!.git.unstage([path]),
              'Arquivo removido do stage.',
            )
          }
          onView={(file) => void viewDiff(file)}
          symbol="−"
        />
        <FileGroup
          files={unstaged}
          label="Changes"
          onAction={(path) =>
            void perform(
              () => window.visualnscode!.git.stage([path]),
              'Arquivo adicionado ao stage.',
            )
          }
          onView={(file) => void viewDiff(file)}
          symbol="+"
        />
        {selectedDiff ? (
          <details className="mb-3 rounded-lg border border-[rgb(var(--border))]" open>
            <summary className="cursor-pointer px-2 py-1.5 text-[10px] text-[rgb(var(--text-muted))]">
              Diff · {selectedDiff.path}
            </summary>
            <pre className="max-h-36 overflow-auto border-t border-[rgb(var(--border))] bg-[rgb(var(--background))] p-2 text-[9px] leading-4 text-[rgb(var(--text-muted))]">
              {selectedDiff.content || 'Sem diff textual.'}
            </pre>
          </details>
        ) : null}
        {conflicts.length ? (
          <section className="mb-4 rounded-lg border border-red-500/30 p-2">
            <p className="mb-2 text-[10px] font-semibold uppercase text-red-400">Conflitos</p>
            {conflicts.map((conflict) => (
              <div className="mb-2" key={conflict.path}>
                <p className="truncate text-xs">{conflict.path}</p>
                <div className="mt-1 flex gap-1">
                  <button
                    onClick={() =>
                      void perform(
                        () => window.visualnscode!.git.resolveConflict(conflict.path, 'ours'),
                        'Conflito resolvido com a versão local.',
                      )
                    }
                    type="button"
                  >
                    Usar local
                  </button>
                  <button
                    onClick={() =>
                      void perform(
                        () => window.visualnscode!.git.resolveConflict(conflict.path, 'theirs'),
                        'Conflito resolvido com a versão remota.',
                      )
                    }
                    type="button"
                  >
                    Usar remota
                  </button>
                </div>
              </div>
            ))}
          </section>
        ) : null}
        <textarea
          className={`${inputClass} resize-none`}
          onChange={(event) => setCommitMessage(event.target.value)}
          placeholder="feat(scope): describe the change"
          rows={3}
          value={commitMessage}
        />
        <div className="mt-2 flex gap-2">
          <Button
            disabled={busy || !commitMessage || staged.length === 0}
            onClick={() => void perform(saveVersion, 'Commit criado.')}
            size="sm"
          >
            <GitCommit className="size-3.5" /> Commit
          </Button>
          <Button
            disabled={busy || status.files.length === 0}
            onClick={() => void suggestMessage()}
            size="sm"
            variant="ghost"
          >
            <MessageSquareText className="size-3.5" /> Sugerir
          </Button>
        </div>
        <div className="mt-4 border-t border-[rgb(var(--border))] pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase text-[rgb(var(--text-subtle))]">
            Branches e merge
          </p>
          <div className="flex gap-2">
            <select
              className={inputClass}
              onChange={(event) => setSelectedBranch(event.target.value)}
              value={selectedBranch}
            >
              {branches.map((branch) => (
                <option key={`${branch.remote}-${branch.name}`} value={branch.name}>
                  {branch.name}
                  {branch.current ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <Button
              aria-label="Criar branch"
              onClick={() => {
                const name = window.prompt('Nome da nova branch:');
                if (name)
                  void perform(() => window.visualnscode!.git.createBranch(name), 'Branch criada.');
              }}
              size="sm"
              variant="secondary"
            >
              +
            </Button>
            <Button
              disabled={!selectedBranch || selectedBranch === status.branch}
              onClick={() =>
                void perform(
                  () => window.visualnscode!.git.checkout(selectedBranch),
                  'Branch alterada.',
                )
              }
              size="sm"
              variant="secondary"
            >
              Checkout
            </Button>
            <Button
              disabled={!selectedBranch || selectedBranch === status.branch}
              onClick={() => {
                if (confirmRemote(`Fazer merge de ${selectedBranch} em ${status.branch}?`))
                  void perform(
                    () => window.visualnscode!.git.merge(selectedBranch, true),
                    'Merge concluído.',
                  );
              }}
              size="sm"
              variant="secondary"
            >
              <GitMerge className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const name = window.prompt('Nome da tag, por exemplo v1.0.0:');
              const message = name ? window.prompt('Descrição da tag:') : null;
              if (name && message)
                void perform(
                  () => window.visualnscode!.git.createTag(name, message),
                  'Tag criada.',
                );
            }}
            size="sm"
            variant="ghost"
          >
            Tag
          </Button>
          <Button
            onClick={() => {
              const reference = window.prompt('Referência para reset seguro (ex.: HEAD):');
              if (reference && confirmRemote(`Aplicar reset --mixed para ${reference}?`))
                void perform(
                  () => window.visualnscode!.git.reset(reference, 'mixed', true),
                  'Reset seguro concluído; seus arquivos foram preservados.',
                );
            }}
            size="sm"
            variant="ghost"
          >
            Reset seguro
          </Button>
          <Button
            onClick={() =>
              void perform(
                () => window.visualnscode!.git.stash('VisualnsCode backup'),
                'Stash criado.',
              )
            }
            size="sm"
            variant="ghost"
          >
            Stash
          </Button>
          <Button
            onClick={() =>
              void perform(() => window.visualnscode!.git.stashPop(), 'Stash aplicado.')
            }
            size="sm"
            variant="ghost"
          >
            Stash pop
          </Button>
          <Button
            onClick={() => {
              if (confirmRemote('Enviar esta branch ao GitHub?'))
                void perform(() => window.visualnscode!.git.push(true), 'Push concluído.');
            }}
            size="sm"
            variant="ghost"
          >
            Push
          </Button>
          <Button
            onClick={() => {
              if (confirmRemote('Baixar alterações com fast-forward only?'))
                void perform(() => window.visualnscode!.git.pull(true), 'Pull concluído.');
            }}
            size="sm"
            variant="ghost"
          >
            Pull
          </Button>
          <span className="flex items-center gap-1 text-[10px] text-[rgb(var(--text-subtle))]">
            <Tag className="size-3" /> {tags.length} tag(s)
          </span>
        </div>
        <Feedback error={error} notice={notice} />
      </div>

      <History
        entries={history}
        onRevert={(hash) => {
          if (confirmRemote(`Criar um revert para ${hash}?`))
            void perform(() => window.visualnscode!.git.revert(hash, true), 'Revert criado.');
        }}
      />
      <section className="min-h-0 overflow-auto border-l border-[rgb(var(--border))] p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--text))]">GitHub</p>
            <p className="text-[10px] text-[rgb(var(--text-subtle))]">
              {githubAuth?.authenticated
                ? `Conectado como @${githubAuth.username}`
                : 'Não conectado pelo GitHub CLI'}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            <Button onClick={() => void createRepository()} size="sm" variant="ghost">
              Criar repo
            </Button>
            <Button
              disabled={!githubAuth?.authenticated}
              onClick={() => {
                if (confirmRemote('Criar um fork deste repositório e configurar o remote?'))
                  void perform(async () => {
                    await window.visualnscode!.github.fork(true);
                    await refreshGitHub();
                  }, 'Fork criado.');
              }}
              size="sm"
              variant="ghost"
            >
              Fork
            </Button>
            <Button
              disabled={!githubAuth?.authenticated}
              onClick={() => void window.visualnscode?.github.open()}
              size="sm"
              variant="ghost"
            >
              <ExternalLink className="size-3.5" /> Abrir
            </Button>
            <Button onClick={() => void refreshGitHub()} size="sm" variant="ghost">
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="mb-2 flex gap-1">
          {(['issues', 'prs', 'actions', 'releases'] as const).map((section) => (
            <button
              className={`rounded px-2 py-1 text-[10px] ${githubSection === section ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))]'}`}
              key={section}
              onClick={() => setGithubSection(section)}
              type="button"
            >
              {section}
            </button>
          ))}
        </div>
        <GitHubList
          section={githubSection}
          issues={issues}
          pullRequests={pullRequests}
          releases={releases}
          runs={runs}
        />
        <GitHubCreateForms
          branch={status.branch}
          onComplete={() => void refreshGitHub()}
          section={githubSection}
        />
      </section>
      {busy ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
          <Loader2 className="size-5 animate-spin text-[rgb(var(--accent))]" />
        </div>
      ) : null}
    </div>
  );
}

function FileGroup({
  files,
  label,
  onAction,
  onView,
  symbol,
}: {
  readonly files: readonly GitFileStatus[];
  readonly label: string;
  readonly onAction: (path: string) => void;
  readonly onView: (file: GitFileStatus) => void;
  readonly symbol: string;
}) {
  if (!files.length) return null;
  return (
    <section className="mb-3">
      <p className="mb-1 text-[10px] font-semibold uppercase text-[rgb(var(--text-subtle))]">
        {label} ({files.length})
      </p>
      {files.map((file) => (
        <div className="flex items-center gap-2 py-0.5 text-xs" key={file.path}>
          <span className={file.conflict ? 'text-red-400' : 'text-amber-400'}>{file.status}</span>
          <button
            className="min-w-0 flex-1 truncate text-left text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
            onClick={() => onView(file)}
            type="button"
          >
            {file.path}
          </button>
          <button
            aria-label={`${symbol === '+' ? 'Stage' : 'Unstage'} ${file.path}`}
            onClick={() => onAction(file.path)}
            type="button"
          >
            {symbol}
          </button>
        </div>
      ))}
    </section>
  );
}

function History({
  entries,
  onRevert,
}: {
  readonly entries: readonly GitLogEntry[];
  readonly onRevert?: (hash: string) => void;
}) {
  return (
    <section className="min-h-0 overflow-auto p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase text-[rgb(var(--text-subtle))]">
        Histórico visual
      </p>
      <div className="relative space-y-2 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-[rgb(var(--border))]">
        {entries.map((entry) => (
          <div className="relative flex gap-3 pl-5" key={entry.hash}>
            <span className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-[rgb(var(--accent))] bg-[rgb(var(--surface))]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-[rgb(var(--text))]">{entry.subject}</p>
              <p className="text-[10px] text-[rgb(var(--text-subtle))]">
                {entry.shortHash} · {entry.author} · {entry.date}
              </p>
            </div>
            {onRevert ? (
              <button
                className="text-[10px] text-[rgb(var(--text-subtle))] hover:text-[rgb(var(--text))]"
                onClick={() => onRevert(entry.hash)}
                type="button"
              >
                Revert
              </button>
            ) : null}
          </div>
        ))}
        {entries.length === 0 ? (
          <p className="pl-5 text-xs text-[rgb(var(--text-subtle))]">Sem versões salvas.</p>
        ) : null}
      </div>
    </section>
  );
}

function Feedback({
  error,
  notice,
}: {
  readonly error: string | null;
  readonly notice: string | null;
}) {
  return (
    <>
      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
      {notice ? <p className="mt-3 text-xs text-emerald-400">{notice}</p> : null}
    </>
  );
}

function GitHubList({
  issues,
  pullRequests,
  releases,
  runs,
  section,
}: {
  readonly issues: readonly GitHubIssue[];
  readonly pullRequests: readonly GitHubPullRequest[];
  readonly releases: readonly GitHubRelease[];
  readonly runs: readonly GitHubWorkflowRun[];
  readonly section: 'issues' | 'prs' | 'actions' | 'releases';
}) {
  const rows =
    section === 'issues'
      ? issues.map((item) => ({
          id: item.number,
          title: `#${item.number} ${item.title}`,
          meta: item.state,
        }))
      : section === 'prs'
        ? pullRequests.map((item) => ({
            id: item.number,
            title: `#${item.number} ${item.title}`,
            meta: `${item.head} → ${item.base}`,
          }))
        : section === 'actions'
          ? runs.map((item) => ({
              id: item.id,
              title: item.name,
              meta: `${item.branch} · ${item.conclusion ?? item.status}`,
            }))
          : releases.map((item) => ({
              id: item.tagName,
              title: item.name || item.tagName,
              meta: item.prerelease ? 'prerelease' : 'stable',
            }));
  return (
    <div className="space-y-1">
      {rows.slice(0, 8).map((row) => (
        <div
          className="flex items-center justify-between rounded bg-[rgb(var(--surface-raised))] px-2 py-1.5"
          key={row.id}
        >
          <span className="truncate text-xs text-[rgb(var(--text))]">{row.title}</span>
          <span className="ml-2 shrink-0 text-[10px] text-[rgb(var(--text-subtle))]">
            {row.meta}
          </span>
        </div>
      ))}
      {rows.length === 0 ? (
        <p className="text-xs text-[rgb(var(--text-subtle))]">Nenhum item encontrado.</p>
      ) : null}
    </div>
  );
}

function GitHubCreateForms({
  branch,
  onComplete,
  section,
}: {
  readonly branch: string;
  readonly onComplete: () => void;
  readonly section: 'issues' | 'prs' | 'actions' | 'releases';
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const create = async () => {
    if (!title.trim() || !window.confirm('Criar este item no GitHub?')) return;
    if (section === 'issues')
      await window.visualnscode?.github.createIssue({ title, body, confirmed: true });
    if (section === 'prs')
      await window.visualnscode?.github.createPullRequest({
        title,
        body,
        base: 'main',
        head: branch,
        draft: true,
        confirmed: true,
      });
    if (section === 'releases')
      await window.visualnscode?.github.createRelease({
        tag: title,
        title,
        notes: body,
        prerelease: true,
        confirmed: true,
      });
    setTitle('');
    setBody('');
    onComplete();
  };
  if (section === 'actions') return null;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-[10px] text-[rgb(var(--accent))]">
        Criar{' '}
        {section === 'issues' ? 'issue' : section === 'prs' ? 'pull request draft' : 'prerelease'}
      </summary>
      <div className="mt-2 grid gap-1.5">
        <input
          className={inputClass}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={section === 'releases' ? 'v0.1.0' : 'Título'}
          value={title}
        />
        <textarea
          className={`${inputClass} resize-none`}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Descrição"
          rows={2}
          value={body}
        />
        <Button disabled={!title.trim()} onClick={() => void create()} size="sm">
          Criar com confirmação
        </Button>
      </div>
    </details>
  );
}
