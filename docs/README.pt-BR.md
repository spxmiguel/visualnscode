<div align="center">

```
  ██╗   ██╗███╗   ██╗███████╗ ██████╗ ██████╗ ██████╗ ███████╗
  ██║   ██║████╗  ██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ██║   ██║██╔██╗ ██║███████╗██║     ██║   ██║██║  ██║█████╗  
  ╚██╗ ██╔╝██║╚██╗██║╚════██║██║     ██║   ██║██║  ██║██╔══╝  
   ╚████╔╝ ██║ ╚████║███████║╚██████╗╚██████╔╝██████╔╝███████╗
    ╚═══╝  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
```

**Desenvolva com qualquer IA. Gerencie tudo em um só lugar.**

</div>

---

VisualnsCode é uma IDE desktop open-source que reúne Claude, GPT, Gemini, Ollama e suas ferramentas preferidas em um único workspace focado. Modo simples para iniciantes. Poder total para profissionais.

## Instalar

**macOS e Linux — uma linha:**

```bash
curl -fsSL https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.sh | bash
```

**Windows — PowerShell ou cmd:**

```powershell
irm https://raw.githubusercontent.com/spxmiguel/visualnscode/main/scripts/install.ps1 | iex
```

Após a instalação, digite **`spxcode`** em qualquer terminal para abrir o app.

> Baixe os instaladores manualmente em [Releases](https://github.com/spxmiguel/visualnscode/releases):
> `.pkg` (macOS), `.AppImage` / `.deb` (Linux), `.msi` (Windows).

---

## O que ele faz

| | |
|---|---|
| 🤖 **IA multi-provider** | Alterne entre Claude, GPT-4o, Gemini, Ollama, OpenRouter e qualquer endpoint compatível com OpenAI. |
| 🛠 **Equipes de agentes** | Monte workflows com agentes especializados — Architect, Frontend Dev, Revisor, Tester. |
| 🎛 **Dois modos** | Modo simples mostra só o essencial. Modo avançado exibe terminal, Git, diffs, logs e controles de agentes. |
| 🔒 **Seguro por padrão** | A IA nunca edita arquivos silenciosamente. Cada mudança passa por diff → aprovar → checkpoint → salvar. |
| 🚀 **Deploy integrado** | Vercel, Firebase, Supabase, GitHub Pages — do build à URL de produção com confirmação explícita. |
| 🛠 **Onboarding automático** | Detecta Git, Node, pnpm, CLIs e providers de IA já instalados. Guia a configuração em linguagem simples. |

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Shell desktop | Electron 43, contextIsolation, sandbox |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Editor | Monaco Editor |
| Estado | Zustand |
| Monorepo | pnpm workspaces |
| Empacotamento | electron-builder (.pkg, .AppImage, .deb, .msi) |
| Testes | Vitest, Playwright |
| CI | GitHub Actions |

## Desenvolvimento

**Requisitos:** Node.js ≥ 20.18, pnpm ≥ 9, Git.

```bash
git clone https://github.com/spxmiguel/visualnscode.git
cd visualnscode
pnpm install
pnpm dev
pnpm lint && pnpm typecheck && pnpm test
```

## Contribuindo

Toda contribuição é bem-vinda — reports de bugs, pedidos de funcionalidades, docs e código.

1. Leia [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Abra uma issue ou escolha uma do [issue tracker](https://github.com/spxmiguel/visualnscode/issues)
3. Fork → branch → commit (Conventional Commits) → PR

## Segurança

Credenciais ficam no keychain do OS via Electron `safeStorage`. A IA nunca envia segredos para providers remotos. Veja [SECURITY.md](../SECURITY.md).

## Licença

[MIT](../LICENSE) — desenvolvido por [@spxmiguel](https://github.com/spxmiguel)
