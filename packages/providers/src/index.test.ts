import { describe, expect, it } from 'vitest';
import { ProviderRegistry } from './index';

describe('ProviderRegistry', () => {
  it('registra descritores sem executar integrações reais', () => {
    const registry = new ProviderRegistry();
    registry.register({ id: 'example', name: 'Exemplo', capabilities: ['chat'] });

    expect(registry.list()).toEqual([{ id: 'example', name: 'Exemplo', capabilities: ['chat'] }]);
  });

  it('rejeita identificadores duplicados', () => {
    const registry = new ProviderRegistry();
    registry.register({ id: 'example', name: 'Exemplo', capabilities: [] });

    expect(() => registry.register({ id: 'example', name: 'Outro', capabilities: [] })).toThrow(
      'Provider duplicado: example',
    );
  });
});
