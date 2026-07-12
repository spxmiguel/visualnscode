import { ChevronRight, Folder, Loader2, X } from 'lucide-react';
import { Button } from '@visualnscode/ui';
import { useEffect, useRef, useState } from 'react';
import type { ProjectTemplate, ScaffoldResult } from '../electron.d';
import { useAppStore } from '../store';

interface Props {
  readonly onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full Stack',
  other: 'Outro',
};

export function CreateProjectModal({ onClose }: Props) {
  const openProject = useAppStore((s) => s.openProject);
  const [step, setStep] = useState<'template' | 'config' | 'creating'>('template');
  const [templates, setTemplates] = useState<readonly ProjectTemplate[]>([]);
  const [selected, setSelected] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void window.visualnscode?.scaffold.templates().then(setTemplates);
    const offLog = window.visualnscode?.scaffold.onLog((msg) => setLogs((prev) => [...prev, msg]));
    const offDone = window.visualnscode?.scaffold.onDone((result) => {
      const r = result as ScaffoldResult;
      if (r.success) {
        openProject({ id: r.path, name: projectName, path: r.path, lastOpened: 'Agora', color: '#7C5CFC' });
        onClose();
      }
    });
    return () => { offLog?.(); offDone?.(); };
  }, [openProject, projectName, onClose]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const chooseDir = async () => {
    const dir = await window.visualnscode?.scaffold.chooseDir();
    if (dir) setProjectPath(dir);
  };

  const create = () => {
    if (!selected || !projectName || !projectPath) return;
    setStep('creating');
    window.visualnscode?.scaffold.create(selected.id, projectPath + '/' + projectName, projectName);
  };

  const grouped = templates.reduce<Record<string, ProjectTemplate[]>>((acc, t) => {
    const cat = t.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(t);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-2xl" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
          <h2 className="text-base font-semibold">
            {step === 'template' ? 'Novo projeto' : step === 'config' ? `Configurar — ${selected?.name}` : 'Criando projeto…'}
          </h2>
          <button className="rounded-md p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-hover))]" onClick={onClose} type="button">
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {step === 'template' ? (
            <div className="space-y-5">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((t) => (
                      <button
                        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition hover:border-[rgb(var(--accent))] ${selected?.id === t.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))]'}`}
                        key={t.id}
                        onClick={() => setSelected(t)}
                        type="button"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[rgb(var(--text))]">{t.name}</p>
                          <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">{t.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {t.tags.map((tag) => (
                              <span className="rounded px-1.5 py-0.5 text-[10px] bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-muted))]" key={tag}>{tag}</span>
                            ))}
                          </div>
                        </div>
                        {selected?.id === t.id ? <ChevronRight className="mt-0.5 size-4 shrink-0 text-[rgb(var(--accent))]" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : step === 'config' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[rgb(var(--text-muted))]" htmlFor="proj-name">Nome do projeto</label>
                <input
                  className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--accent))]"
                  id="proj-name"
                  onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '-'))}
                  placeholder="meu-projeto"
                  type="text"
                  value={projectName}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[rgb(var(--text-muted))]" htmlFor="proj-path">Pasta pai</label>
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--accent))]"
                    id="proj-path"
                    onChange={(e) => setProjectPath(e.target.value)}
                    placeholder="~/Projetos"
                    type="text"
                    value={projectPath}
                  />
                  <Button onClick={() => void chooseDir()} size="sm" variant="secondary">
                    <Folder className="size-3.5" /> Escolher
                  </Button>
                </div>
                {projectPath && projectName ? (
                  <p className="mt-1.5 text-xs text-[rgb(var(--text-subtle))]">Será criado em: {projectPath}/{projectName}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="font-mono text-xs text-[rgb(var(--text-muted))]">
              {logs.map((log, i) => (
                <p className="mb-1" key={i}>{log}</p>
              ))}
              {logs.length === 0 ? <Loader2 className="size-4 animate-spin text-[rgb(var(--accent))]" /> : null}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[rgb(var(--border))] px-5 py-3">
          {step === 'template' ? (
            <>
              <Button onClick={onClose} variant="secondary">Cancelar</Button>
              <Button disabled={!selected} onClick={() => setStep('config')}>Próximo</Button>
            </>
          ) : step === 'config' ? (
            <>
              <Button onClick={() => setStep('template')} variant="secondary">Voltar</Button>
              <Button disabled={!projectName || !projectPath} onClick={create}>Criar projeto</Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
