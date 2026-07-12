import { AlertCircle, X } from 'lucide-react';

interface ErrorNoticeProps {
  readonly message: string;
  readonly onDismiss?: () => void;
  readonly title?: string;
}

export function ErrorNotice({
  message,
  onDismiss,
  title = 'Algo não saiu como esperado',
}: ErrorNoticeProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm"
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[rgb(var(--text))]">{title}</p>
        <p className="mt-1 text-[rgb(var(--text-muted))]">{message}</p>
      </div>
      {onDismiss ? (
        <button
          aria-label="Fechar mensagem"
          className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
          onClick={onDismiss}
          type="button"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
