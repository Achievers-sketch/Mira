import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { SuggestionForm } from "@/components/site/SuggestionForm";
import { Spinner } from "@/components/ui/Spinner";
import { SUGGESTION_CATEGORIES } from "@/lib/validation/suggestion";

export const metadata: Metadata = { title: "Suggest an improvement" };

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Help improve Mira</h1>
      <Suspense fallback={<div className="mt-6"><Spinner label="Loading" /></div>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: mine } = await supabase
    .from("suggestions")
    .select("id,category,message,created_at")
    .order("created_at", { ascending: false })
    .limit(5); // RLS: only the signed-in user's own rows
  const first = user.displayName.trim().split(/\s+/)[0];
  const label = (v: string) => SUGGESTION_CATEGORIES.find((c) => c.value === v)?.label ?? v;

  return (
    <>
      <p className="mt-3 text-lg text-muted">
        {first ? `Hi ${first}, h` : "H"}ow could Mira talk with you better? Tell us what felt helpful,
        what didn&apos;t, or what you&apos;d like it to do. Your suggestions are linked to your account so we
        can understand what works for you. Your conversations with Mira are never shared here.
      </p>
      <div className="mt-6">
        <SuggestionForm email={user.email} />
      </div>

      {mine && mine.length > 0 && (
        <section className="mt-10" aria-labelledby="past">
          <h2 id="past" className="text-xl font-bold">Your recent suggestions</h2>
          <ul className="mt-3 space-y-3">
            {mine.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-brand-strong">
                  {label(s.category)} · {new Date(s.created_at).toLocaleDateString("en-GB", { timeZone: "UTC" })}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{s.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
