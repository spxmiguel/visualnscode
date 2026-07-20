import {
  Camera,
  CloudUpload,
  Eye,
  ExternalLink,
  Inspect,
  MessageSquare,
  Monitor,
  Play,
  RefreshCw,
  RotateCw,
  Smartphone,
  Square,
  Tablet,
  TerminalSquare,
} from 'lucide-react';
import { EmptyState } from '@visualnscode/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DeployEnvironment,
  DeployEvent,
  DeployPlan,
  DeployProvider,
  DeployRecord,
} from '../../shared/deployment';
import type {
  PreviewElementContext,
  PreviewLogEntry,
  ProjectRuntime,
  RunnerEvent,
} from '../../shared/runtime';
import { useChatStore } from '../chat-store';
import { buildPreviewPrompt } from '../preview-context';
import { useWorkspaceStore } from '../workspace-store';
import { ChatPanel } from './chat/ChatPanel';

type DeviceMode = 'desktop' | 'tablet' | 'mobile' | 'custom';
const DEFAULT_SIZES: Record<Exclude<DeviceMode, 'custom'>, readonly [number, number]> = {
  desktop: [1440, 900],
  tablet: [768, 1024],
  mobile: [390, 844],
};
const PROCESS_ID = 'workspace-dev-server';

const isBridgeMessage = (
  value: unknown,
): value is { source: string; type: string; payload: unknown } =>
  Boolean(
    value &&
    typeof value === 'object' &&
    (value as { source?: unknown }).source === 'visualnscode-preview',
  );

export function RightWorkspacePanel() {
  const rightPanel = useWorkspaceStore((state) => state.rightPanel);
  const setRightPanel = useWorkspaceStore((state) => state.setRightPanel);
  return (
    <aside className="flex h-full min-w-0 flex-col border-l border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <div className="flex h-9 shrink-0 border-b border-[rgb(var(--border))] p-1">
        <PanelTab
          active={rightPanel === 'chat'}
          icon={<MessageSquare className="size-3.5" />}
          label="Chat"
          onClick={() => setRightPanel('chat')}
        />
        <PanelTab
          active={rightPanel === 'preview'}
          icon={<Eye className="size-3.5" />}
          label="Preview"
          onClick={() => setRightPanel('preview')}
        />
      </div>
      {rightPanel === 'chat' ? <ChatPanel /> : <PreviewPanel />}
    </aside>
  );
}

function PanelTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md text-xs ${active ? 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text))] shadow-sm' : 'text-[rgb(var(--text-muted))]'}`}
      onClick={onClick}
      type="button"
    >
      {icon} {label}
    </button>
  );
}

export function PreviewPanel() {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [customSize, setCustomSize] = useState<readonly [number, number]>([1280, 720]);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<ProjectRuntime | null>(null);
  const [running, setRunning] = useState(false);
  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  const [browserLogs, setBrowserLogs] = useState<PreviewLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<PreviewElementContext | null>(null);
  const [notice, setNotice] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    void window.visualnscode?.runner.detect().then(setRuntime);
    void window.visualnscode?.runner.isRunning(PROCESS_ID).then(setRunning);
  }, []);

  const handleEvent = useCallback((event: RunnerEvent) => {
    if (event.processId !== PROCESS_ID) return;
    if (event.type === 'log' || event.type === 'error')
      setRuntimeLogs((previous) => [...previous.slice(-199), event.payload.trimEnd()]);
    if (event.type === 'url') {
      setSourceUrl(event.payload);
      void window.visualnscode?.preview
        .connect(event.payload)
        .then(setPreviewUrl)
        .catch((error: unknown) =>
          setRuntimeLogs((previous) => [
            ...previous,
            error instanceof Error ? error.message : 'Preview indisponível.',
          ]),
        );
    }
    if (event.type === 'started') setRunning(true);
    if (event.type === 'stopped') setRunning(false);
  }, []);

  useEffect(() => window.visualnscode?.runner.onEvent(handleEvent), [handleEvent]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || !isBridgeMessage(event.data)) return;
      if (event.data.type === 'console' || event.data.type === 'network') {
        const payload = event.data.payload as Omit<PreviewLogEntry, 'kind'>;
        if (payload && typeof payload.message === 'string')
          setBrowserLogs((previous) => [
            ...previous.slice(-199),
            { ...payload, kind: event.data.type as 'console' | 'network' },
          ]);
      }
      if (event.data.type === 'element') {
        setSelectedElement(event.data.payload as PreviewElementContext);
        setSelecting(false);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  const start = async () => {
    const detected = await window.visualnscode?.runner.detect();
    setRuntime(detected ?? null);
    if (!detected?.commands.dev) {
      setRuntimeLogs([
        'Não encontrei um comando para iniciar este projeto. Confira os scripts ou o arquivo principal.',
      ]);
      return;
    }
    setRuntimeLogs([]);
    setBrowserLogs([]);
    setPreviewUrl(null);
    window.visualnscode?.runner.start(PROCESS_ID, 'dev');
  };

  const restart = async () => {
    await window.visualnscode?.runner.restart(PROCESS_ID, 'dev');
    setNotice('Projeto reiniciado.');
  };

  const stop = async () => {
    await window.visualnscode?.runner.stop(PROCESS_ID);
    setRunning(false);
  };

  const size = device === 'custom' ? customSize : DEFAULT_SIZES[device];
  const selectElement = () => {
    const enabled = !selecting;
    setSelecting(enabled);
    iframeRef.current?.contentWindow?.postMessage(
      { source: 'visualnscode-host', type: 'select', enabled },
      '*',
    );
  };

  const sendElementToChat = () => {
    if (!selectedElement) return;
    useChatStore.getState().setDraft(buildPreviewPrompt(selectedElement));
    useWorkspaceStore.getState().setRightPanel('chat');
  };

  const screenshot = async () => {
    const rect = iframeRef.current?.getBoundingClientRect();
    if (!rect) return;
    const saved = await window.visualnscode?.preview.screenshot({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
    setNotice(saved ? `Screenshot salvo em ${saved}` : 'Captura cancelada.');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-1 border-b border-[rgb(var(--border))] px-2 py-1">
        {!running ? (
          <ToolbarButton
            label="Executar"
            icon={<Play className="size-3 fill-current" />}
            onClick={() => void start()}
            tone="success"
          />
        ) : (
          <ToolbarButton
            label="Parar"
            icon={<Square className="size-3 fill-current" />}
            onClick={() => void stop()}
            tone="danger"
          />
        )}
        {running ? (
          <ToolbarButton
            label="Reiniciar"
            icon={<RotateCw className="size-3" />}
            onClick={() => void restart()}
          />
        ) : null}
        <Divider />
        {(['desktop', 'tablet', 'mobile'] as const).map((mode) => {
          const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone;
          return (
            <button
              aria-label={`Preview ${mode}`}
              aria-pressed={device === mode}
              className={`rounded p-1 ${device === mode ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))]'}`}
              key={mode}
              onClick={() => setDevice(mode)}
              type="button"
            >
              <Icon className="size-3.5" />
            </button>
          );
        })}
        <button
          className={`rounded px-1.5 py-0.5 text-[10px] ${device === 'custom' ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))]'}`}
          onClick={() => setDevice('custom')}
          type="button"
        >
          Custom
        </button>
        {device === 'custom' ? (
          <div className="flex items-center gap-1 text-[9px]">
            <SizeInput
              label="Largura"
              value={customSize[0]}
              onChange={(value) => setCustomSize([value, customSize[1]])}
            />
            ×
            <SizeInput
              label="Altura"
              value={customSize[1]}
              onChange={(value) => setCustomSize([customSize[0], value])}
            />
          </div>
        ) : null}
        <div className="flex-1" />
        {previewUrl ? (
          <>
            <button
              aria-label="Recarregar preview"
              className="rounded p-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
              onClick={() => {
                if (iframeRef.current && previewUrl)
                  iframeRef.current.setAttribute('src', previewUrl);
              }}
              type="button"
            >
              <RefreshCw className="size-3.5" />
            </button>
            <button
              aria-label="Selecionar elemento"
              aria-pressed={selecting}
              className={`rounded p-1 ${selecting ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))]'}`}
              onClick={selectElement}
              type="button"
            >
              <Inspect className="size-3.5" />
            </button>
            <button
              aria-label="Capturar screenshot"
              className="rounded p-1 text-[rgb(var(--text-muted))]"
              onClick={() => void screenshot()}
              type="button"
            >
              <Camera className="size-3.5" />
            </button>
            <button
              aria-label="Abrir no navegador"
              className="rounded p-1 text-[rgb(var(--text-muted))]"
              onClick={() => sourceUrl && void window.visualnscode?.preview.openExternal(sourceUrl)}
              type="button"
            >
              <ExternalLink className="size-3.5" />
            </button>
          </>
        ) : null}
        <button
          aria-label="Logs do preview"
          aria-pressed={showLogs}
          className="rounded p-1 text-[rgb(var(--text-muted))]"
          onClick={() => setShowLogs(!showLogs)}
          type="button"
        >
          <TerminalSquare className="size-3.5" />
        </button>
        <button
          aria-label="Publicar projeto"
          aria-pressed={showDeploy}
          className="rounded p-1 text-[rgb(var(--text-muted))]"
          onClick={() => setShowDeploy(!showDeploy)}
          type="button"
        >
          <CloudUpload className="size-3.5" />
        </button>
      </div>

      {runtime ? (
        <div className="border-b border-[rgb(var(--border))] px-3 py-1 text-[9px] text-[rgb(var(--text-subtle))]">
          {runtime.framework ?? 'Projeto não identificado'} · {runtime.manager}
          {runtime.port ? ` · porta ${runtime.port}` : ''}
        </div>
      ) : null}
      {notice ? (
        <button
          className="border-b border-[rgb(var(--border))] px-3 py-1 text-left text-[9px] text-[rgb(var(--text-muted))]"
          onClick={() => setNotice('')}
          type="button"
        >
          {notice}
        </button>
      ) : null}
      {showDeploy ? <DeployPanel /> : null}
      {selectedElement ? (
        <div className="flex items-center gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--accent-soft))] px-3 py-2 text-[10px]">
          <code className="min-w-0 flex-1 truncate">{selectedElement.selector}</code>
          <button
            className="rounded bg-[rgb(var(--accent))] px-2 py-1 text-white"
            onClick={sendElementToChat}
            type="button"
          >
            Enviar ao chat
          </button>
          <button onClick={() => setSelectedElement(null)} type="button">
            ×
          </button>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[rgb(var(--background))]">
        {previewUrl ? (
          <div className="flex h-full items-start justify-center overflow-auto p-2">
            <iframe
              className={`shrink-0 rounded border bg-white shadow-sm ${selecting ? 'cursor-crosshair border-[rgb(var(--accent))]' : 'border-[rgb(var(--border))]'}`}
              ref={iframeRef}
              sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
              src={previewUrl}
              style={{
                width: `${size[0]}px`,
                height: `${size[1]}px`,
                maxWidth: device === 'desktop' ? '100%' : undefined,
              }}
              title="Preview integrado"
            />
          </div>
        ) : (
          <EmptyState
            description={
              running
                ? 'O servidor está iniciando. Os logs aparecem abaixo.'
                : 'Execute o projeto para abrir uma prévia real aqui.'
            }
            icon={<Eye className="size-5" />}
            title="Preview"
          />
        )}
      </div>
      {showLogs ? <LogConsole runtime={runtimeLogs} browser={browserLogs} /> : null}
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'success' | 'danger';
}) {
  return (
    <button
      className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] hover:bg-[rgb(var(--surface-hover))] ${tone === 'success' ? 'text-emerald-500' : tone === 'danger' ? 'text-red-400' : 'text-[rgb(var(--text-muted))]'}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-[rgb(var(--border))]" />;
}

function SizeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      aria-label={label}
      className="w-11 rounded bg-[rgb(var(--surface-sunken))] px-1 py-0.5 text-center outline-none"
      max={3840}
      min={240}
      onChange={(event) =>
        onChange(Math.max(240, Math.min(3840, Number(event.target.value) || 240)))
      }
      type="number"
      value={value}
    />
  );
}

function LogConsole({
  runtime,
  browser,
}: {
  runtime: readonly string[];
  browser: readonly PreviewLogEntry[];
}) {
  const [tab, setTab] = useState<'runtime' | 'console' | 'network'>('runtime');
  const entries =
    tab === 'runtime'
      ? runtime
      : browser
          .filter((entry) => entry.kind === tab)
          .map((entry) => `[${entry.level}] ${entry.message}`);
  return (
    <div className="h-32 shrink-0 overflow-hidden border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))]">
      <div className="flex gap-3 border-b border-[rgb(var(--border))] px-3 py-1 text-[9px]">
        {(['runtime', 'console', 'network'] as const).map((item) => (
          <button
            className={tab === item ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))]'}
            key={item}
            onClick={() => setTab(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="h-24 overflow-auto whitespace-pre-wrap p-2 font-mono text-[9px] text-[rgb(var(--text-muted))]">
        {entries.length ? entries.slice(-100).join('\n') : 'Nenhuma atividade registrada.'}
      </div>
    </div>
  );
}

function DeployPanel() {
  const [provider, setProvider] = useState<DeployProvider>('vercel');
  const [environment, setEnvironment] = useState<DeployEnvironment>('preview');
  const [config, setConfig] = useState({
    projectRef: '',
    functionName: '',
    pagesWorkflow: 'deploy-pages.yml',
  });
  const [plan, setPlan] = useState<DeployPlan | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<readonly DeployRecord[]>([]);

  useEffect(() => {
    void window.visualnscode?.deploy.history().then(setHistory);
  }, []);
  useEffect(() => {
    setConfirmed(false);
    void window.visualnscode?.deploy
      .plan({ provider, environment, confirmed: false, config })
      .then(setPlan);
  }, [provider, environment, config]);
  useEffect(
    () =>
      window.visualnscode?.deploy.onEvent((event: DeployEvent) =>
        setLogs((previous) => [...previous.slice(-99), event.payload]),
      ),
    [],
  );

  const publish = async () => {
    if (!confirmed || deploying) return;
    setDeploying(true);
    setLogs([]);
    try {
      const record = await window.visualnscode?.deploy.start({
        provider,
        environment,
        confirmed,
        config,
      });
      if (record)
        setHistory((previous) => [record, ...previous.filter(({ id }) => id !== record.id)]);
    } catch (error) {
      setLogs([error instanceof Error ? error.message : 'Não foi possível iniciar o deploy.']);
    } finally {
      setDeploying(false);
      setConfirmed(false);
    }
  };

  return (
    <div className="max-h-72 shrink-0 overflow-auto border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-3 text-[10px]">
      <div className="mb-2 flex gap-2">
        <select
          aria-label="Serviço de deploy"
          className="flex-1 rounded bg-[rgb(var(--surface-sunken))] px-2 py-1.5"
          onChange={(event) => setProvider(event.target.value as DeployProvider)}
          value={provider}
        >
          <option value="vercel">Vercel</option>
          <option value="firebase">Firebase Hosting</option>
          <option value="supabase">Supabase</option>
          <option value="github-pages">GitHub Pages</option>
        </select>
        <select
          aria-label="Ambiente do deploy"
          className="rounded bg-[rgb(var(--surface-sunken))] px-2 py-1.5"
          onChange={(event) => setEnvironment(event.target.value as DeployEnvironment)}
          value={environment}
        >
          <option value="preview">Preview</option>
          <option value="production">Produção</option>
        </select>
      </div>
      {provider === 'supabase' ? (
        <div className="mb-2 grid grid-cols-2 gap-2">
          <input
            aria-label="Project ref Supabase"
            className="rounded bg-[rgb(var(--surface-sunken))] px-2 py-1.5"
            onChange={(event) => setConfig({ ...config, projectRef: event.target.value })}
            placeholder="Project ref"
            value={config.projectRef}
          />
          <input
            aria-label="Função Supabase"
            className="rounded bg-[rgb(var(--surface-sunken))] px-2 py-1.5"
            onChange={(event) => setConfig({ ...config, functionName: event.target.value })}
            placeholder="Nome da função"
            value={config.functionName}
          />
        </div>
      ) : null}
      {provider === 'github-pages' ? (
        <input
          aria-label="Workflow do GitHub Pages"
          className="mb-2 w-full rounded bg-[rgb(var(--surface-sunken))] px-2 py-1.5"
          onChange={(event) => setConfig({ ...config, pagesWorkflow: event.target.value })}
          value={config.pagesWorkflow}
        />
      ) : null}
      {plan ? (
        <div
          className={`mb-2 rounded border p-2 ${environment === 'production' ? 'border-amber-500/40 bg-amber-500/5' : 'border-[rgb(var(--border))]'}`}
        >
          <div className="font-medium">{plan.title}</div>
          <p className="mt-1 text-[rgb(var(--text-muted))]">{plan.explanation}</p>
          <code className="mt-1 block break-all text-[9px] text-[rgb(var(--text-subtle))]">
            {plan.command}
          </code>
        </div>
      ) : null}
      <label className="flex items-start gap-2">
        <input
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          type="checkbox"
        />
        <span>
          Revisei o build e autorizo este deploy de{' '}
          {environment === 'production' ? 'produção' : 'preview'}.
        </span>
      </label>
      <button
        className="mt-2 w-full rounded bg-[rgb(var(--accent))] px-3 py-1.5 text-white disabled:opacity-40"
        disabled={!confirmed || deploying}
        onClick={() => void publish()}
        type="button"
      >
        {deploying
          ? 'Publicando…'
          : environment === 'production'
            ? 'Publicar em produção'
            : 'Criar preview'}
      </button>
      {logs.length ? (
        <pre className="mt-2 max-h-20 overflow-auto whitespace-pre-wrap rounded bg-[rgb(var(--surface-sunken))] p-2 text-[9px]">
          {logs.join('\n')}
        </pre>
      ) : null}
      {history.length ? (
        <div className="mt-3 border-t border-[rgb(var(--border))] pt-2">
          <div className="mb-1 text-[rgb(var(--text-muted))]">Histórico</div>
          {history.slice(0, 4).map((record) => (
            <div className="flex items-center gap-2 py-1" key={record.id}>
              <span className={record.status === 'succeeded' ? 'text-emerald-500' : 'text-red-400'}>
                ●
              </span>
              <span>
                {record.provider} · {record.environment}
              </span>
              {record.url ? (
                <button
                  className="ml-auto text-[rgb(var(--accent))]"
                  onClick={() => window.open(record.url!, '_blank')}
                  type="button"
                >
                  Abrir
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
