import type { HTMLAttributes } from 'react';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly elevated?: boolean;
}

export function Surface({ className = '', elevated = false, ...props }: SurfaceProps) {
  return (
    <div
      className={`rounded-xl border border-[rgb(var(--border))] ${elevated ? 'bg-[rgb(var(--surface-raised))] shadow-[var(--shadow-panel)]' : 'bg-[rgb(var(--surface))]'} ${className}`}
      {...props}
    />
  );
}
