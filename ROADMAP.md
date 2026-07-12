# Roadmap

O roadmap descreve resultados e critérios, não datas prometidas. Prioridades podem mudar após
pesquisa com usuários e revisão de segurança.

## Agora — Fundação 0.1

- [x] monorepo e apps separados;
- [x] shell desktop e landing executáveis;
- [x] limites de packages e ADRs;
- [x] lint, typecheck, testes, build e CI.

## Interface inicial 0.2

- [x] tela inicial, projetos recentes e configurações;
- [x] identidade visual própria com temas claro e escuro;
- [x] workspace em modos simples e avançado;
- [x] Monaco, abas e estados de interface;
- [x] explorador, chat, preview e painéis redimensionáveis demonstrativos;
- [x] catálogo visual de componentes reutilizáveis;
- [x] testes de interação do workspace.

## Próximo — Workspace local real

- [ ] abrir e gerenciar workspaces;
- [ ] explorer, abas, salvar e busca;
- [ ] IPC versionado e validado;
- [ ] acessibilidade de teclado desde a primeira jornada.

## Onboarding de ambiente 0.3

- [x] assistente persistido em 12 etapas;
- [x] detecção de runtimes, package managers, deploy e agentes;
- [x] permissões e confirmação por ação;
- [x] GitHub, Firebase, Vercel e Supabase por adapters;
- [x] providers locais e cofre seguro para chaves remotas;
- [x] testes unitários e de integração sem login real;
- [ ] conectar ações de escrita a um workspace real validado.

## Depois — Capacidades locais seguras

- [ ] terminal isolado com `node-pty`;
- [ ] SQLite e migrations;
- [ ] policy engine, confirmação, diff e auditoria;
- [ ] testes macOS, Windows e Linux.

## Providers universais 0.4

- [x] porta comum para APIs, serviços locais e CLIs;
- [x] catálogo de 12 providers com capacidades e execução local/remota;
- [x] streaming e cancelamento normalizados por IPC;
- [x] configuração de modelos, limites e concorrência;
- [x] chat com arquivos no contexto, histórico e exportação;
- [x] logs sanitizados, cofre do sistema e testes com provider falso;
- [ ] precificação atualizável por modelo e orçamento acumulado por sessão;

## Futuro — Agentes e ecossistema

- [x] mock provider e primeira integração opt-in;
- [x] contexto explícito e secrets no keychain;
- [ ] lifecycle de agentes e ferramentas autorizadas;
- [ ] source control, deploy e eventos remotos;
- [ ] empacotamento, assinatura, auto-update e releases.

Detalhes e critérios de saída: [`docs/development-plan.md`](./docs/development-plan.md).
