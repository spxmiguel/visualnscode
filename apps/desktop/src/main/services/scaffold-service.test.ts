// @vitest-environment node
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { builtInAgents } from '@visualnscode/agents';
import type { ProjectCreationOptions } from '../../shared/project-creation';
import {
  PROJECT_TEMPLATES,
  ScaffoldService,
  suggestProject,
  type ProjectCommandRunner,
} from './scaffold-service';

class FakeRunner implements ProjectCommandRunner {
  readonly calls: Array<{ executable: string; args: readonly string[]; cwd: string }> = [];

  async run(command: { executable: string; args: readonly string[] }, cwd: string) {
    this.calls.push({ ...command, cwd });
    return {
      stdout: command.executable === 'gh' ? 'https://github.com/example/test-project\n' : '',
      stderr: '',
    };
  }
}

const options = (parentPath: string, overrides: Partial<ProjectCreationOptions> = {}) => ({
  description: 'Um projeto de teste',
  templateId: 'empty',
  parentPath,
  projectName: 'test-project',
  installDependencies: false,
  initializeGit: false,
  github: { enabled: false, confirmed: false, visibility: 'private' as const },
  integration: 'none' as const,
  integrationConfirmed: false,
  startAfterCreate: false,
  ...overrides,
});

describe('project recommendations and templates', () => {
  it('offers the 13 requested, unique and versioned templates', () => {
    expect(PROJECT_TEMPLATES).toHaveLength(13);
    expect(new Set(PROJECT_TEMPLATES.map(({ id }) => id)).size).toBe(13);
    expect(PROJECT_TEMPLATES.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'react-vite',
        'nextjs',
        'electron',
        'node-api',
        'express',
        'fastify',
        'firebase-app',
        'supabase-app',
        'landing-page',
        'portfolio',
        'dashboard',
        'static-site',
        'empty',
      ]),
    );
    for (const template of PROJECT_TEMPLATES) {
      expect(template.version).toMatch(/^\d+\.\d+\.\d+$/u);
      expect(template.schemaVersion).toBe(1);
      expect(builtInAgents.some(({ name }) => name === template.recommendedAgent)).toBe(true);
    }
  });

  it('turns a plain-language school grades idea into an explainable dashboard suggestion', () => {
    const suggestion = suggestProject('Quero criar um site para controlar minhas notas escolares.');

    expect(suggestion.templateId).toBe('dashboard');
    expect(suggestion.name).toContain('controlar');
    expect(suggestion.stack).toContain('React');
    expect(suggestion.database).not.toBe('');
    expect(suggestion.authentication).not.toBe('');
    expect(suggestion.deployment).not.toBe('');
    expect(suggestion.recommendedAgent).toBe('Frontend Developer');
    expect(suggestion.reasons).not.toHaveLength(0);
  });

  it.each([
    ['app desktop', 'electron'],
    ['api com Express', 'express'],
    ['portfolio pessoal', 'portfolio'],
    ['app usando Supabase', 'supabase-app'],
  ])('selects %s as %s', (description, templateId) => {
    expect(suggestProject(description).templateId).toBe(templateId);
  });
});

describe('ScaffoldService', () => {
  let root: string;
  let runner: FakeRunner;
  let service: ScaffoldService;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'visualnscode-project-'));
    runner = new FakeRunner();
    service = new ScaffoldService(runner);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('creates a project locally without installing or publishing anything', async () => {
    const progress: string[] = [];
    const result = await service.create(options(root), (event) => progress.push(event.message));

    expect(result.success).toBe(true);
    await expect(fs.readFile(path.join(result.path, 'README.md'), 'utf8')).resolves.toContain(
      '# test-project',
    );
    await expect(
      fs.readFile(path.join(result.path, '.visualnscode/template.json'), 'utf8'),
    ).resolves.toContain('"version": "1.0.0"');
    expect(runner.calls).toHaveLength(0);
    expect(progress).toContain('Publicação no GitHub deixada para depois.');
  });

  it.each(['landing-page', 'portfolio', 'dashboard'])(
    'creates a distinct functional %s starter instead of the generic Vite screen',
    async (templateId) => {
      const result = await service.create(
        options(root, { templateId, projectName: `test-${templateId}` }),
      );

      expect(result.success).toBe(true);
      const app = await fs.readFile(path.join(result.path, 'src/App.tsx'), 'utf8');
      expect(app).toContain(`test-${templateId}`);
      expect(app).toContain('Conteúdo inicial');
      expect(app).toContain('export default function App');
      expect(runner.calls).toEqual([
        expect.objectContaining({ executable: 'pnpm', args: expect.arrayContaining(['vite']) }),
      ]);
    },
  );

  it('uses only injected commands for dependencies, Git and confirmed GitHub creation', async () => {
    const result = await service.create(
      options(root, {
        templateId: 'express',
        installDependencies: true,
        initializeGit: true,
        github: { enabled: true, confirmed: true, visibility: 'private' },
        startAfterCreate: true,
      }),
    );

    expect(result.success).toBe(true);
    expect(result.gitInitialized).toBe(true);
    expect(result.githubUrl).toBe('https://github.com/example/test-project');
    expect(result.runCommand).toBe('pnpm run dev');
    expect(runner.calls.map(({ executable }) => executable)).toEqual([
      'pnpm',
      'git',
      'git',
      'git',
      'gh',
    ]);
    expect(runner.calls.at(-1)?.args).not.toContain('--push');
  });

  it('keeps Next.js dependency installation and Git initialization under user control', async () => {
    const result = await service.create(
      options(root, {
        templateId: 'nextjs',
        projectName: 'next-project',
        installDependencies: false,
        initializeGit: false,
      }),
    );

    expect(result.success).toBe(true);
    expect(runner.calls).toHaveLength(1);
    expect(runner.calls[0]?.args).toEqual(
      expect.arrayContaining(['--skip-install', '--disable-git', '--use-pnpm']),
    );
  });

  it('requests the built-in preview for a static project', async () => {
    const result = await service.create(
      options(root, {
        templateId: 'static-site',
        projectName: 'static-project',
        startAfterCreate: true,
      }),
    );

    expect(result.success).toBe(true);
    expect(result.previewRequested).toBe(true);
    expect(result.runCommand).toBe('VisualnsCode static preview');
  });

  it('refuses external creation without explicit confirmation before creating files', async () => {
    const result = await service.create(
      options(root, {
        github: { enabled: true, confirmed: false, visibility: 'public' },
      }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/confirme/i);
    expect(runner.calls).toHaveLength(0);
    await expect(fs.access(path.join(root, 'test-project'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('does not overwrite a non-empty destination', async () => {
    const destination = path.join(root, 'test-project');
    await fs.mkdir(destination);
    await fs.writeFile(path.join(destination, 'keep.txt'), 'mine');

    const result = await service.create(options(root));

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/não está vazia/i);
    await expect(fs.readFile(path.join(destination, 'keep.txt'), 'utf8')).resolves.toBe('mine');
  });

  it('configures optional integrations through the fake runner only', async () => {
    const result = await service.create(
      options(root, {
        integration: 'supabase',
        integrationConfirmed: true,
      }),
    );

    expect(result.success).toBe(true);
    expect(runner.calls).toHaveLength(1);
    expect(runner.calls[0]).toMatchObject({ executable: 'supabase', args: ['init'] });
  });
});
