# VisualnsCode

O **VisualnsCode** é uma IDE desktop orientada por IA, inspirada na familiaridade do VS Code,
mas projetada para reduzir a complexidade inicial. A proposta é reunir editor, agentes, CLIs,
providers de IA, automações e serviços de deploy em uma interface coerente e segura.

> Estado: providers universais e chat (`0.4.0-dev`). O desktop conecta APIs, servidores locais e
> CLIs por uma porta comum, transmite respostas no workspace e mantém chaves fora do renderer.
> Filesystem de projeto, terminal interativo e deploy efetivo continuam fora desta fase.

## Problema que resolve

Desenvolvimento assistido por IA costuma exigir várias abas, contas, CLIs e modelos mentais. Para
quem começa, isso cria atrito; para quem já desenvolve, fragmenta contexto e fluxos. O
VisualnsCode pretende oferecer um caminho guiado para iniciantes sem remover controles avançados
de desenvolvedores experientes.

## Público-alvo

- iniciantes que precisam de linguagem simples, padrões seguros e feedback contextual;
- vibe coders que querem transformar intenção em software com menos configuração;
- desenvolvedores experientes que precisam combinar providers, agentes, terminal e deploy;
- equipes que desejam políticas consistentes para ferramentas locais e credenciais.

## Funcionalidades planejadas

- edição de código com Monaco Editor e navegação de workspace;
- chat e agentes com providers de IA intercambiáveis;
- terminal integrado e execução de CLIs com política de confirmação por risco;
- contexto local, histórico e configurações persistidos em SQLite;
- atualizações em tempo real via WebSocket onde houver processos remotos;
- integrações de controle de versão, deploy e observabilidade;
- modo guiado para iniciantes e controles avançados progressivamente revelados;
- extensibilidade por adaptadores, sem acoplar o domínio aos SDKs dos fornecedores.

## Tecnologias

Electron, React, TypeScript, Vite, Tailwind CSS, Monaco Editor, Zustand, Node.js, `node-pty`, pnpm
workspaces, Vitest e Playwright. SQLite e WebSocket permanecem planejados para fases posteriores.

## Estrutura

```text
visualnscode/
├── apps/
│   ├── desktop/        # Electron: main, preload e renderer
│   └── landing/        # site React/Vite independente
├── packages/
│   ├── ui/             # componentes visuais compartilhados
│   ├── core/           # regras de domínio puras
│   ├── agents/         # contratos e orquestração futura
│   ├── providers/      # portas para providers de IA
│   ├── integrations/   # CLIs, deploy e source control futuros
│   ├── config/         # constantes e configuração compartilhada
│   └── types/          # contratos de dados estáveis
├── docs/               # arquitetura, plano e ADRs
├── scripts/            # automações do repositório
└── .github/workflows/  # integração contínua
```

## Pré-requisitos

- Node.js 20.18 ou superior (Node.js 22 LTS recomendado);
- pnpm 9 ou superior;
- Git.

## Instalação

```bash
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode
pnpm install
```

## Como rodar

```bash
# Electron + renderer em desenvolvimento
pnpm dev

# Somente a landing page
pnpm dev:landing

# Catálogo leve dos componentes de packages/ui
pnpm dev:ui

# Verificações locais
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Assistente de ambiente

Na primeira abertura, 12 etapas verificam Git, GitHub CLI, Node.js, gerenciadores, Firebase,
Vercel, Supabase, Docker, Python, providers locais e CLIs de agentes. Cada ferramenta mostra status,
versão, caminho, teste, instalação, documentação e opção de ignorar.

Detecções são somente leitura. Instalações, logins e mudanças exigem confirmação e a permissão
correspondente. O runner usa `execFile` com argumentos estruturados e nunca aceita shell ou strings
arbitrárias. Credenciais de providers são criptografadas com o cofre do sistema via Electron
`safeStorage`; se o backend seguro não estiver disponível, a aplicação recusa persistir a chave.

Consulte [`docs/onboarding.md`](./docs/onboarding.md) para o fluxo completo.

## Providers e chat

A porta `AIProvider` normaliza disponibilidade, modelos, mensagens, streaming e cancelamento. A
primeira versão inclui OpenAI, Anthropic, Gemini, OpenRouter, Ollama, LM Studio, endpoint compatível
com OpenAI, Claude Code, Codex, Gemini CLI, Aider e OpenCode. CLIs são executadas com `node-pty` e
ambiente filtrado; APIs e segredos permanecem no processo principal.

A tela **Configurações → Modelos e providers** oferece teste de conexão, modelo padrão, alias,
limites de custo e tokens, timeout, concorrência e ativação. O chat transmite respostas, permite
cancelar e reenviar, inclui abas abertas como contexto, mostra consumo, persiste o histórico e
exporta Markdown. Testes usam `FakeProvider`; nenhuma chave real é necessária.

Consulte [`docs/providers.md`](./docs/providers.md) para arquitetura, segurança e extensão.

## Como contribuir

Leia o [CONTRIBUTING.md](./CONTRIBUTING.md), crie uma branch curta, mantenha cada commit funcional
e use Conventional Commits. Mudanças arquiteturais relevantes devem incluir um ADR em
[`docs/decisions`](./docs/decisions).

## Roadmap resumido

1. fundação do monorepo, shell, qualidade e documentação — **concluída**;
2. interface do workspace, temas, modos e componentes — **concluída**;
3. onboarding, detecção e integrações de configuração — **concluída**;
4. camada universal de providers e chat com streaming — **concluída**;
5. workspace local real, arquivos, busca e preferências;
6. terminal seguro e persistência local;
7. agentes, integrações de deploy e colaboração;
8. empacotamento, atualização automática, acessibilidade e hardening.

Consulte [ROADMAP.md](./ROADMAP.md) e o [plano de desenvolvimento](./docs/development-plan.md) para
critérios de saída e dependências entre fases.

## Segurança e licença

O modelo inicial de segurança está em [SECURITY.md](./SECURITY.md) e no
[ADR-0005](./docs/decisions/0005-local-command-security.md). Distribuído sob a licença
[MIT](./LICENSE).
