import { LogIn, LogOut, Save, TestTube2 } from 'lucide-react';
import { Button, Surface } from '@visualnscode/ui';
import { useState } from 'react';
import type { PermissionId, ToolActionRequest } from '@visualnscode/integrations/browser';
import { environmentApi } from '../../environment-api';

interface PendingAction {
  readonly label: string;
  readonly permissions: readonly PermissionId[];
  readonly request: ToolActionRequest;
}

export function GitHubSetup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const execute = async (action: PendingAction) => {
    setBusy(true);
    for (const permission of action.permissions)
      await environmentApi.setPermission(permission, true);
    const result = await environmentApi.perform({ ...action.request, confirmed: true });
    setMessage(result.message);
    setPending(null);
    setBusy(false);
  };

  const testAccess = async () => {
    setBusy(true);
    const result = await environmentApi.perform({
      action: 'configure',
      confirmed: true,
      parameters: { operation: 'repositories' },
      toolId: 'github',
    });
    setMessage(result.message);
    setBusy(false);
  };

  return (
    <Surface className="mt-4 p-5">
      <h3 className="text-sm font-semibold">Conta e identidade Git</h3>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
        O login abre o fluxo oficial do GitHub CLI. O token permanece no credential store usado pelo
        próprio `gh`.
      </p>
      {message ? (
        <p className="mt-4 rounded-lg bg-[rgb(var(--surface-sunken))] p-3 text-xs">{message}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={() =>
            setPending({
              label: 'Conectar uma conta do GitHub pelo navegador',
              permissions: ['credentials'],
              request: { action: 'authenticate', confirmed: false, toolId: 'github' },
            })
          }
          size="sm"
        >
          <LogIn className="size-3.5" /> Entrar no GitHub
        </Button>
        <Button disabled={busy} onClick={() => void testAccess()} size="sm" variant="secondary">
          <TestTube2 className="size-3.5" /> Testar repositórios
        </Button>
        <Button
          disabled={busy}
          onClick={() =>
            setPending({
              label: 'Desconectar a conta atual do GitHub',
              permissions: ['credentials'],
              request: { action: 'logout', confirmed: false, toolId: 'github' },
            })
          }
          size="sm"
          variant="ghost"
        >
          <LogOut className="size-3.5" /> Sair
        </Button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[rgb(var(--text-muted))]">
          Nome no Git
          <input
            className="mt-1.5 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] px-3 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--accent))]"
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
            value={name}
          />
        </label>
        <label className="text-xs text-[rgb(var(--text-muted))]">
          Email no Git
          <input
            className="mt-1.5 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] px-3 text-sm text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--accent))]"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            type="email"
            value={email}
          />
        </label>
      </div>
      <Button
        className="mt-3"
        disabled={!name.trim() || !email.includes('@') || busy}
        onClick={() =>
          setPending({
            label: 'Alterar nome e email na configuração global do Git',
            permissions: ['outside-workspace'],
            request: {
              action: 'configure',
              confirmed: false,
              parameters: { email, name, operation: 'git-profile' },
              toolId: 'github',
            },
          })
        }
        size="sm"
        variant="secondary"
      >
        <Save className="size-3.5" /> Salvar identidade Git
      </Button>
      {pending ? (
        <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium">Confirmar ação</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{pending.label}</p>
          <div className="mt-3 flex gap-2">
            <Button disabled={busy} onClick={() => void execute(pending)} size="sm">
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
