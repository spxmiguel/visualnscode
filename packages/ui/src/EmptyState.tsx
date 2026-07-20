import type { ReactNode } from 'react';

interface EmptyStateProps {
  readonly action?: ReactNode;
  readonly description: string;
  readonly icon?: ReactNode;
  readonly title: string;
}

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 text-center">
      {icon ? (
        <div className="mb-4 flex size-9 items-center justify-center border border-[rgb(var(--border))] text-[rgb(var(--text-muted))]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[rgb(var(--text-muted))]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
