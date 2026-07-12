import { app, safeStorage } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export class SecureStorage {
  private readonly filePath = join(app.getPath('userData'), 'secure-store.json');

  async set(key: string, value: string): Promise<void> {
    if (!this.isSecureAvailable())
      throw new Error('O cofre seguro do sistema não está disponível.');
    const entries = await this.readEntries();
    entries[key] = safeStorage.encryptString(value).toString('base64');
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(entries), { encoding: 'utf8', mode: 0o600 });
  }

  async get(key: string): Promise<string | null> {
    if (!this.isSecureAvailable()) return null;
    const value = (await this.readEntries())[key];
    if (!value) return null;
    return safeStorage.decryptString(Buffer.from(value, 'base64'));
  }

  isSecureAvailable(): boolean {
    if (!safeStorage.isEncryptionAvailable()) return false;
    return process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text';
  }

  async remove(key: string): Promise<void> {
    const entries = await this.readEntries();
    delete entries[key];
    await writeFile(this.filePath, JSON.stringify(entries), { encoding: 'utf8', mode: 0o600 });
  }

  private async readEntries(): Promise<Record<string, string>> {
    try {
      return JSON.parse(await readFile(this.filePath, 'utf8')) as Record<string, string>;
    } catch {
      return {};
    }
  }
}
