import { useEffect, useMemo, useState } from 'react';
import { Check, Cloud, Cpu, KeyRound, LoaderCircle, Play, Save, Terminal } from 'lucide-react';
import type { AIModel, ProviderSettings, ProviderSummary } from '@visualnscode/providers/browser';
import { Button, Surface } from '@visualnscode/ui';
import { environmentApi } from '../../environment-api';
import { providerApi } from '../../provider-api';

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] px-3 py-2 text-xs outline-none focus:border-[rgb(var(--accent))]';

export function ModelSettings() {
  const [providers, setProviders] = useState<readonly ProviderSummary[]>([]);
  const [selectedId, setSelectedId] = useState('openai');
  const [draft, setDraft] = useState<ProviderSettings | null>(null);
  const [models, setModels] = useState<readonly AIModel[]>([]);
  const [secret, setSecret] = useState('');
  const [secretAvailable, setSecretAvailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => providers.find(({ id }) => id === selectedId) ?? null,
    [providers, selectedId],
  );

  const load = async () => {
    const result = await providerApi.providers.list();
    setProviders(result);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft(selected.settings);
    setModels([]);
    setMessage(null);
    void environmentApi
      .secretStatus(selected.id)
      .then(({ available }) => setSecretAvailable(available));
  }, [selected]);

  if (!draft || !selected) {
    return (
      <Surface className="p-5 text-xs text-[rgb(var(--text-muted))]">Carregando providers…</Surface>
    );
  }

  const update = <K extends keyof ProviderSettings>(key: K, value: ProviderSettings[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  const save = async (): Promise<ProviderSettings> => {
    const saved = await providerApi.providers.update(draft);
    if (secret) {
      const stored = await environmentApi.storeSecret(selected.id, secret);
      if (!stored)
        throw new Error('Conceda a permissão de credenciais antes de salvar esta chave.');
      setSecret('');
    }
    await load();
    return saved;
  };

  const perform = async (action: 'save' | 'test') => {
    setBusy(true);
    setMessage(null);
    try {
      await save();
      if (action === 'test') {
        const result = await providerApi.providers.test(selected.id);
        setModels(result.models);
        setMessage(result.message);
      } else {
        setMessage('Configuração salva com segurança.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  };

  const TypeIcon = selected.type === 'cli' ? Terminal : selected.type === 'local' ? Cpu : Cloud;

  return (
    <Surface className="overflow-hidden" elevated>
      <div className="border-b border-[rgb(var(--border))] p-5">
        <h2 className="text-sm font-semibold">Modelos e providers</h2>
        <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
          Uma configuração única para APIs, servidores locais e agentes de terminal.
        </p>
      </div>
      <div className="grid min-h-[520px] md:grid-cols-[220px_1fr]">
        <nav className="border-b border-[rgb(var(--border))] p-2 md:border-b-0 md:border-r">
          {providers.map((provider) => (
            <button
              className={`mb-px flex w-full items-center gap-2 border-l-2 px-3 py-2.5 text-left text-xs ${provider.id === selected.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--surface-hover))] text-[rgb(var(--text))]' : 'border-transparent text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-hover))]'}`}
              key={provider.id}
              onClick={() => setSelectedId(provider.id)}
              type="button"
            >
              {provider.type === 'cli' ? (
                <Terminal className="size-3.5" />
              ) : provider.type === 'local' ? (
                <Cpu className="size-3.5" />
              ) : (
                <Cloud className="size-3.5" />
              )}
              <span className="min-w-0 flex-1 truncate">{provider.name}</span>
              <span
                aria-label={provider.available ? 'Disponível' : 'Indisponível'}
                className={`size-2 rounded-full ${provider.available ? 'bg-emerald-500' : 'bg-[rgb(var(--border-strong))]'}`}
              />
            </button>
          ))}
        </nav>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="flex size-8 items-center justify-center border border-[rgb(var(--border))] text-[rgb(var(--text-muted))]">
                <TypeIcon className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{selected.name}</h3>
                <p className="mt-0.5 text-[11px] text-[rgb(var(--text-muted))]">
                  {selected.execution === 'local'
                    ? 'Executa neste computador'
                    : 'Processamento remoto'}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                checked={draft.enabled}
                className="accent-[rgb(var(--accent))]"
                onChange={(event) => update('enabled', event.target.checked)}
                type="checkbox"
              />
              Provider ativo
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(selected.capabilities).map(([key, enabled]) => (
              <span
                className={`border px-2 py-1 font-mono text-[9px] uppercase ${enabled ? 'border-emerald-500/30 text-emerald-500' : 'border-[rgb(var(--border))] text-[rgb(var(--text-subtle))]'}`}
                key={key}
              >
                {key}
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-[rgb(var(--text-muted))]">
              Alias personalizado
              <input
                className={fieldClass}
                onChange={(event) => update('alias', event.target.value)}
                value={draft.alias}
              />
            </label>
            <label className="text-xs text-[rgb(var(--text-muted))]">
              Modelo padrão
              <input
                className={fieldClass}
                list={`models-${selected.id}`}
                onChange={(event) => update('defaultModel', event.target.value)}
                placeholder="Escolha após testar"
                value={draft.defaultModel}
              />
              <datalist id={`models-${selected.id}`}>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </datalist>
            </label>
            {selected.type !== 'cli' ? (
              <label className="text-xs text-[rgb(var(--text-muted))] sm:col-span-2">
                Endpoint
                <input
                  className={fieldClass}
                  onChange={(event) => update('baseUrl', event.target.value)}
                  value={draft.baseUrl}
                />
              </label>
            ) : null}
            {selected.type === 'api' ? (
              <label className="text-xs text-[rgb(var(--text-muted))] sm:col-span-2">
                Chave de API {selected.configured ? '— configurada' : ''}
                <div className="relative">
                  <KeyRound className="absolute left-3 top-4 size-3.5 text-[rgb(var(--text-subtle))]" />
                  <input
                    autoComplete="off"
                    className={`${fieldClass} pl-9`}
                    disabled={!secretAvailable}
                    onChange={(event) => setSecret(event.target.value)}
                    placeholder={
                      secretAvailable
                        ? 'Cole uma nova chave para substituir'
                        : 'Cofre seguro indisponível'
                    }
                    type="password"
                    value={secret}
                  />
                </div>
              </label>
            ) : null}
            <label className="text-xs text-[rgb(var(--text-muted))]">
              Limite de tokens
              <input
                className={fieldClass}
                min="1"
                onChange={(event) => update('tokenLimit', Number(event.target.value))}
                type="number"
                value={draft.tokenLimit}
              />
            </label>
            <label className="text-xs text-[rgb(var(--text-muted))]">
              Limite de custo (USD)
              <input
                className={fieldClass}
                min="0"
                onChange={(event) =>
                  update('costLimitUsd', event.target.value ? Number(event.target.value) : null)
                }
                placeholder="Sem limite"
                step="0.01"
                type="number"
                value={draft.costLimitUsd ?? ''}
              />
            </label>
            <label className="text-xs text-[rgb(var(--text-muted))]">
              Timeout (ms)
              <input
                className={fieldClass}
                min="1000"
                onChange={(event) => update('timeoutMs', Number(event.target.value))}
                type="number"
                value={draft.timeoutMs}
              />
            </label>
            <label className="text-xs text-[rgb(var(--text-muted))]">
              Concorrência
              <input
                className={fieldClass}
                max="16"
                min="1"
                onChange={(event) => update('concurrency', Number(event.target.value))}
                type="number"
                value={draft.concurrency}
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button disabled={busy} onClick={() => void perform('save')} size="sm">
              {busy ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}{' '}
              Salvar
            </Button>
            <Button
              disabled={busy}
              onClick={() => void perform('test')}
              size="sm"
              variant="secondary"
            >
              <Play className="size-3.5" /> Testar conexão
            </Button>
            {message ? (
              <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
                <Check className="size-3.5" /> {message}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Surface>
  );
}
