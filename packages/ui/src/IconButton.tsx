import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly children: ReactNode;
  readonly active?: boolean;
}

export function IconButton({
  active = false,
  children,
  className = '',
  label,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active || undefined}
      className={`inline-flex size-8 items-center justify-center rounded-[5px] outline-none transition focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus))] ${active ? 'bg-[rgb(var(--surface-hover))] text-[rgb(var(--text))] shadow-[inset_2px_0_0_rgb(var(--accent))]' : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text))]'} ${className}`}
      title={label}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
