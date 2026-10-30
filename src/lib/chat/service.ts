import type { Entitlements } from "@/lib/entitlements";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { detectCrisis } from "./safety";

export const MAX_MESSAGE_CHARS = 2000;
export const HISTORY_LIMIT = 20;
export const PER_MINUTE_LIMIT = 8;
export const ERROR_SENTINEL = "\n\n[[MIRA_ERROR]]";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatStore {
  getConversation(id: string): Promise<{ id: string; user_id: string } | null>;
  createConversation(userId: string, title: string): Promise<{ id: string }>;
  consume(
    userId: string,
    monthlyLimit: number | null,
    perMinute: number,
  ): Promise<{ status: "ok" | "rate_limited" | "limit_reached"; eventId: string | null }>;
  refund(eventId: string): Promise<void>;
  addMessage(m: {
    conversationId: string;
    userId: string;
    role: "user" | "assistant";
    content: string;
    safetyFlag?: "crisis" | null;
  }): Promise<void>;
  recentMessages(conversationId: string, limit: number): Promise<ChatMessage[]>;
  touchConversation(id: string): Promise<void>;
}

export interface ModelClient {
  stream(args: { system: string; messages: ChatMessage[] }): AsyncIterable<string>;
}

export type ChatResult =
  | { kind: "error"; status: number; code: string; message: string }
  | {
      kind: "stream";
      conversationId: string;
      safety: "crisis" | "none";
      stream: AsyncGenerator<string>;
    };

function titleFrom(message: string) {
  const t = message.replace(/\s+/g, " ").trim();
  return t.length > 60 ? `${t.slice(0, 57)}...` : t;
}

/** Drop leading assistant turns so the model always sees the conversation starting from the user. */
function startWithUser(msgs: ChatMessage[]): ChatMessage[] {
  const i = msgs.findIndex((m) => m.role === "user");
  return i === -1 ? [] : msgs.slice(i);
}

export async function handleChat(
  deps: { store: ChatStore; model: ModelClient },
  user: { id: string; entitlements: Entitlements },
  input: { conversationId?: string; message: string },
): Promise<ChatResult> {
  const { store, model } = deps;
  const message = input.message.trim();

  if (!user.entitlements.aiChat) {
    return { kind: "error", status: 403, code: "not_entitled", message: "AI chat isn't included in your plan." };
  }
  if (message.length === 0 || message.length > MAX_MESSAGE_CHARS) {
    return { kind: "error", status: 400, code: "invalid_message", message: `Messages must be 1 to ${MAX_MESSAGE_CHARS} characters.` };
  }

  // Ownership: a conversation that is missing and one that belongs to someone else look identical.
  let conversationId = input.conversationId;
  if (conversationId) {
    const existing = await store.getConversation(conversationId);
    if (!existing || existing.user_id !== user.id) {
      return { kind: "error", status: 404, code: "not_found", message: "Conversation not found." };
    }
  }

  const usage = await store.consume(user.id, user.entitlements.monthlyAiMessageLimit, PER_MINUTE_LIMIT);
  if (usage.status === "rate_limited") {
    return { kind: "error", status: 429, code: "rate_limited", message: "You're sending messages quickly. Please wait a moment and try again." };
  }
  if (usage.status === "limit_reached") {
    return { kind: "error", status: 429, code: "limit_reached", message: "You've reached this month's message limit for your plan." };
  }

  const crisis = detectCrisis(message);

  try {
    if (!conversationId) {
      conversationId = (await store.createConversation(user.id, titleFrom(message))).id;
    }
    await store.addMessage({
      conversationId,
      userId: user.id,
      role: "user",
      content: message,
      safetyFlag: crisis ? "crisis" : null,
    });
  } catch {
    if (usage.eventId) await store.refund(usage.eventId).catch(() => {});
    return { kind: "error", status: 500, code: "storage_error", message: "Something went wrong saving your message. Please try again." };
  }

  const convoId = conversationId;
  const history = startWithUser(await store.recentMessages(convoId, HISTORY_LIMIT));
  const system = buildSystemPrompt(crisis);

  async function* run(): AsyncGenerator<string> {
    let text = "";
    try {
      for await (const chunk of model.stream({ system, messages: history })) {
        text += chunk;
        yield chunk;
      }
      if (text.trim().length === 0) throw new Error("empty reply");
    } catch {
      if (text.trim().length === 0) {
        // Nothing reached the user: don't charge them for it.
        if (usage.eventId) await store.refund(usage.eventId).catch(() => {});
      } else {
        await store
          .addMessage({ conversationId: convoId, userId: user.id, role: "assistant", content: text })
          .catch(() => {});
      }
      yield ERROR_SENTINEL;
      return;
    }
    await store
      .addMessage({ conversationId: convoId, userId: user.id, role: "assistant", content: text })
      .catch(() => {});
    await store.touchConversation(convoId).catch(() => {});
  }

  return { kind: "stream", conversationId: convoId, safety: crisis ? "crisis" : "none", stream: run() };
}
