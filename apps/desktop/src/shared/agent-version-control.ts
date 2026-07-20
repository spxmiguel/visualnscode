import type { WorkflowRunResult } from '@visualnscode/agents';

export const changedFilesFromAgentRun = (result: WorkflowRunResult): readonly string[] => [
  ...new Set(
    result.agentRuns.flatMap(({ filesChanged }) =>
      filesChanged.filter((filePath) => typeof filePath === 'string' && filePath.length > 0),
    ),
  ),
];
