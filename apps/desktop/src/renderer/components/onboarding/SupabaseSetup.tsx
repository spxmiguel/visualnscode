import { Boxes, Code2, Database, FolderKanban, Link, LogIn } from 'lucide-react';
import { Button, Surface } from '@visualnscode/ui';
import { useState } from 'react';
import { environmentApi } from '../../environment-api';

type Operation = 'login' | 'projects' | 'link' | 'start' | 'migrate' | 'types';
export function SupabaseSetup() {
  const [projectRef, setProjectRef] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<Operation | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (operation: Operation) => {
    setBusy(true);
    await environmentApi.setPermission('credentials', true);
    if (!['login', 'projects'].includes(operation))
      await environmentApi.setPermission('write', true);
    const result = await environmentApi.perform(
      operation === 'login'
        ? { action: 'authenticate', confirmed: true, toolId: 'supabase' }
        : {
            action: 'configure',
            confirmed: true,
            parameters: { operation, projectRef },
            toolId: 'supabase',
          },
    );
    setMessage(result.message);
    setPending(null);
    setBusy(false);
  };
  const action = (operation: Operation, label: string, Icon: typeof Boxes, disabled = false) => (
    <Button
      disabled={busy || disabled}
      onClick={() => setPending(operation)}
      size="sm"
      variant="secondary"
    >
      <Icon className="size-3.5" /> {label}
    </Button>
  );
  return (
    <Surface className="mt-4 p-5">
      <h3 className="text-sm font-semibold">Configuração Supabase</h3>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
        O ambiente local depende do Docker. Migrations e tipos só rodam dentro de um workspace
        confiável.
      </p>
      {message ? (
        <p className="mt-4 rounded-lg bg-[rgb(var(--surface-sunken))] p-3 text-xs">{message}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => setPending('login')} size="sm">
          <LogIn className="size-3.5" /> Entrar
        </Button>
        <Button disabled={busy} onClick={() => void run('projects')} size="sm" variant="secondary">
          <FolderKanban className="size-3.5" /> Listar projetos
        </Button>
      </div>
      <label className="mt-4 block text-xs text-[rgb(var(--text-muted))]">
        Referência do projeto
        <input
          className="mt-1.5 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] px-3 text-sm text-[rgb(var(--text))] outline-none"
          onChange={(event) => setProjectRef(event.target.value)}
          placeholder="abcdefghijklmnopqrst"
          value={projectRef}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {action('link', 'Vincular', Link, !projectRef)}
        {action('start', 'Iniciar local', Boxes)}
        {action('migrate', 'Executar migrations', Database)}
        {action('types', 'Gerar tipos', Code2)}
      </div>
      {pending ? (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium">Confirmar ação Supabase</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            A operação é allowlisted e não usa shell. Um workspace real será exigido para qualquer
            escrita.
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
