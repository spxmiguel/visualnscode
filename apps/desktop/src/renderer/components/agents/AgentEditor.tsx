import { useState } from 'react';
import { X } from 'lucide-react';
import { type AgentDefinition, type AgentTool } from '@visualnscode/agents/browser';
import { Button } from '@visualnscode/ui';

const tools: readonly AgentTool[] = [
  'read-files',
  'search',
  'edit-files',
  'terminal',
  'git',
  'tests',
  'preview',
  'deploy',
  'web',
];
const field =
  'mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] px-2.5 py-2 text-xs outline-none focus:border-[rgb(var(--accent))]';

const newAgent = (): AgentDefinition => ({
  id: `custom-${Date.now()}`,
  name: 'Meu agente',
  description: 'Agente personalizado do projeto.',
  providerId: 'ollama',
  model: 'default',
  systemPrompt: 'Ajude a executar a tarefa com segurança, clareza e evidências.',
  allowedTools: ['read-files', 'search'],
  allowedFolders: ['.'],
  costLimitUsd: 2,
  timeoutMs: 180_000,
  memory: { enabled: true, scope: 'project', maxEntries: 20 },
  autonomy: 'guided',
  terminalPermission: 'none',
  editPermission: 'propose',
  builtIn: false,
});

export function AgentEditor({
  agent,
  onClose,
  onDelete,
  onSave,
}: {
  readonly agent: AgentDefinition | null;
  readonly onClose: () => void;
  readonly onDelete?: (agentId: string) => void;
  readonly onSave: (agent: AgentDefinition) => void;
}) {
  const [draft, setDraft] = useState<AgentDefinition>(agent ?? newAgent());
  const update = <K extends keyof AgentDefinition>(key: K, value: AgentDefinition[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-2xl overflow-auto rounded-md border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface))] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">
              {agent ? `Configurar ${agent.name}` : 'Novo agente personalizado'}
            </h2>
            <p className="mt-1 text-[10px] text-[rgb(var(--text-muted))]">
              Permissões e limites são aplicados em cada execução.
            </p>
          </div>
          <button aria-label="Fechar editor de agente" onClick={onClose} type="button">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-xs">
            Nome
            <input
              className={field}
              onChange={(event) => update('name', event.target.value)}
              value={draft.name}
            />
          </label>
          <label className="text-xs">
            Descrição
            <input
              className={field}
              onChange={(event) => update('description', event.target.value)}
              value={draft.description}
            />
          </label>
          <label className="text-xs">
            Provider
            <input
              className={field}
              onChange={(event) => update('providerId', event.target.value)}
              value={draft.providerId}
            />
          </label>
          <label className="text-xs">
            Modelo
            <input
              className={field}
              onChange={(event) => update('model', event.target.value)}
              value={draft.model}
            />
          </label>
          <label className="text-xs sm:col-span-2">
            Prompt de sistema
            <textarea
              className={`${field} h-24 resize-y`}
              onChange={(event) => update('systemPrompt', event.target.value)}
              value={draft.systemPrompt}
            />
          </label>
          <label className="text-xs sm:col-span-2">
            Pastas permitidas
            <input
              className={field}
              onChange={(event) =>
                update(
                  'allowedFolders',
                  event.target.value
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                )
              }
              value={draft.allowedFolders.join(', ')}
            />
          </label>
          <label className="text-xs">
            Autonomia
            <select
              className={field}
              onChange={(event) =>
                update('autonomy', event.target.value as AgentDefinition['autonomy'])
              }
              value={draft.autonomy}
            >
              <option value="ask">Ask</option>
              <option value="guided">Guided</option>
              <option value="autonomous">Autonomous</option>
            </select>
          </label>
          <label className="text-xs">
            Terminal
            <select
              className={field}
              onChange={(event) =>
                update(
                  'terminalPermission',
                  event.target.value as AgentDefinition['terminalPermission'],
                )
              }
              value={draft.terminalPermission}
            >
              <option value="none">Desativado</option>
              <option value="safe">Seguro</option>
              <option value="allowlisted">Allowlist</option>
            </select>
          </label>
          <label className="text-xs">
            Edição
            <select
              className={field}
              onChange={(event) =>
                update('editPermission', event.target.value as AgentDefinition['editPermission'])
              }
              value={draft.editPermission}
            >
              <option value="none">Desativada</option>
              <option value="propose">Somente propor</option>
              <option value="workspace">Dentro do workspace</option>
            </select>
          </label>
          <label className="text-xs">
            Custo máximo (USD)
            <input
              className={field}
              min="0"
              onChange={(event) => update('costLimitUsd', Number(event.target.value))}
              step="0.1"
              type="number"
              value={draft.costLimitUsd}
            />
          </label>
          <label className="text-xs">
            Tempo máximo (ms)
            <input
              className={field}
              min="1000"
              onChange={(event) => update('timeoutMs', Number(event.target.value))}
              type="number"
              value={draft.timeoutMs}
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-xs">
            <input
              checked={draft.memory.enabled}
              onChange={(event) =>
                update('memory', { ...draft.memory, enabled: event.target.checked })
              }
              type="checkbox"
            />{' '}
            Memória ativa
          </label>
          <label className="text-xs">
            Escopo da memória
            <select
              className={field}
              disabled={!draft.memory.enabled}
              onChange={(event) =>
                update('memory', {
                  ...draft.memory,
                  scope: event.target.value as AgentDefinition['memory']['scope'],
                })
              }
              value={draft.memory.scope}
            >
              <option value="run">Somente esta execução</option>
              <option value="project">Projeto atual</option>
            </select>
          </label>
          <label className="text-xs">
            Entradas de memória
            <input
              className={field}
              disabled={!draft.memory.enabled}
              max="100"
              min="1"
              onChange={(event) =>
                update('memory', { ...draft.memory, maxEntries: Number(event.target.value) })
              }
              type="number"
              value={draft.memory.maxEntries}
            />
          </label>
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs">Ferramentas permitidas</p>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool) => (
                <label
                  className="flex items-center gap-1.5 rounded-lg bg-[rgb(var(--surface-sunken))] px-2.5 py-1.5 text-[10px]"
                  key={tool}
                >
                  <input
                    checked={draft.allowedTools.includes(tool)}
                    onChange={(event) =>
                      update(
                        'allowedTools',
                        event.target.checked
                          ? [...draft.allowedTools, tool]
                          : draft.allowedTools.filter((item) => item !== tool),
                      )
                    }
                    type="checkbox"
                  />{' '}
                  {tool}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2 border-t border-[rgb(var(--border))] p-4">
          <div>
            {agent && !agent.builtIn && onDelete ? (
              <Button
                onClick={() => {
                  if (window.confirm(`Excluir o agente “${agent.name}”?`)) onDelete(agent.id);
                }}
                variant="danger"
              >
                Excluir agente
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="ghost">
              Cancelar
            </Button>
            <Button
              disabled={
                !draft.name.trim() ||
                !draft.model.trim() ||
                draft.allowedFolders.length === 0 ||
                draft.costLimitUsd < 0 ||
                draft.timeoutMs < 1000 ||
                draft.memory.maxEntries < 1 ||
                draft.memory.maxEntries > 100
              }
              onClick={() => {
                onSave(draft);
                onClose();
              }}
            >
              Salvar agente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
