import { useId } from "react";
import { cn } from "./cn";

export function Field({
  label,
  hint,
  error,
  className,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint && hintId, error && errId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "min-h-11 w-full rounded-lg border-2 border-border bg-surface px-3 py-2 text-base",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
