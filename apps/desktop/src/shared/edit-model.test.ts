// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { applySelectedBlocks, createEditBlocks, createUnifiedDiff } from './edit-model';

describe('edit model', () => {
  const original = ['alpha', 'keep one', 'bravo', 'keep two', 'charlie'].join('\n');
  const modified = ['ALPHA', 'keep one', 'bravo', 'keep two', 'CHARLIE'].join('\n');

  it('separa alterações distantes em blocos selecionáveis', () => {
    const blocks = createEditBlocks(original, modified);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      originalStart: 1,
      originalLines: ['alpha'],
      modifiedLines: ['ALPHA'],
    });
    expect(blocks[1]).toMatchObject({
      originalStart: 5,
      originalLines: ['charlie'],
      modifiedLines: ['CHARLIE'],
    });
  });

  it('aplica somente os blocos escolhidos', () => {
    const blocks = createEditBlocks(original, modified);
    const result = applySelectedBlocks(original, blocks, new Set([blocks[1]!.id]));
    expect(result).toBe(['alpha', 'keep one', 'bravo', 'keep two', 'CHARLIE'].join('\n'));
  });

  it('gera diff unificado com cabeçalhos e hunks', () => {
    const diff = createUnifiedDiff('src/example.ts', original, modified);
    expect(diff).toContain('--- a/src/example.ts');
    expect(diff).toContain('+++ b/src/example.ts');
    expect(diff).toContain('-alpha');
    expect(diff).toContain('+CHARLIE');
  });
});
