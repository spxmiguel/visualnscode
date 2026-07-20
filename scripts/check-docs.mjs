import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const required = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE',
  'CHANGELOG.md',
  'ROADMAP.md',
  'docs/README.md',
  'docs/README.pt-BR.md',
  'docs/audit-report.md',
  'docs/desktop-interface.md',
  'docs/development-plan.md',
  'docs/getting-started.md',
  'docs/git-and-github.md',
  'docs/installation.md',
  'docs/architecture.md',
  'docs/providers.md',
  'docs/agents.md',
  'docs/integrations.md',
  'docs/security-model.md',
  'docs/cli-detection.md',
  'docs/project-templates.md',
  'docs/deployment.md',
  'docs/landing.md',
  'docs/onboarding.md',
  'docs/plugins.md',
  'docs/requirements.md',
  'docs/troubleshooting.md',
  'docs/development.md',
  'docs/testing.md',
  'docs/releases.md',
  'docs/assets/home.png',
  'docs/assets/onboarding.png',
  'docs/assets/workspace.png',
  'docs/decisions/0001-use-electron.md',
  'docs/decisions/0002-use-monaco-editor.md',
  'docs/decisions/0003-use-pnpm-monorepo.md',
  'docs/decisions/0004-ai-provider-architecture.md',
  'docs/decisions/0005-local-command-security.md',
  'docs/decisions/0006-system-credential-vault.md',
  'docs/decisions/0007-provider-runtime-and-streaming.md',
  'docs/decisions/README.md',
];

const errors = [];
for (const file of required) {
  if (!existsSync(resolve(root, file))) errors.push(`Missing required file: ${file}`);
}

const markdownFiles = required.filter(
  (file) => file.endsWith('.md') && existsSync(resolve(root, file)),
);
const rootScripts = Object.keys(
  JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).scripts,
);
const pnpmBuiltins = new Set(['--filter', 'add', 'create', 'exec', 'install', 'run']);
for (const file of markdownFiles) {
  const body = readFileSync(resolve(root, file), 'utf8');
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of body.matchAll(linkPattern)) {
    const target = match[1].trim().replace(/^<|>$/g, '');
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    const path = decodeURIComponent(target.split('#')[0]);
    if (path && !existsSync(resolve(root, dirname(file), path))) {
      errors.push(`${file}: broken local link ${target}`);
    }
  }
  for (const fence of body.matchAll(/```(?:bash|sh|shell|powershell)\n([\s\S]*?)```/g)) {
    for (const match of fence[1].matchAll(/^[ \t]*(?:\$ )?pnpm ([\w:-]+)/gm)) {
      const command = match[1];
      if (!pnpmBuiltins.has(command) && !rootScripts.includes(command)) {
        errors.push(`${file}: documented command has no package.json script: pnpm ${command}`);
      }
    }
  }
}

const diagramFiles = [
  'docs/architecture.md',
  'docs/agents.md',
  'docs/security-model.md',
  'docs/onboarding.md',
  'docs/deployment.md',
];
for (const file of diagramFiles) {
  const body = readFileSync(resolve(root, file), 'utf8');
  if (!body.includes('```mermaid')) errors.push(`${file}: required Mermaid diagram is missing`);
}

const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
for (const heading of [
  '## Screenshots',
  '## Current status',
  '## Requirements',
  '## Architecture',
  '## Contributing',
  '## Security',
  '## License',
]) {
  if (!readme.includes(heading)) errors.push(`README.md: missing ${heading}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Documentation check passed (${required.length} required files).`);
