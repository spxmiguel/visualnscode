import { describe, expect, it } from 'vitest';
import { builtInAgents } from './defaults';
import { FakeAgentExecutor } from './fake-executor';
import { decideAgentAction } from './policy';
import { teamTemplates } from './templates';
import { WorkflowEngine, workflowStages } from './workflow-engine';

describe('catálogo de agentes', () => {
  it('inclui os dez agentes e sete equipes solicitados', () => {
    expect(builtInAgents).toHaveLength(10);
    expect(teamTemplates).toHaveLength(7);
    expect(builtInAgents.map(({ name }) => name)).toContain('Security Auditor');
  });
});

describe('política de autonomia', () => {
  const editor = builtInAgents.find(({ id }) => id === 'frontend-developer')!;

  it('bloqueia caminhos fora das pastas permitidas', () => {
    expect(
      decideAgentAction(editor, {
        id: 'action-1',
        type: 'edit',
        description: 'Editar segredo externo',
        path: '../secret.txt',
        risk: 'important',
      }),
    ).toEqual({
      allowed: false,
      requiresApproval: false,
      reason: 'Caminho fora das pastas permitidas.',
    });
  });

  it('exige aprovação de edição no modo Guided', () => {
    expect(
      decideAgentAction(editor, {
        id: 'action-2',
        type: 'edit',
        description: 'Editar componente',
        path: 'src/App.tsx',
        risk: 'important',
      }).requiresApproval,
    ).toBe(true);
  });
});

describe('WorkflowEngine', () => {
  it('executa ramos independentes em paralelo e repassa resultados', async () => {
    const template = teamTemplates.find(({ id }) => id === 'full-stack-app')!;
    const executor = new FakeAgentExecutor({ delayMs: 5 });
    const engine = new WorkflowEngine(executor);
    const result = await engine.run(template, builtInAgents, 'Criar um app');

    expect(result.status).toBe('completed');
    expect(executor.maxConcurrent).toBe(2);
    const reviewer = executor.contexts.find(({ agent }) => agent.id === 'reviewer');
    expect(reviewer?.context.previousResults).toHaveLength(2);
  });

  it('faz retry e rollback após falha final', async () => {
    const template = teamTemplates.find(({ id }) => id === 'bug-fix')!;
    const executor = new FakeAgentExecutor({ failAgentId: 'reviewer' });
    const engine = new WorkflowEngine(executor);
    const result = await engine.run(template, builtInAgents, 'Corrigir bug');

    expect(result.status).toBe('failed');
    expect(executor.contexts.filter(({ agent }) => agent.id === 'reviewer')).toHaveLength(2);
    expect(result.rolledBack).toBe(true);
    expect(executor.rolledBack).toHaveLength(1);
  });

  it('permite cancelamento de uma execução', async () => {
    const template = teamTemplates.find(({ id }) => id === 'documentation')!;
    const executor = new FakeAgentExecutor({ delayMs: 100 });
    const engine = new WorkflowEngine(executor);
    const running = engine.run(template, builtInAgents, 'Documentar', { runId: 'cancel-run' });
    engine.cancel('cancel-run');

    expect((await running).status).toBe('cancelled');
  });

  it('rejeita ciclos no grafo', () => {
    const template = teamTemplates.find(({ id }) => id === 'bug-fix')!;
    const first = template.nodes[0]!;
    const last = template.nodes.at(-1)!;
    expect(() =>
      workflowStages({
        ...template,
        edges: [...template.edges, { id: 'cycle', source: last.id, target: first.id }],
      }),
    ).toThrow('O workflow contém um ciclo.');
  });
});
