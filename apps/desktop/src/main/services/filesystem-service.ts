import { promises as fs } from 'node:fs';
import path from 'node:path';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const HIDDEN_ALLOW = new Set(['.env.example', '.gitignore', '.gitkeep']);

export interface FileEntry {
  readonly name: string;
  readonly path: string;
  readonly type: 'file' | 'dir';
  readonly size: number | undefined;
  readonly modified: string | undefined;
}

export class FilesystemService {
  private workspacePath: string | null = null;

  setWorkspace(p: string): void {
    this.workspacePath = path.resolve(p);
  }

  getWorkspace(): string | null {
    return this.workspacePath;
  }

  private resolve(relative: string): string {
    if (!this.workspacePath) throw new Error('Nenhum workspace aberto.');
    const resolved = path.resolve(this.workspacePath, relative);
    if (!resolved.startsWith(this.workspacePath + path.sep) && resolved !== this.workspacePath) {
      throw new Error('Path traversal detectado — acesso negado.');
    }
    return resolved;
  }

  async listDir(relative: string): Promise<FileEntry[]> {
    const dir = this.resolve(relative);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result: FileEntry[] = [];
    for (const e of entries) {
      if (e.name.startsWith('.') && !HIDDEN_ALLOW.has(e.name)) continue;
      if (e.name === 'node_modules') continue;
      let size: number | undefined;
      let modified: string | undefined;
      try {
        const stat = await fs.stat(path.join(dir, e.name));
        size = stat.size;
        modified = stat.mtime.toISOString();
      } catch {
        // skip
      }
      result.push({
        name: e.name,
        path: path.join(relative, e.name),
        type: e.isDirectory() ? 'dir' : 'file',
        size,
        modified,
      });
    }
    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async readFile(relative: string): Promise<string> {
    const file = this.resolve(relative);
    const stat = await fs.stat(file);
    if (stat.size > MAX_FILE_BYTES) throw new Error('Arquivo muito grande (máx 5 MB).');
    return fs.readFile(file, 'utf8');
  }

  async writeFile(relative: string, content: string): Promise<void> {
    const file = this.resolve(relative);
    await fs.writeFile(file, content, 'utf8');
  }

  async createDir(relative: string): Promise<void> {
    const dir = this.resolve(relative);
    await fs.mkdir(dir, { recursive: true });
  }

  async deleteEntry(relative: string): Promise<void> {
    const target = this.resolve(relative);
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      await fs.rm(target, { recursive: true });
    } else {
      await fs.unlink(target);
    }
  }

  async exists(relative: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(relative));
      return true;
    } catch {
      return false;
    }
  }

  async rename(oldRelative: string, newRelative: string): Promise<void> {
    const oldPath = this.resolve(oldRelative);
    const newPath = this.resolve(newRelative);
    await fs.rename(oldPath, newPath);
  }
}
