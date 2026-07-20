# Changelog

Todas as mudanças relevantes serão registradas neste arquivo. O formato segue
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto pretende usar
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- integração Git completa com status sincronizado, stage, unstage, diff, Conventional Commits,
  histórico visual, branches, merge, stash, tags, reset seguro, revert e conflitos;
- integração GitHub via `gh` para autenticação, repositório, clone, fork, push/pull, issues, pull
  requests, Actions e releases;
- painel de versionamento em linguagem simples e painel avançado com conceitos reais de Git/GitHub;
- versionamento opt-in de tarefas de agentes com checkpoint, branch, commit e pull request draft,
  exigindo confirmação separada para push e PR;
- testes com executores falsos para Git/GitHub e testes de interface dos modos simples e avançado,
  sem efeitos remotos;
- criação guiada por descrição em linguagem natural, com recomendação local de nome, stack,
  estrutura, banco, autenticação, deploy e agente;
- catálogo de 13 templates versionados, agora separando Node.js API e Express e registrando a origem
  em `.visualnscode/template.json`;
- pipeline de criação com mensagens simples, detalhes técnicos expansíveis, opções de dependências,
  Git, primeiro commit, GitHub, Firebase, Supabase, Vercel, execução e preview;
- confirmações explícitas para ações externas e testes com executor falso que não instala nem publica;
- fluxo de propostas de edição por IA sem escrita automática: seleção por arquivo e bloco, diff
  lado a lado ou unificado, edição antes de aplicar, rejeição e aceite parcial;
- histórico real de checkpoints com snapshots de arquivos novos/existentes, rollback e snapshot de
  segurança antes de desfazer;
- modo YOLO persistente com permissão global separada, confirmação explícita, banner ativo e
  invariantes que continuam exigindo aprovação ou bloqueando comandos destrutivos;
- testes de serviços para traversal, symlinks externos, credenciais, exclusão em massa, redaction,
  comandos, diffs, aplicação parcial e rollback;
- sistema de edição segura com diff viewer lado a lado (Monaco `DiffEditor`), fluxo propor → revisar → aceitar/rejeitar → checkpoint → gravar;
- `FilesystemService`: operações de arquivo isoladas ao workspace, proteção contra path traversal e symlinks externos;
- `SecretScanner`: detecção de API keys, tokens, chaves privadas, URLs de banco com credenciais — redação automática antes de enviar ao contexto de IA;
- `CheckpointService`: snapshots por workspace com rollback automático e limite de 50 checkpoints;
- `GitService`: status, stage, unstage, commit, log, branches, checkout, criar branch, stash via `child_process.execFile`;
- `RunnerService`: iniciar/parar processo de desenvolvimento, detectar script `dev` e porta, stream de logs e URL para o painel de preview;
- `ScaffoldService`: pipeline tipado e seguro para templates, instalações opcionais, Git e integrações confirmadas;
- `CreateProjectModal`: fluxo de ideia, recomendação, template, configuração e progresso legível;
- painel Git funcional no BottomPanel: arquivos staged/unstaged, stage/unstage por arquivo, commit com mensagem, histórico de 10 commits;
- painel Preview com controles Run/Stop, modos desktop/tablet/mobile, iframe integrado, botão de abrir no navegador;
- `DiffViewer` component com Monaco diff editor lado a lado, botões aceitar/rejeitar;
- Cmd/Ctrl+S grava o arquivo ativo no disco via `fs:write-file` IPC;
- botão "Abrir pasta" na HomeScreen abre diálogo nativo de sistema de arquivos;
- 50+ canais IPC novos: `fs:*`, `checkpoint:*`, `git:*`, `runner:*`, `scaffold:*`;
- todos os canais expostos no preload e tipados em `electron.d.ts`;
- documentação completa: `docs/getting-started.md`, `docs/installation.md`, `docs/agents.md`, `docs/integrations.md`, `docs/security-model.md`, `docs/cli-detection.md`, `docs/project-templates.md`, `docs/deployment.md`, `docs/troubleshooting.md`, `docs/development.md`, `docs/testing.md`, `docs/releases.md`, `docs/README.pt-BR.md`;
- `docs/audit-report.md` com auditoria completa, classificação Critical/High/Medium/Low e issues rastreadas;
- templates de issue GitHub (bug report, feature request, security, config.yml) e template de pull request;
- `dependabot.yml` com grupos npm e atualização semanal;
- `.changeset/config.json` para versionamento semântico via Changesets;
- `.husky/pre-commit` com lint-staged (ESLint + Prettier por extensão);
- `lint-staged` e `husky` adicionados ao root `package.json`.

### Changed

- `electron-builder` e o target Squirrel atualizados para 26.15.3, removendo vulnerabilidades altas
  transitivas do empacotador antigo;
- `FilesystemService` agora valida o caminho lexical e o destino real, rejeita symlinks inseguros,
  grava atomicamente e protege arquivos de credenciais contra leitura e sobrescrita;
- providers remotos recebem mensagens e arquivos de contexto redigidos no processo principal;
- o runner aceita somente scripts detectados no projeto e inicia processos sem shell;
- landing page completa: hero, IDE mockup, integrations ticker, features, modos, agentes, segurança, roadmap, FAQ, CTA e footer;
- identidade visual própria: novo AppMark SVG (ícone terminal `>_`) substituindo Sparkles genérico;
- `electron-builder.yml`: empacotamento cross-platform — `.pkg` (macOS arm64/x64), `.AppImage`+`.deb`+`.rpm` (Linux), `.msi`+`.exe` (Windows);
- executável renomeado para `spxcode` — abrível direto do terminal após instalação;
- postinstall script macOS cria symlink `/usr/local/bin/spxcode → .app/Contents/MacOS/spxcode`;
- `scripts/install.sh` — instalador curl para macOS e Linux, detecta OS e arch, sem dependências externas;
- `scripts/install.ps1` — instalador PowerShell para Windows (cmd, PowerShell, Windows Terminal);
- workflow `.github/workflows/release.yml` — CI builds em matrix mac/linux/windows, cria GitHub Release com todos os artifacts automaticamente;
- README completo com ASCII logo, badges CI/release/license/platform, curl install em destaque, tabela de features, stack, estrutura e roadmap.

### Changed

- `README.md` reescrito do zero no estilo lootflow: punchy, install-first, badges, sem placeholder;
- `apps/desktop/package.json`: scripts `pack`, `release`, `release:mac`, `release:linux`, `release:win` adicionados; `electron-builder ^25` em devDependencies.

## [Unreleased — 0.4.0-dev]

### Added

- monorepo pnpm com desktop, landing e pacotes compartilhados;
- shell Electron isolado, React, Vite, Tailwind, Monaco e Zustand;
- contratos iniciais de core, agents, providers e integrations, sem IA real;
- lint, formatação, typecheck, testes Vitest, smoke test Playwright e CI;
- documentação de arquitetura, roadmap, governança e ADRs iniciais.
- tela inicial com projetos recentes e ações guiadas;
- configurações com temas claro/escuro persistidos e modos simples/avançado;
- workspace responsivo com Monaco, explorador, abas, chat e preview demonstrativos;
- painéis redimensionáveis para ferramentas avançadas, terminal, tarefas, logs, Git e permissões;
- seletores locais de agente e modelo, atalhos e estados vazio, carregando e erro;
- componentes compartilhados em `packages/ui` e catálogo visual leve em `apps/ui-docs`;
- testes de interação para painéis, temas, modos, arquivos e abas.
- onboarding de primeira abertura com 12 etapas e resumo final;
- detecção segura de 19 ferramentas com versão e caminho;
- permissões separadas para leitura, escrita, comandos, instalação, credenciais e administração;
- adapters GitHub, Firebase, Vercel e Supabase com ações allowlisted;
- confirmação obrigatória antes de instalação, autenticação, configuração e deploy;
- cofre de credenciais baseado em Electron `safeStorage`, sem tokens em texto puro;
- 11 novos testes de adapters e onboarding usando comandos mockados.
- camada universal `AIProvider` com modelos, capacidades, streaming, cancelamento e consumo;
- adapters para OpenAI, Anthropic, Gemini, OpenRouter, Ollama, LM Studio e endpoints compatíveis;
- adapters isolados via `node-pty` para Claude Code, Codex, Gemini CLI, Aider e OpenCode;
- configuração persistente de modelo, alias, custo, tokens, timeout, concorrência e ativação;
- logs recursivamente sanitizados e chaves mantidas no cofre seguro do sistema;
- chat funcional com contexto explícito, streaming, cancelamento, reenvio, histórico e exportação;
- `FakeProvider` e testes de chat sem dependência de credenciais ou serviços reais;
- auditoria de segredos no histórico e hook obrigatório antes de cada push.
