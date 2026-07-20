import { ArrowLeft, Check, Moon, Settings2, SlidersHorizontal, Sun } from 'lucide-react';
import { Button, IconButton, SegmentedControl } from '@visualnscode/ui';
import { useAppStore } from '../store';
import { AppMark } from './AppMark';
import { ChatPanel } from './chat/ChatPanel';
import { PreviewPanel } from './RightWorkspacePanel';

export function SimpleProjectScreen() {
  const activeProject = useAppStore((state) => state.activeProject);
  const navigate = useAppStore((state) => state.navigate);
  const setMode = useAppStore((state) => state.setMode);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  return (
    <div className="flex h-screen min-w-[720px] flex-col overflow-hidden bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3">
        <button aria-label="Voltar ao início" onClick={() => navigate('home')} type="button">
          <AppMark compact />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{activeProject?.name ?? 'Meu projeto'}</p>
          <p className="flex items-center gap-1 text-[10px] text-[rgb(var(--text-subtle))]">
            <Check className="size-3 text-emerald-500" /> Pronto para continuar
          </p>
        </div>
        <Button onClick={() => navigate('settings')} size="sm" variant="ghost">
          <Settings2 className="size-3.5" /> Configurações
        </Button>
        <IconButton
          label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </IconButton>
        <SegmentedControl
          label="Modo da interface"
          onChange={setMode}
          options={[
            { label: 'Simples', value: 'simple' },
            { label: 'Avançado', value: 'advanced' },
          ]}
          value="simple"
        />
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.65fr)_minmax(300px,0.7fr)]">
        <section className="flex min-h-0 flex-col" aria-labelledby="project-result-title">
          <div className="flex min-h-12 shrink-0 items-center justify-between border-b border-[rgb(var(--border))] px-4">
            <div>
              <h1 className="text-sm font-medium" id="project-result-title">
                Resultado do projeto
              </h1>
              <p className="text-[10px] text-[rgb(var(--text-subtle))]">
                Execute, revise visualmente e publique quando estiver pronto.
              </p>
            </div>
            <Button onClick={() => setMode('advanced')} size="sm" variant="secondary">
              <SlidersHorizontal className="size-3.5" /> Abrir ferramentas avançadas
            </Button>
          </div>
          <div className="min-h-0 flex-1">
            <PreviewPanel />
          </div>
        </section>

        <aside
          aria-label="Assistente do projeto"
          className="flex min-h-0 flex-col border-l border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
        >
          <ChatPanel simple />
        </aside>
      </main>

      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] px-3 text-[10px] text-[rgb(var(--text-muted))]">
        <span className="flex items-center gap-1.5">
          <Check className="size-3 text-emerald-500" /> Alterações da IA sempre passam por revisão.
        </span>
        <button className="flex items-center gap-1" onClick={() => navigate('home')} type="button">
          <ArrowLeft className="size-3" /> Outros projetos
        </button>
      </footer>
    </div>
  );
}
