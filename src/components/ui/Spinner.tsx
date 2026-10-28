export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent"
      />
      <span className="text-sm text-muted">{label}…</span>
    </span>
  );
}
