import { AlertTriangle, Bell, ListChecks, MonitorCog, Palette, ShieldCheck } from 'lucide-react';
import { Button, SegmentedControl, Surface } from '@visualnscode/ui';
import { useAppStore } from '../store';
import { WindowHeader } from './WindowHeader';
import { ModelSettings } from './settings/ModelSettings';

export function SettingsScreen() {
  const mode = useAppStore((state) => state.mode);
  const navigate = useAppStore((state) => state.navigate);
  const setMode = useAppStore((state) => state.setMode);
  const setTheme = useAppStore((state) => state.setTheme);
  const restartOnboarding = useAppStore((state) => state.restartOnboarding);
  const settingsProviderId = useAppStore((state) => state.settingsProviderId);
  const theme = useAppStore((state) => state.theme);
  const yoloEnabled = useAppStore((state) => state.yoloEnabled);
  const yoloGloballyAllowed = useAppStore((state) => state.yoloGloballyAllowed);
  const setYoloEnabled = useAppStore((state) => state.setYoloEnabled);
  const setYoloGloballyAllowed = useAppStore((state) => state.setYoloGloballyAllowed);

  const enableYolo = (): void => {
    const acknowledged = window.confirm(
      'O modo YOLO executa ações não destrutivas que normalmente pediriam confirmação. Comandos perigosos ainda exigem aprovação e comandos extremos continuam bloqueados. Deseja ativar?',
    );
    if (acknowledged) setYoloEnabled(true, true);
  };

  return (
    <div className="flex h-screen flex-col bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      <WindowHeader onBack={() => navigate('home')} showSettings={false} />
      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            Ajuste a experiência sem interromper seu fluxo.
          </p>

          <div className="mt-8 space-y-4">
            <Surface
              className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center"
              elevated
            >
              <div className="flex gap-3">
                <ListChecks className="mt-0.5 size-5 text-[rgb(var(--accent))]" />
                <div>
                  <h2 className="text-sm font-semibold">Assistente de ambiente</h2>
                  <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                    Verifique novamente Git, runtimes, deploys e agentes.
                  </p>
                </div>
              </div>
              <button
                className="rounded-[5px] border border-[rgb(var(--border))] px-3 py-2 text-xs font-medium hover:bg-[rgb(var(--surface-hover))]"
                onClick={restartOnboarding}
                type="button"
              >
                Executar novamente
              </button>
            </Surface>
            <Surface
              className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center"
              elevated
            >
              <div className="flex gap-3">
                <Palette className="mt-0.5 size-5 text-[rgb(var(--accent))]" />
                <div>
                  <h2 className="text-sm font-semibold">Aparência</h2>
                  <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                    Siga automaticamente o computador ou escolha uma preferência fixa.
                  </p>
                </div>
              </div>
              <SegmentedControl
                label="Tema"
                onChange={setTheme}
                options={[
                  { label: 'Sistema', value: 'system' },
                  { label: 'Escuro', value: 'dark' },
                  { label: 'Claro', value: 'light' },
                ]}
                value={theme}
              />
            </Surface>

            <Surface
              className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center"
              elevated
            >
              <div className="flex gap-3">
                <MonitorCog className="mt-0.5 size-5 text-[rgb(var(--accent))]" />
                <div>
                  <h2 className="text-sm font-semibold">Nível da interface</h2>
                  <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                    Revele controles técnicos quando precisar.
                  </p>
                </div>
              </div>
              <SegmentedControl
                label="Modo da interface"
                onChange={setMode}
                options={[
                  { label: 'Simples', value: 'simple' },
                  { label: 'Avançado', value: 'advanced' },
                ]}
                value={mode}
              />
            </Surface>

            <ModelSettings initialProviderId={settingsProviderId ?? undefined} />

            <Surface
              className={`flex flex-col gap-5 p-5 ${yoloEnabled ? 'border-amber-500/50' : ''}`}
              elevated
            >
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 text-amber-500" />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold">Modo YOLO</h2>
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
                    Reduz confirmações para ações não destrutivas. Comandos perigosos continuam
                    pedindo aprovação e operações extremas permanecem bloqueadas.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--border))] pt-4">
                <label className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
                  <input
                    checked={yoloGloballyAllowed}
                    className="accent-[rgb(var(--accent))]"
                    onChange={(event) => setYoloGloballyAllowed(event.target.checked)}
                    type="checkbox"
                  />
                  Permitir modo YOLO neste dispositivo
                </label>
                {yoloEnabled ? (
                  <Button onClick={() => setYoloEnabled(false)} size="sm" variant="secondary">
                    Desativar YOLO
                  </Button>
                ) : (
                  <Button disabled={!yoloGloballyAllowed} onClick={enableYolo} size="sm">
                    Ativar com confirmação
                  </Button>
                )}
              </div>
            </Surface>

            {[
              {
                icon: ShieldCheck,
                title: 'Permissões',
                text: 'Nenhuma permissão local adicional foi concedida.',
              },
              {
                icon: Bell,
                title: 'Notificações',
                text: 'Somente avisos importantes do workspace.',
              },
            ].map(({ icon: Icon, text, title }) => (
              <Surface className="flex items-center gap-3 p-5 opacity-70" key={title}>
                <Icon className="size-5 text-[rgb(var(--text-subtle))]" />
                <div className="flex-1">
                  <h2 className="text-sm font-medium">{title}</h2>
                  <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{text}</p>
                </div>
                <span className="rounded-full bg-[rgb(var(--surface-sunken))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
                  Em breve
                </span>
              </Surface>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
