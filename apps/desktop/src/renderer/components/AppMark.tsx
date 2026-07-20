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
        <rect
          height="27"
          rx="5.5"
          stroke="rgb(var(--border-strong))"
          transform="translate(.5 .5)"
          width="27"
        />
        <path
          d="M7.5 8.5 12 19.5 16.5 8.5"
          stroke="rgb(var(--text))"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="m20.5 8.5-3.5 11"
          stroke="rgb(var(--accent))"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
      {!compact ? (
        <span className="text-sm font-semibold tracking-[-0.02em] text-[rgb(var(--text))]">
          VisualnsCode
        </span>
      ) : null}
    </div>
  );
}
