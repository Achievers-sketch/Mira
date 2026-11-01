import { describe, expect, it } from "vitest";
import { coarseMonth, deidentify, selfTokens } from "@/lib/research/deidentify";

describe("deidentify", () => {
  it("masks emails, links, phones and handles", () => {
    const out = deidentify("mail me a.b@x.com or +234 803 123 4567, see https://x.com/me and @sam_01");
    expect(out).toBe("mail me [email] or [number], see [link] and [handle]");
  });
  it("masks long digit runs but keeps short numbers", () => {
    expect(deidentify("I slept 4 hours; id 12345678")).toBe("I slept 4 hours; id [number]");
  });
  it("masks the user's own name tokens, case-insensitively", () => {
    const t = selfTokens("Ada Okoro", "ada.okoro@example.com");
    expect(deidentify("My name is ada okoro, call me Ada", t)).toBe("My name is [name] [name], call me [name]");
  });
  it("ignores very short name parts", () => {
    expect(selfTokens("Jo", null)).toEqual([]);
  });
  it("is not fooled by regex characters in names", () => {
    expect(() => deidentify("hi", ["a.b+c"])).not.toThrow();
  });
});

describe("coarseMonth", () => {
  it("keeps only year and month", () => expect(coarseMonth("2026-11-01T18:46:00Z")).toBe("2026-11"));
});
