import type { Metadata } from "next";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth/dal";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { exportStats } from "@/lib/research/export";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Research export", robots: { index: false } };

export default function ExportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Research export</h1>
      <Suspense fallback={<div className="mt-6"><Spinner label="Loading" /></div>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  await requireRole("admin");
  if (!isAdminClientConfigured()) {
    return <Alert tone="warning" title="Not configured">The service-role key is missing on this deployment.</Alert>;
  }
  const s = await exportStats();
  return (
    <>
      <p className="mt-3 text-muted">
        Only chats from users who currently allow de-identified use are included. Names, emails, phone
        numbers, links and handles are masked, ids are replaced with random per-export pseudonyms, and
        dates are reduced to the month. Masking is best-effort, so treat the file as sensitive: store it
        encrypted, never email it, and obtain ethics approval before research use.
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-sm text-muted">Consenting users</dt>
          <dd className="text-2xl font-extrabold">{s.consentingUsers}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-sm text-muted">Messages</dt>
          <dd className="text-2xl font-extrabold">{s.messages}</dd>
        </div>
      </dl>
      <a
        href="/api/admin/export"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-brand px-6 font-semibold text-on-brand"
      >
        Download de-identified file (.jsonl)
      </a>
    </>
  );
}
