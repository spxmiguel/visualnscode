import { Cloud, FolderKanban, LogIn, Settings2 } from 'lucide-react';
import { Button, Surface } from '@visualnscode/ui';
import { useState } from 'react';
import { environmentApi } from '../../environment-api';

export function FirebaseSetup() {
  const [message, setMessage] = useState<string | null>(null);
  const [projectId, setProjectId] = useState('');
  const [pending, setPending] = useState<'login' | 'initialize' | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (operation: 'login' | 'projects' | 'initialize') => {
    setBusy(true);
    if (operation !== 'projects')
      await environmentApi.setPermission(operation === 'login' ? 'credentials' : 'write', true);
    if (operation === 'projects') await environmentApi.setPermission('credentials', true);
    const result = await environmentApi.perform(
      operation === 'login'
        ? { action: 'authenticate', confirmed: true, toolId: 'firebase' }
        : {
            action: 'configure',
            confirmed: true,
            parameters: { operation, projectId },
            toolId: 'firebase',
          },
    );
    setMessage(result.message);
    setPending(null);
    setBusy(false);
  };
  return (
    <Surface className="mt-4 p-5">
      <h3 className="text-sm font-semibold">Configuração Firebase</h3>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
        Login e listagem funcionam aqui. Inicialização só escreve em um workspace real aberto.
      </p>
      {message ? (
        <p className="mt-4 rounded-lg bg-[rgb(var(--surface-sunken))] p-3 text-xs">{message}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => setPending('login')} size="sm">
          <LogIn className="size-3.5" /> Entrar no Firebase
        </Button>
        <Button disabled={busy} onClick={() => void run('projects')} size="sm" variant="secondary">
          <FolderKanban className="size-3.5" /> Listar projetos
        </Button>
      </div>
      <label className="mt-4 block text-xs text-[rgb(var(--text-muted))]">
        ID do projeto
        <input
          className="mt-1.5 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] px-3 text-sm text-[rgb(var(--text))] outline-none"
          onChange={(event) => setProjectId(event.target.value)}
          placeholder="meu-projeto"
          value={projectId}
        />
      </label>
      <Button
        className="mt-3"
        disabled={!projectId || busy}
        onClick={() => setPending('initialize')}
        size="sm"
        variant="secondary"
      >
        <Settings2 className="size-3.5" /> Configurar Hosting, Firestore e Auth
      </Button>
      {pending ? (
        <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Cloud className="size-4" /> Confirmar ação Firebase
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            {pending === 'login'
              ? 'Abrir o fluxo oficial de autenticação no navegador.'
              : 'Inicializar arquivos Firebase no workspace. Nada será executado sem uma pasta confiável.'}
          </p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => void run(pending)} size="sm">
              Confirmar
            </Button>
            <Button onClick={() => setPending(null)} size="sm" variant="ghost">
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </Surface>
  );
}
