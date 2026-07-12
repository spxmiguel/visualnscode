interface AppMarkProps {
  readonly compact?: boolean;
  readonly size?: number;
}

export function AppMark({ compact = false, size = 28 }: AppMarkProps) {
  return (
    <div className="flex items-center gap-2">
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        style={{ flexShrink: 0 }}
        viewBox="0 0 28 28"
        width={size}
      >
        <rect fill="#7C5CFC" height="28" rx="8" width="28" />
        <path
          d="M8 10l4 4-4 4"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M15 18h5"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
      {!compact ? (
        <span className="text-sm font-semibold tracking-tight text-[rgb(var(--text))]">
          VisualnsCode
        </span>
      ) : null}
    </div>
  );
}
