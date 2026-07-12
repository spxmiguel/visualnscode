import { describe, expect, it } from 'vitest';
import { FakeProvider, ProviderRegistry, sanitize } from './index';

describe('ProviderRegistry', () => {
  it('registra providers sem executar integrações reais', () => {
    const registry = new ProviderRegistry();
    const provider = new FakeProvider();
    registry.register(provider);

    expect(registry.list()).toEqual([provider]);
  });

  it('rejeita identificadores duplicados', () => {
    const registry = new ProviderRegistry();
    registry.register(new FakeProvider());

    expect(() => registry.register(new FakeProvider('Outra resposta'))).toThrow(
      'Provider duplicado: fake',
    );
  });
});

describe('FakeProvider', () => {
  it('produz streaming e uso estimado sem chaves reais', async () => {
    const provider = new FakeProvider('Olá mundo');
    const chunks = [];
    for await (const chunk of provider.streamMessage({
      requestId: 'request-1',
      model: 'fake-model',
      messages: [{ id: 'message-1', role: 'user', content: 'Teste' }],
    })) {
      chunks.push(chunk);
    }

    expect(chunks.filter((chunk) => chunk.type === 'text')).toHaveLength(2);
    expect(chunks.at(-1)?.type).toBe('done');
  });
});

describe('sanitize', () => {
  it('remove segredos por chave e por padrão', () => {
    const fakeSecret = ['sk', 'testvaluewithmorethan12chars'].join('-');
    expect(sanitize({ authorization: fakeSecret, nested: `Bearer ${fakeSecret}` })).toEqual({
      authorization: '[REDACTED]',
      nested: 'Bearer [REDACTED]',
    });
  });
});
