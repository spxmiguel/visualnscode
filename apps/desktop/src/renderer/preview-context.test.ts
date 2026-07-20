import { describe, expect, it } from 'vitest';
import { buildPreviewPrompt } from './preview-context';

describe('preview element context', () => {
  it('creates a review-oriented prompt with enough DOM context to locate the component', () => {
    const prompt = buildPreviewPrompt({
      selector: 'main > button.primary',
      tag: 'button',
      id: null,
      classes: ['primary'],
      text: 'Salvar',
      attributes: { 'aria-label': 'Salvar nota' },
      bounds: { x: 12, y: 24, width: 96, height: 32 },
      url: 'http://127.0.0.1:5173/notas',
    });

    expect(prompt).toContain('main > button.primary');
    expect(prompt).toContain('Salvar nota');
    expect(prompt).toContain('96×32');
    expect(prompt).toContain('Proponha a alteração em diff para revisão.');
  });
});
