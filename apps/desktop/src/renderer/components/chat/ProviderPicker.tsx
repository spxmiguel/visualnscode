import { Check, ChevronDown, Settings2 } from 'lucide-react';
import type { ProviderSummary } from '@visualnscode/providers/browser';
import { useEffect, useRef, useState } from 'react';
import { ProviderIcon } from '../providers/ProviderIcon';

export const isProviderReady = (provider: ProviderSummary): boolean =>
  provider.settings.enabled && provider.configured && provider.available;

export const providerSetupHint = (provider: ProviderSummary): string => {
  if (isProviderReady(provider)) return 'Pronto para usar';
  if (provider.type === 'cli') {
    if (!provider.available) return 'Configure a CLI no computador';
    return 'Ative a CLI nas configurações';
  }
  if (provider.requiresSecret && !provider.configured) return 'Configure uma chave de API';
  if (provider.type === 'local' && !provider.available) {
    return provider.id === 'ollama' ? 'Instale ou inicie o Ollama' : 'Inicie o servidor local';
  }
  if (!provider.settings.enabled) return 'Ative nas configurações';
  return 'Revise a configuração';
};

interface ProviderPickerProps {
  readonly compact?: boolean;
  readonly onConfigure: () => void;
  readonly onSelect: (provider: ProviderSummary) => void;
  readonly providers: readonly ProviderSummary[];
  readonly selected: ProviderSummary | undefined;
}

export function ProviderPicker({
  compact = false,
  onConfigure,
  onSelect,
  providers,
  selected,
}: ProviderPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 flex-1" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Escolher IA do chat"
        className={`flex w-full min-w-0 items-center gap-2 rounded-md text-left hover:bg-[rgb(var(--surface-hover))] ${compact ? 'px-1 py-1' : 'bg-[rgb(var(--surface-sunken))] px-2 py-1.5'}`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <ProviderIcon
          className={`${compact ? 'size-4' : 'size-3.5'} text-[rgb(var(--text-muted))]`}
          providerId={selected?.id}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-medium text-[rgb(var(--text))]">
            {compact ? 'Assistente do projeto' : selected?.settings.alias || selected?.name || 'IA'}
          </span>
          <span className="block truncate text-[9px] text-[rgb(var(--text-subtle))]">
            {selected
              ? compact
                ? `${selected.settings.alias || selected.name} · ${providerSetupHint(selected)}`
                : providerSetupHint(selected)
              : 'Escolha uma IA'}
          </span>
        </span>
        <ChevronDown className={`size-3 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          aria-label="IAs disponíveis"
          className="absolute left-0 top-full z-50 mt-1 max-h-80 w-[min(22rem,calc(100vw-2rem))] overflow-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-1 shadow-2xl"
          role="listbox"
        >
          {providers.map((provider) => {
            const ready = isProviderReady(provider);
            const active = provider.id === selected?.id;
            return (
              <button
                aria-selected={active}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left ${active ? 'bg-[rgb(var(--surface-hover))]' : 'hover:bg-[rgb(var(--surface-hover))]'}`}
                key={provider.id}
                onClick={() => {
                  onSelect(provider);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[rgb(var(--border))] text-[rgb(var(--text-muted))]">
                  <ProviderIcon className="size-4" providerId={provider.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium">
                    {provider.settings.alias || provider.name}
                  </span>
                  <span
                    className={`block truncate text-[9px] ${ready ? 'text-emerald-500' : 'text-[rgb(var(--text-subtle))]'}`}
                  >
                    {providerSetupHint(provider)}
                  </span>
                </span>
                {active ? <Check className="size-3.5 text-[rgb(var(--accent))]" /> : null}
              </button>
            );
          })}
          <button
            className="mt-1 flex w-full items-center gap-2 border-t border-[rgb(var(--border))] px-2.5 py-2 text-left text-[10px] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
            onClick={() => {
              setOpen(false);
              onConfigure();
            }}
            type="button"
          >
            <Settings2 className="size-3.5" /> Configurar providers e modelos
          </button>
        </div>
      ) : null}
    </div>
  );
}
