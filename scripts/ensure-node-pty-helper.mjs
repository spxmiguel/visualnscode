import { chmod, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

if (process.platform !== 'win32') {
  const requireFromDesktop = createRequire(
    new URL('../apps/desktop/package.json', import.meta.url),
  );
  try {
    const entry = requireFromDesktop.resolve('node-pty');
    const packageRoot = dirname(dirname(entry));
    const candidates = [
      join(packageRoot, 'prebuilds', `${process.platform}-${process.arch}`, 'spawn-helper'),
      join(packageRoot, 'build', 'Release', 'spawn-helper'),
    ];
    let repaired = 0;
    for (const candidate of candidates) {
      try {
        const current = await stat(candidate);
        if ((current.mode & 0o111) === 0) {
          await chmod(candidate, current.mode | 0o755);
          repaired += 1;
        }
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
    if (repaired > 0) console.log(`Repaired ${repaired} node-pty spawn helper(s).`);
  } catch (error) {
    console.warn(
      `node-pty helper check skipped: ${error instanceof Error ? error.message : error}`,
    );
  }
}
