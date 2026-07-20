interface Segment<T extends string> {
  readonly label: string;
  readonly value: T;
}

interface SegmentedControlProps<T extends string> {
  readonly label: string;
  readonly onChange: (value: T) => void;
  readonly options: readonly Segment<T>[];
  readonly value: T;
}

export function SegmentedControl<T extends string>({
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={label}
      className="inline-flex rounded-[5px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-sunken))] p-0.5"
      role="group"
    >
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={`rounded-[3px] px-3 py-1 text-xs font-medium transition ${value === option.value ? 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text))] shadow-[0_1px_2px_rgb(0_0_0/0.08)]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'}`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
