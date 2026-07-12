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

## Depois — Capacidades locais seguras

- [ ] terminal isolado com `node-pty`;
- [ ] SQLite e migrations;
- [ ] policy engine, confirmação, diff e auditoria;
- [ ] testes macOS, Windows e Linux.

## Futuro — IA, agentes e ecossistema

- [ ] mock provider e primeira integração opt-in;
- [ ] contexto explícito e secrets no keychain;
- [ ] lifecycle de agentes e ferramentas autorizadas;
- [ ] source control, deploy e eventos remotos;
- [ ] empacotamento, assinatura, auto-update e releases.

Detalhes e critérios de saída: [`docs/development-plan.md`](./docs/development-plan.md).
