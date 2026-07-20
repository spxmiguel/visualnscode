// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAgentStore } from './agent-store';
import { AgentWorkspace } from './components/agents/AgentWorkspace';
import { useWorkspaceStore } from './workspace-store';

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.getState().applyTemplate('bug-fix');
  useAgentStore.setState({
    activeRunId: null,
    currentResult: null,
    customAgents: [],
    overrides: {},
    nodeRuns: {},
    pendingActions: [],
    logs: [],
    history: [],
    selectedAgentId: null,
    connectFrom: null,
    workflowNotice: null,
  });
  useWorkspaceStore.setState({ activeFileId: 'app', openTabs: ['app'] });
});

afterEach(() => cleanup());

describe('sistema visual de agentes', () => {
  it('executa uma equipe e mostra atividade, arquivos, custo e histórico', async () => {
    const user = userEvent.setup();
    render(<AgentWorkspace />);

    expect(screen.queryByRole('heading', { name: 'Bug Fix' })).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Executar' }));
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeNull();

    await waitFor(() => expect(screen.queryByText('Resultado: completed')).not.toBeNull(), {
      timeout: 3000,
    });
    expect(screen.queryAllByText(/Lendo: src\/App.tsx/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Histórico')).not.toBeNull();
  });

  it('permite criar um agente personalizado completo', async () => {
    const user = userEvent.setup();
    render(<AgentWorkspace />);
    useAgentStore.getState().setSelectedAgent('__new__');

    const name = await screen.findByLabelText('Nome');
    await user.clear(name);
    await user.type(name, 'Especialista Mobile');
    await user.click(screen.getByRole('button', { name: 'Salvar agente' }));

    expect(useAgentStore.getState().customAgents[0]?.name).toBe('Especialista Mobile');
  });

  it('adiciona, move e conecta nós no grafo', () => {
    const store = useAgentStore.getState();
    const initialNodes = store.currentWorkflow.nodes.length;
    store.addNode('architect', 400, 300);
    const added = useAgentStore.getState().currentWorkflow.nodes.at(-1)!;
    expect(useAgentStore.getState().currentWorkflow.nodes).toHaveLength(initialNodes + 1);
    useAgentStore.getState().moveNode(added.id, 450, 320);
    expect(useAgentStore.getState().currentWorkflow.nodes.at(-1)?.position).toEqual({
      x: 450,
      y: 320,
    });
    const source = useAgentStore.getState().currentWorkflow.nodes[0]!;
    useAgentStore.getState().connect(source.id, added.id);
    expect(
      useAgentStore
        .getState()
        .currentWorkflow.edges.some(
          (edge) => edge.source === source.id && edge.target === added.id,
        ),
    ).toBe(true);
  });

  it('impede ciclos e permite remover conexões visualmente', async () => {
    const user = userEvent.setup();
    useAgentStore.getState().applyTemplate('code-review');
    const [reviewer, security] = useAgentStore.getState().currentWorkflow.nodes;
    useAgentStore.getState().connect(reviewer!.id, security!.id);
    useAgentStore.getState().connect(security!.id, reviewer!.id);

    expect(useAgentStore.getState().currentWorkflow.edges).toHaveLength(1);
    expect(useAgentStore.getState().workflowNotice).toMatch(/ciclos/i);

    render(<AgentWorkspace />);
    await user.click(screen.getByText(/Conexões \(1\)/));
    await user.click(
      screen.getByRole('button', {
        name: 'Remover conexão de Reviewer para Security Auditor',
      }),
    );
    expect(useAgentStore.getState().currentWorkflow.edges).toHaveLength(0);
  });

  it('registra fila e falha por nó com mensagem visível', () => {
    const node = useAgentStore.getState().currentWorkflow.nodes[0]!;
    useAgentStore.getState().handleEvent({
      type: 'stage-started',
      runId: 'run-status',
      nodeIds: [node.id],
    });
    expect(useAgentStore.getState().nodeRuns[node.id]).toBe('queued');

    useAgentStore.getState().handleEvent({
      type: 'agent-failed',
      runId: 'run-status',
      nodeId: node.id,
      agentId: node.agentId,
      message: 'Provider indisponível.',
      attempt: 2,
    });
    expect(useAgentStore.getState().nodeRuns[node.id]).toMatchObject({
      status: 'failed',
      attempt: 2,
    });
  });

  it('exige autorizações separadas antes de permitir PR automático', async () => {
    const user = userEvent.setup();
    render(<AgentWorkspace />);

    await user.click(screen.getByText('Versionamento após a tarefa'));
    await user.click(screen.getByLabelText('Pull request draft'));

    const execute = screen.getByRole('button', { name: 'Executar' }) as HTMLButtonElement;
    expect(execute.disabled).toBe(true);
    await user.click(screen.getByLabelText('Autorizo o push desta tarefa.'));
    expect(execute.disabled).toBe(true);
    await user.click(screen.getByLabelText('Autorizo criar um pull request draft.'));
    expect(execute.disabled).toBe(false);
  });
});
