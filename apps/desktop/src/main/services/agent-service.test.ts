// @vitest-environment node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { builtInAgents, type AgentDefinition, type TeamWorkflow } from '@visualnscode/agents';
import type { AgentChunk, AgentInput } from '@visualnscode/providers';
import { AgentService } from './agent-service';
import type { AgentCommandRunner } from './agent-command-runner';
import { CheckpointService } from './checkpoint-service';
import { FileEditService } from './file-edit-service';
import { FilesystemService } from './filesystem-service';
import type { ProviderService } from './provider-service';

const architect = builtInAgents.find(({ id }) => id === 'architect')!;

const workflowFor = (agent: AgentDefinition): TeamWorkflow => ({
  id: `test-${agent.id}`,
  name: 'Test team',
  description: 'Single-agent integration workflow.',
  nodes: [{ id: 'node-1', agentId: agent.id, position: { x: 0, y: 0 } }],
  edges: [],
  maxCostUsd: 5,
  timeoutMs: 30_000,
  maxSteps: 10,
  retries: 0,
  rollbackOnFailure: true,
  builtIn: false,
});

class FakeProviderService {
  readonly inputs: AgentInput[] = [];
  readonly cancelled: string[] = [];
  output = 'Done.';
  outputs: Array<string | Error> = [];

  async stream(_providerId: string, input: AgentInput, onChunk: (chunk: AgentChunk) => void) {
    this.inputs.push(input);
    const next = this.outputs.shift() ?? this.output;
    if (next instanceof Error) throw next;
    onChunk({ type: 'text', requestId: input.requestId, text: next });
    onChunk({
      type: 'usage',
      requestId: input.requestId,
      usage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        estimated: true,
        estimatedCostUsd: 0.01,
      },
    });
  }

  async cancel(requestId: string) {
    this.cancelled.push(requestId);
  }
}

class FakeAgentCommandRunner implements AgentCommandRunner {
  readonly commands: string[] = [];

  async run(command: string) {
    this.commands.push(command);
    return { exitCode: 0, stdout: '53 tests passed', stderr: '' };
  }
}

describe('AgentService', () => {
  let dataDirectory: string;
  let workspace: string;
  let providers: FakeProviderService;
  let commands: FakeAgentCommandRunner;

  beforeEach(async () => {
    dataDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-agent-data-'));
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-agent-workspace-'));
    providers = new FakeProviderService();
    commands = new FakeAgentCommandRunner();
  });

  afterEach(async () => {
    await Promise.all([
      fs.rm(dataDirectory, { recursive: true, force: true }),
      fs.rm(workspace, { recursive: true, force: true }),
    ]);
  });

  const createService = (fileEdits?: Pick<FileEditService, 'propose'>) =>
    new AgentService(
      providers as unknown as ProviderService,
      fileEdits as FileEditService | undefined,
      {
        getWorkspace: () => workspace,
        readFile: async (relativePath: string) => `contents of ${relativePath}`,
      } as FilesystemService,
      undefined,
      undefined,
      undefined,
      { commandRunner: commands, dataDirectory },
    );

  it('pede aprovação, executa comando restrito e persiste o histórico', async () => {
    const runner = {
      ...architect,
      terminalPermission: 'safe' as const,
      allowedTools: ['terminal'] as const,
    };
    providers.output =
      'Execute checks.\n<visualnscode-actions>[{"type":"command","description":"Run tests","command":"pnpm test","risk":"safe"}]</visualnscode-actions>';
    const service = createService();
    const events: string[] = [];
    const result = await service.start(
      {
        runId: 'agent-run-command',
        workflow: workflowFor(runner),
        agents: [runner],
        task: 'Test the project',
        relevantContext: { 'src/App.tsx': 'export const App = true;' },
      },
      (event) => {
        events.push(event.type);
        if (event.type === 'action-requested') {
          expect(event.action.content).toBeUndefined();
          expect(service.approve(event.runId, event.action.id, true)).toBe(true);
        }
      },
    );

    expect(result.status).toBe('completed');
    expect(result.costUsd).toBe(0.01);
    expect(result.agentRuns[0]?.commands).toEqual(['pnpm test']);
    expect(commands.commands).toEqual(['pnpm test']);
    expect(events).toContain('action-requested');
    await expect(service.history()).resolves.toHaveLength(1);
  });

  it('transforma edições aprovadas em propostas, sem gravar silenciosamente', async () => {
    const proposals: unknown[] = [];
    const editor = {
      ...architect,
      allowedTools: ['edit-files'] as const,
      editPermission: 'propose' as const,
    };
    providers.output =
      'Proposed.\n<visualnscode-actions>[{"type":"edit","description":"Update app","path":"src/App.tsx","content":"export const App = false;","risk":"important"}]</visualnscode-actions>';
    const service = createService({
      propose: async (...args: unknown[]) => {
        proposals.push(args);
        return {} as never;
      },
    });
    const result = await service.start(
      {
        runId: 'agent-run-edit',
        workflow: workflowFor(editor),
        agents: [editor],
        task: 'Update the app',
        relevantContext: {},
      },
      (event) => {
        if (event.type === 'action-requested') service.approve(event.runId, event.action.id, true);
      },
    );

    expect(result.status).toBe('completed');
    expect(proposals).toHaveLength(1);
    expect(result.agentRuns[0]?.filesChanged).toEqual([]);
    expect(result.agentRuns[0]?.actions[0]?.status).toBe('executed');
  });

  it('isola a memória persistente por workspace', async () => {
    const remembered = {
      ...architect,
      memory: { enabled: true, scope: 'project' as const, maxEntries: 5 },
    };
    const service = createService();
    const run = (runId: string) =>
      service.start(
        {
          runId,
          workflow: workflowFor(remembered),
          agents: [remembered],
          task: 'Remember context',
          relevantContext: {},
        },
        () => undefined,
      );

    providers.output = 'Workspace one memory.';
    await run('agent-memory-one');
    providers.output = 'Second response.';
    await run('agent-memory-two');
    const sameWorkspacePayload = JSON.parse(
      providers.inputs.at(-1)!.messages.find(({ role }) => role === 'user')!.content,
    ) as { memory: string[] };
    expect(sameWorkspacePayload.memory).toContain('Workspace one memory.');

    const firstWorkspace = workspace;
    const secondWorkspace = await fs.mkdtemp(
      path.join(os.tmpdir(), 'visualnscode-agent-workspace-two-'),
    );
    workspace = secondWorkspace;
    await run('agent-memory-three');
    const otherWorkspacePayload = JSON.parse(
      providers.inputs.at(-1)!.messages.find(({ role }) => role === 'user')!.content,
    ) as { memory: string[] };
    expect(otherWorkspacePayload.memory).toEqual([]);
    workspace = firstWorkspace;
    await fs.rm(secondWorkspace, { recursive: true, force: true });
  });

  it('restaura arquivos de contexto quando um workflow falha depois de executar comandos', async () => {
    const workspaceFiles = new FilesystemService();
    workspaceFiles.setWorkspace(workspace);
    await fs.mkdir(path.join(workspace, 'src'), { recursive: true });
    await fs.writeFile(path.join(workspace, 'src', 'App.tsx'), 'original');
    const checkpointService = new CheckpointService(path.join(dataDirectory, 'checkpoints'));
    const fileEdits = new FileEditService(workspaceFiles, checkpointService);
    const commandRunner: AgentCommandRunner = {
      run: async () => {
        await fs.writeFile(path.join(workspace, 'src', 'App.tsx'), 'changed by command');
        return { exitCode: 0, stdout: 'changed', stderr: '' };
      },
    };
    const runner = {
      ...architect,
      terminalPermission: 'safe' as const,
      allowedTools: ['terminal'] as const,
    };
    const reviewer = builtInAgents.find(({ id }) => id === 'reviewer')!;
    providers.outputs = [
      'Run command.\n<visualnscode-actions>[{"type":"command","description":"Generate files","command":"pnpm generate","risk":"safe"}]</visualnscode-actions>',
      new Error('Provider unavailable'),
    ];
    const service = new AgentService(
      providers as unknown as ProviderService,
      fileEdits,
      workspaceFiles,
      checkpointService,
      undefined,
      undefined,
      { commandRunner, dataDirectory },
    );
    const rollbackFiles: string[][] = [];
    const result = await service.start(
      {
        runId: 'agent-run-rollback',
        workflow: {
          ...workflowFor(runner),
          nodes: [
            { id: 'node-1', agentId: runner.id, position: { x: 0, y: 0 } },
            { id: 'node-2', agentId: reviewer.id, position: { x: 200, y: 0 } },
          ],
          edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
        },
        agents: [runner, reviewer],
        task: 'Generate and review',
        relevantContext: { 'src/App.tsx': 'renderer copy is not trusted for rollback' },
      },
      (event) => {
        if (event.type === 'action-requested') service.approve(event.runId, event.action.id, true);
        if (event.type === 'rollback') rollbackFiles.push([...event.files]);
      },
    );

    expect(result.status).toBe('failed');
    expect(result.rolledBack).toBe(true);
    await expect(fs.readFile(path.join(workspace, 'src', 'App.tsx'), 'utf8')).resolves.toBe(
      'original',
    );
    expect(rollbackFiles).toEqual([['src/App.tsx']]);
  });
});
