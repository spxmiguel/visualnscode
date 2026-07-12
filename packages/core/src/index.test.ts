import { describe, expect, it } from 'vitest';
import { assessCommandRisk } from './index';

describe('assessCommandRisk', () => {
  it('permite leitura sem confirmação adicional', () => {
    expect(assessCommandRisk('read')).toEqual({ risk: 'read', requiresConfirmation: false });
  });

  it.each(['write', 'destructive', 'privileged'] as const)(
    'exige confirmação para risco %s',
    (risk) => {
      expect(assessCommandRisk(risk).requiresConfirmation).toBe(true);
    },
  );
});
