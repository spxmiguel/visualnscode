// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditProposal, FileReviewSelection } from '../shared/edit-model';
import { EditReviewPanel } from './components/EditReviewPanel';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value?: string }) => (
    <textarea aria-label="Editor de revisão" value={value} readOnly />
  ),
  DiffEditor: () => <div>Diff Monaco</div>,
}));

const proposal: EditProposal = {
  id: 'edit-test',
  title: 'Ajustar exemplo',
  createdAt: '2026-07-19T20:00:00.000Z',
  status: 'pending',
  files: [
    {
      path: 'src/example.ts',
      kind: 'modify',
      original: 'alpha\nkeep\nomega',
      modified: 'ALPHA\nkeep\nOMEGA',
      unifiedDiff: '--- a/src/example.ts\n+++ b/src/example.ts\n-alpha\n+ALPHA',
      blocks: [
        {
          id: 'block-1',
          originalStart: 1,
          modifiedStart: 1,
          originalLines: ['alpha'],
          modifiedLines: ['ALPHA'],
        },
        {
          id: 'block-2',
          originalStart: 3,
          modifiedStart: 3,
          originalLines: ['omega'],
          modifiedLines: ['OMEGA'],
        },
      ],
    },
  ],
};

const apply = vi.fn(async (_id: string, _selections: readonly FileReviewSelection[]) => ({
  proposalId: proposal.id,
  checkpointId: 'cp-1-abcdef',
  appliedFiles: ['src/example.ts'],
  skippedFiles: [],
}));
const reject = vi.fn(async (_id: string) => ({ ...proposal, status: 'rejected' as const }));
const rollback = vi.fn(async (_id: string) => ({
  restored: ['src/example.ts'],
  redoCheckpointId: 'cp-2-abcdef',
}));

beforeEach(() => {
  apply.mockClear();
  reject.mockClear();
  rollback.mockClear();
  Object.defineProperty(window, 'visualnscode', {
    configurable: true,
    value: {
      edits: {
        list: vi.fn(async () => [proposal]),
        history: vi.fn(async () => [
          {
            id: 'cp-1-abcdef',
            workspacePath: '/workspace',
            createdAt: '2026-07-19T20:00:00.000Z',
            label: 'Ajustar exemplo',
            fileCount: 1,
          },
        ]),
        apply,
        reject,
        rollback,
      },
    },
  });
});

afterEach(() => cleanup());

describe('revisão visual de edições', () => {
  it('permite revisar em modo unificado e aplicar somente blocos escolhidos', async () => {
    const user = userEvent.setup();
    render(<EditReviewPanel />);

    await screen.findAllByText('src/example.ts');
    await user.click(screen.getByRole('button', { name: /Unificado/ }));
    expect(screen.queryByText(/--- a\/src\/example.ts/)).not.toBeNull();

    await user.click(
      screen.getByRole('checkbox', { name: 'Selecionar bloco 1 de src/example.ts' }),
    );
    await user.click(screen.getByRole('button', { name: 'Aceitar selecionados' }));

    await waitFor(() => expect(apply).toHaveBeenCalledTimes(1));
    expect(apply.mock.calls[0]?.[1]).toEqual([
      {
        path: 'src/example.ts',
        accepted: true,
        blockIds: ['block-2'],
      },
    ]);
  });

  it('rejeita tudo sem aplicar e confirma rollback pelo histórico', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<EditReviewPanel />);

    await screen.findAllByText('src/example.ts');
    await user.click(screen.getByRole('button', { name: 'Rejeitar tudo' }));
    await waitFor(() => expect(reject).toHaveBeenCalledWith('edit-test'));

    await user.click(screen.getByRole('button', { name: 'Desfazer para este ponto' }));
    await waitFor(() => expect(rollback).toHaveBeenCalledWith('cp-1-abcdef'));
  });
});
