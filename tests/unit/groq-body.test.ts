import { describe, expect, it } from "vitest";
import { buildGroqBody } from "@/lib/ai/groq";

const msgs = [{ role: "user" as const, content: "hi" }];

describe("buildGroqBody", () => {
  it("uses a normal budget and no reasoning setting for standard models", () => {
    const b = buildGroqBody("llama-3.3-70b-versatile", "SYS", msgs);
    expect(b.max_completion_tokens).toBe(700);
    expect("reasoning_effort" in b).toBe(false);
    expect(b.stream).toBe(true);
    expect(b.messages[0]).toEqual({ role: "system", content: "SYS" });
    expect(b.messages[1]).toEqual(msgs[0]);
  });

  it("gives gpt-oss reasoning models a bigger budget and low effort", () => {
    const b = buildGroqBody("openai/gpt-oss-120b", "SYS", msgs);
    expect(b.max_completion_tokens).toBe(2048);
    expect(b).toMatchObject({ reasoning_effort: "low" });
  });
});
