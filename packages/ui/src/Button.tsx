import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  readonly size?: 'sm' | 'md';
}

const variants = {
  primary: 'bg-[rgb(var(--accent))] text-white shadow-sm hover:bg-[rgb(var(--accent-hover))]',
  secondary:
    'border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-hover))]',
  ghost:
    'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text))]',
  danger: 'bg-red-600 text-white hover:bg-red-500',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
} as const;

export function Button({
  className = '',
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))] disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${sizes[size]} ${className}`}
      type={type}
      {...props}
    />
  );
}
