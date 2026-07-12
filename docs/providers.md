# Providers de IA

## Visão geral

`packages/providers` define uma porta comum para APIs remotas, servidores locais e CLIs. O pacote
não conhece React nem o cofre concreto. A composição ocorre em `ProviderService`, dentro do processo
principal do Electron.

```text
ChatPanel → preload → IPC validado → ProviderService → AIProvider
                                                   ↳ HTTP/SSE
                                                   ↳ node-pty
```

O runtime inicial segue as referências oficiais de streaming da
[OpenAI](https://platform.openai.com/docs/quickstart),
[Anthropic](https://docs.anthropic.com/en/api/messages-streaming) e
[Gemini](https://ai.google.dev/api/generate-content). Os argumentos do Codex devem acompanhar a
[referência oficial da CLI](https://developers.openai.com/codex/cli/reference/).

## Contrato canônico

Um adapter implementa `AIProvider`: identidade, tipo, execução, capacidades, disponibilidade,
modelos, envio integral, streaming e cancelamento. `AIModel` informa visão, ferramentas, edição de
arquivos, contexto longo, localidade e custo. Quando o provider não retorna preço confiável, o custo
fica `null` com uma nota explícita; a UI nunca inventa valores.

Eventos possíveis:

- `text`: incremento de conteúdo;
- `usage`: tokens e custo, real ou estimado;
- `done`: conclusão normal;
- `error`: erro sanitizado e apropriado para a interface.

## Providers incluídos

| Família | Adapters                                                              |
| ------- | --------------------------------------------------------------------- |
| API     | OpenAI, Anthropic, Gemini, OpenRouter, endpoint compatível com OpenAI |
| Local   | Ollama, LM Studio                                                     |
| CLI     | Claude Code, Codex, Gemini CLI, Aider, OpenCode                       |

O adapter compatível com OpenAI usa `/models` e `/chat/completions`. OpenAI pode ganhar um adapter
nativo de Responses API sem alterar o contrato da UI. Gemini usa `streamGenerateContent`; Anthropic
usa Messages streaming. CLIs são classes separadas e nunca executam por uma string de shell.

## Segurança

- chamadas externas e PTYs existem somente no processo principal;
- segredos são recuperados do `safeStorage` no instante de criar o adapter;
- o renderer recebe apenas `configured: boolean`, nunca o valor da chave;
- logs passam por sanitização recursiva de nomes e padrões sensíveis;
- payloads IPC limitam mensagens, arquivos, bytes, modelos e identificadores;
- CLIs recebem apenas `HOME`, `PATH`, locale, terminal, temporários e usuário;
- Codex executa com sandbox `read-only`; Aider inicia em `--dry-run`;
- timeout, tokens e concorrência são aplicados pelo serviço;
- custo só é bloqueado quando o adapter fornece um valor calculável.

## Adicionando um provider

1. Adicione o descritor em `catalog.ts`, com capacidades conservadoras e endpoint padrão.
2. Implemente uma classe por protocolo usando `BaseProvider`.
3. Normalize todo retorno para `AgentChunk`; implemente cancelamento real.
4. Registre a classe em `factory.ts`. Não coloque condicionais do fornecedor no renderer.
5. Nunca registre headers, corpo cru autenticado, chave, token ou ambiente completo.
6. Adicione testes com fetch mockado ou `FakeProvider`; não use rede ou credenciais reais.
7. Atualize este documento e crie ADR se a fronteira de segurança ou o contrato mudar.

Para uma CLI, estenda `CliProvider`, mantenha argumentos estruturados, preserve o ambiente filtrado
e use um modo somente leitura ou dry-run quando existir. Para HTTP, valide a URL e traduza erros para
linguagem simples sem ecoar dados sensíveis.

## Chat e persistência

O chat inclui somente as abas abertas como contexto explícito. O histórico serializável fica no
armazenamento local do renderer e pode ser limpo ou exportado como Markdown. Solicitações ativas não
são retomadas após reiniciar: ao hidratar, streams incompletos tornam-se cancelados.

Configurações de provider ficam em `provider-settings.json` no diretório do aplicativo. Tokens e
chaves nunca entram nesse arquivo, no histórico do chat ou nos logs.
