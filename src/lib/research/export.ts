import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { coarseMonth, deidentify, selfTokens } from "./deidentify";

export const EXPORT_MESSAGE_CAP = 20000;

export interface ExportStats {
  consentingUsers: number;
  messages: number;
}

/** Counts what an export would contain right now (consenting users only). */
export async function exportStats(): Promise<ExportStats> {
  const admin = createAdminClient();
  const { data: users } = await admin.from("profiles").select("id").eq("research_consent", true);
  const ids = (users ?? []).map((u) => u.id);
  if (ids.length === 0) return { consentingUsers: 0, messages: 0 };
  const { count } = await admin.from("messages").select("id", { count: "exact", head: true }).in("user_id", ids);
  return { consentingUsers: ids.length, messages: count ?? 0 };
}

/**
 * Builds a JSONL string of de-identified messages from users who currently consent.
 * User and conversation ids are replaced with random per-export pseudonyms (not reusable across
 * exports), timestamps are coarsened to the month, and obvious identifiers are masked.
 */
export async function buildExport(): Promise<{ jsonl: string; rows: number }> {
  const admin = createAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id,display_name")
    .eq("research_consent", true);
  if (!users || users.length === 0) return { jsonl: "", rows: 0 };

  const ids = users.map((u) => u.id);
  const emails = new Map<string, string | null>();
  for (const u of users) {
    const { data } = await admin.auth.admin.getUserById(u.id);
    emails.set(u.id, data.user?.email ?? null);
  }
  const tokens = new Map(users.map((u) => [u.id, selfTokens(u.display_name, emails.get(u.id) ?? null)]));

  const { data: msgs } = await admin
    .from("messages")
    .select("conversation_id,user_id,role,content,safety_flag,created_at")
    .in("user_id", ids)
    .order("created_at", { ascending: true })
    .limit(EXPORT_MESSAGE_CAP);

  const userPseudo = new Map<string, string>();
  const convPseudo = new Map<string, string>();
  const pseudo = (m: Map<string, string>, id: string) => {
    let v = m.get(id);
    if (!v) m.set(id, (v = randomUUID()));
    return v;
  };

  const lines = (msgs ?? []).map((m) =>
    JSON.stringify({
      user: pseudo(userPseudo, m.user_id),
      conversation: pseudo(convPseudo, m.conversation_id),
      role: m.role,
      text: deidentify(m.content, tokens.get(m.user_id) ?? []),
      crisis_flag: m.safety_flag === "crisis",
      month: coarseMonth(m.created_at),
    }),
  );
  return { jsonl: lines.join("\n") + (lines.length ? "\n" : ""), rows: lines.length };
}
