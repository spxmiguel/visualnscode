import type { TeamWorkflow, WorkflowEdge, WorkflowNode } from './types';

const workflow = (
  id: string,
  name: string,
  description: string,
  agentIds: readonly string[],
  connections?: readonly [number, number][],
): TeamWorkflow => {
  const nodes: readonly WorkflowNode[] = agentIds.map((agentId, index) => ({
    id: `${id}-${agentId}-${index}`,
    agentId,
    position: { x: 60 + (index % 3) * 220, y: 60 + Math.floor(index / 3) * 150 },
  }));
  const pairs = connections ?? agentIds.slice(1).map((_, index) => [index, index + 1] as const);
  const edges: readonly WorkflowEdge[] = pairs.map(([source, target], index) => ({
    id: `${id}-edge-${index}`,
    source: nodes[source]?.id ?? '',
    target: nodes[target]?.id ?? '',
  }));
  return {
    id,
    name,
    description,
    nodes,
    edges,
    maxCostUsd: 10,
    timeoutMs: 900_000,
    maxSteps: 40,
    retries: 1,
    rollbackOnFailure: true,
    builtIn: true,
  };
};

export const teamTemplates: readonly TeamWorkflow[] = [
  workflow(
    'full-stack-app',
    'Full Stack App',
    'Arquitetura, frontend e backend em paralelo, revisão, testes e documentação.',
    [
      'architect',
      'frontend-developer',
      'backend-developer',
      'reviewer',
      'tester',
      'documentation-writer',
    ],
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  ),
  workflow(
    'landing-page',
    'Landing Page',
    'Implementação visual, revisão, testes e documentação.',
    ['architect', 'frontend-developer', 'reviewer', 'tester', 'documentation-writer'],
  ),
  workflow('bug-fix', 'Bug Fix', 'Diagnóstico, correção, revisão e teste da regressão.', [
    'debugger',
    'backend-developer',
    'reviewer',
    'tester',
  ]),
  workflow(
    'code-review',
    'Code Review',
    'Revisão técnica e auditoria de segurança em paralelo.',
    ['reviewer', 'security-auditor'],
    [],
  ),
  workflow('test-generator', 'Test Generator', 'Análise e geração de uma suíte de testes.', [
    'architect',
    'tester',
    'reviewer',
  ]),
  workflow('documentation', 'Documentation', 'Levantamento técnico, escrita e revisão.', [
    'architect',
    'documentation-writer',
    'reviewer',
  ]),
  workflow('deploy', 'Deploy', 'Auditoria, testes e deploy com aprovações.', [
    'security-auditor',
    'tester',
    'devops',
  ]),
];

export const getTeamTemplate = (id: string): TeamWorkflow | undefined =>
  teamTemplates.find((template) => template.id === id);
