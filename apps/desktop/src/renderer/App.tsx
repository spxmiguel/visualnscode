import Editor from '@monaco-editor/react';
import { APP_NAME } from '@visualnscode/config';
import { Button } from '@visualnscode/ui';
import { useWorkspaceStore } from './store';

export function App() {
  const { fileName, setSource, source } = useWorkspaceStore();

  return (
    <main className="grid h-screen grid-cols-[15rem_1fr] grid-rows-[3rem_1fr_1.75rem] bg-zinc-950 text-zinc-100">
      <header className="col-span-2 flex items-center justify-between border-b border-zinc-800 px-4">
        <strong className="tracking-tight">{APP_NAME}</strong>
        <Button disabled title="Integrações de IA serão adicionadas em uma fase futura">
          Conectar IA
        </Button>
      </header>
      <aside className="border-r border-zinc-800 p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Explorer
        </p>
        <div className="rounded bg-zinc-900 px-3 py-2 text-sm">{fileName}</div>
      </aside>
      <section aria-label={`Editor de ${fileName}`}>
        <Editor
          beforeMount={(monaco) =>
            monaco.editor.defineTheme('visualns-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: { 'editor.background': '#09090b' },
            })
          }
          language="typescript"
          onChange={(value) => setSource(value ?? '')}
          options={{ automaticLayout: true, minimap: { enabled: false }, padding: { top: 16 } }}
          theme="visualns-dark"
          value={source}
        />
      </section>
      <footer className="col-span-2 flex items-center justify-between border-t border-zinc-800 px-3 text-xs text-zinc-400">
        <span>Fundação técnica</span>
        <span>IA não conectada</span>
      </footer>
    </main>
  );
}
