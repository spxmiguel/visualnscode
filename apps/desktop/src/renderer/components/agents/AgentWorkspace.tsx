import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  Activity,
  CircleDollarSign,
  Clock3,
  Link2,
  Play,
  RotateCw,
  Square,
  Trash2,
  Unlink2,
} from 'lucide-react';
import type { AgentDefinition, AgentRunRecord } from '@visualnscode/agents/browser';
import { Button } from '@visualnscode/ui';
import { agentApi } from '../../agent-api';
import type { AgentVersionControlOptions } from '../../../shared/version-control';
import { resolvedAgents, useAgentStore, type AgentNodeRunState } from '../../agent-store';
import { useWorkspaceStore } from '../../workspace-store';
import { AgentEditor } from './AgentEditor';

const statusColor = (status: 'running' | 'queued' | 'complete' | 'idle' | 'error') =>
  ({
    running: 'border-amber-500/60 shadow-amber-500/10',
    queued: 'border-sky-500/40',
    complete: 'border-emerald-500/50 shadow-emerald-500/10',
    error: 'border-red-500/50 shadow-red-500/10',
    idle: 'border-[rgb(var(--border))]',
  })[status];

const isCompletedRun = (run: AgentNodeRunState | undefined): run is AgentRunRecord =>
  typeof run === 'object' && 'output' in run;

const runDuration = (startedAt: string, completedAt: string): string => {
  const milliseconds = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
  return milliseconds < 1000 ? `${milliseconds}ms` : `${(milliseconds / 1000).toFixed(1)}s`;
};

const VERSION_CONTROL_CHOICES: ReadonlyArray<readonly [keyof AgentVersionControlOptions, string]> =
  [
    ['checkpoint', 'Checkpoint local'],
    ['branch', 'Branch da tarefa'],
    ['commit', 'Commit automático'],
    ['pullRequest', 'Pull request draft'],
  ];

export function AgentWorkspace() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [task, setTask] = useState('Crie uma melhoria segura e bem testada para este projeto.');
  const [elapsed, setElapsed] = useState(0);
  const [versionControl, setVersionControl] = useState<AgentVersionControlOptions>({
    checkpoint: true,
    commit: false,
    branch: false,
    pullRequest: false,
    pushConfirmed: false,
    pullRequestConfirmed: false,
  });
  const currentWorkflow = useAgentStore((state) => state.currentWorkflow);
  const customAgents = useAgentStore((state) => state.customAgents);
  const overrides = useAgentStore((state) => state.overrides);
  const activeRunId = useAgentStore((state) => state.activeRunId);
  const currentResult = useAgentStore((state) => state.currentResult);
  const nodeRuns = useAgentStore((state) => state.nodeRuns);
  const pendingActions = useAgentStore((state) => state.pendingActions);
  const logs = useAgentStore((state) => state.logs);
  const history = useAgentStore((state) => state.history);
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const connectFrom = useAgentStore((state) => state.connectFrom);
  const workflowNotice = useAgentStore((state) => state.workflowNotice);
  const files = useWorkspaceStore((state) => state.files);
  const openTabs = useWorkspaceStore((state) => state.openTabs);
  const agents = useMemo(
    () => resolvedAgents({ customAgents, overrides }),
    [customAgents, overrides],
  );
  const selectedAgent =
    selectedAgentId === '__new__'
      ? null
      : (agents.find(({ id }) => id === selectedAgentId) ?? null);
  const completedRuns = Object.values(nodeRuns).filter(isCompletedRun);
  const liveCost = completedRuns.reduce((total, run) => total + run.costUsd, 0);
  const liveSteps = completedRuns.reduce((total, run) => total + run.steps, 0);

  useEffect(() => agentApi.onEvent((event) => useAgentStore.getState().handleEvent(event)), []);
  useEffect(() => {
    void agentApi.history().then((items) => useAgentStore.getState().setHistory(items));
  }, []);
  useEffect(() => {
    if (!activeRunId) {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [activeRunId]);

  const start = () => {
    if (!task.trim() || activeRunId) return;
    const runId = crypto.randomUUID();
    const relevantContext = Object.fromEntries(
      openTabs.flatMap((id) => {
        const file = files.find((item) => item.id === id);
        return file ? [[file.path, file.content]] : [];
      }),
    );
    useAgentStore.getState().startRun(runId);
    agentApi.start({
      runId,
      workflow: currentWorkflow,
      agents,
      task: task.trim(),
      relevantContext,
      versionControl,
    });
  };

  const dropOnCanvas = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const value = event.dataTransfer.getData('text/plain');
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (value.startsWith('agent:'))
      useAgentStore
        .getState()
        .addNode(value.slice(6), event.clientX - rect.left - 90, event.clientY - rect.top - 40);
    if (value.startsWith('node:'))
      useAgentStore
        .getState()
        .moveNode(value.slice(5), event.clientX - rect.left - 90, event.clientY - rect.top - 40);
  };

  const approve = async (runId: string, actionId: string, value: boolean) => {
    await agentApi.approve(runId, actionId, value);
    useAgentStore.getState().resolveAction(actionId);
  };

  return (
    <section
      className="relative flex min-h-0 flex-1 bg-[rgb(var(--background))]"
      aria-label="Construtor de equipes de agentes"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2">
          <div>
            <h1 className="sr-only">{currentWorkflow.name}</h1>
            <input
              aria-label="Nome da equipe"
              className="block w-full bg-transparent text-sm font-semibold outline-none focus:text-[rgb(var(--accent))]"
              onChange={(event) =>
                useAgentStore
                  .getState()
                  .updateWorkflow({ ...currentWorkflow, name: event.target.value.slice(0, 100) })
              }
              value={currentWorkflow.name}
            />
            <input
              aria-label="Descrição da equipe"
              className="block min-w-[320px] bg-transparent text-[10px] text-[rgb(var(--text-muted))] outline-none"
              onChange={(event) =>
                useAgentStore.getState().updateWorkflow({
                  ...currentWorkflow,
                  description: event.target.value.slice(0, 1000),
                })
              }
              value={currentWorkflow.description}
            />
          </div>
          <div className="flex items-center gap-2 text-[9px] text-[rgb(var(--text-muted))]">
            <label>
              Custo $
              <input
                aria-label="Limite de custo da equipe"
                className="ml-1 w-14 rounded bg-[rgb(var(--surface-sunken))] px-1.5 py-1"
                min="0"
                onChange={(event) =>
                  useAgentStore.getState().updateWorkflow({
                    ...currentWorkflow,
                    maxCostUsd: Number(event.target.value),
                  })
                }
                step="0.5"
                type="number"
                value={currentWorkflow.maxCostUsd}
              />
            </label>
            <label>
              Passos
              <input
                aria-label="Limite de passos da equipe"
                className="ml-1 w-12 rounded bg-[rgb(var(--surface-sunken))] px-1.5 py-1"
                min="1"
                onChange={(event) =>
                  useAgentStore
                    .getState()
                    .updateWorkflow({ ...currentWorkflow, maxSteps: Number(event.target.value) })
                }
                type="number"
                value={currentWorkflow.maxSteps}
              />
            </label>
            <label>
              Min
              <input
                aria-label="Limite de tempo da equipe em minutos"
                className="ml-1 w-12 rounded bg-[rgb(var(--surface-sunken))] px-1.5 py-1"
                min="1"
                onChange={(event) =>
                  useAgentStore.getState().updateWorkflow({
                    ...currentWorkflow,
                    timeoutMs: Number(event.target.value) * 60_000,
                  })
                }
                type="number"
                value={Math.round(currentWorkflow.timeoutMs / 60_000)}
              />
            </label>
          </div>
        </div>
        <div
          className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(rgb(var(--border))_1px,transparent_1px)] [background-size:20px_20px]"
          onDragOver={(event) => event.preventDefault()}
          onDrop={dropOnCanvas}
          ref={canvasRef}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full min-h-[620px] w-full min-w-[760px]"
            aria-hidden="true"
          >
            {currentWorkflow.edges.map((edge) => {
              const source = currentWorkflow.nodes.find(({ id }) => id === edge.source);
              const target = currentWorkflow.nodes.find(({ id }) => id === edge.target);
              if (!source || !target) return null;
              return (
                <line
                  key={edge.id}
                  stroke="rgb(var(--accent))"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  x1={source.position.x + 180}
                  x2={target.position.x}
                  y1={source.position.y + 42}
                  y2={target.position.y + 42}
                />
              );
            })}
          </svg>
          <div className="relative min-h-[620px] min-w-[760px]">
            {currentWorkflow.nodes.map((node) => {
              const agent = agents.find(({ id }) => id === node.agentId);
              if (!agent) return null;
              const run = nodeRuns[node.id];
              const status =
                run === 'running'
                  ? 'running'
                  : run === 'queued'
                    ? 'queued'
                    : isCompletedRun(run)
                      ? 'complete'
                      : typeof run === 'object'
                        ? 'error'
                        : 'idle';
              return (
                <article
                  className={`absolute w-[180px] cursor-grab rounded-md border bg-[rgb(var(--surface))] p-3 shadow-[var(--shadow-panel)] ${statusColor(status)} ${connectFrom === node.id ? 'ring-1 ring-[rgb(var(--accent))]' : ''}`}
                  draggable
                  key={node.id}
                  onClick={() => useAgentStore.getState().setSelectedAgent(agent.id)}
                  onDragStart={(event) =>
                    event.dataTransfer.setData('text/plain', `node:${node.id}`)
                  }
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    const value = event.dataTransfer.getData('text/plain');
                    if (value.startsWith('connect:')) {
                      event.preventDefault();
                      event.stopPropagation();
                      useAgentStore.getState().connect(value.slice(8), node.id);
                    }
                  }}
                  style={{ left: node.position.x, top: node.position.y }}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center border border-[rgb(var(--border))] font-mono text-[8px] text-[rgb(var(--text-muted))]">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xs font-semibold">{agent.name}</h2>
                      <p className="truncate text-[9px] text-[rgb(var(--text-subtle))]">
                        {agent.providerId} · {agent.model}
                      </p>
                    </div>
                    <button
                      aria-label={`Remover ${agent.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        useAgentStore.getState().removeNode(node.id);
                      }}
                      type="button"
                    >
                      <Trash2 className="size-3 text-[rgb(var(--text-subtle))]" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`text-[9px] ${status === 'running' ? 'text-amber-500' : status === 'complete' ? 'text-emerald-500' : 'text-[rgb(var(--text-subtle))]'}`}
                    >
                      {status === 'running'
                        ? 'Executando…'
                        : status === 'queued'
                          ? 'Na fila'
                          : status === 'complete'
                            ? 'Concluído'
                            : status === 'error'
                              ? 'Falhou'
                              : agent.autonomy}
                    </span>
                    <button
                      aria-label={`Conectar ${agent.name}`}
                      className="cursor-crosshair rounded p-1 hover:bg-[rgb(var(--surface-hover))]"
                      draggable
                      onClick={(event) => {
                        event.stopPropagation();
                        const from = useAgentStore.getState().connectFrom;
                        if (from) useAgentStore.getState().connect(from, node.id);
                        else useAgentStore.getState().setConnectFrom(node.id);
                      }}
                      onDragStart={(event) => {
                        event.stopPropagation();
                        event.dataTransfer.setData('text/plain', `connect:${node.id}`);
                      }}
                      type="button"
                    >
                      <Link2 className="size-3" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="flex w-[340px] shrink-0 flex-col border-l border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <div className="border-b border-[rgb(var(--border))] p-3">
          <h2 className="text-xs font-semibold">Executar equipe</h2>
          {workflowNotice ? (
            <p className="mt-1 text-[9px] text-[rgb(var(--text-muted))]" role="status">
              {workflowNotice}
            </p>
          ) : null}
          <textarea
            aria-label="Tarefa da equipe"
            className="mt-2 h-20 w-full resize-none rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] p-2 text-xs outline-none"
            onChange={(event) => setTask(event.target.value)}
            value={task}
          />
          <details className="mt-2 rounded-lg border border-[rgb(var(--border))] p-2">
            <summary className="cursor-pointer text-[10px] font-semibold text-[rgb(var(--text-muted))]">
              Versionamento após a tarefa
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-[rgb(var(--text-muted))]">
              {VERSION_CONTROL_CHOICES.map(([key, label]) => (
                <label className="flex items-center gap-1.5" key={key}>
                  <input
                    checked={versionControl[key as keyof AgentVersionControlOptions]}
                    onChange={(event) =>
                      setVersionControl((current) => ({
                        ...current,
                        [key]: event.target.checked,
                        ...(key === 'pullRequest' && event.target.checked
                          ? { branch: true, commit: true }
                          : {}),
                      }))
                    }
                    type="checkbox"
                  />
                  {label}
                </label>
              ))}
            </div>
            {versionControl.pullRequest ? (
              <div className="mt-2 space-y-1.5 border-t border-[rgb(var(--border))] pt-2 text-[9px] text-amber-500">
                <label className="flex items-start gap-1.5">
                  <input
                    checked={versionControl.pushConfirmed}
                    onChange={(event) =>
                      setVersionControl((current) => ({
                        ...current,
                        pushConfirmed: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Autorizo o push desta tarefa.
                </label>
                <label className="flex items-start gap-1.5">
                  <input
                    checked={versionControl.pullRequestConfirmed}
                    onChange={(event) =>
                      setVersionControl((current) => ({
                        ...current,
                        pullRequestConfirmed: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Autorizo criar um pull request draft.
                </label>
              </div>
            ) : null}
          </details>
          <details className="mt-2 rounded-lg border border-[rgb(var(--border))] p-2">
            <summary className="cursor-pointer text-[10px] font-semibold text-[rgb(var(--text-muted))]">
              Execução e rollback
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-[rgb(var(--text-muted))]">
              <label>
                Retries
                <input
                  aria-label="Tentativas adicionais por agente"
                  className="ml-1 w-10 rounded bg-[rgb(var(--surface-sunken))] px-1.5 py-1"
                  max="5"
                  min="0"
                  onChange={(event) =>
                    useAgentStore.getState().updateWorkflow({
                      ...currentWorkflow,
                      retries: Number(event.target.value),
                    })
                  }
                  type="number"
                  value={currentWorkflow.retries}
                />
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  checked={currentWorkflow.rollbackOnFailure}
                  onChange={(event) =>
                    useAgentStore.getState().updateWorkflow({
                      ...currentWorkflow,
                      rollbackOnFailure: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                Rollback na falha
              </label>
            </div>
          </details>
          <div className="mt-2 flex gap-2">
            {activeRunId ? (
              <Button onClick={() => void agentApi.cancel(activeRunId)} size="sm" variant="danger">
                <Square className="size-3 fill-current" /> Cancelar
              </Button>
            ) : (
              <Button
                disabled={
                  versionControl.pullRequest &&
                  (!versionControl.pushConfirmed || !versionControl.pullRequestConfirmed)
                }
                onClick={start}
                size="sm"
              >
                <Play className="size-3 fill-current" /> Executar
              </Button>
            )}
            <Button
              disabled={Boolean(activeRunId) || !currentResult}
              onClick={start}
              size="sm"
              variant="secondary"
            >
              <RotateCw className="size-3" /> Retry
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 border-b border-[rgb(var(--border))] text-center">
          <div className="p-2">
            <Clock3 className="mx-auto size-3.5 text-[rgb(var(--accent))]" />
            <p className="mt-1 text-[10px]">{activeRunId ? `${elapsed}s` : '—'}</p>
          </div>
          <div className="border-x border-[rgb(var(--border))] p-2">
            <CircleDollarSign className="mx-auto size-3.5 text-[rgb(var(--accent))]" />
            <p className="mt-1 text-[10px]">${(currentResult?.costUsd ?? liveCost).toFixed(2)}</p>
          </div>
          <div className="p-2">
            <Activity className="mx-auto size-3.5 text-[rgb(var(--accent))]" />
            <p className="mt-1 text-[10px]">{currentResult?.steps ?? liveSteps} passos</p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          {pendingActions.map(({ runId, agentId, action }) => (
            <div
              className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
              key={action.id}
            >
              <p className="text-[10px] font-semibold text-amber-500">{agentId} pede aprovação</p>
              <p className="mt-1 text-xs">{action.description}</p>
              <p className="mt-1 text-[9px] text-[rgb(var(--text-muted))]">
                Risco: {action.risk} · {action.decisionReason}
              </p>
              {action.path ? (
                <p className="mt-1 font-mono text-[9px]">Arquivo: {action.path}</p>
              ) : null}
              {action.command ? (
                <p className="mt-1 break-all font-mono text-[9px]">$ {action.command}</p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button onClick={() => void approve(runId, action.id, true)} size="sm">
                  Aprovar
                </Button>
                <Button
                  onClick={() => void approve(runId, action.id, false)}
                  size="sm"
                  variant="ghost"
                >
                  Negar
                </Button>
              </div>
            </div>
          ))}
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
            Atividade
          </h3>
          <div className="space-y-2">
            {currentWorkflow.nodes.map((node) => {
              const agent = agents.find(({ id }) => id === node.agentId);
              const run = nodeRuns[node.id];
              return (
                <div className="rounded-lg bg-[rgb(var(--surface-sunken))] p-2.5" key={node.id}>
                  <div className="flex justify-between text-[10px]">
                    <span className="font-semibold">{agent?.name ?? node.agentId}</span>
                    <span>
                      {run === 'running'
                        ? 'executando'
                        : run === 'queued'
                          ? 'na fila'
                          : isCompletedRun(run)
                            ? run.status
                            : typeof run === 'object'
                              ? 'falhou'
                              : 'aguardando'}
                    </span>
                  </div>
                  {isCompletedRun(run) ? (
                    <div className="mt-2 space-y-1 text-[9px] text-[rgb(var(--text-muted))]">
                      <p>{run.output}</p>
                      <p>
                        {runDuration(run.startedAt, run.completedAt)} · ${run.costUsd.toFixed(3)} ·{' '}
                        {run.steps} passo(s) · tentativa {run.attempt}
                      </p>
                      {run.filesRead.length ? <p>Lendo: {run.filesRead.join(', ')}</p> : null}
                      {run.filesChanged.length ? (
                        <p>Alterou: {run.filesChanged.join(', ')}</p>
                      ) : null}
                      {run.commands.length ? <p>Comandos: {run.commands.join(', ')}</p> : null}
                      {run.actions.map((action) => (
                        <p key={action.id}>
                          {action.status}: {action.description}
                          {action.path ? ` · ${action.path}` : ''}
                          {action.command ? ` · $ ${action.command}` : ''}
                        </p>
                      ))}
                      {run.errors.map((error) => (
                        <p className="text-red-400" key={error}>
                          {error}
                        </p>
                      ))}
                    </div>
                  ) : typeof run === 'object' ? (
                    <p className="mt-2 text-[9px] text-red-400">
                      {run.message} · tentativa {run.attempt}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {currentWorkflow.edges.length ? (
            <details className="mt-4">
              <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
                Conexões ({currentWorkflow.edges.length})
              </summary>
              <div className="mt-2 space-y-1">
                {currentWorkflow.edges.map((edge) => {
                  const sourceNode = currentWorkflow.nodes.find(({ id }) => id === edge.source);
                  const targetNode = currentWorkflow.nodes.find(({ id }) => id === edge.target);
                  const source = agents.find(({ id }) => id === sourceNode?.agentId);
                  const target = agents.find(({ id }) => id === targetNode?.agentId);
                  return (
                    <div
                      className="flex items-center gap-2 rounded-md bg-[rgb(var(--surface-sunken))] px-2 py-1.5 text-[9px]"
                      key={edge.id}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {source?.name ?? edge.source} → {target?.name ?? edge.target}
                      </span>
                      <button
                        aria-label={`Remover conexão de ${source?.name ?? edge.source} para ${target?.name ?? edge.target}`}
                        onClick={() => useAgentStore.getState().removeEdge(edge.id)}
                        type="button"
                      >
                        <Unlink2 className="size-3 text-[rgb(var(--text-subtle))]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </details>
          ) : null}
          {logs.length ? (
            <>
              <h3 className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
                Logs
              </h3>
              <div className="rounded-lg bg-black/20 p-2 font-mono text-[9px] leading-4 text-[rgb(var(--text-muted))]">
                {logs.slice(-12).map((log, index) => (
                  <p key={`${log}-${index}`}>{log}</p>
                ))}
              </div>
            </>
          ) : null}
          {currentResult ? (
            <div className="mt-3 rounded-lg border border-[rgb(var(--border))] p-3 text-[10px]">
              <p className="font-semibold">Resultado: {currentResult.status}</p>
              <p className="mt-1 text-[rgb(var(--text-muted))]">
                Rollback automático:{' '}
                {currentResult.rolledBack
                  ? 'executado'
                  : currentWorkflow.rollbackOnFailure
                    ? 'armado'
                    : 'desativado'}
              </p>
              {currentResult.error ? (
                <p className="mt-1 text-red-400">{currentResult.error}</p>
              ) : null}
            </div>
          ) : null}
          {history.length ? (
            <>
              <h3 className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
                Histórico
              </h3>
              {history.slice(0, 5).map((run) => (
                <details
                  className="mb-1 rounded-md px-2 py-1.5 text-[9px] hover:bg-[rgb(var(--surface-hover))]"
                  key={run.id}
                >
                  <summary className="flex cursor-pointer justify-between gap-2">
                    <span className="truncate">{run.task}</span>
                    <span>{run.status}</span>
                  </summary>
                  <p className="mt-1 text-[rgb(var(--text-muted))]">
                    {runDuration(run.startedAt, run.completedAt)} · ${run.costUsd.toFixed(3)} ·{' '}
                    {run.steps} passo(s) · {run.agentRuns.length} agente(s)
                  </p>
                  {run.error ? <p className="mt-1 text-red-400">{run.error}</p> : null}
                </details>
              ))}
            </>
          ) : null}
        </div>
      </aside>

      {selectedAgentId ? (
        <AgentEditor
          agent={selectedAgent}
          onClose={() => useAgentStore.getState().setSelectedAgent(null)}
          onDelete={(agentId) => useAgentStore.getState().removeCustomAgent(agentId)}
          onSave={(agent: AgentDefinition) => {
            if (selectedAgentId === '__new__') useAgentStore.getState().addCustomAgent(agent);
            else useAgentStore.getState().updateAgent(agent);
          }}
        />
      ) : null}
    </section>
  );
}
