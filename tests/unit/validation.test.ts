import { describe, expect, it } from "vitest";
import { registerSchema, signInSchema, toFieldErrors } from "@/lib/validation/auth";

describe("auth validation", () => {
  it("accepts valid registration and normalises email", () => {
    const r = registerSchema.safeParse({ name: " Ada ", email: " ADA@Example.com ", password: "longenough" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("ada@example.com");
      expect(r.data.name).toBe("Ada");
    }
  });

  it("rejects short passwords, bad emails and empty names", () => {
    const r = registerSchema.safeParse({ name: "", email: "nope", password: "short" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errs = toFieldErrors(r.error);
      expect(errs.name).toBeDefined();
      expect(errs.email).toBeDefined();
      expect(errs.password).toBeDefined();
    }
  });

  it("rejects over-long names", () => {
    expect(registerSchema.safeParse({ name: "a".repeat(81), email: "a@b.co", password: "12345678" }).success).toBe(false);
  });

  it("requires a password on sign-in", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
