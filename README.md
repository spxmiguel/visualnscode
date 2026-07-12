# VisualnsCode

O **VisualnsCode** é uma IDE desktop orientada por IA, inspirada na familiaridade do VS Code,
mas projetada para reduzir a complexidade inicial. A proposta é reunir editor, agentes, CLIs,
providers de IA, automações e serviços de deploy em uma interface coerente e segura.

> Estado: interface inicial (`0.2.0-dev`). O desktop oferece tela inicial, configurações e um
> workspace demonstrativo completo. Ainda não há integração real com IA, filesystem, terminal,
> persistência de projeto ou deploy.

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

Electron, React, TypeScript, Vite, Tailwind CSS, Monaco Editor, Zustand, Node.js, pnpm workspaces,
Vitest e Playwright. `node-pty`, SQLite e WebSocket estão planejados para fases posteriores e não
foram adicionados prematuramente.

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
git clone <url-do-repositorio>
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

## Como contribuir

Leia o [CONTRIBUTING.md](./CONTRIBUTING.md), crie uma branch curta, mantenha cada commit funcional
e use Conventional Commits. Mudanças arquiteturais relevantes devem incluir um ADR em
[`docs/decisions`](./docs/decisions).

## Roadmap resumido

1. fundação do monorepo, shell, qualidade e documentação — **concluída**;
2. interface do workspace, temas, modos e componentes — **concluída**;
3. workspace local real, arquivos, busca e preferências;
4. terminal seguro e persistência local;
5. primeira integração de IA através da camada de providers;
6. agentes, integrações de deploy e colaboração;
7. empacotamento, atualização automática, acessibilidade e hardening.

Consulte [ROADMAP.md](./ROADMAP.md) e o [plano de desenvolvimento](./docs/development-plan.md) para
critérios de saída e dependências entre fases.

## Segurança e licença

O modelo inicial de segurança está em [SECURITY.md](./SECURITY.md) e no
[ADR-0005](./docs/decisions/0005-local-command-security.md). Distribuído sob a licença
[MIT](./LICENSE).
