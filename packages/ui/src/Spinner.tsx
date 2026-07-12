export function Spinner({ label = 'Carregando' }: { readonly label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]"
      role="status"
    >
      <span className="size-4 animate-spin rounded-full border-2 border-[rgb(var(--border-strong))] border-t-[rgb(var(--accent))]" />
      {label}
    </span>
  );
}
