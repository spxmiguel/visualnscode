import {
  ArrowRight,
  FolderGit2,
  FolderOpen,
  GitFork,
  Plus,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { Button, ErrorNotice, Spinner, Surface } from '@visualnscode/ui';
import { useState } from 'react';
import { demoProjects, useAppStore, type RecentProject } from '../store';
import { CreateProjectModal } from './CreateProjectModal';
import { WindowHeader } from './WindowHeader';

interface QuickActionProps {
  readonly description: string;
  readonly icon: typeof Plus;
  readonly label: string;
  readonly onClick: () => void;
}

function QuickAction({ description, icon: Icon, label, onClick }: QuickActionProps) {
  return (
    <button
      className="group flex min-h-28 flex-col items-start rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-4 text-left transition hover:-translate-y-0.5 hover:border-[rgb(var(--border-strong))] hover:shadow-[var(--shadow-panel)]"
      onClick={onClick}
      type="button"
    >
      <span className="mb-4 flex size-9 items-center justify-center rounded-lg bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]">
        <Icon className="size-[18px]" />
      </span>
      <span className="text-sm font-semibold text-[rgb(var(--text))]">{label}</span>
      <span className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">{description}</span>
    </button>
  );
}

function ProjectRow({ project }: { readonly project: RecentProject }) {
  const openProject = useAppStore((state) => state.openProject);
  return (
    <button
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[rgb(var(--surface-hover))]"
      onClick={() => openProject(project)}
      type="button"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: project.color }}
      >
        <FolderGit2 className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[rgb(var(--text))]">
          {project.name}
        </span>
        <span className="block truncate text-xs text-[rgb(var(--text-muted))]">{project.path}</span>
      </span>
      <span className="hidden text-xs text-[rgb(var(--text-subtle))] sm:block">
        {project.lastOpened}
      </span>
      <ArrowRight className="size-4 text-[rgb(var(--text-subtle))] opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

export function HomeScreen() {
  const clearError = useAppStore((state) => state.clearError);
  const error = useAppStore((state) => state.error);
  const navigate = useAppStore((state) => state.navigate);
  const openProject = useAppStore((state) => state.openProject);
  const setError = useAppStore((state) => state.setError);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectIdea, setProjectIdea] = useState('');

  const openFolder = async () => {
    setLoadingAction('open');
    try {
      const folderPath = await window.visualnscode?.fs.openFolder();
      if (folderPath) {
        const name = folderPath.split('/').pop() ?? 'Projeto';
        openProject({
          id: folderPath,
          name,
          path: folderPath,
          lastOpened: 'Agora',
          color: '#8b6af6',
        });
      }
    } catch {
      setError('Não foi possível abrir a pasta.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      <WindowHeader />
      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:py-14">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] px-3 py-1 text-xs text-[rgb(var(--text-muted))]">
                <Sparkles className="size-3.5 text-[rgb(var(--accent))]" />
                Desenvolvimento com clareza
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                O que vamos criar hoje?
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[rgb(var(--text-muted))]">
                Comece algo novo ou continue exatamente de onde parou.
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="size-4" /> Criar projeto
            </Button>
          </div>

          {error ? (
            <div className="mb-6">
              <ErrorNotice message={error} onDismiss={clearError} />
            </div>
          ) : null}
          {loadingAction ? (
            <div className="mb-6">
              <Spinner label="Preparando seu workspace…" />
            </div>
          ) : null}

          <section aria-labelledby="idea-title" className="mb-9">
            <Surface className="p-4 sm:p-5" elevated>
              <label className="block" htmlFor="home-project-idea">
                <span className="text-sm font-semibold text-[rgb(var(--text))]" id="idea-title">
                  Descreva sua ideia
                </span>
                <span className="mt-1 block text-xs text-[rgb(var(--text-muted))]">
                  Nós sugerimos a stack, a estrutura e o melhor ponto de partida.
                </span>
              </label>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-subtle))] focus:border-[rgb(var(--accent))]"
                  id="home-project-idea"
                  onChange={(event) => setProjectIdea(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && projectIdea.trim().length >= 3) {
                      setShowCreateModal(true);
                    }
                  }}
                  placeholder="Quero criar um site para controlar minhas notas escolares."
                  value={projectIdea}
                />
                <Button
                  disabled={projectIdea.trim().length < 3}
                  onClick={() => setShowCreateModal(true)}
                >
                  <Sparkles className="size-4" /> Começar com esta ideia
                </Button>
              </div>
            </Surface>
          </section>

          <section aria-labelledby="start-title">
            <h2
              className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-subtle))]"
              id="start-title"
            >
              Começar
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction
                description="Uma base limpa e guiada"
                icon={Plus}
                label="Novo projeto"
                onClick={() => setShowCreateModal(true)}
              />
              <QuickAction
                description="Trabalhe em uma pasta local"
                icon={FolderOpen}
                label="Abrir pasta"
                onClick={() => void openFolder()}
              />
              <QuickAction
                description="Disponível ao conectar o GitHub"
                icon={GitFork}
                label="Clonar do GitHub"
                onClick={() =>
                  setError(
                    'A conexão com o GitHub chegará em uma próxima fase. Por enquanto, abra uma pasta local.',
                  )
                }
              />
              <QuickAction
                description="Ferramentas, runtimes e preferências"
                icon={Settings2}
                label="Configurar ambiente"
                onClick={() => navigate('settings')}
              />
            </div>
          </section>

          {showCreateModal ? (
            <CreateProjectModal
              initialDescription={projectIdea}
              onClose={() => setShowCreateModal(false)}
            />
          ) : null}

          <section aria-labelledby="recent-title" className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-subtle))]"
                id="recent-title"
              >
                Projetos recentes
              </h2>
              <Button size="sm" variant="ghost">
                Ver todos
              </Button>
            </div>
            <Surface className="divide-y divide-[rgb(var(--border))] p-2" elevated>
              {demoProjects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </Surface>
          </section>
        </div>
      </main>
    </div>
  );
}
