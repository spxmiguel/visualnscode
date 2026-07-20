// @vitest-environment node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FilesystemService } from './filesystem-service';

describe('FilesystemService', () => {
  let root: string;
  let outside: string;
  let service: FilesystemService;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-workspace-'));
    outside = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-outside-'));
    service = new FilesystemService();
    service.setWorkspace(root);
  });

  afterEach(async () => {
    await Promise.all([
      fs.rm(root, { recursive: true, force: true }),
      fs.rm(outside, { recursive: true, force: true }),
    ]);
  });

  it('bloqueia path traversal em leitura, escrita e rename', async () => {
    await expect(service.readFile('../secret.txt')).rejects.toThrow(/traversal|inválido/i);
    await expect(service.writeFile('../secret.txt', 'x')).rejects.toThrow(/traversal|inválido/i);
    await expect(service.rename('a.txt', '../../b.txt')).rejects.toThrow(/traversal|inválido/i);
  });

  it.runIf(process.platform !== 'win32')(
    'bloqueia symlink direto e symlink em diretório pai',
    async () => {
      await fs.writeFile(path.join(outside, 'secret.txt'), 'outside');
      await fs.symlink(path.join(outside, 'secret.txt'), path.join(root, 'secret-link'));
      await fs.symlink(outside, path.join(root, 'outside-dir'));

      await expect(service.readFile('secret-link')).rejects.toThrow(/simbólico/i);
      await expect(service.readFile('outside-dir/secret.txt')).rejects.toThrow(
        /fora do workspace/i,
      );
      await expect(service.writeFile('outside-dir/new.txt', 'blocked')).rejects.toThrow(
        /externo|fora/i,
      );
      await expect(fs.access(path.join(outside, 'new.txt'))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    },
  );

  it('bloqueia leitura e sobrescrita de credenciais, mas permite .env.example', async () => {
    await fs.writeFile(path.join(root, '.env'), 'TOKEN=secret');
    await fs.writeFile(path.join(root, '.env.example'), 'TOKEN=');
    await expect(service.readFile('.env')).rejects.toThrow(/sensível/i);
    await expect(service.writeFile('.ssh/id_ed25519', 'secret')).rejects.toThrow(/sensível/i);
    await expect(service.readFile('.env.example')).resolves.toBe('TOKEN=');
  });

  it('grava arquivo comum de forma segura e exige confirmação para excluir', async () => {
    await service.writeFile('src.ts', 'export const value = 1;');
    await expect(service.readFile('src.ts')).resolves.toContain('value = 1');
    await expect(service.deleteEntry('src.ts')).rejects.toThrow(/confirmação/i);
    await service.deleteEntry('src.ts', true);
    await expect(service.exists('src.ts')).resolves.toBe(false);
  });

  it('bloqueia exclusão em massa mesmo com confirmação', async () => {
    await fs.mkdir(path.join(root, 'large'));
    await Promise.all(
      Array.from({ length: 21 }, (_, index) =>
        fs.writeFile(path.join(root, 'large', `${index}.txt`), String(index)),
      ),
    );
    await expect(service.deleteEntry('large', true)).rejects.toThrow(/massa/i);
    await expect(service.exists('large')).resolves.toBe(true);
  });
});
