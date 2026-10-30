import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ChatMessage } from "./service";

export interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

export interface CrisisContact {
  id: string;
  label: string;
  phone: string;
  notes: string | null;
}

/** Reads below use the signed-in user's own session, so Row Level Security limits them to their data. */
export async function listConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id,title,updated_at")
    .order("updated_at", { ascending: false })
    .limit(30);
  return (data ?? []) as ConversationSummary[];
}

export async function getConversationMessages(id: string): Promise<ChatMessage[] | null> {
  const supabase = await createClient();
  const { data: convo } = await supabase.from("conversations").select("id").eq("id", id).maybeSingle();
  if (!convo) return null;
  const { data } = await supabase
    .from("messages")
    .select("role,content")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []) as ChatMessage[];
}

/** Only contacts an administrator has verified and activated are visible (enforced by RLS). */
export async function getCrisisContacts(): Promise<CrisisContact[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("crisis_contacts").select("id,label,phone,notes").order("label");
  return (data ?? []) as CrisisContact[];
}
