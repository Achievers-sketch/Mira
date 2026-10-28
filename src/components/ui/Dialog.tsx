"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

/** Accessible modal built on the native <dialog> element (focus trap + Esc handled by the browser). */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-border bg-surface p-6 text-foreground backdrop:bg-black/50"
    >
      <h2 id="dialog-title" className="text-xl font-bold">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
      <div className="mt-6 text-right">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </dialog>
  );
}
