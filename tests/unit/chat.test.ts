import { describe, expect, it } from "vitest";
import {
  ERROR_SENTINEL,
  handleChat,
  type ChatMessage,
  type ChatStore,
  type ModelClient,
} from "@/lib/chat/service";
import { detectCrisis } from "@/lib/chat/safety";
import { buildSystemPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import type { Entitlements } from "@/lib/entitlements";

const ent = (over: Partial<Entitlements> = {}): Entitlements => ({
  plan: "free",
  planNotYetAvailable: false,
  aiChat: true,
  monthlyAiMessageLimit: 100,
  humanSupportSessionsPerMonth: 0,
  browseProfessionals: false,
  bookAppointments: false,
  ...over,
});
const alice = (over: Partial<Entitlements> = {}) => ({ id: "alice", entitlements: ent(over) });

function fakeStore(opts: { status?: "ok" | "rate_limited" | "limit_reached"; failAdd?: boolean } = {}) {
  const convos = new Map<string, { id: string; user_id: string }>([["c-bob", { id: "c-bob", user_id: "bob" }]]);
  const messages: Array<ChatMessage & { conversationId: string; safetyFlag?: string | null }> = [];
  const refunds: string[] = [];
  const consumeArgs: unknown[][] = [];
  const store: ChatStore = {
    async getConversation(id) { return convos.get(id) ?? null; },
    async createConversation(userId) { const id = `c-${convos.size}`; convos.set(id, { id, user_id: userId }); return { id }; },
    async consume(...a) { consumeArgs.push(a); const s = opts.status ?? "ok"; return { status: s, eventId: s === "ok" ? "ev1" : null }; },
    async refund(id) { refunds.push(id); },
    async addMessage(m) { if (opts.failAdd) throw new Error("db"); messages.push({ role: m.role, content: m.content, conversationId: m.conversationId, safetyFlag: m.safetyFlag }); },
    async recentMessages(id) { return messages.filter((m) => m.conversationId === id).map(({ role, content }) => ({ role, content })); },
    async touchConversation() {},
  };
  return { store, messages, refunds, consumeArgs };
}

function fakeModel(chunks: string[], failAfter?: number) {
  const calls: Array<{ system: string; messages: ChatMessage[] }> = [];
  const model: ModelClient = {
    async *stream(args) {
      calls.push(args);
      let i = 0;
      for (const c of chunks) {
        if (failAfter !== undefined && i === failAfter) throw new Error("upstream");
        i++;
        yield c;
      }
      if (failAfter !== undefined && i === failAfter) throw new Error("upstream");
    },
  };
  return { model, calls };
}

async function drain(r: Awaited<ReturnType<typeof handleChat>>) {
  if (r.kind !== "stream") throw new Error("not a stream");
  let out = "";
  for await (const c of r.stream) out += c;
  return out;
}

describe("handleChat", () => {
  it("streams a reply and stores both messages", async () => {
    const s = fakeStore(); const m = fakeModel(["Hel", "lo"]);
    const r = await handleChat({ store: s.store, model: m.model }, alice(), { message: "hi mira" });
    expect(r.kind).toBe("stream");
    expect(await drain(r)).toBe("Hello");
    expect(s.messages.map((x) => [x.role, x.content])).toEqual([["user", "hi mira"], ["assistant", "Hello"]]);
    expect(m.calls[0].messages).toEqual([{ role: "user", content: "hi mira" }]);
  });

  it("rejects users without the chat entitlement and empty or oversized messages", async () => {
    const s = fakeStore(); const m = fakeModel(["x"]);
    const deps = { store: s.store, model: m.model };
    expect((await handleChat(deps, alice({ aiChat: false }), { message: "hi" })) as { status: number }).toMatchObject({ kind: "error", status: 403 });
    expect(await handleChat(deps, alice(), { message: "   " })).toMatchObject({ kind: "error", status: 400 });
    expect(await handleChat(deps, alice(), { message: "a".repeat(2001) })).toMatchObject({ kind: "error", status: 400 });
    expect(m.calls.length).toBe(0);
    expect(s.consumeArgs.length).toBe(0);
  });

  it("does not reveal or use someone else's conversation", async () => {
    const s = fakeStore(); const m = fakeModel(["x"]);
    const r = await handleChat({ store: s.store, model: m.model }, alice(), { conversationId: "c-bob", message: "hi" });
    expect(r).toMatchObject({ kind: "error", status: 404 });
    const missing = await handleChat({ store: s.store, model: m.model }, alice(), { conversationId: "nope", message: "hi" });
    expect(missing).toMatchObject({ kind: "error", status: 404 });
    expect(s.messages.length).toBe(0);
    expect(s.consumeArgs.length).toBe(0);
  });

  it("enforces rate and monthly limits without calling the model", async () => {
    for (const [status, code] of [["rate_limited", "rate_limited"], ["limit_reached", "limit_reached"]] as const) {
      const s = fakeStore({ status }); const m = fakeModel(["x"]);
      const r = await handleChat({ store: s.store, model: m.model }, alice(), { message: "hi" });
      expect(r).toMatchObject({ kind: "error", status: 429, code });
      expect(m.calls.length).toBe(0);
      expect(s.messages.length).toBe(0);
    }
  });

  it("passes the plan's monthly limit to the usage check", async () => {
    const s = fakeStore(); const m = fakeModel(["x"]);
    await handleChat({ store: s.store, model: m.model }, alice({ monthlyAiMessageLimit: 42 }), { message: "hi" });
    expect(s.consumeArgs[0][0]).toBe("alice");
    expect(s.consumeArgs[0][1]).toBe(42);
  });

  it("flags crisis language, stores the flag and adds the crisis instruction", async () => {
    const s = fakeStore(); const m = fakeModel(["I'm here."]);
    const r = await handleChat({ store: s.store, model: m.model }, alice(), { message: "I want to die" });
    expect(r).toMatchObject({ kind: "stream", safety: "crisis" });
    await drain(r);
    expect(s.messages[0].safetyFlag).toBe("crisis");
    expect(m.calls[0].system).toContain("IMPORTANT FOR THIS REPLY");
  });

  it("does not add the crisis instruction for ordinary messages", async () => {
    const s = fakeStore(); const m = fakeModel(["ok"]);
    const r = await handleChat({ store: s.store, model: m.model }, alice(), { message: "exams are stressing me" });
    expect(r).toMatchObject({ safety: "none" });
    await drain(r);
    expect(m.calls[0].system).not.toContain("IMPORTANT FOR THIS REPLY");
  });

  it("refunds usage when the model fails before producing anything", async () => {
    const s = fakeStore(); const m = fakeModel(["x"], 0);
    const out = await drain(await handleChat({ store: s.store, model: m.model }, alice(), { message: "hi" }));
    expect(out).toBe(ERROR_SENTINEL);
    expect(s.refunds).toEqual(["ev1"]);
    expect(s.messages.filter((x) => x.role === "assistant").length).toBe(0);
  });

  it("keeps partial replies, does not refund, and signals the error when the stream breaks midway", async () => {
    const s = fakeStore(); const m = fakeModel(["Part", "ial"], 1);
    const out = await drain(await handleChat({ store: s.store, model: m.model }, alice(), { message: "hi" }));
    expect(out).toBe("Part" + ERROR_SENTINEL);
    expect(s.refunds).toEqual([]);
    expect(s.messages.find((x) => x.role === "assistant")?.content).toBe("Part");
  });

  it("refunds and errors cleanly when saving the user's message fails", async () => {
    const s = fakeStore({ failAdd: true }); const m = fakeModel(["x"]);
    const r = await handleChat({ store: s.store, model: m.model }, alice(), { message: "hi" });
    expect(r).toMatchObject({ kind: "error", status: 500 });
    expect(s.refunds).toEqual(["ev1"]);
    expect(m.calls.length).toBe(0);
  });
});

describe("detectCrisis", () => {
  it.each([
    "I want to die", "i'm thinking about suicide", "I'm going to kill myself", "I don't want to live anymore",
    "better off dead", "I keep wanting to hurt myself", "i wan die", "he is going to kill me", "I took an overdose",
    "I can't go on", "thinking of ending my life", "she wants to hurt me", "they will kill me", "someone is gonna attack me",
  ])("flags: %s", (t) => expect(detectCrisis(t)).toBe(true));

  it.each([
    "I'm stressed about my exams", "I can't sleep well", "My project is killing me with workload",
    "I want to die laughing at that video".replace("die laughing", "learn guitar"), "Work has been hard", "I feel lonely at university",
  ])("does not flag: %s", (t) => expect(detectCrisis(t)).toBe(false));
});

describe("system prompt", () => {
  it("states key guardrails", () => {
    for (const phrase of ["Never diagnose", "medication", "coming soon", "cannot book", "untrusted", "Do not list phone numbers"]) {
      expect(SYSTEM_PROMPT.toLowerCase()).toContain(phrase.toLowerCase());
    }
    expect(buildSystemPrompt(false)).toBe(SYSTEM_PROMPT);
    expect(buildSystemPrompt(true).length).toBeGreaterThan(SYSTEM_PROMPT.length);
  });
});
