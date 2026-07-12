import Editor from '@monaco-editor/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@visualnscode/ui';
import { useAppStore } from '../store';
import { WindowHeader } from './WindowHeader';

const welcomeSource = `export function boasVindas(nome: string) {\n  return \`Olá, \${nome}!\`;\n}\n`;

export function WorkspaceScreen() {
  const activeProject = useAppStore((state) => state.activeProject);
  const navigate = useAppStore((state) => state.navigate);
  const theme = useAppStore((state) => state.theme);

  return (
    <div className="flex h-screen flex-col bg-[rgb(var(--background))]">
      <WindowHeader
        center={
          <span className="text-xs text-[rgb(var(--text-muted))]">
            {activeProject?.name ?? 'Workspace'}
          </span>
        }
        onBack={() => navigate('home')}
      />
      <main className="grid min-h-0 flex-1 grid-cols-[15rem_1fr]">
        <aside className="border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-subtle))]">
            Arquivos
          </p>
          <button
            className="w-full rounded-lg bg-[rgb(var(--accent-soft))] px-3 py-2 text-left text-sm text-[rgb(var(--accent))]"
            type="button"
          >
            boas-vindas.ts
          </button>
        </aside>
        <section className="min-w-0">
          <Editor
            defaultLanguage="typescript"
            defaultValue={welcomeSource}
            options={{ automaticLayout: true, minimap: { enabled: false }, padding: { top: 18 } }}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
          />
        </section>
      </main>
      <footer className="flex h-7 items-center justify-between border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-[11px] text-[rgb(var(--text-muted))]">
        <span>Modo de demonstração</span>
        <Button className="h-5 px-2" onClick={() => navigate('home')} size="sm" variant="ghost">
          <ArrowLeft className="size-3" /> Início
        </Button>
      </footer>
    </div>
  );
}
