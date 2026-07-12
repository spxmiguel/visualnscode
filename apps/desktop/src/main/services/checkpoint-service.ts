import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface CheckpointFile {
  readonly relativePath: string;
  readonly content: string;
}

export interface CheckpointEntry {
  readonly id: string;
  readonly workspacePath: string;
  readonly createdAt: string;
  readonly label: string;
  readonly files: readonly CheckpointFile[];
}

export type CheckpointSummary = Omit<CheckpointEntry, 'files'>;

const CHECKPOINTS_DIR = path.join(os.homedir(), '.visualnscode', 'checkpoints');
const MAX_CHECKPOINTS_PER_WORKSPACE = 50;

export class CheckpointService {
  async create(
    workspacePath: string,
    files: readonly CheckpointFile[],
    label: string,
  ): Promise<string> {
    await fs.mkdir(CHECKPOINTS_DIR, { recursive: true });
    const id = `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: CheckpointEntry = {
      id,
      workspacePath,
      createdAt: new Date().toISOString(),
      label,
      files,
    };
    await fs.writeFile(
      path.join(CHECKPOINTS_DIR, `${id}.json`),
      JSON.stringify(entry, null, 2),
      'utf8',
    );
    await this.pruneOld(workspacePath);
    return id;
  }

  async list(workspacePath: string): Promise<CheckpointSummary[]> {
    try {
      const names = await fs.readdir(CHECKPOINTS_DIR);
      const summaries: CheckpointSummary[] = [];
      for (const name of names.filter((n) => n.endsWith('.json'))) {
        try {
          const raw = await fs.readFile(path.join(CHECKPOINTS_DIR, name), 'utf8');
          const entry = JSON.parse(raw) as CheckpointEntry;
          if (entry.workspacePath === workspacePath) {
            const { files: _, ...rest } = entry;
            summaries.push(rest);
          }
        } catch {
          // corrupt file — skip
        }
      }
      return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }

  async restore(id: string): Promise<CheckpointEntry> {
    const raw = await fs.readFile(path.join(CHECKPOINTS_DIR, `${id}.json`), 'utf8');
    return JSON.parse(raw) as CheckpointEntry;
  }

  async remove(id: string): Promise<void> {
    await fs.rm(path.join(CHECKPOINTS_DIR, `${id}.json`), { force: true });
  }

  private async pruneOld(workspacePath: string): Promise<void> {
    const all = await this.list(workspacePath);
    if (all.length <= MAX_CHECKPOINTS_PER_WORKSPACE) return;
    const toDelete = all.slice(MAX_CHECKPOINTS_PER_WORKSPACE);
    await Promise.all(toDelete.map((c) => this.remove(c.id)));
  }
}
