import { randomUUID } from 'node:crypto';
import {
  applySelectedBlocks,
  createEditBlocks,
  createUnifiedDiff,
  type ApplyProposalResult,
  type EditProposal,
  type FileReviewSelection,
  type ProposedFileInput,
  type ReviewFileChange,
} from '../../shared/edit-model';
import type { CheckpointFile, CheckpointService } from './checkpoint-service';
import type { FilesystemService } from './filesystem-service';
import { isSensitiveFile, scanForSecrets } from './secret-scanner';

const MAX_PROPOSAL_FILES = 25;
const MAX_DELETED_FILES = 3;
const MAX_PROPOSED_BYTES = 5_000_000;

export class FileEditService {
  private readonly proposals = new Map<string, EditProposal>();

  constructor(
    private readonly filesystem: FilesystemService,
    private readonly checkpoints: CheckpointService,
  ) {}

  async propose(title: string, inputs: readonly ProposedFileInput[]): Promise<EditProposal> {
    if (!title.trim() || title.length > 200) throw new Error('Título da proposta inválido.');
    if (inputs.length === 0 || inputs.length > MAX_PROPOSAL_FILES) {
      throw new Error(`Uma proposta deve conter entre 1 e ${MAX_PROPOSAL_FILES} arquivos.`);
    }
    const uniquePaths = new Set(inputs.map((input) => input.path));
    if (uniquePaths.size !== inputs.length)
      throw new Error('A proposta contém caminhos duplicados.');
    const deletions = inputs.filter(({ proposedContent }) => proposedContent === null).length;
    if (deletions > MAX_DELETED_FILES) {
      throw new Error(
        `Exclusão em massa bloqueada: máximo de ${MAX_DELETED_FILES} arquivos por proposta.`,
      );
    }

    const files: ReviewFileChange[] = [];
    for (const input of inputs) {
      if (isSensitiveFile(input.path)) {
        throw new Error(`Arquivo sensível protegido: ${input.path}`);
      }
      if ((input.proposedContent?.length ?? 0) > MAX_PROPOSED_BYTES) {
        throw new Error(`Alteração muito grande: ${input.path}`);
      }
      if (input.proposedContent !== null) {
        const findings = scanForSecrets(input.path, input.proposedContent);
        if (findings.length > 0) {
          throw new Error(`A proposta para ${input.path} contém possível segredo.`);
        }
      }

      const exists = await this.filesystem.exists(input.path);
      if (!exists && input.proposedContent === null) {
        throw new Error(`Não é possível excluir um arquivo inexistente: ${input.path}`);
      }
      const original = exists ? await this.filesystem.readFile(input.path) : '';
      const modified = input.proposedContent ?? '';
      if (exists && input.proposedContent !== null && original === modified) continue;
      const blocks = createEditBlocks(original, modified);
      files.push({
        path: input.path,
        kind: input.proposedContent === null ? 'delete' : exists ? 'modify' : 'create',
        original,
        modified,
        blocks,
        unifiedDiff: createUnifiedDiff(input.path, original, modified, blocks),
      });
    }
    if (files.length === 0) throw new Error('A proposta não contém alterações reais.');

    const proposal: EditProposal = {
      id: `edit-${randomUUID()}`,
      title: title.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      files,
    };
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  get(id: string): EditProposal | null {
    return this.proposals.get(id) ?? null;
  }

  list(): readonly EditProposal[] {
    return [...this.proposals.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  reject(id: string): EditProposal {
    const proposal = this.requirePending(id);
    const rejected = { ...proposal, status: 'rejected' as const };
    this.proposals.set(id, rejected);
    return rejected;
  }

  async apply(
    id: string,
    selections: readonly FileReviewSelection[],
  ): Promise<ApplyProposalResult> {
    const proposal = this.requirePending(id);
    const workspace = this.filesystem.getWorkspace();
    if (!workspace) throw new Error('Nenhum workspace aberto.');
    const selectionByPath = new Map(selections.map((selection) => [selection.path, selection]));
    const snapshots: CheckpointFile[] = [];
    const changes: Array<{ path: string; kind: ReviewFileChange['kind']; content: string }> = [];
    const skippedFiles: string[] = [];

    for (const file of proposal.files) {
      const selection = selectionByPath.get(file.path);
      if (!selection?.accepted) {
        skippedFiles.push(file.path);
        continue;
      }
      const selectedIds = new Set(
        selection.blockIds ?? file.blocks.map(({ id: blockId }) => blockId),
      );
      const content =
        selection.editedContent !== undefined
          ? selection.editedContent
          : applySelectedBlocks(file.original, file.blocks, selectedIds);
      if (typeof content !== 'string' || content.length > MAX_PROPOSED_BYTES) {
        throw new Error(`Versão revisada inválida ou muito grande: ${file.path}`);
      }
      if (content === file.original) {
        skippedFiles.push(file.path);
        continue;
      }
      if (scanForSecrets(file.path, content).length > 0) {
        throw new Error(`A versão revisada de ${file.path} contém possível segredo.`);
      }
      snapshots.push({
        relativePath: file.path,
        content: file.original,
        existed: file.kind !== 'create',
      });
      changes.push({ path: file.path, kind: file.kind, content });
    }
    if (changes.length === 0) throw new Error('Nenhum bloco foi aceito para aplicação.');

    const checkpointId = await this.checkpoints.create(workspace, snapshots, proposal.title);
    const appliedFiles: string[] = [];
    try {
      for (const change of changes) {
        if (change.kind === 'delete' && change.content === '') {
          await this.filesystem.deleteEntry(change.path, true);
        } else {
          await this.filesystem.writeFile(change.path, change.content);
        }
        appliedFiles.push(change.path);
      }
    } catch (error) {
      await this.restoreCheckpoint(checkpointId);
      throw error;
    }

    this.proposals.set(id, { ...proposal, status: 'applied' });
    return { proposalId: id, checkpointId, appliedFiles, skippedFiles };
  }

  async history() {
    const workspace = this.filesystem.getWorkspace();
    return workspace ? this.checkpoints.list(workspace) : [];
  }

  async rollback(
    checkpointId: string,
  ): Promise<{ restored: readonly string[]; redoCheckpointId: string }> {
    const workspace = this.filesystem.getWorkspace();
    if (!workspace) throw new Error('Nenhum workspace aberto.');
    const checkpoint = await this.checkpoints.restore(checkpointId, workspace);
    const current: CheckpointFile[] = [];
    for (const file of checkpoint.files) {
      const exists = await this.filesystem.exists(file.relativePath);
      current.push({
        relativePath: file.relativePath,
        content: exists ? await this.filesystem.readFileForCheckpoint(file.relativePath) : '',
        existed: exists,
      });
    }
    const redoCheckpointId = await this.checkpoints.create(
      workspace,
      current,
      `Antes de desfazer: ${checkpoint.label}`,
    );
    await this.restoreCheckpoint(checkpointId);
    return { restored: checkpoint.files.map(({ relativePath }) => relativePath), redoCheckpointId };
  }

  private async restoreCheckpoint(checkpointId: string): Promise<void> {
    const workspace = this.filesystem.getWorkspace();
    if (!workspace) throw new Error('Nenhum workspace aberto.');
    const checkpoint = await this.checkpoints.restore(checkpointId, workspace);
    for (const file of checkpoint.files) {
      if (file.existed === false) {
        if (await this.filesystem.exists(file.relativePath)) {
          await this.filesystem.removeCreatedFile(file.relativePath);
        }
      } else {
        await this.filesystem.writeFile(file.relativePath, file.content);
      }
    }
  }

  private requirePending(id: string): EditProposal {
    const proposal = this.proposals.get(id);
    if (!proposal) throw new Error('Proposta de edição não encontrada.');
    if (proposal.status !== 'pending') throw new Error('A proposta já foi finalizada.');
    return proposal;
  }
}
