# ADR-0002: Usar Monaco Editor

- Estado: Aceito
- Data: 2026-07-11

## Contexto

O produto precisa de edição familiar, acessível e extensível, com suporte sólido a TypeScript,
atalhos e recursos avançados. Construir um editor próprio desviaria esforço do diferencial de
orquestração e experiência guiada.

## Decisão

Usar Monaco Editor no renderer, encapsulado atrás de componentes próprios. Modelos, temas e
workers serão carregados sob demanda. Estado de domínio e documentos não dependerão de tipos do
Monaco.

## Consequências

- oferece base madura e familiar a usuários do VS Code;
- reduz o tempo para recursos essenciais de edição;
- adiciona peso ao bundle e demanda estratégia de lazy loading/workers;
- APIs específicas devem permanecer no adapter visual para permitir testes e evolução.
