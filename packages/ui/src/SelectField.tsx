import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label: string;
  readonly hideLabel?: boolean;
}

export function SelectField({
  className = '',
  hideLabel = false,
  label,
  ...props
}: SelectFieldProps) {
  return (
    <label className={`relative block ${className}`}>
      <span
        className={hideLabel ? 'sr-only' : 'mb-1.5 block text-xs text-[rgb(var(--text-muted))]'}
      >
        {label}
      </span>
      <select
        aria-label={hideLabel ? label : undefined}
        className="h-8 w-full appearance-none rounded-[5px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] py-1 pl-2.5 pr-8 text-xs text-[rgb(var(--text))] outline-none transition focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))]"
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        className={`pointer-events-none absolute right-2.5 size-3.5 text-[rgb(var(--text-subtle))] ${hideLabel ? 'top-2' : 'bottom-2'}`}
      />
    </label>
  );
}
