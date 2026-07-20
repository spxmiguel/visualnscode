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

## Workspace local real — completo

- [x] abrir e gerenciar workspaces via diálogo nativo;
- [x] filesystem IPC com proteção contra path traversal;
- [x] salvar arquivo com Cmd/Ctrl+S;
- [x] diff Monaco lado a lado e unificado, com seleção por arquivo/bloco e edição antes de aplicar;
- [x] propostas de agentes sem escrita silenciosa e aceite/rejeição explícitos;
- [x] checkpoints, snapshots, histórico, rollback e ponto de recuperação antes de desfazer;
- [x] scanner e redação de secrets antes de providers remotos;
- [x] isolamento por caminho real, proteção contra traversal, symlinks externos e exclusão em massa;
- [x] classificador de comandos (safe / confirm / dangerous / blocked) e modo YOLO limitado;
- [ ] busca de texto no workspace;
- [ ] acessibilidade de teclado completa.

## Onboarding de ambiente 0.3

- [x] assistente persistido em 12 etapas;
- [x] detecção de runtimes, package managers, deploy e agentes;
- [x] permissões e confirmação por ação;
- [x] GitHub, Firebase, Vercel e Supabase por adapters;
- [x] providers locais e cofre seguro para chaves remotas;
- [x] testes unitários e de integração sem login real;
- [ ] conectar ações de escrita a um workspace real validado.

## Integração Git e GitHub — completo

- [x] git status, stage, unstage, commit;
- [x] log de histórico visual;
- [x] branches, checkout, criar branch;
- [x] stash / stash pop;
- [x] merge, diff, tags, reset seguro, revert e resolução de conflitos;
- [x] push confirmado e pull `--ff-only`;
- [x] autenticação, criar/clonar/forkar repositório e abrir no navegador;
- [x] listar e criar issues, pull requests e releases, além de visualizar Actions;
- [x] modo simples com Salvar versão, Enviar, Baixar, Backup e Histórico;
- [x] commits, branches, checkpoints e pull requests opcionais por tarefa de agentes;
- [x] bloqueio de push automático sem autorização específica da tarefa.

## Preview e execução — completo

- [x] detectar instalação, desenvolvimento, build, teste e porta para npm, pnpm, Yarn, Bun, Python
      e sites estáticos;
- [x] iniciar, parar e reiniciar processos com stream separado de logs e erros;
- [x] preview integrado com resoluções desktop, tablet, mobile e personalizada;
- [x] screenshot, refresh e abertura segura no navegador;
- [x] element picker com contexto DOM enviado ao rascunho do chat;
- [x] console e logs básicos de rede por ponte isolada;
- [x] deploy confirmado para Vercel, Firebase Hosting, Supabase e GitHub Pages;
- [x] build de validação, logs sanitizados, URL e histórico local de deploy;

## Templates e criação — completo

- [x] descrição em linguagem natural com sugestão local e explicável de stack, estrutura, banco,
      autenticação, deploy e agente;
- [x] 13 templates com React, Next.js, Electron, Node API, Express, Fastify, Firebase, Supabase,
      Landing, Portfolio, Dashboard, Static e Empty;
- [x] templates versionados e identificados no projeto gerado;
- [x] pipeline guiado para arquivos, dependências, Git, primeiro commit, integração opcional,
      execução e preview;
- [x] confirmação separada para GitHub e serviços externos, sem push automático;
- [x] testes de criação com executor falso, sem instalação, autenticação ou publicação real;
- [ ] catálogo remoto assinado e opt-in.

## Depois — Capacidades locais avançadas

- [ ] terminal isolado com `node-pty`;
- [ ] SQLite e migrations;
- [ ] auto-update via `electron-updater`;
- [ ] testes macOS, Windows e Linux.

## Providers universais 0.4

- [x] porta comum para APIs, serviços locais e CLIs;
- [x] catálogo de 12 providers com capacidades e execução local/remota;
- [x] streaming e cancelamento normalizados por IPC;
- [x] configuração de modelos, limites e concorrência;
- [x] chat com arquivos no contexto, histórico e exportação;
- [x] logs sanitizados, cofre do sistema e testes com provider falso;
- [ ] precificação atualizável por modelo e orçamento acumulado por sessão;

## Empacotamento cross-platform

- [x] `electron-builder` configurado para mac, linux e windows;
- [x] executável `spxcode` — abrível de qualquer terminal;
- [x] instaladores: `.pkg` (macOS), `.AppImage`+`.deb` (Linux), `.msi` (Windows);
- [x] scripts `install.sh` e `install.ps1` detectam OS automaticamente;
- [x] CI release em matrix macOS / Linux / Windows com GitHub Actions;
- [ ] assinatura e notarização macOS (`CSC_*` secrets);
- [ ] assinatura Windows (Code Signing Certificate);
- [ ] auto-update via `electron-updater`.

## Futuro — Agentes e ecossistema

- [x] mock provider e primeira integração opt-in;
- [x] contexto explícito e secrets no keychain;
- [ ] lifecycle de agentes e ferramentas autorizadas;
- [ ] source control, deploy e eventos remotos;
- [ ] plugins de terceiros.

Detalhes e critérios de saída: [`docs/development-plan.md`](./docs/development-plan.md).
