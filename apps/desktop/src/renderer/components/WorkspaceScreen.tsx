import Editor from '@monaco-editor/react';
import {
  ChevronDown,
  Eye,
  FileCode2,
  MessageSquare,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  EmptyState,
  IconButton,
  ResizeHandle,
  SegmentedControl,
  SelectField,
  Spinner,
} from '@visualnscode/ui';
import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { useWorkspaceStore } from '../workspace-store';
import { ActivityRail } from './ActivityRail';
import { AgentWorkspace } from './agents/AgentWorkspace';
import { AppMark } from './AppMark';
import { BottomPanel } from './BottomPanel';
import { ExplorerPanel } from './ExplorerPanel';
import { FileTabs } from './FileTabs';
import { RightWorkspacePanel } from './RightWorkspacePanel';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function WorkspaceScreen() {
  const activeProject = useAppStore((state) => state.activeProject);
  const mode = useAppStore((state) => state.mode);
  const navigate = useAppStore((state) => state.navigate);
  const setMode = useAppStore((state) => state.setMode);
  const theme = useAppStore((state) => state.theme);
  const yoloEnabled = useAppStore((state) => state.yoloEnabled);
  const setYoloEnabled = useAppStore((state) => state.setYoloEnabled);
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const files = useWorkspaceStore((state) => state.files);
  const isBottomOpen = useWorkspaceStore((state) => state.isBottomOpen);
  const isExplorerOpen = useWorkspaceStore((state) => state.isExplorerOpen);
  const isRightOpen = useWorkspaceStore((state) => state.isRightOpen);
  const resetActiveFile = useWorkspaceStore((state) => state.resetActiveFile);
  const toggleBottom = useWorkspaceStore((state) => state.toggleBottom);
  const toggleExplorer = useWorkspaceStore((state) => state.toggleExplorer);
  const toggleRight = useWorkspaceStore((state) => state.toggleRight);
  const updateActiveFile = useWorkspaceStore((state) => state.updateActiveFile);
  const setRightPanel = useWorkspaceStore((state) => state.setRightPanel);
  const [explorerWidth, setExplorerWidth] = useState(220);
  const [rightWidth, setRightWidth] = useState(320);
  const [bottomHeight, setBottomHeight] = useState(170);
  const [agent, setAgent] = useState('builder');
  const [model, setModel] = useState('local');
  const [status, setStatus] = useState('Pronto');
  const activeFile = useMemo(
    () => files.find(({ id }) => id === activeFileId) ?? null,
    [activeFileId, files],
  );
  const showBottom = mode === 'advanced' && isBottomOpen;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleExplorer();
      }
      if (event.key.toLowerCase() === 'j') {
        event.preventDefault();
        toggleBottom();
      }
      if (event.key === ',') {
        event.preventDefault();
        navigate('settings');
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        setStatus('Preview atualizado agora');
        setRightPanel('preview');
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        const file = useWorkspaceStore
          .getState()
          .files.find((f) => f.id === useWorkspaceStore.getState().activeFileId);
        if (file?.path) {
          void window.visualnscode?.fs
            .writeFile(file.path, file.content)
            .then(() => setStatus(`Salvo: ${file.name}`))
            .catch(() => setStatus('Erro ao salvar'));
        }
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [navigate, setRightPanel, toggleBottom, toggleExplorer]);

  const runPreview = () => {
    setStatus('Preview atualizado agora');
    setRightPanel('preview');
  };

  return (
    <div className="flex h-screen min-w-[720px] flex-col overflow-hidden bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5">
        <button aria-label="Voltar ao início" onClick={() => navigate('home')} type="button">
          <AppMark compact />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{activeProject?.name ?? 'Workspace'}</p>
          <p className="truncate text-[10px] text-[rgb(var(--text-subtle))]">
            {activeProject?.path ?? '~/Projetos/workspace'}
          </p>
        </div>
        {mode === 'advanced' ? (
          <div className="hidden items-center gap-2 lg:flex">
            <SelectField
              hideLabel
              label="Agente"
              onChange={(event) => setAgent(event.target.value)}
              value={agent}
            >
              <option value="builder">Agente · Builder</option>
              <option value="reviewer">Agente · Revisor</option>
            </SelectField>
            <SelectField
              hideLabel
              label="Modelo"
              onChange={(event) => setModel(event.target.value)}
              value={model}
            >
              <option value="local">Modelo · Demo local</option>
              <option disabled value="future">
                Providers em breve
              </option>
            </SelectField>
          </div>
        ) : null}
        <SegmentedControl
          label="Modo da interface"
          onChange={setMode}
          options={[
            { label: 'Simples', value: 'simple' },
            { label: 'Avançado', value: 'advanced' },
          ]}
          value={mode}
        />
        <div className="hidden items-center gap-1 sm:flex">
          <IconButton
            active={isExplorerOpen}
            label="Alternar explorador (⌘B)"
            onClick={toggleExplorer}
          >
            <PanelLeft className="size-4" />
          </IconButton>
          <IconButton active={isRightOpen} label="Alternar painel lateral" onClick={toggleRight}>
            <PanelRight className="size-4" />
          </IconButton>
          {mode === 'advanced' ? (
            <IconButton
              active={showBottom}
              label="Alternar painel inferior (⌘J)"
              onClick={toggleBottom}
            >
              <PanelBottom className="size-4" />
            </IconButton>
          ) : null}
        </div>
        <Button onClick={runPreview} size="sm">
          <Play className="size-3.5 fill-current" /> Executar
        </Button>
        <Button
          onClick={() => {
            resetActiveFile();
            setStatus('Alterações do arquivo desfeitas');
          }}
          size="sm"
          variant="secondary"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden xl:inline">Desfazer</span>
        </Button>
      </header>

      {yoloEnabled ? (
        <div
          className="flex h-8 shrink-0 items-center justify-between border-b border-amber-500/40 bg-amber-500/10 px-3 text-[11px] text-amber-500"
          role="status"
        >
          <span>Modo YOLO ativo — ações não destrutivas podem seguir sem nova confirmação.</span>
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => setYoloEnabled(false)}
            type="button"
          >
            Desativar
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {mode === 'advanced' ? <ActivityRail /> : null}
        {isExplorerOpen ? (
          <>
            <aside style={{ width: explorerWidth }}>
              <ExplorerPanel />
            </aside>
            <ResizeHandle
              direction="horizontal"
              label="Redimensionar explorador"
              onResize={(delta) => setExplorerWidth((width) => clamp(width + delta, 160, 360))}
            />
          </>
        ) : null}
        {activeTool === 'agents' ? (
          <AgentWorkspace />
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              <section className="flex min-w-0 flex-1 flex-col" aria-label="Editor de código">
                <FileTabs />
                <div className="min-h-0 flex-1 bg-[rgb(var(--background))]">
                  {activeFile ? (
                    <Editor
                      language={activeFile.language}
                      loading={<Spinner label="Abrindo editor…" />}
                      onChange={(value) => updateActiveFile(value ?? '')}
                      options={{
                        automaticLayout: true,
                        fontFamily: 'SFMono-Regular, Consolas, monospace',
                        fontSize: 13,
                        lineHeight: 21,
                        minimap: { enabled: mode === 'advanced' },
                        padding: { top: 16 },
                        renderLineHighlight: 'gutter',
                        scrollBeyondLastLine: false,
                      }}
                      theme={theme === 'dark' ? 'vs-dark' : 'light'}
                      value={activeFile.content}
                    />
                  ) : (
                    <EmptyState
                      action={
                        <Button
                          onClick={() => useWorkspaceStore.getState().openFile('app')}
                          variant="secondary"
                        >
                          Abrir App.tsx
                        </Button>
                      }
                      description="Escolha um arquivo no explorador para começar."
                      icon={<FileCode2 className="size-4" strokeWidth={1.6} />}
                      title="Editor vazio"
                    />
                  )}
                </div>
              </section>
              {isRightOpen ? (
                <>
                  <ResizeHandle
                    direction="horizontal"
                    label="Redimensionar chat e preview"
                    onResize={(delta) => setRightWidth((width) => clamp(width - delta, 260, 480))}
                  />
                  <div style={{ width: rightWidth }}>
                    <RightWorkspacePanel />
                  </div>
                </>
              ) : null}
            </div>
            {showBottom ? (
              <>
                <ResizeHandle
                  direction="vertical"
                  label="Redimensionar painel inferior"
                  onResize={(delta) => setBottomHeight((height) => clamp(height - delta, 100, 340))}
                />
                <div style={{ height: bottomHeight }}>
                  <BottomPanel />
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] px-2 text-[10px] text-[rgb(var(--text-muted))]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[rgb(var(--text))]">
            <span className="size-1.5 rounded-full bg-emerald-500" /> main
          </span>
          <span>✓ 0 erros</span>
          <span>{status}</span>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'simple' ? (
            <>
              <button
                className="flex items-center gap-1"
                onClick={() => setRightPanel('chat')}
                type="button"
              >
                <MessageSquare className="size-3" /> Chat
              </button>
              <button
                className="flex items-center gap-1"
                onClick={() => setRightPanel('preview')}
                type="button"
              >
                <Eye className="size-3" /> Preview
              </button>
            </>
          ) : (
            <>
              <span>TypeScript</span>
              <span>UTF-8</span>
              <button
                className="flex items-center gap-0.5"
                onClick={() => navigate('settings')}
                type="button"
              >
                Permissões <ChevronDown className="size-3" />
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
