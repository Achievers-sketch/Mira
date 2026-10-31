import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { SITE } from "@/config/site";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { isAiConfigured } from "@/lib/ai/provider";
import { getConversationMessages, getCrisisContacts, listConversations } from "@/lib/chat/queries";
import { ChatPanel } from "@/components/site/ChatPanel";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/components/ui/cn";
import { deleteConversation } from "./actions";

export const metadata: Metadata = { title: "Talk to Mira" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function TalkPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Talk to Mira</h1>
      <Suspense fallback={<div className="mt-6"><Spinner label="Loading" /></div>}>
        <TalkContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TalkContent({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireUser();
  const { c } = await searchParams;
  const requested = c && UUID.test(c) ? c : null;

  const [conversations, contacts, history] = await Promise.all([
    listConversations(),
    getCrisisContacts(),
    requested ? getConversationMessages(requested) : Promise.resolve(null),
  ]);

  const activeId = requested && history ? requested : null;
  const configured = isAiConfigured() && isAdminClientConfigured();

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[16rem_1fr]">
      <aside aria-label="Your conversations" className="space-y-3">
        <Link
          href="/talk"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border-2 border-brand px-4 font-semibold text-brand-strong hover:bg-brand-soft"
        >
          New chat
        </Link>
        {requested && !history && <Alert tone="warning">That conversation couldn&apos;t be found.</Alert>}
        <ul className="space-y-1">
          {conversations.map((cv) => (
            <li key={cv.id} className="flex items-center gap-1">
              <Link
                href={`/talk?c=${cv.id}`}
                aria-current={cv.id === activeId ? "page" : undefined}
                className={cn(
                  "min-h-11 flex-1 truncate rounded-lg px-3 py-2 hover:bg-brand-soft",
                  cv.id === activeId && "bg-brand-soft font-semibold",
                )}
              >
                {cv.title || "Conversation"}
              </Link>
              <form action={deleteConversation}>
                <input type="hidden" name="id" value={cv.id} />
                <button
                  type="submit"
                  className="min-h-11 rounded-lg px-2 text-sm text-muted hover:bg-brand-soft hover:text-danger"
                  aria-label={`Delete conversation: ${cv.title || "Conversation"}`}
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
        {conversations.length === 0 && <p className="text-sm text-muted">No conversations yet.</p>}
      </aside>

      <ChatPanel
        key={activeId ?? "new"}
        conversationId={activeId}
        initialMessages={history ?? []}
        crisisContacts={contacts}
        configured={configured}
        supportEmail={SITE.supportEmail}
      />
    </div>
  );
}
