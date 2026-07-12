import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Button, ErrorNotice, SegmentedControl, Surface } from '@visualnscode/ui';
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
  { title: 'Node.js', subtitle: 'Runtime JavaScript', tools: ['node'] },
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
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs ${index === stepIndex ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : index < stepIndex ? 'text-[rgb(var(--text-muted))]' : 'text-[rgb(var(--text-subtle))]'}`}
              key={item.title}
              onClick={() => setStepIndex(index)}
              type="button"
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full text-[10px] ${index < stepIndex ? 'bg-emerald-500 text-white' : 'border border-current'}`}
              >
                {index < stepIndex ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </nav>
        <div className="rounded-xl border border-[rgb(var(--border))] p-3 text-[10px] leading-4 text-[rgb(var(--text-subtle))]">
          <ShieldCheck className="mb-2 size-4 text-emerald-500" />
          Nenhum comando de instalação roda sem sua confirmação.
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
              Entrar no VisualnsCode <Sparkles className="size-4" />
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
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
                  className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] p-4"
                  key={permission.id}
                >
                  <input
                    checked={permission.granted}
                    className="mt-1 accent-violet-500"
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

const welcomeCards = [
  { icon: ShieldCheck, label: 'Seguro', text: 'Confirmação antes de instalar' },
  { icon: Settings2, label: 'Guiado', text: 'Erros em linguagem simples' },
  { icon: Bot, label: 'Flexível', text: 'IA e agentes opcionais' },
] as const;

function Welcome() {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-xl shadow-violet-500/20">
        <Sparkles className="size-7" />
      </div>
      <h1 className="mt-7 text-3xl font-semibold tracking-tight">Seu ambiente, sem complicação.</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[rgb(var(--text-muted))]">
        Vamos verificar as ferramentas do seu computador e explicar cada escolha. Você pode ignorar
        qualquer etapa e voltar depois.
      </p>
      <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-3">
        {welcomeCards.map(({ icon: Icon, label, text }) => (
          <Surface className="p-4" key={label}>
            <Icon className="size-5 text-[rgb(var(--accent))]" />
            <p className="mt-3 text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{text}</p>
          </Surface>
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
      <h1 className="text-center text-2xl font-semibold">Como você prefere trabalhar?</h1>
      <div className="mx-auto mt-8 flex justify-center">
        <SegmentedControl
          label="Modo inicial"
          onChange={setMode}
          options={[
            { label: 'Simples', value: 'simple' },
            { label: 'Avançado', value: 'advanced' },
          ]}
          value={mode}
        />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Surface className={`p-6 ${mode === 'simple' ? 'ring-2 ring-[rgb(var(--accent))]' : ''}`}>
          <Sparkles className="size-5 text-violet-500" />
          <h2 className="mt-4 font-semibold">Simples</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
            Arquivos importantes, editor, chat, preview e ações essenciais.
          </p>
        </Surface>
        <Surface className={`p-6 ${mode === 'advanced' ? 'ring-2 ring-[rgb(var(--accent))]' : ''}`}>
          <Settings2 className="size-5 text-violet-500" />
          <h2 className="mt-4 font-semibold">Avançado</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
            Terminal, Git, logs, agentes, modelos e permissões detalhadas.
          </p>
        </Surface>
      </div>
    </div>
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
    <div className="py-8 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
        <Check className="size-8" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold">Configuração concluída</h1>
      <p className="mt-3 text-sm text-[rgb(var(--text-muted))]">
        Você pode refazer esta verificação nas configurações.
      </p>
      <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3">
        <Surface className="p-4">
          <p className="text-2xl font-semibold">{counts.installed}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">instaladas</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-2xl font-semibold">{counts.checked}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">verificadas</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-2xl font-semibold">{counts.ignored}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">ignoradas</p>
        </Surface>
      </div>
      <p className="mt-6 text-xs text-[rgb(var(--text-subtle))]">
        Modo escolhido: {mode === 'simple' ? 'simples' : 'avançado'}
      </p>
    </div>
  );
}
