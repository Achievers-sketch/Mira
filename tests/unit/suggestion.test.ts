import { describe, expect, it } from "vitest";
import { suggestionSchema } from "@/lib/validation/suggestion";

const ok = { category: "tone", message: "Please be a little warmer.", followUp: false };

describe("suggestionSchema", () => {
  it("accepts a valid suggestion", () => expect(suggestionSchema.safeParse(ok).success).toBe(true));
  it("rejects short messages", () => expect(suggestionSchema.safeParse({ ...ok, message: "short" }).success).toBe(false));
  it("rejects over-long messages", () =>
    expect(suggestionSchema.safeParse({ ...ok, message: "x".repeat(1001) }).success).toBe(false));
  it("rejects unknown categories", () => expect(suggestionSchema.safeParse({ ...ok, category: "nope" }).success).toBe(false));
  it("trims whitespace before counting", () =>
    expect(suggestionSchema.safeParse({ ...ok, message: "   a       " }).success).toBe(false));
});
