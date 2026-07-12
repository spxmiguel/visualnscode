import {
  Braces,
  Files,
  GitBranch,
  ListChecks,
  ScrollText,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { IconButton } from '@visualnscode/ui';
import { useAppStore } from '../store';
import { useWorkspaceStore, type WorkspaceTool } from '../workspace-store';

const tools: readonly [WorkspaceTool, string, typeof Files][] = [
  ['files', 'Arquivos', Files],
  ['git', 'Git', GitBranch],
  ['diffs', 'Diffs', Braces],
  ['tasks', 'Tarefas', ListChecks],
  ['logs', 'Logs', ScrollText],
  ['permissions', 'Permissões', ShieldCheck],
];

export function ActivityRail() {
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);
  const navigate = useAppStore((state) => state.navigate);
  return (
    <nav
      aria-label="Ferramentas avançadas"
      className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] py-2"
    >
      <div className="space-y-1">
        {tools.map(([tool, label, Icon]) => (
          <IconButton
            active={activeTool === tool}
            key={tool}
            label={label}
            onClick={() => setActiveTool(tool)}
          >
            <Icon className="size-[17px]" />
          </IconButton>
        ))}
      </div>
      <IconButton label="Configurações avançadas" onClick={() => navigate('settings')}>
        <Settings className="size-[17px]" />
      </IconButton>
    </nav>
  );
}
