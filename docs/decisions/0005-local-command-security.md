# ADR-0005: Controlar comandos locais por capacidade e risco

- Estado: Aceito
- Data: 2026-07-11

## Contexto

Terminal, agentes e CLIs podem ler dados sensíveis, alterar projetos ou executar ações destrutivas.
Um canal IPC genérico ou confirmação baseada apenas em strings não fornece limites confiáveis.

## Decisão

Não expor `exec`, shell ou `node-pty` ao renderer. Pedidos serão operações tipadas com diretório,
argumentos, origem e efeito esperado. Uma policy classifica efeitos como leitura, escrita,
destrutivo ou privilegiado. Escritas e níveis superiores exigem preview e confirmação; privilégios
e acesso fora do workspace exigem consentimento específico. Execução ocorrerá em processo
utilitário, com ambiente filtrado, cancelamento, limites e log local redigido.

## Consequências

- reduz execução acidental e injeção por conteúdo não confiável;
- permite políticas diferentes para modo guiado e avançado sem remover proteções essenciais;
- adiciona atrito intencional a efeitos relevantes;
- comandos compostos e shells variam por plataforma e exigem parsing/testes específicos;
- allowlists não substituem confirmação, sandbox do sistema ou revisão de diff;
- nenhuma execução local será implementada antes do threat model da Fase 2.
