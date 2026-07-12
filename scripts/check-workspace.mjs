import { access } from 'node:fs/promises';

const requiredPaths = [
  'apps/desktop',
  'apps/landing',
  'packages/ui',
  'packages/core',
  'packages/agents',
  'packages/providers',
  'packages/integrations',
  'packages/config',
  'packages/types',
  'docs/decisions',
  '.github/workflows',
];

const missing = [];
for (const path of requiredPaths) {
  try {
    await access(path);
  } catch {
    missing.push(path);
  }
}

if (missing.length > 0) {
  throw new Error(`Estrutura incompleta: ${missing.join(', ')}`);
}

console.log(`Estrutura validada: ${requiredPaths.length} caminhos obrigatórios.`);
