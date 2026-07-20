import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { createSafeProcessEnvironment } from '@visualnscode/integrations';
import type {
  ProjectCommand,
  ProjectCreationOptions,
  ProjectCreationResult,
  ProjectProgressEvent,
  ProjectSuggestion,
  ProjectTemplate,
} from '../../shared/project-creation';

const execAsync = promisify(execFile);

interface TemplateFile {
  readonly path: string;
  readonly content: string;
}

interface TemplateDefinition extends ProjectTemplate {
  readonly create?: ProjectCommand;
  readonly files: readonly TemplateFile[];
  readonly additionalPackages?: readonly string[];
  readonly runCommand?: string;
}

export interface ProjectCommandResult {
  readonly stdout: string;
  readonly stderr: string;
}

export interface ProjectCommandRunner {
  run(command: ProjectCommand, cwd: string): Promise<ProjectCommandResult>;
}

class ExecProjectCommandRunner implements ProjectCommandRunner {
  async run(command: ProjectCommand, cwd: string): Promise<ProjectCommandResult> {
    const result = await execAsync(command.executable, [...command.args], {
      cwd,
      env: createSafeProcessEnvironment(process.env, { CI: '1', FORCE_COLOR: '0' }),
      maxBuffer: 2_000_000,
      timeout: 10 * 60 * 1000,
    });
    return { stdout: result.stdout, stderr: result.stderr };
  }
}

const packageJson = (
  dependencies: Record<string, string>,
  scripts: Record<string, string>,
  devDependencies: Record<string, string> = {},
): string =>
  JSON.stringify(
    {
      name: '{{name}}',
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts,
      dependencies,
      devDependencies,
    },
    null,
    2,
  );

const tsconfig: TemplateFile = {
  path: 'tsconfig.json',
  content: JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        outDir: 'dist',
        strict: true,
        skipLibCheck: true,
      },
      include: ['src'],
    },
    null,
    2,
  ),
};

const versionFile = (id: string, version = '1.0.0'): TemplateFile => ({
  path: '.visualnscode/template.json',
  content: `${JSON.stringify({ id, version, schemaVersion: 1 }, null, 2)}\n`,
});

const viteCommand: ProjectCommand = {
  executable: 'pnpm',
  args: ['create', 'vite', '.', '--template', 'react-ts'],
};

const productStarterFiles = (
  id: 'landing-page' | 'portfolio' | 'dashboard',
): readonly TemplateFile[] => {
  const content = {
    'landing-page': {
      eyebrow: 'Produto / 01',
      title: 'Uma proposta clara, sem distrações.',
      body: 'Explique o valor do produto, mostre a prova e conduza a pessoa até a próxima ação.',
      action: 'Conhecer o produto',
    },
    portfolio: {
      eyebrow: 'Portfolio / 2026',
      title: 'Trabalho com produto, interface e código.',
      body: 'Uma base direta para apresentar projetos, processo e formas de contato.',
      action: 'Ver projetos',
    },
    dashboard: {
      eyebrow: 'Resumo / agora',
      title: 'Tudo importante em uma leitura.',
      body: 'Organize indicadores, ações recentes e próximos passos sem perder contexto.',
      action: 'Adicionar registro',
    },
  }[id];
  return [
    versionFile(id),
    {
      path: 'src/App.tsx',
      content: `const records = ['Visão geral', 'Atividade recente', 'Próximos passos'];\n\nexport default function App() {\n  return (\n    <main>\n      <nav><strong>{{name}}</strong><span>Feito com clareza.</span></nav>\n      <section className="hero">\n        <p className="eyebrow">${content.eyebrow}</p>\n        <h1>${content.title}</h1>\n        <p className="lede">${content.body}</p>\n        <button type="button">${content.action}</button>\n      </section>\n      <section className="grid" aria-label="Conteúdo inicial">\n        {records.map((record, index) => <article key={record}><small>0{index + 1}</small><h2>{record}</h2><p>Edite este bloco para contar a história do seu projeto.</p></article>)}\n      </section>\n    </main>\n  );\n}\n`,
    },
    {
      path: 'src/index.css',
      content:
        '*{box-sizing:border-box}body{margin:0;background:#f2f0ea;color:#1d1c19;font-family:Inter,system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:24px}nav{display:flex;justify-content:space-between;border-bottom:1px solid #c9c5ba;padding:12px 0;font-size:14px}nav span,.lede,article p{color:#666159}.hero{padding:12vh 0 9vh;max-width:780px}.eyebrow,small{font:11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.14em;color:#9b4d27}h1{font-size:clamp(48px,8vw,92px);line-height:.94;letter-spacing:-.055em;margin:20px 0}.lede{font-size:18px;line-height:1.6;max-width:620px}button{margin-top:18px;border:0;border-radius:4px;background:#1d1c19;color:#fff;padding:12px 16px}.grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #c9c5ba}.grid article{padding:24px 24px 24px 0;border-right:1px solid #c9c5ba}.grid article+article{padding-left:24px}h2{font-size:17px}@media(max-width:720px){main{padding:18px}.hero{padding:10vh 0}.grid{grid-template-columns:1fr}.grid article,.grid article+article{padding:20px 0;border-right:0;border-bottom:1px solid #c9c5ba}}\n',
    },
  ];
};

export const PROJECT_TEMPLATES: readonly TemplateDefinition[] = [
  {
    id: 'react-vite',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'React + Vite',
    description: 'Aplicação web moderna com React, TypeScript e Vite.',
    category: 'frontend',
    tags: ['react', 'vite', 'typescript'],
    stack: 'React + Vite + TypeScript',
    database: 'Nenhum',
    authentication: 'Nenhuma',
    deployment: 'Vercel',
    recommendedAgent: 'Frontend Developer',
    manager: 'pnpm',
    create: viteCommand,
    files: [versionFile('react-vite')],
    runCommand: 'pnpm run dev',
  },
  {
    id: 'nextjs',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Next.js',
    description: 'Aplicação full stack com App Router, TypeScript e Tailwind.',
    category: 'fullstack',
    tags: ['next', 'react', 'typescript'],
    stack: 'Next.js + React + TypeScript',
    database: 'A definir',
    authentication: 'A definir',
    deployment: 'Vercel',
    recommendedAgent: 'Architect',
    manager: 'pnpm',
    create: {
      executable: 'pnpm',
      args: [
        'create',
        'next-app',
        '.',
        '--typescript',
        '--tailwind',
        '--eslint',
        '--app',
        '--no-src-dir',
        '--import-alias',
        '@/*',
        '--yes',
      ],
    },
    files: [versionFile('nextjs')],
    runCommand: 'pnpm run dev',
  },
  {
    id: 'electron',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Electron',
    description: 'Aplicativo desktop mínimo com Electron.',
    category: 'other',
    tags: ['electron', 'desktop', 'javascript'],
    stack: 'Electron + JavaScript',
    database: 'Nenhum',
    authentication: 'Nenhuma',
    deployment: 'Instalador desktop',
    recommendedAgent: 'Frontend Developer',
    manager: 'pnpm',
    files: [
      versionFile('electron'),
      {
        path: 'package.json',
        content: packageJson(
          {},
          { dev: 'electron .', start: 'electron .' },
          { electron: '^43.0.0' },
        ),
      },
      {
        path: 'main.js',
        content:
          "import { app, BrowserWindow } from 'electron';\n\napp.whenReady().then(() => {\n  const window = new BrowserWindow({ width: 1100, height: 720 });\n  void window.loadFile('index.html');\n});\n",
      },
      {
        path: 'index.html',
        content:
          '<!doctype html>\n<html lang="pt-BR"><meta charset="UTF-8"><title>{{name}}</title><body><h1>{{name}}</h1></body></html>\n',
      },
    ],
    runCommand: 'pnpm run dev',
  },
  {
    id: 'node-api',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Node.js API',
    description: 'API HTTP sem framework, usando apenas recursos do Node.js.',
    category: 'backend',
    tags: ['node', 'api', 'typescript'],
    stack: 'Node.js + TypeScript',
    database: 'Nenhum',
    authentication: 'Nenhuma',
    deployment: 'Vercel',
    recommendedAgent: 'Backend Developer',
    manager: 'pnpm',
    files: [
      versionFile('node-api'),
      tsconfig,
      {
        path: 'package.json',
        content: packageJson(
          {},
          { dev: 'tsx watch src/index.ts', build: 'tsc', start: 'node dist/index.js' },
          { '@types/node': '^22.0.0', tsx: '^4.19.0', typescript: '^5.7.0' },
        ),
      },
      {
        path: 'src/index.ts',
        content:
          "import { createServer } from 'node:http';\n\nconst port = Number(process.env.PORT ?? 3000);\ncreateServer((_request, response) => {\n  response.writeHead(200, { 'content-type': 'application/json' });\n  response.end(JSON.stringify({ ok: true }));\n}).listen(port, () => console.log(`API em http://localhost:${port}`));\n",
      },
    ],
    runCommand: 'pnpm run dev',
  },
  {
    id: 'express',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Express',
    description: 'API REST com Express e TypeScript.',
    category: 'backend',
    tags: ['express', 'node', 'typescript'],
    stack: 'Express + Node.js + TypeScript',
    database: 'Nenhum',
    authentication: 'Nenhuma',
    deployment: 'Vercel',
    recommendedAgent: 'Backend Developer',
    manager: 'pnpm',
    files: [
      versionFile('express'),
      tsconfig,
      {
        path: 'package.json',
        content: packageJson(
          { express: '^5.1.0' },
          { dev: 'tsx watch src/index.ts', build: 'tsc', start: 'node dist/index.js' },
          {
            '@types/express': '^5.0.0',
            '@types/node': '^22.0.0',
            tsx: '^4.19.0',
            typescript: '^5.7.0',
          },
        ),
      },
      {
        path: 'src/index.ts',
        content:
          "import express from 'express';\n\nconst app = express();\napp.use(express.json());\napp.get('/', (_request, response) => response.json({ ok: true }));\napp.listen(3000, () => console.log('API em http://localhost:3000'));\n",
      },
    ],
    runCommand: 'pnpm run dev',
  },
  {
    id: 'fastify',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Fastify',
    description: 'API rápida e tipada com Fastify.',
    category: 'backend',
    tags: ['fastify', 'node', 'typescript'],
    stack: 'Fastify + Node.js + TypeScript',
    database: 'Nenhum',
    authentication: 'Nenhuma',
    deployment: 'Vercel',
    recommendedAgent: 'Backend Developer',
    manager: 'pnpm',
    files: [
      versionFile('fastify'),
      tsconfig,
      {
        path: 'package.json',
        content: packageJson(
          { fastify: '^5.0.0' },
          { dev: 'tsx watch src/index.ts', build: 'tsc', start: 'node dist/index.js' },
          { '@types/node': '^22.0.0', tsx: '^4.19.0', typescript: '^5.7.0' },
        ),
      },
      {
        path: 'src/index.ts',
        content:
          "import Fastify from 'fastify';\n\nconst app = Fastify({ logger: true });\napp.get('/', async () => ({ ok: true }));\nawait app.listen({ port: 3000 });\n",
      },
    ],
    runCommand: 'pnpm run dev',
  },
  {
    id: 'firebase-app',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Firebase App',
    description: 'React com Firebase pronto para autenticação, Firestore e Hosting.',
    category: 'fullstack',
    tags: ['firebase', 'react', 'typescript'],
    stack: 'React + Vite + Firebase',
    database: 'Cloud Firestore',
    authentication: 'Firebase Authentication',
    deployment: 'Firebase Hosting',
    recommendedAgent: 'Architect',
    manager: 'pnpm',
    create: viteCommand,
    files: [
      versionFile('firebase-app'),
      { path: 'firebase.json', content: '{\n  "hosting": { "public": "dist" }\n}\n' },
    ],
    additionalPackages: ['firebase'],
    runCommand: 'pnpm run dev',
  },
  {
    id: 'supabase-app',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Supabase App',
    description: 'React com banco, autenticação e API do Supabase.',
    category: 'fullstack',
    tags: ['supabase', 'react', 'typescript'],
    stack: 'React + Vite + Supabase',
    database: 'PostgreSQL (Supabase)',
    authentication: 'Supabase Auth',
    deployment: 'Vercel',
    recommendedAgent: 'Architect',
    manager: 'pnpm',
    create: viteCommand,
    files: [versionFile('supabase-app')],
    additionalPackages: ['@supabase/supabase-js'],
    runCommand: 'pnpm run dev',
  },
  ...[
    [
      'landing-page',
      'Landing Page',
      'Página de apresentação focada em conversão.',
      ['landing', 'react'],
      'Frontend Developer',
    ],
    [
      'portfolio',
      'Portfolio',
      'Site pessoal com estrutura para projetos e contato.',
      ['portfolio', 'react'],
      'Frontend Developer',
    ],
    [
      'dashboard',
      'Dashboard',
      'Painel web com base para métricas e navegação.',
      ['dashboard', 'react'],
      'Frontend Developer',
    ],
  ].map(([id, name, description, tags, agent]) => ({
    id: id as string,
    version: '1.0.0',
    schemaVersion: 1 as const,
    name: name as string,
    description: description as string,
    category: 'frontend' as const,
    tags: [...(tags as string[]), 'vite', 'typescript'],
    stack: 'React + Vite + TypeScript',
    database: id === 'dashboard' ? 'A definir' : 'Nenhum',
    authentication: id === 'dashboard' ? 'Opcional' : 'Nenhuma',
    deployment: 'Vercel',
    recommendedAgent: agent as string,
    manager: 'pnpm' as const,
    create: viteCommand,
    files: productStarterFiles(id as 'landing-page' | 'portfolio' | 'dashboard'),
    runCommand: 'pnpm run dev',
  })),
  {
    id: 'static-site',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Static Site',
    description: 'HTML, CSS e JavaScript sem framework.',
    category: 'frontend',
    tags: ['html', 'css', 'static'],
    stack: 'HTML + CSS + JavaScript',
    database: 'Nenhum',
    authentication: 'Nenhuma',
    deployment: 'GitHub Pages',
    recommendedAgent: 'Frontend Developer',
    manager: 'none',
    files: [
      versionFile('static-site'),
      {
        path: 'index.html',
        content:
          '<!doctype html>\n<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{name}}</title><link rel="stylesheet" href="style.css"></head><body><main><h1>{{name}}</h1><p>Seu projeto está pronto.</p></main><script src="main.js"></script></body></html>\n',
      },
      {
        path: 'style.css',
        content:
          '*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#11131a;color:#f7f7f8}main{max-width:720px;margin:20vh auto;padding:24px}\n',
      },
      { path: 'main.js', content: "console.log('{{name}} pronto');\n" },
    ],
  },
  {
    id: 'empty',
    version: '1.0.0',
    schemaVersion: 1,
    name: 'Empty Project',
    description: 'Uma pasta limpa com README e controle de versão opcional.',
    category: 'other',
    tags: ['empty'],
    stack: 'Sem stack definida',
    database: 'Nenhum',
    authentication: 'Nenhuma',
    deployment: 'Nenhum',
    recommendedAgent: 'Architect',
    manager: 'none',
    files: [
      versionFile('empty'),
      { path: 'README.md', content: '# {{name}}\n\nProjeto criado com VisualnsCode.\n' },
    ],
  },
];

const STOP_WORDS = new Set([
  'quero',
  'criar',
  'fazer',
  'um',
  'uma',
  'para',
  'meu',
  'minha',
  'minhas',
  'site',
  'app',
  'aplicativo',
  'projeto',
  'de',
  'do',
  'da',
  'as',
  'os',
]);

export const suggestProject = (description: string): ProjectSuggestion => {
  const normalized = description
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const includes = (...words: string[]) => words.some((word) => normalized.includes(word));
  let templateId = 'react-vite';

  if (includes('electron', 'desktop')) templateId = 'electron';
  else if (includes('firebase')) templateId = 'firebase-app';
  else if (includes('supabase')) templateId = 'supabase-app';
  else if (includes('next', 'seo', 'blog')) templateId = 'nextjs';
  else if (includes('fastify')) templateId = 'fastify';
  else if (includes('express')) templateId = 'express';
  else if (includes('api', 'backend', 'servidor')) templateId = 'node-api';
  else if (includes('portfolio', 'curriculo')) templateId = 'portfolio';
  else if (includes('landing', 'vendas', 'produto')) templateId = 'landing-page';
  else if (includes('nota', 'painel', 'dashboard', 'controle', 'gestao')) templateId = 'dashboard';
  else if (includes('html', 'estatico', 'simples sem framework')) templateId = 'static-site';
  else if (includes('vazio', 'do zero')) templateId = 'empty';

  const template = PROJECT_TEMPLATES.find((item) => item.id === templateId)!;
  const words = normalized
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .slice(0, 4);
  const name = (words.length ? words.join('-') : 'novo-projeto').slice(0, 48);
  const structure =
    template.category === 'backend'
      ? ['src/', 'src/index.ts', 'package.json']
      : template.id === 'electron'
        ? ['main.js', 'index.html', 'package.json']
        : template.id === 'static-site'
          ? ['index.html', 'style.css', 'main.js']
          : template.id === 'empty'
            ? ['README.md']
            : ['src/', 'src/App.tsx', 'public/'];

  return {
    name,
    templateId,
    stack: template.stack,
    structure,
    database: template.database,
    authentication: template.authentication,
    deployment: template.deployment,
    recommendedAgent: template.recommendedAgent,
    reasons: [
      `O template ${template.name} combina com os termos da descrição.`,
      `${template.recommendedAgent} é o agente mais adequado para começar.`,
    ],
  };
};

const commandText = (command: ProjectCommand): string =>
  [
    command.executable,
    ...command.args.map((arg) => (arg.includes(' ') ? JSON.stringify(arg) : arg)),
  ].join(' ');

export class ScaffoldService {
  constructor(
    private readonly commandRunner: ProjectCommandRunner = new ExecProjectCommandRunner(),
    private readonly templates: readonly TemplateDefinition[] = PROJECT_TEMPLATES,
  ) {}

  async create(
    options: ProjectCreationOptions,
    onProgress: (event: ProjectProgressEvent) => void = () => undefined,
  ): Promise<ProjectCreationResult> {
    const events: ProjectProgressEvent[] = [];
    let gitInitialized = false;
    let githubUrl: string | undefined;
    let projectPath = path.resolve(options.parentPath, options.projectName);
    const emit = (
      step: string,
      status: ProjectProgressEvent['status'],
      message: string,
      technicalDetails?: string,
    ) => {
      const event: ProjectProgressEvent = {
        step,
        status,
        message,
        ...(technicalDetails ? { technicalDetails } : {}),
        timestamp: new Date().toISOString(),
      };
      events.push(event);
      onProgress(event);
    };

    try {
      const template = this.templates.find((item) => item.id === options.templateId);
      if (!template) throw new Error('O template selecionado não existe.');
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(options.projectName)) {
        throw new Error('Use um nome curto com letras minúsculas, números, hífen ou sublinhado.');
      }
      if (options.github.enabled && !options.github.confirmed) {
        throw new Error('Confirme a criação do repositório no GitHub antes de continuar.');
      }
      if (options.integration !== 'none' && !options.integrationConfirmed) {
        throw new Error('Confirme a configuração do serviço externo antes de continuar.');
      }

      const parentPath = await fs.realpath(options.parentPath);
      projectPath = path.resolve(parentPath, options.projectName);
      if (path.dirname(projectPath) !== parentPath)
        throw new Error('A pasta do projeto é inválida.');
      const existing = await fs.readdir(projectPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (existing?.length) throw new Error('A pasta escolhida não está vazia.');

      emit('folder', 'running', 'Preparando a pasta do novo projeto.', projectPath);
      await fs.mkdir(projectPath, { recursive: true });
      emit('folder', 'success', 'Pasta do projeto preparada.', projectPath);

      if (template.create) {
        emit(
          'scaffold',
          'running',
          `Montando a estrutura ${template.name}.`,
          commandText(template.create),
        );
        await this.commandRunner.run(template.create, projectPath);
      }
      await this.writeTemplateFiles(template, projectPath, options.projectName);
      emit(
        'scaffold',
        'success',
        'Arquivos iniciais criados.',
        `${template.files.length} arquivo(s) do template ${template.id}@${template.version}`,
      );

      if (options.installDependencies && template.manager !== 'none') {
        const install: ProjectCommand = { executable: template.manager, args: ['install'] };
        emit(
          'dependencies',
          'running',
          'Instalando as bibliotecas necessárias para o projeto.',
          commandText(install),
        );
        await this.commandRunner.run(install, projectPath);
        if (template.additionalPackages?.length) {
          const add: ProjectCommand = {
            executable: template.manager,
            args: ['add', ...template.additionalPackages],
          };
          await this.commandRunner.run(add, projectPath);
        }
        emit('dependencies', 'success', 'Bibliotecas instaladas.');
      } else {
        emit('dependencies', 'skipped', 'Instalação de bibliotecas ignorada.');
      }

      if (options.initializeGit) {
        try {
          emit(
            'git',
            'running',
            'Criando o histórico local do projeto.',
            'git init --initial-branch main',
          );
          await this.commandRunner.run(
            { executable: 'git', args: ['init', '--initial-branch', 'main'] },
            projectPath,
          );
          await this.commandRunner.run({ executable: 'git', args: ['add', '.'] }, projectPath);
          await this.commandRunner.run(
            {
              executable: 'git',
              args: ['commit', '-m', `chore: initialize ${options.projectName}`],
            },
            projectPath,
          );
          gitInitialized = true;
          emit('git', 'success', 'Primeira versão salva no histórico local.');
        } catch (error) {
          emit(
            'git',
            'warning',
            'O projeto foi criado, mas o primeiro commit não pôde ser salvo.',
            this.errorText(error),
          );
        }
      } else {
        emit('git', 'skipped', 'Histórico Git não foi criado.');
      }

      if (options.github.enabled) {
        if (!gitInitialized)
          throw new Error('O GitHub precisa de um repositório Git inicializado.');
        const command: ProjectCommand = {
          executable: 'gh',
          args: [
            'repo',
            'create',
            options.projectName,
            '--source',
            '.',
            '--remote',
            'origin',
            `--${options.github.visibility}`,
          ],
        };
        emit('github', 'running', 'Criando o repositório no GitHub.', commandText(command));
        const result = await this.commandRunner.run(command, projectPath);
        githubUrl = result.stdout.match(/https:\/\/github\.com\/[^\s]+/u)?.[0];
        emit(
          'github',
          'success',
          'Repositório criado. O envio do código continua sob seu controle.',
          githubUrl,
        );
      } else {
        emit('github', 'skipped', 'Publicação no GitHub deixada para depois.');
      }

      await this.configureIntegration(options.integration, projectPath, emit);
      const runCommand = options.startAfterCreate ? template.runCommand : undefined;
      emit(
        'finish',
        'success',
        runCommand
          ? 'Projeto pronto. Vamos iniciar e abrir o preview.'
          : 'Projeto pronto para abrir.',
        runCommand,
      );
      return {
        success: true,
        path: projectPath,
        events,
        gitInitialized,
        ...(githubUrl ? { githubUrl } : {}),
        ...(runCommand ? { runCommand } : {}),
        previewRequested: Boolean(runCommand),
      };
    } catch (error) {
      const message = this.errorText(error);
      emit('error', 'error', `Não foi possível criar o projeto: ${message}`, message);
      return {
        success: false,
        path: projectPath,
        events,
        gitInitialized,
        ...(githubUrl ? { githubUrl } : {}),
        previewRequested: false,
        error: message,
      };
    }
  }

  private async writeTemplateFiles(
    template: TemplateDefinition,
    projectPath: string,
    projectName: string,
  ): Promise<void> {
    for (const file of template.files) {
      const target = path.resolve(projectPath, file.path);
      if (!target.startsWith(`${projectPath}${path.sep}`)) {
        throw new Error(`O template contém um caminho inseguro: ${file.path}`);
      }
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, file.content.replace(/\{\{name\}\}/g, projectName), 'utf8');
    }
  }

  private async configureIntegration(
    integration: ProjectCreationOptions['integration'],
    projectPath: string,
    emit: (
      step: string,
      status: ProjectProgressEvent['status'],
      message: string,
      details?: string,
    ) => void,
  ): Promise<void> {
    if (integration === 'none') {
      emit('integration', 'skipped', 'Nenhum serviço adicional configurado.');
      return;
    }
    if (integration === 'firebase') {
      const configPath = path.join(projectPath, 'firebase.json');
      await fs
        .writeFile(configPath, '{\n  "hosting": { "public": "dist" }\n}\n', { flag: 'wx' })
        .catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'EEXIST') throw error;
        });
      emit('integration', 'success', 'Configuração local do Firebase preparada.', 'firebase.json');
      return;
    }
    const command: ProjectCommand =
      integration === 'supabase'
        ? { executable: 'supabase', args: ['init'] }
        : { executable: 'vercel', args: ['link', '--yes'] };
    emit(
      'integration',
      'running',
      integration === 'supabase'
        ? 'Preparando o ambiente local do Supabase.'
        : 'Vinculando a pasta a um projeto da Vercel.',
      commandText(command),
    );
    await this.commandRunner.run(command, projectPath);
    emit(
      'integration',
      'success',
      `${integration === 'supabase' ? 'Supabase' : 'Vercel'} configurado.`,
    );
  }

  private errorText(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
