import { KeyRound, LockKeyhole, Trash2 } from 'lucide-react';
import { Button, Surface } from '@visualnscode/ui';
import { useEffect, useState } from 'react';
import { environmentApi } from '../../environment-api';
import { providerApi } from '../../provider-api';

const providers = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'openrouter', name: 'OpenRouter' },
] as const;
export function ProviderSetup() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [available, setAvailable] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    void Promise.all(
      providers.map(async ({ id }) => [id, await environmentApi.secretStatus(id)] as const),
    ).then((items) => {
      setConfigured(Object.fromEntries(items.map(([id, status]) => [id, status.configured])));
      setAvailable(items.every(([, status]) => status.available));
    });
  }, []);
  const save = async (id: string) => {
    await environmentApi.setPermission('credentials', true);
    const ok = await environmentApi.storeSecret(id, values[id] ?? '');
    let connectionMessage = '';
    if (ok) {
      const provider = (await providerApi.providers.list()).find((item) => item.id === id);
      if (provider) {
        const connection = await providerApi.providers.test(id);
        await providerApi.providers.update({
          ...provider.settings,
          enabled: true,
          defaultModel: provider.settings.defaultModel || connection.models[0]?.id || '',
        });
        connectionMessage = connection.ok
          ? ` ${connection.models.length} modelo(s) encontrado(s).`
          : ' Revise a chave nas configurações antes de usar.';
      }
    }
    setValues((current) => ({ ...current, [id]: '' }));
    setConfigured((current) => ({ ...current, [id]: ok }));
    setPending(null);
    setMessage(
      ok
        ? `Credencial criptografada, salva e provider ativado.${connectionMessage}`
        : 'Não foi possível usar um cofre seguro neste sistema. A credencial não foi salva.',
    );
  };
  const remove = async (id: string) => {
    await environmentApi.setPermission('credentials', true);
    const ok = await environmentApi.removeSecret(id);
    if (ok) setConfigured((current) => ({ ...current, [id]: false }));
  };
  return (
    <div className="mt-4">
      <Surface className="mb-3 flex gap-3 p-4">
        <LockKeyhole
          className={`size-5 shrink-0 ${available ? 'text-emerald-500' : 'text-amber-500'}`}
        />
        <div>
          <p className="text-sm font-semibold">
            Cofre do sistema {available ? 'disponível' : 'indisponível nesta prévia'}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
            As chaves são criptografadas por `safeStorage`; nunca entram em localStorage, Zustand ou
            logs.
          </p>
        </div>
      </Surface>
      <p className="mb-3 text-xs leading-5 text-[rgb(var(--text-muted))]">
        Se nenhuma IA estiver pronta ao concluir o assistente, o VisualnsCode configura o Ollama
        como opção local padrão. Nenhuma instalação é executada sem sua confirmação.
      </p>
      {message ? (
        <p className="mb-3 rounded-lg bg-[rgb(var(--surface-sunken))] p-3 text-xs">{message}</p>
      ) : null}
      <div className="grid gap-3">
        {providers.map(({ id, name }) => (
          <Surface className="p-4" key={id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-[rgb(var(--accent))]" />
                <span className="text-sm font-semibold">{name}</span>
              </div>
              <span
                className={`text-[10px] font-semibold ${configured[id] ? 'text-emerald-500' : 'text-[rgb(var(--text-subtle))]'}`}
              >
                {configured[id] ? 'CONFIGURADO' : 'OPCIONAL'}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                aria-label={`Chave ${name}`}
                autoComplete="off"
                className="h-9 min-w-0 flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] px-3 text-sm outline-none"
                onChange={(event) =>
                  setValues((current) => ({ ...current, [id]: event.target.value }))
                }
                placeholder="Cole uma chave de API"
                type="password"
                value={values[id] ?? ''}
              />
              <Button
                disabled={(values[id]?.length ?? 0) < 8 || !available}
                onClick={() => setPending(id)}
                size="sm"
              >
                Salvar no cofre
              </Button>
              {configured[id] ? (
                <Button
                  aria-label={`Remover chave ${name}`}
                  onClick={() => void remove(id)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
            </div>
            {pending === id ? (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-xs">Confirmar acesso ao cofre seguro para {name}?</p>
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => void save(id)} size="sm">
                    Confirmar
                  </Button>
                  <Button onClick={() => setPending(null)} size="sm" variant="ghost">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </Surface>
        ))}
      </div>
    </div>
  );
}
