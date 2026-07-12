import { CloudUpload, FolderKanban, LogIn, Rocket } from 'lucide-react';
import { Button, Surface } from '@visualnscode/ui';
import { useState } from 'react';
import { environmentApi } from '../../environment-api';

type Operation = 'login' | 'projects' | 'link' | 'create' | 'preview' | 'production';
export function VercelSetup() {
  const [name, setName] = useState('');
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
        ? { action: 'authenticate', confirmed: true, toolId: 'vercel' }
        : {
            action: 'configure',
            confirmed: true,
            parameters: { operation, projectName: name },
            toolId: 'vercel',
          },
    );
    setMessage(result.message);
    setPending(null);
    setBusy(false);
  };
  return (
    <Surface className="mt-4 p-5">
      <h3 className="text-sm font-semibold">Configuração Vercel</h3>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
        Deploy de produção sempre aparece como ação de alto impacto e exige confirmação.
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
        Nome do projeto
        <input
          className="mt-1.5 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] px-3 text-sm text-[rgb(var(--text))] outline-none"
          onChange={(event) => setName(event.target.value)}
          placeholder="meu-projeto"
          value={name}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={!name || busy}
          onClick={() => setPending('link')}
          size="sm"
          variant="secondary"
        >
          Vincular pasta
        </Button>
        <Button
          disabled={!name || busy}
          onClick={() => setPending('create')}
          size="sm"
          variant="secondary"
        >
          Criar projeto
        </Button>
        <Button disabled={busy} onClick={() => setPending('preview')} size="sm" variant="secondary">
          <CloudUpload className="size-3.5" /> Preview
        </Button>
        <Button disabled={busy} onClick={() => setPending('production')} size="sm" variant="danger">
          <Rocket className="size-3.5" /> Produção
        </Button>
      </div>
      {pending ? (
        <div
          className={`mt-4 rounded-xl border p-4 ${pending === 'production' ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}
        >
          <p className="text-sm font-medium">
            Confirmar {pending === 'production' ? 'deploy de produção' : 'ação Vercel'}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            Esta ação usa apenas argumentos allowlisted. Ações de projeto exigirão um workspace
            real.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => void run(pending)}
              size="sm"
              variant={pending === 'production' ? 'danger' : 'primary'}
            >
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
