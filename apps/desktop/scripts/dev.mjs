import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import process from 'node:process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const children = [];

const run = (command, args, options = {}) => {
  const child = spawn(command, args, { stdio: 'inherit', ...options });
  children.push(child);
  return child;
};

const stop = () => {
  for (const child of children) child.kill('SIGTERM');
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

run(pnpm, ['exec', 'tsup', '--watch']);
run(pnpm, ['exec', 'vite', '--host', '127.0.0.1']);

const waitForWorkspace = async () => {
  for (;;) {
    try {
      const response = await fetch('http://127.0.0.1:5173');
      if (response.ok && existsSync('dist-electron/main/index.cjs')) return;
    } catch {
      // The development servers are still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
};

await waitForWorkspace();
const electron = run(pnpm, ['exec', 'electron', '.'], {
  env: { ...process.env, VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173' },
});
electron.on('exit', (code) => {
  stop();
  process.exit(code ?? 0);
});
