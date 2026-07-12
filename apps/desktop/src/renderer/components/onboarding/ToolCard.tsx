import {
  Check,
  CircleAlert,
  Download,
  ExternalLink,
  MapPin,
  Play,
  SkipForward,
} from 'lucide-react';
import { Button, Spinner } from '@visualnscode/ui';
import { toolCatalog, type ToolDetectionResult } from '@visualnscode/integrations';

interface ToolCardProps {
  readonly result?: ToolDetectionResult | undefined;
  readonly toolId: string;
  readonly busy?: boolean;
  readonly ignored?: boolean;
  readonly onAction: (action: 'install' | 'test' | 'docs' | 'ignore') => void;
}

export function ToolCard({ busy, ignored, onAction, result, toolId }: ToolCardProps) {
  const definition = toolCatalog.find(({ id }) => id === toolId);
  if (!definition) return null;
  const installed = result?.installed && result.status === 'installed';
  return (
    <article
      className={`rounded-xl border p-4 transition ${ignored ? 'border-[rgb(var(--border))] opacity-55' : installed ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))]'}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${installed ? 'bg-emerald-500/15 text-emerald-500' : result?.status === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-[rgb(var(--surface-sunken))] text-[rgb(var(--text-muted))]'}`}
        >
          {busy ? (
            <Spinner label="" />
          ) : installed ? (
            <Check className="size-4" />
          ) : (
            <CircleAlert className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{definition.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${installed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[rgb(var(--surface-sunken))] text-[rgb(var(--text-subtle))]'}`}
            >
              {ignored
                ? 'Ignorada'
                : installed
                  ? 'Instalada'
                  : result
                    ? 'Não instalada'
                    : 'Aguardando'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
            {result?.message ?? 'Clique em Testar para verificar.'}
          </p>
          {result?.version ? (
            <p className="mt-2 font-mono text-[11px] text-[rgb(var(--text-subtle))]">
              {result.version}
            </p>
          ) : null}
          {result?.path ? (
            <p className="mt-1 flex items-center gap-1 truncate font-mono text-[10px] text-[rgb(var(--text-subtle))]">
              <MapPin className="size-3 shrink-0" /> {result.path}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => onAction('test')} size="sm" variant="secondary">
          <Play className="size-3" /> Testar
        </Button>
        {!installed && definition.install ? (
          <Button disabled={busy} onClick={() => onAction('install')} size="sm">
            <Download className="size-3" /> Instalar
          </Button>
        ) : null}
        <Button onClick={() => onAction('docs')} size="sm" variant="ghost">
          <ExternalLink className="size-3" /> Documentação
        </Button>
        <Button onClick={() => onAction('ignore')} size="sm" variant="ghost">
          <SkipForward className="size-3" /> Ignorar
        </Button>
      </div>
    </article>
  );
}
