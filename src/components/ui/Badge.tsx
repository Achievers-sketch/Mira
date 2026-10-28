import { cn } from "./cn";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "live" | "soon";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-brand-soft text-brand-strong",
    live: "bg-brand text-on-brand",
    soon: "border border-warn-border bg-warn-bg text-foreground",
  };
  return (
    <span className={cn("inline-block rounded-full px-3 py-1 text-sm font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
