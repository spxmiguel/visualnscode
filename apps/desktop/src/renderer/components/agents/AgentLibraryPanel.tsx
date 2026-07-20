import { Boxes, Plus, Users } from 'lucide-react';
import { builtInAgents, teamTemplates } from '@visualnscode/agents/browser';
import { resolvedAgents, useAgentStore } from '../../agent-store';

export function AgentLibraryPanel() {
  const customAgents = useAgentStore((state) => state.customAgents);
  const overrides = useAgentStore((state) => state.overrides);
  const currentWorkflow = useAgentStore((state) => state.currentWorkflow);
  const applyTemplate = useAgentStore((state) => state.applyTemplate);
  const setSelectedAgent = useAgentStore((state) => state.setSelectedAgent);
  const agents = resolvedAgents({ customAgents, overrides });

  return (
    <div className="h-full overflow-auto bg-[rgb(var(--surface))] p-2">
      <div className="mb-2 flex items-center gap-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
        <Users className="size-3.5" /> Equipes
      </div>
      <div className="space-y-1">
        {teamTemplates.map((template) => (
          <button
            className={`w-full rounded-[5px] px-2.5 py-2 text-left text-xs ${currentWorkflow.id === template.id ? 'bg-[rgb(var(--surface-hover))] text-[rgb(var(--text))] shadow-[inset_2px_0_0_rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-hover))]'}`}
            key={template.id}
            onClick={() => applyTemplate(template.id)}
            type="button"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Boxes className="size-3" /> {template.name}
            </span>
            <span className="mt-1 block text-[9px] leading-3 opacity-70">
              {template.nodes.length} agentes
            </span>
          </button>
        ))}
      </div>

      <div className="mb-2 mt-5 flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
        <span>Agentes</span>
        <button
          aria-label="Criar agente personalizado"
          className="rounded p-1 hover:bg-[rgb(var(--surface-hover))]"
          onClick={() => setSelectedAgent('__new__')}
          type="button"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <p className="mb-2 px-2 text-[9px] leading-3 text-[rgb(var(--text-subtle))]">
        Arraste um agente para o canvas.
      </p>
      <div className="space-y-1">
        {agents.map((agent) => (
          <button
            className="flex w-full cursor-grab items-center gap-2 rounded-[5px] px-2.5 py-2 text-left text-xs text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-hover))]"
            draggable
            key={agent.id}
            onClick={() => setSelectedAgent(agent.id)}
            onDragStart={(event) => event.dataTransfer.setData('text/plain', `agent:${agent.id}`)}
            type="button"
          >
            <span className="flex size-6 items-center justify-center border border-[rgb(var(--border))] font-mono text-[8px] text-[rgb(var(--text-muted))]">
              {agent.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">{agent.name}</span>
            {agent.builtIn ? null : <span className="text-[8px] text-emerald-500">CUSTOM</span>}
          </button>
        ))}
      </div>
      {builtInAgents.length ? null : <p>Nenhum agente.</p>}
    </div>
  );
}
