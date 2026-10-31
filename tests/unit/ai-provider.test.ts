import { afterEach, describe, expect, it, vi } from "vitest";
import { sseTextDeltas } from "@/lib/ai/sse";
import { getProvider } from "@/lib/ai/provider";

const enc = new TextEncoder();
async function* chunks(...parts: string[]) {
  for (const p of parts) yield enc.encode(p);
}
async function collect(it: AsyncIterable<string>) {
  let out = "";
  for await (const c of it) out += c;
  return out;
}
const ev = (text: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;

describe("sseTextDeltas", () => {
  it("joins content deltas and stops at [DONE]", async () => {
    expect(await collect(sseTextDeltas(chunks(ev("Hel"), ev("lo"), "data: [DONE]\n\n")))).toBe("Hello");
  });

  it("handles events split across network chunks, including mid-line and mid-character", async () => {
    const whole = ev("Héllo") + ev(" wörld");
    const bytes = enc.encode(whole);
    const pieces: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += 5) pieces.push(bytes.slice(i, i + 5));
    async function* gen() { for (const p of pieces) yield p; }
    expect(await collect(sseTextDeltas(gen()))).toBe("Héllo wörld");
  });

  it("ignores role-only chunks, comments, blank lines and malformed JSON", async () => {
    const role = `data: ${JSON.stringify({ choices: [{ delta: { role: "assistant" } }] })}\n\n`;
    expect(await collect(sseTextDeltas(chunks(": ping\n\n", role, "data: {not json}\n\n", ev("ok"), "\n")))).toBe("ok");
  });

  it("handles CRLF line endings and a final event with no trailing newline", async () => {
    expect(await collect(sseTextDeltas(chunks(ev("a").replace(/\n/g, "\r\n"), `data: ${JSON.stringify({ choices: [{ delta: { content: "b" } }] })}`)))).toBe("ab");
  });

  it("throws when the stream carries an error event", async () => {
    await expect(collect(sseTextDeltas(chunks(`data: ${JSON.stringify({ error: { message: "rate limit" } })}\n\n`)))).rejects.toThrow("rate limit");
  });
});

describe("getProvider", () => {
  afterEach(() => vi.unstubAllEnvs());
  const clear = () => { vi.stubEnv("GROQ_API_KEY", ""); vi.stubEnv("ANTHROPIC_API_KEY", ""); vi.stubEnv("AI_PROVIDER", ""); };

  it("is null when nothing is configured", () => { clear(); expect(getProvider()).toBeNull(); });
  it("uses Groq when only a Groq key exists", () => { clear(); vi.stubEnv("GROQ_API_KEY", "g"); expect(getProvider()).toBe("groq"); });
  it("uses Anthropic when only an Anthropic key exists", () => { clear(); vi.stubEnv("ANTHROPIC_API_KEY", "a"); expect(getProvider()).toBe("anthropic"); });
  it("prefers Groq when both exist, unless AI_PROVIDER says otherwise", () => {
    clear(); vi.stubEnv("GROQ_API_KEY", "g"); vi.stubEnv("ANTHROPIC_API_KEY", "a");
    expect(getProvider()).toBe("groq");
    vi.stubEnv("AI_PROVIDER", "anthropic"); expect(getProvider()).toBe("anthropic");
  });
  it("is null when AI_PROVIDER names a provider without a key", () => {
    clear(); vi.stubEnv("GROQ_API_KEY", "g"); vi.stubEnv("AI_PROVIDER", "anthropic"); expect(getProvider()).toBeNull();
  });
});
