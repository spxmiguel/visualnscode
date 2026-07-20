import { constants, promises as fs, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { isSensitiveFile } from './secret-scanner';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DELETE_ENTRIES = 20;
const HIDDEN_ALLOW = new Set(['.env.example', '.gitignore', '.gitkeep']);

export interface FileEntry {
  readonly name: string;
  readonly path: string;
  readonly type: 'file' | 'dir';
  readonly size: number | undefined;
  readonly modified: string | undefined;
}

const isWithin = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))
  );
};

export class FilesystemService {
  private workspacePath: string | null = null;

  setWorkspace(candidate: string): void {
    if (!candidate || candidate.includes('\0')) throw new Error('Workspace inválido.');
    const resolved = realpathSync(path.resolve(candidate));
    if (!statSync(resolved).isDirectory()) throw new Error('O workspace precisa ser uma pasta.');
    this.workspacePath = resolved;
  }

  getWorkspace(): string | null {
    return this.workspacePath;
  }

  private lexicalPath(relative: string): string {
    if (!this.workspacePath) throw new Error('Nenhum workspace aberto.');
    if (typeof relative !== 'string' || relative.includes('\0') || path.isAbsolute(relative)) {
      throw new Error('Caminho inválido — use um caminho relativo ao workspace.');
    }
    const resolved = path.resolve(this.workspacePath, relative);
    if (!isWithin(this.workspacePath, resolved)) {
      throw new Error('Path traversal detectado — acesso negado.');
    }
    return resolved;
  }

  private async resolveExisting(relative: string): Promise<string> {
    const lexical = this.lexicalPath(relative);
    const info = await fs.lstat(lexical);
    if (info.isSymbolicLink()) throw new Error('Links simbólicos não podem ser acessados.');
    const real = await fs.realpath(lexical);
    if (!this.workspacePath || !isWithin(this.workspacePath, real)) {
      throw new Error('O caminho real está fora do workspace — acesso negado.');
    }
    return real;
  }

  private async resolveForCreation(relative: string): Promise<string> {
    const lexical = this.lexicalPath(relative);
    let ancestor = path.dirname(lexical);
    while (true) {
      try {
        const realAncestor = await fs.realpath(ancestor);
        if (!this.workspacePath || !isWithin(this.workspacePath, realAncestor)) {
          throw new Error('O destino atravessa um link simbólico externo — acesso negado.');
        }
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT') throw error;
        const parent = path.dirname(ancestor);
        if (parent === ancestor) throw error;
        ancestor = parent;
      }
    }
    return lexical;
  }

  private assertNotSensitive(relative: string): void {
    if (isSensitiveFile(relative)) {
      throw new Error('Arquivo sensível protegido — leitura ou sobrescrita bloqueada.');
    }
  }

  async listDir(relative: string): Promise<FileEntry[]> {
    const dir = await this.resolveExisting(relative);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result: FileEntry[] = [];
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.name.startsWith('.') && !HIDDEN_ALLOW.has(entry.name)) continue;
      if (entry.name === 'node_modules') continue;
      let size: number | undefined;
      let modified: string | undefined;
      try {
        const stat = await fs.stat(path.join(dir, entry.name));
        size = stat.size;
        modified = stat.mtime.toISOString();
      } catch {
        continue;
      }
      result.push({
        name: entry.name,
        path: path.join(relative, entry.name),
        type: entry.isDirectory() ? 'dir' : 'file',
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
    this.assertNotSensitive(relative);
    const file = await this.resolveExisting(relative);
    const stat = await fs.stat(file);
    if (!stat.isFile()) throw new Error('O caminho selecionado não é um arquivo.');
    if (stat.size > MAX_FILE_BYTES) throw new Error('Arquivo muito grande (máx. 5 MB).');
    return fs.readFile(file, 'utf8');
  }

  async readFileForCheckpoint(relative: string): Promise<string> {
    const file = await this.resolveExisting(relative);
    const stat = await fs.stat(file);
    if (!stat.isFile()) throw new Error('O caminho selecionado não é um arquivo.');
    if (stat.size > MAX_FILE_BYTES) throw new Error('Arquivo muito grande (máx. 5 MB).');
    return fs.readFile(file, 'utf8');
  }

  async writeFile(relative: string, content: string): Promise<void> {
    this.assertNotSensitive(relative);
    const file = await this.resolveForCreation(relative);
    const existing = await fs.lstat(file).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (existing?.isSymbolicLink()) throw new Error('Sobrescrita de link simbólico bloqueada.');
    if (existing?.isDirectory()) throw new Error('Não é possível sobrescrever uma pasta.');

    const temp = path.join(
      path.dirname(file),
      `.${path.basename(file)}.visualnscode-${process.pid}-${Date.now()}`,
    );
    const mode = existing?.mode;
    try {
      await fs.writeFile(temp, content, { encoding: 'utf8', flag: 'wx', mode: mode ?? 0o600 });
      if (mode) await fs.chmod(temp, mode);
      await fs.rename(temp, file);
    } finally {
      await fs.rm(temp, { force: true }).catch(() => undefined);
    }
  }

  async createDir(relative: string): Promise<void> {
    const dir = await this.resolveForCreation(relative);
    await fs.mkdir(dir, { recursive: true });
    const real = await fs.realpath(dir);
    if (!this.workspacePath || !isWithin(this.workspacePath, real)) {
      await fs.rm(dir, { recursive: true, force: true });
      throw new Error('A pasta criada escapou do workspace — operação revertida.');
    }
  }

  async deleteEntry(relative: string, confirmed = false): Promise<void> {
    if (!confirmed) throw new Error('A exclusão exige confirmação explícita.');
    this.assertNotSensitive(relative);
    const target = await this.resolveExisting(relative);
    if (target === this.workspacePath)
      throw new Error('A pasta raiz do workspace não pode ser excluída.');
    const stat = await fs.lstat(target);
    if (stat.isDirectory()) {
      const entries = await this.countEntries(target, MAX_DELETE_ENTRIES + 1);
      if (entries > MAX_DELETE_ENTRIES) {
        throw new Error(`Exclusão em massa bloqueada: mais de ${MAX_DELETE_ENTRIES} itens.`);
      }
      await fs.rm(target, { recursive: true });
    } else {
      await fs.unlink(target);
    }
  }

  async exists(relative: string): Promise<boolean> {
    try {
      await this.resolveExisting(relative);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }

  async rename(oldRelative: string, newRelative: string): Promise<void> {
    this.assertNotSensitive(oldRelative);
    this.assertNotSensitive(newRelative);
    const newPath = await this.resolveForCreation(newRelative);
    const oldPath = await this.resolveExisting(oldRelative);
    await fs.rename(oldPath, newPath);
  }

  async removeCreatedFile(relative: string): Promise<void> {
    const target = await this.resolveExisting(relative);
    const stat = await fs.lstat(target);
    if (!stat.isFile()) throw new Error('Rollback recusou excluir um caminho que não é arquivo.');
    await fs.unlink(target);
  }

  private async countEntries(directory: string, stopAfter: number): Promise<number> {
    let count = 0;
    const pending = [directory];
    while (pending.length > 0 && count < stopAfter) {
      const current = pending.pop();
      if (!current) break;
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        count += 1;
        if (count >= stopAfter) break;
        if (entry.isDirectory() && !entry.isSymbolicLink())
          pending.push(path.join(current, entry.name));
      }
    }
    return count;
  }

  async canRead(relative: string): Promise<boolean> {
    try {
      await fs.access(await this.resolveExisting(relative), constants.R_OK);
      return !isSensitiveFile(relative);
    } catch {
      return false;
    }
  }
}
