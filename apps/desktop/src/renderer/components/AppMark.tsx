import { Sparkles } from 'lucide-react';

export function AppMark({ compact = false }: { readonly compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/15">
        <span className="absolute inset-[1px] rounded-[9px] border border-white/20" />
        <Sparkles className="size-4" strokeWidth={2.2} />
      </span>
      {!compact ? (
        <strong className="text-sm font-semibold tracking-tight">VisualnsCode</strong>
      ) : null}
    </div>
  );
}
