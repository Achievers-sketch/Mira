import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatStore } from "./service";

export function createChatStore(): ChatStore {
  const db = createAdminClient();
  return {
    async getConversation(id) {
      const { data } = await db.from("conversations").select("id,user_id").eq("id", id).maybeSingle();
      return data ?? null;
    },
    async createConversation(userId, title) {
      const { data, error } = await db
        .from("conversations")
        .insert({ user_id: userId, title })
        .select("id")
        .single();
      if (error || !data) throw new Error("create conversation failed");
      return data;
    },
    async consume(userId, monthlyLimit, perMinute) {
      const { data, error } = await db.rpc("consume_ai_message", {
        p_user: userId,
        p_monthly_limit: monthlyLimit,
        p_per_minute: perMinute,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) throw new Error("usage check failed");
      return { status: row.status, eventId: row.event_id ?? null };
    },
    async refund(eventId) {
      await db.from("usage_events").delete().eq("id", eventId);
    },
    async addMessage(m) {
      const { error } = await db.from("messages").insert({
        conversation_id: m.conversationId,
        user_id: m.userId,
        role: m.role,
        content: m.content.slice(0, 8000),
        safety_flag: m.safetyFlag ?? null,
      });
      if (error) throw new Error("add message failed");
    },
    async recentMessages(conversationId, limit) {
      const { data } = await db
        .from("messages")
        .select("role,content,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data ?? []).reverse().map((r) => ({ role: r.role as "user" | "assistant", content: r.content as string }));
    },
    async touchConversation(id) {
      await db.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);
    },
  };
}
