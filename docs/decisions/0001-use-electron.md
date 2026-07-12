# ADR-0001: Usar Electron na aplicação desktop

- Estado: Aceito
- Data: 2026-07-11

## Contexto

A aplicação precisa combinar uma UI web produtiva com filesystem, terminal, processos locais e
distribuição para macOS, Windows e Linux. A equipe quer compartilhar TypeScript entre UI e backend
local e aproveitar o ecossistema do Monaco Editor.

## Decisão

Usar Electron com processos `main`, `preload` e `renderer` separados. O renderer terá
`nodeIntegration: false`, `contextIsolation: true` e sandbox ativa. Capacidades locais serão
expostas por uma API de preload mínima e IPC validado.

## Consequências

- acelera desenvolvimento multiplataforma e integração com tecnologias web;
- permite compartilhar contratos TypeScript;
- aumenta tamanho do binário e consumo de memória;
- exige hardening contínuo, atualizações frequentes e disciplina rigorosa nas fronteiras IPC;
- trabalho bloqueante deve sair do processo main.
