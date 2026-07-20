import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(execFile);

export interface ProjectTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: 'frontend' | 'backend' | 'fullstack' | 'other';
  readonly tags: readonly string[];
  readonly manager: 'pnpm' | 'npm' | 'none';
  readonly createCommand: string | null;
  readonly files: ReadonlyArray<{ path: string; content: string }> | undefined;
}

export const PROJECT_TEMPLATES: readonly ProjectTemplate[] = [
  {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'SPA moderna com React 19, TypeScript e Vite.',
    category: 'frontend',
    tags: ['react', 'vite', 'typescript'],
    manager: 'pnpm',
    createCommand: 'pnpm create vite . --template react-ts',
    files: undefined,
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'App React com SSR, rotas e API routes.',
    category: 'fullstack',
    tags: ['next', 'react', 'typescript'],
    manager: 'pnpm',
    createCommand:
      'pnpm create next-app . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"',
    files: undefined,
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'REST API com Express e TypeScript.',
    category: 'backend',
    tags: ['node', 'express', 'typescript'],
    manager: 'pnpm',
    createCommand: null,
    files: [
      {
        path: 'package.json',
        content: JSON.stringify(
          {
            name: '{{name}}',
            version: '0.1.0',
            type: 'module',
            scripts: { dev: 'tsx watch src/index.ts', build: 'tsc', start: 'node dist/index.js' },
            dependencies: { express: '^4.21.0' },
            devDependencies: {
              '@types/express': '^4.17.21',
              '@types/node': '^22.0.0',
              tsx: '^4.19.0',
              typescript: '^5.7.0',
            },
          },
          null,
          2,
        ),
      },
      {
        path: 'src/index.ts',
        content:
          "import express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT ?? 3000;\n\napp.use(express.json());\n\napp.get('/', (_req, res) => {\n  res.json({ ok: true });\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on http://localhost:${PORT}`);\n});\n",
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'ESNext',
              moduleResolution: 'bundler',
              outDir: 'dist',
              strict: true,
            },
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Página de apresentação com React, Vite e Tailwind.',
    category: 'frontend',
    tags: ['landing', 'tailwind', 'react'],
    manager: 'pnpm',
    createCommand: 'pnpm create vite . --template react-ts',
    files: undefined,
  },
  {
    id: 'electron',
    name: 'Electron',
    description: 'App desktop com Electron e React.',
    category: 'other',
    tags: ['electron', 'desktop', 'react'],
    manager: 'pnpm',
    createCommand: null,
    files: [
      {
        path: 'package.json',
        content: JSON.stringify(
          {
            name: '{{name}}',
            version: '0.1.0',
            main: 'main.js',
            scripts: { start: 'electron .' },
            devDependencies: { electron: '^43.0.0' },
          },
          null,
          2,
        ),
      },
      {
        path: 'main.js',
        content:
          "const { app, BrowserWindow } = require('electron');\napp.whenReady().then(() => {\n  const win = new BrowserWindow({ width: 1200, height: 800 });\n  win.loadURL('about:blank');\n});\n",
      },
    ],
  },
  {
    id: 'fastify',
    name: 'Fastify',
    description: 'API de alta performance com Fastify e TypeScript.',
    category: 'backend',
    tags: ['fastify', 'node', 'typescript'],
    manager: 'pnpm',
    createCommand: null,
    files: [
      {
        path: 'package.json',
        content: JSON.stringify(
          {
            name: '{{name}}',
            version: '0.1.0',
            type: 'module',
            scripts: { dev: 'tsx watch src/index.ts', build: 'tsc', start: 'node dist/index.js' },
            dependencies: { fastify: '^5.0.0' },
            devDependencies: { '@types/node': '^22.0.0', tsx: '^4.19.0', typescript: '^5.7.0' },
          },
          null,
          2,
        ),
      },
      {
        path: 'src/index.ts',
        content:
          "import Fastify from 'fastify';\n\nconst app = Fastify({ logger: true });\n\napp.get('/', async () => ({ ok: true }));\n\nawait app.listen({ port: 3000 });\n",
      },
    ],
  },
  {
    id: 'supabase-app',
    name: 'Supabase App',
    description: 'App React com Supabase para auth e banco.',
    category: 'fullstack',
    tags: ['supabase', 'react', 'typescript'],
    manager: 'pnpm',
    createCommand: 'pnpm create vite . --template react-ts',
    files: undefined,
  },
  {
    id: 'firebase-app',
    name: 'Firebase App',
    description: 'App React com Firebase para auth, Firestore e Hosting.',
    category: 'fullstack',
    tags: ['firebase', 'react', 'typescript'],
    manager: 'pnpm',
    createCommand: 'pnpm create vite . --template react-ts',
    files: undefined,
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Site pessoal com React e seções customizáveis.',
    category: 'frontend',
    tags: ['portfolio', 'react', 'tailwind'],
    manager: 'pnpm',
    createCommand: 'pnpm create vite . --template react-ts',
    files: undefined,
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Painel administrativo com tabelas, gráficos e navegação.',
    category: 'frontend',
    tags: ['dashboard', 'react', 'tailwind'],
    manager: 'pnpm',
    createCommand: 'pnpm create vite . --template react-ts',
    files: undefined,
  },
  {
    id: 'static-site',
    name: 'Site Estático',
    description: 'HTML + CSS + JS puro, sem framework.',
    category: 'frontend',
    tags: ['html', 'css', 'static'],
    manager: 'none',
    createCommand: null,
    files: [
      {
        path: 'index.html',
        content:
          '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>{{name}}</title>\n  <link rel="stylesheet" href="style.css" />\n</head>\n<body>\n  <h1>{{name}}</h1>\n  <script src="main.js"></script>\n</body>\n</html>\n',
      },
      {
        path: 'style.css',
        content:
          '* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: system-ui, sans-serif; }\n',
      },
      { path: 'main.js', content: "console.log('{{name}} ready');\n" },
    ],
  },
  {
    id: 'empty',
    name: 'Projeto vazio',
    description: 'Apenas uma pasta e um README.',
    category: 'other',
    tags: ['empty'],
    manager: 'none',
    createCommand: null,
    files: [{ path: 'README.md', content: '# {{name}}\n\n> Projeto criado com VisualnsCode.\n' }],
  },
];

export interface ScaffoldResult {
  readonly success: boolean;
  readonly path: string;
  readonly logs: string[];
}

export class ScaffoldService {
  async scaffold(
    templateId: string,
    projectPath: string,
    projectName: string,
    onLog: (msg: string) => void,
  ): Promise<ScaffoldResult> {
    const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return { success: false, path: projectPath, logs: ['Template não encontrado.'] };

    const logs: string[] = [];
    const log = (msg: string) => {
      logs.push(msg);
      onLog(msg);
    };

    try {
      log(`Criando pasta ${projectPath}…`);
      await fs.mkdir(projectPath, { recursive: true });

      if (template.createCommand) {
        log(`Executando: ${template.createCommand}`);
        const [cmd, ...args] = template.createCommand.split(' ');
        await execAsync(cmd!, args, { cwd: projectPath });
        log('Scaffolding concluído.');
      } else if (template.files) {
        for (const file of template.files) {
          const filePath = path.join(projectPath, file.path);
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, file.content.replace(/\{\{name\}\}/g, projectName), 'utf8');
          log(`Criado: ${file.path}`);
        }
      }

      if (template.manager !== 'none' && template.createCommand === null) {
        log('Instalando dependências…');
        await execAsync(template.manager, ['install'], { cwd: projectPath }).catch(() => {
          log('Aviso: instalação automática falhou, rode manualmente.');
        });
      }

      log('Inicializando Git…');
      await execAsync('git', ['init'], { cwd: projectPath }).catch(() => undefined);
      await execAsync('git', ['checkout', '-b', 'main'], { cwd: projectPath }).catch(
        () => undefined,
      );

      log('Criando primeiro commit…');
      await execAsync('git', ['add', '.'], { cwd: projectPath }).catch(() => undefined);
      await execAsync(
        'git',
        ['commit', '-m', `chore: init ${projectName} from ${template.name} template`],
        { cwd: projectPath },
      ).catch(() => undefined);

      log(`Projeto "${projectName}" pronto em ${projectPath}`);
      return { success: true, path: projectPath, logs };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`Erro: ${msg}`);
      return { success: false, path: projectPath, logs };
    }
  }
}
