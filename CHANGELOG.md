# Changelog

Todas as mudanças relevantes serão registradas neste arquivo. O formato segue
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto pretende usar
[Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

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
