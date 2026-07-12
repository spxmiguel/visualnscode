# Análise de requisitos

## Visão do produto

O VisualnsCode deve centralizar edição, IA, agentes, CLIs e deploy sem expor toda a complexidade
de uma IDE tradicional no primeiro contato. A interface será progressiva: segura e guiada por
padrão, com controles avançados disponíveis quando necessários.

## Requisitos funcionais de longo prazo

1. Abrir, editar, salvar e buscar arquivos de um workspace local.
2. Fornecer terminal integrado e executar comandos com política explícita de risco.
3. Permitir configurar múltiplos providers de IA por adaptadores substituíveis.
4. Orquestrar agentes com escopo, capacidades, limites e trilha de auditoria.
5. Integrar source control, CLIs e plataformas de deploy sem acoplá-las à interface.
6. Persistir configurações, metadados e histórico localmente.
7. Apresentar modos de uso guiado e avançado sobre o mesmo núcleo de domínio.

## Requisitos não funcionais

- **Segurança:** renderer sem acesso direto ao Node.js; IPC mínimo, validado e auditável;
  credenciais fora do estado do renderer; confirmação para efeitos locais relevantes.
- **Evolução:** contratos estáveis, adapters por provider e pacotes com dependências direcionais.
- **Confiabilidade:** lint, typecheck, testes e build obrigatórios no CI.
- **Desempenho:** carregar recursos pesados sob demanda e evitar bloquear o processo main.
- **Portabilidade:** macOS, Windows e Linux, com abstrações para diferenças de shell e filesystem.
- **Acessibilidade:** navegação por teclado, semântica e contraste tratados como critérios de
  aceite, não como acabamento.
- **Privacidade:** contexto enviado externamente deve ser explícito e minimizado.

## Escopo desta entrega

- monorepo pnpm com apps desktop e landing separadas;
- shell Electron mínimo com isolamento seguro;
- React, Vite, Tailwind, Monaco e Zustand configurados;
- contratos iniciais para core, agents, providers e integrations;
- lint, formatação, typecheck, testes unitários, smoke test e CI;
- documentação de arquitetura, plano, governança e decisões.

## Fora do escopo desta entrega

- chamadas reais a modelos ou armazenamento de chaves de API;
- execução de agentes ou comandos locais;
- terminal com `node-pty`, banco SQLite ou WebSocket;
- empacotadores, assinatura de binários e auto-update;
- autenticação, telemetria ou deploy real.

Esses itens dependem de threat modeling e contratos validados nas fases seguintes.
