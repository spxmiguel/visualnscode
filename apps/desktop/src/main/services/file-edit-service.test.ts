// @vitest-environment node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CheckpointService } from './checkpoint-service';
import { FileEditService } from './file-edit-service';
import { FilesystemService } from './filesystem-service';

describe('FileEditService', () => {
  let root: string;
  let checkpointRoot: string;
  let filesystem: FilesystemService;
  let service: FileEditService;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-edit-'));
    checkpointRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-checkpoint-'));
    await fs.writeFile(path.join(root, 'example.txt'), 'alpha\nkeep\nomega');
    filesystem = new FilesystemService();
    filesystem.setWorkspace(root);
    service = new FileEditService(filesystem, new CheckpointService(checkpointRoot));
  });

  afterEach(async () => {
    await Promise.all([
      fs.rm(root, { recursive: true, force: true }),
      fs.rm(checkpointRoot, { recursive: true, force: true }),
    ]);
  });

  it('não grava nada enquanto a proposta aguarda revisão', async () => {
    const proposal = await service.propose('Atualizar exemplo', [
      { path: 'example.txt', proposedContent: 'ALPHA\nkeep\nOMEGA' },
    ]);
    expect(proposal.status).toBe('pending');
    expect(proposal.files[0]?.blocks).toHaveLength(2);
    await expect(fs.readFile(path.join(root, 'example.txt'), 'utf8')).resolves.toBe(
      'alpha\nkeep\nomega',
    );
  });

  it('aplica blocos escolhidos, cria checkpoint e permite rollback', async () => {
    const proposal = await service.propose('Atualizar exemplo', [
      { path: 'example.txt', proposedContent: 'ALPHA\nkeep\nOMEGA' },
    ]);
    const secondBlock = proposal.files[0]!.blocks[1]!;
    const result = await service.apply(proposal.id, [
      { path: 'example.txt', accepted: true, blockIds: [secondBlock.id] },
    ]);
    expect(result.checkpointId).toMatch(/^cp-/);
    await expect(fs.readFile(path.join(root, 'example.txt'), 'utf8')).resolves.toBe(
      'alpha\nkeep\nOMEGA',
    );
    expect(await service.history()).toHaveLength(1);

    const rolledBack = await service.rollback(result.checkpointId);
    expect(rolledBack.redoCheckpointId).toMatch(/^cp-/);
    await expect(fs.readFile(path.join(root, 'example.txt'), 'utf8')).resolves.toBe(
      'alpha\nkeep\nomega',
    );
  });

  it('remove arquivo novo durante rollback', async () => {
    const proposal = await service.propose('Criar arquivo', [
      { path: 'created.txt', proposedContent: 'new content' },
    ]);
    const result = await service.apply(proposal.id, [{ path: 'created.txt', accepted: true }]);
    await expect(fs.readFile(path.join(root, 'created.txt'), 'utf8')).resolves.toBe('new content');
    await service.rollback(result.checkpointId);
    await expect(fs.access(path.join(root, 'created.txt'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('rejeita proposta sem tocar no arquivo', async () => {
    const proposal = await service.propose('Não aplicar', [
      { path: 'example.txt', proposedContent: 'changed' },
    ]);
    expect(service.reject(proposal.id).status).toBe('rejected');
    await expect(fs.readFile(path.join(root, 'example.txt'), 'utf8')).resolves.toContain('alpha');
    await expect(
      service.apply(proposal.id, [{ path: 'example.txt', accepted: true }]),
    ).rejects.toThrow(/finalizada/i);
  });

  it('bloqueia arquivos sensíveis, segredos e exclusão em massa', async () => {
    const fakeGithubToken = ['ghp', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('_');
    await expect(
      service.propose('Editar segredo', [{ path: '.env', proposedContent: 'TOKEN=x' }]),
    ).rejects.toThrow(/sensível/i);
    await expect(
      service.propose('Inserir segredo', [
        { path: 'example.txt', proposedContent: `token=${fakeGithubToken}` },
      ]),
    ).rejects.toThrow(/segredo/i);
    await expect(
      service.propose(
        'Excluir tudo',
        ['a', 'b', 'c', 'd'].map((name) => ({ path: `${name}.txt`, proposedContent: null })),
      ),
    ).rejects.toThrow(/massa/i);
  });
});
