import type { AgentDefinition, AgentTool } from './types';

const createAgent = (
  id: string,
  name: string,
  description: string,
  systemPrompt: string,
  tools: readonly AgentTool[],
  autonomy: AgentDefinition['autonomy'] = 'guided',
): AgentDefinition => ({
  id,
  name,
  description,
  providerId: 'ollama',
  model: 'default',
  systemPrompt,
  allowedTools: tools,
  allowedFolders: ['.'],
  costLimitUsd: 2,
  timeoutMs: 180_000,
  memory: { enabled: true, scope: 'run', maxEntries: 20 },
  autonomy,
  terminalPermission: tools.includes('terminal') ? 'safe' : 'none',
  editPermission: tools.includes('edit-files') ? 'propose' : 'none',
  builtIn: true,
});

export const builtInAgents: readonly AgentDefinition[] = [
  createAgent(
    'architect',
    'Architect',
    'Define arquitetura, fronteiras e plano técnico.',
    'Você é o arquiteto. Analise requisitos, riscos, dependências e produza um plano implementável sem editar arquivos.',
    ['read-files', 'search'],
  ),
  createAgent(
    'frontend-developer',
    'Frontend Developer',
    'Implementa interfaces acessíveis e responsivas.',
    'Implemente a interface com foco em acessibilidade, estados claros, reutilização e testes.',
    ['read-files', 'search', 'edit-files', 'terminal', 'tests', 'preview'],
  ),
  createAgent(
    'backend-developer',
    'Backend Developer',
    'Implementa domínio, APIs e persistência segura.',
    'Implemente contratos e serviços com validação, segurança por padrão e testes isolados.',
    ['read-files', 'search', 'edit-files', 'terminal', 'tests'],
  ),
  createAgent(
    'debugger',
    'Debugger',
    'Investiga falhas e identifica causa raiz.',
    'Reproduza o erro, colete evidências, determine a causa raiz e proponha a menor correção segura.',
    ['read-files', 'search', 'terminal', 'tests'],
    'ask',
  ),
  createAgent(
    'reviewer',
    'Reviewer',
    'Revisa corretude, manutenção e regressões.',
    'Revise alterações com evidências. Priorize bugs reais, segurança, testes e clareza.',
    ['read-files', 'search', 'git'],
  ),
  createAgent(
    'tester',
    'Tester',
    'Cria e executa testes proporcionais ao risco.',
    'Crie testes determinísticos, cubra erros e execute somente comandos allowlisted de qualidade.',
    ['read-files', 'search', 'edit-files', 'terminal', 'tests'],
  ),
  createAgent(
    'documentation-writer',
    'Documentation Writer',
    'Mantém documentação clara e verificável.',
    'Documente comportamento, instalação, decisões e limitações usando linguagem direta.',
    ['read-files', 'search', 'edit-files'],
  ),
  createAgent(
    'security-auditor',
    'Security Auditor',
    'Audita permissões, segredos e superfícies de ataque.',
    'Faça análise defensiva, identifique privilégios excessivos e nunca revele segredos em resultados.',
    ['read-files', 'search', 'git', 'tests'],
    'ask',
  ),
  createAgent(
    'devops',
    'DevOps',
    'Cuida de build, CI e deploy com confirmação.',
    'Planeje automação reprodutível. Deploy e alterações de infraestrutura exigem aprovação explícita.',
    ['read-files', 'edit-files', 'terminal', 'git', 'tests', 'deploy'],
    'ask',
  ),
  createAgent(
    'project-manager',
    'Project Manager',
    'Organiza escopo, dependências e critérios de conclusão.',
    'Transforme a tarefa em etapas verificáveis, acompanhe riscos e sintetize o progresso da equipe.',
    ['read-files', 'search'],
  ),
];

export const getBuiltInAgent = (id: string): AgentDefinition | undefined =>
  builtInAgents.find((agent) => agent.id === id);
