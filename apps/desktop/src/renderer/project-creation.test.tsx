// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ProjectCreationOptions,
  ProjectProgressEvent,
  ProjectTemplate,
} from '../shared/project-creation';
import { CreateProjectModal } from './components/CreateProjectModal';
import { useAppStore } from './store';

const dashboard: ProjectTemplate = {
  id: 'dashboard',
  version: '1.0.0',
  schemaVersion: 1,
  name: 'Dashboard',
  description: 'Painel web com base para métricas e navegação.',
  category: 'frontend',
  tags: ['dashboard', 'react'],
  stack: 'React + Vite + TypeScript',
  database: 'A definir',
  authentication: 'Opcional',
  deployment: 'Vercel',
  recommendedAgent: 'Frontend Developer',
  manager: 'pnpm',
};

describe('guided project creation', () => {
  const create = vi.fn<(options: ProjectCreationOptions) => Promise<unknown>>();
  const start = vi.fn();
  let progressListener: ((event: ProjectProgressEvent) => void) | undefined;

  beforeEach(() => {
    create.mockReset();
    start.mockReset();
    progressListener = undefined;
    useAppStore.setState({ activeProject: null, mode: 'simple', screen: 'home' });
    create.mockImplementation(async (options) => {
      progressListener?.({
        step: 'dependencies',
        status: 'success',
        message: 'Bibliotecas instaladas.',
        technicalDetails: 'pnpm install',
        timestamp: '2026-07-20T12:00:00.000Z',
      });
      return {
        success: true,
        path: `/projects/${options.projectName}`,
        events: [],
        gitInitialized: true,
        runCommand: 'pnpm run dev',
        previewRequested: true,
      };
    });
    Object.defineProperty(window, 'visualnscode', {
      configurable: true,
      value: {
        scaffold: {
          templates: async () => [dashboard],
          suggest: async () => ({
            name: 'controlar-notas-escolares',
            templateId: 'dashboard',
            stack: dashboard.stack,
            structure: ['src/', 'src/App.tsx', 'public/'],
            database: dashboard.database,
            authentication: dashboard.authentication,
            deployment: dashboard.deployment,
            recommendedAgent: dashboard.recommendedAgent,
            reasons: ['A descrição pede um painel.'],
          }),
          chooseDir: async () => '/projects',
          create,
          onProgress: (listener: (event: ProjectProgressEvent) => void) => {
            progressListener = listener;
            return () => {
              progressListener = undefined;
            };
          },
        },
        runner: { start },
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('suggests, creates locally and starts preview without publishing by default', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(
      <CreateProjectModal
        initialDescription="Quero criar um site para controlar minhas notas escolares."
        onClose={close}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sugerir projeto' }));
    expect(await screen.findByText('React + Vite + TypeScript')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('button', { name: /Dashboard/ }).getAttribute('class')).toContain(
      'accent-soft',
    );
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Escolher' }));
    await user.click(screen.getByRole('button', { name: 'Criar projeto' }));

    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      templateId: 'dashboard',
      parentPath: '/projects',
      projectName: 'controlar-notas-escolares',
      github: { enabled: false, confirmed: false },
      integration: 'none',
      startAfterCreate: true,
    });
    await user.click(screen.getByText('Ver detalhes técnicos'));
    expect(screen.getByText('pnpm install')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Abrir projeto' }));
    expect(useAppStore.getState().activeProject?.path).toBe('/projects/controlar-notas-escolares');
    expect(useAppStore.getState().screen).toBe('workspace');
    expect(close).toHaveBeenCalledOnce();
    await waitFor(() => expect(start).toHaveBeenCalledWith('workspace-dev-server', 'dev'));
  });
});
