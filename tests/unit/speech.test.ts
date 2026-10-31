import { describe, expect, it } from "vitest";
import { describeRecognitionError, toSpeakable } from "@/lib/speech/browser";

describe("toSpeakable", () => {
  it("removes markdown marks and links", () => {
    expect(toSpeakable("**Hello** _there_ see https://x.com/a now")).toBe("Hello there see now");
  });
  it("returns empty for only symbols", () => {
    expect(toSpeakable("***")).toBe("");
  });
});

describe("describeRecognitionError", () => {
  it("always offers typing as a fallback", () => {
    for (const c of ["not-allowed", "no-speech", "audio-capture", "network", "other"]) {
      expect(describeRecognitionError(c).toLowerCase()).toContain("type");
    }
  });
});
