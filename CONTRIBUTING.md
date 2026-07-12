# Contribuindo com o VisualnsCode

Obrigado por contribuir. Mudanças devem preservar a experiência simples, a segurança por padrão e
os limites arquiteturais do projeto.

## Preparação

1. Instale Node.js 22 e pnpm 9.
2. Execute `pnpm install`.
3. Crie uma branch curta a partir de `main`.
4. Antes de alterar arquitetura, leia `docs/architecture.md` e os ADRs.

## Fluxo de desenvolvimento

- mantenha cada alteração pequena e focada;
- escreva ou atualize testes junto com o comportamento;
- não inclua credenciais, dados pessoais, artefatos de build ou dependências geradas;
- mudanças duradouras de arquitetura precisam de um ADR;
- uma PR deve explicar contexto, abordagem, riscos e como foi validada.

Antes de abrir uma PR:

```bash
pnpm format:check
pnpm check:structure
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(editor): add workspace tab model
fix(preload): validate workspace path payload
docs(adr): record terminal isolation strategy
test(providers): cover capability negotiation
```

Tipos comuns: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci` e `chore`. Evite
mensagens genéricas como `update`, `fix` ou `changes`. O repositório deve continuar funcional após
cada commit.

## Segurança

Não abra issue pública para vulnerabilidades. Siga [SECURITY.md](./SECURITY.md). Qualquer nova
ponte de IPC, comando, acesso a arquivo, segredo ou integração externa precisa de validação de
entrada e revisão explícita de privilégio.
