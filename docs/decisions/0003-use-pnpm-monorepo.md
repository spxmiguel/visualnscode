# ADR-0003: Usar monorepo com pnpm workspaces

- Estado: Aceito
- Data: 2026-07-11

## Contexto

Desktop, landing, UI e integrações evoluem em ritmos diferentes, mas compartilham contratos e
ferramentas. Repositórios separados aumentariam coordenação e poderiam produzir versões
incompatíveis logo no início.

## Decisão

Manter apps e pacotes em um único repositório gerenciado por pnpm workspaces. Configurações de
TypeScript, lint e formatação vivem na raiz; cada workspace mantém scripts e dependências próprios.

## Consequências

- mudanças atômicas podem atravessar contratos, apps e testes;
- instalação deduplicada e rápida;
- CI pode validar todo o grafo com um lockfile;
- fronteiras precisam ser fiscalizadas para evitar um “monólito distribuído”;
- releases independentes poderão exigir versionamento automatizado no futuro.
