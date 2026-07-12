import {
  CheckCircle2,
  GitBranch,
  ListChecks,
  ScrollText,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';
import { useWorkspaceStore, type BottomPanel as BottomPanelName } from '../workspace-store';

const tabs: readonly [BottomPanelName, string, typeof TerminalSquare][] = [
  ['terminal', 'Terminal', TerminalSquare],
  ['tasks', 'Tarefas', ListChecks],
  ['logs', 'Logs', ScrollText],
  ['git', 'Git', GitBranch],
  ['diffs', 'Diffs', CheckCircle2],
  ['permissions', 'Permissões', ShieldCheck],
];

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
      <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs text-[rgb(var(--text-muted))]">
        {bottomPanel === 'terminal' ? (
          <>
            <p>
              <span className="text-emerald-500">visualnscode</span>{' '}
              <span className="text-violet-400">main</span> $ pnpm dev
            </p>
            <p className="mt-2 text-[rgb(var(--text-subtle))]">
              Terminal demonstrativo — comandos locais ainda estão desativados.
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
        {bottomPanel === 'git' ? <p>Branch main · árvore de trabalho limpa.</p> : null}
        {bottomPanel === 'diffs' ? <p>Altere um arquivo para comparar as mudanças.</p> : null}
        {bottomPanel === 'permissions' ? (
          <p>Filesystem: somente workspace · Rede: bloqueada · Shell: bloqueado.</p>
        ) : null}
      </div>
    </section>
  );
}
