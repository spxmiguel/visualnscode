# ADR-0007: Executar providers no processo principal com eventos normalizados

- Estado: Aceito
- Data: 2026-07-12

## Contexto

APIs HTTP, servidores locais e CLIs têm autenticação, protocolos de stream, cancelamento e riscos
diferentes. Expor SDKs, chaves ou PTYs ao renderer violaria isolamento e espalharia detalhes de
fornecedor pela interface.

## Decisão

Implementar `AIProvider` em `packages/providers` e compor adapters no processo principal. HTTP usa
SSE normalizado; CLIs usam adapters individuais sobre `node-pty`, com ambiente allowlisted. O
preload oferece somente operações nomeadas, e o renderer recebe `AgentChunk` serializável.

Configurações não sensíveis ficam no diretório de dados do aplicativo com modo `0600`. Segredos
permanecem no cofre definido no ADR-0006. Concorrência, timeout, tokens e custos conhecidos são
limitados no `ProviderService`.

## Consequências

- a UI não conhece formatos de eventos ou autenticação de fornecedores;
- cancelamento e testes falsos compartilham o mesmo contrato;
- módulos nativos exigem empacotamento específico por plataforma;
- capacidades anunciadas são conservadoras e preços não são congelados no código;
- protocolos específicos podem exigir adapters nativos futuros, como a Responses API da OpenAI.
