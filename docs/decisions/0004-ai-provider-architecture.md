# ADR-0004: Arquitetar providers de IA por ports e adapters

- Estado: Aceito
- Data: 2026-07-11

## Contexto

Providers variam em autenticação, streaming, modelos, tool calling, limites e erros. Acoplar a UI
ou o domínio a um SDK tornaria a troca de fornecedor cara e espalharia condicionais pelo produto.

## Decisão

Definir uma porta canônica em `packages/providers`, baseada em capacidades e eventos normalizados.
Cada fornecedor será um adapter separado. O core consome a porta, nunca o SDK; a composição ocorre
no processo privilegiado. O registro inicial contém somente descritores e nenhuma chamada real.

## Consequências

- providers podem ser trocados, simulados e testados isoladamente;
- recursos exclusivos são anunciados por capabilities, sem fingir equivalência total;
- normalização adiciona trabalho e pode limitar temporariamente recursos específicos;
- secrets, rate limits, retries e telemetria ficam fora do renderer;
- um mock provider será obrigatório antes da primeira integração externa.
