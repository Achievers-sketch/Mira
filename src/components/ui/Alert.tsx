import { cn } from "./cn";

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-border bg-brand-soft",
    warning: "border-warn-border bg-warn-bg",
    error: "border-danger bg-surface",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "note"}
      className={cn("rounded-xl border-2 p-4", tones[tone])}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className="text-[0.95rem]">{children}</div>
    </div>
  );
}
