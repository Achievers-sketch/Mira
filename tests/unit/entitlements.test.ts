import { describe, expect, it } from "vitest";
import { resolveEntitlements, type PlanRow } from "@/lib/entitlements";

const free: PlanRow = { id: "free", active: true, monthly_ai_message_limit: 100, monthly_human_sessions: 0 };
const plus: PlanRow = { id: "plus", active: true, monthly_ai_message_limit: 500, monthly_human_sessions: 2 };
const pro: PlanRow = { id: "pro", active: true, monthly_ai_message_limit: 1000, monthly_human_sessions: 2 };
const on = { free: true, plus: true, pro: true };
const launch = { free: true, plus: false, pro: false };

describe("resolveEntitlements", () => {
  it("gives Free to a free subscriber with the configured limit", () => {
    const e = resolveEntitlements({ plan_id: "free", status: "active" }, free, free, launch);
    expect(e.plan).toBe("free");
    expect(e.monthlyAiMessageLimit).toBe(100);
    expect(e.browseProfessionals).toBe(false);
  });

  it("falls back to Free when there is no subscription", () => {
    expect(resolveEntitlements(null, null, free, launch).plan).toBe("free");
  });

  it("does not grant Plus while the Plus flag is off, even with an active row", () => {
    const e = resolveEntitlements({ plan_id: "plus", status: "active" }, plus, free, launch);
    expect(e.plan).toBe("free");
    expect(e.planNotYetAvailable).toBe(true);
    expect(e.humanSupportSessionsPerMonth).toBe(0);
    expect(e.monthlyAiMessageLimit).toBe(100);
  });

  it("does not grant Pro while the Pro flag is off", () => {
    const e = resolveEntitlements({ plan_id: "pro", status: "active" }, pro, free, launch);
    expect(e.plan).toBe("free");
    expect(e.bookAppointments).toBe(false);
  });

  it("grants Plus when flag and plan are active", () => {
    const e = resolveEntitlements({ plan_id: "plus", status: "active" }, plus, free, on);
    expect(e.plan).toBe("plus");
    expect(e.humanSupportSessionsPerMonth).toBe(2);
    expect(e.browseProfessionals).toBe(true);
  });

  it("does not grant a paid plan when the database plan row is inactive", () => {
    const e = resolveEntitlements({ plan_id: "pro", status: "active" }, { ...pro, active: false }, free, on);
    expect(e.plan).toBe("free");
  });

  it("fails closed for non-active subscriptions", () => {
    for (const status of ["past_due", "canceled", "expired"]) {
      expect(resolveEntitlements({ plan_id: "pro", status }, pro, free, on).plan).toBe("free");
    }
  });

  it("fails closed when subscription and plan rows disagree or the plan is unknown", () => {
    expect(resolveEntitlements({ plan_id: "pro", status: "active" }, plus, free, on).plan).toBe("free");
    expect(
      resolveEntitlements({ plan_id: "gold", status: "active" }, { ...pro, id: "gold" }, free, on).plan,
    ).toBe("free");
  });
});
