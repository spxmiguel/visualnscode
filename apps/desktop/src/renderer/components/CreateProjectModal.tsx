import {
  Check,
  ChevronRight,
  CircleAlert,
  Folder,
  Loader2,
  Sparkles,
  TerminalSquare,
  X,
} from 'lucide-react';
import { Button } from '@visualnscode/ui';
import { useEffect, useMemo, useState } from 'react';
import type {
  ProjectCreationOptions,
  ProjectCreationResult,
  ProjectIntegration,
  ProjectProgressEvent,
  ProjectSuggestion,
  ProjectTemplate,
} from '../../shared/project-creation';
import { useAppStore } from '../store';

interface Props {
  readonly initialDescription?: string;
  readonly onClose: () => void;
}

type Step = 'idea' | 'template' | 'config' | 'creating';

const CATEGORY_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full stack',
  other: 'Outros',
};

const FIELD_CLASS =
  'w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--accent))]';

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

export function CreateProjectModal({ initialDescription = '', onClose }: Props) {
  const openProject = useAppStore((state) => state.openProject);
  const [step, setStep] = useState<Step>('idea');
  const [description, setDescription] = useState(initialDescription);
  const [templates, setTemplates] = useState<readonly ProjectTemplate[]>([]);
  const [suggestion, setSuggestion] = useState<ProjectSuggestion | null>(null);
  const [selected, setSelected] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [installDependencies, setInstallDependencies] = useState(true);
  const [initializeGit, setInitializeGit] = useState(true);
  const [createGithub, setCreateGithub] = useState(false);
  const [githubConfirmed, setGithubConfirmed] = useState(false);
  const [githubVisibility, setGithubVisibility] = useState<'private' | 'public'>('private');
  const [integration, setIntegration] = useState<ProjectIntegration>('none');
  const [integrationConfirmed, setIntegrationConfirmed] = useState(false);
  const [startAfterCreate, setStartAfterCreate] = useState(true);
  const [progress, setProgress] = useState<readonly ProjectProgressEvent[]>([]);
  const [result, setResult] = useState<ProjectCreationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    void window.visualnscode?.scaffold.templates().then(setTemplates);
    return window.visualnscode?.scaffold.onProgress((event) => {
      setProgress((current) => [...current, event]);
    });
  }, []);

  const grouped = useMemo(
    () =>
      templates.reduce<Record<string, ProjectTemplate[]>>((groups, template) => {
        (groups[template.category] ??= []).push(template);
        return groups;
      }, {}),
    [templates],
  );

  const recommend = async () => {
    if (description.trim().length < 3) return;
    setSuggesting(true);
    setError(null);
    try {
      const next = await window.visualnscode?.scaffold.suggest(description.trim());
      if (!next) throw new Error('O criador de projetos não está disponível.');
      const template = templates.find(({ id }) => id === next.templateId) ?? null;
      setSuggestion(next);
      setSelected(template);
      setProjectName(next.name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível analisar a ideia.');
    } finally {
      setSuggesting(false);
    }
  };

  const chooseDir = async () => {
    const directory = await window.visualnscode?.scaffold.chooseDir();
    if (directory) setProjectPath(directory);
  };

  const create = async () => {
    if (!selected || !projectName || !projectPath) return;
    const options: ProjectCreationOptions = {
      description,
      templateId: selected.id,
      parentPath: projectPath,
      projectName,
      installDependencies,
      initializeGit,
      github: {
        enabled: createGithub,
        confirmed: createGithub && githubConfirmed,
        visibility: githubVisibility,
      },
      integration,
      integrationConfirmed: integration !== 'none' && integrationConfirmed,
      startAfterCreate,
    };
    setStep('creating');
    setProgress([]);
    setResult(null);
    setError(null);
    try {
      const next = await window.visualnscode?.scaffold.create(options);
      if (!next) throw new Error('O criador de projetos não está disponível.');
      setResult(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar o projeto.');
    }
  };

  const openCreatedProject = () => {
    if (!result?.success) return;
    openProject({
      id: result.path,
      name: projectName,
      path: result.path,
      lastOpened: 'Agora',
      color: '#7c5cfc',
    });
    if (result.runCommand) {
      window.setTimeout(() => {
        window.visualnscode?.runner.start('workspace-dev-server', 'dev');
      }, 250);
    }
    onClose();
  };

  const externalConfirmationMissing =
    (createGithub && !githubConfirmed) || (integration !== 'none' && !integrationConfirmed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[rgb(var(--text))]">Criar projeto</h2>
            <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
              {step === 'idea' && 'Conte sua ideia em linguagem normal.'}
              {step === 'template' && 'Confira ou troque a tecnologia sugerida.'}
              {step === 'config' && 'Escolha onde e como preparar o projeto.'}
              {step === 'creating' && 'Acompanhe cada etapa sem perder os detalhes técnicos.'}
            </p>
          </div>
          <button
            aria-label="Fechar criador de projeto"
            className="rounded-md p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-hover))]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {step === 'idea' ? (
            <div className="mx-auto max-w-2xl space-y-4">
              <label className="block" htmlFor="project-description">
                <span className="mb-2 block text-sm font-medium text-[rgb(var(--text))]">
                  O que você quer construir?
                </span>
                <textarea
                  autoFocus
                  className={`${FIELD_CLASS} min-h-28 resize-y leading-6`}
                  id="project-description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Quero criar um site para controlar minhas notas escolares."
                  value={description}
                />
              </label>
              {error ? (
                <p className="flex items-center gap-2 text-sm text-red-400">
                  <CircleAlert className="size-4" /> {error}
                </p>
              ) : null}
              {suggestion ? (
                <div className="rounded-xl border border-[rgb(var(--accent))]/40 bg-[rgb(var(--accent-soft))] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="size-4 text-[rgb(var(--accent))]" />
                    <p className="text-sm font-semibold">Sugestão para {suggestion.name}</p>
                  </div>
                  <dl className="grid gap-x-5 gap-y-3 text-xs sm:grid-cols-2">
                    {[
                      ['Stack', suggestion.stack],
                      ['Banco', suggestion.database],
                      ['Autenticação', suggestion.authentication],
                      ['Deploy', suggestion.deployment],
                      ['Agente', suggestion.recommendedAgent],
                      ['Estrutura', suggestion.structure.join(', ')],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-[rgb(var(--text-subtle))]">{label}</dt>
                        <dd className="mt-0.5 text-[rgb(var(--text))]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          ) : step === 'template' ? (
            <div className="space-y-5">
              {Object.entries(grouped).map(([category, items]) => (
                <section key={category}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
                    {CATEGORY_LABELS[category] ?? category}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((template) => (
                      <button
                        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition hover:border-[rgb(var(--accent))] ${selected?.id === template.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))]'}`}
                        key={template.id}
                        onClick={() => setSelected(template)}
                        type="button"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--text))]">
                            {template.name}
                            <span className="text-[10px] font-normal text-[rgb(var(--text-subtle))]">
                              v{template.version}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-[rgb(var(--text-muted))]">
                            {template.description}
                          </span>
                        </span>
                        {selected?.id === template.id ? (
                          <ChevronRight className="mt-0.5 size-4 shrink-0 text-[rgb(var(--accent))]" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : step === 'config' ? (
            <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <label
                  className="block text-xs font-medium text-[rgb(var(--text-muted))]"
                  htmlFor="project-name"
                >
                  Nome do projeto
                  <input
                    className={`${FIELD_CLASS} mt-1`}
                    id="project-name"
                    onChange={(event) => setProjectName(slug(event.target.value))}
                    placeholder="meu-projeto"
                    value={projectName}
                  />
                </label>
                <div>
                  <label
                    className="text-xs font-medium text-[rgb(var(--text-muted))]"
                    htmlFor="project-path"
                  >
                    Pasta onde ele será criado
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      className={FIELD_CLASS}
                      id="project-path"
                      onChange={(event) => setProjectPath(event.target.value)}
                      placeholder="/Users/voce/Projetos"
                      value={projectPath}
                    />
                    <Button onClick={() => void chooseDir()} size="sm" variant="secondary">
                      <Folder className="size-3.5" /> Escolher
                    </Button>
                  </div>
                </div>
                <label
                  className="block text-xs font-medium text-[rgb(var(--text-muted))]"
                  htmlFor="integration"
                >
                  Configuração opcional
                  <select
                    className={`${FIELD_CLASS} mt-1`}
                    id="integration"
                    onChange={(event) => {
                      setIntegration(event.target.value as ProjectIntegration);
                      setIntegrationConfirmed(false);
                    }}
                    value={integration}
                  >
                    <option value="none">Nenhum serviço</option>
                    <option value="firebase">Firebase</option>
                    <option value="supabase">Supabase</option>
                    <option value="vercel">Vercel</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-4 text-sm">
                <p className="font-medium">O VisualnsCode pode cuidar de:</p>
                {[
                  [installDependencies, setInstallDependencies, 'Instalar bibliotecas'],
                  [initializeGit, setInitializeGit, 'Salvar a primeira versão com Git'],
                  [createGithub, setCreateGithub, 'Criar repositório no GitHub'],
                  [startAfterCreate, setStartAfterCreate, 'Executar e abrir o preview'],
                ].map(([checked, setter, label]) => (
                  <label
                    className="flex items-center gap-2 text-[rgb(var(--text-muted))]"
                    key={label as string}
                  >
                    <input
                      checked={checked as boolean}
                      onChange={(event) =>
                        (setter as (value: boolean) => void)(event.target.checked)
                      }
                      type="checkbox"
                    />
                    {label as string}
                  </label>
                ))}
                {createGithub ? (
                  <div className="space-y-2 border-t border-[rgb(var(--border))] pt-3">
                    <select
                      aria-label="Visibilidade do repositório"
                      className={FIELD_CLASS}
                      onChange={(event) =>
                        setGithubVisibility(event.target.value as 'private' | 'public')
                      }
                      value={githubVisibility}
                    >
                      <option value="private">Repositório privado</option>
                      <option value="public">Repositório público</option>
                    </select>
                    <label className="flex items-start gap-2 text-xs text-[rgb(var(--text-muted))]">
                      <input
                        checked={githubConfirmed}
                        onChange={(event) => setGithubConfirmed(event.target.checked)}
                        type="checkbox"
                      />
                      Confirmo a criação de um repositório externo. O código não será enviado
                      automaticamente.
                    </label>
                  </div>
                ) : null}
                {integration !== 'none' ? (
                  <label className="flex items-start gap-2 border-t border-[rgb(var(--border))] pt-3 text-xs text-[rgb(var(--text-muted))]">
                    <input
                      checked={integrationConfirmed}
                      onChange={(event) => setIntegrationConfirmed(event.target.checked)}
                      type="checkbox"
                    />
                    Confirmo a configuração de {integration}. Nenhum deploy de produção será feito.
                  </label>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-2">
              {progress.map((event, index) => (
                <div
                  className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-3"
                  key={`${event.timestamp}-${index}`}
                >
                  <div className="flex items-start gap-3">
                    {event.status === 'running' ? (
                      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[rgb(var(--accent))]" />
                    ) : event.status === 'error' ? (
                      <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-400" />
                    ) : (
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[rgb(var(--text))]">{event.message}</p>
                      {event.technicalDetails ? (
                        <details className="mt-1.5">
                          <summary className="cursor-pointer text-xs text-[rgb(var(--text-subtle))]">
                            Ver detalhes técnicos
                          </summary>
                          <code className="mt-2 block overflow-x-auto rounded bg-[rgb(var(--background))] p-2 text-xs text-[rgb(var(--text-muted))]">
                            {event.technicalDetails}
                          </code>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {!result && !error ? (
                <p className="py-4 text-center text-xs text-[rgb(var(--text-subtle))]">
                  Isso pode levar alguns minutos.
                </p>
              ) : null}
              {error ? (
                <p className="flex items-center gap-2 text-sm text-red-400">
                  <CircleAlert className="size-4" /> {error}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border))] px-5 py-3">
          <span className="text-xs text-[rgb(var(--text-subtle))]">
            {selected
              ? `${selected.name} · template ${selected.version}`
              : 'Nada será publicado sem confirmação.'}
          </span>
          <div className="flex gap-2">
            {step === 'idea' ? (
              <>
                <Button onClick={() => setStep('template')} variant="secondary">
                  Escolher manualmente
                </Button>
                <Button
                  disabled={description.trim().length < 3 || suggesting}
                  onClick={() => void recommend()}
                >
                  {suggesting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Sugerir projeto
                </Button>
                {suggestion ? <Button onClick={() => setStep('template')}>Continuar</Button> : null}
              </>
            ) : step === 'template' ? (
              <>
                <Button onClick={() => setStep('idea')} variant="secondary">
                  Voltar
                </Button>
                <Button disabled={!selected} onClick={() => setStep('config')}>
                  Continuar
                </Button>
              </>
            ) : step === 'config' ? (
              <>
                <Button onClick={() => setStep('template')} variant="secondary">
                  Voltar
                </Button>
                <Button
                  disabled={!projectName || !projectPath || externalConfirmationMissing}
                  onClick={() => void create()}
                >
                  Criar projeto
                </Button>
              </>
            ) : result?.success ? (
              <Button onClick={openCreatedProject}>
                <TerminalSquare className="size-4" /> Abrir projeto
              </Button>
            ) : result || error ? (
              <Button onClick={() => setStep('config')} variant="secondary">
                Revisar configuração
              </Button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
