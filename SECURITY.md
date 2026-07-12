# Política de segurança

## Versões suportadas

O projeto está em fase pré-release. Somente a versão presente na branch `main` recebe correções de
segurança até o primeiro release estável.

## Relato de vulnerabilidade

Não publique detalhes em issues, discussões ou pull requests. Quando o repositório remoto estiver
disponível, use o recurso privado **Report a vulnerability** na aba Security. Se esse canal ainda
não existir, contate os mantenedores por um canal privado antes de compartilhar provas de conceito.

Inclua, quando possível:

- componente e versão/commit afetado;
- impacto e pré-condições;
- passos mínimos para reproduzir;
- mitigação conhecida, sem dados reais de terceiros.

O projeto confirmará o recebimento, fará triagem e coordenará correção e divulgação. Prazos serão
publicados quando houver equipe de segurança e canal oficial.

## Princípios do desktop

- `nodeIntegration` permanece desativado e o renderer permanece sandboxed;
- o preload expõe capacidades mínimas, nunca primitivas genéricas de sistema;
- toda entrada IPC é tratada como não confiável e validada em runtime;
- segredos não são persistidos em Zustand, logs, SQLite em claro ou local storage;
- links externos aceitos usam protocolos explícitos e abrem fora da aplicação;
- comandos e agentes seguem a política do ADR-0005 e o princípio do menor privilégio;
- dependências Electron e Chromium recebem atualização prioritária.

Não há integração real com IA ou execução de comandos nesta versão.
