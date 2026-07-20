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
const headingAnchors = new Map();

function slugifyHeading(heading) {
  return heading
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

for (const file of markdownFiles) {
  const body = readFileSync(resolve(root, file), 'utf8');
  const anchors = new Set();
  const duplicates = new Map();
  for (const match of body.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = slugifyHeading(match[1]);
    const duplicate = duplicates.get(base) ?? 0;
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
    duplicates.set(base, duplicate + 1);
  }
  headingAnchors.set(file, anchors);
}

const rootScripts = Object.keys(
  JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).scripts,
);
const pnpmBuiltins = new Set(['--filter', 'add', 'create', 'exec', 'install', 'run']);
for (const file of markdownFiles) {
  const body = readFileSync(resolve(root, file), 'utf8');
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of body.matchAll(linkPattern)) {
    const target = match[1].trim().replace(/^<|>$/g, '');
    if (/^(?:https?:|mailto:)/.test(target)) continue;
    const [rawPath, rawFragment] = target.split('#');
    const path = decodeURIComponent(rawPath);
    const linkedPath = path ? resolve(root, dirname(file), path) : resolve(root, file);
    if (!existsSync(linkedPath)) {
      errors.push(`${file}: broken local link ${target}`);
      continue;
    }
    if (rawFragment && linkedPath.endsWith('.md')) {
      const linkedFile = path ? linkedPath.slice(root.length + 1).replaceAll('\\', '/') : file;
      const fragment = decodeURIComponent(rawFragment).toLowerCase();
      if (!headingAnchors.get(linkedFile)?.has(fragment)) {
        errors.push(`${file}: broken local anchor ${target}`);
      }
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

const diagramFiles = new Map([
  ['docs/architecture.md', 1],
  ['docs/agents.md', 1],
  ['docs/security-model.md', 2],
  ['docs/onboarding.md', 1],
  ['docs/deployment.md', 1],
]);
for (const [file, minimum] of diagramFiles) {
  const body = readFileSync(resolve(root, file), 'utf8');
  const count = [...body.matchAll(/^```mermaid$/gm)].length;
  if (count < minimum) {
    errors.push(`${file}: expected at least ${minimum} Mermaid diagram(s), found ${count}`);
  }
}

const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
for (const heading of [
  '## Who it is for',
  '## Features',
  '## Screenshots',
  '## Current status',
  '## Requirements',
  '## Install from source',
  '## Run',
  '## Build',
  '## Test and verify',
  '## Architecture',
  '## Documentation',
  '## Roadmap',
  '## Contributing',
  '## Security',
  '## License',
]) {
  if (!readme.includes(heading)) errors.push(`README.md: missing ${heading}`);
}

const extensionGuides = new Map([
  ['docs/providers.md', '## Adding a provider'],
  ['docs/integrations.md', '## Adding an integration'],
  ['docs/project-templates.md', '## Adding a template'],
  ['docs/agents.md', '## Adding an agent programmatically'],
  ['docs/plugins.md', '# Future plugin contract'],
]);
for (const [file, heading] of extensionGuides) {
  const body = readFileSync(resolve(root, file), 'utf8');
  if (!body.includes(heading)) errors.push(`${file}: missing extension guide ${heading}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Documentation check passed (${required.length} required files).`);
