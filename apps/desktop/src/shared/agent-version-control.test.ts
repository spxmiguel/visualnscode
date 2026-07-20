import { describe, expect, it } from 'vitest';
import type { WorkflowRunResult } from '@visualnscode/agents';
import { changedFilesFromAgentRun } from './agent-version-control';

const result = (files: readonly (readonly string[])[]): WorkflowRunResult =>
  ({
    agentRuns: files.map((filesChanged, index) => ({
      filesChanged,
      nodeId: `node-${index}`,
    })),
  }) as unknown as WorkflowRunResult;

describe('changedFilesFromAgentRun', () => {
  it('returns only files attributed to the agent task', () => {
    expect(
      changedFilesFromAgentRun(
        result([
          ['src/app.ts', 'src/styles.css'],
          ['src/app.ts', 'README.md'],
        ]),
      ),
    ).toEqual(['src/app.ts', 'src/styles.css', 'README.md']);
  });

  it('does not infer changes from unrelated workspace state', () => {
    expect(changedFilesFromAgentRun(result([[], []]))).toEqual([]);
  });
});
