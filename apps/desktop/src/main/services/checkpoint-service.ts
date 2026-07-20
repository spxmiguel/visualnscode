import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface CheckpointFile {
  readonly relativePath: string;
  readonly content: string;
  readonly existed?: boolean;
}

export interface CheckpointEntry {
  readonly id: string;
  readonly workspacePath: string;
  readonly createdAt: string;
  readonly label: string;
  readonly files: readonly CheckpointFile[];
}

export type CheckpointSummary = Omit<CheckpointEntry, 'files'> & {
  readonly fileCount: number;
};

const MAX_CHECKPOINTS_PER_WORKSPACE = 50;
const VALID_ID = /^cp-[0-9]+-[a-z0-9]{6}$/;

export class CheckpointService {
  constructor(
    private readonly checkpointsDir = path.join(os.homedir(), '.visualnscode', 'checkpoints'),
  ) {}

  async create(
    workspacePath: string,
    files: readonly CheckpointFile[],
    label: string,
  ): Promise<string> {
    if (files.length === 0 || files.length > 25)
      throw new Error('Checkpoint com quantidade inválida de arquivos.');
    if (files.some((file) => !this.isValidRelativePath(file.relativePath))) {
      throw new Error('Checkpoint contém caminho inválido.');
    }
    await fs.mkdir(this.checkpointsDir, { recursive: true, mode: 0o700 });
    await fs.chmod(this.checkpointsDir, 0o700).catch(() => undefined);
    const id = `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8).padEnd(6, '0')}`;
    const entry: CheckpointEntry = {
      id,
      workspacePath: path.resolve(workspacePath),
      createdAt: new Date().toISOString(),
      label: label.slice(0, 200),
      files,
    };
    await fs.writeFile(path.join(this.checkpointsDir, `${id}.json`), JSON.stringify(entry), {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
    await this.pruneOld(entry.workspacePath);
    return id;
  }

  async list(workspacePath: string): Promise<CheckpointSummary[]> {
    try {
      const expectedWorkspace = path.resolve(workspacePath);
      const names = await fs.readdir(this.checkpointsDir);
      const summaries: CheckpointSummary[] = [];
      for (const name of names.filter((candidate) =>
        VALID_ID.test(candidate.replace(/\.json$/, '')),
      )) {
        try {
          const entry = await this.readEntry(name.replace(/\.json$/, ''));
          if (path.resolve(entry.workspacePath) === expectedWorkspace) {
            const { files, ...rest } = entry;
            summaries.push({ ...rest, fileCount: files.length });
          }
        } catch {
          // A corrupt checkpoint is isolated and omitted from history.
        }
      }
      return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  async restore(id: string, workspacePath: string): Promise<CheckpointEntry> {
    const entry = await this.readEntry(id);
    if (path.resolve(entry.workspacePath) !== path.resolve(workspacePath)) {
      throw new Error('O checkpoint pertence a outro workspace.');
    }
    return entry;
  }

  async remove(id: string, workspacePath?: string): Promise<void> {
    if (workspacePath) await this.restore(id, workspacePath);
    this.assertValidId(id);
    await fs.rm(path.join(this.checkpointsDir, `${id}.json`), { force: true });
  }

  private async readEntry(id: string): Promise<CheckpointEntry> {
    this.assertValidId(id);
    const raw = await fs.readFile(path.join(this.checkpointsDir, `${id}.json`), 'utf8');
    const entry = JSON.parse(raw) as Partial<CheckpointEntry>;
    if (
      entry.id !== id ||
      typeof entry.workspacePath !== 'string' ||
      typeof entry.createdAt !== 'string' ||
      typeof entry.label !== 'string' ||
      !Array.isArray(entry.files) ||
      entry.files.some(
        (file) =>
          !file ||
          typeof file.relativePath !== 'string' ||
          typeof file.content !== 'string' ||
          !this.isValidRelativePath(file.relativePath),
      )
    ) {
      throw new Error('Checkpoint inválido ou corrompido.');
    }
    return entry as CheckpointEntry;
  }

  private assertValidId(id: string): void {
    if (!VALID_ID.test(id)) throw new Error('ID de checkpoint inválido.');
  }

  private isValidRelativePath(relativePath: string): boolean {
    if (!relativePath || relativePath.includes('\0') || path.isAbsolute(relativePath)) return false;
    const normalized = path.normalize(relativePath);
    return normalized !== '..' && !normalized.startsWith('..' + path.sep);
  }

  private async pruneOld(workspacePath: string): Promise<void> {
    const all = await this.list(workspacePath);
    const toDelete = all.slice(MAX_CHECKPOINTS_PER_WORKSPACE);
    await Promise.all(toDelete.map((checkpoint) => this.remove(checkpoint.id, workspacePath)));
  }
}
