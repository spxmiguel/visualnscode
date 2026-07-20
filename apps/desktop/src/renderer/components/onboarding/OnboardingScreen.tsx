import { Check, ChevronLeft, ChevronRight, KeyRound, ShieldCheck, Wrench } from 'lucide-react';
import { Button, ErrorNotice, Surface } from '@visualnscode/ui';
import { useEffect, useMemo, useState } from 'react';
import {
  toolCatalog,
  type PermissionState,
  type ToolDetectionResult,
} from '@visualnscode/integrations/browser';
import { environmentApi } from '../../environment-api';
import { useAppStore } from '../../store';
import { AppMark } from '../AppMark';
import { FirebaseSetup } from './FirebaseSetup';
import { GitHubSetup } from './GitHubSetup';
import { ProviderSetup } from './ProviderSetup';
import { ToolCard } from './ToolCard';
import { SupabaseSetup } from './SupabaseSetup';
import { VercelSetup } from './VercelSetup';

const steps = [
  { title: 'Boas-vindas', subtitle: 'Vamos preparar seu computador', tools: [] },
  { title: 'Seu modo', subtitle: 'Escolha o nível de detalhe', tools: [] },
  { title: 'Git', subtitle: 'Controle de versão', tools: ['git'] },
  { title: 'GitHub', subtitle: 'Conta e repositórios', tools: ['github'] },
  { title: 'Node.js', subtitle: 'Runtimes JavaScript e Python', tools: ['node', 'python'] },
  {
    title: 'Gerenciadores',
    subtitle: 'pnpm, npm, yarn e bun',
    tools: ['pnpm', 'npm', 'yarn', 'bun'],
  },
  { title: 'Firebase', subtitle: 'CLI e projetos', tools: ['firebase'] },
  { title: 'Vercel', subtitle: 'CLI e deploys', tools: ['vercel'] },
  { title: 'Supabase', subtitle: 'CLI e ambiente local', tools: ['supabase', 'docker'] },
  {
    title: 'Provedores de IA',
    subtitle: 'Serviços locais e credenciais',
    tools: ['ollama', 'lm-studio'],
  },
  {
    title: 'Agentes',
    subtitle: 'CLIs de desenvolvimento',
    tools: ['claude', 'codex', 'gemini', 'aider', 'opencode'],
  },
  { title: 'Tudo pronto', subtitle: 'Revise seu ambiente', tools: [] },
] as const;

export function OnboardingScreen() {
  const complete = useAppStore((state) => state.completeOnboarding);
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<Record<string, ToolDetectionResult>>({});
  const [ignored, setIgnored] = useState<readonly string[]>([]);
  const [busyTool, setBusyTool] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissions, setPermissions] = useState<readonly PermissionState[]>([]);
  const step = steps[stepIndex] ?? steps[0];

  useEffect(() => {
    void environmentApi.permissions().then(setPermissions);
  }, []);
  useEffect(() => {
    if (step.tools.length === 0) return;
    let active = true;
    const detect = async () => {
      setBusyTool('all');
      const detected = await Promise.all(step.tools.map((id) => environmentApi.detect(id)));
      if (active) {
        setResults((current) => ({
          ...current,
          ...Object.fromEntries(detected.map((item) => [item.id, item])),
        }));
        setBusyTool(null);
      }
    };
    void detect().catch(() => {
      if (active) {
        setError(
          'Não consegui verificar estas ferramentas. Você pode tentar novamente ou continuar.',
        );
        setBusyTool(null);
      }
    });
    return () => {
      active = false;
    };
  }, [step]);

  const counts = useMemo(
    () => ({
      installed: Object.values(results).filter(({ installed }) => installed).length,
      checked: Object.keys(results).length,
      ignored: ignored.length,
    }),
    [ignored, results],
  );

  const act = async (toolId: string, action: 'install' | 'test' | 'docs' | 'ignore') => {
    setError(null);
    if (action === 'ignore') {
      setIgnored((items) => (items.includes(toolId) ? items : [...items, toolId]));
      return;
    }
    if (action === 'docs') {
      const opened = await environmentApi.openDocumentation(toolId);
      if (!opened) setError('Abra esta documentação pelo aplicativo desktop.');
      return;
    }
    if (action === 'install') {
      setConfirmation(toolId);
      return;
    }
    setBusyTool(toolId);
    const result = await environmentApi.detect(toolId);
    setResults((current) => ({ ...current, [toolId]: result }));
    setBusyTool(null);
  };

  const confirmInstall = async () => {
    if (!confirmation) return;
    let current = permissions;
    if (!current.find(({ id }) => id === 'install-dependencies')?.granted)
      current = await environmentApi.setPermission('install-dependencies', true);
    setPermissions(current);
    setBusyTool(confirmation);
    const toolId = confirmation;
    setConfirmation(null);
    const result = await environmentApi.perform({ action: 'install', confirmed: true, toolId });
    if (!result.ok) setError(result.message);
    else
      setResults((state) => ({
        ...state,
        [toolId]: {
          id: toolId,
          installed: true,
          message: result.message,
          path: null,
          status: 'installed',
          version: null,
        },
      }));
    setBusyTool(null);
  };

  return (
    <div className="flex h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      <aside className="hidden w-64 shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] p-4 lg:flex lg:flex-col">
        <AppMark />
        <nav className="mt-8 min-h-0 flex-1 overflow-auto" aria-label="Etapas da configuração">
          {steps.map((item, index) => (
            <button
              className={`mb-px flex w-full items-center gap-3 border-l-2 px-3 py-2 text-left text-xs transition ${index === stepIndex ? 'border-[rgb(var(--accent))] bg-[rgb(var(--surface-hover))] text-[rgb(var(--text))]' : index < stepIndex ? 'border-transparent text-[rgb(var(--text-muted))]' : 'border-transparent text-[rgb(var(--text-subtle))]'}`}
              key={item.title}
              onClick={() => setStepIndex(index)}
              type="button"
            >
              <span
                className={`flex size-5 items-center justify-center font-mono text-[9px] ${index < stepIndex ? 'text-emerald-500' : 'text-current'}`}
              >
                {index < stepIndex ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-[rgb(var(--border))] pt-4 text-[10px] leading-4 text-[rgb(var(--text-subtle))]">
          <span className="mb-2 flex items-center gap-2 font-mono uppercase tracking-wider text-[rgb(var(--text-muted))]">
            <ShieldCheck className="size-3.5 text-emerald-500" /> Segurança
          </span>
          Instalações só começam depois da sua confirmação.
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[rgb(var(--border))] px-5">
          <div>
            <p className="text-sm font-semibold">{step.title}</p>
            <p className="text-[11px] text-[rgb(var(--text-muted))]">
              Etapa {stepIndex + 1} de {steps.length} · {step.subtitle}
            </p>
          </div>
          <Button onClick={() => setPermissionsOpen(true)} size="sm" variant="secondary">
            <ShieldCheck className="size-3.5" /> Permissões
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl">
            {error ? (
              <div className="mb-5">
                <ErrorNotice message={error} onDismiss={() => setError(null)} />
              </div>
            ) : null}
            {stepIndex === 0 ? <Welcome /> : null}
            {stepIndex === 1 ? <ModeChoice mode={mode} setMode={setMode} /> : null}
            {step.tools.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {step.tools.map((toolId) => (
                  <ToolCard
                    busy={busyTool === toolId || busyTool === 'all'}
                    ignored={ignored.includes(toolId)}
                    key={toolId}
                    onAction={(action) => void act(toolId, action)}
                    result={results[toolId]}
                    toolId={toolId}
                  />
                ))}
              </div>
            ) : null}
            {stepIndex === 9 ? <ProviderNotice /> : null}
            {stepIndex === 9 ? <ProviderSetup /> : null}
            {stepIndex === 3 ? <GitHubSetup /> : null}
            {stepIndex === 6 ? <FirebaseSetup /> : null}
            {stepIndex === 7 ? <VercelSetup /> : null}
            {stepIndex === 8 ? <SupabaseSetup /> : null}
            {stepIndex === 11 ? <Summary counts={counts} mode={mode} /> : null}
          </div>
        </div>
        <footer className="flex h-16 shrink-0 items-center justify-between border-t border-[rgb(var(--border))] px-5">
          <Button
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            variant="ghost"
          >
            <ChevronLeft className="size-4" /> Voltar
          </Button>
          <div className="text-xs text-[rgb(var(--text-subtle))]">
            {Math.round(((stepIndex + 1) / steps.length) * 100)}%
          </div>
          {stepIndex === steps.length - 1 ? (
            <Button onClick={complete}>
              Entrar no VisualnsCode <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}>
              Continuar <ChevronRight className="size-4" />
            </Button>
          )}
        </footer>
      </main>
      {confirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Surface className="max-w-md p-6" elevated>
            <div className="flex size-9 items-center justify-center border border-amber-500/40 text-amber-500">
              <Wrench className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Confirmar instalação</h2>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
              O VisualnsCode executará somente a receita documentada para instalar{' '}
              <strong>{toolCatalog.find(({ id }) => id === confirmation)?.name}</strong>. Esta ação
              altera ferramentas globais e poderá ser cancelada se exigir privilégios
              administrativos.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setConfirmation(null)} variant="ghost">
                Cancelar
              </Button>
              <Button onClick={() => void confirmInstall()}>Confirmar e instalar</Button>
            </div>
          </Surface>
        </div>
      ) : null}
      {permissionsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
          <div className="h-full w-full max-w-md overflow-auto bg-[rgb(var(--surface))] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Permissões</h2>
                <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                  Você pode revogar a qualquer momento.
                </p>
              </div>
              <Button onClick={() => setPermissionsOpen(false)} variant="ghost">
                Fechar
              </Button>
            </div>
            <div className="mt-6 space-y-3">
              {permissions.map((permission) => (
                <label
                  className="flex items-start gap-3 rounded-md border border-[rgb(var(--border))] p-4"
                  key={permission.id}
                >
                  <input
                    checked={permission.granted}
                    className="mt-1 accent-[rgb(var(--accent))]"
                    onChange={(event) =>
                      void environmentApi
                        .setPermission(permission.id, event.target.checked)
                        .then(setPermissions)
                    }
                    type="checkbox"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {permission.name}
                      {permission.sensitive ? <KeyRound className="size-3 text-amber-500" /> : null}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[rgb(var(--text-muted))]">
                      {permission.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const welcomeRows = [
  { code: '01', label: 'Instalações', text: 'Sempre pedem confirmação' },
  { code: '02', label: 'Diagnóstico', text: 'Explica o problema antes de agir' },
  { code: '03', label: 'Serviços externos', text: 'São opcionais e configurados por você' },
] as const;

function Welcome() {
  return (
    <div className="py-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
        Setup / 01
      </p>
      <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em]">
        Seu ambiente, sem complicação.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgb(var(--text-muted))]">
        Vamos verificar as ferramentas do seu computador e explicar cada escolha. Você pode ignorar
        qualquer etapa e voltar depois.
      </p>
      <div className="mt-8 max-w-2xl border-y border-[rgb(var(--border))]">
        {welcomeRows.map(({ code, label, text }) => (
          <div
            className="grid grid-cols-[32px_1fr] gap-3 border-b border-[rgb(var(--border))] py-4 last:border-b-0 sm:grid-cols-[32px_160px_1fr]"
            key={label}
          >
            <span className="font-mono text-[10px] text-[rgb(var(--accent))]">{code}</span>
            <p className="text-sm font-medium">{label}</p>
            <p className="col-start-2 text-xs text-[rgb(var(--text-muted))] sm:col-start-auto">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
function ModeChoice({
  mode,
  setMode,
}: {
  readonly mode: 'simple' | 'advanced';
  readonly setMode: (mode: 'simple' | 'advanced') => void;
}) {
  return (
    <div className="py-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
        Preferência / Interface
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Como você prefere trabalhar?</h1>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
        Esta escolha só muda o nível de detalhe visível e pode ser alterada depois.
      </p>
      <div className="mt-8 border-y border-[rgb(var(--border))]">
        <ModeRow
          active={mode === 'simple'}
          description="Arquivos importantes, editor, chat, preview e ações essenciais."
          index="01"
          label="Simples"
          onClick={() => setMode('simple')}
        />
        <ModeRow
          active={mode === 'advanced'}
          description="Terminal, Git, logs, agentes, modelos e permissões detalhadas."
          index="02"
          label="Avançado"
          onClick={() => setMode('advanced')}
        />
      </div>
    </div>
  );
}

function ModeRow({
  active,
  description,
  index,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly description: string;
  readonly index: string;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`grid w-full grid-cols-[32px_1fr_auto] items-center gap-3 border-b border-[rgb(var(--border))] px-3 py-5 text-left transition last:border-b-0 ${active ? 'bg-[rgb(var(--surface-hover))]' : 'hover:bg-[rgb(var(--surface-raised))]'}`}
      onClick={onClick}
      type="button"
    >
      <span className="font-mono text-[10px] text-[rgb(var(--accent))]">{index}</span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs text-[rgb(var(--text-muted))]">{description}</span>
      </span>
      <span
        aria-hidden
        className={`size-3 rounded-full border ${active ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]' : 'border-[rgb(var(--border-strong))]'}`}
      />
    </button>
  );
}
function ProviderNotice() {
  return (
    <Surface className="mt-4 flex gap-3 p-4">
      <KeyRound className="size-5 shrink-0 text-emerald-500" />
      <div>
        <p className="text-sm font-semibold">Credenciais protegidas</p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
          Quando providers remotos forem conectados, segredos serão criptografados pelo cofre do
          sistema operacional. Tokens nunca entram no estado do renderer ou em logs.
        </p>
      </div>
    </Surface>
  );
}
function Summary({
  counts,
  mode,
}: {
  readonly counts: { installed: number; checked: number; ignored: number };
  readonly mode: string;
}) {
  return (
    <div className="py-8">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-500">
        <Check className="size-3.5" /> Verificação concluída
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">Configuração concluída</h1>
      <p className="mt-3 text-sm text-[rgb(var(--text-muted))]">
        Você pode refazer esta verificação nas configurações.
      </p>
      <div className="mt-8 grid max-w-xl grid-cols-3 border-y border-[rgb(var(--border))]">
        <div className="border-r border-[rgb(var(--border))] py-4">
          <p className="text-2xl font-semibold">{counts.installed}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">instaladas</p>
        </div>
        <div className="border-r border-[rgb(var(--border))] px-4 py-4">
          <p className="text-2xl font-semibold">{counts.checked}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">verificadas</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-2xl font-semibold">{counts.ignored}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">ignoradas</p>
        </div>
      </div>
      <p className="mt-6 text-xs text-[rgb(var(--text-subtle))]">
        Modo escolhido: {mode === 'simple' ? 'simples' : 'avançado'}
      </p>
    </div>
  );
}
