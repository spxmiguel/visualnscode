import { Bot, Eye, ExternalLink, Monitor, Smartphone, Tablet, Play, Square } from 'lucide-react';
import { EmptyState } from '@visualnscode/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RunnerEvent } from '../electron.d';
import { useWorkspaceStore } from '../workspace-store';
import { ChatPanel } from './chat/ChatPanel';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

const PROCESS_ID = 'workspace-dev-server';

export function RightWorkspacePanel() {
  const rightPanel = useWorkspaceStore((state) => state.rightPanel);
  const setRightPanel = useWorkspaceStore((state) => state.setRightPanel);
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleEvent = useCallback((ev: RunnerEvent) => {
    if (ev.processId !== PROCESS_ID) return;
    if (ev.type === 'log' || ev.type === 'error') {
      setLogs((prev) => [...prev.slice(-100), ev.payload.trimEnd()]);
    }
    if (ev.type === 'url') {
      setPreviewUrl(ev.payload);
    }
    if (ev.type === 'started') {
      setRunning(true);
    }
    if (ev.type === 'stopped') {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    const off = window.visualnscode?.runner.onEvent((ev) => handleEvent(ev as RunnerEvent));
    return () => off?.();
  }, [handleEvent]);

  const startRunner = async () => {
    const info = await window.visualnscode?.runner.detect();
    if (!info?.devCommand) {
      setLogs(['Nenhum script de desenvolvimento detectado. Configure o projeto primeiro.']);
      return;
    }
    setLogs([]);
    setPreviewUrl(null);
    window.visualnscode?.runner.start(PROCESS_ID, info.devCommand);
  };

  const stopRunner = async () => {
    await window.visualnscode?.runner.stop(PROCESS_ID);
    setRunning(false);
  };

  const reload = () => {
    const current = iframeRef.current?.getAttribute('src');
    if (current) iframeRef.current?.setAttribute('src', current);
  };

  const openExternal = () => {
    if (previewUrl) window.open(previewUrl, '_blank');
  };

  return (
    <aside className="flex h-full min-w-0 flex-col border-l border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <div className="flex h-9 shrink-0 border-b border-[rgb(var(--border))] p-1">
        <button
          aria-pressed={rightPanel === 'chat'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md text-xs ${rightPanel === 'chat' ? 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text))] shadow-sm' : 'text-[rgb(var(--text-muted))]'}`}
          onClick={() => setRightPanel('chat')}
          type="button"
        >
          <Bot className="size-3.5" /> Chat
        </button>
        <button
          aria-pressed={rightPanel === 'preview'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md text-xs ${rightPanel === 'preview' ? 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text))] shadow-sm' : 'text-[rgb(var(--text-muted))]'}`}
          onClick={() => setRightPanel('preview')}
          type="button"
        >
          <Eye className="size-3.5" /> Preview
        </button>
      </div>

      {rightPanel === 'chat' ? (
        <ChatPanel />
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          {/* toolbar */}
          <div className="flex h-8 shrink-0 items-center gap-1 border-b border-[rgb(var(--border))] px-2">
            {!running ? (
              <button
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-emerald-500 hover:bg-[rgb(var(--surface-hover))]"
                onClick={() => void startRunner()}
                title="Iniciar dev server"
                type="button"
              >
                <Play className="size-3 fill-current" /> Run
              </button>
            ) : (
              <button
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-red-400 hover:bg-[rgb(var(--surface-hover))]"
                onClick={() => void stopRunner()}
                title="Parar dev server"
                type="button"
              >
                <Square className="size-3 fill-current" /> Stop
              </button>
            )}
            <div className="mx-1 h-4 w-px bg-[rgb(var(--border))]" />
            {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((d) => {
              const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
              return (
                <button
                  className={`rounded p-1 ${device === d ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'}`}
                  key={d}
                  onClick={() => setDevice(d)}
                  title={d}
                  type="button"
                >
                  <Icon className="size-3.5" />
                </button>
              );
            })}
            {previewUrl ? (
              <>
                <div className="mx-1 h-4 w-px bg-[rgb(var(--border))]" />
                <button
                  className="rounded p-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                  onClick={reload}
                  title="Recarregar"
                  type="button"
                >
                  ↺
                </button>
                <button
                  className="rounded p-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                  onClick={openExternal}
                  title="Abrir no navegador"
                  type="button"
                >
                  <ExternalLink className="size-3.5" />
                </button>
              </>
            ) : null}
          </div>

          {/* preview area */}
          <div className="relative min-h-0 flex-1 overflow-hidden bg-[rgb(var(--background))]">
            {previewUrl ? (
              <div className="flex h-full items-start justify-center overflow-auto p-2">
                <iframe
                  className="h-full rounded border border-[rgb(var(--border))] bg-white"
                  ref={iframeRef}
                  src={previewUrl}
                  style={{ width: DEVICE_WIDTHS[device], minHeight: '100%' }}
                  title="Preview"
                />
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <EmptyState
                  description={
                    running
                      ? 'Aguardando servidor iniciar…'
                      : 'Clique em Run para iniciar o servidor de desenvolvimento.'
                  }
                  icon={<Eye className="size-5" />}
                  title="Preview"
                />
                {logs.length > 0 ? (
                  <div className="border-t border-[rgb(var(--border))] p-3 font-mono text-xs text-[rgb(var(--text-muted))]">
                    {logs.slice(-5).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
