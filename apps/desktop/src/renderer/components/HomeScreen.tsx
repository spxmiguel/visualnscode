import { ArrowRight, Folder, FolderOpen, GitFork, Plus, Settings2 } from 'lucide-react';
import { Button, ErrorNotice, Spinner, Surface } from '@visualnscode/ui';
import { useState } from 'react';
import { demoProjects, useAppStore, type RecentProject } from '../store';
import { CreateProjectModal } from './CreateProjectModal';
import { WindowHeader } from './WindowHeader';

interface QuickActionProps {
  readonly description: string;
  readonly icon: typeof Plus;
  readonly label: string;
  readonly shortcut: string;
  readonly onClick: () => void;
}

function QuickAction({ description, icon: Icon, label, onClick, shortcut }: QuickActionProps) {
  return (
    <button
      className="group grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[rgb(var(--border))] px-3 py-3 text-left transition last:border-b-0 hover:bg-[rgb(var(--surface-hover))]"
      onClick={onClick}
      type="button"
    >
      <span className="flex size-7 items-center justify-center text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--text))]">
        <Icon className="size-4" strokeWidth={1.7} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[rgb(var(--text))]">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-[rgb(var(--text-muted))]">
          {description}
        </span>
      </span>
      <kbd className="hidden font-mono text-[10px] text-[rgb(var(--text-subtle))] sm:block">
        {shortcut}
      </kbd>
    </button>
  );
}

function ProjectRow({ project }: { readonly project: RecentProject }) {
  const openProject = useAppStore((state) => state.openProject);
  return (
    <button
      className="group grid w-full grid-cols-[20px_minmax(0,1fr)_auto_16px] items-center gap-3 border-b border-[rgb(var(--border))] px-3 py-3 text-left transition last:border-b-0 hover:bg-[rgb(var(--surface-hover))]"
      onClick={() => openProject(project)}
      type="button"
    >
      <Folder className="size-4 text-[rgb(var(--text-subtle))]" strokeWidth={1.7} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[rgb(var(--text))]">
          {project.name}
        </span>
        <span className="block truncate text-xs text-[rgb(var(--text-muted))]">{project.path}</span>
      </span>
      <span className="hidden text-xs text-[rgb(var(--text-subtle))] sm:block">
        {project.lastOpened}
      </span>
      <ArrowRight className="size-3.5 text-[rgb(var(--text-subtle))] opacity-0 transition group-hover:opacity-100" />
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
          color: '#ae5128',
        });
      }
    } catch {
      setError('Não foi possível abrir a pasta.');
    } finally {
      setLoadingAction(null);
    }
  };

  const cloneFromGitHub = async () => {
    const repository = window.prompt('Qual repositório deseja clonar? Use owner/repository.');
    if (!repository) return;
    if (!window.confirm(`Clonar ${repository} para uma pasta escolhida por você?`)) return;
    setLoadingAction('clone');
    try {
      const folderPath = await window.visualnscode?.github.clone(repository.trim(), true);
      if (folderPath) {
        openProject({
          id: folderPath,
          name: folderPath.split(/[\\/]/u).pop() ?? repository.split('/').at(-1) ?? 'Projeto',
          path: folderPath,
          lastOpened: 'Agora',
          color: '#3fa7a0',
        });
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível clonar o repositório. Verifique o GitHub CLI e tente novamente.',
      );
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      <WindowHeader />
      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-6xl px-6 py-9 lg:py-12">
          <div className="mb-9 flex flex-col justify-between gap-5 border-b border-[rgb(var(--border))] pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
                01 / Início
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[38px]">
                Comece um projeto.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--text-muted))]">
                Abra um workspace existente ou descreva o resultado que precisa construir.
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

          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
            <div>
              <section aria-labelledby="idea-title">
                <Surface className="overflow-hidden" elevated>
                  <div className="border-b border-[rgb(var(--border))] px-4 py-3">
                    <label className="block" htmlFor="home-project-idea">
                      <span
                        className="text-xs font-semibold text-[rgb(var(--text))]"
                        id="idea-title"
                      >
                        Criar a partir de uma descrição
                      </span>
                      <span className="mt-1 block text-[11px] text-[rgb(var(--text-muted))]">
                        Você revisa a stack e os arquivos antes da criação.
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-col gap-2 p-3 sm:flex-row">
                    <input
                      className="min-w-0 flex-1 rounded-[5px] border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-subtle))] focus:border-[rgb(var(--accent))]"
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
                      Continuar <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </Surface>
              </section>

              <section aria-labelledby="start-title" className="mt-7">
                <h2
                  className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-subtle))]"
                  id="start-title"
                >
                  Começar
                </h2>
                <Surface className="overflow-hidden" elevated>
                  <QuickAction
                    description="Uma base limpa e guiada"
                    icon={Plus}
                    label="Novo projeto"
                    shortcut="⌘ N"
                    onClick={() => setShowCreateModal(true)}
                  />
                  <QuickAction
                    description="Trabalhe em uma pasta local"
                    icon={FolderOpen}
                    label="Abrir pasta"
                    shortcut="⌘ O"
                    onClick={() => void openFolder()}
                  />
                  <QuickAction
                    description="Baixe um repositório conectado"
                    icon={GitFork}
                    label="Clonar do GitHub"
                    shortcut="GH"
                    onClick={() => void cloneFromGitHub()}
                  />
                  <QuickAction
                    description="Ferramentas, runtimes e preferências"
                    icon={Settings2}
                    label="Configurar ambiente"
                    shortcut="⌘ ,"
                    onClick={() => navigate('settings')}
                  />
                </Surface>
              </section>
            </div>

            {showCreateModal ? (
              <CreateProjectModal
                initialDescription={projectIdea}
                onClose={() => setShowCreateModal(false)}
              />
            ) : null}

            <section aria-labelledby="recent-title">
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
              <Surface className="overflow-hidden" elevated>
                {demoProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </Surface>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
