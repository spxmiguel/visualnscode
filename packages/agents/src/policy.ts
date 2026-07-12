import { posix } from 'node:path';
import type { ActionDecision, AgentAction, AgentDefinition, AgentTool } from './types';

const requiredTool: Readonly<Record<AgentAction['type'], AgentTool>> = {
  read: 'read-files',
  edit: 'edit-files',
  command: 'terminal',
  tool: 'search',
};

const isInsideAllowedFolder = (path: string, allowedFolders: readonly string[]): boolean => {
  if (path.startsWith('/') || path.includes('\0')) return false;
  const normalized = posix.normalize(path.replaceAll('\\', '/'));
  if (normalized === '..' || normalized.startsWith('../')) return false;
  return allowedFolders.some((folder) => {
    const root = posix.normalize(folder || '.').replace(/^\.\/$/, '.');
    return root === '.' || normalized === root || normalized.startsWith(`${root}/`);
  });
};

export const decideAgentAction = (agent: AgentDefinition, action: AgentAction): ActionDecision => {
  const tool = action.tool ?? requiredTool[action.type];
  if (!agent.allowedTools.includes(tool)) {
    return { allowed: false, requiresApproval: false, reason: `Ferramenta ${tool} não permitida.` };
  }
  if (action.path && !isInsideAllowedFolder(action.path, agent.allowedFolders)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Caminho fora das pastas permitidas.',
    };
  }
  if (action.type === 'edit' && agent.editPermission === 'none') {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Edição desativada para este agente.',
    };
  }
  if (action.type === 'command' && agent.terminalPermission === 'none') {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Terminal desativado para este agente.',
    };
  }
  if (action.risk === 'destructive') {
    return {
      allowed: true,
      requiresApproval: true,
      reason: 'Ações destrutivas sempre exigem aprovação.',
    };
  }
  if (agent.autonomy === 'ask') {
    return { allowed: true, requiresApproval: true, reason: 'Modo Ask exige aprovação por ação.' };
  }
  if (agent.autonomy === 'guided') {
    const important = action.risk !== 'safe' || action.type === 'edit' || action.type === 'command';
    return {
      allowed: true,
      requiresApproval: important,
      reason: important ? 'Modo Guided pede aprovação para esta ação.' : 'Ação segura permitida.',
    };
  }
  if (action.type === 'edit' && agent.editPermission === 'propose') {
    return {
      allowed: true,
      requiresApproval: true,
      reason: 'O agente pode apenas propor edições.',
    };
  }
  if (action.type === 'command' && agent.terminalPermission === 'safe' && action.risk !== 'safe') {
    return {
      allowed: true,
      requiresApproval: true,
      reason: 'Terminal limitado a comandos seguros.',
    };
  }
  return { allowed: true, requiresApproval: false, reason: 'Dentro das permissões autônomas.' };
};
