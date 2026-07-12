# ADR-0006: Usar o cofre do sistema para credenciais

- Estado: Aceito
- Data: 2026-07-12

## Contexto

Providers e CLIs podem exigir tokens. localStorage, Zustand, SQLite sem criptografia e arquivos de
configuração do renderer não fornecem proteção adequada e podem aparecer em logs ou backups.

## Decisão

Usar `safeStorage` do Electron no processo main. O arquivo contém apenas ciphertext codificado em
base64, com permissão `0600`. O renderer recebe apenas `configured: boolean`; valores nunca são
devolvidos. IDs são allowlisted. Em Linux, o backend `basic_text` é recusado.

CLIs que gerenciam sua própria autenticação continuam responsáveis por seu credential store; o
VisualnsCode não copia nem lê esses tokens.

## Consequências

- segredos não entram no estado persistido da UI ou no IPC de leitura;
- salvar/remover exige permissão de credenciais e ação explícita;
- sistemas sem keychain/secret service precisam configurar um backend seguro antes de persistir;
- rotação, migração e expiração de secrets precisarão de UX futura;
- testes usam mocks e nunca credenciais reais.
