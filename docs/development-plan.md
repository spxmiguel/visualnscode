# Plano de desenvolvimento

Cada fase termina com lint, typecheck, testes e build verdes. Funcionalidades devem entrar em
fatias verticais pequenas; nenhuma fase autoriza a implementação antecipada de todas as seguintes.

## Fase 0 — Fundação

**Objetivo:** estabelecer limites, ferramentas e documentação.

- monorepo, apps, pacotes, TypeScript, ESLint, Prettier e Tailwind;
- shell Electron seguro, renderer e landing mínimos;
- Vitest, Playwright, CI, governança e ADRs.

**Saída:** clone limpo instala, valida e compila com comandos documentados. **Concluída.**

## Fase 1 — Workspace local

**Objetivo:** tornar o editor útil sem IA.

- abertura de pasta por diálogo nativo;
- árvore de arquivos, abas, edição e salvamento;
- busca básica e preferências de editor;
- IPC tipado, schemas de validação e testes de contrato.

**Saída:** usuário edita um projeto local e nenhuma API Node é exposta diretamente ao renderer.

## Fase 2 — Terminal e persistência

**Objetivo:** adicionar capacidades locais controladas.

- `node-pty` isolado em processo utilitário;
- SQLite com migrations para preferências e histórico;
- classificação de risco, preview, confirmação e cancelamento de comandos;
- logs de auditoria locais com política de retenção.

**Saída:** terminal funciona nas três plataformas-alvo e cenários destrutivos exigem confirmação.

## Fase 3 — Primeiro provider de IA

**Objetivo:** validar a arquitetura de providers com uma única integração.

- porta canônica de mensagens, streaming, erros e capacidades;
- armazenamento seguro de segredo pelo keychain do sistema;
- consentimento e preview do contexto enviado;
- mock provider para testes determinísticos.

**Saída:** chat opt-in funciona por adapter, sem SDK de fornecedor no `core` ou no renderer.

## Fase 4 — Agentes e ferramentas

**Objetivo:** permitir tarefas assistidas com controle humano.

- lifecycle de agente, orçamento, cancelamento e checkpoints;
- tool calls tipadas e autorizadas pela política de comandos;
- diff antes de escrita e recuperação de falhas;
- integração inicial de source control.

**Saída:** toda mutação é revisável, rastreável e reversível quando tecnicamente possível.

## Fase 5 — Integrações e deploy

**Objetivo:** conectar serviços sem fragmentar a experiência.

- catálogo de integrações e capacidades;
- deploy com preview de plano e confirmação;
- WebSocket apenas para fluxos remotos que precisem de eventos em tempo real;
- observabilidade e diagnóstico local opt-in.

**Saída:** integrações falham de forma isolada e não bloqueiam o editor.

## Fase 6 — Distribuição e maturidade

**Objetivo:** preparar releases públicos confiáveis.

- empacotamento, assinatura, notarização e auto-update;
- acessibilidade WCAG, performance e testes cross-platform;
- threat model revisado, SBOM e resposta a vulnerabilidades;
- canal stable/beta e migrações compatíveis.

**Saída:** artefatos reproduzíveis, assinados e promovidos por uma release pipeline auditável.
