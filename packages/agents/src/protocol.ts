import type { AgentAction, AgentTool } from './types';

const marker = /<visualnscode-actions>([\s\S]*?)<\/visualnscode-actions>/;
const actionTypes = new Set(['read', 'edit', 'command', 'tool']);
const riskTypes = new Set(['safe', 'important', 'destructive']);

export interface ParsedAgentOutput {
  readonly output: string;
  readonly actions: readonly AgentAction[];
}

export const parseAgentOutput = (value: string): ParsedAgentOutput => {
  const match = marker.exec(value);
  if (!match) return { output: value.trim(), actions: [] };
  let raw: unknown;
  try {
    raw = JSON.parse(match[1] ?? '[]');
  } catch {
    return { output: value.replace(marker, '').trim(), actions: [] };
  }
  if (!Array.isArray(raw)) return { output: value.replace(marker, '').trim(), actions: [] };
  const actions = raw.slice(0, 20).flatMap((entry, index): AgentAction[] => {
    if (!entry || typeof entry !== 'object') return [];
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.type !== 'string' ||
      !actionTypes.has(candidate.type) ||
      typeof candidate.description !== 'string' ||
      typeof candidate.risk !== 'string' ||
      !riskTypes.has(candidate.risk)
    ) {
      return [];
    }
    return [
      {
        id:
          typeof candidate.id === 'string' && candidate.id.length <= 100
            ? candidate.id
            : `action-${index + 1}`,
        type: candidate.type as AgentAction['type'],
        description: candidate.description.slice(0, 500),
        risk: candidate.risk as AgentAction['risk'],
        ...(typeof candidate.path === 'string' ? { path: candidate.path.slice(0, 1000) } : {}),
        ...(typeof candidate.command === 'string'
          ? { command: candidate.command.slice(0, 2000) }
          : {}),
        ...(typeof candidate.tool === 'string' ? { tool: candidate.tool as AgentTool } : {}),
      },
    ];
  });
  return { output: value.replace(marker, '').trim(), actions };
};
